import React, { useState, useEffect, useContext } from "react";
import { Modal, Button, Form, InputGroup, Row, Col } from "react-bootstrap";
import axios from "axios";
import jwt_decode from "jwt-decode";
import { ClassContext } from "../../context/ClassContext";
import { notifyError, notifySuccess } from "../../utils/notify";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBuildingColumns, faGraduationCap, faTag, faUsers } from '@fortawesome/free-solid-svg-icons';

import "./CreateRoom.css";

function CreateRoom({ show, handleClose }) {
    const [institutions, setInstitutions] = useState([]);
    const [selectedInstitution, setSelectedInstitution] = useState("");
    const [section, setSection] = useState("");
    const [maxCapacity, setMaxCapacity] = useState("");
    const [grate, setGrate] = useState("");

    const { fetchClasses } = useContext(ClassContext);

    useEffect(() => {
        const fetchInstitutions = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) throw new Error("Token no encontrado");

                const decodedToken = jwt_decode(token);
                const response = await axios.post(
                    `${import.meta.env.VITE_BACKEND_URL}room/insti`,
                    { id_user: decodedToken.id_user },
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                if (response.data.success) {
                    setInstitutions(response.data.insti);
                }
            } catch (error) {
                console.error("Error fetching institutions:", error);
                notifyError("No se pudieron cargar las instituciones.");
            }
        };

        if (show) {
            fetchInstitutions();
        }
    }, [show]);

    const handleFormSubmit = async (event) => {
        event.preventDefault();
        
        const capacity = parseInt(maxCapacity, 10);
        const trimmedSection = section.trim();
        const seccRegex = /^[A-Za-z]$/;

        if (!selectedInstitution || !trimmedSection || !maxCapacity || !grate) {
            notifyError("Por favor, completa todos los campos.");
            return;
        }
        if (!seccRegex.test(trimmedSection)) {
            notifyError("La sección debe ser una única letra (A, B, C...).");
            return;
        }
        if (isNaN(capacity) || capacity < 1 || capacity > 50) {
            notifyError("La capacidad máxima debe ser un número entre 1 y 50.");
            return;
        }

        const token = localStorage.getItem("token");
        if (!token) {
            notifyError("Sesión no válida. Por favor, inicie sesión de nuevo.");
            return;
        }

        try {
            const decodedToken = jwt_decode(token);
            await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}room/create`,
                {
                    admin_room: decodedToken.id_user,
                    secc_room: trimmedSection,
                    id_institution: selectedInstitution,
                    max_room: capacity,
                    room_grate: grate
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            notifySuccess("¡La clase se ha creado exitosamente!");
            await fetchClasses();

            setSection("");
            setMaxCapacity("");
            setSelectedInstitution("");
            setGrate("");
            handleClose();
        } catch (error) {
            notifyError(error.response?.data?.message || "Ocurrió un error al crear la clase.");
            console.error("Error al crear clase:", error);
        }
    };

    return (
        <Modal show={show} onHide={handleClose} centered backdrop="static" dialogClassName="create-room-modal">
            <Modal.Header closeButton className="modal-header-custom text-white">
                <Modal.Title>Crear una Nueva Clase</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <p className="text-center text-muted mb-4">Completa los siguientes campos para configurar tu nueva clase.</p>
                <Form noValidate onSubmit={handleFormSubmit}>
                    <InputGroup className="mb-3">
                        <InputGroup.Text className="icon-prefix"><FontAwesomeIcon icon={faBuildingColumns} /></InputGroup.Text>
                        <Form.Select value={selectedInstitution} onChange={(e) => setSelectedInstitution(e.target.value)} required>
                            <option value="">Seleccionar institución...</option>
                            {institutions.length > 0 ? (
                                institutions.map((inst) => (
                                    <option key={inst.id_insti} value={inst.id_insti}>{inst.insti_name}</option>
                                ))
                            ) : (
                                <option disabled>Cargando...</option>
                            )}
                        </Form.Select>
                    </InputGroup>
                    <Row>
                        <Col md={6}>
                            <InputGroup className="mb-3">
                                <InputGroup.Text className="icon-prefix"><FontAwesomeIcon icon={faGraduationCap} /></InputGroup.Text>
                                <Form.Select value={grate} onChange={(e) => setGrate(e.target.value)} required>
                                    <option value="">Grado...</option>
                                    <option value="4to">4to Grado</option>
                                    <option value="5to">5to Grado</option>
                                    <option value="6to">6to Grado</option>
                                    <option value="7mo">7mo Grado</option>
                                </Form.Select>
                            </InputGroup>
                        </Col>
                        <Col md={6}>
                            <InputGroup className="mb-3">
                                <InputGroup.Text className="icon-prefix"><FontAwesomeIcon icon={faTag} /></InputGroup.Text>
                                <Form.Control type="text" placeholder="Sección (Ej: A)" value={section} onChange={(e) => setSection(e.target.value.toUpperCase())} maxLength={1} required />
                            </InputGroup>
                        </Col>
                    </Row>
                    <InputGroup className="mb-3">
                        <InputGroup.Text className="icon-prefix"><FontAwesomeIcon icon={faUsers} /></InputGroup.Text>
                        <Form.Control type="number" placeholder="Capacidad Máxima (Ej: 30)" value={maxCapacity} onChange={(e) => setMaxCapacity(e.target.value)} min={1} max={50} required />
                    </InputGroup>
                    <Button type="submit" className="btn-create-room w-100 fw-bold mt-3" size="lg">
                        Crear Clase
                    </Button>
                </Form>
            </Modal.Body>
        </Modal>
    );
}

export default CreateRoom;