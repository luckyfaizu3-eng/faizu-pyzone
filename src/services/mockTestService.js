import { db } from '../firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
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
 * Check if user can take test (7-day restriction)
 */
export const canUserTakeTest = async (userId, level) => {
  try {
    const testsRef = collection(db, 'users', userId, 'mockTests');
    
    // ✅ Bypass index: fetch all, then sort in memory
    const q = query(
      testsRef,
      where('level', '==', level)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return {
        canTake: true,
        message: 'You can take the test!'
      };
    }

    // Sort in memory instead of database
    const tests = snapshot.docs.map(doc => doc.data());
    tests.sort((a, b) => b.timestamp?.toMillis() - a.timestamp?.toMillis());
    const lastTest = tests[0];

    const lastTestDate = lastTest.timestamp.toDate();
    const now = new Date();
    const daysDiff = (now - lastTestDate) / (1000 * 60 * 60 * 24);

    if (daysDiff < 7) {
      const remainingDays = Math.ceil(7 - daysDiff);
      return {
        canTake: false,
        message: `⏰ You can retake this test in ${remainingDays} day(s)`,
        nextAvailable: new Date(lastTestDate.getTime() + 7 * 24 * 60 * 60 * 1000)
      };
    }

    return {
      canTake: true,
      message: 'You can take the test!'
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
      certificate: null
    };
  }
};

/**
 * Save test result
 */
export const saveTestResult = async (userId, testData) => {
  try {
    const testRef = collection(db, 'users', userId, 'mockTests');
    
    const result = {
      ...testData,
      timestamp: Timestamp.now(),
      date: new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
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
 * Issue certificate (only once per level, EXCEPT for admin)
 */
export const issueCertificate = async (userId, certificateData) => {
  try {
    const { level } = certificateData;
    
    // 🔓 Check if admin (luckyfaizu3@gmail.com gets unlimited certificates)
    const isAdmin = certificateData.userEmail === 'luckyfaizu3@gmail.com';
    
    // Check if certificate already exists (skip for admin)
    if (!isAdmin) {
      const certCheck = await hasCertificateForLevel(userId, level);
      if (certCheck.hasCertificate) {
        return {
          success: false,
          message: 'Certificate already issued for this level',
          alreadyExists: true
        };
      }
    }

    // Generate unique certificate ID
    const timestamp = Date.now();
    const certId = `CERT-${level.toUpperCase()}-${timestamp}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    
    const certificate = {
      ...certificateData,
      certificateId: certId,
      issuedAt: new Date().toISOString(),
      timestamp: Timestamp.now(),
      isAdminCert: isAdmin
    };

    // 🔓 Admin gets certificates in separate collection with timestamp
    if (isAdmin) {
      // Save with timestamp-based ID for unlimited certificates
      const adminCertRef = doc(db, 'users', userId, 'certificates', `${level}_${timestamp}`);
      await setDoc(adminCertRef, certificate);
    } else {
      // Regular users get one certificate per level
      const certRef = doc(db, 'users', userId, 'certificates', level);
      await setDoc(certRef, certificate);
    }

    return {
      success: true,
      certificate,
      message: 'Certificate issued successfully'
    };
  } catch (error) {
    console.error('❌ Error issuing certificate:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get user's certificate for a level
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
 * Get all user certificates
 */
export const getAllCertificates = async (userId) => {
  try {
    const certsRef = collection(db, 'users', userId, 'certificates');
    const snapshot = await getDocs(certsRef);
    
    const certificates = snapshot.docs.map(doc => ({
      level: doc.id,
      ...doc.data()
    }));

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
 * Get user's test history for a level
 */
export const getTestHistory = async (userId, level = null) => {
  try {
    const testsRef = collection(db, 'users', userId, 'mockTests');
    
    // ✅ Bypass index: fetch all, then sort in memory
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

    // Sort in memory instead of database
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
 * Process payment and activate test
 */
export const processMockTestPayment = async (userId, planId, paymentDetails) => {
  try {
    const paymentRef = collection(db, 'users', userId, 'mockTestPayments');
    
    const payment = {
      planId,
      ...paymentDetails,
      timestamp: Timestamp.now(),
      date: new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }),
      status: 'completed'
    };

    await addDoc(paymentRef, payment);

    return {
      success: true,
      message: 'Payment processed successfully'
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
 * Check if user has paid for a level
 */
export const hasUserPaidForLevel = async (userId, level) => {
  try {
    const paymentsRef = collection(db, 'users', userId, 'mockTestPayments');
    const q = query(
      paymentsRef,
      where('level', '==', level),
      where('status', '==', 'completed')
    );
    
    const snapshot = await getDocs(q);
    
    return {
      hasPaid: !snapshot.empty,
      payment: !snapshot.empty ? snapshot.docs[0].data() : null
    };
  } catch (error) {
    console.error('❌ Error checking payment:', error);
    return {
      hasPaid: false,
      payment: null
    };
  }
};