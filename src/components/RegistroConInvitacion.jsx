import { useState, useEffect } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import {
  doc,
  setDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '../firebase';

export default function RegistroConInvitacion({
  styles,
  onRegistroExitoso,
  codigoInicial = '',
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [codigo, setCodigo] = useState(codigoInicial);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (codigoInicial) setCodigo(codigoInicial);
  }, [codigoInicial]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      const codigoQuery = query(
        collection(db, 'invitaciones'),
        where('codigo', '==', codigo),
        where('usado', '==', false)
      );
      const snapshot = await getDocs(codigoQuery);
      if (snapshot.empty) throw new Error('Código inválido o ya utilizado');
      const codigoDoc = snapshot.docs[0];
      const rol = codigoDoc.data().rol;
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const uid = userCredential.user.uid;
      await setDoc(doc(db, 'users', uid), {
        uid,
        email,
        nombre: email.split('@')[0],
        apellido: '',
        role: rol,
        activo: true,
        creadoEn: serverTimestamp(),
        actualizadoEn: serverTimestamp(),
      });
      await updateDoc(codigoDoc.ref, { usado: true, usadoPor: uid });
      alert('✅ Registro exitoso. Ya puedes iniciar sesión.');
      if (onRegistroExitoso) onRegistroExitoso();
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div
      style={{
        ...styles.card,
        background: 'rgba(15,25,45,0.7)',
        borderRadius: 32,
        maxWidth: 500,
        margin: '0 auto',
      }}
    >
      <h2 style={{ color: '#aaffff', textAlign: 'center' }}>📝 Registro</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <label style={styles.label}>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ ...styles.input, borderRadius: 40 }}
            required
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={styles.label}>Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ ...styles.input, borderRadius: 40 }}
            required
          />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={styles.label}>Código de invitación</label>
          <input
            type="text"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.toUpperCase())}
            style={{
              ...styles.input,
              borderRadius: 40,
              textTransform: 'uppercase',
            }}
            required
          />
          <small style={{ color: '#94a3b8' }}>
            Ingresá el código que te dio el administrador
          </small>
        </div>
        {error && <p style={{ color: '#f87171', marginBottom: 16 }}>{error}</p>}
        <button
          type="submit"
          disabled={cargando}
          style={{
            width: '100%',
            padding: 12,
            background: 'linear-gradient(95deg, #0f2b5e, #1a4c9e)',
            borderRadius: 60,
            color: 'white',
            fontWeight: 'bold',
            cursor: cargando ? 'not-allowed' : 'pointer',
          }}
        >
          {cargando ? 'Registrando...' : 'Registrarse'}
        </button>
      </form>
    </div>
  );
}
