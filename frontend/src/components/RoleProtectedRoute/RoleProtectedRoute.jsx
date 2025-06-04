import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import jwt_decode from 'jwt-decode';

const RoleProtectedRoute = ({ children, allowedRoles }) => {
    const token = localStorage.getItem('token');
    let userRole = null;

    if (token) {
        try {
            const decodedToken = jwt_decode(token);
            userRole = decodedToken.rol_name;
        } catch (e) {
            console.error('Error decoding token:', e);
        }
    }

    const location = useLocation();

    return allowedRoles.includes(userRole) ? (
        children
    ) : (
        <Navigate to="/login" state={{ from: location }} replace />
    );
};

export default RoleProtectedRoute;