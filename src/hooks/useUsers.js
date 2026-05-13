import { useState, useEffect, useCallback } from 'react';
import { userService } from '../services/userService';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

export function useUsers(usuario) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Suscribirse a cambios en Firestore (más eficiente que listar Auth cada vez)
  useEffect(() => {
    if (!usuario || usuario.rol !== 'admin') {
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'users'), orderBy('nombre', 'asc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const usersData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUsers(usersData);
        setLoading(false);
      },
      (err) => {
        console.error('Error al cargar usuarios:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [usuario]);

  const crearUsuario = useCallback(async (userData) => {
    try {
      const result = await userService.createUser(userData);
      return result;
    } catch (err) {
      console.error('Error al crear usuario:', err);
      throw err;
    }
  }, []);

  const actualizarUsuario = useCallback(async (uid, updates) => {
    try {
      await userService.updateUser(uid, updates);
    } catch (err) {
      console.error('Error al actualizar usuario:', err);
      throw err;
    }
  }, []);

  const eliminarUsuario = useCallback(async (uid) => {
    try {
      await userService.deleteUser(uid);
    } catch (err) {
      console.error('Error al eliminar usuario:', err);
      throw err;
    }
  }, []);

  const resetearPassword = useCallback(async (email) => {
    try {
      await userService.resetPassword(email);
    } catch (err) {
      console.error('Error al resetear contraseña:', err);
      throw err;
    }
  }, []);

  return {
    users,
    loading,
    error,
    crearUsuario,
    actualizarUsuario,
    eliminarUsuario,
    resetearPassword,
  };
}
