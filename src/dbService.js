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
  arrayUnion
} from 'firebase/firestore';

// Cloudinary Config
const CLOUDINARY_CLOUD_NAME = 'dwhkxqnd1';
const CLOUDINARY_UPLOAD_PRESET = 'ml_default';

// Collections
const PRODUCTS_COLLECTION = 'products';
const ORDERS_COLLECTION = 'orders';

// ✅ FIXED: Upload PDF with attachment flag for force download
export const uploadPDF = async (file, folder = 'pdfs') => {
  try {
    console.log('📤 Uploading PDF to Cloudinary...');
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', folder);
    // Let preset handle resource type automatically

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`,
      { method: 'POST', body: formData }
    );

    const result = await response.json();
    console.log('Cloudinary response:', result);

    if (result.secure_url) {
      // ✅ Add fl_attachment flag to force download
      let downloadUrl = result.secure_url;
      if (!downloadUrl.includes('fl_attachment')) {
        downloadUrl = downloadUrl.replace('/upload/', '/upload/fl_attachment/');
      }
      
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

// Add Product
export const addProduct = async (productData) => {
  try {
    const docRef = await addDoc(collection(db, PRODUCTS_COLLECTION), {
      ...productData,
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

// Get All Products
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
    if (error.message.includes('indexes')) {
      console.log('⚠️ Creating indexes...');
      return { success: true, products: [] };
    }
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
      return { success: false, error: 'Permission denied. Logout and login again.' };
    }
    
    return { success: false, error: error.message };
  }
};

// Update Product
export const updateProduct = async (productId, updates) => {
  try {
    const productRef = doc(db, PRODUCTS_COLLECTION, productId);
    await updateDoc(productRef, updates);
    console.log('✅ Product updated:', productId);
    return { success: true };
  } catch (error) {
    console.error('❌ Update error:', error.message);
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

// Add Order
export const addOrder = async (orderData) => {
  try {
    console.log('💾 Saving order:', JSON.stringify(orderData, null, 2));

    const docRef = await addDoc(collection(db, ORDERS_COLLECTION), {
      ...orderData,
      createdAt: serverTimestamp()
    });
    
    console.log('✅ Order saved:', docRef.id);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('❌ Order error:', error.message);
    return { success: false, error: error.message };
  }
};

// Get User Orders
export const getUserOrders = async (userEmail) => {
  try {
    const normalizedEmail = userEmail.trim().toLowerCase();
    console.log('🔍 Fetching orders for:', normalizedEmail);

    const querySnapshot = await getDocs(collection(db, ORDERS_COLLECTION));
    
    const orders = [];
    querySnapshot.forEach((doc) => {
      const orderData = doc.data();
      const orderEmail = (orderData.userEmail || '').trim().toLowerCase();
      if (orderEmail === normalizedEmail) {
        orders.push({ id: doc.id, ...orderData });
      }
    });
    
    console.log('✅ Orders found:', orders.length);
    return { success: true, orders };
  } catch (error) {
    console.error('❌ Orders error:', error.message);
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
      orders.push({ id: doc.id, ...doc.data() }); // ✅ Fixed
    });
    
    console.log('✅ All orders:', orders.length);
    return { success: true, orders };
  } catch (error) {
    console.error('❌ All orders error:', error.message);
    return { success: false, error: error.message, orders: [] };
  }
};