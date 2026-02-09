import { useState, useRef, type FormEvent, type KeyboardEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../api/client';

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [pin, setPin] = useState(['', '', '', '']);
  const inputRefs = [
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
    useRef<HTMLInputElement>(null),
  ];

  const handlePinChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newPin = [...pin];
    newPin[index] = value.slice(-1);
    setPin(newPin);

    if (value && index < 3) {
      inputRefs[index + 1].current?.focus();
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const password = pin.join('');

    if (password.length !== 4) {
      setError('Please enter 4-digit PIN');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data } = await api.post('/auth/login', {
        emailOrPhone,
        password,
      });

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      toast.success('Login successful!');

      if (data.user.mustChangePassword) {
        navigate('/settings');
        toast('Please change your password', { icon: '⚠️' });
      } else {
        navigate('/');
      }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Invalid credentials');
      setPin(['', '', '', '']);
      inputRefs[0].current?.focus();
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
          <h2 style={{
            fontSize: '28px',
            fontWeight: '700',
            color: '#1a2332',
            marginBottom: '8px',
          }}>
            Welcome Back
          </h2>
          <p style={{ color: '#6b7280', fontSize: '15px' }}>
            Sign in to your account
          </p>
        </div>

        <form onSubmit={handleSubmit}>
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
              Email or Phone Number
            </label>
            <input
              type="text"
              value={emailOrPhone}
              onChange={(e) => setEmailOrPhone(e.target.value)}
              required
              autoFocus
              placeholder="Enter your email or phone"
              style={{
                width: '100%',
                padding: '14px 16px',
                background: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '10px',
                fontSize: '15px',
                color: '#1a2332',
                outline: 'none',
                transition: 'all 0.2s',
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

          <div style={{ marginBottom: error ? '16px' : '28px' }}>
            <label style={{
              display: 'block',
              fontSize: '11px',
              fontWeight: '700',
              color: '#a67c52',
              marginBottom: '12px',
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}>
              Enter PIN
            </label>
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center',
              marginBottom: '12px',
            }}>
              {pin.map((digit, index) => (
                <input
                  key={index}
                  ref={inputRefs[index]}
                  type="password"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handlePinChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  required
                  style={{
                    width: '70px',
                    height: '70px',
                    textAlign: 'center',
                    fontSize: '24px',
                    fontWeight: '700',
                    background: 'white',
                    border: '2px solid #e5e7eb',
                    borderRadius: '12px',
                    color: '#1a2332',
                    transition: 'all 0.2s',
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
              ))}
            </div>
            <div style={{ textAlign: 'right' }}>
              <Link to="/forgot-password" style={{
                color: '#a67c52',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500',
              }}>
                Forgot PIN?
              </Link>
            </div>
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
                display: 'inline-block',
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
              transition: 'all 0.2s',
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
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
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
