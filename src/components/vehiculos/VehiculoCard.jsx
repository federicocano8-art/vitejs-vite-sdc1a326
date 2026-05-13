import { useState } from 'react';
import PestañaInfo from './PestañaInfo';
import PestañaBateria from './PestañaBateria';
import PestañaFluidos from './PestañaFluidos';
import PestañaCompartimientos from './PestañaCompartimientos';
import PestañaItems from './PestañaItems';
import PestañaERAs from './PestañaERAs';
import PestañaEquipos from './PestañaEquipos';
import PestañaVTV from './PestañaVTV';
import PestañaComunicacion from './PestañaComunicacion';
import PestañaCamposExtra from './PestañaCamposExtra';

const tabs = [
  { key: 'info', label: '📋 Info', component: PestañaInfo },
  { key: 'bateria', label: '🔋 Batería', component: PestañaBateria },
  { key: 'fluidos', label: '🛢️ Fluidos', component: PestañaFluidos },
  {
    key: 'compartimientos',
    label: '🗄️ Compartimientos',
    component: PestañaCompartimientos,
  },
  { key: 'items', label: '📦 Items', component: PestañaItems },
  { key: 'eras', label: '🎽 ERAs', component: PestañaERAs },
  { key: 'equipos', label: '🧯 Equipos', component: PestañaEquipos },
  { key: 'vtv', label: '🚗 VTV', component: PestañaVTV },
  {
    key: 'comunicacion',
    label: '📡 Comunicación',
    component: PestañaComunicacion,
  },
  {
    key: 'camposExtra',
    label: '➕ Campos extra',
    component: PestañaCamposExtra,
  },
];

export default function VehiculoCard({ vehiculo, styles, ...props }) {
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('info');
  const CurrentComponent = tabs.find((t) => t.key === activeTab)?.component;

  // Funciones auxiliares (verificar vencimiento, formatear, etc.)
  const verificarVencimiento = (fecha) => {
    if (!fecha) return '';
    const dias = Math.ceil(
      (new Date(fecha) - new Date()) / (1000 * 60 * 60 * 24)
    );
    if (dias < 0) return 'vencido';
    if (dias <= 30) return 'proximo';
    return 'ok';
  };

  // Calcular estado VTV para el badge
  const vtv = vehiculo.vtv || {};
  const vtvVenc = verificarVencimiento(vtv.vencimiento);
  const vtvEstado = !vtv.vencimiento
    ? 'sin_datos'
    : vtvVenc === 'vencido'
    ? 'vencida'
    : vtvVenc === 'proximo'
    ? 'proxima'
    : 'apta';
  const vtvColor =
    vtvEstado === 'apta'
      ? '#059669'
      : vtvEstado === 'proxima'
      ? '#d97706'
      : vtvEstado === 'vencida'
      ? '#dc2626'
      : '#6b7280';
  const vtvBg =
    vtvEstado === 'apta'
      ? '#d1fae5'
      : vtvEstado === 'proxima'
      ? '#fef3c7'
      : vtvEstado === 'vencida'
      ? '#fee2e2'
      : '#f3f4f6';

  return (
    <div
      style={{
        ...styles.card,
        border: `2px solid ${
          vehiculo.estado === 'operativo' ? '#bbf7d0' : '#fde68a'
        }`,
      }}
    >
      {/* Cabecera */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 56,
              height: 56,
              background:
                vehiculo.estado === 'operativo'
                  ? 'linear-gradient(135deg, #10b981, #059669)'
                  : 'linear-gradient(135deg, #f59e0b, #d97706)',
              borderRadius: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
            }}
          >
            🚛
          </div>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 4 }}>
              {vehiculo.nombre}
            </h3>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 13, color: '#6b7280' }}>
                {vehiculo.tipo}
              </span>
              {vehiculo.patente && (
                <span style={{ fontSize: 13, color: '#6b7280' }}>
                  🪪 {vehiculo.patente}
                </span>
              )}
              {vehiculo.año && (
                <span style={{ fontSize: 13, color: '#6b7280' }}>
                  📅 {vehiculo.año}
                </span>
              )}
              {vehiculo.erasAsignadas?.length > 0 && (
                <span
                  style={{
                    fontSize: 12,
                    background: '#ede9fe',
                    color: '#7c3aed',
                    padding: '2px 6px',
                    borderRadius: 4,
                    fontWeight: 600,
                  }}
                >
                  🎽 {vehiculo.erasAsignadas.length} ERAs
                </span>
              )}
              {vehiculo.equiposAsignados?.length > 0 && (
                <span
                  style={{
                    fontSize: 12,
                    background: '#fff7ed',
                    color: '#c2410c',
                    padding: '2px 6px',
                    borderRadius: 4,
                    fontWeight: 600,
                  }}
                >
                  🧯 {vehiculo.equiposAsignados.length} Equipos
                </span>
              )}
              {vehiculo.itemsAsignados?.length > 0 && (
                <span
                  style={{
                    fontSize: 12,
                    background: '#f0fdf4',
                    color: '#15803d',
                    padding: '2px 6px',
                    borderRadius: 4,
                    fontWeight: 600,
                  }}
                >
                  📦 {vehiculo.itemsAsignados.length} Items
                </span>
              )}
              {vtvEstado !== 'sin_datos' && (
                <span
                  style={{
                    fontSize: 12,
                    background: vtvBg,
                    color: vtvColor,
                    padding: '2px 6px',
                    borderRadius: 4,
                    fontWeight: 600,
                  }}
                >
                  🚗 VTV:{' '}
                  {vtvEstado === 'apta'
                    ? '✓'
                    : vtvEstado === 'proxima'
                    ? '⚠️'
                    : '❌'}
                </span>
              )}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span
            style={
              vehiculo.estado === 'operativo'
                ? styles.badgeOk
                : styles.badgeWarn
            }
          >
            {vehiculo.estado === 'operativo'
              ? '✓ OPERATIVO'
              : '🔧 MANTENIMIENTO'}
          </span>
          <span style={{ fontSize: 20, color: '#6b7280' }}>
            {expanded ? '▲' : '▼'}
          </span>
        </div>
      </div>

      {/* Contenido expandido */}
      {expanded && (
        <div
          style={{
            marginTop: 20,
            borderTop: '1px solid #e5e7eb',
            paddingTop: 20,
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: 6,
              marginBottom: 20,
              flexWrap: 'wrap',
            }}
          >
            {tabs.map((tab) => (
              <button
                key={tab.key}
                style={{
                  padding: '8px 14px',
                  background: activeTab === tab.key ? '#2563eb' : '#f3f4f6',
                  color: activeTab === tab.key ? 'white' : '#374151',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: activeTab === tab.key ? 700 : 500,
                }}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {CurrentComponent && (
            <CurrentComponent vehiculo={vehiculo} styles={styles} {...props} />
          )}
        </div>
      )}
    </div>
  );
}
