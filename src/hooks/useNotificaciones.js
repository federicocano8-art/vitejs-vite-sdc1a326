import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

export function useNotificaciones({
  inventario,
  vehiculos,
  personal,
  eras,
  equipos,
  checklists,
}) {
  const [notificaciones, setNotificaciones] = useState([]);
  const [notificacionesNoLeidas, setNotificacionesNoLeidas] = useState(0);

  // Generar notificaciones basadas en datos
  const generarNotificaciones = useCallback(() => {
    const nuevas = [];

    // 1. Stock bajo y crítico
    inventario.forEach((item) => {
      const stock = item.stock || 0;
      const min = item.stockMinimo || 5;

      if (stock === 0) {
        nuevas.push({
          id: `stock_critico_${item.id}`,
          tipo: 'critico',
          titulo: 'Stock Crítico',
          mensaje: `${item.nombre} sin stock. ¡Requiere reposición urgente!`,
          modulo: 'inventario',
          itemId: item.id,
          leida: false,
          timestamp: new Date(),
          icono: '❌',
        });
      } else if (stock <= min) {
        nuevas.push({
          id: `stock_bajo_${item.id}`,
          tipo: 'warning',
          titulo: 'Stock Bajo',
          mensaje: `${item.nombre} tiene stock bajo (${stock} ${
            item.unidad || 'u'
          }). Mínimo recomendado: ${min}`,
          modulo: 'inventario',
          itemId: item.id,
          leida: false,
          timestamp: new Date(),
          icono: '⚠️',
        });
      }
    });

    // 2. VTV próximas a vencer
    vehiculos.forEach((vehiculo) => {
      if (vehiculo.vtv?.vencimiento) {
        const dias = Math.ceil(
          (new Date(vehiculo.vtv.vencimiento) - new Date()) /
            (1000 * 60 * 60 * 24)
        );
        if (dias < 0) {
          nuevas.push({
            id: `vtv_vencida_${vehiculo.id}`,
            tipo: 'critico',
            titulo: 'VTV Vencida',
            mensaje: `La VTV de ${
              vehiculo.nombre
            } está vencida desde hace ${Math.abs(dias)} días.`,
            modulo: 'vehiculos',
            itemId: vehiculo.id,
            leida: false,
            timestamp: new Date(),
            icono: '🚛',
          });
        } else if (dias <= 30 && dias > 0) {
          nuevas.push({
            id: `vtv_proxima_${vehiculo.id}`,
            tipo: 'warning',
            titulo: 'VTV Próxima',
            mensaje: `La VTV de ${vehiculo.nombre} vence en ${dias} días.`,
            modulo: 'vehiculos',
            itemId: vehiculo.id,
            leida: false,
            timestamp: new Date(),
            icono: '🚛',
          });
        }
      }
    });

    // 3. Licencias próximas a vencer
    personal.forEach((persona) => {
      const lic = persona.licencia || {};
      if (lic.vencimiento) {
        const dias = Math.ceil(
          (new Date(lic.vencimiento) - new Date()) / (1000 * 60 * 60 * 24)
        );
        if (dias < 0) {
          nuevas.push({
            id: `licencia_vencida_${persona.id}`,
            tipo: 'critico',
            titulo: 'Licencia Vencida',
            mensaje: `La licencia de ${persona.nombre} ${
              persona.apellido || ''
            } (Cat. ${lic.categoria}) está vencida.`,
            modulo: 'personal',
            itemId: persona.id,
            leida: false,
            timestamp: new Date(),
            icono: '🪪',
          });
        } else if (dias <= 60 && dias > 0) {
          nuevas.push({
            id: `licencia_proxima_${persona.id}`,
            tipo: 'warning',
            titulo: 'Licencia Próxima',
            mensaje: `La licencia de ${persona.nombre} ${
              persona.apellido || ''
            } (Cat. ${lic.categoria}) vence en ${dias} días.`,
            modulo: 'personal',
            itemId: persona.id,
            leida: false,
            timestamp: new Date(),
            icono: '🪪',
          });
        }
      }
    });

    // 4. ERAs con presión baja
    eras.forEach((era) => {
      if ((era.presion || 0) < 250 && era.estado === 'activo') {
        nuevas.push({
          id: `era_presion_${era.id}`,
          tipo: 'warning',
          titulo: 'Presión Baja en ERA',
          mensaje: `ERA ${era.serial} tiene presión baja: ${era.presion} bar (recomendado >250 bar).`,
          modulo: 'eras',
          itemId: era.id,
          leida: false,
          timestamp: new Date(),
          icono: '🎽',
        });
      }
    });

    // 5. Vencimientos de tubos y PH en ERAs
    eras.forEach((era) => {
      if (era.vencimientoTubo) {
        const dias = Math.ceil(
          (new Date(era.vencimientoTubo) - new Date()) / (1000 * 60 * 60 * 24)
        );
        if (dias < 0) {
          nuevas.push({
            id: `era_tubo_vencido_${era.id}`,
            tipo: 'critico',
            titulo: 'Tubo de ERA Vencido',
            mensaje: `El tubo de la ERA ${era.serial} está vencido.`,
            modulo: 'eras',
            itemId: era.id,
            leida: false,
            timestamp: new Date(),
            icono: '🎽',
          });
        }
      }
    });

    // 6. Checklists con novedades recientes
    const checklistsRecientes = checklists.filter(
      (c) => c.resultado === 'con_novedades'
    );
    if (checklistsRecientes.length > 0) {
      nuevas.push({
        id: `checklists_novedades`,
        tipo: 'info',
        titulo: 'Checklists con Novedades',
        mensaje: `${checklistsRecientes.length} checklist(s) tienen novedades pendientes de revisión.`,
        modulo: 'checklists',
        leida: false,
        timestamp: new Date(),
        icono: '📋',
      });
    }

    return nuevas;
  }, [inventario, vehiculos, personal, eras, equipos, checklists]);

  // Actualizar notificaciones periódicamente
  useEffect(() => {
    const actualizar = () => {
      const nuevas = generarNotificaciones();
      setNotificaciones((prev) => {
        // Mantener notificaciones existentes que no están en las nuevas
        const idsNuevas = nuevas.map((n) => n.id);
        const mantenidas = prev.filter(
          (n) => !idsNuevas.includes(n.id) && !n.leida
        );
        const combinadas = [...mantenidas, ...nuevas];
        // Eliminar duplicados por id
        const unicas = combinadas.filter(
          (n, index, self) => index === self.findIndex((t) => t.id === n.id)
        );
        return unicas;
      });
    };

    actualizar();
    const interval = setInterval(actualizar, 60000); // Actualizar cada minuto
    return () => clearInterval(interval);
  }, [generarNotificaciones]);

  // Contar no leídas
  useEffect(() => {
    setNotificacionesNoLeidas(notificaciones.filter((n) => !n.leida).length);
  }, [notificaciones]);

  // Marcar como leída
  const marcarComoLeida = (id) => {
    setNotificaciones((prev) =>
      prev.map((n) => (n.id === id ? { ...n, leida: true } : n))
    );
  };

  // Marcar todas como leídas
  const marcarTodasComoLeidas = () => {
    setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: true })));
  };

  // Eliminar notificación
  const eliminarNotificacion = (id) => {
    setNotificaciones((prev) => prev.filter((n) => n.id !== id));
  };

  // Mostrar toast para notificaciones críticas
  useEffect(() => {
    const criticas = notificaciones.filter(
      (n) => n.tipo === 'critico' && !n.leida
    );
    criticas.forEach((critica) => {
      toast.error(critica.mensaje, {
        duration: 5000,
        position: 'top-right',
        icon: critica.icono,
      });
      marcarComoLeida(critica.id);
    });
  }, [notificaciones]);

  return {
    notificaciones,
    notificacionesNoLeidas,
    marcarComoLeida,
    marcarTodasComoLeidas,
    eliminarNotificacion,
  };
}
