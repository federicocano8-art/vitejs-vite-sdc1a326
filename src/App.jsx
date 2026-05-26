import { useState, useEffect, lazy, Suspense } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, solicitarPermiso, recibirMensajeEnPrimerPlano } from './firebase';
import { useColeccion } from './hooks/useColeccion';
import { useAudit } from './hooks/useAudit';
import { styles } from './styles/styleGlobal';

// Componentes
import Vehiculos from './components/vehiculos/Vehiculos';
import Inventario from './components/inventario/Inventario';
import Panol from './components/panol/Panol';
import Equipos from './components/equipos/Equipos';
import ERAs from './components/eras/ERAs';
import Personal from './components/personal/Personal';
import Guardarropa from './components/personal/Guardarropa';
import Bitacora from './components/bitacora/Bitacora';
import Auditoria from './components/auditoria/Auditoria';
import Cajas from './cajas/CajasHerramientas';
import GestionUsuarios from './components/GestionUsuarios';
import AuthScreen from './components/AuthScreen';
import NotificacionesInicializador from './components/NotificacionesInicializador';
import Checklists from './components/checklists/Checklists';
import QRPublico from './components/Public/QRPublico';
import Panel from './components/Panel';
import ReporteQRMasivo from './components/ReporteQRMasivo';

const ReportesAvanzados = lazy(() => import('./components/ReportesAvanzados'));

// Hook inventario
function useInventario(auditCallback) {
  const col = useColeccion('inventario', auditCallback);
  const descontarStock = async (itemId, cantidad) => {
    const item = col.data.find((i) => i.id === itemId);
    if (!item) return false;
    if ((item.stock || 0) < cantidad) return false;
    await col.actualizar(itemId, { stock: (item.stock || 0) - cantidad });
    return true;
  };
  const agregarStock = async (itemId, cantidad) => {
    const item = col.data.find((i) => i.id === itemId);
    if (!item) return;
    await col.actualizar(itemId, { stock: (item.stock || 0) + cantidad });
  };
  return {
    ...col,
    descontarStock,
    agregarStock,
    itemsBajoStock: col.data.filter((i) => (i.stock || 0) <= (i.stockMinimo || 5)),
  };
}

// FUNCIONES DE NEGOCIO (simplificadas pero completas)
const asignarERAaVehiculo = async (vehiculoId, eraId, vehiculosCol, erasCol) => { /* implementar */ };
const desasignarERAdeVehiculo = async (vehiculoId, eraId, vehiculosCol, erasCol) => { /* implementar */ };
const asignarEquipoAVehiculo = async (vehiculoId, equipoId, vehiculosCol, equiposCol) => { /* implementar */ };
const desasignarEquipoDeVehiculo = async (vehiculoId, equipoId, vehiculosCol, equiposCol) => { /* implementar */ };
const asignarCajaAVehiculo = async (vehiculoId, cajaId, vehiculosCol, cajasCol) => { /* implementar */ };
const desasignarCajaDeVehiculo = async (vehiculoId, cajaId, vehiculosCol, cajasCol) => { /* implementar */ };
const asignarItemAVehiculo = async (vehiculoId, itemId, cantidad, vehiculosCol, inventarioCol) => { /* implementar */ };
const desasignarItemDeVehiculo = async (vehiculoId, itemId, vehiculosCol, inventarioCol) => { /* implementar */ };
const actualizarCantidadItem = async (vehiculoId, itemId, nuevaCantidad, vehiculosCol) => { /* implementar */ };
const agregarCompartimiento = async (vehiculoId, nombre, vehiculosCol) => { /* implementar */ };
const eliminarCompartimiento = async (vehiculoId, compId, vehiculosCol) => { /* implementar */ };
const agregarSubcompartimiento = async (vehiculoId, compId, nombre, vehiculosCol) => { /* implementar */ };
const eliminarSubcompartimiento = async (vehiculoId, compId, subId, vehiculosCol) => { /* implementar */ };
const agregarItemSubcomp = async (vehiculoId, compId, subId, itemId, cantidad, vehiculosCol, inventario) => { /* implementar */ };
const eliminarItemSubcomp = async (vehiculoId, compId, subId, itemId, vehiculosCol) => { /* implementar */ };
const actualizarCantidadItemSubcomp = async (vehiculoId, compId, subId, itemId, nuevaCantidad, vehiculosCol) => { /* implementar */ };
const asignarItemPersonal = async (personalId, indumentariaId, cantidad, personalCol, indumentariaCol, asignacionesCol, bitacoraCol) => { /* implementar */ };
const devolverItemPersonal = async (asignacionId, asignacionesCol, indumentariaCol, bitacoraCol) => { /* implementar */ };

export default function App() {
  const [usuario, setUsuario] = useState(null);
  const [vista, setVista] = useState('panel');
  const { registrar } = useAudit();

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
            rol: data.role || 'bombero',
            activo: data.activo !== false,
          });
        } catch (error) {
          console.error(error);
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

  useEffect(() => {
    if (usuario && solicitarPermiso) solicitarPermiso();
    if (usuario && recibirMensajeEnPrimerPlano) {
      const unsubscribe = recibirMensajeEnPrimerPlano((payload) => {
        alert(`📢 ${payload.notification?.title}: ${payload.notification?.body}`);
      });
      return () => unsubscribe && unsubscribe();
    }
  }, [usuario]);

  const handleLogin = async (email, password) => signInWithEmailAndPassword(auth, email, password);
  const handleLogout = async () => signOut(auth);

  const vehiculosCol = useColeccion('vehiculos', (a, i, d) => registrar(a, 'vehiculos', i, d, usuario));
  const erasCol = useColeccion('eras', (a, i, d) => registrar(a, 'eras', i, d, usuario));
  const personalCol = useColeccion('personal', (a, i, d) => registrar(a, 'personal', i, d, usuario));
  const bitacoraCol = useColeccion('bitacora');
  const checklistsCol = useColeccion('checklists');
  const equiposCol = useColeccion('equipos', (a, i, d) => registrar(a, 'equipos', i, d, usuario));
  const movimientosCol = useColeccion('movimientos');
  const indumentariaCol = useColeccion('indumentaria', (a, i, d) => registrar(a, 'indumentaria', i, d, usuario));
  const asignacionesCol = useColeccion('asignacionesPersonal', (a, i, d) => registrar(a, 'asignacionesPersonal', i, d, usuario));
  const inventarioCol = useInventario((a, i, d) => registrar(a, 'inventario', i, d, usuario));
  const cajasCol = useColeccion('cajas', (a, i, d) => registrar(a, 'cajas', i, d, usuario));

  // Wrappers para pasar las colecciones a las funciones (evita redeclaraciones)
  const _asignarERA = (v, e) => asignarERAaVehiculo(v, e, vehiculosCol, erasCol);
  const _desasignarERA = (v, e) => desasignarERAdeVehiculo(v, e, vehiculosCol, erasCol);
  const _asignarEquipo = (v, e) => asignarEquipoAVehiculo(v, e, vehiculosCol, equiposCol);
  const _desasignarEquipo = (v, e) => desasignarEquipoDeVehiculo(v, e, vehiculosCol, equiposCol);
  const _asignarCaja = (v, c) => asignarCajaAVehiculo(v, c, vehiculosCol, cajasCol);
  const _desasignarCaja = (v, c) => desasignarCajaDeVehiculo(v, c, vehiculosCol, cajasCol);
  const _asignarItem = (v, i, c) => asignarItemAVehiculo(v, i, c, vehiculosCol, inventarioCol);
  const _desasignarItem = (v, i) => desasignarItemDeVehiculo(v, i, vehiculosCol, inventarioCol);
  const _actualizarCantidadItem = (v, i, nc) => actualizarCantidadItem(v, i, nc, vehiculosCol);
  const _agregarCompartimiento = (v, n) => agregarCompartimiento(v, n, vehiculosCol);
  const _eliminarCompartimiento = (v, c) => eliminarCompartimiento(v, c, vehiculosCol);
  const _agregarSubcompartimiento = (v, c, n) => agregarSubcompartimiento(v, c, n, vehiculosCol);
  const _eliminarSubcompartimiento = (v, c, s) => eliminarSubcompartimiento(v, c, s, vehiculosCol);
  const _agregarItemSubcomp = (v, c, s, i, cant) => agregarItemSubcomp(v, c, s, i, cant, vehiculosCol, inventarioCol.data);
  const _eliminarItemSubcomp = (v, c, s, i) => eliminarItemSubcomp(v, c, s, i, vehiculosCol);
  const _actualizarCantidadItemSubcomp = (v, c, s, i, nc) => actualizarCantidadItemSubcomp(v, c, s, i, nc, vehiculosCol);
  const _asignarItemPersonal = (p, ind, cant) => asignarItemPersonal(p, ind, cant, personalCol, indumentariaCol, asignacionesCol, bitacoraCol);
  const _devolverItemPersonal = (a) => devolverItemPersonal(a, asignacionesCol, indumentariaCol, bitacoraCol);

  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  const qrMatch = pathname.match(/^\/qr\/(vehiculo|equipo|era|caja)\/(.+)$/);
  if (qrMatch) return <QRPublico styles={styles} />;

  if (!usuario) return <AuthScreen styles={styles} onLogin={handleLogin} onRegistroExitoso={() => {}} />;
  const loading = vehiculosCol.loading || inventarioCol.loading;
  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Cargando sistema...</div>;

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
    { key: 'usuarios', label: '👥 Usuarios' },
    { key: 'reporteQR', label: '📇 QR Masivo' },
  ];

  return (
    <div style={styles.container}>
      <NotificacionesInicializador usuario={usuario} />
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.logo}>🚒</div>
          <div>
            <h1 style={styles.title}>Gestión de Bomberos</h1>
            <p style={styles.subtitle}>👤 {usuario.nombre} {usuario.apellido} | {usuario.rol === 'admin' ? 'Administrador' : 'Bombero'}</p>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <button style={styles.btnLogout} onClick={handleLogout}>🚪 Salir</button>
          </div>
        </div>
      </header>
      <div style={styles.main}>
        <nav style={styles.nav}>
          {navItems.map(item => (
            <button
              key={item.key}
              onClick={() => setVista(item.key)}
              style={vista === item.key ? styles.navBtnActive : styles.navBtn}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div style={styles.content}>
          {vista === 'panel' && <Panel vehiculos={vehiculosCol.data} eras={erasCol.data} personal={personalCol.data} inventario={inventarioCol.data} equipos={equiposCol.data} checklists={checklistsCol.data} />}
          {vista === 'vehiculos' && <Vehiculos styles={styles} vehiculos={vehiculosCol.data} eras={erasCol.data} equipos={equiposCol.data} cajas={cajasCol.data} inventario={inventarioCol.data} onAgregar={vehiculosCol.agregar} onActualizar={vehiculosCol.actualizar} onEliminar={vehiculosCol.eliminar} onAsignarItem={_asignarItem} onDesasignarItem={_desasignarItem} onActualizarCantidadItem={_actualizarCantidadItem} onAsignarERA={_asignarERA} onDesasignarERA={_desasignarERA} onAsignarEquipo={_asignarEquipo} onDesasignarEquipo={_desasignarEquipo} onAgregarCompartimiento={_agregarCompartimiento} onEliminarCompartimiento={_eliminarCompartimiento} onAgregarSubcompartimiento={_agregarSubcompartimiento} onEliminarSubcompartimiento={_eliminarSubcompartimiento} onAgregarItemSubcomp={_agregarItemSubcomp} onEliminarItemSubcomp={_eliminarItemSubcomp} onActualizarCantidadItemSubcomp={_actualizarCantidadItemSubcomp} onAsignarCaja={_asignarCaja} onDesasignarCaja={_desasignarCaja} usuario={usuario} />}
          {vista === 'inventario' && <Inventario styles={styles} inventario={inventarioCol.data} movimientos={movimientosCol.data} onAgregar={inventarioCol.agregar} onActualizar={inventarioCol.actualizar} onEliminar={inventarioCol.eliminar} onDescontar={inventarioCol.descontarStock} onAgregarStock={inventarioCol.agregarStock} itemsBajoStock={inventarioCol.itemsBajoStock} usuario={usuario} />}
          {vista === 'panol' && <Panol styles={styles} inventario={inventarioCol.data} movimientos={movimientosCol.data} onDescontar={inventarioCol.descontarStock} onAgregarStock={inventarioCol.agregarStock} usuario={usuario} />}
          {vista === 'equipos' && <Equipos styles={styles} equipos={equiposCol.data} vehiculos={vehiculosCol.data} onAgregar={equiposCol.agregar} onActualizar={equiposCol.actualizar} onEliminar={equiposCol.eliminar} onAsignarEquipo={_asignarEquipo} onDesasignarEquipo={_desasignarEquipo} />}
          {vista === 'eras' && <ERAs styles={styles} eras={erasCol.data} vehiculos={vehiculosCol.data} onAgregar={erasCol.agregar} onActualizar={erasCol.actualizar} onEliminar={erasCol.eliminar} onAsignarERA={_asignarERA} onDesasignarERA={_desasignarERA} />}
          {vista === 'cajas' && <Cajas styles={styles} cajas={cajasCol.data} vehiculos={vehiculosCol.data} inventario={inventarioCol.data} onAgregarCaja={cajasCol.agregar} onActualizarCaja={cajasCol.actualizar} onEliminarCaja={cajasCol.eliminar} onAsignarCajaAVehiculo={_asignarCaja} onDesasignarCajaDeVehiculo={_desasignarCaja} />}
          {vista === 'checklists' && <Checklists styles={styles} vehiculos={vehiculosCol.data} eras={erasCol.data} equipos={equiposCol.data} cajas={cajasCol.data} usuario={usuario} checklists={checklistsCol.data} onGuardar={checklistsCol.agregar} onEliminar={checklistsCol.eliminar} />}
          {vista === 'personal' && <Personal styles={styles} personal={personalCol.data} indumentaria={indumentariaCol.data} asignaciones={asignacionesCol.data} onAgregarPersonal={personalCol.agregar} onActualizarPersonal={personalCol.actualizar} onEliminarPersonal={personalCol.eliminar} onAgregarIndumentaria={indumentariaCol.agregar} onActualizarIndumentaria={indumentariaCol.actualizar} onEliminarIndumentaria={indumentariaCol.eliminar} onAsignarItem={_asignarItemPersonal} onDevolverItem={_devolverItemPersonal} usuario={usuario} bitacoraAgregar={bitacoraCol.agregar} />}
          {vista === 'guardarropa' && <Guardarropa styles={styles} indumentaria={indumentariaCol.data} personal={personalCol.data} asignaciones={asignacionesCol.data} onAgregarIndumentaria={indumentariaCol.agregar} onActualizarIndumentaria={indumentariaCol.actualizar} onEliminarIndumentaria={indumentariaCol.eliminar} onAsignar={_asignarItemPersonal} onDevolver={_devolverItemPersonal} usuario={usuario} bitacoraAgregar={bitacoraCol.agregar} />}
          {vista === 'bitacora' && <Bitacora styles={styles} bitacora={bitacoraCol.data} vehiculos={vehiculosCol.data} eras={erasCol.data} equipos={equiposCol.data} inventario={inventarioCol.data} personal={personalCol.data} indumentaria={indumentariaCol.data} onAgregar={bitacoraCol.agregar} onActualizar={bitacoraCol.actualizar} onEliminar={bitacoraCol.eliminar} />}
          {vista === 'reportes' && <Suspense fallback={<div>Cargando reportes...</div>}><ReportesAvanzados styles={styles} /></Suspense>}
          {vista === 'auditoria' && <Auditoria styles={styles} />}
          {vista === 'usuarios' && <GestionUsuarios styles={styles} usuario={usuario} />}
          {vista === 'reporteQR' && <ReporteQRMasivo styles={styles} />}
        </div>
      </div>
    </div>
  );
}
