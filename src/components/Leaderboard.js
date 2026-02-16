import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Award, Trash2, Search, Filter, Crown, CheckCircle, XCircle, Calendar, Star, Clock } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy } from 'firebase/firestore';

// ==========================================
// 🎯 CONFIGURATION
// ==========================================
const CONFIG = {
  ADMIN_EMAIL: 'luckyfaizu3@gmail.com',
  PASS_PERCENTAGE: 55,
};

// ==========================================
// 💾 STORAGE MANAGER - FIRESTORE
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
      console.log('✅ Leaderboard entry saved to Firestore:', docRef.id);
      console.log('📊 Entry details:', newEntry);
      
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error('❌ Error saving to leaderboard:', error);
      return { success: false, error: error.message };
    }
  }

  static async getAllEntries() {
    try {
      const q = query(collection(db, 'leaderboard'), orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const entries = [];
      querySnapshot.forEach((doc) => {
        entries.push({
          id: doc.id,
          ...doc.data()
        });
      });

      console.log(`✅ Loaded ${entries.length} REAL leaderboard entries from Firestore`);
      
      // ✅ NO DUMMY DATA - Only real test takers will appear
      return entries;
    } catch (error) {
      console.error('Error loading leaderboard:', error);
      return [];
    }
  }

  static async deleteEntry(id) {
    try {
      await deleteDoc(doc(db, 'leaderboard', id));
      console.log('🗑️ Entry deleted:', id);
      return { success: true };
    } catch (error) {
      console.error('❌ Error deleting entry:', error);
      return { success: false, error: error.message };
    }
  }

  static async clearAll() {
    try {
      const querySnapshot = await getDocs(collection(db, 'leaderboard'));
      const deletePromises = [];
      
      querySnapshot.forEach((document) => {
        deletePromises.push(deleteDoc(doc(db, 'leaderboard', document.id)));
      });
      
      await Promise.all(deletePromises);
      console.log('🗑️ All leaderboard data cleared from Firestore');
      return { success: true };
    } catch (error) {
      console.error('❌ Error clearing leaderboard:', error);
      return { success: false, error: error.message };
    }
  }

  static getSortedEntries(entries) {
    // Sort by percentage (highest first), then by timestamp (earliest first for same percentage)
    return entries.sort((a, b) => {
      if (b.percentage !== a.percentage) {
        return b.percentage - a.percentage;
      }
      return a.timestamp - b.timestamp;
    });
  }
}

// ==========================================
// 🎨 LEADERBOARD COMPONENT
// ==========================================
export default function Leaderboard({ userEmail }) {
  const [entries, setEntries] = useState([]);
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all', 'passed', 'failed'
  const [selectedTest, setSelectedTest] = useState('all');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  const isAdmin = userEmail === CONFIG.ADMIN_EMAIL;

  useEffect(() => {
    loadEntries();
    
    // Refresh every 5 seconds to catch new entries
    const interval = setInterval(loadEntries, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entries, searchTerm, filterType, selectedTest]);

  const loadEntries = async () => {
    const allEntries = await LeaderboardStorage.getAllEntries();
    const sorted = LeaderboardStorage.getSortedEntries(allEntries);
    setEntries(sorted);
  };

  const applyFilters = () => {
    let filtered = [...entries];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(entry => 
        entry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Pass/Fail filter
    if (filterType === 'passed') {
      filtered = filtered.filter(entry => entry.passed);
    } else if (filterType === 'failed') {
      filtered = filtered.filter(entry => !entry.passed);
    }

    // Test filter
    if (selectedTest !== 'all') {
      filtered = filtered.filter(entry => entry.testTitle === selectedTest);
    }

    setFilteredEntries(filtered);
  };

  const handleDelete = async (id) => {
    await LeaderboardStorage.deleteEntry(id);
    await loadEntries();
    setShowDeleteConfirm(null);
  };

  const handleClearAll = async () => {
    // Create beautiful custom confirmation
    const confirmationDialog = document.createElement('div');
    confirmationDialog.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.85);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 999999;
      animation: fadeIn 0.3s ease;
    `;
    
    confirmationDialog.innerHTML = `
      <div style="
        background: linear-gradient(135deg, #ffffff, #f8fafc);
        border-radius: 24px;
        padding: 2.5rem;
        max-width: 500px;
        width: 90%;
        box-shadow: 0 25px 80px rgba(0,0,0,0.3);
        border: 3px solid #ef4444;
        text-align: center;
        animation: scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
      ">
        <div style="
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, #fee2e2, #fecaca);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.5rem;
          border: 4px solid #ef4444;
          animation: shake 0.5s infinite;
        ">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="3">
            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6"/>
          </svg>
        </div>
        
        <h2 style="
          font-size: 1.8rem;
          font-weight: 900;
          color: #dc2626;
          margin: 0 0 1rem;
          letter-spacing: -0.02em;
        ">
          ⚠️ Delete All Data?
        </h2>
        
        <p style="
          font-size: 1.1rem;
          color: #64748b;
          margin: 0 0 0.5rem;
          font-weight: 600;
          line-height: 1.6;
        ">
          You are about to <strong style="color: #dc2626;">permanently delete</strong><br/>
          <strong style="color: #1e293b; font-size: 1.3rem;">${entries.length} leaderboard entries</strong>
        </p>
        
        <p style="
          font-size: 0.95rem;
          color: #94a3b8;
          margin: 0 0 2rem;
          font-weight: 600;
        ">
          This action cannot be undone!
        </p>
        
        <div style="display: flex; gap: 1rem; justify-content: center;">
          <button id="cancelBtn" style="
            padding: 0.9rem 2rem;
            background: linear-gradient(135deg, #64748b, #475569);
            color: white;
            border: none;
            border-radius: 12px;
            font-size: 1rem;
            font-weight: 800;
            cursor: pointer;
            transition: all 0.2s;
            box-shadow: 0 4px 12px rgba(100, 116, 139, 0.3);
          ">
            Cancel
          </button>
          
          <button id="confirmBtn" style="
            padding: 0.9rem 2rem;
            background: linear-gradient(135deg, #ef4444, #dc2626);
            color: white;
            border: none;
            border-radius: 12px;
            font-size: 1rem;
            font-weight: 800;
            cursor: pointer;
            transition: all 0.2s;
            box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
          ">
            🗑️ Yes, Delete All
          </button>
        </div>
      </div>
      
      <style>
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.8); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes shake {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-5deg); }
          75% { transform: rotate(5deg); }
        }
        #cancelBtn:hover { transform: scale(1.05); }
        #confirmBtn:hover { transform: scale(1.05); }
      </style>
    `;
    
    document.body.appendChild(confirmationDialog);
    
    // Handle button clicks
    const handleConfirm = async () => {
      document.body.removeChild(confirmationDialog);
      await LeaderboardStorage.clearAll();
      await loadEntries();
      
      // Success message
      const successMsg = document.createElement('div');
      successMsg.style.cssText = `
        position: fixed;
        top: 2rem;
        right: 2rem;
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
        padding: 1.25rem 2rem;
        border-radius: 16px;
        font-weight: 800;
        font-size: 1.1rem;
        box-shadow: 0 8px 24px rgba(16, 185, 129, 0.4);
        z-index: 999999;
        animation: slideIn 0.4s ease;
      `;
      successMsg.innerHTML = '✅ All data deleted successfully!';
      document.body.appendChild(successMsg);
      
      setTimeout(() => {
        successMsg.style.animation = 'slideOut 0.4s ease';
        setTimeout(() => document.body.removeChild(successMsg), 400);
      }, 3000);
    };
    
    const handleCancel = () => {
      document.body.removeChild(confirmationDialog);
    };
    
    document.getElementById('confirmBtn').onclick = handleConfirm;
    document.getElementById('cancelBtn').onclick = handleCancel;
  };

  const getRankIcon = (index) => {
    if (index === 0) return <Trophy size={32} color="#FFD700" fill="#FFD700" style={{ filter: 'drop-shadow(0 2px 4px rgba(255,215,0,0.3))' }} />;
    if (index === 1) return <Medal size={30} color="#C0C0C0" fill="#C0C0C0" style={{ filter: 'drop-shadow(0 2px 4px rgba(192,192,192,0.3))' }} />;
    if (index === 2) return <Award size={28} color="#CD7F32" fill="#CD7F32" style={{ filter: 'drop-shadow(0 2px 4px rgba(205,127,50,0.3))' }} />;
    return <Star size={20} color="#94a3b8" />;
  };

  const getRankStyle = (index) => {
    if (index === 0) return { 
      bg: '#fffef5', 
      border: '#fbbf24',
      text: '#92400e',
      shadow: '0 8px 24px rgba(251, 191, 36, 0.15)'
    };
    if (index === 1) return { 
      bg: '#fafafa', 
      border: '#94a3b8',
      text: '#475569',
      shadow: '0 8px 24px rgba(148, 163, 184, 0.12)'
    };
    if (index === 2) return { 
      bg: '#fffaf5', 
      border: '#fb923c',
      text: '#9a3412',
      shadow: '0 8px 24px rgba(251, 146, 60, 0.12)'
    };
    return { 
      bg: '#fff', 
      border: '#e2e8f0',
      text: '#64748b',
      shadow: '0 4px 12px rgba(0,0,0,0.08)'
    };
  };

  const uniqueTests = [...new Set(entries.map(e => e.testTitle))];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: window.innerWidth <= 768 ? '80px 0.75rem 2rem' : '100px 1rem 2rem',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
        {/* Header */}
        <div style={{
          background: '#fff',
          borderRadius: window.innerWidth <= 768 ? '16px' : '24px',
          padding: window.innerWidth <= 768 ? '1.5rem 1rem' : '2rem',
          marginBottom: window.innerWidth <= 768 ? '1rem' : '2rem',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          textAlign: 'center'
        }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: window.innerWidth <= 768 ? '0.5rem' : '1rem',
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            padding: window.innerWidth <= 768 ? '0.75rem 1.25rem' : '1rem 2rem',
            borderRadius: '50px',
            marginBottom: window.innerWidth <= 768 ? '0.75rem' : '1rem'
          }}>
            <Trophy size={window.innerWidth <= 768 ? 24 : 32} color="#fff" />
            <h1 style={{
              fontSize: 'clamp(1.3rem, 5vw, 2.5rem)',
              fontWeight: '900',
              color: '#fff',
              margin: 0,
              letterSpacing: '0.02em'
            }}>
              🏆 LEADERBOARD
            </h1>
          </div>

          <p style={{
            fontSize: 'clamp(1rem, 2.5vw, 1.2rem)',
            color: '#64748b',
            fontWeight: '600',
            margin: '0.5rem 0 0'
          }}>
            Top Performers Across All Tests
          </p>

          {isAdmin && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              color: '#fff',
              padding: '0.6rem 1.2rem',
              borderRadius: '12px',
              fontSize: '0.9rem',
              fontWeight: '800',
              marginTop: '1rem',
              boxShadow: '0 6px 20px rgba(16,185,129,0.4)'
            }}>
              <Crown size={18} />
              ADMIN MODE - Full Control
            </div>
          )}
        </div>

        {/* Filters & Search */}
        <div style={{
          background: '#fff',
          borderRadius: window.innerWidth <= 768 ? '16px' : '20px',
          padding: window.innerWidth <= 768 ? '1rem' : '1.5rem',
          marginBottom: window.innerWidth <= 768 ? '1rem' : '2rem',
          boxShadow: '0 12px 40px rgba(0,0,0,0.15)'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: window.innerWidth <= 768 
              ? '1fr' 
              : 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: window.innerWidth <= 768 ? '0.75rem' : '1rem',
            marginBottom: isAdmin ? '1rem' : '0'
          }}>
            {/* Search */}
            <div style={{ position: 'relative' }}>
              <Search size={20} color="#94a3b8" style={{
                position: 'absolute',
                left: '1rem',
                top: '50%',
                transform: 'translateY(-50%)'
              }} />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: window.innerWidth <= 768 ? '0.75rem 1rem 0.75rem 2.75rem' : '0.9rem 1rem 0.9rem 3rem',
                  border: '2px solid #e2e8f0',
                  borderRadius: window.innerWidth <= 768 ? '10px' : '12px',
                  fontSize: window.innerWidth <= 768 ? '0.9rem' : '0.95rem',
                  fontWeight: '600',
                  transition: 'all 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>

            {/* Filter by Pass/Fail */}
            <div style={{ position: 'relative' }}>
              <Filter size={20} color="#94a3b8" style={{
                position: 'absolute',
                left: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none'
              }} />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                style={{
                  width: '100%',
                  padding: window.innerWidth <= 768 ? '0.75rem 1rem 0.75rem 2.75rem' : '0.9rem 1rem 0.9rem 3rem',
                  border: '2px solid #e2e8f0',
                  borderRadius: window.innerWidth <= 768 ? '10px' : '12px',
                  fontSize: window.innerWidth <= 768 ? '0.9rem' : '0.95rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  background: '#fff'
                }}
              >
                <option value="all">All Results</option>
                <option value="passed">✅ Passed Only</option>
                <option value="failed">❌ Failed Only</option>
              </select>
            </div>

            {/* Filter by Test */}
            <div style={{ position: 'relative' }}>
              <Trophy size={20} color="#94a3b8" style={{
                position: 'absolute',
                left: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none'
              }} />
              <select
                value={selectedTest}
                onChange={(e) => setSelectedTest(e.target.value)}
                style={{
                  width: '100%',
                  padding: window.innerWidth <= 768 ? '0.75rem 1rem 0.75rem 2.75rem' : '0.9rem 1rem 0.9rem 3rem',
                  border: '2px solid #e2e8f0',
                  borderRadius: window.innerWidth <= 768 ? '10px' : '12px',
                  fontSize: window.innerWidth <= 768 ? '0.9rem' : '0.95rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  background: '#fff'
                }}
              >
                <option value="all">All Tests</option>
                {uniqueTests.map((test, idx) => (
                  <option key={idx} value={test}>{test}</option>
                ))}
                {/* Add Pro test if not in database yet */}
                {!uniqueTests.includes('Pro Python Test') && (
                  <option value="Pro Python Test">Pro Python Test</option>
                )}
              </select>
            </div>
          </div>

          {/* Admin Controls */}
          {isAdmin && (
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: '1rem',
              borderTop: '2px solid #e2e8f0',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <div style={{
                fontSize: '0.9rem',
                color: '#64748b',
                fontWeight: '700'
              }}>
                📊 Total Entries: <span style={{ color: '#667eea', fontSize: '1.1rem', fontWeight: '900' }}>
                  {filteredEntries.length}
                </span> / {entries.length}
              </div>

              <button
                onClick={handleClearAll}
                style={{
                  padding: '0.7rem 1.5rem',
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: '800',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 12px rgba(239,68,68,0.3)',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
              >
                <Trash2 size={16} />
                Clear All Data
              </button>
            </div>
          )}
        </div>

        {/* Leaderboard Entries */}
        {filteredEntries.length === 0 ? (
          <div style={{
            background: '#fff',
            borderRadius: '20px',
            padding: '4rem 2rem',
            textAlign: 'center',
            boxShadow: '0 12px 40px rgba(0,0,0,0.15)'
          }}>
            <Trophy size={80} color="#cbd5e1" style={{ marginBottom: '1rem' }} />
            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: '800',
              color: '#64748b',
              margin: '0 0 0.5rem'
            }}>
              No Entries Found
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '1rem', margin: 0 }}>
              {searchTerm || filterType !== 'all' || selectedTest !== 'all'
                ? 'Try adjusting your filters'
                : 'Complete a test to appear on the leaderboard!'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {filteredEntries.map((entry, index) => {
              const rankStyle = getRankStyle(index);
              const isTopThree = index < 3;

              return (
                <div key={entry.id} style={{
                  background: rankStyle.bg,
                  border: `3px solid ${rankStyle.border}`,
                  borderRadius: window.innerWidth <= 768 ? '16px' : '20px',
                  padding: window.innerWidth <= 768 ? '1.25rem' : '1.75rem',
                  boxShadow: rankStyle.shadow,
                  transition: 'all 0.3s',
                  position: 'relative',
                  animation: `slideIn 0.4s ease ${index * 0.05}s backwards`
                }}>
                  {/* Delete Confirmation Overlay */}
                  {showDeleteConfirm === entry.id && (
                    <div style={{
                      position: 'absolute',
                      inset: 0,
                      background: 'rgba(0,0,0,0.95)',
                      borderRadius: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '1rem',
                      zIndex: 10,
                      padding: '2rem'
                    }}>
                      <div style={{ color: '#fff', fontSize: '1.2rem', fontWeight: '800', textAlign: 'center' }}>
                        Delete this entry?
                      </div>
                      <div style={{ display: 'flex', gap: '1rem' }}>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          style={{
                            padding: '0.7rem 1.5rem',
                            background: '#ef4444',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '10px',
                            fontWeight: '800',
                            cursor: 'pointer'
                          }}
                        >
                          Yes, Delete
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(null)}
                          style={{
                            padding: '0.7rem 1.5rem',
                            background: '#64748b',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '10px',
                            fontWeight: '800',
                            cursor: 'pointer'
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: window.innerWidth <= 768 
                      ? '1fr' 
                      : (isAdmin ? 'auto 1fr auto auto' : 'auto 1fr auto'),
                    gap: window.innerWidth <= 768 ? '1rem' : '1.5rem',
                    alignItems: 'center',
                    textAlign: window.innerWidth <= 768 ? 'center' : 'left'
                  }}>
                    {/* Rank */}
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.5rem',
                      position: 'relative'
                    }}>
                      {getRankIcon(index)}
                      <div style={{
                        fontSize: isTopThree ? '1.5rem' : '1.1rem',
                        fontWeight: '900',
                        color: rankStyle.text
                      }}>
                        #{index + 1}
                      </div>
                      {/* Simple badge for top 3 */}
                      {isTopThree && (
                        <div style={{
                          fontSize: '0.65rem',
                          fontWeight: '800',
                          textTransform: 'uppercase',
                          color: rankStyle.text,
                          opacity: 0.7,
                          letterSpacing: '0.05em'
                        }}>
                          {index === 0 ? 'CHAMPION' : index === 1 ? 'RUNNER-UP' : '3RD PLACE'}
                        </div>
                      )}
                    </div>

                    {/* Student Info */}
                    <div>
                      <div style={{
                        fontSize: isTopThree ? 'clamp(1.4rem, 3.5vw, 1.8rem)' : 'clamp(1.2rem, 3vw, 1.5rem)',
                        fontWeight: '800',
                        color: '#1e293b',
                        marginBottom: '0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        flexWrap: 'wrap'
                      }}>
                        {entry.name}
                        
                        {entry.passed ? (
                          <span style={{
                            background: 'linear-gradient(135deg, #10b981, #059669)',
                            color: '#fff',
                            padding: '0.35rem 0.9rem',
                            borderRadius: '8px',
                            fontSize: '0.75rem',
                            fontWeight: '800',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem',
                            boxShadow: '0 2px 8px rgba(16, 185, 129, 0.2)'
                          }}>
                            <CheckCircle size={14} />
                            PASSED
                          </span>
                        ) : (
                          <span style={{
                            background: '#fee2e2',
                            color: '#991b1b',
                            padding: '0.3rem 0.8rem',
                            borderRadius: '8px',
                            fontSize: '0.75rem',
                            fontWeight: '800',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.3rem'
                          }}>
                            <XCircle size={14} />
                            FAILED
                          </span>
                        )}
                        {entry.penalized && (
                          <span style={{
                            background: '#fef3c7',
                            color: '#92400e',
                            padding: '0.3rem 0.8rem',
                            borderRadius: '8px',
                            fontSize: '0.75rem',
                            fontWeight: '800'
                          }}>
                            ⚠️ PENALIZED
                          </span>
                        )}
                      </div>

                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: '1rem',
                        fontSize: '0.9rem',
                        color: '#64748b',
                        fontWeight: '600',
                        justifyContent: window.innerWidth <= 768 ? 'center' : 'flex-start'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Trophy size={16} />
                          {entry.testTitle}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Calendar size={16} />
                          {entry.date}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <Clock size={16} />
                          {entry.timeTaken}
                        </div>
                      </div>
                    </div>

                    {/* Score */}
                    <div style={{
                      textAlign: 'center',
                      background: entry.passed 
                        ? 'linear-gradient(135deg, #10b981, #059669)'
                        : 'linear-gradient(135deg, #ef4444, #dc2626)',
                      color: '#fff',
                      padding: isTopThree ? '1.25rem 1.75rem' : '1rem 1.5rem',
                      borderRadius: '16px',
                      boxShadow: entry.passed
                        ? '0 6px 20px rgba(16,185,129,0.25)'
                        : '0 6px 20px rgba(239,68,68,0.25)',
                      minWidth: '120px',
                      margin: window.innerWidth <= 768 ? '0 auto' : '0'
                    }}>
                      <div style={{
                        fontSize: isTopThree ? '2.8rem' : '2.5rem',
                        fontWeight: '900',
                        lineHeight: 1,
                        textShadow: '0 2px 8px rgba(0,0,0,0.15)'
                      }}>
                        {entry.percentage}%
                      </div>
                      <div style={{
                        fontSize: '0.9rem',
                        fontWeight: '700',
                        marginTop: '0.5rem',
                        opacity: 0.95
                      }}>
                        {entry.score}
                      </div>
                    </div>

                    {/* Admin Delete Button */}
                    {isAdmin && (
                      <button
                        onClick={() => setShowDeleteConfirm(entry.id)}
                        style={{
                          padding: '0.8rem',
                          background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 4px 12px rgba(239,68,68,0.3)',
                          transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
                        onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                      >
                        <Trash2 size={20} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer Stats */}
        {entries.length > 0 && (
          <div style={{
            background: '#fff',
            borderRadius: window.innerWidth <= 768 ? '16px' : '20px',
            padding: window.innerWidth <= 768 ? '1.25rem 1rem' : '2rem',
            marginTop: window.innerWidth <= 768 ? '1rem' : '2rem',
            boxShadow: '0 12px 40px rgba(0,0,0,0.15)'
          }}>
            <h3 style={{
              fontSize: window.innerWidth <= 768 ? '1.1rem' : '1.3rem',
              fontWeight: '800',
              color: '#1e293b',
              marginBottom: window.innerWidth <= 768 ? '1rem' : '1.5rem',
              textAlign: 'center'
            }}>
              📊 Overall Statistics
            </h3>

            <div style={{
              display: 'grid',
              gridTemplateColumns: window.innerWidth <= 768 
                ? 'repeat(2, 1fr)' 
                : 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: window.innerWidth <= 768 ? '0.75rem' : '1.5rem'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                padding: window.innerWidth <= 768 ? '1rem' : '1.5rem',
                borderRadius: window.innerWidth <= 768 ? '12px' : '16px',
                textAlign: 'center',
                color: '#fff'
              }}>
                <div style={{ fontSize: window.innerWidth <= 768 ? '2rem' : '2.5rem', fontWeight: '900' }}>{entries.length}</div>
                <div style={{ fontSize: window.innerWidth <= 768 ? '0.75rem' : '0.9rem', fontWeight: '700', opacity: 0.9 }}>Total Attempts</div>
              </div>

              <div style={{
                background: 'linear-gradient(135deg, #10b981, #059669)',
                padding: window.innerWidth <= 768 ? '1rem' : '1.5rem',
                borderRadius: window.innerWidth <= 768 ? '12px' : '16px',
                textAlign: 'center',
                color: '#fff'
              }}>
                <div style={{ fontSize: window.innerWidth <= 768 ? '2rem' : '2.5rem', fontWeight: '900' }}>
                  {entries.filter(e => e.passed).length}
                </div>
                <div style={{ fontSize: window.innerWidth <= 768 ? '0.75rem' : '0.9rem', fontWeight: '700', opacity: 0.9 }}>Passed</div>
              </div>

              <div style={{
                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                padding: window.innerWidth <= 768 ? '1rem' : '1.5rem',
                borderRadius: window.innerWidth <= 768 ? '12px' : '16px',
                textAlign: 'center',
                color: '#fff'
              }}>
                <div style={{ fontSize: window.innerWidth <= 768 ? '2rem' : '2.5rem', fontWeight: '900' }}>
                  {entries.filter(e => !e.passed).length}
                </div>
                <div style={{ fontSize: window.innerWidth <= 768 ? '0.75rem' : '0.9rem', fontWeight: '700', opacity: 0.9 }}>Failed</div>
              </div>

              <div style={{
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                padding: window.innerWidth <= 768 ? '1rem' : '1.5rem',
                borderRadius: window.innerWidth <= 768 ? '12px' : '16px',
                textAlign: 'center',
                color: '#fff'
              }}>
                <div style={{ fontSize: window.innerWidth <= 768 ? '2rem' : '2.5rem', fontWeight: '900' }}>
                  {entries.length > 0 
                    ? Math.round(entries.reduce((sum, e) => sum + e.percentage, 0) / entries.length)
                    : 0}%
                </div>
                <div style={{ fontSize: window.innerWidth <= 768 ? '0.75rem' : '0.9rem', fontWeight: '700', opacity: 0.9 }}>Average Score</div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @media (max-width: 768px) {
          div[style*="grid"][style*="auto 1fr auto"] {
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            text-align: center !important;
            gap: 1.5rem !important;
          }
          
          div[style*="grid"][style*="auto 1fr auto auto"] {
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            text-align: center !important;
            gap: 1.5rem !important;
          }
          
          div[style*="fontSize: clamp(1.2rem"] {
            width: 100% !important;
          }
          
          div[style*="textAlign: center"][style*="minWidth: 120px"] {
            width: 100% !important;
            max-width: 220px !important;
          }
        }
      `}</style>
    </div>
  );
}

// ==========================================
// 📤 EXPORT STORAGE MANAGER FOR USE IN OTHER COMPONENTS
// ==========================================
export { LeaderboardStorage };