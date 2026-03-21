import { db } from '../firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  addDoc,
  Timestamp
} from 'firebase/firestore';

// ==========================================
// 🔥 MOCK TEST SERVICE - Complete Logic
// ==========================================

/**
 * Get manual questions for a specific level
 */
export const getManualQuestions = async (level) => {
  try {
    console.log(`🔍 Fetching questions for level: ${level}`);
    const q = query(
      collection(db, 'manualQuestions'),
      where('level', '==', level),
      where('source', '==', 'manual')
    );
    const snapshot = await getDocs(q);
    console.log(`📊 Found ${snapshot.docs.length} questions for ${level}`);
    const questions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    if (questions.length === 0) {
      console.warn(`⚠️ No questions found for level: ${level}`);
      return {
        success: false,
        error: `No questions available for ${level} level. Please add questions in Admin Panel first.`,
        questions: []
      };
    }
    const shuffled = questions.sort(() => Math.random() - 0.5).slice(0, 60);
    console.log(`✅ Returning ${shuffled.length} shuffled questions`);
    return { success: true, questions: shuffled };
  } catch (error) {
    console.error('❌ Error fetching questions:', error);
    return { success: false, error: error.message, questions: [] };
  }
};

/**
 * Get payment details for a specific level
 */
export const getPaymentDetails = async (userId, level) => {
  try {
    const paymentRef = doc(db, 'users', userId, 'mockTestPayments', level);
    const paymentDoc = await getDoc(paymentRef);
    if (paymentDoc.exists()) {
      return { hasPaid: true, ...paymentDoc.data() };
    } else {
      return { hasPaid: false };
    }
  } catch (error) {
    console.error('❌ Error fetching payment details:', error);
    return { hasPaid: false, error: error.message };
  }
};

/**
 * Check if user can take test (with grace period and lock logic)
 */
export const canUserTakeTest = async (userId, level) => {
  try {
    // Basic is always free
    if (level === 'basic') return { canTake: true, message: '✅ Free test — start anytime!', status: 'available' };

    const payment = await getPaymentDetails(userId, level);
    if (!payment.hasPaid) return { canTake: false, message: '💳 Purchase required to take this test' };

    const now = new Date();
    if (payment.purchaseValidUntil) {
      const gracePeriodEnd = new Date(payment.purchaseValidUntil);
      if (now < gracePeriodEnd && !payment.testSubmittedAt) {
        const hoursLeft = Math.ceil((gracePeriodEnd - now) / (1000 * 60 * 60));
        return { canTake: true, message: `✅ Test available - ${hoursLeft} hours left`, status: 'grace_period', timeRemaining: gracePeriodEnd - now };
      }
    }
    if (payment.testStartedAt && !payment.testSubmittedAt) {
      return { canTake: true, message: '📝 Resume your test', status: 'in_progress' };
    }
    if (payment.lockEndsAt) {
      const lockEnd = new Date(payment.lockEndsAt);
      if (now < lockEnd) {
        const daysRemaining = Math.ceil((lockEnd - now) / (1000 * 60 * 60 * 24));
        const hoursRemaining = Math.ceil((lockEnd - now) / (1000 * 60 * 60));
        let timeMessage = daysRemaining > 0
          ? `${daysRemaining}d ${Math.ceil(((lockEnd - now) % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))}h`
          : `${hoursRemaining}h`;
        return { canTake: false, message: `🔒 Test locked. Available in ${timeMessage}`, status: 'locked', nextAvailable: lockEnd.toISOString(), timeRemaining: lockEnd - now };
      }
    }
    return { canTake: false, message: '💳 Purchase again to retake this test', status: 'available' };
  } catch (error) {
    console.error('❌ Error checking test eligibility:', error);
    return { canTake: false, message: 'Error checking eligibility', error: error.message };
  }
};

/**
 * Check if user already has certificate for this level
 */
export const hasCertificateForLevel = async (userId, level) => {
  try {
    const certRef = doc(db, 'users', userId, 'certificates', level);
    const certDoc = await getDoc(certRef);
    return { hasCertificate: certDoc.exists(), certificate: certDoc.exists() ? certDoc.data() : null };
  } catch (error) {
    console.error('❌ Error checking certificate:', error);
    return { hasCertificate: false, certificate: null, error: error.message };
  }
};

/**
 * Save test result to history
 */
export const saveTestResult = async (userId, testData) => {
  try {
    const testRef = collection(db, 'users', userId, 'mockTests');
    const result = {
      ...testData,
      timestamp: Timestamp.now(),
      date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
    };
    await addDoc(testRef, result);
    return { success: true, message: 'Test result saved successfully' };
  } catch (error) {
    console.error('❌ Error saving test result:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Delete test result from history
 */
export const deleteTestResult = async (userId, testId) => {
  try {
    const testRef = doc(db, 'users', userId, 'mockTests', testId);
    await deleteDoc(testRef);
    console.log(`✅ Test result deleted: ${testId}`);
    return { success: true, message: 'Test result deleted successfully' };
  } catch (error) {
    console.error('❌ Error deleting test result:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Issue certificate
 * Basic: certificate issued but download requires ₹29 (handled in CertificateViewer)
 * Advanced/Pro: certificate issued, download free
 */
export const issueCertificate = async (userId, certificateData) => {
  try {
    console.log('🎓 Starting certificate issuance...');
    const { level, userEmail } = certificateData;
    if (!level) return { success: false, error: 'Level is required' };
    if (!userEmail) return { success: false, error: 'User email is required' };

    const adminUser = userEmail === 'luckyfaizu3@gmail.com';

    if (!adminUser) {
      const certCheck = await hasCertificateForLevel(userId, level);
      if (certCheck.hasCertificate) {
        return { success: false, message: 'Certificate already issued for this level', alreadyExists: true };
      }
    }

    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substr(2, 9).toUpperCase();
    const certId = `CERT-${level.toUpperCase()}-${timestamp}-${randomStr}`;

    const certificate = {
      ...certificateData,
      certificateId: certId,
      userId,
      issuedAt: new Date().toISOString(),
      timestamp: Timestamp.now(),
      isAdminCert: adminUser || false
    };

    if (adminUser) {
      const docId = `${level}_${timestamp}`;
      await setDoc(doc(db, 'users', userId, 'certificates', docId), certificate);
      console.log('✅ Admin certificate issued:', docId);
    } else {
      await setDoc(doc(db, 'users', userId, 'certificates', level), certificate);
      console.log('✅ Certificate issued for level:', level);
    }

    // Also save to public collection for QR verification
    try {
      await setDoc(doc(db, 'certificatesPublic', certId), { ...certificate, timestamp: Timestamp.now() });
      console.log('✅ Certificate saved to certificatesPublic');
    } catch (publicErr) {
      console.warn('⚠️ Failed to save to certificatesPublic:', publicErr.message);
    }

    return { success: true, certificate, message: 'Certificate issued successfully' };
  } catch (error) {
    console.error('❌ Error issuing certificate:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get user's certificate for a specific level
 */
export const getCertificate = async (userId, level) => {
  try {
    const certRef = doc(db, 'users', userId, 'certificates', level);
    const certDoc = await getDoc(certRef);
    if (!certDoc.exists()) return { success: false, message: 'Certificate not found' };
    return { success: true, certificate: certDoc.data() };
  } catch (error) {
    console.error('❌ Error fetching certificate:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all user certificates
 */
export const getAllCertificates = async (userId) => {
  try {
    const certsRef = collection(db, 'users', userId, 'certificates');
    const snapshot = await getDocs(certsRef);
    const certificates = snapshot.docs.map(doc => ({
      id: doc.id,
      level: doc.id.includes('_') ? doc.id.split('_')[0] : doc.id,
      ...doc.data()
    }));
    certificates.sort((a, b) => (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0));
    return { success: true, certificates };
  } catch (error) {
    console.error('❌ Error fetching certificates:', error);
    return { success: false, certificates: [], error: error.message };
  }
};

/**
 * Get user's test history
 */
export const getTestHistory = async (userId, level = null) => {
  try {
    const testsRef = collection(db, 'users', userId, 'mockTests');
    const q = level ? query(testsRef, where('level', '==', level)) : query(testsRef);
    const snapshot = await getDocs(q);
    const tests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    tests.sort((a, b) => (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0));
    return { success: true, tests };
  } catch (error) {
    console.error('❌ Error fetching test history:', error);
    return { success: false, tests: [], error: error.message };
  }
};

/**
 * Get user details for certificate
 */
export const getUserDetails = async (userId) => {
  try {
    const detailsRef = doc(db, 'users', userId, 'profile', 'details');
    const detailsDoc = await getDoc(detailsRef);
    if (!detailsDoc.exists()) return { success: false, details: null, message: 'User details not found' };
    return { success: true, details: detailsDoc.data() };
  } catch (error) {
    console.error('❌ Error fetching user details:', error);
    return { success: false, details: null, error: error.message };
  }
};

/**
 * Save user details for certificate
 */
export const saveUserDetails = async (userId, details) => {
  try {
    const detailsRef = doc(db, 'users', userId, 'profile', 'details');
    await setDoc(detailsRef, { ...details, updatedAt: Timestamp.now() });
    return { success: true, message: 'User details saved successfully' };
  } catch (error) {
    console.error('❌ Error saving user details:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Process payment and create payment record with grace period
 */
export const processMockTestPayment = async (userId, planId, paymentData) => {
  try {
    const { level } = paymentData;
    const paymentRef = doc(db, 'users', userId, 'mockTestPayments', level);
    const now = new Date();
    const purchaseValidUntil = new Date(now.getTime() + 12 * 60 * 60 * 1000);
    const payment = {
      planId, hasPaid: true, level,
      amount: paymentData.amount, paymentId: paymentData.paymentId,
      paidAt: paymentData.paidAt || now.toISOString(),
      purchaseValidUntil: purchaseValidUntil.toISOString(),
      testStartedAt: null, testSubmittedAt: null,
      resultsViewedAt: null, lockStartsAt: null, lockEndsAt: null,
      timestamp: Timestamp.now(),
      date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }),
      status: 'completed'
    };
    await setDoc(paymentRef, payment);
    console.log('✅ Payment processed with 12-hour grace period');
    return { success: true, message: 'Payment processed successfully', gracePeriodEnd: purchaseValidUntil.toISOString() };
  } catch (error) {
    console.error('❌ Error processing payment:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Update test attempt progress
 */
export const updateTestAttempt = async (userId, level, updateData) => {
  try {
    const paymentRef = doc(db, 'users', userId, 'mockTestPayments', level);
    const paymentDoc = await getDoc(paymentRef);
    if (!paymentDoc.exists()) {
      const newPayment = {
        planId: `mock-${level}`, hasPaid: true, level,
        testStartedAt: null, testSubmittedAt: null,
        resultsViewedAt: null, lockStartsAt: null, lockEndsAt: null,
        ...updateData,
        timestamp: Timestamp.now(), lastUpdated: Timestamp.now(),
        date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }),
        status: 'completed'
      };
      await setDoc(paymentRef, newPayment);
      return { success: true, message: 'Payment document created and test attempt updated' };
    }
    await updateDoc(paymentRef, { ...updateData, lastUpdated: Timestamp.now() });
    console.log(`✅ Test attempt updated for ${level}`);
    return { success: true, message: 'Test attempt updated successfully' };
  } catch (error) {
    console.error('❌ Error updating test attempt:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Check if user has paid for a level
 */
export const hasUserPaidForLevel = async (userId, level) => {
  try {
    return await getPaymentDetails(userId, level);
  } catch (error) {
    return { hasPaid: false, error: error.message };
  }
};

/**
 * Reset test lock (ADMIN ONLY)
 */
export const resetTestLock = async (userId, level) => {
  try {
    const paymentRef = doc(db, 'users', userId, 'mockTestPayments', level);
    await updateDoc(paymentRef, {
      testStartedAt: null, testSubmittedAt: null,
      resultsViewedAt: null, lockStartsAt: null, lockEndsAt: null,
      lastUpdated: Timestamp.now()
    });
    return { success: true, message: 'Test lock reset successfully' };
  } catch (error) {
    console.error('❌ Error resetting test lock:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get all payments for a user
 */
export const getAllPayments = async (userId) => {
  try {
    const paymentsRef = collection(db, 'users', userId, 'mockTestPayments');
    const snapshot = await getDocs(paymentsRef);
    const payments = snapshot.docs.map(doc => ({ level: doc.id, ...doc.data() }));
    payments.sort((a, b) => (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0));
    return { success: true, payments };
  } catch (error) {
    console.error('❌ Error fetching payments:', error);
    return { success: false, payments: [], error: error.message };
  }
};

/**
 * Extend grace period (ADMIN ONLY)
 */
export const extendGracePeriod = async (userId, level, additionalHours = 12) => {
  try {
    const paymentRef = doc(db, 'users', userId, 'mockTestPayments', level);
    const paymentDoc = await getDoc(paymentRef);
    if (!paymentDoc.exists()) return { success: false, message: 'Payment not found' };
    const payment = paymentDoc.data();
    const currentGracePeriod = new Date(payment.purchaseValidUntil);
    const newGracePeriod = new Date(currentGracePeriod.getTime() + additionalHours * 60 * 60 * 1000);
    await updateDoc(paymentRef, {
      purchaseValidUntil: newGracePeriod.toISOString(),
      graceExtended: true, graceExtensionHours: additionalHours, lastUpdated: Timestamp.now()
    });
    return { success: true, message: `Grace period extended by ${additionalHours} hours`, newGracePeriodEnd: newGracePeriod.toISOString() };
  } catch (error) {
    console.error('❌ Error extending grace period:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Save certificate payment record
 * Used by CertificateViewer when user pays ₹29 for Basic certificate download
 */
export const saveCertificatePayment = async (userId, level, paymentData) => {
  try {
    const ref = doc(db, 'users', userId, 'certificatePayments', level);
    await setDoc(ref, {
      ...paymentData,
      level,
      hasPaid: true,
      paidAt: new Date().toISOString(),
      timestamp: Timestamp.now(),
    });
    console.log(`✅ Certificate payment saved for level: ${level}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Error saving certificate payment:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Check if user has paid for certificate download
 * Basic = ₹29 required | Advanced/Pro = free (test was paid)
 */
export const hasPaidForCertificate = async (userId, level) => {
  try {
    // Advanced and Pro certificates are always free to download
    if (level === 'advanced' || level === 'pro') return { hasPaid: true };

    const ref = doc(db, 'users', userId, 'certificatePayments', level);
    const snap = await getDoc(ref);
    return { hasPaid: snap.exists(), ...(snap.exists() ? snap.data() : {}) };
  } catch (error) {
    console.error('❌ Error checking certificate payment:', error);
    return { hasPaid: false, error: error.message };
  }
};