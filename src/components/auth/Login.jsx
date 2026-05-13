// src/components/auth/Login.jsx
import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, setDoc } from '../../../firebase';

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
      const userDocRef = doc(db, 'usuarios', user.uid);
      const userDoc = await getDoc(userDocRef);

      let userData;
      if (!userDoc.exists()) {
        userData = {
          uid: user.uid,
          email: user.email,
          nombre: email.split('@')[0] || 'Usuario',
          rol: 'administrador',
          cuartelId: 'default',
          activo: true,
          creadoEn: new Date(),
        };
        await setDoc(userDocRef, userData);
      } else {
        userData = userDoc.data();
      }

      onLogin({
        uid: user.uid,
        email: user.email,
        nombre: userData.nombre,
        rol: userData.rol,
        cuartelId: userData.cuartelId || 'default',
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const styles = {
    loginContainer: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e3a5f 0%, #dc2626 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    },
    loginCard: {
      background: 'white',
      borderRadius: '20px',
      padding: '48px',
      width: '100%',
      maxWidth: '420px',
      boxShadow: '0 25px 50px rgba(0,0,0,0.3)',
    },
    loginHeader: { textAlign: 'center', marginBottom: '32px' },
    loginIcon: { fontSize: '64px' },
    loginTitle: {
      fontSize: '28px',
      fontWeight: 'bold',
      color: '#1e3a5f',
      marginBottom: '8px',
    },
    loginSubtitle: { fontSize: '14px', color: '#6b7280' },
    errorBanner: {
      background: '#fee2e2',
      border: '1px solid #ef4444',
      borderRadius: '8px',
      padding: '12px',
      marginBottom: '20px',
      color: '#dc2626',
    },
    inputGroup: { marginBottom: '20px' },
    label: {
      display: 'block',
      fontSize: '14px',
      fontWeight: '600',
      color: '#374151',
      marginBottom: '6px',
    },
    input: {
      width: '100%',
      padding: '14px',
      border: '1px solid #ccc',
      borderRadius: '8px',
      fontSize: '15px',
      boxSizing: 'border-box',
    },
    loginButton: {
      width: '100%',
      padding: '14px',
      background: 'linear-gradient(135deg, #1e3a5f, #dc2626)',
      color: 'white',
      border: 'none',
      borderRadius: '10px',
      fontWeight: 'bold',
      fontSize: '16px',
      cursor: 'pointer',
    },
    loginFooter: {
      marginTop: '24px',
      textAlign: 'center',
      fontSize: '13px',
      color: '#6b7280',
    },
  };

  return (
    <div style={styles.loginContainer}>
      <div style={styles.loginCard}>
        <div style={styles.loginHeader}>
          <div style={styles.loginIcon}>🚒</div>
          <h1 style={styles.loginTitle}>Bomberos Gestión</h1>
          <p style={styles.loginSubtitle}>Sistema integral para cuarteles</p>
        </div>
        {error && <div style={styles.errorBanner}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Email institucional</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              required
            />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              required
            />
          </div>
          <button type="submit" disabled={loading} style={styles.loginButton}>
            {loading ? 'Ingresando...' : '🔐 Ingresar al sistema'}
          </button>
        </form>
        <div style={styles.loginFooter}>
          <p>
            ¿Primera vez? <a href="#">Solicitar acceso</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
