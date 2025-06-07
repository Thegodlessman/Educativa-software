import React, { useState, useEffect } from 'react';
import { Tabs, Tab, Table, Card, ListGroup, Spinner, Alert, Button } from 'react-bootstrap';
import { BsFileEarmarkPdf, BsYoutube, BsLink45Deg, BsQuestionCircle, BsExclamationTriangleFill, BsClipboardCheck, BsGraphUp, BsLightningCharge, BsXCircle, BsCheckCircle, BsClockHistory, BsCollectionPlay, BsArrowLeft } from "react-icons/bs";
import axios from 'axios';
import './StudentTestDetail.css';

const getMaterialIcon = (materialType) => {
    if (!materialType) return <BsQuestionCircle size={20} className="me-2" />;
    const type = materialType.toLowerCase();
    if (type.includes('pdf')) return <BsFileEarmarkPdf size={20} className="me-2 text-danger" />;
    if (type.includes('video')) return <BsYoutube size={20} className="me-2 text-danger" />;
    if (type.includes('artículo') || type.includes('web') || type.includes('enlace')) return <BsLink45Deg size={20} className="me-2 text-primary" />;
    if (type.includes('actividad')) return <BsCollectionPlay size={20} className="me-2 text-success" />;
    return <BsQuestionCircle size={20} className="me-2" />;
};

const renderAnswer = (answer) => {
    if (!answer) return <span className="text-muted">N/A</span>;
    const isYes = answer.toLowerCase() === 'sí';
    const color = isYes ? 'text-success' : 'text-danger';
    const icon = isYes ? <BsCheckCircle className="me-2" /> : <BsXCircle className="me-2" />;

    return (
        <span className={`fw-bold ${color}`}>
            {icon}
            {answer}
        </span>
    );
};


function StudentTestDetail({ studentData, onClose }) {
    const [testMetrics, setTestMetrics] = useState(null);
    const [supportMaterials, setSupportMaterials] = useState([]);
    const [questionAnswers, setQuestionAnswers] = useState([]);
    const [loadingMetrics, setLoadingMetrics] = useState(false);
    const [loadingMaterials, setLoadingMaterials] = useState(false);
    const [loadingAnswers, setLoadingAnswers] = useState(false);
    const [errorMetrics, setErrorMetrics] = useState('');
    const [errorMaterials, setErrorMaterials] = useState('');
    const [errorAnswers, setErrorAnswers] = useState('');

    useEffect(() => {
        if (studentData && studentData.id_test) {
            setLoadingMetrics(true);
            setErrorMetrics('');
            axios.get(`${import.meta.env.VITE_BACKEND_URL}test-metrics/${studentData.id_test}`)
                .then(response => {
                    setTestMetrics(response.data);
                })
                .catch(err => {
                    console.error("Error fetching test metrics:", err);
                    setErrorMetrics("No se pudieron cargar las métricas detalladas del test.");
                })
                .finally(() => {
                    setLoadingMetrics(false);
                });

            setLoadingAnswers(true);
            setErrorAnswers('');
            axios.get(`${import.meta.env.VITE_BACKEND_URL}test/${studentData.id_test}/answers`)
                .then(response => {
                    setQuestionAnswers(response.data);
                })
                .catch(err => {
                    console.error("Error fetching question answers:", err);
                    setErrorAnswers("No se pudieron cargar las respuestas del cuestionario.");
                })
                .finally(() => {
                    setLoadingAnswers(false);
                });

        } else {
            setTestMetrics(null);
            setQuestionAnswers([]);
        }

        if (studentData && studentData.id_risk_level) {
            setLoadingMaterials(true);
            setErrorMaterials('');
            axios.get(`${import.meta.env.VITE_BACKEND_URL}risk-levels/${studentData.id_risk_level}/materials`)
                .then(response => {
                    setSupportMaterials(response.data);
                })
                .catch(err => {
                    console.error("Error fetching support materials:", err);
                    setErrorMaterials("No se pudo cargar el material de apoyo.");
                })
                .finally(() => {
                    setLoadingMaterials(false);
                });
        } else {
            setSupportMaterials([]);
        }
    }, [studentData]);

    if (!studentData) {
        return null;
    }

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('es-VE', {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    };

    return (
        <div className="student-test-detail-container my-4">
            <Button variant="outline-secondary" onClick={onClose} className="mb-3">
                <BsArrowLeft /> Volver a la lista
            </Button>
            <Card className="shadow-sm">
                <Card.Header as="h4" className="detail-title text-white">
                    Detalle de Prueba: {studentData.student_name || 'Estudiante Desconocido'}
                </Card.Header>
                <Card.Body>
                    <Tabs defaultActiveKey="results" id="student-test-details-tabs" className="mb-3 nav-tabs-custom">
                        <Tab eventKey="results" title={<><BsClipboardCheck className="me-1" /> Resultados</>}>
                            <h5>Información General</h5>
                            <ListGroup variant="flush" className="mb-3">
                                <ListGroup.Item><strong>Estudiante:</strong> {studentData.student_name}</ListGroup.Item>
                                <ListGroup.Item><strong>Fecha:</strong> {formatDate(studentData.test_date)}</ListGroup.Item>
                                <ListGroup.Item><strong>Puntuación:</strong> {studentData.final_score !== null ? studentData.final_score : 'Pendiente'}</ListGroup.Item>
                                <ListGroup.Item><strong>Nivel de Riesgo:</strong> <span className={`risk-level risk-level-${(studentData.risk_name || 'default').toLowerCase().replace(/\s+/g, '-')}`}>{studentData.risk_name || 'No determinado'}</span></ListGroup.Item>
                                <ListGroup.Item><strong>Recomendación:</strong> {studentData.recommendation || 'N/A'}</ListGroup.Item>
                            </ListGroup>

                            <hr />
                            <h5>Métricas Detalladas</h5>
                            {loadingMetrics && <div className="text-center my-3"><Spinner animation="border" /> <p>Cargando métricas...</p></div>}
                            {errorMetrics && <Alert variant="danger">{errorMetrics}</Alert>}
                            {testMetrics && Object.keys(testMetrics).length > 0 && !loadingMetrics && (
                                <Table striped bordered hover responsive size="sm" className="metrics-table">
                                    <tbody>
                                        <tr><td><BsGraphUp className="me-2 text-info" />Tiempo Prom. Reacción (Aciertos):</td><td>{testMetrics.reaction_time_avg ? `${parseFloat(testMetrics.reaction_time_avg).toFixed(0)} ms` : 'N/A'}</td></tr>
                                        <tr><td><BsCheckCircle className="text-success me-2" />Aciertos (Obst. Destruidos):</td><td>{testMetrics.correct_decisions_count ?? 'N/A'}</td></tr>
                                        <tr><td><BsXCircle className="text-danger me-2" />Errores (Colisiones):</td><td>{testMetrics.error_count ?? 'N/A'}</td></tr>
                                        <tr><td><BsLightningCharge className="text-warning me-2" />Disparos Fallidos:</td><td>{testMetrics.missed_shots_count ?? 'N/A'}</td></tr>
                                        <tr><td><BsClockHistory className="me-2" />Duración Total del Juego:</td><td>{testMetrics.total_time ? `${parseFloat(testMetrics.total_time).toFixed(1)} seg` : 'N/A'}</td></tr>
                                    </tbody>
                                </Table>
                            )}
                            {(!testMetrics || Object.keys(testMetrics).length === 0) && !loadingMetrics && !errorMetrics && <p className="text-muted">No hay métricas detalladas disponibles para este test.</p>}
                        </Tab>

                        <Tab eventKey="answers" title={<><BsQuestionCircle className="me-1" /> Cuestionario</>}>
                            <div className="p-2">
                                {loadingAnswers && <div className="text-center my-3"><Spinner animation="border" /> <p>Cargando respuestas...</p></div>}
                                {errorAnswers && <Alert variant="danger">{errorAnswers}</Alert>}
                                {!loadingAnswers && !errorAnswers && (
                                    questionAnswers.length > 0 ? (
                                        <ListGroup variant="flush">
                                            {questionAnswers.map((qa) => (
                                                <ListGroup.Item key={qa.id_answer} className="px-1">
                                                    <p className="mb-1"><strong>Pregunta:</strong> {qa.question_text}</p>
                                                    <p className="mb-0"><strong>Respuesta:</strong> {renderAnswer(qa.user_answer)}</p>
                                                </ListGroup.Item>
                                            ))}
                                        </ListGroup>
                                    ) : (
                                        <Alert variant="info">No se encontraron respuestas del cuestionario para este test.</Alert>
                                    )
                                )}
                            </div>
                        </Tab>
                        
                        <Tab eventKey="support" title={<><BsCollectionPlay className="me-1" /> Material de Apoyo</>}>
                            <Alert variant="warning" className="mt-3 mb-4 text-center disclaimer-alert">
                                <BsExclamationTriangleFill size={24} className="me-2" />
                                <strong>Atención:</strong> Esta herramienta y los materiales proporcionados son una guía de apoyo y no constituyen un diagnóstico.
                                Si tiene inquietudes sobre el desarrollo o comportamiento del estudiante, la consulta con un profesional de la salud cualificado (psicólogo, neuropediatra, psicopedagogo) es siempre la recomendación prioritaria.
                            </Alert>

                            {loadingMaterials && <div className="text-center my-3"><Spinner animation="border" /> <p>Cargando material...</p></div>}
                            {errorMaterials && <Alert variant="danger">{errorMaterials}</Alert>}
                            {!loadingMaterials && supportMaterials.length === 0 && !errorMaterials && (
                                <Alert variant="info">No hay material de apoyo específico disponible para el nivel de riesgo: "{studentData.risk_name || 'No determinado'}".</Alert>
                            )}
                            {supportMaterials.length > 0 && (
                                <ListGroup variant="flush">
                                    {supportMaterials.map(material => (
                                        <ListGroup.Item key={material.id_material} className="material-item">
                                            <div className="d-flex w-100 justify-content-between">
                                                <h5 className="mb-1">
                                                    {getMaterialIcon(material.type_name)}
                                                    {material.material_title}
                                                </h5>
                                                <small className="text-muted">{material.type_name}</small>
                                            </div>
                                            {material.material_description && <p className="mb-1 mt-1 description-text">{material.material_description}</p>}
                                            <Button size="sm" href={material.material_url} target="_blank" rel="noopener noreferrer" className="mt-2 btn-access-material">
                                                Acceder al Material <BsLink45Deg />
                                            </Button>
                                        </ListGroup.Item>
                                    ))}
                                </ListGroup>
                            )}
                        </Tab>
                    </Tabs>
                </Card.Body>
            </Card>
        </div>
    );
}

export default StudentTestDetail;