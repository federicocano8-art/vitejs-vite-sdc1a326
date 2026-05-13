// src/services/userService.js
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';

export const userService = {
  // Listar todos los usuarios (opcional, para admin)
  async listUsers() {
    const listUsersFn = httpsCallable(functions, 'listUsers');
    const result = await listUsersFn();
    return result.data;
  },

  // Crear usuario (solo puede ser llamado por admin)
  async createUser({ email, password, displayName, role, activo = true }) {
    const createUserFn = httpsCallable(functions, 'createUser');
    const result = await createUserFn({
      email,
      password,
      displayName,
      role,
      activo,
    });
    return result.data;
  },

  // Actualizar usuario (cualquier campo, solo admin)
  async updateUser(uid, updates) {
    const updateUserFn = httpsCallable(functions, 'updateUser');
    const result = await updateUserFn({ uid, updates });
    return result.data;
  },

  // Resetear contraseña (envía email de reseteo; puede ser llamado por el mismo usuario o admin)
  async resetPassword(email) {
    const resetPasswordFn = httpsCallable(functions, 'resetPassword');
    const result = await resetPasswordFn({ email });
    return result.data;
  },

  // Eliminar usuario (borra Auth + Firestore)
  async deleteUser(uid) {
    const deleteUserFn = httpsCallable(functions, 'deleteUser');
    const result = await deleteUserFn({ uid });
    return result.data;
  },
};
