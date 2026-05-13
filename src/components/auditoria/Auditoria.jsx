import { useState } from 'react';
import { useColeccion } from '../../hooks/useColeccion';

export default function Auditoria({ styles }) {
  const auditoriaCol = useColeccion('auditLogs');
  const [filtroColeccion, setFiltroColeccion] = useState('');
  const [filtroAccion, setFiltroAccion] = useState('');

  const logsFiltrados = auditoriaCol.data.filter((log) => {
    if (filtroColeccion && log.coleccion !== filtroColeccion) return false;
    if (filtroAccion && log.accion !== filtroAccion) return false;
    return true;
  });

  const colecciones = [...new Set(auditoriaCol.data.map((l) => l.coleccion))];
  const acciones = ['crear', 'actualizar', 'eliminar'];

  return (
    <div>
      <h2 style={styles.pageTitle}>📜 Auditoría</h2>
      <div style={styles.card}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
          <select
            value={filtroColeccion}
            onChange={(e) => setFiltroColeccion(e.target.value)}
            style={styles.input}
          >
            <option value="">Todas las colecciones</option>
            {colecciones.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            value={filtroAccion}
            onChange={(e) => setFiltroAccion(e.target.value)}
            style={styles.input}
          >
            <option value="">Todas las acciones</option>
            {acciones.map((a) => (
              <option key={a} value={a}>
                {a.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
        {logsFiltrados.length === 0 ? (
          <p>No hay registros de auditoría</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Usuario</th>
                <th>Colección</th>
                <th>Acción</th>
                <th>Documento ID</th>
                <th>Datos</th>
              </tr>
            </thead>
            <tbody>
              {logsFiltrados.map((log) => (
                <tr key={log.id}>
                  <td>{log.timestamp?.toDate?.().toLocaleString() || '-'}</td>
                  <td>{log.usuario}</td>
                  <td>{log.coleccion}</td>
                  <td>{log.accion}</td>
                  <td>{log.documentoId}</td>
                  <td style={{ maxWidth: 300, wordBreak: 'break-all' }}>
                    {log.datos}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
