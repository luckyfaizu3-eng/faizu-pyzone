// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import {
  collection, getDocs, doc, getDoc, setDoc
} from 'firebase/firestore';
import { saveCertificatePayment } from '../services/mockTestService';
import { Users, Award, DollarSign, RefreshCw, Unlock, Search, ChevronDown, ChevronUp, TrendingUp, Clock, Shield } from 'lucide-react';

const ADMIN_EMAIL = 'luckyfaizu3@gmail.com';

// ── helpers ──────────────────────────────────────────────────
function fmt(ms) {
  if (!ms) return '—';
  const s = Math.floor(ms / 1000);
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
  const [revenue, setRevenue] = useState({ total: 0, certPayments: 0, testPayments: 0, count: 0 });
  const [refreshing, setRefreshing] = useState(false);

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

      // 2. Load all users from mockTests collection group
      const testsSnap = await getDocs(collection(db, 'users'));
      const userMap = {};

      for (const userDoc of testsSnap.docs) {
        const uid = userDoc.id;
        const testsRef = collection(db, 'users', uid, 'mockTests');
        const testsQ = await getDocs(testsRef);
        if (testsQ.empty) continue;

        const tests = testsQ.docs.map(d => ({ id: d.id, ...d.data() }));
        tests.sort((a, b) => (b.timestamp?.toMillis?.() || 0) - (a.timestamp?.toMillis?.() || 0));

        const certsSnap = await getDocs(collection(db, 'users', uid, 'certificates'));
        const certs = certsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        const certPaySnap = await getDocs(collection(db, 'users', uid, 'certificatePayments'));
        const certPays = certPaySnap.docs.map(d => ({ level: d.id, ...d.data() }));

        const testPaySnap = await getDocs(collection(db, 'users', uid, 'mockTestPayments'));
        const testPays = testPaySnap.docs.map(d => ({ level: d.id, ...d.data() }));

        const latest = tests[0];
        userMap[uid] = {
          uid,
          name: latest?.studentInfo?.fullName || latest?.studentInfo?.name || 'Unknown',
          email: latest?.studentInfo?.email || latest?.userEmail || '—',
          tests,
          certs,
          certPays,
          testPays,
          latestScore: latest?.score,
          latestLevel: latest?.level,
          latestTime: latest?.timeTaken,
          latestDate: latest?.testDate || latest?.date,
          totalTests: tests.length,
        };
      }

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

      {/* Price + Quick Unlock row */}
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

                    <div style={{ marginLeft: 'auto', color: isDark ? '#475569' : '#94a3b8' }}>
                      {isExpanded ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
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

      {/* Revenue breakdown */}
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

    </div>
  );
}