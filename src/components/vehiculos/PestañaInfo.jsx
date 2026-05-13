import { useState } from 'react';

export default function PestañaInfo({
  vehiculo,
  styles,
  onActualizar,
  onEliminar,
}) {
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState({
    nombre: vehiculo.nombre || '',
    tipo: vehiculo.tipo || '',
    patente: vehiculo.patente || '',
    año: vehiculo.año || '',
    chasis: vehiculo.chasis || '',
    motor: vehiculo.motor || '',
  });

  const guardar = async () => {
    await onActualizar(vehiculo.id, form);
    setEditando(false);
    alert('✅ Móvil actualizado');
  };

  if (editando) {
    return (
      <div
        style={{
          background: '#f0f9ff',
          padding: 20,
          borderRadius: 12,
          border: '2px solid #0ea5e9',
          marginBottom: 16,
        }}
      >
        <h4 style={{ fontWeight: 'bold', color: '#0369a1', marginBottom: 16 }}>
          ✏️ Editando: {vehiculo.nombre}
        </h4>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 12,
            marginBottom: 12,
          }}
        >
          <div>
            <label style={styles.label}>Nombre</label>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
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
              {[
                'Camion Bomba',
                'Camion Tanque',
                'Unidad de Rescate',
                'Ambulancia',
                'Vehiculo de Comando',
                'Otro',
              ].map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={styles.label}>Patente</label>
            <input
              type="text"
              value={form.patente}
              onChange={(e) => setForm({ ...form, patente: e.target.value })}
              style={styles.input}
            />
          </div>
          <div>
            <label style={styles.label}>Año</label>
            <input
              type="number"
              value={form.año}
              onChange={(e) => setForm({ ...form, año: e.target.value })}
              style={styles.input}
            />
          </div>
          <div>
            <label style={styles.label}>Chasis</label>
            <input
              type="text"
              value={form.chasis}
              onChange={(e) => setForm({ ...form, chasis: e.target.value })}
              style={styles.input}
            />
          </div>
          <div>
            <label style={styles.label}>Motor</label>
            <input
              type="text"
              value={form.motor}
              onChange={(e) => setForm({ ...form, motor: e.target.value })}
              style={styles.input}
            />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            style={{
              flex: 1,
              padding: 10,
              background: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              fontWeight: 700,
              cursor: 'pointer',
            }}
            onClick={guardar}
          >
            💾 Guardar
          </button>
          <button
            style={{
              flex: 1,
              padding: 10,
              background: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              fontWeight: 700,
              cursor: 'pointer',
            }}
            onClick={() => setEditando(false)}
          >
            ✖ Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}
      >
        <button
          style={{
            padding: '8px 14px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
          }}
          onClick={() => setEditando(true)}
        >
          ✏️ Editar
        </button>
        <button
          style={{
            padding: '8px 14px',
            background: vehiculo.estado === 'operativo' ? '#f59e0b' : '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
          }}
          onClick={() =>
            onActualizar(vehiculo.id, {
              estado:
                vehiculo.estado === 'operativo' ? 'mantenimiento' : 'operativo',
            })
          }
        >
          {vehiculo.estado === 'operativo'
            ? '🔧 Pasar a Mantenimiento'
            : '✅ Marcar Operativo'}
        </button>
        <button
          style={{
            padding: '8px 14px',
            background: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 600,
          }}
          onClick={() => {
            if (window.confirm(`¿Eliminar móvil ${vehiculo.nombre}?`))
              onEliminar(vehiculo.id);
          }}
        >
          🗑️ Eliminar
        </button>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 12,
        }}
      >
        <div
          style={{
            background: '#f9fafb',
            padding: 14,
            borderRadius: 10,
            border: '1px solid #e5e7eb',
          }}
        >
          <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
            Tipo
          </p>
          <p style={{ fontWeight: 600 }}>{vehiculo.tipo || 'N/D'}</p>
        </div>
        <div
          style={{
            background: '#f9fafb',
            padding: 14,
            borderRadius: 10,
            border: '1px solid #e5e7eb',
          }}
        >
          <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
            Patente
          </p>
          <p style={{ fontWeight: 600 }}>{vehiculo.patente || 'N/D'}</p>
        </div>
        <div
          style={{
            background: '#f9fafb',
            padding: 14,
            borderRadius: 10,
            border: '1px solid #e5e7eb',
          }}
        >
          <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>Año</p>
          <p style={{ fontWeight: 600 }}>{vehiculo.año || 'N/D'}</p>
        </div>
        <div
          style={{
            background: '#f9fafb',
            padding: 14,
            borderRadius: 10,
            border: '1px solid #e5e7eb',
          }}
        >
          <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
            Chasis
          </p>
          <p style={{ fontWeight: 600 }}>{vehiculo.chasis || 'N/D'}</p>
        </div>
        <div
          style={{
            background: '#f9fafb',
            padding: 14,
            borderRadius: 10,
            border: '1px solid #e5e7eb',
          }}
        >
          <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
            Motor
          </p>
          <p style={{ fontWeight: 600 }}>{vehiculo.motor || 'N/D'}</p>
        </div>
        <div
          style={{
            background: '#f9fafb',
            padding: 14,
            borderRadius: 10,
            border: '1px solid #e5e7eb',
          }}
        >
          <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>
            Estado
          </p>
          <span
            style={
              vehiculo.estado === 'operativo'
                ? styles.badgeOk
                : styles.badgeWarn
            }
          >
            {vehiculo.estado === 'operativo'
              ? '✓ OPERATIVO'
              : '🔧 MANTENIMIENTO'}
          </span>
        </div>
      </div>
    </div>
  );
}
