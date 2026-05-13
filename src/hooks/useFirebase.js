// src/firebase.js
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  getDoc,
  setDoc,
  getDocs,
  where,
} from 'firebase/firestore';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} from 'firebase/auth';

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
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Autenticación
export const loginWithEmail = (email, password) =>
  signInWithEmailAndPassword(auth, email, password);
export const registerUser = (email, password) =>
  createUserWithEmailAndPassword(auth, email, password);
export const logoutUser = () => signOut(auth);
export const resetPassword = (email) => sendPasswordResetEmail(auth, email);

// Firestore utils
export const addDocument = async (cuartelId, coleccion, data) => {
  let collectionRef;
  if (!cuartelId || cuartelId === 'default') {
    collectionRef = collection(db, coleccion);
  } else {
    collectionRef = collection(db, 'cuarteles', cuartelId, coleccion);
  }
  const docRef = await addDoc(collectionRef, {
    ...data,
    creadoEn: serverTimestamp(),
    actualizadoEn: serverTimestamp(),
  });
  return docRef.id;
};

export const updateDocument = async (cuartelId, coleccion, docId, data) => {
  let docRef;
  if (!cuartelId || cuartelId === 'default') {
    docRef = doc(db, coleccion, docId);
  } else {
    docRef = doc(db, 'cuarteles', cuartelId, coleccion, docId);
  }
  await updateDoc(docRef, { ...data, actualizadoEn: serverTimestamp() });
};

export const deleteDocument = async (cuartelId, coleccion, docId) => {
  let docRef;
  if (!cuartelId || cuartelId === 'default') {
    docRef = doc(db, coleccion, docId);
  } else {
    docRef = doc(db, 'cuarteles', cuartelId, coleccion, docId);
  }
  await deleteDoc(docRef);
};

export {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  getDoc,
  setDoc,
  getDocs,
  where,
};
