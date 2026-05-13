/* eslint-disable no-unused-vars */
import { useState } from 'react';
import { styles } from '../styles/globalStyles';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';

export default function ReportesAvanzados({
  inventario,
  movimientos,
  vehiculos,
  personal,
  equipos,
  eras,
  checklists,
  bitacora,
}) {
  const [tipoReporte, setTipoReporte] = useState('inventario');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [incluirGraficos, setIncluirGraficos] = useState(true);
  const [generando, setGenerando] = useState(false);

  // Filtrar datos por fecha
  const filtrarPorFecha = (datos, campoFecha = 'creadoEn') => {
    if (!fechaInicio && !fechaFin) return datos;
    return datos.filter((d) => {
      let fecha = d[campoFecha];
      if (fecha?.toDate) fecha = fecha.toDate();
      if (!fecha) return true;
      const fechaObj = new Date(fecha);
      if (fechaInicio && fechaObj < new Date(fechaInicio)) return false;
      if (fechaFin && fechaObj > new Date(fechaFin)) return false;
      return true;
    });
  };

  // Generar reporte de inventario
  const generarReporteInventario = () => {
    const datos = filtrarPorFecha(inventario);
    const stockTotal = datos.reduce((sum, i) => sum + (i.stock || 0), 0);
    const valorEstimado = stockTotal * 100; // Placeholder - valor por unidad

    return {
      titulo: 'Reporte de Inventario',
      subtitulo: `Total de items: ${datos.length} | Stock total: ${stockTotal} unidades | Valor estimado: $${valorEstimado}`,
      columnas: [
        'Código',
        'Nombre',
        'Categoría',
        'Stock',
        'Stock Mínimo',
        'Unidad',
        'Ubicación',
      ],
      datos: datos.map((i) => [
        i.codigoInterno || '-',
        i.nombre,
        i.categoria,
        i.stock || 0,
        i.stockMinimo || 5,
        i.unidad || 'u',
        i.ubicacion || '-',
      ]),
      resumen: {
        'Total Items': datos.length,
        'Stock Total': `${stockTotal} unidades`,
        'Items con Stock Bajo': datos.filter(
          (i) => (i.stock || 0) <= (i.stockMinimo || 5)
        ).length,
        'Items sin Stock': datos.filter((i) => (i.stock || 0) === 0).length,
        Categorías: [...new Set(datos.map((i) => i.categoria))].length,
      },
    };
  };

  // Generar reporte de movimientos
  const generarReporteMovimientos = () => {
    const datos = filtrarPorFecha(movimientos);
    const entradas = datos
      .filter((m) => m.tipo === 'entrada')
      .reduce((sum, m) => sum + (m.cantidad || 0), 0);
    const salidas = datos
      .filter((m) => m.tipo === 'salida')
      .reduce((sum, m) => sum + (m.cantidad || 0), 0);

    return {
      titulo: 'Reporte de Movimientos',
      subtitulo: `Período: ${fechaInicio || 'Todas'} a ${
        fechaFin || 'hoy'
      } | Balance: ${entradas - salidas}`,
      columnas: ['Fecha', 'Tipo', 'Item', 'Cantidad', 'Responsable', 'Motivo'],
      datos: datos.map((m) => [
        m.creadoEn?.toDate ? m.creadoEn.toDate().toLocaleDateString() : '-',
        m.tipo === 'entrada' ? '➕ Entrada' : '➖ Salida',
        m.itemNombre || '-',
        m.cantidad || 0,
        m.responsable || '-',
        m.motivo || '-',
      ]),
      resumen: {
        'Total Movimientos': datos.length,
        'Total Entradas': `${entradas} unidades`,
        'Total Salidas': `${salidas} unidades`,
        Balance: `${entradas - salidas} unidades`,
        'Items más movidos': Object.entries(
          datos.reduce((acc, m) => {
            acc[m.itemNombre] = (acc[m.itemNombre] || 0) + (m.cantidad || 0);
            return acc;
          }, {})
        )
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([nombre, cant]) => `${nombre} (${cant})`)
          .join(', '),
      },
    };
  };

  // Generar reporte de personal
  const generarReportePersonal = () => {
    const datos = filtrarPorFecha(personal, 'fechaIngreso');
    const activos = datos.filter((p) => p.estado === 'activo').length;

    return {
      titulo: 'Reporte de Personal',
      subtitulo: `Total: ${datos.length} miembros | Activos: ${activos}`,
      columnas: [
        'Legajo',
        'Nombre',
        'Apellido',
        'Rol',
        'Teléfono',
        'Email',
        'Estado',
      ],
      datos: datos.map((p) => [
        p.legajo || '-',
        p.nombre,
        p.apellido || '-',
        p.rol,
        p.telefono || '-',
        p.email || '-',
        p.estado === 'activo'
          ? '✅ Activo'
          : p.estado === 'inactivo'
          ? '⏸️ Inactivo'
          : '📋 Licencia',
      ]),
      resumen: {
        'Total Personal': datos.length,
        Activos: activos,
        'Por Rol': Object.entries(
          datos.reduce((acc, p) => {
            acc[p.rol] = (acc[p.rol] || 0) + 1;
            return acc;
          }, {})
        )
          .map(([rol, cant]) => `${rol}: ${cant}`)
          .join(', '),
        'Licencias por vencer': datos.filter((p) => {
          const lic = p.licencia || {};
          if (!lic.vencimiento) return false;
          const dias = Math.ceil(
            (new Date(lic.vencimiento) - new Date()) / (1000 * 60 * 60 * 24)
          );
          return dias <= 60 && dias > 0;
        }).length,
      },
    };
  };

  // Exportar a Excel
  const exportarExcel = (reporte) => {
    const ws = XLSX.utils.aoa_to_sheet([reporte.columnas, ...reporte.datos]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, reporte.titulo);
    XLSX.writeFile(
      wb,
      `${reporte.titulo}_${new Date().toISOString().split('T')[0]}.xlsx`
    );
  };

  // Exportar a PDF
  const exportarPDF = async (reporte) => {
    setGenerando(true);

    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '0';
    tempDiv.style.backgroundColor = 'white';
    tempDiv.style.padding = '20px';
    tempDiv.style.width = '800px';
    tempDiv.style.fontFamily = 'Arial, sans-serif';

    tempDiv.innerHTML = `
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #1e3a5f;">${reporte.titulo}</h1>
        <p style="color: #6b7280;">${reporte.subtitulo}</p>
        <p style="color: #9ca3af; font-size: 12px;">Generado: ${new Date().toLocaleString()}</p>
      </div>
      
      <div style="margin-bottom: 20px; background: #f3f4f6; padding: 12px; border-radius: 8px;">
        <h3 style="margin-bottom: 8px;">📊 Resumen Ejecutivo</h3>
        ${Object.entries(reporte.resumen)
          .map(
            ([key, value]) =>
              `<p style="margin: 4px 0;"><strong>${key}:</strong> ${value}</p>`
          )
          .join('')}
      </div>
      
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background: #1e3a5f; color: white;">
            ${reporte.columnas
              .map(
                (col) =>
                  `<th style="border: 1px solid #ddd; padding: 8px; text-align: left;">${col}</th>`
              )
              .join('')}
          </tr>
        </thead>
        <tbody>
          ${reporte.datos
            .slice(0, 50)
            .map(
              (row) => `
            <tr>
              ${row
                .map(
                  (cell) =>
                    `<td style="border: 1px solid #ddd; padding: 8px;">${cell}</td>`
                )
                .join('')}
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
      ${
        reporte.datos.length > 50
          ? `<p style="margin-top: 12px; color: #6b7280;">* Mostrando 50 de ${reporte.datos.length} registros. Exporte a Excel para ver todos.</p>`
          : ''
      }
    `;

    document.body.appendChild(tempDiv);

    const canvas = await html2canvas(tempDiv, {
      scale: 2,
      backgroundColor: '#ffffff',
    });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const imgHeight = (canvas.height * pageWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, imgHeight);
    pdf.save(`${reporte.titulo}_${new Date().toISOString().split('T')[0]}.pdf`);

    document.body.removeChild(tempDiv);
    setGenerando(false);
  };

  const reportes = {
    inventario: generarReporteInventario(),
    movimientos: generarReporteMovimientos(),
    personal: generarReportePersonal(),
    vehiculos: {
      titulo: 'Reporte de Vehículos',
      columnas: ['Nombre', 'Tipo', 'Patente', 'Estado', 'VTV'],
      datos: vehiculos.map((v) => [
        v.nombre,
        v.tipo,
        v.patente || '-',
        v.estado,
        v.vtv?.vencimiento || '-',
      ]),
      resumen: {},
    },
    equipos: {
      titulo: 'Reporte de Equipos',
      columnas: ['Nombre', 'Tipo', 'Serial', 'Estado', 'Vencimiento'],
      datos: equipos.map((e) => [
        e.nombre,
        e.tipo || '-',
        e.serial || '-',
        e.estado,
        e.vencimiento || '-',
      ]),
      resumen: {},
    },
    eras: {
      titulo: 'Reporte de ERAs',
      columnas: ['Marca', 'Modelo', 'Serial', 'Presión', 'Estado'],
      datos: eras.map((e) => [
        e.marca,
        e.modelo,
        e.serial,
        `${e.presion} bar`,
        e.estado,
      ]),
      resumen: {},
    },
    checklists: {
      titulo: 'Reporte de Checklists',
      columnas: ['Fecha', 'Vehículo', 'Tipo', 'Resultado', 'Usuario'],
      datos: checklists.map((c) => [
        c.fecha || '-',
        c.vehiculoNombre,
        c.tipo,
        c.resultado === 'ok' ? '✅ Aprobado' : '⚠️ Con novedades',
        c.usuario || '-',
      ]),
      resumen: {},
    },
    bitacora: {
      titulo: 'Reporte de Bitácora',
      columnas: ['Fecha', 'Título', 'Tipo', 'Entidad'],
      datos: bitacora.map((b) => [
        b.fecha || '-',
        b.titulo,
        b.tipo,
        b.entidadNombre || '-',
      ]),
      resumen: {},
    },
  };

  const reporteActual = reportes[tipoReporte];

  return (
    <div>
      <h2 style={{ ...styles.pageTitle, marginBottom: '24px' }}>
        📊 Reportes Avanzados
      </h2>

      <div style={{ ...styles.card, marginBottom: '24px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '16px',
            marginBottom: '20px',
          }}
        >
          <div>
            <label style={styles.label}>Tipo de Reporte</label>
            <select
              value={tipoReporte}
              onChange={(e) => setTipoReporte(e.target.value)}
              style={styles.input}
            >
              <option value="inventario">📦 Inventario</option>
              <option value="movimientos">🔄 Movimientos</option>
              <option value="personal">👥 Personal</option>
              <option value="vehiculos">🚛 Vehículos</option>
              <option value="equipos">🧯 Equipos</option>
              <option value="eras">🎽 ERAs</option>
              <option value="checklists">📋 Checklists</option>
              <option value="bitacora">📝 Bitácora</option>
            </select>
          </div>
          <div>
            <label style={styles.label}>Fecha Desde</label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              style={styles.input}
            />
          </div>
          <div>
            <label style={styles.label}>Fecha Hasta</label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              style={styles.input}
            />
          </div>
          <div>
            <label style={styles.label}>&nbsp;</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => exportarExcel(reporteActual)}
                style={{ ...styles.btnPrimary, background: '#10b981' }}
              >
                📊 Exportar Excel
              </button>
              <button
                onClick={() => exportarPDF(reporteActual)}
                disabled={generando}
                style={{ ...styles.btnPrimary, background: '#dc2626' }}
              >
                {generando ? '⏳ Generando...' : '📄 Exportar PDF'}
              </button>
            </div>
          </div>
        </div>

        {/* Vista previa del reporte */}
        <div style={{ overflowX: 'auto' }}>
          <h3 style={styles.cardTitle}>{reporteActual.titulo}</h3>
          <p
            style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}
          >
            {reporteActual.subtitulo ||
              `Total registros: ${reporteActual.datos.length}`}
          </p>

          {Object.keys(reporteActual.resumen).length > 0 && (
            <div
              style={{
                background: '#f3f4f6',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '16px',
              }}
            >
              <h4 style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                📊 Resumen
              </h4>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: '8px',
                }}
              >
                {Object.entries(reporteActual.resumen).map(([key, value]) => (
                  <div key={key}>
                    <strong>{key}:</strong> {value}
                  </div>
                ))}
              </div>
            </div>
          )}

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#1e3a5f', color: 'white' }}>
                {reporteActual.columnas.map((col) => (
                  <th
                    key={col}
                    style={{
                      border: '1px solid #ddd',
                      padding: '10px',
                      textAlign: 'left',
                    }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reporteActual.datos.slice(0, 20).map((row, idx) => (
                <tr key={idx}>
                  {row.map((cell, cellIdx) => (
                    <td
                      key={cellIdx}
                      style={{ border: '1px solid #ddd', padding: '8px' }}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {reporteActual.datos.length > 20 && (
            <p
              style={{
                textAlign: 'center',
                marginTop: '12px',
                fontSize: '12px',
                color: '#6b7280',
              }}
            >
              Mostrando 20 de {reporteActual.datos.length} registros. Exporte a
              Excel o PDF para ver el reporte completo.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
