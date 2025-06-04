import React, { useEffect, useState } from "react";
import DashboardLayout from "../../layout/DashboardLayout.jsx";
import ClassList from "../../components/ClassList/ClassList.jsx";
import SelectRole from "../../components/SelectRole/SelectRole.jsx";
import jwt_decode from "jwt-decode";
import axios from "axios";
import { notifyError, notifySuccess } from '../../utils/notify.js';

import "./ProfilePage.css";


function ProfilePage() {
   const [showModal, setShowModal] = useState(false);
   const [userId, setUserId] = useState('');
   const [activeRole, setActiveRole] = useState(null);

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
      <DashboardLayout>
         <ClassList />
         <SelectRole
            show={showModal}
            handleClose={handleClose}
         />
      </DashboardLayout>
   );
}

export default ProfilePage; 