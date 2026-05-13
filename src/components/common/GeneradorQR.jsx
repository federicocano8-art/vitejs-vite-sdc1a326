// src/components/common/GeneradorQR.jsx
import React, { useState } from 'react';
import QRCode from 'qrcode.react';
import { styles } from '../../styles/globalStyles';

function GeneradorQR({ itemId, itemNombre, tipo }) {
  const [mostrar, setMostrar] = useState(false);

  // Generar URL única para el item (puede ser una ruta interna)
  const url = `${window.location.origin}/item/${tipo}/${itemId}`;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head><title>QR ${itemNombre}</title></head>
        <body style="display:flex; justify-content:center; align-items:center; height:100vh; flex-direction:column;">
          <div style="text-align:center;">
            <img src="${document
              .getElementById('qr-code-img')
              ?.toDataURL()}" style="width:200px; height:200px;" />
            <p><strong>${itemNombre}</strong></p>
            <p>${tipo.toUpperCase()} #${itemId.slice(-6)}</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <>
      <button
        onClick={() => setMostrar(!mostrar)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: 18,
          padding: '0 4px',
        }}
        title="Generar QR"
      >
        📱
      </button>

      {mostrar && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1001,
          }}
          onClick={() => setMostrar(false)}
        >
          <div
            style={{
              background: 'white',
              padding: 30,
              borderRadius: 16,
              textAlign: 'center',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div id="qr-code-img">
              <QRCode value={url} size={200} />
            </div>
            <p style={{ marginTop: 16, fontWeight: 'bold' }}>{itemNombre}</p>
            <p style={{ fontSize: 12, color: '#6b7280' }}>{tipo}</p>
            <div
              style={{
                display: 'flex',
                gap: 10,
                marginTop: 16,
                justifyContent: 'center',
              }}
            >
              <button onClick={handlePrint} style={styles.btnPrimary}>
                🖨️ Imprimir
              </button>
              <button
                onClick={() => setMostrar(false)}
                style={styles.btnSecondary}
              >
                ✖ Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default GeneradorQR;
