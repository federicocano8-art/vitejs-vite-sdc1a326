import { useState } from 'react';

export default function Equipos({
  styles,
  equipos,
  vehiculos,
  onAgregar,
  onActualizar,
  onEliminar,
  onAsignarEquipo,
  onDesasignarEquipo,
}) {
  const [mostrarForm, setMostrarForm] = useState(false);
  const [expandido, setExpandido] = useState(null);
  const [asignarVeh, setAsignarVeh] = useState('');
  const [form, setForm] = useState({
    nombre: '',
    tipo: '',
    codigoInterno: '',
    serial: '',
    estado: 'operativo',
    vencimiento: '',
    ubicacion: '',
    observaciones: '',
    proveedor: { nombre: '', contacto: '', telefono: '', email: '', web: '' },
  });
  const [formEdit, setFormEdit] = useState({});
  const [editandoId, setEditandoId] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) return alert('Nombre obligatorio');
    await onAgregar(form);
    setForm({
      nombre: '',
      tipo: '',
      codigoInterno: '',
      serial: '',
      estado: 'operativo',
      vencimiento: '',
      ubicacion: '',
      observaciones: '',
      proveedor: { nombre: '', contacto: '', telefono: '', email: '', web: '' },
    });
    setMostrarForm(false);
  };

  const iniciarEdicion = (eq) => {
    setEditandoId(eq.id);
    setFormEdit({
      nombre: eq.nombre || '',
      tipo: eq.tipo || '',
      codigoInterno: eq.codigoInterno || '',
      serial: eq.serial || '',
      estado: eq.estado || 'operativo',
      vencimiento: eq.vencimiento || '',
      ubicacion: eq.ubicacion || '',
      observaciones: eq.observaciones || '',
      proveedor: eq.proveedor || {
        nombre: '',
        contacto: '',
        telefono: '',
        email: '',
        web: '',
      },
    });
  };

  const guardarEdicion = async (eqId) => {
    await onActualizar(eqId, formEdit);
    setEditandoId(null);
    alert('Equipo actualizado');
  };

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: 24,
        }}
      >
        <h2 style={styles.pageTitle}>🧯 Equipos</h2>
        <button
          style={styles.btnPrimary}
          onClick={() => setMostrarForm(!mostrarForm)}
        >
          {mostrarForm ? '✖ Cancelar' : '➕ Nuevo Equipo'}
        </button>
      </div>

      {mostrarForm && (
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>➕ Nuevo Equipo</h3>
          <form onSubmit={handleSubmit}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3,1fr)',
                gap: 12,
              }}
            >
              <div>
                <label style={styles.label}>Nombre *</label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  style={styles.input}
                  required
                />
              </div>
              <div>
                <label style={styles.label}>Tipo</label>
                <input
                  type="text"
                  value={form.tipo}
                  onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                  style={styles.input}
                />
              </div>
              <div>
                <label style={styles.label}>Código interno</label>
                <input
                  type="text"
                  value={form.codigoInterno}
                  onChange={(e) =>
                    setForm({ ...form, codigoInterno: e.target.value })
                  }
                  style={styles.input}
                />
              </div>
              <div>
                <label style={styles.label}>Serial</label>
                <input
                  type="text"
                  value={form.serial}
                  onChange={(e) => setForm({ ...form, serial: e.target.value })}
                  style={styles.input}
                />
              </div>
              <div>
                <label style={styles.label}>Estado</label>
                <select
                  value={form.estado}
                  onChange={(e) => setForm({ ...form, estado: e.target.value })}
                  style={styles.input}
                >
                  <option value="operativo">Operativo</option>
                  <option value="mantenimiento">Mantenimiento</option>
                  <option value="baja">Baja</option>
                </select>
              </div>
              <div>
                <label style={styles.label}>Vencimiento</label>
                <input
                  type="date"
                  value={form.vencimiento}
                  onChange={(e) =>
                    setForm({ ...form, vencimiento: e.target.value })
                  }
                  style={styles.input}
                />
              </div>
              <div>
                <label style={styles.label}>Ubicación</label>
                <input
                  type="text"
                  value={form.ubicacion}
                  onChange={(e) =>
                    setForm({ ...form, ubicacion: e.target.value })
                  }
                  style={styles.input}
                />
              </div>
              <div>
                <label style={styles.label}>Observaciones</label>
                <input
                  type="text"
                  value={form.observaciones}
                  onChange={(e) =>
                    setForm({ ...form, observaciones: e.target.value })
                  }
                  style={styles.input}
                />
              </div>
            </div>
            <div
              style={{
                marginTop: 12,
                background: '#fef3c7',
                padding: 12,
                borderRadius: 8,
              }}
            >
              <h4 style={{ marginBottom: 8 }}>🏢 Proveedor</h4>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3,1fr)',
                  gap: 8,
                }}
              >
                <input
                  placeholder="Nombre"
                  value={form.proveedor.nombre}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      proveedor: { ...form.proveedor, nombre: e.target.value },
                    })
                  }
                  style={styles.input}
                />
                <input
                  placeholder="Contacto"
                  value={form.proveedor.contacto}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      proveedor: {
                        ...form.proveedor,
                        contacto: e.target.value,
                      },
                    })
                  }
                  style={styles.input}
                />
                <input
                  placeholder="Teléfono"
                  value={form.proveedor.telefono}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      proveedor: {
                        ...form.proveedor,
                        telefono: e.target.value,
                      },
                    })
                  }
                  style={styles.input}
                />
                <input
                  placeholder="Email"
                  value={form.proveedor.email}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      proveedor: { ...form.proveedor, email: e.target.value },
                    })
                  }
                  style={styles.input}
                />
                <input
                  placeholder="Web"
                  value={form.proveedor.web}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      proveedor: { ...form.proveedor, web: e.target.value },
                    })
                  }
                  style={styles.input}
                />
              </div>
            </div>
            <button
              type="submit"
              style={{
                marginTop: 12,
                width: '100%',
                background: '#2563eb',
                color: 'white',
                padding: 10,
                borderRadius: 8,
                fontWeight: 'bold',
                border: 'none',
              }}
            >
              💾 Guardar Equipo
            </button>
          </form>
        </div>
      )}

      {equipos.length === 0 ? (
        <div style={styles.card}>No hay equipos registrados</div>
      ) : (
        equipos.map((eq) => {
          const isExpandido = expandido === eq.id;
          const vehiculoAsig = eq.vehiculoAsignado
            ? vehiculos.find((v) => v.id === eq.vehiculoAsignado)
            : null;
          const isEditando = editandoId === eq.id;
          return (
            <div
              key={eq.id}
              style={{
                ...styles.card,
                borderLeft: `4px solid ${
                  eq.estado === 'operativo' ? '#10b981' : '#f59e0b'
                }`,
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                }}
                onClick={() => setExpandido(isExpandido ? null : eq.id)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 28 }}>🧯</span>
                  <div>
                    <strong style={{ fontSize: 16 }}>{eq.nombre}</strong>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>
                      {eq.codigoInterno
                        ? `Código: ${eq.codigoInterno}`
                        : 'Sin código'}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span
                    style={
                      eq.estado === 'operativo'
                        ? styles.badgeOk
                        : styles.badgeWarn
                    }
                  >
                    {eq.estado === 'operativo'
                      ? '✓ OPERATIVO'
                      : eq.estado === 'mantenimiento'
                      ? '🔧 MANT.'
                      : '⛔ BAJA'}
                  </span>
                  <span style={{ fontSize: 18 }}>
                    {isExpandido ? '▲' : '▼'}
                  </span>
                </div>
              </div>
              {isExpandido && (
                <div
                  style={{
                    marginTop: 16,
                    borderTop: '1px solid #e5e7eb',
                    paddingTop: 16,
                  }}
                >
                  {isEditando ? (
                    <div>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(2,1fr)',
                          gap: 8,
                        }}
                      >
                        <input
                          value={formEdit.nombre}
                          onChange={(e) =>
                            setFormEdit({ ...formEdit, nombre: e.target.value })
                          }
                          style={styles.input}
                          placeholder="Nombre"
                        />
                        <input
                          value={formEdit.tipo}
                          onChange={(e) =>
                            setFormEdit({ ...formEdit, tipo: e.target.value })
                          }
                          style={styles.input}
                          placeholder="Tipo"
                        />
                        <input
                          value={formEdit.codigoInterno}
                          onChange={(e) =>
                            setFormEdit({
                              ...formEdit,
                              codigoInterno: e.target.value,
                            })
                          }
                          style={styles.input}
                          placeholder="Código"
                        />
                        <input
                          value={formEdit.serial}
                          onChange={(e) =>
                            setFormEdit({ ...formEdit, serial: e.target.value })
                          }
                          style={styles.input}
                          placeholder="Serial"
                        />
                        <select
                          value={formEdit.estado}
                          onChange={(e) =>
                            setFormEdit({ ...formEdit, estado: e.target.value })
                          }
                          style={styles.input}
                        >
                          <option value="operativo">Operativo</option>
                          <option value="mantenimiento">Mantenimiento</option>
                          <option value="baja">Baja</option>
                        </select>
                        <input
                          type="date"
                          value={formEdit.vencimiento}
                          onChange={(e) =>
                            setFormEdit({
                              ...formEdit,
                              vencimiento: e.target.value,
                            })
                          }
                          style={styles.input}
                        />
                        <input
                          value={formEdit.ubicacion}
                          onChange={(e) =>
                            setFormEdit({
                              ...formEdit,
                              ubicacion: e.target.value,
                            })
                          }
                          style={styles.input}
                          placeholder="Ubicación"
                        />
                        <input
                          value={formEdit.observaciones}
                          onChange={(e) =>
                            setFormEdit({
                              ...formEdit,
                              observaciones: e.target.value,
                            })
                          }
                          style={styles.input}
                          placeholder="Observaciones"
                        />
                      </div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                        <button
                          onClick={() => guardarEdicion(eq.id)}
                          style={styles.btnPrimary}
                        >
                          Guardar
                        </button>
                        <button
                          onClick={() => setEditandoId(null)}
                          style={{
                            ...styles.btnPrimary,
                            background: '#6b7280',
                          }}
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div
                        style={{
                          display: 'flex',
                          gap: 8,
                          marginBottom: 16,
                          flexWrap: 'wrap',
                        }}
                      >
                        <button
                          onClick={() => iniciarEdicion(eq)}
                          style={{
                            ...styles.btnPrimary,
                            background: '#3b82f6',
                          }}
                        >
                          ✏️ Editar
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('¿Eliminar?')) onEliminar(eq.id);
                          }}
                          style={{
                            ...styles.btnPrimary,
                            background: '#ef4444',
                          }}
                        >
                          🗑️ Eliminar
                        </button>
                        {!vehiculoAsig && (
                          <>
                            <select
                              value={asignarVeh}
                              onChange={(e) => setAsignarVeh(e.target.value)}
                              style={styles.input}
                            >
                              <option value="">Asignar a móvil...</option>
                              {vehiculos
                                .filter((v) => v.estado === 'operativo')
                                .map((v) => (
                                  <option key={v.id} value={v.id}>
                                    {v.nombre}
                                  </option>
                                ))}
                            </select>
                            <button
                              onClick={() => {
                                if (asignarVeh)
                                  onAsignarEquipo(asignarVeh, eq.id);
                                setAsignarVeh('');
                              }}
                              style={styles.btnPrimary}
                            >
                              Asignar
                            </button>
                          </>
                        )}
                        {vehiculoAsig && (
                          <button
                            onClick={() =>
                              onDesasignarEquipo(vehiculoAsig.id, eq.id)
                            }
                            style={{
                              ...styles.btnPrimary,
                              background: '#f59e0b',
                            }}
                          >
                            Desasignar de {vehiculoAsig.nombre}
                          </button>
                        )}
                      </div>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(2,1fr)',
                          gap: 8,
                          fontSize: 14,
                        }}
                      >
                        <div>
                          <strong>🧩 Tipo:</strong> {eq.tipo || '-'}
                        </div>
                        <div>
                          <strong>🔢 Serial:</strong> {eq.serial || '-'}
                        </div>
                        <div>
                          <strong>📅 Vencimiento:</strong>{' '}
                          {eq.vencimiento || '-'}
                        </div>
                        <div>
                          <strong>📍 Ubicación:</strong> {eq.ubicacion || '-'}
                        </div>
                        <div>
                          <strong>📝 Observaciones:</strong>{' '}
                          {eq.observaciones || '-'}
                        </div>
                        {eq.proveedor?.nombre && (
                          <div>
                            <strong>🏢 Proveedor:</strong> {eq.proveedor.nombre}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
