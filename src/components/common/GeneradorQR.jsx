import React, { useState, useRef } from 'react';
import QRCode from 'qrcode.react';
import { styles } from '../../styles/styleGlobal'; // ← ruta corregida

function GeneradorQR({ itemId, itemNombre, tipo }) {
  const [mostrar, setMostrar] = useState(false);
  const qrRef = useRef(null);
  const url = `${window.location.origin}/qr/${tipo}/${itemId}`;

  const handlePrint = () => {
    if (!qrRef.current) return;
    const canvas = qrRef.current.querySelector('canvas');
    if (!canvas) return;
    const imgData = canvas.toDataURL();
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head><title>QR ${itemNombre}</title></head>
        <body style="display:flex; justify-content:center; align-items:center; height:100vh; flex-direction:column;">
          <div style="text-align:center;">
            <img src="${imgData}" style="width:200px; height:200px;" />
            <p><strong>${itemNombre}</strong></p>
            <p>${tipo.toUpperCase()} #${itemId.slice(-6)}</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const compartirWhatsApp = () => {
    const mensaje = `📱 *${itemNombre}*\n🔗 Código QR para escanear:\n${url}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <>
      <button
        onClick={() => setMostrar(!mostrar)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: 20,
          padding: '4px 8px',
          borderRadius: 40,
          transition: 'all 0.2s',
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
              borderRadius: 20,
              textAlign: 'center',
              maxWidth: '90vw',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div ref={qrRef}>
              <QRCode value={url} size={220} />
            </div>
            <p style={{ marginTop: 16, fontWeight: 'bold', fontSize: 16 }}>{itemNombre}</p>
            <p style={{ fontSize: 12, color: '#6b7280' }}>{tipo}</p>
            <div style={{ display: 'flex', gap: 12, marginTop: 20, justifyContent: 'center' }}>
              <button onClick={handlePrint} style={styles.btnPrimary}>🖨️ Imprimir</button>
              <button onClick={compartirWhatsApp} style={styles.btnSecondary}>📲 WhatsApp</button>
              <button onClick={() => setMostrar(false)} style={{ ...styles.btnSecondary, background: '#ef4444', color: 'white' }}>✖ Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default GeneradorQR;
