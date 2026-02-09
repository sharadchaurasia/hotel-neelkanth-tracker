import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/client';

export default function ForgotPassword() {
  const [step, setStep] = useState<'email' | 'otp' | 'success'>('email');
  const [loading, setLoading] = useState(false);
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

    try {
      const { data } = await api.post('/auth/forgot-password', { email });
      setUserId(data.userId);
      toast.success('OTP sent to your email!');
      setStep('otp');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send OTP');
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
      toast.error('Passwords do not match');
      return;
    }

    if (formData.newPassword.length !== 4) {
      toast.error('PIN must be 4 digits');
      return;
    }

    if (!/^\d{4}$/.test(formData.newPassword)) {
      toast.error('PIN must contain only digits');
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/verify-otp', {
        userId,
        code: formData.code,
        newPassword: formData.newPassword,
      });
      toast.success('Password reset successful!');
      setStep('success');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #0a0e1a 0%, #111827 50%, #0f172a 100%)',
      padding: '20px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '16px',
        padding: '40px',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
          <h1 style={{
            fontSize: '24px',
            fontWeight: '700',
            color: '#e2e8f0',
            marginBottom: '8px',
          }}>
            {step === 'email' && 'Forgot Password'}
            {step === 'otp' && 'Verify OTP'}
            {step === 'success' && 'Success!'}
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>
            {step === 'email' && 'Enter your email to receive OTP'}
            {step === 'otp' && 'Enter OTP and new PIN'}
            {step === 'success' && 'Your password has been reset'}
          </p>
        </div>

        {step === 'email' && (
          <form onSubmit={handleSendOtp}>
            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: '600',
                color: '#94a3b8',
                marginBottom: '8px',
                textTransform: 'uppercase',
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
                  padding: '12px 16px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: '#e2e8f0',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '15px',
                fontWeight: '600',
                opacity: loading ? 0.6 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleResetPassword}>
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: '600',
                color: '#94a3b8',
                marginBottom: '8px',
                textTransform: 'uppercase',
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
                  padding: '12px 16px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: '#e2e8f0',
                  letterSpacing: '4px',
                  textAlign: 'center',
                }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: '600',
                color: '#94a3b8',
                marginBottom: '8px',
                textTransform: 'uppercase',
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
                placeholder="Enter new 4-digit PIN"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: '#e2e8f0',
                  letterSpacing: '8px',
                  textAlign: 'center',
                }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: '600',
                color: '#94a3b8',
                marginBottom: '8px',
                textTransform: 'uppercase',
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
                  padding: '12px 16px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  color: '#e2e8f0',
                  letterSpacing: '8px',
                  textAlign: 'center',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '15px',
                fontWeight: '600',
                opacity: loading ? 0.6 : 1,
                cursor: loading ? 'not-allowed' : 'pointer',
                marginBottom: '12px',
              }}
            >
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>

            <button
              type="button"
              onClick={handleResendOtp}
              disabled={loading}
              className="btn-secondary"
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '14px',
              }}
            >
              Resend OTP
            </button>
          </form>
        )}

        {step === 'success' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '64px', marginBottom: '24px' }}>✅</div>
            <p style={{ color: '#94a3b8', marginBottom: '32px' }}>
              Your password has been successfully reset. You can now login with your new PIN.
            </p>
            <Link to="/login">
              <button className="btn-primary" style={{
                width: '100%',
                padding: '14px',
                fontSize: '15px',
                fontWeight: '600',
              }}>
                Back to Login
              </button>
            </Link>
          </div>
        )}

        <div style={{
          marginTop: '24px',
          textAlign: 'center',
          fontSize: '13px',
        }}>
          <Link to="/login" style={{
            color: '#64748b',
            textDecoration: 'none',
          }}>
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
