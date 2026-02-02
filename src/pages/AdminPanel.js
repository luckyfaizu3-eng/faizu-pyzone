import React, { useState } from 'react';
import { Upload, Trash2, X, Plus, Package, BarChart, FileText, Image as ImageIcon, Loader } from 'lucide-react';
import { uploadPDF, uploadImage } from '../supabaseUpload';
import ConfirmModal from '../components/ConfirmModal';

function AdminPanel({ products, addProduct, deleteProduct, orders }) {
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pdfFile, setPdfFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);
  const [isBundle, setIsBundle] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
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
    itemsIncluded: ''
  });

  const handlePdfChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
    } else {
      window.showToast?.('Please select a valid PDF file!', 'error');
    }
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

  const calculateBundlePrice = () => {
    if (formData.individualPrice && formData.discount) {
      const individual = parseFloat(formData.individualPrice);
      const discount = parseFloat(formData.discount);
      return Math.round(individual - (individual * discount / 100));
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!pdfFile && !isBundle) {
      window.showToast?.('⚠️ Please upload PDF file!', 'error');
      return;
    }

    if (!formData.category && !formData.customCategory) {
      window.showToast?.('⚠️ Please select a category!', 'error');
      return;
    }

    setUploading(true);
    window.showToast?.('⏳ Uploading... Please wait!', 'info');

    try {
      let pdfUrl = '';
      let pdfFileName = '';
      let thumbnailUrl = '';

      // ✅ Upload PDF to Supabase
      if (pdfFile && !isBundle) {
        console.log('📤 Uploading PDF to Supabase...');
        const pdfResult = await uploadPDF(pdfFile);
        if (pdfResult.success) {
          pdfUrl = pdfResult.url;
          pdfFileName = pdfResult.fileName;
          console.log('✅ PDF URL:', pdfUrl);
        } else {
          window.showToast?.('❌ PDF upload failed: ' + pdfResult.error, 'error');
          setUploading(false);
          return;
        }
      }

      // ✅ Upload Thumbnail to Supabase
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

      // Create product data
      const productData = {
        title: formData.title,
        category: formData.category === 'custom' ? formData.customCategory : formData.category,
        price: isBundle ? calculateBundlePrice() : parseInt(formData.price),
        description: formData.description,
        pages: parseInt(formData.pages),
        rating: parseFloat(formData.rating),
        fileSize: formData.fileSize,
        language: formData.language,
        image: formData.image,
        pdfUrl: pdfUrl,
        pdfFileName: pdfFileName || null,
        thumbnail: thumbnailUrl || null,
        isBundle: isBundle
      };

      // Add bundle-specific fields
      if (isBundle) {
        productData.bundleInfo = {
          individualPrice: parseFloat(formData.individualPrice),
          discount: parseFloat(formData.discount),
          savings: parseFloat(formData.individualPrice) - calculateBundlePrice(),
          itemsIncluded: formData.itemsIncluded
        };
      }

      if (formData.category === 'custom' && formData.customCategory) {
        productData.customCategory = formData.customCategory;
      }

      console.log('📝 Product data to save:', productData);
      await addProduct(productData);
      
      // Reset form
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
        itemsIncluded: ''
      });
      setPdfFile(null);
      setThumbnailFile(null);
      setThumbnailPreview(null);
      setShowUploadForm(false);
      setIsBundle(false);
      
      window.showToast?.('✅ Product uploaded successfully!', 'success');
      
    } catch (error) {
      console.error('❌ Upload error:', error);
      window.showToast?.('❌ Upload failed: ' + error.message, 'error');
    } finally {
      setUploading(false);
    }
  };

  const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);

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
          { icon: BarChart, label: 'Revenue', value: `₹${totalRevenue}`, color: '#ec4899' }
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
          onClick={() => setShowUploadForm(!showUploadForm)} 
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
          {showUploadForm ? 'Cancel' : 'Upload New Product'}
        </button>
      </div>

      {/* Upload Form - Same as before, keeping it as is */}
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
          {/* Upload form content - same as before - keeping complete form */}
          <h2 style={{
            fontSize: '2rem',
            fontWeight: '900',
            marginBottom: '2rem',
            color: '#1e293b'
          }}>
            Upload Product
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
                  Offer multiple items at discounted price
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

          <form onSubmit={handleSubmit} style={{
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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
                <option value="custom">Custom Category</option>
              </select>

              {formData.category === 'custom' && (
                <input
                  type="text"
                  placeholder="Enter category name"
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

            {/* Bundle Pricing or Regular Price */}
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
                  gap: '0.5rem'
                }}>
                  <Package size={20} /> Bundle Pricing
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <input
                    type="number"
                    placeholder="Individual Price ₹"
                    value={formData.individualPrice}
                    onChange={(e) => setFormData({...formData, individualPrice: e.target.value})}
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
                    placeholder="Discount %"
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
                </div>
                {formData.individualPrice && formData.discount && (
                  <div style={{
                    marginTop: '1rem',
                    padding: '1rem',
                    background: '#ffffff',
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '1.1rem',
                    fontWeight: '700'
                  }}>
                    <span style={{ color: '#64748b' }}>Bundle Price:</span>
                    <span style={{ color: '#10b981' }}>
                      ₹{calculateBundlePrice()} 
                      <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>
                        {' '}(Save ₹{formData.individualPrice - calculateBundlePrice()})
                      </span>
                    </span>
                  </div>
                )}
                <textarea
                  placeholder="What's included in bundle? (e.g., All 20 chapters, Practice questions, Lifetime access)"
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

            {/* PDF Upload (only for non-bundle) */}
            {!isBundle && (
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.75rem',
                  fontSize: '1.05rem',
                  fontWeight: '700',
                  color: '#1e293b'
                }}>
                  Upload PDF *
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
                  background: pdfFile ? 'rgba(16,185,129,0.05)' : 'transparent'
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = '#6366f1'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = '#cbd5e1'}
                >
                  <Upload size={24} color={pdfFile ? '#10b981' : '#64748b'} />
                  <div>
                    <div style={{ fontWeight: '600', color: '#1e293b' }}>
                      {pdfFile ? `✅ ${pdfFile.name}` : 'Click to upload PDF'}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#64748b' }}>
                      {pdfFile ? `Size: ${(pdfFile.size / 1024 / 1024).toFixed(2)} MB` : 'PDF files only'}
                    </div>
                  </div>
                  <input
                    type="file"
                    accept=".pdf"
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
                Upload Thumbnail (Optional)
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
                background: thumbnailFile ? 'rgba(16,185,129,0.05)' : 'transparent'
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = '#6366f1'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = '#cbd5e1'}
              >
                <ImageIcon size={24} color={thumbnailFile ? '#10b981' : '#64748b'} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600', color: '#1e293b' }}>
                    {thumbnailFile ? `✅ ${thumbnailFile.name}` : 'Click to upload thumbnail'}
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

            <button 
              type="submit" 
              disabled={uploading}
              style={{
                width: '100%',
                background: uploading 
                  ? 'linear-gradient(135deg, #94a3b8, #cbd5e1)' 
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
                boxShadow: '0 8px 25px rgba(16,185,129,0.3)',
                transition: 'all 0.3s ease',
                opacity: uploading ? 0.7 : 1
              }}
            >
              {uploading ? (
                <>
                  <Loader size={24} style={{ animation: 'spin 1s linear infinite' }} />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload size={24} />
                  {isBundle ? 'Create Bundle' : 'Upload Product'}
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Products List */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        <h2 style={{
          fontSize: '2rem',
          fontWeight: '900',
          marginBottom: '2rem',
          color: '#1e293b'
        }}>
          All Products ({products.length})
        </h2>

        <div style={{
          display: 'grid',
          gap: '1.5rem'
        }}>
          {products.map((product, index) => (
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
                  marginBottom: '0.5rem'
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
                  {/* ✅ PDF status indicator */}
                  {product.pdfUrl ? (
                    <span style={{
                      background: 'rgba(16,185,129,0.1)',
                      color: '#10b981',
                      padding: '0.2rem 0.6rem',
                      borderRadius: '20px',
                      fontSize: '0.75rem',
                      fontWeight: '600'
                    }}>
                      ✅ PDF Ready
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
                  <span>Category: {product.category}</span>
                  <span>•</span>
                  <span>{product.pages} pages</span>
                  <span>•</span>
                  <span>{product.fileSize}</span>
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
                gap: '2rem'
              }}>
                <div style={{
                  fontSize: '2.5rem',
                  fontWeight: '900',
                  background: 'linear-gradient(135deg, #6366f1, #ec4899)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  ₹{product.price}
                </div>
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
          ))}
        </div>
      </div>

      {/* Confirm Delete Modal */}
      <ConfirmModal
        show={confirmDelete !== null}
        onConfirm={() => {
          deleteProduct(confirmDelete);
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