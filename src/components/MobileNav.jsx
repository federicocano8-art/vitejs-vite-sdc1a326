import { useState } from 'react';

export default function MobileNav({ items, vista, setVista }) {
  const [abierto, setAbierto] = useState(false);

  if (!abierto) {
    return (
      <button
        onClick={() => setAbierto(true)}
        style={{
          position: 'fixed',
          bottom: '16px',
          right: '16px',
          width: '56px',
          height: '56px',
          borderRadius: '28px',
          background: '#2563eb',
          color: 'white',
          border: 'none',
          fontSize: '24px',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          zIndex: 100,
        }}
      >
        ☰
      </button>
    );
  }

  return (
    <>
      <div
        onClick={() => setAbierto(false)}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 200,
        }}
      />
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '280px',
          background: 'white',
          boxShadow: '-2px 0 10px rgba(0,0,0,0.2)',
          zIndex: 201,
          padding: '20px',
          overflowY: 'auto',
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
          <h3 style={{ fontWeight: 'bold' }}>📋 Menú</h3>
          <button
            onClick={() => setAbierto(false)}
            style={{
              background: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '8px 12px',
              cursor: 'pointer',
            }}
          >
            ✖ Cerrar
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {items.map((item) => (
            <button
              key={item.key}
              onClick={() => {
                setVista(item.key);
                setAbierto(false);
              }}
              style={{
                padding: '12px',
                background: vista === item.key ? '#2563eb' : '#f3f4f6',
                color: vista === item.key ? 'white' : '#374151',
                border: 'none',
                borderRadius: '8px',
                textAlign: 'left',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: vista === item.key ? '600' : '400',
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
