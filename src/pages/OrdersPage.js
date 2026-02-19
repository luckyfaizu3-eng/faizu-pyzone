import React, { useState } from 'react';
import { useTheme } from '../App';
import {
  Download, Clock, CheckCircle, ShoppingBag,
  RefreshCw, AlertCircle, ChevronDown, ChevronUp,
  FileText, Package, Trash2
} from 'lucide-react';

// =====================================================
// ✅ PDF FORCE DOWNLOAD BUTTON
// Browser mein open nahi hoga — seedha download hoga
// =====================================================
function PdfDownloadButton({ pdf, isDark }) {
  const [status, setStatus] = useState('idle'); // idle | downloading | done | error

  const handleDownload = async () => {
    if (status === 'downloading') return;
    setStatus('downloading');
    window.showToast?.('⏳ Downloading PDF...', 'info');

    try {
      const response = await fetch(pdf.url);
      if (!response.ok) throw new Error('Fetch failed');
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = pdf.name.endsWith('.pdf') ? pdf.name : pdf.name + '.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      setStatus('done');
      window.showToast?.('✅ PDF Downloaded!', 'success');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (err) {
      console.error('PDF download error:', err);
      // Fallback: direct link with download attribute
      const a = document.createElement('a');
      a.href = pdf.url;
      a.download = pdf.name.endsWith('.pdf') ? pdf.name : pdf.name + '.pdf';
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setStatus('error');
      window.showToast?.('📄 Opening PDF...', 'info');
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  const bgColor =
    status === 'downloading' ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' :
    status === 'done'        ? 'linear-gradient(135deg,#10b981,#059669)' :
    status === 'error'       ? 'linear-gradient(135deg,#f59e0b,#d97706)' :
                               'linear-gradient(135deg,#10b981,#059669)';

  const label =
    status === 'downloading' ? '⏳ Downloading...' :
    status === 'done'        ? '✅ Downloaded!' :
    status === 'error'       ? '📄 Opening...' :
                               pdf.name;

  return (
    <button
      onClick={handleDownload}
      disabled={status === 'downloading'}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        background: bgColor,
        color: '#fff',
        padding: '0.85rem 1.25rem',
        borderRadius: '12px',
        border: 'none',
        fontWeight: '700',
        fontSize: '0.9rem',
        cursor: status === 'downloading' ? 'not-allowed' : 'pointer',
        boxShadow: '0 4px 16px rgba(16,185,129,0.3)',
        transition: 'all 0.3s',
        width: '100%',
        textAlign: 'left',
        opacity: status === 'downloading' ? 0.85 : 1
      }}
    >
      {status === 'downloading'
        ? <div style={{
            width: 18, height: 18, border: '3px solid rgba(255,255,255,0.4)',
            borderTopColor: '#fff', borderRadius: '50%',
            animation: 'spin 0.7s linear infinite', flexShrink: 0
          }}/>
        : <Download size={18} style={{ flexShrink: 0 }}/>
      }
      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {label}
      </span>
    </button>
  );
}

// =====================================================
// MAIN ORDERS PAGE
// =====================================================
export default function OrdersPage({ orders, user, refreshOrders }) {
  const { isDark } = useTheme();
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [refreshing, setRefreshing]       = useState(false);
  const [deletingId, setDeletingId]       = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // colours
  const pageBg   = isDark ? '#0f172a' : '#f8fafc';
  const cardBg   = isDark ? '#1e293b' : '#ffffff';
  const textMain = isDark ? '#f1f5f9' : '#1e293b';
  const textSub  = isDark ? '#94a3b8' : '#64748b';
  const borderC  = isDark ? '#334155' : '#e2e8f0';

  // ✅ Split orders - completed vs pending (rare)
  const allOrders       = orders || [];
  const completedOrders = allOrders.filter(o => o.status === 'completed');
  const pendingOrders   = allOrders.filter(o => o.status === 'pending');

  // handlers
  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshOrders();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleDeleteOrder = async (orderId) => {
    setDeletingId(orderId);
    try {
      const { db }          = await import('../firebase');
      const { doc, deleteDoc } = await import('firebase/firestore');
      await deleteDoc(doc(db, 'orders', orderId));
      window.showToast?.('🗑️ Order deleted!', 'info');
      await refreshOrders();
    } catch (err) {
      console.error(err);
      window.showToast?.('❌ Delete failed!', 'error');
    }
    setDeletingId(null);
    setConfirmDeleteId(null);
  };

  // invoice download
  const downloadInvoice = (order) => {
    const rows = (order.items || []).map((item, i) => `
      <tr>
        <td>${i + 1}</td>
        <td>${item.title || 'Product'}</td>
        <td style="text-align:right;font-weight:700;">&#8377;${item.price || 0}</td>
      </tr>`).join('');

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/>
<title>Invoice - ${order.id}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box;}
  body{font-family:Arial,sans-serif;padding:40px;color:#1e293b;}
  .header{display:flex;justify-content:space-between;border-bottom:3px solid #6366f1;padding-bottom:20px;margin-bottom:30px;}
  .brand{font-size:26px;font-weight:900;color:#6366f1;}
  .right{text-align:right;}
  .badge{display:inline-block;background:#dcfce7;color:#166534;padding:4px 14px;border-radius:20px;font-size:12px;font-weight:700;margin-top:6px;}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:28px;}
  .box{background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px;}
  .lbl{font-size:11px;color:#94a3b8;font-weight:700;text-transform:uppercase;margin-bottom:4px;}
  .val{font-size:14px;font-weight:700;word-break:break-all;}
  table{width:100%;border-collapse:collapse;}
  th{background:#f1f5f9;padding:12px;text-align:left;font-size:12px;font-weight:800;color:#64748b;text-transform:uppercase;}
  td{padding:12px;border-bottom:1px solid #f1f5f9;font-size:14px;}
  .total td{font-weight:800;font-size:16px;color:#6366f1;border-top:2px solid #e2e8f0;border-bottom:none;background:#faf5ff;}
  .footer{margin-top:40px;text-align:center;color:#94a3b8;font-size:12px;border-top:1px solid #e2e8f0;padding-top:20px;}
  .pid{background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:12px;font-size:13px;color:#1d4ed8;font-weight:700;margin-top:20px;word-break:break-all;}
</style></head><body>
<div class="header">
  <div><div class="brand">&#127891; FaizUpyZone</div><div style="font-size:13px;color:#64748b;margin-top:4px;">Premium Study Materials</div></div>
  <div class="right"><h2 style="font-size:22px;font-weight:800;">INVOICE</h2><p style="color:#64748b;font-size:13px;margin-top:4px;">Date: ${order.date || new Date().toLocaleDateString('en-IN')}</p><div class="badge">&#10003; PAID</div></div>
</div>
<div class="grid">
  <div class="box"><div class="lbl">Billed To</div><div class="val">${order.userEmail || ''}</div></div>
  <div class="box"><div class="lbl">Order ID</div><div class="val" style="font-size:11px;">${order.id}</div></div>
</div>
<table>
  <thead><tr><th>#</th><th>Product</th><th style="text-align:right">Price</th></tr></thead>
  <tbody>
    ${rows}
    <tr class="total"><td colspan="2">Total Amount</td><td style="text-align:right">&#8377;${order.total || 0}</td></tr>
  </tbody>
</table>
${order.paymentId ? `<div class="pid">Payment ID: ${order.paymentId}</div>` : ''}
<div class="footer"><p>Thank you for purchasing from FaizUpyZone!</p><p style="margin-top:6px;">Computer-generated invoice. No signature required.</p></div>
</body></html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `Invoice_${order.paymentId || order.id}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    window.showToast?.('📄 Invoice downloaded!', 'success');
  };

  // empty guards
  if (!user) {
    return (
      <div style={{ minHeight:'80vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:pageBg, padding:'2rem', textAlign:'center' }}>
        <div style={{ width:80, height:80, borderRadius:'50%', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'1.5rem', boxShadow:'0 12px 40px rgba(99,102,241,0.4)' }}>
          <ShoppingBag size={36} color="#fff" />
        </div>
        <h2 style={{ fontSize:'1.5rem', fontWeight:800, color:textMain, marginBottom:'0.5rem' }}>Please Login</h2>
        <p style={{ color:textSub }}>Login karke apne orders dekho.</p>
      </div>
    );
  }

  if (allOrders.length === 0) {
    return (
      <div style={{ minHeight:'80vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:pageBg, padding:'2rem', textAlign:'center' }}>
        <div style={{ width:80, height:80, borderRadius:'50%', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'1.5rem', boxShadow:'0 12px 40px rgba(99,102,241,0.4)' }}>
          <Package size={36} color="#fff" />
        </div>
        <h2 style={{ fontSize:'1.5rem', fontWeight:800, color:textMain, marginBottom:'0.5rem' }}>No Orders Yet</h2>
        <p style={{ color:textSub }}>Abhi tak koi purchase nahi kiya!</p>
      </div>
    );
  }

  // render one order card
  const renderOrderCard = (order) => {
    const isPending    = order.status === 'pending';
    const isExpanded   = expandedOrder === order.id;
    const isDeleting   = deletingId === order.id;
    const isConfirming = confirmDeleteId === order.id;

    // collect pdf links
    const pdfLinks = (order.items || []).flatMap(item => {
      if (item.isBundle && item.bundledProducts?.length > 0) {
        return item.bundledProducts.flatMap(bp =>
          (bp.pdfFiles || []).map((pdf, pi) => ({
            name: pdf.name || `${bp.title} - PDF ${pi + 1}`,
            url: pdf.url
          }))
        );
      }
      return (item.pdfFiles || []).map((pdf, pi) => ({
        name: pdf.name || `${item.title} - PDF ${pi + 1}`,
        url: pdf.url
      }));
    });

    return (
      <div key={order.id} style={{
        background: cardBg,
        border: `2px solid ${isPending ? '#f59e0b' : borderC}`,
        borderRadius: '20px', marginBottom: '1.25rem', overflow: 'hidden',
        boxShadow: isPending ? '0 4px 20px rgba(245,158,11,0.15)' : '0 4px 20px rgba(0,0,0,0.06)'
      }}>

        {/* top */}
        <div style={{ padding:'clamp(1rem,3vw,1.5rem)' }}>

          {/* status + date */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem', flexWrap:'wrap', gap:'0.5rem' }}>
            {isPending ? (
              <div style={{ display:'flex', alignItems:'center', gap:'0.4rem', background:'#fef3c7', color:'#92400e', padding:'0.35rem 0.9rem', borderRadius:'20px', fontSize:'0.78rem', fontWeight:'800', border:'1.5px solid #f59e0b' }}>
                <Clock size={12}/> Manual Verification
              </div>
            ) : (
              <div style={{ display:'flex', alignItems:'center', gap:'0.4rem', background:'#dcfce7', color:'#166534', padding:'0.35rem 0.9rem', borderRadius:'20px', fontSize:'0.78rem', fontWeight:'800', border:'1.5px solid #bbf7d0' }}>
                <CheckCircle size={12}/> Completed
              </div>
            )}
            <span style={{ fontSize:'0.8rem', color:textSub, fontWeight:'600' }}>🗓️ {order.date || 'N/A'}</span>
          </div>

          {/* items */}
          <div style={{ marginBottom:'1rem' }}>
            {(order.items || []).map((item, idx) => (
              <div key={idx} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'0.6rem 0', borderBottom: idx < (order.items.length - 1) ? `1px solid ${borderC}` : 'none' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'0.6rem' }}>
                  {item.thumbnail
                    ? <img src={item.thumbnail} alt="" style={{ width:36, height:36, borderRadius:8, objectFit:'cover' }}/>
                    : <div style={{ width:36, height:36, borderRadius:8, background:'linear-gradient(135deg,#6366f1,#8b5cf6)', display:'flex', alignItems:'center', justifyContent:'center' }}><FileText size={18} color="#fff"/></div>
                  }
                  <span style={{ fontWeight:'700', color:textMain, fontSize:'0.95rem' }}>{item.title || 'Product'}</span>
                </div>
                <span style={{ fontWeight:'800', color:'#6366f1', fontSize:'1rem' }}>₹{item.price || 0}</span>
              </div>
            ))}
          </div>

          {/* total + toggle */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'0.5rem' }}>
            <div style={{ background: isDark ? '#0f172a' : '#f8fafc', border:`1.5px solid ${borderC}`, borderRadius:'12px', padding:'0.5rem 1rem', display:'flex', alignItems:'center', gap:'0.5rem' }}>
              <span style={{ color:textSub, fontSize:'0.85rem', fontWeight:'700' }}>Total:</span>
              <span style={{ color:textMain, fontSize:'1.1rem', fontWeight:'900' }}>₹{order.total || 0}</span>
            </div>
            <button onClick={() => setExpandedOrder(isExpanded ? null : order.id)} style={{ background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:'0.3rem', color:textSub, fontSize:'0.85rem', fontWeight:'700' }}>
              {isExpanded ? <><ChevronUp size={16}/> Hide</> : <><ChevronDown size={16}/> Details</>}
            </button>
          </div>
        </div>

        {/* expanded */}
        {isExpanded && (
          <div style={{ borderTop:`2px solid ${borderC}`, padding:'clamp(1rem,3vw,1.5rem)', background: isDark ? '#0f172a' : '#f8fafc' }}>

            {/* payment id */}
            {order.paymentId && (
              <div style={{ background: isDark ? '#1e293b' : '#eff6ff', border:`1.5px solid ${isDark ? '#334155' : '#bfdbfe'}`, borderRadius:'12px', padding:'0.85rem 1rem', marginBottom:'1.25rem' }}>
                <div style={{ fontSize:'0.75rem', fontWeight:'800', color:textSub, marginBottom:'0.25rem', textTransform:'uppercase' }}>Payment ID</div>
                <div style={{ fontSize:'0.85rem', fontWeight:'700', color: isDark ? '#93c5fd' : '#1d4ed8', wordBreak:'break-all' }}>{order.paymentId}</div>
              </div>
            )}

            {/* ✅ ONLY show warning if actually pending (rare - manual verification) */}
            {isPending && (
              <div style={{ background:'linear-gradient(135deg,#fef3c7,#fde68a)', border:'2px solid #f59e0b', borderRadius:'14px', padding:'1rem 1.25rem', marginBottom:'1.25rem', display:'flex', alignItems:'flex-start', gap:'0.75rem' }}>
                <AlertCircle size={20} color="#92400e" style={{ flexShrink:0, marginTop:2 }}/>
                <div>
                  <div style={{ fontWeight:'800', fontSize:'0.9rem', color:'#92400e', marginBottom:'0.25rem' }}>Manual Verification Pending</div>
                  <div style={{ fontSize:'0.8rem', color:'#b45309', lineHeight:1.5 }}>
                    This order requires manual verification. Please contact admin for confirmation.
                  </div>
                </div>
              </div>
            )}

            {/* ✅ PDF Downloads - FORCE DOWNLOAD (only for completed) */}
            {!isPending && (
              <div style={{ marginBottom:'1.25rem' }}>
                <div style={{ fontSize:'0.8rem', fontWeight:'800', color:textSub, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:'0.75rem' }}>
                  📥 Download Your PDFs
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:'0.6rem' }}>
                  {pdfLinks.length > 0 ? (
                    pdfLinks.map((pdf, idx) => (
                      <PdfDownloadButton key={idx} pdf={pdf} isDark={isDark} />
                    ))
                  ) : (
                    <div style={{ padding:'1rem', borderRadius:'12px', background: isDark ? '#1e293b' : '#f1f5f9', color:textSub, fontSize:'0.85rem', fontWeight:'600' }}>
                      ℹ️ PDF links will be added soon. Contact admin if needed.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* action buttons */}
            <div style={{ display:'flex', gap:'0.75rem', flexWrap:'wrap' }}>

              {/* invoice - only for completed */}
              {!isPending && (
                <button
                  onClick={() => downloadInvoice(order)}
                  style={{ flex:1, minWidth:140, display:'flex', alignItems:'center', justifyContent:'center', gap:'0.5rem', background: isDark ? '#1e293b' : '#fff', border:'2px solid #6366f1', borderRadius:'12px', padding:'0.85rem 1rem', color:'#6366f1', fontWeight:'700', fontSize:'0.9rem', cursor:'pointer', transition:'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.background='#6366f1'; e.currentTarget.style.color='#fff'; }}
                  onMouseLeave={e => { e.currentTarget.style.background=isDark?'#1e293b':'#fff'; e.currentTarget.style.color='#6366f1'; }}
                >
                  <FileText size={16}/> Download Invoice
                </button>
              )}

              {/* delete */}
              {!isConfirming ? (
                <button
                  onClick={() => setConfirmDeleteId(order.id)}
                  style={{ flex:1, minWidth:140, display:'flex', alignItems:'center', justifyContent:'center', gap:'0.5rem', background: isDark ? '#1e293b' : '#fff', border:'2px solid #ef4444', borderRadius:'12px', padding:'0.85rem 1rem', color:'#ef4444', fontWeight:'700', fontSize:'0.9rem', cursor:'pointer', transition:'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.background='#ef4444'; e.currentTarget.style.color='#fff'; }}
                  onMouseLeave={e => { e.currentTarget.style.background=isDark?'#1e293b':'#fff'; e.currentTarget.style.color='#ef4444'; }}
                >
                  <Trash2 size={16}/> Delete Order
                </button>
              ) : (
                <div style={{ flex:1, display:'flex', gap:'0.5rem', alignItems:'center', background:'#fef2f2', border:'2px solid #ef4444', borderRadius:'12px', padding:'0.75rem 1rem' }}>
                  <span style={{ fontSize:'0.82rem', fontWeight:'700', color:'#dc2626', flex:1 }}>Confirm delete?</span>
                  <button onClick={() => handleDeleteOrder(order.id)} disabled={isDeleting} style={{ background:'#ef4444', color:'#fff', border:'none', borderRadius:'8px', padding:'0.4rem 0.85rem', fontWeight:'800', fontSize:'0.82rem', cursor:'pointer' }}>
                    {isDeleting ? '...' : 'Yes'}
                  </button>
                  <button onClick={() => setConfirmDeleteId(null)} style={{ background:'#fff', color:'#64748b', border:'1px solid #e2e8f0', borderRadius:'8px', padding:'0.4rem 0.85rem', fontWeight:'700', fontSize:'0.82rem', cursor:'pointer' }}>
                    No
                  </button>
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    );
  };

  // main render
  return (
    <div style={{ minHeight:'100vh', background:pageBg, padding:'clamp(1rem,3vw,2rem)' }}>
      <div style={{ maxWidth:800, margin:'0 auto' }}>

        {/* header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.75rem', flexWrap:'wrap', gap:'1rem' }}>
          <div>
            <h1 style={{ fontSize:'clamp(1.4rem,4vw,1.8rem)', fontWeight:900, color:textMain, margin:0 }}>📦 My Orders</h1>
            <p style={{ color:textSub, fontSize:'0.88rem', marginTop:'0.25rem' }}>
              {completedOrders.length} completed
              {pendingOrders.length > 0 && ` · ${pendingOrders.length} pending`}
            </p>
          </div>
          <button onClick={handleRefresh} style={{ display:'flex', alignItems:'center', gap:'0.5rem', background: isDark ? '#1e293b' : '#fff', border:`2px solid ${borderC}`, borderRadius:'12px', padding:'0.65rem 1.25rem', color:textSub, fontWeight:'700', fontSize:'0.9rem', cursor:'pointer' }}>
            <RefreshCw size={16} style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }}/>
            Refresh
          </button>
        </div>

        {/* ✅ Show pending only if they exist (rare - manual verification) */}
        {pendingOrders.length > 0 && (
          <div style={{ marginBottom:'2rem' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'1rem' }}>
              <Clock size={16} color="#f59e0b"/>
              <span style={{ fontWeight:'800', fontSize:'0.9rem', color:'#f59e0b', textTransform:'uppercase', letterSpacing:'0.06em' }}>
                Manual Verification ({pendingOrders.length})
              </span>
            </div>
            {pendingOrders.map(order => renderOrderCard(order))}
          </div>
        )}

        {/* completed section */}
        {completedOrders.length > 0 && (
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', marginBottom:'1rem' }}>
              <CheckCircle size={16} color="#10b981"/>
              <span style={{ fontWeight:'800', fontSize:'0.9rem', color:'#10b981', textTransform:'uppercase', letterSpacing:'0.06em' }}>
                Your Orders ({completedOrders.length})
              </span>
            </div>
            {completedOrders.map(order => renderOrderCard(order))}
          </div>
        )}

      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
