// src/hooks/useExportar.js
import * as XLSX from 'xlsx';

export function useExportar() {
  const exportToExcel = (data, nombreArchivo) => {
    if (!data || data.length === 0) {
      alert('No hay datos para exportar');
      return;
    }

    // Limpiar datos para Excel (eliminar campos complejos)
    const cleanData = data.map((item) => {
      const clean = {};
      Object.keys(item).forEach((key) => {
        if (
          typeof item[key] !== 'object' ||
          item[key] === null ||
          Array.isArray(item[key])
        ) {
          if (Array.isArray(item[key])) {
            clean[key] = JSON.stringify(item[key]);
          } else {
            clean[key] = item[key];
          }
        } else if (item[key]?.toDate) {
          clean[key] = item[key].toDate().toLocaleString();
        } else {
          clean[key] = item[key];
        }
      });
      return clean;
    });

    const ws = XLSX.utils.json_to_sheet(cleanData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Datos');
    XLSX.writeFile(
      wb,
      `${nombreArchivo}_${new Date().toISOString().slice(0, 19)}.xlsx`
    );
  };

  const exportToCSV = (data, nombreArchivo) => {
    if (!data || data.length === 0) {
      alert('No hay datos para exportar');
      return;
    }

    const cleanData = data.map((item) => {
      const clean = {};
      Object.keys(item).forEach((key) => {
        if (typeof item[key] !== 'object' || item[key] === null) {
          clean[key] = item[key];
        } else if (item[key]?.toDate) {
          clean[key] = item[key].toDate().toLocaleString();
        } else {
          clean[key] = JSON.stringify(item[key]);
        }
      });
      return clean;
    });

    const ws = XLSX.utils.json_to_sheet(cleanData);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob(['\uFEFF' + csv], {
      type: 'text/csv;charset=utf-8;',
    });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute(
      'download',
      `${nombreArchivo}_${new Date().toISOString().slice(0, 19)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return { exportToExcel, exportToCSV };
}
