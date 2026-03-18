import { db } from './firebase';
import {
  collection, doc, setDoc, getDoc, getDocs,
  deleteDoc, updateDoc, query, orderBy, serverTimestamp, writeBatch
} from 'firebase/firestore';

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const ADMIN_EMAIL        = 'luckyfaizu3@gmail.com';
const PRACTICE_START_HR  = 6;
const PRACTICE_END_HR    = 23;
const RESTORE_PRICE      = 29;

export { RESTORE_PRICE, PRACTICE_START_HR, PRACTICE_END_HR, ADMIN_EMAIL };

// ─────────────────────────────────────────────────────────────────────────────
// XP SYSTEM
// ─────────────────────────────────────────────────────────────────────────────
export const XP_VALUES = {
  CORRECT_ANSWER: 10,
  PARTIAL_CORRECT: 5,
  PERFECT_DAY: 20,
  MILESTONE_DAY: 15,
  SHOW_UP: 3,
  DAILY_GOAL: 100,
};

export const XP_MULTIPLIERS = { 7: 2, 14: 3, 21: 3, 30: 5 };

export const calculateSessionXP = (score, total, dayNum) => {
  let xp = XP_VALUES.SHOW_UP;
  xp += score * XP_VALUES.CORRECT_ANSWER;
  if (score === total && total > 0) xp += XP_VALUES.PERFECT_DAY;
  if ([7, 14, 21, 30].includes(dayNum)) xp += XP_VALUES.MILESTONE_DAY;
  const multiplier = XP_MULTIPLIERS[dayNum] || 1;
  return Math.round(xp * multiplier);
};

// ─────────────────────────────────────────────────────────────────────────────
// BADGE DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────
const checkConsecutiveHigh = (days, count, threshold) => {
  let streak = 0;
  for (const d of days) {
    if ((d.pct || 0) >= threshold) { streak++; if (streak >= count) return true; }
    else streak = 0;
  }
  return false;
};

export const BADGES = [
  {
    id: 'first_timer',
    icon: '🔰',
    name: 'First Timer',
    desc: 'Completed Day 1',
    condition: (d) => d.length >= 1,
  },
  {
    id: 'python_seedling',
    icon: '🌱',
    name: 'Python Seedling',
    desc: 'Completed 3 days',
    condition: (d) => d.length >= 3,
  },
  {
    id: 'week_warrior',
    icon: '⚡',
    name: 'Week Warrior',
    desc: 'Completed 7 days',
    condition: (d) => d.length >= 7,
  },
  {
    id: 'fortnight_fire',
    icon: '🔥',
    name: 'Fortnight Fire',
    desc: 'Completed 14 days',
    condition: (d) => d.length >= 14,
  },
  {
    id: 'diamond_coder',
    icon: '💎',
    name: 'Diamond Coder',
    desc: 'Completed 21 days',
    condition: (d) => d.length >= 21,
  },
  {
    id: 'python_master',
    icon: '🏆',
    name: 'Python Master',
    desc: 'Completed all 30 days',
    condition: (d) => d.length >= 30,
  },
  {
    id: 'comeback_king',
    icon: '👑',
    name: 'Comeback King',
    desc: 'Restored streak after breaking',
    condition: (d, u) => (u?.restoreCount || 0) >= 1,
  },
  {
    id: 'flawless',
    icon: '⭐',
    name: 'Flawless',
    desc: 'Scored 15/15 in a session',
    condition: (d) => d.some(r => r.score === r.total && r.total === 15),
  },
  {
    id: 'sharpshooter',
    icon: '🎯',
    name: 'Sharpshooter',
    desc: '7 days with score above 80%',
    condition: (d) => d.filter(r => (r.pct || 0) >= 80).length >= 7,
  },
  {
    id: 'early_bird',
    icon: '🚀',
    name: 'Early Bird',
    desc: 'Practiced before 8 AM',
    condition: (d) => d.some(r => r.practiceHour !== undefined && r.practiceHour < 8),
  },
  {
    id: 'night_owl',
    icon: '🦉',
    name: 'Night Owl',
    desc: 'Practiced after 9 PM',
    condition: (d) => d.some(r => r.practiceHour !== undefined && r.practiceHour >= 21),
  },
  {
    id: 'never_give_up',
    icon: '💪',
    name: 'Never Give Up',
    desc: 'Restored streak 3 times',
    condition: (d, u) => (u?.restoreCount || 0) >= 3,
  },
  {
    id: 'ai_beater',
    icon: '🧠',
    name: 'AI Beater',
    desc: 'Scored 90%+ for 3 days in a row',
    condition: (d) => checkConsecutiveHigh(d, 3, 90),
  },
  {
    id: 'top_10',
    icon: '🌍',
    name: 'Top 10',
    desc: 'Reached leaderboard top 10',
    condition: (d, u) => (u?.bestRank || 999) <= 10,
  },
  {
    id: 'speed_demon',
    icon: '⚡',
    name: 'Speed Demon',
    desc: 'Finished practice in under 5 minutes',
    condition: (d) => d.some(r => r.durationSeconds && r.durationSeconds < 300),
  },
];

export const computeBadges = (days, userData) => {
  return BADGES.filter(b => {
    try { return b.condition(days, userData); }
    catch { return false; }
  }).map(b => b.id);
};

export const getNewBadges = (oldBadgeIds, newBadgeIds) =>
  newBadgeIds.filter(id => !oldBadgeIds.includes(id));

// ─────────────────────────────────────────────────────────────────────────────
// PRACTICE WINDOW HELPERS
// ─────────────────────────────────────────────────────────────────────────────
export const isPracticeWindowOpen = () => {
  const hr = new Date().getHours();
  return hr >= PRACTICE_START_HR && hr < PRACTICE_END_HR;
};

export const todayDateStr = () => new Date().toISOString().slice(0, 10);

export const secondsUntilOpen = () => {
  const now  = new Date();
  const next = new Date(now);
  if (now.getHours() < PRACTICE_START_HR) {
    next.setHours(PRACTICE_START_HR, 0, 0, 0);
  } else {
    next.setDate(next.getDate() + 1);
    next.setHours(PRACTICE_START_HR, 0, 0, 0);
  }
  return Math.max(0, Math.floor((next - now) / 1000));
};

export const secondsUntilClose = () => {
  const now = new Date();
  const end = new Date(now);
  end.setHours(PRACTICE_END_HR, 0, 0, 0);
  return Math.max(0, Math.floor((end - now) / 1000));
};

export const formatTime = (secs) => {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
};

// ─────────────────────────────────────────────────────────────────────────────
// STREAK STATE
// ─────────────────────────────────────────────────────────────────────────────
export const getStreakState = async (uid) => {
  try {
    const days      = await getAllDays(uid);
    const today     = todayDateStr();
    if (!days.length) return 'new';
    const last      = days[days.length - 1];
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (last.date === today)     return 'completed_today';
    if (last.date === yesterday) return 'safe';
    return 'broken';
  } catch { return 'new'; }
};

// ─────────────────────────────────────────────────────────────────────────────
// USER
// ─────────────────────────────────────────────────────────────────────────────
export const getStreakUser = async (uid) => {
  try {
    const snap = await getDoc(doc(db, 'streakUsers', uid));
    return snap.exists() ? snap.data() : null;
  } catch { return null; }
};

export const createStreakUser = async (uid, email, name, extraInfo = {}) => {
  try {
    await setDoc(doc(db, 'streakUsers', uid), {
      uid,
      email,
      name:         name || email,
      phone:        extraInfo.phone || '',
      city:         extraInfo.city  || '',
      purchased:    true,
      startDate:    todayDateStr(),
      createdAt:    serverTimestamp(),
      totalDays:    0,
      currentCycle: 1,
      restoreCount: 0,
      streakBroken: false,
      totalXP:      0,
      badges:       [],
      bestRank:     999,
    });
  } catch (e) { console.error('createStreakUser error:', e); }
};

export const updateUserProfile = async (uid, { name, phone, city }) => {
  try {
    await updateDoc(doc(db, 'streakUsers', uid), {
      name, phone, city, profileUpdatedAt: serverTimestamp(),
    });
    return true;
  } catch { return false; }
};

// ─────────────────────────────────────────────────────────────────────────────
// DAILY RESULTS — with XP + badges
// ─────────────────────────────────────────────────────────────────────────────
export const saveDay = async (uid, result) => {
  try {
    await setDoc(
      doc(db, 'streakResults', uid, 'days', result.date),
      { ...result, savedAt: serverTimestamp() }
    );

    const userRef  = doc(db, 'streakUsers', uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) return null;

    const userData   = userSnap.data();
    const allDays    = await getAllDays(uid);
    const sessionXP  = calculateSessionXP(result.score, result.total, result.day);
    const newTotalXP = (userData.totalXP || 0) + sessionXP;
    const oldBadges  = userData.badges || [];
    const newBadges  = computeBadges(allDays, { ...userData, totalDays: allDays.length });
    const earnedNew  = getNewBadges(oldBadges, newBadges);

    await updateDoc(userRef, {
      totalDays:       allDays.length,
      streakBroken:    false,
      lastActive:      todayDateStr(),
      totalXP:         newTotalXP,
      badges:          newBadges,
      lastSessionXP:   sessionXP,
      newBadgesEarned: earnedNew,
    });

    await updateLeaderboardEntry(uid, {
      ...userData,
      totalDays: allDays.length,
      totalXP:   newTotalXP,
      badges:    newBadges,
    }, allDays);

    return { sessionXP, newBadges: earnedNew, totalXP: newTotalXP };
  } catch (e) { console.error('saveDay error:', e); return null; }
};

export const getAllDays = async (uid) => {
  try {
    const snap = await getDocs(
      query(collection(db, 'streakResults', uid, 'days'), orderBy('date', 'asc'))
    );
    return snap.docs.map(d => d.data());
  } catch { return []; }
};

// ─────────────────────────────────────────────────────────────────────────────
// RANK
// ─────────────────────────────────────────────────────────────────────────────
export const getUserRank = async (uid) => {
  try {
    const lb  = await getLeaderboard();
    const idx = lb.findIndex(e => e.uid === uid);
    return idx === -1 ? null : idx + 1;
  } catch { return null; }
};

export const getUserRival = async (uid) => {
  try {
    const lb  = await getLeaderboard();
    const idx = lb.findIndex(e => e.uid === uid);
    if (idx <= 0) return null;
    return lb[idx - 1];
  } catch { return null; }
};

// ─────────────────────────────────────────────────────────────────────────────
// TOPIC MASTERY
// ─────────────────────────────────────────────────────────────────────────────
export const getTopicMastery = (days) => {
  const map = {};
  days.forEach(r => {
    if (!r.topic) return;
    if (!map[r.topic]) map[r.topic] = { score: 0, total: 0 };
    map[r.topic].score += r.score || 0;
    map[r.topic].total += r.total || 0;
  });
  return Object.entries(map).map(([topic, v]) => ({
    topic,
    mastery:  v.total ? Math.round((v.score / v.total) * 100) : 0,
    sessions: days.filter(d => d.topic === topic).length,
  })).sort((a, b) => b.mastery - a.mastery);
};

// ─────────────────────────────────────────────────────────────────────────────
// STREAK RESTORE
// ─────────────────────────────────────────────────────────────────────────────
export const restoreStreak = async (uid) => {
  try {
    const userRef = doc(db, 'streakUsers', uid);
    const snap    = await getDoc(userRef);
    if (!snap.exists()) return false;
    await updateDoc(userRef, {
      streakBroken:    false,
      streakRestored:  true,
      lastRestoreDate: todayDateStr(),
      restoreCount:    (snap.data().restoreCount || 0) + 1,
      restoredByAdmin: null,
      restoredAt:      serverTimestamp(),
    });
    return true;
  } catch (e) { console.error('restoreStreak error:', e); return false; }
};

export const adminFreeRestore = async (targetUid, adminUid) => {
  try {
    const userRef = doc(db, 'streakUsers', targetUid);
    const snap    = await getDoc(userRef);
    if (!snap.exists()) return false;
    await updateDoc(userRef, {
      streakBroken:    false,
      streakRestored:  true,
      lastRestoreDate: todayDateStr(),
      restoreCount:    (snap.data().restoreCount || 0) + 1,
      restoredByAdmin: adminUid,
      restoredAt:      serverTimestamp(),
    });
    return true;
  } catch (e) { console.error('adminFreeRestore error:', e); return false; }
};

// ─────────────────────────────────────────────────────────────────────────────
// RESET
// ─────────────────────────────────────────────────────────────────────────────
export const resetStreak = async (uid) => {
  try {
    const snap = await getDocs(collection(db, 'streakResults', uid, 'days'));
    await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));
    const userSnap = await getDoc(doc(db, 'streakUsers', uid));
    await updateDoc(doc(db, 'streakUsers', uid), {
      startDate:    todayDateStr(),
      totalDays:    0,
      currentCycle: (userSnap.data()?.currentCycle || 1) + 1,
      streakBroken: false,
      resetAt:      serverTimestamp(),
    });
  } catch (e) { console.error('resetStreak error:', e); }
};

// ─────────────────────────────────────────────────────────────────────────────
// QUESTION CACHE
// ─────────────────────────────────────────────────────────────────────────────
export const getTodayQuestions = async (dayNum) => {
  try {
    const today = todayDateStr();
    const snap  = await getDoc(doc(db, 'dailyPracticeContent', `day_${dayNum}_${today}`));
    return snap.exists() ? snap.data() : null;
  } catch { return null; }
};

export const saveTodayQuestions = async (dayNum, content, topic, level) => {
  try {
    const today     = todayDateStr();
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    try { await deleteDoc(doc(db, 'dailyPracticeContent', `day_${dayNum}_${yesterday}`)); } catch {}
    await setDoc(doc(db, 'dailyPracticeContent', `day_${dayNum}_${today}`), {
      ...content, topic, level, dayNum, date: today, generatedAt: serverTimestamp(),
    });
    return true;
  } catch (e) { console.error('saveTodayQuestions error:', e); return false; }
};

// ─────────────────────────────────────────────────────────────────────────────
// LEADERBOARD
// ─────────────────────────────────────────────────────────────────────────────
export const updateLeaderboardEntry = async (uid, userData, days) => {
  try {
    if (!userData) return;
    const allDays = days || await getAllDays(uid);
    const avgPct  = allDays.length
      ? Math.round(allDays.reduce((a, r) => a + (r.pct || 0), 0) / allDays.length)
      : 0;

    await setDoc(doc(db, 'leaderboard', uid), {
      uid,
      name:       userData.name      || 'Anonymous',
      city:       userData.city      || 'India',
      totalDays:  userData.totalDays || 0,
      avgScore:   avgPct,
      totalXP:    userData.totalXP   || 0,
      badges:     userData.badges    || [],
      lastActive: todayDateStr(),
      isReal:     true,
      updatedAt:  serverTimestamp(),
    }, { merge: true });

    // Update bestRank
    const lb  = await getLeaderboard();
    const idx = lb.findIndex(e => e.uid === uid);
    if (idx !== -1) {
      const rank = idx + 1;
      const snap = await getDoc(doc(db, 'streakUsers', uid));
      if (snap.exists() && rank < (snap.data().bestRank || 999)) {
        await updateDoc(doc(db, 'streakUsers', uid), { bestRank: rank });
      }
    }
  } catch (e) { console.error('updateLeaderboardEntry error:', e); }
};

export const getLeaderboard = async () => {
  try {
    const snap = await getDocs(collection(db, 'leaderboard'));
    const all  = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return all.sort((a, b) =>
      (b.totalDays - a.totalDays) || (b.avgScore - a.avgScore) || (b.totalXP - a.totalXP)
    );
  } catch { return []; }
};

export const seedFakeLeaderboard = async () => {
  const names = [
    'Aarav Shah','Priya Mehta','Rohit Verma','Sneha Patel','Arjun Singh',
    'Kavya Nair','Vikram Rao','Ananya Das','Harsh Gupta','Pooja Sharma',
    'Karan Joshi','Riya Agarwal','Dev Mishra','Nisha Reddy','Amit Kumar',
    'Sakshi Tiwari','Yash Malhotra','Divya Iyer','Raj Chaudhary','Simran Kaur',
    'Nikhil Pandey','Meera Pillai','Siddharth Jain','Anjali Dubey','Rahul Saxena',
    'Tanvi Kapoor','Akash Yadav','Shruti Bose','Varun Ghosh','Pallavi Desai',
    'Vivek Nambiar','Swati Banerjee','Abhinav Srivastava','Kriti Rastogi','Manish Chauhan',
    'Deepa Menon','Kartik Ahuja','Neha Shukla','Aditya Tripathi','Ruchi Goyal',
    'Sameer Dixit','Preeti Rajan','Gaurav Oberoi','Sonal Bhatt','Mohit Bajaj',
    'Ankita Dey','Rishabh Choudhary','Lavanya Suresh','Tarun Garg','Ishita Kulkarni',
    'Rajesh Nayak','Vidya Krishnan','Sourav Chatterjee','Jyoti Sahu','Pankaj Awasthi',
    'Chetna Aggarwal','Dhruv Sethi','Mona Sinha','Aakash Bhattacharya','Rekha Pillai',
    'Chirag Luthra','Bhavna Bhat','Shubham Dube','Roshni Verma','Sandeep Patil',
    'Kritika Walia','Rajat Mathur','Sunita Mukherjee','Hemant Rajput','Jyotsna Pandya',
    'Tushar Bhargava','Shweta Soni','Vishal Thakur','Nandita Roy','Raghav Anand',
    'Madhuri Pawar','Saurabh Misra','Geeta Namboodiri','Alok Trivedi','Swapna Hegde',
    'Kaushal Marwah','Bindu Varghese','Parth Ruia','Chandra Sekhar','Yamini Deshpande',
    'Praveen Goel','Archana Naik','Sunil Dalmia','Vandana Sood','Ramesh Kotak',
    'Asha Kulkarni','Sanjay Vora','Usha Bakshi','Neeraj Singhania','Meenakshi Mani',
    'Farhan Qureshi','Zoya Ahmed','Irfan Khan','Rubina Shaikh','Altaf Hussain',
    'Shabana Mirza','Salman Baig','Naila Siddiqui','Aslam Shaikh','Reshma Begum',
    'Gurpreet Singh','Harjinder Kaur','Balvinder Dhaliwal','Manjit Grewal','Navdeep Brar',
    'Parminder Sandhu','Rajwinder Gill','Sukhjeet Randhawa','Lakhwinder Sekhon','Charanjit Sodhi',
    'Binoy Thomas','Shiji Mathew','Lijo Jacob','Tessy George','Jismy Kurian',
    'Blessy Abraham','Jiby Jose','Rincy Philip','Suby Cherian','Fincy Varghese',
    'Mithun Sarkar','Papiya Mondal','Sujit Biswas','Barnali Ghosh','Debashis Pal',
    'Paramita Datta','Sandip Saha','Sumana Roy','Tapan Das','Rimpa Basu',
    'Nagesh Rao','Shobha Murthy','Jayaram Shetty','Saroja Kamath','Mohan Hegde',
    'Vimala Bhat','Suresh Prabhu','Lalitha Rao','Ravi Shankar','Kamala Devi',
  ];
  const cities = [
    'Mumbai','Delhi','Bangalore','Hyderabad','Chennai','Kolkata','Pune',
    'Ahmedabad','Jaipur','Surat','Lucknow','Kanpur','Nagpur','Indore',
    'Bhopal','Patna','Ludhiana','Agra','Nashik','Vadodara','Rajkot',
    'Meerut','Srinagar','Aurangabad','Dhanbad','Amritsar','Allahabad',
    'Ranchi','Coimbatore','Gwalior','Vijayawada','Jodhpur','Madurai',
    'Raipur','Kota','Guwahati','Chandigarh','Solapur','Hubli','Tiruchirappalli',
  ];
  const batch = writeBatch(db);
  let count   = 0;
  for (let i = 0; i < 144; i++) {
    const days     = Math.floor(Math.random() * 29) + 1;
    const avgScore = Math.floor(Math.random() * 40) + 55;
    const fakeId   = `fake_${i}_${Date.now()}`;
    batch.set(doc(db, 'leaderboard', fakeId), {
      uid: fakeId, name: names[i % names.length],
      city: cities[Math.floor(Math.random() * cities.length)],
      totalDays: days, avgScore, totalXP: days * avgScore * 2,
      badges: [], lastActive: new Date(Date.now() - Math.random() * 30 * 86400000).toISOString().slice(0,10),
      isReal: false, createdAt: serverTimestamp(),
    });
    count++;
    if (count % 400 === 0) await batch.commit();
  }
  await batch.commit();
  return true;
};

export const deleteLeaderboardEntry = async (entryId) => {
  try { await deleteDoc(doc(db, 'leaderboard', entryId)); return true; }
  catch { return false; }
};

export const editLeaderboardEntry = async (entryId, data) => {
  try {
    await updateDoc(doc(db, 'leaderboard', entryId), { ...data, updatedAt: serverTimestamp() });
    return true;
  } catch { return false; }
};

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN
// ─────────────────────────────────────────────────────────────────────────────
export const getAllStreakUsers = async () => {
  try {
    const snap = await getDocs(collection(db, 'streakUsers'));
    return snap.docs.map(d => d.data());
  } catch { return []; }
};

export const getStreakPrice = async () => {
  try {
    const snap = await getDoc(doc(db, 'streakConfig', 'settings'));
    return snap.exists() ? (snap.data().price || 99) : 99;
  } catch { return 99; }
};

export const setStreakPrice = async (price) => {
  try {
    await setDoc(doc(db, 'streakConfig', 'settings'), {
      price: parseInt(price), updatedAt: serverTimestamp(),
    }, { merge: true });
    return true;
  } catch { return false; }
};

export const getRestorePrice = async () => {
  try {
    const snap = await getDoc(doc(db, 'streakConfig', 'settings'));
    return snap.exists() ? (snap.data().restorePrice || RESTORE_PRICE) : RESTORE_PRICE;
  } catch { return RESTORE_PRICE; }
};

export const setRestorePrice = async (price) => {
  try {
    await setDoc(doc(db, 'streakConfig', 'settings'), {
      restorePrice: parseInt(price), updatedAt: serverTimestamp(),
    }, { merge: true });
    return true;
  } catch { return false; }
};