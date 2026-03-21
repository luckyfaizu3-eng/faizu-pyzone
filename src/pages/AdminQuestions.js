import React, { useState, useRef, useEffect } from 'react';
import { Plus, Save, Trash2, Code, X, Clock, AlertTriangle, Edit2, IndianRupee, Tag, ToggleLeft, ToggleRight, Upload, FileText, BookOpen } from 'lucide-react';
import { db } from '../firebase';
import {
  collection, addDoc, getDocs, deleteDoc,
  doc, query, where, updateDoc, setDoc, getDoc,
  orderBy, serverTimestamp
} from 'firebase/firestore';

const MAX_QUESTIONS = 60;
const TIME_LIMITS = { basic: 60, advanced: 120, pro: 180 };
const DEFAULT_PRICES = { basic: 99, advanced: 199, pro: 299 };
const AI_API_URL = 'https://white-limit-e2fe.luckyfaizu3.workers.dev/chat';

const LEVEL_COLORS = {
  basic:    { bg: '#eff6ff', border: '#3b82f6', text: '#1d4ed8', badge: '#dbeafe', color: '#6366f1' },
  advanced: { bg: '#fdf4ff', border: '#a855f7', text: '#7e22ce', badge: '#f3e8ff', color: '#a855f7' },
  pro:      { bg: '#fff7ed', border: '#f97316', text: '#c2410c', badge: '#ffedd5', color: '#f97316' }
};

const MAIN_TABS = [
  { id: 'python',  label: '🐍 Python Tests' },
  { id: 'exams',   label: '🎯 Custom Exams' },
  { id: 'coupons', label: '🎟️ Coupons' },
  { id: 'ai',      label: '🤖 AI Assistant' },
];

// ── SSE streaming AI call ─────────────────────────────────────────────────────
async function callAI(messages) {
  const res = await fetch(AI_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, temperature: 0.7, max_tokens: 4000 })
  });
  if (!res.ok) throw new Error('API Error: ' + res.status);

  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('text/event-stream')) {
    const d = await res.json();
    return d.message || d.content || d.choices?.[0]?.message?.content || '';
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let text = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    for (const line of decoder.decode(value, { stream: true }).split('\n')) {
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (data === '[DONE]') continue;
      try { text += JSON.parse(data).choices?.[0]?.delta?.content || ''; } catch { }
    }
  }
  return text;
}


// ==========================================
// 🤖 AI ASSISTANT TAB
// ==========================================
function AIAssistantTab({ isMobile }) {
  const [messages, setMessages] = useState([{
    role: 'assistant',
    content: `👋 Hi! I'm your Admin AI Assistant with full access to your database.

I can help you with everything:

📝 **Questions**
• "Add a basic Python question about list slicing with 4 options"
• "Edit Q5 in basic — change the correct answer to option 2"
• "Delete Q12 from advanced"
• "Check all basic questions for errors"
• "Show me all pro questions"

🎟️ **Coupons**
• "Create a coupon FREE100 for 100% off"
• "Make a coupon SAVE50 for ₹50 flat discount"
• "Show all active coupons"
• "Deactivate coupon SAVE20"

💰 **Prices**
• "Set basic test price to ₹149"
• "Enable sale on advanced — sale price ₹99"

Just tell me what you want and I'll do it!`
  }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const fetchAllData = async () => {
    const data = {};

    // Python questions
    for (const level of ['basic', 'advanced', 'pro']) {
      const snap = await getDocs(query(
        collection(db, 'manualQuestions'),
        where('level', '==', level),
        where('source', '==', 'manual')
      ));
      data[level + '_questions'] = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (a.position || 0) - (b.position || 0))
        .map((q, i) => ({
          num: i + 1,
          id: q.id,
          question: q.question,
          code: q.code || '',
          options: q.options,
          correct: q.correct,
          correctAnswer: q.options?.[q.correct]
        }));
    }

    // Coupons
    const cSnap = await getDocs(collection(db, 'coupons'));
    data.coupons = cSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Prices
    try {
      const priceDoc = await getDoc(doc(db, 'settings', 'testPrices'));
      if (priceDoc.exists()) data.prices = priceDoc.data();
    } catch { data.prices = {}; }

    return data;
  };

  const applyChanges = async (changes) => {
    let u = 0, d = 0, a = 0;
    for (const ch of changes) {
      try {
        if (ch.action === 'add_question' && ch.data) {
          const level = ch.data.level || 'basic';
          const snap = await getDocs(query(
            collection(db, 'manualQuestions'),
            where('level', '==', level),
            where('source', '==', 'manual')
          ));
          await addDoc(collection(db, 'manualQuestions'), {
            question: ch.data.question || '',
            code: ch.data.code || '',
            options: ch.data.options || [],
            correct: ch.data.correct ?? 0,
            level,
            source: 'manual',
            position: snap.docs.length + 1,
            createdAt: new Date().toISOString()
          });
          a++;
        } else if (ch.action === 'update_question' && ch.id) {
          await updateDoc(doc(db, 'manualQuestions', ch.id), {
            ...ch.data,
            updatedAt: new Date().toISOString()
          });
          u++;
        } else if (ch.action === 'delete_question' && ch.id) {
          await deleteDoc(doc(db, 'manualQuestions', ch.id));
          d++;
        } else if (ch.action === 'add_coupon' && ch.data) {
          const code = (ch.data.code || '').toUpperCase();
          await setDoc(doc(db, 'coupons', code), {
            code,
            discount: ch.data.discount || 10,
            type: ch.data.type || 'percentage',
            scope: ch.data.scope || 'global',
            expiry: ch.data.expiry || null,
            usageLimit: ch.data.usageLimit || 9999,
            usedCount: 0,
            active: true,
            createdAt: serverTimestamp()
          });
          a++;
        } else if (ch.action === 'update_coupon' && ch.id) {
          await updateDoc(doc(db, 'coupons', ch.id), ch.data);
          u++;
        } else if (ch.action === 'delete_coupon' && ch.id) {
          await deleteDoc(doc(db, 'coupons', ch.id));
          d++;
        } else if (ch.action === 'update_prices' && ch.data) {
          await setDoc(doc(db, 'settings', 'testPrices'), ch.data, { merge: true });
          u++;
        }
      } catch (e) {
        console.error('Change failed:', ch, e);
      }
    }
    return { added: a, updated: u, deleted: d };
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setLoading(true);

    const updated = [...messages, { role: 'user', content: userMsg }];
    setMessages(updated);

    try {
      const dbData = await fetchAllData();

      const systemPrompt = `You are an AI admin assistant for PySkill — a Python learning platform.
You have FULL access to the database and can make any changes the admin asks for.

CURRENT DATABASE STATE:
${JSON.stringify(dbData, null, 2)}

CAPABILITIES:
- Add, edit, delete Python questions (basic/advanced/pro)
- Create, update, delete coupons
- Update test prices and sale prices
- Review questions for errors, duplicates, wrong answers
- Answer any question about the current data

When you need to make database changes, include a <CHANGES> block at the END of your response:
<CHANGES>
[
  {"action":"add_question","data":{"level":"basic","question":"...","code":"...","options":["A","B","C","D"],"correct":0}},
  {"action":"update_question","id":"firebase_doc_id","data":{"question":"...","code":"...","options":["A","B","C","D"],"correct":1}},
  {"action":"delete_question","id":"firebase_doc_id"},
  {"action":"add_coupon","data":{"code":"FREE100","discount":100,"type":"percentage","scope":"global"}},
  {"action":"update_coupon","id":"coupon_doc_id","data":{"active":false}},
  {"action":"delete_coupon","id":"coupon_doc_id"},
  {"action":"update_prices","data":{"basic":149,"basicSale":99,"basicSaleEnabled":true}}
]
</CHANGES>

For code fields: use \\n for line breaks, never real newlines.
Always explain what you are doing before the CHANGES block.
If no database changes needed, respond normally without a CHANGES block.`;

      const raw = await callAI([
        { role: 'system', content: systemPrompt },
        ...updated.map(m => ({ role: m.role, content: m.content }))
      ]);

      // Extract and apply changes
      const changesMatch = raw.match(/<CHANGES>([\s\S]*?)<\/CHANGES>/);
      const displayText = raw.replace(/<CHANGES>[\s\S]*?<\/CHANGES>/g, '').trim();
      let summary = '';

      if (changesMatch) {
        try {
          const changes = JSON.parse(changesMatch[1].trim());
          const result = await applyChanges(changes);
          const parts = [];
          if (result.added)   parts.push(`${result.added} added`);
          if (result.updated) parts.push(`${result.updated} updated`);
          if (result.deleted) parts.push(`${result.deleted} deleted`);
          if (parts.length)   summary = '\n\n✅ Done: ' + parts.join(', ');
        } catch (e) {
          summary = '\n\n⚠️ Changes failed: ' + e.message;
        }
      }

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: displayText + summary
      }]);
    } catch (e) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '❌ Error: ' + e.message
      }]);
    } finally {
      setLoading(false);
    }
  };

  const quickCmds = [
    'Show all basic questions',
    'Check advanced questions for errors',
    'Create coupon FREE100 for 100% off',
    'Show all active coupons',
    'Set basic price to ₹149',
    'Add a hard basic question about mutable default arguments',
  ];

  return (
    <div style={{ background: '#fff', borderRadius: '18px', border: '2px solid #c7d2fe', overflow: 'hidden', boxShadow: '0 4px 24px rgba(99,102,241,0.1)' }}>

      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#eff6ff,#fff)', borderBottom: '2px solid #e0e7ff', padding: isMobile ? '1rem' : '1.25rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }}>🤖</div>
          <div>
            <div style={{ fontWeight: '900', fontSize: isMobile ? '1rem' : '1.15rem', color: '#1e293b' }}>AI Admin Assistant</div>
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.1rem' }}>Full database access · Questions, coupons, prices</div>
          </div>
          <div style={{ marginLeft: 'auto', padding: '0.2rem 0.6rem', background: '#dcfce7', color: '#16a34a', borderRadius: '99px', fontSize: '0.65rem', fontWeight: '800' }}>● Live</div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ height: isMobile ? '420px' : '520px', overflowY: 'auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            {msg.role === 'assistant' && (
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', flexShrink: 0, marginRight: '0.5rem', marginTop: '0.1rem' }}>🤖</div>
            )}
            <div style={{
              maxWidth: '80%',
              padding: '0.85rem 1rem',
              fontSize: '0.87rem',
              lineHeight: 1.65,
              whiteSpace: 'pre-wrap',
              borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              background: msg.role === 'user' ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : '#f8fafc',
              color: msg.role === 'user' ? '#fff' : '#1e293b',
              fontWeight: msg.role === 'user' ? '600' : '400',
              border: msg.role === 'assistant' ? '1px solid #e2e8f0' : 'none',
              boxShadow: msg.role === 'user' ? '0 4px 14px rgba(99,102,241,0.25)' : '0 1px 4px rgba(0,0,0,0.05)',
            }}>{msg.content}</div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', flexShrink: 0 }}>🤖</div>
            <div style={{ padding: '0.85rem 1rem', borderRadius: '16px 16px 16px 4px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#6366f1', opacity: 0.6, animation: `bounce 1.2s ${i * 0.2}s infinite` }}/>
                ))}
              </div>
              <style>{`@keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}`}</style>
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Quick commands */}
      <div style={{ padding: '0.75rem 1rem', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
        {quickCmds.map(cmd => (
          <button key={cmd} onClick={() => setInput(cmd)} style={{ padding: '0.25rem 0.65rem', background: '#eff6ff', border: '1px solid #c7d2fe', borderRadius: '20px', color: '#4338ca', fontSize: '0.7rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap' }}>
            {cmd}
          </button>
        ))}
      </div>

      {/* Input */}
      <div style={{ padding: '0.85rem 1rem', borderTop: '2px solid #e0e7ff', display: 'flex', gap: '0.6rem', background: '#fafafe' }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder='e.g. "Add a tricky basic question about list mutation" or "Create coupon FREE100"'
          disabled={loading}
          style={{ flex: 1, padding: '0.85rem 1rem', border: '2px solid #c7d2fe', borderRadius: '12px', fontSize: '0.88rem', outline: 'none', background: '#fff', color: '#1e293b', fontFamily: 'inherit' }}
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          style={{ padding: '0.85rem 1.35rem', background: loading || !input.trim() ? '#e2e8f0' : 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', borderRadius: '12px', color: loading || !input.trim() ? '#94a3b8' : '#fff', fontWeight: '800', cursor: loading || !input.trim() ? 'not-allowed' : 'pointer', fontSize: '1rem', boxShadow: loading || !input.trim() ? 'none' : '0 4px 14px rgba(99,102,241,0.35)' }}
        >
          {loading ? '⏳' : '➤'}
        </button>
      </div>
    </div>
  );
}

// ==========================================
function PythonQuestionsTab({ isMobile }) {
  const [level, setLevel] = useState('basic');
  const [questions, setQuestions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [deletingIds, setDeletingIds] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [showPriceSettings, setShowPriceSettings] = useState(false);
  const [prices, setPrices] = useState(DEFAULT_PRICES);
  const [salePrices, setSalePrices] = useState({ basic: 0, advanced: 0, pro: 0 });
  const [saleEnabled, setSaleEnabled] = useState({ basic: false, advanced: false, pro: false });
  const [savingPrices, setSavingPrices] = useState(false);
  const [formData, setFormData] = useState({ question: '', code: '', option1: '', option2: '', option3: '', option4: '', correct: 0 });

  useEffect(() => { fetchQuestions(); fetchPrices(); setSelectedIds([]); setSelectAll(false); }, [level]); // eslint-disable-line

  const fetchPrices = async () => {
    try {
      const d = await getDoc(doc(db,'settings','testPrices'));
      if (d.exists()) {
        const data = d.data();
        setPrices({ basic: data.basic||99, advanced: data.advanced||199, pro: data.pro||299 });
        setSalePrices({ basic: data.basicSale||0, advanced: data.advancedSale||0, pro: data.proSale||0 });
        setSaleEnabled({ basic: data.basicSaleEnabled||false, advanced: data.advancedSaleEnabled||false, pro: data.proSaleEnabled||false });
      }
    } catch { setPrices(DEFAULT_PRICES); }
  };

  const handleSavePrices = async () => {
    setSavingPrices(true);
    try {
      await setDoc(doc(db,'settings','testPrices'),{
        basic: prices.basic, advanced: prices.advanced, pro: prices.pro,
        basicSale: salePrices.basic, advancedSale: salePrices.advanced, proSale: salePrices.pro,
        basicSaleEnabled: saleEnabled.basic, advancedSaleEnabled: saleEnabled.advanced, proSaleEnabled: saleEnabled.pro
      });
      window.showToast?.('✅ Prices updated!','success');
      setShowPriceSettings(false);
    } catch { window.showToast?.('❌ Failed to save prices','error'); }
    finally { setSavingPrices(false); }
  };

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const q = query(collection(db,'manualQuestions'),where('level','==',level),where('source','==','manual'));
      const snap = await getDocs(q);
      const qs = snap.docs.map(d=>({id:d.id,...d.data()}));
      qs.sort((a,b)=>{ if(a.position!==undefined&&b.position!==undefined) return a.position-b.position; return new Date(a.createdAt)-new Date(b.createdAt); });
      setQuestions(qs);
    } catch { window.showToast?.('Failed to load questions','error'); }
    finally { setLoading(false); }
  };

  const resetForm = () => { setFormData({question:'',code:'',option1:'',option2:'',option3:'',option4:'',correct:0}); setEditingId(null); };

  const handleEditQuestion = (q) => {
    setFormData({question:q.question,code:q.code,option1:q.options[0]||'',option2:q.options[1]||'',option3:q.options[2]||'',option4:q.options[3]||'',correct:q.correct});
    setEditingId(q.id); setShowForm(true); window.scrollTo({top:0,behavior:'smooth'});
  };

  const handleSaveQuestion = async () => {
    if (!editingId && questions.length >= MAX_QUESTIONS) { window.showToast?.(`❌ Maximum ${MAX_QUESTIONS} questions!`,'error'); return; }
    if (!formData.question.trim()) { window.showToast?.('Question text required','error'); return; }
    if (!formData.code.trim()) { window.showToast?.('Code snippet required','error'); return; }
    if (!formData.option1||!formData.option2||!formData.option3||!formData.option4) { window.showToast?.('All 4 options required','error'); return; }
    setLoading(true);
    try {
      const qData = {
        question: formData.question.trim(), code: formData.code.trim(),
        options: [formData.option1.trim(),formData.option2.trim(),formData.option3.trim(),formData.option4.trim()],
        correct: parseInt(formData.correct), level, source: 'manual'
      };
      if (editingId) {
        await updateDoc(doc(db,'manualQuestions',editingId),{...qData,updatedAt:new Date().toISOString()});
        window.showToast?.('✅ Question updated!','success');
      } else {
        await addDoc(collection(db,'manualQuestions'),{...qData,position:questions.length+1,createdAt:new Date().toISOString()});
        window.showToast?.('✅ Question added!','success');
      }
      resetForm(); setShowForm(false); fetchQuestions();
    } catch { window.showToast?.('Failed to save','error'); }
    finally { setLoading(false); }
  };

  const handleDeleteQuestion = async (id) => {
    if (!window.confirm('Delete this question?')) return;
    setDeletingIds(p=>[...p,id]);
    try {
      await deleteDoc(doc(db,'manualQuestions',id));
      window.showToast?.('✅ Deleted!','success');
      const remaining = questions.filter(q=>q.id!==id);
      await Promise.all(remaining.map((q,idx)=>updateDoc(doc(db,'manualQuestions',q.id),{position:idx+1})));
      setQuestions(remaining);
      setSelectedIds(prev=>prev.filter(s=>s!==id));
    } catch { window.showToast?.('Delete failed','error'); }
    finally { setDeletingIds(p=>p.filter(d=>d!==id)); }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedIds.length} questions?`)) return;
    setLoading(true);
    try {
      await Promise.all(selectedIds.map(id=>deleteDoc(doc(db,'manualQuestions',id))));
      window.showToast?.(`✅ ${selectedIds.length} deleted!`,'success');
      const remaining = questions.filter(q=>!selectedIds.includes(q.id));
      await Promise.all(remaining.map((q,idx)=>updateDoc(doc(db,'manualQuestions',q.id),{position:idx+1})));
      setQuestions(remaining); setSelectedIds([]); setSelectAll(false);
    } catch { window.showToast?.('Bulk delete failed','error'); }
    finally { setLoading(false); }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm(`⚠️ Delete ALL ${questions.length} ${level} questions?`)) return;
    setLoading(true);
    try {
      await Promise.all(questions.map(q=>deleteDoc(doc(db,'manualQuestions',q.id))));
      window.showToast?.('✅ All deleted!','success');
      setQuestions([]); setSelectedIds([]); setSelectAll(false);
    } catch { window.showToast?.('Delete all failed','error'); }
    finally { setLoading(false); }
  };

  const toggleSelect = (id) => setSelectedIds(prev=>prev.includes(id)?prev.filter(s=>s!==id):[...prev,id]);
  const handleSelectAll = () => { if(selectAll){setSelectedIds([]);setSelectAll(false);}else{setSelectedIds(filteredQs.map(q=>q.id));setSelectAll(true);} };
  const filteredQs = questions.filter(q=>q.question.toLowerCase().includes(searchQuery.toLowerCase())||(q.code||'').toLowerCase().includes(searchQuery.toLowerCase()));
  const lc = LEVEL_COLORS[level];
  const isAtLimit = questions.length>=MAX_QUESTIONS && !editingId;
  const pct = Math.min((questions.length/MAX_QUESTIONS)*100,100);

  return (
    <div>
      {/* Header Card */}
      <div style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:isMobile?'12px':'16px',padding:isMobile?'1rem':'2rem',marginBottom:'1rem',boxShadow:'0 2px 12px rgba(0,0,0,0.06)'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem',flexWrap:'wrap',gap:'0.75rem'}}>
          <h2 style={{margin:0,fontSize:isMobile?'1.3rem':'1.6rem',fontWeight:'800'}}>📝 Python Question Manager</h2>
          <div style={{display:'flex',gap:'0.5rem',flexWrap:'wrap'}}>
            <button onClick={()=>setShowPriceSettings(!showPriceSettings)} style={{padding:isMobile?'0.5rem 0.9rem':'0.65rem 1.25rem',borderRadius:'10px',border:'2px solid rgba(16,185,129,0.3)',background:showPriceSettings?'rgba(16,185,129,0.15)':'rgba(16,185,129,0.08)',color:'#10b981',fontWeight:'700',cursor:'pointer',display:'flex',alignItems:'center',gap:'0.5rem',fontSize:isMobile?'0.8rem':'0.9rem'}}>
              <IndianRupee size={16}/> {isMobile?'Prices':(showPriceSettings?'Hide Prices':'Manage Prices')}
            </button>
          </div>
        </div>

        {/* Price Settings */}
        {showPriceSettings && (
          <div style={{background:'linear-gradient(135deg,rgba(16,185,129,0.05),rgba(5,150,105,0.05))',border:'2px solid rgba(16,185,129,0.2)',borderRadius:'12px',padding:isMobile?'1rem':'1.5rem',marginBottom:'1.5rem'}}>
            <h3 style={{margin:'0 0 1rem',fontSize:'1.1rem',fontWeight:'800',color:'#10b981',display:'flex',alignItems:'center',gap:'0.5rem'}}><IndianRupee size={18}/>Python Test Prices</h3>
            <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'repeat(3,1fr)',gap:'1rem',marginBottom:'1rem'}}>
              {['basic','advanced','pro'].map(lvl=>(
                <div key={lvl} style={{background:'#fff',borderRadius:'12px',padding:'1rem',border:`2px solid ${LEVEL_COLORS[lvl].border}`}}>
                  <div style={{fontWeight:'800',color:LEVEL_COLORS[lvl].text,marginBottom:'0.75rem',textTransform:'uppercase',fontSize:'0.9rem'}}>{lvl}</div>
                  <div style={{marginBottom:'0.6rem'}}>
                    <label style={{display:'block',marginBottom:'0.3rem',fontSize:'0.75rem',fontWeight:'700',color:'#475569'}}>Price (₹)</label>
                    <input type="number" min="0" value={prices[lvl]} onChange={e=>setPrices({...prices,[lvl]:parseInt(e.target.value)||0})}
                      style={{width:'100%',padding:'0.6rem',border:`2px solid ${LEVEL_COLORS[lvl].border}`,borderRadius:'8px',fontSize:'1rem',fontWeight:'700',outline:'none',boxSizing:'border-box',background:LEVEL_COLORS[lvl].bg}}/>
                  </div>
                  <div style={{marginBottom:'0.6rem'}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.3rem'}}>
                      <label style={{fontSize:'0.75rem',fontWeight:'700',color:'#475569'}}>Sale Price (₹)</label>
                      <button onClick={()=>setSaleEnabled(p=>({...p,[lvl]:!p[lvl]}))} style={{padding:'0.15rem 0.5rem',borderRadius:'20px',border:'none',background:saleEnabled[lvl]?'#10b981':'#e2e8f0',color:saleEnabled[lvl]?'#fff':'#64748b',fontSize:'0.65rem',fontWeight:'700',cursor:'pointer'}}>
                        {saleEnabled[lvl]?'🔥 ON':'OFF'}
                      </button>
                    </div>
                    <input type="number" min="0" value={salePrices[lvl]} onChange={e=>setSalePrices({...salePrices,[lvl]:parseInt(e.target.value)||0})}
                      disabled={!saleEnabled[lvl]} style={{width:'100%',padding:'0.6rem',border:'2px solid #e2e8f0',borderRadius:'8px',fontSize:'1rem',fontWeight:'700',outline:'none',boxSizing:'border-box',opacity:saleEnabled[lvl]?1:0.5}}/>
                  </div>
                  <div style={{padding:'0.5rem',background:LEVEL_COLORS[lvl].badge,borderRadius:'8px',fontSize:'0.75rem',fontWeight:'700',color:LEVEL_COLORS[lvl].text,textAlign:'center'}}>
                    {saleEnabled[lvl]&&salePrices[lvl]>0?<><span style={{textDecoration:'line-through',opacity:0.6}}>₹{prices[lvl]}</span> → <span style={{color:'#10b981'}}>₹{salePrices[lvl]}</span></>:`Active: ₹${prices[lvl]}`}
                  </div>
                </div>
              ))}
            </div>
            <button onClick={handleSavePrices} disabled={savingPrices} style={{width:'100%',padding:'0.85rem',borderRadius:'10px',border:'none',background:savingPrices?'#e2e8f0':'linear-gradient(135deg,#10b981,#059669)',color:savingPrices?'#94a3b8':'#fff',fontSize:'1rem',fontWeight:'700',cursor:savingPrices?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:'0.5rem'}}>
              <Save size={18}/>{savingPrices?'Saving...':'Save All Prices'}
            </button>
          </div>
        )}

        {/* Level Tabs */}
        <div style={{display:'flex',gap:isMobile?'0.4rem':'0.5rem',marginBottom:'1rem',flexWrap:'wrap'}}>
          {['basic','advanced','pro'].map(lvl=>(
            <button key={lvl} onClick={()=>setLevel(lvl)} style={{padding:isMobile?'0.5rem 0.9rem':'0.6rem 1.2rem',borderRadius:'8px',border:level===lvl?`2px solid ${LEVEL_COLORS[lvl].border}`:'2px solid #e2e8f0',background:level===lvl?LEVEL_COLORS[lvl].bg:'#fff',color:level===lvl?LEVEL_COLORS[lvl].text:'#64748b',fontWeight:'700',cursor:'pointer',textTransform:'uppercase',fontSize:isMobile?'0.75rem':'0.85rem',display:'flex',flexDirection:'column',alignItems:'center',gap:'0.2rem',flex:isMobile?'1':'auto'}}>
              <span>{lvl}</span>
              <span style={{fontSize:'0.65rem',opacity:0.8}}>{saleEnabled[lvl]&&salePrices[lvl]>0?<><span style={{textDecoration:'line-through'}}>₹{prices[lvl]}</span> ₹{salePrices[lvl]}</>:`₹${prices[lvl]}`}</span>
            </button>
          ))}
        </div>

        {/* Progress Bar */}
        <div>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:'0.5rem',fontSize:'0.85rem'}}>
            <span style={{color:'#64748b'}}>Questions: <strong>{questions.length}</strong> / {MAX_QUESTIONS}</span>
            {isAtLimit && <span style={{color:'#ef4444',fontWeight:'700',fontSize:'0.8rem'}}>⚠️ LIMIT REACHED</span>}
          </div>
          <div style={{height:'8px',background:'#f1f5f9',borderRadius:'99px',overflow:'hidden'}}>
            <div style={{height:'100%',width:`${pct}%`,background:isAtLimit?'#ef4444':'#10b981',transition:'width 0.5s'}}/>
          </div>
        </div>

        <div style={{marginTop:'1rem',padding:'0.75rem',background:'rgba(99,102,241,0.1)',borderRadius:'8px',display:'flex',alignItems:'center',gap:'0.5rem',fontSize:'0.88rem',color:'#6366f1',fontWeight:'600'}}>
          <Clock size={16}/>Test Duration: <strong>{TIME_LIMITS[level]} minutes</strong> for {MAX_QUESTIONS} questions
        </div>
      </div>


      {/* Action Bar */}
      <div style={{display:'flex',justifyContent:'space-between',marginBottom:'1rem',gap:'0.75rem',flexWrap:'wrap'}}>
        <div style={{display:'flex',gap:'0.5rem',flexWrap:'wrap',flex:1}}>
          <button onClick={()=>{if(!isAtLimit){if(showForm&&!editingId){setShowForm(false);resetForm();}else{resetForm();setShowForm(true);}}}} style={{padding:isMobile?'0.5rem 0.9rem':'0.65rem 1.25rem',borderRadius:'10px',border:'none',background:isAtLimit?'#e2e8f0':'linear-gradient(135deg,#6366f1,#8b5cf6)',color:isAtLimit?'#94a3b8':'#fff',fontWeight:'700',cursor:isAtLimit?'not-allowed':'pointer',display:'flex',alignItems:'center',gap:'0.4rem',fontSize:'0.88rem'}}>
            {showForm&&!editingId?<X size={16}/>:<Plus size={16}/>}
            {showForm&&!editingId?'Cancel':isAtLimit?'Limit Reached':'Add Question'}
          </button>
          {selectedIds.length>0 && (
            <button onClick={handleBulkDelete} style={{padding:isMobile?'0.5rem 0.9rem':'0.65rem 1.25rem',borderRadius:'10px',border:'2px solid rgba(239,68,68,0.3)',background:'rgba(239,68,68,0.1)',color:'#ef4444',fontWeight:'700',cursor:'pointer',display:'flex',alignItems:'center',gap:'0.4rem',fontSize:'0.88rem'}}>
              <Trash2 size={15}/>Delete ({selectedIds.length})
            </button>
          )}
          {questions.length>0 && (
            <button onClick={handleDeleteAll} style={{padding:isMobile?'0.5rem 0.9rem':'0.65rem 1.25rem',borderRadius:'10px',border:'2px solid rgba(239,68,68,0.2)',background:'rgba(239,68,68,0.05)',color:'#dc2626',fontWeight:'700',cursor:'pointer',display:'flex',alignItems:'center',gap:'0.4rem',fontSize:'0.88rem'}}>
              <AlertTriangle size={15}/>Delete All
            </button>
          )}
        </div>
        <input type="text" placeholder="Search questions..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} style={{padding:'0.65rem 1rem',border:'2px solid #e2e8f0',borderRadius:'10px',fontSize:'0.88rem',outline:'none',minWidth:isMobile?'140px':'220px'}}/>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div style={{background:'#fff',border:editingId?'2px solid #f59e0b':'2px solid #e2e8f0',borderRadius:'16px',padding:isMobile?'1rem':'2rem',marginBottom:'1.5rem',boxShadow:'0 4px 24px rgba(0,0,0,0.08)'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.5rem',flexWrap:'wrap',gap:'0.5rem'}}>
            <h3 style={{margin:0,fontSize:'1.1rem',fontWeight:'700'}}>{editingId?<span style={{color:'#f59e0b'}}>✏️ Edit Question</span>:<span>New {level.toUpperCase()} Question</span>}</h3>
            {editingId && <button onClick={()=>{resetForm();setShowForm(false);}} style={{padding:'0.4rem 0.8rem',borderRadius:'8px',border:'2px solid #e2e8f0',background:'#fff',color:'#64748b',fontWeight:'600',cursor:'pointer'}}>Cancel</button>}
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:'1.25rem'}}>
            <div>
              <label style={{display:'block',marginBottom:'0.5rem',fontSize:'0.85rem',fontWeight:'700',color:'#64748b'}}>Question Text *</label>
              <input type="text" placeholder="What is the output of this code?" value={formData.question} onChange={e=>setFormData({...formData,question:e.target.value})} style={{width:'100%',padding:'0.85rem',border:'2px solid #e2e8f0',borderRadius:'8px',fontSize:'1rem',outline:'none',boxSizing:'border-box'}}/>
            </div>
            <div>
              <label style={{display:'block',marginBottom:'0.5rem',fontSize:'0.85rem',fontWeight:'700',color:'#64748b'}}>Python Code *</label>
              <textarea placeholder={"x = 5\ny = 3\nprint(x + y)"} value={formData.code} onChange={e=>setFormData({...formData,code:e.target.value})} rows={6} style={{width:'100%',padding:'1rem',border:'2px solid #e2e8f0',borderRadius:'8px',fontSize:'0.95rem',fontFamily:'monospace',outline:'none',resize:'vertical',boxSizing:'border-box'}}/>
            </div>
            <div>
              <label style={{display:'block',marginBottom:'0.75rem',fontSize:'0.85rem',fontWeight:'700',color:'#64748b'}}>Options *</label>
              <div style={{display:'grid',gap:'0.75rem'}}>
                {[1,2,3,4].map(num=>(
                  <div key={num} style={{display:'flex',alignItems:'center',gap:'0.6rem'}}>
                    <div style={{width:'30px',height:'30px',borderRadius:'50%',background:parseInt(formData.correct)===num-1?'#10b981':'#e2e8f0',color:parseInt(formData.correct)===num-1?'#fff':'#64748b',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:'800',fontSize:'0.85rem',flexShrink:0}}>{String.fromCharCode(64+num)}</div>
                    <input type="text" placeholder={`Option ${num}`} value={formData[`option${num}`]} onChange={e=>setFormData({...formData,[`option${num}`]:e.target.value})} style={{flex:1,padding:'0.7rem',border:parseInt(formData.correct)===num-1?'2px solid #10b981':'2px solid #e2e8f0',borderRadius:'8px',fontSize:'0.95rem',outline:'none',background:parseInt(formData.correct)===num-1?'#f0fdf4':'#fff'}}/>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <label style={{display:'block',marginBottom:'0.6rem',fontSize:'0.85rem',fontWeight:'700',color:'#64748b'}}>Correct Answer *</label>
              <div style={{display:'flex',gap:'0.6rem'}}>
                {[0,1,2,3].map(idx=>(
                  <button key={idx} type="button" onClick={()=>setFormData({...formData,correct:idx})} style={{flex:1,padding:'0.55rem',borderRadius:'8px',border:parseInt(formData.correct)===idx?'2px solid #10b981':'2px solid #e2e8f0',background:parseInt(formData.correct)===idx?'#f0fdf4':'#fff',color:parseInt(formData.correct)===idx?'#10b981':'#64748b',fontWeight:'700',cursor:'pointer',fontSize:'0.9rem'}}>
                    Option {idx+1}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={handleSaveQuestion} disabled={loading||isAtLimit} style={{padding:'1rem',borderRadius:'10px',border:'none',background:loading||isAtLimit?'#e2e8f0':editingId?'linear-gradient(135deg,#f59e0b,#d97706)':'linear-gradient(135deg,#10b981,#059669)',color:loading||isAtLimit?'#94a3b8':'#fff',fontSize:'1rem',fontWeight:'700',cursor:loading||isAtLimit?'not-allowed':'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:'0.5rem'}}>
              {editingId?<Edit2 size={18}/>:<Save size={18}/>}
              {loading?'Saving...':editingId?'Update Question':'Save Question'}
            </button>
          </div>
        </div>
      )}

      {/* Questions List */}
      <div style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:'16px',overflow:'hidden',boxShadow:'0 2px 12px rgba(0,0,0,0.06)'}}>
        <div style={{padding:'1.1rem 1.25rem',borderBottom:'2px solid #f1f5f9',display:'flex',justifyContent:'space-between',alignItems:'center',background:'#fafafa'}}>
          <label style={{display:'flex',alignItems:'center',gap:'0.5rem',cursor:'pointer'}}>
            <input type="checkbox" checked={selectAll} onChange={handleSelectAll} style={{width:'15px',height:'15px',cursor:'pointer'}}/>
            <span style={{fontSize:'0.82rem',fontWeight:'700',color:'#64748b'}}>Select All</span>
          </label>
          <span style={{fontSize:'0.85rem',color:'#64748b',fontWeight:'600'}}>{filteredQs.length} questions</span>
        </div>
        {loading?(<div style={{textAlign:'center',padding:'4rem',color:'#94a3b8'}}>Loading...</div>):
          filteredQs.length===0?(<div style={{textAlign:'center',padding:'4rem',color:'#94a3b8'}}><div style={{fontSize:'3rem',marginBottom:'0.75rem'}}>📝</div>No questions yet. Add some!</div>):
          filteredQs.map((q,idx)=>{
            const isSelected=selectedIds.includes(q.id);
            const isDeleting=deletingIds.includes(q.id);
            const isEditing=editingId===q.id;
            return (
              <div key={q.id} style={{borderBottom:idx<filteredQs.length-1?'1px solid #f1f5f9':'none',background:isEditing?'#fffbeb':isSelected?'#fafbff':'#fff',borderLeft:isEditing?'3px solid #f59e0b':isSelected?'3px solid #6366f1':'3px solid transparent',opacity:isDeleting?0.4:1,padding:'1.1rem 1.25rem',display:'flex',alignItems:'flex-start',gap:'0.75rem'}}>
                <input type="checkbox" checked={isSelected} onChange={()=>toggleSelect(q.id)} style={{width:'15px',height:'15px',marginTop:'4px',cursor:'pointer',flexShrink:0}}/>
                <div style={{width:'28px',height:'28px',borderRadius:'6px',background:lc.badge,color:lc.text,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:'800',fontSize:'0.8rem',flexShrink:0}}>{idx+1}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:'0.98rem',fontWeight:'600',color:'#0f172a',marginBottom:'0.5rem',wordBreak:'break-word',lineHeight:1.4}}>{q.question}</div>
                  <div style={{display:'flex',gap:'0.5rem',flexWrap:'wrap'}}>
                    <span style={{background:'#f1f5f9',color:'#64748b',padding:'0.2rem 0.6rem',borderRadius:'6px',fontSize:'0.72rem',fontWeight:'600'}}><Code size={10} style={{display:'inline',marginRight:'0.2rem'}}/>{(q.code||'').split('\n').length} lines</span>
                    <span style={{background:'#f0fdf4',color:'#10b981',padding:'0.2rem 0.6rem',borderRadius:'6px',fontSize:'0.72rem',fontWeight:'600'}}>✓ {q.options?.[q.correct]}</span>
                  </div>
                </div>
                <div style={{display:'flex',gap:'0.4rem',flexShrink:0}}>
                  <button onClick={()=>handleEditQuestion(q)} style={{width:'32px',height:'32px',borderRadius:'8px',border:'none',background:'rgba(245,158,11,0.1)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}><Edit2 size={14} color="#f59e0b"/></button>
                  <button onClick={()=>handleDeleteQuestion(q.id)} style={{width:'32px',height:'32px',borderRadius:'8px',border:'none',background:'rgba(239,68,68,0.1)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}><Trash2 size={14} color="#ef4444"/></button>
                </div>
              </div>
            );
          })
        }
      </div>
    </div>
  );
}

// ==========================================
// 🎯 CUSTOM EXAMS TAB
// ==========================================
function CustomExamsTab({ isMobile }) {
  const [examView, setExamView] = useState('list');
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [editingExam, setEditingExam] = useState(null);
  const [examForm, setExamForm] = useState({ name:'',description:'',subjects:[''],timeLimit:60,price:99,salePrice:'',saleEnabled:false,passingMarks:55,certificateEnabled:true,couponEnabled:false,maxQuestions:50,instructions:'' });
  const [coupons, setCoupons] = useState([]);
  const [showCouponForm, setShowCouponForm] = useState(false);
  const [couponForm, setCouponForm] = useState({ code:'',discount:10,type:'percentage',expiry:'',usageLimit:100 });

  useEffect(() => { fetchExams(); }, []);

  const fetchExams = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db,'customExams'),orderBy('createdAt','desc')));
      setExams(snap.docs.map(d=>({id:d.id,...d.data()})));
    } catch {
      try { const snap = await getDocs(collection(db,'customExams')); setExams(snap.docs.map(d=>({id:d.id,...d.data()}))); } catch { window.showToast?.('Failed to load exams','error'); }
    } finally { setLoading(false); }
  };

  const fetchCoupons = async (examId) => {
    try { const snap = await getDocs(query(collection(db,'coupons'),where('examId','==',examId))); setCoupons(snap.docs.map(d=>({id:d.id,...d.data()}))); } catch { setCoupons([]); }
  };

  const resetExamForm = () => { setExamForm({name:'',description:'',subjects:[''],timeLimit:60,price:99,salePrice:'',saleEnabled:false,passingMarks:55,certificateEnabled:true,couponEnabled:false,maxQuestions:50,instructions:''}); setEditingExam(null); };

  const handleEditExam = (exam) => {
    setExamForm({name:exam.name||'',description:exam.description||'',subjects:exam.subjects?.length>0?exam.subjects:[''],timeLimit:exam.timeLimit||60,price:exam.price||99,salePrice:exam.salePrice||'',saleEnabled:exam.saleEnabled||false,passingMarks:exam.passingMarks||55,certificateEnabled:exam.certificateEnabled!==false,couponEnabled:exam.couponEnabled||false,maxQuestions:exam.maxQuestions||50,instructions:exam.instructions||''});
    setEditingExam(exam); setExamView('create');
  };

  const handleSaveExam = async () => {
    if(!examForm.name.trim()){ window.showToast?.('❌ Exam name required!','error'); return; }
    if(examForm.subjects.filter(s=>s.trim()).length===0){ window.showToast?.('❌ Add at least one subject!','error'); return; }
    setLoading(true);
    try {
      const data = {name:examForm.name.trim(),description:examForm.description.trim(),subjects:examForm.subjects.filter(s=>s.trim()),timeLimit:parseInt(examForm.timeLimit)||60,price:parseInt(examForm.price)||0,salePrice:examForm.saleEnabled?(parseInt(examForm.salePrice)||0):null,saleEnabled:examForm.saleEnabled,passingMarks:parseInt(examForm.passingMarks)||55,certificateEnabled:examForm.certificateEnabled,couponEnabled:examForm.couponEnabled,maxQuestions:parseInt(examForm.maxQuestions)||50,instructions:examForm.instructions.trim(),active:true,updatedAt:serverTimestamp()};
      if(editingExam){ await updateDoc(doc(db,'customExams',editingExam.id),data); window.showToast?.('✅ Exam updated!','success'); }
      else { await addDoc(collection(db,'customExams'),{...data,createdAt:serverTimestamp(),questionCount:0}); window.showToast?.('✅ Exam created!','success'); }
      resetExamForm(); setExamView('list'); fetchExams();
    } catch { window.showToast?.('❌ Failed to save','error'); }
    finally { setLoading(false); }
  };

  const handleDeleteExam = async (exam) => {
    if(!window.confirm(`Delete "${exam.name}"?`)) return;
    setLoading(true);
    try {
      const qSnap = await getDocs(query(collection(db,'customQuestions'),where('examId','==',exam.id)));
      await Promise.all(qSnap.docs.map(d=>deleteDoc(d.ref)));
      const cSnap = await getDocs(query(collection(db,'coupons'),where('examId','==',exam.id)));
      await Promise.all(cSnap.docs.map(d=>deleteDoc(d.ref)));
      await deleteDoc(doc(db,'customExams',exam.id));
      window.showToast?.('✅ Exam deleted!','success'); fetchExams();
    } catch { window.showToast?.('❌ Delete failed','error'); }
    finally { setLoading(false); }
  };

  const handleToggleExam = async (exam) => {
    try { await updateDoc(doc(db,'customExams',exam.id),{active:!exam.active}); window.showToast?.(`✅ ${!exam.active?'Activated':'Deactivated'}!`,'success'); fetchExams(); }
    catch { window.showToast?.('❌ Failed','error'); }
  };

  const handleSaveCoupon = async () => {
    if(!couponForm.code.trim()||!selectedExam) return;
    try {
      const code = couponForm.code.trim().toUpperCase();
      await setDoc(doc(db,'coupons',code),{code,examId:selectedExam.id,examName:selectedExam.name,scope:`exam_${selectedExam.id}`,discount:parseInt(couponForm.discount)||10,type:couponForm.type,expiry:couponForm.expiry||null,usageLimit:parseInt(couponForm.usageLimit)||100,usedCount:0,active:true,createdAt:serverTimestamp()});
      window.showToast?.('✅ Coupon created!','success');
      setCouponForm({code:'',discount:10,type:'percentage',expiry:'',usageLimit:100});
      setShowCouponForm(false); fetchCoupons(selectedExam.id);
    } catch { window.showToast?.('❌ Failed','error'); }
  };

  const handleDeleteCoupon = async (couponId) => {
    if(!window.confirm('Delete?')) return;
    try { await deleteDoc(doc(db,'coupons',couponId)); window.showToast?.('✅ Deleted!','success'); if(selectedExam) fetchCoupons(selectedExam.id); }
    catch { window.showToast?.('❌ Failed','error'); }
  };

  const addSubject = () => setExamForm(p=>({...p,subjects:[...p.subjects,'']}));
  const removeSubject = (i) => setExamForm(p=>({...p,subjects:p.subjects.filter((_,idx)=>idx!==i)}));
  const updateSubject = (i,val) => setExamForm(p=>{ const s=[...p.subjects]; s[i]=val; return{...p,subjects:s}; });
  const inp = (extra={}) => ({width:'100%',padding:isMobile?'0.65rem':'0.8rem',border:'2px solid #e2e8f0',borderRadius:'10px',fontSize:'0.95rem',outline:'none',boxSizing:'border-box',background:'#f8fafc',...extra});
  const lbl = (text) => <label style={{display:'block',marginBottom:'0.4rem',fontSize:'0.85rem',fontWeight:'700',color:'#475569'}}>{text}</label>;

  if(examView==='list') return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.25rem',flexWrap:'wrap',gap:'0.75rem'}}>
        <div>
          <h2 style={{margin:0,fontSize:isMobile?'1.3rem':'1.6rem',fontWeight:'800',color:'#1e293b'}}>🎯 Custom Exams</h2>
          <p style={{margin:'0.25rem 0 0',fontSize:'0.85rem',color:'#64748b'}}>UPSC, MTS, Banking, SSC — kuch bhi!</p>
        </div>
        <button onClick={()=>{resetExamForm();setExamView('create');}} style={{padding:'0.75rem 1.5rem',background:'linear-gradient(135deg,#6366f1,#8b5cf6)',border:'none',borderRadius:'12px',color:'#fff',fontWeight:'700',cursor:'pointer',display:'flex',alignItems:'center',gap:'0.5rem'}}>
          <Plus size={18}/>Create Exam
        </button>
      </div>
      {loading?<div style={{textAlign:'center',padding:'4rem',color:'#94a3b8'}}>Loading...</div>:
        exams.length===0?(<div style={{textAlign:'center',padding:'5rem 2rem',background:'#fff',borderRadius:'16px',border:'2px dashed #e2e8f0'}}>
          <div style={{fontSize:'4rem',marginBottom:'1rem'}}>🎯</div>
          <h3 style={{margin:'0 0 0.5rem',color:'#1e293b'}}>No custom exams yet</h3>
          <button onClick={()=>{resetExamForm();setExamView('create');}} style={{padding:'0.75rem 2rem',background:'linear-gradient(135deg,#6366f1,#8b5cf6)',border:'none',borderRadius:'12px',color:'#fff',fontWeight:'700',cursor:'pointer'}}>+ Create First Exam</button>
        </div>):(
          <div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
            {exams.map(exam=>(
              <div key={exam.id} style={{background:'#fff',border:`2px solid ${exam.active?'#e2e8f0':'#fecaca'}`,borderRadius:'16px',padding:isMobile?'1rem':'1.5rem',boxShadow:'0 2px 8px rgba(0,0,0,0.05)',opacity:exam.active?1:0.75}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:'0.75rem'}}>
                  <div style={{flex:1}}>
                    <div style={{display:'flex',alignItems:'center',gap:'0.6rem',flexWrap:'wrap',marginBottom:'0.4rem'}}>
                      <h3 style={{margin:0,fontSize:isMobile?'1rem':'1.2rem',fontWeight:'800',color:'#1e293b'}}>{exam.name}</h3>
                      <span style={{padding:'0.2rem 0.6rem',borderRadius:'20px',fontSize:'0.7rem',fontWeight:'700',background:exam.active?'#dcfce7':'#fee2e2',color:exam.active?'#065f46':'#991b1b'}}>{exam.active?'✅ Active':'⏸ Inactive'}</span>
                    </div>
                    <div style={{display:'flex',gap:'0.5rem',flexWrap:'wrap'}}>
                      <span style={{padding:'0.2rem 0.6rem',background:'#eff6ff',color:'#1d4ed8',borderRadius:'6px',fontSize:'0.72rem',fontWeight:'600'}}>⏱ {exam.timeLimit}min</span>
                      <span style={{padding:'0.2rem 0.6rem',background:'#f0fdf4',color:'#065f46',borderRadius:'6px',fontSize:'0.72rem',fontWeight:'600'}}>{exam.saleEnabled&&exam.salePrice?<><span style={{textDecoration:'line-through',opacity:0.6}}>₹{exam.price}</span> ₹{exam.salePrice}</>:`₹${exam.price}`}</span>
                      <span style={{padding:'0.2rem 0.6rem',background:'#fff7ed',color:'#c2410c',borderRadius:'6px',fontSize:'0.72rem',fontWeight:'600'}}>📝 {exam.questionCount||0} Q</span>
                      <span style={{padding:'0.2rem 0.6rem',background:'#fdf4ff',color:'#7e22ce',borderRadius:'6px',fontSize:'0.72rem',fontWeight:'600'}}>Pass: {exam.passingMarks}%</span>
                    </div>
                  </div>
                  <div style={{display:'flex',flexDirection:'column',gap:'0.5rem',flexShrink:0}}>
                    <button onClick={()=>{setSelectedExam(exam);fetchCoupons(exam.id);setExamView('questions');}} style={{padding:'0.5rem 1rem',background:'linear-gradient(135deg,#6366f1,#8b5cf6)',border:'none',borderRadius:'8px',color:'#fff',fontWeight:'700',cursor:'pointer',fontSize:'0.8rem',display:'flex',alignItems:'center',gap:'0.3rem'}}><BookOpen size={13}/>Manage Questions</button>
                    <button onClick={()=>handleEditExam(exam)} style={{padding:'0.5rem 1rem',background:'rgba(245,158,11,0.1)',border:'1px solid rgba(245,158,11,0.3)',borderRadius:'8px',color:'#d97706',fontWeight:'700',cursor:'pointer',fontSize:'0.8rem',display:'flex',alignItems:'center',gap:'0.3rem'}}><Edit2 size={13}/>Edit</button>
                    <button onClick={()=>handleToggleExam(exam)} style={{padding:'0.5rem 1rem',background:exam.active?'rgba(239,68,68,0.1)':'rgba(16,185,129,0.1)',border:`1px solid ${exam.active?'rgba(239,68,68,0.3)':'rgba(16,185,129,0.3)'}`,borderRadius:'8px',color:exam.active?'#ef4444':'#10b981',fontWeight:'700',cursor:'pointer',fontSize:'0.8rem',display:'flex',alignItems:'center',gap:'0.3rem'}}>{exam.active?<ToggleRight size={13}/>:<ToggleLeft size={13}/>}{exam.active?'Deactivate':'Activate'}</button>
                    <button onClick={()=>handleDeleteExam(exam)} style={{padding:'0.5rem 1rem',background:'rgba(239,68,68,0.08)',border:'1px solid rgba(239,68,68,0.2)',borderRadius:'8px',color:'#dc2626',fontWeight:'700',cursor:'pointer',fontSize:'0.8rem',display:'flex',alignItems:'center',gap:'0.3rem'}}><Trash2 size={13}/>Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      }
    </div>
  );

  if(examView==='create') return (
    <div>
      <div style={{display:'flex',alignItems:'center',gap:'1rem',marginBottom:'1.5rem'}}>
        <button onClick={()=>{resetExamForm();setExamView('list');}} style={{padding:'0.5rem 1rem',background:'#f1f5f9',border:'2px solid #e2e8f0',borderRadius:'10px',color:'#475569',fontWeight:'700',cursor:'pointer'}}>← Back</button>
        <h2 style={{margin:0,fontSize:isMobile?'1.2rem':'1.5rem',fontWeight:'800',color:'#1e293b'}}>{editingExam?'✏️ Edit Exam':'🆕 Create Exam'}</h2>
      </div>
      {/* Basic Info */}
      <div style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:'14px',padding:isMobile?'1rem':'1.5rem',marginBottom:'1rem',boxShadow:'0 2px 8px rgba(0,0,0,0.05)'}}>
        <h3 style={{margin:'0 0 1.25rem',fontSize:'1.1rem',fontWeight:'800',color:'#1e293b',display:'flex',alignItems:'center',gap:'0.5rem'}}><FileText size={18} color="#6366f1"/>Basic Information</h3>
        <div style={{display:'grid',gap:'1rem'}}>
          <div>{lbl('Exam Name *')}<input value={examForm.name} onChange={e=>setExamForm(p=>({...p,name:e.target.value}))} placeholder="e.g. UPSC Mock Test 2026" style={inp()}/></div>
          <div>{lbl('Description')}<textarea value={examForm.description} onChange={e=>setExamForm(p=>({...p,description:e.target.value}))} rows={3} style={{...inp(),resize:'vertical'}}/></div>
          <div>{lbl('Instructions')}<textarea value={examForm.instructions} onChange={e=>setExamForm(p=>({...p,instructions:e.target.value}))} rows={3} placeholder="Rules for students..." style={{...inp(),resize:'vertical'}}/></div>
        </div>
      </div>
      {/* Subjects */}
      <div style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:'14px',padding:isMobile?'1rem':'1.5rem',marginBottom:'1rem',boxShadow:'0 2px 8px rgba(0,0,0,0.05)'}}>
        <h3 style={{margin:'0 0 1.25rem',fontSize:'1.1rem',fontWeight:'800',color:'#1e293b',display:'flex',alignItems:'center',gap:'0.5rem'}}><Tag size={18} color="#8b5cf6"/>Subjects</h3>
        <div style={{display:'flex',flexDirection:'column',gap:'0.6rem',marginBottom:'1rem'}}>
          {examForm.subjects.map((s,i)=>(
            <div key={i} style={{display:'flex',gap:'0.5rem',alignItems:'center'}}>
              <span style={{width:'24px',height:'24px',borderRadius:'50%',background:'#6366f1',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'0.75rem',fontWeight:'800',flexShrink:0}}>{i+1}</span>
              <input value={s} onChange={e=>updateSubject(i,e.target.value)} placeholder={`Subject ${i+1}`} style={{...inp(),margin:0}}/>
              {examForm.subjects.length>1 && <button onClick={()=>removeSubject(i)} style={{width:'32px',height:'32px',borderRadius:'8px',border:'none',background:'rgba(239,68,68,0.1)',color:'#ef4444',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}><X size={14}/></button>}
            </div>
          ))}
        </div>
        <button onClick={addSubject} style={{padding:'0.6rem 1.2rem',background:'rgba(99,102,241,0.1)',border:'2px dashed rgba(99,102,241,0.4)',borderRadius:'10px',color:'#6366f1',fontWeight:'700',cursor:'pointer',display:'flex',alignItems:'center',gap:'0.4rem'}}><Plus size={15}/>Add Subject</button>
      </div>
      {/* Settings */}
      <div style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:'14px',padding:isMobile?'1rem':'1.5rem',marginBottom:'1rem',boxShadow:'0 2px 8px rgba(0,0,0,0.05)'}}>
        <h3 style={{margin:'0 0 1.25rem',fontSize:'1.1rem',fontWeight:'800',color:'#1e293b',display:'flex',alignItems:'center',gap:'0.5rem'}}><Clock size={18} color="#f59e0b"/>Test Settings</h3>
        <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr 1fr':'1fr 1fr 1fr',gap:'1rem'}}>
          <div>{lbl('Time (minutes)')}<input type="number" min="10" value={examForm.timeLimit} onChange={e=>setExamForm(p=>({...p,timeLimit:e.target.value}))} style={inp()}/></div>
          <div>{lbl('Max Questions')}<input type="number" min="5" value={examForm.maxQuestions} onChange={e=>setExamForm(p=>({...p,maxQuestions:e.target.value}))} style={inp()}/></div>
          <div>{lbl('Passing Score (%)')}<input type="number" min="1" max="100" value={examForm.passingMarks} onChange={e=>setExamForm(p=>({...p,passingMarks:e.target.value}))} style={inp()}/></div>
        </div>
        <div style={{display:'flex',gap:'1rem',marginTop:'1rem',flexWrap:'wrap'}}>
          <label style={{display:'flex',alignItems:'center',gap:'0.5rem',cursor:'pointer',fontWeight:'600',fontSize:'0.88rem',color:'#475569'}}>
            <input type="checkbox" checked={examForm.certificateEnabled} onChange={e=>setExamForm(p=>({...p,certificateEnabled:e.target.checked}))} style={{width:'16px',height:'16px'}}/>
            🏆 Certificate on Pass
          </label>
          <label style={{display:'flex',alignItems:'center',gap:'0.5rem',cursor:'pointer',fontWeight:'600',fontSize:'0.88rem',color:'#475569'}}>
            <input type="checkbox" checked={examForm.couponEnabled} onChange={e=>setExamForm(p=>({...p,couponEnabled:e.target.checked}))} style={{width:'16px',height:'16px'}}/>
            🎟️ Enable Coupons
          </label>
        </div>
      </div>
      {/* Pricing */}
      <div style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:'14px',padding:isMobile?'1rem':'1.5rem',marginBottom:'1rem',boxShadow:'0 2px 8px rgba(0,0,0,0.05)'}}>
        <h3 style={{margin:'0 0 1.25rem',fontSize:'1.1rem',fontWeight:'800',color:'#1e293b',display:'flex',alignItems:'center',gap:'0.5rem'}}><IndianRupee size={18} color="#10b981"/>Pricing</h3>
        <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 1fr',gap:'1rem',marginBottom:'1rem'}}>
          <div>{lbl('Price (₹)')}<input type="number" min="0" value={examForm.price} onChange={e=>setExamForm(p=>({...p,price:e.target.value}))} style={inp()}/></div>
          <div>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:'0.4rem'}}>
              <label style={{fontSize:'0.85rem',fontWeight:'700',color:'#475569'}}>Sale Price (₹)</label>
              <button onClick={()=>setExamForm(p=>({...p,saleEnabled:!p.saleEnabled}))} style={{padding:'0.2rem 0.6rem',borderRadius:'20px',border:'none',background:examForm.saleEnabled?'#10b981':'#e2e8f0',color:examForm.saleEnabled?'#fff':'#64748b',fontSize:'0.7rem',fontWeight:'700',cursor:'pointer'}}>{examForm.saleEnabled?'🔥 ON':'OFF'}</button>
            </div>
            <input type="number" min="0" value={examForm.salePrice} onChange={e=>setExamForm(p=>({...p,salePrice:e.target.value}))} disabled={!examForm.saleEnabled} style={{...inp(),opacity:examForm.saleEnabled?1:0.5}}/>
          </div>
        </div>
      </div>
      <div style={{display:'flex',gap:'1rem',marginBottom:'2rem'}}>
        <button onClick={()=>{resetExamForm();setExamView('list');}} style={{flex:1,padding:'1rem',background:'#f1f5f9',border:'2px solid #e2e8f0',borderRadius:'12px',color:'#475569',fontWeight:'700',cursor:'pointer'}}>Cancel</button>
        <button onClick={handleSaveExam} disabled={loading} style={{flex:2,padding:'1rem',background:loading?'#e2e8f0':'linear-gradient(135deg,#6366f1,#8b5cf6)',border:'none',borderRadius:'12px',color:loading?'#94a3b8':'#fff',fontWeight:'800',cursor:loading?'not-allowed':'pointer'}}>
          {loading?'Saving...':editingExam?'✅ Update Exam':'✅ Create Exam'}
        </button>
      </div>
    </div>
  );

  if(examView==='questions'&&selectedExam) return (
    <ExamQuestionsManager exam={selectedExam} isMobile={isMobile} coupons={coupons} onBack={()=>{setExamView('list');fetchExams();}} onSaveCoupon={handleSaveCoupon} onDeleteCoupon={handleDeleteCoupon} showCouponForm={showCouponForm} setShowCouponForm={setShowCouponForm} couponForm={couponForm} setCouponForm={setCouponForm} fetchCoupons={fetchCoupons}/>
  );
  return null;
}

// ==========================================
// 📋 EXAM QUESTIONS MANAGER
// ==========================================
function ExamQuestionsManager({ exam, isMobile, coupons, onBack, onSaveCoupon, onDeleteCoupon, showCouponForm, setShowCouponForm, couponForm, setCouponForm, fetchCoupons }) {
  const [activeSection, setActiveSection] = useState('questions');
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filterSubject, setFilterSubject] = useState('all');
  const [csvError, setCsvError] = useState('');
  const [csvLoading, setCsvLoading] = useState(false);
  const [formData, setFormData] = useState({ question:'',code:'',subject:exam.subjects?.[0]||'',option1:'',option2:'',option3:'',option4:'',correct:0 });

  useEffect(() => { fetchQuestions(); }, []); // eslint-disable-line

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db,'customQuestions'),where('examId','==',exam.id)));
      const qs = snap.docs.map(d=>({id:d.id,...d.data()}));
      qs.sort((a,b)=>{ if(a.position!==undefined&&b.position!==undefined) return a.position-b.position; return new Date(a.createdAt||0)-new Date(b.createdAt||0); });
      setQuestions(qs);
      await updateDoc(doc(db,'customExams',exam.id),{questionCount:qs.length});
    } catch { window.showToast?.('Failed to load','error'); }
    finally { setLoading(false); }
  };

  const resetForm = () => { setFormData({question:'',code:'',subject:exam.subjects?.[0]||'',option1:'',option2:'',option3:'',option4:'',correct:0}); setEditingId(null); };

  const handleEditQuestion = (q) => {
    setFormData({question:q.question,code:q.code||'',subject:q.subject||exam.subjects?.[0]||'',option1:q.options[0]||'',option2:q.options[1]||'',option3:q.options[2]||'',option4:q.options[3]||'',correct:q.correct});
    setEditingId(q.id); setShowForm(true); window.scrollTo({top:0,behavior:'smooth'});
  };

  const handleSaveQuestion = async () => {
    if(questions.length>=exam.maxQuestions&&!editingId){ window.showToast?.(`❌ Max ${exam.maxQuestions} questions!`,'error'); return; }
    if(!formData.question.trim()||!formData.option1||!formData.option2||!formData.option3||!formData.option4){ window.showToast?.('Fill all required fields!','error'); return; }
    setLoading(true);
    try {
      const qData = {question:formData.question.trim(),code:formData.code.trim(),subject:formData.subject,options:[formData.option1.trim(),formData.option2.trim(),formData.option3.trim(),formData.option4.trim()],correct:parseInt(formData.correct),examId:exam.id,examName:exam.name};
      if(editingId){ await updateDoc(doc(db,'customQuestions',editingId),{...qData,updatedAt:new Date().toISOString()}); window.showToast?.('✅ Updated!','success'); }
      else { await addDoc(collection(db,'customQuestions'),{...qData,position:questions.length+1,createdAt:new Date().toISOString()}); window.showToast?.('✅ Added!','success'); }
      resetForm(); setShowForm(false); fetchQuestions();
    } catch { window.showToast?.('Failed to save','error'); }
    finally { setLoading(false); }
  };

  const handleDeleteQuestion = async (id) => {
    if(!window.confirm('Delete?')) return;
    try {
      await deleteDoc(doc(db,'customQuestions',id));
      window.showToast?.('✅ Deleted!','success');
      const remaining = questions.filter(q=>q.id!==id);
      await Promise.all(remaining.map((q,idx)=>updateDoc(doc(db,'customQuestions',q.id),{position:idx+1})));
      setQuestions(remaining);
    } catch { window.showToast?.('Failed','error'); }
  };

  const handleCSVUpload = async (e) => {
    const file = e.target.files?.[0]; if(!file) return;
    setCsvError(''); setCsvLoading(true);
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(l=>l.trim());
      const parsed=[]; const errors=[];
      lines.slice(1).forEach((line,idx)=>{
        const cols = line.split(',').map(c=>c.trim().replace(/^"|"$/g,''));
        if(cols.length<8){ errors.push(`Row ${idx+2}: not enough columns`); return; }
        const [question,code,subject,op1,op2,op3,op4,correct] = cols;
        if(!question||!op1||!op2||!op3||!op4){ errors.push(`Row ${idx+2}: missing fields`); return; }
        const ci = parseInt(correct)-1;
        if(isNaN(ci)||ci<0||ci>3){ errors.push(`Row ${idx+2}: correct must be 1-4`); return; }
        parsed.push({question,code:code||'',subject:subject||exam.subjects?.[0]||'',options:[op1,op2,op3,op4],correct:ci,examId:exam.id,examName:exam.name,createdAt:new Date().toISOString()});
      });
      if(errors.length>0) setCsvError(errors.slice(0,5).join('\n'));
      if(parsed.length>0){
        const remaining = exam.maxQuestions-questions.length;
        const toAdd = parsed.slice(0,remaining);
        const start = questions.length+1;
        await Promise.all(toAdd.map((q,i)=>addDoc(collection(db,'customQuestions'),{...q,position:start+i})));
        window.showToast?.(`✅ ${toAdd.length} questions uploaded!`,'success');
        fetchQuestions();
      }
    } catch(err){ setCsvError('Upload failed: '+err.message); }
    finally{ setCsvLoading(false); e.target.value=''; }
  };

  const filteredQs = filterSubject==='all'?questions:questions.filter(q=>q.subject===filterSubject);
  const isAtLimit = questions.length>=exam.maxQuestions;

  return (
    <div>
      <div style={{display:'flex',alignItems:'center',gap:'0.75rem',marginBottom:'1.25rem',flexWrap:'wrap'}}>
        <button onClick={onBack} style={{padding:'0.5rem 1rem',background:'#f1f5f9',border:'2px solid #e2e8f0',borderRadius:'10px',color:'#475569',fontWeight:'700',cursor:'pointer'}}>← Back</button>
        <div>
          <h2 style={{margin:0,fontSize:isMobile?'1.1rem':'1.4rem',fontWeight:'800',color:'#1e293b'}}>{exam.name}</h2>
          <p style={{margin:0,fontSize:'0.78rem',color:'#64748b'}}>{questions.length}/{exam.maxQuestions} questions · ₹{exam.price}</p>
        </div>
      </div>
      <div style={{display:'flex',gap:'0.4rem',marginBottom:'1.25rem'}}>
        {['questions',...(exam.couponEnabled?['coupons']:[])].map(id=>(
          <button key={id} onClick={()=>setActiveSection(id)} style={{padding:isMobile?'0.5rem 0.8rem':'0.6rem 1.2rem',borderRadius:'8px',border:'none',cursor:'pointer',fontWeight:'700',fontSize:isMobile?'0.78rem':'0.85rem',background:activeSection===id?'linear-gradient(135deg,#6366f1,#8b5cf6)':'#f1f5f9',color:activeSection===id?'#fff':'#64748b'}}>
            {id==='questions'?'📝 Questions':'🎟️ Coupons'}
          </button>
        ))}
      </div>

      {activeSection==='questions' && (
        <div>
          <div style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:'12px',padding:'1rem',marginBottom:'1rem'}}>
            <div style={{display:'flex',justifyContent:'space-between',marginBottom:'0.5rem',fontSize:'0.85rem',color:'#64748b'}}>
              <span>Questions: <strong>{questions.length}</strong> / {exam.maxQuestions}</span>
              {isAtLimit && <span style={{color:'#ef4444',fontWeight:'700'}}>⚠️ LIMIT REACHED</span>}
            </div>
            <div style={{height:'8px',background:'#f1f5f9',borderRadius:'99px',overflow:'hidden'}}>
              <div style={{height:'100%',width:`${Math.min((questions.length/exam.maxQuestions)*100,100)}%`,background:isAtLimit?'#ef4444':'#10b981'}}/>
            </div>
          </div>
          <div style={{display:'flex',gap:'0.6rem',marginBottom:'1rem',flexWrap:'wrap'}}>
            <button onClick={()=>{if(!isAtLimit){resetForm();setShowForm(!showForm);}}} disabled={isAtLimit} style={{padding:'0.6rem 1.2rem',background:isAtLimit?'#e2e8f0':'linear-gradient(135deg,#6366f1,#8b5cf6)',border:'none',borderRadius:'10px',color:isAtLimit?'#94a3b8':'#fff',fontWeight:'700',cursor:isAtLimit?'not-allowed':'pointer',fontSize:'0.85rem',display:'flex',alignItems:'center',gap:'0.4rem'}}>
              {showForm&&!editingId?<X size={15}/>:<Plus size={15}/>}{showForm&&!editingId?'Cancel':'Add Question'}
            </button>
            <label style={{padding:'0.6rem 1.2rem',background:'rgba(16,185,129,0.1)',border:'2px solid rgba(16,185,129,0.3)',borderRadius:'10px',color:'#10b981',fontWeight:'700',cursor:'pointer',fontSize:'0.85rem',display:'flex',alignItems:'center',gap:'0.4rem'}}>
              <Upload size={15}/>{csvLoading?'Uploading...':'CSV Upload'}
              <input type="file" accept=".csv" onChange={handleCSVUpload} style={{display:'none'}}/>
            </label>
            {exam.subjects?.length>1 && (
              <select value={filterSubject} onChange={e=>setFilterSubject(e.target.value)} style={{padding:'0.6rem',border:'2px solid #e2e8f0',borderRadius:'10px',fontSize:'0.85rem',outline:'none',fontWeight:'600'}}>
                <option value="all">All ({questions.length})</option>
                {exam.subjects.map(s=><option key={s} value={s}>{s} ({questions.filter(q=>q.subject===s).length})</option>)}
              </select>
            )}
          </div>
          {csvError && <div style={{padding:'0.75rem',background:'#fef2f2',border:'1px solid #fecaca',borderRadius:'10px',marginBottom:'1rem',fontSize:'0.8rem',color:'#991b1b',whiteSpace:'pre-line'}}>{csvError}</div>}
          {showForm && (
            <div style={{background:'#fff',border:editingId?'2px solid #f59e0b':'2px solid #e2e8f0',borderRadius:'14px',padding:isMobile?'1rem':'1.5rem',marginBottom:'1.25rem'}}>
              <h3 style={{margin:'0 0 1.25rem',fontWeight:'800',fontSize:'1rem',color:editingId?'#d97706':'#1e293b'}}>{editingId?'✏️ Edit':'➕ New'} Question</h3>
              <div style={{display:'flex',flexDirection:'column',gap:'0.85rem'}}>
                <div>
                  <label style={{display:'block',marginBottom:'0.3rem',fontSize:'0.8rem',fontWeight:'700',color:'#475569'}}>Subject</label>
                  <select value={formData.subject} onChange={e=>setFormData(p=>({...p,subject:e.target.value}))} style={{width:'100%',padding:'0.7rem',border:'2px solid #e2e8f0',borderRadius:'10px',fontSize:'0.9rem',outline:'none',boxSizing:'border-box'}}>
                    {exam.subjects?.map(s=><option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{display:'block',marginBottom:'0.3rem',fontSize:'0.8rem',fontWeight:'700',color:'#475569'}}>Question *</label>
                  <input value={formData.question} onChange={e=>setFormData(p=>({...p,question:e.target.value}))} placeholder="Enter question..." style={{width:'100%',padding:'0.7rem',border:'2px solid #e2e8f0',borderRadius:'10px',fontSize:'0.9rem',outline:'none',boxSizing:'border-box'}}/>
                </div>
                {[1,2,3,4].map(num=>(
                  <div key={num} style={{display:'flex',alignItems:'center',gap:'0.5rem'}}>
                    <div style={{width:'26px',height:'26px',borderRadius:'50%',background:parseInt(formData.correct)===num-1?'#10b981':'#e2e8f0',color:parseInt(formData.correct)===num-1?'#fff':'#64748b',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:'800',fontSize:'0.75rem',flexShrink:0}}>{String.fromCharCode(64+num)}</div>
                    <input value={formData[`option${num}`]} onChange={e=>setFormData(p=>({...p,[`option${num}`]:e.target.value}))} placeholder={`Option ${num}`} style={{flex:1,padding:'0.65rem',border:parseInt(formData.correct)===num-1?'2px solid #10b981':'2px solid #e2e8f0',borderRadius:'8px',fontSize:'0.88rem',outline:'none',background:parseInt(formData.correct)===num-1?'#f0fdf4':'#fff'}}/>
                  </div>
                ))}
                <div style={{display:'flex',gap:'0.4rem'}}>
                  {[0,1,2,3].map(idx=>(<button key={idx} type="button" onClick={()=>setFormData(p=>({...p,correct:idx}))} style={{flex:1,padding:'0.5rem',borderRadius:'8px',border:parseInt(formData.correct)===idx?'2px solid #10b981':'2px solid #e2e8f0',background:parseInt(formData.correct)===idx?'#f0fdf4':'#fff',color:parseInt(formData.correct)===idx?'#10b981':'#64748b',fontWeight:'700',cursor:'pointer',fontSize:'0.82rem'}}>{idx+1}</button>))}
                </div>
                <div style={{display:'flex',gap:'0.75rem'}}>
                  <button onClick={()=>{resetForm();setShowForm(false);}} style={{flex:1,padding:'0.8rem',background:'#f1f5f9',border:'2px solid #e2e8f0',borderRadius:'10px',color:'#475569',fontWeight:'700',cursor:'pointer'}}>Cancel</button>
                  <button onClick={handleSaveQuestion} disabled={loading} style={{flex:2,padding:'0.8rem',background:loading?'#e2e8f0':'linear-gradient(135deg,#10b981,#059669)',border:'none',borderRadius:'10px',color:loading?'#94a3b8':'#fff',fontWeight:'700',cursor:loading?'not-allowed':'pointer'}}>{loading?'Saving...':editingId?'✅ Update':'✅ Save'}</button>
                </div>
              </div>
            </div>
          )}
          <div style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:'14px',overflow:'hidden'}}>
            {loading?<div style={{textAlign:'center',padding:'3rem',color:'#94a3b8'}}>Loading...</div>:
              filteredQs.length===0?<div style={{textAlign:'center',padding:'3rem',color:'#94a3b8'}}><div style={{fontSize:'2.5rem',marginBottom:'0.75rem'}}>📝</div>No questions yet.</div>:
              filteredQs.map((q,idx)=>(
                <div key={q.id} style={{borderBottom:idx<filteredQs.length-1?'1px solid #f1f5f9':'none',padding:isMobile?'0.85rem':'1.1rem',display:'flex',gap:'0.75rem',alignItems:'flex-start'}}>
                  <div style={{width:'26px',height:'26px',borderRadius:'8px',background:'#f1f5f9',color:'#475569',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:'800',fontSize:'0.75rem',flexShrink:0}}>{idx+1}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:'0.92rem',fontWeight:'600',color:'#1e293b',marginBottom:'0.4rem',lineHeight:1.4}}>{q.question}</div>
                    <div style={{display:'flex',gap:'0.4rem',flexWrap:'wrap'}}>
                      <span style={{padding:'0.15rem 0.5rem',background:'#eff6ff',color:'#1d4ed8',borderRadius:'6px',fontSize:'0.68rem',fontWeight:'600'}}>{q.subject}</span>
                      <span style={{padding:'0.15rem 0.5rem',background:'#f0fdf4',color:'#065f46',borderRadius:'6px',fontSize:'0.68rem',fontWeight:'600'}}>✓ {q.options?.[q.correct]}</span>
                    </div>
                  </div>
                  <div style={{display:'flex',gap:'0.4rem',flexShrink:0}}>
                    <button onClick={()=>handleEditQuestion(q)} style={{width:'32px',height:'32px',borderRadius:'8px',border:'none',background:'rgba(245,158,11,0.1)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}><Edit2 size={14} color="#d97706"/></button>
                    <button onClick={()=>handleDeleteQuestion(q.id)} style={{width:'32px',height:'32px',borderRadius:'8px',border:'none',background:'rgba(239,68,68,0.1)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}><Trash2 size={14} color="#ef4444"/></button>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      )}

      {activeSection==='coupons'&&exam.couponEnabled && (
        <div>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem',flexWrap:'wrap',gap:'0.75rem'}}>
            <h3 style={{margin:0,fontSize:'1.1rem',fontWeight:'800',color:'#1e293b'}}>🎟️ Coupons</h3>
            <button onClick={()=>setShowCouponForm(!showCouponForm)} style={{padding:'0.55rem 1.1rem',background:'linear-gradient(135deg,#10b981,#059669)',border:'none',borderRadius:'10px',color:'#fff',fontWeight:'700',cursor:'pointer',fontSize:'0.85rem',display:'flex',alignItems:'center',gap:'0.3rem'}}><Plus size={14}/>Create Coupon</button>
          </div>
          {showCouponForm && (
            <div style={{background:'#fff',border:'2px solid rgba(16,185,129,0.3)',borderRadius:'14px',padding:'1.25rem',marginBottom:'1rem'}}>
              <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 1fr',gap:'0.75rem',marginBottom:'1rem'}}>
                <div><label style={{display:'block',marginBottom:'0.3rem',fontSize:'0.8rem',fontWeight:'700',color:'#475569'}}>Code *</label><input value={couponForm.code} onChange={e=>setCouponForm(p=>({...p,code:e.target.value.toUpperCase()}))} style={{width:'100%',padding:'0.7rem',border:'2px solid #e2e8f0',borderRadius:'10px',fontFamily:'monospace',fontWeight:'700',outline:'none',boxSizing:'border-box'}}/></div>
                <div><label style={{display:'block',marginBottom:'0.3rem',fontSize:'0.8rem',fontWeight:'700',color:'#475569'}}>Type</label><select value={couponForm.type} onChange={e=>setCouponForm(p=>({...p,type:e.target.value}))} style={{width:'100%',padding:'0.7rem',border:'2px solid #e2e8f0',borderRadius:'10px',outline:'none',boxSizing:'border-box'}}><option value="percentage">% Percentage</option><option value="flat">₹ Flat</option></select></div>
                <div><label style={{display:'block',marginBottom:'0.3rem',fontSize:'0.8rem',fontWeight:'700',color:'#475569'}}>Discount</label><input type="number" min="1" value={couponForm.discount} onChange={e=>setCouponForm(p=>({...p,discount:e.target.value}))} style={{width:'100%',padding:'0.7rem',border:'2px solid #e2e8f0',borderRadius:'10px',outline:'none',boxSizing:'border-box'}}/></div>
                <div><label style={{display:'block',marginBottom:'0.3rem',fontSize:'0.8rem',fontWeight:'700',color:'#475569'}}>Usage Limit</label><input type="number" min="1" value={couponForm.usageLimit} onChange={e=>setCouponForm(p=>({...p,usageLimit:e.target.value}))} style={{width:'100%',padding:'0.7rem',border:'2px solid #e2e8f0',borderRadius:'10px',outline:'none',boxSizing:'border-box'}}/></div>
              </div>
              <div style={{display:'flex',gap:'0.75rem'}}>
                <button onClick={()=>setShowCouponForm(false)} style={{flex:1,padding:'0.75rem',background:'#f1f5f9',border:'2px solid #e2e8f0',borderRadius:'10px',color:'#475569',fontWeight:'700',cursor:'pointer'}}>Cancel</button>
                <button onClick={onSaveCoupon} style={{flex:2,padding:'0.75rem',background:'linear-gradient(135deg,#10b981,#059669)',border:'none',borderRadius:'10px',color:'#fff',fontWeight:'700',cursor:'pointer'}}>✅ Create</button>
              </div>
            </div>
          )}
          {coupons.length===0?<div style={{textAlign:'center',padding:'3rem',background:'#fff',borderRadius:'14px',border:'2px dashed #e2e8f0',color:'#94a3b8'}}>🎟️ No coupons yet.</div>:
            <div style={{display:'flex',flexDirection:'column',gap:'0.75rem'}}>
              {coupons.map(c=>(
                <div key={c.id} style={{background:'#fff',border:'2px solid #e2e8f0',borderRadius:'12px',padding:'1rem',display:'flex',justifyContent:'space-between',alignItems:'center',gap:'0.75rem'}}>
                  <div>
                    <div style={{fontFamily:'monospace',fontWeight:'800',fontSize:'1rem',color:'#1e293b',marginBottom:'0.2rem'}}>{c.code}</div>
                    <div style={{fontSize:'0.78rem',color:'#64748b',display:'flex',gap:'0.5rem'}}>
                      <span>{c.type==='percentage'?`${c.discount}% off`:`₹${c.discount} off`}</span>
                      <span>Used: {c.usedCount||0}/{c.usageLimit}</span>
                    </div>
                  </div>
                  <button onClick={()=>onDeleteCoupon(c.id)} style={{padding:'0.4rem',background:'rgba(239,68,68,0.1)',border:'none',borderRadius:'8px',cursor:'pointer'}}><Trash2 size={14} color="#ef4444"/></button>
                </div>
              ))}
            </div>
          }
        </div>
      )}
    </div>
  );
}

// ==========================================
// 🎟️ GLOBAL COUPONS TAB
// ==========================================
function GlobalCouponsTab({ isMobile }) {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code:'',discount:100,type:'percentage',scope:'global',expiry:'',usageLimit:9999,active:true });

  useEffect(() => { fetchCoupons(); }, []);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db,'coupons'));
      const all = snap.docs.map(d=>({id:d.id,...d.data()}));
      all.sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));
      setCoupons(all);
    } catch { window.showToast?.('Failed to load','error'); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    if(!form.code.trim()){ window.showToast?.('❌ Code required!','error'); return; }
    if(!form.discount||form.discount<1){ window.showToast?.('❌ Discount required!','error'); return; }
    setLoading(true);
    try {
      const code = form.code.trim().toUpperCase();
      await setDoc(doc(db,'coupons',code),{code,discount:parseInt(form.discount),type:form.type,scope:form.scope,expiry:form.expiry||null,usageLimit:parseInt(form.usageLimit)||9999,usedCount:0,active:form.active,createdAt:serverTimestamp()});
      window.showToast?.('✅ Coupon created!','success');
      setForm({code:'',discount:100,type:'percentage',scope:'global',expiry:'',usageLimit:9999,active:true});
      setShowForm(false); fetchCoupons();
    } catch { window.showToast?.('❌ Failed','error'); }
    finally { setLoading(false); }
  };

  const handleToggle = async (c) => {
    try { await updateDoc(doc(db,'coupons',c.id),{active:!c.active}); window.showToast?.(`✅ ${!c.active?'Activated':'Deactivated'}!`,'success'); fetchCoupons(); }
    catch { window.showToast?.('❌ Failed','error'); }
  };

  const handleDelete = async (id) => {
    if(!window.confirm('Delete?')) return;
    try { await deleteDoc(doc(db,'coupons',id)); window.showToast?.('✅ Deleted!','success'); setCoupons(p=>p.filter(c=>c.id!==id)); }
    catch { window.showToast?.('❌ Failed','error'); }
  };

  const inp = (extra={}) => ({width:'100%',padding:'0.75rem',border:'2px solid #e2e8f0',borderRadius:'10px',fontSize:'0.9rem',outline:'none',boxSizing:'border-box',background:'#f8fafc',...extra});
  const scopeLabel = (scope) => {
    if(scope==='global'||scope==='all') return {label:'🌐 Global',color:'#6366f1',bg:'#eff6ff'};
    if(scope==='python') return {label:'🐍 Python',color:'#10b981',bg:'#f0fdf4'};
    return {label:scope,color:'#64748b',bg:'#f1f5f9'};
  };

  return (
    <div>
      <div style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:'16px',padding:isMobile?'1rem':'1.75rem',marginBottom:'1rem',boxShadow:'0 2px 12px rgba(0,0,0,0.06)'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:'0.75rem',marginBottom:'1rem'}}>
          <div>
            <h2 style={{margin:0,fontSize:isMobile?'1.3rem':'1.6rem',fontWeight:'800',color:'#1e293b'}}>🎟️ Global Coupon Manager</h2>
            <p style={{margin:'0.25rem 0 0',fontSize:'0.82rem',color:'#64748b'}}>Set scope to <strong>Global</strong> to apply across all tests.</p>
          </div>
          <button onClick={()=>setShowForm(!showForm)} style={{padding:'0.65rem 1.25rem',background:showForm?'#f1f5f9':'linear-gradient(135deg,#6366f1,#8b5cf6)',border:'none',borderRadius:'10px',color:showForm?'#64748b':'#fff',fontWeight:'700',cursor:'pointer',display:'flex',alignItems:'center',gap:'0.4rem',fontSize:'0.9rem'}}>
            {showForm?<X size={16}/>:<Plus size={16}/>}{showForm?'Cancel':'New Coupon'}
          </button>
        </div>
      </div>

      {showForm && (
        <div style={{background:'#fff',border:'2px solid rgba(99,102,241,0.3)',borderRadius:'16px',padding:isMobile?'1rem':'1.75rem',marginBottom:'1rem',boxShadow:'0 4px 20px rgba(0,0,0,0.08)'}}>
          <h3 style={{margin:'0 0 1.25rem',fontWeight:'800',color:'#6366f1',fontSize:'1.1rem'}}>➕ Create New Coupon</h3>
          <div style={{display:'grid',gridTemplateColumns:isMobile?'1fr':'1fr 1fr',gap:'1rem',marginBottom:'1rem'}}>
            <div><label style={{display:'block',marginBottom:'0.4rem',fontSize:'0.8rem',fontWeight:'700',color:'#475569'}}>Coupon Code *</label><input value={form.code} onChange={e=>setForm(p=>({...p,code:e.target.value.toUpperCase()}))} placeholder="e.g. FREE100" style={{...inp(),fontFamily:'monospace',fontWeight:'800',letterSpacing:'2px',fontSize:'1rem'}}/></div>
            <div><label style={{display:'block',marginBottom:'0.4rem',fontSize:'0.8rem',fontWeight:'700',color:'#475569'}}>Scope *</label><select value={form.scope} onChange={e=>setForm(p=>({...p,scope:e.target.value}))} style={inp()}><option value="global">🌐 Global — All tests</option><option value="python">🐍 Python only</option></select></div>
            <div><label style={{display:'block',marginBottom:'0.4rem',fontSize:'0.8rem',fontWeight:'700',color:'#475569'}}>Discount Type *</label><select value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value}))} style={inp()}><option value="percentage">% Percentage</option><option value="flat">₹ Flat Amount</option></select></div>
            <div><label style={{display:'block',marginBottom:'0.4rem',fontSize:'0.8rem',fontWeight:'700',color:'#475569'}}>Discount Value *{form.type==='percentage'&&Number(form.discount)===100&&<span style={{color:'#10b981'}}> — FREE!</span>}</label><input type="number" min="1" max={form.type==='percentage'?100:undefined} value={form.discount} onChange={e=>setForm(p=>({...p,discount:e.target.value}))} style={{...inp({borderColor:Number(form.discount)===100?'#10b981':'#e2e8f0',background:Number(form.discount)===100?'#f0fdf4':'#f8fafc'})}}/></div>
            <div><label style={{display:'block',marginBottom:'0.4rem',fontSize:'0.8rem',fontWeight:'700',color:'#475569'}}>Usage Limit</label><input type="number" min="1" value={form.usageLimit} onChange={e=>setForm(p=>({...p,usageLimit:e.target.value}))} style={inp()}/></div>
            <div><label style={{display:'block',marginBottom:'0.4rem',fontSize:'0.8rem',fontWeight:'700',color:'#475569'}}>Expiry Date (optional)</label><input type="date" value={form.expiry} onChange={e=>setForm(p=>({...p,expiry:e.target.value}))} style={inp()}/></div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:'0.75rem',marginBottom:'1.25rem',padding:'0.75rem',background:'#f8fafc',borderRadius:'10px',border:'1px solid #e2e8f0'}}>
            <button onClick={()=>setForm(p=>({...p,active:!p.active}))} style={{background:'none',border:'none',cursor:'pointer',display:'flex',alignItems:'center',gap:'0.5rem',fontWeight:'700',color:form.active?'#10b981':'#94a3b8',fontSize:'0.9rem'}}>
              {form.active?<ToggleRight size={24} color="#10b981"/>:<ToggleLeft size={24} color="#94a3b8"/>}
              {form.active?'✅ Active':'⏸ Inactive'}
            </button>
          </div>
          <button onClick={handleSave} disabled={loading} style={{width:'100%',padding:'1rem',background:loading?'#e2e8f0':'linear-gradient(135deg,#6366f1,#8b5cf6)',border:'none',borderRadius:'12px',color:loading?'#94a3b8':'#fff',fontWeight:'800',cursor:loading?'not-allowed':'pointer',fontSize:'1rem',display:'flex',alignItems:'center',justifyContent:'center',gap:'0.5rem'}}>
            <Save size={18}/>{loading?'Creating...':'✅ Create Coupon'}
          </button>
        </div>
      )}

      <div style={{background:'#fff',border:'1px solid #e2e8f0',borderRadius:'16px',overflow:'hidden',boxShadow:'0 2px 12px rgba(0,0,0,0.06)'}}>
        <div style={{padding:'1rem 1.25rem',borderBottom:'2px solid #f1f5f9',background:'#fafafa',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <span style={{fontWeight:'800',color:'#1e293b'}}>All Coupons ({coupons.length})</span>
          <button onClick={fetchCoupons} style={{padding:'0.35rem 0.75rem',background:'#f1f5f9',border:'1px solid #e2e8f0',borderRadius:'8px',cursor:'pointer',fontSize:'0.78rem',fontWeight:'600',color:'#475569'}}>🔄 Refresh</button>
        </div>
        {loading?<div style={{textAlign:'center',padding:'3rem',color:'#94a3b8'}}>Loading...</div>:
          coupons.length===0?<div style={{textAlign:'center',padding:'4rem',color:'#94a3b8'}}><div style={{fontSize:'3rem',marginBottom:'0.75rem'}}>🎟️</div>No coupons yet.</div>:
          coupons.map((c,idx)=>{
            const sl=scopeLabel(c.scope||'global');
            const isExpired=c.expiry&&new Date()>new Date(c.expiry);
            const isLimitReached=c.usageLimit&&(c.usedCount||0)>=c.usageLimit;
            return (
              <div key={c.id} style={{borderBottom:idx<coupons.length-1?'1px solid #f1f5f9':'none',padding:isMobile?'0.85rem':'1.1rem',display:'flex',alignItems:'center',gap:'0.75rem',flexWrap:'wrap',background:(!c.active||isExpired||isLimitReached)?'#fafafa':'#fff',opacity:(!c.active||isExpired||isLimitReached)?0.65:1}}>
                <div style={{minWidth:'120px'}}>
                  <div style={{fontFamily:'monospace',fontWeight:'900',fontSize:isMobile?'0.95rem':'1.1rem',color:'#1e293b',letterSpacing:'1px'}}>{c.code}</div>
                  <div style={{display:'flex',gap:'0.3rem',flexWrap:'wrap',marginTop:'0.3rem'}}>
                    <span style={{padding:'0.1rem 0.45rem',background:c.active&&!isExpired&&!isLimitReached?'#dcfce7':'#fee2e2',color:c.active&&!isExpired&&!isLimitReached?'#065f46':'#991b1b',borderRadius:'20px',fontSize:'0.62rem',fontWeight:'700'}}>
                      {isExpired?'⏰ Expired':isLimitReached?'🚫 Limit':c.active?'✅ Active':'⏸ Inactive'}
                    </span>
                  </div>
                </div>
                <div style={{flex:1}}>
                  <div style={{display:'flex',gap:'0.4rem',flexWrap:'wrap'}}>
                    <span style={{padding:'0.2rem 0.6rem',background:'#f0fdf4',color:'#065f46',borderRadius:'6px',fontSize:'0.72rem',fontWeight:'700'}}>💰 {c.type==='percentage'?`${c.discount}% off`:`₹${c.discount} off`}{Number(c.discount)===100&&c.type==='percentage'?' 🆓 FREE':''}</span>
                    <span style={{padding:'0.2rem 0.6rem',background:sl.bg,color:sl.color,borderRadius:'6px',fontSize:'0.72rem',fontWeight:'700'}}>{sl.label}</span>
                    <span style={{padding:'0.2rem 0.6rem',background:'#f1f5f9',color:'#475569',borderRadius:'6px',fontSize:'0.72rem',fontWeight:'600'}}>👥 {c.usedCount||0}/{c.usageLimit||'∞'}</span>
                    {c.expiry && <span style={{padding:'0.2rem 0.6rem',background:'#fef3c7',color:'#92400e',borderRadius:'6px',fontSize:'0.72rem',fontWeight:'600'}}>📅 {c.expiry}</span>}
                  </div>
                </div>
                <div style={{display:'flex',gap:'0.4rem',flexShrink:0}}>
                  <button onClick={()=>handleToggle(c)} style={{width:'32px',height:'32px',borderRadius:'8px',border:'none',background:c.active?'rgba(16,185,129,0.1)':'rgba(100,116,139,0.1)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
                    {c.active?<ToggleRight size={15} color="#10b981"/>:<ToggleLeft size={15} color="#94a3b8"/>}
                  </button>
                  <button onClick={()=>handleDelete(c.id)} style={{width:'32px',height:'32px',borderRadius:'8px',border:'none',background:'rgba(239,68,68,0.1)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}><Trash2 size={14} color="#ef4444"/></button>
                </div>
              </div>
            );
          })
        }
      </div>
    </div>
  );
}

// ==========================================
// 🏠 MAIN COMPONENT
// ==========================================
function AdminQuestions() {
  const [mainTab, setMainTab] = useState('python');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', fontFamily: 'system-ui', padding: isMobile ? '0.5rem' : '1rem' }}>
      <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.5rem', background: '#f1f5f9', borderRadius: '14px', padding: '6px', border: '1px solid #e2e8f0', flexWrap: 'wrap' }}>
        {MAIN_TABS.map(t => (
          <button key={t.id} onClick={() => setMainTab(t.id)} style={{
            flex: 1, minWidth: isMobile ? '45%' : 'auto',
            padding: isMobile ? '0.6rem 0.4rem' : '0.75rem 1rem',
            borderRadius: '10px', border: 'none', cursor: 'pointer',
            fontWeight: '700', fontSize: isMobile ? '0.72rem' : '0.85rem',
            background: mainTab === t.id
              ? t.id === 'ai'
                ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                : 'linear-gradient(135deg, #6366f1, #8b5cf6)'
              : 'transparent',
            color: mainTab === t.id ? '#fff' : '#64748b',
            boxShadow: mainTab === t.id ? '0 4px 14px rgba(99,102,241,0.35)' : 'none',
            transition: 'all 0.25s ease', whiteSpace: 'nowrap'
          }}>{t.label}</button>
        ))}
      </div>
      {mainTab === 'python'  && <PythonQuestionsTab  isMobile={isMobile} />}
      {mainTab === 'exams'   && <CustomExamsTab      isMobile={isMobile} />}
      {mainTab === 'coupons' && <GlobalCouponsTab    isMobile={isMobile} />}
      {mainTab === 'ai'      && <AIAssistantTab      isMobile={isMobile} />}
    </div>
  );
}

export default AdminQuestions;