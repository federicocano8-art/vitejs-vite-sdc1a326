import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

export const useAudit = () => {
  const registrar = async (accion, coleccion, documentoId, datos, usuario) => {
    try {
      await addDoc(collection(db, 'auditLogs'), {
        accion,
        coleccion,
        documentoId,
        datos: JSON.stringify(datos),
        usuario: usuario?.nombre || usuario?.email || 'Sistema',
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error al registrar auditoría:', error);
    }
  };
  return { registrar };
};
