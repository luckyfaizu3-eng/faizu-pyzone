import React, { useState, useEffect } from 'react';
import { Upload, Trash2, X, Plus, Package, BarChart, FileText, Image as ImageIcon, Loader, Edit, Save, Zap, Search, Brain, TrendingUp, Tag, Copy, CheckCircle, AlertCircle, Calendar, Percent } from 'lucide-react';
import { uploadPDF, uploadImage } from '../supabaseUpload';
import { auth } from '../firebase';
import { db } from '../firebase';
import { doc, updateDoc, collection, addDoc, getDocs, deleteDoc, query, orderBy } from 'firebase/firestore';
import ConfirmModal from '../components/ConfirmModal';
import AdminQuestions from './AdminQuestions';
import AdminOrdersManager from './AdminOrdersManager';
import AdminAnalytics from './AdminAnalytics';

function AdminPanel({ products, addProduct, deleteProduct, orders }) {
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pdfFiles, setPdfFiles] = useState([]);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [isBundle, setIsBundle] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [activeTab, setActiveTab] = useState('products');
  const [editingProduct, setEditingProduct] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [previewPages, setPreviewPages] = useState([]);
  const [generatingPreview, setGeneratingPreview] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Coupon states
  const [coupons, setCoupons] = useState([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);
  const [showCouponForm, setShowCouponForm] = useState(false);
  const [couponForm, setCouponForm] = useState({
    code: '',
    discountType: 'percent',
    discountValue: '',
    minOrderValue: '',
    maxUses: '',
    expiryDate: '',
    isActive: true,
    applicableProducts: 'all',
    selectedProductIds: []
  });
  const [confirmDeleteCoupon, setConfirmDeleteCoupon] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);
  const [savingCoupon, setSavingCoupon] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    category: '',
    price: '',
    description: '',
    pages: '',
    rating: '4.5',
    fileSize: '',
    language: 'English',
    image: '📚',
    customCategory: '',
    individualPrice: '',
    discount: '',
    itemsIncluded: '',
    previewPageCount: '3',
    discountPercent: ''
  });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    if (!window.pdfjsLib) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.async = true;
      script.onload = () => {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      };
      document.head.appendChild(script);
    }
    return () => { unsubscribe(); window.removeEventListener('resize', handleResize); };
  }, []);

  useEffect(() => {
    if (activeTab === 'coupons') fetchCoupons();
  }, [activeTab]);

  // ─── Coupon Functions ─────────────────────────────────────────────────────

  const fetchCoupons = async () => {
    setLoadingCoupons(true);
    try {
      const q = query(collection(db, 'coupons'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setCoupons(list);
    } catch (err) {
      window.showToast?.('Failed to load coupons: ' + err.message, 'error');
    } finally {
      setLoadingCoupons(false);
    }
  };

  const generateCouponCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
    setCouponForm(prev => ({ ...prev, code }));
  };

  const handleSaveCoupon = async (e) => {
    e.preventDefault();
    if (!couponForm.code.trim()) {
      window.showToast?.('Coupon code is required', 'error');
      return;
    }
    if (!couponForm.discountValue || parseFloat(couponForm.discountValue) <= 0) {
      window.showToast?.('Discount value must be greater than 0', 'error');
      return;
    }
    if (couponForm.discountType === 'percent' && parseFloat(couponForm.discountValue) > 100) {
      window.showToast?.('Percentage discount cannot exceed 100%', 'error');
      return;
    }
    setSavingCoupon(true);
    try {
      const data = {
        code: couponForm.code.trim().toUpperCase(),
        discountType: couponForm.discountType,
        discountValue: parseFloat(couponForm.discountValue),
        minOrderValue: couponForm.minOrderValue ? parseFloat(couponForm.minOrderValue) : 0,
        maxUses: couponForm.maxUses ? parseInt(couponForm.maxUses) : null,
        usedCount: 0,
        expiryDate: couponForm.expiryDate || null,
        isActive: couponForm.isActive,
        applicableProducts: couponForm.applicableProducts,
        selectedProductIds: couponForm.applicableProducts === 'selected' ? couponForm.selectedProductIds : [],
        createdAt: new Date().toISOString(),
        createdBy: currentUser?.email || ''
      };
      await addDoc(collection(db, 'coupons'), data);
      window.showToast?.('Coupon created successfully!', 'success');
      setCouponForm({
        code: '', discountType: 'percent', discountValue: '',
        minOrderValue: '', maxUses: '', expiryDate: '',
        isActive: true, applicableProducts: 'all', selectedProductIds: []
      });
      setShowCouponForm(false);
      fetchCoupons();
    } catch (err) {
      window.showToast?.('Failed to save coupon: ' + err.message, 'error');
    } finally {
      setSavingCoupon(false);
    }
  };

  const handleToggleCoupon = async (coupon) => {
    try {
      await updateDoc(doc(db, 'coupons', coupon.id), { isActive: !coupon.isActive });
      setCoupons(prev => prev.map(c => c.id === coupon.id ? { ...c, isActive: !c.isActive } : c));
      window.showToast?.(`Coupon ${!coupon.isActive ? 'activated' : 'deactivated'}`, 'success');
    } catch (err) {
      window.showToast?.('Failed to update coupon', 'error');
    }
  };

  const handleDeleteCoupon = async (id) => {
    try {
      await deleteDoc(doc(db, 'coupons', id));
      setCoupons(prev => prev.filter(c => c.id !== id));
      window.showToast?.('Coupon deleted', 'success');
    } catch (err) {
      window.showToast?.('Failed to delete coupon', 'error');
    }
    setConfirmDeleteCoupon(null);
  };

  const copyCouponCode = (code) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    });
  };

  const isCouponExpired = (coupon) => {
    if (!coupon.expiryDate) return false;
    return new Date(coupon.expiryDate) < new Date();
  };

  const isCouponMaxedOut = (coupon) => {
    if (!coupon.maxUses) return false;
    return coupon.usedCount >= coupon.maxUses;
  };

  // ─── Product Functions ────────────────────────────────────────────────────

  const startEditProduct = (product) => {
    setEditingProduct(product);
    setEditMode(true);
    setShowUploadForm(true);
    setFormData({
      title: product.title || '',
      category: product.category || '',
      price: product.price?.toString() || '0',
      description: product.description || '',
      pages: product.pages?.toString() || '',
      rating: product.rating?.toString() || '4.5',
      fileSize: product.fileSize || '',
      language: product.language || 'English',
      image: product.image || '📚',
      customCategory: product.customCategory || '',
      individualPrice: product.bundleInfo?.individualPrice?.toString() || '',
      discount: product.bundleInfo?.discount?.toString() || '',
      itemsIncluded: product.bundleInfo?.itemsIncluded || '',
      previewPageCount: product.previewPageCount?.toString() || '3',
      discountPercent: product.discountPercent?.toString() || ''
    });
    setIsBundle(product.isBundle || false);
    if (product.thumbnail) setThumbnailPreview(product.thumbnail);
    if (product.previewPages?.length > 0) setPreviewPages(product.previewPages);
    if (product.isBundle && product.bundledProducts) setSelectedProducts(product.bundledProducts);
  };

  const cancelEdit = () => {
    setEditMode(false);
    setEditingProduct(null);
    setShowUploadForm(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      title: '', category: '', price: '', description: '', pages: '',
      rating: '4.5', fileSize: '', language: 'English', image: '📚',
      customCategory: '', individualPrice: '', discount: '',
      itemsIncluded: '', previewPageCount: '3', discountPercent: ''
    });
    setPdfFiles([]);
    setThumbnailFile(null);
    setThumbnailPreview(null);
    setIsBundle(false);
    setPreviewPages([]);
    setGeneratingPreview(false);
    setSelectedProducts([]);
  };

  const handlePdfChange = (e) => {
    const files = Array.from(e.target.files);
    const validPdfs = files.filter(f => f.type === 'application/pdf');
    if (validPdfs.length !== files.length) window.showToast?.('Only PDF files are allowed!', 'warning');
    if (validPdfs.length > 0) {
      setPdfFiles(prev => [...prev, ...validPdfs]);
      window.showToast?.(`${validPdfs.length} PDF(s) selected`, 'success');
    }
  };

  const removePdf = (index) => {
    setPdfFiles(prev => prev.filter((_, i) => i !== index));
    window.showToast?.('PDF removed', 'info');
  };

  const generatePreviewFromUploadedPDF = async () => {
    if (pdfFiles.length === 0) { window.showToast?.('Upload PDF files first!', 'warning'); return; }
    const pageCount = parseInt(formData.previewPageCount) || 3;
    const firstPdf = pdfFiles[0];
    setGeneratingPreview(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const pdfData = new Uint8Array(e.target.result);
        if (!window.pdfjsLib) { window.showToast?.('PDF.js not loaded. Refresh and try again.', 'error'); setGeneratingPreview(false); return; }
        const pdf = await window.pdfjsLib.getDocument({ data: pdfData }).promise;
        const pagesToCapture = Math.min(pageCount, pdf.numPages);
        const previews = [];
        for (let i = 1; i <= pagesToCapture; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 1.5 });
          const canvas = document.createElement('canvas');
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
          previews.push({ pageNumber: i, imageData: canvas.toDataURL('image/jpeg', 0.8) });
        }
        setPreviewPages(previews);
        window.showToast?.(`${previews.length} preview pages generated!`, 'success');
        setGeneratingPreview(false);
      };
      reader.onerror = () => { window.showToast?.('Failed to read PDF', 'error'); setGeneratingPreview(false); };
      reader.readAsArrayBuffer(firstPdf);
    } catch (err) {
      window.showToast?.('Preview generation failed: ' + err.message, 'error');
      setGeneratingPreview(false);
    }
  };

  const generatePreviewFromExistingPDF = async () => {
    if (!editingProduct?.pdfFiles?.length) { window.showToast?.('No existing PDF found!', 'warning'); return; }
    const pageCount = parseInt(formData.previewPageCount) || 3;
    setGeneratingPreview(true);
    try {
      const response = await fetch(editingProduct.pdfFiles[0].url);
      const buffer = await response.arrayBuffer();
      if (!window.pdfjsLib) { window.showToast?.('PDF.js not loaded.', 'error'); setGeneratingPreview(false); return; }
      const pdf = await window.pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;
      const pagesToCapture = Math.min(pageCount, pdf.numPages);
      const previews = [];
      for (let i = 1; i <= pagesToCapture; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement('canvas');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
        previews.push({ pageNumber: i, imageData: canvas.toDataURL('image/jpeg', 0.8) });
      }
      setPreviewPages(previews);
      window.showToast?.(`${previews.length} preview pages generated!`, 'success');
      setGeneratingPreview(false);
    } catch (err) {
      window.showToast?.('Preview generation failed: ' + err.message, 'error');
      setGeneratingPreview(false);
    }
  };

  const removePreviewPage = (index) => setPreviewPages(prev => prev.filter((_, i) => i !== index));

  const removeExistingPdf = (index) => {
    if (!editingProduct) return;
    setEditingProduct({ ...editingProduct, pdfFiles: editingProduct.pdfFiles.filter((_, i) => i !== index) });
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file?.type.startsWith('image/')) {
      setThumbnailFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setThumbnailPreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      window.showToast?.('Please select a valid image file!', 'error');
    }
  };

  // ✅ Free product support: price 0 is valid
  const getFinalPrice = (isBundle) => {
    if (isBundle) return calculateBundlePrice();
    const rawPrice = parseFloat(formData.price) || 0;
    if (formData.discountPercent && rawPrice > 0) return calculateDiscountedPrice();
    return rawPrice;
  };

  const calculateDiscountedPrice = () => {
    const original = parseFloat(formData.price) || 0;
    const discount = parseFloat(formData.discountPercent) || 0;
    return Math.round(original - (original * discount / 100));
  };

  const calculateBundlePrice = () => {
    if (isBundle && selectedProducts.length > 0) {
      const total = selectedProducts.reduce((sum, p) => sum + p.price, 0);
      const discount = parseFloat(formData.discount) || 0;
      return Math.round(total - (total * discount / 100));
    }
    return 0;
  };

  const toggleProductSelection = (product) => {
    setSelectedProducts(prev => {
      const isSelected = prev.some(p => p.id === product.id);
      return isSelected ? prev.filter(p => p.id !== product.id) : [...prev, product];
    });
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    if (!currentUser || !editingProduct) { window.showToast?.('Not authenticated or no product selected', 'error'); return; }
    setUploading(true);
    try {
      let updatedPdfFiles = [...(editingProduct.pdfFiles || [])];
      let thumbnailUrl = editingProduct.thumbnail || '';
      for (const pdf of pdfFiles) {
        const result = await uploadPDF(pdf);
        if (result.success) updatedPdfFiles.push({ url: result.url, fileName: result.fileName, size: (pdf.size / 1024 / 1024).toFixed(2) + ' MB' });
        else { window.showToast?.('PDF upload failed: ' + result.error, 'error'); setUploading(false); return; }
      }
      if (thumbnailFile) {
        const result = await uploadImage(thumbnailFile);
        if (result.success) thumbnailUrl = result.url;
        else { window.showToast?.('Thumbnail upload failed: ' + result.error, 'error'); setUploading(false); return; }
      }
      const rawPrice = parseFloat(formData.price) || 0;
      const finalPrice = getFinalPrice(isBundle);
      const updatedData = {
        title: formData.title, category: formData.category,
        customCategory: formData.customCategory || null,
        price: finalPrice,
        originalPrice: (formData.discountPercent && rawPrice > 0) ? rawPrice : null,
        discountPercent: (formData.discountPercent && rawPrice > 0) ? parseFloat(formData.discountPercent) : null,
        description: formData.description, pages: parseInt(formData.pages) || 0,
        rating: parseFloat(formData.rating) || 4.5, fileSize: formData.fileSize,
        language: formData.language, image: formData.image,
        pdfFiles: isBundle ? [] : updatedPdfFiles, thumbnail: thumbnailUrl,
        isBundle, previewPages: previewPages.length > 0 ? previewPages : (editingProduct.previewPages || []),
        previewPageCount: parseInt(formData.previewPageCount) || 3,
        lastUpdated: new Date().toISOString()
      };
      if (isBundle) {
        const totalOriginal = selectedProducts.reduce((sum, p) => sum + p.price, 0);
        updatedData.bundledProducts = selectedProducts;
        updatedData.bundleInfo = {
          individualPrice: totalOriginal, discount: parseFloat(formData.discount),
          savings: totalOriginal - calculateBundlePrice(),
          itemsIncluded: formData.itemsIncluded, productCount: selectedProducts.length
        };
      }
      await updateDoc(doc(db, 'products', editingProduct.id), updatedData);
      window.showToast?.('Product updated successfully!', 'success');
      cancelEdit();
      window.location.reload();
    } catch (err) {
      window.showToast?.('Update failed: ' + err.message, 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) { window.showToast?.('Please login first!', 'error'); return; }
    if (pdfFiles.length === 0 && !isBundle) { window.showToast?.('Upload at least one PDF file!', 'error'); return; }
    if (isBundle && selectedProducts.length === 0) { window.showToast?.('Select products for the bundle!', 'error'); return; }
    if (!formData.category && !formData.customCategory) { window.showToast?.('Select or enter a category!', 'error'); return; }
    setUploading(true);
    try {
      let pdfUrls = [];
      let thumbnailUrl = '';
      for (const pdf of pdfFiles) {
        const result = await uploadPDF(pdf);
        if (result.success) pdfUrls.push({ url: result.url, fileName: result.fileName, size: (pdf.size / 1024 / 1024).toFixed(2) + ' MB' });
        else { window.showToast?.('PDF upload failed: ' + result.error, 'error'); setUploading(false); return; }
      }
      if (thumbnailFile) {
        const result = await uploadImage(thumbnailFile);
        if (result.success) thumbnailUrl = result.url;
        else { window.showToast?.('Thumbnail upload failed: ' + result.error, 'error'); setUploading(false); return; }
      }
      const rawPrice = parseFloat(formData.price) || 0;
      const finalPrice = getFinalPrice(isBundle);
      const productData = {
        title: formData.title, category: formData.category,
        customCategory: formData.customCategory || null,
        price: finalPrice,
        originalPrice: (formData.discountPercent && rawPrice > 0) ? rawPrice : null,
        discountPercent: (formData.discountPercent && rawPrice > 0) ? parseFloat(formData.discountPercent) : null,
        description: formData.description, pages: parseInt(formData.pages) || 0,
        rating: parseFloat(formData.rating) || 4.5, fileSize: formData.fileSize,
        language: formData.language, image: formData.image,
        pdfFiles: isBundle ? [] : pdfUrls, thumbnail: thumbnailUrl || null,
        isBundle, userId: currentUser.uid, userEmail: currentUser.email,
        totalDownloads: 0, totalRevenue: 0,
        previewPages, previewPageCount: parseInt(formData.previewPageCount) || 3
      };
      if (isBundle) {
        const totalOriginal = selectedProducts.reduce((sum, p) => sum + p.price, 0);
        productData.bundledProducts = selectedProducts;
        productData.bundleInfo = {
          individualPrice: totalOriginal, discount: parseFloat(formData.discount),
          savings: totalOriginal - calculateBundlePrice(),
          itemsIncluded: formData.itemsIncluded, productCount: selectedProducts.length
        };
      }
      await addProduct(productData);
      resetForm();
      setShowUploadForm(false);
      window.showToast?.('Product uploaded successfully!', 'success');
    } catch (err) {
      window.showToast?.('Upload failed: ' + err.message, 'error');
    } finally {
      setUploading(false);
    }
  };

  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const totalDownloads = products.reduce((sum, p) => sum + (p.totalDownloads || 0), 0);
  const filteredProducts = products.filter(p =>
    p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const isFree = (price) => !price || price === 0;

  const tabs = [
    { id: 'products', label: 'Products', icon: Package, count: products.length },
    { id: 'coupons', label: 'Coupons', icon: Tag, count: coupons.length },
    { id: 'questions', label: 'Questions', icon: Brain },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp },
    { id: 'orders', label: 'Orders', icon: BarChart, count: orders.length },
  ];

  // ─── Shared input style ───────────────────────────────────────────────────
  const inputStyle = {
    padding: '1rem', border: '2px solid #e2e8f0', borderRadius: '12px',
    fontSize: isMobile ? '0.95rem' : '1.05rem', outline: 'none', transition: 'border-color 0.3s', width: '100%', boxSizing: 'border-box'
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div style={{ paddingTop: isMobile ? '80px' : '100px', minHeight: '100vh', padding: isMobile ? '80px 1rem 3rem' : '100px 1.5rem 5rem' }}>
      <h1 style={{
        fontSize: isMobile ? 'clamp(2rem, 8vw, 3rem)' : 'clamp(2.5rem, 6vw, 4rem)',
        fontWeight: '900', textAlign: 'center', marginBottom: isMobile ? '2rem' : '3rem',
        background: 'linear-gradient(135deg, #6366f1, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
      }}>
        Admin Panel
      </h1>

      {currentUser && (
        <div style={{
          maxWidth: '1400px', margin: '0 auto 2rem', padding: '1rem',
          background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)',
          borderRadius: '12px', textAlign: 'center', fontSize: isMobile ? '0.9rem' : '1rem',
          color: '#6366f1', fontWeight: '600'
        }}>
          Logged in as: <strong>{currentUser.email}</strong>
        </div>
      )}

      {/* Stats */}
      <div style={{
        display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: isMobile ? '1rem' : '2rem', maxWidth: '1400px', margin: isMobile ? '0 auto 2rem' : '0 auto 3rem'
      }}>
        {[
          { icon: FileText, label: 'Total Products', value: products.length, color: '#6366f1' },
          { icon: Package, label: 'Orders', value: orders.length, color: '#10b981' },
          { icon: BarChart, label: 'Revenue', value: `₹${totalRevenue}`, color: '#ec4899' },
          { icon: Upload, label: 'Total Downloads', value: totalDownloads, color: '#f59e0b' }
        ].map((stat, i) => (
          <div key={i} style={{
            background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px',
            padding: isMobile ? '1.25rem' : '2rem', display: 'flex', alignItems: 'center',
            gap: isMobile ? '1rem' : '1.5rem', boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
            flexDirection: isMobile ? 'column' : 'row', textAlign: isMobile ? 'center' : 'left'
          }}>
            <div style={{ background: `${stat.color}15`, borderRadius: '14px', padding: isMobile ? '0.75rem' : '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <stat.icon size={isMobile ? 24 : 32} color={stat.color} />
            </div>
            <div>
              <div style={{ fontSize: isMobile ? '0.85rem' : '0.95rem', color: '#64748b', marginBottom: '0.25rem', fontWeight: '600' }}>{stat.label}</div>
              <div style={{ fontSize: isMobile ? '1.5rem' : '2rem', fontWeight: '900', color: '#1e293b' }}>{stat.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ maxWidth: '1400px', margin: isMobile ? '0 auto 2rem' : '0 auto 3rem', overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
        <div style={{ display: 'flex', gap: '0.75rem', background: '#f1f5f9', padding: '0.5rem', borderRadius: '16px', width: 'fit-content', minWidth: isMobile ? '100%' : 'auto' }}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                background: isActive ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'transparent',
                border: 'none', color: isActive ? '#ffffff' : '#94a3b8',
                padding: isMobile ? '0.7rem 1.25rem' : '0.85rem 1.75rem',
                fontSize: isMobile ? '0.85rem' : '1rem', borderRadius: '12px', cursor: 'pointer',
                fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.6rem',
                transition: 'all 0.25s ease', boxShadow: isActive ? '0 4px 15px rgba(99,102,241,0.35)' : 'none',
                whiteSpace: 'nowrap', flexShrink: 0
              }}>
                <tab.icon size={isMobile ? 18 : 20} />
                {tab.label}
                {tab.count !== undefined && (
                  <span style={{
                    background: isActive ? 'rgba(255,255,255,0.25)' : 'rgba(99,102,241,0.12)',
                    color: isActive ? '#ffffff' : '#6366f1', borderRadius: '20px',
                    padding: '0.1rem 0.55rem', fontSize: '0.8rem', fontWeight: '800', minWidth: '22px', textAlign: 'center'
                  }}>{tab.count}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── PRODUCTS TAB ── */}
      {activeTab === 'products' && (
        <>
          <div style={{ maxWidth: '1400px', margin: isMobile ? '0 auto 2rem' : '0 auto 3rem', display: 'flex', justifyContent: 'center' }}>
            <button onClick={() => { if (!currentUser) { window.showToast?.('Please login first!', 'error'); return; } if (editMode) cancelEdit(); else setShowUploadForm(!showUploadForm); }}
              style={{
                background: 'linear-gradient(135deg, #6366f1, #ec4899)', border: 'none', color: 'white',
                padding: isMobile ? '1rem 2rem' : '1.25rem 3rem', fontSize: isMobile ? '1rem' : '1.25rem',
                borderRadius: '16px', cursor: 'pointer', fontWeight: '700',
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                boxShadow: '0 10px 30px rgba(99,102,241,0.4)', transition: 'all 0.3s ease'
              }}>
              {showUploadForm ? <X size={24} /> : <Plus size={24} />}
              {editMode ? 'Cancel Edit' : (showUploadForm ? 'Cancel' : 'Upload New Product')}
            </button>
          </div>

          {showUploadForm && (
            <div style={{
              background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '24px',
              padding: isMobile ? '2rem' : '3rem', maxWidth: '800px', margin: isMobile ? '0 auto 2rem' : '0 auto 3rem',
              boxShadow: '0 10px 40px rgba(0,0,0,0.08)'
            }}>
              <h2 style={{ fontSize: isMobile ? '1.5rem' : '2rem', fontWeight: '900', marginBottom: '2rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {editMode ? <><Edit size={isMobile ? 24 : 32} color="#6366f1" />Edit Product</> : <><Plus size={isMobile ? 24 : 32} color="#6366f1" />Upload Product</>}
              </h2>

              {/* Bundle toggle */}
              <div style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '12px', padding: isMobile ? '1rem' : '1.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Package size={24} color="#6366f1" />
                  <div>
                    <div style={{ fontWeight: '700', color: '#1e293b' }}>Create Bundle Package</div>
                    <div style={{ fontSize: '0.9rem', color: '#64748b' }}>Select multiple products to bundle together</div>
                  </div>
                </div>
                <label style={{ position: 'relative', display: 'inline-block', width: '60px', height: '32px' }}>
                  <input type="checkbox" checked={isBundle} onChange={(e) => setIsBundle(e.target.checked)} style={{ display: 'none' }} />
                  <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, background: isBundle ? '#6366f1' : '#cbd5e1', borderRadius: '32px', transition: '0.3s' }}>
                    <span style={{ position: 'absolute', height: '24px', width: '24px', left: isBundle ? '32px' : '4px', bottom: '4px', background: 'white', borderRadius: '50%', transition: '0.3s' }} />
                  </span>
                </label>
              </div>

              <form onSubmit={editMode ? handleUpdateProduct : handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '1rem' : '1.5rem' }}>
                <input type="text" placeholder="Product Title *" value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })} required style={inputStyle}
                  onFocus={(e) => e.target.style.borderColor = '#6366f1'} onBlur={(e) => e.target.style.borderColor = '#e2e8f0'} />

                <div style={{ display: 'grid', gridTemplateColumns: formData.category === 'custom' && !isMobile ? '1fr 1fr' : '1fr', gap: '1rem' }}>
                  <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} required style={inputStyle}>
                    <option value="">Select Category *</option>
                    <option value="python">Python Notes</option>
                    <option value="jkbose">JKBOSE Materials</option>
                    <option value="job">Job Preparation</option>
                    <option value="web">Web Development</option>
                    <option value="hacking">Ethical Hacking</option>
                    <option value="data">Data Science</option>
                    <option value="ai">AI & ML</option>
                    <option value="marketing">Digital Marketing</option>
                    <option value="custom">Custom Category</option>
                  </select>
                  {formData.category === 'custom' && (
                    <input type="text" placeholder="Custom category name *" value={formData.customCategory}
                      onChange={(e) => setFormData({ ...formData, customCategory: e.target.value })} required style={inputStyle} />
                  )}
                </div>

                {/* Bundle config or regular price */}
                {isBundle ? (
                  <div style={{ background: 'rgba(16,185,129,0.05)', border: '2px solid rgba(16,185,129,0.2)', borderRadius: '12px', padding: isMobile ? '1rem' : '1.5rem' }}>
                    <div style={{ fontSize: isMobile ? '1rem' : '1.1rem', fontWeight: '700', color: '#10b981', marginBottom: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><Package size={20} /> Bundle Configuration</div>
                      <button type="button" onClick={() => setShowProductSelector(!showProductSelector)}
                        style={{ background: '#10b981', color: '#fff', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600' }}>
                        {showProductSelector ? 'Hide' : 'Select'} Products
                      </button>
                    </div>
                    {selectedProducts.length > 0 && (
                      <div style={{ marginBottom: '1rem', padding: '1rem', background: '#fff', borderRadius: '8px' }}>
                        <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#64748b', marginBottom: '0.5rem' }}>Selected ({selectedProducts.length})</div>
                        {selectedProducts.map(p => (
                          <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', borderBottom: '1px solid #e2e8f0' }}>
                            <span style={{ fontSize: '0.9rem' }}>{p.title}</span>
                            <span style={{ fontWeight: '700', color: '#10b981' }}>₹{p.price}</span>
                          </div>
                        ))}
                        <div style={{ marginTop: '0.75rem', padding: '0.75rem', background: 'rgba(16,185,129,0.1)', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', fontWeight: '700' }}>
                          <span>Total:</span>
                          <span style={{ color: '#10b981' }}>₹{selectedProducts.reduce((s, p) => s + p.price, 0)}</span>
                        </div>
                      </div>
                    )}
                    {showProductSelector && (
                      <div style={{ marginBottom: '1rem', maxHeight: '300px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '1rem', background: '#fff' }}>
                        {products.filter(p => !p.isBundle).map(product => (
                          <label key={product.id} style={{ display: 'flex', alignItems: 'center', padding: '0.75rem', cursor: 'pointer', borderBottom: '1px solid #f1f5f9' }}>
                            <input type="checkbox" checked={selectedProducts.some(p => p.id === product.id)} onChange={() => toggleProductSelection(product)} style={{ marginRight: '1rem' }} />
                            <div style={{ flex: 1 }}>
                              <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{product.title}</div>
                              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{product.category}</div>
                            </div>
                            <div style={{ fontWeight: '700', color: '#6366f1' }}>₹{product.price}</div>
                          </label>
                        ))}
                      </div>
                    )}
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem' }}>
                      <input type="number" placeholder="Discount % *" value={formData.discount}
                        onChange={(e) => setFormData({ ...formData, discount: e.target.value })} required min="0" max="100" style={inputStyle} />
                      <div style={{ padding: '1rem', background: '#fff', border: '2px solid #10b981', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', fontSize: '1.2rem', color: '#10b981' }}>
                        ₹{calculateBundlePrice() || '0'}
                      </div>
                    </div>
                    <textarea placeholder="What's included? *" value={formData.itemsIncluded}
                      onChange={(e) => setFormData({ ...formData, itemsIncluded: e.target.value })} required rows="3"
                      style={{ ...inputStyle, marginTop: '1rem', resize: 'vertical' }} />
                  </div>
                ) : (
                  <div style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '12px', padding: isMobile ? '1rem' : '1.5rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem' }}>
                      {/* ✅ Price: 0 allowed for FREE products */}
                      <div>
                        <input type="number" placeholder="Price (₹) — enter 0 for FREE" value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })} required min="0" style={inputStyle} />
                        {formData.price === '0' || formData.price === 0 ? (
                          <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#10b981', fontWeight: '700' }}>
                            This product will be listed as FREE
                          </div>
                        ) : null}
                      </div>
                      <input type="number" placeholder="Discount % (optional, only for paid)" value={formData.discountPercent}
                        onChange={(e) => setFormData({ ...formData, discountPercent: e.target.value })} min="0" max="100"
                        disabled={!formData.price || parseFloat(formData.price) === 0}
                        style={{ ...inputStyle, opacity: (!formData.price || parseFloat(formData.price) === 0) ? 0.4 : 1 }} />
                    </div>
                    {formData.price && parseFloat(formData.price) > 0 && formData.discountPercent && (
                      <div style={{ marginTop: '1rem', padding: '1rem', background: '#fff', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <span style={{ color: '#64748b', textDecoration: 'line-through' }}>₹{formData.price}</span>
                        <span style={{ fontSize: '1.5rem', fontWeight: '900', color: '#10b981' }}>
                          ₹{calculateDiscountedPrice()}
                          <span style={{ fontSize: '0.9rem', marginLeft: '0.5rem', color: '#6366f1' }}>({formData.discountPercent}% OFF)</span>
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <textarea placeholder="Description *" value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })} required rows="4"
                  style={{ ...inputStyle, resize: 'vertical' }} />

                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem' }}>
                  <input type="number" placeholder="Pages" value={formData.pages}
                    onChange={(e) => setFormData({ ...formData, pages: e.target.value })} style={inputStyle} />
                  <input type="text" placeholder="File Size (e.g., 5 MB)" value={formData.fileSize}
                    onChange={(e) => setFormData({ ...formData, fileSize: e.target.value })} style={inputStyle} />
                </div>

                {/* Existing PDFs in edit mode */}
                {editMode && editingProduct?.pdfFiles?.length > 0 && !isBundle && (
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '700', color: '#1e293b' }}>Current PDFs</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                      {editingProduct.pdfFiles.map((pdf, index) => (
                        <div key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: 0 }}>
                            <FileText size={20} color="#6366f1" style={{ flexShrink: 0 }} />
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pdf.fileName}</div>
                              {pdf.size && <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{pdf.size}</div>}
                            </div>
                          </div>
                          <button type="button" onClick={() => removeExistingPdf(index)} style={{ background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: '6px', padding: '0.5rem', cursor: 'pointer' }}>
                            <X size={16} color="#ef4444" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* PDF Upload */}
                {!isBundle && (
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '700', color: '#1e293b' }}>
                      {editMode ? 'Add More PDFs (Optional)' : 'Upload PDFs * (Multiple allowed)'}
                    </label>
                    {pdfFiles.length > 0 && (
                      <div style={{ marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {pdfFiles.map((file, index) => (
                          <div key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: 0 }}>
                              <FileText size={20} color="#10b981" style={{ flexShrink: 0 }} />
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</div>
                                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                              </div>
                            </div>
                            <button type="button" onClick={() => removePdf(index)} style={{ background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: '6px', padding: '0.5rem', cursor: 'pointer' }}>
                              <X size={16} color="#ef4444" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: isMobile ? '1rem' : '1.5rem', border: '2px dashed #cbd5e1', borderRadius: '12px', cursor: 'pointer', background: pdfFiles.length > 0 ? 'rgba(16,185,129,0.05)' : 'transparent' }}
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = '#6366f1'} onMouseLeave={(e) => e.currentTarget.style.borderColor = '#cbd5e1'}>
                      <Upload size={24} color={pdfFiles.length > 0 ? '#10b981' : '#64748b'} style={{ flexShrink: 0 }} />
                      <div>
                        <div style={{ fontWeight: '600', color: '#1e293b' }}>{pdfFiles.length > 0 ? `${pdfFiles.length} PDF(s) selected` : 'Click to upload PDFs'}</div>
                        <div style={{ fontSize: '0.9rem', color: '#64748b' }}>Multiple PDF files allowed</div>
                      </div>
                      <input type="file" accept=".pdf" multiple onChange={handlePdfChange} style={{ display: 'none' }} />
                    </label>
                  </div>
                )}

                {/* Thumbnail */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '700', color: '#1e293b' }}>
                    {editMode ? 'Change Thumbnail (Optional)' : 'Upload Thumbnail (Optional)'}
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: isMobile ? '1rem' : '1.5rem', border: '2px dashed #cbd5e1', borderRadius: '12px', cursor: 'pointer', background: thumbnailPreview ? 'rgba(16,185,129,0.05)' : 'transparent', flexWrap: 'wrap' }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = '#6366f1'} onMouseLeave={(e) => e.currentTarget.style.borderColor = '#cbd5e1'}>
                    <ImageIcon size={24} color={thumbnailPreview ? '#10b981' : '#64748b'} style={{ flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: '600', color: '#1e293b' }}>{thumbnailFile ? thumbnailFile.name : (thumbnailPreview ? 'Current thumbnail' : 'Click to upload thumbnail')}</div>
                      <div style={{ fontSize: '0.9rem', color: '#64748b' }}>PNG, JPG (recommended: 400x300px)</div>
                    </div>
                    {thumbnailPreview && <img src={thumbnailPreview} alt="Preview" style={{ width: '80px', height: '60px', objectFit: 'cover', borderRadius: '8px', flexShrink: 0 }} />}
                    <input type="file" accept="image/*" onChange={handleThumbnailChange} style={{ display: 'none' }} />
                  </label>
                </div>

                {/* Preview Pages */}
                {!isBundle && (pdfFiles.length > 0 || (editMode && editingProduct?.pdfFiles?.length > 0)) && (
                  <div style={{ background: 'rgba(139,92,246,0.05)', border: '2px solid rgba(139,92,246,0.2)', borderRadius: '16px', padding: isMobile ? '1.5rem' : '2rem' }}>
                    <h3 style={{ fontSize: isMobile ? '1rem' : '1.2rem', fontWeight: '700', color: '#8b5cf6', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <FileText size={isMobile ? 20 : 24} /> Preview Pages Setup
                    </h3>
                    <p style={{ fontSize: '0.9rem', color: '#64748b', margin: '0 0 1.5rem' }}>
                      {editMode && pdfFiles.length === 0 ? `Generate preview from: ${editingProduct?.pdfFiles?.[0]?.fileName}` : `Generate preview from: ${pdfFiles[0]?.name}`}
                    </p>

                    {editMode && editingProduct?.previewPages?.length > 0 && (
                      <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.95rem', fontWeight: '600', color: '#10b981' }}>Current Preview ({editingProduct.previewPages.length} pages)</span>
                          <button type="button" onClick={() => { setEditingProduct({ ...editingProduct, previewPages: [] }); setPreviewPages([]); }}
                            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', padding: '0.4rem 0.75rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer' }}>
                            Clear Preview
                          </button>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '0.75rem', maxHeight: '200px', overflowY: 'auto' }}>
                          {editingProduct.previewPages.map((page, index) => (
                            <div key={index} style={{ border: '2px solid #10b981', borderRadius: '8px', overflow: 'hidden', position: 'relative' }}>
                              <img src={page.imageData} alt={`Page ${page.pageNumber}`} style={{ width: '100%', height: 'auto', display: 'block' }} />
                              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(16,185,129,0.9)', color: '#fff', padding: '0.25rem', fontSize: '0.7rem', fontWeight: '600', textAlign: 'center' }}>P{page.pageNumber}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr auto', gap: '1rem', alignItems: 'end', marginBottom: '1.5rem' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.95rem', fontWeight: '600', color: '#1e293b' }}>How many pages to preview?</label>
                        <select value={formData.previewPageCount} onChange={(e) => setFormData({ ...formData, previewPageCount: e.target.value })} style={inputStyle}>
                          <option value="1">First 1 Page</option>
                          <option value="2">First 2 Pages</option>
                          <option value="3">First 3 Pages</option>
                          <option value="4">First 4 Pages</option>
                          <option value="5">First 5 Pages</option>
                          <option value="10">First 10 Pages</option>
                        </select>
                      </div>
                      <button type="button" disabled={generatingPreview}
                        onClick={() => pdfFiles.length > 0 ? generatePreviewFromUploadedPDF() : generatePreviewFromExistingPDF()}
                        style={{ background: generatingPreview ? 'rgba(139,92,246,0.5)' : 'linear-gradient(135deg, #8b5cf6, #7c3aed)', border: 'none', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: generatingPreview ? 'not-allowed' : 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', whiteSpace: 'nowrap', minWidth: '180px', alignSelf: 'end' }}>
                        {generatingPreview ? <><Loader size={18} style={{ animation: 'spin 1s linear infinite' }} />Generating...</> : <><Zap size={18} />{editMode && pdfFiles.length === 0 ? 'Generate from Existing' : 'Generate Preview'}</>}
                      </button>
                    </div>

                    {previewPages.length > 0 && (
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <label style={{ fontSize: '0.95rem', fontWeight: '600', color: '#1e293b' }}>New Preview Pages ({previewPages.length})</label>
                          <span style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: '600', background: 'rgba(16,185,129,0.1)', padding: '0.25rem 0.75rem', borderRadius: '20px' }}>Ready to save</span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem', maxHeight: '400px', overflowY: 'auto', padding: '1rem', background: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                          {previewPages.map((page, index) => (
                            <div key={index} style={{ position: 'relative', border: '2px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                              <img src={page.imageData} alt={`Page ${page.pageNumber}`} style={{ width: '100%', height: 'auto', display: 'block' }} />
                              <div style={{ position: 'absolute', top: '0.5rem', left: '0.5rem', background: 'rgba(139,92,246,0.9)', color: '#fff', padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '700' }}>Page {page.pageNumber}</div>
                              <button type="button" onClick={() => removePreviewPage(index)}
                                style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'rgba(239,68,68,0.9)', border: 'none', borderRadius: '4px', padding: '0.25rem', cursor: 'pointer', display: 'flex' }}>
                                <X size={14} color="#fff" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <button type="submit" disabled={uploading} style={{
                  width: '100%', background: uploading ? 'linear-gradient(135deg, #94a3b8, #cbd5e1)' : editMode ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'linear-gradient(135deg, #10b981, #059669)',
                  border: 'none', color: 'white', padding: isMobile ? '1rem' : '1.25rem', fontSize: isMobile ? '1rem' : '1.25rem',
                  borderRadius: '14px', cursor: uploading ? 'not-allowed' : 'pointer', fontWeight: '700',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
                  boxShadow: editMode ? '0 8px 25px rgba(245,158,11,0.3)' : '0 8px 25px rgba(16,185,129,0.3)', opacity: uploading ? 0.7 : 1
                }}>
                  {uploading ? <><Loader size={24} style={{ animation: 'spin 1s linear infinite' }} />{editMode ? 'Updating...' : 'Uploading...'}</> : <>{editMode ? <><Save size={24} />Save Changes</> : <><Upload size={24} />{isBundle ? 'Create Bundle' : 'Upload Product'}</>}</>}
                </button>
              </form>
            </div>
          )}

          {/* Products List */}
          <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', gap: '1rem', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: isMobile ? '1.5rem' : '2rem', fontWeight: '900', color: '#1e293b', margin: 0 }}>All Products ({filteredProducts.length})</h2>
              <div style={{ position: 'relative', flex: isMobile ? '1 1 100%' : '1', maxWidth: isMobile ? '100%' : '400px', minWidth: '250px' }}>
                <Search size={20} color="#64748b" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                <input type="text" placeholder="Search products..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ ...inputStyle, paddingLeft: '3rem' }}
                  onFocus={(e) => e.target.style.borderColor = '#6366f1'} onBlur={(e) => e.target.style.borderColor = '#e2e8f0'} />
              </div>
            </div>

            <div style={{ display: 'grid', gap: '1.5rem' }}>
              {filteredProducts.map((product, index) => (
                <div key={product.id} style={{
                  background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '20px',
                  padding: isMobile ? '1.5rem' : '2rem', display: 'flex', alignItems: 'center',
                  gap: isMobile ? '1rem' : '2rem', flexWrap: 'wrap', boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                  flexDirection: isMobile ? 'column' : 'row'
                }}>
                  <div style={{
                    background: product.thumbnail ? `url(${product.thumbnail})` : 'linear-gradient(135deg, #6366f1, #ec4899)',
                    backgroundSize: 'cover', backgroundPosition: 'center',
                    width: isMobile ? '80px' : '100px', height: isMobile ? '80px' : '100px',
                    borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, fontSize: product.thumbnail ? '0' : (isMobile ? '2.5rem' : '3rem')
                  }}>
                    {!product.thumbnail && (product.image || '📚')}
                  </div>

                  <div style={{ flex: 1, minWidth: isMobile ? '100%' : '250px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: isMobile ? '1.2rem' : '1.5rem', fontWeight: '800', color: '#1e293b' }}>{product.title}</h3>
                      {/* ✅ FREE badge */}
                      {isFree(product.price) && (
                        <span style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700' }}>FREE</span>
                      )}
                      {product.isBundle && <span style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', padding: '0.3rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Package size={14} /> BUNDLE</span>}
                      {product.discountPercent && !isFree(product.price) && <span style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '0.3rem 0.75rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700' }}>{product.discountPercent}% OFF</span>}
                      {product.pdfFiles?.length > 0 ? (
                        <span style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600' }}>{product.pdfFiles.length} PDF{product.pdfFiles.length > 1 ? 's' : ''}</span>
                      ) : product.isBundle ? (
                        <span style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600' }}>📦 {product.bundledProducts?.length || 0} Items</span>
                      ) : (
                        <span style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600' }}>No PDF</span>
                      )}
                    </div>
                    <p style={{ color: '#64748b', marginBottom: '0.5rem', fontSize: isMobile ? '0.9rem' : '1rem' }}>{product.description}</p>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.9rem', color: '#64748b' }}>
                      <span>Category: {product.customCategory || product.category}</span>
                      <span>•</span><span>{product.pages} pages</span>
                      <span>•</span><span>Downloads: {product.totalDownloads || 0}</span>
                      <span>•</span><span>Revenue: ₹{product.totalRevenue || 0}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexDirection: isMobile ? 'row' : 'column', width: isMobile ? '100%' : 'auto', justifyContent: isMobile ? 'space-between' : 'center' }}>
                    <div style={{ textAlign: 'center' }}>
                      {product.originalPrice && !isFree(product.price) && (
                        <div style={{ fontSize: '1rem', color: '#94a3b8', textDecoration: 'line-through', marginBottom: '0.25rem' }}>₹{product.originalPrice}</div>
                      )}
                      <div style={{ fontSize: isFree(product.price) ? '1.5rem' : (isMobile ? '2rem' : '2.5rem'), fontWeight: '900', background: 'linear-gradient(135deg, #6366f1, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        {isFree(product.price) ? 'FREE' : `₹${product.price}`}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      {currentUser && product.userId === currentUser.uid && (
                        <button onClick={() => startEditProduct(product)} style={{ background: 'rgba(245,158,11,0.1)', border: '2px solid rgba(245,158,11,0.2)', padding: '0.75rem', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.3s ease' }}>
                          <Edit size={24} color="#f59e0b" />
                        </button>
                      )}
                      <button onClick={() => setConfirmDelete(product.id)} style={{ background: 'rgba(239,68,68,0.1)', border: '2px solid rgba(239,68,68,0.2)', padding: '0.75rem', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.3s ease' }}>
                        <Trash2 size={24} color="#ef4444" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── COUPONS TAB ── */}
      {activeTab === 'coupons' && (
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h2 style={{ fontSize: isMobile ? '1.5rem' : '2rem', fontWeight: '900', color: '#1e293b', margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Tag size={28} color="#6366f1" /> Coupon Codes
            </h2>
            <button onClick={() => setShowCouponForm(!showCouponForm)} style={{
              background: showCouponForm ? 'rgba(239,68,68,0.1)' : 'linear-gradient(135deg, #6366f1, #ec4899)',
              border: showCouponForm ? '2px solid rgba(239,68,68,0.3)' : 'none',
              color: showCouponForm ? '#ef4444' : '#fff',
              padding: '0.875rem 1.75rem', borderRadius: '14px', cursor: 'pointer', fontWeight: '700',
              display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1rem',
              boxShadow: showCouponForm ? 'none' : '0 8px 25px rgba(99,102,241,0.4)'
            }}>
              {showCouponForm ? <><X size={20} />Cancel</> : <><Plus size={20} />Create Coupon</>}
            </button>
          </div>

          {/* Coupon Create Form */}
          {showCouponForm && (
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '24px', padding: isMobile ? '1.5rem' : '2.5rem', marginBottom: '2rem', boxShadow: '0 10px 40px rgba(0,0,0,0.08)' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#1e293b', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Tag size={24} color="#6366f1" /> New Coupon
              </h3>
              <form onSubmit={handleSaveCoupon} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {/* Code + Generate */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '700', color: '#475569', fontSize: '0.9rem' }}>Coupon Code *</label>
                  <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <input type="text" placeholder="e.g. SAVE20" value={couponForm.code}
                      onChange={(e) => setCouponForm(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                      required style={{ ...inputStyle, flex: 1, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: '700', fontSize: '1.1rem' }}
                      onFocus={(e) => e.target.style.borderColor = '#6366f1'} onBlur={(e) => e.target.style.borderColor = '#e2e8f0'} />
                    <button type="button" onClick={generateCouponCode} style={{ background: 'rgba(99,102,241,0.1)', border: '2px solid rgba(99,102,241,0.3)', color: '#6366f1', padding: '0 1.25rem', borderRadius: '12px', cursor: 'pointer', fontWeight: '700', whiteSpace: 'nowrap', fontSize: '0.9rem' }}>
                      Auto Generate
                    </button>
                  </div>
                </div>

                {/* Discount type + value */}
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '700', color: '#475569', fontSize: '0.9rem' }}>Discount Type *</label>
                    <select value={couponForm.discountType} onChange={(e) => setCouponForm(prev => ({ ...prev, discountType: e.target.value }))} style={inputStyle}>
                      <option value="percent">Percentage (%) Off</option>
                      <option value="flat">Flat Amount (₹) Off</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '700', color: '#475569', fontSize: '0.9rem' }}>
                      Discount Value * {couponForm.discountType === 'percent' ? '(%)' : '(₹)'}
                    </label>
                    <input type="number" placeholder={couponForm.discountType === 'percent' ? 'e.g. 20' : 'e.g. 50'}
                      value={couponForm.discountValue} onChange={(e) => setCouponForm(prev => ({ ...prev, discountValue: e.target.value }))}
                      required min="0" max={couponForm.discountType === 'percent' ? '100' : undefined} style={inputStyle}
                      onFocus={(e) => e.target.style.borderColor = '#6366f1'} onBlur={(e) => e.target.style.borderColor = '#e2e8f0'} />
                  </div>
                </div>

                {/* Coupon preview */}
                {couponForm.discountValue && (
                  <div style={{ padding: '1rem 1.5rem', background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.08))', border: '2px dashed rgba(99,102,241,0.4)', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', padding: '0.5rem 1.25rem', borderRadius: '10px', fontWeight: '900', fontSize: '1.1rem', letterSpacing: '0.1em' }}>
                      {couponForm.code || 'YOURCODE'}
                    </div>
                    <div style={{ color: '#6366f1', fontWeight: '700', fontSize: '1rem' }}>
                      {couponForm.discountType === 'percent' ? `${couponForm.discountValue}% off` : `₹${couponForm.discountValue} off`}
                      {couponForm.minOrderValue ? ` on orders above ₹${couponForm.minOrderValue}` : ''}
                    </div>
                  </div>
                )}

                {/* Min order + Max uses */}
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '700', color: '#475569', fontSize: '0.9rem' }}>Minimum Order Value (₹)</label>
                    <input type="number" placeholder="0 for no minimum" value={couponForm.minOrderValue}
                      onChange={(e) => setCouponForm(prev => ({ ...prev, minOrderValue: e.target.value }))}
                      min="0" style={inputStyle}
                      onFocus={(e) => e.target.style.borderColor = '#6366f1'} onBlur={(e) => e.target.style.borderColor = '#e2e8f0'} />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '700', color: '#475569', fontSize: '0.9rem' }}>Max Uses (leave blank for unlimited)</label>
                    <input type="number" placeholder="e.g. 100" value={couponForm.maxUses}
                      onChange={(e) => setCouponForm(prev => ({ ...prev, maxUses: e.target.value }))}
                      min="1" style={inputStyle}
                      onFocus={(e) => e.target.style.borderColor = '#6366f1'} onBlur={(e) => e.target.style.borderColor = '#e2e8f0'} />
                  </div>
                </div>

                {/* Expiry date */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '700', color: '#475569', fontSize: '0.9rem' }}>Expiry Date (leave blank for no expiry)</label>
                  <input type="date" value={couponForm.expiryDate}
                    onChange={(e) => setCouponForm(prev => ({ ...prev, expiryDate: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]} style={inputStyle}
                    onFocus={(e) => e.target.style.borderColor = '#6366f1'} onBlur={(e) => e.target.style.borderColor = '#e2e8f0'} />
                </div>

                {/* Applicable products */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '700', color: '#475569', fontSize: '0.9rem' }}>Applicable Products</label>
                  <select value={couponForm.applicableProducts} onChange={(e) => setCouponForm(prev => ({ ...prev, applicableProducts: e.target.value }))} style={inputStyle}>
                    <option value="all">All Products</option>
                    <option value="selected">Selected Products Only</option>
                  </select>
                </div>

                {/* Product selection for coupon */}
                {couponForm.applicableProducts === 'selected' && (
                  <div style={{ border: '2px solid #e2e8f0', borderRadius: '12px', padding: '1rem', maxHeight: '250px', overflowY: 'auto' }}>
                    <div style={{ fontWeight: '700', color: '#475569', fontSize: '0.9rem', marginBottom: '0.75rem' }}>Select Products</div>
                    {products.filter(p => !p.isBundle && !isFree(p.price)).map(product => (
                      <label key={product.id} style={{ display: 'flex', alignItems: 'center', padding: '0.6rem', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', gap: '0.75rem' }}>
                        <input type="checkbox"
                          checked={couponForm.selectedProductIds.includes(product.id)}
                          onChange={() => setCouponForm(prev => ({
                            ...prev,
                            selectedProductIds: prev.selectedProductIds.includes(product.id)
                              ? prev.selectedProductIds.filter(id => id !== product.id)
                              : [...prev.selectedProductIds, product.id]
                          }))} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '600', fontSize: '0.9rem', color: '#1e293b' }}>{product.title}</div>
                          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{product.category}</div>
                        </div>
                        <div style={{ fontWeight: '700', color: '#6366f1' }}>₹{product.price}</div>
                      </label>
                    ))}
                  </div>
                )}

                {/* Active toggle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '12px' }}>
                  <label style={{ position: 'relative', display: 'inline-block', width: '52px', height: '28px', flexShrink: 0 }}>
                    <input type="checkbox" checked={couponForm.isActive} onChange={(e) => setCouponForm(prev => ({ ...prev, isActive: e.target.checked }))} style={{ display: 'none' }} />
                    <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, background: couponForm.isActive ? '#10b981' : '#cbd5e1', borderRadius: '28px', transition: '0.3s' }}>
                      <span style={{ position: 'absolute', height: '20px', width: '20px', left: couponForm.isActive ? '28px' : '4px', bottom: '4px', background: 'white', borderRadius: '50%', transition: '0.3s' }} />
                    </span>
                  </label>
                  <div>
                    <div style={{ fontWeight: '700', color: '#1e293b' }}>Active</div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Customers can use this coupon immediately after saving</div>
                  </div>
                </div>

                <button type="submit" disabled={savingCoupon} style={{
                  width: '100%', background: savingCoupon ? '#94a3b8' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  border: 'none', color: '#fff', padding: '1.1rem', borderRadius: '14px',
                  cursor: savingCoupon ? 'not-allowed' : 'pointer', fontWeight: '700', fontSize: '1.1rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem',
                  boxShadow: '0 8px 25px rgba(99,102,241,0.4)'
                }}>
                  {savingCoupon ? <><Loader size={22} style={{ animation: 'spin 1s linear infinite' }} />Saving...</> : <><Save size={22} />Save Coupon</>}
                </button>
              </form>
            </div>
          )}

          {/* Coupons List */}
          {loadingCoupons ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
              <Loader size={40} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
              <div>Loading coupons...</div>
            </div>
          ) : coupons.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8', background: '#fff', borderRadius: '20px', border: '2px dashed #e2e8f0' }}>
              <Tag size={48} color="#cbd5e1" style={{ margin: '0 auto 1rem' }} />
              <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>No coupons yet</h3>
              <p>Create your first coupon to offer discounts to your customers</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {coupons.map((coupon) => {
                const expired = isCouponExpired(coupon);
                const maxedOut = isCouponMaxedOut(coupon);
                const statusColor = !coupon.isActive ? '#94a3b8' : expired ? '#ef4444' : maxedOut ? '#f59e0b' : '#10b981';
                const statusLabel = !coupon.isActive ? 'Inactive' : expired ? 'Expired' : maxedOut ? 'Maxed Out' : 'Active';

                return (
                  <div key={coupon.id} style={{
                    background: '#fff', border: `1px solid ${coupon.isActive && !expired && !maxedOut ? '#e2e8f0' : '#fee2e2'}`,
                    borderRadius: '18px', padding: isMobile ? '1.25rem' : '1.75rem',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                    opacity: (!coupon.isActive || expired || maxedOut) ? 0.75 : 1
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {/* Code + copy */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                          <div style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', padding: '0.5rem 1.25rem', borderRadius: '10px', fontWeight: '900', fontSize: isMobile ? '1rem' : '1.25rem', letterSpacing: '0.1em' }}>
                            {coupon.code}
                          </div>
                          <button onClick={() => copyCouponCode(coupon.code)} title="Copy code" style={{ background: copiedCode === coupon.code ? 'rgba(16,185,129,0.1)' : 'rgba(99,102,241,0.1)', border: '1px solid', borderColor: copiedCode === coupon.code ? 'rgba(16,185,129,0.3)' : 'rgba(99,102,241,0.3)', borderRadius: '8px', padding: '0.4rem 0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: '600', fontSize: '0.85rem', color: copiedCode === coupon.code ? '#10b981' : '#6366f1' }}>
                            {copiedCode === coupon.code ? <><CheckCircle size={16} />Copied!</> : <><Copy size={16} />Copy</>}
                          </button>
                          <span style={{ background: `${statusColor}15`, color: statusColor, padding: '0.3rem 0.75rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '700' }}>
                            {statusLabel}
                          </span>
                        </div>

                        {/* Discount info */}
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#6366f1', fontWeight: '700', fontSize: '1.1rem' }}>
                            <Percent size={18} />
                            {coupon.discountType === 'percent' ? `${coupon.discountValue}% off` : `₹${coupon.discountValue} off`}
                          </div>
                          {coupon.minOrderValue > 0 && (
                            <div style={{ fontSize: '0.875rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                              <AlertCircle size={14} /> Min order: ₹{coupon.minOrderValue}
                            </div>
                          )}
                        </div>

                        {/* Meta info */}
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.85rem', color: '#94a3b8' }}>
                          <span>Used: {coupon.usedCount || 0}{coupon.maxUses ? `/${coupon.maxUses}` : ''} times</span>
                          {coupon.expiryDate && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: expired ? '#ef4444' : '#94a3b8' }}>
                              <Calendar size={13} /> Expires: {new Date(coupon.expiryDate).toLocaleDateString()}
                            </span>
                          )}
                          <span>Products: {coupon.applicableProducts === 'all' ? 'All' : `${coupon.selectedProductIds?.length || 0} selected`}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', flexDirection: isMobile ? 'row' : 'column', gap: '0.5rem', flexShrink: 0 }}>
                        <button onClick={() => handleToggleCoupon(coupon)} style={{ background: coupon.isActive ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', border: `1px solid ${coupon.isActive ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`, color: coupon.isActive ? '#ef4444' : '#10b981', padding: '0.5rem 0.875rem', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                          {coupon.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button onClick={() => setConfirmDeleteCoupon(coupon.id)} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', padding: '0.5rem', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Trash2 size={18} color="#ef4444" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── QUESTIONS TAB ── */}
      {activeTab === 'questions' && (
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <AdminQuestions />
        </div>
      )}

      {/* ── ANALYTICS TAB ── */}
      {activeTab === 'analytics' && (
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <AdminAnalytics />
        </div>
      )}

      {/* ── ORDERS TAB ── */}
      {activeTab === 'orders' && (
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <AdminOrdersManager />
        </div>
      )}

      {/* Delete product modal */}
      <ConfirmModal
        show={confirmDelete !== null}
        onConfirm={() => { deleteProduct(confirmDelete); setConfirmDelete(null); window.showToast?.('Product deleted successfully!', 'success'); }}
        onCancel={() => setConfirmDelete(null)}
        title="Delete Product?"
        message="Are you sure you want to delete this product? This action cannot be undone."
        confirmText="Yes, Delete"
        cancelText="Cancel"
        type="danger"
      />

      {/* Delete coupon modal */}
      <ConfirmModal
        show={confirmDeleteCoupon !== null}
        onConfirm={() => handleDeleteCoupon(confirmDeleteCoupon)}
        onCancel={() => setConfirmDeleteCoupon(null)}
        title="Delete Coupon?"
        message="Are you sure you want to delete this coupon? Customers will no longer be able to use it."
        confirmText="Yes, Delete"
        cancelText="Cancel"
        type="danger"
      />

      <style>{`
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        div::-webkit-scrollbar { display: none; }
        div { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}

export default AdminPanel;