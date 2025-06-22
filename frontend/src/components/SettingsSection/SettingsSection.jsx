import React, { useState, useEffect } from 'react';
import { Tabs, Tab, Card, Form, Button, Spinner, Alert } from 'react-bootstrap';
import { useClass } from '../../context/ClassContext';
import { notifyError, notifySuccess } from '../../utils/notify';
import axios from 'axios';
import './SettingsSection.css';

// --- Sub-componente para la pestaña "Perfil" ---
const UpdateProfileInfo = ({ userData, fetchUserData }) => {
    const [formData, setFormData] = useState({ username: '', email: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (userData) {
            setFormData({ username: userData.username || '', email: userData.email || '' });
        }
    }, [userData]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${import.meta.env.VITE_API_URL}profile/info`, formData, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            notifySuccess('Perfil actualizado con éxito.');
            fetchUserData(); // Refresca los datos en toda la app
        } catch (error) {
            notifyError(error.response?.data?.message || 'Error al actualizar el perfil.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card>
            <Card.Body>
                <Card.Title>Información del Perfil</Card.Title>
                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3" controlId="formUsername">
                        <Form.Label>Nombre de Usuario</Form.Label>
                        <Form.Control type="text" name="username" value={formData.username} onChange={handleChange} required />
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="formEmail">
                        <Form.Label>Correo Electrónico</Form.Label>
                        <Form.Control type="email" name="email" value={formData.email} onChange={handleChange} required />
                    </Form.Group>
                    <Button variant="primary" type="submit" disabled={isSubmitting}>
                        {isSubmitting ? <Spinner as="span" animation="border" size="sm" /> : 'Guardar Cambios'}
                    </Button>
                </Form>
            </Card.Body>
        </Card>
    );
};

// --- Sub-componente para la pestaña "Cuenta" (Contraseña) ---
const UpdatePassword = () => {
    const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => {
        setPasswords({ ...passwords, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (passwords.newPassword !== passwords.confirmPassword) {
            return notifyError('Las nuevas contraseñas no coinciden.');
        }
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const payload = {
                currentPassword: passwords.currentPassword,
                newPassword: passwords.newPassword,
            };
            const response = await axios.put(`${import.meta.env.VITE_API_URL}profile/password`, payload, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            notifySuccess(response.data.message);
            e.target.reset(); // Limpia el formulario
        } catch (error) {
            notifyError(error.response?.data?.message || 'Error al cambiar la contraseña.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card>
            <Card.Body>
                <Card.Title>Cambiar Contraseña</Card.Title>
                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3" controlId="formCurrentPassword">
                        <Form.Label>Contraseña Actual</Form.Label>
                        <Form.Control type="password" name="currentPassword" onChange={handleChange} required />
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="formNewPassword">
                        <Form.Label>Nueva Contraseña</Form.Label>
                        <Form.Control type="password" name="newPassword" onChange={handleChange} required />
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="formConfirmPassword">
                        <Form.Label>Confirmar Nueva Contraseña</Form.Label>
                        <Form.Control type="password" name="confirmPassword" onChange={handleChange} required />
                    </Form.Group>
                    <Button variant="primary" type="submit" disabled={isSubmitting}>
                        {isSubmitting ? <Spinner as="span" animation="border" size="sm" /> : 'Actualizar Contraseña'}
                    </Button>
                </Form>
            </Card.Body>
        </Card>
    );
};

// --- Sub-componente para la pestaña "Roles" ---
const UpdateActiveRole = ({ userData, fetchUserData }) => {
    const [availableRoles, setAvailableRoles] = useState([]);
    const [selectedRole, setSelectedRole] = useState(userData?.active_role_id || '');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchRoles = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get(`${import.meta.env.VITE_API_URL}profile/roles`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const rolesData = Array.isArray(response.data)
                    ? response.data
                    : (response.data && Array.isArray(response.data.roles))
                        ? response.data.roles
                        : [];

                setAvailableRoles(rolesData);
            } catch (error) {
                notifyError('No se pudieron cargar los roles disponibles.');
            }
        };
        if (userData) fetchRoles();
    }, [userData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${import.meta.env.VITE_API_URL}profile/role`, { new_role_id: selectedRole }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            notifySuccess('Rol activo actualizado. Los cambios se reflejarán la próxima vez que inicies sesión.');
            // Opcional: podrías forzar un logout para que el nuevo rol se aplique inmediatamente.
        } catch (error) {
            notifyError(error.response?.data?.message || 'Error al actualizar el rol.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (availableRoles.length <= 1) {
        return <Alert variant="info">No tienes otros roles a los que cambiar.</Alert>;
    }

    return (
        <Card>
            <Card.Body>
                <Card.Title>Cambiar Rol Activo</Card.Title>
                <Form onSubmit={handleSubmit}>
                    <Form.Group className="mb-3">
                        <Form.Label>Selecciona tu rol activo para la próxima sesión</Form.Label>
                        <Form.Select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)}>
                            {availableRoles.map(role => (
                                <option key={role.id_rol} value={role.id_rol}>{role.rol_name}</option>
                            ))}
                        </Form.Select>
                    </Form.Group>
                    <Button variant="primary" type="submit" disabled={isSubmitting}>
                        {isSubmitting ? <Spinner as="span" animation="border" size="sm" /> : 'Guardar Rol'}
                    </Button>
                </Form>
            </Card.Body>
        </Card>
    );
};


// --- Componente Principal de la Página de Ajustes ---
function SettingsSection({ onNavigateBack }) {
    const { userData, fetchUserData } = useClass();

    return (
        <div className="settings-page">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="mb-0">Ajustes de la Cuenta</h2>
                <Button onClick={onNavigateBack} variant="outline-secondary"> Volver a Mis Clases </Button>
            </div>

            <Tabs defaultActiveKey="profile" id="settings-tabs" className="mb-3 nav-tabs-custom">
                <Tab eventKey="profile" title="Perfil">
                    {/* Pasamos los datos y la función de refresco al sub-componente */}
                    <UpdateProfileInfo userData={userData} fetchUserData={fetchUserData} />
                </Tab>
                <Tab eventKey="account" title="Cuenta">
                    <UpdatePassword />
                </Tab>
                <Tab eventKey="roles" title="Roles">
                    <UpdateActiveRole userData={userData} fetchUserData={fetchUserData} />
                </Tab>
            </Tabs>
        </div>
    );
}

export default SettingsSection;