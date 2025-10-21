import React, { useState } from 'react';
import AdminSidebar from '../../components/AdminSidebar/AdminSidebar';
import UserManagement from './UserManagement';
import InstitutionManagement from './InstitutionManagement';
import MaterialManagement from './MaterialManagement';
import RoleManagement from './RoleManagement';
import AdminWelcome from './AdminWelcome';
import LocationManagement from './LocationManagement';
import Statistics from './Statistics';

import './AdminDashboard.css';

const AdminDashboard = () => {
    const [activeView, setActiveView] = useState('welcome');

    const renderContent = () => {
        switch (activeView) {
            case 'users':
                return <UserManagement />;
            case 'locations':
                return <LocationManagement />;
            case 'statistics':
                return <Statistics />;
            case 'institutions':
                return <InstitutionManagement />;
            case 'materials':
                return <MaterialManagement />;
            case 'roles':
                return <RoleManagement />;
            case 'welcome':
            default:
                return <AdminWelcome setActiveView={setActiveView} />;
        }
    };

    return (
        <div className="admin-dashboard-layout">
            <AdminSidebar activeView={activeView} setActiveView={setActiveView} />
            <main className="admin-main-content">
                {renderContent()}
            </main>
        </div>
    );
};

export default AdminDashboard;