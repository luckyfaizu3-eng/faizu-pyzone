import { db } from './firebase';
import {
  collection, doc, setDoc, getDoc, getDocs,
  deleteDoc, updateDoc, query, orderBy, serverTimestamp
} from 'firebase/firestore';

// ── Collections ───────────────────────────────────────────────────────────────
// streakUsers/{uid}              → user streak info (purchased, startDate, price)
// streakResults/{uid}/days/{date} → daily results
// streakConfig/settings          → admin settings (price etc)

// ── User Streak ───────────────────────────────────────────────────────────────
export const getStreakUser = async (uid) => {
  try {
    const snap = await getDoc(doc(db, 'streakUsers', uid));
    return snap.exists() ? snap.data() : null;
  } catch { return null; }
};

export const createStreakUser = async (uid, email, name) => {
  try {
    await setDoc(doc(db, 'streakUsers', uid), {
      uid, email, name: name || email,
      purchased: true,
      startDate: new Date().toISOString().slice(0, 10),
      createdAt: serverTimestamp(),
      totalDays: 0,
      currentCycle: 1,
    });
  } catch (e) { console.error(e); }
};

// ── Daily Results ─────────────────────────────────────────────────────────────
export const saveDay = async (uid, result) => {
  try {
    await setDoc(
      doc(db, 'streakResults', uid, 'days', result.date),
      { ...result, savedAt: serverTimestamp() }
    );
    // Update totalDays count
    const userRef = doc(db, 'streakUsers', uid);
    const snap    = await getDoc(userRef);
    if (snap.exists()) {
      await updateDoc(userRef, { totalDays: (snap.data().totalDays || 0) + 1 });
    }
  } catch (e) { console.error(e); }
};

export const getAllDays = async (uid) => {
  try {
    const snap = await getDocs(
      query(collection(db, 'streakResults', uid, 'days'), orderBy('date', 'asc'))
    );
    return snap.docs.map(d => d.data());
  } catch { return []; }
};

// ── Delete after 30 days (fresh start) ───────────────────────────────────────
export const resetStreak = async (uid) => {
  try {
    // Delete all day results
    const snap = await getDocs(collection(db, 'streakResults', uid, 'days'));
    const dels = snap.docs.map(d => deleteDoc(d.ref));
    await Promise.all(dels);
    // Reset user stats but keep purchased = true
    await updateDoc(doc(db, 'streakUsers', uid), {
      startDate: new Date().toISOString().slice(0, 10),
      totalDays: 0,
      currentCycle: (await getDoc(doc(db, 'streakUsers', uid))).data()?.currentCycle + 1 || 2,
      resetAt: serverTimestamp(),
    });
  } catch (e) { console.error(e); }
};

// ── Admin: get all streak users ───────────────────────────────────────────────
export const getAllStreakUsers = async () => {
  try {
    const snap = await getDocs(collection(db, 'streakUsers'));
    return snap.docs.map(d => d.data());
  } catch { return []; }
};

// ── Admin: get price ──────────────────────────────────────────────────────────
export const getStreakPrice = async () => {
  try {
    const snap = await getDoc(doc(db, 'streakConfig', 'settings'));
    return snap.exists() ? (snap.data().price || 99) : 99;
  } catch { return 99; }
};

export const setStreakPrice = async (price) => {
  try {
    await setDoc(doc(db, 'streakConfig', 'settings'), {
      price: parseInt(price),
      updatedAt: serverTimestamp(),
    }, { merge: true });
    return true;
  } catch { return false; }
};