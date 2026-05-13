import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
} from 'firebase/firestore';
import { auth, db, login, cerrarSesion } from './firebase';
import { useColeccion } from './hooks/useColeccion';
import { useAudit } from './hooks/useAudit';
import { styles } from './styles/styleGlobal';

// Componentes de la aplicación
import Vehiculos from './components/vehiculos/Vehiculos';
import Inventario from './components/inventario/Inventario';
import Panol from './components/panol/Panol';
import Equipos from './components/equipos/Equipos';
import ERAs from './components/eras/ERAs';
import Checklists from './components/checklists/Checklists';
import Personal from './components/personal/Personal';
import Guardarropa from './components/personal/Guardarropa';
import Bitacora from './components/bitacora/Bitacora';
import Reportes from './components/reportes/Reportes';
import Auditoria from './components/auditoria/Auditoria';
import Cajas from './components/cajas/CajasHerramientas';
import GestionUsuarios from './components/GestionUsuarios';
import AuthScreen from './components/AuthScreen';

// ============================================================
// HOOK PERSONALIZADO PARA INVENTARIO (con descuento de stock y movimientos)
// ============================================================
function useInventario(auditCallback) {
  const col = useColeccion('inventario', auditCallback);
  const descontarStock = async (itemId, cantidad, responsable, motivo) => {
    const item = col.data.find((i) => i.id === itemId);
    if (!item) {
      alert('Item no encontrado');
      return false;
    }
    if ((item.stock || 0) < cantidad) {
      alert('Stock insuficiente');
      return false;
    }
    await col.actualizar(itemId, { stock: (item.stock || 0) - cantidad });
    await addDoc(collection(db, 'movimientos'), {
      tipo: 'salida',
      itemId,
      itemNombre: item.nombre,
      cantidad,
      responsable,
      motivo,
      creadoEn: serverTimestamp(),
    });
    return true;
  };
  const agregarStock = async (itemId, cantidad, responsable, motivo) => {
    const item = col.data.find((i) => i.id === itemId);
    if (!item) return;
    await col.actualizar(itemId, { stock: (item.stock || 0) + cantidad });
    await addDoc(collection(db, 'movimientos'), {
      tipo: 'entrada',
      itemId,
      itemNombre: item.nombre,
      cantidad,
      responsable,
      motivo,
      creadoEn: serverTimestamp(),
    });
  };
  return {
    ...col,
    descontarStock,
    agregarStock,
    itemsBajoStock: col.data.filter(
      (i) => (i.stock || 0) <= (i.stockMinimo || 5)
    ),
  };
}

// ============================================================
// COMPONENTE PANEL (Dashboard principal)
// ============================================================
function Panel({
  vehiculos,
  eras,
  personal,
  inventario,
  equipos,
  checklists,
  itemsBajoStock,
}) {
  // Función para calcular días hasta vencimiento
  const diasHasta = (fecha) => {
    if (!fecha) return null;
    return Math.ceil((new Date(fecha) - new Date()) / (1000 * 60 * 60 * 24));
  };

  const alertas = [];
  // Recorrer vehículos, ERAs, equipos, personal, etc. para generar alertas
  vehiculos.forEach((v) => {
    const vtv = v.vtv || {};
    if (vtv.vencimiento) {
      const dias = diasHasta(vtv.vencimiento);
      if (dias < 0)
        alertas.push({
          tipo: 'error',
          msg: `🚗 VTV vencida: ${v.nombre} (hace ${-dias} días)`,
        });
      else if (dias <= 30)
        alertas.push({
          tipo: 'warn',
          msg: `🚗 VTV próxima: ${v.nombre} (en ${dias} días)`,
        });
    }
  });
  eras.forEach((era) => {
    if (era.vencimientoTubo) {
      const dias = diasHasta(era.vencimientoTubo);
      if (dias < 0)
        alertas.push({
          tipo: 'error',
          msg: `🎽 Tubo ERA vencido: ${era.marca} ${era.modelo} (${era.serial})`,
        });
      else if (dias <= 30)
        alertas.push({
          tipo: 'warn',
          msg: `🎽 Tubo ERA próximo: ${era.marca} ${era.modelo} (${dias} días)`,
        });
    }
    if (era.pruebaHidraulica) {
      const dias = diasHasta(era.pruebaHidraulica);
      if (dias < 0)
        alertas.push({
          tipo: 'error',
          msg: `🔧 Prueba hidráulica ERA vencida: ${era.marca} ${era.modelo}`,
        });
    }
  });
  equipos.forEach((eq) => {
    if (eq.vencimiento) {
      const dias = diasHasta(eq.vencimiento);
      if (dias < 0)
        alertas.push({
          tipo: 'error',
          msg: `🧯 Equipo vencido: ${eq.nombre} (${eq.codigoInterno || ''})`,
        });
      else if (dias <= 30)
        alertas.push({
          tipo: 'warn',
          msg: `🧯 Equipo próximo: ${eq.nombre} (${dias} días)`,
        });
    }
  });
  personal.forEach((p) => {
    const lic = p.licencia || {};
    if (lic.vencimiento) {
      const dias = diasHasta(lic.vencimiento);
      if (dias < 0)
        alertas.push({
          tipo: 'error',
          msg: `🪪 Licencia vencida: ${p.nombre} ${p.apellido || ''} (Cat. ${
            lic.categoria
          })`,
        });
      else if (dias <= 60)
        alertas.push({
          tipo: 'warn',
          msg: `🪪 Licencia próxima: ${p.nombre} ${
            p.apellido || ''
          } (${dias} días)`,
        });
    }
  });
  itemsBajoStock.forEach((item) => {
    alertas.push({
      tipo: 'warn',
      msg: `📦 Stock bajo: ${item.nombre} (${item.stock} ${
        item.unidad || 'u'
      })`,
    });
  });

  const errores = alertas.filter((a) => a.tipo === 'error');
  const warnings = alertas.filter((a) => a.tipo === 'warn');

  const kpis = [
    {
      label: 'Móviles',
      valor: vehiculos.length,
      icon: '🚛',
      color: 'linear-gradient(135deg, #1e3a5f, #2563eb)',
      sub:
        vehiculos.filter((v) => v.estado === 'operativo').length +
        ' operativos',
    },
    {
      label: 'ERAs',
      valor: eras.length,
      icon: '🎽',
      color: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
      sub: eras.filter((e) => e.estado === 'activo').length + ' activas',
    },
    {
      label: 'Personal',
      valor: personal.length,
      icon: '👥',
      color: 'linear-gradient(135deg, #059669, #047857)',
      sub: personal.filter((p) => p.estado === 'activo').length + ' activos',
    },
    {
      label: 'Inventario',
      valor: inventario.length,
      icon: '📦',
      color: 'linear-gradient(135deg, #d97706, #b45309)',
      sub: itemsBajoStock.length + ' bajo stock',
    },
    {
      label: 'Equipos',
      valor: equipos.length,
      icon: '🧯',
      color: 'linear-gradient(135deg, #dc2626, #b91c1c)',
      sub:
        equipos.filter((e) => e.estado === 'operativo').length + ' operativos',
    },
    {
      label: 'Checklists',
      valor: checklists.length,
      icon: '📋',
      color: 'linear-gradient(135deg, #0891b2, #0e7490)',
      sub: 'controles realizados',
    },
  ];

  return (
    <div>
      <h2
        style={{
          fontSize: '24px',
          fontWeight: 'bold',
          marginBottom: '24px',
          color: '#e2e8f0',
        }}
      >
        🏠 Panel de Control
      </h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        {kpis.map((k) => (
          <div
            key={k.label}
            style={{
              borderRadius: '24px',
              padding: '20px',
              color: 'white',
              textAlign: 'center',
              boxShadow: '0 8px 20px rgba(0,0,0,0.3)',
              background: k.color,
              transition: 'transform 0.2s',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.transform = 'translateY(-5px)')
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.transform = 'translateY(0)')
            }
          >
            <div style={{ fontSize: '36px', marginBottom: '8px' }}>
              {k.icon}
            </div>
            <div
              style={{
                fontSize: '32px',
                fontWeight: 'bold',
                marginBottom: '4px',
              }}
            >
              {k.valor}
            </div>
            <div
              style={{ fontSize: '14px', opacity: 0.9, marginBottom: '4px' }}
            >
              {k.label}
            </div>
            <div style={{ fontSize: '12px', opacity: 0.75 }}>{k.sub}</div>
          </div>
        ))}
      </div>
      {errores.length > 0 && (
        <div
          style={{
            background: 'rgba(254, 226, 226, 0.9)',
            border: '2px solid #ef4444',
            borderRadius: '20px',
            padding: '16px',
            marginBottom: '16px',
            backdropFilter: 'blur(4px)',
          }}
        >
          <h3
            style={{
              fontWeight: 'bold',
              color: '#991b1b',
              marginBottom: '12px',
            }}
          >
            ❌ Alertas Críticas ({errores.length})
          </h3>
          {errores.map((a, idx) => (
            <div
              key={idx}
              style={{
                padding: '8px 12px',
                background: 'white',
                borderRadius: '12px',
                fontSize: '13px',
                fontWeight: '600',
                color: '#991b1b',
              }}
            >
              {a.msg}
            </div>
          ))}
        </div>
      )}
      {warnings.length > 0 && (
        <div
          style={{
            background: 'rgba(254, 243, 199, 0.9)',
            border: '2px solid #f59e0b',
            borderRadius: '20px',
            padding: '16px',
            marginBottom: '24px',
            backdropFilter: 'blur(4px)',
          }}
        >
          <h3
            style={{
              fontWeight: 'bold',
              color: '#92400e',
              marginBottom: '12px',
            }}
          >
            ⚠️ Advertencias ({warnings.length})
          </h3>
          {warnings.map((a, idx) => (
            <div
              key={idx}
              style={{
                padding: '8px 12px',
                background: 'white',
                borderRadius: '12px',
                fontSize: '13px',
                fontWeight: '600',
                color: '#92400e',
              }}
            >
              {a.msg}
            </div>
          ))}
        </div>
      )}
      <div
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}
      >
        <div
          style={{
            ...styles.card,
            borderRadius: '28px',
            background: 'rgba(15,25,45,0.7)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <h3
            style={{
              fontWeight: 'bold',
              marginBottom: '16px',
              color: '#bbd4ff',
            }}
          >
            🚛 Estado de Móviles
          </h3>
          {vehiculos.length === 0 ? (
            <p>No hay móviles</p>
          ) : (
            vehiculos.slice(0, 5).map((v) => (
              <div
                key={v.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 0',
                  borderBottom: '1px solid #2d3a5e',
                }}
              >
                <span style={{ color: '#e2e8f0' }}>
                  <strong>{v.nombre}</strong> - {v.tipo}
                </span>
                <span
                  style={
                    v.estado === 'operativo'
                      ? {
                          background: '#10b981',
                          color: 'white',
                          padding: '2px 12px',
                          borderRadius: '40px',
                          fontSize: '12px',
                        }
                      : {
                          background: '#f59e0b',
                          color: 'white',
                          padding: '2px 12px',
                          borderRadius: '40px',
                          fontSize: '12px',
                        }
                  }
                >
                  {v.estado === 'operativo' ? '✓ OK' : '🔧 MANT.'}
                </span>
              </div>
            ))
          )}
        </div>
        <div
          style={{
            ...styles.card,
            borderRadius: '28px',
            background: 'rgba(15,25,45,0.7)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <h3
            style={{
              fontWeight: 'bold',
              marginBottom: '16px',
              color: '#bbd4ff',
            }}
          >
            📋 Últimos Checklists
          </h3>
          {checklists.length === 0 ? (
            <p>No hay checklists</p>
          ) : (
            checklists.slice(0, 5).map((cl) => (
              <div
                key={cl.id}
                style={{ padding: '8px 0', borderBottom: '1px solid #2d3a5e' }}
              >
                <div style={{ color: '#e2e8f0' }}>
                  <strong>{cl.vehiculoNombre}</strong> - {cl.tipo}
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                  📅 {cl.fecha} - 👤 {cl.usuario} -{' '}
                  {cl.resultado === 'ok' ? '✅ Aprobado' : '⚠️ Con novedades'}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// APP PRINCIPAL
// ============================================================
export default function App() {
  const [usuario, setUsuario] = useState(null);
  const [vista, setVista] = useState('panel');
  const { registrar } = useAudit();

  // Escuchar cambios en autenticación y cargar datos del usuario desde Firestore
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          const data = userDoc.exists() ? userDoc.data() : {};
          setUsuario({
            uid: user.uid,
            email: user.email,
            nombre: data.nombre || user.email.split('@')[0],
            apellido: data.apellido || '',
            rol: data.role || 'bombero', // ← campo "role" (con 'e')
            activo: data.activo !== false,
          });
        } catch (error) {
          console.error('Error al cargar usuario:', error);
          setUsuario({
            uid: user.uid,
            email: user.email,
            nombre: user.email.split('@')[0],
            apellido: '',
            rol: 'bombero',
            activo: true,
          });
        }
      } else {
        setUsuario(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Funciones de inicio/cierre de sesión
  const handleLogin = async (email, password) => {
    await login(email, password);
  };
  const handleLogout = async () => {
    await cerrarSesion();
  };

  // Colecciones (Firestore)
  const vehiculosCol = useColeccion('vehiculos', (accion, id, datos) =>
    registrar(accion, 'vehiculos', id, datos, usuario)
  );
  const erasCol = useColeccion('eras', (accion, id, datos) =>
    registrar(accion, 'eras', id, datos, usuario)
  );
  const personalCol = useColeccion('personal', (accion, id, datos) =>
    registrar(accion, 'personal', id, datos, usuario)
  );
  const bitacoraCol = useColeccion('bitacora');
  const checklistsCol = useColeccion('checklists');
  const equiposCol = useColeccion('equipos', (accion, id, datos) =>
    registrar(accion, 'equipos', id, datos, usuario)
  );
  const movimientosCol = useColeccion('movimientos');
  const indumentariaCol = useColeccion('indumentaria', (accion, id, datos) =>
    registrar(accion, 'indumentaria', id, datos, usuario)
  );
  const asignacionesCol = useColeccion(
    'asignacionesPersonal',
    (accion, id, datos) =>
      registrar(accion, 'asignacionesPersonal', id, datos, usuario)
  );
  const inventarioCol = useInventario((accion, id, datos) =>
    registrar(accion, 'inventario', id, datos, usuario)
  );
  const cajasCol = useColeccion('cajas', (accion, id, datos) =>
    registrar(accion, 'cajas', id, datos, usuario)
  );

  // ==================== FUNCIONES DE NEGOCIO (Asignaciones, etc.) ====================
  // (Se mantienen igual que en la versión original; aquí las definimos completas para evitar errores)
  const asignarERAaVehiculo = async (vehiculoId, eraId) => {
    const vehiculo = vehiculosCol.data.find((v) => v.id === vehiculoId);
    if (!vehiculo) return;
    const erasActuales = vehiculo.erasAsignadas || [];
    if (erasActuales.includes(eraId)) return alert('Esta ERA ya está asignada');
    await vehiculosCol.actualizar(vehiculoId, {
      erasAsignadas: [...erasActuales, eraId],
    });
    await erasCol.actualizar(eraId, { vehiculoAsignado: vehiculoId });
    alert('✅ ERA asignada');
  };
  const desasignarERAdeVehiculo = async (vehiculoId, eraId) => {
    const vehiculo = vehiculosCol.data.find((v) => v.id === vehiculoId);
    if (!vehiculo) return;
    await vehiculosCol.actualizar(vehiculoId, {
      erasAsignadas: (vehiculo.erasAsignadas || []).filter(
        (id) => id !== eraId
      ),
    });
    await erasCol.actualizar(eraId, { vehiculoAsignado: '' });
  };
  const asignarEquipoAVehiculo = async (vehiculoId, equipoId) => {
    const vehiculo = vehiculosCol.data.find((v) => v.id === vehiculoId);
    if (!vehiculo) return;
    const equiposActuales = vehiculo.equiposAsignados || [];
    if (equiposActuales.includes(equipoId))
      return alert('Este equipo ya está asignado');
    await vehiculosCol.actualizar(vehiculoId, {
      equiposAsignados: [...equiposActuales, equipoId],
    });
    await equiposCol.actualizar(equipoId, { vehiculoAsignado: vehiculoId });
    alert('✅ Equipo asignado');
  };
  const desasignarEquipoDeVehiculo = async (vehiculoId, equipoId) => {
    const vehiculo = vehiculosCol.data.find((v) => v.id === vehiculoId);
    if (!vehiculo) return;
    await vehiculosCol.actualizar(vehiculoId, {
      equiposAsignados: (vehiculo.equiposAsignados || []).filter(
        (id) => id !== equipoId
      ),
    });
    await equiposCol.actualizar(equipoId, { vehiculoAsignado: '' });
  };
  const asignarItemAVehiculo = async (vehiculoId, itemId, cantidad) => {
    const vehiculo = vehiculosCol.data.find((v) => v.id === vehiculoId);
    const item = inventarioCol.data.find((i) => i.id === itemId);
    if (!vehiculo || !item) return;
    const ok = await inventarioCol.descontarStock(
      itemId,
      cantidad,
      usuario?.nombre || 'Sistema',
      `Asignado a ${vehiculo.nombre}`
    );
    if (!ok) return;
    const itemsActuales = vehiculo.itemsAsignados || [];
    const existente = itemsActuales.find((x) => x.itemId === itemId);
    const nuevosItems = existente
      ? itemsActuales.map((x) =>
          x.itemId === itemId
            ? { ...x, cantidad: (x.cantidad || 0) + cantidad }
            : x
        )
      : [
          ...itemsActuales,
          {
            itemId,
            cantidad,
            nombre: item.nombre,
            categoria: item.categoria,
            unidad: item.unidad || 'u',
          },
        ];
    await vehiculosCol.actualizar(vehiculoId, { itemsAsignados: nuevosItems });
    alert('✅ Item asignado');
  };
  const desasignarItemDeVehiculo = async (vehiculoId, itemId) => {
    const vehiculo = vehiculosCol.data.find((v) => v.id === vehiculoId);
    if (!vehiculo) return;
    const itemAsignado = (vehiculo.itemsAsignados || []).find(
      (x) => x.itemId === itemId
    );
    if (itemAsignado)
      await inventarioCol.agregarStock(
        itemId,
        itemAsignado.cantidad,
        usuario?.nombre || 'Sistema',
        `Devuelto de ${vehiculo.nombre}`
      );
    await vehiculosCol.actualizar(vehiculoId, {
      itemsAsignados: (vehiculo.itemsAsignados || []).filter(
        (x) => x.itemId !== itemId
      ),
    });
  };
  const actualizarCantidadItem = async (vehiculoId, itemId, nuevaCantidad) => {
    const vehiculo = vehiculosCol.data.find((v) => v.id === vehiculoId);
    if (!vehiculo) return;
    await vehiculosCol.actualizar(vehiculoId, {
      itemsAsignados: (vehiculo.itemsAsignados || []).map((x) =>
        x.itemId === itemId ? { ...x, cantidad: nuevaCantidad } : x
      ),
    });
  };
  const agregarCompartimiento = async (vehiculoId, nombre) => {
    const vehiculo = vehiculosCol.data.find((v) => v.id === vehiculoId);
    if (!vehiculo) return;
    const nuevoComp = {
      id: Date.now().toString(),
      nombre,
      subcompartimientos: [],
    };
    await vehiculosCol.actualizar(vehiculoId, {
      compartimientos: [...(vehiculo.compartimientos || []), nuevoComp],
    });
  };
  const eliminarCompartimiento = async (vehiculoId, compId) => {
    const vehiculo = vehiculosCol.data.find((v) => v.id === vehiculoId);
    if (!vehiculo) return;
    await vehiculosCol.actualizar(vehiculoId, {
      compartimientos: (vehiculo.compartimientos || []).filter(
        (c) => c.id !== compId
      ),
    });
  };
  const agregarSubcompartimiento = async (vehiculoId, compId, nombre) => {
    const vehiculo = vehiculosCol.data.find((v) => v.id === vehiculoId);
    if (!vehiculo) return;
    const comps = (vehiculo.compartimientos || []).map((c) =>
      c.id === compId
        ? {
            ...c,
            subcompartimientos: [
              ...(c.subcompartimientos || []),
              { id: Date.now().toString(), nombre, items: [] },
            ],
          }
        : c
    );
    await vehiculosCol.actualizar(vehiculoId, { compartimientos: comps });
  };
  const eliminarSubcompartimiento = async (vehiculoId, compId, subId) => {
    const vehiculo = vehiculosCol.data.find((v) => v.id === vehiculoId);
    if (!vehiculo) return;
    const comps = (vehiculo.compartimientos || []).map((c) =>
      c.id === compId
        ? {
            ...c,
            subcompartimientos: (c.subcompartimientos || []).filter(
              (s) => s.id !== subId
            ),
          }
        : c
    );
    await vehiculosCol.actualizar(vehiculoId, { compartimientos: comps });
  };
  const agregarItemASubcompartimiento = async (
    vehiculoId,
    compId,
    subId,
    itemInventarioId,
    cantidad
  ) => {
    const vehiculo = vehiculosCol.data.find((v) => v.id === vehiculoId);
    const itemInv = inventarioCol.data.find((i) => i.id === itemInventarioId);
    if (!vehiculo || !itemInv) return;
    const comps = (vehiculo.compartimientos || []).map((c) => {
      if (c.id !== compId) return c;
      const subs = (c.subcompartimientos || []).map((s) => {
        if (s.id !== subId) return s;
        const itemsActuales = s.items || [];
        const existente = itemsActuales.find(
          (x) => x.itemId === itemInventarioId
        );
        const nuevosItems = existente
          ? itemsActuales.map((x) =>
              x.itemId === itemInventarioId
                ? {
                    ...x,
                    cantidadEsperada: (x.cantidadEsperada || 0) + cantidad,
                  }
                : x
            )
          : [
              ...itemsActuales,
              {
                itemId: itemInventarioId,
                nombre: itemInv.nombre,
                categoria: itemInv.categoria,
                unidad: itemInv.unidad || 'u',
                cantidadEsperada: cantidad,
              },
            ];
        return { ...s, items: nuevosItems };
      });
      return { ...c, subcompartimientos: subs };
    });
    await vehiculosCol.actualizar(vehiculoId, { compartimientos: comps });
  };
  const eliminarItemDeSubcompartimiento = async (
    vehiculoId,
    compId,
    subId,
    itemId
  ) => {
    const vehiculo = vehiculosCol.data.find((v) => v.id === vehiculoId);
    if (!vehiculo) return;
    const comps = (vehiculo.compartimientos || []).map((c) => {
      if (c.id !== compId) return c;
      const subs = (c.subcompartimientos || []).map((s) => {
        if (s.id !== subId) return s;
        return {
          ...s,
          items: (s.items || []).filter((x) => x.itemId !== itemId),
        };
      });
      return { ...c, subcompartimientos: subs };
    });
    await vehiculosCol.actualizar(vehiculoId, { compartimientos: comps });
  };
  const actualizarCantidadItemSubcomp = async (
    vehiculoId,
    compId,
    subId,
    itemId,
    nuevaCantidad
  ) => {
    const vehiculo = vehiculosCol.data.find((v) => v.id === vehiculoId);
    if (!vehiculo) return;
    const comps = (vehiculo.compartimientos || []).map((c) => {
      if (c.id !== compId) return c;
      const subs = (c.subcompartimientos || []).map((s) => {
        if (s.id !== subId) return s;
        return {
          ...s,
          items: (s.items || []).map((x) =>
            x.itemId === itemId ? { ...x, cantidadEsperada: nuevaCantidad } : x
          ),
        };
      });
      return { ...c, subcompartimientos: subs };
    });
    await vehiculosCol.actualizar(vehiculoId, { compartimientos: comps });
  };
  const asignarItemPersonal = async (personalId, indumentariaId, cantidad) => {
    const persona = personalCol.data.find((p) => p.id === personalId);
    const prenda = indumentariaCol.data.find((i) => i.id === indumentariaId);
    if (!persona || !prenda) return alert('Datos inválidos');
    if ((prenda.stock || 0) < cantidad) return alert('Stock insuficiente');
    await indumentariaCol.actualizar(indumentariaId, {
      stock: (prenda.stock || 0) - cantidad,
    });
    await asignacionesCol.agregar({
      personalId,
      personalNombre: `${persona.nombre} ${persona.apellido || ''}`,
      indumentariaId,
      indumentariaNombre: prenda.nombre,
      talla: prenda.talla,
      cantidad,
      fechaAsignacion: new Date().toISOString().split('T')[0],
      devuelto: false,
    });
    await bitacoraCol.agregar({
      titulo: `Asignación de ${prenda.nombre}`,
      descripcion: `Se asignó ${cantidad} unidad(es) de ${prenda.nombre} a ${
        persona.nombre
      } ${persona.apellido || ''}`,
      tipo: 'asignacion',
      entidadTipo: 'personal',
      entidadId: personalId,
      fecha: new Date().toISOString().split('T')[0],
    });
    alert('✅ Prenda asignada');
  };
  const devolverItemPersonal = async (asignacionId) => {
    const asignacion = asignacionesCol.data.find((a) => a.id === asignacionId);
    if (!asignacion) return;
    const prenda = indumentariaCol.data.find(
      (i) => i.id === asignacion.indumentariaId
    );
    if (prenda)
      await indumentariaCol.actualizar(asignacion.indumentariaId, {
        stock: (prenda.stock || 0) + asignacion.cantidad,
      });
    await asignacionesCol.actualizar(asignacionId, {
      devuelto: true,
      fechaDevolucion: new Date().toISOString().split('T')[0],
    });
    await bitacoraCol.agregar({
      titulo: `Devolución de ${asignacion.indumentariaNombre}`,
      descripcion: `Se devolvió ${asignacion.cantidad} unidad(es) de ${asignacion.indumentariaNombre}`,
      tipo: 'devolucion',
      entidadTipo: 'personal',
      entidadId: asignacion.personalId,
    });
    alert('✅ Devolución registrada');
  };

  // Si no hay usuario autenticado, mostrar pantalla de login/registro
  if (!usuario) {
    return (
      <AuthScreen
        styles={styles}
        onLogin={handleLogin}
        onRegistroExitoso={() => {}}
      />
    );
  }

  // Mientras se cargan datos principales
  const loading = vehiculosCol.loading || inventarioCol.loading;
  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          color: 'white',
        }}
      >
        Cargando...
      </div>
    );
  }

  // Definición de pestañas de navegación (solo muestra "Usuarios" si el rol es admin)
  const navItems = [
    { key: 'panel', label: '🏠 Panel' },
    { key: 'vehiculos', label: '🚛 Móviles' },
    { key: 'inventario', label: '📦 Inventario' },
    { key: 'panol', label: '🧰 Pañol' },
    { key: 'equipos', label: '🧯 Equipos' },
    { key: 'eras', label: '🎽 ERAs' },
    { key: 'cajas', label: '📦 Cajas' },
    { key: 'checklists', label: '📋 Checklists' },
    { key: 'personal', label: '👥 Personal' },
    { key: 'guardarropa', label: '👕 Guardarropa' },
    { key: 'bitacora', label: '📝 Bitácora' },
    { key: 'reportes', label: '📊 Reportes' },
    { key: 'auditoria', label: '📜 Auditoría' },
    { key: 'usuarios', label: '👥 Usuarios' },   // ← siempre visible
  ];

  return (
    <div style={styles.container}>
      <style>{`
        * { transition: all 0.2s ease; }
        button { transition: transform 0.2s, box-shadow 0.2s; }
        button:hover { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,160,255,0.3); }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: #0f172a; border-radius: 10px; }
        ::-webkit-scrollbar-thumb { background: #3b82f6; border-radius: 10px; }
      `}</style>
      <header
        style={{
          ...styles.header,
          borderRadius: '0 0 32px 32px',
          background: 'rgba(10,20,40,0.8)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(0,255,255,0.3)',
          marginBottom: 0,
          padding: '12px 24px',
        }}
      >
        <div style={styles.headerContent}>
          <div
            style={{
              ...styles.logo,
              fontSize: '48px',
              filter: 'drop-shadow(0 0 6px cyan)',
            }}
          >
            🚒
          </div>
          <div>
            <h1
              style={{
                ...styles.title,
                color: '#aaffff',
                textShadow: '0 0 5px #00aaff',
              }}
            >
              Gestión de Bomberos
            </h1>
            <p style={{ ...styles.subtitle, color: '#8eacc5' }}>
              👤 {usuario.nombre} {usuario.apellido} |{' '}
              {usuario.rol === 'admin'
                ? '👑 Administrador'
                : usuario.rol === 'supervisor'
                ? '📋 Supervisor'
                : '🚒 Bombero'}
            </p>
          </div>
          {inventarioCol.itemsBajoStock.length > 0 && (
            <div
              style={{
                marginLeft: '16px',
                background: 'rgba(254,243,199,0.9)',
                border: '1px solid #f59e0b',
                padding: '8px 14px',
                borderRadius: '60px',
                cursor: 'pointer',
                backdropFilter: 'blur(4px)',
              }}
              onClick={() => setVista('inventario')}
            >
              <span
                style={{
                  color: '#92400e',
                  fontWeight: '600',
                  fontSize: '13px',
                }}
              >
                ⚠️ {inventarioCol.itemsBajoStock.length} items bajo stock
              </span>
            </div>
          )}
          <div style={{ marginLeft: 'auto' }}>
            <button
              style={{
                ...styles.btnLogout,
                borderRadius: '60px',
                background: 'linear-gradient(95deg, #dc2626, #b91c1c)',
                padding: '8px 20px',
                fontWeight: 'bold',
                border: 'none',
                cursor: 'pointer',
                color: 'white',
              }}
              onClick={handleLogout}
            >
              🚪 Salir
            </button>
          </div>
        </div>
      </header>
      <div style={{ ...styles.main, marginTop: '8px' }}>
        <nav
          style={{
            ...styles.nav,
            gap: '12px',
            flexWrap: 'wrap',
            justifyContent: 'center',
            marginBottom: '20px',
          }}
        >
          {navItems.map((item) => (
            <button
              key={item.key}
              style={{
                ...(vista === item.key ? styles.navBtnActive : styles.navBtn),
                borderRadius: '60px',
                padding: '10px 24px',
                fontWeight: '600',
                background:
                  vista === item.key
                    ? 'linear-gradient(105deg, #0f2b5e, #1a4c9e)'
                    : 'rgba(20,30,55,0.8)',
                border:
                  vista === item.key
                    ? '1px solid rgba(0,255,255,0.6)'
                    : '1px solid rgba(255,255,255,0.1)',
                boxShadow: vista === item.key ? '0 0 12px #3a86ff' : 'none',
                color: vista === item.key ? 'white' : '#bbd4ff',
              }}
              onClick={() => setVista(item.key)}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div
          style={{
            ...styles.content,
            background: 'rgba(8,14,26,0.6)',
            borderRadius: '32px',
            padding: '24px',
            backdropFilter: 'blur(4px)',
          }}
        >
          {vista === 'panel' && (
            <Panel
              vehiculos={vehiculosCol.data}
              eras={erasCol.data}
              personal={personalCol.data}
              inventario={inventarioCol.data}
              equipos={equiposCol.data}
              checklists={checklistsCol.data}
              itemsBajoStock={inventarioCol.itemsBajoStock}
            />
          )}
          {vista === 'vehiculos' && (
            <Vehiculos
              styles={styles}
              vehiculos={vehiculosCol.data}
              eras={erasCol.data}
              inventario={inventarioCol.data}
              equipos={equiposCol.data}
              onAgregar={vehiculosCol.agregar}
              onActualizar={vehiculosCol.actualizar}
              onEliminar={vehiculosCol.eliminar}
              onAsignarItem={asignarItemAVehiculo}
              onDesasignarItem={desasignarItemDeVehiculo}
              onActualizarCantidadItem={actualizarCantidadItem}
              onAsignarERA={asignarERAaVehiculo}
              onDesasignarERA={desasignarERAdeVehiculo}
              onAsignarEquipo={asignarEquipoAVehiculo}
              onDesasignarEquipo={desasignarEquipoDeVehiculo}
              onAgregarCompartimiento={agregarCompartimiento}
              onEliminarCompartimiento={eliminarCompartimiento}
              onAgregarSubcompartimiento={agregarSubcompartimiento}
              onEliminarSubcompartimiento={eliminarSubcompartimiento}
              onAgregarItemSubcomp={agregarItemASubcompartimiento}
              onEliminarItemSubcomp={eliminarItemDeSubcompartimiento}
              onActualizarCantidadItemSubcomp={actualizarCantidadItemSubcomp}
              usuario={usuario}
            />
          )}
          {vista === 'inventario' && (
            <Inventario
              styles={styles}
              inventario={inventarioCol.data}
              movimientos={movimientosCol.data}
              onAgregar={inventarioCol.agregar}
              onActualizar={inventarioCol.actualizar}
              onEliminar={inventarioCol.eliminar}
              onDescontar={inventarioCol.descontarStock}
              onAgregarStock={inventarioCol.agregarStock}
              itemsBajoStock={inventarioCol.itemsBajoStock}
              usuario={usuario}
            />
          )}
          {vista === 'panol' && (
            <Panol
              styles={styles}
              inventario={inventarioCol.data}
              movimientos={movimientosCol.data}
              onDescontar={inventarioCol.descontarStock}
              onAgregarStock={inventarioCol.agregarStock}
              usuario={usuario}
            />
          )}
          {vista === 'equipos' && (
            <Equipos
              styles={styles}
              equipos={equiposCol.data}
              vehiculos={vehiculosCol.data}
              personal={personalCol.data}
              inventario={inventarioCol.data}
              onAgregar={equiposCol.agregar}
              onActualizar={equiposCol.actualizar}
              onEliminar={equiposCol.eliminar}
              onAsignarEquipo={asignarEquipoAVehiculo}
              onDesasignarEquipo={desasignarEquipoDeVehiculo}
              usuario={usuario}
              bitacoraAgregar={bitacoraCol.agregar}
            />
          )}
          {vista === 'eras' && (
            <ERAs
              styles={styles}
              eras={erasCol.data}
              vehiculos={vehiculosCol.data}
              personal={personalCol.data}
              onAgregar={erasCol.agregar}
              onActualizar={erasCol.actualizar}
              onEliminar={erasCol.eliminar}
              onAsignarERA={asignarERAaVehiculo}
              onDesasignarERA={desasignarERAdeVehiculo}
              usuario={usuario}
              bitacoraAgregar={bitacoraCol.agregar}
            />
          )}
          {vista === 'cajas' && (
            <Cajas
              styles={styles}
              cajas={cajasCol.data}
              onAgregarCaja={cajasCol.agregar}
              onEliminarCaja={cajasCol.eliminar}
            />
          )}
          {vista === 'checklists' && (
            <Checklists
              styles={styles}
              vehiculos={vehiculosCol.data}
              eras={erasCol.data}
              equipos={equiposCol.data}
              cajas={cajasCol.data}
              usuario={usuario}
              checklists={checklistsCol.data}
              onGuardar={checklistsCol.agregar}
              onEliminar={checklistsCol.eliminar}
            />
          )}
          {vista === 'personal' && (
            <Personal
              styles={styles}
              personal={personalCol.data}
              indumentaria={indumentariaCol.data}
              asignaciones={asignacionesCol.data}
              onAgregarPersonal={personalCol.agregar}
              onActualizarPersonal={personalCol.actualizar}
              onEliminarPersonal={personalCol.eliminar}
              onAgregarIndumentaria={indumentariaCol.agregar}
              onActualizarIndumentaria={indumentariaCol.actualizar}
              onEliminarIndumentaria={indumentariaCol.eliminar}
              onAsignarItem={asignarItemPersonal}
              onDevolverItem={devolverItemPersonal}
              usuario={usuario}
              bitacoraAgregar={bitacoraCol.agregar}
            />
          )}
          {vista === 'guardarropa' && (
            <Guardarropa
              styles={styles}
              indumentaria={indumentariaCol.data}
              personal={personalCol.data}
              asignaciones={asignacionesCol.data}
              onAgregarIndumentaria={indumentariaCol.agregar}
              onActualizarIndumentaria={indumentariaCol.actualizar}
              onEliminarIndumentaria={indumentariaCol.eliminar}
              onAsignar={asignarItemPersonal}
              onDevolver={devolverItemPersonal}
              usuario={usuario}
              bitacoraAgregar={bitacoraCol.agregar}
            />
          )}
          {vista === 'bitacora' && (
            <Bitacora
              styles={styles}
              bitacora={bitacoraCol.data}
              vehiculos={vehiculosCol.data}
              eras={erasCol.data}
              equipos={equiposCol.data}
              inventario={inventarioCol.data}
              personal={personalCol.data}
              indumentaria={indumentariaCol.data}
              onAgregar={bitacoraCol.agregar}
              onActualizar={bitacoraCol.actualizar}
              onEliminar={bitacoraCol.eliminar}
            />
          )}
          {vista === 'reportes' && (
            <Reportes
              styles={styles}
              inventario={inventarioCol.data}
              equipos={equiposCol.data}
              eras={erasCol.data}
              personal={personalCol.data}
              vehiculos={vehiculosCol.data}
              asignaciones={asignacionesCol.data}
            />
          )}
          {vista === 'auditoria' && <Auditoria styles={styles} />}
          {vista === 'usuarios' && (
            <GestionUsuarios styles={styles} usuario={usuario} />
          )}
        </div>
      </div>
    </div>
  );
}
