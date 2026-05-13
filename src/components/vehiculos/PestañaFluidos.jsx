export default function PestañaFluidos({ vehiculo, styles, onActualizar }) {
  const fluidosConfig = [
    { key: 'aceite', label: '🛢️ Aceite de Motor' },
    { key: 'refrigerante', label: '🌡️ Refrigerante' },
    { key: 'combustible', label: '⛽ Combustible' },
    { key: 'liquidoFrenos', label: '🔴 Líquido de Frenos' },
  ];
  return (
    <div
      style={{
        ...styles.card,
        background: '#fffbeb',
        border: '2px solid #fde68a',
      }}
    >
      <h4 style={{ fontWeight: 'bold', color: '#92400e', marginBottom: 16 }}>
        🛢️ Control de Fluidos
      </h4>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 12,
        }}
      >
        {fluidosConfig.map((fluido) => {
          const val = (vehiculo.fluidos || {})[fluido.key] || {};
          return (
            <div
              key={fluido.key}
              style={{
                background: 'white',
                padding: 14,
                borderRadius: 10,
                border: '1px solid #e5e7eb',
              }}
            >
              <h5
                style={{
                  fontWeight: 'bold',
                  marginBottom: 10,
                  color: '#374151',
                }}
              >
                {fluido.label}
              </h5>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                {['ok', 'bajo', 'critico'].map((est) => {
                  const colores = {
                    ok: '#10b981',
                    bajo: '#f59e0b',
                    critico: '#ef4444',
                  };
                  const labels = {
                    ok: '✓ OK',
                    bajo: '⚠️ Bajo',
                    critico: '❌ Crítico',
                  };
                  return (
                    <button
                      key={est}
                      style={{
                        flex: 1,
                        padding: 6,
                        background:
                          val.estado === est ? colores[est] : '#f3f4f6',
                        color: val.estado === est ? 'white' : '#374151',
                        border: 'none',
                        borderRadius: 6,
                        cursor: 'pointer',
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                      onClick={() =>
                        onActualizar(vehiculo.id, {
                          fluidos: {
                            ...(vehiculo.fluidos || {}),
                            [fluido.key]: { ...val, estado: est },
                          },
                        })
                      }
                    >
                      {labels[est]}
                    </button>
                  );
                })}
              </div>
              <input
                type="text"
                placeholder="Observaciones..."
                value={val.observaciones || ''}
                onChange={(e) =>
                  onActualizar(vehiculo.id, {
                    fluidos: {
                      ...(vehiculo.fluidos || {}),
                      [fluido.key]: { ...val, observaciones: e.target.value },
                    },
                  })
                }
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  border: '1px solid #d1d5db',
                  borderRadius: 6,
                  fontSize: 12,
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
