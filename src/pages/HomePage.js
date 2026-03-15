import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Download, Shield, Zap, Instagram, BookOpen, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTheme, useAuth } from '../App';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy, addDoc, deleteDoc, doc } from 'firebase/firestore';

/* ─────────────────────────────────────────
   LIVE STUDENT COUNT HOOK
───────────────────────────────────────── */
function useLiveStudentCount() {
  const [displayCount, setDisplayCount] = useState(213);
  const targetRef = useRef(213);
  const displayRef = useRef(213);
  useEffect(() => {
    const ticker = setInterval(() => {
      const curr = displayRef.current, tgt = targetRef.current;
      if (curr === tgt) return;
      displayRef.current = curr + (curr < tgt ? 1 : -1);
      setDisplayCount(displayRef.current);
    }, 60);
    return () => clearInterval(ticker);
  }, []);
  useEffect(() => {
    let timer;
    const schedule = () => {
      timer = setTimeout(() => {
        const delta = (Math.floor(Math.random() * 4) + 2) * (Math.random() > 0.45 ? 1 : -1);
        targetRef.current = Math.min(299, Math.max(150, targetRef.current + delta));
        schedule();
      }, 10000 + Math.random() * 5000);
    };
    schedule();
    return () => clearTimeout(timer);
  }, []);
  return displayCount;
}

function useScrollReveal(threshold = 0.1) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

/* ─────────────────────────────────────────
   SCROLL PROGRESS BAR
───────────────────────────────────────── */
function ScrollProgressBar({ isDark }) {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const total = el.scrollHeight - el.clientHeight;
      setProgress(total > 0 ? (el.scrollTop / total) * 100 : 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <div style={{ position:'fixed', top:0, left:0, right:0, height:'3px', zIndex:9999, background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)' }}>
      <div style={{ height:'100%', width:`${progress}%`, background:'linear-gradient(90deg, #6366f1, #ec4899, #10b981)', transition:'width 0.1s linear', boxShadow:'0 0 8px rgba(99,102,241,0.6)' }} />
    </div>
  );
}

/* ─────────────────────────────────────────
   TOP 3 RANKERS SECTION
───────────────────────────────────────── */
function TopRankersSection({ isDark, isMobile }) {
  const [rankers, setRankers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ref, visible] = useScrollReveal(0.1);

  useEffect(() => {
    const fetchRankers = async () => {
      try {
        const q = query(collection(db, 'leaderboard'), orderBy('timestamp', 'desc'));
        const snap = await getDocs(q);
        const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        const python = all
          .filter(e => (e.testLevel || '').toLowerCase().trim() !== 'neet' && e.passed)
          .sort((a, b) => b.percentage - a.percentage || a.timestamp - b.timestamp)
          .slice(0, 3);
        setRankers(python);
      } catch (err) { console.error('Rankers fetch error:', err); }
      finally { setLoading(false); }
    };
    fetchRankers();
  }, []);

  if (!loading && rankers.length === 0) return null;

  const medals = [
    { emoji:'🥇', label:'Champion',  color:'#f59e0b', glow:'rgba(245,158,11,0.45)',  bg:'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(251,191,36,0.08))' },
    { emoji:'🥈', label:'Runner-up', color:'#94a3b8', glow:'rgba(148,163,184,0.45)', bg:'linear-gradient(135deg, rgba(148,163,184,0.15), rgba(203,213,225,0.08))' },
    { emoji:'🥉', label:'3rd Place', color:'#f97316', glow:'rgba(249,115,22,0.45)',  bg:'linear-gradient(135deg, rgba(249,115,22,0.15), rgba(251,146,60,0.08))' },
  ];

  return (
    <section ref={ref} style={{ padding: isMobile ? '0 16px 40px' : '0 24px 64px', maxWidth:'1000px', margin:'0 auto' }}>
      <div style={{ textAlign:'center', marginBottom: isMobile ? '24px' : '40px', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(28px)', transition:'opacity 0.7s ease, transform 0.7s ease' }}>
        <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', background: isDark ? 'rgba(245,158,11,0.12)' : 'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.3)', borderRadius:'50px', padding:'5px 16px', marginBottom:'12px', fontSize:'0.72rem', fontWeight:'800', color:'#f59e0b', letterSpacing:'0.1em' }}>
          <span style={{ animation:'liveDot 1.4s ease-in-out infinite', display:'inline-block', width:6, height:6, borderRadius:'50%', background:'#f59e0b' }} />
          LIVE LEADERBOARD
        </div>
        <h2 style={{ fontSize: isMobile ? '1.55rem' : '2.4rem', fontWeight:'900', background:'linear-gradient(135deg, #f59e0b, #ec4899)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', margin:'0 0 8px', letterSpacing:'-0.02em' }}>Top Python Performers 🏆</h2>
        <p style={{ fontSize: isMobile ? '0.82rem' : '0.92rem', color: isDark ? '#64748b' : '#94a3b8' }}>Real students, real scores — updated live</p>
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:'40px', color: isDark ? '#475569' : '#94a3b8', fontSize:'0.9rem' }}>Loading rankers...</div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: isMobile ? '12px' : '18px' }}>
          {rankers.map((r, i) => (
            <div key={r.id} style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(24px)', transition:`opacity 0.55s ease ${i*0.1}s, transform 0.55s ease ${i*0.1}s` }}>
              <RankerCard r={r} m={medals[i]} isDark={isDark} isMobile={isMobile} rank={i+1} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function RankerCard({ r, m, isDark, isMobile, rank }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} style={{ position:'relative', overflow:'hidden', background: isDark ? 'linear-gradient(135deg, rgba(15,23,42,0.8), rgba(30,27,75,0.55))' : 'linear-gradient(135deg, rgba(255,255,255,0.88), rgba(248,250,252,0.72))', backdropFilter: isMobile ? 'none' : 'blur(16px)', WebkitBackdropFilter: isMobile ? 'none' : 'blur(16px)', border: hovered ? `1.5px solid ${m.color}88` : isDark ? '1.5px solid rgba(255,255,255,0.08)' : '1.5px solid rgba(255,255,255,0.95)', borderRadius:'22px', padding: isMobile ? '20px 18px' : '26px 22px', boxShadow: hovered ? `0 20px 60px ${m.glow}, inset 0 1px 0 rgba(255,255,255,0.15)` : isDark ? '0 6px 28px rgba(0,0,0,0.4)' : '0 6px 28px rgba(99,102,241,0.08)', transition:'all 0.3s ease', transform: hovered ? 'translateY(-4px)' : 'translateY(0)' }}>
      <div style={{ position:'absolute', top:0, left:0, right:0, height:'3px', background:`linear-gradient(90deg, ${m.color}, transparent)`, borderRadius:'22px 22px 0 0' }} />
      <div style={{ position:'absolute', top:'-30px', right:'-30px', width:'100px', height:'100px', background:`radial-gradient(circle, ${m.color}20 0%, transparent 70%)`, borderRadius:'50%', pointerEvents:'none' }} />
      <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'14px' }}>
        <span style={{ fontSize: isMobile ? '2rem' : '2.4rem', filter:`drop-shadow(0 4px 12px ${m.glow})` }}>{m.emoji}</span>
        <div>
          <div style={{ fontSize:'0.6rem', fontWeight:'900', letterSpacing:'0.12em', color:m.color, textTransform:'uppercase' }}>{m.label}</div>
          <div style={{ fontSize:'0.7rem', fontWeight:'700', color: isDark ? '#475569' : '#94a3b8' }}>#{rank} Overall</div>
        </div>
        <div style={{ marginLeft:'auto', background:`linear-gradient(135deg, ${m.color}, ${m.color}aa)`, color:'#fff', borderRadius:'12px', padding:'6px 14px', textAlign:'center', boxShadow:`0 4px 16px ${m.glow}` }}>
          <div style={{ fontSize: isMobile ? '1.4rem' : '1.7rem', fontWeight:'900', lineHeight:1 }}>{r.percentage}%</div>
          <div style={{ fontSize:'0.6rem', fontWeight:'700', opacity:0.9 }}>Score</div>
        </div>
      </div>
      <div style={{ fontSize: isMobile ? '1rem' : '1.1rem', fontWeight:'900', color: isDark ? '#e2e8f0' : '#0f172a', marginBottom:'6px' }}>{r.name}</div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
        {[r.testTitle||'Python Test', `⏱ ${r.timeTaken}`, r.score].map((t,i) => (
          <span key={i} style={{ fontSize:'0.7rem', fontWeight:'700', color: isDark ? '#64748b' : '#94a3b8', background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)', padding:'3px 8px', borderRadius:'6px' }}>{t}</span>
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   STUDENT REVIEWS SECTION
───────────────────────────────────────── */
const MAX_REVIEWS = 10;

function DeleteReviewModal({ review, isDark, onConfirm, onCancel }) {
  return (
    <div style={{ position:'fixed', inset:0, zIndex:99999, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem', animation:'fadeInModal 0.25s ease' }}>
      <div style={{ background: isDark ? 'linear-gradient(135deg, #1e293b, #0f172a)' : '#fff', borderRadius:'28px', padding:'2.5rem 2rem', maxWidth:'420px', width:'100%', boxShadow:'0 32px 80px rgba(0,0,0,0.5)', border:`2px solid ${isDark ? 'rgba(239,68,68,0.3)' : '#fecaca'}`, animation:'scaleInModal 0.3s cubic-bezier(0.34,1.2,0.64,1)', textAlign:'center' }}>
        <div style={{ width:'72px', height:'72px', borderRadius:'50%', margin:'0 auto 1.25rem', background:'linear-gradient(135deg, #ef4444, #dc2626)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 12px 32px rgba(239,68,68,0.4)', fontSize:'2rem', animation:'wobbleIcon 0.5s ease' }}>🗑️</div>
        <h3 style={{ fontSize:'1.35rem', fontWeight:'900', color: isDark ? '#e2e8f0' : '#1e293b', margin:'0 0 0.5rem' }}>Delete Review?</h3>
        <p style={{ fontSize:'0.9rem', color: isDark ? '#94a3b8' : '#64748b', margin:'0 0 1.25rem', lineHeight:1.6 }}>You are about to delete the review by</p>
        <div style={{ display:'flex', alignItems:'center', gap:'12px', background: isDark ? 'rgba(239,68,68,0.08)' : 'rgba(239,68,68,0.05)', border:`1px solid ${isDark ? 'rgba(239,68,68,0.25)' : '#fecaca'}`, borderRadius:'14px', padding:'12px 16px', marginBottom:'1.5rem', textAlign:'left' }}>
          <div style={{ width:'44px', height:'44px', borderRadius:'50%', overflow:'hidden', flexShrink:0, border:'2px solid rgba(239,68,68,0.3)', background:'linear-gradient(135deg, #6366f120, #ec489920)' }}>
            {review.photo ? <img src={review.photo} alt={review.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e => { e.target.style.display='none'; e.target.parentElement.innerHTML='👤'; }} /> : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.3rem' }}>👤</div>}
          </div>
          <div>
            <div style={{ fontWeight:'800', color: isDark ? '#e2e8f0' : '#1e293b', fontSize:'0.95rem' }}>{review.name}</div>
            {review.address && <div style={{ fontSize:'0.75rem', color: isDark ? '#64748b' : '#94a3b8', marginTop:'2px' }}>📍 {review.address}</div>}
          </div>
        </div>
        <p style={{ fontSize:'0.82rem', color:'#ef4444', fontWeight:'700', margin:'0 0 1.75rem' }}>⚠️ This action cannot be undone!</p>
        <div style={{ display:'flex', gap:'10px' }}>
          <button onClick={onCancel} style={{ flex:1, padding:'12px', borderRadius:'14px', background: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9', border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0', color: isDark ? '#94a3b8' : '#64748b', fontWeight:'700', fontSize:'0.9rem', cursor:'pointer' }}>Cancel</button>
          <button onClick={onConfirm} style={{ flex:1, padding:'12px', borderRadius:'14px', background:'linear-gradient(135deg, #ef4444, #dc2626)', border:'none', color:'#fff', fontWeight:'800', fontSize:'0.9rem', cursor:'pointer', boxShadow:'0 6px 20px rgba(239,68,68,0.4)' }}>🗑️ Yes, Delete</button>
        </div>
      </div>
    </div>
  );
}

function StudentReviews({ isDark, isMobile, isAdmin }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);
  const [showAddForm, setShowAddForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [ref, visible] = useScrollReveal(0.08);
  const autoRef = useRef(null);

  const fetchReviews = useCallback(async () => {
    try {
      const snap = await getDocs(collection(db, 'studentReviews'));
      setReviews(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { console.error('Reviews fetch error:', e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  useEffect(() => {
    if (reviews.length <= 1) return;
    autoRef.current = setInterval(() => setCurrent(c => (c + 1) % reviews.length), 4000);
    return () => clearInterval(autoRef.current);
  }, [reviews.length]);

  const prev = () => { clearInterval(autoRef.current); setCurrent(c => (c - 1 + reviews.length) % reviews.length); };
  const next = () => { clearInterval(autoRef.current); setCurrent(c => (c + 1) % reviews.length); };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    await deleteDoc(doc(db, 'studentReviews', deleteTarget.id));
    window.showToast?.(`✅ Review by ${deleteTarget.name} deleted!`, 'success');
    setDeleteTarget(null);
    if (current >= reviews.length - 1) setCurrent(Math.max(0, reviews.length - 2));
    await fetchReviews();
  };

  const canAddMore = reviews.length < MAX_REVIEWS;
  if (!loading && reviews.length === 0 && !isAdmin) return null;

  return (
    <section ref={ref} style={{ padding: isMobile ? '0 16px 40px' : '0 24px 64px', maxWidth:'900px', margin:'0 auto', position:'relative' }}>
      {deleteTarget && <DeleteReviewModal review={deleteTarget} isDark={isDark} onConfirm={handleDeleteConfirm} onCancel={() => setDeleteTarget(null)} />}

      <div style={{ textAlign:'center', marginBottom: isMobile ? '24px' : '40px', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(24px)', transition:'opacity 0.55s ease, transform 0.55s ease' }}>
        <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', background: isDark ? 'rgba(16,185,129,0.12)' : 'rgba(16,185,129,0.08)', border:'1px solid rgba(16,185,129,0.3)', borderRadius:'50px', padding:'5px 16px', marginBottom:'12px', fontSize:'0.72rem', fontWeight:'800', color:'#10b981', letterSpacing:'0.1em' }}>
          <span style={{ animation:'liveDot 1.4s ease-in-out infinite', display:'inline-block', width:6, height:6, borderRadius:'50%', background:'#10b981' }} />
          REAL REVIEWS
        </div>
        <h2 style={{ fontSize: isMobile ? '1.55rem' : '2.4rem', fontWeight:'900', background:'linear-gradient(135deg, #10b981, #6366f1)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', margin:'0 0 8px', letterSpacing:'-0.02em' }}>What Students Say ⭐</h2>
        <p style={{ fontSize: isMobile ? '0.82rem' : '0.92rem', color: isDark ? '#64748b' : '#94a3b8' }}>
          Genuine feedback from real PySkill students
          {isAdmin && <span style={{ marginLeft:'8px', color:'#6366f1', fontWeight:'700' }}>({reviews.length}/{MAX_REVIEWS})</span>}
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:'40px', color: isDark ? '#475569' : '#94a3b8' }}>Loading reviews...</div>
      ) : reviews.length === 0 ? (
        isAdmin && <div style={{ textAlign:'center', padding:'40px', background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(99,102,241,0.04)', borderRadius:'20px', border: isDark ? '1px dashed rgba(255,255,255,0.1)' : '1px dashed rgba(99,102,241,0.2)', color: isDark ? '#475569' : '#94a3b8', fontSize:'0.9rem' }}>No reviews yet. Add the first one! 👇</div>
      ) : (
        <div style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(24px)', transition:'opacity 0.55s ease 0.15s, transform 0.55s ease 0.15s' }}>
          <ReviewCard review={reviews[current]} isDark={isDark} isMobile={isMobile} isAdmin={isAdmin} onDeleteClick={setDeleteTarget} />
          {reviews.length > 1 && (
            <div style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:'12px', marginTop:'20px' }}>
              <button onClick={prev} style={{ width:'38px', height:'38px', borderRadius:'50%', border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(99,102,241,0.2)', background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)', backdropFilter: isMobile ? 'none' : 'blur(8px)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.25s ease', color: isDark ? '#94a3b8' : '#6366f1' }} onMouseEnter={e => { e.currentTarget.style.background='#6366f1'; e.currentTarget.style.color='#fff'; }} onMouseLeave={e => { e.currentTarget.style.background=isDark?'rgba(255,255,255,0.05)':'rgba(255,255,255,0.8)'; e.currentTarget.style.color=isDark?'#94a3b8':'#6366f1'; }}><ChevronLeft size={16} /></button>
              <div style={{ display:'flex', gap:'6px' }}>
                {reviews.map((_, i) => <button key={i} onClick={() => setCurrent(i)} style={{ width: i===current ? '20px' : '8px', height:'8px', borderRadius:'4px', border:'none', background: i===current ? '#6366f1' : isDark ? 'rgba(255,255,255,0.15)' : 'rgba(99,102,241,0.2)', cursor:'pointer', transition:'all 0.3s ease', padding:0 }} />)}
              </div>
              <button onClick={next} style={{ width:'38px', height:'38px', borderRadius:'50%', border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(99,102,241,0.2)', background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.8)', backdropFilter: isMobile ? 'none' : 'blur(8px)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.25s ease', color: isDark ? '#94a3b8' : '#6366f1' }} onMouseEnter={e => { e.currentTarget.style.background='#6366f1'; e.currentTarget.style.color='#fff'; }} onMouseLeave={e => { e.currentTarget.style.background=isDark?'rgba(255,255,255,0.05)':'rgba(255,255,255,0.8)'; e.currentTarget.style.color=isDark?'#94a3b8':'#6366f1'; }}><ChevronRight size={16} /></button>
            </div>
          )}
        </div>
      )}

      {isAdmin && canAddMore && (
        <div style={{ textAlign:'center', marginTop:'24px' }}>
          <button onClick={() => setShowAddForm(!showAddForm)} style={{ background: showAddForm ? 'transparent' : 'linear-gradient(135deg, #6366f1, #ec4899)', border: showAddForm ? isDark ? '2px solid rgba(255,255,255,0.15)' : '2px solid #e2e8f0' : 'none', color: showAddForm ? isDark ? '#94a3b8' : '#64748b' : '#fff', padding:'10px 28px', borderRadius:'50px', fontWeight:'700', fontSize:'0.88rem', cursor:'pointer', boxShadow: showAddForm ? 'none' : '0 6px 20px rgba(99,102,241,0.35)', transition:'all 0.25s ease' }}>
            {showAddForm ? '✕ Cancel' : `+ Add Review (${reviews.length}/${MAX_REVIEWS})`}
          </button>
        </div>
      )}
      {isAdmin && !canAddMore && (
        <div style={{ textAlign:'center', marginTop:'20px', padding:'10px 20px', borderRadius:'50px', background: isDark ? 'rgba(16,185,129,0.1)' : 'rgba(16,185,129,0.07)', border:'1px solid rgba(16,185,129,0.25)', display:'inline-block', marginLeft:'auto', marginRight:'auto', width:'fit-content' }}>
          <span style={{ fontSize:'0.82rem', fontWeight:'700', color:'#10b981' }}>✅ 10/10 Reviews added — Delete one to add a new review</span>
        </div>
      )}
      {isAdmin && showAddForm && canAddMore && (
        <AddReviewForm isDark={isDark} isMobile={isMobile} onSave={async (data) => {
          await addDoc(collection(db, 'studentReviews'), { ...data, createdAt: Date.now() });
          await fetchReviews();
          setShowAddForm(false);
          window.showToast?.('✅ Review added successfully!', 'success');
        }} onCancel={() => setShowAddForm(false)} />
      )}
      <style>{`
        @keyframes fadeInModal { from{opacity:0} to{opacity:1} }
        @keyframes scaleInModal { from{opacity:0;transform:scale(0.88)} to{opacity:1;transform:scale(1)} }
        @keyframes wobbleIcon { 0%{transform:rotate(0deg)} 25%{transform:rotate(-12deg)} 75%{transform:rotate(10deg)} 100%{transform:rotate(0deg)} }
      `}</style>
    </section>
  );
}

function ReviewCard({ review, isDark, isMobile, isAdmin, onDeleteClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} style={{ position:'relative', overflow:'hidden', background: isDark ? 'linear-gradient(135deg, rgba(15,23,42,0.82), rgba(30,27,75,0.58))' : 'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(240,244,255,0.75))', backdropFilter: isMobile ? 'none' : 'blur(16px)', WebkitBackdropFilter: isMobile ? 'none' : 'blur(16px)', border: hovered ? '1.5px solid rgba(99,102,241,0.5)' : isDark ? '1.5px solid rgba(255,255,255,0.08)' : '1.5px solid rgba(255,255,255,0.98)', borderRadius:'26px', padding: isMobile ? '24px 20px' : '36px 40px', boxShadow: hovered ? '0 16px 48px rgba(99,102,241,0.14)' : isDark ? '0 8px 36px rgba(0,0,0,0.4)' : '0 8px 36px rgba(99,102,241,0.09)', transition:'all 0.3s ease', transform: hovered ? 'translateY(-3px)' : 'translateY(0)' }}>
      <div style={{ position:'absolute', top:0, left:0, right:0, height:'3px', background:'linear-gradient(90deg, #6366f1, #ec4899, transparent)', borderRadius:'26px 26px 0 0' }} />
      <div style={{ position:'absolute', top:'16px', right:'24px', fontSize:'5rem', lineHeight:1, color: isDark ? 'rgba(99,102,241,0.07)' : 'rgba(99,102,241,0.05)', fontFamily:'Georgia, serif', pointerEvents:'none', userSelect:'none' }}>"</div>
      {isAdmin && (
        <button onClick={() => onDeleteClick(review)} style={{ position:'absolute', top:'14px', left:'14px', background:'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(220,38,38,0.1))', border:'1px solid rgba(239,68,68,0.35)', borderRadius:'10px', padding:'5px 12px', fontSize:'0.72rem', fontWeight:'800', color:'#ef4444', cursor:'pointer', display:'flex', alignItems:'center', gap:'5px', transition:'all 0.2s ease', backdropFilter: isMobile ? 'none' : 'blur(6px)' }} onMouseEnter={e => { e.currentTarget.style.background='linear-gradient(135deg, #ef4444, #dc2626)'; e.currentTarget.style.color='#fff'; }} onMouseLeave={e => { e.currentTarget.style.background='linear-gradient(135deg, rgba(239,68,68,0.15), rgba(220,38,38,0.1))'; e.currentTarget.style.color='#ef4444'; }}>🗑️ Delete</button>
      )}
      <div style={{ display:'flex', gap:'3px', marginBottom:'14px', paddingTop: isAdmin ? '28px' : '0' }}>
        {[1,2,3,4,5].map(s => <Star key={s} size={isMobile ? 15 : 17} fill={s <= (review.stars||5) ? '#f59e0b' : 'none'} color={s <= (review.stars||5) ? '#f59e0b' : '#cbd5e1'} />)}
      </div>
      <p style={{ fontSize: isMobile ? '0.92rem' : '1.05rem', color: isDark ? '#cbd5e1' : '#334155', lineHeight:1.72, fontWeight:'500', margin:'0 0 22px', fontStyle:'italic', position:'relative', zIndex:1 }}>"{review.text}"</p>
      <div style={{ display:'flex', alignItems:'center', gap:'14px' }}>
        <div style={{ width: isMobile ? '48px' : '56px', height: isMobile ? '48px' : '56px', borderRadius:'50%', overflow:'hidden', border:'2px solid rgba(99,102,241,0.3)', flexShrink:0, background:'linear-gradient(135deg, #6366f120, #ec489920)' }}>
          {review.photo ? <img src={review.photo} alt={review.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e => { e.target.style.display='none'; e.target.parentElement.innerHTML='👤'; e.target.parentElement.style.cssText+='display:flex;align-items:center;justify-content:center;font-size:1.5rem'; }} /> : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.5rem' }}>👤</div>}
        </div>
        <div>
          <div style={{ fontSize: isMobile ? '0.92rem' : '1rem', fontWeight:'800', color: isDark ? '#e2e8f0' : '#0f172a' }}>{review.name}</div>
          <div style={{ fontSize:'0.75rem', color: isDark ? '#64748b' : '#94a3b8', fontWeight:'600', marginTop:'2px' }}>
            {review.address && `📍 ${review.address}`}{review.address && review.course && ' · '}{review.course && `🎓 ${review.course}`}
          </div>
        </div>
      </div>
    </div>
  );
}

function AddReviewForm({ isDark, isMobile, onSave, onCancel }) {
  const [form, setForm] = useState({ name:'', address:'', course:'', text:'', stars:5 });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handle = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { window.showToast?.('⚠️ Please select an image file!', 'warning'); return; }
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result);
    reader.readAsDataURL(file);
  };

  const inputStyle = { width:'100%', padding:'10px 14px', border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid #e2e8f0', borderRadius:'12px', fontSize:'0.88rem', fontWeight:'600', background: isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc', color: isDark ? '#e2e8f0' : '#1e293b', outline:'none', boxSizing:'border-box' };

  const handleSave = async () => {
    if (!form.name.trim() || !form.text.trim()) { window.showToast?.('⚠️ Name and review text are required!', 'warning'); return; }
    setSaving(true);
    let photoUrl = '';
    if (photoFile) {
      setUploading(true);
      try {
        const { uploadImage } = await import('../supabaseUpload');
        const result = await uploadImage(photoFile);
        if (result.success) { photoUrl = result.url; }
        else { window.showToast?.('❌ Photo upload failed: ' + result.error, 'error'); setSaving(false); setUploading(false); return; }
      } catch (err) { window.showToast?.('❌ Photo upload error', 'error'); setSaving(false); setUploading(false); return; }
      setUploading(false);
    }
    await onSave({ ...form, photo: photoUrl });
    setSaving(false);
  };

  return (
    <div style={{ marginTop:'24px', background: isDark ? 'linear-gradient(135deg, rgba(15,23,42,0.8), rgba(30,27,75,0.5))' : 'rgba(255,255,255,0.88)', backdropFilter: isMobile ? 'none' : 'blur(16px)', WebkitBackdropFilter: isMobile ? 'none' : 'blur(16px)', border: isDark ? '1px solid rgba(99,102,241,0.2)' : '1px solid rgba(99,102,241,0.18)', borderRadius:'22px', padding: isMobile ? '20px 16px' : '28px 24px', boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.3)' : '0 8px 32px rgba(99,102,241,0.08)' }}>
      <div style={{ height:'3px', background:'linear-gradient(90deg, #6366f1, #ec4899)', borderRadius:'22px 22px 0 0', margin: isMobile ? '-20px -16px 24px' : '-28px -24px 24px' }} />
      <h3 style={{ fontSize:'1rem', fontWeight:'900', color: isDark ? '#e2e8f0' : '#1e293b', margin:'0 0 18px' }}>✍️ Add Student Review</h3>
      <div style={{ marginBottom:'14px' }}>
        <label style={{ display:'block', fontSize:'0.8rem', fontWeight:'700', color: isDark ? '#94a3b8' : '#64748b', marginBottom:'8px' }}>Student Photo (Gallery)</label>
        <label style={{ display:'flex', alignItems:'center', gap:'12px', padding:'10px 14px', borderRadius:'12px', cursor:'pointer', border: isDark ? '1.5px dashed rgba(255,255,255,0.15)' : '1.5px dashed rgba(99,102,241,0.3)', background: photoPreview ? isDark ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.04)' : 'transparent' }}>
          {photoPreview ? (
            <><img src={photoPreview} alt="preview" style={{ width:'48px', height:'48px', borderRadius:'50%', objectFit:'cover', border:'2px solid rgba(99,102,241,0.4)', flexShrink:0 }} /><div><div style={{ fontSize:'0.85rem', fontWeight:'700', color: isDark ? '#e2e8f0' : '#1e293b' }}>✅ Photo selected</div><div style={{ fontSize:'0.75rem', color: isDark ? '#64748b' : '#94a3b8' }}>Tap to change</div></div></>
          ) : (
            <><div style={{ width:'48px', height:'48px', borderRadius:'50%', background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(99,102,241,0.08)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.5rem', flexShrink:0 }}>📷</div><div><div style={{ fontSize:'0.85rem', fontWeight:'700', color: isDark ? '#94a3b8' : '#6366f1' }}>Select from Gallery</div><div style={{ fontSize:'0.75rem', color: isDark ? '#475569' : '#94a3b8' }}>JPG, PNG supported</div></div></>
          )}
          <input type="file" accept="image/*" onChange={handlePhotoChange} style={{ display:'none' }} />
        </label>
      </div>
      <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:'10px', marginBottom:'10px' }}>
        <input placeholder="Student Name *" value={form.name} onChange={handle('name')} style={inputStyle} />
        <input placeholder="City / Address" value={form.address} onChange={handle('address')} style={inputStyle} />
        <input placeholder="Course (e.g. Python Basic)" value={form.course} onChange={handle('course')} style={inputStyle} />
      </div>
      <textarea placeholder="Review text *" value={form.text} onChange={handle('text')} rows={3} style={{ ...inputStyle, resize:'vertical', marginBottom:'12px' }} />
      <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'18px' }}>
        <span style={{ fontSize:'0.82rem', fontWeight:'700', color: isDark ? '#94a3b8' : '#64748b' }}>Rating:</span>
        {[1,2,3,4,5].map(s => <button key={s} onClick={() => setForm(f => ({ ...f, stars:s }))} style={{ background:'none', border:'none', cursor:'pointer', padding:'2px' }}><Star size={22} fill={s <= form.stars ? '#f59e0b' : 'none'} color={s <= form.stars ? '#f59e0b' : '#cbd5e1'} /></button>)}
        <span style={{ fontSize:'0.8rem', color:'#f59e0b', fontWeight:'700' }}>{form.stars}/5</span>
      </div>
      <div style={{ display:'flex', gap:'10px' }}>
        <button onClick={handleSave} disabled={saving} style={{ flex:1, padding:'12px', background: saving ? 'rgba(99,102,241,0.5)' : 'linear-gradient(135deg, #6366f1, #ec4899)', border:'none', borderRadius:'12px', color:'#fff', fontWeight:'800', fontSize:'0.9rem', cursor: saving ? 'not-allowed' : 'pointer', boxShadow: saving ? 'none' : '0 6px 18px rgba(99,102,241,0.35)' }}>
          {uploading ? '📤 Uploading photo...' : saving ? '⏳ Saving...' : '✅ Save Review'}
        </button>
        <button onClick={onCancel} style={{ padding:'12px 20px', background:'transparent', border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid #e2e8f0', borderRadius:'12px', color: isDark ? '#94a3b8' : '#64748b', fontWeight:'700', fontSize:'0.9rem', cursor:'pointer' }}>Cancel</button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   MAIN HOME PAGE
───────────────────────────────────────── */
function HomePage({ setCurrentPage }) {
  const [currentText, setCurrentText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [mounted, setMounted] = useState(false);
  const [timelineVisible, setTimelineVisible] = useState(false);
  const timelineRef = useRef(null);
  const { isDark } = useTheme();
  const { user, logout } = useAuth();
  // eslint-disable-next-line no-unused-vars
  const studentCount = useLiveStudentCount();
  const isAdmin = user?.email === 'luckyfaizu3@gmail.com';

  const [featRef, featVis]       = useScrollReveal(0.1);
  const [infoRef, infoVis]       = useScrollReveal(0.1);
  const [founderRef, founderVis] = useScrollReveal(0.1);
  const [mockRef, mockVis]       = useScrollReveal(0.08);
  // ✅ Fixed: actionRef used for scroll reveal, actionVis removed (not needed)
  const actionRef = useRef(null);

  useEffect(() => { const t = setTimeout(() => setMounted(true), 80); return () => clearTimeout(t); }, []);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => setTimelineVisible(e.isIntersecting), { threshold:0.08 });
    if (timelineRef.current) obs.observe(timelineRef.current);
    return () => obs.disconnect();
  }, []);
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  const phrases = useRef([
    "Premium Study Notes",
    "Master Python",
    "Excel in Exams",
    "Land Your Dream Job",
    "60 Questions Mock Tests",
    "Anti-Cheat Exam System",
    "Earn Your Certificate",
    "Basic • Advanced • Pro"
  ]).current;
  useEffect(() => {
    const cp = phrases[phraseIndex];
    const speed = isDeleting ? 25 : 70;
    const t = setTimeout(() => {
      if (!isDeleting && currentIndex < cp.length) { setCurrentText(cp.substring(0, currentIndex+1)); setCurrentIndex(currentIndex+1); }
      else if (isDeleting && currentIndex > 0) { setCurrentText(cp.substring(0, currentIndex-1)); setCurrentIndex(currentIndex-1); }
      else if (!isDeleting && currentIndex === cp.length) { setTimeout(() => setIsDeleting(true), 1800); }
      else if (isDeleting && currentIndex === 0) { setIsDeleting(false); setPhraseIndex((phraseIndex+1) % phrases.length); }
    }, speed);
    return () => clearTimeout(t);
  }, [currentIndex, isDeleting, phraseIndex, phrases]);

  const timelineEvents = [
    { date:'1 Jan 2026',  title:'The Idea',       desc:'PySkill was born — a vision to give students quality Python study material at affordable prices.',              icon:'💡', color:'#a78bfa', glow:'rgba(167,139,250,0.5)' },
    { date:'10 Jan 2026', title:'Work Begins',     desc:'Development kicked off. Notes curated, questions filtered, platform designed from scratch.',                   icon:'⚡', color:'#6366f1', glow:'rgba(99,102,241,0.5)'  },
    { date:'15 Feb 2026', title:'Website Live 🚀', desc:'PySkill officially launched! First students enrolled, first certificates issued.',                              icon:'🚀', color:'#ec4899', glow:'rgba(236,72,153,0.5)'  },
  ];

  const glassCard = (extra = {}) => ({
    background: isDark ? 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))' : 'linear-gradient(135deg, rgba(255,255,255,0.88), rgba(255,255,255,0.65))',
    backdropFilter: isMobile ? 'none' : 'blur(16px)', WebkitBackdropFilter: isMobile ? 'none' : 'blur(16px)',
    border: isDark ? '1px solid rgba(255,255,255,0.09)' : '1px solid rgba(255,255,255,0.98)',
    boxShadow: isDark ? '0 4px 24px rgba(0,0,0,0.25)' : '0 4px 24px rgba(99,102,241,0.07)',
    transition:'all 0.38s cubic-bezier(0.34,1.56,0.64,1)',
    ...extra,
  });

  return (
    <div style={{ paddingTop: isMobile ? '62px' : '70px', minHeight:'100vh', overflowX:'hidden',
      willChange:'scroll-position',
      WebkitOverflowScrolling:'touch',
      contain: 'paint',
    }}>
      <ScrollProgressBar isDark={isDark} />

      {/* ═══ HERO ═══ */}
      <section style={{ padding: isMobile ? '40px 16px 36px' : '90px 24px 70px', textAlign:'center', position:'relative', background: isDark ? 'linear-gradient(180deg, rgba(15,10,60,0.8) 0%, transparent 80%)' : 'linear-gradient(180deg, #eef1ff 0%, transparent 80%)', borderRadius:'0 0 40px 40px', overflow:'hidden' }}>
        {!isMobile && <div style={{ position:'absolute', top:'-60px', left:'-80px', width:'380px', height:'380px', background: isDark ? 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)', borderRadius:'50%', animation:'orbFloat1 7s ease-in-out infinite', pointerEvents:'none' }} />}
        {!isMobile && <div style={{ position:'absolute', bottom:'-40px', right:'-60px', width:'320px', height:'320px', background: isDark ? 'radial-gradient(circle, rgba(236,72,153,0.15) 0%, transparent 70%)' : 'radial-gradient(circle, rgba(236,72,153,0.1) 0%, transparent 70%)', borderRadius:'50%', animation:'orbFloat2 9s ease-in-out infinite', pointerEvents:'none' }} />}

        {/* Badge */}
        <div style={{ display:'inline-flex', alignItems:'center', gap:'10px', background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(99,102,241,0.06)', border: isDark ? '1px solid rgba(99,102,241,0.35)' : '1px solid rgba(99,102,241,0.22)', backdropFilter: isMobile ? 'none' : 'blur(16px)', borderRadius:'60px', padding:'7px 18px 7px 8px', marginBottom: isMobile ? '20px' : '28px', opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0) scale(1)' : 'translateY(-24px) scale(0.9)', transition:'opacity 0.7s ease, transform 0.7s cubic-bezier(0.34,1.56,0.64,1)' }}>
          <div style={{ width:'32px', height:'32px', background:'linear-gradient(135deg, #6366f1, #ec4899)', borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'17px', boxShadow:'0 4px 12px rgba(99,102,241,0.4)' }}>🎓</div>
          <span style={{ fontSize:'0.82rem', fontWeight:'800', color:'#6366f1', letterSpacing:'0.04em' }}>PySkill</span>
          <div style={{ width:'1px', height:'14px', background: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(99,102,241,0.2)' }} />
          <span style={{ fontSize:'0.75rem', fontWeight:'700', color: isDark ? '#a78bfa' : '#7c3aed', letterSpacing:'0.08em' }}>EST. 2026</span>
          <span style={{ width:'7px', height:'7px', borderRadius:'50%', background:'#10b981', display:'inline-block', animation:'liveDot 1.4s ease-in-out infinite', boxShadow:'0 0 6px #10b981' }} />
        </div>

        {/* Typing H1 */}
        <h1 style={{ fontSize: isMobile ? '2rem' : '4rem', fontWeight:'900', marginBottom:'12px', background:'linear-gradient(135deg, #1e40af 0%, #6366f1 45%, #ec4899 100%)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', lineHeight:1.15, minHeight: isMobile ? '54px' : '100px', display:'flex', alignItems:'center', justifyContent:'center', padding:'0 10px', letterSpacing:'-0.02em', opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(32px)', transition:'opacity 0.7s ease 0.18s, transform 0.7s cubic-bezier(0.34,1.56,0.64,1) 0.18s' }}>
          {currentText}
          <span style={{ borderRight:'3px solid #6366f1', animation:'blink 0.7s infinite', marginLeft:'4px', height: isMobile ? '30px' : '60px', display:'inline-block', verticalAlign:'middle' }} />
        </h1>

        {/* Subtitle */}
        <p style={{ fontSize: isMobile ? '0.92rem' : '1.18rem', color: isDark ? '#94a3b8' : '#64748b', maxWidth:'560px', margin:'0 auto 24px', lineHeight:1.65, fontWeight:'500', padding:'0 12px', opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(20px)', transition:'opacity 0.7s ease 0.34s, transform 0.7s ease 0.34s' }}>
          Quality study materials for Python & Job Prep — delivered instantly after payment.
        </p>

        {/* Trust badges */}
        <div style={{ display:'flex', gap:'8px', justifyContent:'center', flexWrap:'wrap', marginBottom:'28px', padding:'0 10px' }}>
          {[
            { icon:Shield, color:'#10b981', text:'Secure Payment', delay:'0.45s' },
            { icon:Zap,    color:'#6366f1', text:'Instant Access', delay:'0.58s' },
            { icon:BookOpen, color:'#ec4899', text:'100% Original', delay:'0.71s' }
          ].map((badge, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:'6px', background: isDark ? `${badge.color}14` : `${badge.color}10`, backdropFilter: isMobile ? 'none' : 'blur(8px)', padding: isMobile ? '7px 13px' : '8px 15px', borderRadius:'50px', border:`1px solid ${badge.color}${isDark?'45':'30'}`, opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0) scale(1)' : 'translateY(14px) scale(0.85)', transition:`opacity 0.55s ease ${badge.delay}, transform 0.55s cubic-bezier(0.34,1.56,0.64,1) ${badge.delay}` }}>
              <badge.icon size={isMobile ? 13 : 14} color={badge.color} />
              <span style={{ fontSize: isMobile ? '0.73rem' : '0.8rem', fontWeight:'700', color:badge.color }}>{badge.text}</span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ display:'inline-block', opacity: mounted ? 1 : 0, transform: mounted ? 'scale(1)' : 'scale(0.8)', transition:'opacity 0.6s ease 0.78s, transform 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.78s' }}>
          <button onClick={() => setCurrentPage('products')} style={{ background:'linear-gradient(135deg, #6366f1, #ec4899)', border:'none', color:'white', padding: isMobile ? '13px 30px' : '17px 44px', fontSize: isMobile ? '0.96rem' : '1.12rem', borderRadius:'60px', cursor:'pointer', fontWeight:'800', display:'inline-flex', alignItems:'center', gap:'9px', boxShadow:'0 8px 32px rgba(99,102,241,0.4)', transition:'all 0.3s ease', position:'relative', overflow:'hidden' }}
            onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 12px 36px rgba(99,102,241,0.45)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 8px 32px rgba(99,102,241,0.4)'; }}>
            {!isMobile && <span style={{ position:'absolute', top:0, left:'-80%', width:'55%', height:'100%', background:'linear-gradient(120deg, transparent, rgba(255,255,255,0.28), transparent)', transform:'skewX(-20deg)', animation:'btnShine 3s ease-in-out infinite' }} />}
            <Download size={isMobile ? 18 : 20} />
            Browse Notes Now
          </button>
        </div>

      </section>

      {/* ═══ QUICK ACTION CARDS ═══ */}
      <section ref={actionRef} style={{ padding: isMobile ? '28px 16px' : '48px 24px', maxWidth:'1000px', margin:'0 auto' }}>
        <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(5, 1fr)', gap: isMobile ? '10px' : '14px' }}>
          {[
            { icon:'📚', label:'Browse Notes', page:'products',    gradient:'linear-gradient(135deg, #6366f1, #8b5cf6)', glow:'rgba(99,102,241,0.35)',  color:'#6366f1', delay:'0s'    },
            { icon:'🐍', label:'Mock Tests',   page:'mocktests',   gradient:'linear-gradient(135deg, #10b981, #34d399)', glow:'rgba(16,185,129,0.35)',  color:'#10b981', delay:'0.07s' },
            { icon:'📦', label:'My Orders',    page:'orders',      gradient:'linear-gradient(135deg, #f59e0b, #fbbf24)', glow:'rgba(245,158,11,0.35)',  color:'#f59e0b', delay:'0.14s' },
            { icon:'🏆', label:'Leaderboard',  page:'leaderboard', gradient:'linear-gradient(135deg, #8b5cf6, #d946ef)', glow:'rgba(139,92,246,0.35)',  color:'#8b5cf6', delay:'0.21s' },
            user
              ? { icon:'👤', label:'Logout',   page:null, gradient:'linear-gradient(135deg, #ef4444, #dc2626)', glow:'rgba(239,68,68,0.35)', color:'#ef4444', action:logout, delay:'0.28s' }
              : { icon:'🔐', label:'Login',    page:'login', gradient:'linear-gradient(135deg, #ec4899, #f472b6)', glow:'rgba(236,72,153,0.35)', color:'#ec4899', delay:'0.28s' }
          ].map((card, i) => (
            <ActionCard key={i} card={card} isDark={isDark} isMobile={isMobile}
              onClick={() => { if (card.action) card.action(); else setCurrentPage(card.page); }} />
          ))}
        </div>
      </section>

      {/* ═══ MOCK TEST CARD ═══ */}
      <section ref={mockRef} style={{ padding: isMobile ? '0 16px 32px' : '0 24px 48px', maxWidth:'1000px', margin:'0 auto', opacity: mockVis ? 1 : 0, transform: mockVis ? 'translateY(0)' : 'translateY(24px)', transition:'opacity 0.55s ease, transform 0.55s ease' }}>
        <div style={{
          background: isDark ? 'rgba(15,23,42,0.6)' : 'rgba(240,244,255,0.7)',
          border: isDark ? '1.5px solid rgba(99,102,241,0.25)' : '1.5px solid rgba(99,102,241,0.18)',
          borderRadius: isMobile ? '20px' : '26px',
          padding: isMobile ? '20px 16px' : '28px 32px',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Top accent */}
          <div style={{ position:'absolute', top:0, left:0, right:0, height:'3px', background:'linear-gradient(90deg, #10b981, #6366f1, #ec4899)' }} />

          {/* Header */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'8px', marginBottom: isMobile ? '16px' : '20px' }}>
            <span style={{ fontSize: isMobile ? '1rem' : '1.1rem' }}>🐍</span>
            <span style={{ fontSize: isMobile ? '0.78rem' : '0.85rem', fontWeight:'900', color:'#10b981', letterSpacing:'0.1em', textTransform:'uppercase' }}>Python Mock Tests</span>
            <span style={{ display:'inline-block', width:6, height:6, borderRadius:'50%', background:'#10b981', animation:'liveDot 1.4s ease-in-out infinite' }} />
            <span style={{ fontSize: isMobile ? '0.7rem' : '0.76rem', fontWeight:'700', color: isDark ? '#64748b' : '#94a3b8' }}>Anti-Cheat System</span>
          </div>

          {/* 3 Level Cards */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap: isMobile ? '10px' : '14px', marginBottom: isMobile ? '14px' : '18px' }}>
            {[
              { emoji:'🌱', level:'Basic',    q:'60 Questions', t:'60 Min',  color:'#10b981', glow:'rgba(16,185,129,0.25)'  },
              { emoji:'🔥', level:'Advanced', q:'60 Questions', t:'120 Min', color:'#6366f1', glow:'rgba(99,102,241,0.25)'  },
              { emoji:'⭐', level:'Pro',      q:'60 Questions', t:'180 Min', color:'#f59e0b', glow:'rgba(245,158,11,0.25)'  },
            ].map((lvl, i) => (
              <div key={i} onClick={() => setCurrentPage('mocktests')} style={{
                background: isDark ? `${lvl.color}18` : `${lvl.color}12`,
                border: `1.5px solid ${lvl.color}${isDark ? '40' : '28'}`,
                borderRadius: isMobile ? '14px' : '16px',
                padding: isMobile ? '14px 10px' : '18px 14px',
                textAlign:'center', cursor:'pointer',
                transition:'all 0.25s ease',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow=`0 10px 24px ${lvl.glow}`; }}
                onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='none'; }}
              >
                <div style={{ fontSize: isMobile ? '1.5rem' : '1.8rem', marginBottom:'6px' }}>{lvl.emoji}</div>
                <div style={{ fontSize: isMobile ? '0.82rem' : '0.92rem', fontWeight:'900', color: lvl.color, marginBottom:'6px' }}>{lvl.level}</div>
                <div style={{ fontSize: isMobile ? '0.68rem' : '0.75rem', fontWeight:'700', color: isDark ? '#94a3b8' : '#64748b', lineHeight:1.6 }}>
                  {lvl.q}<br/>{lvl.t}
                </div>
              </div>
            ))}
          </div>

          {/* Anti-cheat badges */}
          <div style={{ display:'flex', flexWrap:'wrap', gap:'6px', justifyContent:'center' }}>
            {['🔒 Anti-Cheat', '🚫 Tab Switch Detection', '🖥️ Fullscreen Mode', '🏆 Certificate 55%+'].map((item, i) => (
              <span key={i} style={{
                fontSize: isMobile ? '0.65rem' : '0.72rem', fontWeight:'700',
                color: isDark ? '#64748b' : '#94a3b8',
                background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.07)',
                borderRadius:'20px', padding: isMobile ? '3px 9px' : '4px 11px',
              }}>{item}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ TOP 3 RANKERS ═══ */}
      <TopRankersSection isDark={isDark} isMobile={isMobile} />

      {/* ═══ STUDENT REVIEWS ═══ */}
      <StudentReviews isDark={isDark} isMobile={isMobile} isAdmin={isAdmin} />

      {/* ═══ 2026 TIMELINE ═══ */}
      <section ref={timelineRef} style={{ padding: isMobile ? '8px 16px 48px' : '0 24px 64px', maxWidth:'900px', margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom: isMobile ? '32px' : '52px' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', background: isDark ? 'rgba(99,102,241,0.12)' : 'rgba(99,102,241,0.07)', border:`1px solid ${isDark ? 'rgba(99,102,241,0.3)' : 'rgba(99,102,241,0.2)'}`, borderRadius:'40px', padding:'6px 16px', marginBottom:'14px', opacity: timelineVisible ? 1 : 0, transition:'opacity 0.6s ease' }}>
            <span style={{ fontSize:'0.72rem', fontWeight:'800', color:'#6366f1', letterSpacing:'0.1em', textTransform:'uppercase' }}>Our Story</span>
            <span style={{ fontSize:'0.72rem', fontWeight:'900', color:'#ec4899' }}>2026</span>
          </div>
          <h2 style={{ fontSize: isMobile ? '1.65rem' : '2.5rem', fontWeight:'900', background:'linear-gradient(135deg, #1e40af, #6366f1, #ec4899)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', margin:'0 0 8px', letterSpacing:'-0.02em', opacity: timelineVisible ? 1 : 0, transform: timelineVisible ? 'translateY(0)' : 'translateY(22px)', transition:'opacity 0.7s ease 0.1s, transform 0.7s ease 0.1s' }}>From Idea to Reality</h2>
          <p style={{ color: isDark ? '#64748b' : '#94a3b8', fontSize: isMobile ? '0.82rem' : '0.92rem', fontWeight:'500', opacity: timelineVisible ? 1 : 0, transition:'opacity 0.7s ease 0.2s' }}>Every milestone that brought PySkill to life</p>
        </div>

        <div style={{ position:'relative', paddingLeft: isMobile ? '40px' : '0' }}>
          <div style={{ position:'absolute', left: isMobile ? '18px' : '50%', top:0, bottom:0, width:'2px', background: isDark ? 'linear-gradient(180deg, rgba(99,102,241,0.7) 0%, rgba(139,92,246,0.5) 50%, rgba(236,72,153,0.7) 100%)' : 'linear-gradient(180deg, rgba(99,102,241,0.45) 0%, rgba(139,92,246,0.3) 50%, rgba(236,72,153,0.45) 100%)', transform: isMobile ? 'none' : 'translateX(-50%)', opacity: timelineVisible ? 1 : 0, transition:'opacity 0.8s ease 0.3s', borderRadius:'2px' }}>
            <div style={{ position:'absolute', top:0, left:'50%', transform:'translateX(-50%)', width:'8px', height:'8px', borderRadius:'50%', background:'#6366f1', animation: (timelineVisible && !isMobile) ? 'spineTravel 4s ease-in-out infinite 0.5s' : 'none', boxShadow:'0 0 12px #6366f1' }} />
          </div>
          {timelineEvents.map((evt, i) => {
            const isLeft = !isMobile && i % 2 === 0;
            const delay = `${0.38 + i * 0.24}s`;
            return (
              <div key={i} style={{ display:'flex', flexDirection: isMobile ? 'row' : isLeft ? 'row-reverse' : 'row', alignItems:'flex-start', marginBottom: isMobile ? '32px' : '56px', position:'relative', opacity: timelineVisible ? 1 : 0, transform: timelineVisible ? 'translateX(0) translateY(0)' : isMobile ? 'translateX(-20px)' : isLeft ? 'translateX(28px)' : 'translateX(-28px)', transition:`opacity 0.6s ease ${delay}, transform 0.6s ease ${delay}` }}>
                {!isMobile && <div style={{ flex:1 }} />}
                {!isMobile && (
                  <div style={{ position:'relative', zIndex:2, flexShrink:0, width:'56px', height:'56px', margin:'0 -28px', background:`linear-gradient(135deg, ${evt.color}, ${i===2 ? '#f472b6' : '#a78bfa'})`, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.5rem', boxShadow:`0 0 0 5px ${isDark ? '#0f172a' : '#eef1ff'}, 0 0 28px ${evt.glow}`, animation: (timelineVisible && !isMobile) ? `nodePulse${i} 2.8s ease-in-out infinite ${delay}` : 'none' }}>{evt.icon}</div>
                )}
                {isMobile && (
                  <div style={{ position:'absolute', left:'-31px', top:'18px', zIndex:2, width:'28px', height:'28px', background:`linear-gradient(135deg, ${evt.color}, ${i===2 ? '#f472b6' : '#a78bfa'})`, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.85rem', boxShadow:`0 0 0 3px ${isDark ? '#0f172a' : '#eef1ff'}, 0 0 16px ${evt.glow}` }}>{evt.icon}</div>
                )}
                <div style={{ flex:1, maxWidth: isMobile ? '100%' : '44%' }}>
                  <div style={{ position:'relative', overflow:'hidden', background: isDark ? 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)' : 'linear-gradient(135deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.72) 100%)', backdropFilter: isMobile ? 'none' : 'blur(16px)', WebkitBackdropFilter: isMobile ? 'none' : 'blur(16px)', border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.98)', borderRadius:'24px', padding: isMobile ? '20px 18px' : '24px 26px', boxShadow: isDark ? '0 8px 40px rgba(0,0,0,0.35)' : '0 8px 40px rgba(99,102,241,0.1)', transition:'all 0.35s ease' }}
                    onMouseEnter={e => { e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.borderColor=evt.color+'55'; }}
                    onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.borderColor= isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.98)'; }}>
                    <div style={{ position:'absolute', top:0, left:0, right:0, height:'2.5px', background:`linear-gradient(90deg, transparent 0%, ${evt.color} 40%, ${i===2 ? '#f472b6' : '#a78bfa'} 70%, transparent 100%)` }} />
                    <div style={{ display:'inline-flex', alignItems:'center', gap:'6px', background:`${evt.color}18`, border:`1px solid ${evt.color}35`, borderRadius:'30px', padding:'5px 12px', marginBottom:'11px' }}>
                      <div style={{ width:'5px', height:'5px', borderRadius:'50%', background:evt.color, animation:'liveDot 1.6s ease-in-out infinite' }} />
                      <span style={{ fontSize:'0.7rem', fontWeight:'800', color:evt.color, letterSpacing:'0.07em' }}>{evt.date}</span>
                    </div>
                    <h3 style={{ fontSize: isMobile ? '1.02rem' : '1.15rem', fontWeight:'900', color: isDark ? '#e2e8f0' : '#0f172a', margin:'0 0 8px' }}>{evt.title}</h3>
                    <p style={{ fontSize: isMobile ? '0.79rem' : '0.85rem', color: isDark ? '#94a3b8' : '#475569', margin:0, lineHeight:1.62 }}>{evt.desc}</p>
                  </div>
                </div>
                {!isMobile && <div style={{ flex:1 }} />}
              </div>
            );
          })}
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section ref={featRef} style={{ padding: isMobile ? '0 16px 32px' : '0 24px 48px', maxWidth:'1000px', margin:'0 auto' }}>
        <h2 style={{ fontSize: isMobile ? '1.45rem' : '2rem', fontWeight:'900', textAlign:'center', marginBottom: isMobile ? '20px' : '32px', color: isDark ? '#e2e8f0' : '#1e293b', letterSpacing:'-0.02em', opacity: featVis ? 1 : 0, transform: featVis ? 'translateY(0)' : 'translateY(24px)', transition:'opacity 0.7s ease, transform 0.7s ease' }}>Why Students Love Us</h2>
        <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: isMobile ? '12px' : '18px' }}>
          {[
            { icon:'📚', title:'Quality Content', desc:'Expert-curated notes & filtered important questions.', color:'#6366f1' },
            { icon:'🔒', title:'Secure & Safe',   desc:'Razorpay protected payments — UPI, Cards & more.',  color:'#10b981' },
            { icon:'⚡', title:'Instant Download',desc:'Get your PDFs the second payment is done.',          color:'#ec4899' }
          ].map((f, i) => (
            <div key={i} style={{ ...glassCard({ borderRadius:'22px', padding: isMobile ? '18px 16px' : '26px', display:'flex', alignItems:'flex-start', gap:'16px', opacity: featVis ? 1 : 0, transform: featVis ? 'translateY(0)' : 'translateY(20px)', transition:`opacity 0.5s ease ${i*0.08}s, transform 0.5s ease ${i*0.08}s` }) }}
              onMouseEnter={e => { e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.borderColor=f.color+'50'; }}
              onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.borderColor= isDark ? 'rgba(255,255,255,0.09)' : 'rgba(255,255,255,0.98)'; }}>
              <div style={{ width: isMobile ? '42px' : '46px', height: isMobile ? '42px' : '46px', flexShrink:0, background:`${f.color}${isDark?'20':'12'}`, borderRadius:'14px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.3rem', border:`1px solid ${f.color}25` }}>{f.icon}</div>
              <div>
                <div style={{ fontSize: isMobile ? '0.92rem' : '0.98rem', fontWeight:'800', color: isDark ? '#e2e8f0' : '#0f172a', marginBottom:'5px' }}>{f.title}</div>
                <div style={{ fontSize: isMobile ? '0.78rem' : '0.82rem', color: isDark ? '#94a3b8' : '#64748b', lineHeight:1.55 }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ INFO CARDS ═══ */}
      <section ref={infoRef} style={{ padding: isMobile ? '0 16px 32px' : '0 24px 48px', maxWidth:'1000px', margin:'0 auto' }}>
        <h2 style={{ fontSize: isMobile ? '1.45rem' : '2rem', fontWeight:'900', textAlign:'center', marginBottom: isMobile ? '20px' : '32px', background:'linear-gradient(135deg, #6366f1, #ec4899)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', letterSpacing:'-0.02em', opacity: infoVis ? 1 : 0, transform: infoVis ? 'translateY(0)' : 'translateY(24px)', transition:'opacity 0.7s ease, transform 0.7s ease' }}>Why PySkill?</h2>
        <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: isMobile ? '12px' : '18px' }}>
          {[
            { icon:'📜', title:'Our Policy',         desc:"Genuine, quality-checked study materials reviewed before upload. No refund after download, but we guarantee satisfaction with preview options.", color:'#6366f1' },
            { icon:'💳', title:'Secure Payment',     desc:"Transactions via Razorpay — India's most trusted gateway. UPI, Cards, Net Banking & Wallets. Fully encrypted & secure.",                         color:'#10b981' },
            { icon:'🎯', title:'Why Choose Us',      desc:'Instant access, lifetime downloads, mobile-friendly PDFs, expert content, affordable pricing & 24/7 WhatsApp support.',                          color:'#f59e0b' },
            { icon:'⭐', title:'What Makes Us Better',desc:'No outdated or copied content. Every note filtered for important questions. Real reviews, no hidden charges, direct founder support.',             color:'#8b5cf6' }
          ].map((card, i) => (
            <div key={i} style={{ ...glassCard({ borderRadius:'22px', padding: isMobile ? '18px 16px' : '24px', position:'relative', overflow:'hidden', opacity: infoVis ? 1 : 0, transform: infoVis ? 'translateY(0)' : 'translateY(20px)', transition:`opacity 0.5s ease ${i*0.08}s, transform 0.5s ease ${i*0.08}s` }) }}
              onMouseEnter={e => { e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.borderColor=card.color+'45'; }}
              onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.borderColor= isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.98)'; }}>
              <div style={{ position:'absolute', top:0, left:0, right:0, height:'2px', background:`linear-gradient(90deg, transparent, ${card.color}80, transparent)` }} />
              <div style={{ position:'absolute', top:'-25px', right:'-25px', width:'90px', height:'90px', background:`${card.color}${isDark?'12':'08'}`, borderRadius:'50%' }} />
              <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'10px' }}>
                <div style={{ width: isMobile ? '36px' : '40px', height: isMobile ? '36px' : '40px', background:`${card.color}${isDark?'20':'12'}`, borderRadius:'11px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.1rem', border:`1px solid ${card.color}25` }}>{card.icon}</div>
                <h3 style={{ fontSize: isMobile ? '0.95rem' : '1rem', fontWeight:'800', color:card.color, margin:0 }}>{card.title}</h3>
              </div>
              <p style={{ fontSize: isMobile ? '0.78rem' : '0.82rem', color: isDark ? '#94a3b8' : '#64748b', lineHeight:1.6, margin:0 }}>{card.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ FOUNDER ═══ */}
      <section ref={founderRef} style={{ padding: isMobile ? '0 16px 48px' : '0 24px 72px', maxWidth:'700px', margin:'0 auto', opacity: founderVis ? 1 : 0, transform: founderVis ? 'translateY(0)' : 'translateY(24px)', transition:'opacity 0.55s ease, transform 0.55s ease' }}>
        <div style={{ background: isDark ? 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(236,72,153,0.06))' : 'linear-gradient(135deg, rgba(240,244,255,0.95), rgba(255,240,249,0.82))', backdropFilter: isMobile ? 'none' : 'blur(16px)', WebkitBackdropFilter: isMobile ? 'none' : 'blur(16px)', border: isDark ? '1px solid rgba(99,102,241,0.2)' : '1px solid rgba(255,255,255,1)', borderRadius:'28px', padding: isMobile ? '22px 18px' : '36px', display:'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'center' : 'flex-start', gap: isMobile ? '18px' : '26px', textAlign: isMobile ? 'center' : 'left', boxShadow: isDark ? '0 8px 40px rgba(0,0,0,0.3)' : '0 8px 40px rgba(99,102,241,0.1)', position:'relative', overflow:'hidden', transition:'all 0.4s ease' }}
          onMouseEnter={e => { e.currentTarget.style.transform='translateY(-4px)'; e.currentTarget.style.boxShadow= isDark ? '0 20px 60px rgba(0,0,0,0.4)' : '0 20px 60px rgba(99,102,241,0.16)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow= isDark ? '0 8px 40px rgba(0,0,0,0.3)' : '0 8px 40px rgba(99,102,241,0.1)'; }}>
          <div style={{ position:'absolute', top:0, left:0, right:0, height:'2.5px', background:'linear-gradient(90deg, #6366f1, #ec4899, #a78bfa, #6366f1)', backgroundSize:'200% 100%', animation:'shimmerLine 3s ease-in-out infinite' }} />
          <div style={{ flexShrink:0 }}>
            <div style={{ width: isMobile ? '84px' : '114px', height: isMobile ? '84px' : '114px', borderRadius:'50%', overflow:'hidden', border:'3px solid rgba(99,102,241,0.35)', boxShadow:'0 8px 28px rgba(99,102,241,0.25)' }}>
              <img src="https://i.ibb.co/WWW1ttkx/Whats-App-Image-2026-01-31-at-1-57-14-PM.jpg" alt="Faizan Tariq" crossOrigin="anonymous" style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e => { e.target.style.display='none'; e.target.parentElement.innerHTML='👨‍💻'; }} />
            </div>
          </div>
          <div style={{ flex:1 }}>
            <h3 style={{ fontSize: isMobile ? '1.18rem' : '1.45rem', fontWeight:'900', color: isDark ? '#e2e8f0' : '#0f172a', marginBottom:'2px', letterSpacing:'-0.01em' }}>Faizan Tariq</h3>
            <div style={{ fontSize: isMobile ? '0.78rem' : '0.82rem', color:'#6366f1', fontWeight:'700', marginBottom:'10px' }}>Software Engineering • ILS Srinagar</div>
            <p style={{ fontSize: isMobile ? '0.78rem' : '0.84rem', color: isDark ? '#94a3b8' : '#64748b', lineHeight:1.65, margin:'0 0 16px' }}>Providing quality study materials & filtered important questions to help students excel — because we are students too.</p>
            <a href="https://instagram.com/code_with_06" target="_blank" rel="noopener noreferrer" style={{ display:'inline-flex', alignItems:'center', gap:'7px', background:'linear-gradient(135deg, #f093fb, #f5576c)', color:'#fff', padding: isMobile ? '8px 18px' : '9px 20px', borderRadius:'50px', textDecoration:'none', fontWeight:'700', fontSize: isMobile ? '0.78rem' : '0.82rem', boxShadow:'0 6px 18px rgba(240,147,251,0.35)', transition:'all 0.3s ease' }}
              onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 8px 24px rgba(240,147,251,0.5)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 6px 18px rgba(240,147,251,0.35)'; }}>
              <Instagram size={isMobile ? 14 : 16} /> Follow on Instagram
            </a>
          </div>
        </div>
      </section>

      <style>{`
        @keyframes blink       { 0%,50%{opacity:1}51%,100%{opacity:0} }
        @keyframes liveDot     { 0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.3;transform:scale(1.5)} }
        @keyframes countPop    { 0%{transform:scale(1)}50%{transform:scale(1.12)}100%{transform:scale(1)} }
        @keyframes btnShine    { 0%{left:-80%}50%,100%{left:130%} }
        @keyframes orbFloat1   { 0%,100%{transform:translate(0,0)}50%{transform:translate(14px,18px)} }
        @keyframes orbFloat2   { 0%,100%{transform:translate(0,0)}50%{transform:translate(-12px,-14px)} }
        @keyframes cardRise    { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes cardPing    { 0%{opacity:0;transform:scale(1)} 30%{opacity:0.45;transform:scale(1.04)} 70%{opacity:0.45;transform:scale(1.04)} 100%{opacity:0;transform:scale(1.1)} }
        @keyframes shimmerLine { 0%{background-position:200% 0}100%{background-position:-200% 0} }
        @keyframes spineTravel { 0%{top:0%;opacity:0}8%{opacity:1}92%{opacity:1}100%{top:100%;opacity:0} }
        @keyframes nodePulse0  { 0%,100%{box-shadow:0 0 0 5px ${isDark?'#0f172a':'#eef1ff'},0 8px 28px rgba(167,139,250,0.35)} 50%{box-shadow:0 0 0 5px ${isDark?'#0f172a':'#eef1ff'},0 10px 36px rgba(167,139,250,0.5);transform:scale(1.04)} }
        @keyframes nodePulse1  { 0%,100%{box-shadow:0 0 0 5px ${isDark?'#0f172a':'#eef1ff'},0 8px 28px rgba(99,102,241,0.35)} 50%{box-shadow:0 0 0 5px ${isDark?'#0f172a':'#eef1ff'},0 10px 36px rgba(99,102,241,0.5);transform:scale(1.04)} }
        @keyframes nodePulse2  { 0%,100%{box-shadow:0 0 0 5px ${isDark?'#0f172a':'#eef1ff'},0 8px 28px rgba(236,72,153,0.35)} 50%{box-shadow:0 0 0 5px ${isDark?'#0f172a':'#eef1ff'},0 10px 36px rgba(236,72,153,0.5);transform:scale(1.04)} }
      `}</style>
    </div>
  );
}

/* ─────────────────────────────────────────
   ACTION CARD — Live feel with pulse ring
───────────────────────────────────────── */
function ActionCard({ card, isDark, isMobile, onClick }) {
  const [pressed, setPressed] = useState(false);
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={onClick}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => { setPressed(false); setHovered(false); }}
      onMouseEnter={() => setHovered(true)}
      onTouchStart={() => setPressed(true)}
      onTouchEnd={() => setPressed(false)}
      style={{
        background: hovered
          ? isDark ? 'rgba(255,255,255,0.09)' : 'rgba(255,255,255,0.98)'
          : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.82)',
        backdropFilter: isMobile ? 'none' : 'blur(12px)', WebkitBackdropFilter: isMobile ? 'none' : 'blur(12px)',
        border: hovered
          ? `1.5px solid ${card.color}55`
          : `1.5px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(99,102,241,0.18)'}`,
        borderRadius: isMobile ? '18px' : '20px',
        padding: isMobile ? '16px 8px' : '20px 12px',
        cursor:'pointer',
        display:'flex', flexDirection:'column', alignItems:'center',
        gap: isMobile ? '8px' : '10px',
        position:'relative', overflow:'hidden',
        transform: pressed ? 'scale(0.93)' : hovered ? 'translateY(-4px)' : 'scale(1)',
        transition:'transform 0.15s ease, box-shadow 0.2s ease, border-color 0.2s ease, background 0.2s ease',
        boxShadow: hovered
          ? `0 10px 28px ${card.glow}`
          : isDark ? '0 2px 12px rgba(0,0,0,0.25)' : '0 2px 12px rgba(99,102,241,0.07)',
        animation:`cardRise 0.45s ease ${card.delay} both`,
        outline:'none',
      }}
    >
      {/* Live pulse ring */}
      {!isMobile && <div style={{ position:'absolute', inset:0, borderRadius:'inherit', border:`1.5px solid ${card.color}`, opacity:0, animation:`cardPing 2.8s ease-in-out ${card.delay} infinite`, pointerEvents:'none' }} />}

      {/* Icon */}
      <div style={{ width: isMobile ? '40px' : '46px', height: isMobile ? '40px' : '46px', background:card.gradient, borderRadius:'13px', display:'flex', alignItems:'center', justifyContent:'center', fontSize: isMobile ? '1.2rem' : '1.4rem', boxShadow:`0 4px 14px ${card.glow}`, position:'relative', zIndex:1, transform: hovered ? 'scale(1.12)' : 'scale(1)', transition:'transform 0.2s ease' }}>
        {card.icon}
      </div>

      {/* Label */}
      <span style={{ fontSize: isMobile ? '0.72rem' : '0.82rem', fontWeight:'800', color: hovered ? card.color : isDark ? '#e2e8f0' : '#1e293b', position:'relative', zIndex:1, transition:'color 0.2s ease' }}>
        {card.label}
      </span>

      {/* "Tap me" arrow hint — shows on hover */}
      {hovered && (
        <span style={{ fontSize:'0.6rem', color:card.color, fontWeight:'700', opacity:0.8, position:'relative', zIndex:1, animation:'fadeInUp 0.2s ease' }}>
          tap →
        </span>
      )}
    </button>
  );
}

export default HomePage;