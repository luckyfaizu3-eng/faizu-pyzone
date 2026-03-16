import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { query, where, getDocs, collectionGroup } from 'firebase/firestore';

export default function CertificateVerifyPage() {
  const [cert, setCert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const certId = window.location.hash.split('/verify/')[1]?.split('?')[0]?.trim();
    if (!certId) {
      setError('No Certificate ID found in URL.');
      setLoading(false);
      return;
    }
    fetchCertificate(certId);
  }, []);

  const fetchCertificate = async (certId) => {
    try {
      // Search in all users' certificates subcollection
      const snap = await getDocs(
        query(collectionGroup(db, 'certificates'), where('certificateId', '==', certId))
      );

      if (!snap.empty) {
        setCert({ id: snap.docs[0].id, ...snap.docs[0].data() });
      } else {
        setError('Certificate not found. Please check the ID.');
      }
    } catch (e) {
      console.error(e);
      setError('Error fetching certificate. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isMobile = window.innerWidth <= 768;

  if (loading) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f0f4ff', fontFamily:'system-ui' }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:'3rem', marginBottom:'16px', animation:'spin 1s linear infinite', display:'inline-block' }}>⏳</div>
        <div style={{ fontSize:'1.1rem', fontWeight:'700', color:'#6366f1' }}>Verifying Certificate...</div>
        <div style={{ fontSize:'0.85rem', color:'#94a3b8', marginTop:'8px' }}>Checking faizupyzone.shop database</div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (error) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#fff5f5', fontFamily:'system-ui', padding:'1rem' }}>
      <div style={{ textAlign:'center', maxWidth:'440px' }}>
        <div style={{ fontSize:'4rem', marginBottom:'16px' }}>❌</div>
        <h2 style={{ fontSize:'1.5rem', fontWeight:'900', color:'#ef4444', marginBottom:'8px' }}>Certificate Not Found</h2>
        <p style={{ color:'#64748b', marginBottom:'24px', lineHeight:1.6 }}>{error}</p>
        <div style={{ background:'#fff', border:'1px solid #fecaca', borderRadius:'12px', padding:'16px', fontSize:'0.85rem', color:'#94a3b8' }}>
          If you believe this is an error, contact us at<br/>
          <strong style={{ color:'#6366f1' }}>luckyfaizu3@gmail.com</strong>
        </div>
        <a href="https://faizupyzone.shop" style={{ display:'inline-block', marginTop:'20px', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff', padding:'12px 28px', borderRadius:'12px', textDecoration:'none', fontWeight:'700' }}>
          Go to faizupyzone.shop
        </a>
      </div>
    </div>
  );

  const levelColors = {
    basic:    { bg:'#eff6ff', border:'#6366f1', accent:'#6366f1', badge:'#dbeafe' },
    advanced: { bg:'#f5f3ff', border:'#8b5cf6', accent:'#8b5cf6', badge:'#ede9fe' },
    pro:      { bg:'#fffbeb', border:'#f59e0b', accent:'#f59e0b', badge:'#fef3c7' },
  };
  const level = (cert.level || 'basic').toLowerCase();
  const colors = levelColors[level] || levelColors.basic;
  const nameUpper = (cert.userName || cert.studentName || '').toUpperCase();

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#f0f4ff 0%,#fdf2ff 100%)', fontFamily:'"Segoe UI", system-ui, sans-serif', padding: isMobile?'16px':'32px' }}>
      <div style={{ maxWidth:'680px', margin:'0 auto' }}>

        {/* Header */}
        <div style={{ textAlign:'center', marginBottom:'24px' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:'8px', background:'rgba(99,102,241,0.08)', border:'1px solid rgba(99,102,241,0.2)', borderRadius:'50px', padding:'6px 16px', marginBottom:'12px' }}>
            <span style={{ width:'8px', height:'8px', borderRadius:'50%', background:'#10b981', display:'inline-block', animation:'pulse 1.4s ease-in-out infinite' }}/>
            <span style={{ fontSize:'0.75rem', fontWeight:'800', color:'#6366f1', letterSpacing:'0.1em' }}>OFFICIAL VERIFICATION</span>
          </div>
          <h1 style={{ fontSize: isMobile?'1.5rem':'2rem', fontWeight:'900', color:'#1e293b', margin:'0 0 4px' }}>Certificate Verification</h1>
          <p style={{ fontSize:'0.85rem', color:'#64748b', margin:0 }}>faizupyzone.shop — PySkill Certification Authority</p>
        </div>

        {/* VERIFIED Badge */}
        <div style={{ background:'linear-gradient(135deg,#10b981,#059669)', borderRadius:'16px', padding:'16px 24px', marginBottom:'20px', display:'flex', alignItems:'center', gap:'14px', boxShadow:'0 8px 24px rgba(16,185,129,0.3)' }}>
          <div style={{ fontSize:'2.5rem' }}>✅</div>
          <div>
            <div style={{ fontSize:'1.1rem', fontWeight:'900', color:'#fff' }}>Certificate Verified!</div>
            <div style={{ fontSize:'0.8rem', color:'rgba(255,255,255,0.85)', marginTop:'2px' }}>This certificate is authentic and issued by PySkill</div>
          </div>
        </div>

        {/* Main Card */}
        <div style={{ background:'#fff', borderRadius:'20px', border:`2px solid ${colors.border}`, overflow:'hidden', boxShadow:'0 8px 32px rgba(99,102,241,0.12)', marginBottom:'20px' }}>
          
          {/* Top accent */}
          <div style={{ height:'4px', background:`linear-gradient(90deg,${colors.accent},#ec4899)` }}/>

          {/* Student Name */}
          <div style={{ background:colors.bg, padding:'24px', textAlign:'center', borderBottom:`1px solid ${colors.border}20` }}>
            <div style={{ fontSize:'0.7rem', fontWeight:'800', color:'#94a3b8', letterSpacing:'0.15em', marginBottom:'8px' }}>CERTIFICATE ISSUED TO</div>
            <div style={{ fontSize: isMobile?'1.8rem':'2.4rem', fontWeight:'900', color:'#1e293b', letterSpacing:'0.05em', marginBottom:'8px' }}>{nameUpper}</div>
            <div style={{ display:'inline-flex', alignItems:'center', gap:'6px', background:colors.badge, border:`1px solid ${colors.border}40`, borderRadius:'20px', padding:'4px 12px' }}>
              <span style={{ fontSize:'0.7rem', fontWeight:'900', color:colors.accent, letterSpacing:'0.1em' }}>{(cert.level || 'BASIC').toUpperCase()} LEVEL CERTIFIED</span>
            </div>
          </div>

          {/* Details Grid */}
          <div style={{ padding:'20px' }}>
            <div style={{ display:'grid', gridTemplateColumns: isMobile?'1fr':'1fr 1fr', gap:'12px' }}>
              
              {/* Certificate ID */}
              <div style={{ gridColumn: isMobile?'1':'1 / -1', background:'#f8fafc', borderRadius:'12px', padding:'14px 16px', border:'1px solid #e2e8f0' }}>
                <div style={{ fontSize:'0.65rem', fontWeight:'800', color:'#94a3b8', letterSpacing:'0.12em', marginBottom:'6px' }}>CERTIFICATE ID</div>
                <div style={{ fontSize: isMobile?'0.75rem':'0.85rem', fontWeight:'800', color:'#1e293b', fontFamily:'"Courier New", monospace', letterSpacing:'0.5px', wordBreak:'break-all' }}>
                  {cert.certificateId || 'N/A'}
                </div>
              </div>

              {/* Test Name */}
              <div style={{ background:'#f8fafc', borderRadius:'12px', padding:'14px 16px', border:'1px solid #e2e8f0' }}>
                <div style={{ fontSize:'0.65rem', fontWeight:'800', color:'#94a3b8', letterSpacing:'0.12em', marginBottom:'6px' }}>TEST NAME</div>
                <div style={{ fontSize:'0.95rem', fontWeight:'700', color:'#1e293b' }}>{cert.testName || cert.planName || 'Python Test'}</div>
              </div>

              {/* Level */}
              <div style={{ background:'#f8fafc', borderRadius:'12px', padding:'14px 16px', border:'1px solid #e2e8f0' }}>
                <div style={{ fontSize:'0.65rem', fontWeight:'800', color:'#94a3b8', letterSpacing:'0.12em', marginBottom:'6px' }}>LEVEL</div>
                <div style={{ fontSize:'0.95rem', fontWeight:'800', color:colors.accent }}>{(cert.level || 'BASIC').toUpperCase()}</div>
              </div>

              {/* Score */}
              <div style={{ background:'#f8fafc', borderRadius:'12px', padding:'14px 16px', border:'1px solid #e2e8f0' }}>
                <div style={{ fontSize:'0.65rem', fontWeight:'800', color:'#94a3b8', letterSpacing:'0.12em', marginBottom:'6px' }}>SCORE</div>
                <div style={{ fontSize:'1.4rem', fontWeight:'900', color: (cert.score >= 80) ? '#10b981' : (cert.score >= 55) ? '#6366f1' : '#ef4444' }}>
                  {cert.score}%
                </div>
              </div>

              {/* Date Issued */}
              <div style={{ background:'#f8fafc', borderRadius:'12px', padding:'14px 16px', border:'1px solid #e2e8f0' }}>
                <div style={{ fontSize:'0.65rem', fontWeight:'800', color:'#94a3b8', letterSpacing:'0.12em', marginBottom:'6px' }}>DATE ISSUED</div>
                <div style={{ fontSize:'0.95rem', fontWeight:'700', color:'#1e293b' }}>{cert.date || 'N/A'}</div>
              </div>

              {/* Location */}
              <div style={{ background:'#f8fafc', borderRadius:'12px', padding:'14px 16px', border:'1px solid #e2e8f0' }}>
                <div style={{ fontSize:'0.65rem', fontWeight:'800', color:'#94a3b8', letterSpacing:'0.12em', marginBottom:'6px' }}>LOCATION</div>
                <div style={{ fontSize:'0.95rem', fontWeight:'700', color:'#1e293b' }}>{cert.userAddress || cert.location || 'India'}</div>
              </div>

              {/* Issued By */}
              <div style={{ background:'#f8fafc', borderRadius:'12px', padding:'14px 16px', border:'1px solid #e2e8f0' }}>
                <div style={{ fontSize:'0.65rem', fontWeight:'800', color:'#94a3b8', letterSpacing:'0.12em', marginBottom:'6px' }}>ISSUED BY</div>
                <div style={{ fontSize:'0.95rem', fontWeight:'700', color:'#6366f1' }}>PySkill — faizupyzone.shop</div>
              </div>

              {/* Anti-Cheat */}
              <div style={{ background:'#f0fdf4', borderRadius:'12px', padding:'14px 16px', border:'1px solid #bbf7d0' }}>
                <div style={{ fontSize:'0.65rem', fontWeight:'800', color:'#94a3b8', letterSpacing:'0.12em', marginBottom:'6px' }}>EXAM TYPE</div>
                <div style={{ fontSize:'0.85rem', fontWeight:'700', color:'#10b981' }}>🔒 Anti-Cheat Proctored</div>
              </div>

            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div style={{ background:'#fff', borderRadius:'16px', padding:'20px', border:'1px solid #e2e8f0', marginBottom:'20px', boxShadow:'0 2px 8px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize:'0.7rem', fontWeight:'800', color:'#94a3b8', letterSpacing:'0.12em', marginBottom:'10px' }}>OFFICIAL DISCLAIMER</div>
          <p style={{ fontSize:'0.82rem', color:'#475569', lineHeight:1.7, margin:0 }}>
            This certificate officially confirms that the above-named individual has successfully passed the PySkill Python Assessment conducted under strict anti-cheat proctored conditions. The examination was administered through a secure fullscreen environment with tab-switch detection and copy-paste prevention to ensure academic integrity. This certificate is valid for use in resumes, LinkedIn profiles, and professional portfolios as proof of Python programming proficiency. Certificate issued by <strong>PySkill</strong> at <strong>faizupyzone.shop</strong>. For verification queries, contact: <strong>luckyfaizu3@gmail.com</strong>
          </p>
        </div>

        {/* Footer */}
        <div style={{ textAlign:'center', padding:'16px' }}>
          <a href="https://faizupyzone.shop" style={{ display:'inline-flex', alignItems:'center', gap:'8px', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff', padding:'12px 28px', borderRadius:'50px', textDecoration:'none', fontWeight:'700', fontSize:'0.9rem', boxShadow:'0 6px 20px rgba(99,102,241,0.35)' }}>
            🎓 Visit faizupyzone.shop
          </a>
          <p style={{ fontSize:'0.75rem', color:'#94a3b8', marginTop:'12px' }}>
            PySkill — Premium Python Certification Platform
          </p>
        </div>

      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.4;transform:scale(1.4)} }
      `}</style>
    </div>
  );
}