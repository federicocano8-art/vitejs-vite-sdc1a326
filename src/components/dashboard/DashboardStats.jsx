import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { styles } from '../../styles/globalStyles';

function DashboardStats({
  vehiculos,
  inventario,
  checklists,
  movimientos,
  personal,
  equipos,
  eras,
  mascaras,
}) {
  const [periodo, setPeriodo] = useState('mes');

  // Datos para KPIs principales
  const itemsBajoStock = inventario.filter(
    (i) => (i.stock || 0) <= (i.stockMinimo || 5)
  );
  const vtvVencidos = vehiculos.filter((v) => {
    if (!v.vtv?.vencimiento) return false;
    const dias = Math.ceil(
      (new Date(v.vtv.vencimiento) - new Date()) / (1000 * 60 * 60 * 24)
    );
    return dias < 0;
  });
  const equiposVencidos = equipos.filter((e) => {
    if (!e.vencimiento) return false;
    const dias = Math.ceil(
      (new Date(e.vencimiento) - new Date()) / (1000 * 60 * 60 * 24)
    );
    return dias < 0;
  });
  const erasVencidas = eras.filter((e) => {
    if (!e.vencimientoTubo) return false;
    const dias = Math.ceil(
      (new Date(e.vencimientoTubo) - new Date()) / (1000 * 60 * 60 * 24)
    );
    return dias < 0;
  });

  const totalMascaras = mascaras || [];
  const mascarasVencidas = totalMascaras.filter((m) => {
    if (!m.vencimiento) return false;
    const dias = Math.ceil(
      (new Date(m.vencimiento) - new Date()) / (1000 * 60 * 60 * 24)
    );
    return dias < 0;
  });

  // Gráfico: Stock por categoría
  const stockPorCategoria = inventario.reduce((acc, item) => {
    const cat = item.categoria || 'otro';
    acc[cat] = (acc[cat] || 0) + (item.stock || 0);
    return acc;
  }, {});
  const stockData = Object.entries(stockPorCategoria).map(([name, value]) => ({
    name,
    value,
  }));
  const COLORS = [
    '#0088FE',
    '#00C49F',
    '#FFBB28',
    '#FF8042',
    '#8884D8',
    '#FF6B6B',
  ];

  // Gráfico: Movimientos mensuales
  const movimientosPorMes = () => {
    const meses = {};
    movimientos.forEach((m) => {
      const fecha = m.creadoEn?.toDate?.() || new Date(m.creadoEn);
      const mes = fecha.toLocaleString('es', { month: 'short' });
      const year = fecha.getFullYear();
      const key = `${year}-${mes}`;
      if (!meses[key])
        meses[key] = { mes: `${mes} ${year}`, entrada: 0, salida: 0 };
      if (m.tipo === 'entrada') meses[key].entrada += m.cantidad || 0;
      else meses[key].salida += m.cantidad || 0;
    });
    return Object.values(meses).slice(-6);
  };

  // Gráfico: Checklists por día (últimos 7 días)
  const ultimos7Dias = [...Array(7)]
    .map((_, i) => {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() - i);
      const fechaStr = fecha.toISOString().split('T')[0];
      const label = fecha.toLocaleString('es', {
        weekday: 'short',
        day: 'numeric',
      });
      return { fecha: fechaStr, label };
    })
    .reverse();

  const checklistData = ultimos7Dias.map((d) => {
    const checks = checklists.filter((c) => c.fecha === d.fecha);
    return {
      dia: d.label,
      ok: checks.filter((c) => c.resultado === 'ok').length,
      nok: checks.filter((c) => c.resultado === 'con_novedades').length,
    };
  });

  // Datos para pie chart de estado de vehículos
  const vehiculosEstado = [
    {
      name: 'Operativos',
      value: vehiculos.filter((v) => v.estado === 'operativo').length,
    },
    {
      name: 'Mantenimiento',
      value: vehiculos.filter((v) => v.estado === 'mantenimiento').length,
    },
  ];

  // Alertas (ejemplo de notificaciones)
  const alertas = [
    ...vtvVencidos.map((v) => ({
      tipo: 'error',
      mensaje: `🚗 VTV vencida: ${v.nombre}`,
    })),
    ...equiposVencidos.map((e) => ({
      tipo: 'error',
      mensaje: `🧯 Equipo vencido: ${e.nombre}`,
    })),
    ...erasVencidas.map((e) => ({
      tipo: 'error',
      mensaje: `🎽 Tubo ERA vencido: ${e.marca} ${e.modelo}`,
    })),
    ...mascarasVencidas.map((m) => ({
      tipo: 'error',
      mensaje: `🎭 Máscara vencida: ${m.numero}`,
    })),
    ...itemsBajoStock.map((i) => ({
      tipo: 'warning',
      mensaje: `📦 Stock bajo: ${i.nombre} (${i.stock} ${i.unidad})`,
    })),
  ];

  return (
    <div>
      {/* KPIs principales */}
      <div style={styles.grid}>
        <div
          style={{
            ...styles.kpi,
            background: 'linear-gradient(135deg, #1e3a5f, #2563eb)',
          }}
        >
          <div style={{ fontSize: 32 }}>🚛</div>
          <div style={{ fontSize: 32, fontWeight: 'bold' }}>
            {vehiculos.length}
          </div>
          <div>Móviles</div>
          <small>
            {vehiculos.filter((v) => v.estado === 'operativo').length}{' '}
            operativos
          </small>
        </div>
        <div
          style={{
            ...styles.kpi,
            background: 'linear-gradient(135deg, #059669, #10b981)',
          }}
        >
          <div style={{ fontSize: 32 }}>👥</div>
          <div style={{ fontSize: 32, fontWeight: 'bold' }}>
            {personal.length}
          </div>
          <div>Personal</div>
          <small>
            {personal.filter((p) => p.estado === 'activo').length} activos
          </small>
        </div>
        <div
          style={{
            ...styles.kpi,
            background: 'linear-gradient(135deg, #d97706, #f59e0b)',
          }}
        >
          <div style={{ fontSize: 32 }}>⚠️</div>
          <div style={{ fontSize: 32, fontWeight: 'bold' }}>
            {itemsBajoStock.length}
          </div>
          <div>Stock bajo</div>
          <small>Revisar inventario</small>
        </div>
        <div
          style={{
            ...styles.kpi,
            background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
          }}
        >
          <div style={{ fontSize: 32 }}>🎭</div>
          <div style={{ fontSize: 32, fontWeight: 'bold' }}>
            {mascarasVencidas.length}
          </div>
          <div>Máscaras vencidas</div>
          <small>Revisar ERAs</small>
        </div>
      </div>

      {/* Alertas destacadas */}
      {alertas.length > 0 && (
        <div style={{ ...styles.card, marginBottom: 20 }}>
          <h3 style={{ ...styles.cardTitle, color: '#dc2626' }}>
            ⚠️ Alertas del Sistema
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {alertas.slice(0, 5).map((alerta, idx) => (
              <div
                key={idx}
                style={{
                  padding: 8,
                  background: alerta.tipo === 'error' ? '#fee2e2' : '#fef3c7',
                  borderRadius: 6,
                  fontSize: 13,
                }}
              >
                {alerta.mensaje}
              </div>
            ))}
            {alertas.length > 5 && (
              <small style={{ color: '#6b7280' }}>
                Y {alertas.length - 5} más...
              </small>
            )}
          </div>
        </div>
      )}

      {/* Gráficos */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: 20,
          marginBottom: 20,
        }}
      >
        {/* Gráfico de stock por categoría */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>📦 Stock por Categoría</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={stockData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {stockData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de movimientos mensuales */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>🔄 Movimientos Mensuales</h3>
          <div style={{ marginBottom: 8, display: 'flex', gap: 8 }}>
            <button
              onClick={() => setPeriodo('mes')}
              style={{
                padding: '4px 12px',
                background: periodo === 'mes' ? '#2563eb' : '#e5e7eb',
                color: periodo === 'mes' ? 'white' : '#374151',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
              }}
            >
              Meses
            </button>
            <button
              onClick={() => setPeriodo('semana')}
              style={{
                padding: '4px 12px',
                background: periodo === 'semana' ? '#2563eb' : '#e5e7eb',
                color: periodo === 'semana' ? 'white' : '#374151',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
              }}
            >
              Semana
            </button>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart
              data={periodo === 'mes' ? movimientosPorMes() : checklistData}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={periodo === 'mes' ? 'mes' : 'dia'} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="entrada" fill="#10b981" name="➕ Entradas" />
              <Bar dataKey="salida" fill="#ef4444" name="➖ Salidas" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de checklist semanal */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>📋 Checklists (últimos 7 días)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={checklistData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="dia" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="ok" fill="#10b981" name="✅ OK" />
              <Bar dataKey="nok" fill="#ef4444" name="⚠️ Con novedades" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de estado de vehículos */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>🚛 Estado de Móviles</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={vehiculosEstado}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                <Cell fill="#10b981" />
                <Cell fill="#f59e0b" />
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Información adicional */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 20,
        }}
      >
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>🎽 ERAs</h3>
          <p>Total: {eras.length}</p>
          <p>Activas: {eras.filter((e) => e.estado === 'activo').length}</p>
          <p>
            En mantenimiento:{' '}
            {eras.filter((e) => e.estado === 'mantenimiento').length}
          </p>
          <p>
            Próximas a vencer (30 días):{' '}
            {
              eras.filter((e) => {
                if (!e.vencimientoTubo) return false;
                const dias = Math.ceil(
                  (new Date(e.vencimientoTubo) - new Date()) /
                    (1000 * 60 * 60 * 24)
                );
                return dias <= 30 && dias > 0;
              }).length
            }
          </p>
        </div>
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>🧯 Equipos</h3>
          <p>Total: {equipos.length}</p>
          <p>
            Operativos: {equipos.filter((e) => e.estado === 'operativo').length}
          </p>
          <p>
            Próximos a vencer (30 días):{' '}
            {
              equipos.filter((e) => {
                if (!e.vencimiento) return false;
                const dias = Math.ceil(
                  (new Date(e.vencimiento) - new Date()) / (1000 * 60 * 60 * 24)
                );
                return dias <= 30 && dias > 0;
              }).length
            }
          </p>
          <p>Vencidos: {equiposVencidos.length}</p>
        </div>
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>👥 Personal</h3>
          <p>Total: {personal.length}</p>
          <p>Activos: {personal.filter((p) => p.estado === 'activo').length}</p>
          <p>
            Licencias próximas a vencer (60 días):{' '}
            {
              personal.filter((p) => {
                if (!p.licencia?.vencimiento) return false;
                const dias = Math.ceil(
                  (new Date(p.licencia.vencimiento) - new Date()) /
                    (1000 * 60 * 60 * 24)
                );
                return dias <= 60 && dias > 0;
              }).length
            }
          </p>
        </div>
      </div>
    </div>
  );
}

export default DashboardStats;
