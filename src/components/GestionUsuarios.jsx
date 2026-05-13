import { useState, useEffect } from 'react';
import { userService } from '../services/userService';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

export default function GestionUsuarios({ styles, usuario }) {
  const [usuarios, setUsuarios] = useState([]);
  const [invitaciones, setInvitaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modal, setModal] = useState(null);
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [formEdit, setFormEdit] = useState({});
  const [nuevoCodigo, setNuevoCodigo] = useState({
    rol: 'bombero',
    emailDestino: '',
  });
  const [codigoGenerado, setCodigoGenerado] = useState(null);

  const cargarDatos = async () => {
    try {
      const usuariosData = await userService.obtenerUsuarios();
      setUsuarios(usuariosData);
      // También cargar códigos de invitación desde Firestore (necesitarías otra función o leer directamente)
    } catch (error) {
      console.error(error);
      alert('Error al cargar datos');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const generarCodigo = async () => {
    try {
      const codigo = await userService.generarCodigoInvitacion(
        nuevoCodigo.rol,
        nuevoCodigo.emailDestino || null
      );
      setCodigoGenerado({
        codigo,
        rol: nuevoCodigo.rol,
        email: nuevoCodigo.emailDestino,
      });
      alert(`✅ Código generado: ${codigo}`);
      setNuevoCodigo({ rol: 'bombero', emailDestino: '' });
    } catch (error) {
      console.error(error);
      alert('Error al generar código');
    }
  };

  const editarUsuario = (user) => {
    setUsuarioEditando(user);
    setFormEdit({
      nombre: user.nombre || '',
      apellido: user.apellido || '',
      role: user.role || 'bombero',
      activo: user.activo !== false,
    });
    setModal('editar');
  };

  const guardarEdicion = async () => {
    try {
      await userService.actualizarUsuario(usuarioEditando.id, formEdit);
      await cargarDatos();
      setModal(null);
      alert('Usuario actualizado');
    } catch (error) {
      console.error(error);
      alert('Error al actualizar');
    }
  };

  const eliminarUsuario = async (uid, email) => {
    if (!window.confirm(`⚠️ ¿Eliminar permanentemente a ${email}?`)) return;
    try {
      await userService.eliminarUsuario(uid);
      await cargarDatos();
      alert('Usuario eliminado');
    } catch (error) {
      console.error(error);
      alert('Error al eliminar');
    }
  };

  const cerrarSesion = async () => {
    await signOut(auth);
  };

  if (cargando)
    return <div style={{ padding: 40, textAlign: 'center' }}>Cargando...</div>;

  return (
    <div>
      {/* Modal de edición */}
      {modal === 'editar' && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <h3 style={{ color: '#aaffff' }}>Editar usuario</h3>
            <input
              type="text"
              placeholder="Nombre"
              value={formEdit.nombre}
              onChange={(e) =>
                setFormEdit({ ...formEdit, nombre: e.target.value })
              }
              style={styles.input}
            />
            <input
              type="text"
              placeholder="Apellido"
              value={formEdit.apellido}
              onChange={(e) =>
                setFormEdit({ ...formEdit, apellido: e.target.value })
              }
              style={styles.input}
            />
            <select
              value={formEdit.role}
              onChange={(e) =>
                setFormEdit({ ...formEdit, role: e.target.value })
              }
              style={styles.input}
            >
              <option value="admin">Administrador</option>
              <option value="bombero">Bombero</option>
              <option value="supervisor">Supervisor</option>
              <option value="mecanico">Mecánico</option>
            </select>
            <select
              value={formEdit.activo}
              onChange={(e) =>
                setFormEdit({ ...formEdit, activo: e.target.value === 'true' })
              }
              style={styles.input}
            >
              <option value="true">Activo</option>
              <option value="false">Inactivo</option>
            </select>
            <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
              <button style={styles.btnPrimary} onClick={guardarEdicion}>
                Guardar
              </button>
              <button
                style={styles.btnSecondary}
                onClick={() => setModal(null)}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <h2 style={styles.pageTitle}>👥 Gestión de Usuarios</h2>
        <button style={styles.btnPrimary} onClick={cerrarSesion}>
          🚪 Cerrar sesión
        </button>
      </div>

      {/* Generar código de invitación */}
      <div
        style={{
          ...styles.card,
          background: 'rgba(15,25,45,0.7)',
          borderRadius: 32,
          marginBottom: 24,
        }}
      >
        <h3 style={{ color: '#aaffff' }}>🔑 Generar código de invitación</h3>
        <div
          style={{
            display: 'flex',
            gap: 12,
            alignItems: 'flex-end',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ flex: 1 }}>
            <label style={styles.label}>Rol</label>
            <select
              value={nuevoCodigo.rol}
              onChange={(e) =>
                setNuevoCodigo({ ...nuevoCodigo, rol: e.target.value })
              }
              style={styles.input}
            >
              <option value="bombero">🚒 Bombero</option>
              <option value="supervisor">📋 Supervisor</option>
              <option value="mecanico">🔧 Mecánico</option>
              <option value="admin">👑 Administrador</option>
            </select>
          </div>
          <div style={{ flex: 2 }}>
            <label style={styles.label}>Email destino (opcional)</label>
            <input
              type="email"
              value={nuevoCodigo.emailDestino}
              onChange={(e) =>
                setNuevoCodigo({ ...nuevoCodigo, emailDestino: e.target.value })
              }
              style={styles.input}
              placeholder="para enviar invitación"
            />
          </div>
          <button
            style={{ ...styles.btnPrimary, background: '#10b981' }}
            onClick={generarCodigo}
          >
            ➕ Generar código
          </button>
        </div>
        {codigoGenerado && (
          <div
            style={{
              marginTop: 16,
              padding: 12,
              background: '#1e293b',
              borderRadius: 20,
            }}
          >
            <p>
              <strong>✅ Código generado:</strong> {codigoGenerado.codigo}
            </p>
            <p>
              <strong>Rol:</strong> {codigoGenerado.rol}
            </p>
            {codigoGenerado.email && (
              <p>
                <strong>Email destino:</strong> {codigoGenerado.email}
              </p>
            )}
            <p>
              <strong>Enlace de registro:</strong> {window.location.origin}
              /?codigo={codigoGenerado.codigo}
            </p>
            <button
              style={{ ...styles.btnSecondary }}
              onClick={() => setCodigoGenerado(null)}
            >
              Cerrar
            </button>
          </div>
        )}
      </div>

      {/* Lista de usuarios */}
      <div
        style={{
          ...styles.card,
          background: 'rgba(15,25,45,0.7)',
          borderRadius: 32,
        }}
      >
        <h3 style={{ color: '#aaffff' }}>👥 Usuarios registrados</h3>
        {usuarios.map((user) => (
          <div
            key={user.id}
            style={{
              borderBottom: '1px solid #2d3a5e',
              padding: '12px 0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <div>
              <strong>
                {user.nombre} {user.apellido}
              </strong>
              <br />
              <span style={{ fontSize: 12 }}>{user.email}</span>
              <div style={{ marginTop: 4, display: 'flex', gap: 8 }}>
                <span
                  style={{
                    background: user.role === 'admin' ? '#f59e0b' : '#2563eb',
                    padding: '2px 10px',
                    borderRadius: 40,
                    fontSize: 11,
                    color: 'white',
                  }}
                >
                  {user.role === 'admin' ? 'Admin' : user.role}
                </span>
                <span
                  style={{
                    background: user.activo ? '#10b981' : '#ef4444',
                    padding: '2px 10px',
                    borderRadius: 40,
                    fontSize: 11,
                    color: 'white',
                  }}
                >
                  {user.activo ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                style={styles.btnSecondary}
                onClick={() => editarUsuario(user)}
              >
                ✏️ Editar
              </button>
              {user.id !== usuario.uid && (
                <button
                  style={{ ...styles.btnSecondary, background: '#ef4444' }}
                  onClick={() => eliminarUsuario(user.id, user.email)}
                >
                  🗑️ Eliminar
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
