import React, { useState } from 'react';
import { useTheme } from '../App';
import { User, Mail, MapPin, Calendar, Award } from 'lucide-react';

function UserDetailsForm({ onSubmit, onCancel }) {
  const { isDark } = useTheme();
  const [formData, setFormData] = useState({
    fullName: '',
    age: '',
    address: '',
    email: ''
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.trim().length < 3) {
      newErrors.fullName = 'Name must be at least 3 characters';
    }
    
    if (!formData.age) {
      newErrors.age = 'Age is required';
    } else if (formData.age < 10 || formData.age > 100) {
      newErrors.age = 'Age must be between 10 and 100';
    }
    
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = validate();
    
    if (Object.keys(newErrors).length === 0) {
      onSubmit(formData);
    } else {
      setErrors(newErrors);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.7)',
      backdropFilter: 'blur(8px)',
      zIndex: 10000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      animation: 'fadeIn 0.3s ease'
    }}>
      <div style={{
        background: isDark ? '#1e293b' : '#fff',
        borderRadius: '24px',
        padding: '2rem',
        maxWidth: '500px',
        width: '100%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        animation: 'slideUp 0.4s ease'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '80px',
            height: '80px',
            margin: '0 auto 1rem',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(99,102,241,0.4)'
          }}>
            <Award size={40} color="#fff" />
          </div>
          <h2 style={{
            fontSize: '1.75rem',
            fontWeight: '900',
            background: 'linear-gradient(135deg, #6366f1, #ec4899)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '0.5rem'
          }}>
            Certificate Details
          </h2>
          <p style={{
            fontSize: '0.95rem',
            color: isDark ? '#94a3b8' : '#64748b',
            lineHeight: 1.6
          }}>
            Complete your details to receive an official certificate upon passing (70%+)
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Full Name */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.9rem',
              fontWeight: '600',
              color: isDark ? '#e2e8f0' : '#1e293b',
              marginBottom: '0.5rem'
            }}>
              <User size={16} color="#6366f1" />
              Full Name
            </label>
            <input
              type="text"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Enter your full name"
              style={{
                width: '100%',
                padding: '0.875rem',
                background: isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc',
                border: `2px solid ${errors.fullName ? '#ef4444' : (isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0')}`,
                borderRadius: '12px',
                color: isDark ? '#e2e8f0' : '#1e293b',
                fontSize: '1rem',
                outline: 'none'
              }}
            />
            {errors.fullName && (
              <div style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                ⚠️ {errors.fullName}
              </div>
            )}
          </div>

          {/* Age */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.9rem',
              fontWeight: '600',
              color: isDark ? '#e2e8f0' : '#1e293b',
              marginBottom: '0.5rem'
            }}>
              <Calendar size={16} color="#6366f1" />
              Age
            </label>
            <input
              type="number"
              name="age"
              value={formData.age}
              onChange={handleChange}
              placeholder="Enter your age"
              min="10"
              max="100"
              style={{
                width: '100%',
                padding: '0.875rem',
                background: isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc',
                border: `2px solid ${errors.age ? '#ef4444' : (isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0')}`,
                borderRadius: '12px',
                color: isDark ? '#e2e8f0' : '#1e293b',
                fontSize: '1rem',
                outline: 'none'
              }}
            />
            {errors.age && (
              <div style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                ⚠️ {errors.age}
              </div>
            )}
          </div>

          {/* Address */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.9rem',
              fontWeight: '600',
              color: isDark ? '#e2e8f0' : '#1e293b',
              marginBottom: '0.5rem'
            }}>
              <MapPin size={16} color="#6366f1" />
              Address
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="City, State, Country"
              style={{
                width: '100%',
                padding: '0.875rem',
                background: isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc',
                border: `2px solid ${errors.address ? '#ef4444' : (isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0')}`,
                borderRadius: '12px',
                color: isDark ? '#e2e8f0' : '#1e293b',
                fontSize: '1rem',
                outline: 'none'
              }}
            />
            {errors.address && (
              <div style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                ⚠️ {errors.address}
              </div>
            )}
          </div>

          {/* Email */}
          <div style={{ marginBottom: '2rem' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.9rem',
              fontWeight: '600',
              color: isDark ? '#e2e8f0' : '#1e293b',
              marginBottom: '0.5rem'
            }}>
              <Mail size={16} color="#6366f1" />
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your.email@example.com"
              style={{
                width: '100%',
                padding: '0.875rem',
                background: isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc',
                border: `2px solid ${errors.email ? '#ef4444' : (isDark ? 'rgba(255,255,255,0.1)' : '#e2e8f0')}`,
                borderRadius: '12px',
                color: isDark ? '#e2e8f0' : '#1e293b',
                fontSize: '1rem',
                outline: 'none'
              }}
            />
            {errors.email && (
              <div style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                ⚠️ {errors.email}
              </div>
            )}
          </div>

          {/* Info */}
          <div style={{
            background: isDark ? 'rgba(99,102,241,0.1)' : 'rgba(99,102,241,0.05)',
            border: `1px solid ${isDark ? 'rgba(99,102,241,0.3)' : 'rgba(99,102,241,0.2)'}`,
            borderRadius: '12px',
            padding: '1rem',
            marginBottom: '2rem',
            fontSize: '0.85rem',
            color: isDark ? '#cbd5e1' : '#475569'
          }}>
            <strong style={{ color: '#6366f1', display: 'block', marginBottom: '0.5rem' }}>
              📋 Important:
            </strong>
            • Used on your certificate<br/>
            • Certificate only for 70%+ scores<br/>
            • One certificate per account
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              type="button"
              onClick={onCancel}
              style={{
                flex: 1,
                padding: '1rem',
                borderRadius: '12px',
                border: `2px solid ${isDark ? '#334155' : '#e2e8f0'}`,
                background: 'transparent',
                color: isDark ? '#e2e8f0' : '#1e293b',
                fontSize: '1rem',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                flex: 1,
                padding: '1rem',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: '#fff',
                fontSize: '1rem',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(99,102,241,0.3)'
              }}
            >
              Continue
            </button>
          </div>
        </form>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default UserDetailsForm;