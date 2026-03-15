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
      if (result && result.success) {}
    } else {
      const result = await register(formData.email, formData.password, formData.name);
      if (result && result.success) {}
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
      padding: '2rem 1rem',
      position: 'relative',
      overflow: 'hidden'
    }}>

      {/* Floating orbs background */}
      <div style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        pointerEvents: 'none',
        zIndex: 0,
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          width: '500px', height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
          top: '-100px', left: '-100px',
          animation: 'floatOrb1 8s ease-in-out infinite'
        }} />
        <div style={{
          position: 'absolute',
          width: '400px', height: '400px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(236,72,153,0.12) 0%, transparent 70%)',
          bottom: '-80px', right: '-80px',
          animation: 'floatOrb2 10s ease-in-out infinite'
        }} />
        <div style={{
          position: 'absolute',
          width: '250px', height: '250px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)',
          top: '50%', left: '60%',
          animation: 'floatOrb3 12s ease-in-out infinite'
        }} />
      </div>

      {/* Main Card */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        width: '100%',
        maxWidth: '460px',
        animation: 'cardEntrance 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both'
      }}>

        {/* Glass card */}
        <div style={{
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderRadius: '28px',
          border: '1px solid rgba(255,255,255,0.9)',
          boxShadow: '0 8px 32px rgba(99,102,241,0.12), 0 2px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)',
          overflow: 'hidden'
        }}>

          {/* Top accent bar */}
          <div style={{
            height: '4px',
            background: 'linear-gradient(90deg, #6366f1, #a855f7, #ec4899)',
            backgroundSize: '200% 100%',
            animation: 'shimmerBar 3s linear infinite'
          }} />

          <div style={{ padding: 'clamp(2rem, 5vw, 2.75rem)' }}>

            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              {/* Logo */}
              <div style={{
                width: '72px', height: '72px',
                background: 'linear-gradient(135deg, #6366f1, #ec4899)',
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem',
                fontSize: '2rem',
                boxShadow: '0 8px 24px rgba(99,102,241,0.35), 0 2px 8px rgba(99,102,241,0.2)',
                position: 'relative',
                animation: 'logoPulse 3s ease-in-out infinite'
              }}>
                🎓
                {/* Glow ring */}
                <div style={{
                  position: 'absolute',
                  inset: '-4px',
                  borderRadius: '24px',
                  background: 'linear-gradient(135deg, #6366f1, #ec4899)',
                  opacity: 0.2,
                  filter: 'blur(8px)',
                  zIndex: -1
                }} />
              </div>

              <h2 style={{
                fontSize: 'clamp(1.7rem, 5vw, 2rem)',
                fontWeight: '900',
                background: 'linear-gradient(135deg, #6366f1, #ec4899)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                marginBottom: '0.4rem',
                letterSpacing: '-0.5px',
                fontFamily: "'Georgia', serif"
              }}>
                {showResetPassword ? 'Reset Password' : (isLogin ? 'Welcome Back!' : 'Join PySkill')}
              </h2>

              <p style={{
                color: '#94a3b8',
                fontSize: '0.95rem',
                fontWeight: '500',
                letterSpacing: '0.01em'
              }}>
                {showResetPassword
                  ? 'Enter your email to receive reset link'
                  : (isLogin ? 'Login to access your notes' : 'Join PySkill today')}
              </p>
            </div>

            {/* Tab switcher - Login/Register */}
            {!showResetPassword && (
              <div style={{
                display: 'flex',
                background: '#f1f5f9',
                borderRadius: '14px',
                padding: '4px',
                marginBottom: '1.75rem',
                gap: '4px'
              }}>
                {['Login', 'Sign Up'].map((tab, i) => (
                  <button
                    key={tab}
                    onClick={() => {
                      setIsLogin(i === 0);
                      setFormData({ email: '', password: '', name: '' });
                    }}
                    style={{
                      flex: 1,
                      padding: '0.65rem',
                      borderRadius: '10px',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '0.95rem',
                      fontWeight: '700',
                      transition: 'all 0.25s ease',
                      background: (isLogin ? i === 0 : i === 1)
                        ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                        : 'transparent',
                      color: (isLogin ? i === 0 : i === 1) ? '#fff' : '#94a3b8',
                      boxShadow: (isLogin ? i === 0 : i === 1)
                        ? '0 4px 12px rgba(99,102,241,0.3)'
                        : 'none'
                    }}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            )}

            {/* Reset Password Form */}
            {showResetPassword ? (
              <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <InputField
                  icon={<Mail size={17} color="#94a3b8" />}
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="your@email.com"
                  label="Email Address"
                  required
                />

                <SubmitButton disabled={isResetting}>
                  <KeyRound size={18} />
                  {isResetting ? 'Sending...' : 'Send Reset Link'}
                </SubmitButton>

                <button
                  type="button"
                  onClick={() => { setShowResetPassword(false); setResetEmail(''); }}
                  style={{
                    background: 'none', border: 'none',
                    color: '#6366f1', cursor: 'pointer',
                    fontWeight: '600', fontSize: '0.9rem',
                    textAlign: 'center'
                  }}
                >
                  ← Back to Login
                </button>
              </form>
            ) : (
              /* Login/Register Form */
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                {!isLogin && (
                  <InputField
                    icon={<UserIcon size={17} color="#94a3b8" />}
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter your full name"
                    label="Full Name"
                    required={!isLogin}
                  />
                )}

                <InputField
                  icon={<Mail size={17} color="#94a3b8" />}
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="your@email.com"
                  label="Email Address"
                  required
                />

                <div>
                  <label style={{
                    display: 'block', marginBottom: '0.45rem',
                    fontSize: '0.85rem', fontWeight: '700',
                    color: '#475569', letterSpacing: '0.02em',
                    textTransform: 'uppercase'
                  }}>
                    Password
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{
                      position: 'absolute', left: '1rem',
                      top: '50%', transform: 'translateY(-50%)',
                      display: 'flex', alignItems: 'center', pointerEvents: 'none'
                    }}>
                      <Lock size={17} color="#94a3b8" />
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="••••••••"
                      required
                      style={{
                        width: '100%',
                        padding: '0.85rem 3rem 0.85rem 2.75rem',
                        border: '2px solid #e8edf5',
                        borderRadius: '12px',
                        fontSize: '1rem',
                        outline: 'none',
                        boxSizing: 'border-box',
                        fontFamily: 'inherit',
                        background: '#fafbff',
                        transition: 'all 0.2s ease',
                        color: '#1e293b'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#6366f1';
                        e.target.style.background = '#fff';
                        e.target.style.boxShadow = '0 0 0 4px rgba(99,102,241,0.08)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#e8edf5';
                        e.target.style.background = '#fafbff';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute', right: '1rem',
                        top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none',
                        cursor: 'pointer', padding: '0.25rem',
                        display: 'flex', alignItems: 'center',
                        color: '#94a3b8', transition: 'color 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.color = '#6366f1'}
                      onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
                    >
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>

                {isLogin && (
                  <div style={{ textAlign: 'right', marginTop: '-0.25rem' }}>
                    <button
                      type="button"
                      onClick={() => setShowResetPassword(true)}
                      style={{
                        background: 'none', border: 'none',
                        color: '#6366f1', cursor: 'pointer',
                        fontWeight: '600', fontSize: '0.85rem',
                        transition: 'opacity 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
                      onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                    >
                      Forgot Password?
                    </button>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  style={{
                    width: '100%',
                    background: 'linear-gradient(135deg, #6366f1, #ec4899)',
                    border: 'none',
                    color: 'white',
                    padding: '1rem',
                    fontSize: '1rem',
                    borderRadius: '12px',
                    cursor: 'pointer',
                    fontWeight: '800',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.6rem',
                    boxShadow: '0 4px 20px rgba(99,102,241,0.35)',
                    transition: 'all 0.3s ease',
                    marginTop: '0.5rem',
                    letterSpacing: '0.02em',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 8px 28px rgba(99,102,241,0.45)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(99,102,241,0.35)';
                  }}
                >
                  {/* Shine effect */}
                  <span style={{
                    position: 'absolute',
                    top: 0, left: '-100%',
                    width: '60%', height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
                    animation: 'btnShine 3s ease-in-out infinite'
                  }} />
                  {isLogin ? <LogIn size={19} /> : <UserPlus size={19} />}
                  {isLogin ? 'Login to PySkill' : 'Create Account'}
                </button>

                {/* Divider */}
                <div style={{
                  display: 'flex', alignItems: 'center',
                  gap: '1rem', margin: '0.5rem 0'
                }}>
                  <div style={{ flex: 1, height: '1px', background: '#e8edf5' }} />
                  <span style={{ color: '#cbd5e1', fontSize: '0.8rem', fontWeight: '600' }}>OR</span>
                  <div style={{ flex: 1, height: '1px', background: '#e8edf5' }} />
                </div>

                {/* Switch mode */}
                <p style={{
                  textAlign: 'center',
                  color: '#94a3b8',
                  fontSize: '0.9rem',
                  margin: 0
                }}>
                  {isLogin ? "Don't have an account?" : 'Already have an account?'}
                  {' '}
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(!isLogin);
                      setFormData({ email: '', password: '', name: '' });
                    }}
                    style={{
                      background: 'none', border: 'none',
                      color: '#6366f1', cursor: 'pointer',
                      fontWeight: '700', fontSize: '0.9rem',
                      transition: 'opacity 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.opacity = '0.7'}
                    onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                  >
                    {isLogin ? 'Sign up free' : 'Login'}
                  </button>
                </p>
              </form>
            )}
          </div>

          {/* Bottom trust bar */}
          <div style={{
            borderTop: '1px solid rgba(226,232,240,0.6)',
            padding: '1rem 2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1.5rem',
            background: 'rgba(248,250,252,0.6)'
          }}>
            {['🔒 SSL Secure', '⚡ Instant Access', '📚 1000+ Notes'].map((item) => (
              <span key={item} style={{
                fontSize: '0.75rem',
                fontWeight: '600',
                color: '#94a3b8',
                letterSpacing: '0.01em'
              }}>
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes cardEntrance {
          from { opacity: 0; transform: translateY(40px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes floatOrb1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%       { transform: translate(30px, 40px) scale(1.1); }
        }
        @keyframes floatOrb2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50%       { transform: translate(-25px, -35px) scale(1.08); }
        }
        @keyframes floatOrb3 {
          0%, 100% { transform: translate(0, 0); }
          50%       { transform: translate(20px, -20px); }
        }
        @keyframes shimmerBar {
          0%   { background-position: 0% 0%; }
          100% { background-position: 200% 0%; }
        }
        @keyframes logoPulse {
          0%, 100% { box-shadow: 0 8px 24px rgba(99,102,241,0.35), 0 2px 8px rgba(99,102,241,0.2); }
          50%       { box-shadow: 0 8px 32px rgba(99,102,241,0.5), 0 2px 12px rgba(236,72,153,0.25); }
        }
        @keyframes btnShine {
          0%   { left: -100%; }
          40%, 100% { left: 150%; }
        }
      `}</style>
    </div>
  );
}

/* Reusable Input Field */
function InputField({ icon, type, value, onChange, placeholder, label, required }) {
  return (
    <div>
      <label style={{
        display: 'block', marginBottom: '0.45rem',
        fontSize: '0.85rem', fontWeight: '700',
        color: '#475569', letterSpacing: '0.02em',
        textTransform: 'uppercase'
      }}>
        {label}
      </label>
      <div style={{ position: 'relative' }}>
        <span style={{
          position: 'absolute', left: '1rem',
          top: '50%', transform: 'translateY(-50%)',
          display: 'flex', alignItems: 'center', pointerEvents: 'none'
        }}>
          {icon}
        </span>
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          style={{
            width: '100%',
            padding: '0.85rem 1rem 0.85rem 2.75rem',
            border: '2px solid #e8edf5',
            borderRadius: '12px',
            fontSize: '1rem',
            outline: 'none',
            boxSizing: 'border-box',
            fontFamily: 'inherit',
            background: '#fafbff',
            transition: 'all 0.2s ease',
            color: '#1e293b'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#6366f1';
            e.target.style.background = '#fff';
            e.target.style.boxShadow = '0 0 0 4px rgba(99,102,241,0.08)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#e8edf5';
            e.target.style.background = '#fafbff';
            e.target.style.boxShadow = 'none';
          }}
        />
      </div>
    </div>
  );
}

/* Reusable Submit Button */
function SubmitButton({ children, disabled }) {
  return (
    <button
      type="submit"
      disabled={disabled}
      style={{
        width: '100%',
        background: 'linear-gradient(135deg, #6366f1, #ec4899)',
        border: 'none',
        color: 'white',
        padding: '1rem',
        fontSize: '1rem',
        borderRadius: '12px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontWeight: '800',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.6rem',
        boxShadow: '0 4px 20px rgba(99,102,241,0.35)',
        transition: 'all 0.3s ease',
        opacity: disabled ? 0.6 : 1
      }}
    >
      {children}
    </button>
  );
}

export default LoginPage;