// @ts-nocheck
// FILE LOCATION: src/components/UserDetailsForm.jsx
//
// Props:
//   onSubmit(formData)   — called once on valid submit
//   onCancel()           — back button
//   defaultValues        — pre-fill from previously saved details (optional)

import React, { useState, useEffect, useRef } from 'react';
import { useTheme } from '../App';
import { User, Mail, MapPin, Calendar, Award } from 'lucide-react';

function UserDetailsForm({ onSubmit, onCancel, defaultValues }) {
  const { isDark } = useTheme();

  const [formData, setFormData] = useState({
    fullName: defaultValues?.fullName || '',
    age:      defaultValues?.age      || '',
    address:  defaultValues?.address  || '',
    email:    defaultValues?.email    || '',
  });
  const [errors,      setErrors]      = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submittedRef = useRef(false);

  // Reset lock on every fresh mount
  useEffect(() => {
    submittedRef.current = false;
    setIsSubmitting(false);

    // Hide nav/UI elements while form is open
    const sels = ['nav','header','footer','.navbar','.header','.footer','.telegram-button','#telegram-button','.TelegramButton','[class*="telegram"]','.background','.Background','[class*="background"]','.toast-container','.ToastContainer','[class*="razorpay"]','[id*="razorpay"]'];
    const hidden = [];
    sels.forEach(selector => {
      try {
        document.querySelectorAll(selector).forEach(el => {
          if (el) {
            hidden.push({ el, d: el.style.display, v: el.style.visibility });
            el.style.display    = 'none';
            el.style.visibility = 'hidden';
          }
        });
      } catch (e) {}
    });
    window.onbeforeunload = null;
    return () => {
      hidden.forEach(({ el, d, v }) => {
        if (el) { el.style.display = d || ''; el.style.visibility = v || ''; }
      });
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!formData.fullName.trim())
      errs.fullName = 'Full name is required';
    else if (formData.fullName.trim().length < 3)
      errs.fullName = 'Name must be at least 3 characters';
    if (!formData.age)
      errs.age = 'Age is required';
    else if (formData.age < 10 || formData.age > 100)
      errs.age = 'Age must be between 10 and 100';
    if (!formData.address.trim())
      errs.address = 'Address is required';
    if (!formData.email.trim())
      errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      errs.email = 'Invalid email format';
    return errs;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (submittedRef.current || isSubmitting) return;

    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    // Lock before calling onSubmit
    submittedRef.current = true;
    setIsSubmitting(true);
    onSubmit(formData);
  };

  const inputStyle = (fieldError) => ({
    width:           '100%',
    padding:         '0.875rem',
    background:      isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc',
    border:          `2px solid ${fieldError ? '#ef4444' : (isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0')}`,
    borderRadius:    '12px',
    color:           isDark ? '#e2e8f0' : '#1e293b',
    fontSize:        '1rem',
    outline:         'none',
    transition:      'border-color 0.2s',
    boxSizing:       'border-box',
    opacity:         isSubmitting ? 0.7 : 1,
  });

  const onFocus = (e, err) => { if (!err && !isSubmitting) e.target.style.borderColor = '#6366f1'; };
  const onBlur  = (e, err) => { if (!err) e.target.style.borderColor = isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0'; };

  const fields = [
    { name: 'fullName', label: 'Full Name',     type: 'text',   icon: <User     size={16} color="#6366f1" />, placeholder: 'Enter your full name' },
    { name: 'age',      label: 'Age',            type: 'number', icon: <Calendar size={16} color="#6366f1" />, placeholder: 'Enter your age', min: 10, max: 100 },
    { name: 'address',  label: 'Address',        type: 'text',   icon: <MapPin   size={16} color="#6366f1" />, placeholder: 'City, State, Country' },
    { name: 'email',    label: 'Email',          type: 'email',  icon: <Mail     size={16} color="#6366f1" />, placeholder: 'your.email@example.com' },
  ];

  return (
    <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, background:isDark?'#0f172a':'#f8fafc', zIndex:999999, display:'flex', alignItems:'flex-start', justifyContent:'center', padding:'1rem', paddingTop:'2rem', paddingBottom:'2rem', overflowY:'auto', overflowX:'hidden', WebkitOverflowScrolling:'touch', animation:'fadeIn 0.3s ease' }}>
      <div style={{ background:isDark?'#1e293b':'#fff', borderRadius:'24px', padding:'2rem', maxWidth:'500px', width:'100%', margin:'auto', boxShadow:isDark?'0 20px 60px rgba(0,0,0,0.5)':'0 20px 60px rgba(0,0,0,0.2)', border:isDark?'2px solid #334155':'2px solid #e2e8f0', animation:'slideUp 0.4s ease' }}>

        {/* Header */}
        <div style={{ textAlign:'center', marginBottom:'2rem' }}>
          <div style={{ width:'80px', height:'80px', margin:'0 auto 1rem', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius:'20px', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 8px 24px rgba(99,102,241,0.4)' }}>
            <Award size={40} color="#fff" />
          </div>
          <h2 style={{ fontSize:'1.75rem', fontWeight:'900', background:'linear-gradient(135deg,#6366f1,#ec4899)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', marginBottom:'0.5rem' }}>
            Certificate Details
          </h2>
          <p style={{ fontSize:'0.95rem', color:isDark?'#94a3b8':'#64748b', lineHeight:1.6 }}>
            {defaultValues ? 'Confirm or update your details before starting.' : 'Complete your details to receive an official certificate upon passing.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {fields.map(({ name, label, type, icon, placeholder, min, max }) => (
            <div key={name} style={{ marginBottom:'1.5rem' }}>
              <label style={{ display:'flex', alignItems:'center', gap:'0.5rem', fontSize:'0.9rem', fontWeight:'600', color:isDark?'#e2e8f0':'#1e293b', marginBottom:'0.5rem' }}>
                {icon} {label}
              </label>
              <input
                type={type} name={name}
                value={formData[name]}
                onChange={handleChange}
                placeholder={placeholder}
                disabled={isSubmitting}
                min={min} max={max}
                style={inputStyle(errors[name])}
                onFocus={(e) => onFocus(e, errors[name])}
                onBlur={(e)  => onBlur(e,  errors[name])}
              />
              {errors[name] && (
                <div style={{ color:'#ef4444', fontSize:'0.8rem', marginTop:'0.5rem' }}>
                  {errors[name]}
                </div>
              )}
            </div>
          ))}

          {/* Info box */}
          <div style={{ background:isDark?'rgba(99,102,241,0.1)':'rgba(99,102,241,0.05)', border:`1px solid ${isDark?'rgba(99,102,241,0.3)':'rgba(99,102,241,0.2)'}`, borderRadius:'12px', padding:'1rem', marginBottom:'1.5rem', fontSize:'0.85rem', color:isDark?'#cbd5e1':'#475569', lineHeight:1.6 }}>
            <strong style={{ color:'#6366f1', display:'block', marginBottom:'0.5rem' }}>Important:</strong>
            Your name, age, and address will appear on your certificate.<br />
            Make sure all details are correct before proceeding.
          </div>

          {/* Buttons */}
          <button
            type="submit"
            disabled={isSubmitting}
            style={{ width:'100%', padding:'1rem', borderRadius:'12px', border:'none', background:isSubmitting?(isDark?'#334155':'#e2e8f0'):'linear-gradient(135deg,#6366f1,#8b5cf6)', color:isSubmitting?(isDark?'#64748b':'#94a3b8'):'#fff', fontSize:'1rem', fontWeight:'700', cursor:isSubmitting?'not-allowed':'pointer', boxShadow:isSubmitting?'none':'0 4px 12px rgba(99,102,241,0.3)', transition:'all 0.2s', marginBottom:'0.75rem' }}
            onMouseEnter={(e) => { if (!isSubmitting) { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 8px 20px rgba(99,102,241,0.4)'; } }}
            onMouseLeave={(e) => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.boxShadow=isSubmitting?'none':'0 4px 12px rgba(99,102,241,0.3)'; }}
          >
            {isSubmitting ? 'Starting test...' : 'Continue to Test'}
          </button>

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              style={{ width:'100%', padding:'0.875rem', borderRadius:'12px', border:`2px solid ${isDark?'rgba(255,255,255,0.1)':'#e2e8f0'}`, background:'transparent', color:isDark?'#94a3b8':'#64748b', fontSize:'0.95rem', fontWeight:'600', cursor:isSubmitting?'not-allowed':'pointer', transition:'all 0.2s' }}
            >
              Cancel
            </button>
          )}
        </form>
      </div>

      <style>{`
        @keyframes fadeIn  { from { opacity: 0; }                        to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}

export default UserDetailsForm;