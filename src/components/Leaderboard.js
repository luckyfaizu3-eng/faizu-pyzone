import React, { useState, useEffect, useRef } from 'react';
import { Trash2, Search, Crown, CheckCircle, XCircle, Calendar, Clock } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy } from 'firebase/firestore';

// ==========================================
// 🐍 Python Official Logo
// ==========================================
function PythonLogo({ size = 22, style = {} }) {
  const uid = React.useId().replace(/:/g, '');
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 255"
      width={size} height={size}
      style={{ display: 'inline-block', flexShrink: 0, verticalAlign: 'middle', ...style }}>
      <defs>
        <linearGradient id={`pyB${uid}`} x1="12.959%" y1="12.039%" x2="79.639%" y2="78.201%">
          <stop offset="0%" stopColor="#387EB8"/><stop offset="100%" stopColor="#366994"/>
        </linearGradient>
        <linearGradient id={`pyY${uid}`} x1="19.128%" y1="20.579%" x2="90.742%" y2="88.429%">
          <stop offset="0%" stopColor="#FFE052"/><stop offset="100%" stopColor="#FFC331"/>
        </linearGradient>
      </defs>
      <path fill={`url(#pyB${uid})`} d="M126.916.072c-64.832 0-60.784 28.115-60.784 28.115l.072 29.128h61.868v8.745H41.631S.145 61.355.145 126.77c0 65.417 36.21 63.097 36.21 63.097h21.61v-30.356s-1.165-36.21 35.632-36.21h61.362s34.475.557 34.475-33.319V33.97S194.67.072 126.916.072zm-34.054 19.474a11.05 11.05 0 0 1 11.063 11.064A11.05 11.05 0 0 1 92.862 41.674a11.05 11.05 0 0 1-11.063-11.064 11.05 11.05 0 0 1 11.063-11.064z"/>
      <path fill={`url(#pyY${uid})`} d="M128.757 254.126c64.832 0 60.784-28.115 60.784-28.115l-.072-29.127H127.6v-8.745h86.441s41.486 4.705 41.486-60.712c0-65.416-36.21-63.096-36.21-63.096h-21.61v30.355s1.165 36.21-35.632 36.21h-61.362s-34.475-.557-34.475 33.32v56.013s-5.235 33.897 62.518 33.897zm34.055-19.474a11.05 11.05 0 0 1-11.063-11.064 11.05 11.05 0 0 1 11.063-11.064 11.05 11.05 0 0 1 11.063 11.064 11.05 11.05 0 0 1-11.063 11.064z"/>
    </svg>
  );
}

// ==========================================
// 🎯 CONFIG
// ==========================================
const CONFIG = { ADMIN_EMAIL: 'luckyfaizu3@gmail.com' };

const TABS = [
  { key: 'basic',    label: 'Basic',    emoji: '🌱', level: 'basic',    color: '#10b981', grad: 'linear-gradient(135deg,#10b981,#059669)', shadow: 'rgba(16,185,129,0.35)' },
  { key: 'advanced', label: 'Advanced', emoji: '🔥', level: 'advanced', color: '#6366f1', grad: 'linear-gradient(135deg,#6366f1,#4f46e5)', shadow: 'rgba(99,102,241,0.35)' },
  { key: 'pro',      label: 'Pro',      emoji: '⭐', level: 'pro',      color: '#f59e0b', grad: 'linear-gradient(135deg,#f59e0b,#d97706)', shadow: 'rgba(245,158,11,0.35)' },
];

// ==========================================
// 💾 STORAGE MANAGER
// ==========================================
class LeaderboardStorage {
  static async saveEntry(testResult) {
    try {
      const newEntry = {
        name: testResult.studentInfo?.name || 'Anonymous',
        email: testResult.userEmail,
        percentage: testResult.percentage,
        score: `${testResult.correct}/${testResult.total}`,
        testTitle: testResult.testTitle,
        testLevel: testResult.testLevel,
        timeTaken: testResult.timeTaken,
        passed: testResult.passed,
        penalized: testResult.penalized || false,
        disqualificationReason: testResult.disqualificationReason || '',
        date: new Date().toLocaleDateString('en-GB'),
        timestamp: Date.now()
      };
      const docRef = await addDoc(collection(db, 'leaderboard'), newEntry);
      return { success: true, id: docRef.id };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  static async getAllEntries() {
    try {
      const q = query(collection(db, 'leaderboard'), orderBy('timestamp', 'desc'));
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch { return []; }
  }

  static async deleteEntry(id) {
    try { await deleteDoc(doc(db, 'leaderboard', id)); return { success: true }; }
    catch (error) { return { success: false, error: error.message }; }
  }

  static async clearAll() {
    try {
      const snap = await getDocs(collection(db, 'leaderboard'));
      await Promise.all(snap.docs.map(d => deleteDoc(doc(db, 'leaderboard', d.id))));
      return { success: true };
    } catch (error) { return { success: false, error: error.message }; }
  }

  static getSortedEntries(entries) {
    return [...entries].sort((a, b) =>
      b.percentage !== a.percentage ? b.percentage - a.percentage : a.timestamp - b.timestamp
    );
  }
}

// ==========================================
// 🏆 RANK MEDAL
// ==========================================
function RankMedal({ index }) {
  if (index === 0) return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg,#FFD700,#FFA500)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, boxShadow: '0 4px 16px rgba(255,215,0,0.5)', border: '3px solid #FFD700' }}>👑</div>
      <span style={{ fontSize: 11, fontWeight: 800, color: '#B8860B', letterSpacing: 1, textTransform: 'uppercase' }}>Champion</span>
    </div>
  );
  if (index === 1) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div style={{ width: 46, height: 46, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, boxShadow: '0 4px 16px rgba(99,102,241,0.5)', border: '3px solid #818cf8' }}>🏅</div>
      <span style={{ fontSize: 11, fontWeight: 800, color: '#4f46e5', letterSpacing: 1, textTransform: 'uppercase' }}>Runner-up</span>
    </div>
  );
  if (index === 2) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'linear-gradient(135deg,#CD7F32,#A0522D)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, boxShadow: '0 4px 12px rgba(205,127,50,0.5)', border: '3px solid #CD7F32' }}>🥉</div>
      <span style={{ fontSize: 11, fontWeight: 800, color: '#8B4513', letterSpacing: 1, textTransform: 'uppercase' }}>3rd Place</span>
    </div>
  );
  return (
    <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#f1f5f9', border: '2px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 900, color: '#64748b' }}>
      #{index + 1}
    </div>
  );
}

// ==========================================
// 🎨 MAIN LEADERBOARD
// ==========================================
export default function Leaderboard({ userEmail }) {
  const [entries, setEntries] = useState([]);
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [activeTab, setActiveTab] = useState('basic');
  const [loading, setLoading] = useState(true);
  const entriesRef = useRef([]);

  const isAdmin = userEmail === CONFIG.ADMIN_EMAIL;
  const currentTab = TABS.find(t => t.key === activeTab);

  useEffect(() => {
    loadEntries(true);
    // Silent background refresh — no loading state = no jitter
    const interval = setInterval(() => loadEntries(false), 8000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    applyFilters();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, searchTerm, filterType, activeTab]);

  const loadEntries = async (showLoader = false) => {
    if (showLoader) setLoading(true);
    const all = await LeaderboardStorage.getAllEntries();
    const sorted = LeaderboardStorage.getSortedEntries(all);
    // Only update state if data actually changed to avoid re-render jitter
    const newIds = sorted.map(e => e.id + e.percentage).join(',');
    const oldIds = entriesRef.current.map(e => e.id + e.percentage).join(',');
    if (newIds !== oldIds) {
      entriesRef.current = sorted;
      setEntries(sorted);
    }
    if (showLoader) setLoading(false);
  };

  const applyFilters = () => {
    let list = entries.filter(e =>
      (e.testLevel || '').toLowerCase().trim() === activeTab
    );
    if (searchTerm) {
      list = list.filter(e =>
        e.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (filterType === 'passed') list = list.filter(e => e.passed);
    else if (filterType === 'failed') list = list.filter(e => !e.passed);
    setFilteredEntries(list);
  };

  const handleDelete = async (id) => {
    await LeaderboardStorage.deleteEntry(id);
    await loadEntries(false);
    setShowDeleteConfirm(null);
  };

  const handleClearAll = async () => {
    if (!window.confirm(`Delete ALL ${activeTab.toUpperCase()} leaderboard entries? This cannot be undone.`)) return;
    await LeaderboardStorage.clearAll();
    await loadEntries(false);
    window.showToast?.('✅ All data cleared!', 'success');
  };

  const tabEntries = entries.filter(e => (e.testLevel || '').toLowerCase().trim() === activeTab);
  const passCount = tabEntries.filter(e => e.passed).length;
  const avgScore = tabEntries.length
    ? Math.round(tabEntries.reduce((s, e) => s + e.percentage, 0) / tabEntries.length)
    : 0;
  const topScore = tabEntries.length ? Math.max(...tabEntries.map(e => e.percentage)) : 0;

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8fafc',
      paddingTop: 90,
      paddingBottom: 48,
      fontFamily: '"DM Sans", system-ui, sans-serif'
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700;800;900&family=Space+Grotesk:wght@700;800&display=swap');
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes shimmer { 0%,100% { opacity:1; } 50% { opacity:0.6; } }
        @keyframes gradientFlow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes titleFloat {
          0%,100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }
        @keyframes spin1 {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spin2 {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        @keyframes spin3 {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulseGlow {
          0%,100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        .logo-wrap {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 52px; height: 52px;
          flex-shrink: 0;
        }
        .logo-glass {
          width: 52px; height: 52px;
          border-radius: 50%;
          background: transparent;
          border: 1.5px solid rgba(99,102,241,0.25);
          display: flex; align-items: center; justify-content: center;
          position: relative; z-index: 2;
        }
        .ring1 {
          position: absolute;
          width: 62px; height: 62px;
          top: 50%; left: 50%;
          margin: -31px 0 0 -31px;
          border-radius: 50%;
          border: 2px solid transparent;
          border-top-color: #6366f1;
          border-right-color: #8b5cf6;
          animation: spin1 2.5s linear infinite;
          pointer-events: none;
        }
        .ring2 {
          position: absolute;
          width: 74px; height: 74px;
          top: 50%; left: 50%;
          margin: -37px 0 0 -37px;
          border-radius: 50%;
          border: 1.5px solid transparent;
          border-top-color: #ec4899;
          border-bottom-color: #f59e0b;
          animation: spin2 3.5s linear infinite;
          pointer-events: none;
        }
        .ring3 {
          position: absolute;
          width: 86px; height: 86px;
          top: 50%; left: 50%;
          margin: -43px 0 0 -43px;
          border-radius: 50%;
          border: 1px dashed rgba(16,185,129,0.55);
          animation: spin3 5s linear infinite;
          pointer-events: none;
          animation: spin3 5s linear infinite, pulseGlow 2s ease-in-out infinite;
        }
        .lb-card { animation: fadeUp 0.4s ease both; transition: transform 0.2s, box-shadow 0.2s; }
        .lb-card:hover { transform: translateY(-2px); box-shadow: 0 16px 48px rgba(0,0,0,0.12) !important; }
        .tab-btn { transition: all 0.25s cubic-bezier(0.34,1.56,0.64,1); }
        .tab-btn:hover { transform: translateY(-1px); }
        .del-btn:hover { transform: scale(1.1) !important; }
        .search-input:focus { outline: none; border-color: #6366f1 !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.12) !important; }
        .animated-gradient-title {
          background: linear-gradient(270deg, #6366f1, #8b5cf6, #ec4899, #f59e0b, #10b981, #3b82f6, #6366f1);
          background-size: 400% 400%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: gradientFlow 4s ease infinite;
        }
      `}</style>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 1rem' }}>

        {/* ── HEADER ── */}
        <div style={{ textAlign: 'center', marginBottom: 32, animation: 'fadeUp 0.5s ease' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 18, marginBottom: 10 }}>
            <div style={{ position: 'relative', width: 52, height: 52, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="ring3" />
              <div className="ring2" />
              <div className="ring1" />
              <div className="logo-glass">
                <PythonLogo size={28} />
              </div>
            </div>
            <h1 className="animated-gradient-title" style={{ margin: 0, fontSize: 'clamp(1.5rem,4.5vw,2.4rem)', fontWeight: 900, fontFamily: '"Space Grotesk",sans-serif', letterSpacing: '-1px' }}>
              PySkill Leaderboard
            </h1>
          </div>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem', margin: 0, fontWeight: 500, letterSpacing: 0.3 }}>
            Top performers across Python certification tests
          </p>
          {isAdmin && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', padding: '0.4rem 1rem', borderRadius: 20, fontSize: '0.8rem', fontWeight: 800, marginTop: 10 }}>
              <Crown size={14} /> ADMIN MODE
            </div>
          )}
        </div>

        {/* ── STATS ROW ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 12, marginBottom: 24, animation: 'fadeUp 0.5s 0.1s ease both' }}>
          {[
            { label: 'Total Attempts', value: tabEntries.length, icon: '📋', color: '#6366f1', bg: '#eef2ff' },
            { label: 'Passed', value: passCount, icon: '✅', color: '#10b981', bg: '#ecfdf5' },
            { label: 'Failed', value: tabEntries.length - passCount, icon: '❌', color: '#ef4444', bg: '#fef2f2' },
            { label: 'Top Score', value: topScore + '%', icon: '🏆', color: '#f59e0b', bg: '#fffbeb' },
            { label: 'Avg Score', value: avgScore + '%', icon: '📊', color: '#8b5cf6', bg: '#f5f3ff' },
          ].map((s, i) => (
            <div key={i} style={{ background: s.bg, borderRadius: 16, padding: '1rem', textAlign: 'center', border: `1.5px solid ${s.color}22` }}>
              <div style={{ fontSize: 20, marginBottom: 4 }}>{s.icon}</div>
              <div style={{ fontSize: 'clamp(1.3rem,3vw,1.7rem)', fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* ── TABS ── */}
        <div style={{ background: '#fff', borderRadius: 20, padding: 6, marginBottom: 20, boxShadow: '0 2px 16px rgba(0,0,0,0.07)', border: '1.5px solid #e2e8f0', display: 'flex', gap: 6, animation: 'fadeUp 0.5s 0.15s ease both' }}>
          {TABS.map(tab => (
            <button key={tab.key} className="tab-btn"
              onClick={() => { setActiveTab(tab.key); setSearchTerm(''); setFilterType('all'); }}
              style={{
                flex: 1, padding: 'clamp(0.6rem,2vw,0.9rem)', border: 'none', borderRadius: 14, cursor: 'pointer',
                fontWeight: 800, fontSize: 'clamp(0.82rem,2vw,1rem)', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                background: activeTab === tab.key ? tab.grad : 'transparent',
                color: activeTab === tab.key ? '#fff' : '#64748b',
                boxShadow: activeTab === tab.key ? `0 4px 16px ${tab.shadow}` : 'none',
              }}>
              {tab.emoji} {tab.label}
              <span style={{
                background: activeTab === tab.key ? 'rgba(255,255,255,0.25)' : '#f1f5f9',
                color: activeTab === tab.key ? '#fff' : '#94a3b8',
                borderRadius: 20, padding: '1px 8px', fontSize: '0.72rem', fontWeight: 800
              }}>
                {entries.filter(e => (e.testLevel || '').toLowerCase().trim() === tab.key).length}
              </span>
            </button>
          ))}
        </div>

        {/* ── FILTERS ── */}
        <div style={{ background: '#fff', borderRadius: 18, padding: '1rem 1.25rem', marginBottom: 20, boxShadow: '0 2px 16px rgba(0,0,0,0.07)', border: '1.5px solid #e2e8f0', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', animation: 'fadeUp 0.5s 0.2s ease both' }}>
          <div style={{ position: 'relative', flex: '1 1 220px' }}>
            <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <input className="search-input" type="text" placeholder="Search name or email..."
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '0.65rem 1rem 0.65rem 2.4rem', border: '2px solid #e2e8f0', borderRadius: 12, fontSize: '0.88rem', fontWeight: 600, fontFamily: 'inherit', background: '#f8fafc', boxSizing: 'border-box', transition: 'all 0.2s' }}
            />
          </div>
          <select value={filterType} onChange={e => setFilterType(e.target.value)}
            style={{ padding: '0.65rem 1rem', border: '2px solid #e2e8f0', borderRadius: 12, fontSize: '0.88rem', fontWeight: 700, fontFamily: 'inherit', background: '#f8fafc', cursor: 'pointer', flex: '0 0 auto' }}>
            <option value="all">All Results</option>
            <option value="passed">✅ Passed Only</option>
            <option value="failed">❌ Failed Only</option>
          </select>
          {isAdmin && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 'auto', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 700 }}>
                Showing <strong style={{ color: '#1e293b' }}>{filteredEntries.length}</strong> / {tabEntries.length}
              </span>
              <button onClick={handleClearAll}
                style={{ padding: '0.6rem 1rem', background: 'linear-gradient(135deg,#ef4444,#dc2626)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 12px rgba(239,68,68,0.3)', fontFamily: 'inherit' }}>
                <Trash2 size={14} /> Clear All
              </button>
            </div>
          )}
        </div>

        {/* ── ENTRIES ── */}
        {loading ? (
          <div style={{ background: '#fff', borderRadius: 20, padding: '3rem', textAlign: 'center', boxShadow: '0 2px 16px rgba(0,0,0,0.07)' }}>
            <div style={{ fontSize: 40, animation: 'shimmer 1s infinite', marginBottom: 12 }}>⏳</div>
            <p style={{ color: '#94a3b8', fontWeight: 700, margin: 0 }}>Loading entries...</p>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 20, padding: '4rem 2rem', textAlign: 'center', boxShadow: '0 2px 16px rgba(0,0,0,0.07)', border: '1.5px solid #e2e8f0' }}>
            <div style={{ fontSize: 56, marginBottom: 16 }}>🏁</div>
            <h3 style={{ color: '#1e293b', fontWeight: 800, margin: '0 0 8px', fontSize: '1.3rem' }}>No entries yet</h3>
            <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.95rem' }}>
              {searchTerm || filterType !== 'all'
                ? 'Try adjusting your filters'
                : `No one has completed the ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Python test yet!`}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filteredEntries.map((entry, index) => {
              const isTop3 = index < 3;
              const rankBg = index === 0 ? '#fffdf0' : index === 1 ? '#f5f3ff' : index === 2 ? '#fffaf5' : '#fff';
              const rankBorder = index === 0 ? '#fbbf24' : index === 1 ? '#818cf8' : index === 2 ? '#fb923c' : '#e2e8f0';

              return (
                <div key={entry.id} className="lb-card"
                  style={{ background: rankBg, border: `2px solid ${rankBorder}`, borderRadius: 18, padding: 'clamp(1rem,3vw,1.4rem)', boxShadow: '0 4px 16px rgba(0,0,0,0.07)', position: 'relative', animationDelay: `${index * 0.04}s` }}>

                  {/* Delete confirm overlay */}
                  {showDeleteConfirm === entry.id && (
                    <div style={{ position: 'absolute', inset: 0, background: 'rgba(15,23,42,0.92)', borderRadius: 18, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, zIndex: 10, padding: '1.5rem' }}>
                      <div style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 800, textAlign: 'center' }}>Delete this entry?</div>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <button onClick={() => handleDelete(entry.id)} style={{ padding: '0.6rem 1.4rem', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>Yes, Delete</button>
                        <button onClick={() => setShowDeleteConfirm(null)} style={{ padding: '0.6rem 1.4rem', background: '#475569', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 'clamp(0.75rem,2vw,1.5rem)', alignItems: 'center' }}>

                    {/* Rank */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: isTop3 ? 70 : 50 }}>
                      <RankMedal index={index} />
                    </div>

                    {/* Info */}
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                        <PythonLogo size={18} />
                        <span style={{ fontSize: isTop3 ? 'clamp(1.1rem,3vw,1.35rem)' : 'clamp(1rem,2.5vw,1.15rem)', fontWeight: 900, color: '#0f172a', fontFamily: '"Space Grotesk",sans-serif' }}>
                          {entry.name}
                        </span>
                        {entry.passed ? (
                          <span style={{ background: '#ecfdf5', color: '#065f46', padding: '3px 10px', borderRadius: 8, fontSize: '0.72rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 4, border: '1.5px solid #6ee7b7' }}>
                            <CheckCircle size={12} /> PASSED
                          </span>
                        ) : (
                          <span style={{ background: '#fef2f2', color: '#991b1b', padding: '3px 10px', borderRadius: 8, fontSize: '0.72rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 4, border: '1.5px solid #fca5a5' }}>
                            <XCircle size={12} /> FAILED
                          </span>
                        )}
                        {entry.penalized && (
                          <span style={{ background: '#fffbeb', color: '#92400e', padding: '3px 10px', borderRadius: 8, fontSize: '0.72rem', fontWeight: 800, border: '1.5px solid #fcd34d' }}>
                            ⚠️ PENALIZED
                          </span>
                        )}
                        <span style={{ background: currentTab.color + '18', color: currentTab.color, padding: '3px 10px', borderRadius: 8, fontSize: '0.72rem', fontWeight: 800, border: `1.5px solid ${currentTab.color}44`, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <PythonLogo size={11} /> {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={13} />{entry.date}</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={13} />{entry.timeTaken}</span>
                      </div>
                    </div>

                    {/* Score + delete */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ textAlign: 'center', background: entry.passed ? 'linear-gradient(135deg,#10b981,#059669)' : 'linear-gradient(135deg,#ef4444,#dc2626)', color: '#fff', padding: isTop3 ? '0.9rem 1.1rem' : '0.75rem 0.9rem', borderRadius: 14, minWidth: 80, boxShadow: entry.passed ? '0 6px 20px rgba(16,185,129,0.3)' : '0 6px 20px rgba(239,68,68,0.3)' }}>
                        <div style={{ fontSize: isTop3 ? '2rem' : '1.7rem', fontWeight: 900, lineHeight: 1, fontFamily: '"Space Grotesk",sans-serif' }}>{entry.percentage}%</div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.9, marginTop: 3 }}>{entry.score}</div>
                      </div>
                      {isAdmin && (
                        <button className="del-btn" onClick={() => setShowDeleteConfirm(entry.id)}
                          style={{ padding: '0.65rem', background: '#fef2f2', border: '2px solid #fca5a5', borderRadius: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                          <Trash2 size={16} color="#ef4444" />
                        </button>
                      )}
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}

export { LeaderboardStorage };