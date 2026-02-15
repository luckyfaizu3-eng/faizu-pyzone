import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, Clock, XCircle, Eye, 
  Package, User, CreditCard,
  Search, AlertCircle
} from 'lucide-react';
import { db } from '../firebase';
import { doc, updateDoc, collection, query, orderBy, getDocs } from 'firebase/firestore';
import { useTheme } from '../App';

export default function AdminOrdersManager() {
  const { isDark } = useTheme();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [processingOrder, setProcessingOrder] = useState(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const pageBg = isDark ? '#0f172a' : '#f8fafc';
  const cardBg = isDark ? '#1e293b' : '#ffffff';
  const textMain = isDark ? '#f1f5f9' : '#1e293b';
  const textSub = isDark ? '#94a3b8' : '#64748b';
  const borderC = isDark ? '#334155' : '#e2e8f0';

  useEffect(() => {
    loadOrders();
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setOrders(ordersData);
      console.log('✅ Loaded orders:', ordersData.length);
    } catch (error) {
      console.error('❌ Load orders error:', error);
      window.showToast?.('❌ Failed to load orders', 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    setProcessingOrder(orderId);
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, {
        status: newStatus,
        updatedAt: new Date().toISOString(),
        adminAction: {
          status: newStatus,
          timestamp: new Date().toISOString()
        }
      });
      
      window.showToast?.(
        `✅ Order ${newStatus === 'completed' ? 'approved' : 'rejected'}!`,
        'success'
      );
      
      await loadOrders();
      setSelectedOrder(null);
    } catch (error) {
      console.error('❌ Update error:', error);
      window.showToast?.('❌ Failed to update order', 'error');
    } finally {
      setProcessingOrder(null);
    }
  };

  const filteredOrders = orders.filter(order => {
    if (activeTab === 'pending' && order.status !== 'pending') return false;
    if (activeTab === 'completed' && order.status !== 'completed') return false;
    if (activeTab === 'rejected' && order.status !== 'rejected') return false;

    if (searchQuery) {
      const search = searchQuery.toLowerCase();
      return (
        order.userEmail?.toLowerCase().includes(search) ||
        order.id?.toLowerCase().includes(search) ||
        order.paymentId?.toLowerCase().includes(search) ||
        order.items?.some(item => item.title?.toLowerCase().includes(search))
      );
    }
    
    return true;
  });

  const stats = {
    all: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    completed: orders.filter(o => o.status === 'completed').length,
    rejected: orders.filter(o => o.status === 'rejected').length,
    revenue: orders
      .filter(o => o.status === 'completed')
      .reduce((sum, o) => sum + (o.total || 0), 0)
  };

  const tabs = [
    { id: 'all', label: isMobile ? 'All' : 'All Orders', count: stats.all, icon: Package },
    { id: 'pending', label: 'Pending', count: stats.pending, icon: Clock, color: '#f59e0b' },
    { id: 'completed', label: isMobile ? 'Done' : 'Completed', count: stats.completed, icon: CheckCircle, color: '#10b981' },
    { id: 'rejected', label: isMobile ? 'Rejected' : 'Rejected', count: stats.rejected, icon: XCircle, color: '#ef4444' }
  ];

  const OrderDetailModal = ({ order, onClose }) => {
    if (!order) return null;

    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        alignItems: isMobile ? 'flex-start' : 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: isMobile ? '0' : '1rem',
        overflowY: 'auto',
        animation: 'fadeIn 0.2s ease'
      }}>
        <div style={{
          background: cardBg,
          borderRadius: isMobile ? '0' : '24px',
          maxWidth: '800px',
          width: '100%',
          maxHeight: isMobile ? '100vh' : '90vh',
          overflow: 'auto',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          animation: 'slideUp 0.3s ease'
        }}>
          <div style={{
            padding: isMobile ? '1.25rem' : '2rem',
            borderBottom: `2px solid ${borderC}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '1rem'
          }}>
            <div style={{ flex: 1 }}>
              <h2 style={{
                fontSize: isMobile ? '1.3rem' : '1.75rem',
                fontWeight: '900',
                color: textMain,
                marginBottom: '0.5rem'
              }}>
                Order Details
              </h2>
              <div style={{
                fontSize: isMobile ? '0.75rem' : '0.9rem',
                color: textSub,
                fontFamily: 'monospace',
                background: isDark ? '#0f172a' : '#f8fafc',
                padding: '0.5rem 0.75rem',
                borderRadius: '8px',
                display: 'inline-block'
              }}>
                #{order.id}
              </div>
            </div>
            
            <div style={{
              padding: isMobile ? '0.4rem 0.8rem' : '0.5rem 1rem',
              borderRadius: '20px',
              fontSize: isMobile ? '0.75rem' : '0.85rem',
              fontWeight: '800',
              textTransform: 'uppercase',
              ...(order.status === 'pending' ? {
                background: '#fef3c7',
                color: '#92400e',
                border: '2px solid #f59e0b'
              } : order.status === 'completed' ? {
                background: '#dcfce7',
                color: '#166534',
                border: '2px solid #10b981'
              } : {
                background: '#fee2e2',
                color: '#991b1b',
                border: '2px solid #ef4444'
              })
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                {order.status === 'pending' ? <Clock size={isMobile ? 12 : 14} /> : 
                 order.status === 'completed' ? <CheckCircle size={isMobile ? 12 : 14} /> : 
                 <XCircle size={isMobile ? 12 : 14} />}
                {order.status}
              </div>
            </div>
          </div>

          <div style={{ padding: isMobile ? '1.25rem' : '2rem' }}>
            
            <div style={{
              background: isDark ? '#0f172a' : '#f8fafc',
              border: `1px solid ${borderC}`,
              borderRadius: '16px',
              padding: isMobile ? '1rem' : '1.5rem',
              marginBottom: '1.5rem'
            }}>
              <h3 style={{
                fontSize: isMobile ? '0.95rem' : '1.1rem',
                fontWeight: '800',
                color: textMain,
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <User size={isMobile ? 18 : 20} color="#6366f1" />
                Customer Info
              </h3>
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <span style={{ color: textSub, fontWeight: '600', fontSize: isMobile ? '0.85rem' : '1rem' }}>Email:</span>
                  <span style={{ color: textMain, fontWeight: '700', fontSize: isMobile ? '0.85rem' : '1rem', wordBreak: 'break-all' }}>
                    {order.userEmail || 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            <div style={{
              background: isDark ? '#0f172a' : '#f8fafc',
              border: `1px solid ${borderC}`,
              borderRadius: '16px',
              padding: isMobile ? '1rem' : '1.5rem',
              marginBottom: '1.5rem'
            }}>
              <h3 style={{
                fontSize: isMobile ? '0.95rem' : '1.1rem',
                fontWeight: '800',
                color: textMain,
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <CreditCard size={isMobile ? 18 : 20} color="#10b981" />
                Payment Details
              </h3>
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: textSub, fontWeight: '600', fontSize: isMobile ? '0.85rem' : '1rem' }}>Total:</span>
                  <span style={{
                    fontSize: isMobile ? '1.3rem' : '1.5rem',
                    fontWeight: '900',
                    color: '#10b981'
                  }}>
                    ₹{order.total || 0}
                  </span>
                </div>
                {order.paymentId && (
                  <div style={{
                    background: isDark ? '#1e293b' : '#eff6ff',
                    border: `1px solid ${isDark ? '#334155' : '#bfdbfe'}`,
                    borderRadius: '8px',
                    padding: '0.75rem',
                    marginTop: '0.5rem'
                  }}>
                    <div style={{
                      fontSize: '0.7rem',
                      fontWeight: '700',
                      color: textSub,
                      textTransform: 'uppercase',
                      marginBottom: '0.25rem'
                    }}>
                      Payment ID
                    </div>
                    <div style={{
                      fontSize: isMobile ? '0.75rem' : '0.85rem',
                      fontFamily: 'monospace',
                      color: isDark ? '#93c5fd' : '#1d4ed8',
                      fontWeight: '600',
                      wordBreak: 'break-all'
                    }}>
                      {order.paymentId}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div style={{
              background: isDark ? '#0f172a' : '#f8fafc',
              border: `1px solid ${borderC}`,
              borderRadius: '16px',
              padding: isMobile ? '1rem' : '1.5rem'
            }}>
              <h3 style={{
                fontSize: isMobile ? '0.95rem' : '1.1rem',
                fontWeight: '800',
                color: textMain,
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <Package size={isMobile ? 18 : 20} color="#ec4899" />
                Items ({order.items?.length || 0})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {(order.items || []).map((item, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: isMobile ? '0.75rem' : '1rem',
                    background: cardBg,
                    border: `1px solid ${borderC}`,
                    borderRadius: '12px',
                    gap: '0.75rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '0.5rem' : '0.75rem', flex: 1, minWidth: 0 }}>
                      {item.thumbnail ? (
                        <img
                          src={item.thumbnail}
                          alt={item.title}
                          style={{
                            width: isMobile ? '40px' : '50px',
                            height: isMobile ? '40px' : '50px',
                            objectFit: 'cover',
                            borderRadius: '8px',
                            flexShrink: 0
                          }}
                        />
                      ) : (
                        <div style={{
                          width: isMobile ? '40px' : '50px',
                          height: isMobile ? '40px' : '50px',
                          borderRadius: '8px',
                          background: 'linear-gradient(135deg, #6366f1, #ec4899)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: isMobile ? '1.2rem' : '1.5rem',
                          flexShrink: 0
                        }}>
                          📚
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontWeight: '700',
                          color: textMain,
                          fontSize: isMobile ? '0.85rem' : '0.95rem',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {item.title}
                        </div>
                        {item.pdfFiles && (
                          <div style={{
                            fontSize: isMobile ? '0.7rem' : '0.8rem',
                            color: textSub,
                            marginTop: '0.25rem'
                          }}>
                            {item.pdfFiles.length} PDF file(s)
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{
                      fontSize: isMobile ? '0.95rem' : '1.1rem',
                      fontWeight: '900',
                      color: '#6366f1',
                      flexShrink: 0
                    }}>
                      ₹{item.price}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {order.status === 'pending' && (
              <div style={{
                marginTop: '2rem',
                padding: isMobile ? '1rem' : '1.5rem',
                background: 'rgba(245,158,11,0.1)',
                border: '2px solid rgba(245,158,11,0.3)',
                borderRadius: '16px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  marginBottom: '1rem',
                  color: '#f59e0b',
                  fontWeight: '700',
                  fontSize: isMobile ? '0.9rem' : '1rem'
                }}>
                  <AlertCircle size={isMobile ? 18 : 20} />
                  Action Required
                </div>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                  gap: '1rem'
                }}>
                  <button
                    onClick={() => updateOrderStatus(order.id, 'completed')}
                    disabled={processingOrder === order.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      border: 'none',
                      color: '#fff',
                      padding: isMobile ? '0.85rem' : '1rem 1.5rem',
                      borderRadius: '12px',
                      fontSize: isMobile ? '0.9rem' : '1rem',
                      fontWeight: '700',
                      cursor: processingOrder === order.id ? 'not-allowed' : 'pointer',
                      opacity: processingOrder === order.id ? 0.6 : 1,
                      boxShadow: '0 4px 15px rgba(16,185,129,0.3)',
                      transition: 'all 0.2s'
                    }}
                  >
                    <CheckCircle size={isMobile ? 18 : 20} />
                    {processingOrder === order.id ? 'Processing...' : (isMobile ? 'Approve' : 'Approve Order')}
                  </button>
                  
                  <button
                    onClick={() => updateOrderStatus(order.id, 'rejected')}
                    disabled={processingOrder === order.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                      border: 'none',
                      color: '#fff',
                      padding: isMobile ? '0.85rem' : '1rem 1.5rem',
                      borderRadius: '12px',
                      fontSize: isMobile ? '0.9rem' : '1rem',
                      fontWeight: '700',
                      cursor: processingOrder === order.id ? 'not-allowed' : 'pointer',
                      opacity: processingOrder === order.id ? 0.6 : 1,
                      boxShadow: '0 4px 15px rgba(239,68,68,0.3)',
                      transition: 'all 0.2s'
                    }}
                  >
                    <XCircle size={isMobile ? 18 : 20} />
                    {processingOrder === order.id ? 'Processing...' : (isMobile ? 'Reject' : 'Reject Order')}
                  </button>
                </div>
              </div>
            )}
          </div>

          <div style={{
            padding: isMobile ? '1rem 1.25rem' : '1.5rem 2rem',
            borderTop: `2px solid ${borderC}`,
            display: 'flex',
            justifyContent: 'flex-end'
          }}>
            <button
              onClick={onClose}
              style={{
                background: isDark ? '#1e293b' : '#f1f5f9',
                border: 'none',
                color: textMain,
                padding: isMobile ? '0.65rem 1.25rem' : '0.75rem 1.5rem',
                borderRadius: '12px',
                fontSize: isMobile ? '0.9rem' : '1rem',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: pageBg
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '4px solid rgba(99,102,241,0.2)',
          borderTopColor: '#6366f1',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: pageBg,
      padding: isMobile ? '1rem' : 'clamp(1rem, 3vw, 2rem)'
    }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        
        <div style={{ marginBottom: isMobile ? '1.5rem' : '2rem' }}>
          <h1 style={{
            fontSize: isMobile ? '1.5rem' : 'clamp(1.75rem, 4vw, 2.5rem)',
            fontWeight: '900',
            color: textMain,
            marginBottom: '0.5rem'
          }}>
            📦 Order Management
          </h1>
          <p style={{ color: textSub, fontSize: isMobile ? '0.85rem' : '1rem' }}>
            {isMobile ? `Revenue: ₹${stats.revenue}` : `Manage all customer orders • Total Revenue: ₹${stats.revenue}`}
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: isMobile ? '0.75rem' : '1rem',
          marginBottom: isMobile ? '1.5rem' : '2rem'
        }}>
          {[
            { label: isMobile ? 'Total' : 'Total Orders', value: stats.all, color: '#6366f1', icon: Package },
            { label: 'Pending', value: stats.pending, color: '#f59e0b', icon: Clock },
            { label: isMobile ? 'Done' : 'Completed', value: stats.completed, color: '#10b981', icon: CheckCircle },
            { label: 'Rejected', value: stats.rejected, color: '#ef4444', icon: XCircle }
          ].map((stat, idx) => (
            <div key={idx} style={{
              background: cardBg,
              border: `2px solid ${borderC}`,
              borderRadius: isMobile ? '12px' : '16px',
              padding: isMobile ? '1rem' : '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: isMobile ? '0.75rem' : '1rem'
            }}>
              <div style={{
                width: isMobile ? '40px' : '50px',
                height: isMobile ? '40px' : '50px',
                borderRadius: isMobile ? '10px' : '12px',
                background: `${stat.color}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <stat.icon size={isMobile ? 20 : 24} color={stat.color} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: isMobile ? '0.75rem' : '0.85rem',
                  color: textSub,
                  fontWeight: '600',
                  marginBottom: '0.25rem',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {stat.label}
                </div>
                <div style={{
                  fontSize: isMobile ? '1.5rem' : '2rem',
                  fontWeight: '900',
                  color: stat.color
                }}>
                  {stat.value}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap: '1rem',
          marginBottom: isMobile ? '1.5rem' : '2rem',
          alignItems: isMobile ? 'stretch' : 'center'
        }}>
          <div style={{
            display: 'flex',
            gap: isMobile ? '0.4rem' : '0.5rem',
            background: isDark ? '#1e293b' : '#f1f5f9',
            padding: isMobile ? '0.3rem' : '0.4rem',
            borderRadius: isMobile ? '10px' : '12px',
            flexWrap: 'wrap',
            flex: isMobile ? 'none' : 1
          }}>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  background: activeTab === tab.id
                    ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                    : 'transparent',
                  border: 'none',
                  color: activeTab === tab.id ? '#fff' : textSub,
                  padding: isMobile ? '0.5rem 0.75rem' : '0.6rem 1.25rem',
                  borderRadius: isMobile ? '8px' : '10px',
                  fontSize: isMobile ? '0.75rem' : '0.9rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
                  flex: isMobile ? '1' : 'auto'
                }}
              >
                <tab.icon size={isMobile ? 14 : 16} />
                {!isMobile && tab.label}
                <span style={{
                  background: activeTab === tab.id
                    ? 'rgba(255,255,255,0.25)'
                    : 'rgba(99,102,241,0.12)',
                  color: activeTab === tab.id ? '#fff' : tab.color || '#6366f1',
                  padding: '0.1rem 0.4rem',
                  borderRadius: '12px',
                  fontSize: isMobile ? '0.7rem' : '0.75rem',
                  fontWeight: '800'
                }}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div style={{
            flex: 1,
            minWidth: isMobile ? 'auto' : '250px',
            position: 'relative'
          }}>
            <Search size={isMobile ? 16 : 18} color={textSub} style={{
              position: 'absolute',
              left: isMobile ? '0.75rem' : '1rem',
              top: '50%',
              transform: 'translateY(-50%)'
            }} />
            <input
              type="text"
              placeholder={isMobile ? "Search..." : "Search by email, order ID..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: isMobile ? '0.65rem 0.75rem 0.65rem 2.5rem' : '0.75rem 1rem 0.75rem 3rem',
                border: `2px solid ${borderC}`,
                borderRadius: isMobile ? '10px' : '12px',
                fontSize: isMobile ? '0.85rem' : '0.95rem',
                background: cardBg,
                color: textMain,
                outline: 'none'
              }}
            />
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div style={{
            background: cardBg,
            border: `2px solid ${borderC}`,
            borderRadius: isMobile ? '16px' : '20px',
            padding: isMobile ? '3rem 1.5rem' : '4rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: isMobile ? '3rem' : '4rem', marginBottom: '1rem' }}>📭</div>
            <div style={{
              fontSize: isMobile ? '1.2rem' : '1.5rem',
              fontWeight: '800',
              color: textMain,
              marginBottom: '0.5rem'
            }}>
              No orders found
            </div>
            <div style={{ color: textSub, fontSize: isMobile ? '0.85rem' : '1rem' }}>
              {searchQuery 
                ? 'Try a different search'
                : 'Orders will appear here'
              }
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '0.75rem' : '1rem' }}>
            {filteredOrders.map(order => (
              <div key={order.id} style={{
                background: cardBg,
                border: `2px solid ${
                  order.status === 'pending' ? '#f59e0b' :
                  order.status === 'completed' ? '#10b981' :
                  '#ef4444'
                }`,
                borderRadius: isMobile ? '12px' : '16px',
                padding: isMobile ? '1rem' : '1.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: isMobile ? '0.75rem' : '1rem',
                flexWrap: 'wrap',
                transition: 'all 0.2s',
                cursor: 'pointer'
              }}
              onClick={() => setSelectedOrder(order)}
              >
                <div style={{ flex: 1, minWidth: isMobile ? '180px' : '250px' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    marginBottom: '0.5rem',
                    flexWrap: 'wrap'
                  }}>
                    <div style={{
                      fontSize: isMobile ? '0.85rem' : '1rem',
                      fontWeight: '800',
                      color: textMain
                    }}>
                      #{order.id.slice(-8).toUpperCase()}
                    </div>
                    <div style={{
                      padding: isMobile ? '0.2rem 0.6rem' : '0.25rem 0.75rem',
                      borderRadius: '12px',
                      fontSize: isMobile ? '0.65rem' : '0.75rem',
                      fontWeight: '700',
                      textTransform: 'uppercase',
                      ...(order.status === 'pending' ? {
                        background: '#fef3c7',
                        color: '#92400e'
                      } : order.status === 'completed' ? {
                        background: '#dcfce7',
                        color: '#166534'
                      } : {
                        background: '#fee2e2',
                        color: '#991b1b'
                      })
                    }}>
                      {order.status}
                    </div>
                  </div>
                  <div style={{ fontSize: isMobile ? '0.8rem' : '0.9rem', color: textSub, marginBottom: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    👤 {order.userEmail || 'No email'}
                  </div>
                  {!isMobile && (
                    <div style={{ fontSize: '0.85rem', color: textSub }}>
                      📦 {order.items?.length || 0} item(s) • 🗓️ {order.date || 'N/A'}
                    </div>
                  )}
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: isMobile ? '0.75rem' : '1.5rem'
                }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{
                      fontSize: isMobile ? '1.3rem' : '1.75rem',
                      fontWeight: '900',
                      color: '#10b981'
                    }}>
                      ₹{order.total}
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedOrder(order);
                    }}
                    style={{
                      background: 'rgba(99,102,241,0.1)',
                      border: '2px solid rgba(99,102,241,0.3)',
                      borderRadius: isMobile ? '10px' : '12px',
                      padding: isMobile ? '0.6rem' : '0.75rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s'
                    }}
                  >
                    <Eye size={isMobile ? 18 : 20} color="#6366f1" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
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