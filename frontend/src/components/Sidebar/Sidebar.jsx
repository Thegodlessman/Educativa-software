import React, { useState } from 'react';
import './Sidebar.css';
import { BsPersonFillGear, BsBoxArrowLeft, BsBookFill } from 'react-icons/bs';
import { useClass } from "../../context/ClassContext";
import CreateRoom from '../CreateRoom/CreateRoom';
import JoinRoom from '../JoinRoom/JoinRoom';
import { Spinner } from 'react-bootstrap';
import { Navigate, useNavigate } from 'react-router-dom';

function Sidebar({ setActiveView, activeView }) {
    const { classes, userData, selectClass, selectedRoom, loading, logout } = useClass(); 
    const navigate = useNavigate();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showJoinModal, setShowJoinModal] = useState(false);

    const handleLogout = async (event) => {
      logout()
      navigate('/login')
    }
    if (loading || !userData) {
        return (
            <div className="sidebar sidebar-loading">
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Cargando...</span>
                </Spinner>
            </div>
        );
    }
    
    const isTeacher = userData?.rol_name === 'Profesor';
    const isStudent = userData?.rol_name === 'Estudiante';

    return (
      <div className="sidebar">
        <div className="sidebar-top">
          <div className="quick-actions">
            {isTeacher && (
              <button className="btn-action" onClick={() => setShowCreateModal(true)}>
                + Crear nueva clase
              </button>
            )}
            {isStudent && (
              <button className="btn-action" onClick={() => setShowJoinModal(true)}>
                + Unirse a una clase
              </button>
            )}
          </div>
        </div>

        {/* --- SECCIÓN MEDIA: Lista de Clases (Scrollable) --- */}
        <nav className="sidebar-nav">
          <h4 className="section-title">CLASES</h4>
          <div className="class-list-scrollable">
            {classes.length > 0 ? (
              classes.map((clase) => (
                <div 
                  key={clase.id_room}
                  className={`class-item ${selectedRoom?.id_room === clase.id_room ? 'active' : ''}`}
                  onClick={() => {
                    if(selectClass) selectClass(clase);
                    setActiveView('classes');
                  }}
                >
                  <BsBookFill className="icon" />
                  <span>{clase.room_grate} "{clase.secc_room.trim()}"</span>
                </div>
              ))
            ) : (
              <span className="no-classes-message">Aún no tienes clases.</span>
            )}
          </div>
        </nav>

        {/* --- SECCIÓN INFERIOR: Ajustes y Cerrar Sesión --- */}
        <div className="sidebar-footer">
          <div 
            className={`nav-item ${activeView === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveView('settings')}
          >
            <BsPersonFillGear className="icon" />
            <span>Ajustes</span>
          </div>
          <div className="nav-item" onClick={handleLogout}>
            <BsBoxArrowLeft className="icon" />
            <span>Cerrar sesión</span>
          </div>
        </div>

        {/* --- MODALES (No cambian) --- */}
        {isTeacher && (
          <CreateRoom show={showCreateModal} handleClose={() => setShowCreateModal(false)} />
        )}
        {isStudent && (
          <JoinRoom show={showJoinModal} handleClose={() => setShowJoinModal(false)} />
        )}
      </div>
    );
}

export default Sidebar;