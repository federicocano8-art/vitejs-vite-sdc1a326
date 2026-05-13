import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import RegistroConInvitacion from './RegistroConInvitacion';

export default function AuthScreen({ styles, onLogin, onRegistroExitoso }) {
  const [modo, setModo] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [codigoInicial, setCodigoInicial] = useState('');

  // Leer código de la URL al cargar
  useEffect(() => {
    const params = new URLSearchParams(
      window.location.hash.split('?')[1] || window.location.search
    );
    const codigo = params.get('codigo');
    if (codigo) {
      setCodigoInicial(codigo);
      setModo('registro');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      onLogin(email, password);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
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
        padding: 20,
      }}
    >
      {modo === 'login' ? (
        <div
          style={{
            background: 'rgba(20,30,55,0.8)',
            backdropFilter: 'blur(12px)',
            borderRadius: 32,
            padding: 48,
            width: '100%',
            maxWidth: 420,
            boxShadow:
              '0 25px 45px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,255,255,0.2)',
            border: '1px solid rgba(0,255,255,0.3)',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <div style={{ fontSize: 72, filter: 'drop-shadow(0 0 8px cyan)' }}>
              🚒
            </div>
            <h1
              style={{
                fontSize: 28,
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
            <div style={{ marginBottom: 16 }}>
              <label style={{ ...styles.label, color: '#bbd4ff' }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  ...styles.input,
                  borderRadius: 40,
                  background: '#0f172a',
                }}
                required
              />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ ...styles.label, color: '#bbd4ff' }}>
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  ...styles.input,
                  borderRadius: 40,
                  background: '#0f172a',
                }}
                required
              />
            </div>
            {error && (
              <p style={{ color: '#ff8a8a', marginBottom: 16 }}>{error}</p>
            )}
            <button
              type="submit"
              disabled={cargando}
              style={{
                width: '100%',
                padding: 14,
                background: 'linear-gradient(95deg, #0f2b5e, #1a4c9e)',
                color: 'white',
                border: 'none',
                borderRadius: 60,
                fontWeight: 'bold',
                fontSize: 16,
                cursor: 'pointer',
                boxShadow: '0 0 12px #3a86ff',
              }}
            >
              Ingresar
            </button>
            <button
              type="button"
              onClick={() => setModo('registro')}
              style={{
                marginTop: 16,
                background: 'transparent',
                border: 'none',
                color: '#3b82f6',
                cursor: 'pointer',
                width: '100%',
              }}
            >
              ¿No tienes cuenta? Regístrate
            </button>
          </form>
        </div>
      ) : (
        <RegistroConInvitacion
          styles={styles}
          onRegistroExitoso={() => {
            onRegistroExitoso();
            setModo('login');
          }}
          codigoInicial={codigoInicial}
        />
      )}
    </div>
  );
}
