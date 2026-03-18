import React, { useState, useEffect } from 'react';
import {
  getAllStreakUsers, getStreakPrice, setStreakPrice,
  getRestorePrice, setRestorePrice,
  adminFreeRestore, getLeaderboard,
  seedFakeLeaderboard, deleteLeaderboardEntry, editLeaderboardEntry,
} from '../streakService';
import jsPDF from 'jspdf';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

const AdminStreak = ({ isMobile, isDark, user }) => {
  const adminUid = user?.uid;

  const [users,         setUsers]         = useState([]);
  const [leaderboard,   setLeaderboard]   = useState([]);
  const [price,         setPrice]         = useState(99);
  const [restorePrice,  setRestorePriceV] = useState(29);
  const [newPrice,      setNewPrice]      = useState('');
  const [newRestore,    setNewRestore]    = useState('');
  const [loading,       setLoading]       = useState(true);
  const [savingPrice,   setSavingPrice]   = useState(false);
  const [savingRestore, setSavingRestore] = useState(false);
  const [priceMsg,      setPriceMsg]      = useState('');
  const [restoreMsg,    setRestoreMsg]    = useState('');
  const [activeTab,     setActiveTab]     = useState('users');
  const [seeding,       setSeeding]       = useState(false);
  const [seedMsg,       setSeedMsg]       = useState('');
  const [editingId,     setEditingId]     = useState(null);
  const [editData,      setEditData]      = useState({});
  const [restoreTarget, setRestoreTarget] = useState(null);
  const [restoring,     setRestoring]     = useState(false);
  const [userSearch,    setUserSearch]    = useState('');
  const [lbSearch,      setLbSearch]      = useState('');

  const textPrimary = isDark ? '#f0f2ff' : '#111827';
  const textSec     = isDark ? '#8b93a8' : '#6b7280';
  const cardBg      = isDark ? 'rgba(255,255,255,0.04)' : '#ffffff';
  const border      = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)';
  const pageBg      = isDark ? 'linear-gradient(160deg,#060b14,#0d1117)' : '#f5f7ff';
  const inputBg     = isDark ? 'rgba(255,255,255,0.05)' : '#f9fafb';

  useEffect(() => { loadAll(); }, []); // eslint-disable-line

  const loadAll = async () => {
    setLoading(true);
    const [allUsers, currentPrice, currentRestore, lb] = await Promise.all([
      getAllStreakUsers(),
      getStreakPrice(),
      getRestorePrice(),
      getLeaderboard(),
    ]);
    setUsers(allUsers.sort((a, b) => (b.totalDays || 0) - (a.totalDays || 0)));
    setPrice(currentPrice);
    setRestorePriceV(currentRestore);
    setNewPrice(String(currentPrice));
    setNewRestore(String(currentRestore));
    setLeaderboard(lb);
    setLoading(false);
  };

  const handlePriceUpdate = async () => {
    const p = parseInt(newPrice);
    if (!p || p < 1) { setPriceMsg('❌ Enter a valid price'); return; }
    setSavingPrice(true);
    const ok = await setStreakPrice(p);
    if (ok) { setPrice(p); setPriceMsg(`✅ Challenge price updated to Rs.${p}`); }
    else    { setPriceMsg('❌ Failed to update'); }
    setSavingPrice(false);
    setTimeout(() => setPriceMsg(''), 3000);
  };

  const handleRestoreUpdate = async () => {
    const p = parseInt(newRestore);
    if (!p || p < 1) { setRestoreMsg('❌ Enter a valid price'); return; }
    setSavingRestore(true);
    const ok = await setRestorePrice(p);
    if (ok) { setRestorePriceV(p); setRestoreMsg(`✅ Restore price updated to Rs.${p}`); }
    else    { setRestoreMsg('❌ Failed to update'); }
    setSavingRestore(false);
    setTimeout(() => setRestoreMsg(''), 3000);
  };

  const handleFreeRestore = async (u) => {
    setRestoring(true);
    const ok = await adminFreeRestore(u.uid, adminUid);
    if (ok) {
      window.showToast?.(`Streak restored for ${u.name || u.email}`, 'success');
      setRestoreTarget(null);
      await loadAll();
    } else {
      window.showToast?.('Restore failed', 'error');
    }
    setRestoring(false);
  };

  const handleSeed = async () => {
    setSeeding(true);
    setSeedMsg('');
    const ok = await seedFakeLeaderboard();
    if (ok) {
      setSeedMsg('✅ 144 entries seeded!');
      const lb = await getLeaderboard();
      setLeaderboard(lb);
    } else {
      setSeedMsg('❌ Seeding failed');
    }
    setSeeding(false);
    setTimeout(() => setSeedMsg(''), 4000);
  };

  const handleDeleteLB = async (id) => {
    const ok = await deleteLeaderboardEntry(id);
    if (ok) {
      setLeaderboard(lb => lb.filter(e => e.id !== id));
      window.showToast?.('Entry deleted', 'success');
    }
  };

  const handleEditSave = async (id) => {
    const ok = await editLeaderboardEntry(id, editData);
    if (ok) {
      setLeaderboard(lb => lb.map(e => e.id === id ? { ...e, ...editData } : e));
      setEditingId(null);
      window.showToast?.('Entry updated', 'success');
    }
  };

  const downloadUserPDF = async (u) => {
    try {
      const snap = await getDocs(
        query(collection(db, 'streakResults', u.uid, 'days'), orderBy('date', 'asc'))
      );
      const days = snap.docs.map(d => d.data());
      if (!days.length) { window.showToast?.('No data for this user', 'warning'); return; }

      const doc   = new jsPDF();
      const OR    = [255, 107, 0];
      const DARK  = [17, 24, 39];
      const GRAY  = [107, 114, 128];
      const GREEN = [34, 197, 94];
      const RED   = [239, 68, 68];
      const AMB   = [245, 158, 11];

      doc.setFillColor(...OR); doc.rect(0, 0, 210, 44, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18); doc.setFont('helvetica', 'bold');
      doc.text('Zehra AI — Student Report', 15, 18);
      doc.setFontSize(10); doc.setFont('helvetica', 'normal');
      doc.text(`Student: ${u.name || u.email}`, 15, 28);
      doc.text(`Email: ${u.email}`, 15, 36);
      doc.setFontSize(8); doc.text('Zehra AI', 170, 38);

      const totalQ  = days.reduce((a, r) => a + r.total, 0);
      const correct = days.reduce((a, r) => a + r.score, 0);
      const pct     = totalQ ? Math.round((correct / totalQ) * 100) : 0;

      doc.setTextColor(...DARK); doc.setFontSize(12); doc.setFont('helvetica', 'bold');
      doc.text('Summary', 15, 56);
      doc.setFontSize(10); doc.setFont('helvetica', 'normal'); doc.setTextColor(...GRAY);
      doc.text(`Sessions: ${days.length}/30`, 15, 64);
      doc.text(`Overall: ${pct}%`, 15, 72);
      doc.text(`City: ${u.city || '—'}`, 15, 80);
      doc.text(`Phone: ${u.phone || '—'}`, 15, 88);

      doc.setFillColor(229, 231, 235); doc.rect(15, 94, 180, 7, 'F');
      doc.setFillColor(...OR); doc.rect(15, 94, (180 * pct) / 100, 7, 'F');

      let y = 110;
      doc.setFillColor(...OR); doc.rect(15, y - 6, 180, 9, 'F');
      doc.setTextColor(255, 255, 255); doc.setFontSize(9);
      ['Day', 'Date', 'Topic', 'Score', '%'].forEach((h, i) =>
        doc.text(h, [15, 28, 60, 150, 170][i], y)
      );
      y += 6;

      days.forEach((r, i) => {
        if (y > 272) { doc.addPage(); y = 20; }
        const p = Math.round((r.score / r.total) * 100);
        doc.setFillColor(...(i % 2 === 0 ? [249, 250, 251] : [255, 255, 255]));
        doc.rect(15, y - 5, 180, 9, 'F');
        doc.setTextColor(...DARK); doc.setFont('helvetica', 'normal');
        doc.text(`${r.day || i + 1}`, 15, y);
        doc.text(r.date, 28, y);
        doc.text(r.topic.substring(0, 30), 60, y);
        doc.text(`${r.score}/${r.total}`, 150, y);
        doc.setTextColor(...(p >= 70 ? GREEN : p >= 50 ? AMB : RED));
        doc.text(`${p}%`, 170, y);
        y += 9;
      });

      const pages = doc.getNumberOfPages();
      for (let p = 1; p <= pages; p++) {
        doc.setPage(p); doc.setTextColor(...GRAY); doc.setFontSize(8);
        doc.text('Zehra AI', 105, 290, { align: 'center' });
      }
      doc.save(`ZehraAI_${u.name || u.email}_Report.pdf`);
    } catch (e) {
      console.error(e);
      window.showToast?.('Failed to download PDF', 'error');
    }
  };

  const filteredUsers = users.filter(u =>
    !userSearch ||
    (u.name  || '').toLowerCase().includes(userSearch.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(userSearch.toLowerCase()) ||
    (u.city  || '').toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredLB = leaderboard.filter(e =>
    !lbSearch ||
    (e.name || '').toLowerCase().includes(lbSearch.toLowerCase()) ||
    (e.city || '').toLowerCase().includes(lbSearch.toLowerCase())
  );

  const totalRevenue   = users.length * price;
  const activeUsers    = users.filter(u => (u.totalDays || 0) > 5).length;
  const completedUsers = users.filter(u => (u.totalDays || 0) >= 30).length;
  const restoredUsers  = users.filter(u => u.streakRestored).length;
  const realLBEntries  = leaderboard.filter(e => e.isReal).length;
  const fakeLBEntries  = leaderboard.filter(e => !e.isReal).length;

  if (loading) return (
    <div style={{ minHeight:'100vh', background:pageBg, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Syne',sans-serif" }}>
      <div style={{ color:textPrimary, fontWeight:'700' }}>Loading admin data...</div>
    </div>
  );

  const tabs = [
    { id:'users',       label:'👥 Users'       },
    { id:'leaderboard', label:'🏆 Leaderboard' },
    { id:'price',       label:'💰 Pricing'     },
  ];

  return (
    <div style={{ minHeight:'100vh', background:pageBg, fontFamily:"'Syne',sans-serif", color:textPrimary, padding:isMobile?'80px 14px 40px':'100px 40px 60px', boxSizing:'border-box' }}>
      <div style={{ maxWidth:'960px', margin:'0 auto' }}>

        {/* Header */}
        <div style={{ marginBottom:'28px' }}>
          <span style={{ background:'linear-gradient(135deg,#6366f1,#4f46e5)', color:'#fff', padding:'4px 14px', borderRadius:'20px', fontSize:'0.72rem', fontWeight:'800', letterSpacing:'1.5px' }}>
            ADMIN PANEL
          </span>
          <h1 style={{ fontSize:isMobile?'1.5rem':'2rem', fontWeight:'900', marginTop:'10px', marginBottom:'4px' }}>
            🛡️ Zehra AI — Streak Admin
          </h1>
          <p style={{ color:textSec, fontSize:'0.85rem', margin:0 }}>
            Manage users, leaderboard, pricing, and restores
          </p>
        </div>

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:isMobile?'repeat(2,1fr)':'repeat(6,1fr)', gap:'10px', marginBottom:'24px' }}>
          {[
            { label:'Total Users',   value:users.length,          color:'#ff6b00' },
            { label:'Active (>5d)',  value:activeUsers,            color:'#6366f1' },
            { label:'Completed 30',  value:completedUsers,         color:'#22c55e' },
            { label:'Restores',      value:restoredUsers,          color:'#f59e0b' },
            { label:'Revenue',       value:`Rs.${totalRevenue}`,   color:'#10b981' },
            { label:'LB Entries',    value:`${realLBEntries}R/${fakeLBEntries}F`, color:'#ec4899' },
          ].map((s, i) => (
            <div key={i} style={{ background:cardBg, border:`1px solid ${border}`, borderRadius:'14px', padding:'14px 10px', textAlign:'center' }}>
              <div style={{ fontSize:'1.2rem', fontWeight:'900', color:s.color }}>{s.value}</div>
              <div style={{ fontSize:'0.62rem', color:textSec, marginTop:'3px' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display:'flex', gap:'8px', marginBottom:'20px', flexWrap:'wrap', alignItems:'center' }}>
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ padding:'9px 20px', borderRadius:'12px', border:`1px solid ${activeTab===tab.id?'transparent':border}`, fontWeight:'700', fontSize:'0.85rem', cursor:'pointer', fontFamily:'inherit', background:activeTab===tab.id?'linear-gradient(135deg,#6366f1,#4f46e5)':cardBg, color:activeTab===tab.id?'#fff':textSec, boxShadow:activeTab===tab.id?'0 4px 12px rgba(99,102,241,0.35)':'none', transition:'all 0.2s' }}>
              {tab.label}
            </button>
          ))}
          <button onClick={loadAll} style={{ marginLeft:'auto', padding:'9px 16px', background:'transparent', border:`1px solid ${border}`, borderRadius:'12px', color:textSec, fontSize:'0.8rem', fontWeight:'700', cursor:'pointer', fontFamily:'inherit' }}>
            🔄 Refresh
          </button>
        </div>

        {/* ── TAB: USERS ─────────────────────────────────────────────────────── */}
        {activeTab === 'users' && (
          <>
            <input type="text" placeholder="Search by name, email, city..." value={userSearch} onChange={e => setUserSearch(e.target.value)}
              style={{ width:'100%', boxSizing:'border-box', padding:'11px 16px', background:inputBg, border:`1px solid ${border}`, borderRadius:'12px', fontSize:'0.88rem', color:textPrimary, outline:'none', fontFamily:'inherit', marginBottom:'14px' }}
            />

            <div style={{ background:cardBg, border:`1px solid ${border}`, borderRadius:'16px', overflow:'hidden' }}>
              <div style={{ padding:'14px 20px', borderBottom:`1px solid ${border}`, fontWeight:'800', fontSize:'0.92rem' }}>
                All Participants ({filteredUsers.length})
              </div>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.8rem' }}>
                  <thead>
                    <tr style={{ background:isDark?'rgba(99,102,241,0.08)':'rgba(99,102,241,0.05)' }}>
                      {['#','Name','Email','City','Phone','Days','Progress','Restored','Actions'].map(h => (
                        <th key={h} style={{ padding:'11px 12px', textAlign:'left', fontWeight:'700', color:'#6366f1', whiteSpace:'nowrap', fontSize:'0.72rem' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr><td colSpan={9} style={{ padding:'32px', textAlign:'center', color:textSec }}>No users found</td></tr>
                    ) : filteredUsers.map((u, i) => (
                      <tr key={i} style={{ borderBottom:`1px solid ${border}` }}>
                        <td style={{ padding:'11px 12px', fontWeight:'800', color:i===0?'#f59e0b':i===1?'#94a3b8':i===2?'#f97316':textSec }}>
                          {i===0?'🥇':i===1?'🥈':i===2?'🥉':`#${i+1}`}
                        </td>
                        <td style={{ padding:'11px 12px', fontWeight:'600', color:textPrimary, whiteSpace:'nowrap' }}>{u.name||'—'}</td>
                        <td style={{ padding:'11px 12px', color:textSec, fontSize:'0.7rem', maxWidth:'140px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{u.email}</td>
                        <td style={{ padding:'11px 12px', color:textSec, fontSize:'0.75rem' }}>{u.city||'—'}</td>
                        <td style={{ padding:'11px 12px', color:textSec, fontSize:'0.75rem' }}>{u.phone||'—'}</td>
                        <td style={{ padding:'11px 12px', fontWeight:'700', color:'#ff6b00' }}>{u.totalDays||0}/30</td>
                        <td style={{ padding:'11px 12px', minWidth:'90px' }}>
                          <div style={{ height:'5px', background:isDark?'rgba(255,255,255,0.08)':'#e5e7eb', borderRadius:'10px', overflow:'hidden' }}>
                            <div style={{ height:'100%', width:`${Math.min(((u.totalDays||0)/30)*100,100)}%`, background:'linear-gradient(90deg,#ff6b00,#f59e0b)', borderRadius:'10px' }}/>
                          </div>
                          <div style={{ fontSize:'0.6rem', color:textSec, marginTop:'2px' }}>{Math.round(((u.totalDays||0)/30)*100)}%</div>
                        </td>
                        <td style={{ padding:'11px 12px', textAlign:'center' }}>
                          {u.streakRestored
                            ? <span style={{ color:'#22c55e', fontSize:'0.7rem', fontWeight:'700' }}>✅ {u.restoreCount||1}x</span>
                            : <span style={{ color:textSec, fontSize:'0.72rem' }}>—</span>}
                        </td>
                        <td style={{ padding:'11px 12px' }}>
                          <div style={{ display:'flex', gap:'5px', flexWrap:'wrap' }}>
                            <button onClick={() => downloadUserPDF(u)} style={{ background:'rgba(99,102,241,0.12)', border:'1px solid rgba(99,102,241,0.3)', color:'#6366f1', borderRadius:'7px', padding:'4px 9px', fontSize:'0.68rem', fontWeight:'700', cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap' }}>
                              📥 PDF
                            </button>
                            <button onClick={() => setRestoreTarget(u)} style={{ background:'rgba(34,197,94,0.12)', border:'1px solid rgba(34,197,94,0.3)', color:'#22c55e', borderRadius:'7px', padding:'4px 9px', fontSize:'0.68rem', fontWeight:'700', cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap' }}>
                              🛡️ Free Restore
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Restore Confirm Modal */}
            {restoreTarget && (
              <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.65)', backdropFilter:'blur(4px)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:'20px' }}>
                <div style={{ background:isDark?'#0d1117':'#ffffff', border:`1px solid ${border}`, borderRadius:'20px', padding:'28px', maxWidth:'360px', width:'100%', textAlign:'center' }}>
                  <div style={{ fontSize:'2.5rem', marginBottom:'10px' }}>🛡️</div>
                  <h3 style={{ fontSize:'1.1rem', fontWeight:'900', margin:'0 0 8px', color:textPrimary }}>Free Restore</h3>
                  <p style={{ color:textSec, fontSize:'0.85rem', margin:'0 0 20px', lineHeight:'1.6' }}>
                    Restore <strong style={{ color:textPrimary }}>{restoreTarget.name || restoreTarget.email}</strong>'s streak for free?
                    <br/>Their <strong style={{ color:'#ff6b00' }}>{restoreTarget.totalDays||0}-day</strong> streak will continue.
                  </p>
                  <div style={{ display:'flex', gap:'10px' }}>
                    <button onClick={() => setRestoreTarget(null)} style={{ flex:1, padding:'12px', background:'transparent', border:`1px solid ${border}`, borderRadius:'12px', color:textSec, fontSize:'0.9rem', fontWeight:'700', cursor:'pointer', fontFamily:'inherit' }}>
                      Cancel
                    </button>
                    <button onClick={() => handleFreeRestore(restoreTarget)} disabled={restoring} style={{ flex:1, padding:'12px', background:'linear-gradient(135deg,#22c55e,#16a34a)', color:'#fff', border:'none', borderRadius:'12px', fontSize:'0.9rem', fontWeight:'800', cursor:restoring?'wait':'pointer', fontFamily:'inherit' }}>
                      {restoring ? 'Restoring...' : 'Yes, Free Restore'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── TAB: LEADERBOARD ───────────────────────────────────────────────── */}
        {activeTab === 'leaderboard' && (
          <>
            <div style={{ display:'flex', gap:'10px', marginBottom:'14px', flexWrap:'wrap', alignItems:'center' }}>
              <input type="text" placeholder="Search leaderboard..." value={lbSearch} onChange={e => setLbSearch(e.target.value)}
                style={{ flex:1, minWidth:'180px', padding:'11px 16px', background:inputBg, border:`1px solid ${border}`, borderRadius:'12px', fontSize:'0.85rem', color:textPrimary, outline:'none', fontFamily:'inherit' }}
              />
              <button onClick={handleSeed} disabled={seeding} style={{ padding:'11px 20px', background:seeding?'#6b7280':'linear-gradient(135deg,#6366f1,#4f46e5)', color:'#fff', border:'none', borderRadius:'12px', fontSize:'0.82rem', fontWeight:'800', cursor:seeding?'wait':'pointer', fontFamily:'inherit', whiteSpace:'nowrap', boxShadow:'0 4px 14px rgba(99,102,241,0.4)' }}>
                {seeding ? '⏳ Seeding...' : '🌱 Seed 144 Fake Entries'}
              </button>
            </div>

            {seedMsg && (
              <div style={{ padding:'10px 16px', background:seedMsg.includes('✅')?'rgba(34,197,94,0.1)':'rgba(239,68,68,0.1)', border:`1px solid ${seedMsg.includes('✅')?'rgba(34,197,94,0.3)':'rgba(239,68,68,0.3)'}`, borderRadius:'10px', fontSize:'0.82rem', fontWeight:'600', color:seedMsg.includes('✅')?'#22c55e':'#ef4444', marginBottom:'12px' }}>
                {seedMsg}
              </div>
            )}

            <div style={{ display:'flex', gap:'14px', marginBottom:'12px', flexWrap:'wrap' }}>
              <span style={{ fontSize:'0.72rem', color:'#22c55e', fontWeight:'700' }}>🟢 Real: {realLBEntries}</span>
              <span style={{ fontSize:'0.72rem', color:textSec, fontWeight:'700' }}>⚪ Fake: {fakeLBEntries}</span>
              <span style={{ fontSize:'0.72rem', color:textSec }}>Total: {leaderboard.length}</span>
            </div>

            <div style={{ background:cardBg, border:`1px solid ${border}`, borderRadius:'16px', overflow:'hidden' }}>
              <div style={{ overflowX:'auto', maxHeight:'580px', overflowY:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.78rem' }}>
                  <thead style={{ position:'sticky', top:0, zIndex:1 }}>
                    <tr style={{ background:isDark?'rgba(255,107,0,0.12)':'rgba(255,107,0,0.07)' }}>
                      {['#','Name','City','Days','Avg%','Type','Actions'].map(h => (
                        <th key={h} style={{ padding:'11px 12px', textAlign:'left', fontWeight:'700', color:'#ff6b00', whiteSpace:'nowrap', fontSize:'0.7rem' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLB.length === 0 ? (
                      <tr><td colSpan={7} style={{ padding:'32px', textAlign:'center', color:textSec }}>
                        No entries — click "Seed 144 Fake Entries" to populate
                      </td></tr>
                    ) : filteredLB.map((e, i) => (
                      <tr key={e.id} style={{ borderBottom:`1px solid ${border}`, background:editingId===e.id?(isDark?'rgba(99,102,241,0.08)':'rgba(99,102,241,0.04)'):'' }}>
                        <td style={{ padding:'10px 12px', fontWeight:'800', color:i===0?'#f59e0b':i===1?'#94a3b8':i===2?'#f97316':textSec }}>
                          {i===0?'🥇':i===1?'🥈':i===2?'🥉':`#${i+1}`}
                        </td>
                        <td style={{ padding:'10px 12px', fontWeight:'600', color:textPrimary }}>
                          {editingId === e.id ? (
                            <input value={editData.name||''} onChange={ev => setEditData(d=>({...d,name:ev.target.value}))}
                              style={{ width:'100px', padding:'4px 8px', background:inputBg, border:`1px solid ${border}`, borderRadius:'6px', fontSize:'0.75rem', color:textPrimary, fontFamily:'inherit', outline:'none' }}
                            />
                          ) : (
                            <span style={{ display:'flex', alignItems:'center', gap:'4px' }}>
                              {e.isReal && <span style={{ fontSize:'0.52rem', background:'rgba(34,197,94,0.15)', color:'#22c55e', padding:'1px 5px', borderRadius:'4px', fontWeight:'800' }}>REAL</span>}
                              {e.name}
                            </span>
                          )}
                        </td>
                        <td style={{ padding:'10px 12px', color:textSec }}>
                          {editingId === e.id ? (
                            <input value={editData.city||''} onChange={ev => setEditData(d=>({...d,city:ev.target.value}))}
                              style={{ width:'80px', padding:'4px 8px', background:inputBg, border:`1px solid ${border}`, borderRadius:'6px', fontSize:'0.75rem', color:textPrimary, fontFamily:'inherit', outline:'none' }}
                            />
                          ) : e.city}
                        </td>
                        <td style={{ padding:'10px 12px', fontWeight:'700', color:'#ff6b00' }}>
                          {editingId === e.id ? (
                            <input type="number" value={editData.totalDays??e.totalDays} onChange={ev => setEditData(d=>({...d,totalDays:parseInt(ev.target.value)||0}))}
                              style={{ width:'50px', padding:'4px 8px', background:inputBg, border:`1px solid ${border}`, borderRadius:'6px', fontSize:'0.75rem', color:textPrimary, fontFamily:'inherit', outline:'none' }}
                            />
                          ) : `${e.totalDays}/30`}
                        </td>
                        <td style={{ padding:'10px 12px', fontWeight:'700', color:e.avgScore>=70?'#22c55e':e.avgScore>=50?'#f59e0b':'#ef4444' }}>
                          {editingId === e.id ? (
                            <input type="number" value={editData.avgScore??e.avgScore} onChange={ev => setEditData(d=>({...d,avgScore:parseInt(ev.target.value)||0}))}
                              style={{ width:'50px', padding:'4px 8px', background:inputBg, border:`1px solid ${border}`, borderRadius:'6px', fontSize:'0.75rem', color:textPrimary, fontFamily:'inherit', outline:'none' }}
                            />
                          ) : `${e.avgScore}%`}
                        </td>
                        <td style={{ padding:'10px 12px' }}>
                          <span style={{ fontSize:'0.62rem', fontWeight:'700', color:e.isReal?'#22c55e':textSec, background:e.isReal?'rgba(34,197,94,0.1)':(isDark?'rgba(255,255,255,0.05)':'#f1f5f9'), padding:'2px 8px', borderRadius:'8px' }}>
                            {e.isReal ? 'Real' : 'Fake'}
                          </span>
                        </td>
                        <td style={{ padding:'10px 12px' }}>
                          <div style={{ display:'flex', gap:'5px' }}>
                            {editingId === e.id ? (
                              <>
                                <button onClick={() => handleEditSave(e.id)} style={{ background:'rgba(34,197,94,0.15)', border:'1px solid rgba(34,197,94,0.3)', color:'#22c55e', borderRadius:'6px', padding:'4px 10px', fontSize:'0.68rem', fontWeight:'700', cursor:'pointer', fontFamily:'inherit' }}>Save</button>
                                <button onClick={() => setEditingId(null)} style={{ background:'transparent', border:`1px solid ${border}`, color:textSec, borderRadius:'6px', padding:'4px 8px', fontSize:'0.68rem', fontWeight:'700', cursor:'pointer', fontFamily:'inherit' }}>Cancel</button>
                              </>
                            ) : (
                              <>
                                <button onClick={() => { setEditingId(e.id); setEditData({name:e.name,city:e.city,totalDays:e.totalDays,avgScore:e.avgScore}); }} style={{ background:'rgba(245,158,11,0.12)', border:'1px solid rgba(245,158,11,0.3)', color:'#f59e0b', borderRadius:'6px', padding:'4px 8px', fontSize:'0.68rem', fontWeight:'700', cursor:'pointer', fontFamily:'inherit' }}>✏️</button>
                                <button onClick={() => handleDeleteLB(e.id)} style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.25)', color:'#ef4444', borderRadius:'6px', padding:'4px 8px', fontSize:'0.68rem', fontWeight:'700', cursor:'pointer', fontFamily:'inherit' }}>🗑️</button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* ── TAB: PRICING ───────────────────────────────────────────────────── */}
        {activeTab === 'price' && (
          <div style={{ display:'grid', gridTemplateColumns:isMobile?'1fr':'1fr 1fr', gap:'16px' }}>

            {/* Challenge Price */}
            <div style={{ background:cardBg, border:`1px solid ${border}`, borderRadius:'20px', padding:'24px' }}>
              <h3 style={{ fontSize:'1.05rem', fontWeight:'900', margin:'0 0 6px' }}>🚀 Challenge Price</h3>
              <p style={{ color:textSec, fontSize:'0.82rem', margin:'0 0 20px' }}>What users pay to join the 30-day challenge.</p>
              <div style={{ fontSize:'2rem', fontWeight:'900', background:'linear-gradient(135deg,#ff6b00,#f59e0b)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', marginBottom:'14px' }}>
                Rs.{price}
              </div>
              <div style={{ display:'flex', gap:'8px', marginBottom:'12px' }}>
                <input type="number" value={newPrice} onChange={e => setNewPrice(e.target.value)} placeholder="New price"
                  style={{ flex:1, padding:'11px 14px', background:inputBg, border:`1px solid ${border}`, borderRadius:'12px', fontSize:'1rem', fontWeight:'700', color:textPrimary, outline:'none', fontFamily:'inherit' }}
                />
                <button onClick={handlePriceUpdate} disabled={savingPrice} style={{ padding:'11px 20px', background:savingPrice?'#6b7280':'linear-gradient(135deg,#ff6b00,#ff3d00)', color:'#fff', border:'none', borderRadius:'12px', fontSize:'0.9rem', fontWeight:'800', cursor:savingPrice?'wait':'pointer', fontFamily:'inherit' }}>
                  {savingPrice?'Saving...':'Update'}
                </button>
              </div>
              {priceMsg && <div style={{ padding:'10px 14px', background:priceMsg.includes('✅')?'rgba(34,197,94,0.1)':'rgba(239,68,68,0.1)', border:`1px solid ${priceMsg.includes('✅')?'rgba(34,197,94,0.3)':'rgba(239,68,68,0.3)'}`, borderRadius:'10px', fontSize:'0.82rem', fontWeight:'600', color:priceMsg.includes('✅')?'#22c55e':'#ef4444', marginBottom:'12px' }}>{priceMsg}</div>}
              <div style={{ display:'flex', flexWrap:'wrap', gap:'6px', marginTop:'8px' }}>
                <div style={{ width:'100%', fontSize:'0.7rem', color:textSec, fontWeight:'600', marginBottom:'4px' }}>Quick Presets</div>
                {[29,49,99,149,199,299].map(p => (
                  <button key={p} onClick={() => setNewPrice(String(p))} style={{ padding:'7px 14px', background:newPrice===String(p)?'rgba(255,107,0,0.15)':'transparent', border:`1px solid ${newPrice===String(p)?'rgba(255,107,0,0.4)':border}`, borderRadius:'10px', color:newPrice===String(p)?'#ff6b00':textSec, fontSize:'0.82rem', fontWeight:'700', cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s' }}>
                    Rs.{p}
                  </button>
                ))}
              </div>
            </div>

            {/* Restore Price */}
            <div style={{ background:cardBg, border:`1px solid ${border}`, borderRadius:'20px', padding:'24px' }}>
              <h3 style={{ fontSize:'1.05rem', fontWeight:'900', margin:'0 0 6px' }}>🛡️ Restore Price</h3>
              <p style={{ color:textSec, fontSize:'0.82rem', margin:'0 0 20px' }}>What users pay to restore a broken streak.</p>
              <div style={{ fontSize:'2rem', fontWeight:'900', background:'linear-gradient(135deg,#22c55e,#16a34a)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', marginBottom:'14px' }}>
                Rs.{restorePrice}
              </div>
              <div style={{ display:'flex', gap:'8px', marginBottom:'12px' }}>
                <input type="number" value={newRestore} onChange={e => setNewRestore(e.target.value)} placeholder="New restore price"
                  style={{ flex:1, padding:'11px 14px', background:inputBg, border:`1px solid ${border}`, borderRadius:'12px', fontSize:'1rem', fontWeight:'700', color:textPrimary, outline:'none', fontFamily:'inherit' }}
                />
                <button onClick={handleRestoreUpdate} disabled={savingRestore} style={{ padding:'11px 20px', background:savingRestore?'#6b7280':'linear-gradient(135deg,#22c55e,#16a34a)', color:'#fff', border:'none', borderRadius:'12px', fontSize:'0.9rem', fontWeight:'800', cursor:savingRestore?'wait':'pointer', fontFamily:'inherit' }}>
                  {savingRestore?'Saving...':'Update'}
                </button>
              </div>
              {restoreMsg && <div style={{ padding:'10px 14px', background:restoreMsg.includes('✅')?'rgba(34,197,94,0.1)':'rgba(239,68,68,0.1)', border:`1px solid ${restoreMsg.includes('✅')?'rgba(34,197,94,0.3)':'rgba(239,68,68,0.3)'}`, borderRadius:'10px', fontSize:'0.82rem', fontWeight:'600', color:restoreMsg.includes('✅')?'#22c55e':'#ef4444', marginBottom:'12px' }}>{restoreMsg}</div>}
              <div style={{ display:'flex', flexWrap:'wrap', gap:'6px', marginTop:'8px' }}>
                <div style={{ width:'100%', fontSize:'0.7rem', color:textSec, fontWeight:'600', marginBottom:'4px' }}>Quick Presets</div>
                {[9,19,29,49,69,99].map(p => (
                  <button key={p} onClick={() => setNewRestore(String(p))} style={{ padding:'7px 14px', background:newRestore===String(p)?'rgba(34,197,94,0.15)':'transparent', border:`1px solid ${newRestore===String(p)?'rgba(34,197,94,0.4)':border}`, borderRadius:'10px', color:newRestore===String(p)?'#22c55e':textSec, fontSize:'0.82rem', fontWeight:'700', cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s' }}>
                    Rs.{p}
                  </button>
                ))}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default AdminStreak;