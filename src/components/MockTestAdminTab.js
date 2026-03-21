// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import {
  collection, collectionGroup, getDocs, doc, getDoc, setDoc
} from 'firebase/firestore';
import { saveCertificatePayment } from '../services/mockTestService';
import { Users, Award, DollarSign, RefreshCw, Unlock, Search, ChevronDown, ChevronUp, TrendingUp, Clock, Shield, Trash2, Lock } from 'lucide-react';

const ADMIN_EMAIL = 'luckyfaizu3@gmail.com';

// ── helpers ──────────────────────────────────────────────────
function fmt(ms) {
  const n = Number(ms);
  if (!ms || isNaN(n) || n <= 0) return '—';
  const s = Math.floor(n / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

function StatCard({ icon, label, value, sub, color, isDark }) {
  return (
    <div style={{ background: isDark ? '#1e293b' : '#fff', borderRadius: 16, padding: '1.25rem 1.5rem', border: `1.5px solid ${color}33`, boxShadow: `0 4px 20px ${color}18`, display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <div style={{ width: 48, height: 48, borderRadius: 12, background: `${color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {React.cloneElement(icon, { size: 22, color })}
      </div>
      <div>
        <div style={{ fontSize: '1.6rem', fontWeight: 900, color: isDark ? '#e2e8f0' : '#1e293b', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: '0.78rem', color: isDark ? '#64748b' : '#94a3b8', fontWeight: 600, marginTop: 2 }}>{label}</div>
        {sub && <div style={{ fontSize: '0.72rem', color, fontWeight: 700, marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

export default function MockTestAdminTab({ isDark }) {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [certPrice, setCertPrice] = useState(29);
  const [newPrice, setNewPrice] = useState('');
  const [savingPrice, setSavingPrice] = useState(false);
  const [passPercent, setPassPercent] = useState(55);
  const [newPassPercent, setNewPassPercent] = useState('55');
  const [savingPass, setSavingPass] = useState(false);
  const [search, setSearch] = useState('');
  const [expandedUser, setExpandedUser] = useState(null);
  const [unlocking, setUnlocking] = useState(null);
  const [unlockEmail, setUnlockEmail] = useState('');
  const [unlockLoading, setUnlockLoading] = useState(false);
  const [deletingUser, setDeletingUser] = useState(null); // uid being deleted
  const [confirmDelete, setConfirmDelete] = useState(null); // uid to confirm
  const [revenue, setRevenue] = useState({ total: 0, certPayments: 0, testPayments: 0, count: 0 });
  const [refreshing, setRefreshing] = useState(false);

  // ── Lock Manager state ────────────────────────────────────
  const [adminTab, setAdminTab] = useState('users');
  const [lockSearch, setLockSearch] = useState('');
  const [lockTab, setLockTab] = useState('locked');
  const [lockActionLoading, setLockActionLoading] = useState(null);
  const [extendDays, setExtendDays] = useState({});
  const [lockUsers, setLockUsers] = useState([]);

  useEffect(() => {
    const now = new Date();
    const result = [];
    for (const u of users) {
      for (const tp of u.testPays) {
        if (!tp.level || tp.level === 'basic') continue;
        const lockEndsAt = tp.lockEndsAt ? new Date(tp.lockEndsAt) : null;
        const isLocked = !!(lockEndsAt && now < lockEndsAt);
        const timeRemaining = lockEndsAt ? lockEndsAt - now : 0;
        result.push({
          uid: u.uid, name: u.name, email: u.email,
          level: tp.level,
          lockEndsAt: tp.lockEndsAt || null,
          lockStartsAt: tp.lockStartsAt || null,
          isLocked, timeRemaining,
          hasPaid: tp.hasPaid || false,
          testSubmittedAt: tp.testSubmittedAt || null,
        });
      }
    }
    result.sort((a, b) => (b.timeRemaining || 0) - (a.timeRemaining || 0));
    setLockUsers(result);
  }, [users]);

  // ── Load all data ──────────────────────────────────────────
  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Load cert price
      const priceSnap = await getDoc(doc(db, 'settings', 'certPrices'));
      const p = priceSnap.exists() ? (priceSnap.data().basic || 29) : 29;
      setCertPrice(p);
      setNewPrice(String(p));

      // 1b. Load pass percentage
      const testSettingsSnap = await getDoc(doc(db, 'settings', 'testSettings'));
      const pp = testSettingsSnap.exists() ? (testSettingsSnap.data().passPercent || 55) : 55;
      setPassPercent(pp);
      setNewPassPercent(String(pp));

      // 2. Use collectionGroup to fetch ONLY users who have taken tests
      //    Fetch from both 'mockTests' and 'mockTestResults' subcollections
      const userMap = {};

      const addTestDocs = (snap) => {
        for (const testDoc of snap.docs) {
          const uid = testDoc.ref.parent.parent.id;
          if (!uid) continue;
          const testData = { id: testDoc.id, ...testDoc.data() };
          if (!userMap[uid]) {
            userMap[uid] = { uid, tests: [], certs: [], certPays: [], testPays: [], profileLoaded: false };
          }
          // avoid duplicates
          if (!userMap[uid].tests.find(t => t.id === testData.id)) {
            userMap[uid].tests.push(testData);
          }
        }
      };

      const [mockTestsSnap, mockTestResultsSnap] = await Promise.all([
        getDocs(collectionGroup(db, 'mockTests')),
        getDocs(collectionGroup(db, 'mockTestResults')),
      ]);

      addTestDocs(mockTestsSnap);
      addTestDocs(mockTestResultsSnap);

      console.log(`[Admin] mockTests: ${mockTestsSnap.docs.length} | mockTestResults: ${mockTestResultsSnap.docs.length} | Unique test-takers: ${Object.keys(userMap).length}`);

      // Now fetch profile + subcollections only for users who have tests
      await Promise.all(Object.keys(userMap).map(async (uid) => {
        const entry = userMap[uid];

        // Sort tests newest first
        entry.tests.sort((a, b) => (b.timestamp?.toMillis?.() || 0) - (a.timestamp?.toMillis?.() || 0));
        const latest = entry.tests[0];

        // Fetch profile doc, certs, payments in parallel
        const [profileSnap, certsSnap, certPaySnap, testPaySnap] = await Promise.all([
          getDoc(doc(db, 'users', uid)),
          getDocs(collection(db, 'users', uid, 'certificates')),
          getDocs(collection(db, 'users', uid, 'certificatePayments')),
          getDocs(collection(db, 'users', uid, 'mockTestPayments')),
        ]);

        const profileData = profileSnap.exists() ? profileSnap.data() : {};
        entry.certs    = certsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        entry.certPays = certPaySnap.docs.map(d => ({ level: d.id, ...d.data() }));
        entry.testPays = testPaySnap.docs.map(d => ({ level: d.id, ...d.data() }));

        // Resolve name & email: profile doc first, then test studentInfo
        entry.name =
          profileData?.displayName ||
          profileData?.fullName ||
          profileData?.name ||
          latest?.studentInfo?.fullName ||
          latest?.studentInfo?.name ||
          'Unknown';
        entry.email =
          profileData?.email ||
          latest?.studentInfo?.email ||
          latest?.userEmail ||
          '—';

        entry.latestScore = latest?.score;
        entry.latestLevel = latest?.level;
        entry.latestTime  = latest?.timeTaken;
        entry.latestDate  = latest?.testDate || latest?.date;
        entry.totalTests  = entry.tests.length;

        console.log(`[Admin] UID: ${uid} | name: "${entry.name}" | email: "${entry.email}" | tests: ${entry.totalTests} | profileExists: ${profileSnap.exists()}`);
      }));

      setUsers(Object.values(userMap).sort((a, b) => b.tests[0]?.timestamp?.toMillis?.() - a.tests[0]?.timestamp?.toMillis?.() || 0));

      // 3. Revenue
      let totalRev = 0, certRev = 0, testRev = 0, cnt = 0;
      for (const u of Object.values(userMap)) {
        for (const cp of u.certPays) {
          const amt = Number(cp.amount || 0);
          if (amt > 0) { certRev += amt; totalRev += amt; cnt++; }
        }
        for (const tp of u.testPays) {
          const amt = Number(tp.amount || tp.paidAmount || 0);
          if (amt > 0) { testRev += amt; totalRev += amt; cnt++; }
        }
      }
      setRevenue({ total: totalRev, certPayments: certRev, testPayments: testRev, count: cnt });

    } catch (err) {
      console.error('Admin load error:', err);
      window.showToast?.('❌ Failed to load admin data', 'error');
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
    window.showToast?.('✅ Data refreshed!', 'success');
  };

  // ── Save cert price ────────────────────────────────────────
  const handleSavePrice = async () => {
    const parsed = parseInt(newPrice);
    if (isNaN(parsed) || parsed < 0) { window.showToast?.('❌ Please enter a valid price', 'error'); return; }
    setSavingPrice(true);
    try {
      await setDoc(doc(db, 'settings', 'certPrices'), { basic: parsed }, { merge: true });
      setCertPrice(parsed);
      window.showToast?.(`✅ Basic certificate price updated to ₹${parsed}`, 'success');
    } catch { window.showToast?.('❌ Price update failed', 'error'); }
    setSavingPrice(false);
  };

  const handleSavePass = async () => {
    const parsed = parseInt(newPassPercent);
    if (isNaN(parsed) || parsed < 1 || parsed > 100) { window.showToast?.('❌ Please enter a value between 1 and 100', 'error'); return; }
    setSavingPass(true);
    try {
      await setDoc(doc(db, 'settings', 'testSettings'), { passPercent: parsed }, { merge: true });
      setPassPercent(parsed);
      window.showToast?.(`✅ Pass percentage updated to ${parsed}%`, 'success');
    } catch { window.showToast?.('❌ Update failed', 'error'); }
    setSavingPass(false);
  };

  // ── Free unlock for a user ────────────────────────────────
  const handleFreeUnlock = async (uid, email, level = 'basic') => {
    setUnlocking(uid);
    try {
      const result = await saveCertificatePayment(uid, level, {
        paymentId: 'ADMIN_FREE_UNLOCK',
        amount: 0,
        unlockedBy: ADMIN_EMAIL,
        unlockedAt: new Date().toISOString(),
      });
      if (result.success) {
        window.showToast?.(`✅ Certificate unlocked for ${email}!`, 'success');
        await loadAll();
      } else { window.showToast?.('❌ Unlock failed', 'error'); }
    } catch { window.showToast?.('❌ Error unlocking', 'error'); }
    setUnlocking(null);
  };

  // ── Unlock by email input ──────────────────────────────────
  const handleUnlockByEmail = async () => {
    if (!unlockEmail.trim()) { window.showToast?.('⚠️ Please enter an email', 'warning'); return; }
    setUnlockLoading(true);
    try {
      const found = users.find(u => u.email.toLowerCase() === unlockEmail.trim().toLowerCase());
      if (!found) { window.showToast?.('❌ User not found — have they taken a test?', 'error'); setUnlockLoading(false); return; }
      await handleFreeUnlock(found.uid, found.email, 'basic');
      setUnlockEmail('');
    } catch { window.showToast?.('❌ Error', 'error'); }
    setUnlockLoading(false);
  };

  // ── Delete all test data for a user ───────────────────────
  const handleDeleteUser = async (uid) => {
    setDeletingUser(uid);
    try {
      const { deleteDoc } = await import('firebase/firestore');
      const subcollections = ['mockTests', 'certificates', 'certificatePayments', 'mockTestPayments'];
      for (const sub of subcollections) {
        const snap = await getDocs(collection(db, 'users', uid, sub));
        await Promise.all(snap.docs.map(d => deleteDoc(d.ref)));
      }
      setUsers(prev => prev.filter(u => u.uid !== uid));
      setConfirmDelete(null);
      window.showToast?.('✅ User test data deleted successfully', 'success');
    } catch (err) {
      console.error(err);
      window.showToast?.('❌ Delete failed', 'error');
    }
    setDeletingUser(null);
  };

  // ── Lock Manager actions ──────────────────────────────────
  const fmtLockTime = (ms) => {
    if (!ms || ms <= 0) return 'Expired';
    const totalSecs = Math.floor(ms / 1000);
    const d = Math.floor(totalSecs / 86400);
    const h = Math.floor((totalSecs % 86400) / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const handleUnlockLock = async (uid, level) => {
    const key = `${uid}_${level}`;
    setLockActionLoading(key);
    try {
      const { updateDoc } = await import('firebase/firestore');
      await updateDoc(doc(db, 'users', uid, 'mockTestPayments', level), {
        lockEndsAt: null, lockStartsAt: null,
      });
      window.showToast?.(`✅ Lock removed for ${level} test`, 'success');
      await loadAll();
    } catch { window.showToast?.('❌ Unlock failed', 'error'); }
    setLockActionLoading(null);
  };

  const handleExtendLock = async (uid, level, currentLockEndsAt) => {
    const key = `${uid}_${level}`;
    const days = parseInt(extendDays[key] || '0');
    if (!days || days <= 0) { window.showToast?.('❌ Enter valid days to extend', 'error'); return; }
    setLockActionLoading(key + '_extend');
    try {
      const { updateDoc } = await import('firebase/firestore');
      const base = currentLockEndsAt ? new Date(currentLockEndsAt) : new Date();
      const newEnd = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);
      await updateDoc(doc(db, 'users', uid, 'mockTestPayments', level), {
        lockEndsAt: newEnd.toISOString(),
      });
      window.showToast?.(`✅ Lock extended by ${days} day(s)`, 'success');
      setExtendDays(prev => ({ ...prev, [key]: '' }));
      await loadAll();
    } catch { window.showToast?.('❌ Extend failed', 'error'); }
    setLockActionLoading(null);
  };

  const handleCompleteLock = async (uid, level) => {
    const key = `${uid}_${level}`;
    setLockActionLoading(key + '_complete');
    try {
      const { updateDoc } = await import('firebase/firestore');
      const now = new Date();
      const lockEndsAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      await updateDoc(doc(db, 'users', uid, 'mockTestPayments', level), {
        lockStartsAt: now.toISOString(),
        lockEndsAt: lockEndsAt.toISOString(),
        testSubmittedAt: now.toISOString(),
      });
      window.showToast?.(`✅ Full 7-day lock applied for ${level}`, 'success');
      await loadAll();
    } catch { window.showToast?.('❌ Lock failed', 'error'); }
    setLockActionLoading(null);
  };

  // ── Filter users ──────────────────────────────────────────
  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const card = (children, extra = {}) => ({
    background: isDark ? '#1e293b' : '#fff',
    borderRadius: 20,
    padding: '1.5rem',
    border: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : '#e2e8f0'}`,
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    ...extra
  });

  const label = { fontSize: '0.78rem', fontWeight: 700, color: isDark ? '#64748b' : '#94a3b8', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 };
  const input = { width: '100%', padding: '0.75rem 1rem', background: isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc', border: `2px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}`, borderRadius: 12, color: isDark ? '#e2e8f0' : '#1e293b', fontSize: '0.95rem', fontWeight: 600, outline: 'none', boxSizing: 'border-box' };
  const btn = (bg, disabled) => ({ padding: '0.75rem 1.5rem', background: disabled ? '#334155' : bg, border: 'none', borderRadius: 12, color: disabled ? '#64748b' : '#fff', fontWeight: 800, cursor: disabled ? 'not-allowed' : 'pointer', fontSize: '0.88rem', whiteSpace: 'nowrap', opacity: disabled ? 0.7 : 1, transition: 'all 0.2s' });

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 300 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, border: '3px solid #6366f1', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }}/>
        <p style={{ color: isDark ? '#64748b' : '#94a3b8', fontSize: '0.9rem' }}>Loading admin data...</p>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'fadeInUp 0.4s ease' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: 42, height: 42, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={22} color="#fff"/>
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 900, color: isDark ? '#e2e8f0' : '#1e293b' }}>Admin Control Panel</h2>
            <p style={{ margin: 0, fontSize: '0.78rem', color: isDark ? '#64748b' : '#94a3b8' }}>Mock Test — Full Management</p>
          </div>
        </div>
        <button onClick={handleRefresh} disabled={refreshing} style={btn('linear-gradient(135deg,#6366f1,#8b5cf6)', refreshing)}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <RefreshCw size={15} style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }}/> Refresh
          </span>
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        <StatCard icon={<Users/>} label="Total Test Takers" value={users.length} color="#6366f1" isDark={isDark}/>
        <StatCard icon={<Award/>} label="Certificates Issued" value={users.reduce((s,u)=>s+u.certs.length,0)} color="#10b981" isDark={isDark}/>
        <StatCard icon={<DollarSign/>} label="Total Revenue" value={`₹${revenue.total}`} sub={`${revenue.count} payments`} color="#f59e0b" isDark={isDark}/>
        <StatCard icon={<TrendingUp/>} label="Test Revenue" value={`₹${revenue.testPayments}`} sub="Advanced + Pro" color="#8b5cf6" isDark={isDark}/>
        <StatCard icon={<Award/>} label="Cert Revenue" value={`₹${revenue.certPayments}`} sub="Basic certificates" color="#ec4899" isDark={isDark}/>
      </div>

      {/* ── Admin Sub-Tabs ── */}
      <div style={{ display: 'flex', gap: '0.4rem', background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', borderRadius: 14, padding: 4, border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)'}`, width: 'fit-content' }}>
        {[
          { key: 'users',   icon: '👥', label: 'Users' },
          { key: 'locks',   icon: '🔒', label: `Locks ${lockUsers.filter(l=>l.isLocked).length > 0 ? `(${lockUsers.filter(l=>l.isLocked).length})` : ''}` },
          { key: 'revenue', icon: '💰', label: 'Revenue' },
        ].map(t => (
          <button key={t.key} onClick={() => setAdminTab(t.key)}
            style={{ padding: '0.5rem 1.1rem', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem', transition: 'all 0.2s', whiteSpace: 'nowrap',
              background: adminTab === t.key ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'transparent',
              color: adminTab === t.key ? '#fff' : isDark ? '#94a3b8' : '#64748b',
              boxShadow: adminTab === t.key ? '0 3px 10px rgba(99,102,241,0.3)' : 'none' }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ══ USERS TAB ══ */}
      {adminTab === 'users' && (<>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>

        {/* Certificate Price */}
        <div style={card()}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <DollarSign size={18} color="#f59e0b"/>
            <span style={{ fontWeight: 800, color: isDark ? '#e2e8f0' : '#1e293b', fontSize: '0.95rem' }}>Basic Certificate Price</span>
          </div>
          <p style={{ ...label, marginBottom: 8 }}>Current: ₹{certPrice}</p>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input type="number" min="0" value={newPrice} onChange={e => setNewPrice(e.target.value)}
              placeholder="New price..." style={{ ...input, flex: 1 }}/>
            <button onClick={handleSavePrice} disabled={savingPrice} style={btn('linear-gradient(135deg,#f59e0b,#d97706)', savingPrice)}>
              {savingPrice ? '⏳' : '✅ Save'}
            </button>
          </div>
          <p style={{ margin: '0.6rem 0 0', fontSize: '0.75rem', color: isDark ? '#475569' : '#94a3b8' }}>
            Set to 0 for free certificate download
          </p>
        </div>

        {/* Pass Percentage */}
        <div style={card()}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <TrendingUp size={18} color="#6366f1"/>
            <span style={{ fontWeight: 800, color: isDark ? '#e2e8f0' : '#1e293b', fontSize: '0.95rem' }}>Pass Percentage</span>
          </div>
          <p style={{ ...label, marginBottom: 8 }}>Current: {passPercent}% — students above this score will receive a certificate</p>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input type="number" min="1" max="100" value={newPassPercent} onChange={e => setNewPassPercent(e.target.value)}
              placeholder="e.g. 55" style={{ ...input, flex: 1 }}/>
            <button onClick={handleSavePass} disabled={savingPass} style={btn('linear-gradient(135deg,#6366f1,#8b5cf6)', savingPass)}>
              {savingPass ? '⏳' : '✅ Save'}
            </button>
          </div>
          <p style={{ margin: '0.6rem 0 0', fontSize: '0.75rem', color: isDark ? '#475569' : '#94a3b8' }}>
            Default 55% — any value between 1 and 100
          </p>
        </div>

        {/* Unlock by email */}
        <div style={card()}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Unlock size={18} color="#10b981"/>
            <span style={{ fontWeight: 800, color: isDark ? '#e2e8f0' : '#1e293b', fontSize: '0.95rem' }}>Free Certificate Unlock</span>
          </div>
          <p style={{ ...label, marginBottom: 8 }}>Enter user email</p>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input type="email" value={unlockEmail} onChange={e => setUnlockEmail(e.target.value)}
              placeholder="user@email.com" style={{ ...input, flex: 1 }}
              onKeyDown={e => e.key === 'Enter' && handleUnlockByEmail()}/>
            <button onClick={handleUnlockByEmail} disabled={unlockLoading || !unlockEmail.trim()} style={btn('linear-gradient(135deg,#10b981,#059669)', unlockLoading || !unlockEmail.trim())}>
              {unlockLoading ? '⏳' : '🔓 Unlock'}
            </button>
          </div>
          <p style={{ margin: '0.6rem 0 0', fontSize: '0.75rem', color: isDark ? '#475569' : '#94a3b8' }}>
            User will be able to download the basic certificate for free
          </p>
        </div>
      </div>

      {/* Users Table */}
      <div style={card()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={18} color="#6366f1"/>
            <span style={{ fontWeight: 800, color: isDark ? '#e2e8f0' : '#1e293b', fontSize: '0.95rem' }}>All Test Takers ({filtered.length})</span>
          </div>
          <div style={{ position: 'relative' }}>
            <Search size={14} color="#64748b" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}/>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name / email..."
              style={{ ...input, width: 220, paddingLeft: 32, fontSize: '0.85rem' }}/>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: isDark ? '#475569' : '#94a3b8' }}>
            {search ? '❌ No users found' : '📭 No test submissions yet'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {filtered.map(u => {
              const isExpanded = expandedUser === u.uid;
              const hasCertPaid = u.certPays.some(cp => cp.hasPaid && cp.level === 'basic');
              const hasCert = u.certs.some(c => (c.level || c.id) === 'basic');
              const isBeingUnlocked = unlocking === u.uid;

              return (
                <div key={u.uid} style={{ background: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc', borderRadius: 14, border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0'}`, overflow: 'hidden' }}>
                  {/* Row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.9rem 1rem', flexWrap: 'wrap', cursor: 'pointer' }}
                    onClick={() => setExpandedUser(isExpanded ? null : u.uid)}>

                    {/* Avatar */}
                    <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '0.9rem', flexShrink: 0 }}>
                      {(u.name[0] || '?').toUpperCase()}
                    </div>

                    {/* Name + email */}
                    <div style={{ flex: '1 1 160px', minWidth: 0 }}>
                      <div style={{ fontWeight: 700, color: isDark ? '#e2e8f0' : '#1e293b', fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</div>
                      <div style={{ fontSize: '0.75rem', color: isDark ? '#64748b' : '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
                    </div>

                    {/* Latest score */}
                    <div style={{ textAlign: 'center', minWidth: 60 }}>
                      <div style={{ fontSize: '1.1rem', fontWeight: 900, color: u.latestScore >= 55 ? '#10b981' : '#ef4444' }}>{u.latestScore ?? '—'}%</div>
                      <div style={{ fontSize: '0.65rem', color: isDark ? '#475569' : '#94a3b8', fontWeight: 600 }}>{(u.latestLevel || '').toUpperCase()}</div>
                    </div>

                    {/* Time taken */}
                    <div style={{ textAlign: 'center', minWidth: 70 }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: isDark ? '#cbd5e1' : '#475569', display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Clock size={12} color="#64748b"/>{fmt(u.latestTime)}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: isDark ? '#475569' : '#94a3b8' }}>{u.latestDate || '—'}</div>
                    </div>

                    {/* Tests count */}
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#6366f1', background: 'rgba(99,102,241,0.1)', padding: '0.25rem 0.6rem', borderRadius: 20, whiteSpace: 'nowrap' }}>
                      {u.totalTests} test{u.totalTests !== 1 ? 's' : ''}
                    </div>

                    {/* Cert status */}
                    {hasCert && (
                      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: hasCertPaid ? '#10b981' : '#f59e0b', background: hasCertPaid ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', padding: '0.25rem 0.6rem', borderRadius: 20, whiteSpace: 'nowrap' }}>
                        {hasCertPaid ? '✅ Cert Paid' : '🏆 Cert Free'}
                      </div>
                    )}

                    {/* Quick unlock */}
                    {hasCert && !hasCertPaid && (
                      <button onClick={e => { e.stopPropagation(); handleFreeUnlock(u.uid, u.email, 'basic'); }}
                        disabled={isBeingUnlocked}
                        style={{ padding: '0.35rem 0.75rem', background: isBeingUnlocked ? '#334155' : 'linear-gradient(135deg,#10b981,#059669)', border: 'none', borderRadius: 20, color: '#fff', fontSize: '0.72rem', fontWeight: 700, cursor: isBeingUnlocked ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}>
                        {isBeingUnlocked ? '⏳' : '🔓 Unlock Free'}
                      </button>
                    )}

                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      {/* Delete button — inline confirm */}
                      {confirmDelete === u.uid ? (
                        <>
                          <span style={{ fontSize: '0.72rem', color: isDark ? '#94a3b8' : '#64748b', fontWeight: 600 }}>Sure?</span>
                          <button onClick={e => { e.stopPropagation(); handleDeleteUser(u.uid); }}
                            disabled={deletingUser === u.uid}
                            style={{ padding: '0.3rem 0.65rem', background: 'linear-gradient(135deg,#ef4444,#dc2626)', border: 'none', borderRadius: 8, color: '#fff', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                            {deletingUser === u.uid ? '⏳' : '✅ Yes'}
                          </button>
                          <button onClick={e => { e.stopPropagation(); setConfirmDelete(null); }}
                            style={{ padding: '0.3rem 0.65rem', background: isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0', border: 'none', borderRadius: 8, color: isDark ? '#94a3b8' : '#64748b', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer' }}>
                            ✕
                          </button>
                        </>
                      ) : (
                        <button onClick={e => { e.stopPropagation(); setConfirmDelete(u.uid); }}
                          style={{ padding: '0.3rem 0.5rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                          <Trash2 size={14}/>
                        </button>
                      )}
                      <div style={{ color: isDark ? '#475569' : '#94a3b8' }}>
                        {isExpanded ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                      </div>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div style={{ borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0'}`, padding: '1rem', background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(99,102,241,0.02)' }}>

                      {/* All tests */}
                      <div style={{ marginBottom: '1rem' }}>
                        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: isDark ? '#64748b' : '#94a3b8', letterSpacing: 1, marginBottom: 8 }}>ALL TESTS</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                          {u.tests.map((t, i) => (
                            <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.75rem', background: isDark ? 'rgba(255,255,255,0.03)' : '#fff', borderRadius: 10, flexWrap: 'wrap', fontSize: '0.82rem' }}>
                              <span style={{ fontWeight: 700, color: isDark ? '#94a3b8' : '#64748b', minWidth: 20 }}>#{i+1}</span>
                              <span style={{ fontWeight: 700, color: t.passed ? '#10b981' : '#ef4444' }}>{t.score ?? '—'}%</span>
                              <span style={{ color: isDark ? '#cbd5e1' : '#475569', fontWeight: 600 }}>{(t.level || '').toUpperCase()}</span>
                              <span style={{ color: isDark ? '#475569' : '#94a3b8', display: 'flex', alignItems: 'center', gap: 3 }}><Clock size={11}/>{fmt(t.timeTaken)}</span>
                              <span style={{ color: isDark ? '#475569' : '#94a3b8' }}>{t.testDate || t.date || '—'}</span>
                              <span style={{ marginLeft: 'auto', fontSize: '0.7rem', fontWeight: 700, color: t.passed ? '#10b981' : '#ef4444', background: t.passed ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', padding: '0.15rem 0.5rem', borderRadius: 20 }}>
                                {t.passed ? '✅ PASS' : '❌ FAIL'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Certificates */}
                      {u.certs.length > 0 && (
                        <div>
                          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: isDark ? '#64748b' : '#94a3b8', letterSpacing: 1, marginBottom: 8 }}>CERTIFICATES</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                            {u.certs.map(c => {
                              const isPaid = u.certPays.some(cp => cp.level === (c.level || c.id?.split('_')[0]) && cp.hasPaid);
                              const certLevel = c.level || c.id?.split('_')[0] || 'basic';
                              return (
                                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.75rem', background: isDark ? 'rgba(255,255,255,0.03)' : '#fff', borderRadius: 10, flexWrap: 'wrap', fontSize: '0.82rem' }}>
                                  <span style={{ fontWeight: 700, color: '#f59e0b' }}>🏆 {certLevel.toUpperCase()}</span>
                                  <span style={{ color: isDark ? '#cbd5e1' : '#475569' }}>{c.score}%</span>
                                  <span style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: isDark ? '#475569' : '#94a3b8' }}>{c.certificateId}</span>
                                  <span style={{ marginLeft: 'auto', fontSize: '0.7rem', fontWeight: 700, color: isPaid ? '#10b981' : '#f59e0b', background: isPaid ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', padding: '0.15rem 0.5rem', borderRadius: 20 }}>
                                    {isPaid ? '💳 Paid' : '🆓 Free/Locked'}
                                  </span>
                                  {!isPaid && certLevel === 'basic' && (
                                    <button onClick={() => handleFreeUnlock(u.uid, u.email, certLevel)}
                                      disabled={unlocking === u.uid}
                                      style={{ padding: '0.25rem 0.6rem', background: 'linear-gradient(135deg,#10b981,#059669)', border: 'none', borderRadius: 20, color: '#fff', fontSize: '0.68rem', fontWeight: 700, cursor: 'pointer' }}>
                                      🔓 Unlock Free
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      </>)}

      {/* ══ REVENUE TAB ══ */}
      {adminTab === 'revenue' && (
      <div style={card()}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <DollarSign size={18} color="#f59e0b"/>
          <span style={{ fontWeight: 800, color: isDark ? '#e2e8f0' : '#1e293b', fontSize: '0.95rem' }}>Revenue Breakdown</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem' }}>
          {[
            { label: 'Total Revenue', value: `₹${revenue.total}`, color: '#6366f1' },
            { label: 'Test Payments', value: `₹${revenue.testPayments}`, color: '#8b5cf6' },
            { label: 'Certificate Downloads', value: `₹${revenue.certPayments}`, color: '#ec4899' },
            { label: 'Total Transactions', value: revenue.count, color: '#f59e0b' },
          ].map((item, i) => (
            <div key={i} style={{ padding: '1rem', background: isDark ? `rgba(255,255,255,0.03)` : '#f8fafc', borderRadius: 12, border: `1px solid ${item.color}22` }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: item.color }}>{item.value}</div>
              <div style={{ fontSize: '0.75rem', color: isDark ? '#64748b' : '#94a3b8', fontWeight: 600, marginTop: 2 }}>{item.label}</div>
            </div>
          ))}
        </div>
      </div>
      )}

      {/* ══ LOCKS TAB ══ */}
      {adminTab === 'locks' && (
      <div style={card()}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#ef4444,#dc2626)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Lock size={18} color="#fff"/>
            </div>
            <div>
              <div style={{ fontWeight: 900, color: isDark ? '#e2e8f0' : '#1e293b', fontSize: '0.95rem' }}>Test Lock Manager</div>
              <div style={{ fontSize: '0.72rem', color: isDark ? '#64748b' : '#94a3b8' }}>Advanced & Pro test locks — unlock, extend, or force lock</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <span style={{ padding: '0.3rem 0.75rem', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, color: '#ef4444' }}>
              🔒 {lockUsers.filter(l => l.isLocked).length} Locked
            </span>
            <span style={{ padding: '0.3rem 0.75rem', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, color: '#10b981' }}>
              🔓 {lockUsers.filter(l => !l.isLocked).length} Unlocked
            </span>
          </div>
        </div>

        {/* Search + Tab switcher row */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
            <Search size={14} color="#64748b" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}/>
            <input value={lockSearch} onChange={e => setLockSearch(e.target.value)}
              placeholder="Search name / email..."
              style={{ ...input, paddingLeft: 32, fontSize: '0.85rem' }}/>
          </div>
          <div style={{ display: 'flex', gap: '0.4rem', background: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9', borderRadius: 12, padding: 4 }}>
            {[{ key: 'locked', label: '🔒 Locked' }, { key: 'unlocked', label: '🔓 Unlocked' }].map(t => (
              <button key={t.key} onClick={() => setLockTab(t.key)}
                style={{ padding: '0.5rem 1.1rem', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.82rem', transition: 'all 0.2s',
                  background: lockTab === t.key ? (t.key === 'locked' ? 'linear-gradient(135deg,#ef4444,#dc2626)' : 'linear-gradient(135deg,#10b981,#059669)') : 'transparent',
                  color: lockTab === t.key ? '#fff' : isDark ? '#94a3b8' : '#64748b',
                  boxShadow: lockTab === t.key ? '0 3px 10px rgba(0,0,0,0.2)' : 'none' }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Lock list */}
        {(() => {
          const filteredLocks = lockUsers
            .filter(l => lockTab === 'locked' ? l.isLocked : !l.isLocked)
            .filter(l => !lockSearch.trim() || l.name.toLowerCase().includes(lockSearch.toLowerCase()) || l.email.toLowerCase().includes(lockSearch.toLowerCase()));
          if (filteredLocks.length === 0) return (
            <div style={{ textAlign: 'center', padding: '2rem', color: isDark ? '#475569' : '#94a3b8', fontSize: '0.9rem' }}>
              {lockSearch ? '❌ No users found' : lockTab === 'locked' ? '✅ No users are currently locked' : '📭 No unlocked paid test users'}
            </div>
          );
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {filteredLocks.map(lu => {
                const key = `${lu.uid}_${lu.level}`;
                const isActing = lockActionLoading === key || lockActionLoading === key + '_extend' || lockActionLoading === key + '_complete';
                return (
                  <div key={key} style={{ background: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc', borderRadius: 14, border: `1.5px solid ${lu.isLocked ? 'rgba(239,68,68,0.25)' : 'rgba(16,185,129,0.25)'}`, padding: '1rem 1.1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.85rem', flexWrap: 'wrap' }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: lu.isLocked ? 'linear-gradient(135deg,#ef4444,#dc2626)' : 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: '0.9rem', flexShrink: 0 }}>
                        {(lu.name[0] || '?').toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, color: isDark ? '#e2e8f0' : '#1e293b', fontSize: '0.88rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lu.name}</div>
                        <div style={{ fontSize: '0.72rem', color: isDark ? '#64748b' : '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lu.email}</div>
                      </div>
                      <span style={{ padding: '0.25rem 0.65rem', background: lu.level === 'pro' ? 'rgba(245,158,11,0.15)' : 'rgba(99,102,241,0.12)', border: `1px solid ${lu.level === 'pro' ? 'rgba(245,158,11,0.4)' : 'rgba(99,102,241,0.3)'}`, borderRadius: 20, fontSize: '0.7rem', fontWeight: 800, color: lu.level === 'pro' ? '#f59e0b' : '#6366f1', textTransform: 'uppercase' }}>
                        {lu.level}
                      </span>
                      {lu.isLocked
                        ? <span style={{ padding: '0.25rem 0.65rem', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)', borderRadius: 20, fontSize: '0.7rem', fontWeight: 800, color: '#ef4444' }}>🔒 {fmtLockTime(lu.timeRemaining)} left</span>
                        : <span style={{ padding: '0.25rem 0.65rem', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.35)', borderRadius: 20, fontSize: '0.7rem', fontWeight: 800, color: '#10b981' }}>🔓 Unlocked</span>
                      }
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.85rem', flexWrap: 'wrap' }}>
                      {lu.lockStartsAt && <div style={{ fontSize: '0.72rem', color: isDark ? '#64748b' : '#94a3b8' }}>🕐 Started: <strong>{new Date(lu.lockStartsAt).toLocaleString('en-IN')}</strong></div>}
                      {lu.lockEndsAt && <div style={{ fontSize: '0.72rem', color: lu.isLocked ? '#ef4444' : (isDark ? '#64748b' : '#94a3b8') }}>⏰ {lu.isLocked ? 'Ends' : 'Ended'}: <strong>{new Date(lu.lockEndsAt).toLocaleString('en-IN')}</strong></div>}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                      {lu.isLocked && (
                        <button onClick={() => handleUnlockLock(lu.uid, lu.level)} disabled={isActing}
                          style={{ padding: '0.5rem 1rem', background: isActing ? '#334155' : 'linear-gradient(135deg,#10b981,#059669)', border: 'none', borderRadius: 10, color: '#fff', fontSize: '0.78rem', fontWeight: 700, cursor: isActing ? 'not-allowed' : 'pointer' }}>
                          🔓 Unlock Now
                        </button>
                      )}
                      {lu.isLocked && (
                        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                          <input type="number" min="1" max="30" placeholder="Days"
                            value={extendDays[key] || ''}
                            onChange={e => setExtendDays(prev => ({ ...prev, [key]: e.target.value }))}
                            style={{ width: 70, padding: '0.45rem 0.6rem', background: isDark ? 'rgba(255,255,255,0.06)' : '#fff', border: `1.5px solid ${isDark ? 'rgba(255,255,255,0.12)' : '#e2e8f0'}`, borderRadius: 10, color: isDark ? '#e2e8f0' : '#1e293b', fontSize: '0.82rem', fontWeight: 700, outline: 'none' }}
                          />
                          <button onClick={() => handleExtendLock(lu.uid, lu.level, lu.lockEndsAt)} disabled={isActing || !extendDays[key]}
                            style={{ padding: '0.5rem 0.9rem', background: isActing || !extendDays[key] ? '#334155' : 'linear-gradient(135deg,#f59e0b,#d97706)', border: 'none', borderRadius: 10, color: isActing || !extendDays[key] ? '#64748b' : '#fff', fontSize: '0.78rem', fontWeight: 700, cursor: isActing || !extendDays[key] ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap' }}>
                            ⏱️ Extend
                          </button>
                        </div>
                      )}
                      {!lu.isLocked && (
                        <button onClick={() => handleCompleteLock(lu.uid, lu.level)} disabled={isActing}
                          style={{ padding: '0.5rem 1rem', background: isActing ? '#334155' : 'linear-gradient(135deg,#ef4444,#dc2626)', border: 'none', borderRadius: 10, color: '#fff', fontSize: '0.78rem', fontWeight: 700, cursor: isActing ? 'not-allowed' : 'pointer' }}>
                          🔒 Force 7-Day Lock
                        </button>
                      )}
                      {isActing && <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>⏳ Processing...</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>
      )}

    </div>
  );
}