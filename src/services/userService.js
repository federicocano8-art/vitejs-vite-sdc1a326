import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';

export const userService = {
  async obtenerUsuarios() {
    const snapshot = await getDocs(collection(db, 'users'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  async actualizarUsuario(uid, updates) {
    await updateDoc(doc(db, 'users', uid), {
      ...updates,
      actualizadoEn: new Date()
    });
  },

  async eliminarUsuario(uid) {
    await deleteDoc(doc(db, 'users', uid));
  },

  async generarCodigoInvitacion(rol, emailDestino, creadoPor) {
    const codigo = Math.random().toString(36).substring(2, 10).toUpperCase();
    await addDoc(collection(db, 'invitaciones'), {
      codigo,
      rol,
      usado: false,
      emailDestino: emailDestino || null,
      creadoPor,
      creadoEn: new Date()
    });
    return codigo;
  }
};
