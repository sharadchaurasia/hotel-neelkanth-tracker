import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/client';

export default function ForgotPassword() {
  const [step, setStep] = useState<'email' | 'otp' | 'success'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [userId, setUserId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleSendOtp = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      setUserId(data.userId);
      toast.success('OTP sent to your email!');
      setStep('otp');
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!userId) return;
    setLoading(true);

    try {
      await api.post('/auth/resend-otp', { userId });
      toast.success('OTP resent!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();

    if (formData.newPassword !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.newPassword.length !== 4) {
      setError('PIN must be 4 digits');
      return;
    }

    if (!/^\d{4}$/.test(formData.newPassword)) {
      setError('PIN must contain only digits');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.post('/auth/verify-otp', {
        userId,
        code: formData.code,
        newPassword: formData.newPassword,
      });
      toast.success('Password reset successful!');
      setStep('success');
    } catch (error: any) {
      setError(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#1a2332',
      padding: '20px',
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{
          fontSize: '42px',
          fontWeight: '700',
          color: '#c9a35f',
          marginBottom: '8px',
          letterSpacing: '1px',
        }}>
          AKS Hospitality
        </h1>
        <p style={{
          fontSize: '13px',
          color: '#7a8699',
          letterSpacing: '3px',
          textTransform: 'uppercase',
        }}>
          Travel & Tourism
        </p>
      </div>

      {/* Card */}
      <div style={{
        width: '100%',
        maxWidth: '440px',
        background: '#f5f3ef',
        borderRadius: '20px',
        padding: '48px 40px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>
            {step === 'email' && '🔒'}
            {step === 'otp' && '📧'}
            {step === 'success' && '✅'}
          </div>
          <h2 style={{
            fontSize: '28px',
            fontWeight: '700',
            color: '#1a2332',
            marginBottom: '8px',
          }}>
            {step === 'email' && 'Forgot Password'}
            {step === 'otp' && 'Verify OTP'}
            {step === 'success' && 'Success!'}
          </h2>
          <p style={{ color: '#6b7280', fontSize: '15px' }}>
            {step === 'email' && 'Enter your email to receive OTP'}
            {step === 'otp' && 'Enter OTP and new PIN'}
            {step === 'success' && 'Your password has been reset'}
          </p>
        </div>

        {step === 'email' && (
          <form onSubmit={handleSendOtp}>
            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: '700',
                color: '#a67c52',
                marginBottom: '10px',
                textTransform: 'uppercase',
                letterSpacing: '1px',
              }}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                placeholder="Enter your email"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  background: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '10px',
                  fontSize: '15px',
                  color: '#1a2332',
                  outline: 'none',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#c9a35f';
                  e.target.style.boxShadow = '0 0 0 3px rgba(201,163,95,0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e5e7eb';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            {error && (
              <div style={{
                padding: '12px 16px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <span style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#ef4444',
                }} />
                <span style={{ color: '#dc2626', fontSize: '14px' }}>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '16px',
                background: '#6b7b93',
                border: 'none',
                borderRadius: '10px',
                color: 'white',
                fontSize: '16px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.background = '#5a6a80';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#6b7b93';
              }}
            >
              <span style={{ fontSize: '18px' }}>→</span>
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleResetPassword}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: '700',
                color: '#a67c52',
                marginBottom: '10px',
                textTransform: 'uppercase',
                letterSpacing: '1px',
              }}>
                OTP Code
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                required
                autoFocus
                maxLength={6}
                placeholder="Enter 6-digit OTP"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  background: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '10px',
                  fontSize: '15px',
                  color: '#1a2332',
                  letterSpacing: '4px',
                  textAlign: 'center',
                  outline: 'none',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#c9a35f';
                  e.target.style.boxShadow = '0 0 0 3px rgba(201,163,95,0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e5e7eb';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: '700',
                color: '#a67c52',
                marginBottom: '10px',
                textTransform: 'uppercase',
                letterSpacing: '1px',
              }}>
                New 4-Digit PIN
              </label>
              <input
                type="password"
                inputMode="numeric"
                value={formData.newPassword}
                onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                required
                maxLength={4}
                placeholder="Enter new PIN"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  background: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '10px',
                  fontSize: '15px',
                  color: '#1a2332',
                  letterSpacing: '8px',
                  textAlign: 'center',
                  outline: 'none',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#c9a35f';
                  e.target.style.boxShadow = '0 0 0 3px rgba(201,163,95,0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e5e7eb';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <div style={{ marginBottom: error ? '16px' : '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '11px',
                fontWeight: '700',
                color: '#a67c52',
                marginBottom: '10px',
                textTransform: 'uppercase',
                letterSpacing: '1px',
              }}>
                Confirm PIN
              </label>
              <input
                type="password"
                inputMode="numeric"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                required
                maxLength={4}
                placeholder="Re-enter PIN"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  background: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '10px',
                  fontSize: '15px',
                  color: '#1a2332',
                  letterSpacing: '8px',
                  textAlign: 'center',
                  outline: 'none',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#c9a35f';
                  e.target.style.boxShadow = '0 0 0 3px rgba(201,163,95,0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#e5e7eb';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            {error && (
              <div style={{
                padding: '12px 16px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}>
                <span style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#ef4444',
                }} />
                <span style={{ color: '#dc2626', fontSize: '14px' }}>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '16px',
                background: '#6b7b93',
                border: 'none',
                borderRadius: '10px',
                color: 'white',
                fontSize: '16px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.background = '#5a6a80';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#6b7b93';
              }}
            >
              <span style={{ fontSize: '18px' }}>→</span>
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>

            <button
              type="button"
              onClick={handleResendOtp}
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '10px',
                color: '#1a2332',
                fontSize: '15px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              Resend OTP
            </button>
          </form>
        )}

        {step === 'success' && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#6b7280', marginBottom: '32px', lineHeight: '1.6' }}>
              Your password has been successfully reset. You can now login with your new PIN.
            </p>
            <Link to="/login">
              <button style={{
                width: '100%',
                padding: '16px',
                background: '#6b7b93',
                border: 'none',
                borderRadius: '10px',
                color: 'white',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#5a6a80';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#6b7b93';
              }}>
                <span style={{ fontSize: '18px' }}>→</span>
                Back to Login
              </button>
            </Link>
          </div>
        )}

        <div style={{
          marginTop: '24px',
          textAlign: 'center',
        }}>
          <Link to="/login" style={{
            color: '#6b7280',
            textDecoration: 'none',
            fontSize: '14px',
          }}>
            ← Back to Login
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        marginTop: '32px',
        textAlign: 'center',
        color: '#7a8699',
        fontSize: '13px',
      }}>
        The Neelkanth CRM
      </div>
    </div>
  );
}
