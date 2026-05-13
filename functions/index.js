// functions/index.js
const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

const db = admin.firestore();

// ============================================================
//  Helper para verificar que el usuario que llama es admin
// ============================================================
async function isAdminUser(uid) {
  if (!uid) return false;
  const userDoc = await db.collection('users').doc(uid).get();
  return userDoc.exists && userDoc.get('role') === 'admin';
}

// ============================================================
//  1. Listar todos los usuarios (solo admin)
// ============================================================
exports.listUsers = functions.https.onCall(async (data, context) => {
  // Verificar autenticación
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'No autenticado');
  }

  const callerUid = context.auth.uid;
  const adminCheck = await isAdminUser(callerUid);
  if (!adminCheck) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Se requieren permisos de administrador'
    );
  }

  // Obtener todos los usuarios de Firebase Auth
  const listUsersResult = await admin.auth().listUsers();
  const users = listUsersResult.users.map((userRecord) => ({
    uid: userRecord.uid,
    email: userRecord.email,
    displayName: userRecord.displayName,
    emailVerified: userRecord.emailVerified,
    disabled: userRecord.disabled,
    creationTime: userRecord.metadata.creationTime,
    lastSignInTime: userRecord.metadata.lastSignInTime,
  }));

  // Agregar información de Firestore (rol, nombre, apellido, activo)
  const usersWithRoles = await Promise.all(
    users.map(async (user) => {
      const userDoc = await db.collection('users').doc(user.uid).get();
      const dataFirestore = userDoc.exists ? userDoc.data() : {};
      return {
        ...user,
        role: dataFirestore.role || 'bombero',
        activo:
          dataFirestore.activo !== undefined ? dataFirestore.activo : true,
        nombre: dataFirestore.nombre || user.displayName || '',
        apellido: dataFirestore.apellido || '',
      };
    })
  );

  return { users: usersWithRoles };
});

// ============================================================
//  2. Crear nuevo usuario (solo admin)
// ============================================================
exports.createUser = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'No autenticado');
  }

  const callerUid = context.auth.uid;
  const adminCheck = await isAdminUser(callerUid);
  if (!adminCheck) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Se requieren permisos de administrador'
    );
  }

  const { email, password, displayName, role, activo, nombre, apellido } = data;
  if (!email || !password) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Email y contraseña son requeridos'
    );
  }

  try {
    // 1. Crear usuario en Firebase Authentication
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: displayName || nombre || email.split('@')[0],
    });

    // 2. Crear documento en Firestore
    await db
      .collection('users')
      .doc(userRecord.uid)
      .set({
        uid: userRecord.uid,
        email,
        nombre: nombre || displayName || email.split('@')[0],
        apellido: apellido || '',
        role: role || 'bombero',
        activo: activo !== undefined ? activo : true,
        creadoEn: admin.firestore.FieldValue.serverTimestamp(),
        actualizadoEn: admin.firestore.FieldValue.serverTimestamp(),
      });

    return {
      success: true,
      uid: userRecord.uid,
      email: userRecord.email,
      displayName: userRecord.displayName,
      role: role || 'bombero',
    };
  } catch (error) {
    console.error('Error al crear usuario:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// ============================================================
//  3. Actualizar usuario (solo admin)
// ============================================================
exports.updateUser = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'No autenticado');
  }

  const callerUid = context.auth.uid;
  const adminCheck = await isAdminUser(callerUid);
  if (!adminCheck) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Se requieren permisos de administrador'
    );
  }

  const { uid, updates } = data;
  if (!uid || !updates) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'uid y updates son requeridos'
    );
  }

  // Actualizar Authentication (email, displayName, password, disabled)
  const authUpdates = {};
  if (updates.email !== undefined) authUpdates.email = updates.email;
  if (updates.displayName !== undefined)
    authUpdates.displayName = updates.displayName;
  if (updates.password !== undefined && updates.password.trim() !== '')
    authUpdates.password = updates.password;
  if (updates.activo !== undefined) authUpdates.disabled = !updates.activo; // activo false -> disabled true

  if (Object.keys(authUpdates).length > 0) {
    await admin.auth().updateUser(uid, authUpdates);
  }

  // Actualizar Firestore
  const firestoreUpdates = {
    actualizadoEn: admin.firestore.FieldValue.serverTimestamp(),
  };
  if (updates.nombre !== undefined) firestoreUpdates.nombre = updates.nombre;
  if (updates.apellido !== undefined)
    firestoreUpdates.apellido = updates.apellido;
  if (updates.role !== undefined) firestoreUpdates.role = updates.role;
  if (updates.activo !== undefined) firestoreUpdates.activo = updates.activo;
  if (updates.email !== undefined) firestoreUpdates.email = updates.email;

  await db.collection('users').doc(uid).update(firestoreUpdates);

  return { success: true, uid, updates };
});

// ============================================================
//  4. Eliminar usuario (solo admin)
// ============================================================
exports.deleteUser = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'No autenticado');
  }

  const callerUid = context.auth.uid;
  const adminCheck = await isAdminUser(callerUid);
  if (!adminCheck) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Se requieren permisos de administrador'
    );
  }

  const { uid } = data;
  if (!uid) {
    throw new functions.https.HttpsError('invalid-argument', 'uid requerido');
  }

  // 1. Eliminar documento de Firestore
  await db.collection('users').doc(uid).delete();

  // 2. Eliminar usuario de Authentication
  await admin.auth().deleteUser(uid);

  return { success: true, uid };
});

// ============================================================
//  5. Enviar email de reseteo de contraseña
//     Puede ser llamado por admin o por el propio usuario
// ============================================================
exports.resetPassword = functions.https.onCall(async (data, context) => {
  const { email } = data;
  if (!email) {
    throw new functions.https.HttpsError('invalid-argument', 'Email requerido');
  }

  // Verificar permisos:
  // - Si está autenticado y es admin → puede resetear cualquier email
  // - Si está autenticado y su email coincide con el destino → permite
  // - Si no está autenticado → permite (envía email al destinatario, no hay riesgo)
  if (context.auth) {
    const callerUid = context.auth.uid;
    const callerEmail = context.auth.token.email;
    const adminCheck = await isAdminUser(callerUid);
    if (!adminCheck && callerEmail !== email) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'No puedes resetear la contraseña de otro usuario'
      );
    }
  }

  // Generar link de reseteo (Firebase envía el email automáticamente)
  await admin.auth().generatePasswordResetLink(email);

  return { success: true, message: 'Email de reseteo enviado' };
});
