import React, { useState, useEffect, useCallback } from 'react';
import { useAuth, useTheme, RAZORPAY_KEY_ID } from '../App';
import { Clock, Trophy, Award, Zap, Loader, CheckCircle, XCircle, Monitor, Smartphone, Lock, Unlock, TrendingUp, AlertTriangle } from 'lucide-react';
import { SUBSCRIPTION_PLANS } from '../data/subscriptionPlans';
import MockTestInterface from '../components/MockTestInterface';
import NEETMockTestInterface from '../components/NEETMockTestInterface';
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
// ADMIN CHECK FUNCTION
// ==========================================
const isAdmin = (email) => {
  return email === 'luckyfaizu3@gmail.com';
};

// ==========================================
// DEFAULT PRICES (Fallback)
// ==========================================
const DEFAULT_PRICES = {
  basic: 99,
  advanced: 199,
  pro: 299
};

// ==========================================
// TIME UTILITIES
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

// ==========================================
// COUPON VALIDATION — GLOBAL
// ==========================================
const validateCoupon = async (code, level, originalPrice) => {
  if (!code || !code.trim()) return { valid: false, error: 'Please enter a coupon code' };
  const upperCode = code.trim().toUpperCase();
  try {
    const { collection, query, where, getDocs } = await import('firebase/firestore');
    let couponData = null;
    let couponId = null;

    const directSnap = await getDoc(doc(db, 'coupons', upperCode));
    if (directSnap.exists()) {
      couponData = directSnap.data();
      couponId = directSnap.id;
    } else {
      const q = query(collection(db, 'coupons'), where('code', '==', upperCode));
      const snap = await getDocs(q);
      if (!snap.empty) {
        couponData = snap.docs[0].data();
        couponId = snap.docs[0].id;
      }
    }

    if (!couponData) return { valid: false, error: '❌ Invalid coupon code' };
    if (!couponData.active) return { valid: false, error: '❌ This coupon is not active' };

    const scope = couponData.scope || couponData.subject || 'global';
    const isGlobal = scope === 'global' || scope === 'all';
    const isNeetScope = level === 'neet' && (scope === 'neet' || isGlobal);
    if (!isGlobal && !isNeetScope && scope !== level) {
      return { valid: false, error: `❌ This coupon is only valid for the ${scope} test` };
    }

    if (couponData.expiry && new Date() > new Date(couponData.expiry)) {
      return { valid: false, error: '❌ This coupon has expired' };
    }

    if (couponData.usageLimit && (couponData.usedCount || 0) >= couponData.usageLimit) {
      return { valid: false, error: '❌ This coupon has reached its usage limit' };
    }

    let discountAmount = 0;
    if (couponData.type === 'flat') {
      discountAmount = couponData.discount;
    } else {
      discountAmount = Math.round((originalPrice * couponData.discount) / 100);
    }

    const finalPrice = Math.max(0, originalPrice - discountAmount);
    const isFree = finalPrice === 0;

    return {
      valid: true,
      couponId,
      couponData,
      discountAmount,
      finalPrice,
      isFree,
      discountText: couponData.type === 'flat' ? `₹${discountAmount} off` : `${couponData.discount}% off`,
      message: isFree ? `🎉 100% off! You get this test for free!` : `✅ ${couponData.type === 'flat' ? `₹${discountAmount}` : `${couponData.discount}%`} discount applied!`
    };
  } catch (err) {
    console.error('Coupon validation error:', err);
    return { valid: false, error: '❌ Error checking coupon. Please try again.' };
  }
};

const markCouponUsed = async (couponId) => {
  try {
    const { updateDoc, increment } = await import('firebase/firestore');
    await updateDoc(doc(db, 'coupons', couponId), { usedCount: increment(1) });
  } catch (e) {
    console.error('Coupon mark used error:', e);
  }
};

// ==========================================
// COUPON MODAL COMPONENT
// ==========================================
function CouponModal({ plan, prices, isDark, onClose, onFreeAccess, onProceedPayment }) {
  const [couponCode, setCouponCode] = useState('');
  const [couponResult, setCouponResult] = useState(null);
  const [checking, setChecking] = useState(false);
  const originalPrice = prices[plan.level] || plan.price;

  const handleCheck = async () => {
    if (!couponCode.trim()) return;
    setChecking(true);
    setCouponResult(null);
    const result = await validateCoupon(couponCode, plan.level, originalPrice);
    setCouponResult(result);
    setChecking(false);
  };

  const handleApply = async () => {
    if (!couponResult?.valid) return;
    await markCouponUsed(couponResult.couponId);
    if (couponResult.isFree) {
      onFreeAccess(couponResult);
    } else {
      onProceedPayment(couponResult.finalPrice, couponResult);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.75)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 99999, backdropFilter: 'blur(8px)',
      padding: '1rem'
    }}>
      <div style={{
        background: isDark ? '#1e293b' : '#fff',
        borderRadius: '24px',
        padding: 'clamp(1.5rem, 4vw, 2.5rem)',
        maxWidth: '460px', width: '100%',
        boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
        border: `2px solid ${isDark ? 'rgba(99,102,241,0.3)' : 'rgba(99,102,241,0.2)'}`
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 'clamp(1.1rem,3vw,1.4rem)', fontWeight: '900', color: isDark ? '#e2e8f0' : '#1e293b' }}>
              🎟️ Coupon Code
            </h3>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: isDark ? '#64748b' : '#94a3b8' }}>
              {plan.name} — ₹{originalPrice}
            </p>
          </div>
          <button onClick={onClose} style={{
            background: isDark ? 'rgba(255,255,255,0.08)' : '#f1f5f9',
            border: 'none', borderRadius: '10px', width: '36px', height: '36px',
            cursor: 'pointer', fontSize: '1.1rem', display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: isDark ? '#94a3b8' : '#64748b', flexShrink: 0
          }}>✕</button>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1rem' }}>
          <input
            type="text"
            placeholder="Enter coupon code..."
            value={couponCode}
            onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponResult(null); }}
            onKeyDown={e => e.key === 'Enter' && handleCheck()}
            style={{
              flex: 1, padding: '0.85rem 1rem',
              border: `2px solid ${couponResult?.valid ? '#10b981' : couponResult?.valid === false ? '#ef4444' : isDark ? 'rgba(255,255,255,0.15)' : '#e2e8f0'}`,
              borderRadius: '12px', fontSize: '0.95rem', fontWeight: '700',
              fontFamily: 'monospace', letterSpacing: '1px',
              background: isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc',
              color: isDark ? '#e2e8f0' : '#1e293b', outline: 'none'
            }}
          />
          <button onClick={handleCheck} disabled={checking || !couponCode.trim()} style={{
            padding: '0.85rem 1.1rem',
            background: checking || !couponCode.trim() ? '#e2e8f0' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            border: 'none', borderRadius: '12px',
            color: checking || !couponCode.trim() ? '#94a3b8' : '#fff',
            fontWeight: '700', cursor: checking || !couponCode.trim() ? 'not-allowed' : 'pointer',
            fontSize: '0.85rem', whiteSpace: 'nowrap'
          }}>
            {checking ? '⏳' : 'Check'}
          </button>
        </div>

        {couponResult && (
          <div style={{
            padding: '1rem', borderRadius: '12px', marginBottom: '1rem',
            background: couponResult.valid ? (isDark ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.1)') : (isDark ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.1)'),
            border: `2px solid ${couponResult.valid ? '#10b981' : '#ef4444'}`
          }}>
            {couponResult.valid ? (
              <>
                <div style={{ fontWeight: '800', color: '#10b981', marginBottom: '0.5rem', fontSize: '0.95rem' }}>
                  {couponResult.message}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: '0.85rem', textDecoration: 'line-through' }}>₹{originalPrice}</span>
                  <span style={{ fontSize: '0.7rem', color: '#10b981' }}>→</span>
                  <span style={{ fontSize: '1.4rem', fontWeight: '900', color: couponResult.isFree ? '#8b5cf6' : '#10b981' }}>
                    {couponResult.isFree ? '🆓 FREE' : `₹${couponResult.finalPrice}`}
                  </span>
                  <span style={{ background: '#10b981', color: '#fff', padding: '0.15rem 0.5rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: '700' }}>
                    {couponResult.discountText}
                  </span>
                </div>
              </>
            ) : (
              <div style={{ fontWeight: '700', color: '#ef4444', fontSize: '0.9rem' }}>{couponResult.error}</div>
            )}
          </div>
        )}

        <div style={{
          padding: '0.85rem 1rem', borderRadius: '12px', marginBottom: '1.5rem',
          background: isDark ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.05)',
          border: `1px solid ${isDark ? 'rgba(99,102,241,0.25)' : 'rgba(99,102,241,0.15)'}`
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.85rem', color: isDark ? '#94a3b8' : '#64748b' }}>Original Price</span>
            <span style={{ fontWeight: '700', color: isDark ? '#e2e8f0' : '#1e293b' }}>₹{originalPrice}</span>
          </div>
          {couponResult?.valid && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
              <span style={{ fontSize: '0.85rem', color: '#10b981' }}>Discount ({couponResult.discountText})</span>
              <span style={{ fontWeight: '700', color: '#10b981' }}>− ₹{couponResult.discountAmount}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.5rem', borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}` }}>
            <span style={{ fontWeight: '800', color: isDark ? '#e2e8f0' : '#1e293b' }}>Final Amount</span>
            <span style={{ fontSize: '1.1rem', fontWeight: '900', color: '#6366f1' }}>
              {couponResult?.valid ? (couponResult.isFree ? '₹0 (FREE!)' : `₹${couponResult.finalPrice}`) : `₹${originalPrice}`}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {couponResult?.valid && (
            <button onClick={handleApply} style={{
              width: '100%', padding: '1rem',
              background: couponResult.isFree ? 'linear-gradient(135deg, #8b5cf6, #6366f1)' : 'linear-gradient(135deg, #10b981, #059669)',
              border: 'none', borderRadius: '14px', color: '#fff',
              fontSize: '1rem', fontWeight: '800', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
            }}>
              {couponResult.isFree ? <><Zap size={20} /> 🆓 Start Free Test!</> : <><CheckCircle size={20} /> Pay ₹{couponResult.finalPrice}</>}
            </button>
          )}
          <button onClick={() => onProceedPayment(originalPrice, null)} style={{
            width: '100%', padding: '0.85rem', background: 'transparent',
            border: `2px solid ${isDark ? 'rgba(99,102,241,0.4)' : 'rgba(99,102,241,0.3)'}`,
            borderRadius: '14px', color: '#6366f1', fontSize: '0.9rem', fontWeight: '700', cursor: 'pointer'
          }}>
            No coupon — Pay Full ₹{originalPrice}
          </button>
          <button onClick={onClose} style={{
            width: '100%', padding: '0.65rem', background: 'transparent', border: 'none',
            color: isDark ? '#475569' : '#94a3b8', fontSize: '0.85rem', cursor: 'pointer'
          }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

function MockTestPage() {
  const { user } = useAuth();
  const { isDark } = useTheme();

  // Test Flow States
  const [currentStep, setCurrentStep] = useState('plans');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [testQuestions, setTestQuestions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Tab State
  const [activeTab, setActiveTab] = useState('tests');

  // NEET State
  const [neetStep, setNeetStep] = useState('info');
  const [neetQuestions, setNeetQuestions] = useState([]);
  const [neetLoading, setNeetLoading] = useState(false);

  // Dynamic Prices from Firebase
  const [prices, setPrices] = useState(DEFAULT_PRICES);

  // User Data
  const [userDetails, setUserDetails] = useState(null);
  const [userCertificates, setUserCertificates] = useState([]);
  const [testHistory, setTestHistory] = useState([]);
  const [selectedCertificate, setSelectedCertificate] = useState(null);

  // Test Results
  const [testResults, setTestResults] = useState(null);

  // Payment & Status Data
  const [paymentDetails, setPaymentDetails] = useState({});
  const [testStatus, setTestStatus] = useState({});

  // Delete Confirmation Dialog
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [testToDelete, setTestToDelete] = useState(null);

  // Certificate Delete Dialog
  const [showDeleteCertDialog, setShowDeleteCertDialog] = useState(false);
  const [certToDelete, setCertToDelete] = useState(null);

  // Coupon Modal State
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [couponPlan, setCouponPlan] = useState(null);

  // Tab slide animation state
  const [slideDir, setSlideDir] = React.useState('none');
  const touchStartX = React.useRef(null);

  // ==========================================
  // Fetch Prices from Firebase
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
      console.error('Error fetching prices:', error);
      setPrices(DEFAULT_PRICES);
    }
  };

  // ==========================================
  // Calculate Test Status
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
          message: 'Test available — Grace period active',
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
          message: `Locked — Available in ${formatTimeRemaining(lockEnd - now)}`,
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

  const loadUserData = useCallback(async () => {
    setLoading(true);
    try {
      console.log('Loading user data for:', user.uid);

      const detailsResult = await getUserDetails(user.uid);
      if (detailsResult.success) {
        setUserDetails(detailsResult.details);
      }

      const certsResult = await getAllCertificates(user.uid);
      if (certsResult.success) {
        setUserCertificates(certsResult.certificates);
      }

      const historyResult = await getTestHistory(user.uid);
      if (historyResult.success) {
        setTestHistory(historyResult.tests);
      }

      const statusData = {};
      const paymentData = {};

      for (const level of ['basic', 'advanced', 'pro', 'neet']) {
        const payment = await getPaymentDetails(user.uid, level);
        paymentData[level] = payment;
        const status = calculateTestStatus(payment, level);
        statusData[level] = status;
      }

      setPaymentDetails(paymentData);
      setTestStatus(statusData);

    } catch (error) {
      console.error('Error loading user data:', error);
      window.showToast?.('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadUserData();
    }
    fetchPrices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // ==========================================
  // PAYMENT — coupon support included
  // ==========================================
  const handlePayment = (plan, finalPrice = null, couponResult = null) => {
    if (!user) {
      window.showToast?.('⚠️ Please login first!', 'warning');
      return;
    }

    if (!window.Razorpay) {
      window.showToast?.('⚠️ Payment system loading... Please wait!', 'warning');
      return;
    }

    const dynamicPrice = finalPrice ?? (prices[plan.level] || plan.price);

    const options = {
      key: RAZORPAY_KEY_ID,
      amount: dynamicPrice * 100,
      currency: "INR",
      name: "FaizUpyZone",
      description: `${plan.name} - Mock Test${couponResult ? ` (${couponResult.discountText} off)` : ''}`,
      image: "https://img.icons8.com/fluency/96/000000/python.png",
      handler: async function (response) {
        window.showToast?.('✅ Payment Successful!', 'success');

        const now = new Date();
        const purchaseValidUntil = new Date(now.getTime() + 12 * 60 * 60 * 1000);

        const paymentData = {
          level: plan.level,
          amount: dynamicPrice,
          originalAmount: prices[plan.level] || plan.price,
          paymentId: response.razorpay_payment_id,
          couponCode: couponResult?.couponData?.code || null,
          couponDiscount: couponResult?.discountAmount || 0,
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
      console.error('Error opening Razorpay:', error);
      window.showToast?.('❌ Failed to open payment', 'error');
    }
  };

  // ==========================================
  // FREE COUPON UNLOCK
  // ==========================================
  const handleFreeUnlock = async (plan, couponResult) => {
    setShowCouponModal(false);
    window.showToast?.('🆓 Free test unlocked via coupon!', 'success');

    const now = new Date();
    const purchaseValidUntil = new Date(now.getTime() + 12 * 60 * 60 * 1000);

    const paymentData = {
      level: plan.level,
      amount: 0,
      originalAmount: prices[plan.level] || plan.price,
      paymentId: 'FREE_COUPON',
      couponCode: couponResult.couponData?.code || null,
      couponDiscount: couponResult.discountAmount || 0,
      isFree: true,
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
      window.showToast?.('🆓 Free test unlocked! Valid for 12 hours', 'success');
      await loadUserData();
      setSelectedPlan(plan);
      setCurrentStep('form');
    } else {
      window.showToast?.('❌ Free unlock failed', 'error');
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
      console.error('Error saving details:', error);
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
      console.error('Error loading questions:', error);
      window.showToast?.('❌ Failed to load questions', 'error');
      setCurrentStep('plans');
      setSelectedPlan(null);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // handleTestComplete with NEET support
  // ==========================================
  const handleTestComplete = useCallback(async (results) => {
    if (!selectedPlan) return;

    console.log('🎯 [MockTestPage] Test completed, received results:', results);
    setLoading(true);

    try {
      const now = new Date();
      const lockStartsAt = now;
      const lockEndsAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      if (selectedPlan?.level !== 'neet') {
        await updateTestAttempt(user.uid, selectedPlan.level, {
          testSubmittedAt: now.toISOString(),
          resultsViewedAt: now.toISOString(),
          lockStartsAt: lockStartsAt.toISOString(),
          lockEndsAt: lockEndsAt.toISOString()
        });
      }

      const testData = {
        planId: selectedPlan?.id || 'unknown',
        planName: selectedPlan?.name || 'NEET Mock Test',
        level: selectedPlan?.level || 'neet',
        score: selectedPlan?.level === 'neet'
          ? Math.round(Math.max(0, (results.score / 720)) * 100)
          : results.percentage,
        rawScore: selectedPlan?.level === 'neet' ? results.score : null,
        maxScore: selectedPlan?.level === 'neet' ? 720 : null,
        testType: selectedPlan?.level === 'neet' ? 'neet' : 'python',
        subjectScores: selectedPlan?.level === 'neet' ? results.subjectScores : null,
        correct: results.correct,
        wrong: results.wrong,
        total: results.total,
        passed: results.percentage >= 55,
        timeTaken: results.timeTaken,
        tabSwitches: results.tabSwitches || 0,
        correctQuestions: results.correctQuestions || [],
        wrongQuestions: results.wrongQuestions || [],
        penalized: results.penalized || false,
        studentInfo: results.studentInfo || userDetails || {
          fullName: user.displayName || user.email.split('@')[0],
          email: user.email,
          age: 'N/A',
          address: 'N/A'
        },
        testDate: now.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }),
        testTime: now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        completedAt: now.toISOString()
      };

      await saveTestResult(user.uid, testData);

      if (selectedPlan?.level !== 'neet') {
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

            const certResult = await issueCertificate(user.uid, certificateData);

            if (certResult.success) {
              window.showToast?.(
                isAdmin(user.email)
                  ? '🔓 Admin Certificate issued!'
                  : '🎉 Certificate issued!',
                'success'
              );
              setUserCertificates(prev => [...prev, certResult.certificate]);
            } else {
              console.error('Certificate issue failed:', certResult);
              window.showToast?.(`❌ ${certResult.error || 'Certificate issue failed'}`, 'error');
            }
          } else {
            window.showToast?.('ℹ️ You already have a certificate for this level', 'info');
          }
        } else {
          window.showToast?.('💪 Score 55% or above to earn a certificate!', 'info');
        }
      }

      setTestResults(results);
      setCurrentStep('results');
      await loadUserData();

    } catch (error) {
      console.error('❌ Error processing test completion:', error);
      window.showToast?.('❌ Error saving results', 'error');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPlan, user, userDetails]);

  // ==========================================
  // ✅ FIX 1: handleNeetTestComplete — standalone
  // ==========================================
  const handleNeetTestComplete = useCallback(async (neetResults) => {
    setLoading(true);
    try {
      const now = new Date();
      const pct = Math.round(Math.max(0, (neetResults.score / 720)) * 100);
      const testData = {
        planId: 'neet',
        planName: 'NEET Mock Test',
        level: 'neet',
        testType: 'neet',
        score: pct,
        rawScore: neetResults.score,
        maxScore: 720,
        subjectScores: neetResults.subjectScores || null,
        correct: neetResults.correct,
        wrong: neetResults.wrong,
        skipped: neetResults.skipped || 0,
        total: neetResults.total,
        passed: pct >= 55,
        timeTaken: neetResults.timeTaken,
        tabSwitches: neetResults.tabSwitches || 0,
        penalized: neetResults.penalized || false,
        disqualificationReason: neetResults.disqualificationReason || '',
        studentInfo: neetResults.studentInfo || {
          fullName: user.displayName || user.email.split('@')[0],
          email: user.email,
        },
        testDate: now.toLocaleDateString('en-IN', {
          day: '2-digit', month: 'long', year: 'numeric'
        }),
        testTime: now.toLocaleTimeString('en-IN', {
          hour: '2-digit', minute: '2-digit'
        }),
        completedAt: now.toISOString()
      };
      await saveTestResult(user.uid, testData);
      console.log('✅ NEET saved to user mockTestResults');

      const { collection, addDoc } = await import('firebase/firestore');
      await addDoc(collection(db, 'leaderboard'), {
        name: neetResults.studentInfo?.fullName || neetResults.studentInfo?.name || user.displayName || 'Anonymous',
        email: user.email,
        userId: user.uid,
        percentage: pct,
        score: `${neetResults.correct}/${neetResults.total}`,
        rawScore: neetResults.score,
        maxScore: 720,
        testTitle: 'NEET Mock Test',
        testLevel: 'neet',
        timeTaken: neetResults.timeTaken,
        passed: pct >= 55,
        penalized: neetResults.penalized || false,
        disqualificationReason: neetResults.disqualificationReason || '',
        subjectScores: neetResults.subjectScores || {},
        date: now.toLocaleDateString('en-GB'),
        timestamp: Date.now()
      });
      console.log('✅ NEET saved to leaderboard');

      const lockStartsAt = now;
      const lockEndsAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      await updateTestAttempt(user.uid, 'neet', {
        testSubmittedAt: now.toISOString(),
        resultsViewedAt: now.toISOString(),
        lockStartsAt: lockStartsAt.toISOString(),
        lockEndsAt: lockEndsAt.toISOString()
      });

      setSelectedPlan({ id: 'neet', name: 'NEET Mock Test', level: 'neet', timeLimit: 180 });
      setTestResults(neetResults);
      setCurrentStep('results');
      await loadUserData();
    } catch (error) {
      console.error('❌ NEET save error:', error);
      window.showToast?.('❌ Error: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [user, loadUserData]);

  const handleExitTest = async () => {
    if (window.confirm('⚠️ Are you sure? Your progress will be lost!')) {
      console.log('Exiting test, returning to plans');
      backToPlans();
    }
  };

  const backToPlans = () => {
    try {
      if (document.fullscreenElement ||
          document.webkitFullscreenElement ||
          document.msFullscreenElement ||
          document.mozFullScreenElement) {
        if (document.exitFullscreen) document.exitFullscreen();
        else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
        else if (document.msExitFullscreen) document.msExitFullscreen();
        else if (document.mozCancelFullScreen) document.mozCancelFullScreen();
      }
    } catch (err) {
      console.log('Fullscreen exit:', err.message);
    }

    window.onbeforeunload = null;
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

    setCurrentStep('plans');
    setSelectedPlan(null);
    setTestQuestions([]);
    setTestResults(null);

    loadUserData();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ==========================================
  // handleSelectPlan — coupon modal included
  // ==========================================
  const handleSelectPlan = async (plan) => {
    if (!user) {
      window.showToast?.('⚠️ Please login first!', 'warning');
      return;
    }

    setSelectedPlan(plan);

    if (isAdmin(user.email)) {
      window.showToast?.('🔓 Admin access — Free test!', 'success');

      if (!userDetails) {
        setCurrentStep('form');
        return;
      }

      await startTest(plan);
      return;
    }

    const status = testStatus[plan.level];

    if (status?.status === 'locked') {
      window.showToast?.(status.message, 'warning');
      return;
    }

    if (paymentDetails[plan.level]?.hasPaid && status?.status !== 'available') {
      if (!userDetails) {
        setCurrentStep('form');
        return;
      }
      await startTest(plan);
      return;
    }

    setCouponPlan(plan);
    setShowCouponModal(true);
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
      console.error('Error deleting result:', error);
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
      console.error('Error deleting certificate:', error);
      window.showToast?.('❌ Failed to delete certificate', 'error');
    }
  };

  const handleCancelCertDelete = () => {
    setShowDeleteCertDialog(false);
    setCertToDelete(null);
  };

  if (loading && currentStep === 'plans') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader className="spin" size={48} color="#6366f1" />
          <p style={{ marginTop: '16px', color: isDark ? '#94a3b8' : '#64748b' }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (currentStep === 'test' && testQuestions.length > 0) {
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

  const TABS = [
    { key: 'tests',        emoji: '🐍', label: 'Tests'   },
    { key: 'neet',         emoji: '🧬', label: 'NEET'    },
    { key: 'certificates', emoji: '🏆', label: 'Certs',  badge: userCertificates.length },
    { key: 'results',      emoji: '📊', label: 'Results', badge: testHistory.length },
  ];

  const handleTabChange = (key) => {
    const newIdx = TABS.findIndex(t => t.key === key);
    const oldIdx = TABS.findIndex(t => t.key === activeTab);
    setSlideDir(newIdx > oldIdx ? 'left' : 'right');

    // ✅ FIX 2: NEET tab switch pe state reset karo
    if (key === 'neet') {
      setNeetStep('info');
      setNeetQuestions([]);
    }

    setActiveTab(key);
  };

  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) < 50) return;
    const curIdx = TABS.findIndex(t => t.key === activeTab);
    if (diff > 0 && curIdx < TABS.length - 1) handleTabChange(TABS[curIdx + 1].key);
    else if (diff < 0 && curIdx > 0) handleTabChange(TABS[curIdx - 1].key);
    touchStartX.current = null;
  };

  const tabStyle = (tabName) => ({
    flex: 1,
    padding: 'clamp(0.5rem, 2vw, 0.85rem) clamp(0.25rem, 1.5vw, 0.75rem)',
    borderRadius: '12px',
    border: 'none',
    cursor: 'pointer',
    fontWeight: '700',
    fontSize: 'clamp(0.65rem, 1.8vw, 0.88rem)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.1rem',
    transition: 'all 0.28s cubic-bezier(0.34,1.56,0.64,1)',
    background: activeTab === tabName
      ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
      : 'transparent',
    color: activeTab === tabName ? '#fff' : isDark ? '#94a3b8' : '#64748b',
    boxShadow: activeTab === tabName ? '0 4px 14px rgba(99,102,241,0.4)' : 'none',
    transform: activeTab === tabName ? 'translateY(-2px) scale(1.05)' : 'scale(1)',
    whiteSpace: 'nowrap',
    minWidth: 0,
    position: 'relative',
    overflow: 'hidden',
  });

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{
        minHeight: '100vh',
        background: isDark
          ? 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)'
          : 'linear-gradient(135deg, #f0f4ff 0%, #fdf2f8 100%)',
        paddingTop: '100px',
        paddingBottom: '3rem',
        padding: '100px 1rem 3rem'
      }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem', animation: 'fadeInUp 0.6s ease' }}>
          <h1 style={{ fontSize: 'clamp(2rem, 6vw, 4rem)', fontWeight: '900', color: isDark ? '#e2e8f0' : '#1e293b', marginBottom: '1rem', textShadow: isDark ? '0 4px 20px rgba(0,0,0,0.3)' : 'none' }}>
            🐍 Python Mock Tests
          </h1>
          <p style={{ fontSize: 'clamp(0.9rem, 3vw, 1.2rem)', color: isDark ? '#94a3b8' : '#64748b', maxWidth: '600px', margin: '0 auto 2rem', padding: '0 1rem' }}>
            Professional certification tests with instant results
          </p>
          <button
            onClick={() => window.location.href = '/'}
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', color: '#fff', padding: 'clamp(0.75rem, 2vw, 1rem) clamp(1.5rem, 4vw, 2.5rem)', borderRadius: '12px', fontSize: 'clamp(0.85rem, 2.5vw, 1rem)', fontWeight: '700', cursor: 'pointer', transition: 'all 0.3s ease', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', boxShadow: '0 4px 15px rgba(99,102,241,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px' }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(99,102,241,0.5)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(99,102,241,0.4)'; }}
          >
            🏠 Back to Home
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '0.35rem', background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', borderRadius: '16px', padding: '5px', marginBottom: '2rem', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`, maxWidth: '640px', margin: '0 auto 2rem', overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {TABS.map(tab => (
            <button key={tab.key} style={tabStyle(tab.key)} onClick={() => handleTabChange(tab.key)}>
              <span style={{ fontSize: 'clamp(1rem, 3vw, 1.15rem)', lineHeight: 1 }}>{tab.emoji}</span>
              <span style={{ lineHeight: 1 }}>{tab.label}</span>
              {tab.badge > 0 && (
                <span style={{ position: 'absolute', top: '4px', right: '4px', background: activeTab === tab.key ? 'rgba(255,255,255,0.35)' : 'rgba(99,102,241,0.25)', color: activeTab === tab.key ? '#fff' : '#6366f1', borderRadius: '20px', padding: '0 5px', fontSize: '0.6rem', fontWeight: '800', lineHeight: '1.4', minWidth: '14px', textAlign: 'center' }}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Swipe hint */}
        <div style={{ textAlign: 'center', fontSize: '0.72rem', color: isDark ? '#475569' : '#94a3b8', marginTop: '-1.4rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}>
          ← Swipe to switch tabs →
        </div>

        {/* Tests Tab */}
        {activeTab === 'tests' && (
          <div style={{ animation: `${slideDir === 'right' ? 'slideInRight' : 'slideInLeft'} 0.35s cubic-bezier(0.25,0.46,0.45,0.94) both` }}>
            <>
              {/* Guidelines Banner */}
              <div style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(236,72,153,0.15))', border: `2px solid ${isDark ? 'rgba(99,102,241,0.4)' : 'rgba(99,102,241,0.3)'}`, borderRadius: '20px', padding: 'clamp(1rem, 3vw, 1.5rem)', marginBottom: '3rem', animation: 'fadeInUp 0.8s ease' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                  <div style={{ width: 'clamp(50px, 12vw, 70px)', height: 'clamp(50px, 12vw, 70px)', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(99,102,241,0.4)' }}>
                    <Monitor size={window.innerWidth < 768 ? 24 : 32} color="#fff" />
                  </div>
                  <h3 style={{ fontSize: 'clamp(1.2rem, 3.5vw, 1.8rem)', fontWeight: '900', color: isDark ? '#e2e8f0' : '#1e293b', margin: 0 }}>⚠️ Important Guidelines</h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                  {[
                    { icon: <Monitor size={18} />, title: 'Desktop Mode', desc: 'For best experience, use desktop site mode on mobile or a laptop/computer.', color: '#6366f1', bg: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.2)', bgDark: 'rgba(99,102,241,0.2)', borderDark: 'rgba(99,102,241,0.3)' },
                    { icon: <Clock size={18} />, title: '12-Hour Window', desc: 'After purchase, you have 12 hours to start the test. No refunds if time expires.', color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)', bgDark: 'rgba(16,185,129,0.2)', borderDark: 'rgba(16,185,129,0.3)' },
                    { icon: <Lock size={18} />, title: '7-Day Lock', desc: 'After viewing results, the test locks for 7 days. Repurchase to try again.', color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.2)', bgDark: 'rgba(239,68,68,0.2)', borderDark: 'rgba(239,68,68,0.3)' },
                    { icon: <Trophy size={18} />, title: 'Pass Mark: 55%', desc: 'Score 55% or above to receive your certificate (one per level, lifetime).', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)', bgDark: 'rgba(245,158,11,0.2)', borderDark: 'rgba(245,158,11,0.3)' },
                  ].map((item, i) => (
                    <div key={i} style={{ padding: 'clamp(0.75rem, 2vw, 1rem)', background: isDark ? item.bgDark : item.bg, borderRadius: '12px', border: `1px solid ${isDark ? item.borderDark : item.border}` }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: item.color, fontWeight: '700', fontSize: 'clamp(0.85rem, 2.5vw, 1rem)' }}>{item.icon}{item.title}</div>
                      <p style={{ fontSize: 'clamp(0.75rem, 2vw, 0.85rem)', color: isDark ? '#cbd5e1' : '#475569', margin: 0, lineHeight: '1.5' }}>{item.desc}</p>
                    </div>
                  ))}
                </div>
                <div style={{ padding: 'clamp(0.75rem, 2vw, 1rem)', background: isDark ? 'rgba(245,158,11,0.15)' : 'rgba(245,158,11,0.1)', borderRadius: '12px', border: `2px dashed ${isDark ? 'rgba(245,158,11,0.4)' : 'rgba(245,158,11,0.3)'}`, display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  <Smartphone size={20} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <div style={{ fontWeight: '700', color: '#f59e0b', marginBottom: '0.5rem', fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)' }}>📱 How to Enable Desktop Mode on Mobile:</div>
                    <div style={{ fontSize: 'clamp(0.75rem, 2vw, 0.85rem)', color: isDark ? '#cbd5e1' : '#475569', lineHeight: '1.5' }}>Browser Menu (⋮) → "Desktop site" → Enable → Refresh page</div>
                  </div>
                </div>
              </div>

              {/* Plans Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))', gap: '2rem', marginBottom: '3rem' }}>
                {Object.values(SUBSCRIPTION_PLANS).map((plan, index) => {
                  const status = testStatus[plan.level] || {};
                  const hasCert = userCertificates.find(c => c.level === plan.level);
                  const userIsAdmin = isAdmin(user?.email);
                  let timeRemainingDisplay = '';
                  if (status.timeRemaining) timeRemainingDisplay = formatTimeRemaining(status.timeRemaining);

                  return (
                    <div key={plan.id} style={{ background: isDark ? '#1e293b' : '#fff', borderRadius: '24px', padding: 'clamp(1.5rem, 4vw, 2rem)', boxShadow: '0 10px 40px rgba(0,0,0,0.2)', position: 'relative', overflow: 'hidden', animation: `fadeInUp 0.6s ease ${index * 0.1}s backwards`, border: plan.badge ? '3px solid #fbbf24' : userIsAdmin ? '3px solid #10b981' : 'none' }}>
                      {userIsAdmin && (<div style={{ position: 'absolute', top: '1rem', left: '1rem', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', padding: '0.5rem 1rem', borderRadius: '20px', fontSize: 'clamp(0.65rem, 2vw, 0.75rem)', fontWeight: '700', boxShadow: '0 4px 12px rgba(16,185,129,0.4)' }}>🔓 ADMIN FREE</div>)}
                      {plan.badge && !userIsAdmin && (<div style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', color: '#fff', padding: '0.5rem 1rem', borderRadius: '20px', fontSize: 'clamp(0.65rem, 2vw, 0.75rem)', fontWeight: '700', boxShadow: '0 4px 12px rgba(251,191,36,0.4)' }}>{plan.badge}</div>)}
                      <div style={{ textAlign: 'center', marginBottom: '1.5rem', marginTop: userIsAdmin || plan.badge ? '2.5rem' : '0' }}>
                        <div style={{ width: 'clamp(60px, 15vw, 80px)', height: 'clamp(60px, 15vw, 80px)', background: plan.level === 'basic' ? 'linear-gradient(135deg, #10b981, #059669)' : plan.level === 'advanced' ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'linear-gradient(135deg, #f59e0b, #d97706)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', fontSize: 'clamp(1.5rem, 5vw, 2.5rem)', boxShadow: '0 8px 20px rgba(0,0,0,0.15)' }}>
                          {plan.level === 'basic' ? '🌱' : plan.level === 'advanced' ? '🔥' : '⭐'}
                        </div>
                        <h2 style={{ fontSize: 'clamp(1.3rem, 4vw, 1.8rem)', fontWeight: '900', color: isDark ? '#e2e8f0' : '#1e293b', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px' }}>{plan.level}</h2>
                        <p style={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: 'clamp(0.8rem, 2.5vw, 0.95rem)', marginBottom: '1rem' }}>{plan.description}</p>
                        <div style={{ fontSize: 'clamp(2rem, 6vw, 2.5rem)', fontWeight: '900', color: userIsAdmin ? '#10b981' : '#6366f1', marginBottom: '0.5rem' }}>{userIsAdmin ? 'FREE' : `₹${prices[plan.level] || plan.price}`}</div>
                        {userIsAdmin && (<div style={{ fontSize: 'clamp(0.75rem, 2vw, 0.85rem)', color: '#10b981', fontWeight: '600' }}>Admin Privilege</div>)}
                      </div>
                      <div style={{ background: isDark ? 'rgba(99,102,241,0.05)' : 'rgba(99,102,241,0.03)', borderRadius: '16px', padding: '1.5rem', marginBottom: '1.5rem' }}>
                        {plan.features.map((feature, idx) => (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: idx === plan.features.length - 1 ? 0 : '0.75rem', fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)', color: isDark ? '#cbd5e1' : '#475569' }}>
                            <CheckCircle size={18} color="#10b981" style={{ flexShrink: 0 }} /><span>{feature}</span>
                          </div>
                        ))}
                      </div>
                      {userIsAdmin && (<div style={{ padding: '0.75rem', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '8px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: 'clamp(0.75rem, 2vw, 0.85rem)', color: '#10b981', fontWeight: '600' }}><CheckCircle size={16} />🔓 Admin — Unlimited Access</div>)}
                      {!userIsAdmin && status.status === 'grace_period' && (<div style={{ padding: '0.75rem', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '8px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: 'clamp(0.75rem, 2vw, 0.85rem)', color: '#10b981', fontWeight: '600' }}><Unlock size={16} />✅ Available — Grace Period: {timeRemainingDisplay}</div>)}
                      {!userIsAdmin && status.status === 'in_progress' && (<div style={{ padding: '0.75rem', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '8px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: 'clamp(0.75rem, 2vw, 0.85rem)', color: '#f59e0b', fontWeight: '600' }}><TrendingUp size={16} />📝 Test In Progress — Resume</div>)}
                      {hasCert && (<div style={{ padding: '0.75rem', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '8px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: 'clamp(0.75rem, 2vw, 0.85rem)', color: '#6366f1', fontWeight: '600' }}><Award size={16} />Certificate Earned (One per level)</div>)}
                      {!userIsAdmin && status.status === 'locked' && (<div style={{ padding: '0.75rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: 'clamp(0.75rem, 2vw, 0.85rem)', color: '#ef4444', fontWeight: '600' }}><Lock size={16} />🔒 Locked — {timeRemainingDisplay}</div>)}
                      <button
                        onClick={() => handleSelectPlan(plan)}
                        disabled={!userIsAdmin && status.status === 'locked'}
                        style={{ width: '100%', background: (!userIsAdmin && status.status === 'locked') ? 'rgba(99,102,241,0.3)' : userIsAdmin ? 'linear-gradient(135deg, #10b981, #059669)' : status.status === 'grace_period' || status.status === 'in_progress' ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', color: '#fff', padding: 'clamp(1rem, 3vw, 1.25rem)', borderRadius: '16px', fontSize: 'clamp(0.9rem, 2.5vw, 1.1rem)', fontWeight: '700', cursor: (!userIsAdmin && status.status === 'locked') ? 'not-allowed' : 'pointer', transition: 'all 0.3s ease', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', boxShadow: (!userIsAdmin && status.status === 'locked') ? 'none' : userIsAdmin ? '0 4px 20px rgba(16,185,129,0.4)' : status.status === 'grace_period' || status.status === 'in_progress' ? '0 4px 20px rgba(16,185,129,0.4)' : '0 4px 20px rgba(99,102,241,0.4)', textTransform: 'uppercase', letterSpacing: '1px', opacity: (!userIsAdmin && status.status === 'locked') ? 0.6 : 1 }}
                        onMouseEnter={(e) => { if (userIsAdmin || status.status !== 'locked') { e.currentTarget.style.transform = 'translateY(-2px)'; } }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                      >
                        {userIsAdmin ? (<><Zap size={24} /> 🔓 Start Free Test</>) : status.status === 'grace_period' || status.status === 'in_progress' ? (<><Zap size={24} /> {status.status === 'in_progress' ? 'Resume Test' : 'Start Test'}</>) : status.status === 'locked' ? (<><Lock size={24} /> 🔒 Locked — {timeRemainingDisplay}</>) : (<><Zap size={24} /> Buy / Coupon (₹{prices[plan.level] || plan.price})</>)}
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          </div>
        )}

        {/* Certificates Tab */}
        {activeTab === 'certificates' && (
          <div style={{ animation: `${slideDir === 'right' ? 'slideInRight' : 'slideInLeft'} 0.35s cubic-bezier(0.25,0.46,0.45,0.94) both` }}>
            <Certificatesection userCertificates={userCertificates} testHistory={[]} isDark={isDark} onViewCertificate={setSelectedCertificate} onDeleteCertificate={handleDeleteCertificate} onDeleteTest={handleDeleteClick} />
          </div>
        )}

        {/* Results Tab */}
        {activeTab === 'results' && (
          <div style={{ animation: `${slideDir === 'right' ? 'slideInRight' : 'slideInLeft'} 0.35s cubic-bezier(0.25,0.46,0.45,0.94) both` }}>
            <Certificatesection userCertificates={[]} testHistory={testHistory} isDark={isDark} onViewCertificate={setSelectedCertificate} onDeleteCertificate={handleDeleteCertificate} onDeleteTest={handleDeleteClick} />
          </div>
        )}

        {/* ✅ FIX 3: NEET Tab — wrapper div HATA DIYA, NEETTab directly render hoga */}
        {activeTab === 'neet' && (
          <NEETTab
            user={user}
            isDark={isDark}
            neetStep={neetStep}
            setNeetStep={setNeetStep}
            neetQuestions={neetQuestions}
            setNeetQuestions={setNeetQuestions}
            neetLoading={neetLoading}
            setNeetLoading={setNeetLoading}
            onNeetComplete={handleNeetTestComplete}
          />
        )}

        {selectedCertificate && (
          <CertificateViewer certificate={selectedCertificate} onClose={() => setSelectedCertificate(null)} />
        )}

        {/* Delete Test Result Dialog */}
        {showDeleteDialog && testToDelete && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, backdropFilter: 'blur(8px)', animation: 'fadeIn 0.3s ease', padding: '1rem' }}>
            <div style={{ background: isDark ? '#1e293b' : '#fff', padding: 'clamp(2rem, 5vw, 3rem)', borderRadius: '24px', maxWidth: '500px', width: '100%', boxShadow: '0 25px 50px rgba(0,0,0,0.5)', animation: 'scaleIn 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)', border: `3px solid ${isDark ? '#ef4444' : '#fecaca'}` }}>
              <div style={{ width: 'clamp(70px, 15vw, 90px)', height: 'clamp(70px, 15vw, 90px)', margin: '0 auto 1.5rem', background: 'linear-gradient(135deg, #ef4444, #dc2626)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 30px rgba(239,68,68,0.4)', animation: 'pulse 2s infinite' }}>
                <XCircle size={window.innerWidth < 768 ? 40 : 50} color="#fff" strokeWidth={2.5} />
              </div>
              <h2 style={{ fontSize: 'clamp(1.3rem, 4vw, 1.8rem)', fontWeight: '900', color: isDark ? '#e2e8f0' : '#1e293b', marginBottom: '1rem', textAlign: 'center', lineHeight: 1.3 }}>Delete Test Result?</h2>
              <div style={{ background: isDark ? 'rgba(239,68,68,0.1)' : 'rgba(254,202,202,0.3)', border: `2px solid ${isDark ? 'rgba(239,68,68,0.3)' : '#fecaca'}`, borderRadius: '16px', padding: '1.25rem', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: 'clamp(0.85rem, 2.5vw, 0.95rem)', fontWeight: '700', color: isDark ? '#fca5a5' : '#991b1b', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><AlertTriangle size={18} /> Test Details</div>
                <div style={{ fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)', color: isDark ? '#cbd5e1' : '#475569', lineHeight: 1.6 }}>
                  <div style={{ marginBottom: '0.5rem' }}><strong>Test:</strong> {testToDelete.planName}</div>
                  <div style={{ marginBottom: '0.5rem' }}><strong>Score:</strong> {testToDelete.score}%</div>
                  <div><strong>Date:</strong> {testToDelete.testDate || testToDelete.date}</div>
                </div>
              </div>
              <p style={{ fontSize: 'clamp(0.85rem, 2.5vw, 1rem)', color: isDark ? '#94a3b8' : '#64748b', textAlign: 'center', marginBottom: '2rem', lineHeight: 1.6 }}>⚠️ This action <strong>cannot be undone</strong>.</p>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <button onClick={handleCancelDelete} style={{ flex: 1, minWidth: '140px', padding: 'clamp(0.9rem, 2.5vw, 1.1rem)', background: isDark ? '#334155' : '#f1f5f9', border: `3px solid ${isDark ? '#475569' : '#e2e8f0'}`, borderRadius: '14px', color: isDark ? '#e2e8f0' : '#475569', fontSize: 'clamp(0.9rem, 2.5vw, 1rem)', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}><XCircle size={18} /> Cancel</button>
                <button onClick={handleConfirmDelete} style={{ flex: 1, minWidth: '140px', padding: 'clamp(0.9rem, 2.5vw, 1.1rem)', background: 'linear-gradient(135deg, #ef4444, #dc2626)', border: '3px solid #dc2626', borderRadius: '14px', color: '#fff', fontSize: 'clamp(0.9rem, 2.5vw, 1rem)', fontWeight: '800', cursor: 'pointer', boxShadow: '0 6px 20px rgba(239,68,68,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}><CheckCircle size={18} /> Yes, Delete</button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Certificate Dialog */}
        {showDeleteCertDialog && certToDelete && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, backdropFilter: 'blur(8px)', animation: 'fadeIn 0.3s ease', padding: '1rem' }}>
            <div style={{ background: isDark ? '#1e293b' : '#fff', padding: 'clamp(2rem, 5vw, 3rem)', borderRadius: '24px', maxWidth: '500px', width: '100%', boxShadow: '0 25px 50px rgba(0,0,0,0.5)', animation: 'scaleIn 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)', border: `3px solid ${isDark ? '#f59e0b' : '#fbbf24'}` }}>
              <div style={{ width: 'clamp(70px, 15vw, 90px)', height: 'clamp(70px, 15vw, 90px)', margin: '0 auto 1.5rem', background: 'linear-gradient(135deg, #f59e0b, #d97706)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 30px rgba(245,158,11,0.4)', animation: 'pulse 2s infinite' }}>
                <Award size={window.innerWidth < 768 ? 40 : 50} color="#fff" strokeWidth={2.5} />
              </div>
              <h2 style={{ fontSize: 'clamp(1.3rem, 4vw, 1.8rem)', fontWeight: '900', color: isDark ? '#e2e8f0' : '#1e293b', marginBottom: '1rem', textAlign: 'center', lineHeight: 1.3 }}>Delete Certificate?</h2>
              <div style={{ background: isDark ? 'rgba(245,158,11,0.1)' : 'rgba(251,191,36,0.2)', border: `2px solid ${isDark ? 'rgba(245,158,11,0.3)' : '#fbbf24'}`, borderRadius: '16px', padding: '1.25rem', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: 'clamp(0.85rem, 2.5vw, 0.95rem)', fontWeight: '700', color: isDark ? '#fbbf24' : '#92400e', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><AlertTriangle size={18} /> Certificate Details</div>
                <div style={{ fontSize: 'clamp(0.8rem, 2.5vw, 0.9rem)', color: isDark ? '#cbd5e1' : '#475569', lineHeight: 1.6 }}>
                  <div style={{ marginBottom: '0.5rem' }}><strong>Test:</strong> {certToDelete.testName}</div>
                  <div style={{ marginBottom: '0.5rem' }}><strong>Level:</strong> {certToDelete.level}</div>
                  <div style={{ marginBottom: '0.5rem' }}><strong>Score:</strong> {certToDelete.score}%</div>
                  <div><strong>ID:</strong> {certToDelete.certificateId}</div>
                </div>
              </div>
              <p style={{ fontSize: 'clamp(0.85rem, 2.5vw, 1rem)', color: isDark ? '#94a3b8' : '#64748b', textAlign: 'center', marginBottom: '2rem', lineHeight: 1.6 }}>⚠️ This will permanently delete your certificate.</p>
              <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <button onClick={handleCancelCertDelete} style={{ flex: 1, minWidth: '140px', padding: 'clamp(0.9rem, 2.5vw, 1.1rem)', background: isDark ? '#334155' : '#f1f5f9', border: `3px solid ${isDark ? '#475569' : '#e2e8f0'}`, borderRadius: '14px', color: isDark ? '#e2e8f0' : '#475569', fontSize: 'clamp(0.9rem, 2.5vw, 1rem)', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}><XCircle size={18} /> Cancel</button>
                <button onClick={handleConfirmCertDelete} style={{ flex: 1, minWidth: '140px', padding: 'clamp(0.9rem, 2.5vw, 1.1rem)', background: 'linear-gradient(135deg, #f59e0b, #d97706)', border: '3px solid #d97706', borderRadius: '14px', color: '#fff', fontSize: 'clamp(0.9rem, 2.5vw, 1rem)', fontWeight: '800', cursor: 'pointer', boxShadow: '0 6px 20px rgba(245,158,11,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}><CheckCircle size={18} /> Yes, Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* COUPON MODAL */}
      {showCouponModal && couponPlan && (
        <CouponModal
          plan={couponPlan}
          prices={prices}
          isDark={isDark}
          onClose={() => setShowCouponModal(false)}
          onFreeAccess={(couponResult) => handleFreeUnlock(couponPlan, couponResult)}
          onProceedPayment={(finalPrice, couponResult) => {
            setShowCouponModal(false);
            handlePayment(couponPlan, finalPrice, couponResult);
          }}
        />
      )}

      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(50px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes scaleIn { 0% { opacity: 0; transform: scale(0.8); } 100% { opacity: 1; transform: scale(1); } }
        @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
        @keyframes slideInLeft { from { opacity: 0; transform: translateX(-48px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes slideInRight { from { opacity: 0; transform: translateX(48px); } to { opacity: 1; transform: translateX(0); } }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        div::-webkit-scrollbar { display: none; }
        @media (max-width: 480px) { .tab-nav-wrap { padding: 4px !important; gap: 0.2rem !important; } }
        @media (max-width: 768px) { body { font-size: 14px; } }
      `}</style>
    </div>
  );
}

// ==========================================
// NEET TAB COMPONENT
// ==========================================
function NEETTab({ user, isDark, neetStep, setNeetStep, neetQuestions, setNeetQuestions, neetLoading, setNeetLoading, onNeetComplete }) {
  const [isMobile, setIsMobile] = React.useState(window.innerWidth <= 768);
  const [neetSettings, setNeetSettings] = React.useState(null);
  const [showCoupon, setShowCoupon] = React.useState(false);
  const [settingsLoaded, setSettingsLoaded] = React.useState(false);
  const [neetPaymentStatus, setNeetPaymentStatus] = React.useState(null);

  React.useEffect(() => {
    const h = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', h);
    loadNeetSettings();
    if (user) loadNeetPaymentStatus();
    return () => window.removeEventListener('resize', h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadNeetPaymentStatus = async () => {
    try {
      const { getPaymentDetails } = await import('../services/mockTestService');
      const payment = await getPaymentDetails(user.uid, 'neet');
      setNeetPaymentStatus(payment);
    } catch {
      setNeetPaymentStatus(null);
    }
  };

  const loadNeetSettings = async () => {
    try {
      const { doc, getDoc } = await import('firebase/firestore');
      const { db } = await import('../firebase');
      const snap = await getDoc(doc(db, 'settings', 'neetSettings'));
      if (snap.exists()) {
        setNeetSettings(snap.data());
      } else {
        setNeetSettings({ price: 299, salePrice: 0, saleEnabled: false, timeMinutes: 180 });
      }
      setSettingsLoaded(true);
    } catch {
      setNeetSettings({ price: 299, salePrice: 0, saleEnabled: false, timeMinutes: 180 });
      setSettingsLoaded(true);
    }
  };

  const getPrice = () => {
    if (!neetSettings) return 299;
    if (neetSettings.saleEnabled && neetSettings.salePrice > 0) return neetSettings.salePrice;
    return neetSettings.price || 299;
  };

  const getOriginalPrice = () => neetSettings?.price || 299;
  const isSaleOn = () => neetSettings?.saleEnabled && neetSettings?.salePrice > 0;

  const getNeetStatus = () => {
    const payment = neetPaymentStatus;
    if (!payment?.hasPaid) return { status: 'available' };
    const now = new Date();
    if (payment.purchaseValidUntil) {
      const gracePeriodEnd = new Date(payment.purchaseValidUntil);
      if (now < gracePeriodEnd && !payment.testSubmittedAt) {
        return { status: 'grace_period', timeRemaining: gracePeriodEnd - now };
      }
    }
    if (payment.testStartedAt && !payment.testSubmittedAt) {
      return { status: 'in_progress' };
    }
    if (payment.lockEndsAt) {
      const lockEnd = new Date(payment.lockEndsAt);
      if (now < lockEnd) {
        return { status: 'locked', timeRemaining: lockEnd - now };
      }
    }
    return { status: 'available' };
  };

  const saveNeetPayment = async (paymentId, finalPrice, couponResult) => {
    try {
      const { processMockTestPayment } = await import('../services/mockTestService');
      const now = new Date();
      const purchaseValidUntil = new Date(now.getTime() + 12 * 60 * 60 * 1000);
      const paymentData = {
        level: 'neet',
        amount: finalPrice,
        originalAmount: getOriginalPrice(),
        paymentId: paymentId,
        couponCode: couponResult?.couponData?.code || null,
        couponDiscount: couponResult?.discountAmount || 0,
        isFree: paymentId === 'FREE_COUPON',
        paidAt: now.toISOString(),
        purchaseValidUntil: purchaseValidUntil.toISOString(),
        testStartedAt: null,
        testSubmittedAt: null,
        resultsViewedAt: null,
        lockStartsAt: null,
        lockEndsAt: null
      };
      await processMockTestPayment(user.uid, 'neet', paymentData);
      await loadNeetPaymentStatus();
      window.showToast?.('✅ NEET test unlocked! Valid for 12 hours', 'success');
    } catch (err) {
      console.error('NEET payment save error:', err);
    }
  };

  const loadAllNeetQuestions = async () => {
    setNeetLoading(true);
    try {
      const { collection, getDocs } = await import('firebase/firestore');
      const { db } = await import('../firebase');

      if (user && user.email !== 'luckyfaizu3@gmail.com') {
        try {
          const { updateTestAttempt } = await import('../services/mockTestService');
          const now = new Date();
          await updateTestAttempt(user.uid, 'neet', { testStartedAt: now.toISOString() });
        } catch (e) {
          console.warn('Could not update testStartedAt:', e);
        }
      }

      const snap = await getDocs(collection(db, 'neetQuestions'));
      const allQs = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      if (allQs.length === 0) {
        window.showToast?.('❌ NEET questions not available yet. Admin please add questions.', 'error');
        setNeetLoading(false);
        return;
      }

      const subjects = ['Physics', 'Chemistry', 'Botany', 'Zoology'];
      let finalQs = [];
      subjects.forEach(subject => {
        const subjectQs = allQs.filter(q => q.subject === subject);
        const shuffled = subjectQs.sort(() => Math.random() - 0.5);
        finalQs = [...finalQs, ...shuffled.slice(0, 45)];
      });
      if (finalQs.length === 0) finalQs = allQs;

      setNeetQuestions(finalQs);
      setNeetStep('test');
      window.showToast?.(`✅ ${finalQs.length} questions loaded!`, 'success');
    } catch (err) {
      console.error(err);
      window.showToast?.('❌ Failed to load questions. Please try again!', 'error');
      setNeetStep('info');
    } finally {
      setNeetLoading(false);
    }
  };

  const handleStartClick = () => {
    if (!user) {
      window.showToast?.('⚠️ Please login first!', 'warning');
      return;
    }
    if (user.email === 'luckyfaizu3@gmail.com') {
      loadAllNeetQuestions();
      return;
    }
    const status = getNeetStatus();
    if (status.status === 'locked') {
      window.showToast?.(`🔒 NEET locked — available in ${formatTimeRemaining(status.timeRemaining)}`, 'warning');
      return;
    }
    if (status.status === 'grace_period' || status.status === 'in_progress') {
      loadAllNeetQuestions();
      return;
    }
    setShowCoupon(true);
  };

  const handleFreeAccess = async (couponResult) => {
    setShowCoupon(false);
    await markCouponUsed(couponResult.couponId);
    await saveNeetPayment('FREE_COUPON', 0, couponResult);
    window.showToast?.('🆓 Free access granted!', 'success');
    loadAllNeetQuestions();
  };

  const handlePayment = (finalPrice, couponResult) => {
    setShowCoupon(false);
    if (!window.Razorpay) {
      window.showToast?.('⚠️ Payment system loading... Please try again!', 'warning');
      return;
    }
    const options = {
      key: RAZORPAY_KEY_ID,
      amount: finalPrice * 100,
      currency: 'INR',
      name: 'FaizUpyZone',
      description: `NEET Complete Mock Test${couponResult ? ' (Coupon Applied)' : ''}`,
      handler: async function(response) {
        window.showToast?.('✅ Payment Successful!', 'success');
        await saveNeetPayment(response.razorpay_payment_id, finalPrice, couponResult);
        loadAllNeetQuestions();
      },
      prefill: { name: user?.displayName || user?.email?.split('@')[0] || 'Student', email: user?.email || '' },
      theme: { color: '#dc2626' },
      modal: { ondismiss: function() { window.showToast?.('❌ Payment cancelled', 'info'); } }
    };
    try {
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function() { window.showToast?.('❌ Payment Failed!', 'error'); });
      rzp.open();
    } catch (error) {
      console.error('Razorpay error:', error);
      window.showToast?.('❌ Failed to open payment', 'error');
    }
  };

  // ✅ FIX 3: neetStep === 'test' ke liye direct render — koi state change render mein nahi
  if (neetStep === 'test' && neetQuestions && neetQuestions.length > 0) {
    return (
      <NEETMockTestInterface
        questions={neetQuestions}
        userEmail={user?.email || ''}
        onExit={() => setNeetStep('info')}
        onComplete={onNeetComplete || (() => setNeetStep('info'))}
      />
    );
  }

  const price = getPrice();
  const originalPrice = getOriginalPrice();
  const onSale = isSaleOn();

  return (
    <div style={{ animation: 'fadeInUp 0.5s ease', maxWidth: '900px', margin: '0 auto' }}>

      {/* Hero Header */}
      <div style={{ background: isDark ? 'linear-gradient(135deg,#0f172a,#1e1b4b)' : 'linear-gradient(135deg,#fff5f5,#fef2f2)', border: `2px solid ${isDark ? '#334155' : '#fecaca'}`, borderRadius: '20px', padding: isMobile ? '1.5rem' : '2.5rem', marginBottom: '1.5rem', textAlign: 'center' }}>
        <div style={{ fontSize: isMobile ? '3rem' : '4rem', marginBottom: '1rem' }}>🧬</div>
        <h2 style={{ margin: '0 0 0.5rem', fontSize: isMobile ? '1.5rem' : '2.2rem', fontWeight: '900', color: isDark ? '#fff' : '#1e293b' }}>NEET Complete Mock Test</h2>
        <p style={{ margin: '0 0 1.5rem', color: isDark ? '#94a3b8' : '#64748b', fontSize: isMobile ? '0.85rem' : '1rem' }}>Physics + Chemistry + Botany + Zoology — Full Syllabus</p>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '0.75rem', maxWidth: '560px', margin: '0 auto 1.5rem' }}>
          {[
            { label: 'Questions', value: '180', color: '#3b82f6' },
            { label: 'Time', value: `${neetSettings?.timeMinutes || 180} min`, color: '#10b981' },
            { label: 'Max Marks', value: '720', color: '#f59e0b' },
            { label: 'Marking', value: '+4 / -1', color: '#ef4444' },
          ].map((s, i) => (
            <div key={i} style={{ padding: isMobile ? '0.65rem' : '0.85rem', background: isDark ? '#1e293b' : '#fff', borderRadius: '12px', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}` }}>
              <div style={{ fontSize: isMobile ? '1.1rem' : '1.4rem', fontWeight: '900', color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '0.68rem', color: isDark ? '#64748b' : '#94a3b8', fontWeight: '700', marginTop: '0.2rem' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Subject Breakdown */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.6rem', maxWidth: '520px', margin: '0 auto 1.5rem' }}>
          {[
            { label: '⚡ Physics', sub: '45 Questions • 180 Marks', color: '#3b82f6', bg: '#eff6ff' },
            { label: '🧪 Chemistry', sub: '45 Questions • 180 Marks', color: '#a855f7', bg: '#fdf4ff' },
            { label: '🌿 Botany', sub: '45 Questions • 180 Marks', color: '#22c55e', bg: '#f0fdf4' },
            { label: '🐾 Zoology', sub: '45 Questions • 180 Marks', color: '#f97316', bg: '#fff7ed' },
          ].map((s, i) => (
            <div key={i} style={{ padding: isMobile ? '0.65rem' : '0.85rem', background: isDark ? '#1e293b' : s.bg, border: `2px solid ${s.color}44`, borderRadius: '12px', textAlign: 'center' }}>
              <div style={{ fontWeight: '800', color: s.color, fontSize: isMobile ? '0.82rem' : '0.92rem' }}>{s.label}</div>
              <div style={{ fontSize: '0.68rem', color: isDark ? '#64748b' : '#94a3b8', marginTop: '0.2rem' }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Price Card */}
        <div style={{ background: isDark ? '#1e293b' : '#fff', border: `2px solid ${isDark ? '#334155' : '#fecaca'}`, borderRadius: '16px', padding: isMobile ? '1rem' : '1.5rem', maxWidth: '400px', margin: '0 auto 1.5rem', textAlign: 'center' }}>
          {onSale && (
            <div style={{ display: 'inline-block', background: '#10b981', color: '#fff', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '800', marginBottom: '0.75rem' }}>
              🔥 SALE — {Math.round(((originalPrice - price) / originalPrice) * 100)}% OFF
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {onSale && (<span style={{ fontSize: isMobile ? '1.1rem' : '1.3rem', fontWeight: '700', color: '#94a3b8', textDecoration: 'line-through' }}>₹{originalPrice}</span>)}
            <span style={{ fontSize: isMobile ? '2rem' : '2.5rem', fontWeight: '900', color: isDark ? '#e2e8f0' : '#dc2626' }}>
              {user?.email === 'luckyfaizu3@gmail.com' ? '🆓 FREE' : `₹${price}`}
            </span>
          </div>
          {user?.email === 'luckyfaizu3@gmail.com' && (<div style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: '700', marginTop: '0.3rem' }}>Admin Privilege — Free Access</div>)}
          {user?.email !== 'luckyfaizu3@gmail.com' && (<div style={{ fontSize: '0.78rem', color: isDark ? '#64748b' : '#94a3b8', marginTop: '0.4rem' }}>One-time payment • Instant access • 🎟️ Coupons accepted</div>)}
        </div>

        {/* Features List */}
        <div style={{ padding: isMobile ? '0.85rem' : '1rem', background: isDark ? '#1e293b' : '#f8fafc', borderRadius: '14px', border: `1px solid ${isDark ? '#334155' : '#e2e8f0'}`, maxWidth: '500px', margin: '0 auto 1.5rem', textAlign: 'left' }}>
          <div style={{ fontWeight: '800', color: isDark ? '#e2e8f0' : '#1e293b', marginBottom: '0.75rem', fontSize: isMobile ? '0.85rem' : '0.95rem' }}>📊 What You Get:</div>
          {[
            '✅ 180 questions — full NEET pattern',
            '✅ Subject-wise score breakdown',
            '✅ Chapter & topic reference (NCERT)',
            '✅ Explanation for every wrong answer',
            '✅ Detailed performance analytics',
            '🏆 Leaderboard ranking after test',
          ].map((item, i) => (
            <div key={i} style={{ fontSize: isMobile ? '0.78rem' : '0.85rem', color: isDark ? '#94a3b8' : '#475569', padding: '0.3rem 0', fontWeight: '500' }}>{item}</div>
          ))}
        </div>

        {/* CTA Button */}
        {!user ? (
          <div style={{ padding: '1rem', background: 'rgba(239,68,68,0.1)', border: '2px solid rgba(239,68,68,0.3)', borderRadius: '12px', color: '#ef4444', fontWeight: '700', fontSize: isMobile ? '0.88rem' : '0.95rem', maxWidth: '400px', margin: '0 auto' }}>
            ⚠️ Please login first to take the NEET test!
          </div>
        ) : (() => {
          const nStatus = getNeetStatus();
          const isLocked = nStatus.status === 'locked';
          const isGrace = nStatus.status === 'grace_period';
          const isInProgress = nStatus.status === 'in_progress';
          const isAdminUser = user.email === 'luckyfaizu3@gmail.com';
          const isDisabled = neetLoading || !settingsLoaded || isLocked;

          return (
            <>
              {!isAdminUser && isGrace && (
                <div style={{ padding: '0.65rem 1rem', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.35)', borderRadius: '10px', color: '#10b981', fontWeight: '700', fontSize: '0.82rem', maxWidth: '420px', margin: '0 auto 0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                  ✅ Purchased — Grace period: {formatTimeRemaining(nStatus.timeRemaining)}
                </div>
              )}
              {!isAdminUser && isInProgress && (
                <div style={{ padding: '0.65rem 1rem', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.35)', borderRadius: '10px', color: '#f59e0b', fontWeight: '700', fontSize: '0.82rem', maxWidth: '420px', margin: '0 auto 0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                  📝 Test In Progress — Resume
                </div>
              )}
              {!isAdminUser && isLocked && (
                <div style={{ padding: '0.65rem 1rem', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)', borderRadius: '10px', color: '#ef4444', fontWeight: '700', fontSize: '0.82rem', maxWidth: '420px', margin: '0 auto 0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                  🔒 Locked — Available in {formatTimeRemaining(nStatus.timeRemaining)}
                </div>
              )}
              <button
                onClick={handleStartClick}
                disabled={isDisabled}
                style={{ width: '100%', maxWidth: '420px', padding: isMobile ? '1rem' : '1.25rem', background: isDisabled ? (isLocked ? 'rgba(239,68,68,0.3)' : '#e2e8f0') : isAdminUser ? 'linear-gradient(135deg,#10b981,#059669)' : (isGrace || isInProgress) ? 'linear-gradient(135deg,#10b981,#059669)' : 'linear-gradient(135deg,#dc2626,#b91c1c)', border: 'none', borderRadius: '16px', color: isDisabled && !isLocked ? '#94a3b8' : '#fff', fontSize: isMobile ? '1rem' : '1.15rem', fontWeight: '900', cursor: isDisabled ? 'not-allowed' : 'pointer', opacity: isLocked ? 0.7 : 1, boxShadow: isDisabled ? 'none' : isAdminUser ? '0 8px 24px rgba(16,185,129,0.4)' : (isGrace || isInProgress) ? '0 8px 24px rgba(16,185,129,0.4)' : '0 8px 24px rgba(220,38,38,0.4)', letterSpacing: '0.03em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', margin: '0 auto' }}
              >
                {neetLoading ? '⏳ Loading Questions...' : !settingsLoaded ? '⏳ Loading...' : isAdminUser ? '🔓 Start Free NEET Test' : isLocked ? `🔒 Locked — ${formatTimeRemaining(nStatus.timeRemaining)}` : (isGrace || isInProgress) ? `🚀 ${isInProgress ? 'Resume' : 'Start'} NEET Test` : `🚀 Start NEET Test — ₹${price}`}
              </button>
            </>
          );
        })()}
      </div>

      {/* Coupon Modal for NEET */}
      {showCoupon && (
        <CouponModal
          plan={{ name: 'NEET Complete Mock Test', level: 'neet', price: price }}
          prices={{ neet: price }}
          isDark={isDark}
          onClose={() => setShowCoupon(false)}
          onFreeAccess={handleFreeAccess}
          onProceedPayment={handlePayment}
        />
      )}
    </div>
  );
}

export default MockTestPage;