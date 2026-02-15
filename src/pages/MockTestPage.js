import React, { useState, useEffect } from 'react';
import { useAuth, useTheme, RAZORPAY_KEY_ID } from '../App';
import { Clock, Trophy, Award, Zap, Loader, CheckCircle, XCircle, Monitor, Smartphone, Lock, Unlock, TrendingUp, AlertTriangle } from 'lucide-react';
import { SUBSCRIPTION_PLANS } from '../data/subscriptionPlans';
import MockTestInterface from '../components/MockTestInterface';
import UserDetailsForm from '../components/UserDetailsForm';
import CertificateViewer from '../components/CertificateViewer';
import Resultsdisplay from '../components/Resultsdisplay';
import Certificatesection from '../components/Certificatesection';
import { db } from '../firebase';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import {
  getManualQuestions,
  hasCertificateForLevel,
  saveTestResult,
  issueCertificate,
  getCertificate,
  getAllCertificates,
  getTestHistory,
  getUserDetails,
  saveUserDetails,
  processMockTestPayment,
  getPaymentDetails,
  updateTestAttempt,
  deleteTestResult
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

// ==========================================
// ⏰ TIME UTILITIES
// ==========================================
const formatTimeRemaining = (milliseconds) => {
  if (milliseconds <= 0) return 'Expired';
  
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    const remainingHours = hours % 24;
    return `${days}d ${remainingHours}h`;
  } else if (hours > 0) {
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m`;
  } else {
    return `${seconds}s`;
  }
};

function MockTestPage() {
  const { user } = useAuth();
  const { isDark } = useTheme();

  // ✅ Test Flow States
  const [currentStep, setCurrentStep] = useState('plans');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [testQuestions, setTestQuestions] = useState([]);
  const [loading, setLoading] = useState(false);

  // ✅ Dynamic Prices from Firebase
  const [prices, setPrices] = useState(DEFAULT_PRICES);

  // ✅ User Data
  const [userDetails, setUserDetails] = useState(null);
  const [userCertificates, setUserCertificates] = useState([]);
  const [testHistory, setTestHistory] = useState([]);
  const [selectedCertificate, setSelectedCertificate] = useState(null);

  // ✅ Test Results
  const [testResults, setTestResults] = useState(null);

  // ✅ Payment & Status Data
  const [paymentDetails, setPaymentDetails] = useState({});
  const [testStatus, setTestStatus] = useState({});

  // ✅ Delete Confirmation Dialog
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [testToDelete, setTestToDelete] = useState(null);
  
  // ✅ Certificate Delete Dialog
  const [showDeleteCertDialog, setShowDeleteCertDialog] = useState(false);
  const [certToDelete, setCertToDelete] = useState(null);

  // ==========================================
  // 💰 Fetch Prices from Firebase
  // ==========================================
  const fetchPrices = async () => {
    try {
      const priceDoc = await getDoc(doc(db, 'settings', 'testPrices'));
      if (priceDoc.exists()) {
        setPrices(priceDoc.data());
      } else {
        setPrices(DEFAULT_PRICES);
      }
    } catch (error) {
      console.error('❌ Error fetching prices:', error);
      setPrices(DEFAULT_PRICES);
    }
  };

  // ==========================================
  // 📊 Calculate Test Status
  // ==========================================
  const calculateTestStatus = (payment, level) => {
    if (!payment?.hasPaid) {
      return {
        canTake: true,
        status: 'available',
        message: 'Purchase to start test',
        color: '#10b981'
      };
    }

    const now = new Date();

    if (payment.purchaseValidUntil) {
      const gracePeriodEnd = new Date(payment.purchaseValidUntil);
      if (now < gracePeriodEnd && !payment.testSubmittedAt) {
        return {
          canTake: true,
          status: 'grace_period',
          message: 'Test available - Grace period active',
          color: '#10b981',
          timeRemaining: gracePeriodEnd - now
        };
      }
    }

    if (payment.testStartedAt && !payment.testSubmittedAt) {
      return {
        canTake: true,
        status: 'in_progress',
        message: 'Resume your test',
        color: '#f59e0b'
      };
    }

    if (payment.lockEndsAt) {
      const lockEnd = new Date(payment.lockEndsAt);
      if (now < lockEnd) {
        return {
          canTake: false,
          status: 'locked',
          message: `Locked - Available in ${formatTimeRemaining(lockEnd - now)}`,
          color: '#ef4444',
          timeRemaining: lockEnd - now
        };
      }
    }

    return {
      canTake: true,
      status: 'available',
      message: 'Purchase to take test again',
      color: '#10b981'
    };
  };

  const loadUserData = async () => {
    setLoading(true);
    try {
      console.log('🔄 Loading user data for:', user.uid);
      
      const detailsResult = await getUserDetails(user.uid);
      console.log('📋 User Details Result:', detailsResult);
      if (detailsResult.success) {
        setUserDetails(detailsResult.details);
      }

      const certsResult = await getAllCertificates(user.uid);
      console.log('🎓 Certificates Result:', certsResult);
      if (certsResult.success) {
        console.log('📋 Found certificates:', certsResult.certificates.length);
        setUserCertificates(certsResult.certificates);
      }

      const historyResult = await getTestHistory(user.uid);
      console.log('📊 Test History Result:', historyResult);
      if (historyResult.success) {
        console.log('📋 Found test results:', historyResult.tests.length);
        setTestHistory(historyResult.tests);
      }

      const statusData = {};
      const paymentData = {};

      for (const level of ['basic', 'advanced', 'pro']) {
        const payment = await getPaymentDetails(user.uid, level);
        paymentData[level] = payment;

        const status = calculateTestStatus(payment, level);
        statusData[level] = status;
      }

      setPaymentDetails(paymentData);
      setTestStatus(statusData);

      console.log('✅ User data loaded successfully');

    } catch (error) {
      console.error('❌ Error loading user data:', error);
      window.showToast?.('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadUserData();
    }
    fetchPrices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handlePayment = (plan) => {
    if (!user) {
      window.showToast?.('⚠️ Please login first!', 'warning');
      return;
    }

    if (!window.Razorpay) {
      window.showToast?.('⚠️ Payment system loading... Please wait!', 'warning');
      return;
    }

    const dynamicPrice = prices[plan.level] || plan.price;

    const options = {
      key: RAZORPAY_KEY_ID,
      amount: dynamicPrice * 100,
      currency: "INR",
      name: "FaizUpyZone",
      description: `${plan.name} - Mock Test`,
      image: "https://img.icons8.com/fluency/96/000000/python.png",
      handler: async function (response) {
        window.showToast?.('✅ Payment Successful!', 'success');
        
        const now = new Date();
        const purchaseValidUntil = new Date(now.getTime() + 12 * 60 * 60 * 1000);

        const paymentData = {
          level: plan.level,
          amount: dynamicPrice,
          paymentId: response.razorpay_payment_id,
          paidAt: now.toISOString(),
          purchaseValidUntil: purchaseValidUntil.toISOString(),
          testStartedAt: null,
          testSubmittedAt: null,
          resultsViewedAt: null,
          lockStartsAt: null,
          lockEndsAt: null
        };

        const result = await processMockTestPayment(user.uid, plan.id, paymentData);
        
        if (result.success) {
          window.showToast?.(`✅ Test unlocked! Valid for 12 hours`, 'success');
          await loadUserData();
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

  const handleFormSubmit = async (formData) => {
    setLoading(true);
    try {
      const result = await saveUserDetails(user.uid, formData);
      
      if (result.success) {
        setUserDetails(formData);
        window.showToast?.('✅ Details saved!', 'success');
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

  const startTest = async (plan) => {
    setLoading(true);
    window.showToast?.('⏳ Loading questions...', 'info');

    try {
      const now = new Date();
      await updateTestAttempt(user.uid, plan.level, {
        testStartedAt: now.toISOString()
      });

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

  const handleTestComplete = async (results) => {
    console.log('🎯 [MockTestPage] Test completed, received results:', results);
    setLoading(true);
    
    try {
      const now = new Date();
      const lockStartsAt = now;
      const lockEndsAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      await updateTestAttempt(user.uid, selectedPlan.level, {
        testSubmittedAt: now.toISOString(),
        resultsViewedAt: now.toISOString(),
        lockStartsAt: lockStartsAt.toISOString(),
        lockEndsAt: lockEndsAt.toISOString()
      });

      // ✅ COMPLETE TEST DATA with all details
      const testData = {
        planId: selectedPlan.id,
        planName: selectedPlan.name,
        level: selectedPlan.level,
        score: results.percentage,
        correct: results.correct,
        wrong: results.wrong,
        total: results.total,
        passed: results.percentage >= 55,
        timeTaken: results.timeTaken,
        
        // ✅ Additional details from results
        tabSwitches: results.tabSwitches || 0,
        correctQuestions: results.correctQuestions || [],
        wrongQuestions: results.wrongQuestions || [],
        penalized: results.penalized || false,
        
        // ✅ Student information
        studentInfo: results.studentInfo || userDetails || {
          fullName: user.displayName || user.email.split('@')[0],
          email: user.email,
          age: 'N/A',
          address: 'N/A'
        },
        
        // ✅ Test metadata
        testDate: now.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'long',
          year: 'numeric'
        }),
        testTime: now.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }),
        completedAt: now.toISOString()
      };

      console.log('💾 [MockTestPage] Saving test data:', testData);

      await saveTestResult(user.uid, testData);

      const shouldIssueCert = isAdmin(user.email) || results.percentage >= 55;

      if (shouldIssueCert) {
        const certCheck = await hasCertificateForLevel(user.uid, selectedPlan.level);
        
        if (!certCheck.hasCertificate || isAdmin(user.email)) {
          const certificateData = {
            userName: results.studentInfo?.fullName || userDetails?.fullName || user.displayName || user.email,
            userAge: results.studentInfo?.age || userDetails?.age || 'N/A',
            userAddress: results.studentInfo?.address || userDetails?.address || 'N/A',
            userEmail: user.email,
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

          console.log('📋 Certificate Data:', certificateData);

          const certResult = await issueCertificate(user.uid, certificateData);
          
          console.log('📋 Certificate Result:', certResult);
          
          if (certResult.success) {
            window.showToast?.(
              isAdmin(user.email) 
                ? '🔓 Admin Certificate issued!' 
                : '🎉 Certificate issued!', 
              'success'
            );
            setUserCertificates(prev => [...prev, certResult.certificate]);
          } else {
            console.error('❌ Certificate issue failed:', certResult);
            window.showToast?.(`❌ ${certResult.error || 'Certificate issue failed'}`, 'error');
          }
        } else {
          window.showToast?.('ℹ️ You already have a certificate for this level', 'info');
        }
      } else {
        window.showToast?.('💪 Score 55% to get certificate!', 'info');
      }

      console.log('✅ [MockTestPage] Setting test results and switching to results step');
      setTestResults(results);
      setCurrentStep('results');
      
      await loadUserData();

    } catch (error) {
      console.error('❌ Error processing test completion:', error);
      window.showToast?.('❌ Error saving results', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleExitTest = async () => {
    if (window.confirm('⚠️ Are you sure? Your progress will be lost!')) {
      console.log('🔙 [MockTestPage] Exiting test, returning to plans');
      await backToPlans();
    }
  };

  // ==========================================
  // 🔧 FIX #2: ENHANCED BACK TO PLANS WITH CLEANUP
  // ==========================================
  const backToPlans = async () => {
    console.log('🔙 [MockTestPage] Back to plans clicked');
    
    // ✅ Exit fullscreen before going back
    try {
      if (document.fullscreenElement || 
          document.webkitFullscreenElement || 
          document.msFullscreenElement || 
          document.mozFullScreenElement) {
        
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          await document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
          await document.msExitFullscreen();
        } else if (document.mozCancelFullScreen) {
          await document.mozCancelFullScreen();
        }
      }
    } catch (err) {
      console.log('Fullscreen exit:', err.message);
    }

    // ✅ Clear beforeunload handler
    window.onbeforeunload = null;

    // ✅ Restore body/html overflow and styles
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
    document.body.style.position = '';
    document.body.style.margin = '';
    document.body.style.padding = '';
    document.body.style.width = '';
    document.body.style.height = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.overscrollBehavior = '';
    document.body.style.userSelect = '';
    document.body.style.webkitUserSelect = '';
    document.body.style.msUserSelect = '';
    document.body.style.mozUserSelect = '';

    // ✅ Small delay to ensure cleanup completes
    setTimeout(() => {
      setCurrentStep('plans');
      setSelectedPlan(null);
      setTestQuestions([]);
      setTestResults(null);
      
      // Reload user data to refresh state
      loadUserData();
      
      // Scroll to top smoothly
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  // ==========================================
  // 🔧 FIX #1: ENHANCED PLAN SELECTION WITH DETAILS CHECK
  // ==========================================
  const handleSelectPlan = async (plan) => {
    if (!user) {
      window.showToast?.('⚠️ Please login first!', 'warning');
      return;
    }

    setSelectedPlan(plan);

    // ✅ ADMIN ACCESS
    if (isAdmin(user.email)) {
      window.showToast?.('🔓 Admin access - Free test!', 'success');
      
      // ✅ FIX: Only show form if details don't exist
      if (!userDetails) {
        setCurrentStep('form');
        return;
      }

      // If details exist, directly start test
      await startTest(plan);
      return;
    }

    // ✅ NON-ADMIN ACCESS
    const status = testStatus[plan.level];

    if (status?.status === 'locked') {
      window.showToast?.(status.message, 'warning');
      return;
    }

    // Need to purchase
    if (!paymentDetails[plan.level]?.hasPaid || status?.status === 'available') {
      handlePayment(plan);
      return;
    }

    // ✅ FIX: Only show form if details don't exist
    if (!userDetails) {
      setCurrentStep('form');
      return;
    }

    // If details exist, directly start test
    await startTest(plan);
  };

  const viewCertificate = async (level) => {
    const result = await getCertificate(user.uid, level);
    if (result.success) {
      setSelectedCertificate(result.certificate);
    } else {
      window.showToast?.('❌ Certificate not found', 'error');
    }
  };

  const handleDeleteClick = (test) => {
    setTestToDelete(test);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!testToDelete) return;
    
    try {
      const result = await deleteTestResult(user.uid, testToDelete.id);
      if (result.success) {
        window.showToast?.('✅ Test result deleted successfully!', 'success');
        setShowDeleteDialog(false);
        setTestToDelete(null);
        await loadUserData();
      } else {
        window.showToast?.('❌ Failed to delete result', 'error');
      }
    } catch (error) {
      console.error('❌ Error deleting result:', error);
      window.showToast?.('❌ Error occurred while deleting', 'error');
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteDialog(false);
    setTestToDelete(null);
  };

  const handleDeleteCertificate = (cert) => {
    setCertToDelete(cert);
    setShowDeleteCertDialog(true);
  };

  const handleConfirmCertDelete = async () => {
    if (!certToDelete) return;
    
    try {
      const certRef = doc(db, 'users', user.uid, 'certificates', certToDelete.id);
      await deleteDoc(certRef);
      
      window.showToast?.('✅ Certificate deleted successfully!', 'success');
      setShowDeleteCertDialog(false);
      setCertToDelete(null);
      await loadUserData();
    } catch (error) {
      console.error('❌ Error deleting certificate:', error);
      window.showToast?.('❌ Failed to delete certificate', 'error');
    }
  };

  const handleCancelCertDelete = () => {
    setShowDeleteCertDialog(false);
    setCertToDelete(null);
  };

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

  if (currentStep === 'test' && testQuestions.length > 0) {
    console.log('🎯 [MockTestPage] Rendering MockTestInterface');
    return (
      <MockTestInterface
        questions={testQuestions}
        onComplete={handleTestComplete}
        onExit={handleExitTest}
        testTitle={selectedPlan?.name}
        timeLimit={selectedPlan?.timeLimit}
        userEmail={user?.email}
        testLevel={selectedPlan?.level}
      />
    );
  }

  if (currentStep === 'form') {
    return (
      <UserDetailsForm
        onSubmit={handleFormSubmit}
        onCancel={backToPlans}
      />
    );
  }

  if (currentStep === 'results' && testResults) {
    console.log('📊 [MockTestPage] Rendering Resultsdisplay with:', testResults);
    return (
      <Resultsdisplay
        testResults={testResults}
        selectedPlan={selectedPlan}
        userCertificates={userCertificates}
        isDark={isDark}
        onBackToPlans={backToPlans}
        onViewCertificate={viewCertificate}
      />
    );
  }

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

        {/* Guidelines Section */}
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
                <Clock size={18} />
                12-Hour Window
              </div>
              <p style={{
                fontSize: 'clamp(0.75rem, 2vw, 0.85rem)',
                color: isDark ? '#cbd5e1' : '#475569',
                margin: 0,
                lineHeight: '1.5'
              }}>
                After purchase, you have 12 hours to start the test. No refunds if time expires.
              </p>
            </div>

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
                <Lock size={18} />
                7-Day Lock
              </div>
              <p style={{
                fontSize: 'clamp(0.75rem, 2vw, 0.85rem)',
                color: isDark ? '#cbd5e1' : '#475569',
                margin: 0,
                lineHeight: '1.5'
              }}>
                After viewing results, test locks for 7 days. Then repurchase to try again.
              </p>
            </div>

            <div style={{
              padding: 'clamp(0.75rem, 2vw, 1rem)',
              background: isDark ? 'rgba(245,158,11,0.2)' : 'rgba(245,158,11,0.1)',
              borderRadius: '12px',
              border: `1px solid ${isDark ? 'rgba(245,158,11,0.3)' : 'rgba(245,158,11,0.2)'}`
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.5rem',
                color: '#f59e0b',
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
                Score 55% or above to receive your certificate (one per level, lifetime)
              </p>
            </div>
          </div>

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

        {/* Test Plans Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))',
          gap: '2rem',
          marginBottom: '3rem'
        }}>
          {Object.values(SUBSCRIPTION_PLANS).map((plan, index) => {
            const status = testStatus[plan.level] || {};
            const hasCert = userCertificates.find(c => c.level === plan.level);
            const userIsAdmin = isAdmin(user?.email);

            let timeRemainingDisplay = '';
            if (status.timeRemaining) {
              timeRemainingDisplay = formatTimeRemaining(status.timeRemaining);
            }

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

                {!userIsAdmin && status.status === 'grace_period' && (
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
                    <Unlock size={16} />
                    ✅ Available - Grace Period: {timeRemainingDisplay}
                  </div>
                )}

                {!userIsAdmin && status.status === 'in_progress' && (
                  <div style={{
                    padding: '0.75rem',
                    background: 'rgba(245,158,11,0.1)',
                    border: '1px solid rgba(245,158,11,0.3)',
                    borderRadius: '8px',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: 'clamp(0.75rem, 2vw, 0.85rem)',
                    color: '#f59e0b',
                    fontWeight: '600'
                  }}>
                    <TrendingUp size={16} />
                    📝 Test in Progress - Resume
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
                    Certificate Earned (One per level)
                  </div>
                )}

                {!userIsAdmin && status.status === 'locked' && (
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
                    <Lock size={16} />
                    🔒 Locked - {timeRemainingDisplay}
                  </div>
                )}

                <button
                  onClick={() => handleSelectPlan(plan)}
                  disabled={!userIsAdmin && status.status === 'locked'}
                  style={{
                    width: '100%',
                    background: (!userIsAdmin && status.status === 'locked')
                      ? 'rgba(99,102,241,0.3)'
                      : userIsAdmin
                      ? 'linear-gradient(135deg, #10b981, #059669)'
                      : status.status === 'grace_period' || status.status === 'in_progress'
                      ? 'linear-gradient(135deg, #10b981, #059669)'
                      : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    border: 'none',
                    color: '#fff',
                    padding: 'clamp(1rem, 3vw, 1.25rem)',
                    borderRadius: '16px',
                    fontSize: 'clamp(0.9rem, 2.5vw, 1.1rem)',
                    fontWeight: '700',
                    cursor: (!userIsAdmin && status.status === 'locked') ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.75rem',
                    boxShadow: (!userIsAdmin && status.status === 'locked')
                      ? 'none'
                      : userIsAdmin
                      ? '0 4px 20px rgba(16,185,129,0.4)'
                      : status.status === 'grace_period' || status.status === 'in_progress'
                      ? '0 4px 20px rgba(16,185,129,0.4)'
                      : '0 4px 20px rgba(99,102,241,0.4)',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    opacity: (!userIsAdmin && status.status === 'locked') ? 0.6 : 1
                  }}
                  onMouseEnter={(e) => {
                    if (userIsAdmin || status.status !== 'locked') {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = userIsAdmin
                        ? '0 8px 30px rgba(16,185,129,0.5)'
                        : status.status === 'grace_period' || status.status === 'in_progress'
                        ? '0 8px 30px rgba(16,185,129,0.5)'
                        : '0 8px 30px rgba(99,102,241,0.5)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = (!userIsAdmin && status.status === 'locked')
                      ? 'none'
                      : userIsAdmin
                      ? '0 4px 20px rgba(16,185,129,0.4)'
                      : status.status === 'grace_period' || status.status === 'in_progress'
                      ? '0 4px 20px rgba(16,185,129,0.4)'
                      : '0 4px 20px rgba(99,102,241,0.4)';
                  }}
                >
                  {userIsAdmin ? (
                    <>
                      <Zap size={24} />
                      🔓 Start Free Test
                    </>
                  ) : status.status === 'grace_period' || status.status === 'in_progress' ? (
                    <>
                      <Zap size={24} />
                      {status.status === 'in_progress' ? 'Resume Test' : 'Start Test'}
                    </>
                  ) : status.status === 'locked' ? (
                    <>
                      <Lock size={24} />
                      🔒 Locked - {timeRemainingDisplay}
                    </>
                  ) : (
                    <>
                      <Zap size={24} />
                      Buy Test (₹{prices[plan.level] || plan.price})
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Certificate and Test History Section */}
        <Certificatesection
          userCertificates={userCertificates}
          testHistory={testHistory}
          isDark={isDark}
          onViewCertificate={setSelectedCertificate}
          onDeleteCertificate={handleDeleteCertificate}
          onDeleteTest={handleDeleteClick}
        />

        {/* Certificate Viewer Modal */}
        {selectedCertificate && (
          <CertificateViewer
            certificate={selectedCertificate}
            onClose={() => setSelectedCertificate(null)}
          />
        )}

        {/* Delete Test Result Dialog */}
        {showDeleteDialog && testToDelete && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            backdropFilter: 'blur(8px)',
            animation: 'fadeIn 0.3s ease',
            padding: '1rem'
          }}>
            <div style={{
              background: isDark ? '#1e293b' : '#fff',
              padding: 'clamp(2rem, 5vw, 3rem)',
              borderRadius: '24px',
              maxWidth: '500px',
              width: '100%',
              boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
              animation: 'scaleIn 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
              border: `3px solid ${isDark ? '#ef4444' : '#fecaca'}`
            }}>
              <div style={{
                width: 'clamp(70px, 15vw, 90px)',
                height: 'clamp(70px, 15vw, 90px)',
                margin: '0 auto 1.5rem',
                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 10px 30px rgba(239,68,68,0.4)',
                animation: 'pulse 2s infinite'
              }}>
                <XCircle size={window.innerWidth < 768 ? 40 : 50} color="#fff" strokeWidth={2.5} />
              </div>

              <h2 style={{
                fontSize: 'clamp(1.3rem, 4vw, 1.8rem)',
                fontWeight: '900',
                color: isDark ? '#e2e8f0' : '#1e293b',
                marginBottom: '1rem',
                textAlign: 'center',
                lineHeight: 1.3
              }}>
                Delete Test Result?
              </h2>

              <div style={{
                background: isDark ? 'rgba(239,68,68,0.1)' : 'rgba(254,202,202,0.3)',
                border: `2px solid ${isDark ? 'rgba(239,68,68,0.3)' : '#fecaca'}`,
                borderRadius: '16px',
                padding: '1.25rem',
                marginBottom: '1.5rem'
              }}>
                <div style={{
                  fontSize: 'clamp(0.85rem, 2.5vw, 0.95rem)',
                  fontWeight: '700',
                  color: isDark ? '#fca5a5' : '#991b1b',
                  marginBottom: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <AlertTriangle size={18} />
                  Test Details
                </div>
                <div style={{
                  fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)',
                  color: isDark ? '#cbd5e1' : '#475569',
                  lineHeight: 1.6
                }}>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <strong>Test:</strong> {testToDelete.planName}
                  </div>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <strong>Score:</strong> {testToDelete.score}%
                  </div>
                  <div>
                    <strong>Date:</strong> {testToDelete.testDate || testToDelete.date}
                  </div>
                </div>
              </div>

              <p style={{
                fontSize: 'clamp(0.85rem, 2.5vw, 1rem)',
                color: isDark ? '#94a3b8' : '#64748b',
                textAlign: 'center',
                marginBottom: '2rem',
                lineHeight: 1.6
              }}>
                ⚠️ This action <strong>cannot be undone</strong>. All test data including scores, questions analysis, and completion details will be permanently deleted.
              </p>

              <div style={{
                display: 'flex',
                gap: '1rem',
                flexWrap: 'wrap'
              }}>
                <button
                  onClick={handleCancelDelete}
                  style={{
                    flex: 1,
                    minWidth: '140px',
                    padding: 'clamp(0.9rem, 2.5vw, 1.1rem)',
                    background: isDark ? '#334155' : '#f1f5f9',
                    border: `3px solid ${isDark ? '#475569' : '#e2e8f0'}`,
                    borderRadius: '14px',
                    color: isDark ? '#e2e8f0' : '#475569',
                    fontSize: 'clamp(0.9rem, 2.5vw, 1rem)',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <XCircle size={18} />
                  Cancel
                </button>

                <button
                  onClick={handleConfirmDelete}
                  style={{
                    flex: 1,
                    minWidth: '140px',
                    padding: 'clamp(0.9rem, 2.5vw, 1.1rem)',
                    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                    border: '3px solid #dc2626',
                    borderRadius: '14px',
                    color: '#fff',
                    fontSize: 'clamp(0.9rem, 2.5vw, 1rem)',
                    fontWeight: '800',
                    cursor: 'pointer',
                    boxShadow: '0 6px 20px rgba(239,68,68,0.4)',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(239,68,68,0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(239,68,68,0.4)';
                  }}
                >
                  <CheckCircle size={18} />
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Certificate Dialog */}
        {showDeleteCertDialog && certToDelete && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            backdropFilter: 'blur(8px)',
            animation: 'fadeIn 0.3s ease',
            padding: '1rem'
          }}>
            <div style={{
              background: isDark ? '#1e293b' : '#fff',
              padding: 'clamp(2rem, 5vw, 3rem)',
              borderRadius: '24px',
              maxWidth: '500px',
              width: '100%',
              boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
              animation: 'scaleIn 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
              border: `3px solid ${isDark ? '#f59e0b' : '#fbbf24'}`
            }}>
              <div style={{
                width: 'clamp(70px, 15vw, 90px)',
                height: 'clamp(70px, 15vw, 90px)',
                margin: '0 auto 1.5rem',
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 10px 30px rgba(245,158,11,0.4)',
                animation: 'pulse 2s infinite'
              }}>
                <Award size={window.innerWidth < 768 ? 40 : 50} color="#fff" strokeWidth={2.5} />
              </div>

              <h2 style={{
                fontSize: 'clamp(1.3rem, 4vw, 1.8rem)',
                fontWeight: '900',
                color: isDark ? '#e2e8f0' : '#1e293b',
                marginBottom: '1rem',
                textAlign: 'center',
                lineHeight: 1.3
              }}>
                Delete Certificate?
              </h2>

              <div style={{
                background: isDark ? 'rgba(245,158,11,0.1)' : 'rgba(251,191,36,0.2)',
                border: `2px solid ${isDark ? 'rgba(245,158,11,0.3)' : '#fbbf24'}`,
                borderRadius: '16px',
                padding: '1.25rem',
                marginBottom: '1.5rem'
              }}>
                <div style={{
                  fontSize: 'clamp(0.85rem, 2.5vw, 0.95rem)',
                  fontWeight: '700',
                  color: isDark ? '#fbbf24' : '#92400e',
                  marginBottom: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <AlertTriangle size={18} />
                  Certificate Details
                </div>
                <div style={{
                  fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)',
                  color: isDark ? '#cbd5e1' : '#475569',
                  lineHeight: 1.6
                }}>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <strong>Test:</strong> {certToDelete.testName}
                  </div>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <strong>Level:</strong> {certToDelete.level}
                  </div>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <strong>Score:</strong> {certToDelete.score}%
                  </div>
                  <div>
                    <strong>ID:</strong> {certToDelete.certificateId}
                  </div>
                </div>
              </div>

              <p style={{
                fontSize: 'clamp(0.85rem, 2.5vw, 1rem)',
                color: isDark ? '#94a3b8' : '#64748b',
                textAlign: 'center',
                marginBottom: '2rem',
                lineHeight: 1.6
              }}>
                ⚠️ This will permanently delete your certificate. You can earn a new one by retaking and passing the test (after 30-day cooldown).
              </p>

              <div style={{
                display: 'flex',
                gap: '1rem',
                flexWrap: 'wrap'
              }}>
                <button
                  onClick={handleCancelCertDelete}
                  style={{
                    flex: 1,
                    minWidth: '140px',
                    padding: 'clamp(0.9rem, 2.5vw, 1.1rem)',
                    background: isDark ? '#334155' : '#f1f5f9',
                    border: `3px solid ${isDark ? '#475569' : '#e2e8f0'}`,
                    borderRadius: '14px',
                    color: isDark ? '#e2e8f0' : '#475569',
                    fontSize: 'clamp(0.9rem, 2.5vw, 1rem)',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <XCircle size={18} />
                  Cancel
                </button>

                <button
                  onClick={handleConfirmCertDelete}
                  style={{
                    flex: 1,
                    minWidth: '140px',
                    padding: 'clamp(0.9rem, 2.5vw, 1.1rem)',
                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                    border: '3px solid #d97706',
                    borderRadius: '14px',
                    color: '#fff',
                    fontSize: 'clamp(0.9rem, 2.5vw, 1rem)',
                    fontWeight: '800',
                    cursor: 'pointer',
                    boxShadow: '0 6px 20px rgba(245,158,11,0.4)',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(245,158,11,0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(245,158,11,0.4)';
                  }}
                >
                  <CheckCircle size={18} />
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
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

        @keyframes scaleIn {
          0% {
            opacity: 0;
            transform: scale(0.8);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

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