import { useState } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function Bitacora({
  styles,
  bitacora,
  vehiculos,
  eras,
  equipos,
  inventario,
  personal,
  indumentaria,
  onAgregar,
  onActualizar,
  onEliminar,
}) {
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editando, setEditando] = useState(null);
  const [expandido, setExpandido] = useState(null);
  const [detalleRegistro, setDetalleRegistro] = useState(null);
  const [form, setForm] = useState({
    titulo: '',
    descripcion: '',
    tipo: 'incidente',
    entidadTipo: 'vehiculo',
    entidadId: '',
    fecha: new Date().toISOString().split('T')[0],
  });
  const [formEdit, setFormEdit] = useState({});
  const [filtroEntidad, setFiltroEntidad] = useState('');
  const [filtroTipoEnt, setFiltroTipoEnt] = useState('');

  const tipos = [
    'incidente',
    'mantenimiento',
    'capacitacion',
    'inspeccion',
    'reparacion',
    'otro',
  ];
  const tipoColores = {
    incidente: '#ef4444',
    mantenimiento: '#f59e0b',
    capacitacion: '#3b82f6',
    inspeccion: '#8b5cf6',
    reparacion: '#10b981',
    otro: '#6b7280',
  };
  const tipoIconos = {
    incidente: '🚨',
    mantenimiento: '🔧',
    capacitacion: '📚',
    inspeccion: '🔍',
    reparacion: '🛠️',
    otro: '📝',
  };
  const entidadIconos = {
    vehiculo: '🚛',
    era: '🎽',
    equipo: '🧯',
    herramienta: '🔧',
    personal: '👤',
    indumentaria: '👕',
  };
  const entidadLabels = {
    vehiculo: 'Móvil',
    era: 'ERA',
    equipo: 'Equipo',
    herramienta: 'Herramienta/Item',
    personal: 'Personal',
    indumentaria: 'Prenda/EPP',
  };

  const getEntidadesDisponibles = (tipoEnt) => {
    if (tipoEnt === 'vehiculo')
      return vehiculos.map((v) => ({ id: v.id, nombre: v.nombre }));
    if (tipoEnt === 'era')
      return eras.map((e) => ({
        id: e.id,
        nombre: `${e.marca} ${e.modelo} [${e.serial}]`,
      }));
    if (tipoEnt === 'equipo')
      return equipos.map((e) => ({
        id: e.id,
        nombre: `${e.nombre}${e.codigoInterno ? ` [${e.codigoInterno}]` : ''}`,
      }));
    if (tipoEnt === 'herramienta')
      return inventario.map((i) => ({
        id: i.id,
        nombre: `${i.nombre} [${i.categoria}]`,
      }));
    if (tipoEnt === 'personal')
      return personal.map((p) => ({
        id: p.id,
        nombre: `${p.nombre} ${p.apellido || ''}`,
      }));
    if (tipoEnt === 'indumentaria')
      return indumentaria
        ? indumentaria.map((i) => ({
            id: i.id,
            nombre: `${i.nombre} - Talla ${i.talla}`,
          }))
        : [];
    return [];
  };

  const getNombreEntidad = (tipoEnt, entidadId) => {
    const lista = getEntidadesDisponibles(tipoEnt);
    const encontrado = lista.find((e) => e.id === entidadId);
    return encontrado ? encontrado.nombre : 'N/D';
  };

  const bitacoraFiltrada = bitacora.filter((b) => {
    if (filtroTipoEnt && b.entidadTipo !== filtroTipoEnt) return false;
    if (filtroEntidad && b.entidadId !== filtroEntidad) return false;
    return true;
  });

  const exportarPDF = () => {
    const doc = new jsPDF();
    doc.text('Bitácora de eventos', 14, 10);
    const columnas = ['Fecha', 'Título', 'Tipo', 'Entidad', 'Descripción'];
    const filas = bitacoraFiltrada.map((b) => [
      b.fecha || '-',
      b.titulo || '-',
      b.tipo || '-',
      `${b.entidadTipo} - ${
        b.entidadNombre || getNombreEntidad(b.entidadTipo, b.entidadId)
      }`,
      b.descripcion || '',
    ]);
    doc.autoTable({ head: [columnas], body: filas, startY: 20 });
    doc.save('bitacora.pdf');
  };

  const exportarRegistroIndividual = (b) => {
    const doc = new jsPDF();
    doc.text(`Registro: ${b.titulo}`, 14, 10);
    doc.text(`Fecha: ${b.fecha}`, 14, 20);
    doc.text(`Tipo: ${b.tipo}`, 14, 30);
    doc.text(
      `Entidad: ${b.entidadTipo} - ${
        b.entidadNombre || getNombreEntidad(b.entidadTipo, b.entidadId)
      }`,
      14,
      40
    );
    doc.text(`Descripción: ${b.descripcion || ''}`, 14, 50);
    doc.save(`bitacora_${b.id}.pdf`);
  };

  const verDetalle = (b) => setDetalleRegistro(b);
  const cerrarDetalle = () => setDetalleRegistro(null);

  const iniciarEdicion = (b) => {
    setEditando(b.id);
    setFormEdit({
      titulo: b.titulo || '',
      descripcion: b.descripcion || '',
      tipo: b.tipo || 'incidente',
      entidadTipo: b.entidadTipo || 'vehiculo',
      entidadId: b.entidadId || '',
      fecha: b.fecha || '',
    });
  };

  const guardarEdicion = async (id) => {
    await onActualizar(id, formEdit);
    setEditando(null);
    alert('✅ Registro actualizado');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.titulo.trim()) return alert('El título es obligatorio');
    if (!form.entidadId) return alert('Seleccioná una entidad');
    const nombreEntidad = getNombreEntidad(form.entidadTipo, form.entidadId);
    await onAgregar({ ...form, entidadNombre: nombreEntidad });
    setForm({
      titulo: '',
      descripcion: '',
      tipo: 'incidente',
      entidadTipo: 'vehiculo',
      entidadId: '',
      fecha: new Date().toISOString().split('T')[0],
    });
    setMostrarForm(false);
    alert('✅ Registro agregado');
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
        <h2 style={styles.pageTitle}>📝 Bitácora</h2>
        <div>
          <button
            style={{ ...styles.btnPrimary, marginRight: 8 }}
            onClick={exportarPDF}
          >
            📄 Exportar listado PDF
          </button>
          <button
            style={styles.btnPrimary}
            onClick={() => setMostrarForm(!mostrarForm)}
          >
            {mostrarForm ? '✖ Cancelar' : '➕ Nuevo Registro'}
          </button>
        </div>
      </div>

      {detalleRegistro && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: 16,
              padding: 24,
              maxWidth: '90vw',
              maxHeight: '90vh',
              overflow: 'auto',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 16,
              }}
            >
              <h3>Detalle del registro</h3>
              <button onClick={cerrarDetalle} style={styles.btnPrimary}>
                Cerrar
              </button>
            </div>
            <p>
              <strong>📌 Título:</strong> {detalleRegistro.titulo}
            </p>
            <p>
              <strong>📅 Fecha:</strong> {detalleRegistro.fecha}
            </p>
            <p>
              <strong>🏷️ Tipo:</strong> {tipoIconos[detalleRegistro.tipo]}{' '}
              {detalleRegistro.tipo}
            </p>
            <p>
              <strong>📦 Entidad:</strong>{' '}
              {entidadIconos[detalleRegistro.entidadTipo]}{' '}
              {detalleRegistro.entidadTipo} -{' '}
              {detalleRegistro.entidadNombre ||
                getNombreEntidad(
                  detalleRegistro.entidadTipo,
                  detalleRegistro.entidadId
                )}
            </p>
            <p>
              <strong>📝 Descripción:</strong> {detalleRegistro.descripcion}
            </p>
            <button
              onClick={() => exportarRegistroIndividual(detalleRegistro)}
              style={{ ...styles.btnPrimary, marginTop: 16 }}
            >
              📄 Exportar este registro a PDF
            </button>
          </div>
        </div>
      )}

      {mostrarForm && (
        <div style={styles.card}>
          <h3>➕ Nuevo Registro</h3>
          <form onSubmit={handleSubmit}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3,1fr)',
                gap: 16,
              }}
            >
              <div style={{ gridColumn: 'span 2' }}>
                <label style={styles.label}>Título *</label>
                <input
                  type="text"
                  value={form.titulo}
                  onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                  style={styles.input}
                  required
                />
              </div>
              <div>
                <label style={styles.label}>Fecha</label>
                <input
                  type="date"
                  value={form.fecha}
                  onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                  style={styles.input}
                />
              </div>
              <div>
                <label style={styles.label}>Tipo</label>
                <select
                  value={form.tipo}
                  onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                  style={styles.input}
                >
                  {tipos.map((t) => (
                    <option key={t} value={t}>
                      {tipoIconos[t]} {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={styles.label}>Entidad</label>
                <select
                  value={form.entidadTipo}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      entidadTipo: e.target.value,
                      entidadId: '',
                    })
                  }
                  style={styles.input}
                >
                  {Object.keys(entidadLabels).map((t) => (
                    <option key={t} value={t}>
                      {entidadIconos[t]} {entidadLabels[t]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label style={styles.label}>
                  {entidadLabels[form.entidadTipo]} *
                </label>
                <select
                  value={form.entidadId}
                  onChange={(e) =>
                    setForm({ ...form, entidadId: e.target.value })
                  }
                  style={styles.input}
                >
                  <option value="">Seleccionar...</option>
                  {getEntidadesDisponibles(form.entidadTipo).map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ gridColumn: 'span 3' }}>
                <label style={styles.label}>Descripción</label>
                <textarea
                  value={form.descripcion}
                  onChange={(e) =>
                    setForm({ ...form, descripcion: e.target.value })
                  }
                  rows={3}
                  style={{ ...styles.input, resize: 'vertical' }}
                />
              </div>
            </div>
            <button
              type="submit"
              style={{
                width: '100%',
                marginTop: 16,
                background: '#2563eb',
                color: 'white',
                padding: 10,
                borderRadius: 8,
                fontWeight: 'bold',
                border: 'none',
              }}
            >
              💾 Guardar
            </button>
          </form>
        </div>
      )}

      <div
        style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}
      >
        <select
          value={filtroTipoEnt}
          onChange={(e) => {
            setFiltroTipoEnt(e.target.value);
            setFiltroEntidad('');
          }}
          style={{ ...styles.input, width: 180 }}
        >
          <option value="">Todas las entidades</option>
          {Object.keys(entidadLabels).map((t) => (
            <option key={t} value={t}>
              {entidadIconos[t]} {entidadLabels[t]}
            </option>
          ))}
        </select>
        {filtroTipoEnt && (
          <select
            value={filtroEntidad}
            onChange={(e) => setFiltroEntidad(e.target.value)}
            style={{ ...styles.input, flex: 1 }}
          >
            <option value="">Todos</option>
            {getEntidadesDisponibles(filtroTipoEnt).map((e) => (
              <option key={e.id} value={e.id}>
                {e.nombre}
              </option>
            ))}
          </select>
        )}
      </div>

      {bitacoraFiltrada.length === 0 ? (
        <div style={styles.card}>No hay registros</div>
      ) : (
        bitacoraFiltrada.map((b) => {
          const isEditando = editando === b.id;
          const nombreEntidad =
            b.entidadNombre || getNombreEntidad(b.entidadTipo, b.entidadId);
          return (
            <div
              key={b.id}
              style={{
                ...styles.card,
                borderLeft: `5px solid ${tipoColores[b.tipo] || '#e5e7eb'}`,
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: 10,
                }}
              >
                <div
                  style={{ flex: 1, cursor: 'pointer' }}
                  onClick={() => setExpandido(expandido === b.id ? null : b.id)}
                >
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: 14 }}
                  >
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        background: tipoColores[b.tipo] || '#6b7280',
                        borderRadius: 10,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 22,
                      }}
                    >
                      {tipoIconos[b.tipo] || '📝'}
                    </div>
                    <div>
                      <h3 style={{ fontWeight: 'bold', fontSize: 16 }}>
                        {b.titulo}
                      </h3>
                      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                        <span
                          style={{
                            background: `${tipoColores[b.tipo] || '#6b7280'}20`,
                            color: tipoColores[b.tipo] || '#374151',
                            padding: '2px 8px',
                            borderRadius: 6,
                            fontSize: 12,
                          }}
                        >
                          {tipoIconos[b.tipo]} {b.tipo}
                        </span>
                        <span
                          style={{
                            background: '#f3f4f6',
                            padding: '2px 8px',
                            borderRadius: 6,
                            fontSize: 12,
                          }}
                        >
                          {entidadIconos[b.entidadTipo]} {nombreEntidad}
                        </span>
                        <span style={{ fontSize: 12, color: '#6b7280' }}>
                          📅 {b.fecha}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {!isEditando && (
                    <button
                      onClick={() => iniciarEdicion(b)}
                      style={{
                        padding: '6px 12px',
                        background: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                      }}
                    >
                      ✏️ Editar
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (window.confirm('¿Eliminar?')) onEliminar(b.id);
                    }}
                    style={{
                      padding: '6px 12px',
                      background: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: 6,
                      cursor: 'pointer',
                    }}
                  >
                    🗑️
                  </button>
                  <button
                    onClick={() => verDetalle(b)}
                    style={{
                      padding: '6px 12px',
                      background: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: 6,
                      cursor: 'pointer',
                    }}
                  >
                    👁️ Ver detalle
                  </button>
                </div>
              </div>
              {expandido === b.id && (
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
                          gridTemplateColumns: 'repeat(3,1fr)',
                          gap: 12,
                        }}
                      >
                        <div style={{ gridColumn: 'span 2' }}>
                          <label style={styles.label}>Título</label>
                          <input
                            value={formEdit.titulo}
                            onChange={(e) =>
                              setFormEdit({
                                ...formEdit,
                                titulo: e.target.value,
                              })
                            }
                            style={styles.input}
                          />
                        </div>
                        <div>
                          <label style={styles.label}>Fecha</label>
                          <input
                            type="date"
                            value={formEdit.fecha}
                            onChange={(e) =>
                              setFormEdit({
                                ...formEdit,
                                fecha: e.target.value,
                              })
                            }
                            style={styles.input}
                          />
                        </div>
                        <div>
                          <label style={styles.label}>Tipo</label>
                          <select
                            value={formEdit.tipo}
                            onChange={(e) =>
                              setFormEdit({ ...formEdit, tipo: e.target.value })
                            }
                            style={styles.input}
                          >
                            {tipos.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label style={styles.label}>Entidad</label>
                          <select
                            value={formEdit.entidadTipo}
                            onChange={(e) =>
                              setFormEdit({
                                ...formEdit,
                                entidadTipo: e.target.value,
                                entidadId: '',
                              })
                            }
                            style={styles.input}
                          >
                            {Object.keys(entidadLabels).map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label style={styles.label}>
                            {entidadLabels[formEdit.entidadTipo]}
                          </label>
                          <select
                            value={formEdit.entidadId}
                            onChange={(e) =>
                              setFormEdit({
                                ...formEdit,
                                entidadId: e.target.value,
                              })
                            }
                            style={styles.input}
                          >
                            <option value="">Seleccionar</option>
                            {getEntidadesDisponibles(formEdit.entidadTipo).map(
                              (e) => (
                                <option key={e.id} value={e.id}>
                                  {e.nombre}
                                </option>
                              )
                            )}
                          </select>
                        </div>
                        <div style={{ gridColumn: 'span 3' }}>
                          <label style={styles.label}>Descripción</label>
                          <textarea
                            value={formEdit.descripcion}
                            onChange={(e) =>
                              setFormEdit({
                                ...formEdit,
                                descripcion: e.target.value,
                              })
                            }
                            rows={2}
                            style={styles.input}
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => guardarEdicion(b.id)}
                        style={{ ...styles.btnPrimary, marginTop: 12 }}
                      >
                        Guardar
                      </button>
                      <button
                        onClick={() => setEditando(null)}
                        style={{
                          ...styles.btnPrimary,
                          background: '#6b7280',
                          marginTop: 12,
                          marginLeft: 8,
                        }}
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <div>
                      <strong>📝 Descripción completa:</strong>{' '}
                      <p style={{ whiteSpace: 'pre-wrap', marginTop: 8 }}>
                        {b.descripcion || 'Sin descripción'}
                      </p>
                    </div>
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
