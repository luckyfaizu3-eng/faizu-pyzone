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
  serverTimestamp 
} from 'firebase/firestore';

// Collections
const PRODUCTS_COLLECTION = 'products';
const ORDERS_COLLECTION = 'orders';

// TEMPORARY: Upload PDF without storage (for testing)
// Converts file to base64 and stores in Firestore
export const uploadPDF = async (file, folder = 'pdfs') => {
  try {
    // For testing: Create a data URL (base64)
    const reader = new FileReader();
    
    return new Promise((resolve, reject) => {
      reader.onload = () => {
        const base64 = reader.result;
        console.log('✅ PDF converted to base64');
        resolve({ 
          success: true, 
          url: base64, // This will be a data URL
          fileName: file.name,
          note: 'Using temporary base64 storage. Will be replaced with Firebase Storage later.'
        });
      };
      
      reader.onerror = () => {
        console.error('❌ PDF conversion error');
        reject({ success: false, error: 'Failed to process PDF' });
      };
      
      reader.readAsDataURL(file);
    });
  } catch (error) {
    console.error('❌ PDF upload error:', error.message);
    return { success: false, error: error.message };
  }
};

// Upload Image/Thumbnail (temporary base64 solution)
export const uploadImage = async (file) => {
  try {
    const reader = new FileReader();
    
    return new Promise((resolve, reject) => {
      reader.onload = () => {
        const base64 = reader.result;
        console.log('✅ Image converted to base64');
        resolve({ 
          success: true, 
          url: base64,
          fileName: file.name 
        });
      };
      
      reader.onerror = () => {
        reject({ success: false, error: 'Failed to process image' });
      };
      
      reader.readAsDataURL(file);
    });
  } catch (error) {
    console.error('❌ Image upload error:', error.message);
    return { success: false, error: error.message };
  }
};

// Add Product to Firestore
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
    // Return empty array if collection doesn't exist yet
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

// Add Order
export const addOrder = async (orderData) => {
  try {
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

// Get User Orders
export const getUserOrders = async (userEmail) => {
  try {
    const querySnapshot = await getDocs(collection(db, ORDERS_COLLECTION));
    
    const orders = [];
    querySnapshot.forEach((doc) => {
      const orderData = doc.data();
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