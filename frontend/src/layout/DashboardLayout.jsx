import React from "react";
import NavBar from "../components/Navbar/Navbar";
import Sidebar from "../components/Sidebar/Sidebar";
import { useLocation } from 'react-router-dom';

import "./DashboardLayout.css";

const DashboardLayout = ({ children, setActiveView, activeView }) => {
    const location = useLocation();
    const isAdminRoute = location.pathname.startsWith('/admin');

    return (
        <>
            <NavBar />
            <div className="dashboard-container d-flex">
                {/* Renderiza el sidebar de usuario solo si NO es una ruta de admin */}
                {!isAdminRoute && <Sidebar setActiveView={setActiveView} activeView={activeView} />}

                {/* El children será el AdminDashboard (con su propio sidebar) o el ProfilePage */}
                <div className={isAdminRoute ? '' : 'main-content'}>
                    {children}
                </div>
            </div>
        </>
    );
};

export default DashboardLayout;
