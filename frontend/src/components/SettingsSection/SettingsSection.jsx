import React from 'react';
import { Tabs, Tab, Card, Button } from 'react-bootstrap';
import './SettingsSection.css';
import { BsArrowLeft } from 'react-icons/bs';

// Podríamos crear estos como componentes separados, pero para empezar pueden ser funciones aquí mismo.
const UpdateProfileInfo = () => {
    return (
        <Card>
            <Card.Body>
                <Card.Title>Información del Perfil</Card.Title>
                {/* Aquí iría el formulario para cambiar nombre de usuario, email y foto de perfil */}
                <p>Formulario para cambiar nombre y foto...</p>
            </Card.Body>
        </Card>
    );
};

const UpdatePassword = () => {
    return (
        <Card>
            <Card.Body>
                <Card.Title>Cambiar Contraseña</Card.Title>
                {/* Aquí iría el formulario para la contraseña actual y la nueva */}
                <p>Formulario para cambiar contraseña...</p>
            </Card.Body>
        </Card>
    );
};

const UpdateActiveRole = () => {
    return (
        <Card>
            <Card.Body>
                <Card.Title>Cambiar Rol Activo</Card.Title>
                {/* Aquí iría la lógica para obtener los roles del usuario y permitirle cambiar el activo */}
                <p>Selector para cambiar de rol...</p>
            </Card.Body>
        </Card>
    );
};


function SettingsSection({onNavigateBack}) {
    return (
        <div className="settings-page">
            <div className="d-flex justify-content-between align-items-center mb-4 mt-4">
                <h2 className="mb-0">Ajustes de la Cuenta</h2>
                <Button onClick={onNavigateBack} variant="outline-secondary">
                    <BsArrowLeft /> Volver a Mis Clases
                </Button>
            </div>
            <Tabs defaultActiveKey="profile" id="settings-tabs" className="mb-3 nav-tabs-custom">
                <Tab eventKey="profile" title="Perfil">
                    <UpdateProfileInfo />
                </Tab>
                <Tab eventKey="account" title="Cuenta">
                    <UpdatePassword />
                </Tab>
                <Tab eventKey="roles" title="Roles">
                    <UpdateActiveRole />
                </Tab>
            </Tabs>
        </div>
    );
}

export default SettingsSection;