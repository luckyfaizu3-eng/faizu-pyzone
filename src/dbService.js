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

// ✅ Cloudinary Config
const CLOUDINARY_CLOUD_NAME = 'dwhkxqnd1';

// Collections
const PRODUCTS_COLLECTION = 'products';
const ORDERS_COLLECTION = 'orders';

// ✅ Upload PDF to Cloudinary (using ml_default unsigned preset)
export const uploadPDF = async (file, folder = 'pdfs') => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'ml_default');
    formData.append('folder', folder);
    formData.append('resource_type', 'raw');

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/raw/upload`,
      { method: 'POST', body: formData }
    );

    const result = await response.json();

    if (result.secure_url) {
      console.log('✅ PDF uploaded to Cloudinary:', result.secure_url);
      return { success: true, url: result.secure_url, fileName: file.name };
    }

    console.error('❌ Cloudinary PDF error:', result);
    return { success: false, error: result.error?.message || 'PDF upload failed' };
  } catch (error) {
    console.error('❌ PDF upload error:', error.message);
    return { success: false, error: error.message };
  }
};

// ✅ Upload Image to Cloudinary (using ml_default unsigned preset)
export const uploadImage = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'ml_default');
    formData.append('folder', 'thumbnails');
    formData.append('resource_type', 'image');

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      { method: 'POST', body: formData }
    );

    const result = await response.json();

    if (result.secure_url) {
      console.log('✅ Image uploaded to Cloudinary:', result.secure_url);
      return { success: true, url: result.secure_url, fileName: file.name };
    }

    console.error('❌ Cloudinary Image error:', result);
    return { success: false, error: result.error?.message || 'Image upload failed' };
  } catch (error) {
    console.error('❌ Image upload error:', error.message);
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
    
    console.log('✅ Product added with ID:', docRef.id);
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
      console.log('⚠️ Creating indexes... Try again in a minute');
      return { success: true, products: [] };
    }
    return { success: false, error: error.message, products: [] };
  }
};

// Delete Product
export const deleteProduct = async (productId) => {
  try {
    await deleteDoc(doc(db, PRODUCTS_COLLECTION, productId));
    console.log('✅ Product deleted:', productId);
    return { success: true };
  } catch (error) {
    console.error('❌ Delete product error:', error.message);
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
    console.error('❌ Update product error:', error.message);
    return { success: false, error: error.message };
  }
};

// Add Review to Product
export const addReview = async (productId, reviewData) => {
  try {
    const productRef = doc(db, PRODUCTS_COLLECTION, productId);
    await updateDoc(productRef, {
      reviews: arrayUnion(reviewData)
    });
    console.log('✅ Review added to product:', productId);
    return { success: true };
  } catch (error) {
    console.error('❌ Add review error:', error.message);
    return { success: false, error: error.message };
  }
};

// ✅ Add Order
export const addOrder = async (orderData) => {
  try {
    console.log('📝 Saving order data:', JSON.stringify(orderData, null, 2));

    const docRef = await addDoc(collection(db, ORDERS_COLLECTION), {
      ...orderData,
      createdAt: serverTimestamp()
    });
    
    console.log('✅ Order added with ID:', docRef.id);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('❌ Add order error:', error.message);
    return { success: false, error: error.message };
  }
};

// ✅ Get User Orders
export const getUserOrders = async (userEmail) => {
  try {
    console.log('🔍 Fetching orders for:', userEmail);

    const querySnapshot = await getDocs(collection(db, ORDERS_COLLECTION));
    
    const orders = [];
    querySnapshot.forEach((doc) => {
      const orderData = doc.data();
      console.log('📄 Order - email:', orderData.userEmail, '| match:', orderData.userEmail === userEmail);
      if (orderData.userEmail === userEmail) {
        orders.push({ id: doc.id, ...orderData });
      }
    });
    
    console.log('✅ Orders fetched for user:', orders.length);
    return { success: true, orders };
  } catch (error) {
    console.error('❌ Fetch orders error:', error.message);
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
    
    console.log('✅ All orders fetched:', orders.length);
    return { success: true, orders };
  } catch (error) {
    console.error('❌ Fetch all orders error:', error.message);
    return { success: false, error: error.message, orders: [] };
  }
};