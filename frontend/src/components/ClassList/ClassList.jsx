import { useContext, useState, useEffect } from "react";
import { ClassContext } from "../../context/ClassContext";
import { Card, Spinner, Button, Alert, Tabs, Tab } from "react-bootstrap";
import { BsArrowLeft, BsClipboard, BsGraphUp, BsPersonCircle, BsCalendarEvent, BsTrophy, BsShieldExclamation } from "react-icons/bs";
import './ClassList.css';
import { notifyError, notifySuccess, notifyWarning, notifyInfo } from '../../utils/notify.js'
import GameTest from '../GameTest/GameTest';
import StudentTestDetail from '../StudentTestDetail/StudentTestDetail.jsx';
import axios from 'axios';;
import RiskDistributionChart from '../RiskDistributionChar/RiskDistributionChart.jsx';

function ClassList() {
  const { classes, loading, userData } = useContext(ClassContext);
  const [selectedRoom, setSelectedRoom] = useState(null);

  const [studentsEvaluated, setStudentsEvaluated] = useState([]);
  const [loadingStudentsTeacherView, setLoadingStudentsTeacherView] = useState(false);

  const [studentTestStatus, setStudentTestStatus] = useState(null);
  const [loadingTestStatusStudentView, setLoadingTestStatusStudentView] = useState(false);
  const [startingTestStudentView, setStartingTestStudentView] = useState(false);

  const [isGameActive, setIsGameActive] = useState(false);
  const [gameProps, setGameProps] = useState(null);

  const [selectedStudentForDetail, setSelectedStudentForDetail] = useState(null);

  const [chartData, setChartData] = useState([]);
  const [loadingChart, setLoadingChart] = useState(false);

  useEffect(() => {
    if (selectedRoom && userData?.id_user && userData?.rol_name) {
      const { id_room } = selectedRoom;
      const { id_user, rol_name } = userData;

      setSelectedStudentForDetail(null);

      if (rol_name === "Profesor") {
        setLoadingStudentsTeacherView(true);
        setStudentsEvaluated([]);
        axios.get(`${import.meta.env.VITE_BACKEND_URL}test/room/${id_room}`)
          .then((res) => setStudentsEvaluated(res.data))
          .catch((err) => {
            notifyError("Error al cargar estudiantes:" + (err.response?.data?.message || err.message));
            setStudentsEvaluated([]);
          })
          .finally(() => setLoadingStudentsTeacherView(false));

        setLoadingChart(true);
        setChartData([]);
        axios.get(`${import.meta.env.VITE_BACKEND_URL}reports/class/${id_room}/risk-distribution`)
          .then(response => {
            setChartData(response.data);
          })
          .catch(err => {
            console.error("Error fetching chart data:", err);
          })
          .finally(() => {
            setLoadingChart(false);
          });
      }

      if (rol_name === "Estudiante") {
        setLoadingTestStatusStudentView(true)
        setStudentTestStatus(null)
        const fetchStudentStatus = async () => {
          try {
            const token = localStorage.getItem('token');
            const response = await axios.get(
              `${import.meta.env.VITE_BACKEND_URL}test/status/${id_room}/${id_user}`,
              { headers: { 'Authorization': `Bearer ${token}` } }
            );
            setStudentTestStatus(response.data);
          } catch (error) {
            console.error("Error al cargar el estado de la prueba del estudiante:", error);
            if (error.response && error.response.status === 404) {
              setStudentTestStatus({ isAssigned: true, isCompleted: false, testId: null });
            } else if (error.response) {
              const errorMessage = error.response.data?.message || `Error HTTP ${error.response.status}`;
              setStudentTestStatus({ error: errorMessage, isAssigned: false });
            } else {
              setStudentTestStatus({ error: error.message, isAssigned: false });
            }
          } finally {
            setLoadingTestStatusStudentView(false);
          }
        };
        fetchStudentStatus();
      }
    }
  }, [selectedRoom, userData]);

  if (loading || !userData) {
    return (
      <div className="d-flex justify-content-center align-items-center mt-5">
        <Spinner animation="border" />
        <span className="ms-2">Cargando clases...</span>
      </div>
    );
  }

  if (!selectedStudentForDetail && !selectedRoom && classes.length === 0) {
    return (
      <div className="d-flex justify-content-center align-items-center mt-5">
        {userData.rol_name === "Profesor" ? (
          <h4>No tienes clases creadas todavía.</h4>
        ) : (
          <h4>No estás unido a ninguna clase todavía.</h4>
        )}
      </div>
    );
  }

  const handleSelectRoom = (room) => {
    setSelectedRoom(room);
  };

  const handleBackToClassList = () => {
    setSelectedRoom(null);
    setSelectedStudentForDetail(null);
  };

  const handleStartTestStudent = async () => {
    if (!selectedRoom || !userData?.id_user || startingTestStudentView) {
      notifyWarning("No se puede iniciar la prueba: condiciones no cumplidas.");
      return;
    }
    setStartingTestStudentView(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}test/start-student-test`,
        { id_user: userData.id_user, id_room: selectedRoom.id_room },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      const id_test_creado_en_backend = response.data.id_test;
      if (!id_test_creado_en_backend) {
        throw new Error("El backend no devolvió un ID de prueba válido.");
      }
      notifySuccess("Prueba iniciada. Preparando juego...");
      setGameProps({
        id_test_actual: id_test_creado_en_backend,
        userId: userData.id_user,
        id_room: selectedRoom.id_room
      });
      setIsGameActive(true);
    } catch (error) {
      console.error("Error al iniciar la prueba:", error);
      if (error.response) {
        const errorMessage = error.response.data?.message || `Error HTTP ${error.response.status}`;
        if (error.response.status === 409) {
          notifyWarning(errorMessage);
          const currentSelectedRoom = selectedRoom;
          setSelectedRoom(null);
          setTimeout(() => setSelectedRoom(currentSelectedRoom), 0);
        } else {
          notifyError(`No se pudo iniciar la prueba: ${errorMessage}`);
        }
      } else {
        notifyError(`No se pudo iniciar la prueba: ${error.message}`);
      }
    } finally {
      setStartingTestStudentView(false);
    }
  };

  const handleGameEnd = () => {
    notifySuccess("Juego finalizado. Resultados enviados.");
    setIsGameActive(false);
    setGameProps(null);
    const currentSelectedRoom = selectedRoom;
    setSelectedRoom(null);
    setTimeout(() => setSelectedRoom(currentSelectedRoom), 0);
  };

  const handleShowStudentDetail = (student) => {
    if (student.id_test) {
      setSelectedStudentForDetail(student);
    } else {
      notifyInfo("Este estudiante aún no ha realizado una prueba o no hay datos disponibles.");
    }
  };

  const handleCloseStudentDetail = () => {
    setSelectedStudentForDetail(null);
    if (selectedRoom && userData?.rol_name === "Profesor") {
      const currentSelectedRoom = selectedRoom;
      setSelectedRoom(null);
      setTimeout(() => setSelectedRoom(currentSelectedRoom), 0);
    }
  };

  return (
    <div className="container mt-4">
      {selectedStudentForDetail ? (
        <StudentTestDetail
          studentData={selectedStudentForDetail}
          onClose={handleCloseStudentDetail}
        />
      ) : !selectedRoom ? (
        <div className="row">
          {classes.map((room) => (
            <div
              className="col-12 col-sm-6 col-md-4 col-lg-3 mb-4 card-hover-wrapper"
              key={room.id_room}
              onClick={() => handleSelectRoom(room)}
              style={{ cursor: "pointer" }}
            >
              <Card className="h-100 shadow-sm card-hover">
                <Card.Img
                  variant="top"
                  src={room.room_url || '[https://via.placeholder.com/200x150?text=Clase](https://via.placeholder.com/200x150?text=Clase)'}
                  alt={`Imagen de la clase ${room.room_grate}`}
                />
                <Card.Body>
                  <Card.Title>{room.room_grate} "{room.secc_room.trim()}"</Card.Title>
                  <Card.Subtitle>{room.code_room}</Card.Subtitle>
                  <Card.Subtitle className="mt-1 text-muted">{room.insti_name}</Card.Subtitle>
                  <Card.Text className="text-muted">{room.max_room} alumnos</Card.Text>
                </Card.Body>
              </Card>
            </div>
          ))}
        </div>
      ) : (
        <div className="fade-in">
          <Button onClick={handleBackToClassList} variant="outline-secondary" className="mb-4">
            <BsArrowLeft /> Volver a {userData.rol_name === "Profesor" ? "mis clases" : "mis clases"}
          </Button>
          <h2 className="mb-4">{selectedRoom.room_grate} "{selectedRoom.secc_room.trim()}" - {selectedRoom.insti_name}</h2>
          <div className="bg-white p-4 shadow rounded">
            {userData.rol_name === "Profesor" ? (
              <div className="bg-white p-4 shadow rounded">
                <Tabs defaultActiveKey="student-list" id="teacher-dashboard-tabs" className="mb-3 nav-tabs-custom">
                  <Tab
                    eventKey="student-list"
                    title={<><BsClipboard className="me-2" />Lista de Estudiantes</>}
                  >
                    {loadingStudentsTeacherView ? (
                      <div className="text-center py-5"><Spinner animation="border" /><p className="mt-2">Cargando...</p></div>
                    ) : (
                      <div className="student-list">
                        {studentsEvaluated.length === 0 ? (
                          <Alert variant="info" className="text-center">No hay estudiantes evaluados en esta clase todavía.</Alert>
                        ) : (
                          studentsEvaluated.map((student) => (
                            <div
                              key={student.id_user || student.id_test}
                              className={`student-card ${student.id_test ? 'clickable' : 'disabled'}`}
                              onClick={() => student.id_test && handleShowStudentDetail(student)}
                            >
                              <div className="student-card-info">
                                <BsPersonCircle size={30} className="me-3 text-muted" />
                                <div>
                                  <div className="student-name">{student.student_name || 'N/A'}</div>
                                  <div className="test-date">
                                    <BsCalendarEvent className="me-2" />
                                    {student.id_test && student.test_date ? new Date(student.test_date).toLocaleDateString('es-VE') : <span className="text-muted">Prueba no realizada</span>}
                                  </div>
                                </div>
                              </div>
                              <div className="student-card-metrics">
                                <div className="metric-item">
                                  <span><BsTrophy className="me-2" /> Puntuación</span>
                                  <strong>{student.id_test && student.final_score !== null ? student.final_score : 'N/A'}</strong>
                                </div>
                                <div className="metric-item">
                                  <span><BsShieldExclamation className="me-2" /> Riesgo</span>
                                  {student.id_test && student.risk_name ? (
                                    <span className={`risk-badge risk-level-${student.risk_name.toLowerCase().replace(/\s+/g, '-')}`}>
                                      {student.risk_name}
                                    </span>
                                  ) : (
                                    <strong>N/A</strong>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>)}
                  </Tab>
                  <Tab
                    eventKey="class-stats"
                    title={<><BsGraphUp className="me-2" />Estadísticas de la clase</>}
                  >
                    <div className="p-2">
                      {loadingChart ? (
                        <div className="d-flex justify-content-center align-items-center py-5">
                          <Spinner animation="border" /><p className="ms-2 mb-0">Cargando gráfico...</p>
                        </div>
                      ) : (
                        <RiskDistributionChart chartData={chartData} />
                      )}
                    </div>
                  </Tab>
                </Tabs>
              </div>
            ) : userData.rol_name === "Estudiante" ? (
              <>
                {loadingTestStatusStudentView ? (
                  <div className="text-center"><Spinner animation="border" /><p className="mt-2">Verificando...</p></div>
                ) : studentTestStatus?.error ? (
                  <div className="text-center text-danger">
                    <p>Error: {studentTestStatus.error}</p>
                    <Button variant="outline-danger" onClick={() => {
                      const currentSelectedRoom = selectedRoom;
                      setSelectedRoom(null);
                      setTimeout(() => setSelectedRoom(currentSelectedRoom), 0);
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
        </div>
      )}

      {isGameActive && gameProps && (
        <div className="game-modal-overlay">
          <div className="game-modal-content">
            <GameTest
              id_test_actual={gameProps.id_test_actual}
              userId={gameProps.userId}
              id_room={gameProps.id_room}
              onGameEnd={handleGameEnd}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default ClassList;