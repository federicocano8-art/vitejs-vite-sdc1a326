/* eslint-disable react/no-unescaped-entities */
import { useState } from 'react';

export default function CajasHerramientas({
  styles,
  cajas = [],
  herramientas = [],
  vehiculos = [],
  onAgregarCaja,
  onActualizarCaja,
  onEliminarCaja,
  onAgregarHerramientaACaja,
  onEliminarHerramientaDeCaja,
  onAsignarCajaAVehiculo,
  onDesasignarCajaDeVehiculo,
}) {
  const [expandido, setExpandido] = useState({});
  const [mostrarForm, setMostrarForm] = useState(false);
  // eslint-disable-next-line no-unused-vars
  const [editando, setEditando] = useState(null);
  const [formEdit, setFormEdit] = useState({});
  const [form, setForm] = useState({
    nombre: '',
    codigo: '',
    tipo: 'caja_herramientas',
    ubicacion: '',
    observaciones: '',
  });
  const [herramientaSeleccionada, setHerramientaSeleccionada] = useState('');
  const [cantidadHerramienta, setCantidadHerramienta] = useState(1);
  const [cajaSeleccionada, setCajaSeleccionada] = useState(null);
  const [vehiculoAsignar, setVehiculoAsignar] = useState('');

  const tiposContainer = [
    {
      value: 'caja_herramientas',
      label: '📦 Caja de Herramientas',
      icono: '📦',
    },
    { value: 'maletin', label: '💼 Maletín', icono: '💼' },
    { value: 'estante', label: '🗄️ Estante', icono: '🗄️' },
    { value: 'gaveta', label: '📂 Gaveta', icono: '📂' },
    { value: 'mochila', label: '🎒 Mochila', icono: '🎒' },
    { value: 'valija', label: '🧳 Valija', icono: '🧳' },
    { value: 'contenedor', label: '📦 Contenedor Grande', icono: '📦' },
  ];

  const getIconoPorTipo = (tipo) => {
    const encontrado = tiposContainer.find((t) => t.value === tipo);
    return encontrado ? encontrado.icono : '📦';
  };

  const iniciarEdicion = (caja) => {
    setEditando(caja.id);
    setFormEdit({
      nombre: caja.nombre || '',
      codigo: caja.codigo || '',
      tipo: caja.tipo || 'caja_herramientas',
      ubicacion: caja.ubicacion || '',
      observaciones: caja.observaciones || '',
    });
  };

  const guardarEdicion = async (cajaId) => {
    await onActualizarCaja(cajaId, formEdit);
    setEditando(null);
    alert('✅ Caja actualizada correctamente');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) {
      alert('El nombre es obligatorio');
      return;
    }
    await onAgregarCaja(form);
    setForm({
      nombre: '',
      codigo: '',
      tipo: 'caja_herramientas',
      ubicacion: '',
      observaciones: '',
    });
    setMostrarForm(false);
    alert('✅ Caja agregada correctamente');
  };

  const handleAgregarHerramienta = async (cajaId) => {
    if (!herramientaSeleccionada) {
      alert('Seleccione una herramienta');
      return;
    }
    await onAgregarHerramientaACaja(
      cajaId,
      herramientaSeleccionada,
      cantidadHerramienta
    );
    setHerramientaSeleccionada('');
    setCantidadHerramienta(1);
    setCajaSeleccionada(null);
    alert('✅ Herramienta agregada a la caja');
  };

  const renderHerramientasEnCaja = (caja) => {
    const herramientasCaja = caja.herramientas || [];
    if (herramientasCaja.length === 0) {
      return (
        <p
          style={{
            fontSize: '12px',
            color: '#6b7280',
            padding: '8px',
            textAlign: 'center',
          }}
        >
          No hay herramientas en esta caja
        </p>
      );
    }
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {herramientasCaja.map((h) => {
          const herramientaInfo = herramientas.find(
            (her) => her.id === h.herramientaId
          );
          return (
            <div
              key={h.herramientaId}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '10px 14px',
                background: '#f9fafb',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
              }}
            >
              <div>
                <strong style={{ fontSize: '14px' }}>
                  {herramientaInfo?.nombre || h.herramientaId}
                </strong>
                <span
                  style={{
                    fontSize: '12px',
                    color: '#6b7280',
                    marginLeft: '8px',
                  }}
                >
                  x{h.cantidad || 1}
                </span>
                {h.ubicacion && (
                  <span
                    style={{
                      fontSize: '11px',
                      color: '#6b7280',
                      marginLeft: '8px',
                    }}
                  >
                    📍 {h.ubicacion}
                  </span>
                )}
                {herramientaInfo?.codigoInterno && (
                  <span
                    style={{
                      fontSize: '11px',
                      color: '#6b7280',
                      marginLeft: '8px',
                    }}
                  >
                    🏷️ {herramientaInfo.codigoInterno}
                  </span>
                )}
              </div>
              <button
                style={{
                  padding: '5px 10px',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: '600',
                }}
                onClick={() => {
                  if (
                    window.confirm(
                      `¿Quitar ${
                        herramientaInfo?.nombre || 'esta herramienta'
                      } de la caja?`
                    )
                  ) {
                    onEliminarHerramientaDeCaja(caja.id, h.herramientaId);
                  }
                }}
              >
                🗑️ Quitar
              </button>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        <div>
          <h2 style={styles.pageTitle}>📦 Cajas de Herramientas</h2>
          <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
            {cajas.length} contenedores registrados
          </p>
        </div>
        <button
          style={styles.btnPrimary}
          onClick={() => setMostrarForm(!mostrarForm)}
        >
          {mostrarForm ? '✖ Cancelar' : '➕ Nueva Caja'}
        </button>
      </div>

      {mostrarForm && (
        <div
          style={{
            ...styles.card,
            background: '#f0f9ff',
            border: '2px solid #0ea5e9',
            marginBottom: '24px',
          }}
        >
          <h3 style={{ ...styles.cardTitle, color: '#0369a1' }}>
            ➕ Nueva Caja / Contenedor
          </h3>
          <form onSubmit={handleSubmit}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '16px',
                marginBottom: '16px',
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
                  placeholder="Ej: Caja de Herramientas #1"
                />
              </div>
              <div>
                <label style={styles.label}>Código / QR</label>
                <input
                  type="text"
                  value={form.codigo}
                  onChange={(e) => setForm({ ...form, codigo: e.target.value })}
                  style={styles.input}
                  placeholder="Ej: CAJA-001 / QR-001"
                />
              </div>
              <div>
                <label style={styles.label}>Tipo de Contenedor</label>
                <select
                  value={form.tipo}
                  onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                  style={styles.input}
                >
                  {tiposContainer.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.icono} {t.label}
                    </option>
                  ))}
                </select>
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
                  placeholder="Ej: Estante 3, Gaveta 2"
                />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <label style={styles.label}>Observaciones</label>
                <input
                  type="text"
                  value={form.observaciones}
                  onChange={(e) =>
                    setForm({ ...form, observaciones: e.target.value })
                  }
                  style={styles.input}
                  placeholder="Observaciones adicionales..."
                />
              </div>
            </div>
            <button
              type="submit"
              style={{
                width: '100%',
                padding: '12px',
                background: '#10b981',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '700',
                cursor: 'pointer',
              }}
            >
              💾 Agregar Caja
            </button>
          </form>
        </div>
      )}

      {cajas.length === 0 ? (
        <div style={{ ...styles.card, textAlign: 'center', padding: '60px' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>📦</div>
          <h3 style={{ color: '#6b7280' }}>
            No hay cajas de herramientas registradas
          </h3>
          <p style={{ color: '#9ca3af', fontSize: '13px', marginTop: '8px' }}>
            Hacé clic en &quot;➕ Nueva Caja&quot; para comenzar
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {cajas.map((caja) => {
            const estaExpandido = expandido[caja.id];
            const vehiculoAsignado = caja.vehiculoAsignado
              ? vehiculos.find((v) => v.id === caja.vehiculoAsignado)
              : null;
            const mostrarModalAgregar = cajaSeleccionada === caja.id;
            const isEditando = editando === caja.id;

            return (
              <div
                key={caja.id}
                style={{ ...styles.card, border: '2px solid #d1fae5' }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                  }}
                  onClick={() =>
                    setExpandido((prev) => ({
                      ...prev,
                      [caja.id]: !prev[caja.id],
                    }))
                  }
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                    }}
                  >
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '24px',
                      }}
                    >
                      {getIconoPorTipo(caja.tipo)}
                    </div>
                    <div>
                      <h3
                        style={{
                          fontWeight: 'bold',
                          fontSize: '16px',
                          marginBottom: '2px',
                        }}
                      >
                        {caja.nombre}
                      </h3>
                      <div
                        style={{
                          display: 'flex',
                          gap: '8px',
                          flexWrap: 'wrap',
                        }}
                      >
                        {caja.codigo && (
                          <span
                            style={{
                              fontSize: '11px',
                              background: '#fef3c7',
                              color: '#92400e',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontWeight: '600',
                            }}
                          >
                            🏷️ {caja.codigo}
                          </span>
                        )}
                        {caja.ubicacion && (
                          <span style={{ fontSize: '11px', color: '#6b7280' }}>
                            📍 {caja.ubicacion}
                          </span>
                        )}
                        {vehiculoAsignado && (
                          <span
                            style={{
                              fontSize: '11px',
                              background: '#dbeafe',
                              color: '#1e40af',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              fontWeight: '600',
                            }}
                          >
                            🚛 {vehiculoAsignado.nombre}
                          </span>
                        )}
                        <span style={{ fontSize: '11px', color: '#6b7280' }}>
                          🔧 {(caja.herramientas || []).length} herramientas
                        </span>
                      </div>
                    </div>
                  </div>
                  <span style={{ fontSize: '20px', color: '#6b7280' }}>
                    {estaExpandido ? '▲' : '▼'}
                  </span>
                </div>

                {estaExpandido && (
                  <div
                    style={{
                      marginTop: '20px',
                      borderTop: '1px solid #e5e7eb',
                      paddingTop: '20px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        gap: '8px',
                        marginBottom: '16px',
                        flexWrap: 'wrap',
                      }}
                    >
                      <button
                        style={{
                          padding: '8px 14px',
                          background: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '600',
                        }}
                        onClick={() => setCajaSeleccionada(caja.id)}
                      >
                        ➕ Agregar Herramienta
                      </button>
                      <button
                        style={{
                          padding: '8px 14px',
                          background: '#f59e0b',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '600',
                        }}
                        onClick={() => iniciarEdicion(caja)}
                      >
                        ✏️ Editar
                      </button>
                      <button
                        style={{
                          padding: '8px 14px',
                          background: '#ef4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '600',
                        }}
                        onClick={() => {
                          if (window.confirm(`¿Eliminar caja ${caja.nombre}?`))
                            onEliminarCaja(caja.id);
                        }}
                      >
                        🗑️ Eliminar Caja
                      </button>
                    </div>

                    {isEditando && (
                      <div
                        style={{
                          background: '#f0f9ff',
                          padding: '16px',
                          borderRadius: '10px',
                          marginBottom: '16px',
                        }}
                      >
                        <h4
                          style={{
                            fontWeight: 'bold',
                            color: '#0369a1',
                            marginBottom: '12px',
                          }}
                        >
                          ✏️ Editando: {caja.nombre}
                        </h4>
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: '12px',
                            marginBottom: '12px',
                          }}
                        >
                          <div>
                            <label style={styles.label}>Nombre</label>
                            <input
                              type="text"
                              value={formEdit.nombre || ''}
                              onChange={(e) =>
                                setFormEdit({
                                  ...formEdit,
                                  nombre: e.target.value,
                                })
                              }
                              style={styles.input}
                            />
                          </div>
                          <div>
                            <label style={styles.label}>Código</label>
                            <input
                              type="text"
                              value={formEdit.codigo || ''}
                              onChange={(e) =>
                                setFormEdit({
                                  ...formEdit,
                                  codigo: e.target.value,
                                })
                              }
                              style={styles.input}
                            />
                          </div>
                          <div>
                            <label style={styles.label}>Tipo</label>
                            <select
                              value={formEdit.tipo || 'caja_herramientas'}
                              onChange={(e) =>
                                setFormEdit({
                                  ...formEdit,
                                  tipo: e.target.value,
                                })
                              }
                              style={styles.input}
                            >
                              {tiposContainer.map((t) => (
                                <option key={t.value} value={t.value}>
                                  {t.icono} {t.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label style={styles.label}>Ubicación</label>
                            <input
                              type="text"
                              value={formEdit.ubicacion || ''}
                              onChange={(e) =>
                                setFormEdit({
                                  ...formEdit,
                                  ubicacion: e.target.value,
                                })
                              }
                              style={styles.input}
                            />
                          </div>
                          <div style={{ gridColumn: 'span 2' }}>
                            <label style={styles.label}>Observaciones</label>
                            <input
                              type="text"
                              value={formEdit.observaciones || ''}
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
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button
                            style={{
                              flex: 1,
                              padding: '10px',
                              background: '#10b981',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              fontWeight: '700',
                              cursor: 'pointer',
                            }}
                            onClick={() => guardarEdicion(caja.id)}
                          >
                            💾 Guardar
                          </button>
                          <button
                            style={{
                              flex: 1,
                              padding: '10px',
                              background: '#6b7280',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              fontWeight: '700',
                              cursor: 'pointer',
                            }}
                            onClick={() => setEditando(null)}
                          >
                            ✖ Cancelar
                          </button>
                        </div>
                      </div>
                    )}

                    {mostrarModalAgregar && !isEditando && (
                      <div
                        style={{
                          background: '#f0fdf4',
                          padding: '16px',
                          borderRadius: '10px',
                          marginBottom: '16px',
                          border: '1px solid #bbf7d0',
                        }}
                      >
                        <h4
                          style={{
                            fontWeight: 'bold',
                            color: '#15803d',
                            marginBottom: '12px',
                          }}
                        >
                          ➕ Agregar herramienta a &quot;{caja.nombre}&quot;
                        </h4>
                        <div
                          style={{
                            display: 'flex',
                            gap: '10px',
                            flexWrap: 'wrap',
                          }}
                        >
                          <select
                            value={herramientaSeleccionada}
                            onChange={(e) =>
                              setHerramientaSeleccionada(e.target.value)
                            }
                            style={{ ...styles.input, flex: 2 }}
                          >
                            <option value="">Seleccionar herramienta...</option>
                            {herramientas
                              .filter((h) => (h.stock || 0) > 0)
                              .map((h) => (
                                <option key={h.id} value={h.id}>
                                  🔧 {h.nombre} - Stock: {h.stock || 0}{' '}
                                  {h.unidad || 'u'}
                                  {h.codigoInterno
                                    ? ` [${h.codigoInterno}]`
                                    : ''}
                                </option>
                              ))}
                          </select>
                          <input
                            type="number"
                            value={cantidadHerramienta}
                            onChange={(e) =>
                              setCantidadHerramienta(
                                parseInt(e.target.value) || 1
                              )
                            }
                            style={{ width: '80px', ...styles.input }}
                            min="1"
                          />
                          <button
                            style={{
                              padding: '10px 16px',
                              background: '#15803d',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              fontWeight: '600',
                              cursor: 'pointer',
                            }}
                            onClick={() => handleAgregarHerramienta(caja.id)}
                          >
                            ➕ Agregar
                          </button>
                          <button
                            style={{
                              padding: '10px 16px',
                              background: '#6b7280',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              fontWeight: '600',
                              cursor: 'pointer',
                            }}
                            onClick={() => setCajaSeleccionada(null)}
                          >
                            ✖ Cancelar
                          </button>
                        </div>
                      </div>
                    )}

                    <div
                      style={{
                        background: '#f0fdf4',
                        padding: '16px',
                        borderRadius: '10px',
                        marginBottom: '16px',
                        border: '1px solid #bbf7d0',
                      }}
                    >
                      <h5
                        style={{
                          fontWeight: 'bold',
                          color: '#15803d',
                          marginBottom: '12px',
                        }}
                      >
                        🚛 Asignación a Móvil
                      </h5>
                      {vehiculoAsignado ? (
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <p
                            style={{
                              fontSize: '14px',
                              fontWeight: '600',
                              color: '#15803d',
                            }}
                          >
                            ✅ Asignado a: {vehiculoAsignado.nombre}
                          </p>
                          <button
                            style={{
                              padding: '8px 14px',
                              background: '#ef4444',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: '600',
                            }}
                            onClick={() => {
                              if (window.confirm('¿Desasignar caja del móvil?'))
                                onDesasignarCajaDeVehiculo(
                                  vehiculoAsignado.id,
                                  caja.id
                                );
                            }}
                          >
                            ↩️ Desasignar
                          </button>
                        </div>
                      ) : (
                        <div
                          style={{
                            display: 'flex',
                            gap: '10px',
                            alignItems: 'center',
                          }}
                        >
                          <select
                            value={vehiculoAsignar}
                            onChange={(e) => setVehiculoAsignar(e.target.value)}
                            style={{ ...styles.input, flex: 1 }}
                          >
                            <option value="">Seleccionar móvil...</option>
                            {vehiculos.map((v) => (
                              <option key={v.id} value={v.id}>
                                🚛 {v.nombre}
                              </option>
                            ))}
                          </select>
                          <button
                            style={{
                              padding: '10px 16px',
                              background: '#15803d',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              fontWeight: '600',
                              cursor: 'pointer',
                            }}
                            onClick={() => {
                              if (!vehiculoAsignar) {
                                alert('Seleccioná un móvil');
                                return;
                              }
                              onAsignarCajaAVehiculo(vehiculoAsignar, caja.id);
                              setVehiculoAsignar('');
                            }}
                          >
                            ➕ Asignar a Móvil
                          </button>
                        </div>
                      )}
                    </div>

                    <h5
                      style={{
                        fontWeight: 'bold',
                        color: '#374151',
                        marginBottom: '10px',
                      }}
                    >
                      🔧 Herramientas en esta caja
                    </h5>
                    {renderHerramientasEnCaja(caja)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
