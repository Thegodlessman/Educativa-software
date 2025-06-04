import React, { useState, useContext } from 'react';
import './Sidebar.css';
import { FaHome, FaBook, FaCogs, FaSignOutAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { notifySuccess } from '../../utils/notify';
import CreateRoom from '../CreateRoom/CreateRoom';
import { ClassContext } from "../../context/ClassContext";
import jwtDecode from 'jwt-decode';

import JoinRoom from '../JoinRoom/JoinRoom';

function Sidebar() {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const { classes, setToken } = useContext(ClassContext);
  const [role, setRole] = useState('');

  const token = localStorage.getItem('token');
  const decodedToken = token ? jwtDecode(token) : {};

  const isTeacher = decodedToken?.rol_name === 'Profesor' || decodedToken?.rol_name === 'profesor';
  const isStudent = decodedToken?.rol_name === 'Estudiante' || decodedToken?.rol_name === 'estudiante';

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    notifySuccess("Se ha cerrado sesión");
    navigate('/login');
  };

  return (
    <div className="sidebar">
      {/* Sección superior */}
      <div className="sidebar-top">
        <div className="menu-item">
          <FaHome className="icon" />
          <span>Inicio</span>
        </div>
        {isTeacher && (
  <button
    className="btn-create-class btn-hover"
    onClick={() => {
      setRole('teacher');
      setShowModal(true);
    }}
  >
    + Crear nueva clase
  </button>
)}

{isStudent && (
  <button
    className="btn-create-class btn-hover"
    onClick={() => {
      setRole('student');
      setShowModal(true);
    }}
  >
    + Unirse a una clase
  </button>
)}

      </div>

      <div className="sidebar-middle">
        <h4 className="section-title">CLASES</h4>
        {classes.map((clase) => (
          <div key={clase.id_room} className="class-item">
            <FaBook className="icon" />
            <span>{clase.room_grate} "{clase.secc_room.trim()}"</span>
          </div>
        ))}
        <div className='scrollable-section'></div>
      </div>

      <div className="sidebar-bottom">
        <div className="menu-item">
          <FaCogs className="icon" />
          <span>Ajustes</span>
        </div>
        <div className="menu-item" onClick={handleLogout}>
          <FaSignOutAlt className="icon" />
          <span>Cerrar sesión</span>
        </div>
      </div>

      {/* Modal dinámico: por ahora solo CreateRoom, puedes condicionar esto también si creas otro modal para estudiantes */}
      {showModal && role === 'teacher' && (
  <CreateRoom show={showModal} handleClose={() => setShowModal(false)} />
)}

{showModal && role === 'student' && (
  <JoinRoom show={showModal} handleClose={() => setShowModal(false)} />
)}

    </div>
  );
}

export default Sidebar;
