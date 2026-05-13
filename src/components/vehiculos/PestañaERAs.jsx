import { useState } from 'react';

export default function PestañaERAs({
  vehiculo,
  styles,
  eras,
  onAsignarERA,
  onDesasignarERA,
}) {
  const [eraAsignar, setEraAsignar] = useState('');
  const erasAsignadas = (vehiculo.erasAsignadas || [])
    .map((id) => eras.find((e) => e.id === id))
    .filter(Boolean);
  const erasDisponibles = eras.filter(
    (e) => !e.vehiculoAsignado && e.estado === 'activo'
  );
  return (
    <div>
      <div
        style={{
          background: '#f5f3ff',
          padding: 16,
          borderRadius: 10,
          marginBottom: 16,
          border: '1px solid #ddd6fe',
        }}
      >
        <h4 style={{ fontWeight: 'bold', color: '#7c3aed', marginBottom: 12 }}>
          ➕ Asignar ERA
        </h4>
        <div style={{ display: 'flex', gap: 10 }}>
          <select
            value={eraAsignar}
            onChange={(e) => setEraAsignar(e.target.value)}
            style={{ ...styles.input, flex: 1 }}
          >
            <option value="">Seleccionar ERA disponible...</option>
            {erasDisponibles.map((era) => (
              <option key={era.id} value={era.id}>
                {era.marca} {era.modelo} [{era.serial}]
              </option>
            ))}
          </select>
          <button
            style={{
              padding: '10px 16px',
              background: '#7c3aed',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              fontWeight: 600,
            }}
            onClick={() => {
              if (eraAsignar) onAsignarERA(vehiculo.id, eraAsignar);
              setEraAsignar('');
            }}
          >
            ➕ Asignar
          </button>
        </div>
      </div>
      {erasAsignadas.map((era) => (
        <div
          key={era.id}
          style={{
            padding: 12,
            background: '#f5f3ff',
            borderRadius: 8,
            marginBottom: 8,
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <strong>
              {era.marca} {era.modelo}
            </strong>
            <br />
            {era.serial} - {era.presion} bar
          </div>
          <button onClick={() => onDesasignarERA(vehiculo.id, era.id)}>
            ↩️ Quitar
          </button>
        </div>
      ))}
    </div>
  );
}
