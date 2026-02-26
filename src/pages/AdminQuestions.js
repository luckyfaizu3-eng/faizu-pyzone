import React, { useState, useEffect } from 'react';
import { Plus, Save, Trash2, Code, X, Clock, AlertTriangle, CheckCircle, Edit2, IndianRupee, BookOpen, Tag, Ticket, ToggleLeft, ToggleRight, Upload, FileText, Settings } from 'lucide-react';
import { db } from '../firebase';
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
  updateDoc,
  setDoc,
  getDoc,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';

const MAX_QUESTIONS = 60;

const TIME_LIMITS = { basic: 60, advanced: 120, pro: 180 };
const DEFAULT_PRICES = { basic: 99, advanced: 199, pro: 299 };

const LEVEL_COLORS = {
  basic:    { bg: '#eff6ff', border: '#3b82f6', text: '#1d4ed8', badge: '#dbeafe' },
  advanced: { bg: '#fdf4ff', border: '#a855f7', text: '#7e22ce', badge: '#f3e8ff' },
  pro:      { bg: '#fff7ed', border: '#f97316', text: '#c2410c', badge: '#ffedd5' }
};

const MAIN_TABS = [
  { id: 'python',  label: '🐍 Python Tests',  desc: 'Manage Python mock test questions' },
  { id: 'neet',    label: '🧬 NEET',           desc: 'NEET exam questions with chapter tagging' },
  { id: 'exams',   label: '🎯 Custom Exams',   desc: 'Create & manage custom exams' },
  { id: 'coupons', label: '🎟️ Global Coupons', desc: 'Create coupons for all tests' },
];

// NEET subject order matches actual NEET exam: Zoology → Botany → Physics → Chemistry
const NEET_SUBJECTS = ['Zoology', 'Botany', 'Physics', 'Chemistry'];

const NEET_SUBJECT_META = {
  Physics:   { icon: '⚡', color: '#3b82f6', bg: '#eff6ff', border: '#3b82f6', text: '#1d4ed8', light: '#dbeafe' },
  Chemistry: { icon: '🧪', color: '#a855f7', bg: '#fdf4ff', border: '#a855f7', text: '#7e22ce', light: '#f3e8ff' },
  Botany:    { icon: '🌿', color: '#22c55e', bg: '#f0fdf4', border: '#22c55e', text: '#15803d', light: '#dcfce7' },
  Zoology:   { icon: '🐾', color: '#f97316', bg: '#fff7ed', border: '#f97316', text: '#c2410c', light: '#ffedd5' },
};

// Single shared NEET settings — one price for all subjects
const DEFAULT_NEET_SETTINGS = {
  price: 99,
  salePrice: 0,
  saleEnabled: false,
  timeMinutes: 180,
  maxQuestionsPerSubject: 45,
  markingCorrect: 4,
  markingWrong: -1,
};

const BOTANY_CHAPTERS = {
  '11': [
    { no: 1,  name: 'The Living World' },
    { no: 2,  name: 'Biological Classification' },
    { no: 3,  name: 'Plant Kingdom' },
    { no: 4,  name: 'Morphology of Flowering Plants' },
    { no: 5,  name: 'Anatomy of Flowering Plants' },
    { no: 6,  name: 'Cell: The Unit of Life' },
    { no: 7,  name: 'Biomolecules' },
    { no: 8,  name: 'Cell Cycle and Cell Division' },
    { no: 9,  name: 'Transport in Plants' },
    { no: 10, name: 'Mineral Nutrition' },
    { no: 11, name: 'Photosynthesis in Higher Plants' },
    { no: 12, name: 'Respiration in Plants' },
    { no: 13, name: 'Plant Growth and Development' },
  ],
  '12': [
    { no: 1,  name: 'Reproduction in Organisms' },
    { no: 2,  name: 'Sexual Reproduction in Flowering Plants' },
    { no: 3,  name: 'Organisms and Populations' },
    { no: 4,  name: 'Ecosystem' },
    { no: 5,  name: 'Biodiversity and Conservation' },
    { no: 6,  name: 'Environmental Issues' },
  ],
};

const ZOOLOGY_CHAPTERS = {
  '11': [
    { no: 1,  name: 'Animal Kingdom' },
    { no: 2,  name: 'Structural Organisation in Animals' },
    { no: 3,  name: 'Digestion and Absorption' },
    { no: 4,  name: 'Breathing and Exchange of Gases' },
    { no: 5,  name: 'Body Fluids and Circulation' },
    { no: 6,  name: 'Excretory Products and their Elimination' },
    { no: 7,  name: 'Locomotion and Movement' },
    { no: 8,  name: 'Neural Control and Coordination' },
    { no: 9,  name: 'Chemical Coordination and Integration' },
  ],
  '12': [
    { no: 1,  name: 'Human Reproduction' },
    { no: 2,  name: 'Reproductive Health' },
    { no: 3,  name: 'Principles of Inheritance and Variation' },
    { no: 4,  name: 'Molecular Basis of Inheritance' },
    { no: 5,  name: 'Evolution' },
    { no: 6,  name: 'Human Health and Disease' },
    { no: 7,  name: 'Strategies for Enhancement in Food Production' },
    { no: 8,  name: 'Microbes in Human Welfare' },
    { no: 9,  name: 'Biotechnology: Principles and Processes' },
    { no: 10, name: 'Biotechnology and its Applications' },
  ],
};

const PHYSICS_CHAPTERS = {
  '11': [
    { no: 1,  name: 'Physical World' },
    { no: 2,  name: 'Units and Measurements' },
    { no: 3,  name: 'Motion in a Straight Line' },
    { no: 4,  name: 'Motion in a Plane' },
    { no: 5,  name: 'Laws of Motion' },
    { no: 6,  name: 'Work, Energy and Power' },
    { no: 7,  name: 'System of Particles and Rotational Motion' },
    { no: 8,  name: 'Gravitation' },
    { no: 9,  name: 'Mechanical Properties of Solids' },
    { no: 10, name: 'Mechanical Properties of Fluids' },
    { no: 11, name: 'Thermal Properties of Matter' },
    { no: 12, name: 'Thermodynamics' },
    { no: 13, name: 'Kinetic Theory' },
    { no: 14, name: 'Oscillations' },
    { no: 15, name: 'Waves' },
  ],
  '12': [
    { no: 1,  name: 'Electric Charges and Fields' },
    { no: 2,  name: 'Electrostatic Potential and Capacitance' },
    { no: 3,  name: 'Current Electricity' },
    { no: 4,  name: 'Moving Charges and Magnetism' },
    { no: 5,  name: 'Magnetism and Matter' },
    { no: 6,  name: 'Electromagnetic Induction' },
    { no: 7,  name: 'Alternating Current' },
    { no: 8,  name: 'Electromagnetic Waves' },
    { no: 9,  name: 'Ray Optics and Optical Instruments' },
    { no: 10, name: 'Wave Optics' },
    { no: 11, name: 'Dual Nature of Radiation and Matter' },
    { no: 12, name: 'Atoms' },
    { no: 13, name: 'Nuclei' },
    { no: 14, name: 'Semiconductor Electronics' },
  ],
};

const CHEMISTRY_CHAPTERS = {
  '11': [
    { no: 1,  name: 'Some Basic Concepts of Chemistry' },
    { no: 2,  name: 'Structure of Atom' },
    { no: 3,  name: 'Classification of Elements and Periodicity' },
    { no: 4,  name: 'Chemical Bonding and Molecular Structure' },
    { no: 5,  name: 'States of Matter' },
    { no: 6,  name: 'Thermodynamics' },
    { no: 7,  name: 'Equilibrium' },
    { no: 8,  name: 'Redox Reactions' },
    { no: 9,  name: 'Hydrogen' },
    { no: 10, name: 's-Block Elements' },
    { no: 11, name: 'p-Block Elements (Group 13 & 14)' },
    { no: 12, name: 'Organic Chemistry: Basic Principles' },
    { no: 13, name: 'Hydrocarbons' },
    { no: 14, name: 'Environmental Chemistry' },
  ],
  '12': [
    { no: 1,  name: 'The Solid State' },
    { no: 2,  name: 'Solutions' },
    { no: 3,  name: 'Electrochemistry' },
    { no: 4,  name: 'Chemical Kinetics' },
    { no: 5,  name: 'Surface Chemistry' },
    { no: 6,  name: 'General Principles of Isolation of Elements' },
    { no: 7,  name: 'p-Block Elements (Group 15-18)' },
    { no: 8,  name: 'd and f Block Elements' },
    { no: 9,  name: 'Coordination Compounds' },
    { no: 10, name: 'Haloalkanes and Haloarenes' },
    { no: 11, name: 'Alcohols, Phenols and Ethers' },
    { no: 12, name: 'Aldehydes, Ketones and Carboxylic Acids' },
    { no: 13, name: 'Amines' },
    { no: 14, name: 'Biomolecules' },
    { no: 15, name: 'Polymers' },
    { no: 16, name: 'Chemistry in Everyday Life' },
  ],
};

const NEET_CHAPTERS = {
  Physics: PHYSICS_CHAPTERS,
  Chemistry: CHEMISTRY_CHAPTERS,
  Botany: BOTANY_CHAPTERS,
  Zoology: ZOOLOGY_CHAPTERS,
};

// ==========================================
// 🏠 MAIN COMPONENT
// ==========================================
function AdminQuestions() {
  const [mainTab, setMainTab] = useState('python');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', fontFamily: 'system-ui', padding: isMobile ? '0.5rem' : '1rem' }}>
      <div style={{
        display: 'flex', gap: '0.4rem', marginBottom: '1.5rem',
        background: '#f1f5f9', borderRadius: '14px', padding: '6px',
        border: '1px solid #e2e8f0', flexWrap: 'wrap'
      }}>
        {MAIN_TABS.map(t => (
          <button key={t.id} onClick={() => setMainTab(t.id)} style={{
            flex: 1, minWidth: isMobile ? '45%' : 'auto',
            padding: isMobile ? '0.6rem 0.4rem' : '0.75rem 1rem',
            borderRadius: '10px', border: 'none', cursor: 'pointer',
            fontWeight: '700', fontSize: isMobile ? '0.75rem' : '0.88rem',
            background: mainTab === t.id ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'transparent',
            color: mainTab === t.id ? '#fff' : '#64748b',
            boxShadow: mainTab === t.id ? '0 4px 14px rgba(99,102,241,0.35)' : 'none',
            transition: 'all 0.25s ease',
            whiteSpace: 'nowrap'
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {mainTab === 'python'  && <PythonQuestionsTab  isMobile={isMobile} />}
      {mainTab === 'neet'    && <NEETQuestionsTab    isMobile={isMobile} />}
      {mainTab === 'exams'   && <CustomExamsTab      isMobile={isMobile} />}
      {mainTab === 'coupons' && <GlobalCouponsTab    isMobile={isMobile} />}
    </div>
  );
}

// ==========================================
// 🎟️ GLOBAL COUPONS TAB
// ==========================================
function GlobalCouponsTab({ isMobile }) {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    code: '', discount: 100, type: 'percentage',
    scope: 'global', expiry: '', usageLimit: 9999, active: true
  });

  useEffect(() => { fetchCoupons(); }, []);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'coupons'));
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      all.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setCoupons(all);
    } catch { window.showToast?.('Failed to load coupons', 'error'); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    if (!form.code.trim()) { window.showToast?.('❌ Coupon code required!', 'error'); return; }
    if (!form.discount || form.discount < 1) { window.showToast?.('❌ Discount value required!', 'error'); return; }
    setLoading(true);
    try {
      const code = form.code.trim().toUpperCase();
      await setDoc(doc(db, 'coupons', code), {
        code,
        discount: parseInt(form.discount),
        type: form.type,
        scope: form.scope,
        expiry: form.expiry || null,
        usageLimit: parseInt(form.usageLimit) || 9999,
        usedCount: 0,
        active: form.active,
        createdAt: serverTimestamp()
      });
      window.showToast?.('✅ Coupon created!', 'success');
      setForm({ code: '', discount: 100, type: 'percentage', scope: 'global', expiry: '', usageLimit: 9999, active: true });
      setShowForm(false);
      fetchCoupons();
    } catch { window.showToast?.('❌ Failed to create coupon', 'error'); }
    finally { setLoading(false); }
  };

  const handleToggle = async (coupon) => {
    try {
      await updateDoc(doc(db, 'coupons', coupon.id), { active: !coupon.active });
      window.showToast?.(`✅ ${!coupon.active ? 'Activated' : 'Deactivated'}!`, 'success');
      fetchCoupons();
    } catch { window.showToast?.('❌ Failed', 'error'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this coupon?')) return;
    try {
      await deleteDoc(doc(db, 'coupons', id));
      window.showToast?.('✅ Deleted!', 'success');
      setCoupons(p => p.filter(c => c.id !== id));
    } catch { window.showToast?.('❌ Delete failed', 'error'); }
  };

  const inp = (extra = {}) => ({
    width: '100%', padding: '0.75rem', border: '2px solid #e2e8f0',
    borderRadius: '10px', fontSize: '0.9rem', outline: 'none',
    boxSizing: 'border-box', background: '#f8fafc', ...extra
  });

  const scopeLabel = (scope) => {
    if (scope === 'global' || scope === 'all') return { label: '🌐 Global (All Tests)', color: '#6366f1', bg: '#eff6ff' };
    if (scope === 'Physics') return { label: '⚡ Physics', color: '#3b82f6', bg: '#eff6ff' };
    if (scope === 'Chemistry') return { label: '🧪 Chemistry', color: '#a855f7', bg: '#fdf4ff' };
    if (scope === 'Botany') return { label: '🌿 Botany', color: '#22c55e', bg: '#f0fdf4' };
    if (scope === 'Zoology') return { label: '🐾 Zoology', color: '#f97316', bg: '#fff7ed' };
    if (scope === 'python') return { label: '🐍 Python', color: '#10b981', bg: '#f0fdf4' };
    return { label: scope, color: '#64748b', bg: '#f1f5f9' };
  };

  return (
    <div>
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: isMobile ? '1rem' : '1.75rem', marginBottom: '1rem', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: isMobile ? '1.3rem' : '1.6rem', fontWeight: '800', color: '#1e293b' }}>🎟️ Global Coupon Manager</h2>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.82rem', color: '#64748b' }}>
              Set scope to <strong>Global</strong> to apply a coupon across all tests (Python + NEET + Custom).
            </p>
          </div>
          <button onClick={() => setShowForm(!showForm)} style={{
            padding: '0.65rem 1.25rem', background: showForm ? '#f1f5f9' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
            border: 'none', borderRadius: '10px', color: showForm ? '#64748b' : '#fff',
            fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem'
          }}>
            {showForm ? <X size={16} /> : <Plus size={16} />}
            {showForm ? 'Cancel' : 'New Coupon'}
          </button>
        </div>

        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {[
            { scope: 'global', desc: 'All tests' },
            { scope: 'python', desc: 'Python only' },
            { scope: 'Physics', desc: 'Physics only' },
            { scope: 'Chemistry', desc: 'Chemistry only' },
            { scope: 'Botany', desc: 'Botany only' },
            { scope: 'Zoology', desc: 'Zoology only' },
          ].map(s => {
            const sl = scopeLabel(s.scope);
            return (
              <div key={s.scope} style={{ padding: '0.25rem 0.6rem', background: sl.bg, borderRadius: '6px', fontSize: '0.68rem', fontWeight: '700', color: sl.color }}>
                {sl.label} — {s.desc}
              </div>
            );
          })}
        </div>
      </div>

      {showForm && (
        <div style={{ background: '#fff', border: '2px solid rgba(99,102,241,0.3)', borderRadius: '16px', padding: isMobile ? '1rem' : '1.75rem', marginBottom: '1rem', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
          <h3 style={{ margin: '0 0 1.25rem', fontWeight: '800', color: '#6366f1', fontSize: '1.1rem' }}>➕ Create New Coupon</h3>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.8rem', fontWeight: '700', color: '#475569' }}>Coupon Code *</label>
              <input value={form.code} onChange={e => setForm(p => ({...p, code: e.target.value.toUpperCase()}))}
                placeholder="e.g. FREE100" style={{ ...inp(), fontFamily: 'monospace', fontWeight: '800', letterSpacing: '2px', fontSize: '1rem' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.8rem', fontWeight: '700', color: '#475569' }}>Scope (Which test) *</label>
              <select value={form.scope} onChange={e => setForm(p => ({...p, scope: e.target.value}))} style={inp()}>
                <option value="global">🌐 Global — All tests</option>
                <option value="python">🐍 Python only</option>
                <option value="Physics">⚡ NEET Physics only</option>
                <option value="Chemistry">🧪 NEET Chemistry only</option>
                <option value="Botany">🌿 NEET Botany only</option>
                <option value="Zoology">🐾 NEET Zoology only</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.8rem', fontWeight: '700', color: '#475569' }}>Discount Type *</label>
              <select value={form.type} onChange={e => setForm(p => ({...p, type: e.target.value}))} style={inp()}>
                <option value="percentage">% Percentage</option>
                <option value="flat">₹ Flat Amount</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.8rem', fontWeight: '700', color: '#475569' }}>
                Discount Value * {form.type === 'percentage' ? '(%)' : '(₹)'} {form.type === 'percentage' && Number(form.discount) === 100 && <span style={{color:'#10b981'}}>— 100% = FREE!</span>}
              </label>
              <input type="number" min="1" max={form.type === 'percentage' ? 100 : undefined}
                value={form.discount} onChange={e => setForm(p => ({...p, discount: e.target.value}))} style={{ ...inp({ borderColor: Number(form.discount) === 100 ? '#10b981' : '#e2e8f0', background: Number(form.discount) === 100 ? '#f0fdf4' : '#f8fafc' }) }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.8rem', fontWeight: '700', color: '#475569' }}>Usage Limit</label>
              <input type="number" min="1" value={form.usageLimit} onChange={e => setForm(p => ({...p, usageLimit: e.target.value}))} style={inp()} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.8rem', fontWeight: '700', color: '#475569' }}>Expiry Date (optional)</label>
              <input type="date" value={form.expiry} onChange={e => setForm(p => ({...p, expiry: e.target.value}))} style={inp()} />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', padding: '0.75rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
            <button onClick={() => setForm(p => ({...p, active: !p.active}))} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '700', color: form.active ? '#10b981' : '#94a3b8', fontSize: '0.9rem' }}>
              {form.active ? <ToggleRight size={24} color="#10b981" /> : <ToggleLeft size={24} color="#94a3b8" />}
              {form.active ? '✅ Active — Users can use this coupon' : '⏸ Inactive — Disabled'}
            </button>
          </div>

          {form.code && (
            <div style={{ padding: '0.85rem', background: 'linear-gradient(135deg,rgba(99,102,241,0.08),rgba(139,92,246,0.08))', border: '2px solid rgba(99,102,241,0.2)', borderRadius: '12px', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
              <strong style={{ color: '#6366f1' }}>Preview:</strong> Code <code style={{ background: '#e0e7ff', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: '800' }}>{form.code || '???'}</code> gives {form.type === 'percentage' ? `${form.discount}%` : `₹${form.discount}`} off — Scope: {scopeLabel(form.scope).label}
              {Number(form.discount) === 100 && form.type === 'percentage' && <span style={{ color: '#10b981', fontWeight: '800' }}> — 🆓 TEST WILL BE FREE!</span>}
            </div>
          )}

          <button onClick={handleSave} disabled={loading} style={{
            width: '100%', padding: '1rem', background: loading ? '#e2e8f0' : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
            border: 'none', borderRadius: '12px', color: loading ? '#94a3b8' : '#fff',
            fontWeight: '800', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '1rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
          }}>
            <Save size={18} /> {loading ? 'Creating...' : '✅ Create Coupon'}
          </button>
        </div>
      )}

      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <div style={{ padding: '1rem 1.25rem', borderBottom: '2px solid #f1f5f9', background: '#fafafa', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: '800', color: '#1e293b' }}>All Coupons ({coupons.length})</span>
          <button onClick={fetchCoupons} style={{ padding: '0.35rem 0.75rem', background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: '600', color: '#475569' }}>🔄 Refresh</button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Loading...</div>
        ) : coupons.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🎟️</div>
            <div>No coupons yet. Create one above!</div>
          </div>
        ) : (
          coupons.map((c, idx) => {
            const sl = scopeLabel(c.scope || c.subject || 'global');
            const isExpired = c.expiry && new Date() > new Date(c.expiry);
            const isLimitReached = c.usageLimit && (c.usedCount || 0) >= c.usageLimit;
            return (
              <div key={c.id} style={{
                borderBottom: idx < coupons.length - 1 ? '1px solid #f1f5f9' : 'none',
                padding: isMobile ? '0.85rem' : '1.1rem',
                display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap',
                background: (!c.active || isExpired || isLimitReached) ? '#fafafa' : '#fff',
                opacity: (!c.active || isExpired || isLimitReached) ? 0.65 : 1
              }}>
                <div style={{ minWidth: '120px' }}>
                  <div style={{ fontFamily: 'monospace', fontWeight: '900', fontSize: isMobile ? '0.95rem' : '1.1rem', color: '#1e293b', letterSpacing: '1px' }}>{c.code}</div>
                  <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', marginTop: '0.3rem' }}>
                    <span style={{ padding: '0.1rem 0.45rem', background: c.active && !isExpired && !isLimitReached ? '#dcfce7' : '#fee2e2', color: c.active && !isExpired && !isLimitReached ? '#065f46' : '#991b1b', borderRadius: '20px', fontSize: '0.62rem', fontWeight: '700' }}>
                      {isExpired ? '⏰ Expired' : isLimitReached ? '🚫 Limit Reached' : c.active ? '✅ Active' : '⏸ Inactive'}
                    </span>
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <span style={{ padding: '0.2rem 0.6rem', background: '#f0fdf4', color: '#065f46', borderRadius: '6px', fontSize: '0.72rem', fontWeight: '700' }}>
                      💰 {c.type === 'percentage' ? `${c.discount}% off` : `₹${c.discount} off`}
                      {Number(c.discount) === 100 && c.type === 'percentage' && ' 🆓 FREE'}
                    </span>
                    <span style={{ padding: '0.2rem 0.6rem', background: sl.bg, color: sl.color, borderRadius: '6px', fontSize: '0.72rem', fontWeight: '700' }}>{sl.label}</span>
                    <span style={{ padding: '0.2rem 0.6rem', background: '#f1f5f9', color: '#475569', borderRadius: '6px', fontSize: '0.72rem', fontWeight: '600' }}>
                      👥 {c.usedCount || 0}/{c.usageLimit || '∞'}
                    </span>
                    {c.expiry && <span style={{ padding: '0.2rem 0.6rem', background: '#fef3c7', color: '#92400e', borderRadius: '6px', fontSize: '0.72rem', fontWeight: '600' }}>📅 {c.expiry}</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                  <button onClick={() => handleToggle(c)} title={c.active ? 'Deactivate' : 'Activate'} style={{ width: '32px', height: '32px', borderRadius: '8px', border: 'none', background: c.active ? 'rgba(16,185,129,0.1)' : 'rgba(100,116,139,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {c.active ? <ToggleRight size={15} color="#10b981" /> : <ToggleLeft size={15} color="#94a3b8" />}
                  </button>
                  <button onClick={() => handleDelete(c.id)} style={{ width: '32px', height: '32px', borderRadius: '8px', border: 'none', background: 'rgba(239,68,68,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Trash2 size={14} color="#ef4444" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ==========================================
// 🐍 PYTHON QUESTIONS TAB
// ==========================================
function PythonQuestionsTab({ isMobile }) {
  const [level, setLevel] = useState('basic');
  const [questions, setQuestions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [deletingIds, setDeletingIds] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [showPriceSettings, setShowPriceSettings] = useState(false);
  const [prices, setPrices] = useState(DEFAULT_PRICES);
  const [salePrices, setSalePrices] = useState({ basic: 0, advanced: 0, pro: 0 });
  const [saleEnabled, setSaleEnabled] = useState({ basic: false, advanced: false, pro: false });
  const [savingPrices, setSavingPrices] = useState(false);
  const [formData, setFormData] = useState({ question: '', code: '', option1: '', option2: '', option3: '', option4: '', correct: 0 });

  useEffect(() => { fetchQuestions(); fetchPrices(); setSelectedIds([]); setSelectAll(false); }, [level]); // eslint-disable-line

  const fetchPrices = async () => {
    try {
      const priceDoc = await getDoc(doc(db, 'settings', 'testPrices'));
      if (priceDoc.exists()) {
        const data = priceDoc.data();
        setPrices({ basic: data.basic || 99, advanced: data.advanced || 199, pro: data.pro || 299 });
        setSalePrices({ basic: data.basicSale || 0, advanced: data.advancedSale || 0, pro: data.proSale || 0 });
        setSaleEnabled({ basic: data.basicSaleEnabled || false, advanced: data.advancedSaleEnabled || false, pro: data.proSaleEnabled || false });
      }
    } catch { setPrices(DEFAULT_PRICES); }
  };

  const handleSavePrices = async () => {
    setSavingPrices(true);
    try {
      await setDoc(doc(db, 'settings', 'testPrices'), {
        basic: prices.basic, advanced: prices.advanced, pro: prices.pro,
        basicSale: salePrices.basic, advancedSale: salePrices.advanced, proSale: salePrices.pro,
        basicSaleEnabled: saleEnabled.basic, advancedSaleEnabled: saleEnabled.advanced, proSaleEnabled: saleEnabled.pro
      });
      window.showToast?.('✅ Prices updated!', 'success');
      setShowPriceSettings(false);
    } catch { window.showToast?.('❌ Failed to save prices', 'error'); }
    finally { setSavingPrices(false); }
  };

  // ✅ FIX: Sort by position first, then fallback to createdAt ascending
  // This ensures Q1 stays Q1, Q2 stays Q2 always
  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'manualQuestions'), where('level', '==', level), where('source', '==', 'manual'));
      const snapshot = await getDocs(q);
      const qs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      // Sort by position field first; if no position, sort by createdAt ascending (oldest = first)
      qs.sort((a, b) => {
        if (a.position !== undefined && b.position !== undefined) {
          return a.position - b.position;
        }
        // Fallback: oldest question first (ascending createdAt)
        return new Date(a.createdAt) - new Date(b.createdAt);
      });
      setQuestions(qs);
    } catch { window.showToast?.('Failed to load questions', 'error'); }
    finally { setLoading(false); }
  };

  const resetForm = () => { setFormData({ question: '', code: '', option1: '', option2: '', option3: '', option4: '', correct: 0 }); setEditingId(null); };

  const handleEditQuestion = (q) => {
    setFormData({ question: q.question, code: q.code, option1: q.options[0] || '', option2: q.options[1] || '', option3: q.options[2] || '', option4: q.options[3] || '', correct: q.correct });
    setEditingId(q.id); setShowForm(true); window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveQuestion = async () => {
    if (!editingId && questions.length >= MAX_QUESTIONS) { window.showToast?.(`❌ Maximum ${MAX_QUESTIONS} questions allowed!`, 'error'); return; }
    if (!formData.question.trim()) { window.showToast?.('Question text is required', 'error'); return; }
    if (!formData.code.trim()) { window.showToast?.('Code snippet is required', 'error'); return; }
    if (!formData.option1 || !formData.option2 || !formData.option3 || !formData.option4) { window.showToast?.('All 4 options are required', 'error'); return; }
    setLoading(true);
    try {
      const questionData = {
        question: formData.question.trim(),
        code: formData.code.trim(),
        options: [formData.option1.trim(), formData.option2.trim(), formData.option3.trim(), formData.option4.trim()],
        correct: parseInt(formData.correct),
        level,
        source: 'manual'
      };
      if (editingId) {
        // ✅ Edit: do NOT change position — keep original serial number
        await updateDoc(doc(db, 'manualQuestions', editingId), { ...questionData, updatedAt: new Date().toISOString() });
        window.showToast?.('✅ Question updated!', 'success');
      } else {
        // ✅ New question: assign next position so it always goes to the end
        const nextPosition = questions.length + 1;
        await addDoc(collection(db, 'manualQuestions'), {
          ...questionData,
          position: nextPosition,
          createdAt: new Date().toISOString()
        });
        window.showToast?.('✅ Question added!', 'success');
      }
      resetForm(); setShowForm(false); fetchQuestions();
    } catch { window.showToast?.('Failed to save question', 'error'); }
    finally { setLoading(false); }
  };

  const handleDeleteQuestion = async (id) => {
    if (!window.confirm('Delete this question?')) return;
    setDeletingIds(p => [...p, id]);
    try {
      await deleteDoc(doc(db, 'manualQuestions', id));
      window.showToast?.('✅ Deleted!', 'success');
      // ✅ After delete, re-fetch and fix positions so sequence stays clean
      const remaining = questions.filter(q => q.id !== id);
      await Promise.all(remaining.map((q, idx) => updateDoc(doc(db, 'manualQuestions', q.id), { position: idx + 1 })));
      setQuestions(remaining);
      setSelectedIds(prev => prev.filter(sid => sid !== id));
    }
    catch { window.showToast?.('Delete failed', 'error'); }
    finally { setDeletingIds(p => p.filter(did => did !== id)); }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedIds.length} selected questions?`)) return;
    setLoading(true);
    try {
      await Promise.all(selectedIds.map(id => deleteDoc(doc(db, 'manualQuestions', id))));
      window.showToast?.(`✅ ${selectedIds.length} questions deleted!`, 'success');
      // ✅ Fix positions after bulk delete
      const remaining = questions.filter(q => !selectedIds.includes(q.id));
      await Promise.all(remaining.map((q, idx) => updateDoc(doc(db, 'manualQuestions', q.id), { position: idx + 1 })));
      setQuestions(remaining);
      setSelectedIds([]); setSelectAll(false);
    }
    catch { window.showToast?.('Bulk delete failed', 'error'); }
    finally { setLoading(false); }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm(`⚠️ Delete ALL ${questions.length} ${level} questions? This cannot be undone.`)) return;
    setLoading(true);
    try { await Promise.all(questions.map(q => deleteDoc(doc(db, 'manualQuestions', q.id)))); window.showToast?.('✅ All questions deleted!', 'success'); setQuestions([]); setSelectedIds([]); setSelectAll(false); }
    catch { window.showToast?.('Delete all failed', 'error'); }
    finally { setLoading(false); }
  };

  const toggleSelect = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  const handleSelectAll = () => { if (selectAll) { setSelectedIds([]); setSelectAll(false); } else { setSelectedIds(filteredQuestions.map(q => q.id)); setSelectAll(true); } };
  const filteredQuestions = questions.filter(q => q.question.toLowerCase().includes(searchQuery.toLowerCase()) || q.code.toLowerCase().includes(searchQuery.toLowerCase()));
  const levelColor = LEVEL_COLORS[level];
  const isAtLimit = questions.length >= MAX_QUESTIONS && !editingId;
  const progressPct = Math.min((questions.length / MAX_QUESTIONS) * 100, 100);

  return (
    <div>
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: isMobile ? '12px' : '16px', padding: isMobile ? '1rem' : '2rem', marginBottom: '1rem', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <h2 style={{ margin: 0, fontSize: isMobile ? '1.3rem' : '1.6rem', fontWeight: '800' }}>📝 Python Question Manager</h2>
          <button onClick={() => setShowPriceSettings(!showPriceSettings)} style={{ padding: isMobile ? '0.5rem 1rem' : '0.65rem 1.25rem', borderRadius: '10px', border: '2px solid rgba(16,185,129,0.3)', background: showPriceSettings ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.1)', color: '#10b981', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: isMobile ? '0.8rem' : '0.9rem' }}>
            <IndianRupee size={16} /> {isMobile ? 'Prices' : (showPriceSettings ? 'Hide Prices' : 'Manage Prices')}
          </button>
        </div>

        {showPriceSettings && (
          <div style={{ background: 'linear-gradient(135deg,rgba(16,185,129,0.05),rgba(5,150,105,0.05))', border: '2px solid rgba(16,185,129,0.2)', borderRadius: '12px', padding: isMobile ? '1rem' : '1.5rem', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: '800', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><IndianRupee size={18} /> Python Test Prices & Sale</h3>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap: '1rem', marginBottom: '1rem' }}>
              {['basic', 'advanced', 'pro'].map(lvl => (
                <div key={lvl} style={{ background: '#fff', borderRadius: '12px', padding: '1rem', border: `2px solid ${LEVEL_COLORS[lvl].border}` }}>
                  <div style={{ fontWeight: '800', color: LEVEL_COLORS[lvl].text, marginBottom: '0.75rem', textTransform: 'uppercase', fontSize: '0.9rem' }}>{lvl}</div>
                  <div style={{ marginBottom: '0.6rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.75rem', fontWeight: '700', color: '#475569' }}>Original Price (₹)</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '0.7rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontWeight: '700' }}>₹</span>
                      <input type="number" min="0" value={prices[lvl]} onChange={e => setPrices({ ...prices, [lvl]: parseInt(e.target.value) || 0 })} style={{ width: '100%', padding: '0.6rem 0.6rem 0.6rem 1.8rem', border: `2px solid ${LEVEL_COLORS[lvl].border}`, borderRadius: '8px', fontSize: '1rem', fontWeight: '700', outline: 'none', boxSizing: 'border-box', background: LEVEL_COLORS[lvl].bg }} />
                    </div>
                  </div>
                  <div style={{ marginBottom: '0.6rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#475569' }}>Sale Price (₹)</label>
                      <button onClick={() => setSaleEnabled(p => ({ ...p, [lvl]: !p[lvl] }))} style={{ padding: '0.15rem 0.5rem', borderRadius: '20px', border: 'none', background: saleEnabled[lvl] ? '#10b981' : '#e2e8f0', color: saleEnabled[lvl] ? '#fff' : '#64748b', fontSize: '0.65rem', fontWeight: '700', cursor: 'pointer' }}>
                        {saleEnabled[lvl] ? '🔥 ON' : 'OFF'}
                      </button>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: '0.7rem', top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontWeight: '700' }}>₹</span>
                      <input type="number" min="0" value={salePrices[lvl]} onChange={e => setSalePrices({ ...salePrices, [lvl]: parseInt(e.target.value) || 0 })} disabled={!saleEnabled[lvl]} placeholder={saleEnabled[lvl] ? 'Sale price...' : 'Enable sale first'} style={{ width: '100%', padding: '0.6rem 0.6rem 0.6rem 1.8rem', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '1rem', fontWeight: '700', outline: 'none', boxSizing: 'border-box', opacity: saleEnabled[lvl] ? 1 : 0.5 }} />
                    </div>
                  </div>
                  <div style={{ padding: '0.5rem', background: LEVEL_COLORS[lvl].badge, borderRadius: '8px', fontSize: '0.75rem', fontWeight: '700', color: LEVEL_COLORS[lvl].text, textAlign: 'center' }}>
                    {saleEnabled[lvl] && salePrices[lvl] > 0
                      ? <><span style={{ textDecoration: 'line-through', opacity: 0.6 }}>₹{prices[lvl]}</span> → <span style={{ color: '#10b981' }}>₹{salePrices[lvl]}</span><span style={{ marginLeft: '0.3rem' }}>({Math.round(((prices[lvl] - salePrices[lvl]) / prices[lvl]) * 100)}% off)</span></>
                      : <>Active: ₹{prices[lvl]}</>
                    }
                  </div>
                </div>
              ))}
            </div>
            <button onClick={handleSavePrices} disabled={savingPrices} style={{ width: '100%', padding: '0.85rem', borderRadius: '10px', border: 'none', background: savingPrices ? '#e2e8f0' : 'linear-gradient(135deg,#10b981,#059669)', color: savingPrices ? '#94a3b8' : '#fff', fontSize: '1rem', fontWeight: '700', cursor: savingPrices ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <Save size={18} /> {savingPrices ? 'Saving...' : 'Save All Prices'}
            </button>
          </div>
        )}

        <div style={{ display: 'flex', gap: isMobile ? '0.4rem' : '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          {['basic', 'advanced', 'pro'].map(lvl => (
            <button key={lvl} onClick={() => setLevel(lvl)} style={{ padding: isMobile ? '0.5rem 0.9rem' : '0.6rem 1.2rem', borderRadius: '8px', border: level === lvl ? `2px solid ${LEVEL_COLORS[lvl].border}` : '2px solid #e2e8f0', background: level === lvl ? LEVEL_COLORS[lvl].bg : '#fff', color: level === lvl ? LEVEL_COLORS[lvl].text : '#64748b', fontWeight: '700', cursor: 'pointer', textTransform: 'uppercase', fontSize: isMobile ? '0.75rem' : '0.85rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem', flex: isMobile ? '1' : 'auto' }}>
              <span>{lvl}</span>
              <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>
                {saleEnabled[lvl] && salePrices[lvl] > 0 ? <><span style={{ textDecoration: 'line-through' }}>₹{prices[lvl]}</span> ₹{salePrices[lvl]}</> : `₹${prices[lvl]}`}
              </span>
            </button>
          ))}
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
            <span style={{ color: '#64748b' }}>Questions: <strong>{questions.length}</strong> / {MAX_QUESTIONS}</span>
            {isAtLimit && <span style={{ fontSize: '0.8rem', color: '#ef4444', fontWeight: '700' }}>⚠️ LIMIT REACHED</span>}
          </div>
          <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '99px', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progressPct}%`, background: isAtLimit ? '#ef4444' : '#10b981', transition: 'width 0.5s' }} />
          </div>
        </div>

        <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(99,102,241,0.1)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem', color: '#6366f1', fontWeight: '600' }}>
          <Clock size={16} />
          Test Duration: <strong>{TIME_LIMITS[level]} minutes</strong> for {MAX_QUESTIONS} questions
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', gap: '0.75rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', flex: 1 }}>
          <button onClick={() => { if (!isAtLimit) { if (showForm && !editingId) { setShowForm(false); resetForm(); } else { resetForm(); setShowForm(true); } } }} style={{ padding: isMobile ? '0.5rem 0.9rem' : '0.65rem 1.25rem', borderRadius: '10px', border: 'none', background: isAtLimit ? '#e2e8f0' : 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: isAtLimit ? '#94a3b8' : '#fff', fontWeight: '700', cursor: isAtLimit ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.88rem' }}>
            {showForm && !editingId ? <X size={16} /> : <Plus size={16} />}
            {showForm && !editingId ? 'Cancel' : isAtLimit ? 'Limit Reached' : 'Add Question'}
          </button>
          {selectedIds.length > 0 && (
            <button onClick={handleBulkDelete} style={{ padding: isMobile ? '0.5rem 0.9rem' : '0.65rem 1.25rem', borderRadius: '10px', border: '2px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.1)', color: '#ef4444', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.88rem' }}>
              <Trash2 size={15} /> Delete ({selectedIds.length})
            </button>
          )}
          {questions.length > 0 && (
            <button onClick={handleDeleteAll} style={{ padding: isMobile ? '0.5rem 0.9rem' : '0.65rem 1.25rem', borderRadius: '10px', border: '2px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.05)', color: '#dc2626', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.88rem' }}>
              <AlertTriangle size={15} /> Delete All
            </button>
          )}
        </div>
        <input type="text" placeholder="Search questions..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ padding: '0.65rem 1rem', border: '2px solid #e2e8f0', borderRadius: '10px', fontSize: '0.88rem', outline: 'none', minWidth: isMobile ? '140px' : '220px' }} />
      </div>

      {showForm && (
        <div style={{ background: '#fff', border: editingId ? '2px solid #f59e0b' : '2px solid #e2e8f0', borderRadius: '16px', padding: isMobile ? '1rem' : '2rem', marginBottom: '1.5rem', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '700' }}>{editingId ? <span style={{ color: '#f59e0b' }}>✏️ Edit Question</span> : <span>New {level.toUpperCase()} Question</span>}</h3>
            {editingId && <button onClick={() => { resetForm(); setShowForm(false); }} style={{ padding: '0.4rem 0.8rem', borderRadius: '8px', border: '2px solid #e2e8f0', background: '#fff', color: '#64748b', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: '700', color: '#64748b' }}>Question Text *</label>
              <input type="text" placeholder="What is the output of this code?" value={formData.question} onChange={(e) => setFormData({...formData, question: e.target.value})} style={{ width: '100%', padding: '0.85rem', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '1rem', outline: 'none', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', fontWeight: '700', color: '#64748b' }}>Python Code *</label>
              <textarea placeholder="x = 5&#10;y = 3&#10;print(x + y)" value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value})} rows={6} style={{ width: '100%', padding: '1rem', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '0.95rem', fontFamily: 'monospace', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.75rem', fontSize: '0.85rem', fontWeight: '700', color: '#64748b' }}>Options *</label>
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {[1,2,3,4].map(num => (
                  <div key={num} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: parseInt(formData.correct) === num - 1 ? '#10b981' : '#e2e8f0', color: parseInt(formData.correct) === num - 1 ? '#fff' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '0.85rem', flexShrink: 0 }}>{String.fromCharCode(64 + num)}</div>
                    <input type="text" placeholder={`Option ${num}`} value={formData[`option${num}`]} onChange={(e) => setFormData({...formData, [`option${num}`]: e.target.value})} style={{ flex: 1, padding: '0.7rem', border: parseInt(formData.correct) === num - 1 ? '2px solid #10b981' : '2px solid #e2e8f0', borderRadius: '8px', fontSize: '0.95rem', outline: 'none', background: parseInt(formData.correct) === num - 1 ? '#f0fdf4' : '#fff' }} />
                  </div>
                ))}
              </div>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.85rem', fontWeight: '700', color: '#64748b' }}>Correct Answer *</label>
              <div style={{ display: 'flex', gap: '0.6rem' }}>
                {[0,1,2,3].map(idx => (
                  <button key={idx} type="button" onClick={() => setFormData({...formData, correct: idx})} style={{ flex: 1, padding: '0.55rem', borderRadius: '8px', border: parseInt(formData.correct) === idx ? '2px solid #10b981' : '2px solid #e2e8f0', background: parseInt(formData.correct) === idx ? '#f0fdf4' : '#fff', color: parseInt(formData.correct) === idx ? '#10b981' : '#64748b', fontWeight: '700', cursor: 'pointer', fontSize: '0.9rem' }}>
                    Option {idx + 1}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={handleSaveQuestion} disabled={loading || isAtLimit} style={{ padding: '1rem', borderRadius: '10px', border: 'none', background: loading || isAtLimit ? '#e2e8f0' : editingId ? 'linear-gradient(135deg,#f59e0b,#d97706)' : 'linear-gradient(135deg,#10b981,#059669)', color: loading || isAtLimit ? '#94a3b8' : '#fff', fontSize: '1rem', fontWeight: '700', cursor: loading || isAtLimit ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              {editingId ? <Edit2 size={18} /> : <Save size={18} />}
              {loading ? 'Saving...' : editingId ? 'Update Question' : 'Save Question'}
            </button>
          </div>
        </div>
      )}

      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <div style={{ padding: '1.1rem 1.25rem', borderBottom: '2px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fafafa' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={selectAll} onChange={handleSelectAll} style={{ width: '15px', height: '15px', cursor: 'pointer' }} />
            <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#64748b' }}>Select All</span>
          </label>
          <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>{filteredQuestions.length} questions</span>
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>Loading...</div>
        ) : filteredQuestions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>📝</div>
            <div>No questions yet. Add some!</div>
          </div>
        ) : (
          filteredQuestions.map((q, index) => {
            const isSelected = selectedIds.includes(q.id);
            const isDeleting = deletingIds.includes(q.id);
            const isEditing = editingId === q.id;
            return (
              <div key={q.id} style={{ borderBottom: index < filteredQuestions.length - 1 ? '1px solid #f1f5f9' : 'none', background: isEditing ? '#fffbeb' : isSelected ? '#fafbff' : '#fff', borderLeft: isEditing ? '3px solid #f59e0b' : isSelected ? '3px solid #6366f1' : '3px solid transparent', opacity: isDeleting ? 0.4 : 1, padding: '1.1rem 1.25rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(q.id)} style={{ width: '15px', height: '15px', marginTop: '4px', cursor: 'pointer', flexShrink: 0 }} />
                <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: levelColor.badge, color: levelColor.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '0.8rem', flexShrink: 0 }}>{index + 1}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.98rem', fontWeight: '600', color: '#0f172a', marginBottom: '0.5rem', wordBreak: 'break-word', lineHeight: 1.4 }}>{q.question}</div>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{ background: '#f1f5f9', color: '#64748b', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: '600' }}><Code size={10} style={{ display: 'inline', marginRight: '0.2rem' }} />{q.code.split('\n').length} lines</span>
                    <span style={{ background: '#f0fdf4', color: '#10b981', padding: '0.2rem 0.6rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: '600' }}>✓ {q.options?.[q.correct]}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                  <button onClick={() => handleEditQuestion(q)} style={{ width: '32px', height: '32px', borderRadius: '8px', border: 'none', background: 'rgba(245,158,11,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Edit2 size={14} color="#f59e0b" /></button>
                  <button onClick={() => handleDeleteQuestion(q.id)} style={{ width: '32px', height: '32px', borderRadius: '8px', border: 'none', background: 'rgba(239,68,68,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={14} color="#ef4444" /></button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ==========================================
// 🧬 NEET QUESTIONS TAB
// ==========================================
function NEETQuestionsTab({ isMobile }) {
  const [subject, setSubject] = useState('Zoology');
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClass, setFilterClass] = useState('all');
  const [deletingIds, setDeletingIds] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [neetSettings, setNeetSettings] = useState(DEFAULT_NEET_SETTINGS);
  const [savingSettings, setSavingSettings] = useState(false);
  const [showCoupons, setShowCoupons] = useState(false);
  const [coupons, setCoupons] = useState([]);
  const [showCouponForm, setShowCouponForm] = useState(false);
  const [couponForm, setCouponForm] = useState({ code: '', discount: 10, type: 'percentage', expiry: '', usageLimit: 100 });
  const [form, setForm] = useState({ question: '', code: '', subject: 'Zoology', neetClass: '11', chapterNo: '', chapterName: '', topic: '', option1: '', option2: '', option3: '', option4: '', correct: 0, explanation: '' });

  useEffect(() => {
    fetchQuestions();
    setSelectedIds([]); setSelectAll(false);
    setForm(p => ({ ...p, subject, chapterNo: '', chapterName: '', topic: '' }));
  }, [subject]); // eslint-disable-line

  useEffect(() => { fetchNEETSettings(); }, []);

  const fetchNEETSettings = async () => {
    try {
      const d = await getDoc(doc(db, 'settings', 'neetSettings'));
      if (d.exists()) setNeetSettings({ ...DEFAULT_NEET_SETTINGS, ...d.data() });
      else await setDoc(doc(db, 'settings', 'neetSettings'), DEFAULT_NEET_SETTINGS);
    } catch { /* use defaults */ }
  };

  const handleSaveNEETSettings = async () => {
    setSavingSettings(true);
    try {
      await setDoc(doc(db, 'settings', 'neetSettings'), neetSettings);
      window.showToast?.('✅ NEET Settings saved!', 'success');
      setShowSettings(false);
    } catch { window.showToast?.('❌ Failed to save settings', 'error'); }
    finally { setSavingSettings(false); }
  };

  // ✅ FIX: Sort by position first, then fallback createdAt ascending
  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'neetQuestions'), where('subject', '==', subject));
      const snap = await getDocs(q);
      const qs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      qs.sort((a, b) => {
        // Primary: position field (guaranteed sequential)
        if (a.position !== undefined && b.position !== undefined) {
          return a.position - b.position;
        }
        // Secondary: class then chapter
        if (a.neetClass !== b.neetClass) return a.neetClass.localeCompare(b.neetClass);
        return (a.chapterNo || 0) - (b.chapterNo || 0);
      });
      setQuestions(qs);
    } catch { window.showToast?.('Failed to load questions', 'error'); }
    finally { setLoading(false); }
  };

  const fetchCoupons = async () => {
    try {
      const snap = await getDocs(query(collection(db, 'coupons'), where('scope', '==', 'neet')));
      const snap2 = await getDocs(query(collection(db, 'coupons'), where('scope', '==', 'global')));
      const all = [...snap.docs, ...snap2.docs].map(d => ({ id: d.id, ...d.data() }));
      const unique = all.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
      setCoupons(unique);
    } catch { setCoupons([]); }
  };

  const handleSaveCoupon = async () => {
    if (!couponForm.code.trim()) { window.showToast?.('❌ Coupon code required!', 'error'); return; }
    try {
      const code = couponForm.code.trim().toUpperCase();
      await setDoc(doc(db, 'coupons', `NEET_${code}`), {
        code, scope: 'neet',
        discount: parseInt(couponForm.discount) || 10,
        type: couponForm.type,
        expiry: couponForm.expiry || null,
        usageLimit: parseInt(couponForm.usageLimit) || 100,
        usedCount: 0, active: true,
        createdAt: serverTimestamp()
      });
      window.showToast?.('✅ Coupon created!', 'success');
      setCouponForm({ code: '', discount: 10, type: 'percentage', expiry: '', usageLimit: 100 });
      setShowCouponForm(false);
      fetchCoupons();
    } catch { window.showToast?.('❌ Failed to create coupon', 'error'); }
  };

  const handleDeleteCoupon = async (couponId) => {
    if (!window.confirm('Delete this coupon?')) return;
    try { await deleteDoc(doc(db, 'coupons', couponId)); window.showToast?.('✅ Deleted!', 'success'); fetchCoupons(); }
    catch { window.showToast?.('❌ Delete failed', 'error'); }
  };

  const resetForm = () => {
    setForm({ question: '', code: '', subject, neetClass: '11', chapterNo: '', chapterName: '', topic: '', option1: '', option2: '', option3: '', option4: '', correct: 0, explanation: '' });
    setEditingId(null);
  };

  const handleChapterSelect = (chNo) => {
    const chapters = NEET_CHAPTERS[form.subject]?.[form.neetClass] || [];
    const ch = chapters.find(c => c.no === parseInt(chNo));
    setForm(p => ({ ...p, chapterNo: chNo, chapterName: ch?.name || '' }));
  };

  const handleEditQuestion = (q) => {
    setForm({ question: q.question, code: q.code || '', subject: q.subject, neetClass: q.neetClass || '11', chapterNo: q.chapterNo || '', chapterName: q.chapterName || '', topic: q.topic || '', option1: q.options[0] || '', option2: q.options[1] || '', option3: q.options[2] || '', option4: q.options[3] || '', correct: q.correct, explanation: q.explanation || '' });
    setEditingId(q.id); setShowForm(true); window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveQuestion = async () => {
    if (!form.question.trim()) { window.showToast?.('Question is required!', 'error'); return; }
    if (!form.chapterNo) { window.showToast?.('Chapter is required!', 'error'); return; }
    if (!form.topic.trim()) { window.showToast?.('Topic is required!', 'error'); return; }
    if (!form.option1 || !form.option2 || !form.option3 || !form.option4) { window.showToast?.('All 4 options are required!', 'error'); return; }
    const maxQ = neetSettings.maxQuestionsPerSubject || 45;
    if (!editingId && questions.length >= maxQ) { window.showToast?.(`❌ Maximum ${maxQ} questions per subject reached!`, 'error'); return; }
    setLoading(true);
    try {
      const data = {
        question: form.question.trim(),
        code: form.code.trim(),
        subject: form.subject,
        neetClass: form.neetClass,
        chapterNo: parseInt(form.chapterNo),
        chapterName: form.chapterName,
        topic: form.topic.trim(),
        options: [form.option1.trim(), form.option2.trim(), form.option3.trim(), form.option4.trim()],
        correct: parseInt(form.correct),
        explanation: form.explanation.trim(),
        type: 'neet'
      };
      if (editingId) {
        // ✅ Edit: keep original position
        await updateDoc(doc(db, 'neetQuestions', editingId), { ...data, updatedAt: new Date().toISOString() });
        window.showToast?.('✅ Question updated!', 'success');
      } else {
        // ✅ New: assign sequential position
        const nextPosition = questions.length + 1;
        await addDoc(collection(db, 'neetQuestions'), { ...data, position: nextPosition, createdAt: new Date().toISOString() });
        window.showToast?.('✅ Question added!', 'success');
      }
      resetForm(); setShowForm(false); fetchQuestions();
    } catch { window.showToast?.('Failed to save question', 'error'); }
    finally { setLoading(false); }
  };

  const handleDeleteQuestion = async (id) => {
    if (!window.confirm('Delete this question?')) return;
    setDeletingIds(p => [...p, id]);
    try {
      await deleteDoc(doc(db, 'neetQuestions', id));
      window.showToast?.('✅ Deleted!', 'success');
      // ✅ Re-assign positions after delete
      const remaining = questions.filter(q => q.id !== id);
      await Promise.all(remaining.map((q, idx) => updateDoc(doc(db, 'neetQuestions', q.id), { position: idx + 1 })));
      setQuestions(remaining);
    }
    catch { window.showToast?.('Delete failed', 'error'); }
    finally { setDeletingIds(p => p.filter(d => d !== id)); }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedIds.length} selected questions?`)) return;
    setLoading(true);
    try {
      await Promise.all(selectedIds.map(id => deleteDoc(doc(db, 'neetQuestions', id))));
      window.showToast?.(`✅ ${selectedIds.length} questions deleted!`, 'success');
      // ✅ Re-assign positions after bulk delete
      const remaining = questions.filter(q => !selectedIds.includes(q.id));
      await Promise.all(remaining.map((q, idx) => updateDoc(doc(db, 'neetQuestions', q.id), { position: idx + 1 })));
      setQuestions(remaining);
      setSelectedIds([]); setSelectAll(false);
    }
    catch { window.showToast?.('Bulk delete failed', 'error'); }
    finally { setLoading(false); }
  };

  const toggleSelect = (id) => setSelectedIds(p => p.includes(id) ? p.filter(s => s !== id) : [...p, id]);
  const handleSelectAll = () => { if (selectAll) { setSelectedIds([]); setSelectAll(false); } else { setSelectedIds(filteredQs.map(q => q.id)); setSelectAll(true); } };
  const filteredQs = questions.filter(q => {
    const matchClass = filterClass === 'all' || q.neetClass === filterClass;
    const matchSearch = !searchQuery || q.question.toLowerCase().includes(searchQuery.toLowerCase()) || q.chapterName?.toLowerCase().includes(searchQuery.toLowerCase()) || q.topic?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchClass && matchSearch;
  });

  const sc = NEET_SUBJECT_META[subject];
  const maxQ = neetSettings.maxQuestionsPerSubject || 45;
  const isAtLimit = questions.length >= maxQ && !editingId;
  const class11Count = questions.filter(q => q.neetClass === '11').length;
  const class12Count = questions.filter(q => q.neetClass === '12').length;
  const totalNEETQuestions = maxQ * 4;
  const inp = (extra = {}) => ({ width: '100%', padding: isMobile ? '0.65rem' : '0.8rem', border: '2px solid #e2e8f0', borderRadius: '10px', fontSize: isMobile ? '0.85rem' : '0.95rem', outline: 'none', boxSizing: 'border-box', background: '#f8fafc', ...extra });

  return (
    <div>
      {/* Header */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: isMobile ? '12px' : '16px', padding: isMobile ? '1rem' : '1.75rem', marginBottom: '1rem', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: isMobile ? '1.3rem' : '1.6rem', fontWeight: '800', color: '#1e293b' }}>🧬 NEET Question Manager</h2>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.82rem', color: '#64748b' }}>
              Subject order follows real NEET exam: Zoology → Botany → Physics → Chemistry · 45 questions each · {totalNEETQuestions} total
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button onClick={() => { setShowSettings(!showSettings); setShowCoupons(false); }} style={{ padding: '0.6rem 1.1rem', borderRadius: '10px', border: '2px solid rgba(99,102,241,0.3)', background: showSettings ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.08)', color: '#6366f1', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
              <Settings size={15} /> {showSettings ? 'Hide Settings' : 'NEET Settings'}
            </button>
            <button onClick={() => { setShowCoupons(!showCoupons); setShowSettings(false); if (!showCoupons) fetchCoupons(); }} style={{ padding: '0.6rem 1.1rem', borderRadius: '10px', border: '2px solid rgba(16,185,129,0.3)', background: showCoupons ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.08)', color: '#10b981', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}>
              <Ticket size={15} /> {showCoupons ? 'Hide Coupons' : 'Coupons'}
            </button>
          </div>
        </div>

        {showSettings && (
          <div style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.05),rgba(139,92,246,0.05))', border: '2px solid rgba(99,102,241,0.2)', borderRadius: '14px', padding: isMobile ? '1rem' : '1.5rem', marginBottom: '1.25rem' }}>
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.1rem', fontWeight: '800', color: '#6366f1', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Settings size={18} /> NEET Exam Settings</h3>
            <p style={{ margin: '0 0 1.25rem', fontSize: '0.8rem', color: '#64748b' }}>
              One price applies to the full NEET mock test (all 4 subjects combined). Set 180 minutes to match the real exam.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,1fr)', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.78rem', fontWeight: '700', color: '#475569' }}>💰 Test Price (₹)</label>
                <input type="number" min="0" value={neetSettings.price} onChange={e => setNeetSettings(p => ({ ...p, price: parseInt(e.target.value) || 0 }))} style={{ ...inp(), borderColor: '#6366f1', background: 'rgba(99,102,241,0.04)' }} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.78rem', fontWeight: '700', color: '#475569' }}>⏱️ Duration (minutes)</label>
                <input type="number" min="60" max="300" value={neetSettings.timeMinutes} onChange={e => setNeetSettings(p => ({ ...p, timeMinutes: parseInt(e.target.value) || 180 }))} style={inp()} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.78rem', fontWeight: '700', color: '#475569' }}>📝 Questions / Subject</label>
                <input type="number" min="5" max="100" value={neetSettings.maxQuestionsPerSubject} onChange={e => setNeetSettings(p => ({ ...p, maxQuestionsPerSubject: parseInt(e.target.value) || 45 }))} style={inp()} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.78rem', fontWeight: '700', color: '#475569' }}>✅ Correct (+marks)</label>
                <input type="number" min="1" value={neetSettings.markingCorrect} onChange={e => setNeetSettings(p => ({ ...p, markingCorrect: parseInt(e.target.value) || 4 }))} style={inp()} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.78rem', fontWeight: '700', color: '#475569' }}>❌ Wrong (−marks)</label>
                <input type="number" max="0" value={neetSettings.markingWrong} onChange={e => setNeetSettings(p => ({ ...p, markingWrong: parseInt(e.target.value) || -1 }))} style={inp()} />
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: '700', color: '#475569' }}>🔥 Sale Price (₹)</label>
                  <button onClick={() => setNeetSettings(p => ({ ...p, saleEnabled: !p.saleEnabled }))} style={{ padding: '0.15rem 0.5rem', borderRadius: '20px', border: 'none', background: neetSettings.saleEnabled ? '#10b981' : '#e2e8f0', color: neetSettings.saleEnabled ? '#fff' : '#64748b', fontSize: '0.65rem', fontWeight: '700', cursor: 'pointer' }}>
                    {neetSettings.saleEnabled ? '🔥 ON' : 'OFF'}
                  </button>
                </div>
                <input type="number" min="0" value={neetSettings.salePrice} onChange={e => setNeetSettings(p => ({ ...p, salePrice: parseInt(e.target.value) || 0 }))} disabled={!neetSettings.saleEnabled} placeholder={neetSettings.saleEnabled ? 'Sale price...' : 'Enable sale first'} style={{ ...inp(), opacity: neetSettings.saleEnabled ? 1 : 0.5 }} />
              </div>
            </div>
            <div style={{ padding: '1rem', background: '#fff', border: '2px solid rgba(99,102,241,0.2)', borderRadius: '12px', marginBottom: '1rem' }}>
              <div style={{ fontWeight: '800', color: '#1e293b', marginBottom: '0.6rem', fontSize: '0.9rem' }}>📋 Exam Preview</div>
              <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                <span style={{ padding: '0.25rem 0.7rem', background: '#eff6ff', color: '#1d4ed8', borderRadius: '8px', fontSize: '0.78rem', fontWeight: '700' }}>
                  💰 {neetSettings.saleEnabled && neetSettings.salePrice > 0 ? <><span style={{ textDecoration: 'line-through', opacity: 0.6 }}>₹{neetSettings.price}</span> → ₹{neetSettings.salePrice}</> : `₹${neetSettings.price}`}
                </span>
                <span style={{ padding: '0.25rem 0.7rem', background: '#f0fdf4', color: '#065f46', borderRadius: '8px', fontSize: '0.78rem', fontWeight: '700' }}>⏱️ {neetSettings.timeMinutes} min {neetSettings.timeMinutes === 180 && '(real NEET duration ✓)'}</span>
                <span style={{ padding: '0.25rem 0.7rem', background: '#fff7ed', color: '#c2410c', borderRadius: '8px', fontSize: '0.78rem', fontWeight: '700' }}>📝 {neetSettings.maxQuestionsPerSubject} × 4 subjects = {neetSettings.maxQuestionsPerSubject * 4} total questions</span>
                <span style={{ padding: '0.25rem 0.7rem', background: '#fdf4ff', color: '#7e22ce', borderRadius: '8px', fontSize: '0.78rem', fontWeight: '700' }}>✅ +{neetSettings.markingCorrect} / ❌ {neetSettings.markingWrong}</span>
              </div>
            </div>
            {neetSettings.saleEnabled && neetSettings.salePrice > 0 && neetSettings.price > 0 && (
              <div style={{ padding: '0.65rem', background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '8px', fontSize: '0.8rem', color: '#92400e', fontWeight: '600', marginBottom: '1rem' }}>
                🔥 Sale Active: <span style={{ textDecoration: 'line-through' }}>₹{neetSettings.price}</span> → <strong>₹{neetSettings.salePrice}</strong> — Save ₹{neetSettings.price - neetSettings.salePrice} ({Math.round(((neetSettings.price - neetSettings.salePrice) / neetSettings.price) * 100)}% off)
              </div>
            )}
            <button onClick={handleSaveNEETSettings} disabled={savingSettings} style={{ width: '100%', padding: '0.85rem', borderRadius: '10px', border: 'none', background: savingSettings ? '#e2e8f0' : 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: savingSettings ? '#94a3b8' : '#fff', fontWeight: '800', cursor: savingSettings ? 'not-allowed' : 'pointer', fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <Save size={16} /> {savingSettings ? 'Saving...' : '✅ Save NEET Settings'}
            </button>
          </div>
        )}

        {showCoupons && (
          <div style={{ background: 'linear-gradient(135deg,rgba(16,185,129,0.04),rgba(5,150,105,0.04))', border: '2px solid rgba(16,185,129,0.2)', borderRadius: '14px', padding: isMobile ? '1rem' : '1.5rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Ticket size={16} /> NEET Coupons</h3>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.75rem', color: '#64748b' }}>Coupons apply to the full NEET test price.</p>
              </div>
              <button onClick={() => setShowCouponForm(!showCouponForm)} style={{ padding: '0.45rem 0.9rem', background: 'linear-gradient(135deg,#10b981,#059669)', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: '700', cursor: 'pointer', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Plus size={14} /> New Coupon</button>
            </div>
            {showCouponForm && (
              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem', marginBottom: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div><label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.78rem', fontWeight: '700', color: '#475569' }}>Code *</label><input value={couponForm.code} onChange={e => setCouponForm(p => ({...p, code: e.target.value.toUpperCase()}))} placeholder="e.g. NEET50" style={{ width: '100%', padding: '0.65rem', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '0.9rem', fontFamily: 'monospace', fontWeight: '700', outline: 'none', boxSizing: 'border-box' }} /></div>
                  <div><label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.78rem', fontWeight: '700', color: '#475569' }}>Type</label><select value={couponForm.type} onChange={e => setCouponForm(p => ({...p, type: e.target.value}))} style={{ width: '100%', padding: '0.65rem', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}><option value="percentage">% Percentage</option><option value="flat">₹ Flat</option></select></div>
                  <div><label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.78rem', fontWeight: '700', color: '#475569' }}>Discount {couponForm.type === 'percentage' ? '(%)' : '(₹)'}</label><input type="number" min="1" value={couponForm.discount} onChange={e => setCouponForm(p => ({...p, discount: e.target.value}))} style={{ width: '100%', padding: '0.65rem', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }} /></div>
                  <div><label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.78rem', fontWeight: '700', color: '#475569' }}>Usage Limit</label><input type="number" min="1" value={couponForm.usageLimit} onChange={e => setCouponForm(p => ({...p, usageLimit: e.target.value}))} style={{ width: '100%', padding: '0.65rem', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }} /></div>
                  <div><label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.78rem', fontWeight: '700', color: '#475569' }}>Expiry (optional)</label><input type="date" value={couponForm.expiry} onChange={e => setCouponForm(p => ({...p, expiry: e.target.value}))} style={{ width: '100%', padding: '0.65rem', border: '2px solid #e2e8f0', borderRadius: '8px', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }} /></div>
                </div>
                <div style={{ display: 'flex', gap: '0.6rem' }}>
                  <button onClick={() => setShowCouponForm(false)} style={{ flex: 1, padding: '0.7rem', background: '#f1f5f9', border: '2px solid #e2e8f0', borderRadius: '8px', color: '#475569', fontWeight: '700', cursor: 'pointer' }}>Cancel</button>
                  <button onClick={handleSaveCoupon} style={{ flex: 2, padding: '0.7rem', background: 'linear-gradient(135deg,#10b981,#059669)', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: '700', cursor: 'pointer' }}>✅ Create Coupon</button>
                </div>
              </div>
            )}
            {coupons.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontSize: '0.85rem' }}>🎟️ No coupons for NEET yet.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {coupons.map(c => (
                  <div key={c.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.85rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontFamily: 'monospace', fontWeight: '800', fontSize: '1rem', color: '#1e293b', marginBottom: '0.2rem' }}>{c.code}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                        <span>💰 {c.type === 'percentage' ? `${c.discount}% off` : `₹${c.discount} off`}</span>
                        <span>👥 {c.usedCount || 0}/{c.usageLimit}</span>
                        {c.expiry && <span>📅 {c.expiry}</span>}
                      </div>
                    </div>
                    <button onClick={() => handleDeleteCoupon(c.id)} style={{ padding: '0.4rem', background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: '8px', cursor: 'pointer' }}><Trash2 size={14} color="#ef4444" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div style={{ marginBottom: '0.5rem' }}>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '600', marginBottom: '0.5rem', letterSpacing: '0.5px' }}>NEET SUBJECT ORDER →</div>
          <div style={{ display: 'flex', gap: isMobile ? '0.35rem' : '0.5rem', flexWrap: 'wrap' }}>
            {NEET_SUBJECTS.map((s, idx) => {
              const m = NEET_SUBJECT_META[s];
              return (
                <button key={s} onClick={() => setSubject(s)} style={{ flex: 1, minWidth: isMobile ? '45%' : 'auto', padding: isMobile ? '0.55rem 0.4rem' : '0.7rem 1rem', borderRadius: '10px', border: subject === s ? `2px solid ${m.border}` : '2px solid #e2e8f0', background: subject === s ? m.bg : '#fff', color: subject === s ? m.text : '#64748b', fontWeight: '700', cursor: 'pointer', fontSize: isMobile ? '0.75rem' : '0.85rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.2rem' }}>
                  <span style={{ fontSize: '0.65rem', opacity: 0.5, fontWeight: '600' }}>{idx + 1}</span>
                  <span>{m.icon} {s}</span>
                  <span style={{ fontSize: '0.62rem', opacity: 0.8 }}>{questions.filter(q => q.subject === s).length || (subject === s ? questions.length : 0)}Q</span>
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ marginTop: '1rem', padding: '1rem', background: 'linear-gradient(135deg,rgba(99,102,241,0.06),rgba(139,92,246,0.06))', border: '2px solid rgba(99,102,241,0.2)', borderRadius: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
            <IndianRupee size={16} color="#6366f1" />
            <span style={{ fontWeight: '800', fontSize: '0.9rem', color: '#6366f1' }}>NEET Test Price</span>
            <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: '500' }}>— edit and save directly</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr 1fr auto', gap: '0.75rem', alignItems: 'end' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.35rem', fontSize: '0.75rem', fontWeight: '700', color: '#475569' }}>💰 Original Price (₹)</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', fontWeight: '800', color: '#6366f1', fontSize: '0.9rem' }}>₹</span>
                <input type="number" min="0" value={neetSettings.price} onChange={e => setNeetSettings(p => ({ ...p, price: parseInt(e.target.value) || 0 }))} style={{ width: '100%', padding: '0.7rem 0.7rem 0.7rem 1.8rem', border: '2px solid rgba(99,102,241,0.4)', borderRadius: '10px', fontSize: '1.05rem', fontWeight: '800', outline: 'none', boxSizing: 'border-box', background: '#fff', color: '#1e293b' }} />
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: '700', color: '#475569' }}>🔥 Sale Price (₹)</label>
                <button onClick={() => setNeetSettings(p => ({ ...p, saleEnabled: !p.saleEnabled }))} style={{ padding: '0.1rem 0.5rem', borderRadius: '20px', border: 'none', background: neetSettings.saleEnabled ? '#10b981' : '#e2e8f0', color: neetSettings.saleEnabled ? '#fff' : '#64748b', fontSize: '0.62rem', fontWeight: '700', cursor: 'pointer' }}>
                  {neetSettings.saleEnabled ? '🔥 ON' : 'OFF'}
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '0.65rem', top: '50%', transform: 'translateY(-50%)', fontWeight: '800', color: neetSettings.saleEnabled ? '#10b981' : '#94a3b8', fontSize: '0.9rem' }}>₹</span>
                <input type="number" min="0" value={neetSettings.salePrice} onChange={e => setNeetSettings(p => ({ ...p, salePrice: parseInt(e.target.value) || 0 }))} disabled={!neetSettings.saleEnabled} placeholder={neetSettings.saleEnabled ? 'Enter sale price' : 'Enable sale first'} style={{ width: '100%', padding: '0.7rem 0.7rem 0.7rem 1.8rem', border: `2px solid ${neetSettings.saleEnabled ? '#10b981' : '#e2e8f0'}`, borderRadius: '10px', fontSize: '1.05rem', fontWeight: '800', outline: 'none', boxSizing: 'border-box', background: neetSettings.saleEnabled ? '#f0fdf4' : '#f8fafc', color: '#1e293b', opacity: neetSettings.saleEnabled ? 1 : 0.5 }} />
              </div>
            </div>
            <div style={{ padding: '0.7rem 0.85rem', background: '#fff', border: '2px solid #e2e8f0', borderRadius: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.68rem', fontWeight: '700', color: '#94a3b8', marginBottom: '0.3rem' }}>STUDENTS SEE</div>
              {neetSettings.saleEnabled && neetSettings.salePrice > 0 ? (
                <>
                  <div style={{ fontSize: '0.78rem', textDecoration: 'line-through', color: '#94a3b8', fontWeight: '600' }}>₹{neetSettings.price}</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: '900', color: '#10b981' }}>₹{neetSettings.salePrice}</div>
                  <div style={{ fontSize: '0.62rem', color: '#10b981', fontWeight: '700' }}>{neetSettings.price > 0 ? `${Math.round(((neetSettings.price - neetSettings.salePrice) / neetSettings.price) * 100)}% OFF` : ''}</div>
                </>
              ) : (
                <div style={{ fontSize: '1.3rem', fontWeight: '900', color: '#6366f1' }}>₹{neetSettings.price}</div>
              )}
            </div>
            <button onClick={handleSaveNEETSettings} disabled={savingSettings} style={{ padding: '0.7rem 1.25rem', background: savingSettings ? '#e2e8f0' : 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', borderRadius: '10px', color: savingSettings ? '#94a3b8' : '#fff', fontWeight: '800', cursor: savingSettings ? 'not-allowed' : 'pointer', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap' }}>
              <Save size={15} /> {savingSettings ? 'Saving...' : 'Save Price'}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
          <div style={{ flex: 1, minWidth: '80px', padding: '0.6rem', background: '#f0fdf4', borderRadius: '10px', border: '1px solid #bbf7d0', textAlign: 'center' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: '900', color: '#10b981' }}>{neetSettings.timeMinutes}m</div>
            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '600' }}>Duration</div>
          </div>
          <div style={{ flex: 1, minWidth: '80px', padding: '0.6rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: '900', color: '#475569' }}>{class11Count}</div>
            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '600' }}>Class 11</div>
          </div>
          <div style={{ flex: 1, minWidth: '80px', padding: '0.6rem', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: '900', color: '#475569' }}>{class12Count}</div>
            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '600' }}>Class 12</div>
          </div>
          <div style={{ flex: 1, minWidth: '80px', padding: '0.6rem', background: isAtLimit ? '#fef2f2' : sc.bg, borderRadius: '10px', border: `1px solid ${isAtLimit ? '#fecaca' : sc.border}`, textAlign: 'center' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: '900', color: isAtLimit ? '#ef4444' : sc.text }}>{questions.length}/{maxQ}</div>
            <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '600' }}>{subject}</div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <button onClick={() => { if (showForm && !editingId) { setShowForm(false); resetForm(); } else { resetForm(); setShowForm(true); } }} disabled={isAtLimit && !showForm} style={{ padding: '0.65rem 1.25rem', background: (showForm && !editingId) ? '#f1f5f9' : isAtLimit ? '#e2e8f0' : 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', borderRadius: '10px', color: (showForm && !editingId) ? '#64748b' : isAtLimit ? '#94a3b8' : '#fff', fontWeight: '700', cursor: isAtLimit && !showForm ? 'not-allowed' : 'pointer', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          {showForm && !editingId ? <X size={15} /> : <Plus size={15} />}
          {showForm && !editingId ? 'Cancel' : isAtLimit ? `Limit (${maxQ})` : 'Add Question'}
        </button>
        {selectedIds.length > 0 && (
          <button onClick={handleBulkDelete} style={{ padding: '0.65rem 1.25rem', background: 'rgba(239,68,68,0.1)', border: '2px solid rgba(239,68,68,0.3)', borderRadius: '10px', color: '#ef4444', fontWeight: '700', cursor: 'pointer', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Trash2 size={15} /> Delete ({selectedIds.length})
          </button>
        )}
        <select value={filterClass} onChange={e => setFilterClass(e.target.value)} style={{ padding: '0.65rem', border: '2px solid #e2e8f0', borderRadius: '10px', fontSize: '0.85rem', outline: 'none', fontWeight: '600', color: '#475569', background: '#fff' }}>
          <option value="all">All Classes ({questions.length})</option>
          <option value="11">Class 11 ({class11Count})</option>
          <option value="12">Class 12 ({class12Count})</option>
        </select>
        <input type="text" placeholder="Search question, chapter, topic..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ flex: 1, minWidth: isMobile ? '130px' : '200px', padding: '0.65rem 1rem', border: '2px solid #e2e8f0', borderRadius: '10px', fontSize: '0.85rem', outline: 'none' }} />
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div style={{ background: '#fff', border: editingId ? '2px solid #f59e0b' : `2px solid ${sc.border}`, borderRadius: '16px', padding: isMobile ? '1rem' : '1.75rem', marginBottom: '1.25rem', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: editingId ? '#d97706' : sc.text }}>{editingId ? '✏️ Edit NEET Question' : `➕ New ${subject} Question`}</h3>
            <button onClick={() => { resetForm(); setShowForm(false); }} style={{ padding: '0.4rem 0.8rem', borderRadius: '8px', border: '2px solid #e2e8f0', background: '#fff', color: '#64748b', fontWeight: '600', cursor: 'pointer', fontSize: '0.8rem' }}>Cancel</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div><label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.8rem', fontWeight: '700', color: '#475569' }}>Subject *</label><select value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value, chapterNo: '', chapterName: '', topic: '' }))} style={inp()}>{NEET_SUBJECTS.map(s => <option key={s} value={s}>{NEET_SUBJECT_META[s].icon} {s}</option>)}</select></div>
              <div><label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.8rem', fontWeight: '700', color: '#475569' }}>Class *</label><select value={form.neetClass} onChange={e => setForm(p => ({ ...p, neetClass: e.target.value, chapterNo: '', chapterName: '' }))} style={inp()}><option value="11">Class 11th NCERT</option><option value="12">Class 12th NCERT</option></select></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 2fr', gap: '0.75rem' }}>
              <div><label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.8rem', fontWeight: '700', color: '#475569' }}>Chapter *</label><select value={form.chapterNo} onChange={e => handleChapterSelect(e.target.value)} style={inp({ background: form.chapterNo ? '#f0fdf4' : '#f8fafc', borderColor: form.chapterNo ? '#22c55e' : '#e2e8f0' })}><option value="">Select Chapter</option>{(NEET_CHAPTERS[form.subject]?.[form.neetClass] || []).map(ch => (<option key={ch.no} value={ch.no}>Ch.{ch.no} — {ch.name}</option>))}</select></div>
              <div><label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.8rem', fontWeight: '700', color: '#475569' }}>Chapter Name (auto-filled)</label><input value={form.chapterName} onChange={e => setForm(p => ({ ...p, chapterName: e.target.value }))} placeholder="Auto-fills when chapter is selected" style={inp({ background: form.chapterName ? '#f0fdf4' : '#f8fafc', borderColor: form.chapterName ? '#22c55e' : '#e2e8f0' })} /></div>
            </div>
            <div><label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.8rem', fontWeight: '700', color: '#475569' }}>Topic / Concept *</label><input value={form.topic} onChange={e => setForm(p => ({ ...p, topic: e.target.value }))} placeholder="e.g. Transpiration, DNA Replication, Newton's Laws..." style={inp()} /></div>
            <div><label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.8rem', fontWeight: '700', color: '#475569' }}>Question *</label><textarea value={form.question} onChange={e => setForm(p => ({ ...p, question: e.target.value }))} placeholder="Enter the full question..." rows={3} style={{ ...inp(), resize: 'vertical' }} /></div>
            <div><label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.8rem', fontWeight: '700', color: '#475569' }}>Diagram / Extra Info (optional)</label><textarea value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} placeholder="Any extra context, formula, or diagram description..." rows={2} style={{ ...inp(), resize: 'vertical', fontFamily: 'system-ui' }} /></div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.8rem', fontWeight: '700', color: '#475569' }}>Options *</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {[1,2,3,4].map(num => (
                  <div key={num} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: parseInt(form.correct) === num - 1 ? '#10b981' : '#e2e8f0', color: parseInt(form.correct) === num - 1 ? '#fff' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '0.8rem', flexShrink: 0 }}>{String.fromCharCode(64 + num)}</div>
                    <input value={form[`option${num}`]} onChange={e => setForm(p => ({ ...p, [`option${num}`]: e.target.value }))} placeholder={`Option ${num}`} style={{ flex: 1, padding: '0.65rem', border: parseInt(form.correct) === num - 1 ? '2px solid #10b981' : '2px solid #e2e8f0', borderRadius: '8px', fontSize: '0.9rem', outline: 'none', background: parseInt(form.correct) === num - 1 ? '#f0fdf4' : '#fff' }} />
                  </div>
                ))}
              </div>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', fontWeight: '700', color: '#475569' }}><CheckCircle size={13} color="#10b981" style={{ display: 'inline', marginRight: '0.3rem' }} />Correct Answer *</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>{[0,1,2,3].map(idx => (<button key={idx} type="button" onClick={() => setForm(p => ({ ...p, correct: idx }))} style={{ flex: 1, padding: '0.6rem', borderRadius: '8px', border: parseInt(form.correct) === idx ? '2px solid #10b981' : '2px solid #e2e8f0', background: parseInt(form.correct) === idx ? '#f0fdf4' : '#fff', color: parseInt(form.correct) === idx ? '#10b981' : '#64748b', fontWeight: '700', cursor: 'pointer', fontSize: '0.88rem' }}>Option {idx + 1}</button>))}</div>
            </div>
            <div><label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.8rem', fontWeight: '700', color: '#475569' }}>💡 Explanation (shown after wrong answer)</label><textarea value={form.explanation} onChange={e => setForm(p => ({ ...p, explanation: e.target.value }))} placeholder="Explain the correct answer here..." rows={4} style={{ ...inp(), resize: 'vertical', lineHeight: 1.6, background: form.explanation ? '#fffbeb' : '#f8fafc', borderColor: form.explanation ? '#f59e0b' : '#e2e8f0' }} /></div>
            {form.chapterName && form.topic && (
              <div style={{ padding: '0.85rem', background: 'linear-gradient(135deg,rgba(99,102,241,0.08),rgba(139,92,246,0.08))', border: '2px solid rgba(99,102,241,0.2)', borderRadius: '12px', fontSize: '0.85rem' }}>
                <div style={{ fontWeight: '800', color: '#6366f1', marginBottom: '0.4rem' }}>📋 Question Tags:</div>
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                  <span style={{ background: sc.light, color: sc.text, padding: '0.15rem 0.5rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: '700' }}>{sc.icon} {form.subject}</span>
                  <span style={{ background: '#fef3c7', color: '#92400e', padding: '0.15rem 0.5rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: '700' }}>Class {form.neetClass}th</span>
                  <span style={{ background: '#f0fdf4', color: '#065f46', padding: '0.15rem 0.5rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: '700' }}>Ch.{form.chapterNo} {form.chapterName}</span>
                  <span style={{ background: '#fdf4ff', color: '#7e22ce', padding: '0.15rem 0.5rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: '700' }}>📌 {form.topic}</span>
                </div>
              </div>
            )}
            <button onClick={handleSaveQuestion} disabled={loading} style={{ padding: '1rem', borderRadius: '12px', border: 'none', background: loading ? '#e2e8f0' : editingId ? 'linear-gradient(135deg,#f59e0b,#d97706)' : 'linear-gradient(135deg,#10b981,#059669)', color: loading ? '#94a3b8' : '#fff', fontSize: '1rem', fontWeight: '800', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              {editingId ? <Edit2 size={17} /> : <Save size={17} />}
              {loading ? 'Saving...' : editingId ? 'Update Question' : 'Save Question'}
            </button>
          </div>
        </div>
      )}

      {/* Questions List */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
        <div style={{ padding: '1.1rem 1.25rem', borderBottom: '2px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fafafa' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={selectAll} onChange={handleSelectAll} style={{ width: '15px', height: '15px', cursor: 'pointer' }} />
            <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#64748b' }}>Select All</span>
          </label>
          <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>{filteredQs.length} questions {filterClass !== 'all' ? `(Class ${filterClass})` : ''}</span>
        </div>
        {loading ? <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>Loading...</div> :
          filteredQs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 1.5rem', color: '#94a3b8' }}>
              <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>{sc.icon}</div>
              <div style={{ fontSize: '1rem', fontWeight: '600' }}>No {subject} questions yet. Click "Add Question" to get started!</div>
            </div>
          ) : (
            filteredQs.map((q, idx) => {
              const isSelected = selectedIds.includes(q.id);
              const isDeleting = deletingIds.includes(q.id);
              const isEditing = editingId === q.id;
              const qm = NEET_SUBJECT_META[q.subject] || NEET_SUBJECT_META.Physics;
              return (
                <div key={q.id} style={{ borderBottom: idx < filteredQs.length - 1 ? '1px solid #f1f5f9' : 'none', background: isEditing ? '#fffbeb' : isSelected ? '#fafbff' : '#fff', borderLeft: isEditing ? '4px solid #f59e0b' : isSelected ? `4px solid ${sc.color}` : '4px solid transparent', opacity: isDeleting ? 0.4 : 1, padding: '1.1rem 1.25rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(q.id)} style={{ width: '15px', height: '15px', marginTop: '4px', cursor: 'pointer', flexShrink: 0 }} />
                  <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: qm.light, color: qm.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '0.75rem', flexShrink: 0 }}>{idx + 1}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.98rem', fontWeight: '600', color: '#1e293b', marginBottom: '0.5rem', lineHeight: 1.45, wordBreak: 'break-word' }}>{q.question}</div>
                    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                      <span style={{ padding: '0.15rem 0.5rem', background: qm.light, color: qm.text, borderRadius: '6px', fontSize: '0.68rem', fontWeight: '700' }}>{qm.icon} {q.subject}</span>
                      <span style={{ padding: '0.15rem 0.5rem', background: q.neetClass === '11' ? '#eff6ff' : '#fef3c7', color: q.neetClass === '11' ? '#1d4ed8' : '#92400e', borderRadius: '6px', fontSize: '0.68rem', fontWeight: '700' }}>Class {q.neetClass}th</span>
                      <span style={{ padding: '0.15rem 0.5rem', background: '#f1f5f9', color: '#475569', borderRadius: '6px', fontSize: '0.68rem', fontWeight: '600' }}>Ch.{q.chapterNo} {q.chapterName}</span>
                      <span style={{ padding: '0.15rem 0.5rem', background: '#fdf4ff', color: '#7e22ce', borderRadius: '6px', fontSize: '0.68rem', fontWeight: '600' }}>📌 {q.topic}</span>
                      <span style={{ padding: '0.15rem 0.5rem', background: '#f0fdf4', color: '#065f46', borderRadius: '6px', fontSize: '0.68rem', fontWeight: '600', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>✓ {q.options?.[q.correct]}</span>
                      {q.explanation ? <span style={{ padding: '0.15rem 0.5rem', background: '#fffbeb', color: '#92400e', borderRadius: '6px', fontSize: '0.68rem', fontWeight: '700', border: '1px solid #fde68a' }}>💡 ✅</span> : <span style={{ padding: '0.15rem 0.5rem', background: '#fef2f2', color: '#991b1b', borderRadius: '6px', fontSize: '0.68rem', fontWeight: '600', border: '1px solid #fecaca' }}>💡 ✗</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                    <button onClick={() => handleEditQuestion(q)} style={{ width: '32px', height: '32px', borderRadius: '8px', border: 'none', background: 'rgba(245,158,11,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Edit2 size={14} color="#d97706" /></button>
                    <button onClick={() => handleDeleteQuestion(q.id)} style={{ width: '32px', height: '32px', borderRadius: '8px', border: 'none', background: 'rgba(239,68,68,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={14} color="#ef4444" /></button>
                  </div>
                </div>
              );
            })
          )
        }
      </div>
    </div>
  );
}

// ==========================================
// 🎯 CUSTOM EXAMS TAB
// ==========================================
function CustomExamsTab({ isMobile }) {
  const [examView, setExamView] = useState('list');
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [editingExam, setEditingExam] = useState(null);
  const [examForm, setExamForm] = useState({ name: '', description: '', subjects: [''], timeLimit: 60, price: 99, salePrice: '', saleEnabled: false, passingMarks: 55, certificateEnabled: true, couponEnabled: false, maxQuestions: 50, instructions: '' });
  const [coupons, setCoupons] = useState([]);
  const [showCouponForm, setShowCouponForm] = useState(false);
  const [couponForm, setCouponForm] = useState({ code: '', discount: 10, type: 'percentage', expiry: '', usageLimit: 100 });

  useEffect(() => { fetchExams(); }, []);

  const fetchExams = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(query(collection(db, 'customExams'), orderBy('createdAt', 'desc')));
      setExams(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch {
      try { const snapshot = await getDocs(collection(db, 'customExams')); setExams(snapshot.docs.map(d => ({ id: d.id, ...d.data() }))); } catch { window.showToast?.('Failed to load exams', 'error'); }
    } finally { setLoading(false); }
  };

  const fetchCoupons = async (examId) => {
    try { const snap = await getDocs(query(collection(db, 'coupons'), where('examId', '==', examId))); setCoupons(snap.docs.map(d => ({ id: d.id, ...d.data() }))); } catch { setCoupons([]); }
  };

  const resetExamForm = () => { setExamForm({ name: '', description: '', subjects: [''], timeLimit: 60, price: 99, salePrice: '', saleEnabled: false, passingMarks: 55, certificateEnabled: true, couponEnabled: false, maxQuestions: 50, instructions: '' }); setEditingExam(null); };

  const handleEditExam = (exam) => {
    setExamForm({ name: exam.name || '', description: exam.description || '', subjects: exam.subjects?.length > 0 ? exam.subjects : [''], timeLimit: exam.timeLimit || 60, price: exam.price || 99, salePrice: exam.salePrice || '', saleEnabled: exam.saleEnabled || false, passingMarks: exam.passingMarks || 55, certificateEnabled: exam.certificateEnabled !== false, couponEnabled: exam.couponEnabled || false, maxQuestions: exam.maxQuestions || 50, instructions: exam.instructions || '' });
    setEditingExam(exam); setExamView('create');
  };

  const handleSaveExam = async () => {
    if (!examForm.name.trim()) { window.showToast?.('❌ Exam name is required!', 'error'); return; }
    if (examForm.subjects.filter(s => s.trim()).length === 0) { window.showToast?.('❌ Add at least one subject!', 'error'); return; }
    setLoading(true);
    try {
      const examData = { name: examForm.name.trim(), description: examForm.description.trim(), subjects: examForm.subjects.filter(s => s.trim()), timeLimit: parseInt(examForm.timeLimit) || 60, price: parseInt(examForm.price) || 0, salePrice: examForm.saleEnabled ? (parseInt(examForm.salePrice) || 0) : null, saleEnabled: examForm.saleEnabled, passingMarks: parseInt(examForm.passingMarks) || 55, certificateEnabled: examForm.certificateEnabled, couponEnabled: examForm.couponEnabled, maxQuestions: parseInt(examForm.maxQuestions) || 50, instructions: examForm.instructions.trim(), active: true, updatedAt: serverTimestamp() };
      if (editingExam) { await updateDoc(doc(db, 'customExams', editingExam.id), examData); window.showToast?.('✅ Exam updated!', 'success'); }
      else { await addDoc(collection(db, 'customExams'), { ...examData, createdAt: serverTimestamp(), questionCount: 0 }); window.showToast?.('✅ Exam created!', 'success'); }
      resetExamForm(); setExamView('list'); fetchExams();
    } catch { window.showToast?.('❌ Failed to save exam', 'error'); }
    finally { setLoading(false); }
  };

  const handleDeleteExam = async (exam) => {
    if (!window.confirm(`⚠️ Delete "${exam.name}"? This will also delete all its questions and coupons.`)) return;
    setLoading(true);
    try {
      const qSnap = await getDocs(query(collection(db, 'customQuestions'), where('examId', '==', exam.id)));
      await Promise.all(qSnap.docs.map(d => deleteDoc(d.ref)));
      const cSnap = await getDocs(query(collection(db, 'coupons'), where('examId', '==', exam.id)));
      await Promise.all(cSnap.docs.map(d => deleteDoc(d.ref)));
      await deleteDoc(doc(db, 'customExams', exam.id));
      window.showToast?.('✅ Exam deleted!', 'success'); fetchExams();
    } catch { window.showToast?.('❌ Delete failed', 'error'); }
    finally { setLoading(false); }
  };

  const handleToggleExamActive = async (exam) => {
    try { await updateDoc(doc(db, 'customExams', exam.id), { active: !exam.active }); window.showToast?.(`✅ ${!exam.active ? 'Activated' : 'Deactivated'}!`, 'success'); fetchExams(); }
    catch { window.showToast?.('❌ Failed', 'error'); }
  };

  const handleSaveCoupon = async () => {
    if (!couponForm.code.trim() || !selectedExam) return;
    try {
      const code = couponForm.code.trim().toUpperCase();
      await setDoc(doc(db, 'coupons', code), { code, examId: selectedExam.id, examName: selectedExam.name, scope: `exam_${selectedExam.id}`, discount: parseInt(couponForm.discount) || 10, type: couponForm.type, expiry: couponForm.expiry || null, usageLimit: parseInt(couponForm.usageLimit) || 100, usedCount: 0, active: true, createdAt: serverTimestamp() });
      window.showToast?.('✅ Coupon created!', 'success');
      setCouponForm({ code: '', discount: 10, type: 'percentage', expiry: '', usageLimit: 100 });
      setShowCouponForm(false); fetchCoupons(selectedExam.id);
    } catch { window.showToast?.('❌ Failed', 'error'); }
  };

  const handleDeleteCoupon = async (couponId) => {
    if (!window.confirm('Delete this coupon?')) return;
    try { await deleteDoc(doc(db, 'coupons', couponId)); window.showToast?.('✅ Deleted!', 'success'); if (selectedExam) fetchCoupons(selectedExam.id); }
    catch { window.showToast?.('❌ Failed', 'error'); }
  };

  const addSubject = () => setExamForm(p => ({ ...p, subjects: [...p.subjects, ''] }));
  const removeSubject = (idx) => setExamForm(p => ({ ...p, subjects: p.subjects.filter((_, i) => i !== idx) }));
  const updateSubject = (idx, val) => setExamForm(p => { const s = [...p.subjects]; s[idx] = val; return { ...p, subjects: s }; });

  const inp = (extra = {}) => ({ width: '100%', padding: isMobile ? '0.65rem' : '0.8rem', border: '2px solid #e2e8f0', borderRadius: '10px', fontSize: isMobile ? '0.85rem' : '0.95rem', outline: 'none', boxSizing: 'border-box', background: '#f8fafc', ...extra });
  const lbl = (text, req = false) => (<label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.85rem', fontWeight: '700', color: '#475569' }}>{text} {req && <span style={{ color: '#ef4444' }}>*</span>}</label>);
  const card = (children, extra = {}) => (<div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: isMobile ? '1rem' : '1.5rem', marginBottom: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', ...extra }}>{children}</div>);

  if (examView === 'list') {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: isMobile ? '1.3rem' : '1.6rem', fontWeight: '800', color: '#1e293b' }}>🎯 Custom Exams</h2>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#64748b' }}>Create exams for UPSC, MTS, Banking, SSC — anything you need!</p>
          </div>
          <button onClick={() => { resetExamForm(); setExamView('create'); }} style={{ padding: isMobile ? '0.6rem 1.2rem' : '0.75rem 1.5rem', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', borderRadius: '12px', color: '#fff', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
            <Plus size={18} /> Create Exam
          </button>
        </div>
        {loading ? <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>Loading...</div> :
          exams.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '5rem 2rem', background: '#fff', borderRadius: '16px', border: '2px dashed #e2e8f0' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎯</div>
              <h3 style={{ margin: '0 0 0.5rem', color: '#1e293b' }}>No custom exams yet</h3>
              <button onClick={() => { resetExamForm(); setExamView('create'); }} style={{ padding: '0.75rem 2rem', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', borderRadius: '12px', color: '#fff', fontWeight: '700', cursor: 'pointer' }}>+ Create First Exam</button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {exams.map(exam => (
                <div key={exam.id} style={{ background: '#fff', border: `2px solid ${exam.active ? '#e2e8f0' : '#fecaca'}`, borderRadius: '16px', padding: isMobile ? '1rem' : '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', opacity: exam.active ? 1 : 0.75 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
                        <h3 style={{ margin: 0, fontSize: isMobile ? '1rem' : '1.2rem', fontWeight: '800', color: '#1e293b' }}>{exam.name}</h3>
                        <span style={{ padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: '700', background: exam.active ? '#dcfce7' : '#fee2e2', color: exam.active ? '#065f46' : '#991b1b' }}>{exam.active ? '✅ Active' : '⏸ Inactive'}</span>
                        {exam.saleEnabled && <span style={{ padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: '700', background: '#fef3c7', color: '#92400e' }}>🔥 Sale</span>}
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                        <span style={{ padding: '0.2rem 0.6rem', background: '#eff6ff', color: '#1d4ed8', borderRadius: '6px', fontSize: '0.72rem', fontWeight: '600' }}>⏱ {exam.timeLimit}min</span>
                        <span style={{ padding: '0.2rem 0.6rem', background: '#f0fdf4', color: '#065f46', borderRadius: '6px', fontSize: '0.72rem', fontWeight: '600' }}>
                          {exam.saleEnabled && exam.salePrice ? <><span style={{ textDecoration: 'line-through', opacity: 0.6 }}>₹{exam.price}</span> ₹{exam.salePrice}</> : `₹${exam.price}`}
                        </span>
                        <span style={{ padding: '0.2rem 0.6rem', background: '#fff7ed', color: '#c2410c', borderRadius: '6px', fontSize: '0.72rem', fontWeight: '600' }}>📝 {exam.questionCount || 0} questions</span>
                        <span style={{ padding: '0.2rem 0.6rem', background: '#fdf4ff', color: '#7e22ce', borderRadius: '6px', fontSize: '0.72rem', fontWeight: '600' }}>Pass: {exam.passingMarks}%</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flexShrink: 0 }}>
                      <button onClick={() => { setSelectedExam(exam); fetchCoupons(exam.id); setExamView('questions'); }} style={{ padding: isMobile ? '0.45rem 0.8rem' : '0.5rem 1rem', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: '700', cursor: 'pointer', fontSize: isMobile ? '0.72rem' : '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><BookOpen size={13} /> Manage Questions</button>
                      <button onClick={() => handleEditExam(exam)} style={{ padding: isMobile ? '0.45rem 0.8rem' : '0.5rem 1rem', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '8px', color: '#d97706', fontWeight: '700', cursor: 'pointer', fontSize: isMobile ? '0.72rem' : '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Edit2 size={13} /> Edit</button>
                      <button onClick={() => handleToggleExamActive(exam)} style={{ padding: isMobile ? '0.45rem 0.8rem' : '0.5rem 1rem', background: exam.active ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', border: `1px solid ${exam.active ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`, borderRadius: '8px', color: exam.active ? '#ef4444' : '#10b981', fontWeight: '700', cursor: 'pointer', fontSize: isMobile ? '0.72rem' : '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>{exam.active ? <ToggleRight size={13} /> : <ToggleLeft size={13} />}{exam.active ? 'Deactivate' : 'Activate'}</button>
                      <button onClick={() => handleDeleteExam(exam)} style={{ padding: isMobile ? '0.45rem 0.8rem' : '0.5rem 1rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '8px', color: '#dc2626', fontWeight: '700', cursor: 'pointer', fontSize: isMobile ? '0.72rem' : '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Trash2 size={13} /> Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        }
      </div>
    );
  }

  if (examView === 'create') {
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
          <button onClick={() => { resetExamForm(); setExamView('list'); }} style={{ padding: '0.5rem 1rem', background: '#f1f5f9', border: '2px solid #e2e8f0', borderRadius: '10px', color: '#475569', fontWeight: '700', cursor: 'pointer' }}>← Back</button>
          <h2 style={{ margin: 0, fontSize: isMobile ? '1.2rem' : '1.5rem', fontWeight: '800', color: '#1e293b' }}>{editingExam ? '✏️ Edit Exam' : '🆕 Create New Exam'}</h2>
        </div>
        {card(<>
          <h3 style={{ margin: '0 0 1.25rem', fontSize: '1.1rem', fontWeight: '800', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><FileText size={18} color="#6366f1" /> Basic Information</h3>
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div>{lbl('Exam Name', true)}<input value={examForm.name} onChange={e => setExamForm(p => ({...p, name: e.target.value}))} placeholder="e.g. NEET Mock Test 2026" style={inp()} /></div>
            <div>{lbl('Description')}<textarea value={examForm.description} onChange={e => setExamForm(p => ({...p, description: e.target.value}))} rows={3} style={{ ...inp(), resize: 'vertical' }} /></div>
            <div>{lbl('Instructions')}<textarea value={examForm.instructions} onChange={e => setExamForm(p => ({...p, instructions: e.target.value}))} rows={3} placeholder="Rules and guidelines for students..." style={{ ...inp(), resize: 'vertical' }} /></div>
          </div>
        </>)}
        {card(<>
          <h3 style={{ margin: '0 0 1.25rem', fontSize: '1.1rem', fontWeight: '800', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Tag size={18} color="#8b5cf6" /> Subjects</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1rem' }}>
            {examForm.subjects.map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#6366f1', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: '800', flexShrink: 0 }}>{i + 1}</span>
                <input value={s} onChange={e => updateSubject(i, e.target.value)} placeholder={`Subject ${i + 1}`} style={{ ...inp(), margin: 0 }} />
                {examForm.subjects.length > 1 && <button onClick={() => removeSubject(i)} style={{ width: '32px', height: '32px', borderRadius: '8px', border: 'none', background: 'rgba(239,68,68,0.1)', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><X size={14} /></button>}
              </div>
            ))}
          </div>
          <button onClick={addSubject} style={{ padding: '0.6rem 1.2rem', background: 'rgba(99,102,241,0.1)', border: '2px dashed rgba(99,102,241,0.4)', borderRadius: '10px', color: '#6366f1', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Plus size={15} /> Add Subject</button>
        </>)}
        {card(<>
          <h3 style={{ margin: '0 0 1.25rem', fontSize: '1.1rem', fontWeight: '800', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Clock size={18} color="#f59e0b" /> Test Settings</h3>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr 1fr', gap: '1rem' }}>
            <div>{lbl('Time (minutes)', true)}<input type="number" min="10" value={examForm.timeLimit} onChange={e => setExamForm(p => ({...p, timeLimit: e.target.value}))} style={inp()} /></div>
            <div>{lbl('Max Questions', true)}<input type="number" min="5" value={examForm.maxQuestions} onChange={e => setExamForm(p => ({...p, maxQuestions: e.target.value}))} style={inp()} /></div>
            <div>{lbl('Passing Score (%)', true)}<input type="number" min="1" max="100" value={examForm.passingMarks} onChange={e => setExamForm(p => ({...p, passingMarks: e.target.value}))} style={inp()} /></div>
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: '600', fontSize: '0.88rem', color: '#475569' }}>
              <input type="checkbox" checked={examForm.certificateEnabled} onChange={e => setExamForm(p => ({...p, certificateEnabled: e.target.checked}))} style={{ width: '16px', height: '16px' }} />
              🏆 Certificate on Pass
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontWeight: '600', fontSize: '0.88rem', color: '#475569' }}>
              <input type="checkbox" checked={examForm.couponEnabled} onChange={e => setExamForm(p => ({...p, couponEnabled: e.target.checked}))} style={{ width: '16px', height: '16px' }} />
              🎟️ Enable Coupons
            </label>
          </div>
        </>)}
        {card(<>
          <h3 style={{ margin: '0 0 1.25rem', fontSize: '1.1rem', fontWeight: '800', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><IndianRupee size={18} color="#10b981" /> Pricing</h3>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>{lbl('Price (₹)', true)}<input type="number" min="0" value={examForm.price} onChange={e => setExamForm(p => ({...p, price: e.target.value}))} style={inp()} /></div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: '700', color: '#475569' }}>Sale Price (₹)</label>
                <button onClick={() => setExamForm(p => ({...p, saleEnabled: !p.saleEnabled}))} style={{ padding: '0.2rem 0.6rem', borderRadius: '20px', border: 'none', background: examForm.saleEnabled ? '#10b981' : '#e2e8f0', color: examForm.saleEnabled ? '#fff' : '#64748b', fontSize: '0.7rem', fontWeight: '700', cursor: 'pointer' }}>{examForm.saleEnabled ? '🔥 ON' : 'OFF'}</button>
              </div>
              <input type="number" min="0" value={examForm.salePrice} onChange={e => setExamForm(p => ({...p, salePrice: e.target.value}))} disabled={!examForm.saleEnabled} style={{ ...inp(), opacity: examForm.saleEnabled ? 1 : 0.5 }} />
            </div>
          </div>
          {examForm.saleEnabled && examForm.salePrice && examForm.price && (
            <div style={{ padding: '0.65rem', background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '8px', fontSize: '0.8rem', color: '#92400e', fontWeight: '600' }}>
              🔥 Sale: <span style={{ textDecoration: 'line-through' }}>₹{examForm.price}</span> → <strong>₹{examForm.salePrice}</strong> ({Math.round(((examForm.price - examForm.salePrice) / examForm.price) * 100)}% off)
            </div>
          )}
        </>)}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
          <button onClick={() => { resetExamForm(); setExamView('list'); }} style={{ flex: 1, padding: '1rem', background: '#f1f5f9', border: '2px solid #e2e8f0', borderRadius: '12px', color: '#475569', fontWeight: '700', cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleSaveExam} disabled={loading} style={{ flex: 2, padding: '1rem', background: loading ? '#e2e8f0' : 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', borderRadius: '12px', color: loading ? '#94a3b8' : '#fff', fontWeight: '800', cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Saving...' : editingExam ? '✅ Update Exam' : '✅ Create Exam'}
          </button>
        </div>
      </div>
    );
  }

  if (examView === 'questions' && selectedExam) {
    return <ExamQuestionsManager exam={selectedExam} isMobile={isMobile} coupons={coupons} onBack={() => { setExamView('list'); fetchExams(); }} onSaveCoupon={handleSaveCoupon} onDeleteCoupon={handleDeleteCoupon} showCouponForm={showCouponForm} setShowCouponForm={setShowCouponForm} couponForm={couponForm} setCouponForm={setCouponForm} fetchCoupons={fetchCoupons} />;
  }

  return null;
}

// ==========================================
// 📋 EXAM QUESTIONS MANAGER
// ==========================================
function ExamQuestionsManager({ exam, isMobile, coupons, onBack, onSaveCoupon, onDeleteCoupon, showCouponForm, setShowCouponForm, couponForm, setCouponForm, fetchCoupons }) {
  const [activeSection, setActiveSection] = useState('questions');
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filterSubject, setFilterSubject] = useState('all');
  const [csvError, setCsvError] = useState('');
  const [csvLoading, setCsvLoading] = useState(false);
  const [formData, setFormData] = useState({ question: '', code: '', subject: exam.subjects?.[0] || '', option1: '', option2: '', option3: '', option4: '', correct: 0 });

  useEffect(() => { fetchQuestions(); }, []); // eslint-disable-line

  // ✅ FIX: Sort by position ascending — guarantees Q1=first, Q2=second always
  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'customQuestions'), where('examId', '==', exam.id));
      const snap = await getDocs(q);
      const qs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      qs.sort((a, b) => {
        if (a.position !== undefined && b.position !== undefined) {
          return a.position - b.position;
        }
        // Fallback: ascending createdAt (oldest first)
        return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      });
      setQuestions(qs);
      await updateDoc(doc(db, 'customExams', exam.id), { questionCount: qs.length });
    } catch { window.showToast?.('Failed to load questions', 'error'); }
    finally { setLoading(false); }
  };

  const resetForm = () => { setFormData({ question: '', code: '', subject: exam.subjects?.[0] || '', option1: '', option2: '', option3: '', option4: '', correct: 0 }); setEditingId(null); };

  const handleEditQuestion = (q) => { setFormData({ question: q.question, code: q.code || '', subject: q.subject || exam.subjects?.[0] || '', option1: q.options[0] || '', option2: q.options[1] || '', option3: q.options[2] || '', option4: q.options[3] || '', correct: q.correct }); setEditingId(q.id); setShowForm(true); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  const handleSaveQuestion = async () => {
    if (questions.length >= exam.maxQuestions && !editingId) { window.showToast?.(`❌ Maximum ${exam.maxQuestions} questions allowed!`, 'error'); return; }
    if (!formData.question.trim() || !formData.option1 || !formData.option2 || !formData.option3 || !formData.option4) { window.showToast?.('Please fill in all required fields!', 'error'); return; }
    setLoading(true);
    try {
      const qData = {
        question: formData.question.trim(),
        code: formData.code.trim(),
        subject: formData.subject,
        options: [formData.option1.trim(), formData.option2.trim(), formData.option3.trim(), formData.option4.trim()],
        correct: parseInt(formData.correct),
        examId: exam.id,
        examName: exam.name
      };
      if (editingId) {
        // ✅ Edit: keep original position unchanged
        await updateDoc(doc(db, 'customQuestions', editingId), { ...qData, updatedAt: new Date().toISOString() });
        window.showToast?.('✅ Question updated!', 'success');
      } else {
        // ✅ New: assign next sequential position
        const nextPosition = questions.length + 1;
        await addDoc(collection(db, 'customQuestions'), { ...qData, position: nextPosition, createdAt: new Date().toISOString() });
        window.showToast?.('✅ Question added!', 'success');
      }
      resetForm(); setShowForm(false); fetchQuestions();
    } catch { window.showToast?.('Failed to save question', 'error'); }
    finally { setLoading(false); }
  };

  const handleDeleteQuestion = async (id) => {
    if (!window.confirm('Delete this question?')) return;
    try {
      await deleteDoc(doc(db, 'customQuestions', id));
      window.showToast?.('✅ Deleted!', 'success');
      // ✅ Re-assign positions so sequence stays clean after delete
      const remaining = questions.filter(q => q.id !== id);
      await Promise.all(remaining.map((q, idx) => updateDoc(doc(db, 'customQuestions', q.id), { position: idx + 1 })));
      setQuestions(remaining);
    }
    catch { window.showToast?.('Failed to delete', 'error'); }
  };

  const handleCSVUpload = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setCsvError(''); setCsvLoading(true);
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(l => l.trim());
      const parsed = []; const errors = [];
      lines.slice(1).forEach((line, idx) => {
        const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
        if (cols.length < 8) { errors.push(`Row ${idx + 2}: not enough columns`); return; }
        const [question, code, subject, op1, op2, op3, op4, correct] = cols;
        if (!question || !op1 || !op2 || !op3 || !op4) { errors.push(`Row ${idx + 2}: missing required fields`); return; }
        const correctIdx = parseInt(correct) - 1;
        if (isNaN(correctIdx) || correctIdx < 0 || correctIdx > 3) { errors.push(`Row ${idx + 2}: correct answer must be 1–4`); return; }
        parsed.push({ question, code: code || '', subject: subject || exam.subjects?.[0] || '', options: [op1, op2, op3, op4], correct: correctIdx, examId: exam.id, examName: exam.name, createdAt: new Date().toISOString() });
      });
      if (errors.length > 0) setCsvError(errors.slice(0, 5).join('\n'));
      if (parsed.length > 0) {
        const remaining = exam.maxQuestions - questions.length;
        const toAdd = parsed.slice(0, remaining);
        const startPosition = questions.length + 1;
        // ✅ CSV upload: each question gets correct sequential position
        await Promise.all(toAdd.map((q, idx) => addDoc(collection(db, 'customQuestions'), { ...q, position: startPosition + idx })));
        window.showToast?.(`✅ ${toAdd.length} questions uploaded!`, 'success');
        fetchQuestions();
      }
    } catch (err) { setCsvError('Upload failed: ' + err.message); }
    finally { setCsvLoading(false); e.target.value = ''; }
  };

  const filteredQs = filterSubject === 'all' ? questions : questions.filter(q => q.subject === filterSubject);
  const isAtLimit = questions.length >= exam.maxQuestions;

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <button onClick={onBack} style={{ padding: '0.5rem 1rem', background: '#f1f5f9', border: '2px solid #e2e8f0', borderRadius: '10px', color: '#475569', fontWeight: '700', cursor: 'pointer' }}>← Back</button>
        <div>
          <h2 style={{ margin: 0, fontSize: isMobile ? '1.1rem' : '1.4rem', fontWeight: '800', color: '#1e293b' }}>{exam.name}</h2>
          <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b' }}>{questions.length}/{exam.maxQuestions} questions · ₹{exam.price}{exam.saleEnabled && exam.salePrice ? ` (Sale: ₹${exam.salePrice})` : ''}</p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.25rem' }}>
        {['questions', ...(exam.couponEnabled ? ['coupons'] : [])].map(id => (
          <button key={id} onClick={() => setActiveSection(id)} style={{ padding: isMobile ? '0.5rem 0.8rem' : '0.6rem 1.2rem', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: isMobile ? '0.78rem' : '0.85rem', background: activeSection === id ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : '#f1f5f9', color: activeSection === id ? '#fff' : '#64748b' }}>
            {id === 'questions' ? '📝 Questions' : '🎟️ Coupons'}
          </button>
        ))}
      </div>

      {activeSection === 'questions' && (
        <div>
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1rem', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#64748b' }}>
              <span>Questions: <strong>{questions.length}</strong> / {exam.maxQuestions}</span>
              {isAtLimit && <span style={{ color: '#ef4444', fontWeight: '700' }}>⚠️ LIMIT REACHED</span>}
            </div>
            <div style={{ height: '8px', background: '#f1f5f9', borderRadius: '99px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.min((questions.length / exam.maxQuestions) * 100, 100)}%`, background: isAtLimit ? '#ef4444' : '#10b981' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <button onClick={() => { if (!isAtLimit) { resetForm(); setShowForm(!showForm); } }} disabled={isAtLimit} style={{ padding: '0.6rem 1.2rem', background: isAtLimit ? '#e2e8f0' : 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', borderRadius: '10px', color: isAtLimit ? '#94a3b8' : '#fff', fontWeight: '700', cursor: isAtLimit ? 'not-allowed' : 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              {showForm && !editingId ? <X size={15} /> : <Plus size={15} />}{showForm && !editingId ? 'Cancel' : 'Add Question'}
            </button>
            <label style={{ padding: '0.6rem 1.2rem', background: 'rgba(16,185,129,0.1)', border: '2px solid rgba(16,185,129,0.3)', borderRadius: '10px', color: '#10b981', fontWeight: '700', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Upload size={15} /> {csvLoading ? 'Uploading...' : 'CSV Upload'}
              <input type="file" accept=".csv" onChange={handleCSVUpload} style={{ display: 'none' }} />
            </label>
            {exam.subjects?.length > 1 && (
              <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)} style={{ padding: '0.6rem', border: '2px solid #e2e8f0', borderRadius: '10px', fontSize: '0.85rem', outline: 'none', fontWeight: '600' }}>
                <option value="all">All ({questions.length})</option>
                {exam.subjects.map(s => <option key={s} value={s}>{s} ({questions.filter(q => q.subject === s).length})</option>)}
              </select>
            )}
          </div>
          {csvError && <div style={{ padding: '0.75rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', marginBottom: '1rem', fontSize: '0.8rem', color: '#991b1b', whiteSpace: 'pre-line' }}>{csvError}</div>}

          {showForm && (
            <div style={{ background: '#fff', border: editingId ? '2px solid #f59e0b' : '2px solid #e2e8f0', borderRadius: '14px', padding: isMobile ? '1rem' : '1.5rem', marginBottom: '1.25rem' }}>
              <h3 style={{ margin: '0 0 1.25rem', fontWeight: '800', fontSize: '1rem', color: editingId ? '#d97706' : '#1e293b' }}>{editingId ? '✏️ Edit Question' : '➕ New Question'}</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.8rem', fontWeight: '700', color: '#475569' }}>Subject</label>
                  <select value={formData.subject} onChange={e => setFormData(p => ({...p, subject: e.target.value}))} style={{ width: '100%', padding: '0.7rem', border: '2px solid #e2e8f0', borderRadius: '10px', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}>
                    {exam.subjects?.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.8rem', fontWeight: '700', color: '#475569' }}>Question *</label>
                  <input value={formData.question} onChange={e => setFormData(p => ({...p, question: e.target.value}))} placeholder="Enter your question..." style={{ width: '100%', padding: '0.7rem', border: '2px solid #e2e8f0', borderRadius: '10px', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }} />
                </div>
                <div>
                  {[1,2,3,4].map(num => (
                    <div key={num} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: parseInt(formData.correct) === num - 1 ? '#10b981' : '#e2e8f0', color: parseInt(formData.correct) === num - 1 ? '#fff' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '0.75rem', flexShrink: 0 }}>{String.fromCharCode(64 + num)}</div>
                      <input value={formData[`option${num}`]} onChange={e => setFormData(p => ({...p, [`option${num}`]: e.target.value}))} placeholder={`Option ${num}`} style={{ flex: 1, padding: '0.65rem', border: parseInt(formData.correct) === num - 1 ? '2px solid #10b981' : '2px solid #e2e8f0', borderRadius: '8px', fontSize: '0.88rem', outline: 'none', background: parseInt(formData.correct) === num - 1 ? '#f0fdf4' : '#fff' }} />
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  {[0,1,2,3].map(idx => (<button key={idx} type="button" onClick={() => setFormData(p => ({...p, correct: idx}))} style={{ flex: 1, padding: '0.5rem', borderRadius: '8px', border: parseInt(formData.correct) === idx ? '2px solid #10b981' : '2px solid #e2e8f0', background: parseInt(formData.correct) === idx ? '#f0fdf4' : '#fff', color: parseInt(formData.correct) === idx ? '#10b981' : '#64748b', fontWeight: '700', cursor: 'pointer', fontSize: '0.82rem' }}>{idx + 1}</button>))}
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button onClick={() => { resetForm(); setShowForm(false); }} style={{ flex: 1, padding: '0.8rem', background: '#f1f5f9', border: '2px solid #e2e8f0', borderRadius: '10px', color: '#475569', fontWeight: '700', cursor: 'pointer' }}>Cancel</button>
                  <button onClick={handleSaveQuestion} disabled={loading} style={{ flex: 2, padding: '0.8rem', background: loading ? '#e2e8f0' : 'linear-gradient(135deg,#10b981,#059669)', border: 'none', borderRadius: '10px', color: loading ? '#94a3b8' : '#fff', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer' }}>{loading ? 'Saving...' : editingId ? '✅ Update' : '✅ Save'}</button>
                </div>
              </div>
            </div>
          )}

          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden' }}>
            {loading ? <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Loading...</div> :
              filteredQs.length === 0 ? <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}><div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📝</div>No questions yet. Add some!</div> :
              filteredQs.map((q, idx) => (
                <div key={q.id} style={{ borderBottom: idx < filteredQs.length - 1 ? '1px solid #f1f5f9' : 'none', padding: isMobile ? '0.85rem' : '1.1rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                  <div style={{ width: '26px', height: '26px', borderRadius: '8px', background: '#f1f5f9', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '0.75rem', flexShrink: 0 }}>{idx + 1}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.92rem', fontWeight: '600', color: '#1e293b', marginBottom: '0.4rem', lineHeight: 1.4 }}>{q.question}</div>
                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                      <span style={{ padding: '0.15rem 0.5rem', background: '#eff6ff', color: '#1d4ed8', borderRadius: '6px', fontSize: '0.68rem', fontWeight: '600' }}>{q.subject}</span>
                      <span style={{ padding: '0.15rem 0.5rem', background: '#f0fdf4', color: '#065f46', borderRadius: '6px', fontSize: '0.68rem', fontWeight: '600' }}>✓ {q.options?.[q.correct]}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                    <button onClick={() => handleEditQuestion(q)} style={{ width: '32px', height: '32px', borderRadius: '8px', border: 'none', background: 'rgba(245,158,11,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Edit2 size={14} color="#d97706" /></button>
                    <button onClick={() => handleDeleteQuestion(q.id)} style={{ width: '32px', height: '32px', borderRadius: '8px', border: 'none', background: 'rgba(239,68,68,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={14} color="#ef4444" /></button>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      )}

      {activeSection === 'coupons' && exam.couponEnabled && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: '#1e293b' }}>🎟️ Coupons</h3>
            <button onClick={() => setShowCouponForm(!showCouponForm)} style={{ padding: '0.55rem 1.1rem', background: 'linear-gradient(135deg,#10b981,#059669)', border: 'none', borderRadius: '10px', color: '#fff', fontWeight: '700', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Plus size={14} /> Create Coupon</button>
          </div>
          {showCouponForm && (
            <div style={{ background: '#fff', border: '2px solid rgba(16,185,129,0.3)', borderRadius: '14px', padding: '1.25rem', marginBottom: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                <div><label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.8rem', fontWeight: '700', color: '#475569' }}>Code *</label><input value={couponForm.code} onChange={e => setCouponForm(p => ({...p, code: e.target.value.toUpperCase()}))} style={{ width: '100%', padding: '0.7rem', border: '2px solid #e2e8f0', borderRadius: '10px', fontFamily: 'monospace', fontWeight: '700', outline: 'none', boxSizing: 'border-box' }} /></div>
                <div><label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.8rem', fontWeight: '700', color: '#475569' }}>Type</label><select value={couponForm.type} onChange={e => setCouponForm(p => ({...p, type: e.target.value}))} style={{ width: '100%', padding: '0.7rem', border: '2px solid #e2e8f0', borderRadius: '10px', outline: 'none', boxSizing: 'border-box' }}><option value="percentage">% Percentage</option><option value="flat">₹ Flat</option></select></div>
                <div><label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.8rem', fontWeight: '700', color: '#475569' }}>Discount</label><input type="number" min="1" value={couponForm.discount} onChange={e => setCouponForm(p => ({...p, discount: e.target.value}))} style={{ width: '100%', padding: '0.7rem', border: '2px solid #e2e8f0', borderRadius: '10px', outline: 'none', boxSizing: 'border-box' }} /></div>
                <div><label style={{ display: 'block', marginBottom: '0.3rem', fontSize: '0.8rem', fontWeight: '700', color: '#475569' }}>Usage Limit</label><input type="number" min="1" value={couponForm.usageLimit} onChange={e => setCouponForm(p => ({...p, usageLimit: e.target.value}))} style={{ width: '100%', padding: '0.7rem', border: '2px solid #e2e8f0', borderRadius: '10px', outline: 'none', boxSizing: 'border-box' }} /></div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button onClick={() => setShowCouponForm(false)} style={{ flex: 1, padding: '0.75rem', background: '#f1f5f9', border: '2px solid #e2e8f0', borderRadius: '10px', color: '#475569', fontWeight: '700', cursor: 'pointer' }}>Cancel</button>
                <button onClick={onSaveCoupon} style={{ flex: 2, padding: '0.75rem', background: 'linear-gradient(135deg,#10b981,#059669)', border: 'none', borderRadius: '10px', color: '#fff', fontWeight: '700', cursor: 'pointer' }}>✅ Create</button>
              </div>
            </div>
          )}
          {coupons.length === 0 ? <div style={{ textAlign: 'center', padding: '3rem', background: '#fff', borderRadius: '14px', border: '2px dashed #e2e8f0', color: '#94a3b8' }}>🎟️ No coupons yet.</div> :
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {coupons.map(c => (
                <div key={c.id} style={{ background: '#fff', border: '2px solid #e2e8f0', borderRadius: '12px', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
                  <div>
                    <div style={{ fontFamily: 'monospace', fontWeight: '800', fontSize: '1rem', color: '#1e293b', marginBottom: '0.2rem' }}>{c.code}</div>
                    <div style={{ fontSize: '0.78rem', color: '#64748b', display: 'flex', gap: '0.5rem' }}>
                      <span>{c.type === 'percentage' ? `${c.discount}% off` : `₹${c.discount} off`}</span>
                      <span>Used: {c.usedCount || 0}/{c.usageLimit}</span>
                    </div>
                  </div>
                  <button onClick={() => onDeleteCoupon(c.id)} style={{ padding: '0.4rem', background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: '8px', cursor: 'pointer' }}><Trash2 size={14} color="#ef4444" /></button>
                </div>
              ))}
            </div>
          }
        </div>
      )}
    </div>
  );
}

export default AdminQuestions;