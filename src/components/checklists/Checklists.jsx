import { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function Checklists({
  styles,
  vehiculos,
  eras = [],
  equipos = [],
  cajas = [],
  usuario,
  checklists,
  onGuardar,
  onEliminar,
}) {
  const [vista, setVista] = useState('lista');
  const [vehiculoSel, setVehiculoSel] = useState(null);
  const [tipo, setTipo] = useState('completo');
  const [obs, setObs] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [estadoFluidos, setEstadoFluidos] = useState({});
  const [estadoLuces, setEstadoLuces] = useState({});
  const [estadoItems, setEstadoItems] = useState({});
  const [estadoERAs, setEstadoERAs] = useState({});
  const [estadoEquipos, setEstadoEquipos] = useState({});
  const [estadoCajas, setEstadoCajas] = useState({});
  const [checklistDetalle, setChecklistDetalle] = useState(null);

  const fluidosConfig = [
    { key: 'aceite', label: '🛢️ Aceite de Motor' },
    { key: 'refrigerante', label: '🌡️ Refrigerante' },
    { key: 'combustible', label: '⛽ Combustible' },
    { key: 'liquidoFrenos', label: '🔴 Líquido de Frenos' },
    { key: 'aguaLimpia', label: '💧 Agua Limpiaparabrisas' },
  ];

  const lucesConfig = [
    { key: 'luzDelantera', label: '💡 Luces Delanteras' },
    { key: 'luzTrasera', label: '🔴 Luces Traseras' },
    { key: 'luzEmergencia', label: '🚨 Luces de Emergencia' },
    { key: 'sirena', label: '📢 Sirena' },
    { key: 'bocina', label: '📯 Bocina' },
    { key: 'balizas', label: '⚠️ Balizas' },
    { key: 'luzInterior', label: '💡 Luz Interior' },
    { key: 'luzRetroceso', label: '🔦 Luz de Retroceso' },
  ];

  const modosDisponibles = [
    { id: 'completo', label: '🔧 COMPLETO', icono: '📋', color: 'linear-gradient(135deg, #0f2b5e, #1a4c9e)' },
    { id: 'fluidosLuces', label: '💧💡 FLUIDOS + LUCES', icono: '🔆', color: 'linear-gradient(135deg, #065f46, #b45309)' },
    { id: 'herramientasErasCajasEquipos', label: '🔧🎽📦🧯 HERRAM. + ERAs + CAJAS + EQUIPOS', icono: '⚙️', color: 'linear-gradient(135deg, #1e3a8a, #6b21a5)' },
    { id: 'fluidos', label: '💧 FLUIDOS', icono: '🛢️', color: 'linear-gradient(135deg, #065f46, #047857)' },
    { id: 'luces', label: '💡 LUCES', icono: '🔆', color: 'linear-gradient(135deg, #b45309, #d97706)' },
    { id: 'herramientas', label: '🔧 HERRAMIENTAS', icono: '🛠️', color: 'linear-gradient(135deg, #1e3a8a, #2563eb)' },
    { id: 'eras', label: '🎽 ERAs + MÁSCARA', icono: '🎭', color: 'linear-gradient(135deg, #6b21a5, #9333ea)' },
    { id: 'equipos', label: '🧯 EQUIPOS', icono: '🧯', color: 'linear-gradient(135deg, #991b1b, #dc2626)' },
    { id: 'cajas', label: '🧰 CAJAS', icono: '📦', color: 'linear-gradient(135deg, #0e7490, #0891b2)' },
  ];

  useEffect(() => {
    if (!vehiculoSel) return;

    const fluidos = {};
    fluidosConfig.forEach((f) => {
      fluidos[f.key] = { ok: null, observaciones: '' };
    });
    setEstadoFluidos(fluidos);

    const luces = {};
    lucesConfig.forEach((l) => {
      luces[l.key] = { ok: null, observaciones: '' };
    });
    setEstadoLuces(luces);

    const items = {};
    (vehiculoSel.compartimientos || []).forEach((comp) => {
      (comp.subcompartimientos || []).forEach((sub) => {
        (sub.items || []).forEach((item) => {
          items[item.itemId] = {
            nombre: item.nombre,
            categoria: item.categoria || 'general', // ✅ Valor por defecto
            cantidadEsperada: item.cantidadEsperada,
            cantidadReal: 0,
            ok: null,
            observaciones: '',
            ubicacion: `${comp.nombre} > ${sub.nombre}`,
            unidad: item.unidad || 'u',
          };
        });
      });
    });
    (vehiculoSel.itemsAsignados || []).forEach((item) => {
      if (!items[item.itemId]) {
        items[item.itemId] = {
          nombre: item.nombre,
          categoria: item.categoria || 'general', // ✅ Valor por defecto
          cantidadEsperada: item.cantidad,
          cantidadReal: 0,
          ok: null,
          observaciones: '',
          ubicacion: 'General',
          unidad: item.unidad || 'u',
        };
      }
    });
    setEstadoItems(items);

    const erasState = {};
    (vehiculoSel.erasAsignadas || []).forEach((eraId) => {
      const era = eras.find((e) => e.id === eraId);
      if (era) {
        erasState[eraId] = {
          nombre: `${era.marca} ${era.modelo}`,
          serial: era.serial,
          codigoInterno: era.codigoInterno || '',
          presionEsperada: 300,
          presionReal: 0,
          mascaraOk: null,
          mascaraObs: '',
          ok: null,
          observaciones: '',
        };
      }
    });
    setEstadoERAs(erasState);

    const equiposState = {};
    (vehiculoSel.equiposAsignados || []).forEach((equipoId) => {
      const eq = equipos.find((e) => e.id === equipoId);
      if (eq) {
        equiposState[equipoId] = {
          nombre: eq.nombre,
          codigoInterno: eq.codigoInterno,
          vencimiento: eq.vencimiento,
          ok: null,
          observaciones: '',
        };
      }
    });
    setEstadoEquipos(equiposState);

    const cajasState = {};
    if (Array.isArray(cajas) && cajas.length) {
      (vehiculoSel.cajasAsignadas || []).forEach((cajaId) => {
        const caja = cajas.find((c) => c.id === cajaId);
        if (caja) {
          cajasState[cajaId] = {
            nombre: caja.nombre,
            codigoInterno: caja.codigoInterno,
            tipo: caja.tipo,
            items: (caja.items || []).map((item) => ({
              itemId: item.itemId,
              nombre: item.nombre,
              cantidadEsperada: item.cantidadEsperada,
              cantidadReal: 0,
              unidad: item.unidad || 'u',
              ok: null,
              observaciones: '',
            })),
            expanded: false,
          };
        }
      });
    }
    setEstadoCajas(cajasState);
  }, [vehiculoSel, eras, equipos, cajas]);

  const toggleCaja = (cajaId) => {
    setEstadoCajas((prev) => ({
      ...prev,
      [cajaId]: { ...prev[cajaId], expanded: !prev[cajaId]?.expanded },
    }));
  };

  const actualizarItemCaja = (cajaId, itemIndex, campo, valor) => {
    setEstadoCajas((prev) => ({
      ...prev,
      [cajaId]: {
        ...prev[cajaId],
        items: prev[cajaId].items.map((item, idx) =>
          idx === itemIndex ? { ...item, [campo]: valor } : item
        ),
      },
    }));
  };

  // ========== FUNCIÓN PARA SANITIZAR OBJETOS (eliminar undefined) ==========
  const sanitizeObject = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) {
      return obj.map(sanitizeObject);
    }
    const clean = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value === undefined) continue; // omitir undefined
      if (value && typeof value === 'object') {
        clean[key] = sanitizeObject(value);
      } else {
        clean[key] = value;
      }
    }
    return clean;
  };

  const guardar = async () => {
    if (!vehiculoSel) return;
    setGuardando(true);
    let todosOk = true;
    const verificar = (obj) => Object.values(obj).some((v) => v.ok === false);
    if (verificar(estadoFluidos)) todosOk = false;
    if (verificar(estadoLuces)) todosOk = false;
    if (verificar(estadoItems)) todosOk = false;
    if (verificar(estadoERAs)) todosOk = false;
    if (verificar(estadoEquipos)) todosOk = false;
    Object.values(estadoCajas).forEach((caja) => {
      if (caja.items.some((item) => item.ok === false)) todosOk = false;
    });

    // Sanitizar todos los estados antes de guardar
    const datos = {
      vehiculoId: vehiculoSel.id,
      vehiculoNombre: vehiculoSel.nombre,
      tipo,
      fluidos: sanitizeObject(estadoFluidos),
      luces: sanitizeObject(estadoLuces),
      items: sanitizeObject(estadoItems),
      eras: sanitizeObject(estadoERAs),
      equipos: sanitizeObject(estadoEquipos),
      cajas: sanitizeObject(estadoCajas),
      observaciones: obs || '',
      resultado: todosOk ? 'ok' : 'con_novedades',
      usuario: usuario?.nombre || 'Sistema',
      fecha: new Date().toISOString().split('T')[0],
      hora: new Date().toLocaleTimeString('es-AR'),
    };

    try {
      await onGuardar(datos);
      alert('✅ Checklist guardado');
      setVista('lista');
      setVehiculoSel(null);
      setObs('');
    } catch (err) {
      console.error(err);
      alert('Error al guardar: ' + err.message);
    }
    setGuardando(false);
  };

  const exportarPDF = (cl) => {
    const doc = new jsPDF();
    doc.text(`Checklist - ${cl.vehiculoNombre}`, 14, 10);
    doc.text(`Fecha: ${cl.fecha} ${cl.hora} | Usuario: ${cl.usuario}`, 14, 20);
    doc.text(`Tipo: ${cl.tipo} | Resultado: ${cl.resultado === 'ok' ? 'APROBADO' : 'CON NOVEDADES'}`, 14, 30);
    let y = 40;
    if (cl.observaciones) {
      doc.text(`Observaciones generales: ${cl.observaciones}`, 14, y);
      y += 10;
    }
    const addSection = (titulo, headers, dataRows) => {
      if (dataRows.length === 0) return;
      if (y > 270) { doc.addPage(); y = 20; }
      doc.text(titulo, 14, y);
      y += 6;
      doc.autoTable({ head: [headers], body: dataRows, startY: y, margin: { left: 14 } });
      y = doc.lastAutoTable.finalY + 10;
    };
    const fluidosData = Object.entries(cl.fluidos || {}).map(([key, val]) => [
      fluidosConfig.find((f) => f.key === key)?.label || key,
      val.ok ? 'OK' : 'NOK',
      val.observaciones || '',
    ]);
    addSection('Fluidos', ['Fluido', 'Estado', 'Observaciones'], fluidosData);
    const lucesData = Object.entries(cl.luces || {}).map(([key, val]) => [
      lucesConfig.find((l) => l.key === key)?.label || key,
      val.ok ? 'OK' : 'NOK',
      val.observaciones || '',
    ]);
    addSection('Luces', ['Elemento', 'Estado', 'Observaciones'], lucesData);
    const itemsData = Object.entries(cl.items || {}).map(([, val]) => [
      val.nombre,
      `${val.cantidadReal}/${val.cantidadEsperada} ${val.unidad || 'u'}`,
      val.ok ? 'OK' : 'NOK',
      val.observaciones || '',
    ]);
    addSection('Herramientas/Items', ['Nombre', 'Cantidad', 'Estado', 'Observaciones'], itemsData);
    const erasData = Object.entries(cl.eras || {}).map(([, val]) => [
      val.nombre,
      `${val.presionReal}/${val.presionEsperada} bar`,
      val.mascaraOk === true ? 'Máscara OK' : (val.mascaraOk === false ? 'Máscara NOK' : 'Máscara ?'),
      val.ok ? 'OK' : 'NOK',
      val.observaciones || '',
      val.mascaraObs || '',
    ]);
    addSection('ERAs', ['Nombre', 'Presión', 'Máscara', 'Estado', 'Observaciones', 'Obs Máscara'], erasData);
    const equiposData = Object.entries(cl.equipos || {}).map(([, val]) => [
      val.nombre,
      val.ok ? 'OK' : 'NOK',
      val.observaciones || '',
    ]);
    addSection('Equipos', ['Nombre', 'Estado', 'Observaciones'], equiposData);
    if (cl.cajas) {
      Object.entries(cl.cajas).forEach(([, caja]) => {
        const cajaItemsData = caja.items.map((item) => [
          item.nombre,
          `${item.cantidadReal}/${item.cantidadEsperada}`,
          item.ok ? 'OK' : 'NOK',
          item.observaciones || '',
        ]);
        addSection(`🧰 Caja: ${caja.nombre}`, ['Item', 'Cantidad', 'Estado', 'Observaciones'], cajaItemsData);
      });
    }
    doc.save(`checklist_${cl.vehiculoNombre}_${cl.fecha}.pdf`);
  };

  const renderDetalle = (cl) => {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}
      >
        <div
          style={{
            background: 'rgba(20,30,50,0.95)',
            borderRadius: 32,
            padding: 24,
            maxWidth: '90vw',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 0 30px rgba(0,200,255,0.3)',
            border: '1px solid cyan',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ color: '#aaffff' }}>Detalle de Checklist</h3>
            <button onClick={() => setChecklistDetalle(null)} style={{ ...styles.btnPrimary, borderRadius: 40, background: '#ef4444' }}>Cerrar</button>
          </div>
          <p><strong>🚛 Vehículo:</strong> {cl.vehiculoNombre}</p>
          <p><strong>📅 Fecha/Hora:</strong> {cl.fecha} {cl.hora}</p>
          <p><strong>👤 Usuario:</strong> {cl.usuario}</p>
          <p><strong>📋 Tipo:</strong> {cl.tipo}</p>
          <p><strong>{cl.resultado === 'ok' ? '✅ APROBADO' : '⚠️ CON NOVEDADES'}</strong></p>
          {cl.observaciones && <p><strong>💬 Observaciones generales:</strong> {cl.observaciones}</p>}
          
          {Object.keys(cl.fluidos || {}).length > 0 && (
            <>
              <h4 style={{ ...styles.cardTitle, color: '#bbd4ff' }}>🛢️ Fluidos</h4>
              <table style={{ ...styles.table, background: '#0f172a', borderRadius: 16, overflow: 'hidden' }}>
                <thead><tr><th>Fluido</th><th>Estado</th><th>Observaciones</th></tr></thead>
                <tbody>
                  {Object.entries(cl.fluidos).map(([key, val]) => (
                    <tr key={key}>
                      <td style={{ color: '#e2e8f0' }}>{fluidosConfig.find((f) => f.key === key)?.label || key}</td>
                      <td style={{ color: val.ok ? '#4ade80' : '#f87171' }}>{val.ok ? '✓ OK' : '✗ NO OK'}</td>
                      <td style={{ color: '#94a3b8' }}>{val.observaciones}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
          {Object.keys(cl.luces || {}).length > 0 && (
            <>
              <h4 style={{ ...styles.cardTitle, color: '#bbd4ff' }}>💡 Luces</h4>
              <table style={{ ...styles.table, background: '#0f172a', borderRadius: 16 }}>
                <thead><tr><th>Elemento</th><th>Estado</th><th>Observaciones</th></tr></thead>
                <tbody>
                  {Object.entries(cl.luces).map(([key, val]) => (
                    <tr key={key}>
                      <td>{lucesConfig.find((l) => l.key === key)?.label || key}</td>
                      <td style={{ color: val.ok ? '#4ade80' : '#f87171' }}>{val.ok ? '✓ OK' : '✗ NO OK'}</td>
                      <td>{val.observaciones}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
          {Object.keys(cl.items || {}).length > 0 && (
            <>
              <h4 style={{ ...styles.cardTitle, color: '#bbd4ff' }}>🔧 Herramientas/Items</h4>
              <table style={{ ...styles.table, background: '#0f172a' }}>
                <thead><tr><th>Nombre</th><th>Cantidad</th><th>Estado</th><th>Observaciones</th></tr></thead>
                <tbody>
                  {Object.entries(cl.items).map(([, val]) => (
                    <tr key={val.nombre}>
                      <td>{val.nombre}</td>
                      <td>{val.cantidadReal}/{val.cantidadEsperada} {val.unidad}</td>
                      <td style={{ color: val.ok ? '#4ade80' : '#f87171' }}>{val.ok ? '✓ OK' : '✗ NO OK'}</td>
                      <td>{val.observaciones}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
          {Object.keys(cl.eras || {}).length > 0 && (
            <>
              <h4 style={{ ...styles.cardTitle, color: '#bbd4ff' }}>🎽 ERAs + Máscara</h4>
              <table style={{ ...styles.table, background: '#0f172a' }}>
                <thead><tr><th>Nombre</th><th>Presión</th><th>Máscara</th><th>Estado</th><th>Observaciones</th><th>Obs Máscara</th></tr></thead>
                <tbody>
                  {Object.entries(cl.eras).map(([, val]) => (
                    <tr key={val.nombre}>
                      <td>{val.nombre}</td>
                      <td>{val.presionReal}/{val.presionEsperada} bar</td>
                      <td style={{ color: val.mascaraOk === true ? '#4ade80' : (val.mascaraOk === false ? '#f87171' : '#eab308') }}>
                        {val.mascaraOk === true ? '✓ OK' : (val.mascaraOk === false ? '✗ NO OK' : '?')}
                      </td>
                      <td style={{ color: val.ok ? '#4ade80' : '#f87171' }}>{val.ok ? '✓ OK' : '✗ NO OK'}</td>
                      <td>{val.observaciones}</td>
                      <td>{val.mascaraObs}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
          {Object.keys(cl.equipos || {}).length > 0 && (
            <>
              <h4 style={{ ...styles.cardTitle, color: '#bbd4ff' }}>🧯 Equipos</h4>
              <table style={{ ...styles.table, background: '#0f172a' }}>
                <thead><tr><th>Nombre</th><th>Estado</th><th>Observaciones</th></tr></thead>
                <tbody>
                  {Object.entries(cl.equipos).map(([, val]) => (
                    <tr key={val.nombre}>
                      <td>{val.nombre}</td>
                      <td style={{ color: val.ok ? '#4ade80' : '#f87171' }}>{val.ok ? '✓ OK' : '✗ NO OK'}</td>
                      <td>{val.observaciones}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
          {cl.cajas && Object.keys(cl.cajas).length > 0 && (
            <>
              <h4 style={{ ...styles.cardTitle, color: '#bbd4ff' }}>🧰 Cajas de herramientas</h4>
              {Object.entries(cl.cajas).map(([cid, caja]) => (
                <div key={cid} style={{ marginBottom: 16, border: '1px solid #2d3a5e', borderRadius: 16, padding: 12, background: '#0a0f1a' }}>
                  <strong style={{ fontSize: 15, display: 'block', marginBottom: 8, color: '#aaffff' }}>{caja.nombre}</strong>
                  <table style={{ ...styles.table, background: '#0f172a' }}>
                    <thead><tr><th>Item</th><th>Cantidad</th><th>Estado</th><th>Observaciones</th></tr></thead>
                    <tbody>
                      {caja.items.map((item, idx) => (
                        <tr key={idx}>
                          <td>{item.nombre}</td>
                          <td>{item.cantidadReal}/{item.cantidadEsperada}</td>
                          <td style={{ color: item.ok ? '#4ade80' : '#f87171' }}>{item.ok ? '✓ OK' : '✗ NO OK'}</td>
                          <td>{item.observaciones}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </>
          )}
          <button onClick={() => exportarPDF(cl)} style={{ ...styles.btnPrimary, marginTop: 16, borderRadius: 40, background: 'linear-gradient(95deg, #0f2b5e, #1a4c9e)' }}>📄 Exportar PDF</button>
        </div>
      </div>
    );
  };

  if (vista === 'lista') {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
          <h2 style={{ ...styles.pageTitle, color: '#e2e8f0' }}>📋 Checklists</h2>
          <button style={{ ...styles.btnPrimary, borderRadius: 60, background: 'linear-gradient(95deg, #0f2b5e, #1a4c9e)', padding: '12px 24px' }} onClick={() => setVista('nuevo')}>➕ Nuevo Checklist</button>
        </div>
        {checklistDetalle && renderDetalle(checklistDetalle)}
        {checklists.length === 0 ? (
          <div style={{ ...styles.card, background: 'rgba(15,25,45,0.7)', borderRadius: 28, textAlign: 'center', padding: 40 }}>No hay checklists registrados</div>
        ) : (
          checklists.map((cl) => (
            <div
              key={cl.id}
              style={{ ...styles.card, borderLeft: `5px solid ${cl.resultado === 'ok' ? '#10b981' : '#ef4444'}`, marginBottom: 12, cursor: 'pointer', borderRadius: 20, background: 'rgba(15,25,45,0.7)', backdropFilter: 'blur(4px)', transition: '0.2s' }}
              onClick={() => setChecklistDetalle(cl)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ color: '#e2e8f0' }}>🚛 {cl.vehiculoNombre}</strong> - {cl.fecha} {cl.hora}<br />
                  <small style={{ color: '#94a3b8' }}>Tipo: {cl.tipo} | Resultado: {cl.resultado === 'ok' ? '✅ OK' : '⚠️ Con novedades'}</small>
                </div>
                <button onClick={(e) => { e.stopPropagation(); if (window.confirm('¿Eliminar?')) onEliminar(cl.id); }} style={{ ...styles.btnPrimary, background: '#ef4444', borderRadius: 60, padding: '6px 16px' }}>🗑️</button>
              </div>
            </div>
          ))
        )}
      </div>
    );
  }

  // Helper para botones OK/NO OK con feedback visual
  const renderOkNokButtons = (valorActual, setEstado, itemKey, campo = 'ok', extra = {}) => {
    const isOk = valorActual?.[campo] === true;
    const isNok = valorActual?.[campo] === false;
    return (
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          style={{
            padding: '6px 16px',
            background: isOk ? '#10b981' : '#334155',
            color: 'white',
            border: isOk ? '1px solid #a7f3d0' : '1px solid #475569',
            borderRadius: '40px',
            cursor: 'pointer',
            fontWeight: 'bold',
            boxShadow: isOk ? '0 0 8px #10b981' : 'none',
            transition: 'all 0.2s',
          }}
          onClick={() =>
            setEstado((prev) => ({
              ...prev,
              [itemKey]: { ...valorActual, [campo]: true, ...extra },
            }))
          }
        >
          ✓ OK
        </button>
        <button
          style={{
            padding: '6px 16px',
            background: isNok ? '#ef4444' : '#334155',
            color: 'white',
            border: isNok ? '1px solid #fecaca' : '1px solid #475569',
            borderRadius: '40px',
            cursor: 'pointer',
            fontWeight: 'bold',
            boxShadow: isNok ? '0 0 8px #ef4444' : 'none',
            transition: 'all 0.2s',
          }}
          onClick={() =>
            setEstado((prev) => ({
              ...prev,
              [itemKey]: { ...valorActual, [campo]: false, ...extra },
            }))
          }
        >
          ✗ NO OK
        </button>
      </div>
    );
  };

  // Vista de nuevo checklist
  return (
    <div>
      {!vehiculoSel ? (
        <div style={{ ...styles.card, background: 'rgba(15,25,45,0.7)', borderRadius: 32, padding: 24 }}>
          <h3 style={{ color: '#aaffff' }}>1️⃣ Seleccionar Móvil</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px,1fr))', gap: 12 }}>
            {vehiculos.map((v) => (
              <button key={v.id} style={{ padding: 20, background: 'rgba(20,30,55,0.9)', border: '1px solid #2d3a5e', borderRadius: 20, cursor: 'pointer', textAlign: 'center', transition: '0.2s', color: '#e2e8f0' }} onClick={() => setVehiculoSel(v)}>
                <div style={{ fontSize: 40 }}>🚛</div>
                <strong>{v.nombre}</strong><br />{v.tipo}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div>
          <div style={{ ...styles.card, background: 'rgba(15,25,45,0.7)', borderRadius: 32, marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ color: '#aaffff' }}>📋 Checklist para {vehiculoSel.nombre}</h3>
              <button onClick={() => setVehiculoSel(null)} style={{ ...styles.btnPrimary, borderRadius: 60, background: '#475569' }}>↩️ Cambiar móvil</button>
            </div>
          </div>

          {/* Selector de modos mejorado */}
          <div style={{ ...styles.card, background: 'rgba(15,25,45,0.7)', borderRadius: 32, marginBottom: 20 }}>
            <h3 style={{ color: '#aaffff', marginBottom: 16 }}>2️⃣ Tipo de checklist</h3>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {modosDisponibles.map((modo) => (
                <button
                  key={modo.id}
                  style={{
                    padding: '10px 20px',
                    background: tipo === modo.id ? modo.color : 'rgba(30,40,70,0.8)',
                    color: 'white',
                    border: tipo === modo.id ? '1px solid rgba(0,255,255,0.6)' : '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 60,
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    boxShadow: tipo === modo.id ? '0 0 10px rgba(0,200,255,0.5)' : 'none',
                    transition: '0.2s',
                  }}
                  onClick={() => setTipo(modo.id)}
                >
                  {modo.icono} {modo.label}
                </button>
              ))}
            </div>
          </div>

          {/* Fluidos (incluye modo fluido, completo, fluidosLuces) */}
          {(tipo === 'fluidos' || tipo === 'completo' || tipo === 'fluidosLuces') && (
            <div style={{ ...styles.card, background: 'rgba(15,25,45,0.7)', borderRadius: 32 }}>
              <h3 style={{ color: '#aaffff' }}>🛢️ Fluidos</h3>
              {fluidosConfig.map((fc) => {
                const val = estadoFluidos[fc.key] || { ok: null, observaciones: '' };
                return (
                  <div key={fc.key} style={{ marginBottom: 16, padding: 12, background: 'rgba(0,0,0,0.3)', borderRadius: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                      <strong style={{ color: '#e2e8f0' }}>{fc.label}</strong>
                      {renderOkNokButtons(val, setEstadoFluidos, fc.key, 'ok')}
                    </div>
                    <input
                      type="text"
                      placeholder="Observaciones"
                      value={val.observaciones}
                      onChange={(e) =>
                        setEstadoFluidos((prev) => ({
                          ...prev,
                          [fc.key]: { ...val, observaciones: e.target.value },
                        }))
                      }
                      style={{ ...styles.input, marginTop: 8, borderRadius: 40, background: '#0f172a' }}
                    />
                  </div>
                );
              })}
            </div>
          )}

          {/* Luces (incluye modo luces, completo, fluidosLuces) */}
          {(tipo === 'luces' || tipo === 'completo' || tipo === 'fluidosLuces') && (
            <div style={{ ...styles.card, background: 'rgba(15,25,45,0.7)', borderRadius: 32 }}>
              <h3 style={{ color: '#aaffff' }}>💡 Luces y señales</h3>
              {lucesConfig.map((lc) => {
                const val = estadoLuces[lc.key] || { ok: null, observaciones: '' };
                return (
                  <div key={lc.key} style={{ marginBottom: 16, padding: 12, background: 'rgba(0,0,0,0.3)', borderRadius: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                      <strong style={{ color: '#e2e8f0' }}>{lc.label}</strong>
                      {renderOkNokButtons(val, setEstadoLuces, lc.key, 'ok')}
                    </div>
                    <input
                      type="text"
                      placeholder="Observaciones"
                      value={val.observaciones}
                      onChange={(e) =>
                        setEstadoLuces((prev) => ({
                          ...prev,
                          [lc.key]: { ...val, observaciones: e.target.value },
                        }))
                      }
                      style={{ ...styles.input, marginTop: 8, borderRadius: 40, background: '#0f172a' }}
                    />
                  </div>
                );
              })}
            </div>
          )}

          {/* Herramientas sueltas (incluye herramientas, completo, herramientasErasCajasEquipos) */}
          {(tipo === 'herramientas' || tipo === 'completo' || tipo === 'herramientasErasCajasEquipos') && Object.keys(estadoItems).length > 0 && (
            <div style={{ ...styles.card, background: 'rgba(15,25,45,0.7)', borderRadius: 32 }}>
              <h3 style={{ color: '#aaffff' }}>🔧 Herramientas e items (sin caja)</h3>
              {Object.entries(estadoItems).map(([itemId, item]) => (
                <div key={itemId} style={{ marginBottom: 16, padding: 12, background: 'rgba(0,0,0,0.3)', borderRadius: 20 }}>
                  <div><strong style={{ color: '#e2e8f0' }}>{item.nombre}</strong> - Esperado: {item.cantidadEsperada} {item.unidad} - Ubicación: {item.ubicacion}</div>
                  <div style={{ display: 'flex', gap: 16, marginTop: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    {renderOkNokButtons(item, setEstadoItems, itemId, 'ok', { cantidadReal: item.ok === true ? item.cantidadEsperada : (item.cantidadReal || 0) })}
                    <input
                      type="number"
                      value={item.cantidadReal || 0}
                      onChange={(e) => {
                        const real = parseInt(e.target.value) || 0;
                        const okAuto = real >= item.cantidadEsperada;
                        setEstadoItems((prev) => ({
                          ...prev,
                          [itemId]: { ...item, cantidadReal: real, ok: okAuto ? true : (item.ok === true ? true : false) },
                        }));
                      }}
                      style={{ width: 80, ...styles.input, borderRadius: 40, background: '#0f172a' }}
                      placeholder="Cant. real"
                    />
                    <span style={{ color: '#94a3b8' }}>/ {item.cantidadEsperada} {item.unidad}</span>
                  </div>
                  <input
                    type="text"
                    placeholder="Observaciones"
                    value={item.observaciones || ''}
                    onChange={(e) =>
                      setEstadoItems((prev) => ({
                        ...prev,
                        [itemId]: { ...item, observaciones: e.target.value },
                      }))
                    }
                    style={{ ...styles.input, marginTop: 8, borderRadius: 40, background: '#0f172a' }}
                  />
                </div>
              ))}
              {Object.keys(estadoItems).length === 0 && <p style={{ color: '#94a3b8' }}>No hay herramientas asignadas</p>}
            </div>
          )}

          {/* ERAs con control de máscara (incluye eras, completo, herramientasErasCajasEquipos) */}
          {(tipo === 'eras' || tipo === 'completo' || tipo === 'herramientasErasCajasEquipos') && Object.keys(estadoERAs).length > 0 && (
            <div style={{ ...styles.card, background: 'rgba(15,25,45,0.7)', borderRadius: 32 }}>
              <h3 style={{ color: '#aaffff' }}>🎽 ERAs + Control de Máscara</h3>
              {Object.entries(estadoERAs).map(([eraId, era]) => (
                <div key={eraId} style={{ marginBottom: 16, padding: 12, background: 'rgba(0,0,0,0.3)', borderRadius: 20 }}>
                  <div><strong style={{ color: '#e2e8f0' }}>{era.nombre}</strong> - Serial: {era.serial}</div>
                  <div style={{ display: 'flex', gap: 16, marginTop: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    {renderOkNokButtons(era, setEstadoERAs, eraId, 'ok')}
                    <input
                      type="number"
                      value={era.presionReal || 0}
                      onChange={(e) => {
                        const pres = parseInt(e.target.value) || 0;
                        const okPres = pres >= era.presionEsperada * 0.9;
                        setEstadoERAs((prev) => ({
                          ...prev,
                          [eraId]: { ...era, presionReal: pres, ok: okPres },
                        }));
                      }}
                      style={{ width: 80, ...styles.input, borderRadius: 40, background: '#0f172a' }}
                      placeholder="Presión (bar)"
                    />
                    <span style={{ color: '#94a3b8' }}>/ {era.presionEsperada} bar</span>
                  </div>
                  <div style={{ marginTop: 12, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 'bold', color: '#bbd4ff' }}>🎭 Máscara:</span>
                    {renderOkNokButtons(era, setEstadoERAs, eraId, 'mascaraOk', { mascaraObs: era.mascaraObs })}
                    <input
                      type="text"
                      placeholder="Observaciones máscara"
                      value={era.mascaraObs || ''}
                      onChange={(e) =>
                        setEstadoERAs((prev) => ({
                          ...prev,
                          [eraId]: { ...era, mascaraObs: e.target.value },
                        }))
                      }
                      style={{ flex: 1, ...styles.input, borderRadius: 40, background: '#0f172a' }}
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Observaciones generales ERA"
                    value={era.observaciones || ''}
                    onChange={(e) =>
                      setEstadoERAs((prev) => ({
                        ...prev,
                        [eraId]: { ...era, observaciones: e.target.value },
                      }))
                    }
                    style={{ ...styles.input, marginTop: 8, borderRadius: 40, background: '#0f172a' }}
                  />
                </div>
              ))}
              {Object.keys(estadoERAs).length === 0 && <p style={{ color: '#94a3b8' }}>No hay ERAs asignadas a este móvil</p>}
            </div>
          )}

          {/* Equipos (incluye equipos, completo, herramientasErasCajasEquipos) */}
          {(tipo === 'equipos' || tipo === 'completo' || tipo === 'herramientasErasCajasEquipos') && Object.keys(estadoEquipos).length > 0 && (
            <div style={{ ...styles.card, background: 'rgba(15,25,45,0.7)', borderRadius: 32 }}>
              <h3 style={{ color: '#aaffff' }}>🧯 Equipos asignados</h3>
              {Object.entries(estadoEquipos).map(([eqId, eq]) => (
                <div key={eqId} style={{ marginBottom: 16, padding: 12, background: 'rgba(0,0,0,0.3)', borderRadius: 20 }}>
                  <div><strong style={{ color: '#e2e8f0' }}>{eq.nombre}</strong> - Código: {eq.codigoInterno} - Vence: {eq.vencimiento}</div>
                  <div style={{ display: 'flex', gap: 16, marginTop: 8, alignItems: 'center' }}>
                    {renderOkNokButtons(eq, setEstadoEquipos, eqId, 'ok')}
                  </div>
                  <input
                    type="text"
                    placeholder="Observaciones"
                    value={eq.observaciones || ''}
                    onChange={(e) =>
                      setEstadoEquipos((prev) => ({
                        ...prev,
                        [eqId]: { ...eq, observaciones: e.target.value },
                      }))
                    }
                    style={{ ...styles.input, marginTop: 8, borderRadius: 40, background: '#0f172a' }}
                  />
                </div>
              ))}
              {Object.keys(estadoEquipos).length === 0 && <p style={{ color: '#94a3b8' }}>No hay equipos asignados</p>}
            </div>
          )}

          {/* Cajas de herramientas (incluye cajas, completo, herramientasErasCajasEquipos) */}
          {(tipo === 'cajas' || tipo === 'completo' || tipo === 'herramientasErasCajasEquipos') && Object.keys(estadoCajas).length > 0 && (
            <div style={{ ...styles.card, background: 'rgba(15,25,45,0.7)', borderRadius: 32 }}>
              <h3 style={{ color: '#aaffff' }}>🧰 Cajas de herramientas</h3>
              {Object.entries(estadoCajas).map(([cajaId, caja]) => {
                const todosOk = caja.items.every((item) => item.ok === true);
                const algunaNok = caja.items.some((item) => item.ok === false);
                const estadoCaja = todosOk ? '✅ OK' : (algunaNok ? '⚠️ CON NOVEDADES' : '⬜ SIN VERIFICAR');
                const estadoColor = todosOk ? '#10b981' : (algunaNok ? '#ef4444' : '#9ca3af');
                return (
                  <div key={cajaId} style={{ marginBottom: 16, borderRadius: 20, overflow: 'hidden', border: '1px solid #2d3a5e' }}>
                    <div
                      style={{ background: '#1e2a47', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                      onClick={() => toggleCaja(cajaId)}
                    >
                      <div>
                        <strong style={{ fontSize: 15, color: '#aaffff' }}>🧰 {caja.nombre}</strong>
                        {caja.codigoInterno && <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 8 }}>({caja.codigoInterno})</span>}
                        <div style={{ fontSize: 12, marginTop: 4 }}>
                          <span>Tipo: {caja.tipo || 'N/A'}</span>
                          <span style={{ marginLeft: 16, color: estadoColor, fontWeight: 600 }}>{estadoCaja}</span>
                        </div>
                      </div>
                      <span style={{ fontSize: 20, color: '#94a3b8' }}>{caja.expanded ? '▲' : '▼'}</span>
                    </div>
                    {caja.expanded && (
                      <div style={{ padding: 16, background: 'rgba(0,0,0,0.4)' }}>
                        {caja.items.map((item, idx) => (
                          <div key={item.itemId} style={{ marginBottom: 16, padding: 12, background: 'rgba(0,0,0,0.3)', borderRadius: 20 }}>
                            <div><strong style={{ color: '#e2e8f0' }}>{item.nombre}</strong> - Esperado: {item.cantidadEsperada} {item.unidad}</div>
                            <div style={{ display: 'flex', gap: 16, marginTop: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                              <button
                                style={{
                                  padding: '6px 16px',
                                  background: item.ok === true ? '#10b981' : '#334155',
                                  color: 'white',
                                  border: item.ok === true ? '1px solid #a7f3d0' : '1px solid #475569',
                                  borderRadius: '40px',
                                  cursor: 'pointer',
                                  fontWeight: 'bold',
                                  boxShadow: item.ok === true ? '0 0 8px #10b981' : 'none',
                                }}
                                onClick={() => actualizarItemCaja(cajaId, idx, 'ok', true)}
                              >
                                ✓ OK
                              </button>
                              <button
                                style={{
                                  padding: '6px 16px',
                                  background: item.ok === false ? '#ef4444' : '#334155',
                                  color: 'white',
                                  border: item.ok === false ? '1px solid #fecaca' : '1px solid #475569',
                                  borderRadius: '40px',
                                  cursor: 'pointer',
                                  fontWeight: 'bold',
                                  boxShadow: item.ok === false ? '0 0 8px #ef4444' : 'none',
                                }}
                                onClick={() => actualizarItemCaja(cajaId, idx, 'ok', false)}
                              >
                                ✗ NO OK
                              </button>
                              <input
                                type="number"
                                value={item.cantidadReal || 0}
                                onChange={(e) => {
                                  const real = parseInt(e.target.value) || 0;
                                  const okAuto = real >= item.cantidadEsperada;
                                  actualizarItemCaja(cajaId, idx, 'cantidadReal', real);
                                  if (!item.ok) actualizarItemCaja(cajaId, idx, 'ok', okAuto);
                                }}
                                style={{ width: 80, ...styles.input, borderRadius: 40, background: '#0f172a' }}
                                placeholder="Cant. real"
                              />
                              <span style={{ color: '#94a3b8' }}>/ {item.cantidadEsperada}</span>
                            </div>
                            <input
                              type="text"
                              placeholder="Observaciones"
                              value={item.observaciones || ''}
                              onChange={(e) => actualizarItemCaja(cajaId, idx, 'observaciones', e.target.value)}
                              style={{ ...styles.input, marginTop: 8, borderRadius: 40, background: '#0f172a' }}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              {Object.keys(estadoCajas).length === 0 && <p style={{ color: '#94a3b8' }}>No hay cajas asignadas</p>}
            </div>
          )}

          <div style={{ ...styles.card, background: 'rgba(15,25,45,0.7)', borderRadius: 32 }}>
            <label style={{ ...styles.label, color: '#bbd4ff' }}>💬 Observaciones generales</label>
            <textarea value={obs} onChange={(e) => setObs(e.target.value)} rows={3} style={{ ...styles.input, minHeight: 80, borderRadius: 20, background: '#0f172a' }} />
          </div>

          <button
            onClick={guardar}
            disabled={guardando}
            style={{
              width: '100%',
              padding: 16,
              background: guardando ? '#475569' : 'linear-gradient(95deg, #10b981, #059669)',
              color: 'white',
              border: 'none',
              borderRadius: 60,
              fontWeight: 'bold',
              fontSize: 16,
              cursor: guardando ? 'not-allowed' : 'pointer',
              marginBottom: 20,
              boxShadow: guardando ? 'none' : '0 0 15px #10b981',
            }}
          >
            {guardando ? 'Guardando...' : '✅ Guardar Checklist'}
          </button>
        </div>
      )}
    </div>
  );
}
