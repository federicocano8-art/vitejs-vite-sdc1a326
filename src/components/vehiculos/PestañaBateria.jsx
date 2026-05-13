export default function PestañaBateria({ vehiculo, styles, onActualizar }) {
  const bateria = vehiculo.bateria || {};
  return (
    <div
      style={{
        ...styles.card,
        background: '#fffbeb',
        border: '2px solid #fde68a',
      }}
    >
      <h4 style={{ fontWeight: 'bold', color: '#92400e', marginBottom: 16 }}>
        🔋 Estado de Batería
      </h4>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 12,
        }}
      >
        <div>
          <label style={styles.label}>🔋 Batería (Marca/Modelo)</label>
          <input
            type="text"
            value={bateria.descripcion || ''}
            onChange={(e) =>
              onActualizar(vehiculo.id, {
                bateria: { ...bateria, descripcion: e.target.value },
              })
            }
            style={styles.input}
            placeholder="Ej: Bosch S4 12V 70Ah"
          />
        </div>
        <div>
          <label style={styles.label}>🔢 N° de Lote</label>
          <input
            type="text"
            value={bateria.lote || ''}
            onChange={(e) =>
              onActualizar(vehiculo.id, {
                bateria: { ...bateria, lote: e.target.value },
              })
            }
            style={styles.input}
            placeholder="Ej: LOT-2024-001"
          />
        </div>
        <div>
          <label style={styles.label}>📅 Fecha de Compra</label>
          <input
            type="date"
            value={bateria.fechaCompra || ''}
            onChange={(e) =>
              onActualizar(vehiculo.id, {
                bateria: { ...bateria, fechaCompra: e.target.value },
              })
            }
            style={styles.input}
          />
        </div>
        <div>
          <label style={styles.label}>⚡ Estado</label>
          <select
            value={bateria.estado || 'bueno'}
            onChange={(e) =>
              onActualizar(vehiculo.id, {
                bateria: { ...bateria, estado: e.target.value },
              })
            }
            style={{
              ...styles.input,
              background:
                bateria.estado === 'bueno'
                  ? '#ecfdf5'
                  : bateria.estado === 'regular'
                  ? '#fef3c7'
                  : '#fee2e2',
            }}
          >
            <option value="bueno">✅ Bueno</option>
            <option value="regular">⚠️ Regular</option>
            <option value="malo">❌ Malo</option>
          </select>
        </div>
        <div>
          <label style={styles.label}>🔌 Voltaje (V)</label>
          <input
            type="number"
            value={bateria.voltaje || ''}
            onChange={(e) =>
              onActualizar(vehiculo.id, {
                bateria: { ...bateria, voltaje: e.target.value },
              })
            }
            style={styles.input}
            placeholder="Ej: 12.6"
            step="0.1"
          />
        </div>
        <div>
          <label style={styles.label}>🔄 Último Reemplazo</label>
          <input
            type="date"
            value={bateria.ultimoReemplazo || ''}
            onChange={(e) =>
              onActualizar(vehiculo.id, {
                bateria: { ...bateria, ultimoReemplazo: e.target.value },
              })
            }
            style={styles.input}
          />
        </div>
        <div style={{ gridColumn: 'span 3' }}>
          <label style={styles.label}>💬 Observaciones</label>
          <textarea
            value={bateria.observaciones || ''}
            onChange={(e) =>
              onActualizar(vehiculo.id, {
                bateria: { ...bateria, observaciones: e.target.value },
              })
            }
            style={{ ...styles.input, minHeight: '80px', resize: 'vertical' }}
            placeholder="Observaciones sobre el estado de la batería..."
          />
        </div>
      </div>
      <div
        style={{
          marginTop: 16,
          padding: 14,
          background: 'white',
          borderRadius: 10,
          border: '1px solid #e5e7eb',
        }}
      >
        <h5 style={{ fontWeight: 'bold', color: '#374151', marginBottom: 10 }}>
          📊 Resumen
        </h5>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 10,
          }}
        >
          <div
            style={{
              textAlign: 'center',
              padding: 10,
              background: '#f9fafb',
              borderRadius: 8,
            }}
          >
            <p style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>
              Estado
            </p>
            <p
              style={{
                fontWeight: 700,
                fontSize: 14,
                color:
                  bateria.estado === 'bueno'
                    ? '#059669'
                    : bateria.estado === 'regular'
                    ? '#d97706'
                    : bateria.estado === 'malo'
                    ? '#dc2626'
                    : '#6b7280',
              }}
            >
              {bateria.estado === 'bueno'
                ? '✅ Bueno'
                : bateria.estado === 'regular'
                ? '⚠️ Regular'
                : bateria.estado === 'malo'
                ? '❌ Malo'
                : 'N/D'}
            </p>
          </div>
          <div
            style={{
              textAlign: 'center',
              padding: 10,
              background: '#f9fafb',
              borderRadius: 8,
            }}
          >
            <p style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>
              Voltaje
            </p>
            <p style={{ fontWeight: 700, fontSize: 14, color: '#374151' }}>
              {bateria.voltaje ? `${bateria.voltaje} V` : 'N/D'}
            </p>
          </div>
          <div
            style={{
              textAlign: 'center',
              padding: 10,
              background: '#f9fafb',
              borderRadius: 8,
            }}
          >
            <p style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>
              N° Lote
            </p>
            <p style={{ fontWeight: 700, fontSize: 13, color: '#374151' }}>
              {bateria.lote || 'N/D'}
            </p>
          </div>
          <div
            style={{
              textAlign: 'center',
              padding: 10,
              background: '#f9fafb',
              borderRadius: 8,
            }}
          >
            <p style={{ fontSize: 11, color: '#6b7280', marginBottom: 4 }}>
              Fecha Compra
            </p>
            <p style={{ fontWeight: 700, fontSize: 13, color: '#374151' }}>
              {bateria.fechaCompra || 'N/D'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
