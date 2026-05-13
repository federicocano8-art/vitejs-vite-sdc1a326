/* eslint-disable no-unused-vars */
import { useState, useMemo } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function Guardarropa({
  indumentaria,
  personal,
  styles,
  asignaciones,
  onAgregarIndumentaria,
  onActualizarIndumentaria,
  onEliminarIndumentaria,
  onAsignar,
  onDevolver,
  usuario,
  bitacoraAgregar,
}) {
  const [tipoVista, setTipoVista] = useState('stock');
  const [nuevoItem, setNuevoItem] = useState({
    nombre: '',
    talla: '',
    stock: 0,
    stockMinimo: 5,
    categoria: '',
  });
  const [mostrarForm, setMostrarForm] = useState(false);
  const [personalSeleccionado, setPersonalSeleccionado] = useState('');
  const [itemSeleccionado, setItemSeleccionado] = useState('');
  const [cantidadAsignar, setCantidadAsignar] = useState(1);
  const [editandoItem, setEditandoItem] = useState(null);
  const [formEdit, setFormEdit] = useState({});
  const [busqueda, setBusqueda] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('');
  const [mostrarDashboard, setMostrarDashboard] = useState(true);
  const [mostrarOpcionesExportacion, setMostrarOpcionesExportacion] =
    useState(false);

  const categorias = [
    'Casco',
    'Chaqueta',
    'Botas',
    'Pantalón',
    'Guantes',
    'Arnés',
    'Linterna',
    'Radio',
    'Otro',
  ];
  const tallas = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Única'];

  // Estadísticas para dashboard
  const estadisticas = useMemo(() => {
    const totalPrendas = indumentaria.length;
    const stockTotal = indumentaria.reduce((sum, i) => sum + (i.stock || 0), 0);
    const stockBajo = indumentaria.filter(
      (i) => (i.stock || 0) <= (i.stockMinimo || 5)
    ).length;
    const stockCritico = indumentaria.filter(
      (i) => (i.stock || 0) === 0
    ).length;

    const porCategoria = {};
    indumentaria.forEach((i) => {
      if (i.categoria) {
        porCategoria[i.categoria] =
          (porCategoria[i.categoria] || 0) + (i.stock || 0);
      }
    });
    const topCategorias = Object.entries(porCategoria)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const asignacionesVigentes = asignaciones.filter((a) => !a.devuelto).length;
    const personalConAsignaciones = new Set(
      asignaciones.filter((a) => !a.devuelto).map((a) => a.personalId)
    ).size;

    return {
      totalPrendas,
      stockTotal,
      stockBajo,
      stockCritico,
      topCategorias,
      asignacionesVigentes,
      personalConAsignaciones,
    };
  }, [indumentaria, asignaciones]);

  const verificarStockBajo = (stock, stockMinimo) =>
    (stock || 0) <= (stockMinimo || 5);

  const indumentariaFiltrada = indumentaria.filter((i) => {
    const matchBusqueda =
      !busqueda ||
      i.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      (i.categoria || '').toLowerCase().includes(busqueda.toLowerCase());
    const matchCategoria = !categoriaFiltro || i.categoria === categoriaFiltro;
    return matchBusqueda && matchCategoria;
  });

  const iniciarEdicionItem = (item) => {
    setEditandoItem(item.id);
    setFormEdit({
      nombre: item.nombre,
      talla: item.talla,
      stock: item.stock,
      stockMinimo: item.stockMinimo,
      categoria: item.categoria,
    });
  };

  const guardarEdicionItem = async (itemId) => {
    await onActualizarIndumentaria(itemId, formEdit);
    setEditandoItem(null);
    alert('Prenda actualizada');
  };

  const handleAgregarItem = async () => {
    if (!nuevoItem.nombre) return alert('Nombre obligatorio');
    await onAgregarIndumentaria(nuevoItem);
    setNuevoItem({
      nombre: '',
      talla: '',
      stock: 0,
      stockMinimo: 5,
      categoria: '',
    });
    setMostrarForm(false);
    alert('Prenda/EPP agregado');
  };

  const handleAsignar = async () => {
    if (!personalSeleccionado || !itemSeleccionado)
      return alert('Seleccione personal y prenda');
    const item = indumentaria.find((i) => i.id === itemSeleccionado);
    if (!item || (item.stock || 0) < cantidadAsignar)
      return alert('Stock insuficiente');
    await onAsignar(personalSeleccionado, itemSeleccionado, cantidadAsignar);
    setPersonalSeleccionado('');
    setItemSeleccionado('');
    setCantidadAsignar(1);
    alert('Asignado correctamente');
  };

  const handleDevolver = async (asignacionId) => {
    if (window.confirm('¿Registrar devolución?')) {
      await onDevolver(asignacionId);
      alert('Devolución registrada');
    }
  };

  const asignacionesVigentes = asignaciones.filter(
    (a) => !a.devuelto && !a.fechaDevolucion
  );

  // Exportar a PDF multi-página
  const exportarPDFMultiPagina = async (tipo = 'todo') => {
    let elementoId = '';
    let titulo = '';

    if (tipo === 'dashboard') {
      elementoId = 'dashboard-contenido';
      titulo = 'Dashboard_Guardarropa';
    } else if (tipo === 'listado') {
      elementoId = 'listado-contenido';
      titulo = 'Listado_Guardarropa';
    } else {
      elementoId = 'guardarropa-contenido';
      titulo = 'Guardarropa_Completo';
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
        if (tipo !== 'dashboard' && tipoVista === 'stock') {
          pdf.text(
            `Filtros: Categoría: ${categoriaFiltro || 'Todas'}`,
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
    const totalItems =
      tipoVista === 'stock'
        ? indumentariaFiltrada.length
        : asignacionesVigentes.length;
    const totalPaginas = Math.ceil(totalItems / 10);
    alert(
      `📊 Vista previa del reporte:\n\n` +
        `${
          tipoVista === 'stock'
            ? '👕 Prendas a exportar'
            : '👥 Asignaciones a exportar'
        }: ${totalItems}\n` +
        `📄 Páginas aproximadas: ${totalPaginas}\n` +
        `${
          tipoVista === 'stock'
            ? `📌 Categoría: ${categoriaFiltro || 'Todas'}`
            : ''
        }\n\n` +
        `¿Desea continuar con la exportación?`
    );

    if (window.confirm('¿Continuar con la exportación a PDF?')) {
      exportarPDFMultiPagina(tipoVista === 'stock' ? 'listado' : 'todo');
    }
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
          <h2 style={styles.pageTitle}>👕 Guardarropa / EPP</h2>
          <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
            {indumentaria.length} prendas · {asignacionesVigentes.length}{' '}
            asignaciones vigentes · Stock total: {estadisticas.stockTotal}{' '}
            unidades
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', position: 'relative' }}>
          <button
            style={{ ...styles.btnPrimary, background: '#2563eb' }}
            onClick={() => setMostrarDashboard(!mostrarDashboard)}
          >
            {mostrarDashboard ? '📋 Ver Gestión' : '📊 Ver Dashboard'}
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
                  📋 Exportar{' '}
                  {tipoVista === 'stock'
                    ? 'listado de prendas'
                    : 'asignaciones vigentes'}
                </div>
                <div
                  onClick={() => exportarPDFMultiPagina('todo')}
                  style={{ padding: '10px 16px', cursor: 'pointer' }}
                >
                  📄 Exportar completo
                </div>
              </div>
            )}
          </div>

          <button
            style={styles.btnPrimary}
            onClick={() => setMostrarForm(!mostrarForm)}
          >
            {mostrarForm ? '✖ Cancelar' : '➕ Nueva Prenda'}
          </button>
        </div>
      </div>

      {/* Contenedor principal */}
      <div id="guardarropa-contenido">
        {/* Dashboard */}
        <div id="dashboard-contenido">
          <div
            style={{
              ...styles.card,
              marginBottom: '24px',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
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
              📊 Dashboard de Guardarropa
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
                  {estadisticas.totalPrendas}
                </div>
                <div style={{ fontSize: '12px', opacity: 0.9 }}>
                  Total Prendas
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
                  {estadisticas.stockTotal}
                </div>
                <div style={{ fontSize: '12px', opacity: 0.9 }}>
                  Unidades en Stock
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
                  {estadisticas.stockBajo}
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
                  {estadisticas.stockCritico}
                </div>
                <div style={{ fontSize: '12px', opacity: 0.9 }}>
                  Stock Crítico
                </div>
              </div>
            </div>

            {/* Estadísticas detalladas */}
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
                  📊 Stock por Categoría
                </h4>
                {estadisticas.topCategorias.map(([categoria, cantidad]) => (
                  <div
                    key={categoria}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '13px',
                      marginBottom: '8px',
                      paddingBottom: '4px',
                      borderBottom: '1px solid rgba(255,255,255,0.2)',
                    }}
                  >
                    <span>{categoria}</span>
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
                  👥 Asignaciones
                </h4>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '13px',
                    marginBottom: '8px',
                    paddingBottom: '4px',
                    borderBottom: '1px solid rgba(255,255,255,0.2)',
                  }}
                >
                  <span>📋 Asignaciones vigentes</span>
                  <span style={{ fontWeight: 'bold' }}>
                    {estadisticas.asignacionesVigentes}
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '13px',
                  }}
                >
                  <span>👥 Personal con prendas</span>
                  <span style={{ fontWeight: 'bold' }}>
                    {estadisticas.personalConAsignaciones}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Gestión (visible según toggle) */}
        {!mostrarDashboard && (
          <div id="listado-contenido">
            {/* Vista por pestañas */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              <button
                style={{
                  ...styles.btnPrimary,
                  background: tipoVista === 'stock' ? '#2563eb' : '#e5e7eb',
                  color: tipoVista === 'stock' ? 'white' : 'black',
                }}
                onClick={() => setTipoVista('stock')}
              >
                📦 Stock de Prendas
              </button>
              <button
                style={{
                  ...styles.btnPrimary,
                  background:
                    tipoVista === 'asignaciones' ? '#2563eb' : '#e5e7eb',
                  color: tipoVista === 'asignaciones' ? 'white' : 'black',
                }}
                onClick={() => setTipoVista('asignaciones')}
              >
                👥 Asignaciones a Personal
              </button>
            </div>

            {/* Formulario nueva prenda */}
            {mostrarForm && tipoVista === 'stock' && (
              <div style={styles.card}>
                <h3>Nueva Prenda / EPP</h3>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 12,
                  }}
                >
                  <input
                    placeholder="Nombre"
                    value={nuevoItem.nombre}
                    onChange={(e) =>
                      setNuevoItem({ ...nuevoItem, nombre: e.target.value })
                    }
                    style={styles.input}
                  />
                  <select
                    value={nuevoItem.talla}
                    onChange={(e) =>
                      setNuevoItem({ ...nuevoItem, talla: e.target.value })
                    }
                    style={styles.input}
                  >
                    <option value="">Seleccionar talla</option>
                    {tallas.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    placeholder="Stock"
                    value={nuevoItem.stock}
                    onChange={(e) =>
                      setNuevoItem({
                        ...nuevoItem,
                        stock: parseInt(e.target.value) || 0,
                      })
                    }
                    style={styles.input}
                  />
                  <input
                    type="number"
                    placeholder="Stock Mínimo"
                    value={nuevoItem.stockMinimo}
                    onChange={(e) =>
                      setNuevoItem({
                        ...nuevoItem,
                        stockMinimo: parseInt(e.target.value) || 5,
                      })
                    }
                    style={styles.input}
                  />
                  <select
                    value={nuevoItem.categoria}
                    onChange={(e) =>
                      setNuevoItem({ ...nuevoItem, categoria: e.target.value })
                    }
                    style={styles.input}
                  >
                    <option value="">Seleccionar categoría</option>
                    {categorias.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleAgregarItem}
                  style={{ ...styles.btnPrimary, marginTop: 12, width: '100%' }}
                >
                  Guardar Prenda
                </button>
              </div>
            )}

            {/* Stock de prendas */}
            {tipoVista === 'stock' && (
              <div>
                {/* Filtros */}
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
                    placeholder="🔍 Buscar por nombre o categoría..."
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
                  <span
                    style={{
                      fontSize: '12px',
                      color: '#6b7280',
                      alignSelf: 'center',
                    }}
                  >
                    {indumentariaFiltrada.length} prendas mostradas
                  </span>
                </div>

                {indumentariaFiltrada.length === 0 ? (
                  <div style={styles.card}>
                    <p>
                      No hay prendas registradas con los filtros seleccionados.
                    </p>
                  </div>
                ) : (
                  indumentariaFiltrada.map((item) => {
                    const bajoStock = verificarStockBajo(
                      item.stock,
                      item.stockMinimo
                    );
                    const critico = (item.stock || 0) === 0;
                    const isEditando = editandoItem === item.id;
                    return (
                      <div
                        key={item.id}
                        style={{
                          ...styles.card,
                          borderLeft: bajoStock
                            ? `4px solid ${critico ? '#ef4444' : '#f59e0b'}`
                            : '4px solid #10b981',
                          marginBottom: '12px',
                        }}
                      >
                        {isEditando ? (
                          <div>
                            <input
                              value={formEdit.nombre}
                              onChange={(e) =>
                                setFormEdit({
                                  ...formEdit,
                                  nombre: e.target.value,
                                })
                              }
                              style={styles.input}
                              placeholder="Nombre"
                            />
                            <select
                              value={formEdit.talla}
                              onChange={(e) =>
                                setFormEdit({
                                  ...formEdit,
                                  talla: e.target.value,
                                })
                              }
                              style={styles.input}
                            >
                              <option value="">Seleccionar talla</option>
                              {tallas.map((t) => (
                                <option key={t} value={t}>
                                  {t}
                                </option>
                              ))}
                            </select>
                            <input
                              type="number"
                              value={formEdit.stock}
                              onChange={(e) =>
                                setFormEdit({
                                  ...formEdit,
                                  stock: parseInt(e.target.value) || 0,
                                })
                              }
                              style={styles.input}
                            />
                            <input
                              type="number"
                              value={formEdit.stockMinimo}
                              onChange={(e) =>
                                setFormEdit({
                                  ...formEdit,
                                  stockMinimo: parseInt(e.target.value) || 5,
                                })
                              }
                              style={styles.input}
                            />
                            <select
                              value={formEdit.categoria}
                              onChange={(e) =>
                                setFormEdit({
                                  ...formEdit,
                                  categoria: e.target.value,
                                })
                              }
                              style={styles.input}
                            >
                              <option value="">Seleccionar categoría</option>
                              {categorias.map((c) => (
                                <option key={c} value={c}>
                                  {c}
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={() => guardarEdicionItem(item.id)}
                              style={styles.btnPrimary}
                            >
                              Guardar
                            </button>
                            <button
                              onClick={() => setEditandoItem(null)}
                              style={{
                                ...styles.btnPrimary,
                                background: '#6b7280',
                              }}
                            >
                              Cancelar
                            </button>
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
                            <div>
                              <strong>{item.nombre}</strong> - Talla{' '}
                              {item.talla} - {item.categoria}
                              <div
                                style={{
                                  fontSize: '12px',
                                  color: '#6b7280',
                                  marginTop: '4px',
                                }}
                              >
                                Stock:{' '}
                                <span
                                  style={{
                                    fontWeight: 'bold',
                                    color: critico
                                      ? '#dc2626'
                                      : bajoStock
                                      ? '#f59e0b'
                                      : '#10b981',
                                  }}
                                >
                                  {item.stock || 0}
                                </span>{' '}
                                (Mínimo: {item.stockMinimo || 5})
                              </div>
                            </div>
                            <div>
                              <button
                                onClick={() => iniciarEdicionItem(item)}
                                style={{
                                  marginRight: 8,
                                  background: '#3b82f6',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: 6,
                                  padding: '4px 8px',
                                }}
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm('¿Eliminar?'))
                                    onEliminarIndumentaria(item.id);
                                }}
                                style={{
                                  background: '#ef4444',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: 6,
                                  padding: '4px 8px',
                                }}
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Asignaciones */}
            {tipoVista === 'asignaciones' && (
              <div style={styles.card}>
                <h3>Asignar prenda a personal</h3>
                <div
                  style={{
                    display: 'flex',
                    gap: 12,
                    flexWrap: 'wrap',
                    marginBottom: 20,
                  }}
                >
                  <select
                    value={personalSeleccionado}
                    onChange={(e) => setPersonalSeleccionado(e.target.value)}
                    style={{ ...styles.input, flex: 1 }}
                  >
                    <option value="">Seleccionar personal</option>
                    {personal
                      .filter((p) => p.estado === 'activo')
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nombre} {p.apellido || ''} - {p.rol}
                        </option>
                      ))}
                  </select>
                  <select
                    value={itemSeleccionado}
                    onChange={(e) => setItemSeleccionado(e.target.value)}
                    style={{ ...styles.input, flex: 1 }}
                  >
                    <option value="">Seleccionar prenda</option>
                    {indumentaria
                      .filter((i) => (i.stock || 0) > 0)
                      .map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.nombre} - talla {i.talla} - {i.categoria} (stock{' '}
                          {i.stock})
                        </option>
                      ))}
                  </select>
                  <input
                    type="number"
                    value={cantidadAsignar}
                    onChange={(e) =>
                      setCantidadAsignar(parseInt(e.target.value) || 1)
                    }
                    style={{ width: 80, ...styles.input }}
                    min="1"
                  />
                  <button onClick={handleAsignar} style={styles.btnPrimary}>
                    Asignar
                  </button>
                </div>

                <h3>Asignaciones vigentes ({asignacionesVigentes.length})</h3>
                {asignacionesVigentes.length === 0 ? (
                  <p>No hay asignaciones vigentes.</p>
                ) : (
                  asignacionesVigentes.map((asig) => {
                    const persona = personal.find(
                      (p) => p.id === asig.personalId
                    );
                    const prenda = indumentaria.find(
                      (i) => i.id === asig.indumentariaId
                    );
                    return (
                      <div
                        key={asig.id}
                        style={{
                          borderBottom: '1px solid #ccc',
                          padding: 12,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '10px',
                        }}
                      >
                        <div>
                          <strong>
                            {persona?.nombre} {persona?.apellido || ''}
                          </strong>{' '}
                          - {prenda?.nombre} (talla {prenda?.talla}) -{' '}
                          {prenda?.categoria}
                          <div style={{ fontSize: '12px', color: '#6b7280' }}>
                            Cantidad: {asig.cantidad} - Asignado:{' '}
                            {asig.fechaAsignacion}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDevolver(asig.id)}
                          style={{
                            background: '#f59e0b',
                            color: 'white',
                            border: 'none',
                            borderRadius: 4,
                            padding: '6px 12px',
                            cursor: 'pointer',
                          }}
                        >
                          Devolver
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
