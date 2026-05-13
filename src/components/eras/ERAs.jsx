import { useState } from 'react';

export default function ERAs({
  styles,
  eras,
  vehiculos,
  onAgregar,
  onActualizar,
  onEliminar,
  onAsignarERA,
  onDesasignarERA,
}) {
  const [mostrarForm, setMostrarForm] = useState(false);
  const [expandido, setExpandido] = useState(null);
  const [asignarVeh, setAsignarVeh] = useState('');
  const [nuevaMascara, setNuevaMascara] = useState({
    numero: '',
    marca: '',
    talla: '',
    vencimiento: '',
    estado: 'bueno',
    observaciones: '',
  });
  const [form, setForm] = useState({
    marca: '',
    modelo: '',
    codigoInterno: '',
    serial: '',
    presion: 300,
    estado: 'activo',
    pruebaHidraulica: '',
    vencimientoTubo: '',
    observaciones: '',
    proveedor: { nombre: '', contacto: '', telefono: '', email: '', web: '' },
    mascaras: [],
  });
  const [formEdit, setFormEdit] = useState({});
  const [editandoId, setEditandoId] = useState(null);

  const verificarVencimiento = (fecha) => {
    if (!fecha) return '';
    const dias = Math.ceil(
      (new Date(fecha) - new Date()) / (1000 * 60 * 60 * 24)
    );
    if (dias < 0) return 'vencido';
    if (dias <= 30) return 'proximo';
    return 'ok';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.marca.trim() || !form.serial.trim())
      return alert('Marca y serial son obligatorios');
    const id = await onAgregar(form);
    if (id) {
      setForm({
        marca: '',
        modelo: '',
        codigoInterno: '',
        serial: '',
        presion: 300,
        estado: 'activo',
        pruebaHidraulica: '',
        vencimientoTubo: '',
        observaciones: '',
        proveedor: {
          nombre: '',
          contacto: '',
          telefono: '',
          email: '',
          web: '',
        },
        mascaras: [],
      });
      setMostrarForm(false);
      alert('✅ ERA agregada correctamente');
      // Opcional: expandir automáticamente la nueva ERA para asignar máscaras
      // setExpandido(id);
    }
  };

  const iniciarEdicion = (era) => {
    setEditandoId(era.id);
    setFormEdit({
      marca: era.marca || '',
      modelo: era.modelo || '',
      codigoInterno: era.codigoInterno || '',
      serial: era.serial || '',
      presion: era.presion || 300,
      estado: era.estado || 'activo',
      pruebaHidraulica: era.pruebaHidraulica || '',
      vencimientoTubo: era.vencimientoTubo || '',
      observaciones: era.observaciones || '',
      proveedor: era.proveedor || {
        nombre: '',
        contacto: '',
        telefono: '',
        email: '',
        web: '',
      },
      mascaras: era.mascaras || [],
    });
  };

  const guardarEdicion = async (eraId) => {
    await onActualizar(eraId, formEdit);
    setEditandoId(null);
    alert('✅ ERA actualizada');
  };

  const agregarMascara = async (eraId) => {
    if (!nuevaMascara.numero)
      return alert('El número de máscara es obligatorio');
    const era = eras.find((e) => e.id === eraId);
    const nuevasMascaras = [
      ...(era.mascaras || []),
      { id: Date.now().toString(), ...nuevaMascara },
    ];
    await onActualizar(eraId, { mascaras: nuevasMascaras });
    setNuevaMascara({
      numero: '',
      marca: '',
      talla: '',
      vencimiento: '',
      estado: 'bueno',
      observaciones: '',
    });
    alert('✅ Máscara agregada');
  };

  const eliminarMascara = async (eraId, mascaraId) => {
    if (!window.confirm('¿Eliminar esta máscara?')) return;
    const era = eras.find((e) => e.id === eraId);
    const mascarasFiltradas = (era.mascaras || []).filter(
      (m) => m.id !== mascaraId
    );
    await onActualizar(eraId, { mascaras: mascarasFiltradas });
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
        <h2 style={styles.pageTitle}>🎽 ERAs</h2>
        <button
          style={styles.btnPrimary}
          onClick={() => setMostrarForm(!mostrarForm)}
        >
          {mostrarForm ? '✖ Cancelar' : '➕ Nueva ERA'}
        </button>
      </div>

      {/* Formulario de nueva ERA */}
      {mostrarForm && (
        <div
          style={{ ...styles.card, background: '#f5f3ff', marginBottom: 24 }}
        >
          <h3 style={styles.cardTitle}>➕ Nueva ERA</h3>
          <form onSubmit={handleSubmit}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3,1fr)',
                gap: 16,
              }}
            >
              <div>
                <label style={styles.label}>Marca *</label>
                <input
                  type="text"
                  value={form.marca}
                  onChange={(e) => setForm({ ...form, marca: e.target.value })}
                  style={styles.input}
                  required
                />
              </div>
              <div>
                <label style={styles.label}>Modelo</label>
                <input
                  type="text"
                  value={form.modelo}
                  onChange={(e) => setForm({ ...form, modelo: e.target.value })}
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
                  placeholder="Ej: ERA-001"
                />
              </div>
              <div>
                <label style={styles.label}>Serial *</label>
                <input
                  type="text"
                  value={form.serial}
                  onChange={(e) => setForm({ ...form, serial: e.target.value })}
                  style={styles.input}
                  required
                />
              </div>
              <div>
                <label style={styles.label}>Presión (bar)</label>
                <input
                  type="number"
                  value={form.presion}
                  onChange={(e) =>
                    setForm({ ...form, presion: parseInt(e.target.value) || 0 })
                  }
                  style={styles.input}
                  min="0"
                  max="300"
                />
              </div>
              <div>
                <label style={styles.label}>Estado</label>
                <select
                  value={form.estado}
                  onChange={(e) => setForm({ ...form, estado: e.target.value })}
                  style={styles.input}
                >
                  <option value="activo">Activo</option>
                  <option value="mantenimiento">Mantenimiento</option>
                  <option value="baja">Baja</option>
                </select>
              </div>
              <div>
                <label style={styles.label}>Prueba hidráulica</label>
                <input
                  type="date"
                  value={form.pruebaHidraulica}
                  onChange={(e) =>
                    setForm({ ...form, pruebaHidraulica: e.target.value })
                  }
                  style={styles.input}
                />
              </div>
              <div>
                <label style={styles.label}>Vencimiento tubo</label>
                <input
                  type="date"
                  value={form.vencimientoTubo}
                  onChange={(e) =>
                    setForm({ ...form, vencimientoTubo: e.target.value })
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
                marginTop: 16,
                background: '#ede9fe',
                padding: 16,
                borderRadius: 8,
              }}
            >
              <h4 style={{ marginBottom: 12 }}>🏢 Datos del proveedor</h4>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3,1fr)',
                  gap: 12,
                }}
              >
                <div>
                  <label style={styles.label}>Nombre</label>
                  <input
                    type="text"
                    value={form.proveedor.nombre}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        proveedor: {
                          ...form.proveedor,
                          nombre: e.target.value,
                        },
                      })
                    }
                    style={styles.input}
                  />
                </div>
                <div>
                  <label style={styles.label}>Contacto</label>
                  <input
                    type="text"
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
                </div>
                <div>
                  <label style={styles.label}>Teléfono</label>
                  <input
                    type="text"
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
                </div>
                <div>
                  <label style={styles.label}>Email</label>
                  <input
                    type="email"
                    value={form.proveedor.email}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        proveedor: { ...form.proveedor, email: e.target.value },
                      })
                    }
                    style={styles.input}
                  />
                </div>
                <div>
                  <label style={styles.label}>Web</label>
                  <input
                    type="text"
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
            </div>
            <button
              type="submit"
              style={{
                width: '100%',
                marginTop: 20,
                background: '#7c3aed',
                color: 'white',
                padding: 12,
                borderRadius: 8,
                fontWeight: 'bold',
                border: 'none',
              }}
            >
              💾 Guardar ERA
            </button>
          </form>
        </div>
      )}

      {/* Listado de ERAs */}
      {eras.length === 0 ? (
        <div style={styles.card}>No hay ERAs registradas</div>
      ) : (
        eras.map((era) => {
          const isExpandido = expandido === era.id;
          const vehiculoAsig = era.vehiculoAsignado
            ? vehiculos.find((v) => v.id === era.vehiculoAsignado)
            : null;
          const mascaras = era.mascaras || [];
          const isEditando = editandoId === era.id;
          return (
            <div
              key={era.id}
              style={{
                ...styles.card,
                borderLeft: `4px solid ${
                  era.estado === 'activo' ? '#a78bfa' : '#f59e0b'
                }`,
                marginBottom: 12,
              }}
            >
              {/* Cabecera de la tarjeta */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                }}
                onClick={() => setExpandido(isExpandido ? null : era.id)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 28 }}>🎽</span>
                  <div>
                    <strong style={{ fontSize: 16 }}>
                      {era.marca} {era.modelo}
                    </strong>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>
                      {era.codigoInterno && (
                        <span>🏷️ {era.codigoInterno} | </span>
                      )}
                      🔖 {era.serial}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span
                    style={
                      era.estado === 'activo'
                        ? styles.badgeOk
                        : styles.badgeWarn
                    }
                  >
                    {era.estado === 'activo'
                      ? '✓ ACTIVA'
                      : era.estado === 'mantenimiento'
                      ? '🔧 MANT.'
                      : '⛔ BAJA'}
                  </span>
                  <span style={{ fontSize: 18 }}>
                    {isExpandido ? '▲' : '▼'}
                  </span>
                </div>
              </div>

              {/* Contenido expandido */}
              {isExpandido && (
                <div
                  style={{
                    marginTop: 16,
                    borderTop: '1px solid #e5e7eb',
                    paddingTop: 16,
                  }}
                >
                  {isEditando ? (
                    // Formulario de edición
                    <div>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(2,1fr)',
                          gap: 12,
                        }}
                      >
                        <div>
                          <label style={styles.label}>Marca</label>
                          <input
                            value={formEdit.marca}
                            onChange={(e) =>
                              setFormEdit({
                                ...formEdit,
                                marca: e.target.value,
                              })
                            }
                            style={styles.input}
                          />
                        </div>
                        <div>
                          <label style={styles.label}>Modelo</label>
                          <input
                            value={formEdit.modelo}
                            onChange={(e) =>
                              setFormEdit({
                                ...formEdit,
                                modelo: e.target.value,
                              })
                            }
                            style={styles.input}
                          />
                        </div>
                        <div>
                          <label style={styles.label}>Código interno</label>
                          <input
                            value={formEdit.codigoInterno}
                            onChange={(e) =>
                              setFormEdit({
                                ...formEdit,
                                codigoInterno: e.target.value,
                              })
                            }
                            style={styles.input}
                          />
                        </div>
                        <div>
                          <label style={styles.label}>Serial</label>
                          <input
                            value={formEdit.serial}
                            onChange={(e) =>
                              setFormEdit({
                                ...formEdit,
                                serial: e.target.value,
                              })
                            }
                            style={styles.input}
                          />
                        </div>
                        <div>
                          <label style={styles.label}>Presión (bar)</label>
                          <input
                            type="number"
                            value={formEdit.presion}
                            onChange={(e) =>
                              setFormEdit({
                                ...formEdit,
                                presion: parseInt(e.target.value) || 0,
                              })
                            }
                            style={styles.input}
                          />
                        </div>
                        <div>
                          <label style={styles.label}>Estado</label>
                          <select
                            value={formEdit.estado}
                            onChange={(e) =>
                              setFormEdit({
                                ...formEdit,
                                estado: e.target.value,
                              })
                            }
                            style={styles.input}
                          >
                            <option value="activo">Activo</option>
                            <option value="mantenimiento">Mantenimiento</option>
                            <option value="baja">Baja</option>
                          </select>
                        </div>
                        <div>
                          <label style={styles.label}>Prueba hidráulica</label>
                          <input
                            type="date"
                            value={formEdit.pruebaHidraulica}
                            onChange={(e) =>
                              setFormEdit({
                                ...formEdit,
                                pruebaHidraulica: e.target.value,
                              })
                            }
                            style={styles.input}
                          />
                        </div>
                        <div>
                          <label style={styles.label}>Vencimiento tubo</label>
                          <input
                            type="date"
                            value={formEdit.vencimientoTubo}
                            onChange={(e) =>
                              setFormEdit({
                                ...formEdit,
                                vencimientoTubo: e.target.value,
                              })
                            }
                            style={styles.input}
                          />
                        </div>
                        <div>
                          <label style={styles.label}>Observaciones</label>
                          <input
                            value={formEdit.observaciones}
                            onChange={(e) =>
                              setFormEdit({
                                ...formEdit,
                                observaciones: e.target.value,
                              })
                            }
                            style={styles.input}
                          />
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                        <button
                          onClick={() => guardarEdicion(era.id)}
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
                    // Vista de detalle
                    <>
                      <div
                        style={{
                          display: 'flex',
                          gap: 8,
                          flexWrap: 'wrap',
                          marginBottom: 16,
                        }}
                      >
                        <button
                          onClick={() => iniciarEdicion(era)}
                          style={{
                            ...styles.btnPrimary,
                            background: '#3b82f6',
                          }}
                        >
                          ✏️ Editar
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm('¿Eliminar esta ERA?'))
                              onEliminar(era.id);
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
                                  onAsignarERA(asignarVeh, era.id);
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
                              onDesasignarERA(vehiculoAsig.id, era.id)
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
                          <strong>🎯 Presión:</strong> {era.presion} bar
                        </div>
                        <div>
                          <strong>🔧 Prueba hidráulica:</strong>{' '}
                          {era.pruebaHidraulica || '-'}
                        </div>
                        <div>
                          <strong>🧪 Vencimiento tubo:</strong>{' '}
                          {era.vencimientoTubo || '-'}
                        </div>
                        <div>
                          <strong>📝 Observaciones:</strong>{' '}
                          {era.observaciones || '-'}
                        </div>
                        <div>
                          <strong>🏢 Proveedor:</strong>{' '}
                          {era.proveedor?.nombre || '-'}
                        </div>
                      </div>

                      {/* Sección de máscaras */}
                      <div
                        style={{
                          marginTop: 20,
                          borderTop: '1px solid #ccc',
                          paddingTop: 16,
                        }}
                      >
                        <h4>😷 Máscaras asociadas</h4>
                        <div
                          style={{
                            display: 'flex',
                            gap: 8,
                            flexWrap: 'wrap',
                            marginBottom: 12,
                          }}
                        >
                          <input
                            type="text"
                            placeholder="N° Máscara"
                            value={nuevaMascara.numero}
                            onChange={(e) =>
                              setNuevaMascara({
                                ...nuevaMascara,
                                numero: e.target.value,
                              })
                            }
                            style={styles.input}
                          />
                          <input
                            type="text"
                            placeholder="Marca"
                            value={nuevaMascara.marca}
                            onChange={(e) =>
                              setNuevaMascara({
                                ...nuevaMascara,
                                marca: e.target.value,
                              })
                            }
                            style={styles.input}
                          />
                          <input
                            type="text"
                            placeholder="Talla"
                            value={nuevaMascara.talla}
                            onChange={(e) =>
                              setNuevaMascara({
                                ...nuevaMascara,
                                talla: e.target.value,
                              })
                            }
                            style={styles.input}
                          />
                          <input
                            type="date"
                            value={nuevaMascara.vencimiento}
                            onChange={(e) =>
                              setNuevaMascara({
                                ...nuevaMascara,
                                vencimiento: e.target.value,
                              })
                            }
                            style={styles.input}
                          />
                          <select
                            value={nuevaMascara.estado}
                            onChange={(e) =>
                              setNuevaMascara({
                                ...nuevaMascara,
                                estado: e.target.value,
                              })
                            }
                            style={styles.input}
                          >
                            <option value="bueno">Bueno</option>
                            <option value="regular">Regular</option>
                            <option value="malo">Malo</option>
                          </select>
                          <button
                            style={styles.btnPrimary}
                            onClick={() => agregarMascara(era.id)}
                          >
                            ➕ Agregar Máscara
                          </button>
                        </div>
                        {mascaras.length === 0 ? (
                          <p>Sin máscaras registradas</p>
                        ) : (
                          <table style={styles.table}>
                            <thead>
                              <tr>
                                <th>N°</th>
                                <th>Marca</th>
                                <th>Talla</th>
                                <th>Vencimiento</th>
                                <th>Estado</th>
                                <th></th>
                              </tr>
                            </thead>
                            <tbody>
                              {mascaras.map((m) => {
                                const venc = verificarVencimiento(
                                  m.vencimiento
                                );
                                return (
                                  <tr key={m.id}>
                                    <td>{m.numero}</td>
                                    <td>{m.marca}</td>
                                    <td>{m.talla}</td>
                                    <td
                                      style={{
                                        color:
                                          venc === 'vencido'
                                            ? 'red'
                                            : venc === 'proximo'
                                            ? 'orange'
                                            : 'black',
                                      }}
                                    >
                                      {m.vencimiento || '-'}
                                    </td>
                                    <td>{m.estado}</td>
                                    <td>
                                      <button
                                        onClick={() =>
                                          eliminarMascara(era.id, m.id)
                                        }
                                      >
                                        🗑️
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
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
