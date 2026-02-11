import React, { useEffect, useState } from 'react';
import { Download, CheckCircle, Trash2, FileText, X, Receipt, Package } from 'lucide-react';
import { useAuth } from '../App';
import { db } from '../firebase';
import { deleteDoc, doc, updateDoc, increment } from 'firebase/firestore';
import ConfirmModal from '../components/ConfirmModal';

function OrdersPage({ orders: initialOrders, refreshOrders }) {
  const { user } = useAuth();
  const [orders, setOrders] = useState(initialOrders || []);
  const [showReceipt, setShowReceipt] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [downloading, setDownloading] = useState({});

  useEffect(() => {
    console.log('===========================================');
    console.log('🔍 ORDERS PAGE FULL DEBUG');
    console.log('===========================================');
    console.log('User:', user?.email);
    console.log('Total Orders:', orders?.length || 0);
    console.log('Raw Orders Data:', JSON.stringify(orders, null, 2));
    
    // 🔍 Debug each order's items in detail
    if (orders && orders.length > 0) {
      orders.forEach((order, orderIdx) => {
        console.log(`\n📦 ORDER ${orderIdx + 1}:`, order.id);
        console.log('  Order Date:', order.date);
        console.log('  Order Total:', order.total);
        console.log('  Items Count:', order.items?.length || 0);
        
        if (order.items && order.items.length > 0) {
          order.items.forEach((item, itemIdx) => {
            console.log(`\n  📄 ITEM ${itemIdx + 1}:`);
            console.log('    Title:', item.title);
            console.log('    ID:', item.id);
            console.log('    Price:', item.price);
            console.log('    isBundle:', item.isBundle);
            console.log('    Has pdfFiles key?', 'pdfFiles' in item);
            console.log('    pdfFiles value:', item.pdfFiles);
            console.log('    pdfFiles type:', typeof item.pdfFiles);
            console.log('    pdfFiles is Array?', Array.isArray(item.pdfFiles));
            console.log('    pdfFiles length:', item.pdfFiles?.length);
            console.log('    Has bundledProducts key?', 'bundledProducts' in item);
            console.log('    bundledProducts value:', item.bundledProducts);
            console.log('    bundledProducts type:', typeof item.bundledProducts);
            console.log('    bundledProducts is Array?', Array.isArray(item.bundledProducts));
            console.log('    bundledProducts length:', item.bundledProducts?.length);
            
            // Check download button visibility
            const hasPDFs = item.pdfFiles && Array.isArray(item.pdfFiles) && item.pdfFiles.length > 0;
            const hasBundle = item.isBundle && item.bundledProducts && Array.isArray(item.bundledProducts) && item.bundledProducts.length > 0;
            console.log('    ⭐ WILL SHOW DOWNLOAD BUTTON?', hasPDFs || hasBundle);
            console.log('    - Has PDFs:', hasPDFs);
            console.log('    - Has Bundle:', hasBundle);
          });
        } else {
          console.log('  ⚠️ No items in this order!');
        }
      });
    } else {
      console.log('\n⚠️ NO ORDERS FOUND!');
    }
    console.log('===========================================\n');
  }, [orders, user]);

  useEffect(() => {
    if (initialOrders) {
      console.log('📥 Orders updated from parent:', initialOrders.length);
      setOrders(initialOrders);
    }
  }, [initialOrders]);

  // ✅ Update product stats when PDF is downloaded
  const updateProductStats = async (productId, price) => {
    try {
      const productRef = doc(db, 'products', productId);
      await updateDoc(productRef, {
        totalDownloads: increment(1),
        totalRevenue: increment(price)
      });
      console.log('✅ Product stats updated:', productId);
    } catch (error) {
      console.error('❌ Failed to update product stats:', error);
    }
  };

  // ✅ Handle Bundle Download - Downloads all PDFs from all bundled products
  const handleDownloadBundle = async (item) => {
    console.log('📦 Starting bundle download:', item.title);
    console.log('Bundled products:', item.bundledProducts);
    
    if (!item.bundledProducts || item.bundledProducts.length === 0) {
      window.showToast?.('❌ No products in bundle', 'error');
      return;
    }

    // Count total PDFs
    let totalPdfs = 0;
    item.bundledProducts.forEach(product => {
      if (product.pdfFiles && product.pdfFiles.length > 0) {
        totalPdfs += product.pdfFiles.length;
      }
    });

    if (totalPdfs === 0) {
      window.showToast?.('❌ No PDFs available in bundle', 'error');
      return;
    }

    setDownloading(prev => ({ ...prev, [item.id]: true }));
    window.showToast?.(`📦 Downloading ${totalPdfs} PDF(s) from ${item.bundledProducts.length} products...`, 'info');

    try {
      // Update stats once for the bundle
      await updateProductStats(item.id, item.price);

      let downloadedCount = 0;

      // Download PDFs from each bundled product
      for (let productIndex = 0; productIndex < item.bundledProducts.length; productIndex++) {
        const product = item.bundledProducts[productIndex];
        
        if (!product.pdfFiles || product.pdfFiles.length === 0) {
          console.log(`⏭️ Skipping ${product.title} - no PDFs`);
          continue;
        }

        console.log(`📥 Downloading PDFs from: ${product.title}`);

        for (let pdfIndex = 0; pdfIndex < product.pdfFiles.length; pdfIndex++) {
          const pdf = product.pdfFiles[pdfIndex];
          console.log(`Downloading: ${pdf.fileName}`);
          
          const response = await fetch(pdf.url);
          const blob = await response.blob();
          const blobUrl = window.URL.createObjectURL(blob);
          
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = `${product.title}_${pdf.fileName}`;
          
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(blobUrl);
          
          downloadedCount++;
          
          // Small delay between downloads
          if (downloadedCount < totalPdfs) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
      }
      
      console.log(`✅ All ${downloadedCount} PDFs downloaded from bundle`);
      window.showToast?.(`✅ Downloaded ${downloadedCount} PDF(s) from bundle!`, 'success');
      
    } catch (error) {
      console.error('❌ Bundle download error:', error);
      window.showToast?.('❌ Download failed: ' + error.message, 'error');
    } finally {
      setDownloading(prev => ({ ...prev, [item.id]: false }));
    }
  };

  // ✅ Handle multi-PDF download (for single products)
  const handleDownloadAll = async (item) => {
    console.log('📥 Starting download for:', item.title);
    console.log('PDFs:', item.pdfFiles);
    
    if (!item.pdfFiles || item.pdfFiles.length === 0) {
      window.showToast?.('❌ No PDFs available', 'error');
      return;
    }

    setDownloading(prev => ({ ...prev, [item.id]: true }));
    window.showToast?.(`📥 Downloading ${item.pdfFiles.length} PDF(s)...`, 'info');

    try {
      // ✅ Update stats once for the product
      await updateProductStats(item.id, item.price);

      // Download all PDFs
      for (let i = 0; i < item.pdfFiles.length; i++) {
        const pdf = item.pdfFiles[i];
        console.log(`Downloading PDF ${i + 1}/${item.pdfFiles.length}:`, pdf.fileName);
        
        const response = await fetch(pdf.url);
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = pdf.fileName;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
        
        // Small delay between downloads
        if (i < item.pdfFiles.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      
      console.log('✅ All downloads complete');
      window.showToast?.(`✅ Downloaded ${item.pdfFiles.length} PDF(s)!`, 'success');
      
    } catch (error) {
      console.error('❌ Download error:', error);
      window.showToast?.('❌ Download failed: ' + error.message, 'error');
    } finally {
      setDownloading(prev => ({ ...prev, [item.id]: false }));
    }
  };

  // ✅ Handle single PDF download
  const handleDownloadSingle = async (item, pdfIndex) => {
    console.log('📥 Downloading single PDF:', item.pdfFiles[pdfIndex].fileName);
    
    setDownloading(prev => ({ ...prev, [`${item.id}-${pdfIndex}`]: true }));
    
    try {
      const pdf = item.pdfFiles[pdfIndex];
      const response = await fetch(pdf.url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = pdf.fileName;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      
      window.showToast?.('✅ Download complete!', 'success');
      
    } catch (error) {
      console.error('❌ Download error:', error);
      window.showToast?.('❌ Download failed: ' + error.message, 'error');
    } finally {
      setDownloading(prev => ({ ...prev, [`${item.id}-${pdfIndex}`]: false }));
    }
  };

  const handleDeleteOrder = async (orderId) => {
    try {
      window.showToast?.('🗑️ Deleting order...', 'info');
      
      await deleteDoc(doc(db, 'orders', orderId));
      
      window.showToast?.('✅ Order deleted successfully!', 'success');
      
      if (refreshOrders) {
        console.log('🔄 Refreshing orders after delete...');
        await refreshOrders();
      } else {
        setOrders(orders.filter(order => order.id !== orderId));
      }
      
      setConfirmDelete(null);
      
    } catch (error) {
      console.error('❌ Delete error:', error);
      window.showToast?.('❌ Failed to delete order. Please try again.', 'error');
    }
  };

  if (!orders || orders.length === 0) {
    return (
      <div style={{
        paddingTop: '100px',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '100px 1.5rem 2rem'
      }}>
        <div style={{
          textAlign: 'center',
          animation: 'fadeInUp 0.6s ease'
        }}>
          <div style={{
            fontSize: '5rem',
            marginBottom: '1.5rem',
            opacity: 0.3
          }}>📦</div>
          <h2 style={{
            fontSize: '2rem',
            fontWeight: '900',
            marginBottom: '1rem',
            color: '#1e293b'
          }}>
            No orders yet
          </h2>
          <p style={{
            color: '#64748b',
            fontSize: '1.1rem'
          }}>
            Start shopping to see your orders here!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      paddingTop: '100px',
      paddingBottom: '3rem',
      minHeight: '100vh',
      padding: '100px 1.5rem 3rem'
    }}>
      <div style={{
        maxWidth: '900px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <h1 style={{
          fontSize: 'clamp(2rem, 6vw, 3rem)',
          fontWeight: '900',
          textAlign: 'center',
          marginBottom: '2rem',
          background: 'linear-gradient(135deg, #6366f1, #ec4899)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          animation: 'fadeInUp 0.6s ease'
        }}>
          My Orders ({orders.length})
        </h1>
        
        {/* 🔍 DEBUG PANEL - Remove this after fixing */}
        <div style={{
          background: '#fff3cd',
          border: '2px solid #ffc107',
          borderRadius: '12px',
          padding: '1rem',
          marginBottom: '1.5rem',
          fontSize: '0.85rem'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '0.5rem', color: '#856404' }}>
            🔍 DEBUG INFO - Check Console for Full Details
          </div>
          <div style={{ color: '#856404' }}>
            • Open browser console (F12)<br/>
            • Look for detailed order item logs<br/>
            • Check if pdfFiles/bundledProducts exist
          </div>
        </div>
        
        {/* Orders List */}
        {orders.map((order, index) => (
          <div 
            key={order.id} 
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '20px',
              padding: '1.5rem',
              marginBottom: '1.5rem',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
              animation: `fadeInUp 0.6s ease ${index * 0.1}s backwards`
            }}
          >
            {/* Order Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '1.5rem',
              gap: '0.75rem'
            }}>
              <div style={{ flex: 1 }}>
                <h3 style={{
                  fontSize: '1.1rem',
                  fontWeight: '800',
                  color: '#1e293b',
                  marginBottom: '0.25rem'
                }}>
                  Order #{order.id?.substring(0, 8)}
                </h3>
                <p style={{
                  color: '#64748b',
                  fontSize: '0.85rem'
                }}>
                  {order.date}
                </p>
              </div>
              
              {/* Action Buttons */}
              <div style={{ 
                display: 'flex', 
                gap: '0.5rem',
                flexShrink: 0
              }}>
                <button
                  onClick={() => setShowReceipt(order)}
                  style={{
                    background: 'rgba(99,102,241,0.1)',
                    border: '1px solid rgba(99,102,241,0.3)',
                    padding: '0.6rem',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Receipt size={18} color="#6366f1" />
                </button>

                <button
                  onClick={() => setConfirmDelete(order.id)}
                  style={{
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.2)',
                    padding: '0.6rem',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Trash2 size={18} color="#ef4444" />
                </button>
              </div>
            </div>

            {/* Status Badge */}
            <div style={{
              background: 'linear-gradient(135deg, #10b981, #059669)',
              padding: '0.6rem 1rem',
              borderRadius: '30px',
              fontSize: '0.85rem',
              fontWeight: '700',
              color: '#fff',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1.5rem'
            }}>
              <CheckCircle size={16} />
              {order.status}
            </div>
            
            {/* Order Items */}
            <div style={{
              borderTop: '1px solid #e2e8f0',
              paddingTop: '1.5rem'
            }}>
              {/* Total */}
              <div style={{
                marginBottom: '1.5rem',
                textAlign: 'center'
              }}>
                <div style={{
                  fontSize: '0.85rem',
                  color: '#64748b',
                  marginBottom: '0.25rem',
                  fontWeight: '600'
                }}>
                  Total Amount
                </div>
                <div style={{
                  fontSize: '2rem',
                  fontWeight: '900',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  ₹{order.total}
                </div>
              </div>

              {/* Items */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}>
                {order.items?.map((item, itemIdx) => {
                  // 🔍 Check if download button should be shown
                  const hasPDFs = item.pdfFiles && Array.isArray(item.pdfFiles) && item.pdfFiles.length > 0;
                  const hasBundle = item.isBundle && item.bundledProducts && Array.isArray(item.bundledProducts) && item.bundledProducts.length > 0;
                  const showDownload = hasPDFs || hasBundle;
                  
                  console.log(`🎯 Rendering item ${itemIdx + 1}:`, {
                    title: item.title,
                    hasPDFs,
                    pdfCount: item.pdfFiles?.length,
                    hasBundle,
                    bundleCount: item.bundledProducts?.length,
                    showDownload
                  });
                  
                  return (
                    <div key={item.id || itemIdx} style={{
                      background: 'rgba(99,102,241,0.03)',
                      border: '1px solid #e2e8f0',
                      borderRadius: '16px',
                      padding: '1.25rem',
                    }}>
                      {/* Item Header */}
                      <div style={{
                        marginBottom: '1rem'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          marginBottom: '0.5rem'
                        }}>
                          <h4 style={{
                            fontSize: '1.05rem',
                            fontWeight: '700',
                            color: '#1e293b',
                            lineHeight: 1.3,
                            flex: 1
                          }}>
                            {item.isBundle ? '📦' : '📄'} {item.title}
                          </h4>
                          {item.isBundle && (
                            <span style={{
                              background: 'rgba(139,92,246,0.1)',
                              color: '#8b5cf6',
                              padding: '0.25rem 0.6rem',
                              borderRadius: '12px',
                              fontSize: '0.75rem',
                              fontWeight: '700'
                            }}>
                              BUNDLE
                            </span>
                          )}
                        </div>
                        
                        {/* Bundle or Single Product Info */}
                        {item.isBundle ? (
                          <div style={{
                            fontSize: '0.85rem',
                            color: '#64748b',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                          }}>
                            <Package size={14} />
                            {item.bundledProducts?.length || 0} products included
                          </div>
                        ) : (
                          item.pdfFiles && (
                            <div style={{
                              fontSize: '0.85rem',
                              color: '#64748b',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem'
                            }}>
                              <FileText size={14} />
                              {item.pdfFiles.length} PDF file{item.pdfFiles.length > 1 ? 's' : ''}
                            </div>
                          )
                        )}
                      </div>
                      
                      {/* 🔍 DEBUG INFO FOR THIS ITEM */}
                      <div style={{
                        background: showDownload ? '#d4edda' : '#f8d7da',
                        border: showDownload ? '1px solid #c3e6cb' : '1px solid #f5c6cb',
                        borderRadius: '8px',
                        padding: '0.75rem',
                        marginBottom: '1rem',
                        fontSize: '0.8rem',
                        color: showDownload ? '#155724' : '#721c24'
                      }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>
                          {showDownload ? '✅ Download Button: VISIBLE' : '❌ Download Button: HIDDEN'}
                        </div>
                        <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                          Has PDFs: {hasPDFs ? 'Yes' : 'No'} ({item.pdfFiles?.length || 0} files)<br/>
                          Has Bundle: {hasBundle ? 'Yes' : 'No'} ({item.bundledProducts?.length || 0} products)
                        </div>
                      </div>
                        
                      {/* Download All Button - WITH BETTER VISIBILITY CHECK */}
                      {showDownload ? (
                        <button
                          onClick={() => item.isBundle ? handleDownloadBundle(item) : handleDownloadAll(item)}
                          disabled={downloading[item.id]}
                          style={{
                            width: '100%',
                            background: downloading[item.id] 
                              ? 'rgba(99,102,241,0.2)' 
                              : item.isBundle
                                ? 'linear-gradient(135deg, #8b5cf6, #7c3aed)'
                                : 'linear-gradient(135deg, #10b981, #059669)',
                            border: 'none',
                            color: 'white',
                            padding: '1rem',
                            borderRadius: '14px',
                            cursor: downloading[item.id] ? 'not-allowed' : 'pointer',
                            fontWeight: '700',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            transition: 'all 0.3s ease',
                            fontSize: '0.95rem',
                            opacity: downloading[item.id] ? 0.7 : 1,
                            marginBottom: item.isBundle ? '0' : '1rem',
                            boxShadow: downloading[item.id] ? 'none' : item.isBundle ? '0 4px 12px rgba(139,92,246,0.3)' : '0 4px 12px rgba(16,185,129,0.3)'
                          }}
                        >
                          <Download size={18} /> 
                          {downloading[item.id] ? 'Downloading...' : 
                            item.isBundle ? `Download All Bundle Files` : `Download All (${item.pdfFiles?.length || 0})`
                          }
                        </button>
                      ) : (
                        <div style={{
                          background: '#fff3cd',
                          border: '1px solid #ffc107',
                          borderRadius: '12px',
                          padding: '1rem',
                          textAlign: 'center',
                          color: '#856404',
                          fontSize: '0.9rem'
                        }}>
                          ⚠️ No downloadable files found in this order item
                        </div>
                      )}

                      {/* Individual PDF List (only for non-bundle products) */}
                      {!item.isBundle && hasPDFs && (
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '0.75rem'
                        }}>
                          {item.pdfFiles.map((pdf, pdfIndex) => (
                            <div key={pdfIndex} style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              padding: '0.9rem',
                              background: '#ffffff',
                              border: '1px solid #e2e8f0',
                              borderRadius: '12px',
                              gap: '0.75rem'
                            }}>
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.75rem',
                                flex: 1,
                                minWidth: 0
                              }}>
                                <FileText size={18} color="#6366f1" style={{ flexShrink: 0 }} />
                                <div style={{
                                  flex: 1,
                                  minWidth: 0
                                }}>
                                  <div style={{
                                    fontWeight: '600',
                                    color: '#1e293b',
                                    fontSize: '0.9rem',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                  }}>
                                    {pdf.fileName}
                                  </div>
                                  {pdf.size && (
                                    <div style={{
                                      fontSize: '0.75rem',
                                      color: '#64748b'
                                    }}>
                                      {pdf.size}
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              <button
                                onClick={() => handleDownloadSingle(item, pdfIndex)}
                                disabled={downloading[`${item.id}-${pdfIndex}`]}
                                style={{
                                  background: downloading[`${item.id}-${pdfIndex}`]
                                    ? 'rgba(99,102,241,0.2)'
                                    : 'rgba(99,102,241,0.1)',
                                  border: '1px solid rgba(99,102,241,0.3)',
                                  color: '#6366f1',
                                  padding: '0.6rem 0.9rem',
                                  borderRadius: '10px',
                                  cursor: downloading[`${item.id}-${pdfIndex}`] ? 'not-allowed' : 'pointer',
                                  fontWeight: '600',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.4rem',
                                  fontSize: '0.8rem',
                                  transition: 'all 0.3s ease',
                                  flexShrink: 0
                                }}
                              >
                                <Download size={14} />
                                {downloading[`${item.id}-${pdfIndex}`] ? '...' : 'Get'}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {/* Bundle Products List */}
                      {item.isBundle && hasBundle && (
                        <div style={{
                          marginTop: '1rem',
                          padding: '1rem',
                          background: 'rgba(139,92,246,0.05)',
                          borderRadius: '12px',
                          border: '1px solid rgba(139,92,246,0.2)'
                        }}>
                          <div style={{
                            fontSize: '0.9rem',
                            fontWeight: '700',
                            color: '#8b5cf6',
                            marginBottom: '0.75rem'
                          }}>
                            📦 Included Products:
                          </div>
                          {item.bundledProducts.map((bundledProduct, idx) => (
                            <div key={idx} style={{
                              padding: '0.75rem',
                              background: '#ffffff',
                              borderRadius: '8px',
                              marginBottom: idx < item.bundledProducts.length - 1 ? '0.5rem' : '0',
                              border: '1px solid #e2e8f0'
                            }}>
                              <div style={{
                                fontWeight: '600',
                                color: '#1e293b',
                                fontSize: '0.9rem',
                                marginBottom: '0.25rem'
                              }}>
                                {bundledProduct.title}
                              </div>
                              {bundledProduct.pdfFiles && bundledProduct.pdfFiles.length > 0 && (
                                <div style={{
                                  fontSize: '0.75rem',
                                  color: '#64748b',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.25rem'
                                }}>
                                  <FileText size={12} />
                                  {bundledProduct.pdfFiles.length} PDF file{bundledProduct.pdfFiles.length > 1 ? 's' : ''}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Receipt Modal */}
      {showReceipt && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000,
          padding: '1rem',
          overflowY: 'auto',
          animation: 'fadeIn 0.3s ease'
        }}
        onClick={() => setShowReceipt(null)}
        >
          <div style={{
            background: '#fff',
            borderRadius: '24px',
            padding: '2rem 1.5rem',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            position: 'relative',
            animation: 'slideUp 0.3s ease',
            margin: '1rem 0'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowReceipt(null)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'rgba(239,68,68,0.1)',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              <X size={20} color="#ef4444" />
            </button>

            <h2 style={{
              fontSize: '1.5rem',
              fontWeight: '900',
              marginBottom: '1.5rem',
              color: '#1e293b',
              textAlign: 'center',
              paddingRight: '2rem'
            }}>
              🧾 Receipt
            </h2>

            <div style={{
              background: 'linear-gradient(135deg, rgba(99,102,241,0.05), rgba(139,92,246,0.05))',
              border: '2px solid rgba(99,102,241,0.2)',
              borderRadius: '16px',
              padding: '1.5rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: '0.4rem', fontWeight: '600' }}>Order ID</div>
                <div style={{ fontWeight: '700', fontSize: '1rem', color: '#1e293b' }}>#{showReceipt.id}</div>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: '0.4rem', fontWeight: '600' }}>Payment ID</div>
                <div style={{ 
                  fontWeight: '700', 
                  fontSize: '0.85rem', 
                  color: '#1e293b', 
                  wordBreak: 'break-all'
                }}>
                  {showReceipt.paymentId || 'N/A'}
                </div>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: '0.4rem', fontWeight: '600' }}>Date</div>
                <div style={{ fontWeight: '700', fontSize: '1rem', color: '#1e293b' }}>{showReceipt.date}</div>
              </div>

              <div style={{ marginBottom: '1.25rem' }}>
                <div style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: '0.4rem', fontWeight: '600' }}>Customer</div>
                <div style={{ 
                  fontWeight: '700', 
                  fontSize: '0.9rem', 
                  color: '#1e293b',
                  wordBreak: 'break-all'
                }}>
                  {showReceipt.userEmail}
                </div>
              </div>

              <div style={{
                borderTop: '2px dashed rgba(99,102,241,0.2)',
                paddingTop: '1.25rem',
                marginTop: '1.25rem'
              }}>
                <div style={{ color: '#64748b', fontSize: '0.8rem', marginBottom: '0.75rem', fontWeight: '600' }}>Items</div>
                {showReceipt.items.map((item, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '0.75rem',
                    fontSize: '0.9rem',
                    gap: '1rem'
                  }}>
                    <span style={{ flex: 1 }}>
                      {item.isBundle && '📦 '}{item.title}
                    </span>
                    <span style={{ fontWeight: '700', flexShrink: 0 }}>₹{item.price}</span>
                  </div>
                ))}
              </div>

              <div style={{
                borderTop: '2px solid rgba(99,102,241,0.3)',
                paddingTop: '1.25rem',
                marginTop: '1.25rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '1rem'
              }}>
                <span style={{ fontSize: '1.2rem', fontWeight: '900', color: '#1e293b' }}>Total Paid</span>
                <span style={{
                  fontSize: '1.75rem',
                  fontWeight: '900',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  ₹{showReceipt.total}
                </span>
              </div>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(5,150,105,0.1))',
              border: '2px solid rgba(16,185,129,0.3)',
              borderRadius: '12px',
              padding: '1rem',
              textAlign: 'center',
              color: '#10b981',
              fontWeight: '700',
              fontSize: '0.95rem'
            }}>
              ✅ Payment Successful
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        show={confirmDelete !== null}
        onConfirm={() => handleDeleteOrder(confirmDelete)}
        onCancel={() => setConfirmDelete(null)}
        title="Delete Order?"
        message="Are you sure you want to delete this order? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(50px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}

export default OrdersPage;