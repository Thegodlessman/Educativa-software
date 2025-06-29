// frontend/src/components/AdminSidebar/AdminSidebar.jsx
import React from 'react';
import { Nav } from 'react-bootstrap';
// Añade un ícono para el "Inicio" o "Dashboard"
import { BsHouseDoorFill, BsPeopleFill, BsBuilding, BsBookHalf, BsDiagram3Fill } from 'react-icons/bs';
import './AdminSidebar.css';

const AdminSidebar = ({ activeView, setActiveView }) => {
    const navItems = [
        // Nuevo item de navegación para la bienvenida
        { key: 'welcome', icon: <BsHouseDoorFill />, label: 'Inicio' }, 
        { key: 'users', icon: <BsPeopleFill />, label: 'Usuarios' },
        { key: 'institutions', icon: <BsBuilding />, label: 'Instituciones' },
        { key: 'materials', icon: <BsBookHalf />, label: 'Material de Apoyo' },
        { key: 'roles', icon: <BsDiagram3Fill />, label: 'Roles' },
    ];

    return (
        <div className="admin-sidebar">
            <h4 className="admin-sidebar-title">Panel de Administración</h4>
            <Nav className="flex-column">
                {navItems.map(item => (
                    <Nav.Link
                        key={item.key}
                        active={activeView === item.key}
                        onClick={() => setActiveView(item.key)}
                        className="admin-nav-link"
                    >
                        {item.icon}
                        <span>{item.label}</span>
                    </Nav.Link>
                ))}
            </Nav>
        </div>
    );
};

export default AdminSidebar;