import React, { useState, useEffect, useCallback, useContext } from "react";
import { useClass } from "../../context/ClassContext";
import { Card, Spinner, Button, Alert, Tabs, Tab, Modal, Form, InputGroup } from "react-bootstrap";
import {
  BsArrowLeft, BsClipboard, BsGraphUp, BsTrashFill, BsPersonFill,
  BsPencilFill, BsEnvelope, BsPersonCircle, BsGridFill,
  BsCalendarEvent, BsTrophy, BsListUl, BsShieldExclamation
} from "react-icons/bs";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faIdCard } from '@fortawesome/free-solid-svg-icons';
import './ClassList.css';
import { notifyError, notifySuccess, notifyInfo } from '../../utils/notify.js';
import GameTest from '../../features/GameTest/GameTest/GameTest.jsx';
import StudentTestDetail from '../StudentTestDetail/StudentTestDetail.jsx';
import axios from 'axios';
import RiskDistributionChart from '../RiskDistributionChar/RiskDistributionChart.jsx';
import RegisterStundentForm from "../RegisterStudentForm/RegisterStudentForm.jsx";

function ClassList() {
  const { classes, loading, userData, selectedRoom, selectClass, fetchClasses } = useClass();

  const [studentsEvaluated, setStudentsEvaluated] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [studentTestStatus, setStudentTestStatus] = useState(null);
  const [loadingTestStatusStudentView, setLoadingTestStatusStudentView] = useState(false);
  const [startingTestStudentView, setStartingTestStudentView] = useState(false);
  const [isGameActive, setIsGameActive] = useState(false);
  const [gameProps, setGameProps] = useState(null);
  const [selectedStudentForDetail, setSelectedStudentForDetail] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loadingChart, setLoadingChart] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);

  const [showDeleteClassModal, setShowDeleteClassModal] = useState(false);
  const [showDeleteStudentModal, setShowDeleteStudentModal] = useState(false);
  const [entityToDelete, setEntityToDelete] = useState(null);
  const [confirmationText, setConfirmationText] = useState("");

  const fetchStudentsForRoom = useCallback(async (roomId) => {
    if (!roomId) return;
    setLoadingStudents(true);
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}test/room/${roomId}`, config);
      setStudentsEvaluated(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      notifyError("Error al cargar estudiantes.");
    } finally {
      setLoadingStudents(false);
    }
  }, []);

  const fetchChartData = useCallback(async (roomId) => {
    if (!roomId) return;
    setLoadingChart(true);
    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}reports/class/${roomId}/risk-distribution`, config);
      setChartData(response.data);
    } catch (err) {
      console.error("Error fetching chart data:", err);
    } finally {
      setLoadingChart(false);
    }
  }, []);

  const fetchStudentStatus = useCallback(async (roomId, userId) => {
    if (!roomId || !userId) return;
    setLoadingTestStatusStudentView(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}test/status/${roomId}/${userId}`, { headers: { 'Authorization': `Bearer ${token}` } });
      setStudentTestStatus(response.data);
    } catch (error) {
      console.error("Error al cargar el estado de la prueba del estudiante:", error);
      if (error.response && error.response.status === 404) {
        setStudentTestStatus({ isAssigned: true, isCompleted: false, testId: null });
      } else {
        setStudentTestStatus({ error: error.response?.data?.message || error.message, isAssigned: false });
      }
    } finally {
      setLoadingTestStatusStudentView(false);
    }
  }, []);

  useEffect(() => {
    if (selectedRoom && userData?.id_user) {
      setSelectedStudentForDetail(null);
      if (userData.rol_name === "Profesor") {
        fetchStudentsForRoom(selectedRoom.id_room);
        fetchChartData(selectedRoom.id_room);
      } else if (userData.rol_name === "Estudiante") {
        fetchStudentStatus(selectedRoom.id_room, userData.id_user);
      }
    }
  }, [selectedRoom, userData, fetchStudentsForRoom, fetchChartData, fetchStudentStatus]);

  const handleBackToClassList = () => {
    selectClass(null);
  };

  const handleEditClick = (student) => {
    const nameParts = student.student_name.split(' ');
    setEditingStudent({
      id_user: student.id_user,
      user_name: nameParts[0] || '',
      user_lastname: nameParts.slice(1).join(' ') || '',
      user_ced: student.user_ced || '',
      user_email: student.user_email || ''
    });
    setShowEditModal(true);
  };

  const handleModalFormChange = (e) => {
    setEditingStudent(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    if (!editingStudent) return;
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/teacher/students/${editingStudent.id_user}`, editingStudent, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setShowEditModal(false);
      notifySuccess("Estudiante actualizado correctamente.");
      await fetchStudentsForRoom(selectedRoom.id_room);
    } catch (error) {
      notifyError(error.response?.data?.message || "Error al actualizar.");
    }
  };

  const handleRemoveStudent = (studentId) => {
    setEntityToDelete(studentId);
    setShowDeleteStudentModal(true);
  };

  const executeDeleteStudent = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/teacher/rooms/${selectedRoom.id_room}/students/${entityToDelete}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setStudentsEvaluated(prev => prev.filter(s => s.id_user !== entityToDelete));
      notifySuccess("Estudiante eliminado de la clase.");
    } catch (error) {
      notifyError(error.response?.data?.message || "Error al eliminar.");
    } finally {
      setShowDeleteStudentModal(false);
      setEntityToDelete(null);
    }
  };

  const handleDeleteClass = () => {
    setEntityToDelete(selectedRoom.id_room);
    setShowDeleteClassModal(true);
  };

  const executeDeleteClass = async () => {
    if (confirmationText !== 'ELIMINAR') {
      notifyError("Texto de confirmación incorrecto.");
      return;
    }
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/teacher/rooms/${entityToDelete}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      selectClass(null);
      await fetchClasses();
      notifySuccess("Clase eliminada con éxito.");
    } catch (error) {
      notifyError(error.response?.data?.message || "Error al eliminar la clase.");
    } finally {
      setShowDeleteClassModal(false);
      setEntityToDelete(null);
      setConfirmationText("");
    }
  };

  const handleStartTestStudent = async () => {
    if (!selectedRoom || !userData?.id_user) return;
    setStartingTestStudentView(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}test/start-student-test`,
        { id_user: userData.id_user, id_room: selectedRoom.id_room },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      setGameProps({
        id_test_actual: response.data.id_test,
        userId: userData.id_user,
        id_room: selectedRoom.id_room
      });
      setIsGameActive(true);
    } catch (error) {
      notifyError(error.response?.data?.message || "No se pudo iniciar la prueba.");
    } finally {
      setStartingTestStudentView(false);
    }
  };

  const handleGameEnd = () => {
    notifySuccess("Juego finalizado. Resultados enviados.");
    setIsGameActive(false);
    setGameProps(null);
    if (userData.rol_name === "Estudiante") {
      fetchStudentStatus(selectedRoom.id_room, userData.id_user);
    } else {
      selectClass(null);
    }
  };

  const handleShowStudentDetail = (student) => {
    if (student.id_test) {
      setSelectedStudentForDetail(student);
    } else {
      notifyInfo("Este estudiante aún no ha realizado la prueba.");
    }
  };

  const handleCloseStudentDetail = () => {
    setSelectedStudentForDetail(null);
    if (selectedRoom && userData?.rol_name === "Profesor") {
      fetchStudentsForRoom(selectedRoom.id_room);
    }
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center mt-5">
        <Spinner animation="border" /> <span className="ms-2">Cargando...</span>
      </div>
    );
  }

  if (selectedStudentForDetail) {
    return <StudentTestDetail studentData={selectedStudentForDetail} onClose={handleCloseStudentDetail} />;
  }

  if (isGameActive && gameProps) {
    return (
      <div className="game-modal-overlay">
        <div className="game-modal-content">
          <GameTest {...gameProps} onGameEnd={handleGameEnd} />
        </div>
      </div>
    );
  }


  if (selectedRoom) {
    return (
      <div className="fade-in">
        <div className="d-flex justify-content-between align-items-center mb-4 mt-4">
          <h2 className="mb-0">{selectedRoom.room_grate} "{selectedRoom.secc_room.trim()}" - {selectedRoom.insti_name}</h2>
          <div>
            {userData.rol_name === "Profesor" && (
              <Button onClick={handleDeleteClass} variant="danger" className="me-3">
                <BsTrashFill className="me-2" />Eliminar Clase
              </Button>
            )}
            <Button onClick={handleBackToClassList} variant="outline-secondary">
              <BsArrowLeft /> Volver
            </Button>
          </div>
        </div>
        <div className="bg-white p-4 shadow rounded">
          {userData.rol_name === "Profesor" ? (
            <Tabs defaultActiveKey="student-list" id="teacher-dashboard-tabs" className="mb-3 nav-tabs-custom">
              <Tab eventKey="student-list" title={<><BsClipboard className="me-2" />Lista de Estudiantes</>}>
                {loadingStudents ? <div className="text-center py-5"><Spinner /></div> : (
                  <div className="student-list">
                    {studentsEvaluated.length === 0
                      ? <Alert variant="info">No hay estudiantes en esta clase.</Alert>
                      : studentsEvaluated.map((student) => (
                        <Card key={student.id_user} className={`student-card ${student.id_test ? 'clickable' : ''}`} onClick={() => student.id_test && setSelectedStudentForDetail(student)}>
                          <div className="d-flex justify-content-between align-items-center w-100">
                            <div className="d-flex flex-grow-1 align-items-center">
                              <div className="student-card-info">
                                <BsPersonCircle size={30} className="me-3 text-muted" />
                                <div>
                                  <div className="student-name">{student.student_name}</div>
                                  <div className="test-date"><BsCalendarEvent className="me-2" />{student.id_test ? new Date(student.test_date).toLocaleDateString('es-VE') : "Prueba no realizada"}</div>
                                </div>
                              </div>
                              <div className="student-card-metrics">
                                <div className="metric-item"><span><BsTrophy /> Puntuación</span><strong>{student.final_score ?? 'N/A'}</strong></div>
                                <div className="metric-item"><span><BsShieldExclamation /> Riesgo</span>{student.risk_name ? <span className={`risk-badge risk-level-${student.risk_name.toLowerCase().replace(/\s+/g, '-')}`}>{student.risk_name}</span> : <strong>N/A</strong>}</div>
                              </div>
                            </div>
                            <div className="student-card-actions">
                              <Button variant="light" size="sm" onClick={(e) => { e.stopPropagation(); handleEditClick(student); }} title="Editar Estudiante"><BsPencilFill /></Button>
                              <Button variant="light" size="sm" onClick={(e) => { e.stopPropagation(); handleRemoveStudent(student.id_user); }} title="Eliminar de la clase"><BsTrashFill /></Button>
                            </div>
                          </div>
                        </Card>
                      ))
                    }
                  </div>
                )}
              </Tab>
              <Tab eventKey="register-stundent" title={<><BsListUl className="me-2" />Registro Rápido</>}><RegisterStundentForm id_room={selectedRoom.id_room} /></Tab>
              <Tab eventKey="class-stats" title={<><BsGraphUp className="me-2" />Estadísticas</>}>{loadingChart ? <Spinner /> : <RiskDistributionChart chartData={chartData} />}</Tab>
            </Tabs>
          ) : userData.rol_name === "Estudiante" ? (
            <>
              {loadingTestStatusStudentView ? (
                <div className="text-center"><Spinner animation="border" /><p className="mt-2">Verificando...</p></div>
              ) : studentTestStatus?.error ? (
                <div className="text-center text-danger">
                  <p>Error: {studentTestStatus.error}</p>
                  <Button variant="outline-danger" onClick={() => {
                    const currentSelectedRoom = selectedRoom;
                    currentSelectedRoom(null);
                    setTimeout(() => currentSelectedRoom(currentSelectedRoom), 0);
                  }}>Reintentar</Button>
                </div>
              ) : studentTestStatus?.isCompleted ? (
                <div className="text-center text-success">
                  <h4>¡Prueba completada!</h4>
                  {studentTestStatus.finalScore !== null && <p>Puntuación: {studentTestStatus.finalScore}</p>}
                  <p className="text-muted mt-3">Consulta detalles con tu profesor.</p>
                </div>
              ) : studentTestStatus?.isAssigned === false && !studentTestStatus?.testId ? (
                <div className="text-center text-info">
                  <h4>No hay prueba asignada en esta clase.</h4>
                  <p className="text-muted mt-3">Consulta con tu profesor.</p>
                </div>
              ) : (
                <div className="text-center">
                  <h4>Prueba de TDAH pendiente.</h4>
                  <Button
                    variant="primary"
                    onClick={handleStartTestStudent}
                    disabled={startingTestStudentView}
                    className="mt-3 px-4 py-2"
                  >
                    {startingTestStudentView ? <Spinner animation="border" size="sm" className="me-2" /> : null}
                    {startingTestStudentView ? 'Iniciando...' : 'Iniciar Prueba'}
                  </Button>
                  <p className="text-muted mt-3">Haz clic para comenzar.</p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center text-danger"><h4>Rol desconocido.</h4></div>
          )}
        </div>

        <Modal show={showDeleteStudentModal} onHide={() => setShowDeleteStudentModal(false)} centered dialogClassName="cl-delete-modal">
          <Modal.Header closeButton>
            <Modal.Title><BsShieldExclamation className="me-2 text-danger" />Confirmar Eliminación</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>¿Estás seguro de que quieres eliminar a este estudiante de la clase?</p>
            <p className="">Esta acción no se puede deshacer.</p>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowDeleteStudentModal(false)}>Cancelar</Button>
            <Button variant="danger" onClick={executeDeleteStudent}>Aceptar</Button>
          </Modal.Footer>
        </Modal>

        <Modal show={showDeleteClassModal} onHide={() => setShowDeleteClassModal(false)} centered dialogClassName="cl-delete-modal">
          <Modal.Header closeButton>
            <Modal.Title><BsShieldExclamation className="me-2 text-danger" />Confirmación Requerida</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>Esta acción es irreversible y borrará la clase junto con todos los datos de sus estudiantes.</p>
            <p>Para confirmar, por favor escribe <strong>ELIMINAR</strong> en el campo de abajo.</p>
            <Form.Control
              type="text"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder="Escribe aquí para confirmar"
              className="mt-3 cl-delete-modal__confirm-input"
            />
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowDeleteClassModal(false)}>Cancelar</Button>
            <Button
              variant="danger"
              onClick={executeDeleteClass}
              disabled={confirmationText !== 'ELIMINAR'}
            >
              Eliminar Permanentemente
            </Button>
          </Modal.Footer>
        </Modal>

        <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered dialogClassName="edit-student-modal">
          <Modal.Header closeButton><Modal.Title>Editar Estudiante</Modal.Title></Modal.Header>
          <Modal.Body>
            {editingStudent && (
              <Form onSubmit={handleUpdateStudent}>
                <Form.Label>Nombre</Form.Label>
                <InputGroup className="mb-3"><InputGroup.Text className="icon-prefix"><BsPersonFill /></InputGroup.Text><Form.Control type="text" name="user_name" value={editingStudent.user_name} onChange={handleModalFormChange} /></InputGroup>
                <Form.Label>Apellido</Form.Label>
                <InputGroup className="mb-3"><InputGroup.Text className="icon-prefix"><BsPersonFill /></InputGroup.Text><Form.Control type="text" name="user_lastname" value={editingStudent.user_lastname} onChange={handleModalFormChange} /></InputGroup>
                <Form.Label>Cédula</Form.Label>
                <InputGroup className="mb-3"><InputGroup.Text className="icon-prefix"><FontAwesomeIcon icon={faIdCard} /></InputGroup.Text><Form.Control type="text" name="user_ced" value={editingStudent.user_ced} onChange={handleModalFormChange} /></InputGroup>
                <Form.Label>Correo Electrónico</Form.Label>
                <InputGroup className="mb-3"><InputGroup.Text className="icon-prefix"><BsEnvelope /></InputGroup.Text><Form.Control type="email" name="user_email" value={editingStudent.user_email} onChange={handleModalFormChange} /></InputGroup>
                <Button type="submit" className="w-100 btn-save-student">Guardar Cambios</Button>
              </Form>
            )}
          </Modal.Body>
        </Modal>
      </div>
    )
  }

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Mis Clases</h2>
      </div>

      {classes.length === 0 ? (
        <div className="d-flex justify-content-center align-items-center flex-column text-center mt-5 p-4 bg-light rounded shadow-sm">
          <BsGridFill size={50} className="text-muted mb-3" />
          <h3>No hay clases para mostrar</h3>
          <p className="text-muted">
            {userData?.rol_name === 'Profesor'
              ? "Usa el botón en el menú lateral para crear tu primera clase."
              : "Usa el botón en el menú lateral para unirte a una clase."
            }
          </p>
        </div>
      ) : (
        <div className="row">
          {classes.map((room) => (
            <div
              className="col-12 col-sm-6 col-md-4 col-lg-3 mb-4 card-hover-wrapper"
              key={room.id_room}
              onClick={() => selectClass(room)}
              style={{ cursor: "pointer" }}
            >
              <Card className="h-100 shadow-sm card-hover">
                <Card.Img
                  variant="top"
                  src={room.room_url || 'https://via.placeholder.com/200x150?text=Clase'}
                  alt={`Imagen de la clase ${room.room_grate}`}
                  className="card-img-top"
                />
                <Card.Body className="d-flex flex-column">
                  <Card.Title>{room.room_grate} "{room.secc_room.trim()}"</Card.Title>
                  <Card.Subtitle className="text-muted">{room.insti_name}</Card.Subtitle>
                  <div className="mt-auto pt-2">
                    <small className="text-muted">Código: <strong>{room.code_room}</strong></small>
                  </div>
                </Card.Body>
              </Card>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ClassList;