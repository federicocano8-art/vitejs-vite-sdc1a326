/* eslint-disable no-unused-vars */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

const AuthContext = createContext({});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rol, setRol] = useState(null);
  const [cuartelId, setCuartelId] = useState(null);

  // Iniciar sesión
  const login = async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const user = result.user;

      // Obtener datos adicionales del usuario desde Firestore
      const userDoc = await getDoc(doc(db, 'usuarios', user.uid));
      let userData = {
        uid: user.uid,
        email: user.email,
        nombre: user.displayName || email.split('@')[0],
      };

      if (userDoc.exists()) {
        userData = { ...userData, ...userDoc.data() };
      } else {
        // Crear documento de usuario si no existe (primer inicio)
        const nuevoUsuario = {
          uid: user.uid,
          email: user.email,
          nombre: user.displayName || email.split('@')[0],
          rol: 'bombero',
          cuartelId: 'default',
          activo: true,
          creadoEn: serverTimestamp(),
        };
        await setDoc(doc(db, 'usuarios', user.uid), nuevoUsuario);
        userData = { ...userData, ...nuevoUsuario };
      }

      setUsuario(userData);
      setRol(userData.rol);
      setCuartelId(userData.cuartelId);

      localStorage.setItem('usuarioActual', JSON.stringify(userData));
      return { success: true, user: userData };
    } catch (error) {
      console.error('Error en login:', error);
      let mensaje = 'Error al iniciar sesión';
      switch (error.code) {
        case 'auth/user-not-found':
          mensaje = 'Usuario no encontrado';
          break;
        case 'auth/wrong-password':
          mensaje = 'Contraseña incorrecta';
          break;
        case 'auth/invalid-email':
          mensaje = 'Email inválido';
          break;
        case 'auth/too-many-requests':
          mensaje = 'Demasiados intentos. Intente más tarde';
          break;
        default:
          mensaje = error.message;
      }
      return { success: false, error: mensaje };
    }
  };

  // Registrar nuevo usuario (solo administradores)
  const registrarUsuario = async (
    email,
    password,
    nombre,
    rolUsuario = 'bombero',
    cuartelIdUsuario = 'default'
  ) => {
    try {
      const result = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = result.user;

      // Actualizar perfil con nombre
      await updateProfile(user, { displayName: nombre });

      // Guardar en Firestore
      const nuevoUsuario = {
        uid: user.uid,
        email: user.email,
        nombre: nombre,
        rol: rolUsuario,
        cuartelId: cuartelIdUsuario,
        activo: true,
        creadoEn: serverTimestamp(),
        creadoPor: usuario?.uid || 'sistema',
      };
      await setDoc(doc(db, 'usuarios', user.uid), nuevoUsuario);

      return { success: true, user: nuevoUsuario };
    } catch (error) {
      console.error('Error en registro:', error);
      let mensaje = 'Error al registrar usuario';
      switch (error.code) {
        case 'auth/email-already-in-use':
          mensaje = 'El email ya está registrado';
          break;
        case 'auth/weak-password':
          mensaje = 'La contraseña debe tener al menos 6 caracteres';
          break;
        default:
          mensaje = error.message;
      }
      return { success: false, error: mensaje };
    }
  };

  // Restablecer contraseña
  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return {
        success: true,
        message:
          'Email de restablecimiento enviado. Revisá tu bandeja de entrada.',
      };
    } catch (error) {
      console.error('Error en reset password:', error);
      let mensaje = 'Error al enviar email de restablecimiento';
      if (error.code === 'auth/user-not-found') {
        mensaje = 'No existe un usuario con ese email';
      }
      return { success: false, error: mensaje };
    }
  };

  // Cerrar sesión
  const logout = async () => {
    try {
      await signOut(auth);
      setUsuario(null);
      setRol(null);
      setCuartelId(null);
      localStorage.removeItem('usuarioActual');
      return { success: true };
    } catch (error) {
      console.error('Error en logout:', error);
      return { success: false, error: error.message };
    }
  };

  // Verificar si tiene un rol específico
  const tieneRol = (rolesPermitidos) => {
    if (!usuario) return false;
    if (Array.isArray(rolesPermitidos)) {
      return rolesPermitidos.includes(rol);
    }
    return rol === rolesPermitidos;
  };

  // Verificar si es administrador
  const esAdmin = () => {
    return rol === 'admin' || rol === 'administrador';
  };

  // Escuchar cambios en autenticación
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'usuarios', user.uid));
          let userData = {
            uid: user.uid,
            email: user.email,
            nombre: user.displayName || user.email.split('@')[0],
          };

          if (userDoc.exists()) {
            userData = { ...userData, ...userDoc.data() };
          } else {
            // Crear documento de usuario si no existe
            const nuevoUsuario = {
              uid: user.uid,
              email: user.email,
              nombre: user.displayName || user.email.split('@')[0],
              rol: 'bombero',
              cuartelId: 'default',
              activo: true,
              creadoEn: serverTimestamp(),
            };
            await setDoc(doc(db, 'usuarios', user.uid), nuevoUsuario);
            userData = { ...userData, ...nuevoUsuario };
          }

          setUsuario(userData);
          setRol(userData.rol);
          setCuartelId(userData.cuartelId);
          localStorage.setItem('usuarioActual', JSON.stringify(userData));
        } catch (error) {
          console.error('Error al cargar datos del usuario:', error);
          setUsuario({
            uid: user.uid,
            email: user.email,
            nombre: user.email.split('@')[0],
            rol: 'bombero',
          });
          setRol('bombero');
          setCuartelId('default');
        }
      } else {
        setUsuario(null);
        setRol(null);
        setCuartelId(null);
        localStorage.removeItem('usuarioActual');
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    usuario,
    rol,
    cuartelId,
    loading,
    login,
    logout,
    registrarUsuario,
    resetPassword,
    tieneRol,
    esAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
