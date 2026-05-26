import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, serverTimestamp } from 'firebase/firestore';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

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

// Messaging (notificaciones push)
let messaging = null;
let solicitarPermiso = async () => null;
let recibirMensajeEnPrimerPlano = () => {};

if (typeof window !== 'undefined' && 'Notification' in window) {
  try {
    messaging = getMessaging(app);
    
    solicitarPermiso = async () => {
      try {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          const token = await getToken(messaging, {
            vapidKey: 'BE6sXfWVstXyGBax3m274Ow_2MPzAIfwL6QlSK8OqqV8Z82XfXYWRah3gRl-B4BtlJ5Yprlwe0moi2rwGd_5bgU'
          });
          console.log('Token FCM:', token);
          return token;
        }
        return null;
      } catch (error) {
        console.error('Error al obtener token FCM:', error);
        return null;
      }
    };
    
    recibirMensajeEnPrimerPlano = (callback) => {
      if (messaging) {
        onMessage(messaging, (payload) => {
          callback(payload);
        });
      }
    };
  } catch (error) {
    console.warn('Messaging no disponible:', error.message);
  }
}

export { messaging, solicitarPermiso, recibirMensajeEnPrimerPlano };

export const login = async (email, password) => {
  return signInWithEmailAndPassword(auth, email, password);
};

export const cerrarSesion = async () => {
  return signOut(auth);
};
