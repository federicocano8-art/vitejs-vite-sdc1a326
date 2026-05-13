// src/components/common/Calendario.jsx
import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { styles } from '../../styles/globalStyles';

const localizer = momentLocalizer(moment);

function CalendarioEventos({ vehiculos, equipos, eras, personal, checklists }) {
  const [eventos, setEventos] = useState([]);
  const [mostrar, setMostrar] = useState(false);

  useEffect(() => {
    const nuevosEventos = [];

    // VTV de vehículos
    vehiculos.forEach((v) => {
      if (v.vtv?.vencimiento) {
        nuevosEventos.push({
          title: `📅 VTV: ${v.nombre}`,
          start: new Date(v.vtv.vencimiento),
          end: new Date(v.vtv.vencimiento),
          allDay: true,
          resource: { tipo: 'vtv', vehiculo: v.nombre, id: v.id },
        });
      }
    });

    // Vencimiento de equipos
    equipos.forEach((e) => {
      if (e.vencimiento) {
        nuevosEventos.push({
          title: `🧯 Vencimiento: ${e.nombre}`,
          start: new Date(e.vencimiento),
          end: new Date(e.vencimiento),
          allDay: true,
          resource: { tipo: 'equipo', equipo: e.nombre, id: e.id },
        });
      }
    });

    // Vencimiento de tubos ERA
    eras.forEach((e) => {
      if (e.vencimientoTubo) {
        nuevosEventos.push({
          title: `🎽 Tubo ERA: ${e.marca} ${e.modelo}`,
          start: new Date(e.vencimientoTubo),
          end: new Date(e.vencimientoTubo),
          allDay: true,
          resource: { tipo: 'era', era: `${e.marca} ${e.modelo}`, id: e.id },
        });
      }
      if (e.pruebaHidraulica) {
        nuevosEventos.push({
          title: `🔧 PH ERA: ${e.marca} ${e.modelo}`,
          start: new Date(e.pruebaHidraulica),
          end: new Date(e.pruebaHidraulica),
          allDay: true,
          resource: { tipo: 'era', era: `${e.marca} ${e.modelo}`, id: e.id },
        });
      }
    });

    // Licencias de personal
    personal.forEach((p) => {
      if (p.licencia?.vencimiento) {
        nuevosEventos.push({
          title: `🪪 Licencia: ${p.nombre} ${p.apellido || ''}`,
          start: new Date(p.licencia.vencimiento),
          end: new Date(p.licencia.vencimiento),
          allDay: true,
          resource: {
            tipo: 'licencia',
            personal: `${p.nombre} ${p.apellido || ''}`,
            id: p.id,
          },
        });
      }
    });

    setEventos(nuevosEventos);
  }, [vehiculos, equipos, eras, personal]);

  const eventStyleGetter = (event) => {
    const hoy = new Date();
    const esVencido = event.start < hoy;
    return {
      style: {
        backgroundColor: esVencido ? '#dc2626' : '#f59e0b',
        borderRadius: '4px',
        opacity: 0.8,
        color: 'white',
        border: 'none',
        display: 'block',
      },
    };
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
        }}
      >
        📅
      </button>

      {mostrar && (
        <div
          style={{
            position: 'fixed',
            top: '5%',
            left: '5%',
            right: '5%',
            bottom: '5%',
            background: 'white',
            borderRadius: 16,
            boxShadow: '0 20px 35px rgba(0,0,0,0.3)',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              padding: 16,
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <h3>📅 Calendario de Vencimientos</h3>
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
          <div style={{ flex: 1, padding: 16 }}>
            <Calendar
              localizer={localizer}
              events={eventos}
              startAccessor="start"
              endAccessor="end"
              style={{ height: '100%' }}
              eventPropGetter={eventStyleGetter}
              messages={{
                next: 'Siguiente',
                previous: 'Anterior',
                today: 'Hoy',
                month: 'Mes',
                week: 'Semana',
                day: 'Día',
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}

export default CalendarioEventos;
