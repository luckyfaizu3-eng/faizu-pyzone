import React from 'react';
import { Download, CheckCircle } from 'lucide-react';

function OrdersPage({ orders }) {
  if (orders.length === 0) {
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
          My Orders
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
              animation: `fadeInUp 0.6s ease ${index * 0.1}s backwards`
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

              {/* DOWNLOAD BUTTONS - BIG & VISIBLE */}
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem'
              }}>
                {order.items.map(item => (
                  <a 
                    key={item.id} 
                    href={item.pdfUrl} 
                    download={item.pdfFileName || `${item.title}.pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ 
                      textDecoration: 'none',
                      width: '100%'
                    }}
                    onClick={() => window.showToast?.(`📥 Downloading ${item.title}...`, 'info')}
                  >
                    <button style={{
                      width: '100%',
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      border: 'none',
                      color: 'white',
                      padding: '1.25rem 2rem',
                      borderRadius: '14px',
                      cursor: 'pointer',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '1rem',
                      transition: 'all 0.3s ease',
                      boxShadow: '0 4px 15px rgba(16,185,129,0.3)',
                      fontSize: '1.1rem'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-3px)';
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(16,185,129,0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 15px rgba(16,185,129,0.3)';
                    }}
                    onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
                    onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      <span style={{
                        flex: 1,
                        textAlign: 'left',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        📄 {item.title}
                      </span>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        background: 'rgba(255,255,255,0.2)',
                        padding: '0.5rem 1rem',
                        borderRadius: '20px'
                      }}>
                        <Download size={20} /> 
                        Download PDF
                      </div>
                    </button>
                  </a>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

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