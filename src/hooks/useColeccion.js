import { useState, useEffect, useCallback } from 'react';
import {
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
} from 'firebase/firestore';
import { db } from '../firebase';

export function useColeccion(nombreColeccion, auditCallback = null) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      const q = query(
        collection(db, nombreColeccion),
        orderBy('creadoEn', 'desc')
      );
      const unsub = onSnapshot(
        q,
        (snap) => {
          const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
          setData(items);
          setLoading(false);
        },
        (err) => {
          setError(err.message);
          setLoading(false);
        }
      );
      return () => unsub();
    } catch (e) {
      setLoading(false);
      setError(e.message);
    }
  }, [nombreColeccion]);

  const agregar = useCallback(
    async (item) => {
      try {
        const ref = await addDoc(collection(db, nombreColeccion), {
          ...item,
          creadoEn: serverTimestamp(),
          actualizadoEn: serverTimestamp(),
        });
        if (auditCallback) await auditCallback('crear', ref.id, item);
        return ref.id;
      } catch (e) {
        setError(e.message);
        alert('Error al guardar: ' + e.message);
        return null;
      }
    },
    [nombreColeccion, auditCallback]
  );

  const actualizar = useCallback(
    async (id, datos) => {
      try {
        await updateDoc(doc(db, nombreColeccion, id), {
          ...datos,
          actualizadoEn: serverTimestamp(),
        });
        if (auditCallback) await auditCallback('actualizar', id, datos);
      } catch (e) {
        setError(e.message);
      }
    },
    [nombreColeccion, auditCallback]
  );

  const eliminar = useCallback(
    async (id) => {
      try {
        const docRef = doc(db, nombreColeccion, id);
        const docSnap = await getDoc(docRef);
        const datosEliminados = docSnap.exists() ? docSnap.data() : null;
        await deleteDoc(docRef);
        if (auditCallback) await auditCallback('eliminar', id, datosEliminados);
      } catch (e) {
        setError(e.message);
      }
    },
    [nombreColeccion, auditCallback]
  );

  return { data, loading, error, agregar, actualizar, eliminar };
}
