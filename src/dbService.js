import { db } from './firebase';
import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  deleteDoc, 
  updateDoc,
  query,
  orderBy,
  serverTimestamp,
  arrayUnion,
  where,
  setDoc,
  getDoc
} from 'firebase/firestore';

// Cloudinary Config
const CLOUDINARY_CLOUD_NAME = 'dwhkxqnd1';
const CLOUDINARY_UPLOAD_PRESET = 'ml_default';

// Collections
const PRODUCTS_COLLECTION = 'products';
const ORDERS_COLLECTION = 'orders';

export const uploadPDF = async (file, folder = 'pdfs') => {
  try {
    console.log('📤 Uploading PDF to Cloudinary...');
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', folder);
    formData.append('resource_type', 'raw');

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/raw/upload`,
      { method: 'POST', body: formData }
    );

    const result = await response.json();

    if (result.secure_url) {
      const downloadUrl = result.secure_url;
      console.log('✅ PDF uploaded:', downloadUrl);
      return { 
        success: true, 
        url: downloadUrl,
        publicId: result.public_id,
        fileName: file.name 
      };
    }

    console.error('❌ Cloudinary error:', result);
    return { 
      success: false, 
      error: result.error?.message || 'Upload failed' 
    };
  } catch (error) {
    console.error('❌ Upload error:', error.message);
    return { success: false, error: error.message };
  }
};

export const uploadImage = async (file) => {
  try {
    console.log('Uploading image...');
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', 'thumbnails');
    formData.append('resource_type', 'image');

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      { method: 'POST', body: formData }
    );

    const result = await response.json();

    if (result.secure_url) {
      console.log('✅ Image uploaded:', result.secure_url);
      return { success: true, url: result.secure_url, fileName: file.name };
    }

    console.error('❌ Image error:', result);
    return { 
      success: false, 
      error: result.error?.message || 'Image upload failed' 
    };
  } catch (error) {
    console.error('❌ Image error:', error.message);
    return { success: false, error: error.message };
  }
};

export const addProduct = async (productData, userId) => {
  try {
    if (!userId) {
      throw new Error('User ID is required to add product');
    }

    const docRef = await addDoc(collection(db, PRODUCTS_COLLECTION), {
      ...productData,
      userId: userId,
      createdAt: serverTimestamp(),
      totalDownloads: 0,
      reviews: []
    });
    
    console.log('✅ Product added:', docRef.id);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('❌ Add product error:', error.message);
    return { success: false, error: error.message };
  }
};

export const getAllProducts = async () => {
  try {
    const q = query(collection(db, PRODUCTS_COLLECTION), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const products = [];
    querySnapshot.forEach((doc) => {
      products.push({ id: doc.id, ...doc.data() });
    });
    
    console.log('✅ Products fetched:', products.length);
    return { success: true, products };
  } catch (error) {
    console.error('❌ Fetch products error:', error.message);
    
    if (error.message.includes('indexes') || error.message.includes('index')) {
      console.log('⚠️ Fetching without ordering...');
      try {
        const querySnapshot = await getDocs(collection(db, PRODUCTS_COLLECTION));
        const products = [];
        querySnapshot.forEach((doc) => {
          products.push({ id: doc.id, ...doc.data() });
        });
        return { success: true, products };
      } catch (err) {
        return { success: false, error: err.message, products: [] };
      }
    }
    
    return { success: false, error: error.message, products: [] };
  }
};

export const getUserProducts = async (userId) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const q = query(
      collection(db, PRODUCTS_COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const products = [];
    
    querySnapshot.forEach((doc) => {
      products.push({ id: doc.id, ...doc.data() });
    });
    
    console.log('✅ User products fetched:', products.length);
    return { success: true, products };
  } catch (error) {
    console.error('❌ Fetch user products error:', error.message);
    return { success: false, error: error.message, products: [] };
  }
};

export const deleteProduct = async (productId) => {
  try {
    console.log('Deleting product:', productId);
    
    const productRef = doc(db, PRODUCTS_COLLECTION, productId);
    await deleteDoc(productRef);
    
    console.log('✅ Product deleted:', productId);
    return { success: true };
  } catch (error) {
    console.error('❌ Delete error:', error);
    
    if (error.code === 'permission-denied') {
      return { success: false, error: 'Permission denied. You can only delete your own products.' };
    }
    
    return { success: false, error: error.message };
  }
};

export const updateProduct = async (productId, updates) => {
  try {
    const productRef = doc(db, PRODUCTS_COLLECTION, productId);
    await updateDoc(productRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    console.log('✅ Product updated:', productId);
    return { success: true };
  } catch (error) {
    console.error('❌ Update error:', error.message);
    
    if (error.code === 'permission-denied') {
      return { success: false, error: 'Permission denied. You can only update your own products.' };
    }
    
    return { success: false, error: error.message };
  }
};

export const addReview = async (productId, reviewData) => {
  try {
    const productRef = doc(db, PRODUCTS_COLLECTION, productId);
    await updateDoc(productRef, {
      reviews: arrayUnion(reviewData)
    });
    console.log('✅ Review added:', productId);
    return { success: true };
  } catch (error) {
    console.error('❌ Review error:', error.message);
    return { success: false, error: error.message };
  }
};

export const addOrder = async (orderData, userId) => {
  try {
    console.log('💾 Saving order:', JSON.stringify(orderData, null, 2));

    const docRef = await addDoc(collection(db, ORDERS_COLLECTION), {
      ...orderData,
      userId: userId,
      createdAt: serverTimestamp()
    });
    
    console.log('✅ Order saved:', docRef.id);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('❌ Order error:', error.message);
    return { success: false, error: error.message };
  }
};

export const getUserOrders = async (userId) => {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    console.log('🔍 Fetching orders for userId:', userId);

    const q = query(
      collection(db, ORDERS_COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const orders = [];
    
    querySnapshot.forEach((doc) => {
      orders.push({ id: doc.id, ...doc.data() });
    });
    
    console.log('✅ Orders found:', orders.length);
    return { success: true, orders };
  } catch (error) {
    console.error('❌ Orders error:', error.message);
    
    if (error.message.includes('index')) {
      try {
        const q = query(
          collection(db, ORDERS_COLLECTION),
          where('userId', '==', userId)
        );
        const querySnapshot = await getDocs(q);
        const orders = [];
        querySnapshot.forEach((doc) => {
          orders.push({ id: doc.id, ...doc.data() });
        });
        return { success: true, orders };
      } catch (err) {
        return { success: false, error: err.message, orders: [] };
      }
    }
    
    return { success: false, error: error.message, orders: [] };
  }
};

export const getAllOrders = async () => {
  try {
    const q = query(collection(db, ORDERS_COLLECTION), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const orders = [];
    querySnapshot.forEach((doc) => {
      orders.push({ id: doc.id, ...doc.data() });
    });
    
    console.log('✅ All orders:', orders.length);
    return { success: true, orders };
  } catch (error) {
    console.error('❌ All orders error:', error.message);
    
    if (error.message.includes('index')) {
      try {
        const querySnapshot = await getDocs(collection(db, ORDERS_COLLECTION));
        const orders = [];
        querySnapshot.forEach((doc) => {
          orders.push({ id: doc.id, ...doc.data() });
        });
        return { success: true, orders };
      } catch (err) {
        return { success: false, error: err.message, orders: [] };
      }
    }
    
    return { success: false, error: error.message, orders: [] };
  }
};

// ========================================
// MOCK TEST SUBSCRIPTION FUNCTIONS
// ========================================

export const purchaseMockTestPlan = async (planData, userId) => {
  try {
    const subscriptionDoc = {
      ...planData,
      userId,
      purchaseDate: new Date().toISOString(),
      expiryDate: planData.duration === 'once' 
        ? null 
        : new Date(Date.now() + planData.duration * 24 * 60 * 60 * 1000).toISOString(),
      isActive: true,
      attemptsUsed: 0,
      lastAttemptDate: null,
      bestScore: 0
    };

    const docRef = await addDoc(
      collection(db, 'users', userId, 'mockTestSubscriptions'),
      subscriptionDoc
    );

    console.log('✅ Subscription purchased:', docRef.id);
    return { success: true, subscriptionId: docRef.id };
  } catch (error) {
    console.error('❌ Purchase plan error:', error);
    return { success: false, error: error.message };
  }
};

export const getUserActiveSubscription = async (userId) => {
  try {
    const q = query(
      collection(db, 'users', userId, 'mockTestSubscriptions'),
      where('isActive', '==', true)
    );
    
    const querySnapshot = await getDocs(q);
    const subscriptions = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const now = new Date();
      const expiry = data.expiryDate ? new Date(data.expiryDate) : null;
      
      if (!expiry || expiry > now) {
        subscriptions.push({ id: doc.id, ...data });
      }
    });
    
    console.log('✅ Active subscriptions:', subscriptions.length);
    return {
      success: true,
      subscription: subscriptions.length > 0 ? subscriptions[0] : null
    };
  } catch (error) {
    console.error('❌ Get subscription error:', error);
    return { success: false, error: error.message, subscription: null };
  }
};

export const saveMockTestResult = async (resultData, userId) => {
  try {
    const resultDoc = {
      ...resultData,
      userId,
      createdAt: serverTimestamp()
    };

    const docRef = await addDoc(
      collection(db, 'users', userId, 'mockTestResults'),
      resultDoc
    );

    console.log('✅ Test result saved:', docRef.id);
    return { success: true, resultId: docRef.id };
  } catch (error) {
    console.error('❌ Save result error:', error);
    return { success: false, error: error.message };
  }
};

export const getUserMockTestResults = async (userId) => {
  try {
    const q = query(
      collection(db, 'users', userId, 'mockTestResults'),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const results = [];
    
    querySnapshot.forEach((doc) => {
      results.push({ id: doc.id, ...doc.data() });
    });
    
    console.log('✅ Test results found:', results.length);
    return { success: true, results };
  } catch (error) {
    console.error('❌ Get results error:', error);
    return { success: false, error: error.message, results: [] };
  }
};

export const updateSubscriptionAttempt = async (subscriptionId, userId, score) => {
  try {
    const subRef = doc(db, 'users', userId, 'mockTestSubscriptions', subscriptionId);
    
    await updateDoc(subRef, {
      attemptsUsed: arrayUnion(new Date().toISOString()),
      lastAttemptDate: new Date().toISOString(),
      bestScore: score
    });

    console.log('✅ Subscription updated');
    return { success: true };
  } catch (error) {
    console.error('❌ Update subscription error:', error);
    return { success: false, error: error.message };
  }
};

// ========================================
// CERTIFICATE FUNCTIONS
// ========================================

export const saveCertificateDetails = async (userDetails, userId) => {
  try {
    const detailsDoc = {
      ...userDetails,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(
      collection(db, 'users', userId, 'certificateDetails'),
      detailsDoc
    );

    console.log('✅ Certificate details saved:', docRef.id);
    return { success: true, detailsId: docRef.id };
  } catch (error) {
    console.error('❌ Save certificate details error:', error);
    return { success: false, error: error.message };
  }
};

export const getCertificateDetails = async (userId) => {
  try {
    const querySnapshot = await getDocs(
      collection(db, 'users', userId, 'certificateDetails')
    );

    if (querySnapshot.empty) {
      return { success: true, details: null };
    }

    const doc = querySnapshot.docs[0];
    return { success: true, details: { id: doc.id, ...doc.data() } };
  } catch (error) {
    console.error('❌ Get certificate details error:', error);
    return { success: false, error: error.message, details: null };
  }
};

export const issueCertificate = async (certificateData, userId) => {
  try {
    const existingCerts = await getDocs(
      collection(db, 'users', userId, 'certificates')
    );

    if (!existingCerts.empty) {
      console.log('⚠️ Certificate already issued');
      return { success: false, error: 'Certificate already issued for this account' };
    }

    const certDoc = {
      ...certificateData,
      issuedAt: serverTimestamp(),
      certificateId: `FZ-CERT-${Date.now()}`,
      isValid: true
    };

    const docRef = await addDoc(
      collection(db, 'users', userId, 'certificates'),
      certDoc
    );

    console.log('✅ Certificate issued:', docRef.id);
    return { success: true, certificateId: certDoc.certificateId, docId: docRef.id };
  } catch (error) {
    console.error('❌ Issue certificate error:', error);
    return { success: false, error: error.message };
  }
};

export const getUserCertificate = async (userId) => {
  try {
    const querySnapshot = await getDocs(
      collection(db, 'users', userId, 'certificates')
    );

    if (querySnapshot.empty) {
      return { success: true, certificate: null };
    }

    const doc = querySnapshot.docs[0];
    return { success: true, certificate: { id: doc.id, ...doc.data() } };
  } catch (error) {
    console.error('❌ Get certificate error:', error);
    return { success: false, error: error.message, certificate: null };
  }
};

export const hasCertificateForLevel = async (userId, level) => {
  try {
    const q = query(
      collection(db, 'users', userId, 'certificates'),
      where('level', '==', level)
    );
    
    const querySnapshot = await getDocs(q);
    
    return { success: true, hasCertificate: !querySnapshot.empty };
  } catch (error) {
    console.error('❌ Check certificate error:', error);
    return { success: false, hasCertificate: false };
  }
};

export const issueCertificateWithLevel = async (certificateData, userId, level) => {
  try {
    const checkResult = await hasCertificateForLevel(userId, level);
    
    if (checkResult.hasCertificate) {
      console.log(`⚠️ Certificate already issued for ${level}`);
      return { success: false, error: `Certificate already issued for ${level} level` };
    }

    const certDoc = {
      ...certificateData,
      level: level,
      issuedAt: serverTimestamp(),
      certificateId: `FZ-${level.toUpperCase()}-${Date.now()}`,
      isValid: true
    };

    const docRef = await addDoc(
      collection(db, 'users', userId, 'certificates'),
      certDoc
    );

    console.log(`✅ ${level} certificate issued:`, docRef.id);
    return { success: true, certificateId: certDoc.certificateId, docId: docRef.id };
  } catch (error) {
    console.error('❌ Issue certificate error:', error);
    return { success: false, error: error.message };
  }
};

// ========================================
// ✅ MANUAL QUESTIONS — Firebase se fetch
// ========================================

export const getManualQuestions = async (level) => {
  try {
    console.log(`📖 Fetching manual questions for level: ${level}`);

    const q = query(
      collection(db, 'manualQuestions'),
      where('level', '==', level),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    const questions = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

    console.log(`✅ ${questions.length} questions loaded for ${level}`);
    return { success: true, questions };
  } catch (error) {
    console.error('❌ getManualQuestions error:', error.message);

    // index error fallback
    if (error.message.includes('index')) {
      try {
        const q = query(
          collection(db, 'manualQuestions'),
          where('level', '==', level)
        );
        const snapshot = await getDocs(q);
        const questions = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        console.log(`✅ ${questions.length} questions loaded (no order) for ${level}`);
        return { success: true, questions };
      } catch (err) {
        return { success: false, error: err.message, questions: [] };
      }
    }

    return { success: false, error: error.message, questions: [] };
  }
};

// ========================================
// 💰 TEST PRICES FUNCTIONS
// ========================================

export const getTestPrices = async () => {
  try {
    console.log('💰 Fetching test prices...');
    
    const priceDoc = await getDoc(doc(db, 'settings', 'testPrices'));
    
    if (priceDoc.exists()) {
      console.log('✅ Prices loaded:', priceDoc.data());
      return { success: true, prices: priceDoc.data() };
    } else {
      // Return default prices if not found
      const defaultPrices = {
        basic: 99,
        advanced: 199,
        pro: 299
      };
      console.log('⚠️ No prices found, using defaults');
      return { success: true, prices: defaultPrices };
    }
  } catch (error) {
    console.error('❌ Get prices error:', error);
    return { 
      success: false, 
      error: error.message,
      prices: { basic: 99, advanced: 199, pro: 299 }
    };
  }
};

export const saveTestPrices = async (prices) => {
  try {
    console.log('💾 Saving test prices:', prices);
    
    await setDoc(doc(db, 'settings', 'testPrices'), prices);
    
    console.log('✅ Prices saved successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ Save prices error:', error);
    return { success: false, error: error.message };
  }
};