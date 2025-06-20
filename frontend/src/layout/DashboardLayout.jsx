import React from "react";
import NavBar from "../components/Navbar/Navbar";
import Sidebar from "../components/Sidebar/Sidebar";

import "./DashboardLayout.css";

const DashboardLayout = ({ children, setActiveView, activeView }) => {
    return (
        <>
            <NavBar />
            <div className="dashboard-container d-flex">
                <Sidebar setActiveView={setActiveView} activeView={activeView} />
                <div className="main-content">{children}</div>
            </div>
        </>
    );
};

export default DashboardLayout;
