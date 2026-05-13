import { useState } from 'react';

export default function PestañaCompartimientos({
  vehiculo,
  styles,
  inventario,
  onAgregarCompartimiento,
  onEliminarCompartimiento,
  onAgregarSubcompartimiento,
  onEliminarSubcompartimiento,
  onAgregarItemSubcomp,
  onEliminarItemSubcomp,
  onActualizarCantidadItemSubcomp,
}) {
  const [nuevoCompNombre, setNuevoCompNombre] = useState('');
  const [nuevoSubNombres, setNuevoSubNombres] = useState({});
  const [expandComp, setExpandComp] = useState({});
  const [itemSelSubcomp, setItemSelSubcomp] = useState({});
  const [cantSelSubcomp, setCantSelSubcomp] = useState({});

  const compartimientos = vehiculo.compartimientos || [];

  // El resto del componente igual que antes (sin cambios)
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
          ➕ Nuevo Compartimiento
        </h4>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            type="text"
            placeholder="Nombre del compartimiento..."
            value={nuevoCompNombre}
            onChange={(e) => setNuevoCompNombre(e.target.value)}
            style={{ ...styles.input, flex: 1 }}
          />
          <button
            style={{
              padding: '10px 18px',
              background: '#15803d',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              fontWeight: 600,
              cursor: 'pointer',
            }}
            onClick={() => {
              if (nuevoCompNombre.trim())
                onAgregarCompartimiento(vehiculo.id, nuevoCompNombre.trim());
              setNuevoCompNombre('');
            }}
          >
            ➕ Agregar
          </button>
        </div>
      </div>
      {compartimientos.map((comp) => {
        const compExp = expandComp[comp.id];
        return (
          <div
            key={comp.id}
            style={{
              border: '2px solid #d1fae5',
              borderRadius: 12,
              marginBottom: 12,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                background: '#ecfdf5',
                padding: '14px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
              }}
              onClick={() =>
                setExpandComp((prev) => ({
                  ...prev,
                  [comp.id]: !prev[comp.id],
                }))
              }
            >
              <div>
                <strong>{comp.nombre}</strong> (
                {(comp.subcompartimientos || []).length} subcompartimientos)
              </div>
              <button
                style={{
                  padding: '5px 10px',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm('Eliminar compartimiento?'))
                    onEliminarCompartimiento(vehiculo.id, comp.id);
                }}
              >
                🗑️
              </button>
            </div>
            {compExp && (
              <div style={{ padding: 16 }}>
                <div style={{ marginBottom: 12 }}>
                  <input
                    type="text"
                    placeholder="Nuevo subcompartimiento"
                    value={nuevoSubNombres[comp.id] || ''}
                    onChange={(e) =>
                      setNuevoSubNombres((prev) => ({
                        ...prev,
                        [comp.id]: e.target.value,
                      }))
                    }
                    style={styles.input}
                  />
                  <button
                    onClick={() => {
                      if (nuevoSubNombres[comp.id])
                        onAgregarSubcompartimiento(
                          vehiculo.id,
                          comp.id,
                          nuevoSubNombres[comp.id]
                        );
                      setNuevoSubNombres((prev) => ({
                        ...prev,
                        [comp.id]: '',
                      }));
                    }}
                  >
                    Agregar Sub
                  </button>
                </div>
                {comp.subcompartimientos?.map((sub) => (
                  <div
                    key={sub.id}
                    style={{
                      border: '1px solid #ccc',
                      marginBottom: 8,
                      padding: 8,
                    }}
                  >
                    <div>
                      <strong>{sub.nombre}</strong>{' '}
                      <button
                        onClick={() =>
                          onEliminarSubcompartimiento(
                            vehiculo.id,
                            comp.id,
                            sub.id
                          )
                        }
                      >
                        🗑️
                      </button>
                    </div>
                    <select
                      onChange={(e) =>
                        setItemSelSubcomp((prev) => ({
                          ...prev,
                          [sub.id]: e.target.value,
                        }))
                      }
                      value={itemSelSubcomp[sub.id] || ''}
                    >
                      <option value="">Seleccionar item</option>
                      {inventario.map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.nombre}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      placeholder="Cantidad"
                      onChange={(e) =>
                        setCantSelSubcomp((prev) => ({
                          ...prev,
                          [sub.id]: parseInt(e.target.value) || 1,
                        }))
                      }
                      value={cantSelSubcomp[sub.id] || 1}
                      style={{ width: 80 }}
                    />
                    <button
                      onClick={() =>
                        onAgregarItemSubcomp(
                          vehiculo.id,
                          comp.id,
                          sub.id,
                          itemSelSubcomp[sub.id],
                          cantSelSubcomp[sub.id]
                        )
                      }
                    >
                      Agregar
                    </button>
                    {sub.items?.map((item) => (
                      <div
                        key={item.itemId}
                        style={{ display: 'flex', gap: 8, marginTop: 8 }}
                      >
                        <span>
                          {item.nombre} - {item.cantidadEsperada} {item.unidad}
                        </span>
                        <button
                          onClick={() =>
                            onEliminarItemSubcomp(
                              vehiculo.id,
                              comp.id,
                              sub.id,
                              item.itemId
                            )
                          }
                        >
                          ✕
                        </button>
                        <button
                          onClick={() =>
                            onActualizarCantidadItemSubcomp(
                              vehiculo.id,
                              comp.id,
                              sub.id,
                              item.itemId,
                              (item.cantidadEsperada || 1) + 1
                            )
                          }
                        >
                          +
                        </button>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
