import React, { useState, useEffect } from 'react';
import { getAllStreakUsers, getStreakPrice, setStreakPrice } from '../streakService';
import jsPDF from 'jspdf';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';


const AdminStreak = ({ isMobile, isDark }) => {
  const [users,       setUsers]       = useState([]);
  const [price,       setPrice]       = useState(99);
  const [newPrice,    setNewPrice]    = useState('');
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);
  const [priceMsg,    setPriceMsg]    = useState('');
  const [activeTab,   setActiveTab]   = useState('users');

  const textPrimary = isDark ? '#f0f2ff' : '#111827';
  const textSec     = isDark ? '#8b93a8' : '#6b7280';
  const cardBg      = isDark ? 'rgba(255,255,255,0.04)' : '#ffffff';
  const border      = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)';
  const pageBg      = isDark ? 'linear-gradient(160deg,#060b14,#0d1117)' : '#f5f7ff';

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const [allUsers, currentPrice] = await Promise.all([
      getAllStreakUsers(),
      getStreakPrice(),
    ]);
    setUsers(allUsers.sort((a,b) => (b.totalDays||0) - (a.totalDays||0)));
    setPrice(currentPrice);
    setNewPrice(String(currentPrice));
    setLoading(false);
  };

  const handlePriceUpdate = async () => {
    const p = parseInt(newPrice);
    if (!p || p < 1) { setPriceMsg('❌ Enter a valid price'); return; }
    setSaving(true);
    const ok = await setStreakPrice(p);
    if (ok) {
      setPrice(p);
      setPriceMsg(`✅ Price updated to ₹${p}`);
      // Also update StreakChallengePage — it reads from Firestore
    } else {
      setPriceMsg('❌ Failed to update price');
    }
    setSaving(false);
    setTimeout(() => setPriceMsg(''), 3000);
  };

  // Download a specific user's PDF
  const downloadUserPDF = async (u) => {
    try {
      const snap = await getDocs(
        query(collection(db, 'streakResults', u.uid, 'days'), orderBy('date', 'asc'))
      );
      const days = snap.docs.map(d => d.data());
      if (!days.length) { window.showToast?.('No data for this user', 'warning'); return; }

      // Simple PDF
      const doc    = new jsPDF();
      const OR     = [255, 107, 0];
      const DARK   = [17, 24, 39];
      const GRAY   = [107, 114, 128];
      const GREEN  = [34, 197, 94];
      const RED    = [239, 68, 68];
      const AMB    = [245, 158, 11];

      doc.setFillColor(...OR); doc.rect(0,0,210,44,'F');
      doc.setTextColor(255,255,255);
      doc.setFontSize(18); doc.setFont('helvetica','bold');
      doc.text('PySkill — Student Report', 15, 18);
      doc.setFontSize(10); doc.setFont('helvetica','normal');
      doc.text(`Student: ${u.name||u.email}`, 15, 28);
      doc.text(`Email: ${u.email}`, 15, 36);
      doc.setFontSize(8); doc.text('faizupyzone.shop', 160, 38);

      const totalQ  = days.reduce((a,r)=>a+r.total,0);
      const correct = days.reduce((a,r)=>a+r.score,0);
      const pct     = totalQ ? Math.round((correct/totalQ)*100) : 0;

      doc.setTextColor(...DARK); doc.setFontSize(12); doc.setFont('helvetica','bold');
      doc.text('Summary', 15, 56);
      doc.setFontSize(10); doc.setFont('helvetica','normal'); doc.setTextColor(...GRAY);
      doc.text(`Sessions: ${days.length}/30`, 15, 64);
      doc.text(`Overall: ${pct}%`, 15, 72);

      // Day table
      let y = 88;
      doc.setFillColor(...OR); doc.rect(15,y-6,180,9,'F');
      doc.setTextColor(255,255,255); doc.setFontSize(9);
      ['Day','Date','Topic','Score','%'].forEach((h,i)=>doc.text(h,[15,28,60,150,170][i],y));
      y += 6;
      days.forEach((r,i)=>{
        if(y>272){doc.addPage();y=20;}
        const p=Math.round((r.score/r.total)*100);
        doc.setFillColor(...(i%2===0?[249,250,251]:[255,255,255]));
        doc.rect(15,y-5,180,9,'F');
        doc.setTextColor(...DARK); doc.setFont('helvetica','normal');
        doc.text(`${r.day||i+1}`,[15][0],y);
        doc.text(r.date,28,y);
        doc.text(r.topic.substring(0,30),60,y);
        doc.text(`${r.score}/${r.total}`,150,y);
        doc.setTextColor(...(p>=70?GREEN:p>=50?AMB:RED));
        doc.text(`${p}%`,170,y);
        y+=9;
      });

      const pages = doc.getNumberOfPages();
      for(let p=1;p<=pages;p++){
        doc.setPage(p); doc.setTextColor(...GRAY); doc.setFontSize(8);
        doc.text('PySkill — faizupyzone.shop', 105, 290, {align:'center'});
      }
      doc.save(`PySkill_${u.name||u.email}_Report.pdf`);
    } catch(e) {
      console.error(e);
      window.showToast?.('Failed to download PDF', 'error');
    }
  };

  if (loading) return (
    <div style={{minHeight:'100vh',background:pageBg,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'Syne',sans-serif"}}>
      <div style={{color:textPrimary,fontWeight:'700'}}>Loading admin data...</div>
    </div>
  );

  return (
    <div style={{minHeight:'100vh',background:pageBg,fontFamily:"'Syne',sans-serif",color:textPrimary,padding:isMobile?'80px 16px 40px':'100px 40px 60px',boxSizing:'border-box'}}>
      <div style={{maxWidth:'900px',margin:'0 auto'}}>

        {/* Header */}
        <div style={{marginBottom:'28px'}}>
          <span style={{background:'linear-gradient(135deg,#ff6b00,#ff3d00)',color:'#fff',padding:'4px 14px',borderRadius:'20px',fontSize:'0.72rem',fontWeight:'800',letterSpacing:'1.5px'}}>ADMIN PANEL</span>
          <h1 style={{fontSize:isMobile?'1.5rem':'2rem',fontWeight:'900',marginTop:'10px',marginBottom:'4px'}}>🛡️ Streak Admin</h1>
          <p style={{color:textSec,fontSize:'0.88rem',margin:0}}>Manage users, change price, download PDFs</p>
        </div>

        {/* Tabs */}
        <div style={{display:'flex',gap:'8px',marginBottom:'24px'}}>
          {[{id:'users',label:'👥 Users'},{id:'price',label:'💰 Price Settings'}].map(tab=>(
            <button key={tab.id} onClick={()=>setActiveTab(tab.id)} style={{padding:'8px 20px',borderRadius:'12px',border:'none',fontWeight:'700',fontSize:'0.88rem',cursor:'pointer',fontFamily:'inherit',background:activeTab===tab.id?'linear-gradient(135deg,#ff6b00,#ff3d00)':cardBg,color:activeTab===tab.id?'#fff':textSec,boxShadow:activeTab===tab.id?'0 4px 12px rgba(255,107,0,0.35)':'none',transition:'all 0.2s'}}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* USERS TAB */}
        {activeTab === 'users' && (
          <>
            {/* Stats */}
            <div style={{display:'grid',gridTemplateColumns:isMobile?'repeat(2,1fr)':'repeat(4,1fr)',gap:'12px',marginBottom:'24px'}}>
              {[
                {label:'Total Users',    value:users.length,                                          color:'#ff6b00'},
                {label:'Active (>5 days)',value:users.filter(u=>(u.totalDays||0)>5).length,           color:'#6366f1'},
                {label:'Completed 30',  value:users.filter(u=>(u.totalDays||0)>=30).length,           color:'#22c55e'},
                {label:'Revenue',       value:`₹${users.length*price}`,                              color:'#f59e0b'},
              ].map((s,i)=>(
                <div key={i} style={{background:cardBg,border:`1px solid ${border}`,borderRadius:'14px',padding:'16px',textAlign:'center'}}>
                  <div style={{fontSize:'1.5rem',fontWeight:'900',color:s.color}}>{s.value}</div>
                  <div style={{fontSize:'0.7rem',color:textSec,marginTop:'3px'}}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Users Table */}
            <div style={{background:cardBg,border:`1px solid ${border}`,borderRadius:'16px',overflow:'hidden'}}>
              <div style={{padding:'16px 20px',borderBottom:`1px solid ${border}`,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                <span style={{fontWeight:'800',fontSize:'0.95rem'}}>All Participants ({users.length})</span>
                <span style={{fontSize:'0.78rem',color:textSec}}>Sorted by progress</span>
              </div>
              <div style={{overflowX:'auto'}}>
                <table style={{width:'100%',borderCollapse:'collapse',fontSize:'0.85rem'}}>
                  <thead>
                    <tr style={{background:isDark?'rgba(255,107,0,0.08)':'rgba(255,107,0,0.05)'}}>
                      {['#','Name','Email','Days','Progress','PDF'].map(h=>(
                        <th key={h} style={{padding:'12px 14px',textAlign:'left',fontWeight:'700',color:'#ff6b00',whiteSpace:'nowrap'}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr><td colSpan={6} style={{padding:'32px',textAlign:'center',color:textSec}}>No users yet</td></tr>
                    ) : users.map((u,i)=>(
                      <tr key={i} style={{borderBottom:`1px solid ${border}`}}>
                        <td style={{padding:'12px 14px',fontWeight:'800',color:i===0?'#f59e0b':i===1?'#94a3b8':i===2?'#f97316':textSec}}>
                          {i===0?'🥇':i===1?'🥈':i===2?'🥉':`#${i+1}`}
                        </td>
                        <td style={{padding:'12px 14px',fontWeight:'600',color:textPrimary}}>{u.name||'—'}</td>
                        <td style={{padding:'12px 14px',color:textSec,fontSize:'0.78rem'}}>{u.email}</td>
                        <td style={{padding:'12px 14px',fontWeight:'700',color:'#ff6b00'}}>{u.totalDays||0}/30</td>
                        <td style={{padding:'12px 14px',minWidth:'120px'}}>
                          <div style={{height:'6px',background:isDark?'rgba(255,255,255,0.08)':'#e5e7eb',borderRadius:'10px',overflow:'hidden'}}>
                            <div style={{height:'100%',width:`${Math.min(((u.totalDays||0)/30)*100,100)}%`,background:'linear-gradient(90deg,#ff6b00,#f59e0b)',borderRadius:'10px'}}/>
                          </div>
                          <div style={{fontSize:'0.65rem',color:textSec,marginTop:'3px'}}>{Math.round(((u.totalDays||0)/30)*100)}%</div>
                        </td>
                        <td style={{padding:'12px 14px'}}>
                          <button onClick={()=>downloadUserPDF(u)} style={{background:'rgba(99,102,241,0.12)',border:'1px solid rgba(99,102,241,0.3)',color:'#6366f1',borderRadius:'8px',padding:'5px 12px',fontSize:'0.75rem',fontWeight:'700',cursor:'pointer',fontFamily:'inherit',whiteSpace:'nowrap'}}>
                            📥 PDF
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* PRICE TAB */}
        {activeTab === 'price' && (
          <div style={{maxWidth:'480px'}}>
            <div style={{background:cardBg,border:`1px solid ${border}`,borderRadius:'20px',padding:'28px',marginBottom:'20px'}}>
              <h2 style={{fontSize:'1.2rem',fontWeight:'900',marginBottom:'6px',marginTop:0}}>💰 Challenge Price</h2>
              <p style={{color:textSec,fontSize:'0.85rem',marginBottom:'24px',marginTop:0}}>
                Change the price users pay to join the 30-day challenge. Updates immediately.
              </p>

              <div style={{marginBottom:'16px'}}>
                <div style={{fontSize:'0.78rem',color:textSec,fontWeight:'600',marginBottom:'8px'}}>Current Price</div>
                <div style={{fontSize:'2.5rem',fontWeight:'900',background:'linear-gradient(135deg,#ff6b00,#f59e0b)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent'}}>₹{price}</div>
              </div>

              <div style={{marginBottom:'16px'}}>
                <div style={{fontSize:'0.78rem',color:textSec,fontWeight:'600',marginBottom:'8px'}}>Set New Price (₹)</div>
                <div style={{display:'flex',gap:'10px'}}>
                  <input
                    type="number" value={newPrice} onChange={e=>setNewPrice(e.target.value)}
                    placeholder="e.g. 149"
                    style={{flex:1,padding:'12px 14px',background:isDark?'rgba(255,255,255,0.05)':'#f9fafb',border:`1px solid ${border}`,borderRadius:'12px',fontSize:'1rem',fontWeight:'700',color:textPrimary,outline:'none',fontFamily:'inherit'}}
                  />
                  <button onClick={handlePriceUpdate} disabled={saving} style={{padding:'12px 24px',background:saving?'#6b7280':'linear-gradient(135deg,#ff6b00,#ff3d00)',color:'#fff',border:'none',borderRadius:'12px',fontSize:'0.95rem',fontWeight:'800',cursor:saving?'wait':'pointer',whiteSpace:'nowrap',boxShadow:'0 6px 16px rgba(255,107,0,0.35)'}}>
                    {saving?'Saving...':'Update'}
                  </button>
                </div>
              </div>

              {priceMsg && (
                <div style={{padding:'10px 14px',background:priceMsg.includes('✅')?'rgba(34,197,94,0.1)':'rgba(239,68,68,0.1)',border:`1px solid ${priceMsg.includes('✅')?'rgba(34,197,94,0.3)':'rgba(239,68,68,0.3)'}`,borderRadius:'10px',fontSize:'0.85rem',fontWeight:'600',color:priceMsg.includes('✅')?'#22c55e':'#ef4444'}}>
                  {priceMsg}
                </div>
              )}
            </div>

            {/* Quick presets */}
            <div style={{background:cardBg,border:`1px solid ${border}`,borderRadius:'16px',padding:'20px'}}>
              <div style={{fontWeight:'700',fontSize:'0.88rem',marginBottom:'14px'}}>Quick Presets</div>
              <div style={{display:'flex',flexWrap:'wrap',gap:'8px'}}>
                {[49,99,149,199,299].map(p=>(
                  <button key={p} onClick={()=>setNewPrice(String(p))} style={{padding:'8px 16px',background:newPrice===String(p)?'rgba(255,107,0,0.15)':'transparent',border:`1px solid ${newPrice===String(p)?'rgba(255,107,0,0.4)':border}`,borderRadius:'10px',color:newPrice===String(p)?'#ff6b00':textSec,fontSize:'0.88rem',fontWeight:'700',cursor:'pointer',fontFamily:'inherit',transition:'all 0.15s'}}>
                    ₹{p}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminStreak;