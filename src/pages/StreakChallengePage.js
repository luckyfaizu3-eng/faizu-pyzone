import React, { useState, useEffect } from 'react';
import { getStreakPrice, setStreakPrice, getAllStreakUsers } from '../streakService';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import jsPDF from 'jspdf';

const ADMIN_EMAIL = 'luckyfaizu3@gmail.com';

const StreakChallengePage = ({ isDark, user, setCurrentPage, onBuy }) => {
  const [animIn,       setAnimIn]       = useState(false);
  const [mobile,       setMobile]       = useState(window.innerWidth <= 768);
  const [price,        setPrice]        = useState(99);
  const [newPrice,     setNewPrice]     = useState('99');
  const [priceMsg,     setPriceMsg]     = useState('');
  const [saving,       setSaving]       = useState(false);
  const [users,        setUsers]        = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [adminTab,     setAdminTab]     = useState('users');

  const isAdmin      = user?.email === ADMIN_EMAIL;
  const uid          = user?.uid;
  const hasPurchased = uid ? localStorage.getItem(`streak_purchased_${uid}`) : false;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    setTimeout(() => setAnimIn(true), 100);
    const h = () => setMobile(window.innerWidth <= 768);
    window.addEventListener('resize', h);
    getStreakPrice().then(p => { setPrice(p); setNewPrice(String(p)); });
    if (isAdmin) loadUsers();
    return () => window.removeEventListener('resize', h);
  }, []); // eslint-disable-line

  const loadUsers = async () => {
    setLoadingUsers(true);
    const all = await getAllStreakUsers();
    setUsers(all.sort((a, b) => (b.totalDays || 0) - (a.totalDays || 0)));
    setLoadingUsers(false);
  };

  const handlePriceUpdate = async () => {
    const p = parseInt(newPrice);
    if (!p || p < 1) { setPriceMsg('❌ Enter a valid price'); return; }
    setSaving(true);
    const ok = await setStreakPrice(p);
    if (ok) { setPrice(p); setPriceMsg('✅ Price updated to Rs.' + p); }
    else    { setPriceMsg('❌ Failed to update'); }
    setSaving(false);
    setTimeout(() => setPriceMsg(''), 3000);
  };

  const downloadUserPDF = async (u) => {
    try {
      const snap = await getDocs(query(collection(db, 'streakResults', u.uid, 'days'), orderBy('date', 'asc')));
      const days = snap.docs.map(d => d.data());
      if (!days.length) { window.showToast?.('No data for this user', 'warning'); return; }
      const doc = new jsPDF();
      const OR=[255,107,0], DARK=[17,24,39], GRAY=[107,114,128], GREEN=[34,197,94], RED=[239,68,68], AMB=[245,158,11];
      doc.setFillColor(...OR); doc.rect(0,0,210,50,'F');
      doc.setTextColor(255,255,255); doc.setFontSize(20); doc.setFont('helvetica','bold');
      doc.text('PySkill - 30-Day Python Report', 15, 20);
      doc.setFontSize(10); doc.setFont('helvetica','normal');
      doc.text('Student: '+(u.name||u.email), 15, 32);
      doc.text('Email: '+u.email, 15, 40);
      doc.setFontSize(8); doc.text('faizupyzone.shop', 160, 40);
      const totalQ=days.reduce((a,r)=>a+r.total,0), correct=days.reduce((a,r)=>a+r.score,0);
      const pct=totalQ?Math.round((correct/totalQ)*100):0;
      doc.setTextColor(...DARK); doc.setFontSize(13); doc.setFont('helvetica','bold');
      doc.text('Summary', 15, 62);
      doc.setFontSize(10); doc.setFont('helvetica','normal'); doc.setTextColor(...GRAY);
      doc.text('Sessions: '+days.length+'/30', 15, 72);
      doc.text('Total Questions: '+totalQ, 15, 80);
      doc.text('Correct: '+correct+' | Score: '+pct+'%', 15, 88);
      doc.setFillColor(229,231,235); doc.rect(15,95,180,7,'F');
      doc.setFillColor(...OR); doc.rect(15,95,(180*pct)/100,7,'F');
      const topicMap={};
      days.forEach(r=>{ if(!topicMap[r.topic])topicMap[r.topic]={score:0,total:0}; topicMap[r.topic].score+=r.score; topicMap[r.topic].total+=r.total; });
      const strong=Object.entries(topicMap).filter(([,v])=>v.total&&v.score/v.total>=0.7).map(([k])=>k);
      const weak=Object.entries(topicMap).filter(([,v])=>v.total&&v.score/v.total<0.5).map(([k])=>k);
      let y=115;
      doc.setFontSize(12); doc.setFont('helvetica','bold'); doc.setTextColor(...DARK); doc.text('Topic Analysis', 15, y); y+=10;
      doc.setFont('helvetica','bold'); doc.setTextColor(...GREEN); doc.text('STRONG (>= 70%):', 15, y); y+=8;
      doc.setFont('helvetica','normal');
      if(strong.length) strong.forEach(t=>{if(y>270){doc.addPage();y=20;} const p=Math.round((topicMap[t].score/topicMap[t].total)*100); doc.text('  '+t+' - '+p+'%',15,y); y+=7;});
      else { doc.setTextColor(...GRAY); doc.text('  None',15,y); y+=7; }
      y+=4; doc.setFont('helvetica','bold'); doc.setTextColor(...RED); doc.text('WEAK (< 50%) - Needs Revision:', 15, y); y+=8;
      doc.setFont('helvetica','normal');
      if(weak.length) weak.forEach(t=>{if(y>270){doc.addPage();y=20;} const p=Math.round((topicMap[t].score/topicMap[t].total)*100); doc.text('  '+t+' - '+p+'%',15,y); y+=7;});
      else { doc.setTextColor(...GRAY); doc.text('  None - Great job!',15,y); y+=7; }
      doc.addPage();
      doc.setFillColor(...OR); doc.rect(0,0,210,22,'F');
      doc.setTextColor(255,255,255); doc.setFontSize(13); doc.setFont('helvetica','bold'); doc.text('Day-wise Performance', 15, 14);
      y=30; const xPos=[15,28,60,118,152,172];
      doc.setFontSize(9); doc.setFillColor(...OR); doc.rect(15,y-6,180,9,'F'); doc.setTextColor(255,255,255);
      ['Day','Date','Topic','Level','Score','Pct'].forEach((h,i)=>doc.text(h,xPos[i],y)); y+=6;
      days.forEach((r,i)=>{
        if(y>272){doc.addPage();y=20;} const p=Math.round((r.score/r.total)*100);
        doc.setFillColor(...(i%2===0?[249,250,251]:[255,255,255])); doc.rect(15,y-5,180,9,'F');
        doc.setTextColor(...DARK); doc.setFont('helvetica','normal');
        doc.text(String(r.day||i+1),xPos[0],y); doc.text(r.date,xPos[1],y);
        doc.text(r.topic.substring(0,24),xPos[2],y); doc.text((r.level||'').substring(0,10),xPos[3],y);
        doc.text(r.score+'/'+r.total,xPos[4],y); doc.setTextColor(...(p>=70?GREEN:p>=50?AMB:RED)); doc.text(p+'%',xPos[5],y); y+=9;
      });
      const pages=doc.getNumberOfPages();
      for(let p=1;p<=pages;p++){doc.setPage(p); doc.setTextColor(...GRAY); doc.setFontSize(8); doc.text('PySkill - faizupyzone.shop',105,290,{align:'center'});}
      doc.save('PySkill_'+(u.name||u.email)+'_Report.pdf');
    } catch(e) { console.error(e); window.showToast?.('Failed to download PDF','error'); }
  };

  const handleBuy = () => {
    if (!user) { window.showToast?.('Please login first!', 'warning'); setCurrentPage('login'); return; }
    if (onBuy) onBuy();
  };

  const cardBg      = isDark ? 'rgba(255,255,255,0.05)' : '#ffffff';
  const border      = isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.07)';
  const textPrimary = isDark ? '#f0f2ff' : '#111827';
  const textSec     = isDark ? '#8b93a8' : '#6b7280';

  const features = [
    { icon:'🐍', title:'Daily 10 Questions', desc:'AI-generated fresh Python questions every day' },
    { icon:'🔥', title:'30-Day Streak',      desc:'Miss a day, streak resets!' },
    { icon:'📊', title:'Smart PDF Result',   desc:'Strong & weak topics after 30 days' },
    { icon:'🏆', title:'Topper Announced',   desc:'Top scorer featured on leaderboard' },
    { icon:'🤖', title:'Claude AI',          desc:'Claude generates unique questions daily' },
    { icon:'✅', title:'Instant Feedback',   desc:'Answers & explanations shown live' },
  ];

  const topics = [
    'Variables & Data Types','Loops & Conditions','Functions',
    'OOP Concepts','File Handling','Exception Handling',
    'Lists / Dicts / Sets','Modules & Packages','Decorators','APIs & JSON',
  ];

  const steps = [
    { step:'1', label:'Pay Rs.'+price, desc:'One-time, instant access' },
    { step:'2', label:'Daily Practice', desc:'10 AI questions/day' },
    { step:'3', label:'Track Streak',   desc:"Don't miss 30 days" },
    { step:'4', label:'Get Results',    desc:'PDF + Topper award' },
  ];

  return (
    <div style={{ minHeight:'100vh', background:isDark?'linear-gradient(160deg,#060b14 0%,#0d1117 50%,#0a0f1e 100%)':'linear-gradient(160deg,#f5f7ff 0%,#ffffff 50%,#fffaf5 100%)', fontFamily:"'Syne',sans-serif", color:textPrimary, paddingTop:mobile?'72px':'80px', paddingBottom:'60px', paddingLeft:mobile?'14px':'24px', paddingRight:mobile?'14px':'24px', boxSizing:'border-box', overflowX:'hidden' }}>
      <div style={{ maxWidth:'900px', margin:'0 auto', width:'100%' }}>

        {/* BADGE */}
        <div style={{ textAlign:'center', marginBottom:'12px', opacity:animIn?1:0, transition:'all 0.5s ease' }}>
          <span style={{ display:'inline-block', background:'linear-gradient(135deg,#ff6b00,#ff3d00)', color:'#fff', padding:mobile?'5px 14px':'6px 22px', borderRadius:'30px', fontSize:mobile?'0.62rem':'0.78rem', fontWeight:'800', letterSpacing:'1.5px', textTransform:'uppercase', boxShadow:'0 4px 16px rgba(255,100,0,0.35)' }}>
            🔥 30-Day Python Streak Challenge
          </span>
        </div>

        {/* TITLE */}
        <h1 style={{ textAlign:'center', fontSize:mobile?'1.7rem':'3rem', fontWeight:'900', lineHeight:'1.2', marginBottom:'10px', marginTop:0, opacity:animIn?1:0, transition:'all 0.6s ease 0.1s', background:'linear-gradient(135deg,#ff6b00 0%,#f59e0b 50%,#6366f1 100%)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
          Practice Daily.<br />Master Python in 30 Days.
        </h1>

        {/* SUBTITLE */}
        <p style={{ textAlign:'center', fontSize:mobile?'0.85rem':'1rem', color:textSec, maxWidth:'500px', margin:'0 auto 24px', lineHeight:'1.6', opacity:animIn?1:0, transition:'all 0.6s ease 0.2s' }}>
          10 AI-generated Python questions every day for 30 days.
          Get a detailed PDF result, see your weak spots, and compete for Topper.
        </p>

        {/* PRICE CARD */}
        <div style={{ background:isDark?'linear-gradient(135deg,rgba(255,107,0,0.13),rgba(99,102,241,0.1))':'linear-gradient(135deg,rgba(255,107,0,0.07),rgba(99,102,241,0.05))', border:`2px solid ${isDark?'rgba(255,107,0,0.28)':'rgba(255,107,0,0.18)'}`, borderRadius:'20px', padding:mobile?'22px 16px':'40px 50px', textAlign:'center', marginBottom:'28px', boxShadow:'0 16px 50px rgba(255,107,0,0.12)', opacity:animIn?1:0, transition:'all 0.7s ease 0.3s' }}>
          <div style={{ fontSize:'0.72rem', color:textSec, marginBottom:'6px', letterSpacing:'1px', textTransform:'uppercase' }}>One-Time Payment</div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:'10px', marginBottom:'6px' }}>
            <span style={{ fontSize:'1rem', color:textSec, textDecoration:'line-through' }}>Rs.{price * 2}</span>
            <span style={{ fontSize:mobile?'2.6rem':'4rem', fontWeight:'900', lineHeight:1, background:'linear-gradient(135deg,#ff6b00,#f59e0b)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
              Rs.{price}
            </span>
          </div>
          <div style={{ fontSize:'0.78rem', color:textSec, marginBottom:'20px' }}>Full 30-day access • PDF Result • Topper competition</div>

          {hasPurchased ? (
            <button onClick={() => setCurrentPage('streak-practice')} style={{ background:'linear-gradient(135deg,#22c55e,#16a34a)', color:'#fff', border:'none', borderRadius:'12px', padding:'14px 0', width:'100%', fontSize:'1rem', fontWeight:'800', cursor:'pointer', boxShadow:'0 8px 20px rgba(34,197,94,0.35)' }}>
              🔥 Go to Today's Practice →
            </button>
          ) : (
            <button onClick={handleBuy} style={{ background:'linear-gradient(135deg,#ff6b00,#ff3d00)', color:'#fff', border:'none', borderRadius:'12px', padding:'14px 0', width:'100%', fontSize:'1rem', fontWeight:'800', cursor:'pointer', boxShadow:'0 8px 20px rgba(255,107,0,0.4)' }}>
              🚀 Start Challenge — Rs.{price} Only
            </button>
          )}

          <div style={{ display:'flex', justifyContent:'center', gap:'12px', marginTop:'12px', flexWrap:'wrap' }}>
            {['Secure Payment','Instant Access','30-Day Access'].map(t => (
              <span key={t} style={{ fontSize:'0.68rem', color:textSec }}>{t}</span>
            ))}
          </div>
        </div>

        {/* FEATURES */}
        <h2 style={{ textAlign:'center', fontSize:mobile?'1.05rem':'1.4rem', fontWeight:'800', marginBottom:'12px', marginTop:0, opacity:animIn?1:0, transition:'all 0.6s ease 0.4s' }}>What you get 👇</h2>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:mobile?'8px':'12px', marginBottom:'24px', opacity:animIn?1:0, transition:'all 0.7s ease 0.5s' }}>
          {features.map((f,i) => (
            <div key={i} style={{ background:cardBg, border:`1px solid ${border}`, borderRadius:'12px', padding:mobile?'12px 8px':'18px', textAlign:'center' }}>
              <div style={{ fontSize:mobile?'1.4rem':'1.8rem', marginBottom:'6px' }}>{f.icon}</div>
              <div style={{ fontWeight:'700', fontSize:mobile?'0.68rem':'0.88rem', marginBottom:'3px', lineHeight:'1.3' }}>{f.title}</div>
              {!mobile && <div style={{ fontSize:'0.76rem', color:textSec, lineHeight:'1.35' }}>{f.desc}</div>}
            </div>
          ))}
        </div>

        {/* TOPICS */}
        <div style={{ background:cardBg, border:`1px solid ${border}`, borderRadius:'16px', padding:mobile?'16px 12px':'26px 32px', marginBottom:'24px', opacity:animIn?1:0, transition:'all 0.7s ease 0.6s' }}>
          <h3 style={{ fontWeight:'800', fontSize:mobile?'0.88rem':'1rem', marginBottom:'12px', textAlign:'center', marginTop:0 }}>📚 Topics Covered in 30 Days</h3>
          <div style={{ display:'flex', flexWrap:'wrap', gap:'6px', justifyContent:'center' }}>
            {topics.map((t,i) => (
              <span key={i} style={{ background:isDark?'rgba(255,107,0,0.1)':'rgba(255,107,0,0.07)', border:'1px solid rgba(255,107,0,0.22)', color:'#ff6b00', padding:mobile?'3px 9px':'5px 12px', borderRadius:'20px', fontSize:mobile?'0.65rem':'0.76rem', fontWeight:'600' }}>{t}</span>
            ))}
          </div>
        </div>

        {/* HOW IT WORKS */}
        <h2 style={{ textAlign:'center', fontSize:mobile?'1.05rem':'1.4rem', fontWeight:'800', marginBottom:'12px', marginTop:0, opacity:animIn?1:0, transition:'all 0.7s ease 0.65s' }}>How it works</h2>
        {mobile ? (
          <div style={{ display:'flex', flexDirection:'column', gap:'10px', marginBottom:'28px', opacity:animIn?1:0, transition:'all 0.7s ease 0.7s' }}>
            {steps.map((s,i) => (
              <div key={i} style={{ background:cardBg, border:`1px solid ${border}`, borderRadius:'14px', padding:'14px 16px', display:'flex', alignItems:'center', gap:'14px' }}>
                <div style={{ width:'40px', height:'40px', flexShrink:0, borderRadius:'50%', background:'linear-gradient(135deg,#ff6b00,#f59e0b)', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'900', fontSize:'1rem', color:'#fff' }}>{s.step}</div>
                <div>
                  <div style={{ fontWeight:'700', fontSize:'0.9rem', marginBottom:'2px' }}>{s.label}</div>
                  <div style={{ fontSize:'0.75rem', color:textSec }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'12px', marginBottom:'28px', opacity:animIn?1:0, transition:'all 0.7s ease 0.7s' }}>
            {steps.map((s,i) => (
              <div key={i} style={{ background:cardBg, border:`1px solid ${border}`, borderRadius:'16px', padding:'18px', textAlign:'center' }}>
                <div style={{ width:'40px', height:'40px', borderRadius:'50%', background:'linear-gradient(135deg,#ff6b00,#f59e0b)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 10px', fontWeight:'900', fontSize:'1rem', color:'#fff' }}>{s.step}</div>
                <div style={{ fontWeight:'700', fontSize:'0.85rem', marginBottom:'4px' }}>{s.label}</div>
                <div style={{ fontSize:'0.72rem', color:textSec }}>{s.desc}</div>
              </div>
            ))}
          </div>
        )}

        {/* BOTTOM CTA — only for non-purchased users */}
        {!hasPurchased && (
          <div style={{ textAlign:'center', opacity:animIn?1:0, transition:'all 0.7s ease 0.8s', marginBottom: isAdmin?'40px':'0' }}>
            <button onClick={handleBuy} style={{ background:'linear-gradient(135deg,#ff6b00,#ff3d00)', color:'#fff', border:'none', borderRadius:'12px', padding:'14px 0', width:mobile?'100%':'320px', fontSize:'1rem', fontWeight:'800', cursor:'pointer', boxShadow:'0 8px 28px rgba(255,107,0,0.4)' }}>
              🔥 Join the Challenge — Rs.{price}
            </button>
            <p style={{ marginTop:'8px', fontSize:'0.74rem', color:textSec }}>Limited seats • New batch starts soon</p>
          </div>
        )}

        {/* ══════════════════════════════════════════════
            ADMIN PANEL — only visible to admin
            ══════════════════════════════════════════════ */}
        {isAdmin && (
          <div style={{ marginTop:'48px' }}>

            {/* Admin divider */}
            <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'24px' }}>
              <div style={{ flex:1, height:'1px', background:isDark?'rgba(255,255,255,0.1)':'rgba(0,0,0,0.08)' }}/>
              <span style={{ background:'linear-gradient(135deg,#6366f1,#4f46e5)', color:'#fff', padding:'5px 16px', borderRadius:'20px', fontSize:'0.72rem', fontWeight:'800', letterSpacing:'1.5px', whiteSpace:'nowrap' }}>
                🛡️ ADMIN PANEL
              </span>
              <div style={{ flex:1, height:'1px', background:isDark?'rgba(255,255,255,0.1)':'rgba(0,0,0,0.08)' }}/>
            </div>

            {/* Admin Stats */}
            <div style={{ display:'grid', gridTemplateColumns:mobile?'repeat(2,1fr)':'repeat(4,1fr)', gap:'12px', marginBottom:'20px' }}>
              {[
                { label:'Total Users',       value:users.length,                                 color:'#ff6b00' },
                { label:'Active (>5 days)',  value:users.filter(u=>(u.totalDays||0)>5).length,   color:'#6366f1' },
                { label:'Completed 30',      value:users.filter(u=>(u.totalDays||0)>=30).length, color:'#22c55e' },
                { label:'Current Price',     value:'Rs.'+price,                                  color:'#f59e0b' },
              ].map((s,i) => (
                <div key={i} style={{ background:cardBg, border:`1px solid ${border}`, borderRadius:'14px', padding:'16px', textAlign:'center' }}>
                  <div style={{ fontSize:'1.5rem', fontWeight:'900', color:s.color }}>{s.value}</div>
                  <div style={{ fontSize:'0.68rem', color:textSec, marginTop:'3px' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Admin Tabs */}
            <div style={{ display:'flex', gap:'8px', marginBottom:'18px' }}>
              {[{id:'users',label:'👥 Users & PDFs'},{id:'price',label:'💰 Price Settings'}].map(tab => (
                <button key={tab.id} onClick={() => setAdminTab(tab.id)} style={{ padding:'9px 20px', borderRadius:'12px', border:'none', fontWeight:'700', fontSize:'0.88rem', cursor:'pointer', fontFamily:'inherit', background:adminTab===tab.id?'linear-gradient(135deg,#6366f1,#4f46e5)':cardBg, color:adminTab===tab.id?'#fff':textSec, boxShadow:adminTab===tab.id?'0 4px 12px rgba(99,102,241,0.35)':'none', transition:'all 0.2s' }}>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* USERS TAB */}
            {adminTab === 'users' && (
              <div style={{ background:cardBg, border:`1px solid ${border}`, borderRadius:'16px', overflow:'hidden' }}>
                <div style={{ padding:'14px 20px', borderBottom:`1px solid ${border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontWeight:'800', fontSize:'0.92rem' }}>All Participants ({users.length})</span>
                  <button onClick={loadUsers} style={{ background:'transparent', border:`1px solid ${border}`, borderRadius:'8px', padding:'5px 12px', cursor:'pointer', color:textSec, fontSize:'0.78rem', fontFamily:'inherit' }}>
                    🔄 Refresh
                  </button>
                </div>
                {loadingUsers ? (
                  <div style={{ padding:'32px', textAlign:'center', color:textSec }}>Loading users...</div>
                ) : users.length === 0 ? (
                  <div style={{ padding:'32px', textAlign:'center', color:textSec }}>No users yet — waiting for first payment</div>
                ) : (
                  <div style={{ overflowX:'auto' }}>
                    <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.83rem' }}>
                      <thead>
                        <tr style={{ background:isDark?'rgba(99,102,241,0.08)':'rgba(99,102,241,0.05)' }}>
                          {['#','Name','Email','Days','Progress','PDF'].map(h => (
                            <th key={h} style={{ padding:'11px 14px', textAlign:'left', fontWeight:'700', color:'#6366f1', whiteSpace:'nowrap' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {users.map((u,i) => (
                          <tr key={i} style={{ borderBottom:`1px solid ${border}` }}>
                            <td style={{ padding:'11px 14px', fontWeight:'800', color:i===0?'#f59e0b':i===1?'#94a3b8':i===2?'#f97316':textSec }}>
                              {i===0?'🥇':i===1?'🥈':i===2?'🥉':'#'+(i+1)}
                            </td>
                            <td style={{ padding:'11px 14px', fontWeight:'600', color:textPrimary }}>{u.name||'—'}</td>
                            <td style={{ padding:'11px 14px', color:textSec, fontSize:'0.75rem' }}>{u.email}</td>
                            <td style={{ padding:'11px 14px', fontWeight:'700', color:'#ff6b00' }}>{u.totalDays||0}/30</td>
                            <td style={{ padding:'11px 14px', minWidth:'120px' }}>
                              <div style={{ height:'5px', background:isDark?'rgba(255,255,255,0.08)':'#e5e7eb', borderRadius:'10px', overflow:'hidden' }}>
                                <div style={{ height:'100%', width:`${Math.min(((u.totalDays||0)/30)*100,100)}%`, background:'linear-gradient(90deg,#6366f1,#8b5cf6)', borderRadius:'10px' }}/>
                              </div>
                              <div style={{ fontSize:'0.62rem', color:textSec, marginTop:'2px' }}>{Math.round(((u.totalDays||0)/30)*100)}%</div>
                            </td>
                            <td style={{ padding:'11px 14px' }}>
                              <button onClick={() => downloadUserPDF(u)} style={{ background:'rgba(99,102,241,0.12)', border:'1px solid rgba(99,102,241,0.3)', color:'#6366f1', borderRadius:'8px', padding:'5px 12px', fontSize:'0.75rem', fontWeight:'700', cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap' }}>
                                📥 PDF
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* PRICE TAB */}
            {adminTab === 'price' && (
              <div style={{ display:'grid', gridTemplateColumns:mobile?'1fr':'1fr 1fr', gap:'16px' }}>
                <div style={{ background:cardBg, border:`1px solid ${border}`, borderRadius:'20px', padding:'24px' }}>
                  <h3 style={{ fontSize:'1.1rem', fontWeight:'900', margin:'0 0 6px' }}>💰 Change Price</h3>
                  <p style={{ color:textSec, fontSize:'0.82rem', margin:'0 0 20px' }}>Updates immediately for all users.</p>
                  <div style={{ marginBottom:'14px' }}>
                    <div style={{ fontSize:'0.72rem', color:textSec, fontWeight:'600', marginBottom:'4px' }}>Current Price</div>
                    <div style={{ fontSize:'2rem', fontWeight:'900', background:'linear-gradient(135deg,#ff6b00,#f59e0b)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>Rs.{price}</div>
                  </div>
                  <div style={{ display:'flex', gap:'10px', marginBottom:'14px' }}>
                    <input type="number" value={newPrice} onChange={e => setNewPrice(e.target.value)} placeholder="New price"
                      style={{ flex:1, padding:'11px 14px', background:isDark?'rgba(255,255,255,0.05)':'#f9fafb', border:`1px solid ${border}`, borderRadius:'12px', fontSize:'1rem', fontWeight:'700', color:textPrimary, outline:'none', fontFamily:'inherit' }}
                    />
                    <button onClick={handlePriceUpdate} disabled={saving} style={{ padding:'11px 20px', background:saving?'#6b7280':'linear-gradient(135deg,#ff6b00,#ff3d00)', color:'#fff', border:'none', borderRadius:'12px', fontSize:'0.9rem', fontWeight:'800', cursor:saving?'wait':'pointer', boxShadow:'0 6px 16px rgba(255,107,0,0.35)', fontFamily:'inherit' }}>
                      {saving ? 'Saving...' : 'Update'}
                    </button>
                  </div>
                  {priceMsg && (
                    <div style={{ padding:'10px 14px', background:priceMsg.includes('✅')?'rgba(34,197,94,0.1)':'rgba(239,68,68,0.1)', border:`1px solid ${priceMsg.includes('✅')?'rgba(34,197,94,0.3)':'rgba(239,68,68,0.3)'}`, borderRadius:'10px', fontSize:'0.82rem', fontWeight:'600', color:priceMsg.includes('✅')?'#22c55e':'#ef4444' }}>
                      {priceMsg}
                    </div>
                  )}
                </div>

                <div style={{ background:cardBg, border:`1px solid ${border}`, borderRadius:'20px', padding:'24px' }}>
                  <h3 style={{ fontSize:'1.1rem', fontWeight:'900', margin:'0 0 14px' }}>⚡ Quick Presets</h3>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:'8px' }}>
                    {[29,49,99,149,199,299].map(p => (
                      <button key={p} onClick={() => setNewPrice(String(p))} style={{ padding:'10px 18px', background:newPrice===String(p)?'rgba(255,107,0,0.15)':'transparent', border:`1px solid ${newPrice===String(p)?'rgba(255,107,0,0.4)':border}`, borderRadius:'10px', color:newPrice===String(p)?'#ff6b00':textSec, fontSize:'0.92rem', fontWeight:'700', cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s' }}>
                        Rs.{p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
};

export default StreakChallengePage;