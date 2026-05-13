import { useState } from 'react';

export default function PestañaEquipos({
  vehiculo,
  styles,
  equipos,
  onAsignarEquipo,
  onDesasignarEquipo,
}) {
  const [equipoAsignar, setEquipoAsignar] = useState('');
  const equiposAsignados = (vehiculo.equiposAsignados || [])
    .map((id) => equipos.find((e) => e.id === id))
    .filter(Boolean);
  const equiposDisponibles = equipos.filter(
    (e) => !e.vehiculoAsignado && e.estado === 'operativo'
  );
  return (
    <div>
      <div
        style={{
          background: '#fff7ed',
          padding: 16,
          borderRadius: 10,
          marginBottom: 16,
          border: '1px solid #fed7aa',
        }}
      >
        <h4 style={{ fontWeight: 'bold', color: '#c2410c', marginBottom: 12 }}>
          ➕ Asignar Equipo
        </h4>
        <div style={{ display: 'flex', gap: 10 }}>
          <select
            value={equipoAsignar}
            onChange={(e) => setEquipoAsignar(e.target.value)}
            style={{ ...styles.input, flex: 1 }}
          >
            <option value="">Seleccionar equipo disponible...</option>
            {equiposDisponibles.map((eq) => (
              <option key={eq.id} value={eq.id}>
                {eq.nombre} {eq.codigoInterno ? `[${eq.codigoInterno}]` : ''}
              </option>
            ))}
          </select>
          <button
            style={{
              padding: '10px 16px',
              background: '#f97316',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              fontWeight: 600,
            }}
            onClick={() => {
              if (equipoAsignar) onAsignarEquipo(vehiculo.id, equipoAsignar);
              setEquipoAsignar('');
            }}
          >
            ➕ Asignar
          </button>
        </div>
      </div>
      {equiposAsignados.map((eq) => (
        <div
          key={eq.id}
          style={{
            padding: 12,
            background: '#fff7ed',
            borderRadius: 8,
            marginBottom: 8,
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <strong>{eq.nombre}</strong>
            <br />
            {eq.tipo} - {eq.codigoInterno}
          </div>
          <button onClick={() => onDesasignarEquipo(vehiculo.id, eq.id)}>
            ↩️ Quitar
          </button>
        </div>
      ))}
    </div>
  );
}
