import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useClass } from '../../context/ClassContext'; 
import { Spinner } from 'react-bootstrap'; 

const RoleProtectedRoute = ({ allowedRoles }) => {
    const { token, userData, loading, logout } = useClass(); 
    const location = useLocation();

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                width: '100vw',
                position: 'fixed',
                top: 0,
                left: 0,
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                zIndex: 9999
            }}>
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Cargando autenticación...</span>
                </Spinner>
            </div>
        );
    }

    if (!token) {
        alert("no hay token")
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (!userData || !allowedRoles.includes(userData.rol_name)) {
        console.warn(`Acceso denegado para el rol: ${userData ? userData.rol_name : 'No Definido'}. Roles permitidos: ${allowedRoles.join(', ')}`);
        
        logout(); 
        
        // Redirige a una página de "Acceso Denegado" o a la página de inicio
        return <Navigate to="/" state={{ from: location }} replace />;
    }
    return <Outlet />;
};

export default RoleProtectedRoute;