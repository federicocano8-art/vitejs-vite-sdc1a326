/* eslint-disable no-unused-vars */
import { useState, useEffect, useMemo } from 'react';

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function Panol({
  inventario,
  styles,
  movimientos,
  onDescontar,
  onAgregarStock,
  usuario,
}) {
  const [itemSel, setItemSel] = useState('');
  const [cant, setCant] = useState(1);
  const [resp, setResp] = useState('');
  const [motivo, setMotivo] = useState('');
  const [tipoMov, setTipoMov] = useState('salida');
  const [busqueda, setBusqueda] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [mostrarDetalle, setMostrarDetalle] = useState(null);
  const [mostrarDashboard, setMostrarDashboard] = useState(true);
  const [mostrarOpcionesExportacion, setMostrarOpcionesExportacion] =
    useState(false);

  useEffect(() => {
    if (usuario) setResp(usuario.nombre);
  }, [usuario]);

  // Estadísticas para dashboard
  const estadisticas = useMemo(() => {
    const totalEntradas = movimientos
      .filter((m) => m.tipo === 'entrada')
      .reduce((sum, m) => sum + (m.cantidad || 0), 0);
    const totalSalidas = movimientos
      .filter((m) => m.tipo === 'salida')
      .reduce((sum, m) => sum + (m.cantidad || 0), 0);
    const balance = totalEntradas - totalSalidas;

    const topItemsMovidos = (() => {
      const conteo = {};
      movimientos.forEach((m) => {
        conteo[m.itemNombre] = (conteo[m.itemNombre] || 0) + (m.cantidad || 0);
      });
      return Object.entries(conteo)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    })();

    const ultimosMovimientos = [...movimientos]
      .sort((a, b) => {
        const fechaA = a.creadoEn?.toDate ? a.creadoEn.toDate() : new Date(0);
        const fechaB = b.creadoEn?.toDate ? b.creadoEn.toDate() : new Date(0);
        return fechaB - fechaA;
      })
      .slice(0, 5);

    return {
      totalEntradas,
      totalSalidas,
      balance,
      topItemsMovidos,
      ultimosMovimientos,
    };
  }, [movimientos]);

  const movimientosFiltrados = movimientos.filter((m) => {
    const matchTexto =
      !busqueda ||
      (m.itemNombre || '').toLowerCase().includes(busqueda.toLowerCase()) ||
      (m.responsable || '').toLowerCase().includes(busqueda.toLowerCase());

    let matchFecha = true;
    if (fechaInicio && m.creadoEn?.toDate) {
      const fechaMov = m.creadoEn.toDate();
      if (fechaInicio && fechaMov < new Date(fechaInicio)) matchFecha = false;
      if (fechaFin && fechaMov > new Date(fechaFin)) matchFecha = false;
    }
    return matchTexto && matchFecha;
  });

  const totalEntradasFiltrado = movimientosFiltrados
    .filter((m) => m.tipo === 'entrada')
    .reduce((sum, m) => sum + (m.cantidad || 0), 0);
  const totalSalidasFiltrado = movimientosFiltrados
    .filter((m) => m.tipo === 'salida')
    .reduce((sum, m) => sum + (m.cantidad || 0), 0);
  const balanceFiltrado = totalEntradasFiltrado - totalSalidasFiltrado;

  const handleMovimiento = async () => {
    if (!itemSel) {
      alert('Seleccioná un item');
      return;
    }
    if (cant <= 0) {
      alert('La cantidad debe ser mayor a 0');
      return;
    }
    if (!resp.trim()) {
      alert('Ingresá el responsable');
      return;
    }

    if (tipoMov === 'salida') {
      await onDescontar(itemSel, cant, resp, motivo);
    } else {
      await onAgregarStock(itemSel, cant, resp, motivo);
    }
    setItemSel('');
    setCant(1);
    setMotivo('');
    alert('✅ Movimiento registrado');
  };

  // Exportar a PDF multi-página
  const exportarPDFMultiPagina = async (tipo = 'todo') => {
    let elementoId = '';
    let titulo = '';

    if (tipo === 'dashboard') {
      elementoId = 'dashboard-contenido';
      titulo = 'Dashboard_Panol';
    } else if (tipo === 'listado') {
      elementoId = 'listado-contenido';
      titulo = 'Listado_Panol';
    } else {
      elementoId = 'panol-contenido';
      titulo = 'Panol_Completo';
    }

    const element = document.getElementById(elementoId);
    if (!element) {
      alert('No hay contenido para exportar');
      return;
    }

    const loadingMsg = document.createElement('div');
    loadingMsg.style.position = 'fixed';
    loadingMsg.style.top = '50%';
    loadingMsg.style.left = '50%';
    loadingMsg.style.transform = 'translate(-50%, -50%)';
    loadingMsg.style.background = 'rgba(0,0,0,0.8)';
    loadingMsg.style.color = 'white';
    loadingMsg.style.padding = '20px 40px';
    loadingMsg.style.borderRadius = '10px';
    loadingMsg.style.zIndex = '9999';
    loadingMsg.innerHTML = '📄 Generando PDF...<br/>Por favor espere';
    document.body.appendChild(loadingMsg);

    try {
      const cloneElement = element.cloneNode(true);
      cloneElement.style.width = '800px';
      cloneElement.style.position = 'absolute';
      cloneElement.style.left = '-9999px';
      cloneElement.style.top = '0';
      cloneElement.style.backgroundColor = 'white';
      cloneElement.style.padding = '20px';
      document.body.appendChild(cloneElement);

      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const contentWidth = pageWidth - margin * 2;

      const canvas = await html2canvas(cloneElement, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
      });
      const imgData = canvas.toDataURL('image/png');
      const imgHeight = (canvas.height * contentWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;
      let pageNum = 1;

      pdf.addImage(
        imgData,
        'PNG',
        margin,
        position,
        contentWidth,
        imgHeight,
        undefined,
        'FAST'
      );

      while (heightLeft > pageHeight - margin * 2) {
        position = position - (pageHeight - margin * 2);
        heightLeft = heightLeft - (pageHeight - margin * 2);
        pageNum++;
        pdf.addPage();
        pdf.addImage(
          imgData,
          'PNG',
          margin,
          position,
          contentWidth,
          imgHeight,
          undefined,
          'FAST'
        );
      }

      const totalPages = pdf.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(100);
        pdf.text(
          `Página ${i} de ${totalPages}`,
          pageWidth - margin - 20,
          pageHeight - 5
        );
        pdf.text(
          `Generado: ${new Date().toLocaleString()}`,
          margin,
          pageHeight - 5
        );
        if (tipo !== 'dashboard') {
          pdf.text(
            `Filtros: ${busqueda ? `Texto: ${busqueda} | ` : ''}Fechas: ${
              fechaInicio || 'Todas'
            } a ${fechaFin || 'hoy'}`,
            margin,
            pageHeight - 10
          );
        }
      }

      pdf.save(`${titulo}_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.removeChild(cloneElement);
    } catch (error) {
      console.error('Error:', error);
      alert('Error al generar el PDF');
    } finally {
      document.body.removeChild(loadingMsg);
      setMostrarOpcionesExportacion(false);
    }
  };

  const vistaPreviaReporte = () => {
    const totalItems = movimientosFiltrados.length;
    const totalPaginas = Math.ceil(totalItems / 10);
    alert(
      `📊 Vista previa del reporte:\n\n` +
        `📦 Movimientos a exportar: ${totalItems}\n` +
        `📄 Páginas aproximadas: ${totalPaginas}\n` +
        `➕ Entradas filtradas: ${totalEntradasFiltrado}\n` +
        `➖ Salidas filtradas: ${totalSalidasFiltrado}\n` +
        `⚖️ Balance: ${balanceFiltrado}\n\n` +
        `¿Desea continuar con la exportación?`
    );

    if (window.confirm('¿Continuar con la exportación a PDF?')) {
      exportarPDFMultiPagina('listado');
    }
  };

  const verDetalle = (mov) => {
    setMostrarDetalle(mov);
  };

  const cerrarDetalle = () => {
    setMostrarDetalle(null);
  };

  return (
    <div>
      {/* Cabecera */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        <div>
          <h2 style={styles.pageTitle}>🧰 Pañol</h2>
          <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
            {movimientos.length} movimientos totales · Balance:{' '}
            {estadisticas.balance}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', position: 'relative' }}>
          <button
            style={{ ...styles.btnPrimary, background: '#2563eb' }}
            onClick={() => setMostrarDashboard(!mostrarDashboard)}
          >
            {mostrarDashboard ? '📋 Ver Movimientos' : '📊 Ver Dashboard'}
          </button>

          <div style={{ position: 'relative' }}>
            <button
              style={{ ...styles.btnPrimary, background: '#10b981' }}
              onClick={() =>
                setMostrarOpcionesExportacion(!mostrarOpcionesExportacion)
              }
            >
              📥 Exportar ▼
            </button>
            {mostrarOpcionesExportacion && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  background: 'white',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  zIndex: 1000,
                  minWidth: '220px',
                }}
              >
                <div
                  onClick={() => exportarPDFMultiPagina('dashboard')}
                  style={{
                    padding: '10px 16px',
                    cursor: 'pointer',
                    borderBottom: '1px solid #f3f4f6',
                  }}
                >
                  📊 Exportar solo Dashboard
                </div>
                <div
                  onClick={() => vistaPreviaReporte()}
                  style={{
                    padding: '10px 16px',
                    cursor: 'pointer',
                    borderBottom: '1px solid #f3f4f6',
                  }}
                >
                  📋 Exportar movimientos filtrados
                </div>
                <div
                  onClick={() => exportarPDFMultiPagina('todo')}
                  style={{ padding: '10px 16px', cursor: 'pointer' }}
                >
                  📄 Exportar completo (Dashboard + Listado)
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de detalle */}
      {mostrarDetalle && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '16px',
              padding: '28px',
              width: '100%',
              maxWidth: '500px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
              }}
            >
              <h2 style={{ fontWeight: 'bold', fontSize: '20px' }}>
                📋 Detalle del Movimiento
              </h2>
              <button
                onClick={cerrarDetalle}
                style={{
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '8px 16px',
                  cursor: 'pointer',
                }}
              >
                ✖ Cerrar
              </button>
            </div>
            <div
              style={{
                borderBottom: '1px solid #e5e7eb',
                paddingBottom: '12px',
                marginBottom: '12px',
              }}
            >
              <p style={{ fontSize: '12px', color: '#6b7280' }}>Tipo</p>
              <p>
                <span
                  style={{
                    background:
                      mostrarDetalle.tipo === 'entrada' ? '#10b981' : '#f59e0b',
                    color: 'white',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: '600',
                  }}
                >
                  {mostrarDetalle.tipo === 'entrada'
                    ? '➕ ENTRADA'
                    : '➖ SALIDA'}
                </span>
              </p>
            </div>
            <div
              style={{
                borderBottom: '1px solid #e5e7eb',
                paddingBottom: '12px',
                marginBottom: '12px',
              }}
            >
              <p style={{ fontSize: '12px', color: '#6b7280' }}>Item</p>
              <p>
                <strong>{mostrarDetalle.itemNombre}</strong>
              </p>
            </div>
            <div
              style={{
                borderBottom: '1px solid #e5e7eb',
                paddingBottom: '12px',
                marginBottom: '12px',
              }}
            >
              <p style={{ fontSize: '12px', color: '#6b7280' }}>Cantidad</p>
              <p
                style={{
                  fontSize: '18px',
                  fontWeight: 'bold',
                  color:
                    mostrarDetalle.tipo === 'entrada' ? '#10b981' : '#f59e0b',
                }}
              >
                {mostrarDetalle.cantidad}
              </p>
            </div>
            <div
              style={{
                borderBottom: '1px solid #e5e7eb',
                paddingBottom: '12px',
                marginBottom: '12px',
              }}
            >
              <p style={{ fontSize: '12px', color: '#6b7280' }}>Responsable</p>
              <p>👤 {mostrarDetalle.responsable}</p>
            </div>
            <div
              style={{
                borderBottom: '1px solid #e5e7eb',
                paddingBottom: '12px',
                marginBottom: '12px',
              }}
            >
              <p style={{ fontSize: '12px', color: '#6b7280' }}>Motivo</p>
              <p>{mostrarDetalle.motivo || 'Sin especificar'}</p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: '#6b7280' }}>Fecha</p>
              <p>
                📅{' '}
                {mostrarDetalle.creadoEn?.toDate
                  ? mostrarDetalle.creadoEn.toDate().toLocaleString('es-AR')
                  : '-'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Contenedor principal */}
      <div id="panol-contenido">
        {/* Dashboard */}
        <div id="dashboard-contenido">
          <div
            style={{
              ...styles.card,
              marginBottom: '24px',
              background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
              color: 'white',
            }}
          >
            <h3
              style={{
                ...styles.cardTitle,
                color: 'white',
                borderBottom: '1px solid rgba(255,255,255,0.3)',
                paddingBottom: '12px',
              }}
            >
              📊 Dashboard de Pañol
            </h3>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '16px',
                marginBottom: '24px',
              }}
            >
              <div
                style={{
                  textAlign: 'center',
                  padding: '12px',
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: '12px',
                }}
              >
                <div style={{ fontSize: '28px', fontWeight: 'bold' }}>
                  {estadisticas.totalEntradas}
                </div>
                <div style={{ fontSize: '12px', opacity: 0.9 }}>
                  Total Entradas
                </div>
              </div>
              <div
                style={{
                  textAlign: 'center',
                  padding: '12px',
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: '12px',
                }}
              >
                <div style={{ fontSize: '28px', fontWeight: 'bold' }}>
                  {estadisticas.totalSalidas}
                </div>
                <div style={{ fontSize: '12px', opacity: 0.9 }}>
                  Total Salidas
                </div>
              </div>
              <div
                style={{
                  textAlign: 'center',
                  padding: '12px',
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: '12px',
                }}
              >
                <div
                  style={{
                    fontSize: '28px',
                    fontWeight: 'bold',
                    color: estadisticas.balance >= 0 ? '#bbf7d0' : '#fecaca',
                  }}
                >
                  {estadisticas.balance >= 0
                    ? `+${estadisticas.balance}`
                    : estadisticas.balance}
                </div>
                <div style={{ fontSize: '12px', opacity: 0.9 }}>Balance</div>
              </div>
              <div
                style={{
                  textAlign: 'center',
                  padding: '12px',
                  background: 'rgba(255,255,255,0.2)',
                  borderRadius: '12px',
                }}
              >
                <div style={{ fontSize: '28px', fontWeight: 'bold' }}>
                  {movimientos.length}
                </div>
                <div style={{ fontSize: '12px', opacity: 0.9 }}>
                  Total Movimientos
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
              }}
            >
              <div
                style={{
                  background: 'rgba(0,0,0,0.2)',
                  borderRadius: '12px',
                  padding: '12px',
                }}
              >
                <h4 style={{ fontWeight: 'bold', marginBottom: '12px' }}>
                  📦 Top 5 items más movidos
                </h4>
                {estadisticas.topItemsMovidos.map(([nombre, cantidad]) => (
                  <div
                    key={nombre}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '13px',
                      marginBottom: '8px',
                      paddingBottom: '4px',
                      borderBottom: '1px solid rgba(255,255,255,0.2)',
                    }}
                  >
                    <span>{nombre}</span>
                    <span style={{ fontWeight: 'bold' }}>
                      {cantidad} unidades
                    </span>
                  </div>
                ))}
              </div>
              <div
                style={{
                  background: 'rgba(0,0,0,0.2)',
                  borderRadius: '12px',
                  padding: '12px',
                }}
              >
                <h4 style={{ fontWeight: 'bold', marginBottom: '12px' }}>
                  🔄 Últimos movimientos
                </h4>
                {estadisticas.ultimosMovimientos.map((mov) => (
                  <div
                    key={mov.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '12px',
                      marginBottom: '8px',
                      paddingBottom: '4px',
                      borderBottom: '1px solid rgba(255,255,255,0.2)',
                    }}
                  >
                    <span>{mov.itemNombre}</span>
                    <span
                      style={{
                        fontWeight: 'bold',
                        color: mov.tipo === 'entrada' ? '#bbf7d0' : '#fecaca',
                      }}
                    >
                      {mov.tipo === 'entrada' ? '+' : '-'}
                      {mov.cantidad}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Listado de movimientos (visible según toggle) */}
        {!mostrarDashboard && (
          <div id="listado-contenido">
            {/* Formulario de movimiento */}
            <div
              style={{
                ...styles.card,
                background: '#f0fdf4',
                border: '2px solid #bbf7d0',
                marginBottom: '24px',
              }}
            >
              <h3 style={{ ...styles.cardTitle, color: '#15803d' }}>
                📦 Registrar Movimiento
              </h3>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '16px',
                  marginBottom: '16px',
                }}
              >
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={styles.label}>Tipo de Movimiento</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      style={{
                        flex: 1,
                        padding: '12px',
                        background:
                          tipoMov === 'salida' ? '#f59e0b' : '#e5e7eb',
                        color: tipoMov === 'salida' ? 'white' : '#374151',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        fontSize: '15px',
                      }}
                      onClick={() => setTipoMov('salida')}
                    >
                      ➖ Salida
                    </button>
                    <button
                      style={{
                        flex: 1,
                        padding: '12px',
                        background:
                          tipoMov === 'entrada' ? '#10b981' : '#e5e7eb',
                        color: tipoMov === 'entrada' ? 'white' : '#374151',
                        border: 'none',
                        borderRadius: '8px',
                        fontWeight: '700',
                        cursor: 'pointer',
                        fontSize: '15px',
                      }}
                      onClick={() => setTipoMov('entrada')}
                    >
                      ➕ Entrada
                    </button>
                  </div>
                </div>
                <div>
                  <label style={styles.label}>Item</label>
                  <select
                    value={itemSel}
                    onChange={(e) => setItemSel(e.target.value)}
                    style={styles.input}
                  >
                    <option value="">Seleccionar item...</option>
                    {inventario.map((i) => (
                      <option key={i.id} value={i.id}>
                        {(i.codigoInterno ? '[' + i.codigoInterno + '] ' : '') +
                          i.nombre +
                          ' - Stock: ' +
                          (i.stock || 0) +
                          ' ' +
                          (i.unidad || 'u')}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={styles.label}>Cantidad</label>
                  <input
                    type="number"
                    value={cant}
                    onChange={(e) => setCant(parseInt(e.target.value) || 1)}
                    style={styles.input}
                    min="1"
                  />
                </div>
                <div>
                  <label style={styles.label}>Responsable</label>
                  <input
                    type="text"
                    value={resp}
                    onChange={(e) => setResp(e.target.value)}
                    style={styles.input}
                    placeholder="Nombre del responsable"
                  />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={styles.label}>Motivo</label>
                  <input
                    type="text"
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    style={styles.input}
                    placeholder="Motivo del movimiento..."
                  />
                </div>
              </div>
              <button
                style={{
                  width: '100%',
                  padding: '14px',
                  background: tipoMov === 'salida' ? '#f59e0b' : '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '700',
                  fontSize: '15px',
                  cursor: 'pointer',
                }}
                onClick={handleMovimiento}
              >
                {tipoMov === 'salida'
                  ? '➖ Registrar Salida'
                  : '➕ Registrar Entrada'}
              </button>
            </div>

            {/* Resumen de movimientos filtrados */}
            <div
              style={{
                ...styles.card,
                marginBottom: '16px',
                background: '#f8fafc',
              }}
            >
              <h3 style={styles.cardTitle}>
                📊 Resumen de movimientos filtrados
              </h3>
              <div
                style={{
                  display: 'flex',
                  gap: '20px',
                  justifyContent: 'space-around',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '12px', color: '#6b7280' }}>Entradas</p>
                  <p
                    style={{
                      fontSize: '24px',
                      fontWeight: 'bold',
                      color: '#10b981',
                    }}
                  >
                    +{totalEntradasFiltrado}
                  </p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '12px', color: '#6b7280' }}>Salidas</p>
                  <p
                    style={{
                      fontSize: '24px',
                      fontWeight: 'bold',
                      color: '#f59e0b',
                    }}
                  >
                    -{totalSalidasFiltrado}
                  </p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '12px', color: '#6b7280' }}>Balance</p>
                  <p
                    style={{
                      fontSize: '24px',
                      fontWeight: 'bold',
                      color: balanceFiltrado >= 0 ? '#10b981' : '#ef4444',
                    }}
                  >
                    {balanceFiltrado >= 0
                      ? `+${balanceFiltrado}`
                      : balanceFiltrado}
                  </p>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <p style={{ fontSize: '12px', color: '#6b7280' }}>
                    Movimientos
                  </p>
                  <p style={{ fontSize: '24px', fontWeight: 'bold' }}>
                    {movimientosFiltrados.length}
                  </p>
                </div>
              </div>
            </div>

            {/* Filtros */}
            <div
              style={{
                display: 'flex',
                gap: '12px',
                marginBottom: '16px',
                flexWrap: 'wrap',
              }}
            >
              <input
                type="text"
                placeholder="🔍 Buscar por item o responsable..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                style={{ ...styles.input, flex: 1, minWidth: '200px' }}
              />
              <input
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                style={{ ...styles.input, width: '150px' }}
                placeholder="Desde"
              />
              <input
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                style={{ ...styles.input, width: '150px' }}
                placeholder="Hasta"
              />
            </div>

            {/* Lista de movimientos */}
            <div style={styles.card}>
              <h3 style={styles.cardTitle}>📋 Historial de Movimientos</h3>
              {movimientosFiltrados.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '40px',
                    color: '#6b7280',
                  }}
                >
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>
                    📋
                  </div>
                  <p>
                    No hay movimientos registrados con los filtros seleccionados
                  </p>
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    maxHeight: '500px',
                    overflowY: 'auto',
                  }}
                >
                  {movimientosFiltrados.map((m) => {
                    const esEntrada = m.tipo === 'entrada';
                    const fecha =
                      m.creadoEn && m.creadoEn.toDate
                        ? m.creadoEn.toDate().toLocaleString('es-AR')
                        : '-';
                    return (
                      <div
                        key={m.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '12px 16px',
                          background: esEntrada ? '#f0fdf4' : '#fffbeb',
                          borderRadius: '8px',
                          border:
                            '1px solid ' + (esEntrada ? '#bbf7d0' : '#fde68a'),
                          cursor: 'pointer',
                        }}
                        onClick={() => verDetalle(m)}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                          }}
                        >
                          <span style={{ fontSize: '20px' }}>
                            {esEntrada ? '➕' : '➖'}
                          </span>
                          <div>
                            <p style={{ fontWeight: '600', fontSize: '14px' }}>
                              {m.itemNombre || '-'}
                            </p>
                            <p style={{ fontSize: '12px', color: '#6b7280' }}>
                              👤 {m.responsable || '-'}{' '}
                              {m.motivo ? ' · ' + m.motivo : ''}
                            </p>
                            <p style={{ fontSize: '11px', color: '#9ca3af' }}>
                              📅 {fecha}
                            </p>
                          </div>
                        </div>
                        <span
                          style={{
                            background: esEntrada ? '#d1fae5' : '#fef3c7',
                            color: esEntrada ? '#065f46' : '#92400e',
                            padding: '6px 14px',
                            borderRadius: '8px',
                            fontWeight: '700',
                            fontSize: '15px',
                          }}
                        >
                          {(esEntrada ? '+' : '-') + m.cantidad}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
