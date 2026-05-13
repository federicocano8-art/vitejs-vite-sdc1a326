import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { styles } from '../../styles/globalStyles';

const navItems = [
  {
    key: 'dashboard',
    label: '📊 Dashboard',
    icon: '📊',
    roles: ['bombero', 'jefe', 'administrador'],
  },
  {
    key: 'vehiculos',
    label: '🚛 Móviles',
    icon: '🚛',
    roles: ['bombero', 'jefe', 'administrador'],
  },
  {
    key: 'inventario',
    label: '📦 Inventario',
    icon: '📦',
    roles: ['bombero', 'jefe', 'administrador'],
  },
  {
    key: 'panol',
    label: '🧰 Pañol',
    icon: '🧰',
    roles: ['bombero', 'jefe', 'administrador'],
  },
  {
    key: 'equipos',
    label: '🧯 Equipos',
    icon: '🧯',
    roles: ['bombero', 'jefe', 'administrador'],
  },
  {
    key: 'eras',
    label: '🎽 ERAs',
    icon: '🎽',
    roles: ['bombero', 'jefe', 'administrador'],
  },
  {
    key: 'checklists',
    label: '📋 Checklists',
    icon: '📋',
    roles: ['bombero', 'jefe', 'administrador'],
  },
  {
    key: 'personal',
    label: '👥 Personal',
    icon: '👥',
    roles: ['jefe', 'administrador'],
  },
  {
    key: 'guardarropa',
    label: '👕 Guardarropa',
    icon: '👕',
    roles: ['jefe', 'administrador'],
  },
  {
    key: 'bitacora',
    label: '📝 Bitácora',
    icon: '📝',
    roles: ['bombero', 'jefe', 'administrador'],
  },
  {
    key: 'usuarios',
    label: '👑 Usuarios',
    icon: '👑',
    roles: ['administrador'],
  },
  {
    key: 'cuartel',
    label: '🏢 Configuración',
    icon: '🏢',
    roles: ['administrador'],
  },
];

function Sidebar({ vistaActual, setVista }) {
  const { usuario, esAdministrador, esJefe } = useAuth();

  const itemsPermitidos = navItems.filter((item) => {
    if (item.roles.includes('administrador') && esAdministrador) return true;
    if (item.roles.includes('jefe') && esJefe) return true;
    if (item.roles.includes('bombero') && !esAdministrador && !esJefe)
      return true;
    return false;
  });

  return (
    <nav style={styles.nav}>
      {itemsPermitidos.map((item) => (
        <button
          key={item.key}
          style={vistaActual === item.key ? styles.navBtnActive : styles.navBtn}
          onClick={() => setVista(item.key)}
        >
          <span>{item.icon}</span> {item.label}
        </button>
      ))}
    </nav>
  );
}

export default Sidebar;
