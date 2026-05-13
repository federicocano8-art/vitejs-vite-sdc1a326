import { useState } from 'react';
import VehiculoCard from './VehiculoCard';

export default function Vehiculos(props) {
  const { styles, vehiculos, onAgregar, ...rest } = props;
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState({
    nombre: '',
    tipo: 'Camion Bomba',
    patente: '',
    año: '',
    estado: 'operativo',
    chasis: '',
    motor: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) {
      alert('El nombre es obligatorio');
      return;
    }
    await onAgregar(form);
    setForm({
      nombre: '',
      tipo: 'Camion Bomba',
      patente: '',
      año: '',
      estado: 'operativo',
      chasis: '',
      motor: '',
    });
    setMostrarForm(false);
  };

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <h2 style={styles.pageTitle}>🚛 Móviles</h2>
        <button
          style={styles.btnPrimary}
          onClick={() => setMostrarForm(!mostrarForm)}
        >
          {mostrarForm ? '✖ Cancelar' : '➕ Nuevo Móvil'}
        </button>
      </div>

      {mostrarForm && (
        <div
          style={{
            ...styles.card,
            background: '#f0f9ff',
            border: '2px solid #0ea5e9',
            marginBottom: 24,
          }}
        >
          <h3 style={{ ...styles.cardTitle, color: '#0369a1' }}>
            ➕ Nuevo Móvil
          </h3>
          <form onSubmit={handleSubmit}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 16,
                marginBottom: 16,
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
                  onChange={(e) =>
                    setForm({ ...form, patente: e.target.value })
                  }
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
            <button
              type="submit"
              style={{
                width: '100%',
                padding: 12,
                background: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: 8,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              💾 Agregar Móvil
            </button>
          </form>
        </div>
      )}

      {vehiculos.length === 0 ? (
        <div style={{ ...styles.card, textAlign: 'center', padding: 60 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🚛</div>
          <h3 style={{ color: '#6b7280' }}>No hay móviles registrados</h3>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {vehiculos.map((v) => (
            <VehiculoCard key={v.id} vehiculo={v} styles={styles} {...rest} />
          ))}
        </div>
      )}
    </div>
  );
}
