import React from 'react';
import { useAuth } from '../../context/AuthContext';
import Login from '../auth/Login';

function PrivateRoute({ children, rolesPermitidos = [] }) {
  const { usuario, loading, esAdministrador, esJefe } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚒</div>
          <p>Cargando sistema...</p>
        </div>
      </div>
    );
  }

  if (!usuario) {
    return <Login />;
  }

  // Verificar roles si se especificaron
  if (rolesPermitidos.length > 0) {
    let tienePermiso = false;

    if (rolesPermitidos.includes('administrador') && esAdministrador)
      tienePermiso = true;
    if (rolesPermitidos.includes('jefe') && esJefe) tienePermiso = true;
    if (rolesPermitidos.includes('bombero') && !esAdministrador && !esJefe)
      tienePermiso = true;

    if (!tienePermiso) {
      return (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
          }}
        >
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>⛔</div>
            <h2>Acceso Denegado</h2>
            <p>No tenés permisos para ver esta página.</p>
          </div>
        </div>
      );
    }
  }

  return children;
}

export default PrivateRoute;
