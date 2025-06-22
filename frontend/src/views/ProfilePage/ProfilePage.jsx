import React, { useEffect, useState } from "react";
import DashboardLayout from "../../layout/DashboardLayout.jsx";
import ClassList from "../../components/ClassList/ClassList.jsx";
import SelectRole from "../../components/SelectRole/SelectRole.jsx";
import SettingsSection from "../../components/SettingsSection/SettingsSection.jsx";
import jwt_decode from "jwt-decode";

import "./ProfilePage.css";


function ProfilePage() {
   const [showModal, setShowModal] = useState(false);
   const [userId, setUserId] = useState('');
   const [activeRole, setActiveRole] = useState(null);

   const [activeView, setActiveView] = useState('classes');

   const renderActiveView = () => {
      switch (activeView) {
         case 'settings':
            return <SettingsSection onNavigateBack={() => setActiveView('classes')}/>;
         case 'classes':
         default:
            return <ClassList />;
      }
   };

   useEffect(() => {
      const token = localStorage.getItem('token');
      if (token) {
         try {
            const decoded = jwt_decode(token);
            setUserId(decoded.id_user);
            setActiveRole(decoded.rol_name);
         } catch (err) {
            console.error("Error decoding token:", err);
         }
      }
   }, []);

   useEffect(() => {
      if (activeRole === 'usuario') {
         setShowModal(true);
      }
   }, [activeRole]);

   const handleClose = () => setShowModal(false);

   return (
      <DashboardLayout setActiveView={setActiveView} activeView={activeView}>
         <SelectRole
            show={showModal}
            handleClose={handleClose}
         />
         {renderActiveView()}
      </DashboardLayout>
   );
}

export default ProfilePage; 