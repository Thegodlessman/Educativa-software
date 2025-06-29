import React, { useState, useEffect, useCallback } from 'react';
import { Table, Spinner, Alert } from 'react-bootstrap';
import axios from 'axios';
import { notifyError } from '../../utils/notify';

const RoleManagement = () => {
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchRoles = useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}api/admin/roles`, { headers: { Authorization: `Bearer ${token}` } });
            setRoles(res.data || []);
        } catch (error) {
            notifyError("No se pudieron cargar los roles.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRoles();
    }, [fetchRoles]);

    if (loading) return <Spinner animation="border" />;

    return (
        <div>
            <h2>Roles del Sistema</h2>
            <p className="text-muted">Esta es una vista de solo lectura de los roles configurados en el sistema.</p>
            <Table striped bordered hover>
                <thead>
                    <tr>
                        <th>Nombre del Rol</th>
                        <th>Descripción</th>
                    </tr>
                </thead>
                <tbody>
                    {roles.length > 0 ? roles.map(role => (
                        <tr key={role.id_rol}>
                            <td>{role.rol_name}</td>
                            <td>{role.rol_descrip}</td>
                        </tr>
                    )) : (
                        <tr>
                            <td colSpan="2">
                                <Alert variant="info">No se encontraron roles.</Alert>
                            </td>
                        </tr>
                    )}
                </tbody>
            </Table>
        </div>
    );
};

export default RoleManagement;