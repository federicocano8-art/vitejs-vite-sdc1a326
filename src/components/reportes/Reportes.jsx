import { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export default function Reportes({
  styles,
  inventario,
  equipos,
  eras,
  personal,
  vehiculos,
  asignaciones,
}) {
  const [tipo, setTipo] = useState('inventario');

  const exportarPDF = () => {
    const doc = new jsPDF();
    doc.text(`Reporte de ${tipo}`, 14, 10);
    let columnas = [],
      filas = [];
    if (tipo === 'inventario') {
      columnas = ['Nombre', 'Categoría', 'Stock', 'Mínimo', 'Ubicación'];
      filas = inventario.map((i) => [
        i.nombre,
        i.categoria,
        i.stock,
        i.stockMinimo,
        i.ubicacion,
      ]);
    } else if (tipo === 'equipos') {
      columnas = ['Nombre', 'Tipo', 'Código', 'Estado', 'Vencimiento'];
      filas = equipos.map((e) => [
        e.nombre,
        e.tipo,
        e.codigoInterno,
        e.estado,
        e.vencimiento,
      ]);
    } else if (tipo === 'eras') {
      columnas = ['Marca', 'Modelo', 'Serial', 'Presión', 'Venc. Tubo'];
      filas = eras.map((e) => [
        e.marca,
        e.modelo,
        e.serial,
        e.presion,
        e.vencimientoTubo,
      ]);
    } else if (tipo === 'personal') {
      columnas = ['Nombre', 'Apellido', 'Rol', 'Teléfono', 'Estado'];
      filas = personal.map((p) => [
        p.nombre,
        p.apellido,
        p.rol,
        p.telefono,
        p.estado,
      ]);
    } else if (tipo === 'vehiculos') {
      columnas = ['Nombre', 'Tipo', 'Patente', 'Estado'];
      filas = vehiculos.map((v) => [v.nombre, v.tipo, v.patente, v.estado]);
    } else if (tipo === 'asignaciones') {
      columnas = ['Personal', 'Prenda', 'Cantidad', 'Fecha', 'Devuelto'];
      filas = asignaciones.map((a) => [
        a.personalNombre,
        a.indumentariaNombre,
        a.cantidad,
        a.fechaAsignacion,
        a.devuelto ? 'Sí' : 'No',
      ]);
    }

    // Verificar que autoTable exista (por si el plugin falla)
    if (typeof doc.autoTable !== 'function') {
      console.error('jspdf-autotable no cargado');
      alert(
        'Error al generar PDF: plugin no disponible. Revisa la instalación.'
      );
      return;
    }

    autoTable(doc, { head: [columnas], body: filas, startY: 20 });
    doc.save(`reporte_${tipo}.pdf`);
  };

  const exportarExcel = () => {
    let data = [];
    if (tipo === 'inventario')
      data = inventario.map((i) => ({
        Nombre: i.nombre,
        Categoría: i.categoria,
        Stock: i.stock,
        StockMínimo: i.stockMinimo,
        Ubicación: i.ubicacion,
      }));
    else if (tipo === 'equipos')
      data = equipos.map((e) => ({
        Nombre: e.nombre,
        Tipo: e.tipo,
        Código: e.codigoInterno,
        Estado: e.estado,
        Vencimiento: e.vencimiento,
      }));
    else if (tipo === 'eras')
      data = eras.map((e) => ({
        Marca: e.marca,
        Modelo: e.modelo,
        Serial: e.serial,
        Presión: e.presion,
        VencimientoTubo: e.vencimientoTubo,
      }));
    else if (tipo === 'personal')
      data = personal.map((p) => ({
        Nombre: p.nombre,
        Apellido: p.apellido,
        Rol: p.rol,
        Teléfono: p.telefono,
        Estado: p.estado,
      }));
    else if (tipo === 'vehiculos')
      data = vehiculos.map((v) => ({
        Nombre: v.nombre,
        Tipo: v.tipo,
        Patente: v.patente,
        Estado: v.estado,
      }));
    else if (tipo === 'asignaciones')
      data = asignaciones.map((a) => ({
        Personal: a.personalNombre,
        Prenda: a.indumentariaNombre,
        Cantidad: a.cantidad,
        Fecha: a.fechaAsignacion,
        Devuelto: a.devuelto ? 'Sí' : 'No',
      }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Reporte');
    XLSX.writeFile(wb, `reporte_${tipo}.xlsx`);
  };

  return (
    <div>
      <h2 style={styles.pageTitle}>📊 Reportes</h2>
      <div style={styles.card}>
        <label style={styles.label}>Tipo de reporte</label>
        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          style={styles.input}
        >
          <option value="inventario">Inventario</option>
          <option value="equipos">Equipos</option>
          <option value="eras">ERAs</option>
          <option value="personal">Personal</option>
          <option value="vehiculos">Vehículos</option>
          <option value="asignaciones">Asignaciones Guardarropa</option>
        </select>
        <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
          <button onClick={exportarPDF} style={styles.btnPrimary}>
            📄 Exportar PDF
          </button>
          <button onClick={exportarExcel} style={styles.btnPrimary}>
            📊 Exportar Excel
          </button>
        </div>
      </div>
    </div>
  );
}
