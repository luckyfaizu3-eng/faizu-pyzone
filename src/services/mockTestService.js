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
// 🔥 MOCK TEST SERVICE - Complete Fixed Logic
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
    
    const questions = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    if (questions.length === 0) {
      console.warn(`⚠️ No questions found for level: ${level}`);
      return {
        success: false,
        error: `No questions available for ${level} level. Please add questions in Admin Panel first.`,
        questions: []
      };
    }

    // Shuffle and return max 60 questions
    const shuffled = questions.sort(() => Math.random() - 0.5).slice(0, 60);
    console.log(`✅ Returning ${shuffled.length} shuffled questions`);
    
    return {
      success: true,
      questions: shuffled
    };
  } catch (error) {
    console.error('❌ Error fetching questions:', error);
    return {
      success: false,
      error: error.message,
      questions: []
    };
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
      return {
        hasPaid: true,
        ...paymentDoc.data()
      };
    } else {
      return {
        hasPaid: false
      };
    }
  } catch (error) {
    console.error('❌ Error fetching payment details:', error);
    return {
      hasPaid: false,
      error: error.message
    };
  }
};

/**
 * Check if user can take test (with grace period and lock logic)
 */
export const canUserTakeTest = async (userId, level) => {
  try {
    const payment = await getPaymentDetails(userId, level);
    
    if (!payment.hasPaid) {
      return {
        canTake: false,
        message: '💳 Purchase required to take this test'
      };
    }

    const now = new Date();

    if (payment.purchaseValidUntil) {
      const gracePeriodEnd = new Date(payment.purchaseValidUntil);
      if (now < gracePeriodEnd && !payment.testSubmittedAt) {
        const hoursLeft = Math.ceil((gracePeriodEnd - now) / (1000 * 60 * 60));
        return {
          canTake: true,
          message: `✅ Test available - ${hoursLeft} hours left in grace period`,
          status: 'grace_period',
          timeRemaining: gracePeriodEnd - now
        };
      }
    }

    if (payment.testStartedAt && !payment.testSubmittedAt) {
      return {
        canTake: true,
        message: '📝 Resume your test',
        status: 'in_progress'
      };
    }

    if (payment.lockEndsAt) {
      const lockEnd = new Date(payment.lockEndsAt);
      if (now < lockEnd) {
        const daysRemaining = Math.ceil((lockEnd - now) / (1000 * 60 * 60 * 24));
        const hoursRemaining = Math.ceil((lockEnd - now) / (1000 * 60 * 60));
        
        let timeMessage;
        if (daysRemaining > 0) {
          const remainingHours = Math.ceil(((lockEnd - now) % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          timeMessage = `${daysRemaining}d ${remainingHours}h`;
        } else {
          timeMessage = `${hoursRemaining}h`;
        }
        
        return {
          canTake: false,
          message: `🔒 Test locked. Available in ${timeMessage}`,
          status: 'locked',
          nextAvailable: lockEnd.toISOString(),
          timeRemaining: lockEnd - now
        };
      }
    }

    return {
      canTake: false,
      message: '💳 Purchase again to retake this test',
      status: 'available'
    };
  } catch (error) {
    console.error('❌ Error checking test eligibility:', error);
    return {
      canTake: false,
      message: 'Error checking eligibility',
      error: error.message
    };
  }
};

/**
 * Check if user already has certificate for this level
 */
export const hasCertificateForLevel = async (userId, level) => {
  try {
    const certRef = doc(db, 'users', userId, 'certificates', level);
    const certDoc = await getDoc(certRef);
    
    return {
      hasCertificate: certDoc.exists(),
      certificate: certDoc.exists() ? certDoc.data() : null
    };
  } catch (error) {
    console.error('❌ Error checking certificate:', error);
    return {
      hasCertificate: false,
      certificate: null,
      error: error.message
    };
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
      date: new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      })
    };

    await addDoc(testRef, result);

    return {
      success: true,
      message: 'Test result saved successfully'
    };
  } catch (error) {
    console.error('❌ Error saving test result:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Delete test result from history
 */
export const deleteTestResult = async (userId, testId) => {
  try {
    const testRef = doc(db, 'users', userId, 'mockTests', testId);
    await deleteDoc(testRef);
    
    console.log(`✅ Test result deleted: ${testId} for user ${userId}`);
    
    return {
      success: true,
      message: 'Test result deleted successfully'
    };
  } catch (error) {
    console.error('❌ Error deleting test result:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Issue certificate (ONE per level for regular users, unlimited for admin)
 * ✅ FIX: Also saves to top-level certificatesPublic collection
 *         so VerifyCertificate page can find it without a collectionGroup index
 */
export const issueCertificate = async (userId, certificateData) => {
  try {
    console.log('🎓 Starting certificate issuance...');
    console.log('📋 User ID:', userId);
    console.log('📋 Certificate Data:', certificateData);
    
    const { level, userEmail } = certificateData;
    
    if (!level) {
      console.error('❌ Missing level in certificateData');
      return { success: false, error: 'Level is required' };
    }
    
    if (!userEmail) {
      console.error('❌ Missing userEmail in certificateData');
      return { success: false, error: 'User email is required' };
    }
    
    const isAdmin = userEmail === 'luckyfaizu3@gmail.com';
    console.log('👤 Is Admin:', isAdmin);
    
    // Check if certificate already exists (skip for admin)
    if (!isAdmin) {
      const certCheck = await hasCertificateForLevel(userId, level);
      console.log('📋 Certificate check result:', certCheck);
      
      if (certCheck.hasCertificate) {
        console.log('ℹ️ Certificate already exists for this level');
        return {
          success: false,
          message: 'Certificate already issued for this level (one per level)',
          alreadyExists: true
        };
      }
    }

    // Generate unique certificate ID
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substr(2, 9).toUpperCase();
    const certId = `CERT-${level.toUpperCase()}-${timestamp}-${randomStr}`;
    
    const certificate = {
      ...certificateData,
      certificateId: certId,
      userId,
      issuedAt: new Date().toISOString(),
      timestamp: Timestamp.now(),
      isAdminCert: isAdmin || false
    };

    console.log('📋 Final certificate object:', certificate);

    // Save to users/{uid}/certificates subcollection
    if (isAdmin) {
      const docId = `${level}_${timestamp}`;
      const adminCertRef = doc(db, 'users', userId, 'certificates', docId);
      console.log('📁 Saving admin certificate to:', `users/${userId}/certificates/${docId}`);
      await setDoc(adminCertRef, certificate);
      console.log('✅ Admin certificate issued with ID:', docId);
    } else {
      const certRef = doc(db, 'users', userId, 'certificates', level);
      console.log('📁 Saving user certificate to:', `users/${userId}/certificates/${level}`);
      await setDoc(certRef, certificate);
      console.log('✅ Certificate issued for level:', level);
    }

    // ✅ FIX: Also save to top-level certificatesPublic collection
    // This allows VerifyCertificate page to find cert by ID without
    // a collectionGroup index — simple where() query on a flat collection
    try {
      const publicCertRef = doc(db, 'certificatesPublic', certId);
      await setDoc(publicCertRef, {
        ...certificate,
        // Exclude heavy/unnecessary fields from public record
        timestamp: Timestamp.now(),
      });
      console.log('✅ Certificate also saved to certificatesPublic for QR verification');
    } catch (publicErr) {
      // Non-fatal — user still gets their cert, QR verify may not work for this cert
      console.warn('⚠️ Failed to save to certificatesPublic:', publicErr.message);
    }

    console.log('🎉 Certificate successfully saved to Firebase!');

    return {
      success: true,
      certificate,
      message: 'Certificate issued successfully'
    };
  } catch (error) {
    console.error('❌ Error issuing certificate:', error);
    console.error('❌ Error details:', error.message);
    console.error('❌ Error stack:', error.stack);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get user's certificate for a specific level
 */
export const getCertificate = async (userId, level) => {
  try {
    const certRef = doc(db, 'users', userId, 'certificates', level);
    const certDoc = await getDoc(certRef);
    
    if (!certDoc.exists()) {
      return {
        success: false,
        message: 'Certificate not found'
      };
    }

    return {
      success: true,
      certificate: certDoc.data()
    };
  } catch (error) {
    console.error('❌ Error fetching certificate:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get all user certificates (including admin unlimited certificates)
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

    // Sort by timestamp (newest first)
    certificates.sort((a, b) => {
      const timeA = a.timestamp?.toMillis() || 0;
      const timeB = b.timestamp?.toMillis() || 0;
      return timeB - timeA;
    });

    return {
      success: true,
      certificates
    };
  } catch (error) {
    console.error('❌ Error fetching certificates:', error);
    return {
      success: false,
      certificates: [],
      error: error.message
    };
  }
};

/**
 * Get user's test history (sorted by date)
 */
export const getTestHistory = async (userId, level = null) => {
  try {
    const testsRef = collection(db, 'users', userId, 'mockTests');
    
    let q;
    if (level) {
      q = query(testsRef, where('level', '==', level));
    } else {
      q = query(testsRef);
    }
    
    const snapshot = await getDocs(q);
    const tests = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Sort in memory by timestamp (newest first)
    tests.sort((a, b) => {
      const timeA = a.timestamp?.toMillis() || 0;
      const timeB = b.timestamp?.toMillis() || 0;
      return timeB - timeA;
    });

    return {
      success: true,
      tests
    };
  } catch (error) {
    console.error('❌ Error fetching test history:', error);
    return {
      success: false,
      tests: [],
      error: error.message
    };
  }
};

/**
 * Get user details for certificate
 */
export const getUserDetails = async (userId) => {
  try {
    const detailsRef = doc(db, 'users', userId, 'profile', 'details');
    const detailsDoc = await getDoc(detailsRef);
    
    if (!detailsDoc.exists()) {
      return {
        success: false,
        details: null,
        message: 'User details not found'
      };
    }

    return {
      success: true,
      details: detailsDoc.data()
    };
  } catch (error) {
    console.error('❌ Error fetching user details:', error);
    return {
      success: false,
      details: null,
      error: error.message
    };
  }
};

/**
 * Save user details for certificate
 */
export const saveUserDetails = async (userId, details) => {
  try {
    const detailsRef = doc(db, 'users', userId, 'profile', 'details');
    
    const data = {
      ...details,
      updatedAt: Timestamp.now()
    };

    await setDoc(detailsRef, data);

    return {
      success: true,
      message: 'User details saved successfully'
    };
  } catch (error) {
    console.error('❌ Error saving user details:', error);
    return {
      success: false,
      error: error.message
    };
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
      planId,
      hasPaid: true,
      level,
      amount: paymentData.amount,
      paymentId: paymentData.paymentId,
      paidAt: paymentData.paidAt || now.toISOString(),
      purchaseValidUntil: purchaseValidUntil.toISOString(),
      testStartedAt: null,
      testSubmittedAt: null,
      resultsViewedAt: null,
      lockStartsAt: null,
      lockEndsAt: null,
      timestamp: Timestamp.now(),
      date: new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      }),
      status: 'completed'
    };

    await setDoc(paymentRef, payment);
    console.log('✅ Payment processed with 12-hour grace period');

    return {
      success: true,
      message: 'Payment processed successfully',
      gracePeriodEnd: purchaseValidUntil.toISOString()
    };
  } catch (error) {
    console.error('❌ Error processing payment:', error);
    return {
      success: false,
      error: error.message
    };
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
      console.log(`⚠️ Payment document not found for ${level}, creating new one...`);
      
      const newPayment = {
        planId: `mock-${level}`,
        hasPaid: true,
        level: level,
        testStartedAt: null,
        testSubmittedAt: null,
        resultsViewedAt: null,
        lockStartsAt: null,
        lockEndsAt: null,
        ...updateData,
        timestamp: Timestamp.now(),
        lastUpdated: Timestamp.now(),
        date: new Date().toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'long',
          year: 'numeric'
        }),
        status: 'completed'
      };
      
      await setDoc(paymentRef, newPayment);
      console.log(`✅ Payment document created for ${level} with update:`, Object.keys(updateData));
      
      return {
        success: true,
        message: 'Payment document created and test attempt updated'
      };
    }
    
    const dataWithTimestamp = {
      ...updateData,
      lastUpdated: Timestamp.now()
    };
    
    await updateDoc(paymentRef, dataWithTimestamp);
    console.log(`✅ Test attempt updated for ${level}:`, Object.keys(updateData));

    return {
      success: true,
      message: 'Test attempt updated successfully'
    };
  } catch (error) {
    console.error('❌ Error updating test attempt:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Check if user has paid for a level
 */
export const hasUserPaidForLevel = async (userId, level) => {
  try {
    return await getPaymentDetails(userId, level);
  } catch (error) {
    console.error('❌ Error checking payment:', error);
    return {
      hasPaid: false,
      error: error.message
    };
  }
};

/**
 * Reset test lock (ADMIN ONLY)
 */
export const resetTestLock = async (userId, level) => {
  try {
    const paymentRef = doc(db, 'users', userId, 'mockTestPayments', level);
    
    await updateDoc(paymentRef, {
      testStartedAt: null,
      testSubmittedAt: null,
      resultsViewedAt: null,
      lockStartsAt: null,
      lockEndsAt: null,
      lastUpdated: Timestamp.now()
    });

    console.log(`✅ Test lock reset for user ${userId}, level ${level}`);

    return {
      success: true,
      message: 'Test lock reset successfully'
    };
  } catch (error) {
    console.error('❌ Error resetting test lock:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get all payments for a user
 */
export const getAllPayments = async (userId) => {
  try {
    const paymentsRef = collection(db, 'users', userId, 'mockTestPayments');
    const snapshot = await getDocs(paymentsRef);
    
    const payments = snapshot.docs.map(doc => ({
      level: doc.id,
      ...doc.data()
    }));

    payments.sort((a, b) => {
      const timeA = a.timestamp?.toMillis() || 0;
      const timeB = b.timestamp?.toMillis() || 0;
      return timeB - timeA;
    });

    return {
      success: true,
      payments
    };
  } catch (error) {
    console.error('❌ Error fetching payments:', error);
    return {
      success: false,
      payments: [],
      error: error.message
    };
  }
};

/**
 * Get test analytics for admin dashboard
 */
export const getTestAnalytics = async () => {
  return {
    success: true,
    analytics: {
      totalAttempts: 0,
      averageScore: 0,
      passRate: 0,
      certificatesIssued: 0,
      revenue: 0
    },
    message: 'Analytics feature - requires Cloud Functions for production use'
  };
};

/**
 * Extend grace period (ADMIN ONLY)
 */
export const extendGracePeriod = async (userId, level, additionalHours = 12) => {
  try {
    const paymentRef = doc(db, 'users', userId, 'mockTestPayments', level);
    const paymentDoc = await getDoc(paymentRef);
    
    if (!paymentDoc.exists()) {
      return { success: false, message: 'Payment not found' };
    }

    const payment = paymentDoc.data();
    const currentGracePeriod = new Date(payment.purchaseValidUntil);
    const newGracePeriod = new Date(currentGracePeriod.getTime() + additionalHours * 60 * 60 * 1000);
    
    await updateDoc(paymentRef, {
      purchaseValidUntil: newGracePeriod.toISOString(),
      graceExtended: true,
      graceExtensionHours: additionalHours,
      lastUpdated: Timestamp.now()
    });

    console.log(`✅ Grace period extended by ${additionalHours} hours for user ${userId}, level ${level}`);

    return {
      success: true,
      message: `Grace period extended by ${additionalHours} hours`,
      newGracePeriodEnd: newGracePeriod.toISOString()
    };
  } catch (error) {
    console.error('❌ Error extending grace period:', error);
    return {
      success: false,
      error: error.message
    };
  }
};