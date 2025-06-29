import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal, Button, Form, InputGroup, Spinner, Card, Alert } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHashtag, faUserGraduate } from '@fortawesome/free-solid-svg-icons';
import { useClass } from '../../context/ClassContext';
import { notifyError, notifySuccess } from '../../utils/notify';
import axios from 'axios';
import './FastAccessPage.css';

function FastAccessPage() {
    const navigate = useNavigate();
    const { setToken } = useClass();

    // --- Estados del componente ---
    const [showModal, setShowModal] = useState(true);
    const [roomCode, setRoomCode] = useState('');
    const [students, setStudents] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // --- Manejadores de eventos ---
    const handleFetchStudents = async () => {
        if (!roomCode.trim()) {
            return notifyError("Por favor, ingresa un código de clase.");
        }
        setIsLoading(true);
        setError('');
        console.log(roomCode)
        try {
            const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}room/${roomCode}/students`);
            const studentData = Array.isArray(response.data)
                ? response.data
                : (response.data && Array.isArray(response.data.students)) 
                    ? response.data.students
                    : []; 

            if (studentData.length > 0) {
                setStudents(studentData); 
                setShowModal(false);
            } else {
                setError("No se encontraron estudiantes para este código o la clase está vacía.");
            }

            console.log(studentData)

        } catch (err) {
            setError(err.response?.data?.message || "Código de clase no válido o error en el servidor.");
            setStudents([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleStudentSelect = async (student) => {
        setIsLoading(true);
        try {
            const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}fast-login`, {
                id_user: student.id_user
            });

            const { tokenSession } = response.data;

            console.log(tokenSession)

            if (tokenSession) {
                notifySuccess(`¡Bienvenido/a, ${student.user_name}!`);
                setToken(tokenSession); 
                navigate('/profile'); 
            }
        } catch (err) {
            notifyError(err.response?.data?.message || "No se pudo iniciar sesión.");
            setIsLoading(false);
        }
    };

    const handleEnterKey = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleFetchStudents();
        }
    };

    return (
        <div className="fast-access-container">
            {/* --- MODAL PARA EL CÓDIGO DE CLASE --- */}
            <Modal show={showModal} onHide={() => navigate('/')} centered dialogClassName="join-room-modal">
                <Modal.Header closeButton className="modal-header-custom text-white">
                    <Modal.Title>Acceso Rápido para Estudiantes</Modal.Title>
                </Modal.Header>
                <Modal.Body className="text-center">
                    <p className="text-muted mb-4">Ingresa el código que te dio tu profesor.</p>
                    <Form onSubmit={(e) => { e.preventDefault(); handleFetchStudents(); }}>
                        <InputGroup className="mb-3">
                            <InputGroup.Text className="icon-prefix">
                                <FontAwesomeIcon icon={faHashtag} />
                            </InputGroup.Text>
                            <Form.Control
                                type="text"
                                className="input-code"
                                placeholder="CÓDIGO DE LA CLASE"
                                value={roomCode}
                                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                                onKeyDown={handleEnterKey}
                                autoFocus
                            />
                        </InputGroup>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button className="btn-join-room w-100 fw-bold" onClick={handleFetchStudents} disabled={isLoading}>
                        {isLoading ? <Spinner as="span" animation="border" size="sm" /> : 'Buscar Clase'}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* --- CUADRÍCULA DE SELECCIÓN DE ESTUDIANTES --- */}
            {!showModal && (
                <div className="student-selection-grid">
                    <h2 className="text-center mb-4">¿Quién eres?</h2>
                    <div className="grid-container">
                        {students.map(student => (
                            <Card key={student.id_user} className="student-card" onClick={() => handleStudentSelect(student)}>
                                <Card.Img variant="top" src={student.user_url || 'https://via.placeholder.com/150?text=Perfil'} />
                                <Card.Body>
                                    <Card.Title>{student.user_name} {student.user_lastname}</Card.Title>
                                </Card.Body>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* Spinner de carga general para el login del estudiante */}
            {isLoading && !showModal && <Spinner animation="border" className="page-loader" />}
        </div>
    );
}

export default FastAccessPage;