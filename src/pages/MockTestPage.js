// @ts-nocheck
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth, useTheme, RAZORPAY_KEY_ID } from '../App';
import { useGeo } from '../App';
import { Trophy, Award, Zap, Loader, CheckCircle, XCircle, Monitor, Smartphone, Lock, Unlock, TrendingUp } from 'lucide-react';
import { SUBSCRIPTION_PLANS } from '../data/subscriptionPlans';
import MockTestInterface from '../components/MockTestInterface';
import MockTestAdminTab from '../components/MockTestAdminTab';
import UserDetailsForm from '../components/UserDetailsForm';
import CertificateViewer from '../components/CertificateViewer';
import Certificatesection from '../components/Certificatesection';
import SubmissionOverlay from '../components/SubmissionOverlay';
import { generateAndSaveReport, fetchReportUrl } from '../components/AITestReport';
import { db } from '../firebase';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import {
  getManualQuestions,
  hasCertificateForLevel,
  saveTestResult,
  issueCertificate,
  getAllCertificates,
  getTestHistory,
  getUserDetails,
  saveUserDetails,
  processMockTestPayment,
  getPaymentDetails,
  updateTestAttempt,
  deleteTestResult
} from '../services/mockTestService';

const isAdmin = (email) => email === 'luckyfaizu3@gmail.com';

/* ── Python Official Logo ── */
function PythonLogo({ size = 24, style = {} }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 255"
      width={size} height={size} style={{ display: 'inline-block', flexShrink: 0, verticalAlign: 'middle', ...style }}>
      <defs>
        <linearGradient id="plBlue" x1="12.959%" y1="12.039%" x2="79.639%" y2="78.201%" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#387EB8"/><stop offset="100%" stopColor="#366994"/>
        </linearGradient>
        <linearGradient id="plYellow" x1="19.128%" y1="20.579%" x2="90.742%" y2="88.429%" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFE052"/><stop offset="100%" stopColor="#FFC331"/>
        </linearGradient>
      </defs>
      <path fill="#4584B6" d="M126.916.072c-64.832 0-60.784 28.115-60.784 28.115l.072 29.128h61.868v8.745H41.631S.145 61.355.145 126.77c0 65.417 36.21 63.097 36.21 63.097h21.61v-30.356s-1.165-36.21 35.632-36.21h61.362s34.475.557 34.475-33.319V33.97S194.67.072 126.916.072zm-34.054 19.474a11.05 11.05 0 0 1 11.063 11.064A11.05 11.05 0 0 1 92.862 41.674a11.05 11.05 0 0 1-11.063-11.064 11.05 11.05 0 0 1 11.063-11.064z"/>
      <path fill="#FFDE57" d="M128.757 254.126c64.832 0 60.784-28.115 60.784-28.115l-.072-29.127H127.6v-8.745h86.441s41.486 4.705 41.486-60.712c0-65.416-36.21-63.096-36.21-63.096h-21.61v30.355s1.165 36.21-35.632 36.21h-61.362s-34.475-.557-34.475 33.32v56.013s-5.235 33.897 62.518 33.897zm34.055-19.474a11.05 11.05 0 0 1-11.063-11.064 11.05 11.05 0 0 1 11.063-11.064 11.05 11.05 0 0 1 11.063 11.064 11.05 11.05 0 0 1-11.063 11.064z"/>
    </svg>
  );
}

const DEFAULT_PRICES = { basic: 0, advanced: 199, pro: 299 };

const formatTimeRemaining = (milliseconds) => {
  if (milliseconds <= 0) return 'Expired';
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours   = Math.floor(minutes / 60);
  const days    = Math.floor(hours / 24);
  if (days > 0)    return `${days}d ${hours % 24}h`;
  if (hours > 0)   return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m`;
  return `${seconds}s`;
};

const validateCoupon = async (code, level, originalPrice) => {
  if (!code || !code.trim()) return { valid: false, error: 'Please enter a coupon code' };
  const upperCode = code.trim().toUpperCase();
  try {
    const { collection, query, where, getDocs } = await import('firebase/firestore');
    let couponData = null, couponId = null;
    const directSnap = await getDoc(doc(db, 'coupons', upperCode));
    if (directSnap.exists()) { couponData = directSnap.data(); couponId = directSnap.id; }
    else {
      const q = query(collection(db, 'coupons'), where('code', '==', upperCode));
      const snap = await getDocs(q);
      if (!snap.empty) { couponData = snap.docs[0].data(); couponId = snap.docs[0].id; }
    }
    if (!couponData) return { valid: false, error: '❌ Invalid coupon code' };
    if (!couponData.active) return { valid: false, error: '❌ This coupon is not active' };
    const scope    = couponData.scope || couponData.subject || 'global';
    const isGlobal = scope === 'global' || scope === 'all';
    if (!isGlobal && scope !== level) return { valid: false, error: `❌ This coupon is only valid for the ${scope} test` };
    if (couponData.expiry && new Date() > new Date(couponData.expiry)) return { valid: false, error: '❌ This coupon has expired' };
    if (couponData.usageLimit && (couponData.usedCount || 0) >= couponData.usageLimit) return { valid: false, error: '❌ This coupon has reached its usage limit' };
    let discountAmount = couponData.type === 'flat'
      ? couponData.discount
      : Math.round((originalPrice * couponData.discount) / 100);
    const finalPrice = Math.max(0, originalPrice - discountAmount);
    const isFree     = finalPrice === 0;
    return {
      valid: true, couponId, couponData, discountAmount, finalPrice, isFree,
      discountText: couponData.type === 'flat' ? `₹${discountAmount} off` : `${couponData.discount}% off`,
      message: isFree
        ? `🎉 100% off! You get this test for free!`
        : `✅ ${couponData.type === 'flat' ? `₹${discountAmount}` : `${couponData.discount}%`} discount applied!`,
    };
  } catch (err) {
    return { valid: false, error: '❌ Error checking coupon. Please try again.' };
  }
};

const markCouponUsed = async (couponId) => {
  try {
    const { updateDoc, increment } = await import('firebase/firestore');
    await updateDoc(doc(db, 'coupons', couponId), { usedCount: increment(1) });
  } catch (e) { console.error('Coupon mark used error:', e); }
};

/* ── Coupon Modal ── */
function CouponModal({ plan, prices, isDark, onClose, onFreeAccess, onProceedPayment }) {
  const [couponCode,   setCouponCode]   = useState('');
  const [couponResult, setCouponResult] = useState(null);
  const [checking,     setChecking]     = useState(false);
  const originalPrice = prices[plan.level] ?? plan.price;

  const handleCheck = async () => {
    if (!couponCode.trim()) return;
    setChecking(true); setCouponResult(null);
    const result = await validateCoupon(couponCode, plan.level, originalPrice);
    setCouponResult(result); setChecking(false);
  };

  const handleApply = async () => {
    if (!couponResult?.valid) return;
    await markCouponUsed(couponResult.couponId);
    if (couponResult.isFree) onFreeAccess(couponResult);
    else onProceedPayment(couponResult.finalPrice, couponResult);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, backdropFilter: 'blur(8px)', padding: '1rem' }}>
      <div style={{ background: isDark ? '#1e293b' : '#fff', borderRadius: '24px', padding: 'clamp(1.5rem, 4vw, 2.5rem)', maxWidth: '460px', width: '100%', boxShadow: '0 25px 60px rgba(0,0,0,0.5)', border: `2px solid ${isDark ? 'rgba(99,102,241,0.3)' : 'rgba(99,102,241,0.2)'}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 'clamp(1.1rem,3vw,1.4rem)', fontWeight: '900', color: isDark ? '#e2e8f0' : '#1e293b' }}>🎟️ Coupon Code</h3>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: isDark ? '#64748b' : '#94a3b8' }}>{plan.name} — ₹{originalPrice}</p>
          </div>
          <button onClick={onClose} style={{ background: isDark ? 'rgba(255,255,255,0.08)' : '#f1f5f9', border: 'none', borderRadius: '10px', width: '36px', height: '36px', cursor: 'pointer', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isDark ? '#94a3b8' : '#64748b' }}>✕</button>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1rem' }}>
          <input type="text" placeholder="Enter coupon code..." value={couponCode}
            onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponResult(null); }}
            onKeyDown={e => e.key === 'Enter' && handleCheck()}
            autoComplete="off" autoCapitalize="characters" spellCheck={false}
            style={{ flex: 1, padding: '0.85rem 1rem', border: `2px solid ${couponResult?.valid ? '#10b981' : couponResult?.valid === false ? '#ef4444' : isDark ? 'rgba(255,255,255,0.15)' : '#e2e8f0'}`, borderRadius: '12px', fontSize: '0.95rem', fontWeight: '700', fontFamily: 'monospace', letterSpacing: '1px', background: isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc', color: isDark ? '#e2e8f0' : '#1e293b', outline: 'none' }}
          />
          <button onClick={handleCheck} disabled={checking || !couponCode.trim()}
            style={{ padding: '0.85rem 1.1rem', background: checking || !couponCode.trim() ? '#e2e8f0' : 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', borderRadius: '12px', color: checking || !couponCode.trim() ? '#94a3b8' : '#fff', fontWeight: '700', cursor: checking || !couponCode.trim() ? 'not-allowed' : 'pointer', fontSize: '0.85rem' }}>
            {checking ? '⏳' : 'Check'}
          </button>
        </div>
        {couponResult && (
          <div style={{ padding: '1rem', borderRadius: '12px', marginBottom: '1rem', background: couponResult.valid ? (isDark ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.1)') : (isDark ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.1)'), border: `2px solid ${couponResult.valid ? '#10b981' : '#ef4444'}` }}>
            {couponResult.valid ? (
              <>
                <div style={{ fontWeight: '800', color: '#10b981', marginBottom: '0.5rem' }}>{couponResult.message}</div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: '0.85rem', textDecoration: 'line-through' }}>₹{originalPrice}</span>
                  <span style={{ fontSize: '1.4rem', fontWeight: '900', color: couponResult.isFree ? '#8b5cf6' : '#10b981' }}>{couponResult.isFree ? '🆓 FREE' : `₹${couponResult.finalPrice}`}</span>
                  <span style={{ background: '#10b981', color: '#fff', padding: '0.15rem 0.5rem', borderRadius: '20px', fontSize: '0.7rem', fontWeight: '700' }}>{couponResult.discountText}</span>
                </div>
              </>
            ) : (
              <div style={{ fontWeight: '700', color: '#ef4444' }}>{couponResult.error}</div>
            )}
          </div>
        )}
        <div style={{ padding: '0.85rem 1rem', borderRadius: '12px', marginBottom: '1.5rem', background: isDark ? 'rgba(99,102,241,0.08)' : 'rgba(99,102,241,0.05)', border: `1px solid ${isDark ? 'rgba(99,102,241,0.25)' : 'rgba(99,102,241,0.15)'}` }}>
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
            <button onClick={handleApply} style={{ width: '100%', padding: '1rem', background: couponResult.isFree ? 'linear-gradient(135deg, #8b5cf6, #6366f1)' : 'linear-gradient(135deg, #10b981, #059669)', border: 'none', borderRadius: '14px', color: '#fff', fontSize: '1rem', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              {couponResult.isFree ? <><Zap size={20} />🆓 Start Free!</> : <><CheckCircle size={20} />Pay ₹{couponResult.finalPrice}</>}
            </button>
          )}
          <button onClick={() => onProceedPayment(originalPrice, null)} style={{ width: '100%', padding: '0.85rem', background: 'transparent', border: `2px solid ${isDark ? 'rgba(99,102,241,0.4)' : 'rgba(99,102,241,0.3)'}`, borderRadius: '14px', color: '#6366f1', fontSize: '0.9rem', fontWeight: '700', cursor: 'pointer' }}>
            No coupon — Pay Full ₹{originalPrice}
          </button>
          <button onClick={onClose} style={{ width: '100%', padding: '0.65rem', background: 'transparent', border: 'none', color: isDark ? '#475569' : '#94a3b8', fontSize: '0.85rem', cursor: 'pointer' }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   MAIN MockTestPage
══════════════════════════════════════════ */
function MockTestPage() {
  const { user }             = useAuth();
  const { isDark }           = useTheme();
  const { geoData, isIndia } = useGeo() || { geoData: null, isIndia: true };

  const [currentStep,          setCurrentStep]          = useState('plans');
  const [selectedPlan,         setSelectedPlan]         = useState(null);
  const [testQuestions,        setTestQuestions]        = useState([]);
  const [loading,              setLoading]              = useState(false);
  const [activeTab,            setActiveTab]            = useState('tests');
  const [prices,               setPrices]               = useState(DEFAULT_PRICES);
  const [userDetails,          setUserDetails]          = useState(null);
  const [userCertificates,     setUserCertificates]     = useState([]);
  const [testHistory,          setTestHistory]          = useState([]);
  const [selectedCertificate,  setSelectedCertificate]  = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [testResults,          setTestResults]          = useState(null);
  const [paymentDetails,       setPaymentDetails]       = useState({});
  const [testStatus,           setTestStatus]           = useState({});
  const [showDeleteDialog,     setShowDeleteDialog]     = useState(false);
  const [testToDelete,         setTestToDelete]         = useState(null);
  const [showDeleteCertDialog, setShowDeleteCertDialog] = useState(false);
  const [certToDelete,         setCertToDelete]         = useState(null);
  const [showCouponModal,      setShowCouponModal]      = useState(false);
  const [couponPlan,           setCouponPlan]           = useState(null);
  const [showSubmitOverlay,    setShowSubmitOverlay]    = useState(false);
  const [submitOverlayData,    setSubmitOverlayData]    = useState({ isPassed: false, score: 0, testType: 'python' });
  const [slideDir,             setSlideDir]             = useState('none');
  const [passPercent,          setPassPercent]          = useState(55);

  // ── AI Report states ──────────────────────────────────────
  const [overlayAiDone, setOverlayAiDone] = useState(false);
  const [aiReports,     setAiReports]     = useState({});

  const formSubmittedRef = useRef(false);

  const fetchPrices = async () => {
    try {
      const priceDoc = await getDoc(doc(db, 'settings', 'testPrices'));
      const fetched  = priceDoc.exists() ? priceDoc.data() : DEFAULT_PRICES;
      setPrices({ ...fetched, basic: 0 });
    } catch { setPrices(DEFAULT_PRICES); }
    try {
      const settingsDoc = await getDoc(doc(db, 'settings', 'testSettings'));
      if (settingsDoc.exists() && settingsDoc.data().passPercent) {
        setPassPercent(settingsDoc.data().passPercent);
      }
    } catch { /* use default 55 */ }
  };

  // ── calculateTestStatus ───────────────────────────────────
  const calculateTestStatus = (payment, level, userEmail, currentPrices) => {
    if (isAdmin(userEmail)) return { canTake: true, status: 'available', message: 'Admin — Free & Unlimited Access', color: '#10b981' };

    if (level === 'basic') {
      if (payment?.lockEndsAt) {
        const lockEnd = new Date(payment.lockEndsAt);
        if (new Date() < lockEnd) return {
          canTake: false, status: 'locked',
          message: `Locked — Available in ${formatTimeRemaining(lockEnd - new Date())}`,
          color: '#ef4444', timeRemaining: lockEnd - new Date(),
        };
      }
      return { canTake: true, status: 'available', message: 'Free test — start anytime!', color: '#10b981' };
    }

    if (!payment?.hasPaid) return { canTake: true, status: 'available', message: 'Purchase to start test', color: '#10b981' };
    const now = new Date();
    if (payment.purchaseValidUntil) {
      const gracePeriodEnd = new Date(payment.purchaseValidUntil);
      if (now < gracePeriodEnd && !payment.testSubmittedAt)
        return { canTake: true, status: 'grace_period', message: 'Test available — Grace period active', color: '#10b981', timeRemaining: gracePeriodEnd - now };
    }
    if (payment.testStartedAt && !payment.testSubmittedAt)
      return { canTake: true, status: 'in_progress', message: 'Resume your test', color: '#f59e0b' };
    if (payment.lockEndsAt) {
      const lockEnd = new Date(payment.lockEndsAt);
      if (now < lockEnd) return { canTake: false, status: 'locked', message: `Locked — Available in ${formatTimeRemaining(lockEnd - now)}`, color: '#ef4444', timeRemaining: lockEnd - now };
    }
    return { canTake: true, status: 'available', message: 'Purchase to take test again', color: '#10b981' };
  };

  // ── loadUserData ──────────────────────────────────────────
  const loadUserData = useCallback(async () => {
    setLoading(true);
    try {
      const detailsResult = await getUserDetails(user.uid);
      if (detailsResult.success) setUserDetails(detailsResult.details);

      const certsResult = await getAllCertificates(user.uid);
      if (certsResult.success) setUserCertificates(certsResult.certificates);

      const historyResult = await getTestHistory(user.uid);
      if (historyResult.success) {
        setTestHistory(historyResult.tests);

        // ── PDF URL fetch karo latest test ka Firestore se ──
        if (historyResult.tests.length > 0) {
          const latestTest = historyResult.tests[0];
          try {
            const reportData = await fetchReportUrl(
              user.uid,
              latestTest.level,
              latestTest.testDate || latestTest.date
            );
            if (reportData?.downloadUrl) {
              setAiReports({
                latest: {
                  pdfUrl:   reportData.downloadUrl,
                  fileName: reportData.fileName,
                  testData: latestTest,
                  userId:   user.uid,
                },
                userId: user.uid,
              });
            }
          } catch (e) {
            // PDF nahi mili — koi baat nahi
          }
        }
      }

      const statusData = {}, paymentData = {};
      const currentPrices = await getDoc(doc(db, 'settings', 'testPrices'))
        .then(d => d.exists() ? d.data() : DEFAULT_PRICES).catch(() => DEFAULT_PRICES);

      for (const level of ['basic', 'advanced', 'pro']) {
        if (isAdmin(user.email)) {
          paymentData[level] = { hasPaid: false };
          statusData[level]  = { canTake: true, status: 'available', message: 'Admin — Free & Unlimited Access', color: '#10b981' };
        } else if (level === 'basic') {
          const payment      = await getPaymentDetails(user.uid, level);
          paymentData[level] = payment || { hasPaid: false };
          statusData[level]  = calculateTestStatus(payment, level, user.email, currentPrices);
        } else {
          const payment      = await getPaymentDetails(user.uid, level);
          paymentData[level] = payment;
          statusData[level]  = calculateTestStatus(payment, level, user.email, currentPrices);
        }
      }
      setPaymentDetails(paymentData);
      setTestStatus(statusData);
    } catch (error) {
      console.error('Error loading user data:', error);
      window.showToast?.('Failed to load data', 'error');
    } finally { setLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (user) loadUserData();
    fetchPrices();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (currentStep === 'form') formSubmittedRef.current = false;
  }, [currentStep]);

  // ── handleBasicFreeStart ──────────────────────────────────
  const handleBasicFreeStart = async (plan) => {
    if (!user) { window.showToast?.('⚠️ Please login first!', 'warning'); return; }
    const status = testStatus[plan.level];
    if (status?.status === 'locked') { window.showToast?.(status.message, 'warning'); return; }
    setSelectedPlan(plan);
    setCurrentStep('form');
  };

  // ── handlePayment ─────────────────────────────────────────
  const handlePayment = (plan, finalPrice = null, couponResult = null) => {
    if (!user) { window.showToast?.('⚠️ Please login first!', 'warning'); return; }
    if (!window.Razorpay) { window.showToast?.('⚠️ Payment system loading...', 'warning'); return; }
    const rawPrice     = prices[plan.level] ?? plan.price;
    const dynamicPrice = finalPrice ?? rawPrice;
    if (dynamicPrice === 0 || dynamicPrice === 'Free' || dynamicPrice === 'free') {
      handleFreeUnlock(plan, couponResult || { isFree: true, discountAmount: rawPrice, couponData: null, couponId: null });
      return;
    }
    const options = {
      key: RAZORPAY_KEY_ID, amount: dynamicPrice * 100, currency: 'INR',
      name: 'PySkill', description: `${plan.name} - Python Mock Test`,
      image: 'https://img.icons8.com/fluency/96/000000/python.png',
      handler: async function (response) {
        window.showToast?.('✅ Payment Successful!', 'success');
        const now                = new Date();
        const purchaseValidUntil = new Date(now.getTime() + 12 * 60 * 60 * 1000);
        const paymentData = {
          level: plan.level, amount: dynamicPrice, originalAmount: rawPrice,
          paymentId: response.razorpay_payment_id, paidAmount: dynamicPrice,
          couponCode: couponResult?.couponData?.code || null,
          couponDiscount: couponResult?.discountAmount || 0, paidAt: now.toISOString(),
          purchaseValidUntil: purchaseValidUntil.toISOString(), testStartedAt: null,
          testSubmittedAt: null, resultsViewedAt: null, lockStartsAt: null, lockEndsAt: null,
        };
        const result = await processMockTestPayment(user.uid, plan.id, paymentData);
        if (result.success) {
          window.showToast?.('✅ Test unlocked! Valid for 12 hours', 'success');
          await loadUserData();
          setSelectedPlan(plan);
          setCurrentStep('form');
        } else { window.showToast?.('❌ Payment recording failed', 'error'); }
      },
      prefill: { name: user?.displayName || user?.email?.split('@')[0] || 'Student', email: user?.email || '' },
      theme: { color: isDark ? '#8b5cf6' : '#6366f1' },
      modal: { ondismiss: function () { window.showToast?.('❌ Payment cancelled', 'info'); } },
    };
    try {
      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function () { window.showToast?.('❌ Payment Failed!', 'error'); });
      rzp.open();
    } catch (error) { window.showToast?.('❌ Failed to open payment', 'error'); }
  };

  // ── handleFreeUnlock ──────────────────────────────────────
  const handleFreeUnlock = async (plan, couponResult) => {
    setShowCouponModal(false);
    const now                = new Date();
    const purchaseValidUntil = new Date(now.getTime() + 12 * 60 * 60 * 1000);
    const paymentData = {
      level: plan.level, amount: 0, paidAmount: 0, originalAmount: prices[plan.level] ?? plan.price,
      paymentId: 'FREE_COUPON', couponCode: couponResult?.couponData?.code || null,
      couponDiscount: couponResult?.discountAmount || 0, isFree: true,
      paidAt: now.toISOString(), purchaseValidUntil: purchaseValidUntil.toISOString(),
      testStartedAt: null, testSubmittedAt: null, resultsViewedAt: null, lockStartsAt: null, lockEndsAt: null,
    };
    const result = await processMockTestPayment(user.uid, plan.id, paymentData);
    if (result.success) {
      window.showToast?.('🆓 Test unlocked! Valid for 12 hours', 'success');
      await loadUserData();
      setSelectedPlan(plan);
      setCurrentStep('form');
    } else { window.showToast?.('❌ Free unlock failed', 'error'); }
  };

  // ── handleFormSubmit ──────────────────────────────────────
  const handleFormSubmit = useCallback(async (formData) => {
    if (formSubmittedRef.current) return;
    formSubmittedRef.current = true;
    setLoading(true);
    try {
      const result = await saveUserDetails(user.uid, formData);
      if (result.success) {
        setUserDetails(formData);
        window.showToast?.('✅ Details saved!', 'success');
        await startTest(selectedPlan);
      } else {
        window.showToast?.('❌ Failed to save details', 'error');
        formSubmittedRef.current = false;
      }
    } catch (error) {
      window.showToast?.('❌ Error occurred', 'error');
      formSubmittedRef.current = false;
    } finally { setLoading(false); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, selectedPlan]);

  // ── startTest ─────────────────────────────────────────────
  const startTest = async (plan) => {
    setCurrentStep('loading');
    setLoading(true);
    window.showToast?.('⏳ Loading test questions...', 'info');
    try {
      if (!isAdmin(user.email)) {
        await updateTestAttempt(user.uid, plan.level, { testStartedAt: new Date().toISOString() });
      }
      const result = await getManualQuestions(plan.level);
      if (result.success && result.questions.length > 0) {
        setTestQuestions(result.questions);
        setCurrentStep('test');
        window.showToast?.(`✅ ${result.questions.length} questions loaded!`, 'success');
      } else {
        window.showToast?.(result.error || '⚠️ No questions available. Please contact admin.', 'warning');
        setCurrentStep('plans'); setSelectedPlan(null);
      }
    } catch (error) {
      window.showToast?.('❌ Failed to load questions', 'error');
      setCurrentStep('plans'); setSelectedPlan(null);
    } finally { setLoading(false); }
  };

  // ── handleTestComplete ────────────────────────────────────
  const handleTestComplete = useCallback(async (results) => {
    if (!selectedPlan) return;
    setLoading(true);
    try {
      const now      = new Date();
      const isPassed = isAdmin(user.email) ? true : results.percentage >= passPercent;

      if (!isAdmin(user.email)) {
        const lockEndsAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        await updateTestAttempt(user.uid, selectedPlan.level, {
          testSubmittedAt: now.toISOString(),
          resultsViewedAt: now.toISOString(),
          lockStartsAt:    now.toISOString(),
          lockEndsAt:      lockEndsAt.toISOString(),
        });
      }

      const testData = {
        planId:           selectedPlan?.id       || 'unknown',
        planName:         selectedPlan?.name      || 'Python Mock Test',
        level:            selectedPlan?.level     || 'basic',
        score:            results.percentage,
        testType:         'python',
        correct:          results.correct,
        wrong:            results.wrong,
        total:            results.total,
        passed:           isPassed,
        timeTaken:        results.timeTaken,
        tabSwitches:      results.tabSwitches      || 0,
        correctQuestions: results.correctQuestions || [],
        wrongQuestions:   results.wrongQuestions   || [],
        penalized:        results.penalized        || false,
        studentInfo:      results.studentInfo || userDetails || {
          fullName: user.displayName || user.email.split('@')[0],
          email:    user.email,
          age:      'N/A',
          address:  'N/A',
        },
        testDate:    now.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }),
        testTime:    now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        completedAt: now.toISOString(),
        userEmail:   user.email,
      };

      await saveTestResult(user.uid, testData);

      if (isPassed) {
        const skipDuplicateCheck = isAdmin(user.email);
        const certCheck = skipDuplicateCheck
          ? { hasCertificate: false }
          : await hasCertificateForLevel(user.uid, selectedPlan.level);
        if (!certCheck.hasCertificate) {
          const certificateData = {
            userName:    results.studentInfo?.fullName   || userDetails?.fullName    || user.displayName || user.email,
            userAge:     results.studentInfo?.age        || userDetails?.age         || 'N/A',
            userAddress: results.studentInfo?.address    || userDetails?.address     || 'N/A',
            userEmail:   user.email,
            testName:    selectedPlan.name,
            level:       selectedPlan.level,
            score:       results.percentage,
            date:        now.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }),
            founderName: 'Faizan Tariq',
            isAdmin:     isAdmin(user.email),
          };
          const certResult = await issueCertificate(user.uid, certificateData);
          if (certResult.success) {
            window.showToast?.('🎉 Certificate issued successfully!', 'success');
            setUserCertificates(prev => [...prev, certResult.certificate]);
          }
        } else {
          window.showToast?.('ℹ️ You already have a certificate for this level', 'info');
        }
      } else {
        window.showToast?.(`Keep going! Score ${passPercent}% or above to earn your certificate.`, 'info');
      }

      setTestResults(results);
      loadUserData();
      setLoading(false);
      setCurrentStep('plans');
      setTestQuestions([]);

      setOverlayAiDone(false);
      setSubmitOverlayData({
        isPassed,
        score:    results.percentage,
        testType: selectedPlan?.level || 'python',
      });
      setShowSubmitOverlay(true);

      // Generate report in background
      generateAndSaveReport(testData, user.uid).then(report => {
        if (report.success) {
          setAiReports(prev => ({
            ...prev,
            latest: { ...report, testData, userId: user.uid },
            userId: user.uid,
          }));
        }
        setOverlayAiDone(true);
      });

    } catch (error) {
      console.error('❌ Error processing test completion:', error);
      window.showToast?.('❌ Error saving results', 'error');
      setLoading(false);
      setOverlayAiDone(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPlan, user, userDetails, passPercent]);

  // ── handleExitTest ────────────────────────────────────────
  const handleExitTest = async () => {
    if (window.confirm('Are you sure you want to exit? Your progress will be lost.')) backToPlans();
  };

  const backToPlans = () => {
    try {
      if (document.fullscreenElement) document.exitFullscreen?.();
      else if (document.webkitFullscreenElement) document.webkitExitFullscreen?.();
    } catch (err) {}
    window.onbeforeunload = null;
    ['overflow','position','margin','padding','width','height','top','left'].forEach(p => { document.body.style[p] = ''; });
    document.documentElement.style.overflow = '';
    setCurrentStep('plans'); setSelectedPlan(null); setTestQuestions([]); setTestResults(null);
    loadUserData();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ── handleSelectPlan ──────────────────────────────────────
  const handleSelectPlan = async (plan) => {
    if (!user) { window.showToast?.('⚠️ Please login first!', 'warning'); return; }
    if (plan.level === 'basic') { await handleBasicFreeStart(plan); return; }
    setSelectedPlan(plan);
    if (isAdmin(user.email)) {
      setCurrentStep('form'); return;
    }
    const status = testStatus[plan.level];
    if (status?.status === 'locked') { window.showToast?.(status.message, 'warning'); return; }
    if (paymentDetails[plan.level]?.hasPaid && (status?.status === 'grace_period' || status?.status === 'in_progress')) {
      setCurrentStep('form'); return;
    }
    const planPrice = prices[plan.level] ?? plan.price;
    if (planPrice === 0 || planPrice === 'Free' || planPrice === 'free') {
      await handleFreeUnlock(plan, { isFree: true, discountAmount: 0, couponData: null, couponId: null });
      return;
    }
    setCouponPlan(plan);
    setShowCouponModal(true);
  };

  const handleDeleteClick       = (test) => { setTestToDelete(test); setShowDeleteDialog(true); };
  const handleConfirmDelete     = async () => {
    if (!testToDelete) return;
    const result = await deleteTestResult(user.uid, testToDelete.id);
    if (result.success) { window.showToast?.('✅ Test result deleted!', 'success'); setShowDeleteDialog(false); setTestToDelete(null); await loadUserData(); }
    else { window.showToast?.('❌ Failed to delete result', 'error'); }
  };
  const handleCancelDelete      = () => { setShowDeleteDialog(false); setTestToDelete(null); };
  const handleDeleteCertificate = (cert) => { setCertToDelete(cert); setShowDeleteCertDialog(true); };
  const handleConfirmCertDelete = async () => {
    if (!certToDelete) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'certificates', certToDelete.id));
      window.showToast?.('✅ Certificate deleted!', 'success');
      setShowDeleteCertDialog(false); setCertToDelete(null); await loadUserData();
    } catch (error) { window.showToast?.('❌ Failed to delete certificate', 'error'); }
  };
  const handleCancelCertDelete  = () => { setShowDeleteCertDialog(false); setCertToDelete(null); };

  if (loading && (currentStep === 'plans' || currentStep === 'loading')) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <Loader className="spin" size={48} color="#6366f1" />
          <p style={{ marginTop: '16px', color: isDark ? '#94a3b8' : '#64748b' }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (currentStep === 'test' && testQuestions.length > 0) {
    return <MockTestInterface questions={testQuestions} onComplete={handleTestComplete} onExit={handleExitTest} testTitle={selectedPlan?.name} timeLimit={selectedPlan?.timeLimit} userEmail={user?.email} testLevel={selectedPlan?.level} studentInfo={userDetails} passPercent={passPercent} />;
  }

  if (currentStep === 'form') {
    return <UserDetailsForm onSubmit={handleFormSubmit} onCancel={backToPlans} defaultValues={userDetails} />;
  }

  const TABS = [
    { key: 'tests',        label: 'Python Tests', logo: true },
    { key: 'certificates', emoji: '🏆', label: 'Certificates', badge: userCertificates.length },
    { key: 'results',      emoji: '📊', label: 'Results',      badge: testHistory.length },
    ...(isAdmin(user?.email) ? [{ key: 'admin', emoji: '🛡️', label: 'Admin' }] : []),
  ];

  const handleTabChange = (key) => {
    const newIdx = TABS.findIndex(t => t.key === key);
    const oldIdx = TABS.findIndex(t => t.key === activeTab);
    setSlideDir(newIdx > oldIdx ? 'left' : 'right');
    setActiveTab(key);
  };

  const tabStyle = (tabName) => ({
    flex: 1,
    padding: 'clamp(0.4rem, 1.5vw, 0.6rem) clamp(0.2rem, 1vw, 0.5rem)',
    borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: '700',
    fontSize: 'clamp(0.6rem, 1.6vw, 0.78rem)',
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.15rem',
    transition: 'all 0.28s cubic-bezier(0.34,1.56,0.64,1)',
    background: activeTab === tabName ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'transparent',
    color: activeTab === tabName ? '#fff' : isDark ? '#94a3b8' : '#64748b',
    boxShadow: activeTab === tabName ? '0 4px 14px rgba(99,102,241,0.4)' : 'none',
    transform: activeTab === tabName ? 'translateY(-1px) scale(1.04)' : 'scale(1)',
    whiteSpace: 'nowrap', minWidth: 0, position: 'relative', overflow: 'visible',
  });

  return (
    <div style={{ minHeight: '100vh', background: isDark ? 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)' : 'linear-gradient(135deg, #f0f4ff 0%, #fdf2f8 100%)', padding: '100px 1rem 3rem' }}>

      {/* ── Submission Overlay ── */}
      {showSubmitOverlay && (
        <SubmissionOverlay
          isPassed={submitOverlayData.isPassed}
          score={submitOverlayData.score}
          testType={submitOverlayData.testType}
          aiDone={overlayAiDone}
          onDone={() => {
            setShowSubmitOverlay(false);
            setActiveTab('results');
            backToPlans();
          }}
        />
      )}

      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem', animation: 'fadeInUp 0.6s ease' }}>
          <h1 style={{ fontSize: 'clamp(2rem, 6vw, 4rem)', fontWeight: '900', color: isDark ? '#e2e8f0' : '#1e293b', marginBottom: '1rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <PythonLogo size={48} /> Python Mock Tests
            </span>
          </h1>
          <p style={{ fontSize: 'clamp(0.9rem, 3vw, 1.2rem)', color: isDark ? '#94a3b8' : '#64748b', maxWidth: '600px', margin: '0 auto 2rem', padding: '0 1rem' }}>
            Professional certification tests with instant results
          </p>
          <button onClick={() => window.location.href = '/'}
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', color: '#fff', padding: 'clamp(0.75rem, 2vw, 1rem) clamp(1.5rem, 4vw, 2.5rem)', borderRadius: '12px', fontSize: 'clamp(0.85rem, 2.5vw, 1rem)', fontWeight: '700', cursor: 'pointer', boxShadow: '0 4px 15px rgba(99,102,241,0.4)' }}>
            🏠 Back to Home
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: '0.25rem', background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)', borderRadius: '14px', padding: '4px', marginBottom: '2rem', border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`, maxWidth: '440px', margin: '0 auto 2rem' }}>
          {TABS.map(tab => (
            <button key={tab.key} style={tabStyle(tab.key)} onClick={() => handleTabChange(tab.key)}>
              <span style={{ fontSize: 'clamp(0.9rem, 2.5vw, 1rem)', lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {tab.logo ? <PythonLogo size={16} /> : tab.emoji}
              </span>
              <span style={{ lineHeight: 1 }}>{tab.label}</span>
              {tab.key === 'tests' && (
                <span style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.55rem', fontWeight: '700', color: activeTab === 'tests' ? 'rgba(255,255,255,0.85)' : '#10b981', lineHeight: 1 }}>
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10b981', display: 'inline-block', animation: 'livePulse 1.5s ease-in-out infinite', flexShrink: 0 }} />
                  LIVE
                </span>
              )}
              {tab.badge > 0 && (
                <span style={{ position: 'absolute', top: '3px', right: '3px', background: activeTab === tab.key ? 'rgba(255,255,255,0.35)' : 'rgba(99,102,241,0.25)', color: activeTab === tab.key ? '#fff' : '#6366f1', borderRadius: '20px', padding: '0 4px', fontSize: '0.55rem', fontWeight: '800', lineHeight: '1.4', minWidth: '13px', textAlign: 'center' }}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── TESTS TAB ── */}
        {activeTab === 'tests' && (
          <div style={{ animation: `${slideDir === 'right' ? 'slideInRight' : 'slideInLeft'} 0.35s cubic-bezier(0.25,0.46,0.45,0.94) both` }}>
            <div style={{ marginBottom: '2.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', justifyContent: 'center' }}>
                <div style={{ height: '2px', flex: 1, maxWidth: '80px', background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.4))' }} />
                <span style={{ fontSize: 'clamp(0.75rem,2vw,0.85rem)', fontWeight: '800', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6366f1', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  ⚠️ Read Before You Start
                </span>
                <div style={{ height: '2px', flex: 1, maxWidth: '80px', background: 'linear-gradient(90deg, rgba(99,102,241,0.4), transparent)' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(250px, 100%), 1fr))', gap: '0.85rem', marginBottom: '1rem' }}>
                <div style={{ position: 'relative', background: isDark ? 'rgba(99,102,241,0.12)' : 'rgba(99,102,241,0.07)', border: `1.5px solid rgba(99,102,241,0.35)`, borderRadius: '16px', padding: '1rem 1.1rem', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: '-18px', right: '-18px', width: '70px', height: '70px', borderRadius: '50%', background: 'rgba(99,102,241,0.12)', pointerEvents: 'none' }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                    <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Monitor size={17} color="#fff" /></div>
                    <span style={{ fontWeight: '800', fontSize: 'clamp(0.82rem,2.2vw,0.92rem)', color: isDark ? '#c7d2fe' : '#4338ca' }}>Use Desktop Mode</span>
                  </div>
                  <p style={{ fontSize: 'clamp(0.72rem,1.8vw,0.8rem)', color: isDark ? '#a5b4fc' : '#4f46e5', margin: 0, lineHeight: '1.55' }}>
                    For the best experience, use a laptop or computer. On mobile, go to browser menu → <strong>Desktop site</strong> → refresh.
                  </p>
                </div>
                <div style={{ position: 'relative', background: isDark ? 'rgba(245,158,11,0.12)' : 'rgba(245,158,11,0.08)', border: `1.5px solid rgba(245,158,11,0.4)`, borderRadius: '16px', padding: '1rem 1.1rem', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: '-18px', right: '-18px', width: '70px', height: '70px', borderRadius: '50%', background: 'rgba(245,158,11,0.12)', pointerEvents: 'none' }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                    <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Trophy size={17} color="#fff" /></div>
                    <span style={{ fontWeight: '800', fontSize: 'clamp(0.82rem,2.2vw,0.92rem)', color: isDark ? '#fde68a' : '#92400e' }}>Pass Mark: {passPercent}%</span>
                  </div>
                  <p style={{ fontSize: 'clamp(0.72rem,1.8vw,0.8rem)', color: isDark ? '#fcd34d' : '#78350f', margin: 0, lineHeight: '1.55' }}>
                    Score <strong>{passPercent}% or above</strong> to earn your certificate. Your result is shown instantly after submission.
                  </p>
                </div>
                <div style={{ position: 'relative', background: isDark ? 'rgba(239,68,68,0.12)' : 'rgba(239,68,68,0.07)', border: `1.5px solid rgba(239,68,68,0.35)`, borderRadius: '16px', padding: '1rem 1.1rem', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: '-18px', right: '-18px', width: '70px', height: '70px', borderRadius: '50%', background: 'rgba(239,68,68,0.12)', pointerEvents: 'none' }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                    <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'linear-gradient(135deg, #ef4444, #dc2626)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Lock size={17} color="#fff" /></div>
                    <span style={{ fontWeight: '800', fontSize: 'clamp(0.82rem,2.2vw,0.92rem)', color: isDark ? '#fca5a5' : '#991b1b' }}>7-Day Lock (All Tests)</span>
                  </div>
                  <p style={{ fontSize: 'clamp(0.72rem,1.8vw,0.8rem)', color: isDark ? '#f87171' : '#7f1d1d', margin: 0, lineHeight: '1.55' }}>
                    After submitting <strong>any test</strong> (Basic, Advanced, or Pro), it locks for <strong>7 days</strong>. Basic test is free again after the lock ends.
                  </p>
                </div>
                <div style={{ position: 'relative', background: isDark ? 'rgba(16,185,129,0.12)' : 'rgba(16,185,129,0.08)', border: `1.5px solid rgba(16,185,129,0.4)`, borderRadius: '16px', padding: '1rem 1.1rem', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: '-18px', right: '-18px', width: '70px', height: '70px', borderRadius: '50%', background: 'rgba(16,185,129,0.12)', pointerEvents: 'none' }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                    <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'linear-gradient(135deg, #10b981, #059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Award size={17} color="#fff" /></div>
                    <span style={{ fontWeight: '800', fontSize: 'clamp(0.82rem,2.2vw,0.92rem)', color: isDark ? '#6ee7b7' : '#065f46' }}>Basic Test &amp; Certificate</span>
                  </div>
                  <p style={{ fontSize: 'clamp(0.72rem,1.8vw,0.8rem)', color: isDark ? '#34d399' : '#064e3b', margin: 0, lineHeight: '1.55' }}>
                    The Basic test is <strong>completely free</strong>. After passing, you can download your certificate for a small fee. Advanced &amp; Pro certificates are included free with the test.
                  </p>
                </div>
              </div>
              <div style={{ padding: 'clamp(0.7rem,2vw,0.9rem) clamp(0.85rem,2.5vw,1.1rem)', background: isDark ? 'rgba(245,158,11,0.1)' : 'rgba(245,158,11,0.08)', borderRadius: '12px', border: '1.5px dashed rgba(245,158,11,0.45)', display: 'flex', alignItems: 'flex-start', gap: '0.7rem' }}>
                <Smartphone size={18} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div style={{ fontWeight: '800', color: '#f59e0b', marginBottom: '0.3rem', fontSize: 'clamp(0.75rem,2vw,0.85rem)' }}>📱 How to enable desktop mode on mobile</div>
                  <div style={{ fontSize: 'clamp(0.7rem,1.8vw,0.8rem)', color: isDark ? '#cbd5e1' : '#475569' }}>
                    Open browser menu (⋮ or ⋯) → tap <strong>"Desktop site"</strong> → page reloads in full desktop layout
                  </div>
                </div>
              </div>
            </div>

            {/* Plan Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))', gap: '2rem', marginBottom: '3rem' }}>
              {Object.values(SUBSCRIPTION_PLANS).map((plan, index) => {
                const status               = testStatus[plan.level] || {};
                const hasCert              = userCertificates.find(c => c.level === plan.level);
                const userIsAdmin          = isAdmin(user?.email);
                const timeRemainingDisplay = status.timeRemaining ? formatTimeRemaining(status.timeRemaining) : '';
                const isBasic              = plan.level === 'basic';
                const priceDisplay         = userIsAdmin ? 'FREE' : isBasic ? 'FREE' : isIndia
                  ? `₹${prices[plan.level] ?? plan.price}`
                  : `${geoData?.symbol || '$'}${geoData?.[plan.level] || geoData?.basic || 2.99}`;

                return (
                  <div key={plan.id} style={{ background: isDark ? '#1e293b' : '#fff', borderRadius: '24px', padding: 'clamp(1.5rem,4vw,2rem)', boxShadow: '0 10px 40px rgba(0,0,0,0.2)', position: 'relative', overflow: 'hidden', animation: `fadeInUp 0.6s ease ${index * 0.1}s backwards`, border: isBasic ? '3px solid #10b981' : plan.badge ? '3px solid #fbbf24' : 'none' }}>
                    {isBasic && (<div style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', padding: '0.4rem 0.9rem', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '700' }}>🆓 ALWAYS FREE</div>)}
                    {!isBasic && plan.badge && (<div style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', color: '#fff', padding: '0.4rem 0.9rem', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '700' }}>{plan.badge}</div>)}
                    {userIsAdmin && (<div style={{ position: 'absolute', top: '1rem', left: '1rem', background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', padding: '0.4rem 0.9rem', borderRadius: '20px', fontSize: '0.65rem', fontWeight: '700' }}>🔓 ADMIN FREE</div>)}
                    <div style={{ textAlign: 'center', marginBottom: '1.5rem', marginTop: (userIsAdmin || isBasic || plan.badge) ? '2.5rem' : '0' }}>
                      <div style={{ width: 'clamp(60px,15vw,80px)', height: 'clamp(60px,15vw,80px)', background: plan.level === 'basic' ? 'linear-gradient(135deg, #10b981, #059669)' : plan.level === 'advanced' ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'linear-gradient(135deg, #f59e0b, #d97706)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', fontSize: 'clamp(1.5rem,5vw,2.5rem)', boxShadow: '0 8px 20px rgba(0,0,0,0.15)' }}>
                        {plan.level === 'basic' ? '🌱' : plan.level === 'advanced' ? '🔥' : '⭐'}
                      </div>
                      <h2 style={{ fontSize: 'clamp(1.3rem,4vw,1.8rem)', fontWeight: '900', color: isDark ? '#e2e8f0' : '#1e293b', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                        <PythonLogo size={28} /> {plan.level}
                      </h2>
                      <p style={{ color: isDark ? '#94a3b8' : '#64748b', fontSize: 'clamp(0.8rem,2.5vw,0.95rem)', marginBottom: '1rem' }}>{plan.description}</p>
                      <div style={{ fontSize: 'clamp(2rem,6vw,2.5rem)', fontWeight: '900', color: isBasic || userIsAdmin ? '#10b981' : '#6366f1', marginBottom: '0.25rem' }}>{priceDisplay}</div>
                      {isBasic ? (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: isDark ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.4)', borderRadius: '20px', padding: '0.3rem 0.75rem', fontSize: '0.75rem', color: '#10b981', fontWeight: '700' }}>
                          <Award size={13} /> Test FREE · Certificate requires payment after passing
                        </div>
                      ) : (
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: isDark ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '20px', padding: '0.3rem 0.75rem', fontSize: '0.75rem', color: '#6366f1', fontWeight: '700' }}>
                          <Award size={13} /> Certificate included free
                        </div>
                      )}
                    </div>
                    <div style={{ background: isDark ? 'rgba(99,102,241,0.05)' : 'rgba(99,102,241,0.03)', borderRadius: '16px', padding: '1.25rem', marginBottom: '1.5rem' }}>
                      {plan.features.map((feature, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: idx === plan.features.length - 1 ? 0 : '0.75rem', fontSize: 'clamp(0.8rem,2.5vw,0.9rem)', color: isDark ? '#cbd5e1' : '#475569' }}>
                          <CheckCircle size={18} color="#10b981" style={{ flexShrink: 0 }} /><span>{feature}</span>
                        </div>
                      ))}
                    </div>
                    {hasCert && (<div style={{ padding: '0.65rem', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '8px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: '#6366f1', fontWeight: '600' }}><Award size={16}/>Certificate Earned ✅</div>)}
                    {!isBasic && status.status === 'grace_period' && (<div style={{ padding: '0.65rem', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '8px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: '#10b981', fontWeight: '600' }}><Unlock size={16}/>Available — {timeRemainingDisplay} left</div>)}
                    {!isBasic && status.status === 'in_progress' && (<div style={{ padding: '0.65rem', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '8px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: '#f59e0b', fontWeight: '600' }}><TrendingUp size={16}/>Test In Progress — Resume</div>)}
                    {status.status === 'locked' && (
                      <div style={{ padding: '0.65rem', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: '#ef4444', fontWeight: '600' }}>
                        <Lock size={16}/>Locked — {timeRemainingDisplay} remaining
                      </div>
                    )}
                    <button onClick={() => handleSelectPlan(plan)}
                      disabled={!userIsAdmin && status.status === 'locked'}
                      style={{
                        width: '100%',
                        background: (!userIsAdmin && status.status === 'locked') ? 'rgba(99,102,241,0.3)'
                          : isBasic || userIsAdmin ? 'linear-gradient(135deg, #10b981, #059669)'
                          : (status.status === 'grace_period' || status.status === 'in_progress') ? 'linear-gradient(135deg, #10b981, #059669)'
                          : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        border: 'none', color: '#fff', padding: 'clamp(1rem,3vw,1.25rem)', borderRadius: '16px',
                        fontSize: 'clamp(0.9rem,2.5vw,1.1rem)', fontWeight: '700',
                        cursor: (!userIsAdmin && status.status === 'locked') ? 'not-allowed' : 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
                        boxShadow: '0 4px 20px rgba(99,102,241,0.4)', textTransform: 'uppercase', letterSpacing: '1px',
                        opacity: (!userIsAdmin && status.status === 'locked') ? 0.6 : 1,
                      }}>
                      {isBasic && status.status === 'locked' ? <><Lock size={22}/>{timeRemainingDisplay} remaining</>
                        : isBasic ? <><Zap size={22}/>Start Free Test</>
                        : userIsAdmin ? <><Zap size={22}/>Admin — Free Test</>
                        : status.status === 'locked' ? <><Lock size={22}/>{timeRemainingDisplay} remaining</>
                        : status.status === 'grace_period' || status.status === 'in_progress' ? <><Zap size={22}/>{status.status === 'in_progress' ? 'Resume Test' : 'Start Test'}</>
                        : <><Zap size={22}/>Buy / Use Coupon ({priceDisplay})</>
                      }
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── CERTIFICATES TAB ── */}
        {activeTab === 'certificates' && (
          <div style={{ animation: `${slideDir === 'right' ? 'slideInRight' : 'slideInLeft'} 0.35s cubic-bezier(0.25,0.46,0.45,0.94) both` }}>
            <Certificatesection userCertificates={userCertificates} testHistory={[]} isDark={isDark}
              onViewCertificate={setSelectedCertificate} onDeleteCertificate={handleDeleteCertificate}
              onDeleteTest={handleDeleteClick} aiReports={{}} />
          </div>
        )}

        {/* ── RESULTS TAB ── */}
        {activeTab === 'results' && (
          <div style={{ animation: `${slideDir === 'right' ? 'slideInRight' : 'slideInLeft'} 0.35s cubic-bezier(0.25,0.46,0.45,0.94) both` }}>
            <Certificatesection userCertificates={[]} testHistory={testHistory} isDark={isDark}
              onViewCertificate={setSelectedCertificate} onDeleteCertificate={handleDeleteCertificate}
              onDeleteTest={handleDeleteClick} aiReports={aiReports} />
          </div>
        )}

        {/* ── ADMIN TAB ── */}
        {activeTab === 'admin' && isAdmin(user?.email) && (
          <div style={{ animation: `${slideDir === 'right' ? 'slideInRight' : 'slideInLeft'} 0.35s cubic-bezier(0.25,0.46,0.45,0.94) both` }}>
            <MockTestAdminTab isDark={isDark} />
          </div>
        )}

        {selectedCertificate && <CertificateViewer certificate={selectedCertificate} onClose={() => setSelectedCertificate(null)} user={user} />}

        {/* Delete Test Dialog */}
        {showDeleteDialog && testToDelete && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, backdropFilter: 'blur(8px)', padding: '1rem' }}>
            <div style={{ background: isDark ? '#1e293b' : '#fff', padding: 'clamp(2rem,5vw,3rem)', borderRadius: '24px', maxWidth: '480px', width: '100%', boxShadow: '0 25px 50px rgba(0,0,0,0.5)', border: `3px solid ${isDark ? '#ef4444' : '#fecaca'}` }}>
              <div style={{ width: '80px', height: '80px', margin: '0 auto 1.5rem', background: 'linear-gradient(135deg,#ef4444,#dc2626)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><XCircle size={44} color="#fff" /></div>
              <h2 style={{ fontSize: '1.6rem', fontWeight: '900', color: isDark ? '#e2e8f0' : '#1e293b', marginBottom: '1rem', textAlign: 'center' }}>Delete Test Result?</h2>
              <div style={{ background: isDark ? 'rgba(239,68,68,0.1)' : 'rgba(254,202,202,0.3)', border: `2px solid ${isDark ? 'rgba(239,68,68,0.3)' : '#fecaca'}`, borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem' }}>
                <div style={{ fontSize: '0.88rem', color: isDark ? '#cbd5e1' : '#475569', lineHeight: 1.6 }}>
                  <div><strong>Test:</strong> {testToDelete.planName}</div>
                  <div><strong>Score:</strong> {testToDelete.score}%</div>
                  <div><strong>Date:</strong> {testToDelete.testDate || testToDelete.date}</div>
                </div>
              </div>
              <p style={{ fontSize: '0.95rem', color: isDark ? '#94a3b8' : '#64748b', textAlign: 'center', marginBottom: '2rem' }}>⚠️ This action <strong>cannot be undone</strong>.</p>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button onClick={handleCancelDelete} style={{ flex: 1, padding: '1rem', background: isDark ? '#334155' : '#f1f5f9', border: 'none', borderRadius: '12px', color: isDark ? '#e2e8f0' : '#475569', fontWeight: '700', cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleConfirmDelete} style={{ flex: 1, padding: '1rem', background: 'linear-gradient(135deg,#ef4444,#dc2626)', border: 'none', borderRadius: '12px', color: '#fff', fontWeight: '800', cursor: 'pointer' }}>Yes, Delete</button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Certificate Dialog */}
        {showDeleteCertDialog && certToDelete && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, backdropFilter: 'blur(8px)', padding: '1rem' }}>
            <div style={{ background: isDark ? '#1e293b' : '#fff', padding: 'clamp(2rem,5vw,3rem)', borderRadius: '24px', maxWidth: '480px', width: '100%', boxShadow: '0 25px 50px rgba(0,0,0,0.5)', border: `3px solid ${isDark ? '#f59e0b' : '#fbbf24'}` }}>
              <div style={{ width: '80px', height: '80px', margin: '0 auto 1.5rem', background: 'linear-gradient(135deg,#f59e0b,#d97706)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Award size={44} color="#fff" /></div>
              <h2 style={{ fontSize: '1.6rem', fontWeight: '900', color: isDark ? '#e2e8f0' : '#1e293b', marginBottom: '1rem', textAlign: 'center' }}>Delete Certificate?</h2>
              <div style={{ background: isDark ? 'rgba(245,158,11,0.1)' : 'rgba(251,191,36,0.2)', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem', border: `2px solid ${isDark ? 'rgba(245,158,11,0.3)' : '#fbbf24'}` }}>
                <div style={{ fontSize: '0.88rem', color: isDark ? '#cbd5e1' : '#475569', lineHeight: 1.6 }}>
                  <div><strong>Test:</strong> {certToDelete.testName}</div>
                  <div><strong>Level:</strong> {certToDelete.level}</div>
                  <div><strong>Score:</strong> {certToDelete.score}%</div>
                  <div><strong>ID:</strong> {certToDelete.certificateId}</div>
                </div>
              </div>
              <p style={{ fontSize: '0.95rem', color: isDark ? '#94a3b8' : '#64748b', textAlign: 'center', marginBottom: '2rem' }}>⚠️ This will permanently delete your certificate.</p>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button onClick={handleCancelCertDelete} style={{ flex: 1, padding: '1rem', background: isDark ? '#334155' : '#f1f5f9', border: 'none', borderRadius: '12px', color: isDark ? '#e2e8f0' : '#475569', fontWeight: '700', cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleConfirmCertDelete} style={{ flex: 1, padding: '1rem', background: 'linear-gradient(135deg,#f59e0b,#d97706)', border: 'none', borderRadius: '12px', color: '#fff', fontWeight: '800', cursor: 'pointer' }}>Yes, Delete</button>
              </div>
            </div>
          </div>
        )}

        {/* Coupon Modal */}
        {showCouponModal && couponPlan && (
          <CouponModal plan={couponPlan} prices={prices} isDark={isDark}
            onClose={() => setShowCouponModal(false)}
            onFreeAccess={(couponResult) => handleFreeUnlock(couponPlan, couponResult)}
            onProceedPayment={(finalPrice, couponResult) => { setShowCouponModal(false); handlePayment(couponPlan, finalPrice, couponResult); }}
          />
        )}
      </div>

      <style>{`
        @keyframes fadeInUp  { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn    { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideInLeft  { from { opacity: 0; transform: translateX(-48px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes slideInRight { from { opacity: 0; transform: translateX(48px);  } to { opacity: 1; transform: translateX(0); } }
        @keyframes livePulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.4; transform: scale(0.85); } }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        div::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}

export default MockTestPage;