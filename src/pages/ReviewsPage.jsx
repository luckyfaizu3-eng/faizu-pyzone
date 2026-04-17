// @ts-nocheck
/**
 * FILE: src/pages/ReviewsPage.jsx
 * USAGE: App.jsx mein import karke 'reviews' page case mein render karo
 *
 * import ReviewsPage from './pages/ReviewsPage';
 * // App.jsx router mein:
 * case 'reviews': return <ReviewsPage setCurrentPage={setCurrentPage} />;
 */

import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { Star } from 'lucide-react';
import { useTheme, useAuth } from '../App';
import { db } from '../firebase';
import {
  collection, getDocs, query, orderBy, addDoc, deleteDoc,
  doc, limit, startAfter
} from 'firebase/firestore';

/* ─────────────────────────────────────────
   HELPERS
───────────────────────────────────────── */
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
  return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

const PALETTES = [
  { from: '#6366f1', to: '#8b5cf6' },
  { from: '#10b981', to: '#0ea5e9' },
  { from: '#f59e0b', to: '#ef4444' },
  { from: '#ec4899', to: '#a855f7' },
  { from: '#3b82f6', to: '#6366f1' },
  { from: '#14b8a6', to: '#6366f1' },
];

/* ─────────────────────────────────────────
   REVIEW CARD (Full — with comments)
───────────────────────────────────────── */
const ReviewCard = memo(function ReviewCard({ review, isDark, isMobile, isAdmin, user, onDeleteClick }) {
  const [comments, setComments] = useState([]);
  const [showCmts, setShowCmts] = useState(false);
  const [cmtLoading, setCmtLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [posting, setPosting] = useState(false);
  const cmtsFetched = useRef(false);

  const pal = PALETTES[(review.name?.charCodeAt(0) || 0) % PALETTES.length];
  const stars = review.stars || 5;
  const igHandle = review.instagram ? review.instagram.replace(/^@/, '') : null;

  const handleToggleComments = useCallback(async () => {
    if (!showCmts && !cmtsFetched.current) {
      setCmtLoading(true);
      try {
        const snap = await getDocs(query(
          collection(db, 'studentReviews', review.id, 'comments'),
          orderBy('createdAt', 'asc')
        ));
        setComments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        cmtsFetched.current = true;
      } catch { }
      finally { setCmtLoading(false); }
    }
    setShowCmts(s => !s);
  }, [showCmts, review.id]);

  const postComment = useCallback(async () => {
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
      const snap = await getDocs(query(
        collection(db, 'studentReviews', review.id, 'comments'),
        orderBy('createdAt', 'asc')
      ));
      setComments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setShowCmts(true);
    } catch { window.showToast?.('❌ Comment failed', 'error'); }
    finally { setPosting(false); }
  }, [commentText, user, review.id]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey && !('ontouchstart' in window)) {
      e.preventDefault();
      postComment();
    }
  }, [postComment]);

  return (
    <div style={{
      position: 'relative', borderRadius: '22px', overflow: 'hidden',
      background: isDark ? '#0f172a' : '#ffffff',
      border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)',
      boxShadow: isDark ? '0 2px 16px rgba(0,0,0,0.5)' : '0 2px 16px rgba(0,0,0,0.05)',
      transition: 'transform 0.22s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.22s ease',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      <div style={{ height: '3px', background: `linear-gradient(90deg, ${pal.from}, ${pal.to})` }} />

      <div style={{ padding: isMobile ? '16px 14px 12px' : '20px 20px 14px', position: 'relative' }}>
        {isAdmin && (
          <button
            onClick={onDeleteClick}
            style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', padding: '3px 9px', fontSize: '0.62rem', fontWeight: '800', color: '#ef4444', cursor: 'pointer' }}
          >🗑️</button>
        )}

        <div style={{ display: 'flex', gap: '13px', alignItems: 'flex-start', marginBottom: '14px' }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{ width: isMobile ? '48px' : '56px', height: isMobile ? '48px' : '56px', borderRadius: '16px', background: `linear-gradient(135deg, ${pal.from}, ${pal.to})`, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {review.photo
                ? <img src={review.photo} alt={review.name} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} />
                : <span style={{ color: '#fff', fontWeight: '900', fontSize: isMobile ? '1.2rem' : '1.4rem' }}>{(review.name || 'U')[0].toUpperCase()}</span>
              }
            </div>
            <div style={{ position: 'absolute', bottom: '-3px', right: '-3px', width: '18px', height: '18px', borderRadius: '50%', background: 'linear-gradient(135deg,#3b82f6,#6366f1)', border: '2px solid ' + (isDark ? '#0f172a' : '#fff'), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="8" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l2.5 2.5L9 1" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: isMobile ? '0.92rem' : '1rem', fontWeight: '800', color: isDark ? '#f1f5f9' : '#0f172a', marginBottom: '4px' }}>{review.name}</div>
            {igHandle && (
              <a href={`https://instagram.com/${igHandle}`} target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px 3px 7px', borderRadius: '20px', background: 'linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)', textDecoration: 'none', marginBottom: '5px' }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" stroke="#fff" strokeWidth="2"/><circle cx="12" cy="12" r="5" stroke="#fff" strokeWidth="2"/><circle cx="17.5" cy="6.5" r="1.2" fill="#fff"/></svg>
                <span style={{ fontSize: '0.68rem', fontWeight: '700', color: '#fff' }}>{igHandle}</span>
              </a>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1px', marginBottom: '6px' }}>
              {[1,2,3,4,5].map(s => (
                <svg key={s} width="13" height="13" viewBox="0 0 24 24"
                  fill={s <= stars ? '#f59e0b' : 'none'}
                  stroke={s <= stars ? '#f59e0b' : isDark ? '#1e293b' : '#e2e8f0'}
                  strokeWidth="2">
                  <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
                </svg>
              ))}
              <span style={{ fontSize: '0.68rem', fontWeight: '800', color: '#f59e0b', marginLeft: '4px' }}>{stars}.0</span>
              <span style={{ fontSize: '0.62rem', color: isDark ? '#334155' : '#cbd5e1', margin: '0 4px' }}>·</span>
              <span style={{ fontSize: '0.65rem', color: isDark ? '#475569' : '#94a3b8', fontWeight: '500' }}>{timeAgo(review.createdAt)}</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
              {review.course && <span style={{ fontSize: '0.6rem', fontWeight: '700', padding: '2px 8px', borderRadius: '6px', background: isDark ? `${pal.from}20` : `${pal.from}12`, color: pal.from, border: `1px solid ${pal.from}30` }}>🎓 {review.course}</span>}
              {review.address && <span style={{ fontSize: '0.6rem', fontWeight: '700', padding: '2px 8px', borderRadius: '6px', background: isDark ? 'rgba(16,185,129,0.12)' : 'rgba(16,185,129,0.07)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)' }}>📍 {review.address}</span>}
            </div>
          </div>
        </div>

        <div style={{ position: 'relative', background: isDark ? 'rgba(255,255,255,0.03)' : `${pal.from}08`, borderRadius: '12px', padding: '12px 14px 12px 16px', marginBottom: '12px', borderLeft: `3px solid ${pal.from}` }}>
          <p style={{ margin: 0, fontSize: isMobile ? '0.82rem' : '0.875rem', color: isDark ? '#cbd5e1' : '#374151', lineHeight: 1.72, fontWeight: '500', fontStyle: 'italic' }}>{review.text}</p>
        </div>

        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: isDark ? 'rgba(16,185,129,0.1)' : 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.22)', borderRadius: '8px', padding: '3px 9px' }}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5"><polyline points="20,6 9,17 4,12"/></svg>
          <span style={{ fontSize: '0.6rem', fontWeight: '800', color: '#10b981', letterSpacing: '0.4px' }}>Verified PySkill Student</span>
        </div>
      </div>

      {/* Comments */}
      <div style={{ borderTop: isDark ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(0,0,0,0.05)', padding: isMobile ? '10px 14px 13px' : '10px 20px 14px' }}>
        {(review.commentCount > 0 || comments.length > 0) && (
          <button onClick={handleToggleComments} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.72rem', fontWeight: '700', color: pal.from, padding: '0 0 8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            {cmtLoading ? <span>⏳</span> : <span style={{ fontSize: '0.6rem' }}>{showCmts ? '▲' : '▼'}</span>}
            {showCmts ? 'Hide' : 'View'} {review.commentCount || comments.length} comment{(review.commentCount || comments.length) !== 1 ? 's' : ''}
          </button>
        )}
        {showCmts && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', marginBottom: '10px' }}>
            {comments.map(c => (
              <div key={c.id} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, background: `${pal.from}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem' }}>
                  {c.userPhoto ? <img src={c.userPhoto} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display = 'none'; }} /> : '👤'}
                </div>
                <div style={{ flex: 1, background: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc', borderRadius: '10px', border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid #f0f4f8', padding: '6px 11px' }}>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '2px' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: '800', color: isDark ? '#e2e8f0' : '#0f172a' }}>{c.userName}</span>
                    <span style={{ fontSize: '0.58rem', color: isDark ? '#334155' : '#94a3b8' }}>{timeAgo(c.createdAt)}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.74rem', color: isDark ? '#cbd5e1' : '#374151', lineHeight: 1.5 }}>{c.text}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        {user ? (
          <div style={{ display: 'flex', gap: '7px', alignItems: 'center' }}>
            <div style={{ width: '26px', height: '26px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, background: `${pal.from}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem' }}>
              {user.photoURL ? <img src={user.photoURL} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '👤'}
            </div>
            <input
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isMobile ? 'Comment...' : 'Add a comment...'}
              style={{ flex: 1, padding: '7px 13px', border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e8edf3', borderRadius: '20px', fontSize: '0.76rem', fontWeight: '500', background: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc', color: isDark ? '#e2e8f0' : '#0f172a', outline: 'none' }}
            />
            <button
              onClick={postComment}
              disabled={posting || !commentText.trim()}
              style={{ padding: '7px 13px', borderRadius: '20px', background: commentText.trim() ? `linear-gradient(135deg,${pal.from},${pal.to})` : isDark ? 'rgba(255,255,255,0.05)' : '#f0f0f0', border: 'none', color: commentText.trim() ? '#fff' : isDark ? '#334155' : '#94a3b8', fontWeight: '800', fontSize: '0.7rem', cursor: commentText.trim() ? 'pointer' : 'default', transition: 'all 0.2s' }}
            >
              {posting ? '...' : 'Post'}
            </button>
          </div>
        ) : (
          <p style={{ margin: 0, fontSize: '0.68rem', color: isDark ? '#334155' : '#94a3b8' }}>🔐 Login to comment</p>
        )}
      </div>
    </div>
  );
});

/* ─────────────────────────────────────────
   ADD REVIEW FORM
───────────────────────────────────────── */
const REVIEW_MAX_CHARS = 500;

function AddReviewForm({ isDark, isMobile, user, onSave, onCancel, existingUserIds }) {
  const [form, setForm] = useState({ name: user?.displayName || '', address: '', course: '', text: '', stars: 5, instagram: '' });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const h = k => e => setForm(f => ({ ...f, [k]: e.target.value }));
  const inp = {
    width: '100%', padding: '10px 14px',
    border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0',
    borderRadius: '12px', fontSize: '0.85rem', fontWeight: '600',
    background: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc',
    color: isDark ? '#e2e8f0' : '#1e293b', outline: 'none', boxSizing: 'border-box',
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.text.trim()) { window.showToast?.('⚠️ Name and review required!', 'warning'); return; }
    if (!photoFile) { window.showToast?.('⚠️ Please add your photo!', 'warning'); return; }
    if (user?.uid && existingUserIds?.includes(user.uid)) { window.showToast?.('⚠️ You already submitted a review!', 'warning'); return; }

    setSaving(true);
    let photoUrl = '';
    setUploading(true);
    try {
      const { uploadImage } = await import('../supabaseUpload');
      const r = await uploadImage(photoFile);
      if (r.success) photoUrl = r.url;
      else { window.showToast?.('❌ Upload failed', 'error'); setSaving(false); setUploading(false); return; }
    } catch { window.showToast?.('❌ Upload error', 'error'); setSaving(false); setUploading(false); return; }
    setUploading(false);

    await onSave({ ...form, photo: photoUrl, userEmail: user?.email || '', userId: user?.uid || '' });
    setSaving(false);
  };

  const charsLeft = REVIEW_MAX_CHARS - form.text.length;

  return (
    <div style={{
      marginTop: '20px',
      background: isDark ? 'rgba(15,23,42,0.9)' : '#fff',
      border: isDark ? '1px solid rgba(99,102,241,0.22)' : '1px solid rgba(99,102,241,0.18)',
      borderRadius: '20px',
      padding: isMobile ? '20px 16px' : '28px 24px',
    }}>
      <div style={{ height: '2px', background: 'linear-gradient(90deg,#6366f1,#ec4899)', borderRadius: '20px 20px 0 0', margin: isMobile ? '-20px -16px 20px' : '-28px -24px 24px' }} />
      <h3 style={{ fontSize: '0.96rem', fontWeight: '900', color: isDark ? '#e2e8f0' : '#1e293b', margin: '0 0 16px' }}>✍️ Write Your Review</h3>

      <label style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', borderRadius: '12px', cursor: 'pointer', border: isDark ? '1.5px dashed rgba(255,255,255,0.12)' : '1.5px dashed rgba(99,102,241,0.3)', marginBottom: '14px' }}>
        {photoPreview
          ? <><img src={photoPreview} alt="" style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover' }} /><span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#10b981' }}>✅ Photo selected</span></>
          : <><div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(99,102,241,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem' }}>📷</div><span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#6366f1' }}>Add Your Photo *</span></>
        }
        <input type="file" accept="image/*" onChange={e => {
          const f = e.target.files[0]; if (!f) return; setPhotoFile(f);
          const r = new FileReader(); r.onloadend = () => setPhotoPreview(r.result); r.readAsDataURL(f);
        }} style={{ display: 'none' }} />
      </label>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
        <input placeholder="Your Name *" value={form.name} onChange={h('name')} style={inp} />
        <input placeholder="City / Address" value={form.address} onChange={h('address')} style={inp} />
        <input placeholder="Course (e.g. Python Basic)" value={form.course} onChange={h('course')} style={inp} />
        <input placeholder="Instagram (e.g. @handle)" value={form.instagram} onChange={h('instagram')} style={inp} />
      </div>

      <div style={{ position: 'relative', marginBottom: '12px' }}>
        <textarea
          placeholder="Share your experience * (max 500 chars)"
          value={form.text}
          onChange={e => { if (e.target.value.length <= REVIEW_MAX_CHARS) h('text')(e); }}
          rows={3}
          style={{ ...inp, resize: 'vertical', width: '100%', boxSizing: 'border-box', paddingBottom: '24px' }}
        />
        <span style={{ position: 'absolute', bottom: '8px', right: '12px', fontSize: '0.62rem', fontWeight: '700', color: charsLeft < 50 ? '#ef4444' : isDark ? '#475569' : '#94a3b8' }}>
          {charsLeft} left
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
        <span style={{ fontSize: '0.78rem', fontWeight: '700', color: isDark ? '#94a3b8' : '#64748b' }}>Rating:</span>
        {[1,2,3,4,5].map(s => (
          <button key={s} onClick={() => setForm(f => ({ ...f, stars: s }))} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '1px', transition: 'transform 0.15s ease', transform: s <= form.stars ? 'scale(1.1)' : 'scale(1)' }}>
            <Star size={20} fill={s <= form.stars ? '#f59e0b' : 'none'} color={s <= form.stars ? '#f59e0b' : '#cbd5e1'} />
          </button>
        ))}
        <span style={{ fontSize: '0.76rem', color: '#f59e0b', fontWeight: '700' }}>{form.stars}/5</span>
      </div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <button onClick={handleSave} disabled={saving} style={{ flex: 1, padding: '12px', background: saving ? 'rgba(99,102,241,0.4)' : 'linear-gradient(135deg,#6366f1,#ec4899)', border: 'none', borderRadius: '12px', color: '#fff', fontWeight: '800', fontSize: '0.88rem', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1 }}>
          {uploading ? '📤 Uploading...' : saving ? '⏳ Saving...' : '✅ Submit Review'}
        </button>
        <button onClick={onCancel} style={{ padding: '12px 20px', background: 'transparent', border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0', borderRadius: '12px', color: isDark ? '#94a3b8' : '#64748b', fontWeight: '700', fontSize: '0.88rem', cursor: 'pointer' }}>
          Cancel
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   REVIEWS PAGE — Main Export
───────────────────────────────────────── */
const REVIEWS_PER_PAGE = 10;
const MAX_REVIEWS = 200;

export default function ReviewsPage({ setCurrentPage }) {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const isAdmin = user?.email === 'luckyfaizu3@gmail.com';

  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false
  );
  useEffect(() => {
    let t;
    const h = () => { clearTimeout(t); t = setTimeout(() => setIsMobile(window.innerWidth <= 768), 200); };
    window.addEventListener('resize', h, { passive: true });
    return () => { window.removeEventListener('resize', h); clearTimeout(t); };
  }, []);

  const reviewsRef = useRef([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const lastDocRef = useRef(null);
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [totalCount, setTotalCount] = useState(0);

  // Rating filter
  const [filterStars, setFilterStars] = useState(0); // 0 = all

  const fetchReviews = useCallback(async (reset = true) => {
    try {
      if (reset) setLoading(true); else setLoadingMore(true);
      if (reset) {
        const countSnap = await getDocs(collection(db, 'studentReviews'));
        setTotalCount(countSnap.size);
      }
      let q = query(collection(db, 'studentReviews'), orderBy('createdAt', 'desc'), limit(REVIEWS_PER_PAGE));
      if (!reset && lastDocRef.current) {
        q = query(collection(db, 'studentReviews'), orderBy('createdAt', 'desc'), startAfter(lastDocRef.current), limit(REVIEWS_PER_PAGE));
      }
      const snap = await getDocs(q);
      const newReviews = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      lastDocRef.current = snap.docs[snap.docs.length - 1] || null;
      setHasMore(snap.docs.length === REVIEWS_PER_PAGE);
      if (reset) {
        reviewsRef.current = newReviews; setReviews(newReviews);
      } else {
        reviewsRef.current = [...reviewsRef.current, ...newReviews];
        setReviews([...reviewsRef.current]);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); setLoadingMore(false); }
  }, []);

  useEffect(() => { fetchReviews(true); }, [fetchReviews]);

  // Scroll to top on mount
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteDoc(doc(db, 'studentReviews', deleteTarget.id));
    window.showToast?.('✅ Deleted!', 'success');
    setDeleteTarget(null);
    fetchReviews(true);
  };

  const existingUserIds = useMemo(() => reviews.map(r => r.userId).filter(Boolean), [reviews]);
  const canAddMore = totalCount < MAX_REVIEWS;
  const userAlreadyReviewed = user?.uid && existingUserIds.includes(user.uid);

  const filteredReviews = useMemo(() =>
    filterStars === 0 ? reviews : reviews.filter(r => (r.stars || 5) === filterStars),
    [reviews, filterStars]
  );

  const avgRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    return (reviews.reduce((acc, r) => acc + (r.stars || 5), 0) / reviews.length).toFixed(1);
  }, [reviews]);

  return (
    <main style={{
      paddingTop: isMobile ? '62px' : '70px',
      minHeight: '100vh',
      background: isDark ? '#0a0f1e' : '#f8fafc',
    }}>
      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ background: isDark ? 'rgba(15,23,42,0.98)' : '#fff', border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e8eaf0', borderRadius: '20px', padding: '2rem', maxWidth: '380px', width: '100%', textAlign: 'center' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🗑️</div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '900', color: isDark ? '#e2e8f0' : '#1e293b', margin: '0 0 8px' }}>Delete Review?</h3>
            <p style={{ fontSize: '0.84rem', color: isDark ? '#94a3b8' : '#64748b', margin: '0 0 20px' }}>Delete review by <strong>{deleteTarget.name}</strong>?</p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setDeleteTarget(null)} style={{ flex: 1, padding: '11px', borderRadius: '12px', background: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9', border: 'none', color: isDark ? '#94a3b8' : '#64748b', fontWeight: '700', cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleDelete} style={{ flex: 1, padding: '11px', borderRadius: '12px', background: 'linear-gradient(135deg,#ef4444,#dc2626)', border: 'none', color: '#fff', fontWeight: '800', cursor: 'pointer' }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: '960px', margin: '0 auto', padding: isMobile ? '24px 16px 60px' : '40px 24px 80px' }}>

        {/* ── Back Button ── */}
        <button
          onClick={() => setCurrentPage('home')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: isDark ? '#94a3b8' : '#64748b', fontWeight: '700', fontSize: '0.82rem', marginBottom: '24px', padding: '6px 0' }}
        >
          ← Back to Home
        </button>

        {/* ── Page Header ── */}
        <div style={{ marginBottom: isMobile ? '24px' : '36px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '50px', padding: '5px 14px', marginBottom: '12px', fontSize: '0.66rem', fontWeight: '800', color: '#10b981', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
            Real Reviews
          </div>
          <h1 style={{ fontSize: isMobile ? '1.6rem' : '2.2rem', fontWeight: '900', background: 'linear-gradient(135deg,#10b981,#6366f1)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
            What Students Say ⭐
          </h1>
          <p style={{ fontSize: '0.84rem', color: isDark ? '#64748b' : '#94a3b8', margin: 0 }}>
            Genuine feedback from real PySkill students
            {isAdmin && <span style={{ marginLeft: '8px', color: '#6366f1', fontWeight: '700' }}>({totalCount}/{MAX_REVIEWS})</span>}
          </p>
        </div>

        {/* ── Summary Bar ── */}
        {!loading && reviews.length > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: isMobile ? '12px' : '24px', flexWrap: 'wrap',
            background: isDark ? 'rgba(255,255,255,0.03)' : '#fff',
            border: isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid #e8eaf0',
            borderRadius: '18px', padding: isMobile ? '14px 16px' : '18px 24px',
            marginBottom: '24px',
            boxShadow: isDark ? 'none' : '0 2px 12px rgba(0,0,0,0.04)',
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.2rem', fontWeight: '900', color: '#f59e0b', lineHeight: 1 }}>{avgRating}</div>
              <div style={{ display: 'flex', gap: '2px', justifyContent: 'center', margin: '4px 0' }}>
                {[1,2,3,4,5].map(s => (
                  <svg key={s} width="12" height="12" viewBox="0 0 24 24" fill={s <= Math.round(avgRating) ? '#f59e0b' : 'none'} stroke="#f59e0b" strokeWidth="2">
                    <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
                  </svg>
                ))}
              </div>
              <div style={{ fontSize: '0.62rem', color: isDark ? '#475569' : '#94a3b8', fontWeight: '700' }}>{totalCount} reviews</div>
            </div>

            <div style={{ flex: 1, minWidth: isMobile ? '100%' : '160px' }}>
              {[5,4,3,2,1].map(s => {
                const cnt = reviews.filter(r => (r.stars || 5) === s).length;
                const pct = reviews.length > 0 ? (cnt / reviews.length) * 100 : 0;
                return (
                  <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                    <span style={{ fontSize: '0.62rem', fontWeight: '700', color: isDark ? '#64748b' : '#94a3b8', width: '8px' }}>{s}</span>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="#f59e0b" stroke="none"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>
                    <div style={{ flex: 1, height: '5px', background: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9', borderRadius: '10px', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg,#f59e0b,#fbbf24)', borderRadius: '10px', transition: 'width 0.6s ease' }} />
                    </div>
                    <span style={{ fontSize: '0.6rem', color: isDark ? '#475569' : '#94a3b8', fontWeight: '600', width: '20px', textAlign: 'right' }}>{cnt}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Star Filter ── */}
        {!loading && reviews.length > 0 && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
            {[0, 5, 4, 3, 2, 1].map(s => (
              <button
                key={s}
                onClick={() => setFilterStars(s)}
                style={{
                  padding: '6px 14px', borderRadius: '50px', border: 'none', cursor: 'pointer',
                  fontWeight: '700', fontSize: '0.72rem',
                  background: filterStars === s
                    ? 'linear-gradient(135deg,#f59e0b,#fbbf24)'
                    : isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9',
                  color: filterStars === s ? '#fff' : isDark ? '#94a3b8' : '#64748b',
                  transition: 'all 0.2s',
                }}
              >
                {s === 0 ? 'All ⭐' : `${s} ★`}
              </button>
            ))}
          </div>
        )}

        {/* ── Reviews Grid ── */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '14px' : '20px' }}>
            {[1,2,3,4,5,6].map(i => (
              <div key={i} style={{ height: '200px', borderRadius: '22px', background: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc', border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid #f0f0f0', animation: 'shimmer 1.5s infinite' }} />
            ))}
          </div>
        ) : filteredReviews.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 20px', background: isDark ? 'rgba(255,255,255,0.02)' : '#f8fafc', borderRadius: '20px', border: isDark ? '1px dashed rgba(255,255,255,0.08)' : '1px dashed #e2e8f0' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>📭</div>
            <p style={{ color: isDark ? '#475569' : '#94a3b8', fontSize: '0.88rem', margin: '0 0 8px' }}>
              {filterStars > 0 ? `No ${filterStars}-star reviews yet.` : 'No reviews yet. Be the first!'}
            </p>
            {filterStars > 0 && <button onClick={() => setFilterStars(0)} style={{ background: 'none', border: 'none', color: '#6366f1', fontWeight: '700', fontSize: '0.8rem', cursor: 'pointer' }}>Show all reviews</button>}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '14px' : '20px' }}>
            {filteredReviews.map(rev => (
              <ReviewCard
                key={rev.id}
                review={rev}
                isDark={isDark}
                isMobile={isMobile}
                isAdmin={isAdmin}
                user={user}
                onDeleteClick={() => setDeleteTarget(rev)}
              />
            ))}
          </div>
        )}

        {/* ── Load More ── */}
        {hasMore && !loading && filterStars === 0 && (
          <div style={{ textAlign: 'center', marginTop: '24px' }}>
            <button
              onClick={() => fetchReviews(false)}
              disabled={loadingMore}
              style={{ padding: '11px 32px', borderRadius: '50px', background: isDark ? 'rgba(255,255,255,0.06)' : '#f1f5f9', border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0', color: isDark ? '#94a3b8' : '#64748b', fontWeight: '700', fontSize: '0.84rem', cursor: loadingMore ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}
            >
              {loadingMore ? '⏳ Loading...' : '↓ Load More Reviews'}
            </button>
          </div>
        )}

        {/* ── Write Review CTA ── */}
        <div style={{ marginTop: '32px', textAlign: 'center' }}>
          {user && canAddMore && !userAlreadyReviewed && (
            <button
              onClick={() => setShowForm(!showForm)}
              style={{
                background: showForm ? 'transparent' : 'linear-gradient(135deg,#6366f1,#ec4899)',
                border: showForm ? (isDark ? '1.5px solid rgba(255,255,255,0.12)' : '1.5px solid #e2e8f0') : 'none',
                color: showForm ? (isDark ? '#94a3b8' : '#64748b') : '#fff',
                padding: '11px 30px', borderRadius: '50px', fontWeight: '700', fontSize: '0.88rem', cursor: 'pointer',
                boxShadow: showForm ? 'none' : '0 4px 18px rgba(99,102,241,0.35)',
                transition: 'all 0.2s',
              }}
            >
              {showForm ? '✕ Cancel' : '✍️ Write a Review'}
            </button>
          )}
          {user && userAlreadyReviewed && (
            <p style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: '700', margin: 0 }}>
              ✅ You have already submitted a review. Thank you!
            </p>
          )}
          {!user && (
            <p style={{ fontSize: '0.78rem', color: isDark ? '#475569' : '#94a3b8', fontWeight: '600', margin: 0 }}>
              🔐 <span style={{ cursor: 'pointer', color: '#6366f1', textDecoration: 'underline' }} onClick={() => setCurrentPage('login')}>Login</span> to write your own review
            </p>
          )}
        </div>

        {user && showForm && canAddMore && !userAlreadyReviewed && (
          <AddReviewForm
            isDark={isDark}
            isMobile={isMobile}
            user={user}
            existingUserIds={existingUserIds}
            onSave={async (data) => {
              await addDoc(collection(db, 'studentReviews'), { ...data, createdAt: Date.now() });
              fetchReviews(true);
              setShowForm(false);
              window.showToast?.('✅ Review added!', 'success');
            }}
            onCancel={() => setShowForm(false)}
          />
        )}
      </div>
    </main>
  );
}