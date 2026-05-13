import { useState } from 'react';

export default function PestañaCamposExtra({ vehiculo, styles, onActualizar }) {
  const [nuevoKey, setNuevoKey] = useState('');
  const [nuevoVal, setNuevoVal] = useState('');
  const campos = vehiculo.camposPersonalizados || {};

  const agregar = () => {
    if (!nuevoKey.trim()) return;
    onActualizar(vehiculo.id, {
      camposPersonalizados: { ...campos, [nuevoKey]: nuevoVal },
    });
    setNuevoKey('');
    setNuevoVal('');
  };

  const eliminar = (key) => {
    const nuevos = { ...campos };
    delete nuevos[key];
    onActualizar(vehiculo.id, { camposPersonalizados: nuevos });
  };

  return (
    <div style={styles.card}>
      <h4>Campos personalizados</h4>
      {Object.entries(campos).map(([k, v]) => (
        <div key={k} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <strong>{k}:</strong> {v}{' '}
          <button onClick={() => eliminar(k)}>🗑️</button>
        </div>
      ))}
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <input
          type="text"
          placeholder="Nombre campo"
          value={nuevoKey}
          onChange={(e) => setNuevoKey(e.target.value)}
          style={styles.input}
        />
        <input
          type="text"
          placeholder="Valor"
          value={nuevoVal}
          onChange={(e) => setNuevoVal(e.target.value)}
          style={styles.input}
        />
        <button onClick={agregar} style={styles.btnPrimary}>
          Agregar
        </button>
      </div>
    </div>
  );
}
