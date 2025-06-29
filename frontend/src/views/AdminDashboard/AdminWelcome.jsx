// frontend/src/views/AdminDashboard/AdminWelcome.jsx
import React from 'react';
import { Card, Col, Row } from 'react-bootstrap';
import { BsPeopleFill, BsBuilding, BsBookHalf, BsDiagram3Fill } from 'react-icons/bs';
import './AdminWelcome.css'; 

const AdminWelcome = ({ setActiveView }) => {
    const adminCards = [
        {
            key: 'users',
            icon: <BsPeopleFill size={40} className="card-icon" />,
            title: 'Gestionar Usuarios',
            text: 'Edita, elimina y administra los roles de todos los usuarios del sistema.'
        },
        {
            key: 'institutions',
            icon: <BsBuilding size={40} className="card-icon" />,
            title: 'Gestionar Instituciones',
            text: 'Agrega nuevas instituciones educativas o actualiza la información de las existentes.'
        },
        {
            key: 'materials',
            icon: <BsBookHalf size={40} className="card-icon" />,
            title: 'Gestionar Material de Apoyo',
            text: 'Sube, edita o elimina los recursos pedagógicos para los diferentes niveles de riesgo.'
        },
        {
            key: 'roles',
            icon: <BsDiagram3Fill size={40} className="card-icon" />,
            title: 'Ver Roles del Sistema',
            text: 'Consulta la lista de roles disponibles y sus descripciones en la plataforma.'
        }
    ];

    return (
        <div className="admin-welcome-container">
            <header className="admin-welcome-header">
                <h1>Bienvenido al Panel de Administración</h1>
                <p className="lead text-muted">Desde aquí tienes control total sobre los datos maestros de "Educativa".</p>
            </header>
            <Row xs={1} md={2} className="g-4 mt-4">
                {adminCards.map((card) => (
                    <Col key={card.key}>
                        <Card className="h-100 admin-action-card" onClick={() => setActiveView(card.key)}>
                            <Card.Body>
                                <div className="d-flex align-items-center">
                                    <div className="card-icon-wrapper">
                                        {card.icon}
                                    </div>
                                    <div className="ms-3">
                                        <Card.Title as="h5">{card.title}</Card.Title>
                                        <Card.Text>{card.text}</Card.Text>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>
        </div>
    );
};

export default AdminWelcome;