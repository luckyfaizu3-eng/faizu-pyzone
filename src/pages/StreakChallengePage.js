import React, { useState, useEffect } from 'react';
import {
  getStreakPrice,
  getLeaderboard, updateUserProfile, createStreakUser, getStreakUser,
} from '../streakService';
import { useGeo } from '../App';
import PythonLogo from './PythonLogo';

const ADMIN_EMAIL = 'luckyfaizu3@gmail.com';

// ─────────────────────────────────────────────────────────────────────────────
// STREAK CHALLENGE PAGE
// ─────────────────────────────────────────────────────────────────────────────
const StreakChallengePage = ({ isDark, user, setCurrentPage, onBuy }) => {
  const [animIn,      setAnimIn]      = useState(false);
  const [mobile,      setMobile]      = useState(window.innerWidth <= 768);
  const [price,       setPrice]       = useState(99);
  const [leaderboard, setLeaderboard] = useState([]);
  const [lbLoading,   setLbLoading]   = useState(true);
  const [lbTab,       setLbTab]       = useState('all'); // all | today | week

  // Pre-purchase form
  const [showForm,    setShowForm]    = useState(false);
  const [formName,    setFormName]    = useState('');
  const [formPhone,   setFormPhone]   = useState('');
  const [formCity,    setFormCity]    = useState('');
  const [formError,   setFormError]   = useState('');
  const [formSaving,  setFormSaving]  = useState(false);

  // Live ticker
  const [tickerIdx,   setTickerIdx]   = useState(0);

  const { geoData, isIndia } = useGeo();

  const isAdmin      = user?.email === ADMIN_EMAIL;
  const uid          = user?.uid;
  const hasPurchased = uid
    ? (localStorage.getItem(`streak_purchased_${uid}`) || false)
    : false;

  const cardBg      = isDark ? 'rgba(255,255,255,0.05)' : '#ffffff';
  const border      = isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.07)';
  const textPrimary = isDark ? '#f0f2ff' : '#111827';
  const textSec     = isDark ? '#8b93a8' : '#6b7280';

  // ── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    setTimeout(() => setAnimIn(true), 100);
    const h = () => setMobile(window.innerWidth <= 768);
    window.addEventListener('resize', h);
    getStreakPrice().then(p => setPrice(p));
    loadLeaderboard();
    return () => window.removeEventListener('resize', h);
  }, []); // eslint-disable-line

  // Live ticker rotation
  useEffect(() => {
    const t = setInterval(() => setTickerIdx(i => i + 1), 3000);
    return () => clearInterval(t);
  }, []);

  const loadLeaderboard = async () => {
    setLbLoading(true);
    const lb = await getLeaderboard();
    setLeaderboard(lb);
    setLbLoading(false);
  };

  // ── Pre-purchase form submit ───────────────────────────────────────────────
  const handleFormSubmit = async () => {
    setFormError('');
    if (!formName.trim())                        { setFormError('Please enter your full name'); return; }
    if (!/^[6-9]\d{9}$/.test(formPhone.trim()))  { setFormError('Enter a valid 10-digit phone number'); return; }
    if (!formCity.trim())                        { setFormError('Please enter your city'); return; }

    setFormSaving(true);
    try {
      if (uid) {
        let streakUser = await getStreakUser(uid);
        if (!streakUser) {
          await createStreakUser(uid, user.email, formName.trim(), {
            phone: formPhone.trim(),
            city:  formCity.trim(),
          });
        } else {
          await updateUserProfile(uid, {
            name:  formName.trim(),
            phone: formPhone.trim(),
            city:  formCity.trim(),
          });
        }
      }
      // Proceed to payment
      setShowForm(false);
      if (onBuy) onBuy(price);
    } catch (e) {
      console.error(e);
      setFormError('Something went wrong. Please try again.');
    }
    setFormSaving(false);
  };

  const handleBuy = () => {
    if (!user) {
      window.showToast?.('Please login first!', 'warning');
      setCurrentPage('login');
      return;
    }
    // Show pre-purchase form first
    setShowForm(true);
  };

  // ── Leaderboard filter ─────────────────────────────────────────────────────
  const today     = new Date().toISOString().slice(0, 10);
  const weekAgo   = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);

  const filteredLB = leaderboard.filter(e => {
    if (lbTab === 'today') return e.lastActive === today;
    if (lbTab === 'week')  return e.lastActive >= weekAgo;
    return true;
  }).slice(0, 20); // top 20

  // ── Ticker messages ────────────────────────────────────────────────────────
  const tickerNames  = leaderboard.slice(0, 10).map(e => e.name).filter(Boolean);
  const tickerEvents = [
    ...tickerNames.map(n => `${n} completed today's practice`),
    `${leaderboard.length} challengers active right now`,
    `${leaderboard.filter(e => e.totalDays >= 30).length} students completed 30 days`,
    'New batch starting soon — limited seats',
    `${leaderboard.filter(e => e.lastActive === today).length} students practiced today`,
  ].filter(Boolean);
  const currentTicker = tickerEvents.length
    ? tickerEvents[tickerIdx % tickerEvents.length]
    : 'Join the challenge today!';

  // ── Static content ─────────────────────────────────────────────────────────
  const features = [
    { icon: <PythonLogo size={mobile ? 28 : 36} />, title: 'Daily 15 Questions', desc: 'AI-generated fresh Python questions every day' },
    { icon: '🔥', title: '30-Day Streak',       desc: 'Miss a day — restore for Rs.29 or start over' },
    { icon: '📊', title: 'PDF Report',          desc: 'Strong & weak topics after 30 days' },
    { icon: '🏆', title: 'Leaderboard',         desc: 'Compete with 100s of students live' },
    { icon: '🤖', title: 'Zehra AI',            desc: 'AI generates unique questions daily' },
    { icon: '🛡️', title: 'Anti-Cheat',          desc: 'Tab switch detection + watermark system' },
  ];

  const topics = [
    'Variables & Data Types', 'Loops & Conditions', 'Functions',
    'OOP Concepts', 'File Handling', 'Exception Handling',
    'List Comprehensions', 'Decorators', 'APIs & JSON', 'Machine Learning',
  ];

  const steps = [
    { step: '1', label: `Pay Rs.${price}`,    desc: 'One-time, instant access' },
    { step: '2', label: 'Daily Practice',     desc: '15 AI questions, 6AM–11PM window' },
    { step: '3', label: 'Track Streak',       desc: "Don't miss 30 days" },
    { step: '4', label: 'Get PDF Report',     desc: 'Download your 30-day result' },
  ];

  // ── Pre-purchase form modal ────────────────────────────────────────────────
  if (showForm) return (
    <div style={{ minHeight: '100vh', background: isDark ? 'linear-gradient(160deg,#060b14,#0d1117)' : 'linear-gradient(160deg,#f5f7ff,#ffffff)', fontFamily: "'Syne',sans-serif", color: textPrimary, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', boxSizing: 'border-box' }}>
      <div style={{ width: '100%', maxWidth: '440px' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>📝</div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '900', margin: '0 0 6px' }}>Almost There!</h2>
          <p style={{ color: textSec, fontSize: '0.85rem', margin: 0 }}>
            Tell us about yourself before joining the challenge
          </p>
        </div>

        <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: '20px', padding: mobile ? '22px 18px' : '30px' }}>

          {/* Name */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: '700', color: textSec, display: 'block', marginBottom: '6px' }}>
              Full Name *
            </label>
            <input
              value={formName}
              onChange={e => setFormName(e.target.value)}
              placeholder="e.g. Faiz Ahmed"
              style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px', background: isDark ? 'rgba(255,255,255,0.05)' : '#f9fafb', border: `1px solid ${formError && !formName ? 'rgba(239,68,68,0.5)' : border}`, borderRadius: '12px', fontSize: '0.95rem', fontWeight: '600', color: textPrimary, outline: 'none', fontFamily: 'inherit' }}
            />
          </div>

          {/* Phone */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: '700', color: textSec, display: 'block', marginBottom: '6px' }}>
              Phone Number * <span style={{ color: textSec, fontWeight: '400' }}>(used for your certificate watermark)</span>
            </label>
            <input
              value={formPhone}
              onChange={e => setFormPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
              placeholder="10-digit mobile number"
              type="tel"
              style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px', background: isDark ? 'rgba(255,255,255,0.05)' : '#f9fafb', border: `1px solid ${border}`, borderRadius: '12px', fontSize: '0.95rem', fontWeight: '600', color: textPrimary, outline: 'none', fontFamily: 'inherit' }}
            />
          </div>

          {/* City */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: '700', color: textSec, display: 'block', marginBottom: '6px' }}>
              City * <span style={{ color: textSec, fontWeight: '400' }}>(shown on leaderboard)</span>
            </label>
            <input
              value={formCity}
              onChange={e => setFormCity(e.target.value)}
              placeholder="e.g. Srinagar"
              style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px', background: isDark ? 'rgba(255,255,255,0.05)' : '#f9fafb', border: `1px solid ${border}`, borderRadius: '12px', fontSize: '0.95rem', fontWeight: '600', color: textPrimary, outline: 'none', fontFamily: 'inherit' }}
            />
          </div>

          {/* Error */}
          {formError && (
            <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', fontSize: '0.82rem', color: '#ef4444', fontWeight: '600', marginBottom: '14px' }}>
              {formError}
            </div>
          )}

          {/* Note */}
          <div style={{ background: isDark ? 'rgba(255,107,0,0.08)' : 'rgba(255,107,0,0.05)', border: '1px solid rgba(255,107,0,0.2)', borderRadius: '10px', padding: '10px 14px', marginBottom: '18px', fontSize: '0.75rem', color: textSec }}>
            Your name and city will appear on the public leaderboard. Phone last 4 digits used for quiz watermark to prevent cheating.
          </div>

          {/* Buttons */}
          <button
            onClick={handleFormSubmit}
            disabled={formSaving}
            style={{ width: '100%', padding: '14px', background: formSaving ? '#6b7280' : 'linear-gradient(135deg,#ff6b00,#ff3d00)', color: '#fff', border: 'none', borderRadius: '12px', fontSize: '1rem', fontWeight: '800', cursor: formSaving ? 'wait' : 'pointer', boxShadow: '0 8px 24px rgba(255,107,0,0.4)', marginBottom: '10px' }}
          >
            {formSaving ? 'Saving...' : `Continue to Payment — Rs.${price}`}
          </button>
          <button
            onClick={() => setShowForm(false)}
            style={{ width: '100%', padding: '12px', background: 'transparent', color: textSec, border: `1px solid ${border}`, borderRadius: '12px', fontSize: '0.88rem', fontWeight: '700', cursor: 'pointer' }}
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );

  // ── Main page ──────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: isDark ? 'linear-gradient(160deg,#060b14 0%,#0d1117 50%,#0a0f1e 100%)' : 'linear-gradient(160deg,#f5f7ff 0%,#ffffff 50%,#fffaf5 100%)', fontFamily: "'Syne',sans-serif", color: textPrimary, paddingTop: mobile ? '90px' : '80px', paddingBottom: '60px', paddingLeft: mobile ? '14px' : '24px', paddingRight: mobile ? '14px' : '24px', boxSizing: 'border-box', overflowX: 'hidden' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto', width: '100%' }}>

        {/* LIVE TICKER */}
        <div style={{ background: isDark ? 'rgba(255,107,0,0.1)' : 'rgba(255,107,0,0.07)', border: '1px solid rgba(255,107,0,0.25)', borderRadius: '30px', padding: '7px 18px', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ff6b00', flexShrink: 0, animation: 'pulse 1.5s ease-in-out infinite' }} />
          <span style={{ fontSize: '0.75rem', color: '#ff6b00', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            LIVE — {currentTicker}
          </span>
          <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
        </div>

        {/* BADGE */}
        <div style={{ textAlign: 'center', marginBottom: '12px', opacity: animIn ? 1 : 0, transition: 'all 0.5s ease' }}>
          <span style={{ display: 'inline-block', background: 'linear-gradient(135deg,#ff6b00,#ff3d00)', color: '#fff', padding: mobile ? '5px 14px' : '6px 22px', borderRadius: '30px', fontSize: mobile ? '0.62rem' : '0.78rem', fontWeight: '800', letterSpacing: '1.5px', textTransform: 'uppercase', boxShadow: '0 4px 16px rgba(255,100,0,0.35)' }}>
            🔥 30-Day Python Streak Challenge
          </span>
        </div>

        {/* TITLE */}
        <h1 style={{ textAlign: 'center', fontSize: mobile ? '1.7rem' : '3rem', fontWeight: '900', lineHeight: '1.2', marginBottom: '10px', marginTop: 0, opacity: animIn ? 1 : 0, transition: 'all 0.6s ease 0.1s', background: 'linear-gradient(135deg,#ff6b00 0%,#f59e0b 50%,#6366f1 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Practice Daily.<br />Master Python in 30 Days.
        </h1>

        {/* SUBTITLE */}
        <p style={{ textAlign: 'center', fontSize: mobile ? '0.85rem' : '1rem', color: textSec, maxWidth: '500px', margin: '0 auto 8px', lineHeight: '1.6', opacity: animIn ? 1 : 0, transition: 'all 0.6s ease 0.2s' }}>
          15 AI-generated Python questions every day for 30 days — powered by Zehra AI.
          Get a detailed PDF report, track your streak, and compete on the live leaderboard.
        </p>

        {/* Social proof */}
        <div style={{ textAlign: 'center', marginBottom: '24px', opacity: animIn ? 1 : 0, transition: 'all 0.6s ease 0.25s' }}>
          <span style={{ fontSize: '0.78rem', color: textSec }}>
            <strong style={{ color: '#ff6b00' }}>{leaderboard.length}</strong> challengers active •{' '}
            <strong style={{ color: '#22c55e' }}>{leaderboard.filter(e => e.totalDays >= 30).length}</strong> completed 30 days •{' '}
            <strong style={{ color: '#6366f1' }}>{leaderboard.filter(e => e.lastActive === today).length}</strong> practiced today
          </span>
        </div>

        {/* PRICE CARD */}
        <div style={{ background: isDark ? 'linear-gradient(135deg,rgba(255,107,0,0.13),rgba(99,102,241,0.1))' : 'linear-gradient(135deg,rgba(255,107,0,0.07),rgba(99,102,241,0.05))', border: `2px solid ${isDark ? 'rgba(255,107,0,0.28)' : 'rgba(255,107,0,0.18)'}`, borderRadius: '20px', padding: mobile ? '22px 16px' : '36px 50px', textAlign: 'center', marginBottom: '28px', boxShadow: '0 16px 50px rgba(255,107,0,0.12)', opacity: animIn ? 1 : 0, transition: 'all 0.7s ease 0.3s' }}>
          <div style={{ fontSize: '0.72rem', color: textSec, marginBottom: '6px', letterSpacing: '1px', textTransform: 'uppercase' }}>One-Time Payment</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '6px' }}>
            <span style={{ fontSize: '1rem', color: textSec, textDecoration: 'line-through' }}>Rs.{price * 2}</span>
            <span style={{ fontSize: mobile ? '2.6rem' : '4rem', fontWeight: '900', lineHeight: 1, background: 'linear-gradient(135deg,#ff6b00,#f59e0b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {isIndia ? `Rs.${price}` : `${geoData?.symbol || '$'}${geoData?.basic || 2.99}`}
            </span>
          </div>
          <div style={{ fontSize: '0.78rem', color: textSec, marginBottom: '20px' }}>
            Full 30-day access • PDF Report • Live Leaderboard • Zehra AI
          </div>

          {hasPurchased ? (
            <button onClick={() => setCurrentPage('streak-practice')} style={{ background: 'linear-gradient(135deg,#22c55e,#16a34a)', color: '#fff', border: 'none', borderRadius: '12px', padding: '14px 0', width: '100%', fontSize: '1rem', fontWeight: '800', cursor: 'pointer', boxShadow: '0 8px 20px rgba(34,197,94,0.35)' }}>
              🔥 Go to Today's Practice →
            </button>
          ) : (
            <button onClick={handleBuy} style={{ background: 'linear-gradient(135deg,#ff6b00,#ff3d00)', color: '#fff', border: 'none', borderRadius: '12px', padding: '14px 0', width: '100%', fontSize: '1rem', fontWeight: '800', cursor: 'pointer', boxShadow: '0 8px 20px rgba(255,107,0,0.4)' }}>
              🚀 Join the Challenge — {isIndia ? `Rs.${price}` : `${geoData?.symbol || '$'}${geoData?.basic || 2.99}`} Only
            </button>
          )}

          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '12px', flexWrap: 'wrap' }}>
            {['Secure Payment', 'Instant Access', '30-Day Access', 'Zehra AI Powered'].map(t => (
              <span key={t} style={{ fontSize: '0.68rem', color: textSec }}>✓ {t}</span>
            ))}
          </div>
        </div>

        {/* ── LIVE LEADERBOARD ── */}
        <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: '20px', overflow: 'hidden', marginBottom: '28px', opacity: animIn ? 1 : 0, transition: 'all 0.7s ease 0.35s' }}>
          {/* Header */}
          <div style={{ padding: '16px 20px', borderBottom: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <div style={{ fontWeight: '900', fontSize: '1rem' }}>🏆 Live Leaderboard</div>
              <div style={{ fontSize: '0.72rem', color: textSec, marginTop: '2px' }}>
                {leaderboard.length} challengers competing
              </div>
            </div>
            {/* Tab filters */}
            <div style={{ display: 'flex', gap: '6px' }}>
              {[{ id: 'all', label: 'All Time' }, { id: 'week', label: 'This Week' }, { id: 'today', label: 'Today' }].map(t => (
                <button key={t.id} onClick={() => setLbTab(t.id)} style={{ padding: '6px 14px', borderRadius: '20px', border: 'none', fontSize: '0.72rem', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit', background: lbTab === t.id ? '#ff6b00' : (isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9'), color: lbTab === t.id ? '#fff' : textSec, transition: 'all 0.15s' }}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {lbLoading ? (
            <div style={{ padding: '32px', textAlign: 'center', color: textSec, fontSize: '0.85rem' }}>
              Loading leaderboard...
            </div>
          ) : filteredLB.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: textSec, fontSize: '0.85rem' }}>
              No entries for this period yet
            </div>
          ) : (
            <div>
              {filteredLB.map((entry, i) => {
                const isCurrentUser = entry.uid === uid;
                return (
                  <div key={entry.id || i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 20px', borderBottom: i < filteredLB.length - 1 ? `1px solid ${border}` : 'none', background: isCurrentUser ? (isDark ? 'rgba(255,107,0,0.08)' : 'rgba(255,107,0,0.04)') : '' }}>
                    {/* Rank */}
                    <div style={{ width: '28px', textAlign: 'center', fontWeight: '900', fontSize: '0.9rem', color: i === 0 ? '#f59e0b' : i === 1 ? '#94a3b8' : i === 2 ? '#f97316' : textSec, flexShrink: 0 }}>
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                    </div>

                    {/* Avatar */}
                    <div style={{ width: '34px', height: '34px', borderRadius: '50%', background: `linear-gradient(135deg, hsl(${(entry.name?.charCodeAt(0) || 0) * 7 % 360}, 70%, 55%), hsl(${(entry.name?.charCodeAt(0) || 0) * 13 % 360}, 60%, 40%))`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: '900', color: '#fff', flexShrink: 0 }}>
                      {(entry.name || '?')[0].toUpperCase()}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: '700', fontSize: '0.88rem', color: isCurrentUser ? '#ff6b00' : textPrimary, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {entry.name || 'Anonymous'}
                        {isCurrentUser && <span style={{ fontSize: '0.6rem', background: 'rgba(255,107,0,0.15)', color: '#ff6b00', padding: '1px 6px', borderRadius: '8px', fontWeight: '800' }}>YOU</span>}
                        {entry.totalDays >= 30 && <span style={{ fontSize: '0.6rem', background: 'rgba(34,197,94,0.15)', color: '#22c55e', padding: '1px 6px', borderRadius: '8px', fontWeight: '800' }}>COMPLETED</span>}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: textSec, marginTop: '1px' }}>
                        {entry.city || 'India'} • {entry.totalDays || 0} days streak
                      </div>
                    </div>

                    {/* Score */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontWeight: '900', fontSize: '0.92rem', color: entry.avgScore >= 70 ? '#22c55e' : entry.avgScore >= 50 ? '#f59e0b' : '#ef4444' }}>
                        {entry.avgScore || 0}%
                      </div>
                      <div style={{ fontSize: '0.62rem', color: textSec }}>avg score</div>
                    </div>

                    {/* Streak fire */}
                    <div style={{ flexShrink: 0, fontSize: '1rem' }}>
                      {entry.totalDays >= 20 ? '🔥' : entry.totalDays >= 10 ? '⚡' : ''}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer */}
          <div style={{ padding: '12px 20px', borderTop: `1px solid ${border}`, textAlign: 'center' }}>
            <span style={{ fontSize: '0.72rem', color: textSec }}>
              Your name appears here after joining • Updated in real-time
            </span>
          </div>
        </div>

        {/* FEATURES */}
        <h2 style={{ textAlign: 'center', fontSize: mobile ? '1.05rem' : '1.4rem', fontWeight: '800', marginBottom: '12px', marginTop: 0, opacity: animIn ? 1 : 0, transition: 'all 0.6s ease 0.4s' }}>
          What you get
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: mobile ? '8px' : '12px', marginBottom: '24px', opacity: animIn ? 1 : 0, transition: 'all 0.7s ease 0.5s' }}>
          {features.map((f, i) => (
            <div key={i} style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: '12px', padding: mobile ? '12px 8px' : '18px', textAlign: 'center' }}>
              <div style={{ fontSize: mobile ? '1.4rem' : '1.8rem', marginBottom: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: mobile ? '28px' : '36px' }}>
                {f.icon}
              </div>
              <div style={{ fontWeight: '700', fontSize: mobile ? '0.68rem' : '0.88rem', marginBottom: '3px', lineHeight: '1.3' }}>{f.title}</div>
              {!mobile && <div style={{ fontSize: '0.76rem', color: textSec, lineHeight: '1.35' }}>{f.desc}</div>}
            </div>
          ))}
        </div>

        {/* TOPICS */}
        <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: '16px', padding: mobile ? '16px 12px' : '26px 32px', marginBottom: '24px', opacity: animIn ? 1 : 0, transition: 'all 0.7s ease 0.6s' }}>
          <h3 style={{ fontWeight: '800', fontSize: mobile ? '0.88rem' : '1rem', marginBottom: '12px', textAlign: 'center', marginTop: 0 }}>
            Topics Covered in 30 Days
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center' }}>
            {topics.map((t, i) => (
              <span key={i} style={{ background: isDark ? 'rgba(255,107,0,0.1)' : 'rgba(255,107,0,0.07)', border: '1px solid rgba(255,107,0,0.22)', color: '#ff6b00', padding: mobile ? '3px 9px' : '5px 12px', borderRadius: '20px', fontSize: mobile ? '0.65rem' : '0.76rem', fontWeight: '600' }}>
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* HOW IT WORKS */}
        <h2 style={{ textAlign: 'center', fontSize: mobile ? '1.05rem' : '1.4rem', fontWeight: '800', marginBottom: '12px', marginTop: 0, opacity: animIn ? 1 : 0, transition: 'all 0.7s ease 0.65s' }}>
          How it works
        </h2>
        {mobile ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px', opacity: animIn ? 1 : 0, transition: 'all 0.7s ease 0.7s' }}>
            {steps.map((s, i) => (
              <div key={i} style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: '14px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '40px', height: '40px', flexShrink: 0, borderRadius: '50%', background: 'linear-gradient(135deg,#ff6b00,#f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '1rem', color: '#fff' }}>{s.step}</div>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '0.9rem', marginBottom: '2px' }}>{s.label}</div>
                  <div style={{ fontSize: '0.75rem', color: textSec }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '12px', marginBottom: '28px', opacity: animIn ? 1 : 0, transition: 'all 0.7s ease 0.7s' }}>
            {steps.map((s, i) => (
              <div key={i} style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: '16px', padding: '18px', textAlign: 'center' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg,#ff6b00,#f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', fontWeight: '900', fontSize: '1rem', color: '#fff' }}>{s.step}</div>
                <div style={{ fontWeight: '700', fontSize: '0.85rem', marginBottom: '4px' }}>{s.label}</div>
                <div style={{ fontSize: '0.72rem', color: textSec }}>{s.desc}</div>
              </div>
            ))}
          </div>
        )}

        {/* BOTTOM CTA */}
        {!hasPurchased && (
          <div style={{ textAlign: 'center', opacity: animIn ? 1 : 0, transition: 'all 0.7s ease 0.8s' }}>
            <button onClick={handleBuy} style={{ background: 'linear-gradient(135deg,#ff6b00,#ff3d00)', color: '#fff', border: 'none', borderRadius: '12px', padding: '14px 0', width: mobile ? '100%' : '340px', fontSize: '1rem', fontWeight: '800', cursor: 'pointer', boxShadow: '0 8px 28px rgba(255,107,0,0.4)' }}>
              🔥 Join the Challenge — {isIndia ? `Rs.${price}` : `${geoData?.symbol || '$'}${geoData?.basic || 2.99}`}
            </button>
            <p style={{ marginTop: '8px', fontSize: '0.74rem', color: textSec }}>
              Limited seats • Powered by Zehra AI • Practice 6AM–11PM daily
            </p>
          </div>
        )}

        {/* ADMIN BUTTON — only visible to admin */}
        {isAdmin && (
          <div style={{ marginTop: '40px' }}>
            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{ flex: 1, height: '1px', background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)' }} />
              <span style={{ background: 'linear-gradient(135deg,#6366f1,#4f46e5)', color: '#fff', padding: '4px 16px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: '800', letterSpacing: '1.5px', whiteSpace: 'nowrap' }}>
                ADMIN CONTROLS
              </span>
              <div style={{ flex: 1, height: '1px', background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)' }} />
            </div>

            {/* Quick stats */}
            <div style={{ display: 'grid', gridTemplateColumns: mobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: '10px', marginBottom: '16px' }}>
              {[
                { label: 'Total Users',    value: leaderboard.filter(e => e.isReal).length, color: '#ff6b00' },
                { label: 'Practiced Today',value: leaderboard.filter(e => e.lastActive === new Date().toISOString().slice(0,10)).length, color: '#22c55e' },
                { label: 'Leaderboard',    value: leaderboard.length,                        color: '#6366f1' },
                { label: 'Challenge Price',value: `Rs.${price}`,                             color: '#f59e0b' },
              ].map((s, i) => (
                <div key={i} style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: '14px', padding: '14px', textAlign: 'center' }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: '900', color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: '0.65rem', color: textSec, marginTop: '3px' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Go to Admin Panel button */}
            <button
              onClick={() => setCurrentPage('admin-streak')}
              style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg,#6366f1,#4f46e5)', color: '#fff', border: 'none', borderRadius: '14px', fontSize: '1rem', fontWeight: '800', cursor: 'pointer', boxShadow: '0 8px 24px rgba(99,102,241,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}
            >
              <span>🛡️</span>
              <span>Open Full Admin Panel</span>
              <span>→</span>
            </button>
            <p style={{ textAlign: 'center', marginTop: '8px', fontSize: '0.72rem', color: textSec }}>
              Users • Leaderboard • Prices • Free Restore • PDF Downloads
            </p>
          </div>
        )}

      </div>
    </div>
  );
};

export default StreakChallengePage;