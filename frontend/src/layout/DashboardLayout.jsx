import React from "react";
import NavBar from "../components/Navbar/Navbar";
import Sidebar from "../components/Sidebar/Sidebar";

import "./DashboardLayout.css";

const DashboardLayout = ({ children }) => {
    return (
        <>
            <NavBar />
            <div className="dashboard-container d-flex">
                <div className="sidebar">
                    <Sidebar />
                </div>

                <div className="main-content">{children}</div>
            </div>
        </>
    );
};

export default DashboardLayout;
