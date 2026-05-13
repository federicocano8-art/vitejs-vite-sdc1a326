/* eslint-disable no-unused-vars */
import { useState, useEffect, useMemo } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function Inventario({
  inventario,
  styles,
  movimientos,
  onAgregar,
  onActualizar,
  onEliminar,
  onDescontar,
  onAgregarStock,
  itemsBajoStock,
  usuario,
}) {
  // Estados principales
  const [form, setForm] = useState({
    nombre: '',
    categoria: 'herramienta',
    stock: 0,
    stockMinimo: 5,
    unidad: 'u',
    descripcion: '',
    ubicacion: '',
    codigoInterno: '',
  });
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editando, setEditando] = useState(null);
  const [formEdit, setFormEdit] = useState({});
  const [busqueda, setBusqueda] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('');
  const [stockFiltro, setStockFiltro] = useState('todos'); // todos, bajo, critico, optimo
  const [movModal, setMovModal] = useState(null);
  const [cantMov, setCantMov] = useState(1);
  const [respMov, setRespMov] = useState('');
  const [motivoMov, setMotivoMov] = useState('');
  const [mostrarDashboard, setMostrarDashboard] = useState(true);
  const [mostrarOpcionesExportacion, setMostrarOpcionesExportacion] =
    useState(false);

  // Estados para búsqueda inteligente
  const [busquedaItem, setBusquedaItem] = useState('');
  const [sugerencias, setSugerencias] = useState([]);
  const [mostrarSugerencias, setMostrarSugerencias] = useState(false);

  // Constantes
  const categorias = [
    'herramienta',
    'equipo',
    'material',
    'repuesto',
    'EPP',
    'otro',
  ];
  const catColores = {
    herramienta: '#3b82f6',
    equipo: '#8b5cf6',
    material: '#10b981',
    repuesto: '#f59e0b',
    EPP: '#ef4444',
    otro: '#6b7280',
  };

  // Calcular estadísticas
  const estadisticas = useMemo(() => {
    const totalItems = inventario.length;
    const totalStock = inventario.reduce((sum, i) => sum + (i.stock || 0), 0);
    const itemsCriticos = inventario.filter((i) => (i.stock || 0) === 0).length;
    const itemsBajos = inventario.filter(
      (i) => (i.stock || 0) > 0 && (i.stock || 0) <= (i.stockMinimo || 5)
    ).length;
    const itemsOptimos = inventario.filter(
      (i) => (i.stock || 0) > (i.stockMinimo || 5)
    ).length;

    // Stock por categoría
    const stockPorCategoria = {};
    categorias.forEach((cat) => {
      stockPorCategoria[cat] = inventario
        .filter((i) => i.categoria === cat)
        .reduce((sum, i) => sum + (i.stock || 0), 0);
    });

    // Top 5 items con menor stock
    const topBajoStock = [...inventario]
      .sort((a, b) => (a.stock || 0) - (b.stock || 0))
      .slice(0, 5);

    // Últimos 5 movimientos
    const ultimosMovimientos = [...movimientos]
      .sort((a, b) => {
        const fechaA = a.creadoEn?.toDate ? a.creadoEn.toDate() : new Date(0);
        const fechaB = b.creadoEn?.toDate ? b.creadoEn.toDate() : new Date(0);
        return fechaB - fechaA;
      })
      .slice(0, 5);

    return {
      totalItems,
      totalStock,
      itemsCriticos,
      itemsBajos,
      itemsOptimos,
      stockPorCategoria,
      topBajoStock,
      ultimosMovimientos,
    };
  }, [inventario, movimientos]);

  // Búsqueda inteligente de items existentes
  useEffect(() => {
    if (busquedaItem.length > 1) {
      const itemsSimilares = inventario
        .filter(
          (i) =>
            i.nombre.toLowerCase().includes(busquedaItem.toLowerCase()) ||
            (i.codigoInterno || '')
              .toLowerCase()
              .includes(busquedaItem.toLowerCase())
        )
        .slice(0, 5);
      setSugerencias(itemsSimilares);
      setMostrarSugerencias(itemsSimilares.length > 0);
    } else {
      setSugerencias([]);
      setMostrarSugerencias(false);
    }
  }, [busquedaItem, inventario]);

  // Filtrado avanzado
  const inventarioFiltrado = inventario.filter((i) => {
    const matchBusqueda =
      !busqueda ||
      i.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      (i.codigoInterno || '').toLowerCase().includes(busqueda.toLowerCase());
    const matchCategoria = !categoriaFiltro || i.categoria === categoriaFiltro;

    let matchStock = true;
    if (stockFiltro === 'bajo')
      matchStock = (i.stock || 0) > 0 && (i.stock || 0) <= (i.stockMinimo || 5);
    if (stockFiltro === 'critico') matchStock = (i.stock || 0) === 0;
    if (stockFiltro === 'optimo')
      matchStock = (i.stock || 0) > (i.stockMinimo || 5);

    return matchBusqueda && matchCategoria && matchStock;
  });

  // Manejar selección de sugerencia
  const seleccionarSugerencia = (item) => {
    const accion = window.confirm(
      `"${item.nombre}" ya existe con stock ${item.stock} ${item.unidad}. ¿Desea agregar stock en lugar de crear uno nuevo?`
    );
    if (accion) {
      setMovModal({ item, tipo: 'entrada' });
      setCantMov(1);
      setRespMov(usuario?.nombre || '');
      setMotivoMov('');
      setMostrarForm(false);
    } else {
      setForm({
        ...form,
        nombre: item.nombre,
        categoria: item.categoria,
        unidad: item.unidad,
        ubicacion: item.ubicacion || '',
        codigoInterno: item.codigoInterno || '',
      });
    }
    setBusquedaItem('');
    setMostrarSugerencias(false);
  };

  // Exportar a PDF con múltiples páginas
  const exportarPDFMultiPagina = async (tipo = 'todo') => {
    let elementoId = '';
    let titulo = '';

    if (tipo === 'dashboard') {
      elementoId = 'dashboard-contenido';
      titulo = 'Dashboard_Inventario';
    } else if (tipo === 'listado') {
      elementoId = 'listado-contenido';
      titulo = 'Listado_Inventario';
    } else {
      elementoId = 'inventario-contenido';
      titulo = 'Inventario_Completo';
    }

    const element = document.getElementById(elementoId);
    if (!element) {
      alert('No hay contenido para exportar');
      return;
    }

    // Mostrar loading
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
    loadingMsg.style.fontSize = '16px';
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

      // Agregar pie de página
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
            `Filtros: Categoría: ${categoriaFiltro || 'Todas'} | Stock: ${
              stockFiltro === 'todos'
                ? 'Todos'
                : stockFiltro === 'bajo'
                ? 'Bajo'
                : stockFiltro === 'critico'
                ? 'Crítico'
                : 'Óptimo'
            }`,
            margin,
            pageHeight - 10
          );
        }
      }

      pdf.save(`${titulo}_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.removeChild(cloneElement);
    } catch (error) {
      console.error('Error generando PDF:', error);
      alert('Error al generar el PDF. Intente nuevamente.');
    } finally {
      document.body.removeChild(loadingMsg);
      setMostrarOpcionesExportacion(false);
    }
  };

  // Vista previa del reporte
  const vistaPreviaReporte = () => {
    const totalItems = inventarioFiltrado.length;
    const totalPaginas = Math.ceil(totalItems / 8);
    alert(
      `📊 Vista previa del reporte:\n\n` +
        `📦 Items a exportar: ${totalItems}\n` +
        `📄 Páginas aproximadas: ${totalPaginas}\n` +
        `🏷️ Categoría filtrada: ${categoriaFiltro || 'Todas'}\n` +
        `⚠️ Estado de stock: ${
          stockFiltro === 'todos'
            ? 'Todos'
            : stockFiltro === 'bajo'
            ? 'Stock bajo'
            : stockFiltro === 'critico'
            ? 'Stock crítico'
            : 'Stock óptimo'
        }\n\n` +
        `¿Desea continuar con la exportación?`
    );

    if (window.confirm('¿Continuar con la exportación a PDF?')) {
      exportarPDFMultiPagina('listado');
    }
  };

  // Exportar a Excel (CSV)
  const exportarExcel = () => {
    const headers = [
      'Código',
      'Nombre',
      'Categoría',
      'Stock',
      'Stock Mínimo',
      'Unidad',
      'Ubicación',
      'Descripción',
    ];
    const rows = inventarioFiltrado.map((i) => [
      i.codigoInterno || '',
      i.nombre,
      i.categoria,
      i.stock || 0,
      i.stockMinimo || 5,
      i.unidad || 'u',
      i.ubicacion || '',
      i.descripcion || '',
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.join(','))
      .join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], {
      type: 'text/csv;charset=utf-8;',
    });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `inventario_${new Date().toISOString().split('T')[0]}.csv`
    );
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Funciones CRUD
  const iniciarEdicion = (item) => {
    setEditando(item.id);
    setFormEdit({
      nombre: item.nombre,
      categoria: item.categoria,
      stock: item.stock,
      stockMinimo: item.stockMinimo,
      unidad: item.unidad,
      descripcion: item.descripcion || '',
      ubicacion: item.ubicacion || '',
      codigoInterno: item.codigoInterno || '',
    });
  };

  const guardarEdicion = async (itemId) => {
    await onActualizar(itemId, formEdit);
    setEditando(null);
    alert('✅ Item actualizado correctamente');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) {
      alert('El nombre es obligatorio');
      return;
    }

    // Verificar duplicados
    const existe = inventario.some(
      (i) =>
        i.nombre.toLowerCase() === form.nombre.toLowerCase() ||
        (form.codigoInterno && i.codigoInterno === form.codigoInterno)
    );

    if (existe) {
      alert(
        '⚠️ Ya existe un item con ese nombre o código interno. Use el buscador inteligente para agregar stock.'
      );
      return;
    }

    const id = await onAgregar(form);
    if (id) {
      setForm({
        nombre: '',
        categoria: 'herramienta',
        stock: 0,
        stockMinimo: 5,
        unidad: 'u',
        descripcion: '',
        ubicacion: '',
        codigoInterno: '',
      });
      setMostrarForm(false);
      alert('✅ Item agregado');
    }
  };

  return (
    <div>
      {/* Cabecera con botones de exportación */}
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
          <h2 style={styles.pageTitle}>📦 Inventario Inteligente</h2>
          <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
            {inventario.length} items registrados · {estadisticas.totalStock}{' '}
            unidades en stock
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', position: 'relative' }}>
          <button
            style={{ ...styles.btnPrimary, background: '#2563eb' }}
            onClick={() => setMostrarDashboard(!mostrarDashboard)}
          >
            {mostrarDashboard ? '📋 Ver Listado' : '📊 Ver Dashboard'}
          </button>

          {/* Menú desplegable de exportación */}
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
                  📋 Exportar listado filtrado
                </div>
                <div
                  onClick={() => exportarPDFMultiPagina('todo')}
                  style={{
                    padding: '10px 16px',
                    cursor: 'pointer',
                    borderBottom: '1px solid #f3f4f6',
                  }}
                >
                  📄 Exportar completo (Dashboard + Listado)
                </div>
                <div
                  onClick={exportarExcel}
                  style={{ padding: '10px 16px', cursor: 'pointer' }}
                >
                  📊 Exportar a Excel (CSV)
                </div>
              </div>
            )}
          </div>

          <button
            style={styles.btnPrimary}
            onClick={() => setMostrarForm(!mostrarForm)}
          >
            {mostrarForm ? '✖ Cancelar' : '➕ Nuevo Item'}
          </button>
        </div>
      </div>

      {/* Contenedor principal para exportación */}
      <div id="inventario-contenido">
        {/* Dashboard de estadísticas */}
        <div id="dashboard-contenido">
          <div
            style={{
              ...styles.card,
              marginBottom: '24px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
              📊 Dashboard de Inventario
            </h3>

            {/* KPIs */}
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
                  {estadisticas.totalItems}
                </div>
                <div style={{ fontSize: '12px', opacity: 0.9 }}>
                  Total Items
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
                  {estadisticas.totalStock}
                </div>
                <div style={{ fontSize: '12px', opacity: 0.9 }}>
                  Unidades Totales
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
                    color: '#fef08a',
                  }}
                >
                  {estadisticas.itemsBajos}
                </div>
                <div style={{ fontSize: '12px', opacity: 0.9 }}>Stock Bajo</div>
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
                    color: '#fecaca',
                  }}
                >
                  {estadisticas.itemsCriticos}
                </div>
                <div style={{ fontSize: '12px', opacity: 0.9 }}>
                  Stock Crítico
                </div>
              </div>
            </div>

            {/* Top 5 bajo stock y último movimiento */}
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
                  ⚠️ Top 5 - Stock más bajo
                </h4>
                {estadisticas.topBajoStock.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '13px',
                      marginBottom: '8px',
                      paddingBottom: '4px',
                      borderBottom: '1px solid rgba(255,255,255,0.2)',
                    }}
                  >
                    <span>{item.nombre}</span>
                    <span
                      style={{
                        fontWeight: 'bold',
                        color: (item.stock || 0) === 0 ? '#fecaca' : '#fef08a',
                      }}
                    >
                      {item.stock || 0} {item.unidad}
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

        {/* Listado de inventario (visible según toggle) */}
        {!mostrarDashboard && (
          <div id="listado-contenido">
            {/* Alerta de stock bajo */}
            {itemsBajoStock.length > 0 && (
              <div
                style={{
                  background: '#fef3c7',
                  border: '2px solid #f59e0b',
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: '20px',
                }}
              >
                <h4
                  style={{
                    fontWeight: 'bold',
                    color: '#92400e',
                    marginBottom: '8px',
                  }}
                >
                  ⚠️ Items con stock bajo ({itemsBajoStock.length})
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {itemsBajoStock.slice(0, 8).map((i) => (
                    <span
                      key={i.id}
                      style={{
                        background: '#fef3c7',
                        border: '1px solid #f59e0b',
                        color: '#92400e',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '600',
                      }}
                    >
                      {(i.codigoInterno ? '[' + i.codigoInterno + '] ' : '') +
                        i.nombre +
                        ': ' +
                        (i.stock || 0) +
                        ' ' +
                        (i.unidad || 'u')}
                    </span>
                  ))}
                  {itemsBajoStock.length > 8 && (
                    <span>+{itemsBajoStock.length - 8} más</span>
                  )}
                </div>
              </div>
            )}

            {/* Formulario de nuevo item con búsqueda inteligente */}
            {mostrarForm && (
              <div
                style={{
                  ...styles.card,
                  background: '#f0f9ff',
                  border: '2px solid #0ea5e9',
                  marginBottom: '24px',
                }}
              >
                <h3 style={{ ...styles.cardTitle, color: '#0369a1' }}>
                  ➕ Nuevo Item
                </h3>

                {/* Buscador inteligente anti-duplicados */}
                <div style={{ position: 'relative', marginBottom: '16px' }}>
                  <label style={styles.label}>
                    🔍 Buscar si ya existe (evita duplicados)
                  </label>
                  <input
                    type="text"
                    value={busquedaItem}
                    onChange={(e) => setBusquedaItem(e.target.value)}
                    style={styles.input}
                    placeholder="Escribí para buscar items existentes..."
                  />
                  {mostrarSugerencias && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        background: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        zIndex: 1000,
                        maxHeight: '200px',
                        overflowY: 'auto',
                      }}
                    >
                      {sugerencias.map((sug) => (
                        <div
                          key={sug.id}
                          onClick={() => seleccionarSugerencia(sug)}
                          style={{
                            padding: '10px 12px',
                            cursor: 'pointer',
                            borderBottom: '1px solid #f3f4f6',
                          }}
                        >
                          <strong>{sug.nombre}</strong> - Stock: {sug.stock}{' '}
                          {sug.unidad}
                          {sug.codigoInterno && (
                            <span
                              style={{
                                fontSize: '11px',
                                color: '#6b7280',
                                marginLeft: '8px',
                              }}
                            >
                              🏷️ {sug.codigoInterno}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <hr style={{ margin: '16px 0' }} />
                <p
                  style={{
                    fontSize: '12px',
                    color: '#6b7280',
                    marginBottom: '16px',
                  }}
                >
                  O completá el formulario para crear un nuevo item:
                </p>

                <form onSubmit={handleSubmit}>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '16px',
                      marginBottom: '16px',
                    }}
                  >
                    <div>
                      <label style={styles.label}>Nombre *</label>
                      <input
                        type="text"
                        value={form.nombre}
                        onChange={(e) =>
                          setForm({ ...form, nombre: e.target.value })
                        }
                        style={styles.input}
                        required
                      />
                    </div>
                    <div>
                      <label style={styles.label}>🏷️ Código Interno</label>
                      <input
                        type="text"
                        value={form.codigoInterno}
                        onChange={(e) =>
                          setForm({ ...form, codigoInterno: e.target.value })
                        }
                        style={styles.input}
                        placeholder="Ej: INV-001"
                      />
                    </div>
                    <div>
                      <label style={styles.label}>Categoría</label>
                      <select
                        value={form.categoria}
                        onChange={(e) =>
                          setForm({ ...form, categoria: e.target.value })
                        }
                        style={styles.input}
                      >
                        {categorias.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={styles.label}>Stock Inicial</label>
                      <input
                        type="number"
                        value={form.stock}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            stock: parseInt(e.target.value) || 0,
                          })
                        }
                        style={styles.input}
                        min="0"
                      />
                    </div>
                    <div>
                      <label style={styles.label}>Stock Mínimo</label>
                      <input
                        type="number"
                        value={form.stockMinimo}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            stockMinimo: parseInt(e.target.value) || 0,
                          })
                        }
                        style={styles.input}
                        min="0"
                      />
                    </div>
                    <div>
                      <label style={styles.label}>Unidad</label>
                      <input
                        type="text"
                        value={form.unidad}
                        onChange={(e) =>
                          setForm({ ...form, unidad: e.target.value })
                        }
                        style={styles.input}
                        placeholder="u, kg, lt..."
                      />
                    </div>
                    <div>
                      <label style={styles.label}>Ubicación</label>
                      <input
                        type="text"
                        value={form.ubicacion}
                        onChange={(e) =>
                          setForm({ ...form, ubicacion: e.target.value })
                        }
                        style={styles.input}
                        placeholder="Ej: Estante A"
                      />
                    </div>
                    <div style={{ gridColumn: 'span 2' }}>
                      <label style={styles.label}>Descripción</label>
                      <input
                        type="text"
                        value={form.descripcion}
                        onChange={(e) =>
                          setForm({ ...form, descripcion: e.target.value })
                        }
                        style={styles.input}
                        placeholder="Descripción del item..."
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    style={{
                      width: '100%',
                      padding: '12px',
                      background: '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: '700',
                      cursor: 'pointer',
                    }}
                  >
                    💾 Agregar Item
                  </button>
                </form>
              </div>
            )}

            {/* Filtros avanzados */}
            <div
              style={{
                display: 'flex',
                gap: '12px',
                marginBottom: '20px',
                flexWrap: 'wrap',
              }}
            >
              <input
                type="text"
                placeholder="🔍 Buscar por nombre o código..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                style={{ ...styles.input, flex: 1, minWidth: '200px' }}
              />
              <select
                value={categoriaFiltro}
                onChange={(e) => setCategoriaFiltro(e.target.value)}
                style={{ ...styles.input, width: '150px' }}
              >
                <option value="">Todas las categorías</option>
                {categorias.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <select
                value={stockFiltro}
                onChange={(e) => setStockFiltro(e.target.value)}
                style={{ ...styles.input, width: '150px' }}
              >
                <option value="todos">📦 Todos los stocks</option>
                <option value="bajo">⚠️ Stock bajo</option>
                <option value="critico">❌ Stock crítico</option>
                <option value="optimo">✅ Stock óptimo</option>
              </select>
              <span
                style={{
                  fontSize: '12px',
                  color: '#6b7280',
                  alignSelf: 'center',
                }}
              >
                {inventarioFiltrado.length} items mostrados
              </span>
            </div>

            {/* Lista de items */}
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
            >
              {inventarioFiltrado.map((item) => {
                const bajStock = (item.stock || 0) <= (item.stockMinimo || 5);
                const critico = (item.stock || 0) === 0;
                const isEditando = editando === item.id;

                return (
                  <div
                    key={item.id}
                    style={{
                      ...styles.card,
                      border: `2px solid ${
                        critico ? '#ef4444' : bajStock ? '#f59e0b' : '#e5e7eb'
                      }`,
                      background: critico
                        ? '#fef2f2'
                        : bajStock
                        ? '#fffbeb'
                        : 'white',
                      marginBottom: '0',
                    }}
                  >
                    {isEditando ? (
                      <div>
                        <h4
                          style={{
                            fontWeight: 'bold',
                            color: '#0369a1',
                            marginBottom: '12px',
                          }}
                        >
                          ✏️ Editando: {item.nombre}
                        </h4>
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: '12px',
                            marginBottom: '12px',
                          }}
                        >
                          <div>
                            <label style={styles.label}>Nombre</label>
                            <input
                              type="text"
                              value={formEdit.nombre || ''}
                              onChange={(e) =>
                                setFormEdit({
                                  ...formEdit,
                                  nombre: e.target.value,
                                })
                              }
                              style={styles.input}
                            />
                          </div>
                          <div>
                            <label style={styles.label}>
                              🏷️ Código Interno
                            </label>
                            <input
                              type="text"
                              value={formEdit.codigoInterno || ''}
                              onChange={(e) =>
                                setFormEdit({
                                  ...formEdit,
                                  codigoInterno: e.target.value,
                                })
                              }
                              style={styles.input}
                            />
                          </div>
                          <div>
                            <label style={styles.label}>Categoría</label>
                            <select
                              value={formEdit.categoria || ''}
                              onChange={(e) =>
                                setFormEdit({
                                  ...formEdit,
                                  categoria: e.target.value,
                                })
                              }
                              style={styles.input}
                            >
                              {categorias.map((c) => (
                                <option key={c} value={c}>
                                  {c}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label style={styles.label}>Stock Mínimo</label>
                            <input
                              type="number"
                              value={formEdit.stockMinimo || 0}
                              onChange={(e) =>
                                setFormEdit({
                                  ...formEdit,
                                  stockMinimo: parseInt(e.target.value) || 0,
                                })
                              }
                              style={styles.input}
                            />
                          </div>
                          <div>
                            <label style={styles.label}>Unidad</label>
                            <input
                              type="text"
                              value={formEdit.unidad || ''}
                              onChange={(e) =>
                                setFormEdit({
                                  ...formEdit,
                                  unidad: e.target.value,
                                })
                              }
                              style={styles.input}
                            />
                          </div>
                          <div>
                            <label style={styles.label}>Ubicación</label>
                            <input
                              type="text"
                              value={formEdit.ubicacion || ''}
                              onChange={(e) =>
                                setFormEdit({
                                  ...formEdit,
                                  ubicacion: e.target.value,
                                })
                              }
                              style={styles.input}
                            />
                          </div>
                          <div style={{ gridColumn: 'span 3' }}>
                            <label style={styles.label}>Descripción</label>
                            <input
                              type="text"
                              value={formEdit.descripcion || ''}
                              onChange={(e) =>
                                setFormEdit({
                                  ...formEdit,
                                  descripcion: e.target.value,
                                })
                              }
                              style={styles.input}
                            />
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button
                            style={{
                              flex: 1,
                              padding: '10px',
                              background: '#10b981',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              fontWeight: '700',
                              cursor: 'pointer',
                            }}
                            onClick={() => guardarEdicion(item.id)}
                          >
                            💾 Guardar
                          </button>
                          <button
                            style={{
                              flex: 1,
                              padding: '10px',
                              background: '#6b7280',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              fontWeight: '700',
                              cursor: 'pointer',
                            }}
                            onClick={() => setEditando(null)}
                          >
                            ✖ Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '10px',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            flex: 1,
                          }}
                        >
                          <span
                            style={{
                              background:
                                catColores[item.categoria] || '#6b7280',
                              color: 'white',
                              padding: '4px 10px',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontWeight: '600',
                            }}
                          >
                            {item.categoria}
                          </span>
                          <div>
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                marginBottom: '2px',
                              }}
                            >
                              <p
                                style={{ fontWeight: '700', fontSize: '15px' }}
                              >
                                {item.nombre}
                              </p>
                              {item.codigoInterno && (
                                <span
                                  style={{
                                    fontSize: '11px',
                                    background: '#fef3c7',
                                    color: '#92400e',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    fontWeight: '600',
                                  }}
                                >
                                  🏷️ {item.codigoInterno}
                                </span>
                              )}
                              {critico && (
                                <span
                                  style={{
                                    fontSize: '11px',
                                    background: '#fee2e2',
                                    color: '#dc2626',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    fontWeight: '600',
                                  }}
                                >
                                  ⚠️ CRÍTICO
                                </span>
                              )}
                            </div>
                            <p style={{ fontSize: '12px', color: '#6b7280' }}>
                              {(item.ubicacion
                                ? '📍 ' + item.ubicacion + ' · '
                                : '') + (item.descripcion || '')}
                            </p>
                          </div>
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            flexWrap: 'wrap',
                          }}
                        >
                          <div style={{ textAlign: 'center' }}>
                            <p
                              style={{
                                fontSize: '11px',
                                color: '#6b7280',
                                marginBottom: '2px',
                              }}
                            >
                              Stock
                            </p>
                            <span
                              style={{
                                background: critico
                                  ? '#fee2e2'
                                  : bajStock
                                  ? '#fee2e2'
                                  : '#d1fae5',
                                color: critico
                                  ? '#dc2626'
                                  : bajStock
                                  ? '#dc2626'
                                  : '#065f46',
                                padding: '4px 14px',
                                borderRadius: '8px',
                                fontWeight: '700',
                                fontSize: '16px',
                              }}
                            >
                              {item.stock || 0} {item.unidad || 'u'}
                            </span>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <p
                              style={{
                                fontSize: '11px',
                                color: '#6b7280',
                                marginBottom: '2px',
                              }}
                            >
                              Mínimo
                            </p>
                            <span
                              style={{
                                background: '#f3f4f6',
                                color: '#374151',
                                padding: '4px 14px',
                                borderRadius: '8px',
                                fontWeight: '600',
                                fontSize: '14px',
                              }}
                            >
                              {item.stockMinimo || 5} {item.unidad || 'u'}
                            </span>
                          </div>
                          <button
                            style={{
                              padding: '8px 12px',
                              background: '#3b82f6',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: '600',
                            }}
                            onClick={() => iniciarEdicion(item)}
                          >
                            ✏️ Editar
                          </button>
                          <button
                            style={{
                              padding: '8px 12px',
                              background: '#10b981',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: '600',
                            }}
                            onClick={() => {
                              setMovModal({ item, tipo: 'entrada' });
                              setCantMov(1);
                              setRespMov(usuario ? usuario.nombre : '');
                              setMotivoMov('');
                            }}
                          >
                            ➕ Entrada
                          </button>
                          <button
                            style={{
                              padding: '8px 12px',
                              background: '#f59e0b',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: '600',
                            }}
                            onClick={() => {
                              setMovModal({ item, tipo: 'salida' });
                              setCantMov(1);
                              setRespMov(usuario ? usuario.nombre : '');
                              setMotivoMov('');
                            }}
                          >
                            ➖ Salida
                          </button>
                          <button
                            style={{
                              padding: '8px 12px',
                              background: '#ef4444',
                              color: 'white',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: '600',
                            }}
                            onClick={() => {
                              if (
                                window.confirm('¿Eliminar ' + item.nombre + '?')
                              )
                                onEliminar(item.id);
                            }}
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Modal de movimiento */}
      {movModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '16px',
              padding: '28px',
              width: '400px',
              maxWidth: '90vw',
            }}
          >
            <h3
              style={{
                fontWeight: 'bold',
                fontSize: '18px',
                marginBottom: '20px',
                color: movModal.tipo === 'entrada' ? '#059669' : '#d97706',
              }}
            >
              {movModal.tipo === 'entrada'
                ? '➕ Entrada de Stock'
                : '➖ Salida de Stock'}
            </h3>
            <p style={{ fontWeight: '600', marginBottom: '4px' }}>
              {movModal.item.nombre}
            </p>
            {movModal.item.codigoInterno && (
              <p
                style={{
                  fontSize: '12px',
                  color: '#6b7280',
                  marginBottom: '16px',
                }}
              >
                🏷️ {movModal.item.codigoInterno}
              </p>
            )}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                marginBottom: '20px',
              }}
            >
              <div>
                <label style={styles.label}>Cantidad</label>
                <input
                  type="number"
                  value={cantMov}
                  onChange={(e) => setCantMov(parseInt(e.target.value) || 1)}
                  style={styles.input}
                  min="1"
                />
              </div>
              <div>
                <label style={styles.label}>Responsable</label>
                <input
                  type="text"
                  value={respMov}
                  onChange={(e) => setRespMov(e.target.value)}
                  style={styles.input}
                />
              </div>
              <div>
                <label style={styles.label}>Motivo</label>
                <input
                  type="text"
                  value={motivoMov}
                  onChange={(e) => setMotivoMov(e.target.value)}
                  style={styles.input}
                  placeholder="Motivo del movimiento..."
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                style={{
                  flex: 1,
                  padding: '12px',
                  background:
                    movModal.tipo === 'entrada' ? '#10b981' : '#f59e0b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '700',
                  cursor: 'pointer',
                }}
                onClick={async () => {
                  if (movModal.tipo === 'entrada') {
                    await onAgregarStock(
                      movModal.item.id,
                      cantMov,
                      respMov,
                      motivoMov
                    );
                  } else {
                    await onDescontar(
                      movModal.item.id,
                      cantMov,
                      respMov,
                      motivoMov
                    );
                  }
                  setMovModal(null);
                }}
              >
                {movModal.tipo === 'entrada'
                  ? '➕ Confirmar Entrada'
                  : '➖ Confirmar Salida'}
              </button>
              <button
                style={{
                  flex: 1,
                  padding: '12px',
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: '700',
                  cursor: 'pointer',
                }}
                onClick={() => setMovModal(null)}
              >
                ✖ Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
