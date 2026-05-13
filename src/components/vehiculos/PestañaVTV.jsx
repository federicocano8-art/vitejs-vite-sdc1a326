export default function PestañaVTV({ vehiculo, styles, onActualizar }) {
  const vtv = vehiculo.vtv || {};
  const dias = vtv.vencimiento
    ? Math.ceil(
        (new Date(vtv.vencimiento) - new Date()) / (1000 * 60 * 60 * 24)
      )
    : null;
  return (
    <div style={{ ...styles.card, background: '#f9fafb' }}>
      <h4 style={{ fontWeight: 'bold', marginBottom: 16 }}>🚗 Control VTV</h4>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 12,
        }}
      >
        <div>
          <label style={styles.label}>Vencimiento VTV</label>
          <input
            type="date"
            value={vtv.vencimiento || ''}
            onChange={(e) =>
              onActualizar(vehiculo.id, {
                vtv: { ...vtv, vencimiento: e.target.value },
              })
            }
            style={styles.input}
          />
        </div>
        <div>
          <label style={styles.label}>N° Certificado</label>
          <input
            type="text"
            value={vtv.certificado || ''}
            onChange={(e) =>
              onActualizar(vehiculo.id, {
                vtv: { ...vtv, certificado: e.target.value },
              })
            }
            style={styles.input}
          />
        </div>
        <div>
          <label style={styles.label}>Planta</label>
          <input
            type="text"
            value={vtv.planta || ''}
            onChange={(e) =>
              onActualizar(vehiculo.id, {
                vtv: { ...vtv, planta: e.target.value },
              })
            }
            style={styles.input}
          />
        </div>
        <div>
          <label style={styles.label}>Última revisión</label>
          <input
            type="date"
            value={vtv.ultimaRevision || ''}
            onChange={(e) =>
              onActualizar(vehiculo.id, {
                vtv: { ...vtv, ultimaRevision: e.target.value },
              })
            }
            style={styles.input}
          />
        </div>
        <div style={{ gridColumn: 'span 2' }}>
          <label style={styles.label}>Observaciones</label>
          <input
            type="text"
            value={vtv.observaciones || ''}
            onChange={(e) =>
              onActualizar(vehiculo.id, {
                vtv: { ...vtv, observaciones: e.target.value },
              })
            }
            style={styles.input}
          />
        </div>
      </div>
      {dias !== null && (
        <div
          style={{
            marginTop: 16,
            padding: 12,
            background: '#fef3c7',
            borderRadius: 8,
            textAlign: 'center',
          }}
        >
          <strong>
            {dias < 0
              ? `Vencida hace ${-dias} días`
              : dias === 0
              ? 'Vence HOY'
              : `Vence en ${dias} días`}
          </strong>
        </div>
      )}
    </div>
  );
}
