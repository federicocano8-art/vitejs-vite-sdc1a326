/* eslint-disable no-unused-vars */
import { useState, useMemo } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function Personal({
  personal,
  indumentaria,
  styles,
  asignaciones,
  onAgregarPersonal,
  onActualizarPersonal,
  onEliminarPersonal,
  onAgregarIndumentaria,
  onActualizarIndumentaria,
  onEliminarIndumentaria,
  onAsignarItem,
  onDevolverItem,
  usuario,
  bitacoraAgregar,
}) {
  // Estados
  const [form, setForm] = useState({
    nombre: '',
    apellido: '',
    legajo: '',
    rol: 'bombero',
    telefono: '',
    email: '',
    fechaIngreso: '',
    estado: 'activo',
    licencia: { numero: '', categoria: '', vencimiento: '', observaciones: '' },
  });
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editando, setEditando] = useState(null);
  const [formEdit, setFormEdit] = useState({});
  const [busqueda, setBusqueda] = useState('');
  const [expandido, setExpandido] = useState(null);
  const [rolFiltro, setRolFiltro] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('todos');
  const [mostrarDashboard, setMostrarDashboard] = useState(true);
  const [mostrarOpcionesExportacion, setMostrarOpcionesExportacion] =
    useState(false);

  const roles = [
    'bombero',
    'cabo',
    'sargento',
    'teniente',
    'capitan',
    'administrativo',
    'voluntario',
  ];
  const categoriasLicencia = [
    'A',
    'B',
    'C',
    'D',
    'E',
    'F',
    'G',
    'A1',
    'B1',
    'C1',
    'D1',
    'E1',
  ];

  const rolColores = {
    bombero: '#3b82f6',
    cabo: '#8b5cf6',
    sargento: '#f59e0b',
    teniente: '#ef4444',
    capitan: '#dc2626',
    administrativo: '#10b981',
    voluntario: '#6b7280',
  };

  // Estadísticas para dashboard
  const estadisticas = useMemo(() => {
    const totalPersonal = personal.length;
    const activos = personal.filter((p) => p.estado === 'activo').length;
    const inactivos = personal.filter((p) => p.estado === 'inactivo').length;
    const deLicencia = personal.filter((p) => p.estado === 'licencia').length;

    const porRol = {};
    personal.forEach((p) => {
      porRol[p.rol] = (porRol[p.rol] || 0) + 1;
    });
    const topRoles = Object.entries(porRol)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const licenciasVencidas = personal.filter((p) => {
      const lic = p.licencia || {};
      if (!lic.vencimiento) return false;
      const dias = Math.ceil(
        (new Date(lic.vencimiento) - new Date()) / (1000 * 60 * 60 * 24)
      );
      return dias < 0;
    }).length;

    const licenciasProximas = personal.filter((p) => {
      const lic = p.licencia || {};
      if (!lic.vencimiento) return false;
      const dias = Math.ceil(
        (new Date(lic.vencimiento) - new Date()) / (1000 * 60 * 60 * 24)
      );
      return dias >= 0 && dias <= 60;
    }).length;

    const antiguedadPromedio =
      personal.reduce((sum, p) => {
        if (!p.fechaIngreso) return sum;
        const años =
          (new Date() - new Date(p.fechaIngreso)) / (1000 * 60 * 60 * 24 * 365);
        return sum + años;
      }, 0) / (totalPersonal || 1);

    return {
      totalPersonal,
      activos,
      inactivos,
      deLicencia,
      porRol,
      topRoles,
      licenciasVencidas,
      licenciasProximas,
      antiguedadPromedio,
    };
  }, [personal]);

  const personalFiltrado = personal.filter((p) => {
    const matchBusqueda =
      !busqueda ||
      `${p.nombre} ${p.apellido} ${p.legajo}`
        .toLowerCase()
        .includes(busqueda.toLowerCase());
    const matchRol = !rolFiltro || p.rol === rolFiltro;
    const matchEstado = estadoFiltro === 'todos' || p.estado === estadoFiltro;
    return matchBusqueda && matchRol && matchEstado;
  });

  const verificarVencimiento = (fecha) => {
    if (!fecha) return '';
    const dias = Math.ceil(
      (new Date(fecha) - new Date()) / (1000 * 60 * 60 * 24)
    );
    if (dias < 0) return 'vencido';
    if (dias <= 60) return 'proximo';
    return 'ok';
  };

  const iniciarEdicion = (p) => {
    setEditando(p.id);
    setFormEdit({
      nombre: p.nombre || '',
      apellido: p.apellido || '',
      legajo: p.legajo || '',
      rol: p.rol || 'bombero',
      telefono: p.telefono || '',
      email: p.email || '',
      fechaIngreso: p.fechaIngreso || '',
      estado: p.estado || 'activo',
      licencia: p.licencia || {
        numero: '',
        categoria: '',
        vencimiento: '',
        observaciones: '',
      },
    });
  };

  const guardarEdicion = async (pId) => {
    await onActualizarPersonal(pId, formEdit);
    setEditando(null);
    alert('✅ Personal actualizado correctamente');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) return alert('El nombre es obligatorio');
    await onAgregarPersonal(form);
    setForm({
      nombre: '',
      apellido: '',
      legajo: '',
      rol: 'bombero',
      telefono: '',
      email: '',
      fechaIngreso: '',
      estado: 'activo',
      licencia: {
        numero: '',
        categoria: '',
        vencimiento: '',
        observaciones: '',
      },
    });
    setMostrarForm(false);
    alert('✅ Personal agregado');
  };

  // Exportar a PDF multi-página
  const exportarPDFMultiPagina = async (tipo = 'todo') => {
    let elementoId = '';
    let titulo = '';

    if (tipo === 'dashboard') {
      elementoId = 'dashboard-contenido';
      titulo = 'Dashboard_Personal';
    } else if (tipo === 'listado') {
      elementoId = 'listado-contenido';
      titulo = 'Listado_Personal';
    } else {
      elementoId = 'personal-contenido';
      titulo = 'Personal_Completo';
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
            `Filtros: Rol: ${rolFiltro || 'Todos'} | Estado: ${
              estadoFiltro === 'todos' ? 'Todos' : estadoFiltro
            }`,
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
    const totalItems = personalFiltrado.length;
    const totalPaginas = Math.ceil(totalItems / 5);
    alert(
      `📊 Vista previa del reporte:\n\n` +
        `👥 Personal a exportar: ${totalItems}\n` +
        `📄 Páginas aproximadas: ${totalPaginas}\n` +
        `📌 Rol: ${rolFiltro || 'Todos'}\n` +
        `📌 Estado: ${estadoFiltro === 'todos' ? 'Todos' : estadoFiltro}\n\n` +
        `¿Desea continuar con la exportación?`
    );

    if (window.confirm('¿Continuar con la exportación a PDF?')) {
      exportarPDFMultiPagina('listado');
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
          <h2 style={styles.pageTitle}>👥 Personal</h2>
          <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>
            {personal.length} miembros · {estadisticas.activos} activos ·
            Antigüedad promedio: {Math.round(estadisticas.antiguedadPromedio)}{' '}
            años
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', position: 'relative' }}>
          <button
            style={{ ...styles.btnPrimary, background: '#2563eb' }}
            onClick={() => setMostrarDashboard(!mostrarDashboard)}
          >
            {mostrarDashboard ? '📋 Ver Listado' : '📊 Ver Dashboard'}
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
                  📋 Exportar listado filtrado
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

          <button
            style={styles.btnPrimary}
            onClick={() => setMostrarForm(!mostrarForm)}
          >
            {mostrarForm ? '✖ Cancelar' : '➕ Nuevo Personal'}
          </button>
        </div>
      </div>

      {/* Contenedor principal */}
      <div id="personal-contenido">
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
              📊 Dashboard de Personal
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
                  {estadisticas.totalPersonal}
                </div>
                <div style={{ fontSize: '12px', opacity: 0.9 }}>
                  Total Personal
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
                    color: '#bbf7d0',
                  }}
                >
                  {estadisticas.activos}
                </div>
                <div style={{ fontSize: '12px', opacity: 0.9 }}>Activos</div>
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
                  {estadisticas.licenciasProximas}
                </div>
                <div style={{ fontSize: '12px', opacity: 0.9 }}>
                  Licencias por vencer
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
                    color: '#fecaca',
                  }}
                >
                  {estadisticas.licenciasVencidas}
                </div>
                <div style={{ fontSize: '12px', opacity: 0.9 }}>
                  Licencias vencidas
                </div>
              </div>
            </div>

            {/* Estadísticas detalladas */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
                marginBottom: '16px',
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
                  📊 Distribución por Rol
                </h4>
                {estadisticas.topRoles.map(([rol, cantidad]) => (
                  <div
                    key={rol}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '13px',
                      marginBottom: '8px',
                      paddingBottom: '4px',
                      borderBottom: '1px solid rgba(255,255,255,0.2)',
                    }}
                  >
                    <span>{rol}</span>
                    <span style={{ fontWeight: 'bold' }}>{cantidad}</span>
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
                  📊 Distribución por Estado
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
                  <span>✅ Activos</span>
                  <span style={{ fontWeight: 'bold' }}>
                    {estadisticas.activos}
                  </span>
                </div>
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
                  <span>⏸️ Inactivos</span>
                  <span style={{ fontWeight: 'bold' }}>
                    {estadisticas.inactivos}
                  </span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '13px',
                  }}
                >
                  <span>📋 De Licencia</span>
                  <span style={{ fontWeight: 'bold' }}>
                    {estadisticas.deLicencia}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Listado (visible según toggle) */}
        {!mostrarDashboard && (
          <div id="listado-contenido">
            {/* Formulario nuevo personal */}
            {mostrarForm && (
              <div
                style={{
                  ...styles.card,
                  background: '#f0fdf4',
                  border: '2px solid #bbf7d0',
                  marginBottom: '24px',
                }}
              >
                <h3 style={{ ...styles.cardTitle, color: '#15803d' }}>
                  ➕ Nuevo Personal
                </h3>
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
                      <label style={styles.label}>Apellido</label>
                      <input
                        type="text"
                        value={form.apellido}
                        onChange={(e) =>
                          setForm({ ...form, apellido: e.target.value })
                        }
                        style={styles.input}
                      />
                    </div>
                    <div>
                      <label style={styles.label}>Legajo</label>
                      <input
                        type="text"
                        value={form.legajo}
                        onChange={(e) =>
                          setForm({ ...form, legajo: e.target.value })
                        }
                        style={styles.input}
                      />
                    </div>
                    <div>
                      <label style={styles.label}>Rol</label>
                      <select
                        value={form.rol}
                        onChange={(e) =>
                          setForm({ ...form, rol: e.target.value })
                        }
                        style={styles.input}
                      >
                        {roles.map((r) => (
                          <option key={r}>{r}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={styles.label}>Teléfono</label>
                      <input
                        type="text"
                        value={form.telefono}
                        onChange={(e) =>
                          setForm({ ...form, telefono: e.target.value })
                        }
                        style={styles.input}
                      />
                    </div>
                    <div>
                      <label style={styles.label}>Email</label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) =>
                          setForm({ ...form, email: e.target.value })
                        }
                        style={styles.input}
                      />
                    </div>
                    <div>
                      <label style={styles.label}>Fecha Ingreso</label>
                      <input
                        type="date"
                        value={form.fechaIngreso}
                        onChange={(e) =>
                          setForm({ ...form, fechaIngreso: e.target.value })
                        }
                        style={styles.input}
                      />
                    </div>
                  </div>

                  {/* Licencia */}
                  <div
                    style={{
                      background: '#dbeafe',
                      border: '1px solid #93c5fd',
                      borderRadius: '10px',
                      padding: '16px',
                      marginBottom: '16px',
                    }}
                  >
                    <h4
                      style={{
                        fontWeight: 'bold',
                        color: '#1e40af',
                        marginBottom: '12px',
                      }}
                    >
                      🪪 Licencia de Conducir
                    </h4>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '12px',
                      }}
                    >
                      <div>
                        <label style={styles.label}>N° Licencia</label>
                        <input
                          type="text"
                          value={form.licencia.numero}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              licencia: {
                                ...form.licencia,
                                numero: e.target.value,
                              },
                            })
                          }
                          style={styles.input}
                        />
                      </div>
                      <div>
                        <label style={styles.label}>Categoría</label>
                        <select
                          value={form.licencia.categoria}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              licencia: {
                                ...form.licencia,
                                categoria: e.target.value,
                              },
                            })
                          }
                          style={styles.input}
                        >
                          <option value="">Sin licencia</option>
                          {categoriasLicencia.map((c) => (
                            <option key={c}>Categoría {c}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label style={styles.label}>Vencimiento</label>
                        <input
                          type="date"
                          value={form.licencia.vencimiento}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              licencia: {
                                ...form.licencia,
                                vencimiento: e.target.value,
                              },
                            })
                          }
                          style={styles.input}
                        />
                      </div>
                      <div style={{ gridColumn: 'span 3' }}>
                        <label style={styles.label}>Observaciones</label>
                        <input
                          type="text"
                          value={form.licencia.observaciones}
                          onChange={(e) =>
                            setForm({
                              ...form,
                              licencia: {
                                ...form.licencia,
                                observaciones: e.target.value,
                              },
                            })
                          }
                          style={styles.input}
                        />
                      </div>
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
                    💾 Agregar Personal
                  </button>
                </form>
              </div>
            )}

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
                placeholder="🔍 Buscar personal..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                style={{ ...styles.input, flex: 1, minWidth: '200px' }}
              />
              <select
                value={rolFiltro}
                onChange={(e) => setRolFiltro(e.target.value)}
                style={{ ...styles.input, width: '150px' }}
              >
                <option value="">📋 Todos los roles</option>
                {roles.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <select
                value={estadoFiltro}
                onChange={(e) => setEstadoFiltro(e.target.value)}
                style={{ ...styles.input, width: '150px' }}
              >
                <option value="todos">📋 Todos los estados</option>
                <option value="activo">✅ Activo</option>
                <option value="inactivo">⏸️ Inactivo</option>
                <option value="licencia">📋 De Licencia</option>
              </select>
              <span
                style={{
                  fontSize: '12px',
                  color: '#6b7280',
                  alignSelf: 'center',
                }}
              >
                {personalFiltrado.length} miembros mostrados
              </span>
            </div>

            {/* Lista de personal */}
            {personalFiltrado.length === 0 ? (
              <div
                style={{ ...styles.card, textAlign: 'center', padding: '60px' }}
              >
                <div style={{ fontSize: '64px', marginBottom: '16px' }}>👥</div>
                <h3 style={{ color: '#6b7280' }}>
                  No hay personal registrado con los filtros seleccionados
                </h3>
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                {personalFiltrado.map((p) => {
                  const isEditando = editando === p.id;
                  const isExpandido = expandido === p.id;
                  const licencia = p.licencia || {};
                  const vencLic = verificarVencimiento(licencia.vencimiento);
                  const licAlerta =
                    vencLic === 'vencido' || vencLic === 'proximo';

                  return (
                    <div
                      key={p.id}
                      style={{
                        ...styles.card,
                        border: `2px solid ${
                          licAlerta
                            ? vencLic === 'vencido'
                              ? '#ef4444'
                              : '#f59e0b'
                            : p.estado === 'activo'
                            ? '#bbf7d0'
                            : '#fecaca'
                        }`,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          cursor: 'pointer',
                        }}
                        onClick={() => setExpandido(isExpandido ? null : p.id)}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                          }}
                        >
                          <div
                            style={{
                              width: '48px',
                              height: '48px',
                              background:
                                'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '22px',
                              color: 'white',
                              fontWeight: 'bold',
                            }}
                          >
                            {(p.nombre || '?')[0].toUpperCase()}
                          </div>
                          <div>
                            <h3
                              style={{
                                fontWeight: 'bold',
                                fontSize: '16px',
                                marginBottom: '2px',
                              }}
                            >
                              {p.nombre} {p.apellido || ''}
                            </h3>
                            <div
                              style={{
                                display: 'flex',
                                gap: '8px',
                                flexWrap: 'wrap',
                              }}
                            >
                              {p.legajo && (
                                <span
                                  style={{ fontSize: '12px', color: '#6b7280' }}
                                >
                                  Leg: {p.legajo}
                                </span>
                              )}
                              {licencia.categoria && (
                                <span
                                  style={{
                                    fontSize: '11px',
                                    background:
                                      vencLic === 'vencido'
                                        ? '#fee2e2'
                                        : vencLic === 'proximo'
                                        ? '#fef3c7'
                                        : '#dbeafe',
                                    color:
                                      vencLic === 'vencido'
                                        ? '#dc2626'
                                        : vencLic === 'proximo'
                                        ? '#92400e'
                                        : '#1e40af',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    fontWeight: '600',
                                  }}
                                >
                                  🪪 Cat. {licencia.categoria}
                                  {vencLic === 'vencido'
                                    ? ' ⚠️ VENCIDA'
                                    : vencLic === 'proximo'
                                    ? ' ⚠️ PRÓXIMA'
                                    : ' ✓'}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            gap: '8px',
                            alignItems: 'center',
                          }}
                        >
                          <span
                            style={{
                              background: rolColores[p.rol] || '#6b7280',
                              color: 'white',
                              padding: '3px 10px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: '700',
                              textTransform: 'uppercase',
                            }}
                          >
                            {p.rol || 'bombero'}
                          </span>
                          <span
                            style={
                              p.estado === 'activo'
                                ? styles.badgeOk
                                : styles.badgeWarn
                            }
                          >
                            {p.estado === 'activo'
                              ? '✓ ACTIVO'
                              : p.estado === 'inactivo'
                              ? '⏸️ INACTIVO'
                              : '📋 LICENCIA'}
                          </span>
                          <span style={{ fontSize: '18px', color: '#6b7280' }}>
                            {isExpandido ? '▲' : '▼'}
                          </span>
                        </div>
                      </div>

                      {isExpandido && (
                        <div
                          style={{
                            marginTop: '20px',
                            borderTop: '1px solid #e5e7eb',
                            paddingTop: '20px',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              gap: '8px',
                              marginBottom: '16px',
                              flexWrap: 'wrap',
                            }}
                          >
                            <button
                              style={{
                                padding: '8px 14px',
                                background: '#3b82f6',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: '600',
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                iniciarEdicion(p);
                              }}
                            >
                              ✏️ Editar
                            </button>
                            <button
                              style={{
                                padding: '8px 14px',
                                background:
                                  p.estado === 'activo' ? '#f59e0b' : '#10b981',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: '600',
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                onActualizarPersonal(p.id, {
                                  estado:
                                    p.estado === 'activo'
                                      ? 'inactivo'
                                      : 'activo',
                                });
                              }}
                            >
                              {p.estado === 'activo'
                                ? '⏸️ Desactivar'
                                : '▶️ Activar'}
                            </button>
                            <button
                              style={{
                                padding: '8px 14px',
                                background: '#ef4444',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: '600',
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm(`¿Eliminar a ${p.nombre}?`))
                                  onEliminarPersonal(p.id);
                              }}
                            >
                              🗑️ Eliminar
                            </button>
                          </div>

                          {isEditando && (
                            <div
                              style={{
                                background: '#f0f9ff',
                                padding: '20px',
                                borderRadius: '12px',
                                border: '2px solid #0ea5e9',
                                marginBottom: '16px',
                              }}
                            >
                              <h4
                                style={{
                                  fontWeight: 'bold',
                                  color: '#0369a1',
                                  marginBottom: '16px',
                                }}
                              >
                                ✏️ Editando: {p.nombre} {p.apellido || ''}
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
                                  <label style={styles.label}>Apellido</label>
                                  <input
                                    type="text"
                                    value={formEdit.apellido || ''}
                                    onChange={(e) =>
                                      setFormEdit({
                                        ...formEdit,
                                        apellido: e.target.value,
                                      })
                                    }
                                    style={styles.input}
                                  />
                                </div>
                                <div>
                                  <label style={styles.label}>Legajo</label>
                                  <input
                                    type="text"
                                    value={formEdit.legajo || ''}
                                    onChange={(e) =>
                                      setFormEdit({
                                        ...formEdit,
                                        legajo: e.target.value,
                                      })
                                    }
                                    style={styles.input}
                                  />
                                </div>
                                <div>
                                  <label style={styles.label}>Rol</label>
                                  <select
                                    value={formEdit.rol || 'bombero'}
                                    onChange={(e) =>
                                      setFormEdit({
                                        ...formEdit,
                                        rol: e.target.value,
                                      })
                                    }
                                    style={styles.input}
                                  >
                                    {roles.map((r) => (
                                      <option key={r}>{r}</option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label style={styles.label}>Teléfono</label>
                                  <input
                                    type="text"
                                    value={formEdit.telefono || ''}
                                    onChange={(e) =>
                                      setFormEdit({
                                        ...formEdit,
                                        telefono: e.target.value,
                                      })
                                    }
                                    style={styles.input}
                                  />
                                </div>
                                <div>
                                  <label style={styles.label}>Email</label>
                                  <input
                                    type="email"
                                    value={formEdit.email || ''}
                                    onChange={(e) =>
                                      setFormEdit({
                                        ...formEdit,
                                        email: e.target.value,
                                      })
                                    }
                                    style={styles.input}
                                  />
                                </div>
                                <div>
                                  <label style={styles.label}>
                                    Fecha Ingreso
                                  </label>
                                  <input
                                    type="date"
                                    value={formEdit.fechaIngreso || ''}
                                    onChange={(e) =>
                                      setFormEdit({
                                        ...formEdit,
                                        fechaIngreso: e.target.value,
                                      })
                                    }
                                    style={styles.input}
                                  />
                                </div>
                                <div>
                                  <label style={styles.label}>Estado</label>
                                  <select
                                    value={formEdit.estado || 'activo'}
                                    onChange={(e) =>
                                      setFormEdit({
                                        ...formEdit,
                                        estado: e.target.value,
                                      })
                                    }
                                    style={styles.input}
                                  >
                                    <option value="activo">Activo</option>
                                    <option value="inactivo">Inactivo</option>
                                    <option value="licencia">
                                      De Licencia
                                    </option>
                                  </select>
                                </div>
                              </div>
                              <div
                                style={{
                                  background: '#dbeafe',
                                  borderRadius: '10px',
                                  padding: '14px',
                                  marginBottom: '12px',
                                }}
                              >
                                <h5
                                  style={{
                                    fontWeight: 'bold',
                                    color: '#1e40af',
                                    marginBottom: '10px',
                                  }}
                                >
                                  🪪 Licencia de Conducir
                                </h5>
                                <div
                                  style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(3, 1fr)',
                                    gap: '10px',
                                  }}
                                >
                                  <div>
                                    <label style={styles.label}>
                                      N° Licencia
                                    </label>
                                    <input
                                      type="text"
                                      value={
                                        (formEdit.licencia || {}).numero || ''
                                      }
                                      onChange={(e) =>
                                        setFormEdit({
                                          ...formEdit,
                                          licencia: {
                                            ...(formEdit.licencia || {}),
                                            numero: e.target.value,
                                          },
                                        })
                                      }
                                      style={styles.input}
                                    />
                                  </div>
                                  <div>
                                    <label style={styles.label}>
                                      Categoría
                                    </label>
                                    <select
                                      value={
                                        (formEdit.licencia || {}).categoria ||
                                        ''
                                      }
                                      onChange={(e) =>
                                        setFormEdit({
                                          ...formEdit,
                                          licencia: {
                                            ...(formEdit.licencia || {}),
                                            categoria: e.target.value,
                                          },
                                        })
                                      }
                                      style={styles.input}
                                    >
                                      <option value="">Sin licencia</option>
                                      {categoriasLicencia.map((c) => (
                                        <option key={c}>Categoría {c}</option>
                                      ))}
                                    </select>
                                  </div>
                                  <div>
                                    <label style={styles.label}>
                                      Vencimiento
                                    </label>
                                    <input
                                      type="date"
                                      value={
                                        (formEdit.licencia || {}).vencimiento ||
                                        ''
                                      }
                                      onChange={(e) =>
                                        setFormEdit({
                                          ...formEdit,
                                          licencia: {
                                            ...(formEdit.licencia || {}),
                                            vencimiento: e.target.value,
                                          },
                                        })
                                      }
                                      style={styles.input}
                                    />
                                  </div>
                                  <div style={{ gridColumn: 'span 3' }}>
                                    <label style={styles.label}>
                                      Observaciones
                                    </label>
                                    <input
                                      type="text"
                                      value={
                                        (formEdit.licencia || {})
                                          .observaciones || ''
                                      }
                                      onChange={(e) =>
                                        setFormEdit({
                                          ...formEdit,
                                          licencia: {
                                            ...(formEdit.licencia || {}),
                                            observaciones: e.target.value,
                                          },
                                        })
                                      }
                                      style={styles.input}
                                    />
                                  </div>
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
                                  onClick={() => guardarEdicion(p.id)}
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
                          )}

                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: '1fr 1fr',
                              gap: '16px',
                            }}
                          >
                            <div
                              style={{
                                background: '#f9fafb',
                                padding: '16px',
                                borderRadius: '10px',
                                border: '1px solid #e5e7eb',
                              }}
                            >
                              <h5
                                style={{
                                  fontWeight: 'bold',
                                  color: '#374151',
                                  marginBottom: '10px',
                                }}
                              >
                                👤 Datos Personales
                              </h5>
                              <div
                                style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '6px',
                                }}
                              >
                                {p.telefono && (
                                  <p style={{ fontSize: '13px' }}>
                                    📞 {p.telefono}
                                  </p>
                                )}
                                {p.email && (
                                  <p style={{ fontSize: '13px' }}>
                                    ✉️ {p.email}
                                  </p>
                                )}
                                {p.fechaIngreso && (
                                  <p style={{ fontSize: '13px' }}>
                                    📅 Ingreso: {p.fechaIngreso}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div
                              style={{
                                background:
                                  vencLic === 'vencido'
                                    ? '#fee2e2'
                                    : vencLic === 'proximo'
                                    ? '#fef3c7'
                                    : '#dbeafe',
                                padding: '16px',
                                borderRadius: '10px',
                                border: `1px solid ${
                                  vencLic === 'vencido'
                                    ? '#fecaca'
                                    : vencLic === 'proximo'
                                    ? '#fde68a'
                                    : '#93c5fd'
                                }`,
                              }}
                            >
                              <h5
                                style={{
                                  fontWeight: 'bold',
                                  color:
                                    vencLic === 'vencido'
                                      ? '#dc2626'
                                      : vencLic === 'proximo'
                                      ? '#92400e'
                                      : '#1e40af',
                                  marginBottom: '10px',
                                }}
                              >
                                🪪 Licencia de Conducir
                              </h5>
                              {licencia.categoria ? (
                                <div
                                  style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '6px',
                                  }}
                                >
                                  <p
                                    style={{
                                      fontSize: '14px',
                                      fontWeight: '700',
                                    }}
                                  >
                                    Categoría {licencia.categoria}
                                  </p>
                                  {licencia.numero && (
                                    <p style={{ fontSize: '13px' }}>
                                      🔢 N°: {licencia.numero}
                                    </p>
                                  )}
                                  {licencia.vencimiento && (
                                    <p
                                      style={{
                                        fontSize: '13px',
                                        fontWeight: '600',
                                        color:
                                          vencLic === 'vencido'
                                            ? '#dc2626'
                                            : vencLic === 'proximo'
                                            ? '#92400e'
                                            : '#15803d',
                                      }}
                                    >
                                      📅 Vence: {licencia.vencimiento}
                                      {vencLic === 'vencido'
                                        ? ' ⚠️ VENCIDA'
                                        : vencLic === 'proximo'
                                        ? ' ⚠️ PRÓXIMA'
                                        : ' ✓'}
                                    </p>
                                  )}
                                  {licencia.observaciones && (
                                    <p
                                      style={{
                                        fontSize: '12px',
                                        color: '#6b7280',
                                        fontStyle: 'italic',
                                      }}
                                    >
                                      💬 {licencia.observaciones}
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <p
                                  style={{ fontSize: '13px', color: '#9ca3af' }}
                                >
                                  Sin licencia registrada
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
