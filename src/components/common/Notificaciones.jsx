// src/components/common/Notificaciones.jsx
import React, { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function Notificaciones({ inventario, vehiculos, equipos, eras, personal }) {
  const [alertas, setAlertas] = useState([]);
  const [mostrarPanel, setMostrarPanel] = useState(false);

  useEffect(() => {
    const nuevasAlertas = [];

    // Stock bajo
    inventario.forEach((item) => {
      if ((item.stock || 0) <= (item.stockMinimo || 5)) {
        nuevasAlertas.push({
          id: `stock-${item.id}`,
          tipo: 'warning',
          mensaje: `${item.nombre}: stock bajo (${item.stock || 0} ${
            item.unidad || 'u'
          })`,
          leida: false,
          fecha: new Date(),
        });
      }
    });

    // VTV próxima o vencida
    vehiculos.forEach((v) => {
      if (v.vtv?.vencimiento) {
        const dias = Math.ceil(
          (new Date(v.vtv.vencimiento) - new Date()) / (1000 * 60 * 60 * 24)
        );
        if (dias <= 30 && dias > 0) {
          nuevasAlertas.push({
            id: `vtv-${v.id}`,
            tipo: 'warning',
            mensaje: `VTV de ${v.nombre} vence en ${dias} días`,
            leida: false,
            fecha: new Date(),
          });
        } else if (dias <= 0) {
          nuevasAlertas.push({
            id: `vtv-${v.id}`,
            tipo: 'error',
            mensaje: `VTV de ${v.nombre} está vencida`,
            leida: false,
            fecha: new Date(),
          });
        }
      }
    });

    // Equipos vencidos o próximos
    equipos.forEach((e) => {
      if (e.vencimiento) {
        const dias = Math.ceil(
          (new Date(e.vencimiento) - new Date()) / (1000 * 60 * 60 * 24)
        );
        if (dias <= 30 && dias > 0) {
          nuevasAlertas.push({
            id: `equipo-${e.id}`,
            tipo: 'warning',
            mensaje: `${e.nombre} vence en ${dias} días`,
            leida: false,
            fecha: new Date(),
          });
        } else if (dias <= 0) {
          nuevasAlertas.push({
            id: `equipo-${e.id}`,
            tipo: 'error',
            mensaje: `${e.nombre} está vencido`,
            leida: false,
            fecha: new Date(),
          });
        }
      }
    });

    // ERAs vencidas o próximas
    eras.forEach((e) => {
      if (e.vencimientoTubo) {
        const dias = Math.ceil(
          (new Date(e.vencimientoTubo) - new Date()) / (1000 * 60 * 60 * 24)
        );
        if (dias <= 30 && dias > 0) {
          nuevasAlertas.push({
            id: `era-${e.id}`,
            tipo: 'warning',
            mensaje: `Tubo de ERA ${e.marca} ${e.modelo} vence en ${dias} días`,
            leida: false,
            fecha: new Date(),
          });
        } else if (dias <= 0) {
          nuevasAlertas.push({
            id: `era-${e.id}`,
            tipo: 'error',
            mensaje: `Tubo de ERA ${e.marca} ${e.modelo} está vencido`,
            leida: false,
            fecha: new Date(),
          });
        }
      }

      if (e.pruebaHidraulica) {
        const diasPH = Math.ceil(
          (new Date(e.pruebaHidraulica) - new Date()) / (1000 * 60 * 60 * 24)
        );
        if (diasPH <= 30 && diasPH > 0) {
          nuevasAlertas.push({
            id: `era-ph-${e.id}`,
            tipo: 'warning',
            mensaje: `Prueba hidráulica de ERA ${e.marca} ${e.modelo} vence en ${diasPH} días`,
            leida: false,
            fecha: new Date(),
          });
        } else if (diasPH <= 0) {
          nuevasAlertas.push({
            id: `era-ph-${e.id}`,
            tipo: 'error',
            mensaje: `Prueba hidráulica de ERA ${e.marca} ${e.modelo} está vencida`,
            leida: false,
            fecha: new Date(),
          });
        }
      }
    });

    // Licencias de conducir próximas a vencer
    personal.forEach((p) => {
      if (p.licencia?.vencimiento) {
        const dias = Math.ceil(
          (new Date(p.licencia.vencimiento) - new Date()) /
            (1000 * 60 * 60 * 24)
        );
        if (dias <= 60 && dias > 0) {
          nuevasAlertas.push({
            id: `licencia-${p.id}`,
            tipo: 'warning',
            mensaje: `Licencia de ${p.nombre} ${
              p.apellido || ''
            } vence en ${dias} días`,
            leida: false,
            fecha: new Date(),
          });
        } else if (dias <= 0) {
          nuevasAlertas.push({
            id: `licencia-${p.id}`,
            tipo: 'error',
            mensaje: `Licencia de ${p.nombre} ${p.apellido || ''} está vencida`,
            leida: false,
            fecha: new Date(),
          });
        }
      }
    });

    setAlertas(nuevasAlertas);

    // Mostrar notificaciones toast (solo una vez por sesión)
    const mostradas = JSON.parse(
      localStorage.getItem('alertas_mostradas') || '[]'
    );
    nuevasAlertas.forEach((alerta) => {
      if (!mostradas.includes(alerta.id)) {
        if (alerta.tipo === 'error') toast.error(alerta.mensaje);
        else if (alerta.tipo === 'warning') toast.warning(alerta.mensaje);
        else toast.info(alerta.mensaje);
        mostradas.push(alerta.id);
      }
    });
    localStorage.setItem(
      'alertas_mostradas',
      JSON.stringify(mostradas.slice(-50))
    );
  }, [inventario, vehiculos, equipos, eras, personal]);

  const alertasNoLeidas = alertas.filter((a) => !a.leida).length;
  const alertasCriticas = alertas.filter((a) => a.tipo === 'error').length;

  return (
    <>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      <div
        style={{ position: 'relative', marginRight: 16, cursor: 'pointer' }}
        onClick={() => setMostrarPanel(!mostrarPanel)}
      >
        <span style={{ fontSize: 24 }}>🔔</span>
        {alertasNoLeidas > 0 && (
          <span
            style={{
              position: 'absolute',
              top: -8,
              right: -8,
              background: alertasCriticas > 0 ? '#ef4444' : '#f59e0b',
              color: 'white',
              borderRadius: '50%',
              padding: '2px 6px',
              fontSize: 11,
              fontWeight: 'bold',
            }}
          >
            {alertasNoLeidas}
          </span>
        )}
      </div>

      {mostrarPanel && (
        <div
          style={{
            position: 'absolute',
            top: 60,
            right: 20,
            width: 350,
            maxHeight: 400,
            overflowY: 'auto',
            background: 'white',
            borderRadius: 12,
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              padding: 12,
              borderBottom: '1px solid #e5e7eb',
              fontWeight: 'bold',
            }}
          >
            Notificaciones ({alertasNoLeidas} no leídas)
            <button
              style={{
                float: 'right',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
              onClick={() => setMostrarPanel(false)}
            >
              ✖
            </button>
          </div>
          {alertas.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: '#6b7280' }}>
              No hay alertas
            </div>
          ) : (
            alertas.map((alerta) => (
              <div
                key={alerta.id}
                style={{
                  padding: 10,
                  borderBottom: '1px solid #e5e7eb',
                  background:
                    alerta.tipo === 'error'
                      ? '#fef2f2'
                      : alerta.tipo === 'warning'
                      ? '#fffbeb'
                      : 'white',
                }}
              >
                <div style={{ fontSize: 13 }}>{alerta.mensaje}</div>
                <small style={{ fontSize: 10, color: '#6b7280' }}>
                  {alerta.fecha.toLocaleTimeString()}
                </small>
              </div>
            ))
          )}
          <div
            style={{
              padding: 8,
              textAlign: 'center',
              borderTop: '1px solid #e5e7eb',
            }}
          >
            <button
              style={{
                background: 'none',
                border: 'none',
                color: '#2563eb',
                cursor: 'pointer',
              }}
              onClick={() =>
                setAlertas(alertas.map((a) => ({ ...a, leida: true })))
              }
            >
              Marcar todas como leídas
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default Notificaciones;
