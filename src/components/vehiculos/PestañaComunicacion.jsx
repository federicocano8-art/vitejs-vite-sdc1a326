export default function PestañaComunicacion({
  vehiculo,
  styles,
  onActualizar,
}) {
  const com = vehiculo.comunicacion || {};
  return (
    <div style={{ ...styles.card, background: '#f0f9ff' }}>
      <h4 style={{ fontWeight: 'bold', marginBottom: 16 }}>
        📡 Equipos de Comunicación
      </h4>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 12,
        }}
      >
        <div>
          <label style={styles.label}>Marca Radio</label>
          <input
            type="text"
            value={com.radioMarca || ''}
            onChange={(e) =>
              onActualizar(vehiculo.id, {
                comunicacion: { ...com, radioMarca: e.target.value },
              })
            }
            style={styles.input}
          />
        </div>
        <div>
          <label style={styles.label}>Modelo Radio</label>
          <input
            type="text"
            value={com.radioModelo || ''}
            onChange={(e) =>
              onActualizar(vehiculo.id, {
                comunicacion: { ...com, radioModelo: e.target.value },
              })
            }
            style={styles.input}
          />
        </div>
        <div>
          <label style={styles.label}>GPS</label>
          <input
            type="text"
            value={com.gps || ''}
            onChange={(e) =>
              onActualizar(vehiculo.id, {
                comunicacion: { ...com, gps: e.target.value },
              })
            }
            style={styles.input}
          />
        </div>
        <div>
          <label style={styles.label}>Antena</label>
          <input
            type="text"
            value={com.antena || ''}
            onChange={(e) =>
              onActualizar(vehiculo.id, {
                comunicacion: { ...com, antena: e.target.value },
              })
            }
            style={styles.input}
          />
        </div>
        <div style={{ gridColumn: 'span 2' }}>
          <label style={styles.label}>Observaciones</label>
          <textarea
            value={com.observaciones || ''}
            onChange={(e) =>
              onActualizar(vehiculo.id, {
                comunicacion: { ...com, observaciones: e.target.value },
              })
            }
            style={{ ...styles.input, minHeight: 80 }}
          />
        </div>
      </div>
    </div>
  );
}
