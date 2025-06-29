import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Modal, Form, Spinner, Alert } from 'react-bootstrap';
import axios from 'axios';
import { notifySuccess, notifyError } from '../../utils/notify';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    // Usamos useCallback para evitar que la función se recree en cada render
    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            
            // Hacemos las llamadas a la API en paralelo para más eficiencia
            const [usersRes, rolesRes] = await Promise.all([
                axios.get(`${import.meta.env.VITE_BACKEND_URL}api/admin/users`, config),
                axios.get(`${import.meta.env.VITE_BACKEND_URL}api/admin/roles`, config)
            ]);

            if (Array.isArray(usersRes.data)) {
                setUsers(usersRes.data);
            } else {
                setUsers([]);
                console.error("La API de usuarios no devolvió un array:", usersRes.data);
                notifyError('Error: La respuesta de usuarios no tiene el formato esperado.');
            }
            
            if (Array.isArray(rolesRes.data)) {
                setRoles(rolesRes.data);
            } else {
                setRoles([]);
                notifyError('Error: La respuesta de roles no tiene el formato esperado.');
            }

        } catch (error) {
            notifyError('No se pudieron cargar los datos del administrador.');
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleEdit = (user) => {
        setCurrentUser({ ...user, active_role: user.id_rol });
        setShowModal(true);
    };

    const handleDelete = async (userId) => {
        if (window.confirm('¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer.')) {
            try {
                const token = localStorage.getItem('token');
                await axios.delete(`${import.meta.env.VITE_BACKEND_URL}api/admin/users/${userId}`, { headers: { Authorization: `Bearer ${token}` } });
                notifySuccess('Usuario eliminado con éxito.');
                fetchData();
            } catch (error) {
                notifyError(error.response?.data?.message || 'Error al eliminar el usuario.');
            }
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!currentUser) return;
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${import.meta.env.VITE_BACKEND_URL}api/admin/users/${currentUser.id_user}`, currentUser, { headers: { Authorization: `Bearer ${token}` } });
            notifySuccess('Usuario actualizado.');
            setShowModal(false);
            fetchData();
        } catch (error) {
            notifyError('Error al guardar los cambios.');
        }
    };
    
    const handleChange = (e) => {
        setCurrentUser(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    if (loading) {
        return <div className="text-center"><Spinner animation="border" /></div>;
    }

    return (
        <div>
            <h2>Gestión de Usuarios</h2>
            <Table striped bordered hover responsive>
                <thead>
                    <tr>
                        <th>Nombre</th>
                        <th>Apellido</th>
                        <th>Email</th>
                        <th>Cédula</th>
                        <th>Rol</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(user => (
                        <tr key={user.id_user}>
                            <td>{user.user_name}</td>
                            <td>{user.user_lastname}</td>
                            <td>{user.user_email}</td>
                            <td>{user.user_ced}</td>
                            <td>{user.rol_name}</td>
                            <td>
                                <Button variant="primary" size="sm" onClick={() => handleEdit(user)}>Editar</Button>{' '}
                                <Button variant="danger" size="sm" onClick={() => handleDelete(user.id_user)}>Eliminar</Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>

            {/* Modal para editar usuario */}
            <Modal show={showModal} onHide={() => setShowModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Editar Usuario</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {currentUser && (
                        <Form onSubmit={handleSave}>
                            <Form.Group className="mb-3">
                                <Form.Label>Nombre</Form.Label>
                                <Form.Control type="text" name="user_name" value={currentUser.user_name} onChange={handleChange} />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Apellido</Form.Label>
                                <Form.Control type="text" name="user_lastname" value={currentUser.user_lastname} onChange={handleChange} />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Rol</Form.Label>
                                <Form.Select name="active_role" value={currentUser.id_rol} onChange={handleChange}>
                                    {roles.map(role => (
                                        <option key={role.id_rol} value={role.id_rol}>{role.rol_name}</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                            <Button variant="primary" type="submit">Guardar Cambios</Button>
                        </Form>
                    )}
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default UserManagement;