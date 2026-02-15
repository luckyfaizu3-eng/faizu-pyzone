import React, { useState, useEffect } from 'react';
import { Plus, Save, Trash2, Code, X, Clock, AlertTriangle, CheckCircle, Edit2, IndianRupee } from 'lucide-react';
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
  getDoc
} from 'firebase/firestore';

const MAX_QUESTIONS = 60;

// ✅ Time limits per level (TOTAL TEST TIME)
const TIME_LIMITS = {
  basic: 60,      // 60 minutes
  advanced: 120,  // 120 minutes
  pro: 180        // 180 minutes
};

// ✅ Default prices per level (in ₹)
const DEFAULT_PRICES = {
  basic: 99,
  advanced: 199,
  pro: 299
};

const LEVEL_COLORS = {
  basic:    { bg: '#eff6ff', border: '#3b82f6', text: '#1d4ed8', badge: '#dbeafe' },
  advanced: { bg: '#fdf4ff', border: '#a855f7', text: '#7e22ce', badge: '#f3e8ff' },
  pro:      { bg: '#fff7ed', border: '#f97316', text: '#c2410c', badge: '#ffedd5' }
};

function AdminQuestions() {
  const [level, setLevel] = useState('basic');
  const [questions, setQuestions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [deletingIds, setDeletingIds] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // ✅ Price Management States
  const [showPriceSettings, setShowPriceSettings] = useState(false);
  const [prices, setPrices] = useState(DEFAULT_PRICES);
  const [savingPrices, setSavingPrices] = useState(false);

  const [formData, setFormData] = useState({
    question: '',
    code: '',
    option1: '',
    option2: '',
    option3: '',
    option4: '',
    correct: 0
  });

  useEffect(() => {
    fetchQuestions();
    fetchPrices();
    setSelectedIds([]);
    setSelectAll(false);
  }, [level]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ✅ Fetch prices from Firebase
  const fetchPrices = async () => {
    try {
      const priceDoc = await getDoc(doc(db, 'settings', 'testPrices'));
      if (priceDoc.exists()) {
        setPrices(priceDoc.data());
      } else {
        // Create default prices if not exists
        await setDoc(doc(db, 'settings', 'testPrices'), DEFAULT_PRICES);
        setPrices(DEFAULT_PRICES);
      }
    } catch (error) {
      console.error('❌ Error fetching prices:', error);
      setPrices(DEFAULT_PRICES);
    }
  };

  // ✅ Save prices to Firebase
  const handleSavePrices = async () => {
    // Validate prices
    if (prices.basic < 0 || prices.advanced < 0 || prices.pro < 0) {
      window.showToast?.('❌ Prices cannot be negative!', 'error');
      return;
    }

    if (prices.basic > 999999 || prices.advanced > 999999 || prices.pro > 999999) {
      window.showToast?.('❌ Price too high!', 'error');
      return;
    }

    setSavingPrices(true);
    try {
      await setDoc(doc(db, 'settings', 'testPrices'), prices);
      window.showToast?.('✅ Prices updated successfully!', 'success');
      setShowPriceSettings(false);
    } catch (error) {
      console.error('❌ Error saving prices:', error);
      window.showToast?.('❌ Failed to save prices', 'error');
    } finally {
      setSavingPrices(false);
    }
  };

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'manualQuestions'),
        where('level', '==', level),
        where('source', '==', 'manual')
      );
      const snapshot = await getDocs(q);
      const qs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      qs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setQuestions(qs);
    } catch (error) {
      console.error('❌ Error fetching questions:', error);
      window.showToast?.('Failed to load questions', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      question: '',
      code: '',
      option1: '',
      option2: '',
      option3: '',
      option4: '',
      correct: 0
    });
    setEditingId(null);
  };

  const handleEditQuestion = (q) => {
    setFormData({
      question: q.question,
      code: q.code,
      option1: q.options[0] || '',
      option2: q.options[1] || '',
      option3: q.options[2] || '',
      option4: q.options[3] || '',
      correct: q.correct
    });
    setEditingId(q.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveQuestion = async () => {
    if (!editingId && questions.length >= MAX_QUESTIONS) {
      window.showToast?.(`❌ Max ${MAX_QUESTIONS} questions per level!`, 'error');
      return;
    }
    if (!formData.question.trim()) { 
      window.showToast?.('Question text required', 'error'); 
      return; 
    }
    if (!formData.code.trim()) { 
      window.showToast?.('Code required', 'error'); 
      return; 
    }
    if (!formData.option1 || !formData.option2 || !formData.option3 || !formData.option4) {
      window.showToast?.('All 4 options required', 'error'); 
      return;
    }

    setLoading(true);
    try {
      const questionData = {
        question: formData.question.trim(),
        code: formData.code.trim(),
        options: [
          formData.option1.trim(),
          formData.option2.trim(),
          formData.option3.trim(),
          formData.option4.trim()
        ],
        correct: parseInt(formData.correct),
        level,
        source: 'manual'
      };

      if (editingId) {
        // Update existing question
        await updateDoc(doc(db, 'manualQuestions', editingId), {
          ...questionData,
          updatedAt: new Date().toISOString()
        });
        window.showToast?.('✅ Question updated!', 'success');
      } else {
        // Add new question
        await addDoc(collection(db, 'manualQuestions'), {
          ...questionData,
          createdAt: new Date().toISOString()
        });
        window.showToast?.('✅ Question added!', 'success');
      }

      resetForm();
      setShowForm(false);
      fetchQuestions();
    } catch (error) {
      console.error('❌ Error saving:', error);
      window.showToast?.('Failed to save', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuestion = async (id) => {
    if (!window.confirm('Delete this question?')) return;
    setDeletingIds(p => [...p, id]);
    try {
      await deleteDoc(doc(db, 'manualQuestions', id));
      window.showToast?.('✅ Deleted!', 'success');
      setQuestions(prev => prev.filter(q => q.id !== id));
      setSelectedIds(prev => prev.filter(sid => sid !== id));
    } catch (error) {
      window.showToast?.('Delete failed', 'error');
    } finally {
      setDeletingIds(p => p.filter(did => did !== id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Delete ${selectedIds.length} questions?`)) return;

    setLoading(true);
    try {
      await Promise.all(selectedIds.map(id => deleteDoc(doc(db, 'manualQuestions', id))));
      window.showToast?.(`✅ ${selectedIds.length} deleted!`, 'success');
      setQuestions(prev => prev.filter(q => !selectedIds.includes(q.id)));
      setSelectedIds([]);
      setSelectAll(false);
    } catch (error) {
      window.showToast?.('Bulk delete failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm(`⚠️ Delete ALL ${questions.length} ${level} questions?`)) return;
    setLoading(true);
    try {
      await Promise.all(questions.map(q => deleteDoc(doc(db, 'manualQuestions', q.id))));
      window.showToast?.(`✅ All deleted!`, 'success');
      setQuestions([]);
      setSelectedIds([]);
      setSelectAll(false);
    } catch (error) {
      window.showToast?.('Delete all failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedIds([]);
      setSelectAll(false);
    } else {
      setSelectedIds(filteredQuestions.map(q => q.id));
      setSelectAll(true);
    }
  };

  const handleCancelEdit = () => {
    resetForm();
    setShowForm(false);
  };

  const filteredQuestions = questions.filter(q =>
    q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    q.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const levelColor = LEVEL_COLORS[level];
  const isAtLimit = questions.length >= MAX_QUESTIONS && !editingId;
  const progressPct = Math.min((questions.length / MAX_QUESTIONS) * 100, 100);
  const testTimeLimit = TIME_LIMITS[level];

  return (
    <div style={{ 
      maxWidth: '900px', 
      margin: '0 auto', 
      fontFamily: 'system-ui',
      padding: isMobile ? '0.5rem' : '1rem'
    }}>

      {/* Header */}
      <div style={{
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: isMobile ? '12px' : '16px',
        padding: isMobile ? '1rem' : '2rem',
        marginBottom: '1rem',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
      }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '1rem', 
          flexWrap: 'wrap', 
          gap: isMobile ? '0.75rem' : '1rem' 
        }}>
          <h2 style={{ 
            margin: 0, 
            fontSize: isMobile ? '1.3rem' : '1.6rem', 
            fontWeight: '800' 
          }}>
            📝 Question Manager
          </h2>
          
          {/* Price Settings Button */}
          <button
            onClick={() => setShowPriceSettings(!showPriceSettings)}
            style={{
              padding: isMobile ? '0.5rem 1rem' : '0.65rem 1.25rem',
              borderRadius: '10px',
              border: '2px solid rgba(16,185,129,0.3)',
              background: showPriceSettings ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.1)',
              color: '#10b981',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: isMobile ? '0.8rem' : '0.9rem'
            }}
          >
            <IndianRupee size={isMobile ? 16 : 18} />
            {isMobile ? 'Prices' : (showPriceSettings ? 'Hide Prices' : 'Manage Prices')}
          </button>
        </div>

        {/* 💰 PRICE SETTINGS PANEL */}
        {showPriceSettings && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(16,185,129,0.05), rgba(5,150,105,0.05))',
            border: '2px solid rgba(16,185,129,0.2)',
            borderRadius: '12px',
            padding: isMobile ? '1rem' : '1.5rem',
            marginBottom: '1.5rem'
          }}>
            <h3 style={{
              margin: '0 0 1rem',
              fontSize: isMobile ? '1rem' : '1.2rem',
              fontWeight: '800',
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <IndianRupee size={isMobile ? 18 : 20} />
              Test Prices
            </h3>

            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: isMobile ? '0.75rem' : '1rem',
              marginBottom: '1rem'
            }}>
              {/* Basic Price */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontSize: isMobile ? '0.8rem' : '0.85rem',
                  fontWeight: '700',
                  color: LEVEL_COLORS.basic.text
                }}>
                  Basic Test Price
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute',
                    left: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#64748b',
                    fontWeight: '700',
                    fontSize: isMobile ? '0.9rem' : '1rem'
                  }}>₹</span>
                  <input
                    type="number"
                    min="0"
                    max="999999"
                    value={prices.basic}
                    onChange={(e) => setPrices({ ...prices, basic: parseInt(e.target.value) || 0 })}
                    style={{
                      width: '100%',
                      padding: isMobile ? '0.6rem 0.6rem 0.6rem 1.8rem' : '0.75rem 0.75rem 0.75rem 2rem',
                      border: `2px solid ${LEVEL_COLORS.basic.border}`,
                      borderRadius: '8px',
                      fontSize: isMobile ? '0.9rem' : '1rem',
                      fontWeight: '700',
                      outline: 'none',
                      boxSizing: 'border-box',
                      background: LEVEL_COLORS.basic.bg
                    }}
                  />
                </div>
              </div>

              {/* Advanced Price */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontSize: isMobile ? '0.8rem' : '0.85rem',
                  fontWeight: '700',
                  color: LEVEL_COLORS.advanced.text
                }}>
                  Advanced Test Price
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute',
                    left: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#64748b',
                    fontWeight: '700',
                    fontSize: isMobile ? '0.9rem' : '1rem'
                  }}>₹</span>
                  <input
                    type="number"
                    min="0"
                    max="999999"
                    value={prices.advanced}
                    onChange={(e) => setPrices({ ...prices, advanced: parseInt(e.target.value) || 0 })}
                    style={{
                      width: '100%',
                      padding: isMobile ? '0.6rem 0.6rem 0.6rem 1.8rem' : '0.75rem 0.75rem 0.75rem 2rem',
                      border: `2px solid ${LEVEL_COLORS.advanced.border}`,
                      borderRadius: '8px',
                      fontSize: isMobile ? '0.9rem' : '1rem',
                      fontWeight: '700',
                      outline: 'none',
                      boxSizing: 'border-box',
                      background: LEVEL_COLORS.advanced.bg
                    }}
                  />
                </div>
              </div>

              {/* Pro Price */}
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontSize: isMobile ? '0.8rem' : '0.85rem',
                  fontWeight: '700',
                  color: LEVEL_COLORS.pro.text
                }}>
                  Pro Test Price
                </label>
                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute',
                    left: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#64748b',
                    fontWeight: '700',
                    fontSize: isMobile ? '0.9rem' : '1rem'
                  }}>₹</span>
                  <input
                    type="number"
                    min="0"
                    max="999999"
                    value={prices.pro}
                    onChange={(e) => setPrices({ ...prices, pro: parseInt(e.target.value) || 0 })}
                    style={{
                      width: '100%',
                      padding: isMobile ? '0.6rem 0.6rem 0.6rem 1.8rem' : '0.75rem 0.75rem 0.75rem 2rem',
                      border: `2px solid ${LEVEL_COLORS.pro.border}`,
                      borderRadius: '8px',
                      fontSize: isMobile ? '0.9rem' : '1rem',
                      fontWeight: '700',
                      outline: 'none',
                      boxSizing: 'border-box',
                      background: LEVEL_COLORS.pro.bg
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSavePrices}
              disabled={savingPrices}
              style={{
                width: '100%',
                padding: isMobile ? '0.7rem' : '0.85rem',
                borderRadius: '10px',
                border: 'none',
                background: savingPrices ? '#e2e8f0' : 'linear-gradient(135deg, #10b981, #059669)',
                color: savingPrices ? '#94a3b8' : '#fff',
                fontSize: isMobile ? '0.9rem' : '1rem',
                fontWeight: '700',
                cursor: savingPrices ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              <Save size={isMobile ? 16 : 18} />
              {savingPrices ? 'Saving...' : 'Save Prices'}
            </button>

            {/* Current Prices Display */}
            <div style={{
              marginTop: '1rem',
              padding: '0.75rem',
              background: 'rgba(255,255,255,0.8)',
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'space-around',
              flexWrap: 'wrap',
              gap: '0.5rem',
              fontSize: isMobile ? '0.75rem' : '0.85rem',
              fontWeight: '600',
              color: '#64748b'
            }}>
              <span>Basic: ₹{prices.basic}</span>
              <span>•</span>
              <span>Advanced: ₹{prices.advanced}</span>
              <span>•</span>
              <span>Pro: ₹{prices.pro}</span>
            </div>
          </div>
        )}

        {/* Level Tabs */}
        <div style={{ 
          display: 'flex', 
          gap: isMobile ? '0.4rem' : '0.5rem', 
          marginBottom: '1rem', 
          flexWrap: 'wrap' 
        }}>
          {['basic', 'advanced', 'pro'].map(lvl => (
            <button 
              key={lvl} 
              onClick={() => setLevel(lvl)} 
              style={{
                padding: isMobile ? '0.5rem 0.9rem' : '0.6rem 1.2rem',
                borderRadius: '8px',
                border: level === lvl ? `2px solid ${LEVEL_COLORS[lvl].border}` : '2px solid #e2e8f0',
                background: level === lvl ? LEVEL_COLORS[lvl].bg : '#fff',
                color: level === lvl ? LEVEL_COLORS[lvl].text : '#64748b',
                fontWeight: '700',
                cursor: 'pointer',
                textTransform: 'uppercase',
                fontSize: isMobile ? '0.75rem' : '0.85rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.25rem',
                flex: isMobile ? '1' : 'auto',
                minWidth: isMobile ? '0' : 'auto'
              }}
            >
              <span>{lvl}</span>
              <span style={{ fontSize: isMobile ? '0.65rem' : '0.7rem', opacity: 0.8 }}>₹{prices[lvl]}</span>
            </button>
          ))}
        </div>

        {/* Progress */}
        <div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            marginBottom: '0.5rem',
            fontSize: isMobile ? '0.75rem' : '0.85rem'
          }}>
            <span style={{ color: '#64748b' }}>
              Questions: <strong>{questions.length}</strong> / {MAX_QUESTIONS}
            </span>
            {isAtLimit && (
              <span style={{ fontSize: isMobile ? '0.7rem' : '0.8rem', color: '#ef4444', fontWeight: '700' }}>
                ⚠️ LIMIT
              </span>
            )}
          </div>
          <div style={{ height: isMobile ? '6px' : '8px', background: '#f1f5f9', borderRadius: '99px', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${progressPct}%`,
              background: isAtLimit ? '#ef4444' : '#10b981',
              transition: 'width 0.5s'
            }} />
          </div>
        </div>

        {/* Test Time Info */}
        <div style={{
          marginTop: '1rem',
          padding: isMobile ? '0.6rem' : '0.75rem',
          background: 'rgba(99,102,241,0.1)',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: isMobile ? '0.75rem' : '0.9rem',
          color: '#6366f1',
          fontWeight: '600'
        }}>
          <Clock size={isMobile ? 14 : 16} />
          <span style={{ wordBreak: 'break-word' }}>
            {isMobile ? `${testTimeLimit}m test` : `Total Test Time: ${testTimeLimit} minutes for ${MAX_QUESTIONS} questions`}
          </span>
        </div>
      </div>

      {/* Action Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginBottom: '1rem',
        gap: isMobile ? '0.5rem' : '0.75rem',
        flexWrap: 'wrap'
      }}>
        <div style={{ display: 'flex', gap: isMobile ? '0.4rem' : '0.6rem', flexWrap: 'wrap', flex: 1 }}>
          <button 
            onClick={() => { 
              if (!isAtLimit) {
                if (showForm && !editingId) {
                  setShowForm(false);
                  resetForm();
                } else {
                  resetForm();
                  setShowForm(true);
                }
              }
            }} 
            style={{
              padding: isMobile ? '0.5rem 0.9rem' : '0.65rem 1.25rem',
              borderRadius: '10px',
              border: 'none',
              background: isAtLimit ? '#e2e8f0' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: isAtLimit ? '#94a3b8' : '#fff',
              fontWeight: '700',
              cursor: isAtLimit ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: isMobile ? '0.75rem' : '0.9rem'
            }}
          >
            {showForm && !editingId ? <X size={isMobile ? 16 : 18} /> : <Plus size={isMobile ? 16 : 18} />}
            {isMobile ? (showForm && !editingId ? 'Cancel' : (isAtLimit ? 'Limit' : 'Add')) : (showForm && !editingId ? 'Cancel' : isAtLimit ? 'Limit Reached' : 'Add Question')}
          </button>

          {selectedIds.length > 0 && (
            <button 
              onClick={handleBulkDelete} 
              style={{
                padding: isMobile ? '0.5rem 0.9rem' : '0.65rem 1.25rem',
                borderRadius: '10px',
                border: '2px solid rgba(239,68,68,0.3)',
                background: 'rgba(239,68,68,0.1)',
                color: '#ef4444',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: isMobile ? '0.75rem' : '0.9rem'
              }}
            >
              <Trash2 size={isMobile ? 14 : 16} />
              {isMobile ? `(${selectedIds.length})` : `Delete (${selectedIds.length})`}
            </button>
          )}

          {questions.length > 0 && !isMobile && (
            <button 
              onClick={handleDeleteAll} 
              style={{
                padding: '0.65rem 1.25rem',
                borderRadius: '10px',
                border: '2px solid rgba(239,68,68,0.2)',
                background: 'rgba(239,68,68,0.05)',
                color: '#dc2626',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.9rem'
              }}
            >
              <AlertTriangle size={16} />
              Delete All
            </button>
          )}
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder={isMobile ? "Search..." : "Search questions..."}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            padding: isMobile ? '0.5rem 0.8rem' : '0.65rem 1rem',
            border: '2px solid #e2e8f0',
            borderRadius: '10px',
            fontSize: isMobile ? '0.8rem' : '0.9rem',
            outline: 'none',
            minWidth: isMobile ? '120px' : '220px',
            flex: isMobile ? '1' : 'auto',
            maxWidth: isMobile ? 'none' : '300px'
          }}
        />
      </div>

      {/* Add/Edit Question Form */}
      {showForm && (
        <div style={{
          background: '#fff',
          border: editingId ? '2px solid #f59e0b' : '2px solid #e2e8f0',
          borderRadius: isMobile ? '12px' : '16px',
          padding: isMobile ? '1rem' : '2rem',
          marginBottom: '1.5rem',
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: isMobile ? '1rem' : '1.5rem',
            flexWrap: 'wrap',
            gap: '0.5rem'
          }}>
            <h3 style={{ 
              margin: 0, 
              fontSize: isMobile ? '1rem' : '1.2rem', 
              fontWeight: '700' 
            }}>
              {editingId ? (
                <span style={{ color: '#f59e0b' }}>✏️ Edit Question</span>
              ) : (
                <span>New {level.toUpperCase()} Question</span>
              )}
            </h3>
            {editingId && (
              <button
                onClick={handleCancelEdit}
                style={{
                  padding: isMobile ? '0.4rem 0.8rem' : '0.5rem 1rem',
                  borderRadius: '8px',
                  border: '2px solid #e2e8f0',
                  background: '#fff',
                  color: '#64748b',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: isMobile ? '0.75rem' : '0.85rem'
                }}
              >
                Cancel
              </button>
            )}
          </div>

          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: isMobile ? '1rem' : '1.25rem' 
          }}>
            {/* Question */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontSize: isMobile ? '0.75rem' : '0.85rem',
                fontWeight: '700',
                color: '#64748b'
              }}>
                Question Text *
              </label>
              <input
                type="text"
                placeholder="What is the output of this code?"
                value={formData.question}
                onChange={(e) => setFormData({...formData, question: e.target.value})}
                style={{
                  width: '100%',
                  padding: isMobile ? '0.7rem' : '0.85rem',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: isMobile ? '0.9rem' : '1rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Code */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontSize: isMobile ? '0.75rem' : '0.85rem',
                fontWeight: '700',
                color: '#64748b'
              }}>
                Python Code *
              </label>
              <textarea
                placeholder="x = 5&#10;y = 3&#10;print(x + y)"
                value={formData.code}
                onChange={(e) => setFormData({...formData, code: e.target.value})}
                rows={isMobile ? "5" : "6"}
                style={{
                  width: '100%',
                  padding: isMobile ? '0.8rem' : '1rem',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: isMobile ? '0.85rem' : '0.95rem',
                  fontFamily: 'monospace',
                  outline: 'none',
                  resize: 'vertical',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Options */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: isMobile ? '0.6rem' : '0.75rem',
                fontSize: isMobile ? '0.75rem' : '0.85rem',
                fontWeight: '700',
                color: '#64748b'
              }}>
                Options *
              </label>
              <div style={{ display: 'grid', gap: isMobile ? '0.6rem' : '0.75rem' }}>
                {[1, 2, 3, 4].map(num => (
                  <div key={num} style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '0.5rem' : '0.6rem' }}>
                    <div style={{
                      width: isMobile ? '26px' : '30px',
                      height: isMobile ? '26px' : '30px',
                      borderRadius: '50%',
                      background: parseInt(formData.correct) === num - 1 ? '#10b981' : '#e2e8f0',
                      color: parseInt(formData.correct) === num - 1 ? '#fff' : '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '800',
                      fontSize: isMobile ? '0.75rem' : '0.85rem',
                      flexShrink: 0
                    }}>
                      {String.fromCharCode(64 + num)}
                    </div>
                    <input
                      type="text"
                      placeholder={`Option ${num}`}
                      value={formData[`option${num}`]}
                      onChange={(e) => setFormData({...formData, [`option${num}`]: e.target.value})}
                      style={{
                        flex: 1,
                        padding: isMobile ? '0.6rem' : '0.7rem',
                        border: parseInt(formData.correct) === num - 1 ? '2px solid #10b981' : '2px solid #e2e8f0',
                        borderRadius: '8px',
                        fontSize: isMobile ? '0.85rem' : '0.95rem',
                        outline: 'none',
                        background: parseInt(formData.correct) === num - 1 ? '#f0fdf4' : '#fff'
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Correct Answer */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.6rem',
                fontSize: isMobile ? '0.75rem' : '0.85rem',
                fontWeight: '700',
                color: '#64748b'
              }}>
                <CheckCircle size={isMobile ? 12 : 14} color="#10b981" style={{ display: 'inline', marginRight: '0.3rem' }} />
                Correct Answer *
              </label>
              <div style={{ display: 'flex', gap: isMobile ? '0.4rem' : '0.6rem', flexWrap: 'wrap' }}>
                {[0,1,2,3].map(idx => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setFormData({...formData, correct: idx})}
                    style={{
                      padding: isMobile ? '0.45rem 0.9rem' : '0.55rem 1.1rem',
                      borderRadius: '8px',
                      border: parseInt(formData.correct) === idx ? '2px solid #10b981' : '2px solid #e2e8f0',
                      background: parseInt(formData.correct) === idx ? '#f0fdf4' : '#fff',
                      color: parseInt(formData.correct) === idx ? '#10b981' : '#64748b',
                      fontWeight: '700',
                      cursor: 'pointer',
                      fontSize: isMobile ? '0.75rem' : '0.9rem',
                      flex: isMobile ? '1' : 'auto',
                      minWidth: isMobile ? '0' : 'auto'
                    }}
                  >
                    {isMobile ? `${idx + 1}` : `Option ${idx + 1}`}
                  </button>
                ))}
              </div>
            </div>

            {/* Save Button */}
            <button 
              onClick={handleSaveQuestion} 
              disabled={loading || isAtLimit} 
              style={{
                padding: isMobile ? '0.85rem' : '1rem',
                borderRadius: '10px',
                border: 'none',
                background: loading || isAtLimit ? '#e2e8f0' : editingId ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'linear-gradient(135deg, #10b981, #059669)',
                color: loading || isAtLimit ? '#94a3b8' : '#fff',
                fontSize: isMobile ? '0.9rem' : '1rem',
                fontWeight: '700',
                cursor: loading || isAtLimit ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              {editingId ? <Edit2 size={isMobile ? 16 : 18} /> : <Save size={isMobile ? 16 : 18} />}
              {loading ? 'Saving...' : editingId ? 'Update' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {/* Questions List */}
      <div style={{
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: isMobile ? '12px' : '16px',
        overflow: 'hidden',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
      }}>
        <div style={{
          padding: isMobile ? '0.85rem' : '1.25rem',
          borderBottom: '2px solid #f1f5f9',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: isMobile ? '0.5rem' : '0.75rem'
        }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={selectAll}
              onChange={handleSelectAll}
              style={{ width: isMobile ? '14px' : '16px', height: isMobile ? '14px' : '16px', cursor: 'pointer' }}
            />
            <span style={{ fontSize: isMobile ? '0.75rem' : '0.85rem', fontWeight: '700', color: '#64748b' }}>
              {isMobile ? 'All' : 'Select All'}
            </span>
          </label>
          <span style={{ fontSize: isMobile ? '0.8rem' : '0.9rem', color: '#64748b', fontWeight: '600' }}>
            {filteredQuestions.length} {isMobile ? '' : 'questions'}
          </span>
        </div>

        {loading ? (
          <div style={{ 
            textAlign: 'center', 
            padding: isMobile ? '3rem' : '4rem', 
            color: '#94a3b8',
            fontSize: isMobile ? '0.9rem' : '1rem'
          }}>
            Loading...
          </div>
        ) : filteredQuestions.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: isMobile ? '3rem 1rem' : '4rem', 
            color: '#94a3b8' 
          }}>
            <div style={{ fontSize: isMobile ? '2.5rem' : '3rem', marginBottom: '0.75rem' }}>📝</div>
            <div style={{ fontSize: isMobile ? '0.85rem' : '1rem' }}>
              No questions yet. {isMobile ? 'Add one!' : 'Click "Add Question" to create one.'}
            </div>
          </div>
        ) : (
          filteredQuestions.map((q, index) => {
            const isSelected = selectedIds.includes(q.id);
            const isDeleting = deletingIds.includes(q.id);
            const isEditing = editingId === q.id;

            return (
              <div
                key={q.id}
                style={{
                  borderBottom: index < filteredQuestions.length - 1 ? '1px solid #f1f5f9' : 'none',
                  background: isEditing ? '#fffbeb' : isSelected ? '#fafbff' : '#fff',
                  borderLeft: isEditing ? '3px solid #f59e0b' : isSelected ? '3px solid #6366f1' : '3px solid transparent',
                  opacity: isDeleting ? 0.4 : 1,
                  padding: isMobile ? '0.85rem' : '1.25rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: isMobile ? '0.6rem' : '1rem'
                }}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleSelect(q.id)}
                  style={{ 
                    width: isMobile ? '14px' : '16px', 
                    height: isMobile ? '14px' : '16px', 
                    marginTop: '3px', 
                    cursor: 'pointer', 
                    flexShrink: 0 
                  }}
                />

                <div style={{
                  width: isMobile ? '24px' : '28px',
                  height: isMobile ? '24px' : '28px',
                  borderRadius: '6px',
                  background: levelColor.badge,
                  color: levelColor.text,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '800',
                  fontSize: isMobile ? '0.7rem' : '0.8rem',
                  flexShrink: 0
                }}>
                  {index + 1}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: isMobile ? '0.9rem' : '1.05rem',
                    fontWeight: '600',
                    color: '#0f172a',
                    marginBottom: '0.5rem',
                    wordBreak: 'break-word',
                    lineHeight: 1.4
                  }}>
                    {q.question}
                  </div>

                  <div style={{ display: 'flex', gap: isMobile ? '0.4rem' : '0.5rem', flexWrap: 'wrap' }}>
                    <span style={{
                      background: '#f1f5f9',
                      color: '#64748b',
                      padding: isMobile ? '0.15rem 0.5rem' : '0.2rem 0.6rem',
                      borderRadius: '6px',
                      fontSize: isMobile ? '0.65rem' : '0.75rem',
                      fontWeight: '600'
                    }}>
                      <Code size={isMobile ? 9 : 11} style={{ display: 'inline', marginRight: '0.2rem' }} />
                      {q.code.split('\n').length}L
                    </span>
                    <span style={{
                      background: '#f0fdf4',
                      color: '#10b981',
                      padding: isMobile ? '0.15rem 0.5rem' : '0.2rem 0.6rem',
                      borderRadius: '6px',
                      fontSize: isMobile ? '0.65rem' : '0.75rem',
                      fontWeight: '600',
                      maxWidth: isMobile ? '150px' : 'none',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      ✓ {q.options?.[q.correct]}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: isMobile ? '0.4rem' : '0.5rem', flexShrink: 0 }}>
                  <button
                    onClick={() => handleEditQuestion(q)}
                    disabled={isDeleting}
                    style={{
                      background: 'rgba(245,158,11,0.1)',
                      border: '1px solid rgba(245,158,11,0.2)',
                      borderRadius: '8px',
                      padding: isMobile ? '0.4rem' : '0.45rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Edit question"
                  >
                    <Edit2 size={isMobile ? 13 : 15} color="#f59e0b" />
                  </button>

                  <button
                    onClick={() => handleDeleteQuestion(q.id)}
                    disabled={isDeleting}
                    style={{
                      background: 'rgba(239,68,68,0.1)',
                      border: '1px solid rgba(239,68,68,0.2)',
                      borderRadius: '8px',
                      padding: isMobile ? '0.4rem' : '0.45rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Delete question"
                  >
                    <Trash2 size={isMobile ? 13 : 15} color="#ef4444" />
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

export default AdminQuestions;