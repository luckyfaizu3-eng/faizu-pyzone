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
  where
} from 'firebase/firestore';

// Cloudinary Config
const CLOUDINARY_CLOUD_NAME = 'dwhkxqnd1';
const CLOUDINARY_UPLOAD_PRESET = 'ml_default';

// Collections
const PRODUCTS_COLLECTION = 'products';
const ORDERS_COLLECTION = 'orders';

// ✅ SIMPLIFIED: Upload PDF without fl_attachment complications
export const uploadPDF = async (file, folder = 'pdfs') => {
  try {
    console.log('📤 Uploading PDF to Cloudinary...');
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', folder);
    formData.append('resource_type', 'raw'); // ✅ Critical: PDFs must use 'raw' type

    // ✅ Use /raw/upload endpoint
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/raw/upload`,
      { method: 'POST', body: formData }
    );

    const result = await response.json();
    console.log('Cloudinary response:', result);

    if (result.secure_url) {
      // ✅ Use simple raw URL without fl_attachment
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

// Upload Image to Cloudinary
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

// ✅ FIXED: Add Product with userId
export const addProduct = async (productData, userId) => {
  try {
    if (!userId) {
      throw new Error('User ID is required to add product');
    }

    const docRef = await addDoc(collection(db, PRODUCTS_COLLECTION), {
      ...productData,
      userId: userId, // ✅ Store userId for security rules
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

// ✅ FIXED: Get All Products (with better error handling)
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
    
    // If index error, try without ordering
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

// ✅ FIXED: Get User's Products Only
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

// Delete Product
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

// ✅ FIXED: Update Product
export const updateProduct = async (productId, updates) => {
  try {
    const productRef = doc(db, PRODUCTS_COLLECTION, productId);
    await updateDoc(productRef, {
      ...updates,
      updatedAt: serverTimestamp() // Track when updated
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

// Add Review
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

// ✅ FIXED: Add Order with userId
export const addOrder = async (orderData, userId) => {
  try {
    console.log('💾 Saving order:', JSON.stringify(orderData, null, 2));

    const docRef = await addDoc(collection(db, ORDERS_COLLECTION), {
      ...orderData,
      userId: userId, // ✅ Store userId
      createdAt: serverTimestamp()
    });
    
    console.log('✅ Order saved:', docRef.id);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('❌ Order error:', error.message);
    return { success: false, error: error.message };
  }
};

// ✅ FIXED: Get User Orders
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
    
    // Fallback: try without ordering if index error
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

// Get All Orders (Admin)
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
    
    // Fallback without ordering
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