import React, { useState, useEffect } from 'react';
import { useAuth, useTheme, RAZORPAY_KEY_ID } from '../App';
import { Clock, Trophy, Award, Zap, Loader, Download, Calendar, CheckCircle, XCircle, AlertCircle, Monitor, Smartphone } from 'lucide-react';
import { SUBSCRIPTION_PLANS } from '../data/subscriptionPlans';
import MockTestInterface from '../components/MockTestInterface';
import UserDetailsForm from '../components/UserDetailsForm';
import CertificateViewer from '../components/CertificateViewer';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import {
  getManualQuestions,
  canUserTakeTest,
  hasCertificateForLevel,
  saveTestResult,
  issueCertificate,
  getCertificate,
  getAllCertificates,
  getTestHistory,
  getUserDetails,
  saveUserDetails,
  processMockTestPayment,
  hasUserPaidForLevel
} from '../services/mockTestService';

// ==========================================
// 🔓 ADMIN CHECK FUNCTION
// ==========================================
const isAdmin = (email) => {
  return email === 'luckyfaizu3@gmail.com';
};

// ==========================================
// 💰 DEFAULT PRICES (Fallback)
// ==========================================
const DEFAULT_PRICES = {
  basic: 99,
  advanced: 199,
  pro: 299
};

function MockTestPage() {
  const { user } = useAuth();
  const { isDark } = useTheme();

  // ✅ Test Flow States
  const [currentStep, setCurrentStep] = useState('plans'); // plans → payment → form → test → results
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [testQuestions, setTestQuestions] = useState([]);
  const [loading, setLoading] = useState(false);

  // ✅ Desktop Warning Modal (removed - now permanent banner)

  // ✅ Dynamic Prices from Firebase
  const [prices, setPrices] = useState(DEFAULT_PRICES);

  // ✅ User Data
  const [userDetails, setUserDetails] = useState(null);
  const [userCertificates, setUserCertificates] = useState([]);
  const [testHistory, setTestHistory] = useState([]);
  const [selectedCertificate, setSelectedCertificate] = useState(null);

  // ✅ Test Results
  const [testResults, setTestResults] = useState(null);

  // ✅ Restrictions
  const [testRestrictions, setTestRestrictions] = useState({});
  const [paymentStatus, setPaymentStatus] = useState({});

  // ==========================================
  // 🔄 Load User Data on Mount
  // ==========================================
  useEffect(() => {
    if (user) {
      loadUserData();
    }
    // Load prices on mount (even without user)
    fetchPrices();
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  // Show desktop warning on first visit
  useEffect(() => {
    // Desktop warning now shown as permanent banner
  }, []);

  // ==========================================
  // 💰 Fetch Prices from Firebase
  // ==========================================
  const fetchPrices = async () => {
    try {
      const priceDoc = await getDoc(doc(db, 'settings', 'testPrices'));
      if (priceDoc.exists()) {
        setPrices(priceDoc.data());
      } else {
        // Use default prices if not set
        setPrices(DEFAULT_PRICES);
      }
    } catch (error) {
      console.error('❌ Error fetching prices:', error);
      // Fallback to default prices on error
      setPrices(DEFAULT_PRICES);
    }
  };

  const loadUserData = async () => {
    setLoading(true);
    try {
      // Load user details
      const detailsResult = await getUserDetails(user.uid);
      if (detailsResult.success) {
        setUserDetails(detailsResult.details);
      }

      // Load certificates
      const certsResult = await getAllCertificates(user.uid);
      if (certsResult.success) {
        setUserCertificates(certsResult.certificates);
      }

      // Load test history
      const historyResult = await getTestHistory(user.uid);
      if (historyResult.success) {
        setTestHistory(historyResult.tests);
      }

      // Check restrictions and payments for each level
      const restrictions = {};
      const payments = {};

      for (const level of ['basic', 'advanced', 'pro']) {
        const canTake = await canUserTakeTest(user.uid, level);
        restrictions[level] = canTake;

        const hasPaid = await hasUserPaidForLevel(user.uid, level);
        payments[level] = hasPaid;
      }

      setTestRestrictions(restrictions);
      setPaymentStatus(payments);

    } catch (error) {
      console.error('❌ Error loading user data:', error);
      window.showToast?.('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // 💳 Payment Handler
  // ==========================================
  const handlePayment = (plan) => {
    if (!user) {
      window.showToast?.('⚠️ Please login first!', 'warning');
      return;
    }

    if (!window.Razorpay) {
      window.showToast?.('⚠️ Payment system loading... Please wait!', 'warning');
      return;
    }

    // Get dynamic price from Firebase
    const dynamicPrice = prices[plan.level] || plan.price;

    const options = {
      key: RAZORPAY_KEY_ID,
      amount: dynamicPrice * 100, // Convert to paise
      currency: "INR",
      name: "FaizUpyZone",
      description: `${plan.name} - Mock Test`,
      image: "https://img.icons8.com/fluency/96/000000/python.png",
      handler: async function (response) {
        window.showToast?.('✅ Payment Successful!', 'success');
        
        // Save payment to database
        const paymentData = {
          level: plan.level,
          amount: dynamicPrice,
          paymentId: response.razorpay_payment_id
        };

        const result = await processMockTestPayment(user.uid, plan.id, paymentData);
        
        if (result.success) {
          // Reload payment status
          const hasPaid = await hasUserPaidForLevel(user.uid, plan.level);
          setPaymentStatus(prev => ({ ...prev, [plan.level]: hasPaid }));
          
          // Move to form step
          setSelectedPlan(plan);
          setCurrentStep('form');
        } else {
          window.showToast?.('❌ Payment recording failed', 'error');
        }
      },
      prefill: {
        name: user?.displayName || user?.email?.split('@')[0] || "Student",
        email: user?.email || "",
      },
      theme: {
        color: isDark ? "#8b5cf6" : "#6366f1"
      },
      modal: {
        ondismiss: function() {
          window.showToast?.('❌ Payment cancelled', 'info');
        }
      }
    };

    try {
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        window.showToast?.('❌ Payment Failed!', 'error');
      });
      rzp.open();
    } catch (error) {
      console.error('❌ Error opening Razorpay:', error);
      window.showToast?.('❌ Failed to open payment', 'error');
    }
  };

  // ==========================================
  // 📝 Form Submit Handler
  // ==========================================
  const handleFormSubmit = async (formData) => {
    setLoading(true);
    try {
      const result = await saveUserDetails(user.uid, formData);
      
      if (result.success) {
        setUserDetails(formData);
        window.showToast?.('✅ Details saved!', 'success');
        
        // Start test
        await startTest(selectedPlan);
      } else {
        window.showToast?.('❌ Failed to save details', 'error');
      }
    } catch (error) {
      console.error('❌ Error saving details:', error);
      window.showToast?.('❌ Error occurred', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // 🎯 Start Test
  // ==========================================
  const startTest = async (plan) => {
    setLoading(true);
    window.showToast?.('⏳ Loading questions...', 'info');

    try {
      const result = await getManualQuestions(plan.level);
      
      if (result.success && result.questions.length > 0) {
        setTestQuestions(result.questions);
        setCurrentStep('test');
        window.showToast?.(`✅ ${result.questions.length} questions loaded!`, 'success');
      } else {
        window.showToast?.(
          result.error || '⚠️ No questions available for this level. Admin please add questions first!', 
          'warning'
        );
        setCurrentStep('plans');
        setSelectedPlan(null);
      }
    } catch (error) {
      console.error('❌ Error loading questions:', error);
      window.showToast?.('❌ Failed to load questions', 'error');
      setCurrentStep('plans');
      setSelectedPlan(null);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // ✅ Test Complete Handler
  // ==========================================
  const handleTestComplete = async (results) => {
    setLoading(true);
    
    try {
      // Save test result
      const testData = {
        planId: selectedPlan.id,
        planName: selectedPlan.name,
        level: selectedPlan.level,
        score: results.percentage,
        correct: results.correct,
        wrong: results.wrong,
        total: results.total,
        passed: results.percentage >= 70,
        timeTaken: results.timeTaken
      };

      await saveTestResult(user.uid, testData);

      // 🔓 Admin always gets certificate (any score)
      const shouldIssueCert = isAdmin(user.email) || results.percentage >= 55;

      if (shouldIssueCert) {
        const certCheck = await hasCertificateForLevel(user.uid, selectedPlan.level);
        
        // 🔓 Admin can get unlimited certificates
        if (!certCheck.hasCertificate || isAdmin(user.email)) {
          const certificateData = {
            userName: userDetails?.fullName || user.displayName || user.email,
            userAge: userDetails?.age || 'N/A',
            userAddress: userDetails?.address || 'N/A',
            userEmail: userDetails?.email || user.email,
            testName: selectedPlan.name,
            level: selectedPlan.level,
            score: results.percentage,
            date: new Date().toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'long',
              year: 'numeric'
            }),
            founderName: 'Faizan Tariq'
          };

          const certResult = await issueCertificate(user.uid, certificateData);
          
          if (certResult.success) {
            window.showToast?.(
              isAdmin(user.email) 
                ? '🔓 Admin Certificate issued!' 
                : '🎉 Certificate issued!', 
              'success'
            );
            setUserCertificates(prev => [...prev, certResult.certificate]);
          } else if (certResult.alreadyExists && !isAdmin(user.email)) {
            window.showToast?.('ℹ️ Certificate already issued for this level', 'info');
          }
        } else {
          window.showToast?.('ℹ️ You already have a certificate for this level', 'info');
        }
      } else {
        window.showToast?.('💪 Score 55% to get certificate!', 'info');
      }

      // Show results
      setTestResults(results);
      setCurrentStep('results');
      
      // Reload data
      await loadUserData();

    } catch (error) {
      console.error('❌ Error processing test completion:', error);
      window.showToast?.('❌ Error saving results', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // 🚫 Exit Test Handler
  // ==========================================
  const handleExitTest = () => {
    if (window.confirm('⚠️ Are you sure? Your progress will be lost!')) {
      setCurrentStep('plans');
      setTestQuestions([]);
      setSelectedPlan(null);
    }
  };

  // ==========================================
  // 🏠 Back to Plans
  // ==========================================
  const backToPlans = () => {
    setCurrentStep('plans');
    setSelectedPlan(null);
    setTestQuestions([]);
    setTestResults(null);
  };

  // ==========================================
  // 🎯 Select Plan Handler
  // ==========================================
  const handleSelectPlan = async (plan) => {
    if (!user) {
      window.showToast?.('⚠️ Please login first!', 'warning');
      return;
    }

    setSelectedPlan(plan);

    // 🔓 ADMIN BYPASS - Free access for admin
    if (isAdmin(user.email)) {
      window.showToast?.('🔓 Admin access - Free test!', 'success');
      
      // Check if user details exist
      if (!userDetails) {
        setCurrentStep('form');
        return;
      }

      // Start test directly
      await startTest(plan);
      return;
    }

    // Check if already paid
    const hasPaid = paymentStatus[plan.level];
    
    if (!hasPaid?.hasPaid) {
      // Need to pay
      handlePayment(plan);
      return;
    }

    // Check if can take test
    const canTake = testRestrictions[plan.level];
    
    if (!canTake?.canTake) {
      window.showToast?.(canTake?.message || '⚠️ Cannot take test now', 'warning');
      return;
    }

    // Check if user details exist
    if (!userDetails) {
      setCurrentStep('form');
      return;
    }

    // Start test directly
    await startTest(plan);
  };

  // ==========================================
  // 📜 View Certificate
  // ==========================================
  const viewCertificate = async (level) => {
    const result = await getCertificate(user.uid, level);
    if (result.success) {
      setSelectedCertificate(result.certificate);
    } else {
      window.showToast?.('❌ Certificate not found', 'error');
    }
  };

  // ==========================================
  // 📱 Calculate Days Remaining
  // ==========================================
  const getDaysRemaining = (restriction) => {
    if (!restriction?.nextAvailable) return 0;
    const now = new Date();
    const next = new Date(restriction.nextAvailable);
    const diff = next - now;
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  // ==========================================
  // 🎨 RENDER COMPONENTS
  // ==========================================

  // Loading State
  if (loading && currentStep === 'plans') {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: '80px',
        padding: '1rem'
      }}>
        <div style={{ textAlign: 'center' }}>
          <Loader className="spin" size={48} color="#6366f1" />
          <p style={{ marginTop: '16px', color: isDark ? '#94a3b8' : '#64748b' }}>
            Loading...
          </p>
        </div>
      </div>
    );
  }

  // Test Interface
  if (currentStep === 'test' && testQuestions.length > 0) {
    return (
      <MockTestInterface
        questions={testQuestions}
        onComplete={handleTestComplete}
        onExit={handleExitTest}
        testTitle={selectedPlan?.name}
        timeLimit={selectedPlan?.timeLimit}
      />
    );
  }

  // User Details Form
  if (currentStep === 'form') {
    return (
      <UserDetailsForm
        onSubmit={handleFormSubmit}
        onCancel={backToPlans}
      />
    );
  }

  // Test Results
  if (currentStep === 'results' && testResults) {
    return (
      <div style={{
        minHeight: '100vh',
        background: isDark
          ? 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)'
          : 'linear-gradient(135deg, #f0f4ff 0%, #fdf2f8 100%)',
        paddingTop: '100px',
        paddingBottom: '3rem',
        padding: '100px 1rem 3rem'
      }}>
        <div style={{
          maxWidth: '800px',
          margin: '0 auto'
        }}>
          {/* Results Card */}
          <div style={{
            background: isDark ? '#1e293b' : '#fff',
            borderRadius: '24px',
            padding: 'clamp(1.5rem, 5vw, 3rem)',
            textAlign: 'center',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
            marginBottom: '2rem'
          }}>
            {/* Pass/Fail Icon */}
            <div style={{
              width: 'clamp(80px, 20vw, 120px)',
              height: 'clamp(80px, 20vw, 120px)',
              margin: '0 auto 1.5rem',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: testResults.percentage >= 55
                ? 'linear-gradient(135deg, #10b981, #059669)'
                : 'linear-gradient(135deg, #ef4444, #dc2626)',
              boxShadow: testResults.percentage >= 55
                ? '0 8px 24px rgba(16,185,129,0.4)'
                : '0 8px 24px rgba(239,68,68,0.4)'
            }}>
              {testResults.percentage >= 55 ? (
                <CheckCircle size={window.innerWidth < 768 ? 40 : 60} color="#fff" />
              ) : (
                <XCircle size={window.innerWidth < 768 ? 40 : 60} color="#fff" />
              )}
            </div>

            {/* Title */}
            <h1 style={{
              fontSize: 'clamp(1.5rem, 5vw, 2.5rem)',
              fontWeight: '900',
              marginBottom: '0.5rem',
              color: testResults.percentage >= 55 ? '#10b981' : '#ef4444'
            }}>
              {testResults.percentage >= 55 ? '🎉 Congratulations!' : '💪 Keep Trying!'}
            </h1>

            <p style={{
              fontSize: 'clamp(0.9rem, 3vw, 1.2rem)',
              color: isDark ? '#94a3b8' : '#64748b',
              marginBottom: '2rem'
            }}>
              {testResults.percentage >= 55
                ? 'You passed the test!'
                : 'You need 55% to pass'}
            </p>

            {/* Score */}
            <div style={{
              display: 'inline-block',
              padding: 'clamp(1rem, 3vw, 1.5rem) clamp(2rem, 5vw, 3rem)',
              background: testResults.percentage >= 55
                ? 'rgba(16,185,129,0.1)'
                : 'rgba(239,68,68,0.1)',
              borderRadius: '16px',
              marginBottom: '2rem'
            }}>
              <div style={{
                fontSize: 'clamp(2.5rem, 8vw, 4rem)',
                fontWeight: '900',
                color: testResults.percentage >= 55 ? '#10b981' : '#ef4444'
              }}>
                {testResults.percentage}%
              </div>
              <div style={{
                fontSize: 'clamp(0.75rem, 2vw, 0.9rem)',
                color: isDark ? '#94a3b8' : '#64748b',
                fontWeight: '600'
              }}>
                Your Score
              </div>
            </div>

            {/* Stats */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 'clamp(0.75rem, 2vw, 1.5rem)',
              marginBottom: '2rem'
            }}>
              <div style={{
                padding: 'clamp(1rem, 3vw, 1.5rem)',
                background: isDark ? 'rgba(99,102,241,0.1)' : 'rgba(99,102,241,0.05)',
                borderRadius: '16px'
              }}>
                <div style={{
                  fontSize: 'clamp(1.5rem, 4vw, 2rem)',
                  fontWeight: '900',
                  color: '#6366f1',
                  marginBottom: '0.5rem'
                }}>
                  {testResults.correct}
                </div>
                <div style={{
                  fontSize: 'clamp(0.7rem, 2vw, 0.85rem)',
                  color: isDark ? '#94a3b8' : '#64748b',
                  fontWeight: '600'
                }}>
                  Correct
                </div>
              </div>

              <div style={{
                padding: 'clamp(1rem, 3vw, 1.5rem)',
                background: isDark ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.05)',
                borderRadius: '16px'
              }}>
                <div style={{
                  fontSize: 'clamp(1.5rem, 4vw, 2rem)',
                  fontWeight: '900',
                  color: '#ef4444',
                  marginBottom: '0.5rem'
                }}>
                  {testResults.wrong}
                </div>
                <div style={{
                  fontSize: 'clamp(0.7rem, 2vw, 0.85rem)',
                  color: isDark ? '#94a3b8' : '#64748b',
                  fontWeight: '600'
                }}>
                  Wrong
                </div>
              </div>

              <div style={{
                padding: 'clamp(1rem, 3vw, 1.5rem)',
                background: isDark ? 'rgba(16,185,129,0.1)' : 'rgba(16,185,129,0.05)',
                borderRadius: '16px'
              }}>
                <div style={{
                  fontSize: 'clamp(1.5rem, 4vw, 2rem)',
                  fontWeight: '900',
                  color: '#10b981',
                  marginBottom: '0.5rem'
                }}>
                  {testResults.total}
                </div>
                <div style={{
                  fontSize: 'clamp(0.7rem, 2vw, 0.85rem)',
                  color: isDark ? '#94a3b8' : '#64748b',
                  fontWeight: '600'
                }}>
                  Total
                </div>
              </div>
            </div>

            {/* Certificate Info */}
            {testResults.percentage >= 55 && (
              <div style={{
                padding: '1.5rem',
                background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(236,72,153,0.1))',
                border: `2px solid ${isDark ? 'rgba(99,102,241,0.3)' : 'rgba(99,102,241,0.2)'}`,
                borderRadius: '16px',
                marginBottom: '2rem'
              }}>
                <Award size={32} color="#6366f1" style={{ marginBottom: '0.75rem' }} />
                <p style={{
                  fontSize: 'clamp(0.85rem, 2.5vw, 1rem)',
                  color: isDark ? '#e2e8f0' : '#1e293b',
                  fontWeight: '600',
                  margin: 0
                }}>
                  {userCertificates.find(c => c.level === selectedPlan.level)
                    ? '✅ Certificate already issued for this level'
                    : '🎓 Certificate issued! Check below to download.'}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ 
              display: 'flex', 
              gap: '1rem', 
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={backToPlans}
                style={{
                  padding: 'clamp(0.75rem, 2vw, 1rem) clamp(1.5rem, 4vw, 2rem)',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  color: '#fff',
                  fontSize: 'clamp(0.85rem, 2.5vw, 1rem)',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
                  minWidth: '150px'
                }}
              >
                Back to Tests
              </button>

              {testResults.percentage >= 55 && userCertificates.find(c => c.level === selectedPlan.level) && (
                <button
                  onClick={() => viewCertificate(selectedPlan.level)}
                  style={{
                    padding: 'clamp(0.75rem, 2vw, 1rem) clamp(1.5rem, 4vw, 2rem)',
                    borderRadius: '12px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: '#fff',
                    fontSize: 'clamp(0.85rem, 2.5vw, 1rem)',
                    fontWeight: '700',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(16,185,129,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    minWidth: '150px',
                    justifyContent: 'center'
                  }}
                >
                  <Download size={20} />
                  View Certificate
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // 🏠 MAIN PAGE - PLANS VIEW
  // ==========================================
  return (
    <div style={{
      minHeight: '100vh',
      background: isDark
        ? 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)'
        : 'linear-gradient(135deg, #f0f4ff 0%, #fdf2f8 100%)',
      paddingTop: '100px',
      paddingBottom: '3rem',
      padding: '100px 1rem 3rem'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '3rem',
          animation: 'fadeInUp 0.6s ease'
        }}>
          <h1 style={{
            fontSize: 'clamp(2rem, 6vw, 4rem)',
            fontWeight: '900',
            color: isDark ? '#e2e8f0' : '#1e293b',
            marginBottom: '1rem',
            textShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : 'none'
          }}>
            🐍 Python Mock Tests
          </h1>
          <p style={{
            fontSize: 'clamp(0.9rem, 3vw, 1.2rem)',
            color: isDark ? '#94a3b8' : '#64748b',
            maxWidth: '600px',
            margin: '0 auto',
            padding: '0 1rem'
          }}>
            Professional certification tests with instant results
          </p>
        </div>

        {/* 🖥️ PERMANENT DESKTOP WARNING BANNER */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(236,72,153,0.15))',
          border: `2px solid ${isDark ? 'rgba(99,102,241,0.4)' : 'rgba(99,102,241,0.3)'}`,
          borderRadius: '20px',
          padding: 'clamp(1rem, 3vw, 1.5rem)',
          marginBottom: '3rem',
          animation: 'fadeInUp 0.8s ease'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '1rem',
            flexWrap: 'wrap',
            justifyContent: 'center'
          }}>
            <div style={{
              width: 'clamp(50px, 12vw, 70px)',
              height: 'clamp(50px, 12vw, 70px)',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(99,102,241,0.4)'
            }}>
              <Monitor size={window.innerWidth < 768 ? 24 : 32} color="#fff" />
            </div>
            <h3 style={{
              fontSize: 'clamp(1.2rem, 3.5vw, 1.8rem)',
              fontWeight: '900',
              color: isDark ? '#e2e8f0' : '#1e293b',
              margin: 0
            }}>
              ⚠️ Important Guidelines
            </h3>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))',
            gap: '1rem',
            marginBottom: '1rem'
          }}>
            {/* Desktop Mode */}
            <div style={{
              padding: 'clamp(0.75rem, 2vw, 1rem)',
              background: isDark ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.1)',
              borderRadius: '12px',
              border: `1px solid ${isDark ? 'rgba(99,102,241,0.3)' : 'rgba(99,102,241,0.2)'}`
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.5rem',
                color: '#6366f1',
                fontWeight: '700',
                fontSize: 'clamp(0.85rem, 2.5vw, 1rem)'
              }}>
                <Monitor size={18} />
                Desktop Mode
              </div>
              <p style={{
                fontSize: 'clamp(0.75rem, 2vw, 0.85rem)',
                color: isDark ? '#cbd5e1' : '#475569',
                margin: 0,
                lineHeight: '1.5'
              }}>
                For best experience, use desktop site mode on mobile or laptop/computer
              </p>
            </div>

            {/* 7-Day Lock */}
            <div style={{
              padding: 'clamp(0.75rem, 2vw, 1rem)',
              background: isDark ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.1)',
              borderRadius: '12px',
              border: `1px solid ${isDark ? 'rgba(239,68,68,0.3)' : 'rgba(239,68,68,0.2)'}`
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.5rem',
                color: '#ef4444',
                fontWeight: '700',
                fontSize: 'clamp(0.85rem, 2.5vw, 1rem)'
              }}>
                <Clock size={18} />
                7-Day Lock
              </div>
              <p style={{
                fontSize: 'clamp(0.75rem, 2vw, 0.85rem)',
                color: isDark ? '#cbd5e1' : '#475569',
                margin: 0,
                lineHeight: '1.5'
              }}>
                After taking a test, wait 7 days before attempting same level again
              </p>
            </div>

            {/* Pass Mark */}
            <div style={{
              padding: 'clamp(0.75rem, 2vw, 1rem)',
              background: isDark ? 'rgba(16,185,129,0.2)' : 'rgba(16,185,129,0.1)',
              borderRadius: '12px',
              border: `1px solid ${isDark ? 'rgba(16,185,129,0.3)' : 'rgba(16,185,129,0.2)'}`
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.5rem',
                color: '#10b981',
                fontWeight: '700',
                fontSize: 'clamp(0.85rem, 2.5vw, 1rem)'
              }}>
                <Trophy size={18} />
                Pass Mark: 55%
              </div>
              <p style={{
                fontSize: 'clamp(0.75rem, 2vw, 0.85rem)',
                color: isDark ? '#cbd5e1' : '#475569',
                margin: 0,
                lineHeight: '1.5'
              }}>
                Score 55% or above to receive your certificate
              </p>
            </div>
          </div>

          {/* Mobile Desktop Mode Instructions */}
          <div style={{
            padding: 'clamp(0.75rem, 2vw, 1rem)',
            background: isDark ? 'rgba(245,158,11,0.15)' : 'rgba(245,158,11,0.1)',
            borderRadius: '12px',
            border: `2px dashed ${isDark ? 'rgba(245,158,11,0.4)' : 'rgba(245,158,11,0.3)'}`,
            display: 'flex',
            alignItems: 'flex-start',
            gap: '0.75rem'
          }}>
            <Smartphone size={20} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{
                fontWeight: '700',
                color: '#f59e0b',
                marginBottom: '0.5rem',
                fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)'
              }}>
                📱 Enable Desktop Mode on Mobile:
              </div>
              <div style={{
                fontSize: 'clamp(0.75rem, 2vw, 0.85rem)',
                color: isDark ? '#cbd5e1' : '#475569',
                lineHeight: '1.5'
              }}>
                Browser Menu (⋮) → "Desktop site" → Enable → Refresh page
              </div>
            </div>
          </div>
        </div>

        {/* My Certificates Section */}
        {userCertificates.length > 0 && (
          <div style={{
            background: isDark ? '#1e293b' : '#fff',
            borderRadius: '24px',
            padding: 'clamp(1.5rem, 4vw, 2rem)',
            marginBottom: '3rem',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
          }}>
            <h2 style={{
              fontSize: 'clamp(1.2rem, 3vw, 1.5rem)',
              fontWeight: '900',
              color: isDark ? '#e2e8f0' : '#1e293b',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              flexWrap: 'wrap'
            }}>
              <Award size={28} color="#6366f1" />
              My Certificates
            </h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))',
              gap: '1.5rem'
            }}>
              {userCertificates.map((cert, i) => (
                <div
                  key={i}
                  style={{
                    background: isDark
                      ? 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(236,72,153,0.1))'
                      : 'linear-gradient(135deg, rgba(99,102,241,0.05), rgba(236,72,153,0.05))',
                    border: `2px solid ${isDark ? 'rgba(99,102,241,0.3)' : 'rgba(99,102,241,0.2)'}`,
                    borderRadius: '16px',
                    padding: '1.5rem',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onClick={() => setSelectedCertificate(cert)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(99,102,241,0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '1rem',
                    flexWrap: 'wrap',
                    gap: '0.5rem'
                  }}>
                    <div style={{
                      padding: '0.5rem 1rem',
                      background: cert.level === 'basic'
                        ? 'rgba(16,185,129,0.2)'
                        : cert.level === 'advanced'
                        ? 'rgba(99,102,241,0.2)'
                        : 'rgba(245,158,11,0.2)',
                      borderRadius: '20px',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      color: cert.level === 'basic'
                        ? '#10b981'
                        : cert.level === 'advanced'
                        ? '#6366f1'
                        : '#f59e0b'
                    }}>
                      {cert.level}
                    </div>
                    <Award size={24} color="#6366f1" />
                  </div>

                  <h3 style={{
                    fontSize: 'clamp(0.95rem, 2.5vw, 1.1rem)',
                    fontWeight: '800',
                    color: isDark ? '#e2e8f0' : '#1e293b',
                    marginBottom: '0.5rem'
                  }}>
                    {cert.testName}
                  </h3>

                  <div style={{
                    fontSize: 'clamp(0.75rem, 2vw, 0.85rem)',
                    color: isDark ? '#94a3b8' : '#64748b',
                    marginBottom: '1rem'
                  }}>
                    Score: <strong style={{ color: '#10b981' }}>{cert.score}%</strong> • {cert.date}
                  </div>

                  <button
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      border: 'none',
                      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                      color: '#fff',
                      fontSize: 'clamp(0.8rem, 2vw, 0.9rem)',
                      fontWeight: '700',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <Download size={18} />
                    View & Download
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Test Plans */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))',
          gap: '2rem',
          marginBottom: '3rem'
        }}>
          {Object.values(SUBSCRIPTION_PLANS).map((plan, index) => {
            const restriction = testRestrictions[plan.level];
            const payment = paymentStatus[plan.level];
            const hasCert = userCertificates.find(c => c.level === plan.level);
            const canTake = restriction?.canTake ?? true;
            const userIsAdmin = isAdmin(user?.email);
            const daysRemaining = getDaysRemaining(restriction);

            return (
              <div
                key={plan.id}
                style={{
                  background: isDark ? '#1e293b' : '#fff',
                  borderRadius: '24px',
                  padding: 'clamp(1.5rem, 4vw, 2rem)',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                  position: 'relative',
                  overflow: 'hidden',
                  animation: `fadeInUp 0.6s ease ${index * 0.1}s backwards`,
                  border: plan.badge ? '3px solid #fbbf24' : userIsAdmin ? '3px solid #10b981' : 'none'
                }}
              >
                {/* 🔓 Admin Badge */}
                {userIsAdmin && (
                  <div style={{
                    position: 'absolute',
                    top: '1rem',
                    left: '1rem',
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: '#fff',
                    padding: '0.5rem 1rem',
                    borderRadius: '20px',
                    fontSize: 'clamp(0.65rem, 2vw, 0.75rem)',
                    fontWeight: '700',
                    boxShadow: '0 4px 12px rgba(16,185,129,0.4)'
                  }}>
                    🔓 ADMIN FREE
                  </div>
                )}

                {/* Badge */}
                {plan.badge && !userIsAdmin && (
                  <div style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1rem',
                    background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                    color: '#fff',
                    padding: '0.5rem 1rem',
                    borderRadius: '20px',
                    fontSize: 'clamp(0.65rem, 2vw, 0.75rem)',
                    fontWeight: '700',
                    boxShadow: '0 4px 12px rgba(251,191,36,0.4)'
                  }}>
                    {plan.badge}
                  </div>
                )}

                {/* Plan Header */}
                <div style={{ textAlign: 'center', marginBottom: '1.5rem', marginTop: userIsAdmin || plan.badge ? '2.5rem' : '0' }}>
                  <div style={{
                    width: 'clamp(60px, 15vw, 80px)',
                    height: 'clamp(60px, 15vw, 80px)',
                    background: plan.level === 'basic'
                      ? 'linear-gradient(135deg, #10b981, #059669)'
                      : plan.level === 'advanced'
                      ? 'linear-gradient(135deg, #6366f1, #4f46e5)'
                      : 'linear-gradient(135deg, #f59e0b, #d97706)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1rem',
                    fontSize: 'clamp(1.5rem, 5vw, 2.5rem)',
                    boxShadow: '0 8px 20px rgba(0,0,0,0.15)'
                  }}>
                    {plan.level === 'basic' ? '🌱' : plan.level === 'advanced' ? '🔥' : '⭐'}
                  </div>

                  <h2 style={{
                    fontSize: 'clamp(1.3rem, 4vw, 1.8rem)',
                    fontWeight: '900',
                    color: isDark ? '#e2e8f0' : '#1e293b',
                    marginBottom: '0.5rem',
                    textTransform: 'uppercase',
                    letterSpacing: '1px'
                  }}>
                    {plan.level}
                  </h2>

                  <p style={{
                    color: isDark ? '#94a3b8' : '#64748b',
                    fontSize: 'clamp(0.8rem, 2.5vw, 0.95rem)',
                    marginBottom: '1rem'
                  }}>
                    {plan.description}
                  </p>

                  {/* Price */}
                  <div style={{
                    fontSize: 'clamp(2rem, 6vw, 2.5rem)',
                    fontWeight: '900',
                    color: userIsAdmin ? '#10b981' : '#6366f1',
                    marginBottom: '0.5rem'
                  }}>
                    {userIsAdmin ? 'FREE' : `₹${prices[plan.level] || plan.price}`}
                  </div>
                  {userIsAdmin && (
                    <div style={{
                      fontSize: 'clamp(0.75rem, 2vw, 0.85rem)',
                      color: '#10b981',
                      fontWeight: '600'
                    }}>
                      Admin Privilege
                    </div>
                  )}
                </div>

                {/* Features */}
                <div style={{
                  background: isDark ? 'rgba(99,102,241,0.05)' : 'rgba(99,102,241,0.03)',
                  borderRadius: '16px',
                  padding: '1.5rem',
                  marginBottom: '1.5rem'
                }}>
                  {plan.features.map((feature, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        marginBottom: idx === plan.features.length - 1 ? 0 : '0.75rem',
                        fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)',
                        color: isDark ? '#cbd5e1' : '#475569'
                      }}
                    >
                      <CheckCircle size={18} color="#10b981" style={{ flexShrink: 0 }} />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Status Indicators */}
                {userIsAdmin && (
                  <div style={{
                    padding: '0.75rem',
                    background: 'rgba(16,185,129,0.1)',
                    border: '1px solid rgba(16,185,129,0.3)',
                    borderRadius: '8px',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: 'clamp(0.75rem, 2vw, 0.85rem)',
                    color: '#10b981',
                    fontWeight: '600'
                  }}>
                    <CheckCircle size={16} />
                    🔓 Admin - Unlimited Access
                  </div>
                )}

                {!userIsAdmin && payment?.hasPaid && (
                  <div style={{
                    padding: '0.75rem',
                    background: 'rgba(16,185,129,0.1)',
                    border: '1px solid rgba(16,185,129,0.3)',
                    borderRadius: '8px',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: 'clamp(0.75rem, 2vw, 0.85rem)',
                    color: '#10b981',
                    fontWeight: '600'
                  }}>
                    <CheckCircle size={16} />
                    Paid ✓
                  </div>
                )}

                {hasCert && (
                  <div style={{
                    padding: '0.75rem',
                    background: 'rgba(99,102,241,0.1)',
                    border: '1px solid rgba(99,102,241,0.3)',
                    borderRadius: '8px',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: 'clamp(0.75rem, 2vw, 0.85rem)',
                    color: '#6366f1',
                    fontWeight: '600'
                  }}>
                    <Award size={16} />
                    Certificate Earned {userIsAdmin && '(Unlimited)'}
                  </div>
                )}

                {!userIsAdmin && !canTake && daysRemaining > 0 && (
                  <div style={{
                    padding: '0.75rem',
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.3)',
                    borderRadius: '8px',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: 'clamp(0.75rem, 2vw, 0.85rem)',
                    color: '#ef4444',
                    fontWeight: '600'
                  }}>
                    <Clock size={16} />
                    🔒 Locked - Wait {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}
                  </div>
                )}

                {!userIsAdmin && !canTake && daysRemaining === 0 && restriction?.message && (
                  <div style={{
                    padding: '0.75rem',
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.3)',
                    borderRadius: '8px',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: 'clamp(0.75rem, 2vw, 0.85rem)',
                    color: '#ef4444',
                    fontWeight: '600'
                  }}>
                    <AlertCircle size={16} />
                    {restriction.message}
                  </div>
                )}

                {/* Action Button */}
                <button
                  onClick={() => handleSelectPlan(plan)}
                  disabled={!userIsAdmin && !canTake && payment?.hasPaid}
                  style={{
                    width: '100%',
                    background: (!userIsAdmin && !canTake && payment?.hasPaid)
                      ? 'rgba(99,102,241,0.3)'
                      : userIsAdmin
                      ? 'linear-gradient(135deg, #10b981, #059669)'
                      : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    border: 'none',
                    color: '#fff',
                    padding: 'clamp(1rem, 3vw, 1.25rem)',
                    borderRadius: '16px',
                    fontSize: 'clamp(0.9rem, 2.5vw, 1.1rem)',
                    fontWeight: '700',
                    cursor: (!userIsAdmin && !canTake && payment?.hasPaid) ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.75rem',
                    boxShadow: (!userIsAdmin && !canTake && payment?.hasPaid)
                      ? 'none'
                      : userIsAdmin
                      ? '0 4px 20px rgba(16,185,129,0.4)'
                      : '0 4px 20px rgba(99,102,241,0.4)',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    opacity: (!userIsAdmin && !canTake && payment?.hasPaid) ? 0.6 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (userIsAdmin || canTake || !payment?.hasPaid) {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = userIsAdmin
                        ? '0 8px 30px rgba(16,185,129,0.5)'
                        : '0 8px 30px rgba(99,102,241,0.5)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = (!userIsAdmin && !canTake && payment?.hasPaid)
                      ? 'none'
                      : userIsAdmin
                      ? '0 4px 20px rgba(16,185,129,0.4)'
                      : '0 4px 20px rgba(99,102,241,0.4)';
                  }}
                >
                  {userIsAdmin ? (
                    <>
                      <Zap size={24} />
                      🔓 Start Free Test
                    </>
                  ) : !payment?.hasPaid ? (
                    <>
                      <Zap size={24} />
                      Buy Test (₹{prices[plan.level] || plan.price})
                    </>
                  ) : !canTake && daysRemaining > 0 ? (
                    <>
                      <Clock size={24} />
                      🔒 Wait {daysRemaining} Day{daysRemaining !== 1 ? 's' : ''}
                    </>
                  ) : (
                    <>
                      <Zap size={24} />
                      Start Test
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Test History */}
        {testHistory.length > 0 && (
          <div style={{
            background: isDark ? '#1e293b' : '#fff',
            borderRadius: '24px',
            padding: 'clamp(1.5rem, 4vw, 2rem)',
            boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
          }}>
            <h2 style={{
              fontSize: 'clamp(1.2rem, 3vw, 1.5rem)',
              fontWeight: '900',
              color: isDark ? '#e2e8f0' : '#1e293b',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              flexWrap: 'wrap'
            }}>
              <Calendar size={28} color="#6366f1" />
              Test History
            </h2>

            <div style={{
              display: 'grid',
              gap: '1rem'
            }}>
              {testHistory.slice(0, 5).map((test, i) => (
                <div
                  key={i}
                  style={{
                    padding: 'clamp(1rem, 3vw, 1.5rem)',
                    background: isDark ? 'rgba(99,102,241,0.05)' : 'rgba(99,102,241,0.03)',
                    borderRadius: '12px',
                    border: `1px solid ${isDark ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.1)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '1rem'
                  }}
                >
                  <div>
                    <div style={{
                      fontSize: 'clamp(0.85rem, 2.5vw, 1rem)',
                      fontWeight: '700',
                      color: isDark ? '#e2e8f0' : '#1e293b',
                      marginBottom: '0.25rem'
                    }}>
                      {test.planName}
                    </div>
                    <div style={{
                      fontSize: 'clamp(0.75rem, 2vw, 0.85rem)',
                      color: isDark ? '#94a3b8' : '#64748b'
                    }}>
                      {test.date} • {test.timeTaken}
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    flexWrap: 'wrap'
                  }}>
                    <div style={{
                      padding: '0.5rem 1rem',
                      background: test.score >= 70
                        ? 'rgba(16,185,129,0.2)'
                        : 'rgba(239,68,68,0.2)',
                      borderRadius: '20px',
                      fontSize: 'clamp(0.8rem, 2vw, 0.9rem)',
                      fontWeight: '700',
                      color: test.score >= 70 ? '#10b981' : '#ef4444'
                    }}>
                      {test.score}%
                    </div>

                    {test.passed && (
                      <div style={{
                        padding: '0.5rem 1rem',
                        background: 'rgba(99,102,241,0.2)',
                        borderRadius: '20px',
                        fontSize: 'clamp(0.75rem, 2vw, 0.85rem)',
                        fontWeight: '700',
                        color: '#6366f1',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        <Trophy size={16} />
                        PASSED
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Certificate Viewer Modal */}
        {selectedCertificate && (
          <CertificateViewer
            certificate={selectedCertificate}
            onClose={() => setSelectedCertificate(null)}
          />
        )}
      </div>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(50px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Mobile Optimizations */
        @media (max-width: 768px) {
          body {
            font-size: 14px;
          }
        }
      `}</style>
    </div>
  );
}

export default MockTestPage;