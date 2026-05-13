/* eslint-disable no-unused-vars */
import { useState, useEffect, useMemo } from 'react';
import { styles } from '../styles/globalStyles';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
} from 'recharts';

export default function DashboardGlobal({
  vehiculos,
  eras,
  personal,
  inventario,
  equipos,
  checklists,
  movimientos,
  bitacora,
  asignaciones,
  indumentaria,
}) {
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');

  // Estadísticas generales
  const estadisticas = useMemo(() => {
    // KPIs principales
    const totalVehiculos = vehiculos.length;
    const vehiculosOperativos = vehiculos.filter(
      (v) => v.estado === 'operativo'
    ).length;
    const totalERAs = eras.length;
    const erasActivas = eras.filter((e) => e.estado === 'activo').length;
    const totalPersonal = personal.length;
    const personalActivo = personal.filter((p) => p.estado === 'activo').length;
    const totalInventario = inventario.length;
    const stockTotal = inventario.reduce((sum, i) => sum + (i.stock || 0), 0);
    const itemsBajoStock = inventario.filter(
      (i) => (i.stock || 0) <= (i.stockMinimo || 5)
    ).length;
    const totalEquipos = equipos.length;
    const equiposOperativos = equipos.filter(
      (e) => e.estado === 'operativo'
    ).length;
    const totalChecklists = checklists.length;
    const checklistsAprobados = checklists.filter(
      (c) => c.resultado === 'ok'
    ).length;
    const totalMovimientos = movimientos.length;
    const totalBitacora = bitacora.length;
    const asignacionesVigentes = asignaciones.filter((a) => !a.devuelto).length;
    const totalPrendas = indumentaria.length;

    // Datos para gráfico de stock por categoría
    const stockPorCategoria = {};
    inventario.forEach((i) => {
      stockPorCategoria[i.categoria] =
        (stockPorCategoria[i.categoria] || 0) + (i.stock || 0);
    });
    const stockCategoriaData = Object.entries(stockPorCategoria).map(
      ([name, value]) => ({ name, value })
    );

    // Datos para gráfico de estado de vehículos
    const estadoVehiculos = [
      { name: 'Operativo', value: vehiculosOperativos, color: '#10b981' },
      {
        name: 'Mantenimiento',
        value: vehiculos.filter((v) => v.estado === 'mantenimiento').length,
        color: '#f59e0b',
      },
      {
        name: 'Inactivo',
        value: vehiculos.filter((v) => v.estado === 'inactivo').length,
        color: '#ef4444',
      },
    ];

    // Datos para gráfico de personal por rol
    const personalPorRol = {};
    personal.forEach((p) => {
      personalPorRol[p.rol] = (personalPorRol[p.rol] || 0) + 1;
    });
    const personalRolData = Object.entries(personalPorRol)
      .slice(0, 6)
      .map(([name, value]) => ({ name, value }));

    // Datos para gráfico de checklists por mes (últimos 6 meses)
    const checklistsPorMes = {};
    const meses = [
      'Ene',
      'Feb',
      'Mar',
      'Abr',
      'May',
      'Jun',
      'Jul',
      'Ago',
      'Sep',
      'Oct',
      'Nov',
      'Dic',
    ];
    checklists.forEach((c) => {
      if (c.fecha) {
        const mes = meses[new Date(c.fecha).getMonth()];
        checklistsPorMes[mes] = (checklistsPorMes[mes] || 0) + 1;
      }
    });
    const checklistsMensualData = meses
      .slice(0, 6)
      .map((m) => ({ name: m, checklists: checklistsPorMes[m] || 0 }));

    // Datos para gráfico de movimientos por tipo
    const movimientosPorTipo = [
      {
        name: 'Entradas',
        value: movimientos.filter((m) => m.tipo === 'entrada').length,
        color: '#10b981',
      },
      {
        name: 'Salidas',
        value: movimientos.filter((m) => m.tipo === 'salida').length,
        color: '#f59e0b',
      },
    ];

    // Datos para gráfico de tendencia de inventario
    const tendenciaInventario = {};
    movimientos.forEach((m) => {
      if (m.creadoEn?.toDate) {
        const fecha = m.creadoEn.toDate().toLocaleDateString();
        if (m.tipo === 'entrada') {
          tendenciaInventario[fecha] =
            (tendenciaInventario[fecha] || 0) + (m.cantidad || 0);
        } else {
          tendenciaInventario[fecha] =
            (tendenciaInventario[fecha] || 0) - (m.cantidad || 0);
        }
      }
    });
    const tendenciaData = Object.entries(tendenciaInventario)
      .slice(-10)
      .map(([fecha, neto]) => ({ fecha, neto }));

    // Alertas críticas
    const alertas = [];

    // Stock crítico
    inventario.forEach((i) => {
      if ((i.stock || 0) === 0) {
        alertas.push({
          tipo: 'error',
          mensaje: `📦 ${i.nombre} sin stock`,
          modulo: 'inventario',
        });
      } else if ((i.stock || 0) <= (i.stockMinimo || 5)) {
        alertas.push({
          tipo: 'warning',
          mensaje: `⚠️ ${i.nombre} con stock bajo (${i.stock} ${
            i.unidad || 'u'
          })`,
          modulo: 'inventario',
        });
      }
    });

    // VTV vencida
    vehiculos.forEach((v) => {
      if (v.vtv?.vencimiento) {
        const dias = Math.ceil(
          (new Date(v.vtv.vencimiento) - new Date()) / (1000 * 60 * 60 * 24)
        );
        if (dias < 0) {
          alertas.push({
            tipo: 'error',
            mensaje: `🚛 VTV vencida: ${v.nombre}`,
            modulo: 'vehiculos',
          });
        } else if (dias <= 30) {
          alertas.push({
            tipo: 'warning',
            mensaje: `🚛 VTV próxima: ${v.nombre} (${dias} días)`,
            modulo: 'vehiculos',
          });
        }
      }
    });

    // Licencias vencidas
    personal.forEach((p) => {
      const lic = p.licencia || {};
      if (lic.vencimiento) {
        const dias = Math.ceil(
          (new Date(lic.vencimiento) - new Date()) / (1000 * 60 * 60 * 24)
        );
        if (dias < 0) {
          alertas.push({
            tipo: 'error',
            mensaje: `🪪 Licencia vencida: ${p.nombre} ${p.apellido || ''}`,
            modulo: 'personal',
          });
        } else if (dias <= 60) {
          alertas.push({
            tipo: 'warning',
            mensaje: `🪪 Licencia próxima: ${p.nombre} ${
              p.apellido || ''
            } (${dias} días)`,
            modulo: 'personal',
          });
        }
      }
    });

    // ERAs con presión baja
    eras.forEach((e) => {
      if ((e.presion || 0) < 250 && e.estado === 'activo') {
        alertas.push({
          tipo: 'warning',
          mensaje: `🎽 Presión baja en ERA ${e.serial}: ${e.presion} bar`,
          modulo: 'eras',
        });
      }
    });

    return {
      kpis: {
        vehiculos: { total: totalVehiculos, operativos: vehiculosOperativos },
        eras: { total: totalERAs, activas: erasActivas },
        personal: { total: totalPersonal, activo: personalActivo },
        inventario: {
          total: totalInventario,
          stockTotal,
          bajoStock: itemsBajoStock,
        },
        equipos: { total: totalEquipos, operativos: equiposOperativos },
        checklists: {
          total: totalChecklists,
          aprobados: checklistsAprobados,
          tasa: totalChecklists
            ? Math.round((checklistsAprobados / totalChecklists) * 100)
            : 0,
        },
        movimientos: { total: totalMovimientos },
        bitacora: { total: totalBitacora },
        guardarropa: { asignacionesVigentes, totalPrendas },
      },
      graficos: {
        stockCategoriaData,
        estadoVehiculos,
        personalRolData,
        checklistsMensualData,
        movimientosPorTipo,
        tendenciaData,
      },
      alertas: alertas.slice(0, 15),
    };
  }, [
    vehiculos,
    eras,
    personal,
    inventario,
    equipos,
    checklists,
    movimientos,
    bitacora,
    asignaciones,
    indumentaria,
  ]);

  const COLORS = [
    '#10b981',
    '#f59e0b',
    '#ef4444',
    '#3b82f6',
    '#8b5cf6',
    '#ec489a',
  ];

  return (
    <div>
      <h2 style={{ ...styles.pageTitle, marginBottom: '24px' }}>
        🏠 Panel de Control Principal
      </h2>

      {/* Alertas críticas */}
      {estadisticas.alertas.length > 0 && (
        <div
          style={{
            ...styles.card,
            marginBottom: '24px',
            background: '#fef2f2',
            border: '2px solid #fecaca',
          }}
        >
          <h3
            style={{
              fontWeight: 'bold',
              color: '#991b1b',
              marginBottom: '12px',
            }}
          >
            ⚠️ Alertas Críticas ({estadisticas.alertas.length})
          </h3>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              maxHeight: '200px',
              overflowY: 'auto',
            }}
          >
            {estadisticas.alertas.map((alerta, idx) => (
              <div
                key={idx}
                style={{
                  padding: '8px 12px',
                  background: alerta.tipo === 'error' ? '#fee2e2' : '#fef3c7',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: '500',
                }}
              >
                {alerta.mensaje}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPIs principales */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div
          style={{
            ...styles.kpi,
            background: 'linear-gradient(135deg, #1e3a5f, #2563eb)',
          }}
        >
          <div style={{ fontSize: '32px' }}>🚛</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
            {estadisticas.kpis.vehiculos.total}
          </div>
          <div style={{ fontSize: '12px' }}>
            Móviles ({estadisticas.kpis.vehiculos.operativos} operativos)
          </div>
        </div>
        <div
          style={{
            ...styles.kpi,
            background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
          }}
        >
          <div style={{ fontSize: '32px' }}>🎽</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
            {estadisticas.kpis.eras.total}
          </div>
          <div style={{ fontSize: '12px' }}>
            ERAs ({estadisticas.kpis.eras.activas} activas)
          </div>
        </div>
        <div
          style={{
            ...styles.kpi,
            background: 'linear-gradient(135deg, #059669, #047857)',
          }}
        >
          <div style={{ fontSize: '32px' }}>👥</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
            {estadisticas.kpis.personal.total}
          </div>
          <div style={{ fontSize: '12px' }}>
            Personal ({estadisticas.kpis.personal.activo} activos)
          </div>
        </div>
        <div
          style={{
            ...styles.kpi,
            background: 'linear-gradient(135deg, #d97706, #b45309)',
          }}
        >
          <div style={{ fontSize: '32px' }}>📦</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
            {estadisticas.kpis.inventario.total}
          </div>
          <div style={{ fontSize: '12px' }}>
            Items ({estadisticas.kpis.inventario.bajoStock} bajo stock)
          </div>
        </div>
        <div
          style={{
            ...styles.kpi,
            background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
          }}
        >
          <div style={{ fontSize: '32px' }}>🧯</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
            {estadisticas.kpis.equipos.total}
          </div>
          <div style={{ fontSize: '12px' }}>
            Equipos ({estadisticas.kpis.equipos.operativos} operativos)
          </div>
        </div>
        <div
          style={{
            ...styles.kpi,
            background: 'linear-gradient(135deg, #0891b2, #0e7490)',
          }}
        >
          <div style={{ fontSize: '32px' }}>📋</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
            {estadisticas.kpis.checklists.tasa}%
          </div>
          <div style={{ fontSize: '12px' }}>Tasa de aprobación</div>
        </div>
      </div>

      {/* Gráficos */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '20px',
          marginBottom: '24px',
        }}
      >
        {/* Stock por categoría */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>📊 Stock por Categoría</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={estadisticas.graficos.stockCategoriaData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {estadisticas.graficos.stockCategoriaData.map(
                  (entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  )
                )}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Estado de vehículos */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>🚛 Estado de Móviles</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={estadisticas.graficos.estadoVehiculos}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {estadisticas.graficos.estadoVehiculos.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color || COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Personal por rol */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>👥 Personal por Rol</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={estadisticas.graficos.personalRolData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Checklists mensuales */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>📋 Checklists por Mes</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={estadisticas.graficos.checklistsMensualData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="checklists"
                stroke="#10b981"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Movimientos por tipo */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>🔄 Movimientos de Inventario</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={estadisticas.graficos.movimientosPorTipo}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {estadisticas.graficos.movimientosPorTipo.map(
                  (entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color || COLORS[index % COLORS.length]}
                    />
                  )
                )}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Tendencia de inventario */}
        <div style={styles.card}>
          <h3 style={styles.cardTitle}>📈 Tendencia de Movimientos</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={estadisticas.graficos.tendenciaData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="fecha" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="neto"
                stroke="#f59e0b"
                fill="#fef3c7"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Resumen adicional */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
        }}
      >
        <div style={{ ...styles.card, textAlign: 'center' }}>
          <div style={{ fontSize: '28px' }}>📝</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
            {estadisticas.kpis.bitacora.total}
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>
            Registros en bitácora
          </div>
        </div>
        <div style={{ ...styles.card, textAlign: 'center' }}>
          <div style={{ fontSize: '28px' }}>🔄</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
            {estadisticas.kpis.movimientos.total}
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>
            Movimientos totales
          </div>
        </div>
        <div style={{ ...styles.card, textAlign: 'center' }}>
          <div style={{ fontSize: '28px' }}>👕</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
            {estadisticas.kpis.guardarropa.asignacionesVigentes}
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>
            Asignaciones vigentes
          </div>
        </div>
        <div style={{ ...styles.card, textAlign: 'center' }}>
          <div style={{ fontSize: '28px' }}>✅</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
            {estadisticas.kpis.checklists.aprobados}
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280' }}>
            Checklists aprobados
          </div>
        </div>
      </div>
    </div>
  );
}
