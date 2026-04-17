import React, { useState, useEffect, useRef } from 'react';
import { Trash2, Search, Crown, CheckCircle, XCircle, Calendar, Clock } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { useTheme } from '../App';

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
function RankMedal({ index, isMobile }) {
  const sz = isMobile ? 36 : 46;
  if (index === 0) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
      <div style={{ width: sz, height: sz, borderRadius: '50%', background: 'linear-gradient(135deg,#FFD700,#FFA500)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isMobile ? 18 : 22, boxShadow: '0 4px 16px rgba(255,215,0,0.5)', border: '2px solid #FFD700', flexShrink: 0 }}>👑</div>
      <span style={{ fontSize: isMobile ? 9 : 10, fontWeight: 800, color: '#B8860B', letterSpacing: 0.5, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Champion</span>
    </div>
  );
  if (index === 1) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
      <div style={{ width: sz - 4, height: sz - 4, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isMobile ? 16 : 20, boxShadow: '0 4px 14px rgba(99,102,241,0.5)', border: '2px solid #818cf8', flexShrink: 0 }}>🏅</div>
      <span style={{ fontSize: isMobile ? 9 : 10, fontWeight: 800, color: '#4f46e5', letterSpacing: 0.5, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Runner-up</span>
    </div>
  );
  if (index === 2) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
      <div style={{ width: sz - 6, height: sz - 6, borderRadius: '50%', background: 'linear-gradient(135deg,#CD7F32,#A0522D)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isMobile ? 15 : 18, boxShadow: '0 4px 12px rgba(205,127,50,0.5)', border: '2px solid #CD7F32', flexShrink: 0 }}>🥉</div>
      <span style={{ fontSize: isMobile ? 9 : 10, fontWeight: 800, color: '#8B4513', letterSpacing: 0.5, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>3rd</span>
    </div>
  );
  return (
    <div style={{ width: isMobile ? 32 : 38, height: isMobile ? 32 : 38, borderRadius: '50%', background: 'rgba(148,163,184,0.15)', border: '2px solid rgba(148,163,184,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isMobile ? 11 : 13, fontWeight: 900, color: '#64748b', flexShrink: 0 }}>
      #{index + 1}
    </div>
  );
}

// ==========================================
// 🎨 MAIN LEADERBOARD
// ==========================================
export default function Leaderboard({ userEmail }) {
  const { isDark } = useTheme();
  const [entries, setEntries] = useState([]);
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [activeTab, setActiveTab] = useState('basic');
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' ? window.innerWidth <= 768 : false);
  const entriesRef = useRef([]);

  const isAdmin = userEmail === CONFIG.ADMIN_EMAIL;
  const currentTab = TABS.find(t => t.key === activeTab);

  useEffect(() => {
    let t;
    const h = () => { clearTimeout(t); t = setTimeout(() => setIsMobile(window.innerWidth <= 768), 150); };
    window.addEventListener('resize', h, { passive: true });
    return () => { window.removeEventListener('resize', h); clearTimeout(t); };
  }, []);

  useEffect(() => {
    loadEntries(true);
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

  // ── Shared glass card style (matches HomePage)
  const glassCard = {
    background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.22)',
    border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.5)',
    backdropFilter: 'blur(0px)',
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'transparent', // Let canvas background show through
      paddingTop: isMobile ? 90 : 100,
      paddingBottom: 48,
      fontFamily: '"DM Sans", system-ui, sans-serif',
      position: 'relative',
      zIndex: 1,
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800;900&family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800;12..96,900&display=swap');

        @keyframes fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes shimmer { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
        @keyframes gradientFlow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes spin1 { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes spin2 { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }
        @keyframes spin3 { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulseGlow { 0%,100% { opacity: 0.6; } 50% { opacity: 1; } }

        .lb-ring1 {
          position: absolute; width: 62px; height: 62px;
          top: 50%; left: 50%; margin: -31px 0 0 -31px;
          border-radius: 50%;
          border: 2px solid transparent;
          border-top-color: #6366f1; border-right-color: #8b5cf6;
          animation: spin1 2.5s linear infinite; pointer-events: none;
        }
        .lb-ring2 {
          position: absolute; width: 74px; height: 74px;
          top: 50%; left: 50%; margin: -37px 0 0 -37px;
          border-radius: 50%;
          border: 1.5px solid transparent;
          border-top-color: #ec4899; border-bottom-color: #f59e0b;
          animation: spin2 3.5s linear infinite; pointer-events: none;
        }
        .lb-ring3 {
          position: absolute; width: 86px; height: 86px;
          top: 50%; left: 50%; margin: -43px 0 0 -43px;
          border-radius: 50%;
          border: 1px dashed rgba(16,185,129,0.55);
          animation: spin3 5s linear infinite, pulseGlow 2s ease-in-out infinite;
          pointer-events: none;
        }
        .lb-card { animation: fadeUp 0.4s ease both; }
        .lb-card:hover { transform: translateY(-2px); }
        .lb-tab { transition: all 0.25s cubic-bezier(0.34,1.56,0.64,1); cursor: pointer; }
        .lb-tab:hover { transform: translateY(-1px); }
        .lb-del:hover { transform: scale(1.12); }
        .lb-search:focus { outline: none; }
        .animated-gradient-title {
          background: linear-gradient(270deg, #6366f1, #8b5cf6, #ec4899, #f59e0b, #10b981, #3b82f6, #6366f1);
          background-size: 400% 400%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: gradientFlow 4s ease infinite;
        }
      `}</style>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 16px' }}>

        {/* ── HEADER ── */}
        <div style={{ textAlign: 'center', marginBottom: isMobile ? 24 : 32, animation: 'fadeUp 0.5s ease' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: isMobile ? 12 : 18, marginBottom: 8 }}>
            {/* Spinning logo */}
            <div style={{ position: 'relative', width: 52, height: 52, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="lb-ring3" />
              <div className="lb-ring2" />
              <div className="lb-ring1" />
              <div style={{
                width: 52, height: 52, borderRadius: '50%',
                background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.35)',
                border: isDark ? '1.5px solid rgba(99,102,241,0.3)' : '1.5px solid rgba(99,102,241,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 2
              }}>
                <PythonLogo size={28} />
              </div>
            </div>
            <h1 className="animated-gradient-title" style={{
              margin: 0,
              fontSize: isMobile ? 'clamp(1.3rem,5.5vw,1.7rem)' : 'clamp(1.5rem,4.5vw,2.4rem)',
              fontWeight: 900, fontFamily: '"Bricolage Grotesque",sans-serif', letterSpacing: '-1px'
            }}>
              PySkill Leaderboard
            </h1>
          </div>
          <p style={{ color: isDark ? '#64748b' : '#6b7280', fontSize: '0.88rem', margin: 0, fontWeight: 500 }}>
            Top performers across Python certification tests
          </p>
          {isAdmin && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', padding: '0.4rem 1rem', borderRadius: 20, fontSize: '0.78rem', fontWeight: 800, marginTop: 10 }}>
              <Crown size={13} /> ADMIN MODE
            </div>
          )}
        </div>

        {/* ── STATS ROW ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(5, 1fr)',
          gap: isMobile ? 8 : 12,
          marginBottom: isMobile ? 16 : 24,
          animation: 'fadeUp 0.5s 0.1s ease both'
        }}>
          {[
            { label: 'Attempts', value: tabEntries.length, icon: '📋', color: '#6366f1' },
            { label: 'Passed', value: passCount, icon: '✅', color: '#10b981' },
            { label: 'Failed', value: tabEntries.length - passCount, icon: '❌', color: '#ef4444' },
            { label: 'Top Score', value: topScore + '%', icon: '🏆', color: '#f59e0b' },
            { label: 'Avg Score', value: avgScore + '%', icon: '📊', color: '#8b5cf6' },
          ].map((s, i) => (
            <div key={i} style={{
              ...glassCard,
              borderRadius: 16, padding: isMobile ? '10px 6px' : '14px 8px',
              textAlign: 'center',
              // hide last 2 on mobile to keep it 3-column clean
              display: (isMobile && i > 2) ? 'none' : 'block',
            }}>
              <div style={{ fontSize: isMobile ? 16 : 20, marginBottom: 3 }}>{s.icon}</div>
              <div style={{ fontSize: isMobile ? '1.15rem' : '1.6rem', fontWeight: 900, color: s.color, lineHeight: 1, fontFamily: '"Bricolage Grotesque",sans-serif' }}>{s.value}</div>
              <div style={{ fontSize: isMobile ? '0.6rem' : '0.68rem', fontWeight: 700, color: isDark ? '#64748b' : '#6b7280', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Mobile: show remaining 2 stats */}
        {isMobile && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 16 }}>
            {[
              { label: 'Top Score', value: topScore + '%', icon: '🏆', color: '#f59e0b' },
              { label: 'Avg Score', value: avgScore + '%', icon: '📊', color: '#8b5cf6' },
            ].map((s, i) => (
              <div key={i} style={{ ...glassCard, borderRadius: 16, padding: '10px 6px', textAlign: 'center' }}>
                <div style={{ fontSize: 16, marginBottom: 3 }}>{s.icon}</div>
                <div style={{ fontSize: '1.15rem', fontWeight: 900, color: s.color, lineHeight: 1, fontFamily: '"Bricolage Grotesque",sans-serif' }}>{s.value}</div>
                <div style={{ fontSize: '0.6rem', fontWeight: 700, color: isDark ? '#64748b' : '#6b7280', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* ── TABS ── */}
        <div style={{
          ...glassCard,
          borderRadius: 20, padding: 6, marginBottom: 14,
          display: 'flex', gap: 6, animation: 'fadeUp 0.5s 0.15s ease both'
        }}>
          {TABS.map(tab => (
            <button key={tab.key} className="lb-tab"
              onClick={() => { setActiveTab(tab.key); setSearchTerm(''); setFilterType('all'); }}
              style={{
                flex: 1, padding: isMobile ? '10px 6px' : '12px 10px',
                border: 'none', borderRadius: 14, cursor: 'pointer',
                fontWeight: 800, fontSize: isMobile ? '0.78rem' : '0.92rem', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: isMobile ? 4 : 8,
                background: activeTab === tab.key ? tab.grad : 'transparent',
                color: activeTab === tab.key ? '#fff' : (isDark ? '#94a3b8' : '#64748b'),
                boxShadow: activeTab === tab.key ? `0 4px 16px ${tab.shadow}` : 'none',
                transition: 'all 0.25s cubic-bezier(0.34,1.56,0.64,1)',
              }}>
              <span>{tab.emoji}</span>
              {!isMobile && tab.label}
              {isMobile && <span style={{ fontSize: '0.7rem' }}>{tab.label}</span>}
              <span style={{
                background: activeTab === tab.key ? 'rgba(255,255,255,0.25)' : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'),
                color: activeTab === tab.key ? '#fff' : (isDark ? '#94a3b8' : '#6b7280'),
                borderRadius: 20, padding: '1px 7px', fontSize: '0.68rem', fontWeight: 800
              }}>
                {entries.filter(e => (e.testLevel || '').toLowerCase().trim() === tab.key).length}
              </span>
            </button>
          ))}
        </div>

        {/* ── FILTERS ── */}
        <div style={{
          ...glassCard,
          borderRadius: 18, padding: isMobile ? '12px' : '14px 18px',
          marginBottom: 16,
          display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center',
          animation: 'fadeUp 0.5s 0.2s ease both'
        }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: '1 1 180px', minWidth: 0 }}>
            <Search size={15} color={isDark ? '#64748b' : '#94a3b8'} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <input className="lb-search" type="text" placeholder="Search name..."
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              style={{
                width: '100%', padding: '0.6rem 0.9rem 0.6rem 2.2rem',
                border: isDark ? '1.5px solid rgba(255,255,255,0.12)' : '1.5px solid rgba(0,0,0,0.1)',
                borderRadius: 12, fontSize: '0.84rem', fontWeight: 600, fontFamily: 'inherit',
                background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.5)',
                color: isDark ? '#e2e8f0' : '#1e293b',
                boxSizing: 'border-box', transition: 'all 0.2s'
              }}
            />
          </div>

          {/* Filter select */}
          <select value={filterType} onChange={e => setFilterType(e.target.value)}
            style={{
              padding: '0.6rem 0.9rem',
              border: isDark ? '1.5px solid rgba(255,255,255,0.12)' : '1.5px solid rgba(0,0,0,0.1)',
              borderRadius: 12, fontSize: '0.82rem', fontWeight: 700, fontFamily: 'inherit',
              background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.5)',
              color: isDark ? '#e2e8f0' : '#1e293b',
              cursor: 'pointer', flex: '0 0 auto'
            }}>
            <option value="all">All</option>
            <option value="passed">✅ Passed</option>
            <option value="failed">❌ Failed</option>
          </select>

          {isAdmin && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginLeft: 'auto', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.78rem', color: isDark ? '#64748b' : '#94a3b8', fontWeight: 700 }}>
                <strong style={{ color: isDark ? '#e2e8f0' : '#1e293b' }}>{filteredEntries.length}</strong> / {tabEntries.length}
              </span>
              <button onClick={handleClearAll} className="lb-del"
                style={{
                  padding: '0.55rem 0.9rem', background: 'linear-gradient(135deg,#ef4444,#dc2626)',
                  color: '#fff', border: 'none', borderRadius: 10, fontWeight: 800, fontSize: '0.78rem',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5,
                  boxShadow: '0 4px 12px rgba(239,68,68,0.3)', fontFamily: 'inherit',
                  transition: 'transform 0.2s',
                }}>
                <Trash2 size={13} /> Clear All
              </button>
            </div>
          )}
        </div>

        {/* ── ENTRIES ── */}
        {loading ? (
          <div style={{
            ...glassCard,
            borderRadius: 20, padding: '3rem', textAlign: 'center'
          }}>
            <div style={{ fontSize: 36, animation: 'shimmer 1s infinite', marginBottom: 10 }}>⏳</div>
            <p style={{ color: isDark ? '#64748b' : '#94a3b8', fontWeight: 700, margin: 0 }}>Loading entries...</p>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div style={{
            ...glassCard,
            borderRadius: 20, padding: '4rem 2rem', textAlign: 'center'
          }}>
            <div style={{ fontSize: 52, marginBottom: 14 }}>🏁</div>
            <h3 style={{ color: isDark ? '#e2e8f0' : '#1e293b', fontWeight: 800, margin: '0 0 8px', fontSize: '1.2rem' }}>No entries yet</h3>
            <p style={{ color: isDark ? '#64748b' : '#94a3b8', margin: 0, fontSize: '0.9rem' }}>
              {searchTerm || filterType !== 'all'
                ? 'Try adjusting your filters'
                : `No one has completed the ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Python test yet!`}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 8 : 10 }}>
            {filteredEntries.map((entry, index) => {
              const isTop3 = index < 3;
              const rankAccent = index === 0 ? '#f59e0b' : index === 1 ? '#818cf8' : index === 2 ? '#fb923c' : null;

              return (
                <div key={entry.id} className="lb-card"
                  style={{
                    background: isDark
                      ? (isTop3 ? `rgba(255,255,255,0.09)` : 'rgba(255,255,255,0.06)')
                      : (isTop3 ? 'rgba(255,255,255,0.32)' : 'rgba(255,255,255,0.22)'),
                    border: rankAccent
                      ? `1.5px solid ${rankAccent}45`
                      : (isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.5)'),
                    borderRadius: isMobile ? 16 : 20,
                    padding: isMobile ? '12px' : '16px 20px',
                    boxShadow: isTop3
                      ? (isDark ? `0 4px 24px ${rankAccent}20` : `0 4px 24px ${rankAccent}18`)
                      : 'none',
                    position: 'relative',
                    animationDelay: `${index * 0.04}s`,
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    overflow: 'visible',
                  }}>

                  {/* Top accent line for top 3 */}
                  {isTop3 && rankAccent && (
                    <div style={{
                      position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                      background: `linear-gradient(90deg, ${rankAccent}, ${rankAccent}40, transparent)`,
                      borderRadius: '20px 20px 0 0'
                    }} />
                  )}

                  {/* Delete confirm overlay */}
                  {showDeleteConfirm === entry.id && (
                    <div style={{
                      position: 'absolute', inset: 0,
                      background: 'rgba(15,23,42,0.92)', borderRadius: isMobile ? 16 : 20,
                      display: 'flex', flexDirection: 'column', alignItems: 'center',
                      justifyContent: 'center', gap: 14, zIndex: 10, padding: '1.5rem'
                    }}>
                      <div style={{ color: '#fff', fontSize: '1rem', fontWeight: 800, textAlign: 'center' }}>Delete this entry?</div>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <button onClick={() => handleDelete(entry.id)} style={{ padding: '0.55rem 1.2rem', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>Yes, Delete</button>
                        <button onClick={() => setShowDeleteConfirm(null)} style={{ padding: '0.55rem 1.2rem', background: '#475569', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
                      </div>
                    </div>
                  )}

                  {/* ── CARD LAYOUT ── */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: isMobile ? 10 : 16,
                  }}>

                    {/* Rank medal — fixed width, no shrink */}
                    <div style={{ flexShrink: 0, width: isMobile ? 44 : 60, display: 'flex', justifyContent: 'center' }}>
                      <RankMedal index={index} isMobile={isMobile} />
                    </div>

                    {/* Middle info — takes all remaining space */}
                    <div style={{ flex: 1, minWidth: 0 }}>

                      {/* Name row */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 6 }}>
                        <PythonLogo size={isMobile ? 15 : 18} />
                        <span style={{
                          fontSize: isMobile ? '0.95rem' : '1.1rem',
                          fontWeight: 900, color: isDark ? '#f1f5f9' : '#0f172a',
                          fontFamily: '"Bricolage Grotesque",sans-serif',
                          wordBreak: 'break-word'
                        }}>
                          {entry.name}
                        </span>
                      </div>

                      {/* Badge row */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 6 }}>
                        {entry.passed ? (
                          <span style={{
                            background: 'rgba(16,185,129,0.12)', color: '#065f46',
                            padding: '2px 8px', borderRadius: 7, fontSize: '0.66rem', fontWeight: 800,
                            display: 'flex', alignItems: 'center', gap: 3,
                            border: '1px solid rgba(110,231,183,0.4)'
                          }}>
                            <CheckCircle size={10} /> PASSED
                          </span>
                        ) : (
                          <span style={{
                            background: 'rgba(239,68,68,0.1)', color: '#991b1b',
                            padding: '2px 8px', borderRadius: 7, fontSize: '0.66rem', fontWeight: 800,
                            display: 'flex', alignItems: 'center', gap: 3,
                            border: '1px solid rgba(252,165,165,0.4)'
                          }}>
                            <XCircle size={10} /> FAILED
                          </span>
                        )}
                        {entry.penalized && (
                          <span style={{
                            background: 'rgba(251,191,36,0.12)', color: '#92400e',
                            padding: '2px 8px', borderRadius: 7, fontSize: '0.66rem', fontWeight: 800,
                            border: '1px solid rgba(252,211,77,0.4)'
                          }}>⚠️ PENALIZED</span>
                        )}
                        <span style={{
                          background: `${currentTab.color}18`, color: currentTab.color,
                          padding: '2px 8px', borderRadius: 7, fontSize: '0.66rem', fontWeight: 800,
                          border: `1px solid ${currentTab.color}35`,
                          display: 'flex', alignItems: 'center', gap: 3
                        }}>
                          <PythonLogo size={10} /> {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                        </span>
                      </div>

                      {/* Date & time */}
                      <div style={{
                        display: 'flex', flexWrap: 'wrap', gap: isMobile ? 8 : 14,
                        fontSize: isMobile ? '0.72rem' : '0.8rem',
                        color: isDark ? '#64748b' : '#6b7280', fontWeight: 600
                      }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                          <Calendar size={11} />{entry.date}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                          <Clock size={11} />{entry.timeTaken}
                        </span>
                      </div>
                    </div>

                    {/* Score badge — fixed width, right side, NO overflow */}
                    <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        textAlign: 'center',
                        background: entry.passed
                          ? 'linear-gradient(135deg,#10b981,#059669)'
                          : 'linear-gradient(135deg,#ef4444,#dc2626)',
                        color: '#fff',
                        padding: isMobile ? '8px 10px' : '10px 14px',
                        borderRadius: isMobile ? 12 : 14,
                        minWidth: isMobile ? 62 : 76,
                        boxShadow: entry.passed
                          ? '0 4px 16px rgba(16,185,129,0.3)'
                          : '0 4px 16px rgba(239,68,68,0.3)',
                      }}>
                        <div style={{
                          fontSize: isMobile ? '1.35rem' : '1.75rem',
                          fontWeight: 900, lineHeight: 1,
                          fontFamily: '"Bricolage Grotesque",sans-serif'
                        }}>{entry.percentage}%</div>
                        <div style={{ fontSize: isMobile ? '0.62rem' : '0.7rem', fontWeight: 700, opacity: 0.9, marginTop: 2 }}>
                          {entry.score}
                        </div>
                      </div>

                      {isAdmin && (
                        <button className="lb-del" onClick={() => setShowDeleteConfirm(entry.id)}
                          style={{
                            padding: isMobile ? '7px' : '9px',
                            background: 'rgba(239,68,68,0.1)',
                            border: '1.5px solid rgba(252,165,165,0.4)',
                            borderRadius: 10, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'transform 0.18s ease', flexShrink: 0
                          }}>
                          <Trash2 size={isMobile ? 14 : 16} color="#ef4444" />
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