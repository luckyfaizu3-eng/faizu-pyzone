import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Download, Shield, Zap, Instagram, BookOpen, Star } from 'lucide-react';
import { useTheme, useAuth } from '../App';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy, addDoc, deleteDoc, doc } from 'firebase/firestore';

function useScrollReveal(threshold = 0.08) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

function useLiveStudentCount() {
  const [count, setCount] = useState(213);
  const target = useRef(213);
  const current = useRef(213);
  useEffect(() => {
    const t = setInterval(() => {
      if (current.current === target.current) return;
      current.current += current.current < target.current ? 1 : -1;
      setCount(current.current);
    }, 80);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    let timer;
    const schedule = () => {
      timer = setTimeout(() => {
        const d = (Math.floor(Math.random() * 4) + 2) * (Math.random() > 0.45 ? 1 : -1);
        target.current = Math.min(299, Math.max(150, target.current + d));
        schedule();
      }, 12000 + Math.random() * 6000);
    };
    schedule();
    return () => clearTimeout(timer);
  }, []);
  return count;
}

function ScrollProgressBar({ isDark }) {
  const [p, setP] = useState(0);
  useEffect(() => {
    const fn = () => {
      const el = document.documentElement;
      const total = el.scrollHeight - el.clientHeight;
      setP(total > 0 ? (el.scrollTop / total) * 100 : 0);
    };
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);
  return (
    <div style={{ position:'fixed', top:0, left:0, right:0, height:'3px', zIndex:9999, background:'transparent' }}>
      <div style={{ height:'100%', width:`${p}%`, background:'linear-gradient(90deg,#6366f1,#ec4899,#10b981)', transition:'width 0.15s linear' }} />
    </div>
  );
}

const card = (isDark, extra = {}) => ({
  background: isDark ? 'rgba(15,23,42,0.95)' : '#ffffff',
  border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e8eaf0',
  borderRadius: '18px',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  ...extra,
});

function TopRankersSection({ isDark, isMobile }) {
  const [rankers, setRankers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ref, visible] = useScrollReveal();

  useEffect(() => {
    (async () => {
      try {
        const q = query(collection(db, 'leaderboard'), orderBy('timestamp', 'desc'));
        const snap = await getDocs(q);
        const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setRankers(
          all.filter(e => (e.testLevel||'').toLowerCase().trim() !== 'neet' && e.passed)
             .sort((a,b) => b.percentage - a.percentage || a.timestamp - b.timestamp)
             .slice(0, 3)
        );
      } catch(e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  if (!loading && rankers.length === 0) return null;

  const medals = [
    { emoji:'🥇', label:'Champion',  color:'#f59e0b' },
    { emoji:'🥈', label:'Runner-up', color:'#94a3b8' },
    { emoji:'🥉', label:'3rd Place', color:'#f97316' },
  ];

  return (
    <section ref={ref} style={{ padding: isMobile?'0 16px 36px':'0 24px 56px', maxWidth:'1000px', margin:'0 auto',
      opacity: visible?1:0, transform: visible?'translateY(0)':'translateY(20px)',
      transition:'opacity 0.5s ease, transform 0.5s ease' }}>
      <div style={{ textAlign:'center', marginBottom: isMobile?'20px':'32px' }}>
        <div style={{ display:'inline-flex', alignItems:'center', gap:'7px', background: isDark?'rgba(245,158,11,0.1)':'rgba(245,158,11,0.07)', border:'1px solid rgba(245,158,11,0.28)', borderRadius:'50px', padding:'4px 14px', marginBottom:'10px', fontSize:'0.7rem', fontWeight:'800', color:'#f59e0b', letterSpacing:'0.1em' }}>
          <span style={{ width:6, height:6, borderRadius:'50%', background:'#f59e0b', display:'inline-block', animation:'dot 1.4s ease-in-out infinite' }} />
          LIVE LEADERBOARD
        </div>
        <h2 style={{ fontSize: isMobile?'1.45rem':'2.2rem', fontWeight:'900', background:'linear-gradient(135deg,#f59e0b,#ec4899)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', margin:'0 0 6px', letterSpacing:'-0.02em' }}>Top Python Performers 🏆</h2>
        <p style={{ fontSize:'0.85rem', color: isDark?'#64748b':'#94a3b8', margin:0 }}>Real students, real scores — updated live</p>
      </div>
      {loading ? <div style={{ textAlign:'center', padding:'32px', color: isDark?'#475569':'#94a3b8' }}>Loading...</div> : (
        <div style={{ display:'grid', gridTemplateColumns: isMobile?'1fr':'repeat(3,1fr)', gap: isMobile?'10px':'16px' }}>
          {rankers.map((r,i) => (
            <div key={r.id} style={{ ...card(isDark), padding: isMobile?'18px 16px':'22px 20px', position:'relative', overflow:'hidden',
              boxShadow: isDark?'0 4px 20px rgba(0,0,0,0.3)':'0 4px 20px rgba(99,102,241,0.07)',
              opacity: visible?1:0, transform: visible?'translateY(0)':'translateY(16px)',
              transition:`opacity 0.4s ease ${i*0.08}s, transform 0.4s ease ${i*0.08}s` }}>
              <div style={{ position:'absolute', top:0, left:0, right:0, height:'2px', background:`linear-gradient(90deg,${medals[i].color},transparent)` }} />
              <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'12px' }}>
                <span style={{ fontSize: isMobile?'1.9rem':'2.2rem' }}>{medals[i].emoji}</span>
                <div>
                  <div style={{ fontSize:'0.58rem', fontWeight:'900', letterSpacing:'0.12em', color:medals[i].color, textTransform:'uppercase' }}>{medals[i].label}</div>
                  <div style={{ fontSize:'0.68rem', fontWeight:'700', color: isDark?'#475569':'#94a3b8' }}>#{i+1} Overall</div>
                </div>
                <div style={{ marginLeft:'auto', background: medals[i].color, color:'#fff', borderRadius:'10px', padding:'5px 12px', textAlign:'center' }}>
                  <div style={{ fontSize: isMobile?'1.3rem':'1.6rem', fontWeight:'900', lineHeight:1 }}>{r.percentage}%</div>
                  <div style={{ fontSize:'0.58rem', fontWeight:'700', opacity:0.9 }}>Score</div>
                </div>
              </div>
              <div style={{ fontSize: isMobile?'0.95rem':'1rem', fontWeight:'800', color: isDark?'#e2e8f0':'#0f172a', marginBottom:'6px' }}>{r.name}</div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'5px' }}>
                {[r.testTitle||'Python Test', `⏱ ${r.timeTaken}`, r.score].map((t,j) => (
                  <span key={j} style={{ fontSize:'0.68rem', fontWeight:'700', color: isDark?'#64748b':'#94a3b8', background: isDark?'rgba(255,255,255,0.05)':'#f1f5f9', padding:'2px 7px', borderRadius:'5px' }}>{t}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

const MAX_REVIEWS = 200;

function DeleteReviewModal({ review, isDark, onConfirm, onCancel }) {
  return (
    <div style={{ position:'fixed', inset:0, zIndex:99999, background:'rgba(0,0,0,0.65)', display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
      <div style={{ ...card(isDark), padding:'2rem', maxWidth:'400px', width:'100%', boxShadow:'0 24px 60px rgba(0,0,0,0.4)', textAlign:'center' }}>
        <div style={{ fontSize:'2.5rem', marginBottom:'12px' }}>🗑️</div>
        <h3 style={{ fontSize:'1.2rem', fontWeight:'900', color: isDark?'#e2e8f0':'#1e293b', margin:'0 0 8px' }}>Delete Review?</h3>
        <p style={{ fontSize:'0.85rem', color: isDark?'#94a3b8':'#64748b', margin:'0 0 20px' }}>Delete review by <strong>{review.name}</strong>? This cannot be undone.</p>
        <div style={{ display:'flex', gap:'10px' }}>
          <button onClick={onCancel} style={{ flex:1, padding:'11px', borderRadius:'12px', background: isDark?'rgba(255,255,255,0.06)':'#f1f5f9', border: isDark?'1px solid rgba(255,255,255,0.1)':'1px solid #e2e8f0', color: isDark?'#94a3b8':'#64748b', fontWeight:'700', fontSize:'0.88rem', cursor:'pointer' }}>Cancel</button>
          <button onClick={onConfirm} style={{ flex:1, padding:'11px', borderRadius:'12px', background:'linear-gradient(135deg,#ef4444,#dc2626)', border:'none', color:'#fff', fontWeight:'800', fontSize:'0.88rem', cursor:'pointer' }}>Delete</button>
        </div>
      </div>
    </div>
  );
}

function StudentReviews({ isDark, isMobile, isAdmin, user }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [ref, visible] = useScrollReveal();
  const canAdd = !!user;

  const fetchReviews = useCallback(async () => {
    try {
      const snap = await getDocs(collection(db, 'studentReviews'));
      setReviews(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch(e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteDoc(doc(db, 'studentReviews', deleteTarget.id));
    window.showToast?.('✅ Deleted!', 'success');
    setDeleteTarget(null);
    await fetchReviews();
  };

  const canAddMore = reviews.length < MAX_REVIEWS;
  if (!loading && reviews.length === 0 && !canAdd) return null;

  return (
    <section ref={ref} style={{ padding: isMobile?'0 16px 36px':'0 24px 56px', maxWidth:'860px', margin:'0 auto',
      opacity: visible?1:0, transform: visible?'translateY(0)':'translateY(20px)',
      transition:'opacity 0.5s ease, transform 0.5s ease' }}>
      {deleteTarget && <DeleteReviewModal review={deleteTarget} isDark={isDark} onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />}
      <div style={{ textAlign:'center', marginBottom: isMobile?'20px':'32px' }}>
        <div style={{ display:'inline-flex', alignItems:'center', gap:'7px', background: isDark?'rgba(16,185,129,0.1)':'rgba(16,185,129,0.07)', border:'1px solid rgba(16,185,129,0.28)', borderRadius:'50px', padding:'4px 14px', marginBottom:'10px', fontSize:'0.7rem', fontWeight:'800', color:'#10b981', letterSpacing:'0.1em' }}>
          <span style={{ width:6, height:6, borderRadius:'50%', background:'#10b981', display:'inline-block', animation:'dot 1.4s ease-in-out infinite' }} />
          REAL REVIEWS
        </div>
        <h2 style={{ fontSize: isMobile?'1.45rem':'2.2rem', fontWeight:'900', background:'linear-gradient(135deg,#10b981,#6366f1)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', margin:'0 0 6px', letterSpacing:'-0.02em' }}>What Students Say ⭐</h2>
        <p style={{ fontSize:'0.85rem', color: isDark?'#64748b':'#94a3b8', margin:0 }}>
          Genuine feedback from real PySkill students
          {isAdmin && <span style={{ marginLeft:'8px', color:'#6366f1', fontWeight:'700' }}>({reviews.length}/{MAX_REVIEWS})</span>}
        </p>
      </div>
      {loading ? (
        <div style={{ textAlign:'center', padding:'32px', color: isDark?'#475569':'#94a3b8' }}>Loading...</div>
      ) : reviews.length === 0 ? (
        canAdd && <div style={{ textAlign:'center', padding:'32px', background: isDark?'rgba(255,255,255,0.03)':'#f8fafc', borderRadius:'16px', border: isDark?'1px dashed rgba(255,255,255,0.1)':'1px dashed #e2e8f0', color: isDark?'#475569':'#94a3b8', fontSize:'0.88rem' }}>No reviews yet. Be the first! 👇</div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
          {reviews.map((rev) => (
            <ReviewCard key={rev.id} review={rev} isDark={isDark} isMobile={isMobile} isAdmin={isAdmin} user={user} onDeleteClick={() => setDeleteTarget(rev)} />
          ))}
        </div>
      )}
      {canAdd && canAddMore && (
        <div style={{ textAlign:'center', marginTop:'20px' }}>
          <button onClick={() => setShowForm(!showForm)} style={{ background: showForm?'transparent':'linear-gradient(135deg,#6366f1,#ec4899)', border: showForm? isDark?'2px solid rgba(255,255,255,0.12)':'2px solid #e2e8f0':'none', color: showForm? isDark?'#94a3b8':'#64748b':'#fff', padding:'9px 26px', borderRadius:'50px', fontWeight:'700', fontSize:'0.86rem', cursor:'pointer', boxShadow: showForm?'none':'0 4px 16px rgba(99,102,241,0.3)', transition:'all 0.2s ease' }}>
            {showForm ? '✕ Cancel' : '✍️ Write a Review'}
          </button>
        </div>
      )}
      {!user && reviews.length > 0 && (
        <div style={{ textAlign:'center', marginTop:'14px' }}>
          <span style={{ fontSize:'0.78rem', color: isDark?'#475569':'#94a3b8', fontWeight:'600' }}>🔐 Login to write your own review</span>
        </div>
      )}
      {canAdd && showForm && canAddMore && (
        <AddReviewForm isDark={isDark} isMobile={isMobile} user={user}
          onSave={async (data) => {
            await addDoc(collection(db, 'studentReviews'), { ...data, createdAt: Date.now() });
            await fetchReviews();
            setShowForm(false);
            window.showToast?.('✅ Review added!', 'success');
          }}
          onCancel={() => setShowForm(false)} />
      )}
    </section>
  );
}

function AddReviewForm({ isDark, isMobile, user, onSave, onCancel }) {
  const [form, setForm] = useState({ name: user?.displayName||'', address:'', course:'', text:'', stars:5 });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const h = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const inp = { width:'100%', padding:'9px 12px', border: isDark?'1px solid rgba(255,255,255,0.1)':'1px solid #e2e8f0', borderRadius:'10px', fontSize:'0.86rem', fontWeight:'600', background: isDark?'rgba(255,255,255,0.04)':'#f8fafc', color: isDark?'#e2e8f0':'#1e293b', outline:'none', boxSizing:'border-box' };
  const handleSave = async () => {
    if (!form.name.trim() || !form.text.trim()) { window.showToast?.('⚠️ Name and review required!', 'warning'); return; }
    if (!photoFile) { window.showToast?.('⚠️ Please add your photo!', 'warning'); return; }
    setSaving(true);
    let photoUrl = '';
    if (photoFile) {
      setUploading(true);
      try {
        const { uploadImage } = await import('../supabaseUpload');
        const r = await uploadImage(photoFile);
        if (r.success) photoUrl = r.url;
        else { window.showToast?.('❌ Upload failed', 'error'); setSaving(false); setUploading(false); return; }
      } catch { window.showToast?.('❌ Upload error', 'error'); setSaving(false); setUploading(false); return; }
      setUploading(false);
    }
    await onSave({ ...form, photo: photoUrl, userEmail: user?.email||'' });
    setSaving(false);
  };
  return (
    <div style={{ marginTop:'20px', ...card(isDark), padding: isMobile?'18px 14px':'24px 20px', borderColor: isDark?'rgba(99,102,241,0.2)':'rgba(99,102,241,0.15)' }}>
      <div style={{ height:'2px', background:'linear-gradient(90deg,#6366f1,#ec4899)', borderRadius:'18px 18px 0 0', margin: isMobile?'-18px -14px 18px':'-24px -20px 20px' }} />
      <h3 style={{ fontSize:'0.95rem', fontWeight:'900', color: isDark?'#e2e8f0':'#1e293b', margin:'0 0 16px' }}>✍️ Write Your Review</h3>
      <label style={{ display:'flex', alignItems:'center', gap:'10px', padding:'9px 12px', borderRadius:'10px', cursor:'pointer', border: isDark?'1.5px dashed rgba(255,255,255,0.12)':'1.5px dashed rgba(99,102,241,0.25)', marginBottom:'12px', background:'transparent' }}>
        {photoPreview
          ? <><img src={photoPreview} alt="" style={{ width:'42px', height:'42px', borderRadius:'50%', objectFit:'cover', flexShrink:0 }} /><span style={{ fontSize:'0.82rem', fontWeight:'700', color: isDark?'#e2e8f0':'#1e293b' }}>✅ Photo selected</span></>
          : <><div style={{ width:'42px', height:'42px', borderRadius:'50%', background: isDark?'rgba(255,255,255,0.05)':'rgba(99,102,241,0.07)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.3rem', flexShrink:0 }}>📷</div><span style={{ fontSize:'0.82rem', fontWeight:'700', color: isDark?'#94a3b8':'#6366f1' }}>Add Your Photo *</span></>}
        <input type="file" accept="image/*" onChange={e => { const f=e.target.files[0]; if(!f) return; setPhotoFile(f); const r=new FileReader(); r.onloadend=()=>setPhotoPreview(r.result); r.readAsDataURL(f); }} style={{ display:'none' }} />
      </label>
      <div style={{ display:'grid', gridTemplateColumns: isMobile?'1fr':'1fr 1fr', gap:'8px', marginBottom:'8px' }}>
        <input placeholder="Your Name *" value={form.name} onChange={h('name')} style={inp} />
        <input placeholder="City / Address" value={form.address} onChange={h('address')} style={inp} />
        <input placeholder="Course (e.g. Python Basic)" value={form.course} onChange={h('course')} style={inp} />
        <input placeholder="Instagram (e.g. @yourhandle)" value={form.instagram||''} onChange={h('instagram')} style={inp} />
      </div>
      <textarea placeholder="Share your experience *" value={form.text} onChange={h('text')} rows={3} style={{ ...inp, resize:'vertical', marginBottom:'10px' }} />
      <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'16px' }}>
        <span style={{ fontSize:'0.8rem', fontWeight:'700', color: isDark?'#94a3b8':'#64748b' }}>Rating:</span>
        {[1,2,3,4,5].map(s => <button key={s} onClick={() => setForm(f=>({...f,stars:s}))} style={{ background:'none', border:'none', cursor:'pointer', padding:'1px' }}><Star size={20} fill={s<=form.stars?'#f59e0b':'none'} color={s<=form.stars?'#f59e0b':'#cbd5e1'} /></button>)}
        <span style={{ fontSize:'0.78rem', color:'#f59e0b', fontWeight:'700' }}>{form.stars}/5</span>
      </div>
      <div style={{ display:'flex', gap:'8px' }}>
        <button onClick={handleSave} disabled={saving} style={{ flex:1, padding:'11px', background: saving?'rgba(99,102,241,0.5)':'linear-gradient(135deg,#6366f1,#ec4899)', border:'none', borderRadius:'10px', color:'#fff', fontWeight:'800', fontSize:'0.88rem', cursor: saving?'not-allowed':'pointer' }}>
          {uploading?'📤 Uploading...':saving?'⏳ Saving...':'✅ Submit Review'}
        </button>
        <button onClick={onCancel} style={{ padding:'11px 18px', background:'transparent', border: isDark?'1px solid rgba(255,255,255,0.1)':'1px solid #e2e8f0', borderRadius:'10px', color: isDark?'#94a3b8':'#64748b', fontWeight:'700', fontSize:'0.88rem', cursor:'pointer' }}>Cancel</button>
      </div>
    </div>
  );
}

function BlueTick() {
  return (
    <span style={{ display:'inline-flex', alignItems:'center', flexShrink:0, marginLeft:'3px', lineHeight:1 }}>
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r="20" fill="#3897f0"/>
        <polyline points="10,21 17,28 30,13" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </span>
  );
}

function timeAgo(ts) {
  if (!ts) return '';
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return m + 'm ago';
  const h = Math.floor(m / 60);
  if (h < 24) return h + 'h ago';
  const d = Math.floor(h / 24);
  if (d < 7) return d + 'd ago';
  return new Date(ts).toLocaleDateString('en-IN', { day:'numeric', month:'short' });
}

function ReviewCard({ review, isDark, isMobile, isAdmin, user, onDeleteClick }) {
  const [comments, setComments] = useState([]);
  const [loadingCmts, setLoadingCmts] = useState(true);
  const [showCmts, setShowCmts] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [posting, setPosting] = useState(false);

  const fetchComments = useCallback(async () => {
    try {
      const snap = await getDocs(query(collection(db, 'studentReviews', review.id, 'comments'), orderBy('createdAt', 'asc')));
      setComments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch(e) { console.error(e); }
    finally { setLoadingCmts(false); }
  }, [review.id]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  const postComment = async () => {
    if (!commentText.trim() || !user) return;
    setPosting(true);
    try {
      await addDoc(collection(db, 'studentReviews', review.id, 'comments'), {
        text: commentText.trim(),
        userName: user.displayName || user.email?.split('@')[0] || 'User',
        userPhoto: user.photoURL || '',
        userId: user.uid,
        createdAt: Date.now(),
      });
      setCommentText('');
      await fetchComments();
      setShowCmts(true);
    } catch(e) { window.showToast?.('❌ Comment failed', 'error'); }
    finally { setPosting(false); }
  };

  const inp = { flex:1, padding:'8px 12px', border: isDark?'1px solid rgba(255,255,255,0.1)':'1px solid #e2e8f0', borderRadius:'20px', fontSize:'0.82rem', fontWeight:'500', background: isDark?'rgba(255,255,255,0.05)':'#f8fafc', color: isDark?'#e2e8f0':'#1e293b', outline:'none' };

  return (
    <div style={{ position:'relative', overflow:'hidden', borderRadius:'20px', background: isDark?'linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))':'linear-gradient(135deg,rgba(255,255,255,0.85),rgba(255,255,255,0.6))', backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)', border: isDark?'1px solid rgba(255,255,255,0.1)':'1px solid rgba(255,255,255,0.9)', boxShadow: isDark?'0 8px 32px rgba(0,0,0,0.4)':'0 8px 32px rgba(99,102,241,0.12)', transition:'transform 0.25s ease, box-shadow 0.25s ease' }}
      onMouseEnter={e => { e.currentTarget.style.transform='translateY(-3px)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; }}>
      <div style={{ position:'absolute', top:0, left:0, right:0, height:'2.5px', background:'linear-gradient(90deg,#6366f1,#a855f7,#ec4899)', pointerEvents:'none', borderRadius:'20px 20px 0 0' }} />
      <div style={{ padding: isMobile?'18px 16px':'26px 28px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'14px', paddingTop: isAdmin?'22px':'0', position:'relative' }}>
          {isAdmin && (
            <button onClick={onDeleteClick} style={{ position:'absolute', top:'-22px', right:0, background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.3)', borderRadius:'8px', padding:'3px 9px', fontSize:'0.68rem', fontWeight:'800', color:'#ef4444', cursor:'pointer' }}>🗑️ Delete</button>
          )}
          <div style={{ width: isMobile?'44px':'50px', height: isMobile?'44px':'50px', borderRadius:'50%', overflow:'hidden', border: isDark?'2px solid rgba(255,255,255,0.15)':'2px solid rgba(99,102,241,0.25)', flexShrink:0, background:'linear-gradient(135deg,#6366f120,#ec489920)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.25rem' }}>
            {review.photo ? <img src={review.photo} alt={review.name} style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e => { e.target.style.display='none'; }} /> : '👤'}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:'4px', flexWrap:'wrap' }}>
              <span style={{ fontSize: isMobile?'0.9rem':'0.96rem', fontWeight:'800', color: isDark?'#e2e8f0':'#0f172a' }}>{review.name}</span>
              <BlueTick />
              {review.instagram && (
                <a href={`https://instagram.com/${review.instagram.replace('@','')}`} target="_blank" rel="noopener noreferrer" style={{ fontSize:'0.72rem', fontWeight:'700', color:'#3897f0', textDecoration:'none', marginLeft:'2px' }}>
                  @{review.instagram.replace('@','')}
                </a>
              )}
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:'6px', marginTop:'2px', flexWrap:'wrap' }}>
              <div style={{ display:'flex', gap:'2px' }}>
                {[1,2,3,4,5].map(s => <Star key={s} size={11} fill={s<=(review.stars||5)?'#f59e0b':'none'} color={s<=(review.stars||5)?'#f59e0b':'#cbd5e1'} />)}
              </div>
              <span style={{ fontSize:'0.68rem', color: isDark?'#475569':'#94a3b8', fontWeight:'600' }}>·</span>
              <span style={{ fontSize:'0.68rem', color: isDark?'#475569':'#94a3b8', fontWeight:'600' }}>{timeAgo(review.createdAt)}</span>
              {review.address && <><span style={{ fontSize:'0.68rem', color: isDark?'#475569':'#94a3b8', fontWeight:'600' }}>·</span><span style={{ fontSize:'0.68rem', color: isDark?'#475569':'#94a3b8', fontWeight:'600' }}>📍 {review.address}</span></>}
              {review.course && <><span style={{ fontSize:'0.68rem', color: isDark?'#475569':'#94a3b8' }}>·</span><span style={{ fontSize:'0.68rem', color: isDark?'#475569':'#94a3b8', fontWeight:'600' }}>🎓 {review.course}</span></>}
            </div>
          </div>
        </div>
        <p style={{ fontSize: isMobile?'0.88rem':'0.98rem', color: isDark?'#cbd5e1':'#334155', lineHeight:1.7, fontWeight:'500', margin:0, fontStyle:'italic' }}>"{review.text}"</p>
      </div>
      <div style={{ borderTop: isDark?'1px solid rgba(255,255,255,0.08)':'1px solid rgba(99,102,241,0.08)', padding: isMobile?'12px 16px':'14px 28px' }}>
        {!loadingCmts && comments.length > 0 && (
          <button onClick={() => setShowCmts(s => !s)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:'0.78rem', fontWeight:'700', color:'#6366f1', padding:0, marginBottom: showCmts?'12px':'0' }}>
            💬 {showCmts?'Hide':'View'} {comments.length} comment{comments.length!==1?'s':''}
          </button>
        )}
        {loadingCmts && <span style={{ fontSize:'0.72rem', color: isDark?'#475569':'#94a3b8' }}>Loading...</span>}
        {showCmts && (
          <div style={{ display:'flex', flexDirection:'column', gap:'10px', marginBottom:'12px' }}>
            {comments.map(c => (
              <div key={c.id} style={{ display:'flex', gap:'9px', alignItems:'flex-start' }}>
                <div style={{ width:'30px', height:'30px', borderRadius:'50%', overflow:'hidden', flexShrink:0, background:'linear-gradient(135deg,#6366f115,#ec489915)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.9rem' }}>
                  {c.userPhoto ? <img src={c.userPhoto} alt={c.userName} style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e=>{e.target.style.display='none';}} /> : '👤'}
                </div>
                <div style={{ flex:1, background: isDark?'rgba(255,255,255,0.06)':'rgba(248,250,252,0.8)', borderRadius:'12px', border: isDark?'1px solid rgba(255,255,255,0.06)':'1px solid rgba(99,102,241,0.08)', padding:'7px 11px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'2px' }}>
                    <span style={{ fontSize:'0.75rem', fontWeight:'800', color: isDark?'#e2e8f0':'#0f172a' }}>{c.userName}</span>
                    <span style={{ fontSize:'0.65rem', color: isDark?'#475569':'#94a3b8' }}>{timeAgo(c.createdAt)}</span>
                  </div>
                  <p style={{ margin:0, fontSize:'0.78rem', color: isDark?'#cbd5e1':'#475569', lineHeight:1.5 }}>{c.text}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        {user ? (
          <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
            <div style={{ width:'28px', height:'28px', borderRadius:'50%', overflow:'hidden', flexShrink:0, background:'linear-gradient(135deg,#6366f115,#ec489915)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.85rem' }}>
              {user.photoURL ? <img src={user.photoURL} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} /> : '👤'}
            </div>
            <input value={commentText} onChange={e => setCommentText(e.target.value)} onKeyDown={e => { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); postComment(); } }} placeholder="Write a comment..." style={inp} />
            <button onClick={postComment} disabled={posting || !commentText.trim()} style={{ padding:'7px 14px', borderRadius:'20px', background: commentText.trim()?'linear-gradient(135deg,#6366f1,#ec4899)': isDark?'rgba(255,255,255,0.06)':'#e2e8f0', border:'none', color: commentText.trim()?'#fff': isDark?'#475569':'#94a3b8', fontWeight:'700', fontSize:'0.78rem', cursor: commentText.trim()?'pointer':'default', transition:'all 0.2s ease' }}>
              {posting ? '...' : 'Post'}
            </button>
          </div>
        ) : (
          <p style={{ margin:0, fontSize:'0.75rem', color: isDark?'#475569':'#94a3b8' }}>🔐 Login to comment</p>
        )}
      </div>
    </div>
  );
}

function Timeline({ isDark, isMobile }) {
  const [ref, visible] = useScrollReveal();
  const events = [
    { date:'1 Jan 2026',  title:'The Idea',       desc:'PySkill was born — a vision to give students quality Python study material at affordable prices.', icon:'💡', tag:'ORIGIN', color:'#a78bfa' },
    { date:'10 Jan 2026', title:'Work Begins',     desc:'Development kicked off. Notes curated, questions filtered, platform designed from scratch.',       icon:'⚡', tag:'BUILD',  color:'#6366f1' },
    { date:'15 Feb 2026', title:'Website Live 🚀', desc:'PySkill officially launched! First students enrolled, first certificates issued.',                 icon:'🚀', tag:'LAUNCH', color:'#ec4899' },
  ];
  const DOT = isMobile ? 44 : 48;
  const HALF = DOT / 2;
  return (
    <section ref={ref} style={{ padding: isMobile?'0 16px 56px':'0 24px 72px', maxWidth:'860px', margin:'0 auto' }}>
      <div style={{ textAlign:'center', marginBottom: isMobile?'28px':'48px', opacity: visible?1:0, transform: visible?'translateY(0)':'translateY(16px)', transition:'opacity 0.5s ease, transform 0.5s ease' }}>
        <div style={{ display:'inline-flex', alignItems:'center', gap:'7px', background: isDark?'rgba(99,102,241,0.1)':'rgba(99,102,241,0.06)', border:'1px solid rgba(99,102,241,0.22)', borderRadius:'40px', padding:'5px 14px', marginBottom:'12px' }}>
          <span style={{ fontSize:'0.7rem', fontWeight:'800', color:'#6366f1', letterSpacing:'0.1em' }}>OUR STORY · 2026</span>
        </div>
        <h2 style={{ fontSize: isMobile?'1.55rem':'2.4rem', fontWeight:'900', background:'linear-gradient(135deg,#1e40af,#6366f1,#ec4899)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', margin:'0 0 6px', letterSpacing:'-0.02em' }}>From Idea to Reality</h2>
        <p style={{ color: isDark?'#64748b':'#94a3b8', fontSize:'0.85rem', margin:0 }}>Every milestone that brought PySkill to life</p>
      </div>
      <div style={{ position:'relative' }}>
        <div style={{ position:'absolute', left: isMobile?`${HALF-1}px`:'50%', transform: isMobile?'none':'translateX(-50%)', top:`${HALF}px`, bottom:`${HALF}px`, width:'2px', background: isDark?'linear-gradient(180deg,rgba(167,139,250,0.7),rgba(99,102,241,0.8),rgba(236,72,153,0.7))':'linear-gradient(180deg,rgba(167,139,250,0.45),rgba(99,102,241,0.5),rgba(236,72,153,0.45))', opacity: visible?1:0, transition:'opacity 0.8s ease 0.4s', borderRadius:'2px', zIndex:0 }} />
        {events.map((evt, i) => {
          const isLeft = !isMobile && i % 2 === 0;
          const delay = `${0.25 + i * 0.15}s`;
          return (
            <div key={i} style={{ display:'flex', flexDirection: isMobile?'row': isLeft?'row':'row-reverse', alignItems:'flex-start', marginBottom: i < events.length-1 ? (isMobile?'24px':'40px') : 0, opacity: visible?1:0, transform: visible?'translateY(0)':'translateY(20px)', transition:`opacity 0.45s ease ${delay}, transform 0.45s ease ${delay}` }}>
              {!isMobile && <div style={{ flex:1 }} />}
              <div style={{ flexShrink:0, width:`${DOT}px`, height:`${DOT}px`, margin: isMobile?`3px 14px 0 0`:`8px ${-HALF}px 0`, zIndex:2, position:'relative', background:`linear-gradient(135deg,${evt.color},${i===2?'#f472b6':'#a78bfa'})`, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize: isMobile?'1.2rem':'1.35rem', boxShadow:`0 0 0 ${isMobile?3:4}px ${isDark?'#0f172a':'#eef1ff'}, 0 0 0 ${isMobile?5:6}px ${evt.color}35` }}>{evt.icon}</div>
              <div style={{ flex:1, maxWidth: isMobile?`calc(100% - ${DOT+14}px)`:'44%' }}>
                <div style={{ ...card(isDark), padding: isMobile?'16px 14px':'20px 22px', position:'relative', overflow:'hidden', boxShadow: isDark?'0 4px 20px rgba(0,0,0,0.3)':'0 4px 20px rgba(99,102,241,0.08)' }}>
                  <div style={{ position:'absolute', top:0, left:0, right:0, height:'2px', background:`linear-gradient(90deg,transparent,${evt.color},transparent)` }} />
                  <div style={{ display:'inline-flex', alignItems:'center', gap:'5px', background:`${evt.color}18`, border:`1px solid ${evt.color}35`, borderRadius:'20px', padding:'3px 10px', marginBottom:'8px' }}>
                    <span style={{ width:4, height:4, borderRadius:'50%', background:evt.color, display:'inline-block', animation:'dot 1.6s ease-in-out infinite' }} />
                    <span style={{ fontSize:'0.62rem', fontWeight:'900', color:evt.color, letterSpacing:'0.1em' }}>{evt.tag}</span>
                    <span style={{ width:1, height:9, background:`${evt.color}40`, display:'inline-block' }} />
                    <span style={{ fontSize:'0.62rem', fontWeight:'700', color: isDark?'#64748b':'#94a3b8' }}>{evt.date}</span>
                  </div>
                  <h3 style={{ fontSize: isMobile?'0.95rem':'1.05rem', fontWeight:'900', color: isDark?'#e2e8f0':'#0f172a', margin:'0 0 6px' }}>{evt.title}</h3>
                  <p style={{ fontSize: isMobile?'0.76rem':'0.82rem', color: isDark?'#94a3b8':'#475569', margin:0, lineHeight:1.6 }}>{evt.desc}</p>
                </div>
              </div>
              {!isMobile && <div style={{ flex:1 }} />}
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default function HomePage({ setCurrentPage }) {
  const [txt, setTxt] = useState('');
  const [idx, setIdx] = useState(0);
  const [del, setDel] = useState(false);
  const [pi, setPi] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [mounted, setMounted] = useState(false);
  const { isDark } = useTheme();
  const { user, logout } = useAuth();
  // eslint-disable-next-line no-unused-vars
  const _count = useLiveStudentCount();
  const isAdmin = user?.email === 'luckyfaizu3@gmail.com';

  const [featRef, featVis] = useScrollReveal();
  const [infoRef, infoVis] = useScrollReveal();
  const [founderRef, founderVis] = useScrollReveal();
  const [mockRef, mockVis] = useScrollReveal();

  useEffect(() => { setTimeout(() => setMounted(true), 60); }, []);
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  const phrases = useRef([
    'Premium Study Notes','Master Python','Excel in Exams','Land Your Dream Job',
    '60 Questions Mock Tests','Anti-Cheat Exam System','Earn Your Certificate','Basic • Advanced • Pro'
  ]).current;

  useEffect(() => {
    const cp = phrases[pi];
    const speed = del ? 22 : 65;
    const t = setTimeout(() => {
      if (!del && idx < cp.length) { setTxt(cp.substring(0,idx+1)); setIdx(idx+1); }
      else if (del && idx > 0) { setTxt(cp.substring(0,idx-1)); setIdx(idx-1); }
      else if (!del && idx === cp.length) { setTimeout(() => setDel(true), 1800); }
      else if (del && idx === 0) { setDel(false); setPi((pi+1) % phrases.length); }
    }, speed);
    return () => clearTimeout(t);
  }, [idx, del, pi, phrases]);

  const C = (extra={}) => ({
    background: isDark ? 'rgba(15,23,42,0.95)' : '#ffffff',
    border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e8eaf0',
    borderRadius: '16px',
    ...extra,
  });

  // ✅ ACTION CARDS — Game button added!
  const actionCards = [
    { icon:'📚', label:'Browse Notes',    page:'products',    g:'linear-gradient(135deg,#6366f1,#8b5cf6)', glow:'rgba(99,102,241,0.3)',  c:'#6366f1' },
    { icon:'🐍', label:'Mock Tests',      page:'mocktests',   g:'linear-gradient(135deg,#10b981,#34d399)', glow:'rgba(16,185,129,0.3)',  c:'#10b981' },
    { icon:'🔥', label:'30-Day Streak',   page:'streak',      g:'linear-gradient(135deg,#ff6b00,#ff3d00)', glow:'rgba(255,107,0,0.35)', c:'#ff6b00' },
    { icon:'🎮', label:'Brain Trap',      page:'braintrap',   g:'linear-gradient(135deg,#f59e0b,#ef4444)', glow:'rgba(245,158,11,0.35)', c:'#f59e0b' },
    { icon:'📦', label:'My Orders',       page:'orders',      g:'linear-gradient(135deg,#f59e0b,#fbbf24)', glow:'rgba(245,158,11,0.3)',  c:'#f59e0b' },
    { icon:'🏆', label:'Leaderboard',     page:'leaderboard', g:'linear-gradient(135deg,#8b5cf6,#d946ef)', glow:'rgba(139,92,246,0.3)',  c:'#8b5cf6' },
    user
      ? { icon:'👤', label:'Logout', page:null, g:'linear-gradient(135deg,#ef4444,#dc2626)', glow:'rgba(239,68,68,0.3)', c:'#ef4444', action:logout }
      : { icon:'🔐', label:'Login',  page:'login', g:'linear-gradient(135deg,#ec4899,#f472b6)', glow:'rgba(236,72,153,0.3)', c:'#ec4899' },
  ];

  return (
    <div style={{ paddingTop: isMobile?'62px':'70px', minHeight:'100vh', overflowX:'hidden' }}>
      <ScrollProgressBar isDark={isDark} />

      {/* ═══ HERO ═══ */}
      <section style={{ padding: isMobile?'36px 16px 28px':'80px 24px 60px', textAlign:'center', position:'relative', background: isDark?'linear-gradient(180deg,rgba(15,10,60,0.7) 0%,transparent 100%)':'linear-gradient(180deg,#eef1ff 0%,transparent 100%)', borderRadius:'0 0 32px 32px' }}>
        <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', background: isDark?'rgba(99,102,241,0.08)':'rgba(99,102,241,0.05)', border:'1px solid rgba(99,102,241,0.2)', borderRadius:'50px', padding:'6px 16px 6px 8px', marginBottom: isMobile?'18px':'24px', opacity: mounted?1:0, transform: mounted?'translateY(0)':'translateY(-16px)', transition:'opacity 0.5s ease, transform 0.5s ease' }}>
          <div style={{ width:'28px', height:'28px', background:'linear-gradient(135deg,#6366f1,#ec4899)', borderRadius:'8px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px' }}>🎓</div>
          <span style={{ fontSize:'0.8rem', fontWeight:'800', color:'#6366f1' }}>PySkill</span>
          <div style={{ width:'1px', height:'12px', background:'rgba(99,102,241,0.2)' }} />
          <span style={{ fontSize:'0.72rem', fontWeight:'700', color: isDark?'#a78bfa':'#7c3aed' }}>EST. 2026</span>
          <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#10b981', display:'inline-block', animation:'dot 1.4s ease-in-out infinite' }} />
        </div>

        <h1 style={{ fontSize: isMobile?'1.9rem':'3.6rem', fontWeight:'900', marginBottom:'10px', background:'linear-gradient(135deg,#1e40af,#6366f1 45%,#ec4899)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', lineHeight:1.15, minHeight: isMobile?'50px':'90px', display:'flex', alignItems:'center', justifyContent:'center', padding:'0 8px', letterSpacing:'-0.02em', opacity: mounted?1:0, transform: mounted?'translateY(0)':'translateY(20px)', transition:'opacity 0.5s ease 0.15s, transform 0.5s ease 0.15s' }}>
          {txt}<span style={{ borderRight:'3px solid #6366f1', animation:'blink 0.7s infinite', marginLeft:'3px', height: isMobile?'28px':'52px', display:'inline-block', verticalAlign:'middle' }} />
        </h1>

        <p style={{ fontSize: isMobile?'0.88rem':'1.1rem', color: isDark?'#94a3b8':'#64748b', maxWidth:'520px', margin:'0 auto 20px', lineHeight:1.65, fontWeight:'500', opacity: mounted?1:0, transform: mounted?'translateY(0)':'translateY(14px)', transition:'opacity 0.5s ease 0.28s, transform 0.5s ease 0.28s' }}>
          Quality study materials for Python & Job Prep — delivered instantly after payment.
        </p>

        <div style={{ display:'flex', gap:'7px', justifyContent:'center', flexWrap:'wrap', marginBottom:'24px', opacity: mounted?1:0, transition:'opacity 0.5s ease 0.38s' }}>
          {[
            { icon:Shield, color:'#10b981', text:'Secure Payment' },
            { icon:Zap,    color:'#6366f1', text:'Instant Access' },
            { icon:BookOpen, color:'#ec4899', text:'100% Original' },
          ].map((b,i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:'5px', background: isDark?`${b.color}12`:`${b.color}0d`, padding:'6px 12px', borderRadius:'50px', border:`1px solid ${b.color}${isDark?'40':'28'}` }}>
              <b.icon size={13} color={b.color} />
              <span style={{ fontSize: isMobile?'0.7rem':'0.76rem', fontWeight:'700', color:b.color }}>{b.text}</span>
            </div>
          ))}
        </div>

        <div style={{ opacity: mounted?1:0, transition:'opacity 0.5s ease 0.48s' }}>
          <button onClick={() => setCurrentPage('products')} style={{ background:'linear-gradient(135deg,#6366f1,#ec4899)', border:'none', color:'#fff', padding: isMobile?'12px 28px':'15px 40px', fontSize: isMobile?'0.92rem':'1.05rem', borderRadius:'50px', cursor:'pointer', fontWeight:'800', display:'inline-flex', alignItems:'center', gap:'8px', boxShadow:'0 6px 24px rgba(99,102,241,0.35)', transition:'transform 0.2s ease, box-shadow 0.2s ease' }}
            onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 10px 28px rgba(99,102,241,0.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 6px 24px rgba(99,102,241,0.35)'; }}>
            <Download size={isMobile?17:19} /> Browse Notes Now
          </button>
        </div>
      </section>

      {/* ═══ ACTION CARDS — 6 cards with Game button ═══ */}
      <section style={{ padding: isMobile?'24px 16px':'40px 24px', maxWidth:'1100px', margin:'0 auto' }}>
        <div style={{ display:'grid', gridTemplateColumns: isMobile?'repeat(3, 1fr)':'repeat(7, 1fr)', gap: isMobile?'8px':'12px' }}>
          {actionCards.map((c, i) => (
            <ActionCard key={i} card={c} isDark={isDark} isMobile={isMobile}
              onClick={() => { if (c.action) c.action(); else setCurrentPage(c.page); }} />
          ))}
        </div>
      </section>

      {/* ═══ MOCK TEST ═══ */}
      <section ref={mockRef} style={{ padding: isMobile?'0 16px 28px':'0 24px 40px', maxWidth:'1000px', margin:'0 auto', opacity: mockVis?1:0, transform: mockVis?'translateY(0)':'translateY(18px)', transition:'opacity 0.45s ease, transform 0.45s ease' }}>
        <div style={{ ...C(), padding: isMobile?'18px 14px':'24px 28px', position:'relative', overflow:'hidden', boxShadow: isDark?'0 4px 20px rgba(0,0,0,0.25)':'0 4px 20px rgba(99,102,241,0.07)' }}>
          <div style={{ position:'absolute', top:0, left:0, right:0, height:'2px', background:'linear-gradient(90deg,#10b981,#6366f1,#ec4899)' }} />
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'7px', marginBottom: isMobile?'14px':'18px' }}>
            <span>🐍</span>
            <span style={{ fontSize: isMobile?'0.76rem':'0.82rem', fontWeight:'900', color:'#10b981', letterSpacing:'0.1em', textTransform:'uppercase' }}>Python Mock Tests</span>
            <span style={{ width:5, height:5, borderRadius:'50%', background:'#10b981', display:'inline-block', animation:'dot 1.4s ease-in-out infinite' }} />
            <span style={{ fontSize: isMobile?'0.68rem':'0.74rem', fontWeight:'700', color: isDark?'#64748b':'#94a3b8' }}>Anti-Cheat System</span>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap: isMobile?'8px':'12px', marginBottom: isMobile?'12px':'16px' }}>
            {[
              { emoji:'🌱', level:'Basic',    q:'60 Qs', t:'60 Min',  color:'#10b981' },
              { emoji:'🔥', level:'Advanced', q:'60 Qs', t:'120 Min', color:'#6366f1' },
              { emoji:'⭐', level:'Pro',      q:'60 Qs', t:'180 Min', color:'#f59e0b' },
            ].map((lvl,i) => (
              <div key={i} onClick={() => setCurrentPage('mocktests')} style={{ background: isDark?`${lvl.color}15`:`${lvl.color}0e`, border:`1px solid ${lvl.color}${isDark?'38':'22'}`, borderRadius: isMobile?'12px':'14px', padding: isMobile?'12px 8px':'16px 12px', textAlign:'center', cursor:'pointer', transition:'transform 0.18s ease, box-shadow 0.18s ease' }}
                onMouseEnter={e => { e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow=`0 8px 20px ${lvl.color}30`; }}
                onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='none'; }}>
                <div style={{ fontSize: isMobile?'1.4rem':'1.65rem', marginBottom:'5px' }}>{lvl.emoji}</div>
                <div style={{ fontSize: isMobile?'0.78rem':'0.88rem', fontWeight:'900', color:lvl.color, marginBottom:'4px' }}>{lvl.level}</div>
                <div style={{ fontSize: isMobile?'0.65rem':'0.72rem', fontWeight:'700', color: isDark?'#94a3b8':'#64748b', lineHeight:1.5 }}>{lvl.q}<br/>{lvl.t}</div>
              </div>
            ))}
          </div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:'5px', justifyContent:'center' }}>
            {['🔒 Anti-Cheat','🚫 Tab Switch','🖥️ Fullscreen','🏆 Cert 55%+'].map((x,i) => (
              <span key={i} style={{ fontSize: isMobile?'0.62rem':'0.7rem', fontWeight:'700', color: isDark?'#64748b':'#94a3b8', background: isDark?'rgba(255,255,255,0.04)':'#f1f5f9', border: isDark?'1px solid rgba(255,255,255,0.07)':'1px solid #e2e8f0', borderRadius:'16px', padding: isMobile?'2px 8px':'3px 10px' }}>{x}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ TOP RANKERS ═══ */}
      <TopRankersSection isDark={isDark} isMobile={isMobile} />

      {/* ═══ REVIEWS ═══ */}
      <StudentReviews isDark={isDark} isMobile={isMobile} isAdmin={isAdmin} user={user} />

      {/* ═══ TIMELINE ═══ */}
      <Timeline isDark={isDark} isMobile={isMobile} />

      {/* ═══ FEATURES ═══ */}
      <section ref={featRef} style={{ padding: isMobile?'0 16px 28px':'0 24px 40px', maxWidth:'1000px', margin:'0 auto' }}>
        <h2 style={{ fontSize: isMobile?'1.35rem':'1.85rem', fontWeight:'900', textAlign:'center', marginBottom: isMobile?'18px':'28px', color: isDark?'#e2e8f0':'#1e293b', letterSpacing:'-0.02em', opacity: featVis?1:0, transform: featVis?'translateY(0)':'translateY(16px)', transition:'opacity 0.45s ease, transform 0.45s ease' }}>Why Students Love Us</h2>
        <div style={{ display:'grid', gridTemplateColumns: isMobile?'1fr':'repeat(3,1fr)', gap: isMobile?'10px':'14px' }}>
          {[
            { icon:'📚', title:'Quality Content', desc:'Expert-curated notes & filtered important questions.', color:'#6366f1' },
            { icon:'🔒', title:'Secure & Safe',   desc:'Razorpay protected payments — UPI, Cards & more.',   color:'#10b981' },
            { icon:'⚡', title:'Instant Download', desc:'Get your PDFs the second payment is done.',           color:'#ec4899' },
          ].map((f,i) => (
            <div key={i} style={{ ...C({ padding: isMobile?'16px':'22px', display:'flex', alignItems:'flex-start', gap:'13px', boxShadow: isDark?'0 3px 16px rgba(0,0,0,0.2)':'0 3px 16px rgba(99,102,241,0.06)', opacity: featVis?1:0, transform: featVis?'translateY(0)':'translateY(14px)', transition:`opacity 0.4s ease ${i*0.07}s, transform 0.4s ease ${i*0.07}s` }) }}
              onMouseEnter={e => { e.currentTarget.style.transform='translateY(-3px)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; }}>
              <div style={{ width: isMobile?'38px':'42px', height: isMobile?'38px':'42px', flexShrink:0, background:`${f.color}${isDark?'1a':'0f'}`, borderRadius:'12px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.2rem', border:`1px solid ${f.color}22` }}>{f.icon}</div>
              <div>
                <div style={{ fontSize: isMobile?'0.88rem':'0.94rem', fontWeight:'800', color: isDark?'#e2e8f0':'#0f172a', marginBottom:'4px' }}>{f.title}</div>
                <div style={{ fontSize: isMobile?'0.75rem':'0.8rem', color: isDark?'#94a3b8':'#64748b', lineHeight:1.5 }}>{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ INFO CARDS ═══ */}
      <section ref={infoRef} style={{ padding: isMobile?'0 16px 28px':'0 24px 40px', maxWidth:'1000px', margin:'0 auto' }}>
        <h2 style={{ fontSize: isMobile?'1.35rem':'1.85rem', fontWeight:'900', textAlign:'center', marginBottom: isMobile?'18px':'28px', background:'linear-gradient(135deg,#6366f1,#ec4899)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', letterSpacing:'-0.02em', opacity: infoVis?1:0, transform: infoVis?'translateY(0)':'translateY(16px)', transition:'opacity 0.45s ease, transform 0.45s ease' }}>Why PySkill?</h2>
        <div style={{ display:'grid', gridTemplateColumns: isMobile?'1fr':'repeat(2,1fr)', gap: isMobile?'10px':'14px' }}>
          {[
            { icon:'📜', title:'Our Policy',          desc:'Genuine, quality-checked materials. No refund after download, but satisfaction guaranteed with preview.', color:'#6366f1' },
            { icon:'💳', title:'Secure Payment',      desc:"Via Razorpay — India's most trusted gateway. UPI, Cards, Net Banking & Wallets. Fully encrypted.",        color:'#10b981' },
            { icon:'🎯', title:'Why Choose Us',       desc:'Instant access, lifetime downloads, mobile-friendly PDFs, expert content & 24/7 WhatsApp support.',        color:'#f59e0b' },
            { icon:'⭐', title:'What Makes Us Better', desc:'No outdated content. Every note filtered for importance. Real reviews, no hidden charges.',                 color:'#8b5cf6' },
          ].map((c,i) => (
            <div key={i} style={{ ...C({ padding: isMobile?'16px':'20px', position:'relative', overflow:'hidden', boxShadow: isDark?'0 3px 16px rgba(0,0,0,0.2)':'0 3px 16px rgba(99,102,241,0.06)', opacity: infoVis?1:0, transform: infoVis?'translateY(0)':'translateY(14px)', transition:`opacity 0.4s ease ${i*0.07}s, transform 0.4s ease ${i*0.07}s` }) }}
              onMouseEnter={e => { e.currentTarget.style.transform='translateY(-3px)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; }}>
              <div style={{ position:'absolute', top:0, left:0, right:0, height:'2px', background:`linear-gradient(90deg,transparent,${c.color}70,transparent)` }} />
              <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'8px' }}>
                <div style={{ width: isMobile?'34px':'38px', height: isMobile?'34px':'38px', background:`${c.color}${isDark?'1a':'0f'}`, borderRadius:'10px', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1rem', border:`1px solid ${c.color}22`, flexShrink:0 }}>{c.icon}</div>
                <h3 style={{ fontSize: isMobile?'0.9rem':'0.95rem', fontWeight:'800', color:c.color, margin:0 }}>{c.title}</h3>
              </div>
              <p style={{ fontSize: isMobile?'0.75rem':'0.8rem', color: isDark?'#94a3b8':'#64748b', lineHeight:1.6, margin:0 }}>{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ FOUNDER ═══ */}
      <section ref={founderRef} style={{ padding: isMobile?'0 16px 44px':'0 24px 64px', maxWidth:'660px', margin:'0 auto', opacity: founderVis?1:0, transform: founderVis?'translateY(0)':'translateY(16px)', transition:'opacity 0.45s ease, transform 0.45s ease' }}>
        <div style={{ ...C({ padding: isMobile?'20px 16px':'32px', display:'flex', flexDirection: isMobile?'column':'row', alignItems: isMobile?'center':'flex-start', gap: isMobile?'16px':'22px', textAlign: isMobile?'center':'left', position:'relative', overflow:'hidden', boxShadow: isDark?'0 4px 24px rgba(0,0,0,0.3)':'0 4px 24px rgba(99,102,241,0.1)' }) }}
          onMouseEnter={e => { e.currentTarget.style.transform='translateY(-3px)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; }}>
          <div style={{ position:'absolute', top:0, left:0, right:0, height:'2px', background:'linear-gradient(90deg,#6366f1,#ec4899,#a78bfa)', backgroundSize:'200% 100%', animation:'shimmer 3s ease-in-out infinite' }} />
          <div style={{ flexShrink:0 }}>
            <div style={{ width: isMobile?'78px':'108px', height: isMobile?'78px':'108px', borderRadius:'50%', overflow:'hidden', border:'2px solid rgba(99,102,241,0.3)' }}>
              <img src="https://i.ibb.co/WWW1ttkx/Whats-App-Image-2026-01-31-at-1-57-14-PM.jpg" alt="Faizan Tariq" crossOrigin="anonymous" style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e => { e.target.style.display='none'; }} />
            </div>
          </div>
          <div style={{ flex:1 }}>
            <h3 style={{ fontSize: isMobile?'1.1rem':'1.35rem', fontWeight:'900', color: isDark?'#e2e8f0':'#0f172a', marginBottom:'2px' }}>Faizan Tariq</h3>
            <div style={{ fontSize:'0.78rem', color:'#6366f1', fontWeight:'700', marginBottom:'8px' }}>Software Engineering • ILS Srinagar</div>
            <p style={{ fontSize: isMobile?'0.76rem':'0.82rem', color: isDark?'#94a3b8':'#64748b', lineHeight:1.6, margin:'0 0 14px' }}>Providing quality study materials & filtered important questions to help students excel — because we are students too.</p>
            <a href="https://instagram.com/code_with_06" target="_blank" rel="noopener noreferrer" style={{ display:'inline-flex', alignItems:'center', gap:'6px', background:'linear-gradient(135deg,#f093fb,#f5576c)', color:'#fff', padding: isMobile?'7px 16px':'8px 18px', borderRadius:'50px', textDecoration:'none', fontWeight:'700', fontSize: isMobile?'0.75rem':'0.8rem', boxShadow:'0 4px 14px rgba(240,147,251,0.3)', transition:'transform 0.2s ease, box-shadow 0.2s ease' }}
              onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 6px 20px rgba(240,147,251,0.45)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow='0 4px 14px rgba(240,147,251,0.3)'; }}>
              <Instagram size={isMobile?13:15} /> Follow on Instagram
            </a>
          </div>
        </div>
      </section>

      <style>{`
        @keyframes blink   { 0%,50%{opacity:1}51%,100%{opacity:0} }
        @keyframes dot     { 0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.3;transform:scale(1.5)} }
        @keyframes shimmer { 0%{background-position:200% 0}100%{background-position:-200% 0} }
        @keyframes rise    { from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)} }
        @keyframes ping    { 0%{opacity:0;transform:scale(1)}35%{opacity:0.4;transform:scale(1.04)}65%{opacity:0.4;transform:scale(1.04)}100%{opacity:0;transform:scale(1.1)} }
      `}</style>
    </div>
  );
}

function ActionCard({ card, isDark, isMobile, onClick }) {
  const [pressed, setPressed] = useState(false);
  const [hovered, setHovered] = useState(false);
  return (
    <button onClick={onClick}
      onMouseDown={() => setPressed(true)} onMouseUp={() => setPressed(false)}
      onMouseLeave={() => { setPressed(false); setHovered(false); }}
      onMouseEnter={() => setHovered(true)}
      onTouchStart={() => setPressed(true)} onTouchEnd={() => setPressed(false)}
      style={{
        background: hovered ? isDark?'rgba(255,255,255,0.08)':'rgba(255,255,255,0.98)' : isDark?'rgba(255,255,255,0.04)':'#ffffff',
        border: hovered ? `1.5px solid ${card.c}44` : isDark?'1px solid rgba(255,255,255,0.08)':'1px solid #e8eaf0',
        borderRadius: isMobile?'16px':'18px', padding: isMobile?'14px 6px':'18px 10px', cursor:'pointer',
        display:'flex', flexDirection:'column', alignItems:'center', gap: isMobile?'7px':'9px',
        position:'relative', overflow:'hidden',
        transform: pressed?'scale(0.94)':hovered?'translateY(-3px)':'scale(1)',
        transition:'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease, background 0.15s ease',
        boxShadow: hovered ? `0 8px 22px ${card.glow}` : isDark?'0 2px 10px rgba(0,0,0,0.2)':'0 2px 10px rgba(99,102,241,0.05)',
        animation:'rise 0.4s ease both', outline:'none',
      }}>
      {!isMobile && hovered && <div style={{ position:'absolute', inset:0, borderRadius:'inherit', border:`1.5px solid ${card.c}`, opacity:0, animation:'ping 1.6s ease infinite', pointerEvents:'none' }} />}
      <div style={{ width: isMobile?'38px':'42px', height: isMobile?'38px':'42px', background:card.g, borderRadius:'11px', display:'flex', alignItems:'center', justifyContent:'center', fontSize: isMobile?'1.15rem':'1.3rem', boxShadow:`0 3px 12px ${card.glow}`, transform: hovered?'scale(1.1)':'scale(1)', transition:'transform 0.15s ease' }}>{card.icon}</div>
      <span style={{ fontSize: isMobile?'0.68rem':'0.78rem', fontWeight:'800', color: hovered?card.c: isDark?'#e2e8f0':'#1e293b', transition:'color 0.15s ease' }}>{card.label}</span>
    </button>
  );
}