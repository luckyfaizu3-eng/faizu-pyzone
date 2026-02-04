import React, { useEffect, useState } from 'react';
import { Download, CheckCircle, Trash2, FileText, X } from 'lucide-react';
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
    console.log('=== ORDERS PAGE DEBUG ===');
    console.log('User:', user?.email);
    console.log('Orders received:', orders?.length || 0);
    console.log('Orders data:', orders);
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

  // ✅ Handle multi-PDF download
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
        paddingTop: '120px',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          textAlign: 'center',
          animation: 'fadeInUp 0.6s ease'
        }}>
          <Download 
            size={120} 
            color="#cbd5e1" 
            style={{
              margin: '0 auto 2rem',
              opacity: 0.5
            }} 
          />
          <h2 style={{
            fontSize: '2.5rem',
            fontWeight: '900',
            marginBottom: '1rem',
            color: '#1e293b'
          }}>
            No orders yet
          </h2>
          <p style={{
            color: '#64748b',
            fontSize: '1.2rem'
          }}>
            Start shopping to see your orders here!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      paddingTop: '120px',
      paddingBottom: '5rem',
      minHeight: '100vh',
      padding: '120px 1.5rem 5rem'
    }}>
      <div style={{
        maxWidth: '1000px',
        margin: '0 auto'
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
          My Orders ({orders.length})
        </h1>
        
        {orders.map((order, index) => (
          <div 
            key={order.id} 
            style={{
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '24px',
              padding: '2.5rem',
              marginBottom: '2rem',
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
              animation: 'fadeInUp 0.6s ease ' + (index * 0.1) + 's backwards'
            }}
          >
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '2rem',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <div>
                <h3 style={{
                  fontSize: '1.5rem',
                  fontWeight: '900',
                  color: '#1e293b'
                }}>
                  Order #{order.id?.substring(0, 8)}
                </h3>
                <p style={{
                  color: '#64748b',
                  marginTop: '0.5rem'
                }}>
                  {order.date}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <span style={{
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '50px',
                  fontSize: '0.95rem',
                  fontWeight: '700',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  height: 'fit-content'
                }}>
                  <CheckCircle size={18} />
                  {order.status}
                </span>
                
                <button
                  onClick={() => setShowReceipt(order)}
                  style={{
                    background: 'rgba(99,102,241,0.1)',
                    border: '2px solid rgba(99,102,241,0.3)',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '50px',
                    cursor: 'pointer',
                    fontWeight: '700',
                    color: '#6366f1',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(99,102,241,0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(99,102,241,0.1)';
                  }}
                >
                  <FileText size={18} />
                  Receipt
                </button>

                <button
                  onClick={() => setConfirmDelete(order.id)}
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
                  <Trash2 size={20} color="#ef4444" />
                </button>
              </div>
            </div>
            
            <div style={{
              borderTop: '1px solid #e2e8f0',
              paddingTop: '2rem'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '2rem',
                flexWrap: 'wrap',
                gap: '1rem'
              }}>
                <span style={{
                  fontSize: '2rem',
                  fontWeight: '900',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  Total: ₹{order.total}
                </span>
              </div>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem'
              }}>
                {order.items.map(item => (
                  <div key={item.id} style={{
                    background: 'rgba(99,102,241,0.02)',
                    border: '1px solid #e2e8f0',
                    borderRadius: '16px',
                    padding: '1.5rem',
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '1rem',
                      flexWrap: 'wrap',
                      gap: '1rem'
                    }}>
                      <div>
                        <h4 style={{
                          fontSize: '1.25rem',
                          fontWeight: '700',
                          color: '#1e293b',
                          marginBottom: '0.25rem'
                        }}>
                          📄 {item.title}
                        </h4>
                        {item.pdfFiles && (
                          <div style={{
                            fontSize: '0.9rem',
                            color: '#64748b',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                          }}>
                            <FileText size={16} />
                            {item.pdfFiles.length} PDF file{item.pdfFiles.length > 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                      
                      {/* ✅ Download All Button */}
                      {item.pdfFiles && item.pdfFiles.length > 0 && (
                        <button
                          onClick={() => handleDownloadAll(item)}
                          disabled={downloading[item.id]}
                          style={{
                            background: downloading[item.id] 
                              ? 'rgba(99,102,241,0.3)' 
                              : 'linear-gradient(135deg, #10b981, #059669)',
                            border: 'none',
                            color: 'white',
                            padding: '0.75rem 1.5rem',
                            borderRadius: '12px',
                            cursor: downloading[item.id] ? 'not-allowed' : 'pointer',
                            fontWeight: '700',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            transition: 'all 0.3s ease',
                            fontSize: '0.95rem',
                            opacity: downloading[item.id] ? 0.7 : 1
                          }}
                          onMouseEnter={(e) => {
                            if (!downloading[item.id]) {
                              e.currentTarget.style.transform = 'translateY(-2px)';
                              e.currentTarget.style.boxShadow = '0 6px 20px rgba(16,185,129,0.4)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!downloading[item.id]) {
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = 'none';
                            }
                          }}
                        >
                          <Download size={18} /> 
                          {downloading[item.id] ? 'Downloading...' : `Download All (${item.pdfFiles.length})`}
                        </button>
                      )}
                    </div>

                    {/* ✅ Individual PDF List */}
                    {item.pdfFiles && item.pdfFiles.length > 0 && (
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
                            padding: '1rem',
                            background: '#ffffff',
                            border: '1px solid #e2e8f0',
                            borderRadius: '10px',
                            flexWrap: 'wrap',
                            gap: '0.75rem'
                          }}>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.75rem',
                              flex: 1,
                              minWidth: '200px'
                            }}>
                              <FileText size={20} color="#6366f1" />
                              <div>
                                <div style={{
                                  fontWeight: '600',
                                  color: '#1e293b',
                                  fontSize: '0.95rem'
                                }}>
                                  {pdf.fileName}
                                </div>
                                {pdf.size && (
                                  <div style={{
                                    fontSize: '0.8rem',
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
                                border: '2px solid rgba(99,102,241,0.3)',
                                color: '#6366f1',
                                padding: '0.5rem 1rem',
                                borderRadius: '8px',
                                cursor: downloading[`${item.id}-${pdfIndex}`] ? 'not-allowed' : 'pointer',
                                fontWeight: '600',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                fontSize: '0.85rem',
                                transition: 'all 0.3s ease'
                              }}
                              onMouseEnter={(e) => {
                                if (!downloading[`${item.id}-${pdfIndex}`]) {
                                  e.currentTarget.style.background = 'rgba(99,102,241,0.2)';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!downloading[`${item.id}-${pdfIndex}`]) {
                                  e.currentTarget.style.background = 'rgba(99,102,241,0.1)';
                                }
                              }}
                            >
                              <Download size={16} />
                              {downloading[`${item.id}-${pdfIndex}`] ? 'Downloading...' : 'Download'}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
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
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}
        onClick={() => setShowReceipt(null)}
        >
          <div style={{
            background: '#fff',
            borderRadius: '24px',
            padding: '3rem',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
            position: 'relative'
          }}
          onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowReceipt(null)}
              style={{
                position: 'absolute',
                top: '1.5rem',
                right: '1.5rem',
                background: 'rgba(239,68,68,0.1)',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <X size={24} color="#ef4444" />
            </button>

            <h2 style={{
              fontSize: '2rem',
              fontWeight: '900',
              marginBottom: '2rem',
              color: '#1e293b',
              textAlign: 'center'
            }}>
              Transaction Receipt
            </h2>

            <div style={{
              background: 'rgba(99,102,241,0.05)',
              border: '2px solid rgba(99,102,241,0.2)',
              borderRadius: '16px',
              padding: '2rem',
              marginBottom: '2rem'
            }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Order ID</div>
                <div style={{ fontWeight: '700', fontSize: '1.1rem', color: '#1e293b' }}>#{showReceipt.id}</div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Payment ID</div>
                <div style={{ fontWeight: '700', fontSize: '1.1rem', color: '#1e293b', wordBreak: 'break-all' }}>
                  {showReceipt.paymentId || 'N/A'}
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Date</div>
                <div style={{ fontWeight: '700', fontSize: '1.1rem', color: '#1e293b' }}>{showReceipt.date}</div>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Customer</div>
                <div style={{ fontWeight: '700', fontSize: '1.1rem', color: '#1e293b' }}>{showReceipt.userEmail}</div>
              </div>

              <div style={{
                borderTop: '2px dashed rgba(99,102,241,0.2)',
                paddingTop: '1.5rem',
                marginTop: '1.5rem'
              }}>
                <div style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Items</div>
                {showReceipt.items.map((item, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '0.75rem',
                    fontSize: '1rem'
                  }}>
                    <span>{item.title}</span>
                    <span style={{ fontWeight: '700' }}>₹{item.price}</span>
                  </div>
                ))}
              </div>

              <div style={{
                borderTop: '2px solid rgba(99,102,241,0.3)',
                paddingTop: '1.5rem',
                marginTop: '1.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontSize: '1.5rem', fontWeight: '900', color: '#1e293b' }}>Total Paid</span>
                <span style={{
                  fontSize: '2rem',
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
              background: 'rgba(16,185,129,0.1)',
              border: '2px solid rgba(16,185,129,0.3)',
              borderRadius: '12px',
              padding: '1rem',
              textAlign: 'center',
              color: '#10b981',
              fontWeight: '700'
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
        message="Are you sure you want to delete this order? This action cannot be undone and all associated data will be permanently removed."
        confirmText="Yes, Delete"
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
      `}</style>
    </div>
  );
}

export default OrdersPage;