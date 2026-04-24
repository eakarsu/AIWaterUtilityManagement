import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { Droplets, LogIn, Zap } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      toast.success('Welcome back!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = () => {
    setEmail('admin@waterutility.com');
    setPassword('admin123');
    setTimeout(() => {
      document.getElementById('login-form').requestSubmit();
    }, 100);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0a1628 0%, #0d2137 40%, #0a2a3a 70%, #0d3b4a 100%)',
        padding: '20px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          background: '#111d35',
          borderRadius: '16px',
          padding: '40px 36px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
          border: '1px solid rgba(0, 180, 216, 0.15)',
        }}
      >
        {/* Logo / Title */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #00b4d8, #0077b6)',
              marginBottom: '16px',
            }}
          >
            <Droplets size={32} color="#ffffff" />
          </div>
          <h1
            style={{
              fontSize: '28px',
              fontWeight: 700,
              color: '#e0e6ed',
              margin: '0 0 6px 0',
              letterSpacing: '-0.5px',
            }}
          >
            AquaFlow AI
          </h1>
          <p style={{ color: '#7a8ba8', fontSize: '14px', margin: 0 }}>
            Water Utility Management System
          </p>
        </div>

        {/* Form */}
        <form id="login-form" onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label
              style={{
                display: 'block',
                color: '#a0aec0',
                fontSize: '13px',
                fontWeight: 500,
                marginBottom: '8px',
              }}
            >
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                background: '#0a1628',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                color: '#e0e6ed',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#00b4d8')}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
            />
          </div>

          <div style={{ marginBottom: '28px' }}>
            <label
              style={{
                display: 'block',
                color: '#a0aec0',
                fontSize: '13px',
                fontWeight: 500,
                marginBottom: '8px',
              }}
            >
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                background: '#0a1628',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                color: '#e0e6ed',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#00b4d8')}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '13px',
              background: loading
                ? 'rgba(0, 180, 216, 0.5)'
                : 'linear-gradient(135deg, #00b4d8, #0096c7)',
              border: 'none',
              borderRadius: '10px',
              color: '#ffffff',
              fontSize: '15px',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'opacity 0.2s',
            }}
          >
            <LogIn size={18} />
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Quick Login */}
        <button
          onClick={handleQuickLogin}
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            marginTop: '12px',
            background: 'rgba(0, 180, 216, 0.08)',
            border: '1px dashed rgba(0, 180, 216, 0.35)',
            borderRadius: '10px',
            color: '#00b4d8',
            fontSize: '13px',
            fontWeight: 500,
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'background 0.2s',
          }}
        >
          <Zap size={16} />
          Quick Login (Demo)
        </button>

        <p
          style={{
            textAlign: 'center',
            color: '#4a5568',
            fontSize: '12px',
            marginTop: '24px',
            marginBottom: 0,
          }}
        >
          Powered by AquaFlow AI &middot; v2.0
        </p>
      </div>
    </div>
  );
}
