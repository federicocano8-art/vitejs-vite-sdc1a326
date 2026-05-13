// src/components/common/Mensajes.jsx
import React, { useState } from 'react';
import { styles } from '../../styles/globalStyles';

function Mensajes({ usuario, onEnviar, mensajes }) {
  const [mostrar, setMostrar] = useState(false);
  const [nuevoMensaje, setNuevoMensaje] = useState({
    titulo: '',
    mensaje: '',
    para: '',
  });
  const [destinatarios, setDestinatarios] = useState([]);

  const mensajesNoLeidos = mensajes.filter(
    (m) => !m.leido && m.para === usuario?.uid
  ).length;

  const handleEnviar = async () => {
    if (!nuevoMensaje.titulo || !nuevoMensaje.mensaje) {
      alert('Completá título y mensaje');
      return;
    }
    await onEnviar({
      ...nuevoMensaje,
      de: usuario?.uid,
      deNombre: usuario?.nombre,
      fecha: new Date().toISOString(),
      leido: false,
    });
    setNuevoMensaje({ titulo: '', mensaje: '', para: '' });
    alert('Mensaje enviado');
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
          position: 'relative',
        }}
      >
        💬
        {mensajesNoLeidos > 0 && (
          <span
            style={{
              position: 'absolute',
              top: -8,
              right: -8,
              background: '#ef4444',
              color: 'white',
              borderRadius: '50%',
              padding: '2px 6px',
              fontSize: 10,
            }}
          >
            {mensajesNoLeidos}
          </span>
        )}
      </button>

      {mostrar && (
        <div
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 500,
            maxWidth: '90vw',
            background: 'white',
            borderRadius: 16,
            boxShadow: '0 20px 35px rgba(0,0,0,0.3)',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              padding: 16,
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
            }}
          >
            <h3>💬 Mensajes</h3>
            <button
              onClick={() => setMostrar(false)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: 20,
                cursor: 'pointer',
              }}
            >
              ✖
            </button>
          </div>
          <div style={{ padding: 16, maxHeight: 400, overflowY: 'auto' }}>
            <h4>Enviar nuevo mensaje</h4>
            <input
              type="text"
              placeholder="Título"
              value={nuevoMensaje.titulo}
              onChange={(e) =>
                setNuevoMensaje({ ...nuevoMensaje, titulo: e.target.value })
              }
              style={styles.input}
            />
            <textarea
              placeholder="Mensaje"
              value={nuevoMensaje.mensaje}
              onChange={(e) =>
                setNuevoMensaje({ ...nuevoMensaje, mensaje: e.target.value })
              }
              style={{ ...styles.input, minHeight: 80, marginTop: 8 }}
            />
            <button
              onClick={handleEnviar}
              style={{ ...styles.btnPrimary, marginTop: 8, width: '100%' }}
            >
              📨 Enviar
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default Mensajes;
