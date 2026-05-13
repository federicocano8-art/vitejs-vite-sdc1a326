import { useState } from 'react';

export default function Login({ styles, onLogin, onRegistro }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await onLogin(email, password);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'radial-gradient(circle at 10% 30%, #0a0f2a, #03050b)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        style={{
          background: 'rgba(20, 30, 55, 0.8)',
          backdropFilter: 'blur(12px)',
          borderRadius: '32px',
          padding: '48px',
          width: '100%',
          maxWidth: '420px',
          boxShadow:
            '0 25px 45px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,255,255,0.2)',
          border: '1px solid rgba(0,255,255,0.3)',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div
            style={{ fontSize: '72px', filter: 'drop-shadow(0 0 8px cyan)' }}
          >
            🚒
          </div>
          <h1
            style={{
              fontSize: '28px',
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #aaffff, #4d9eff)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
            }}
          >
            Bomberos Ramallo
          </h1>
          <p style={{ color: '#8eacc5' }}>Sistema de Gestión Integral</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ ...styles.label, color: '#bbd4ff' }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                ...styles.input,
                background: '#0f172a',
                borderColor: '#3b82f6',
                borderRadius: '40px',
              }}
              required
            />
          </div>
          <div style={{ marginBottom: '24px' }}>
            <label style={{ ...styles.label, color: '#bbd4ff' }}>
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                ...styles.input,
                background: '#0f172a',
                borderColor: '#3b82f6',
                borderRadius: '40px',
              }}
              required
            />
          </div>
          {error && <p style={{ color: '#ff8a8a' }}>{error}</p>}
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '14px',
              background: 'linear-gradient(95deg, #0f2b5e, #1a4c9e)',
              color: 'white',
              border: 'none',
              borderRadius: '60px',
              fontWeight: 'bold',
              fontSize: '16px',
              cursor: 'pointer',
              boxShadow: '0 0 12px #3a86ff',
              transition: 'transform 0.2s',
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.transform = 'scale(1.02)')
            }
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            Ingresar
          </button>
          <button
            type="button"
            onClick={onRegistro}
            style={{
              marginTop: '16px',
              width: '100%',
              padding: '14px',
              background: 'transparent',
              border: '1px solid #3b82f6',
              borderRadius: '60px',
              color: '#bbd4ff',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            ¿No tenés cuenta? Registrate
          </button>
        </form>
      </div>
    </div>
  );
}
