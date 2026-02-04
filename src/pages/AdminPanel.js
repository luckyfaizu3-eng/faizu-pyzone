import React, { useState, useEffect } from 'react';
import { Upload, Trash2, X, Plus, Package, BarChart, FileText, Image as ImageIcon, Loader, Edit, Save, Zap, Search } from 'lucide-react';
import { uploadPDF, uploadImage } from '../supabaseUpload';
import { auth } from '../firebase';
import { db } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import ConfirmModal from '../components/ConfirmModal';

function AdminPanel({ products, addProduct, deleteProduct, orders }) {
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pdfFiles, setPdfFiles] = useState([]);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [isBundle, setIsBundle] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  
  // ✅ Edit Mode States
  const [editingProduct, setEditingProduct] = useState(null);
  const [editMode, setEditMode] = useState(false);
  
  // ✅ Preview Pages State
  const [previewPages, setPreviewPages] = useState([]);
  const [generatingPreview, setGeneratingPreview] = useState(false);
  
  // ✅ Bundle Product Selection
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [showProductSelector, setShowProductSelector] = useState(false);
  
  // ✅ Search State
  const [searchQuery, setSearchQuery] = useState('');
  
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
    discountPercent: '' // ✅ Individual product discount
  });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
      console.log('👤 Current user:', user?.email);
    });
    
    // ✅ Load PDF.js library for preview generation
    if (!window.pdfjsLib) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.async = true;
      script.onload = () => {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        console.log('✅ PDF.js loaded for preview generation');
      };
      document.head.appendChild(script);
    }
    
    return () => unsubscribe();
  }, []);

  // ✅ Start Editing Product
  const startEditProduct = (product) => {
    console.log('✏️ Editing product:', product);
    setEditingProduct(product);
    setEditMode(true);
    setShowUploadForm(true);
    
    // Pre-fill form with existing data
    setFormData({
      title: product.title || '',
      category: product.category || '',
      price: product.price?.toString() || '',
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
    
    // Set existing thumbnail preview
    if (product.thumbnail) {
      setThumbnailPreview(product.thumbnail);
    }
    
    // ✅ Set existing preview pages if available
    if (product.previewPages && product.previewPages.length > 0) {
      setPreviewPages(product.previewPages);
    }
    
    // ✅ Set selected products for bundle
    if (product.isBundle && product.bundledProducts) {
      setSelectedProducts(product.bundledProducts);
    }
  };

  // ✅ Cancel Edit
  const cancelEdit = () => {
    setEditMode(false);
    setEditingProduct(null);
    setShowUploadForm(false);
    resetForm();
  };

  // ✅ Reset Form
  const resetForm = () => {
    setFormData({
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
    const validPdfs = files.filter(file => file.type === 'application/pdf');
    
    if (validPdfs.length !== files.length) {
      window.showToast?.('⚠️ Only PDF files are allowed!', 'warning');
    }
    
    if (validPdfs.length > 0) {
      setPdfFiles(prevFiles => [...prevFiles, ...validPdfs]);
      window.showToast?.(`✅ ${validPdfs.length} PDF(s) selected`, 'success');
    }
  };

  const removePdf = (index) => {
    setPdfFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
    window.showToast?.('🗑️ PDF removed', 'info');
  };

  // ✅ Generate Preview Pages from First Uploaded PDF
  const generatePreviewFromUploadedPDF = async () => {
    if (pdfFiles.length === 0) {
      window.showToast?.('⚠️ Please upload PDF files first!', 'warning');
      return;
    }

    const pageCount = parseInt(formData.previewPageCount) || 3;
    const firstPdf = pdfFiles[0];
    
    setGeneratingPreview(true);
    window.showToast?.(`⏳ Generating ${pageCount} preview pages from ${firstPdf.name}...`, 'info');
    
    try {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        const pdfData = new Uint8Array(e.target.result);
        
        if (!window.pdfjsLib) {
          window.showToast?.('❌ PDF.js library not loaded. Please refresh the page.', 'error');
          setGeneratingPreview(false);
          return;
        }
        
        const loadingTask = window.pdfjsLib.getDocument({ data: pdfData });
        const pdf = await loadingTask.promise;
        
        const totalPages = pdf.numPages;
        const pagesToCapture = Math.min(pageCount, totalPages);
        
        const previews = [];
        
        for (let i = 1; i <= pagesToCapture; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 1.5 });
          
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          
          await page.render({
            canvasContext: context,
            viewport: viewport
          }).promise;
          
          const imageData = canvas.toDataURL('image/jpeg', 0.8);
          
          previews.push({
            pageNumber: i,
            imageData: imageData
          });
        }
        
        setPreviewPages(previews);
        window.showToast?.(`✅ ${previews.length} preview pages generated from ${firstPdf.name}!`, 'success');
        setGeneratingPreview(false);
      };
      
      reader.onerror = () => {
        window.showToast?.('❌ Failed to read PDF file', 'error');
        setGeneratingPreview(false);
      };
      
      reader.readAsArrayBuffer(firstPdf);
      
    } catch (error) {
      console.error('❌ Preview generation error:', error);
      window.showToast?.('❌ Failed to generate preview: ' + error.message, 'error');
      setGeneratingPreview(false);
    }
  };

  // ✅ Generate Preview from Existing Product PDF (Edit Mode)
  const generatePreviewFromExistingPDF = async () => {
    if (!editingProduct || !editingProduct.pdfFiles || editingProduct.pdfFiles.length === 0) {
      window.showToast?.('⚠️ No existing PDF found!', 'warning');
      return;
    }

    const pageCount = parseInt(formData.previewPageCount) || 3;
    const firstPdfUrl = editingProduct.pdfFiles[0].url;
    const firstPdfName = editingProduct.pdfFiles[0].fileName;
    
    setGeneratingPreview(true);
    window.showToast?.(`⏳ Downloading and generating ${pageCount} preview pages from ${firstPdfName}...`, 'info');
    
    try {
      const response = await fetch(firstPdfUrl);
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      const pdfData = new Uint8Array(arrayBuffer);
      
      if (!window.pdfjsLib) {
        window.showToast?.('❌ PDF.js library not loaded. Please refresh the page.', 'error');
        setGeneratingPreview(false);
        return;
      }
      
      const loadingTask = window.pdfjsLib.getDocument({ data: pdfData });
      const pdf = await loadingTask.promise;
      
      const totalPages = pdf.numPages;
      const pagesToCapture = Math.min(pageCount, totalPages);
      
      const previews = [];
      
      for (let i = 1; i <= pagesToCapture; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 1.5 });
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        await page.render({
          canvasContext: context,
          viewport: viewport
        }).promise;
        
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        
        previews.push({
          pageNumber: i,
          imageData: imageData
        });
      }
      
      setPreviewPages(previews);
      window.showToast?.(`✅ ${previews.length} preview pages generated from existing PDF!`, 'success');
      setGeneratingPreview(false);
      
    } catch (error) {
      console.error('❌ Preview generation error:', error);
      window.showToast?.('❌ Failed to generate preview: ' + error.message, 'error');
      setGeneratingPreview(false);
    }
  };

  // ✅ Remove Preview Page
  const removePreviewPage = (index) => {
    setPreviewPages(prevPages => prevPages.filter((_, i) => i !== index));
    window.showToast?.('🗑️ Preview page removed', 'info');
  };

  // ✅ Remove existing PDF from edited product
  const removeExistingPdf = (index) => {
    if (!editingProduct) return;
    
    const updatedPdfFiles = editingProduct.pdfFiles.filter((_, i) => i !== index);
    setEditingProduct({
      ...editingProduct,
      pdfFiles: updatedPdfFiles
    });
    window.showToast?.('🗑️ Existing PDF marked for removal', 'info');
  };

  const handleThumbnailChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setThumbnailFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setThumbnailPreview(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      window.showToast?.('Please select a valid image file!', 'error');
    }
  };

  // ✅ Calculate Price with Discount
  const calculateDiscountedPrice = () => {
    if (formData.price && formData.discountPercent) {
      const original = parseFloat(formData.price);
      const discount = parseFloat(formData.discountPercent);
      return Math.round(original - (original * discount / 100));
    }
    return formData.price;
  };

  const calculateBundlePrice = () => {
    if (isBundle && selectedProducts.length > 0) {
      const total = selectedProducts.reduce((sum, product) => sum + product.price, 0);
      const discount = parseFloat(formData.discount) || 0;
      return Math.round(total - (total * discount / 100));
    }
    return '';
  };

  // ✅ Toggle Product Selection for Bundle
  const toggleProductSelection = (product) => {
    setSelectedProducts(prev => {
      const isSelected = prev.some(p => p.id === product.id);
      if (isSelected) {
        return prev.filter(p => p.id !== product.id);
      } else {
        return [...prev, product];
      }
    });
  };

  // ✅ Update Existing Product
  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      window.showToast?.('❌ Please login first!', 'error');
      return;
    }

    if (!editingProduct) {
      window.showToast?.('❌ No product selected for editing!', 'error');
      return;
    }

    setUploading(true);
    window.showToast?.('⏳ Updating product... Please wait!', 'info');

    try {
      let updatedPdfFiles = [...(editingProduct.pdfFiles || [])];
      let thumbnailUrl = editingProduct.thumbnail || '';

      // ✅ Upload new PDFs if any
      if (pdfFiles.length > 0 && !isBundle) {
        console.log(`📤 Uploading ${pdfFiles.length} new PDFs...`);
        
        for (let i = 0; i < pdfFiles.length; i++) {
          const pdfResult = await uploadPDF(pdfFiles[i]);
          if (pdfResult.success) {
            updatedPdfFiles.push({
              url: pdfResult.url,
              fileName: pdfResult.fileName,
              size: (pdfFiles[i].size / 1024 / 1024).toFixed(2) + ' MB'
            });
            console.log(`✅ New PDF ${i + 1}/${pdfFiles.length} uploaded`);
          } else {
            window.showToast?.(`❌ PDF ${i + 1} upload failed: ${pdfResult.error}`, 'error');
            setUploading(false);
            return;
          }
        }
      }

      // ✅ Upload new thumbnail if changed
      if (thumbnailFile) {
        console.log('📤 Uploading new thumbnail...');
        const thumbResult = await uploadImage(thumbnailFile);
        if (thumbResult.success) {
          thumbnailUrl = thumbResult.url;
          console.log('✅ New thumbnail uploaded');
        } else {
          window.showToast?.('❌ Thumbnail upload failed: ' + thumbResult.error, 'error');
          setUploading(false);
          return;
        }
      }

      // ✅ Prepare updated product data
      const finalPrice = isBundle ? calculateBundlePrice() : (formData.discountPercent ? calculateDiscountedPrice() : parseInt(formData.price));
      
      const updatedData = {
        title: formData.title,
        category: formData.category,
        customCategory: formData.customCategory || null,
        price: finalPrice,
        originalPrice: formData.discountPercent ? parseInt(formData.price) : null,
        discountPercent: formData.discountPercent ? parseFloat(formData.discountPercent) : null,
        description: formData.description,
        pages: parseInt(formData.pages),
        rating: parseFloat(formData.rating),
        fileSize: formData.fileSize,
        language: formData.language,
        image: formData.image,
        pdfFiles: isBundle ? [] : updatedPdfFiles,
        thumbnail: thumbnailUrl,
        isBundle: isBundle,
        previewPages: previewPages.length > 0 ? previewPages : (editingProduct.previewPages || []),
        previewPageCount: parseInt(formData.previewPageCount) || 3,
        lastUpdated: new Date().toISOString()
      };

      if (isBundle) {
        const totalOriginal = selectedProducts.reduce((sum, p) => sum + p.price, 0);
        updatedData.bundledProducts = selectedProducts;
        updatedData.bundleInfo = {
          individualPrice: totalOriginal,
          discount: parseFloat(formData.discount),
          savings: totalOriginal - calculateBundlePrice(),
          itemsIncluded: formData.itemsIncluded,
          productCount: selectedProducts.length
        };
      }

      console.log('📝 Updating product in Firestore:', updatedData);
      
      // ✅ Update in Firestore
      const productRef = doc(db, 'products', editingProduct.id);
      await updateDoc(productRef, updatedData);
      
      window.showToast?.('✅ Product updated successfully!', 'success');
      
      cancelEdit();
      window.location.reload();
      
    } catch (error) {
      console.error('❌ Update error:', error);
      window.showToast?.('❌ Update failed: ' + error.message, 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentUser) {
      window.showToast?.('❌ Please login first!', 'error');
      return;
    }

    if (pdfFiles.length === 0 && !isBundle) {
      window.showToast?.('⚠️ Please upload at least one PDF file!', 'error');
      return;
    }

    if (isBundle && selectedProducts.length === 0) {
      window.showToast?.('⚠️ Please select products for the bundle!', 'error');
      return;
    }

    if (!formData.category && !formData.customCategory) {
      window.showToast?.('⚠️ Please select or enter a category!', 'error');
      return;
    }

    setUploading(true);
    window.showToast?.(`⏳ Uploading ${isBundle ? 'bundle' : `${pdfFiles.length} PDF(s)`}... Please wait!`, 'info');

    try {
      let pdfUrls = [];
      let thumbnailUrl = '';

      if (pdfFiles.length > 0 && !isBundle) {
        console.log(`📤 Uploading ${pdfFiles.length} PDFs to Supabase...`);
        
        for (let i = 0; i < pdfFiles.length; i++) {
          const pdfResult = await uploadPDF(pdfFiles[i]);
          if (pdfResult.success) {
            pdfUrls.push({
              url: pdfResult.url,
              fileName: pdfResult.fileName,
              size: (pdfFiles[i].size / 1024 / 1024).toFixed(2) + ' MB'
            });
            console.log(`✅ PDF ${i + 1}/${pdfFiles.length} uploaded:`, pdfResult.fileName);
          } else {
            window.showToast?.(`❌ PDF ${i + 1} upload failed: ${pdfResult.error}`, 'error');
            setUploading(false);
            return;
          }
        }
      }

      if (thumbnailFile) {
        console.log('📤 Uploading Thumbnail to Supabase...');
        const thumbResult = await uploadImage(thumbnailFile);
        if (thumbResult.success) {
          thumbnailUrl = thumbResult.url;
          console.log('✅ Thumbnail URL:', thumbnailUrl);
        } else {
          window.showToast?.('❌ Thumbnail upload failed: ' + thumbResult.error, 'error');
          setUploading(false);
          return;
        }
      }

      const finalPrice = isBundle ? calculateBundlePrice() : (formData.discountPercent ? calculateDiscountedPrice() : parseInt(formData.price));

      const productData = {
        title: formData.title,
        category: formData.category,
        customCategory: formData.customCategory || null,
        price: finalPrice,
        originalPrice: formData.discountPercent ? parseInt(formData.price) : null,
        discountPercent: formData.discountPercent ? parseFloat(formData.discountPercent) : null,
        description: formData.description,
        pages: parseInt(formData.pages),
        rating: parseFloat(formData.rating),
        fileSize: formData.fileSize,
        language: formData.language,
        image: formData.image,
        pdfFiles: isBundle ? [] : pdfUrls,
        thumbnail: thumbnailUrl || null,
        isBundle: isBundle,
        userId: currentUser.uid,
        userEmail: currentUser.email,
        totalDownloads: 0,
        totalRevenue: 0,
        previewPages: previewPages,
        previewPageCount: parseInt(formData.previewPageCount) || 3
      };

      if (isBundle) {
        const totalOriginal = selectedProducts.reduce((sum, p) => sum + p.price, 0);
        productData.bundledProducts = selectedProducts;
        productData.bundleInfo = {
          individualPrice: totalOriginal,
          discount: parseFloat(formData.discount),
          savings: totalOriginal - calculateBundlePrice(),
          itemsIncluded: formData.itemsIncluded,
          productCount: selectedProducts.length
        };
      }

      console.log('📝 Product data to save:', productData);
      
      await addProduct(productData);
      
      resetForm();
      setShowUploadForm(false);
      
      window.showToast?.('✅ Product uploaded successfully!', 'success');
      
    } catch (error) {
      console.error('❌ Upload error:', error);
      window.showToast?.('❌ Upload failed: ' + error.message, 'error');
    } finally {
      setUploading(false);
    }
  };

  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
  const totalDownloads = products.reduce((sum, product) => sum + (product.totalDownloads || 0), 0);

  // ✅ Filter products by search query
  const filteredProducts = products.filter(product => 
    product.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{
      paddingTop: '100px',
      minHeight: '100vh',
      padding: '100px 1.5rem 5rem'
    }}>
      <h1 style={{
        fontSize: 'clamp(2.5rem, 6vw, 4rem)',
        fontWeight: '900',
        textAlign: 'center',
        marginBottom: '3rem',
        background: 'linear-gradient(135deg, #6366f1, #ec4899)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent'
      }}>
        Admin Panel
      </h1>

      {currentUser && (
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto 2rem',
          padding: '1rem',
          background: 'rgba(99,102,241,0.1)',
          border: '1px solid rgba(99,102,241,0.3)',
          borderRadius: '12px',
          textAlign: 'center',
          fontSize: '1rem',
          color: '#6366f1',
          fontWeight: '600'
        }}>
          👤 Logged in as: <strong>{currentUser.email}</strong>
        </div>
      )}

      {/* Stats Dashboard */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '2rem',
        maxWidth: '1400px',
        margin: '0 auto 3rem'
      }}>
        {[
          { icon: FileText, label: 'Total Products', value: products.length, color: '#6366f1' },
          { icon: Package, label: 'Orders', value: orders.length, color: '#10b981' },
          { icon: BarChart, label: 'Revenue', value: `₹${totalRevenue}`, color: '#ec4899' },
          { icon: Upload, label: 'Total Downloads', value: totalDownloads, color: '#f59e0b' }
        ].map((stat, i) => (
          <div key={i} style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '20px',
            padding: '2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1.5rem',
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
          }}>
            <div style={{
              background: `${stat.color}15`,
              borderRadius: '14px',
              padding: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <stat.icon size={32} color={stat.color} />
            </div>
            <div>
              <div style={{
                fontSize: '0.95rem',
                color: '#64748b',
                marginBottom: '0.25rem',
                fontWeight: '600'
              }}>
                {stat.label}
              </div>
              <div style={{
                fontSize: '2rem',
                fontWeight: '900',
                color: '#1e293b'
              }}>
                {stat.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Action Button */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto 3rem',
        display: 'flex',
        justifyContent: 'center'
      }}>
        <button 
          onClick={() => {
            if (!currentUser) {
              window.showToast?.('❌ Please login first!', 'error');
              return;
            }
            if (editMode) {
              cancelEdit();
            } else {
              setShowUploadForm(!showUploadForm);
            }
          }}
          style={{
            background: 'linear-gradient(135deg, #6366f1, #ec4899)',
            border: 'none',
            color: 'white',
            padding: '1.25rem 3rem',
            fontSize: '1.25rem',
            borderRadius: '16px',
            cursor: 'pointer',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            boxShadow: '0 10px 30px rgba(99,102,241,0.4)',
            transition: 'all 0.3s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-3px)';
            e.currentTarget.style.boxShadow = '0 15px 40px rgba(99,102,241,0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 10px 30px rgba(99,102,241,0.4)';
          }}
        >
          {showUploadForm ? <X size={24} /> : <Plus size={24} />}
          {editMode ? 'Cancel Edit' : (showUploadForm ? 'Cancel' : 'Upload New Product')}
        </button>
      </div>

      {/* Upload/Edit Form */}
      {showUploadForm && (
        <div style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '24px',
          padding: '3rem',
          maxWidth: '800px',
          margin: '0 auto 3rem',
          boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
          animation: 'slideDown 0.4s ease'
        }}>
          <h2 style={{
            fontSize: '2rem',
            fontWeight: '900',
            marginBottom: '2rem',
            color: '#1e293b',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            {editMode ? (
              <>
                <Edit size={32} color="#6366f1" />
                Edit Product
              </>
            ) : (
              <>
                <Plus size={32} color="#6366f1" />
                Upload Product
              </>
            )}
          </h2>

          {/* Bundle Toggle */}
          <div style={{
            background: 'rgba(99,102,241,0.05)',
            border: '1px solid rgba(99,102,241,0.2)',
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Package size={24} color="#6366f1" />
              <div>
                <div style={{ fontWeight: '700', color: '#1e293b', fontSize: '1.1rem' }}>
                  Create Bundle Package
                </div>
                <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
                  Select multiple products to bundle together
                </div>
              </div>
            </div>
            <label style={{
              position: 'relative',
              display: 'inline-block',
              width: '60px',
              height: '32px'
            }}>
              <input
                type="checkbox"
                checked={isBundle}
                onChange={(e) => setIsBundle(e.target.checked)}
                style={{ display: 'none' }}
              />
              <span style={{
                position: 'absolute',
                cursor: 'pointer',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: isBundle ? '#6366f1' : '#cbd5e1',
                borderRadius: '32px',
                transition: '0.3s'
              }}>
                <span style={{
                  position: 'absolute',
                  height: '24px',
                  width: '24px',
                  left: isBundle ? '32px' : '4px',
                  bottom: '4px',
                  background: 'white',
                  borderRadius: '50%',
                  transition: '0.3s'
                }} />
              </span>
            </label>
          </div>

          <form onSubmit={editMode ? handleUpdateProduct : handleSubmit} style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem'
          }}>
            <input
              type="text"
              placeholder="Product Title *"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              required
              style={{
                padding: '1rem',
                border: '2px solid #e2e8f0',
                borderRadius: '12px',
                fontSize: '1.05rem',
                outline: 'none',
                transition: 'border-color 0.3s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#6366f1'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            />

            {/* ✅ Category Selection - Show "All Notes" in dropdown */}
            <div style={{ display: 'grid', gridTemplateColumns: formData.category === 'custom' ? '1fr 1fr' : '1fr', gap: '1rem' }}>
              <select
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                required
                style={{
                  padding: '1rem',
                  border: '2px solid #e2e8f0',
                  borderRadius: '12px',
                  fontSize: '1.05rem',
                  outline: 'none'
                }}
              >
                <option value="">Select Category *</option>
                <option value="python">Python Notes</option>
                <option value="jkbose">JKBOSE Materials</option>
                <option value="job">Job Preparation</option>
                <option value="web">Web Development</option>
                <option value="hacking">Ethical Hacking</option>
                <option value="data">Data Science</option>
                <option value="ai">AI & ML</option>
                <option value="marketing">Digital Marketing</option>
                <option value="custom">✏️ Custom Category</option>
              </select>

              {formData.category === 'custom' && (
                <input
                  type="text"
                  placeholder="Enter custom category name *"
                  value={formData.customCategory}
                  onChange={(e) => setFormData({...formData, customCategory: e.target.value})}
                  required
                  style={{
                    padding: '1rem',
                    border: '2px solid #e2e8f0',
                    borderRadius: '12px',
                    fontSize: '1.05rem'
                  }}
                />
              )}
            </div>

            {/* Bundle Product Selection or Regular Product Options */}
            {isBundle ? (
              <div style={{
                background: 'rgba(16,185,129,0.05)',
                border: '2px solid rgba(16,185,129,0.2)',
                borderRadius: '12px',
                padding: '1.5rem'
              }}>
                <div style={{
                  fontSize: '1.1rem',
                  fontWeight: '700',
                  color: '#10b981',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Package size={20} /> Bundle Configuration
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowProductSelector(!showProductSelector)}
                    style={{
                      background: '#10b981',
                      color: '#fff',
                      border: 'none',
                      padding: '0.5rem 1rem',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: '600'
                    }}
                  >
                    {showProductSelector ? 'Hide' : 'Select'} Products
                  </button>
                </div>

                {/* Selected Products */}
                {selectedProducts.length > 0 && (
                  <div style={{
                    marginBottom: '1rem',
                    padding: '1rem',
                    background: '#ffffff',
                    borderRadius: '8px'
                  }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#64748b', marginBottom: '0.5rem' }}>
                      Selected Products ({selectedProducts.length})
                    </div>
                    {selectedProducts.map(product => (
                      <div key={product.id} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '0.5rem',
                        borderBottom: '1px solid #e2e8f0'
                      }}>
                        <span style={{ fontSize: '0.9rem' }}>{product.title}</span>
                        <span style={{ fontWeight: '700', color: '#10b981' }}>₹{product.price}</span>
                      </div>
                    ))}
                    <div style={{
                      marginTop: '0.75rem',
                      padding: '0.75rem',
                      background: 'rgba(16,185,129,0.1)',
                      borderRadius: '6px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontWeight: '700'
                    }}>
                      <span>Total Original Price:</span>
                      <span style={{ color: '#10b981' }}>
                        ₹{selectedProducts.reduce((sum, p) => sum + p.price, 0)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Product Selector Modal */}
                {showProductSelector && (
                  <div style={{
                    marginBottom: '1rem',
                    maxHeight: '300px',
                    overflowY: 'auto',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '1rem',
                    background: '#ffffff'
                  }}>
                    {products.filter(p => !p.isBundle).map(product => (
                      <label key={product.id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0.75rem',
                        cursor: 'pointer',
                        borderBottom: '1px solid #f1f5f9',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(99,102,241,0.05)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <input
                          type="checkbox"
                          checked={selectedProducts.some(p => p.id === product.id)}
                          onChange={() => toggleProductSelection(product)}
                          style={{ marginRight: '1rem' }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>{product.title}</div>
                          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{product.category}</div>
                        </div>
                        <div style={{ fontWeight: '700', color: '#6366f1' }}>₹{product.price}</div>
                      </label>
                    ))}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <input
                    type="number"
                    placeholder="Discount % *"
                    value={formData.discount}
                    onChange={(e) => setFormData({...formData, discount: e.target.value})}
                    required
                    min="0"
                    max="100"
                    style={{
                      padding: '1rem',
                      border: '2px solid #e2e8f0',
                      borderRadius: '12px',
                      fontSize: '1.05rem'
                    }}
                  />
                  <div style={{
                    padding: '1rem',
                    background: '#ffffff',
                    border: '2px solid #10b981',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: '900',
                    fontSize: '1.2rem',
                    color: '#10b981'
                  }}>
                    ₹{calculateBundlePrice() || '0'}
                  </div>
                </div>

                <textarea
                  placeholder="What's included? (e.g., All chapters, Practice sets, Solutions) *"
                  value={formData.itemsIncluded}
                  onChange={(e) => setFormData({...formData, itemsIncluded: e.target.value})}
                  required
                  rows="3"
                  style={{
                    width: '100%',
                    padding: '1rem',
                    border: '2px solid #e2e8f0',
                    borderRadius: '12px',
                    fontSize: '1.05rem',
                    marginTop: '1rem',
                    resize: 'vertical',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            ) : (
              <>
                {/* Regular Product Price with Discount */}
                <div style={{
                  background: 'rgba(99,102,241,0.05)',
                  border: '1px solid rgba(99,102,241,0.2)',
                  borderRadius: '12px',
                  padding: '1.5rem'
                }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <input
                      type="number"
                      placeholder="Price (₹) *"
                      value={formData.price}
                      onChange={(e) => setFormData({...formData, price: e.target.value})}
                      required
                      style={{
                        padding: '1rem',
                        border: '2px solid #e2e8f0',
                        borderRadius: '12px',
                        fontSize: '1.05rem'
                      }}
                    />
                    <input
                      type="number"
                      placeholder="Discount % (Optional)"
                      value={formData.discountPercent}
                      onChange={(e) => setFormData({...formData, discountPercent: e.target.value})}
                      min="0"
                      max="100"
                      style={{
                        padding: '1rem',
                        border: '2px solid #e2e8f0',
                        borderRadius: '12px',
                        fontSize: '1.05rem'
                      }}
                    />
                  </div>
                  {formData.price && formData.discountPercent && (
                    <div style={{
                      marginTop: '1rem',
                      padding: '1rem',
                      background: '#ffffff',
                      borderRadius: '8px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span style={{ color: '#64748b', textDecoration: 'line-through' }}>₹{formData.price}</span>
                      <span style={{
                        fontSize: '1.5rem',
                        fontWeight: '900',
                        color: '#10b981'
                      }}>
                        ₹{calculateDiscountedPrice()}
                        <span style={{ fontSize: '0.9rem', marginLeft: '0.5rem', color: '#6366f1' }}>
                          ({formData.discountPercent}% OFF)
                        </span>
                      </span>
                    </div>
                  )}
                </div>
              </>
            )}

            <textarea
              placeholder="Description *"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              required
              rows="4"
              style={{
                padding: '1rem',
                border: '2px solid #e2e8f0',
                borderRadius: '12px',
                fontSize: '1.05rem',
                resize: 'vertical'
              }}
            />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <input
                type="number"
                placeholder="Pages"
                value={formData.pages}
                onChange={(e) => setFormData({...formData, pages: e.target.value})}
                style={{
                  padding: '1rem',
                  border: '2px solid #e2e8f0',
                  borderRadius: '12px',
                  fontSize: '1.05rem'
                }}
              />
              <input
                type="text"
                placeholder="File Size (e.g., 5 MB)"
                value={formData.fileSize}
                onChange={(e) => setFormData({...formData, fileSize: e.target.value})}
                style={{
                  padding: '1rem',
                  border: '2px solid #e2e8f0',
                  borderRadius: '12px',
                  fontSize: '1.05rem'
                }}
              />
            </div>

            {/* Continue with the rest of the form (PDFs, thumbnails, etc.) - keeping the existing code from your original file */}
            {/* ... (I'll include this in the next part to stay within length limits) ... */}

            {/* ✅ Existing PDFs (Edit Mode) */}
            {editMode && editingProduct && editingProduct.pdfFiles && editingProduct.pdfFiles.length > 0 && !isBundle && (
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.75rem',
                  fontSize: '1.05rem',
                  fontWeight: '700',
                  color: '#1e293b'
                }}>
                  Current PDFs
                </label>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  marginBottom: '1rem'
                }}>
                  {editingProduct.pdfFiles.map((pdf, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 1rem',
                      background: 'rgba(99,102,241,0.05)',
                      border: '1px solid rgba(99,102,241,0.2)',
                      borderRadius: '8px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FileText size={20} color="#6366f1" />
                        <div>
                          <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '0.9rem' }}>
                            {pdf.fileName}
                          </div>
                          {pdf.size && (
                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                              {pdf.size}
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeExistingPdf(index)}
                        style={{
                          background: 'rgba(239,68,68,0.1)',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '0.5rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <X size={16} color="#ef4444" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Multi-PDF Upload */}
            {!isBundle && (
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.75rem',
                  fontSize: '1.05rem',
                  fontWeight: '700',
                  color: '#1e293b'
                }}>
                  {editMode ? 'Add More PDFs (Optional)' : 'Upload PDFs * (Multiple files allowed)'}
                </label>
                
                {/* Selected PDFs List */}
                {pdfFiles.length > 0 && (
                  <div style={{
                    marginBottom: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem'
                  }}>
                    {pdfFiles.map((file, index) => (
                      <div key={index} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.75rem 1rem',
                        background: 'rgba(16,185,129,0.05)',
                        border: '1px solid rgba(16,185,129,0.2)',
                        borderRadius: '8px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <FileText size={20} color="#10b981" />
                          <div>
                            <div style={{ fontWeight: '600', color: '#1e293b', fontSize: '0.9rem' }}>
                              {file.name}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removePdf(index)}
                          style={{
                            background: 'rgba(239,68,68,0.1)',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '0.5rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                        >
                          <X size={16} color="#ef4444" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <label style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  padding: '1.5rem',
                  border: '2px dashed #cbd5e1',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  background: pdfFiles.length > 0 ? 'rgba(16,185,129,0.05)' : 'transparent'
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = '#6366f1'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = '#cbd5e1'}
                >
                  <Upload size={24} color={pdfFiles.length > 0 ? '#10b981' : '#64748b'} />
                  <div>
                    <div style={{ fontWeight: '600', color: '#1e293b' }}>
                      {pdfFiles.length > 0 ? `✅ ${pdfFiles.length} PDF(s) selected` : 'Click to upload PDFs'}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
                      You can select multiple PDF files
                    </div>
                  </div>
                  <input
                    type="file"
                    accept=".pdf"
                    multiple
                    onChange={handlePdfChange}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
            )}

            {/* Thumbnail Upload */}
            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.75rem',
                fontSize: '1.05rem',
                fontWeight: '700',
                color: '#1e293b'
              }}>
                {editMode ? 'Change Thumbnail (Optional)' : 'Upload Thumbnail (Optional)'}
              </label>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '1.5rem',
                border: '2px dashed #cbd5e1',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                background: thumbnailPreview ? 'rgba(16,185,129,0.05)' : 'transparent'
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = '#6366f1'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = '#cbd5e1'}
              >
                <ImageIcon size={24} color={thumbnailPreview ? '#10b981' : '#64748b'} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600', color: '#1e293b' }}>
                    {thumbnailFile ? `✅ ${thumbnailFile.name}` : (thumbnailPreview ? '✅ Current thumbnail' : 'Click to upload thumbnail')}
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
                    PNG, JPG (recommended: 400x300px)
                  </div>
                </div>
                {thumbnailPreview && (
                  <img 
                    src={thumbnailPreview} 
                    alt="Preview" 
                    style={{
                      width: '80px',
                      height: '60px',
                      objectFit: 'cover',
                      borderRadius: '8px'
                    }}
                  />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleThumbnailChange}
                  style={{ display: 'none' }}
                />
              </label>
            </div>

            {/* Preview Pages - keeping your existing code */}
            {!isBundle && (pdfFiles.length > 0 || (editMode && editingProduct && editingProduct.pdfFiles && editingProduct.pdfFiles.length > 0)) && (
              <div style={{
                background: 'rgba(139,92,246,0.05)',
                border: '2px solid rgba(139,92,246,0.2)',
                borderRadius: '16px',
                padding: '2rem'
              }}>
                <div style={{
                  marginBottom: '1.5rem'
                }}>
                  <h3 style={{
                    fontSize: '1.2rem',
                    fontWeight: '700',
                    color: '#8b5cf6',
                    marginBottom: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <FileText size={24} />
                    Preview Pages Setup
                  </h3>
                  <p style={{
                    fontSize: '0.9rem',
                    color: '#64748b',
                    margin: 0
                  }}>
                    {editMode && pdfFiles.length === 0 
                      ? `Generate preview from existing PDF: ${editingProduct?.pdfFiles?.[0]?.fileName || 'uploaded PDF'}`
                      : `Generate preview pages from ${pdfFiles[0]?.name || 'uploaded PDF'}`
                    }
                  </p>
                </div>

                {editMode && editingProduct && editingProduct.previewPages && editingProduct.previewPages.length > 0 && (
                  <div style={{
                    marginBottom: '1.5rem',
                    padding: '1rem',
                    background: 'rgba(16,185,129,0.05)',
                    border: '1px solid rgba(16,185,129,0.2)',
                    borderRadius: '12px'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '1rem'
                    }}>
                      <span style={{
                        fontSize: '0.95rem',
                        fontWeight: '600',
                        color: '#10b981'
                      }}>
                        ✅ Current Preview ({editingProduct.previewPages.length} pages)
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingProduct({
                            ...editingProduct,
                            previewPages: []
                          });
                          setPreviewPages([]);
                          window.showToast?.('🗑️ Preview pages cleared. Generate new ones below.', 'info');
                        }}
                        style={{
                          background: 'rgba(239,68,68,0.1)',
                          border: '1px solid rgba(239,68,68,0.3)',
                          color: '#ef4444',
                          padding: '0.4rem 0.75rem',
                          borderRadius: '6px',
                          fontSize: '0.8rem',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        Clear Preview
                      </button>
                    </div>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                      gap: '0.75rem',
                      maxHeight: '200px',
                      overflowY: 'auto'
                    }}>
                      {editingProduct.previewPages.map((page, index) => (
                        <div key={index} style={{
                          border: '2px solid #10b981',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          position: 'relative'
                        }}>
                          <img
                            src={page.imageData}
                            alt={`Page ${page.pageNumber}`}
                            style={{
                              width: '100%',
                              height: 'auto',
                              display: 'block'
                            }}
                          />
                          <div style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            background: 'rgba(16,185,129,0.9)',
                            color: '#fff',
                            padding: '0.25rem',
                            fontSize: '0.7rem',
                            fontWeight: '600',
                            textAlign: 'center'
                          }}>
                            P{page.pageNumber}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1.5rem'
                }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto',
                    gap: '1rem',
                    alignItems: 'center'
                  }}>
                    <div>
                      <label style={{
                        display: 'block',
                        marginBottom: '0.5rem',
                        fontSize: '0.95rem',
                        fontWeight: '600',
                        color: '#1e293b'
                      }}>
                        How many pages to show as preview?
                      </label>
                      <select
                        value={formData.previewPageCount}
                        onChange={(e) => setFormData({...formData, previewPageCount: e.target.value})}
                        style={{
                          width: '100%',
                          padding: '0.75rem',
                          border: '2px solid #e2e8f0',
                          borderRadius: '8px',
                          fontSize: '1rem',
                          outline: 'none'
                        }}
                      >
                        <option value="1">First 1 Page</option>
                        <option value="2">First 2 Pages</option>
                        <option value="3">First 3 Pages</option>
                        <option value="4">First 4 Pages</option>
                        <option value="5">First 5 Pages</option>
                        <option value="10">First 10 Pages</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={async () => {
                        if (pdfFiles.length > 0) {
                          await generatePreviewFromUploadedPDF();
                        } else if (editMode && editingProduct && editingProduct.pdfFiles && editingProduct.pdfFiles.length > 0) {
                          await generatePreviewFromExistingPDF();
                        } else {
                          window.showToast?.('⚠️ No PDF available to generate preview!', 'warning');
                        }
                      }}
                      disabled={generatingPreview}
                      style={{
                        background: generatingPreview 
                          ? 'rgba(139,92,246,0.5)'
                          : 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                        border: 'none',
                        color: 'white',
                        padding: '0.75rem 1.5rem',
                        borderRadius: '8px',
                        cursor: generatingPreview ? 'not-allowed' : 'pointer',
                        fontWeight: '600',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        transition: 'all 0.3s ease',
                        whiteSpace: 'nowrap',
                        minWidth: '180px',
                        alignSelf: 'end'
                      }}
                    >
                      {generatingPreview ? (
                        <>
                          <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Zap size={18} />
                          {editMode && pdfFiles.length === 0 ? 'Generate from Existing' : 'Generate Preview'}
                        </>
                      )}
                    </button>
                  </div>

                  {previewPages.length > 0 && (
                    <div>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '1rem'
                      }}>
                        <label style={{
                          fontSize: '0.95rem',
                          fontWeight: '600',
                          color: '#1e293b'
                        }}>
                          New Preview Pages ({previewPages.length})
                        </label>
                        <span style={{
                          fontSize: '0.85rem',
                          color: '#10b981',
                          fontWeight: '600',
                          background: 'rgba(16,185,129,0.1)',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '20px'
                        }}>
                          ✅ Ready to save
                        </span>
                      </div>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                        gap: '1rem',
                        maxHeight: '400px',
                        overflowY: 'auto',
                        padding: '1rem',
                        background: '#ffffff',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0'
                      }}>
                        {previewPages.map((page, index) => (
                          <div key={index} style={{
                            position: 'relative',
                            border: '2px solid #e2e8f0',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            background: '#fff',
                            transition: 'transform 0.2s ease',
                            cursor: 'pointer'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                          >
                            <img
                              src={page.imageData}
                              alt={`Page ${page.pageNumber}`}
                              style={{
                                width: '100%',
                                height: 'auto',
                                display: 'block'
                              }}
                            />
                            <div style={{
                              position: 'absolute',
                              top: '0.5rem',
                              left: '0.5rem',
                              background: 'rgba(139,92,246,0.9)',
                              color: '#fff',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              fontWeight: '700'
                            }}>
                              Page {page.pageNumber}
                            </div>
                            <button
                              type="button"
                              onClick={() => removePreviewPage(index)}
                              style={{
                                position: 'absolute',
                                top: '0.5rem',
                                right: '0.5rem',
                                background: 'rgba(239,68,68,0.9)',
                                border: 'none',
                                borderRadius: '4px',
                                padding: '0.25rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'transform 0.2s ease'
                              }}
                            >
                              <X size={14} color="#fff" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {previewPages.length === 0 && (!editMode || !editingProduct?.previewPages || editingProduct.previewPages.length === 0) && (
                    <div style={{
                      padding: '1rem',
                      background: 'rgba(99,102,241,0.05)',
                      border: '1px solid rgba(99,102,241,0.2)',
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                      color: '#6366f1'
                    }}>
                      💡 <strong>Tip:</strong> {editMode 
                        ? 'Click "Generate from Existing" to create preview pages from the current PDF files, or upload new PDFs above.'
                        : 'Preview pages will be automatically extracted from the first uploaded PDF. Customers will see these pages before purchasing to check quality.'
                      }
                    </div>
                  )}
                </div>
              </div>
            )}

            <button 
              type="submit" 
              disabled={uploading}
              style={{
                width: '100%',
                background: uploading 
                  ? 'linear-gradient(135deg, #94a3b8, #cbd5e1)' 
                  : editMode 
                    ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                    : 'linear-gradient(135deg, #10b981, #059669)',
                border: 'none',
                color: 'white',
                padding: '1.25rem',
                fontSize: '1.25rem',
                borderRadius: '14px',
                cursor: uploading ? 'not-allowed' : 'pointer',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.75rem',
                boxShadow: editMode ? '0 8px 25px rgba(245,158,11,0.3)' : '0 8px 25px rgba(16,185,129,0.3)',
                transition: 'all 0.3s ease',
                opacity: uploading ? 0.7 : 1
              }}
            >
              {uploading ? (
                <>
                  <Loader size={24} style={{ animation: 'spin 1s linear infinite' }} />
                  {editMode ? 'Updating...' : (isBundle ? 'Creating Bundle...' : `Uploading ${pdfFiles.length} PDF(s)...`)}
                </>
              ) : (
                <>
                  {editMode ? <Save size={24} /> : <Upload size={24} />}
                  {editMode ? 'Save Changes' : (isBundle ? 'Create Bundle' : 'Upload Product')}
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Products List with Search */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
          gap: '1rem',
          flexWrap: 'wrap'
        }}>
          <h2 style={{
            fontSize: '2rem',
            fontWeight: '900',
            color: '#1e293b',
            margin: 0
          }}>
            All Products ({filteredProducts.length})
          </h2>
          
          {/* Search Bar */}
          <div style={{
            position: 'relative',
            flex: '1',
            maxWidth: '400px',
            minWidth: '250px'
          }}>
            <Search size={20} color="#64748b" style={{
              position: 'absolute',
              left: '1rem',
              top: '50%',
              transform: 'translateY(-50%)'
            }} />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 1rem 0.75rem 3rem',
                border: '2px solid #e2e8f0',
                borderRadius: '12px',
                fontSize: '1rem',
                outline: 'none',
                transition: 'border-color 0.3s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#6366f1'}
              onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
            />
          </div>
        </div>

        <div style={{
          display: 'grid',
          gap: '1.5rem'
        }}>
          {filteredProducts.map((product, index) => (
            <div 
              key={product.id} 
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '20px',
                padding: '2rem',
                display: 'flex',
                alignItems: 'center',
                gap: '2rem',
                flexWrap: 'wrap',
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                animation: `fadeInUp 0.4s ease ${index * 0.05}s backwards`
              }}
            >
              {/* Thumbnail */}
              <div style={{
                background: product.thumbnail 
                  ? `url(${product.thumbnail})` 
                  : 'linear-gradient(135deg, #6366f1, #ec4899)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                width: '100px',
                height: '100px',
                borderRadius: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                fontSize: product.thumbnail ? '0' : '3rem'
              }}>
                {!product.thumbnail && (product.image || '📚')}
              </div>

              <div style={{ flex: 1, minWidth: '250px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  marginBottom: '0.5rem',
                  flexWrap: 'wrap'
                }}>
                  <h3 style={{
                    fontSize: '1.5rem',
                    fontWeight: '800',
                    color: '#1e293b'
                  }}>
                    {product.title}
                  </h3>
                  {product.isBundle && (
                    <span style={{
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      color: '#fff',
                      padding: '0.3rem 0.75rem',
                      borderRadius: '20px',
                      fontSize: '0.75rem',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem'
                    }}>
                      <Package size={14} /> BUNDLE
                    </span>
                  )}
                  {product.discountPercent && (
                    <span style={{
                      background: 'rgba(239,68,68,0.1)',
                      color: '#ef4444',
                      padding: '0.3rem 0.75rem',
                      borderRadius: '20px',
                      fontSize: '0.75rem',
                      fontWeight: '700'
                    }}>
                      {product.discountPercent}% OFF
                    </span>
                  )}
                  {product.pdfFiles && product.pdfFiles.length > 0 ? (
                    <span style={{
                      background: 'rgba(16,185,129,0.1)',
                      color: '#10b981',
                      padding: '0.2rem 0.6rem',
                      borderRadius: '20px',
                      fontSize: '0.75rem',
                      fontWeight: '600'
                    }}>
                      ✅ {product.pdfFiles.length} PDF{product.pdfFiles.length > 1 ? 's' : ''}
                    </span>
                  ) : product.isBundle ? (
                    <span style={{
                      background: 'rgba(99,102,241,0.1)',
                      color: '#6366f1',
                      padding: '0.2rem 0.6rem',
                      borderRadius: '20px',
                      fontSize: '0.75rem',
                      fontWeight: '600'
                    }}>
                      📦 {product.bundledProducts?.length || 0} Items
                    </span>
                  ) : (
                    <span style={{
                      background: 'rgba(239,68,68,0.1)',
                      color: '#ef4444',
                      padding: '0.2rem 0.6rem',
                      borderRadius: '20px',
                      fontSize: '0.75rem',
                      fontWeight: '600'
                    }}>
                      ❌ No PDF
                    </span>
                  )}
                  {currentUser && product.userId === currentUser.uid && (
                    <span style={{
                      background: 'rgba(99,102,241,0.1)',
                      color: '#6366f1',
                      padding: '0.2rem 0.6rem',
                      borderRadius: '20px',
                      fontSize: '0.75rem',
                      fontWeight: '600'
                    }}>
                      👤 Your Product
                    </span>
                  )}
                </div>
                <p style={{
                  color: '#64748b',
                  marginBottom: '0.5rem',
                  fontSize: '1rem'
                }}>
                  {product.description}
                </p>
                <div style={{
                  display: 'flex',
                  gap: '1rem',
                  flexWrap: 'wrap',
                  fontSize: '0.9rem',
                  color: '#64748b'
                }}>
                  <span>Category: {product.customCategory || product.category}</span>
                  <span>•</span>
                  <span>{product.pages} pages</span>
                  <span>•</span>
                  <span>{product.fileSize}</span>
                  <span>•</span>
                  <span>📥 {product.totalDownloads || 0} downloads</span>
                  <span>•</span>
                  <span>💰 ₹{product.totalRevenue || 0} revenue</span>
                </div>
                {product.isBundle && product.bundleInfo && (
                  <div style={{
                    marginTop: '0.75rem',
                    padding: '0.75rem',
                    background: 'rgba(16,185,129,0.05)',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    color: '#10b981',
                    fontWeight: '600'
                  }}>
                    Save ₹{product.bundleInfo.savings} • {product.bundleInfo.discount}% OFF
                  </div>
                )}
              </div>

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                flexDirection: 'column'
              }}>
                <div style={{
                  textAlign: 'center'
                }}>
                  {product.originalPrice && (
                    <div style={{
                      fontSize: '1rem',
                      color: '#94a3b8',
                      textDecoration: 'line-through',
                      marginBottom: '0.25rem'
                    }}>
                      ₹{product.originalPrice}
                    </div>
                  )}
                  <div style={{
                    fontSize: '2.5rem',
                    fontWeight: '900',
                    background: 'linear-gradient(135deg, #6366f1, #ec4899)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}>
                    ₹{product.price}
                  </div>
                </div>
                
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {currentUser && product.userId === currentUser.uid && (
                    <button 
                      onClick={() => startEditProduct(product)}
                      style={{
                        background: 'rgba(245,158,11,0.1)',
                        border: '2px solid rgba(245,158,11,0.2)',
                        padding: '0.75rem',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(245,158,11,0.2)';
                        e.currentTarget.style.transform = 'scale(1.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(245,158,11,0.1)';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                    >
                      <Edit size={24} color="#f59e0b" />
                    </button>
                  )}
                  
                  <button 
                    onClick={() => setConfirmDelete(product.id)}
                    style={{
                      background: 'rgba(239,68,68,0.1)',
                      border: '2px solid rgba(239,68,68,0.2)',
                      padding: '0.75rem',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(239,68,68,0.2)';
                      e.currentTarget.style.transform = 'scale(1.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(239,68,68,0.1)';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    <Trash2 size={24} color="#ef4444" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Confirm Delete Modal */}
      <ConfirmModal
        show={confirmDelete !== null}
        onConfirm={() => {
          deleteProduct(confirmDelete);
          setConfirmDelete(null);
          window.showToast?.('✅ Product deleted successfully!', 'success');
        }}
        onCancel={() => setConfirmDelete(null)}
        title="Delete Product?"
        message="Are you sure you want to delete this product? This will permanently remove it from your store and cannot be undone."
        confirmText="Yes, Delete"
        cancelText="Cancel"
        type="danger"
      />

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default AdminPanel;