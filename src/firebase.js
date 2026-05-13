import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, serverTimestamp } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyDTXhNePjZV4DqWRkRNFnDHQUmgWe1BoE0',
  authDomain: 'bomberos-ramallo.firebaseapp.com',
  projectId: 'bomberos-ramallo',
  storageBucket: 'bomberos-ramallo.firebasestorage.app',
  messagingSenderId: '526631464706',
  appId: '1:526631464706:web:73f13ed77fb078eaab5c1b',
  measurementId: 'G-BKPDRTXK9P',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export { serverTimestamp };

// Funciones de autenticación existentes (si ya las tenías)
export const login = async (email, password) => {
  return signInWithEmailAndPassword(auth, email, password);
};
export const cerrarSesion = async () => {
  return signOut(auth);
};
