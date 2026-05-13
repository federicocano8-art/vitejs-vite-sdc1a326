import { useState } from 'react';

export default function PestañaItems({
  vehiculo,
  styles,
  inventario,
  onAsignarItem,
  onDesasignarItem,
  onActualizarCantidadItem,
}) {
  const [itemAsignar, setItemAsignar] = useState('');
  const [cantAsignar, setCantAsignar] = useState(1);
  const itemsAsignados = vehiculo.itemsAsignados || [];

  return (
    <div>
      <div
        style={{
          background: '#f0fdf4',
          padding: 16,
          borderRadius: 10,
          marginBottom: 16,
          border: '1px solid #bbf7d0',
        }}
      >
        <h4 style={{ fontWeight: 'bold', color: '#15803d', marginBottom: 12 }}>
          ➕ Asignar Item General
        </h4>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto auto',
            gap: 10,
          }}
        >
          <select
            value={itemAsignar}
            onChange={(e) => setItemAsignar(e.target.value)}
            style={styles.input}
          >
            <option value="">Seleccionar item...</option>
            {inventario
              .filter((i) => (i.stock || 0) > 0)
              .map((i) => (
                <option key={i.id} value={i.id}>
                  {i.nombre} - Stock: {i.stock} {i.unidad}
                </option>
              ))}
          </select>
          <input
            type="number"
            value={cantAsignar}
            onChange={(e) => setCantAsignar(parseInt(e.target.value) || 1)}
            style={{ ...styles.input, width: 80 }}
            min="1"
          />
          <button
            style={{
              padding: '10px 16px',
              background: '#15803d',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              fontWeight: 600,
            }}
            onClick={() => {
              if (itemAsignar)
                onAsignarItem(vehiculo.id, itemAsignar, cantAsignar);
              setItemAsignar('');
              setCantAsignar(1);
            }}
          >
            ➕ Asignar
          </button>
        </div>
      </div>
      {itemsAsignados.length === 0 ? (
        <p>No hay items asignados</p>
      ) : (
        itemsAsignados.map((item) => (
          <div
            key={item.itemId}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: 12,
              background: '#f9fafb',
              borderRadius: 8,
              marginBottom: 8,
            }}
          >
            <div>
              <strong>{item.nombre}</strong>
              <br />
              {item.categoria} · {item.cantidad} {item.unidad}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={() =>
                  onActualizarCantidadItem(
                    vehiculo.id,
                    item.itemId,
                    Math.max(1, (item.cantidad || 1) - 1)
                  )
                }
              >
                -
              </button>
              <span>{item.cantidad}</span>
              <button
                onClick={() =>
                  onActualizarCantidadItem(
                    vehiculo.id,
                    item.itemId,
                    (item.cantidad || 1) + 1
                  )
                }
              >
                +
              </button>
              <button
                onClick={() => onDesasignarItem(vehiculo.id, item.itemId)}
              >
                ↩️
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
