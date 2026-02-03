import React, { useState } from 'react';
import { useAuth } from '../App';
import { LogIn, UserPlus, Mail, Lock, User as UserIcon, Eye, EyeOff, KeyRound } from 'lucide-react';

function LoginPage() {
  const { login, register, resetPassword } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isLogin) {
      const result = await login(formData.email, formData.password);
      
      if (result && result.success) {
        // Login successful - handled by App.js
      }
    } else {
      const result = await register(formData.email, formData.password, formData.name);
      
      if (result && result.success) {
        // Registration successful - handled by App.js
      }
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (!resetEmail) {
      window.showToast?.('⚠️ Please enter your email address', 'warning');
      return;
    }

    setIsResetting(true);
    
    try {
      const result = await resetPassword(resetEmail);
      
      if (result.success) {
        window.showToast?.('✅ Password reset email sent! Check your inbox.', 'success');
        setShowResetPassword(false);
        setResetEmail('');
      } else {
        window.showToast?.('❌ ' + result.error, 'error');
      }
    } catch (error) {
      console.error('Reset error:', error);
      window.showToast?.('❌ Failed to send reset email', 'error');
    }
    
    setIsResetting(false);
  };

  return (
    <div style={{
      paddingTop: '80px',
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem'
    }}>
      <div style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '32px',
        padding: 'clamp(2rem, 5vw, 3rem)',
        maxWidth: '480px',
        width: '100%',
        boxShadow: '0 10px 40px rgba(0,0,0,0.08)',
        animation: 'fadeInUp 0.5s ease'
      }}>
        <div style={{
          textAlign: 'center',
          marginBottom: '2rem'
        }}>
          <div style={{
            width: '70px',
            height: '70px',
            background: 'linear-gradient(135deg, #6366f1, #ec4899)',
            borderRadius: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem',
            fontSize: '2rem',
            boxShadow: '0 8px 24px rgba(99,102,241,0.3)'
          }}>
            🎓
          </div>
          <h2 style={{
            fontSize: 'clamp(1.8rem, 5vw, 2.2rem)',
            fontWeight: '900',
            background: 'linear-gradient(135deg, #6366f1, #ec4899)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            marginBottom: '0.5rem'
          }}>
            {showResetPassword ? 'Reset Password' : (isLogin ? 'Welcome Back!' : 'Create Account')}
          </h2>
          <p style={{
            color: '#64748b',
            fontSize: '1rem'
          }}>
            {showResetPassword 
              ? 'Enter your email to receive reset link' 
              : (isLogin ? 'Login to access your notes' : 'Join FaizUpyZone today')
            }
          </p>
        </div>

        {showResetPassword ? (
          // Password Reset Form
          <form onSubmit={handleResetPassword} style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem'
          }}>
            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontSize: '0.9rem',
                fontWeight: '600',
                color: '#1e293b'
              }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail 
                  size={18} 
                  color="#94a3b8"
                  style={{
                    position: 'absolute',
                    left: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)'
                  }}
                />
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  style={{
                    width: '100%',
                    padding: '0.9rem 1rem 0.9rem 2.75rem',
                    border: '2px solid #e2e8f0',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    transition: 'all 0.3s ease',
                    outline: 'none',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#6366f1';
                    e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e2e8f0';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isResetting}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #6366f1, #ec4899)',
                border: 'none',
                color: 'white',
                padding: '1rem',
                fontSize: '1.05rem',
                borderRadius: '12px',
                cursor: isResetting ? 'not-allowed' : 'pointer',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 15px rgba(99,102,241,0.3)',
                transition: 'all 0.3s ease',
                opacity: isResetting ? 0.6 : 1
              }}
              onMouseEnter={(e) => {
                if (!isResetting) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(99,102,241,0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isResetting) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(99,102,241,0.3)';
                }
              }}
            >
              <KeyRound size={20} />
              {isResetting ? 'Sending...' : 'Send Reset Link'}
            </button>

            <button
              type="button"
              onClick={() => {
                setShowResetPassword(false);
                setResetEmail('');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#6366f1',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '0.95rem',
                textDecoration: 'underline'
              }}
            >
              ← Back to Login
            </button>
          </form>
        ) : (
          // Login/Register Form
          <form onSubmit={handleSubmit} style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem'
          }}>
            {!isLogin && (
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  color: '#1e293b'
                }}>
                  Full Name
                </label>
                <div style={{ position: 'relative' }}>
                  <UserIcon 
                    size={18} 
                    color="#94a3b8"
                    style={{
                      position: 'absolute',
                      left: '1rem',
                      top: '50%',
                      transform: 'translateY(-50%)'
                    }}
                  />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Enter your name"
                    required={!isLogin}
                    style={{
                      width: '100%',
                      padding: '0.9rem 1rem 0.9rem 2.75rem',
                      border: '2px solid #e2e8f0',
                      borderRadius: '12px',
                      fontSize: '1rem',
                      transition: 'all 0.3s ease',
                      outline: 'none',
                      boxSizing: 'border-box',
                      fontFamily: 'inherit'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#6366f1';
                      e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e2e8f0';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>
              </div>
            )}

            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontSize: '0.9rem',
                fontWeight: '600',
                color: '#1e293b'
              }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail 
                  size={18} 
                  color="#94a3b8"
                  style={{
                    position: 'absolute',
                    left: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)'
                  }}
                />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="your@email.com"
                  required
                  style={{
                    width: '100%',
                    padding: '0.9rem 1rem 0.9rem 2.75rem',
                    border: '2px solid #e2e8f0',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    transition: 'all 0.3s ease',
                    outline: 'none',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#6366f1';
                    e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e2e8f0';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontSize: '0.9rem',
                fontWeight: '600',
                color: '#1e293b'
              }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock 
                  size={18} 
                  color="#94a3b8"
                  style={{
                    position: 'absolute',
                    left: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)'
                  }}
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder="••••••••"
                  required
                  style={{
                    width: '100%',
                    padding: '0.9rem 2.75rem 0.9rem 2.75rem',
                    border: '2px solid #e2e8f0',
                    borderRadius: '12px',
                    fontSize: '1rem',
                    transition: 'all 0.3s ease',
                    outline: 'none',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#6366f1';
                    e.target.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e2e8f0';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '1rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {showPassword ? 
                    <EyeOff size={18} color="#94a3b8" /> : 
                    <Eye size={18} color="#94a3b8" />
                  }
                </button>
              </div>
            </div>

            {isLogin && (
              <div style={{ textAlign: 'right', marginTop: '-0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setShowResetPassword(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#6366f1',
                    cursor: 'pointer',
                    fontWeight: '600',
                    fontSize: '0.9rem',
                    textDecoration: 'underline'
                  }}
                >
                  Forgot Password?
                </button>
              </div>
            )}

            <button 
              type="submit" 
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #6366f1, #ec4899)',
                border: 'none',
                color: 'white',
                padding: '1rem',
                fontSize: '1.05rem',
                borderRadius: '12px',
                cursor: 'pointer',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 15px rgba(99,102,241,0.3)',
                transition: 'all 0.3s ease',
                marginTop: '0.5rem'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(99,102,241,0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(99,102,241,0.3)';
              }}
            >
              {isLogin ? <LogIn size={20} /> : <UserPlus size={20} />}
              {isLogin ? 'Login' : 'Create Account'}
            </button>
          </form>
        )}

        {!showResetPassword && (
          <div style={{
            textAlign: 'center',
            marginTop: '1.75rem',
            paddingTop: '1.75rem',
            borderTop: '1px solid #e2e8f0'
          }}>
            <p style={{
              color: '#64748b',
              fontSize: '0.95rem'
            }}>
              {isLogin ? "Don't have an account?" : 'Already have an account?'}
              {' '}
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setFormData({ email: '', password: '', name: '' });
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#6366f1',
                  cursor: 'pointer',
                  fontWeight: '700',
                  fontSize: '0.95rem',
                  textDecoration: 'underline'
                }}
              >
                {isLogin ? 'Sign up' : 'Login'}
              </button>
            </p>
          </div>
        )}
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

export default LoginPage;