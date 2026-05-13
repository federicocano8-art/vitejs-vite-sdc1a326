// src/components/common/Header.jsx
import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { styles } from '../../styles/globalStyles';

function Header({ vistaActual, setVista, children }) {
  const { usuario, logout } = useAuth();
  const { darkMode, toggleDarkMode } = useTheme();
  const itemsBajoStock = []; // Esto debería venir de props o contexto

  return (
    <header style={styles.header}>
      <div style={styles.headerContent}>
        <div style={styles.logo}>🚒</div>
        <div>
          <h1 style={styles.title}>Bomberos Gestión</h1>
          <p style={styles.subtitle}>
            👤 {usuario?.nombre || usuario?.email} | {usuario?.rol}
          </p>
        </div>
        {itemsBajoStock.length > 0 && (
          <div
            style={{
              marginLeft: 16,
              background: '#fef3c7',
              padding: '8px 14px',
              borderRadius: 8,
              cursor: 'pointer',
            }}
            onClick={() => setVista('inventario')}
          >
            ⚠️ {itemsBajoStock.length} items bajo stock
          </div>
        )}
        <div
          style={{
            marginLeft: 'auto',
            display: 'flex',
            gap: 12,
            alignItems: 'center',
          }}
        >
          {children}
          <button style={styles.btnLogout} onClick={toggleDarkMode}>
            {darkMode ? '☀️' : '🌙'}
          </button>
          <button style={styles.btnLogout} onClick={logout}>
            🚪 Salir
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
