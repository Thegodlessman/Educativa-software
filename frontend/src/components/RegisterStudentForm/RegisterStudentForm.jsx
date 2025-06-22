import React, { useState } from "react";
import { Form, Button, InputGroup, Row, Col } from "react-bootstrap";
import axios from "axios";
import { ping } from "ldrs";
import { notifyError, notifySuccess } from "../../utils/notify";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faIdCard, faEnvelope } from '@fortawesome/free-solid-svg-icons';

ping.register();

function RegisterStundentForm({ id_room }) {
    const [user_name, setName] = useState("");
    const [user_lastname, setLastName] = useState("");
    const [user_ced, setCed_user] = useState("");
    const [user_email, setEmail] = useState("");
    const [errors, setErrors] = useState({});
    const [pressButton, setPressButton] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();

        setErrors({});
        setPressButton(true);

        const studentData = { user_ced, user_name, user_lastname, user_email };

        try {
            await axios.post(`${import.meta.env.VITE_BACKEND_URL}users/${id_room}/register-student`,
                studentData);
            notifySuccess("¡Te has registrado exitosamente!");

            setName("")
            setLastName("")
            setCed_user("")
            setEmail("")
            setErrors("")
            setPressButton(false)
            
        } catch (error) {
            if (error.response?.data?.errors) {
                const backendErrorsArray = error.response.data.errors;

                const fieldErrors = backendErrorsArray.reduce((acc, err) => {
                    if (!acc[err.field]) {
                        acc[err.field] = err.msg;
                    }
                    return acc;
                }, {});
                setErrors(fieldErrors);

                const firstErrorMessage = backendErrorsArray[0]?.msg || "Error de validación.";
                notifyError(firstErrorMessage);

            } else {
                notifyError(error.response?.data?.message || "Error en el registro.");
            }
            setPressButton(false);
        }
    };

    return (
            <div className="register-student-container">
                <h2 className="mb-4 fw-bold text-center">Registro Rapido de Estudiantes</h2>
    
                <Form noValidate onSubmit={handleSubmit}>
                    <Row>
                        <Col sm={6}>
                            <Form.Group className="mb-3">
                                <InputGroup>
                                    <InputGroup.Text className="icon-prefix"><FontAwesomeIcon icon={faUser} /></InputGroup.Text>
                                    <Form.Control type="text" placeholder="Nombre" value={user_name} onChange={(e) => setName(e.target.value)} isInvalid={!!errors.user_name} />
                                    <Form.Control.Feedback type="invalid">{errors.user_name}</Form.Control.Feedback>
                                </InputGroup>
                            </Form.Group>
                        </Col>
                        <Col sm={6}>
                            <Form.Group className="mb-3">
                                <InputGroup>
                                    <InputGroup.Text className="icon-prefix"><FontAwesomeIcon icon={faUser} /></InputGroup.Text>
                                    <Form.Control type="text" placeholder="Apellido" value={user_lastname} onChange={(e) => setLastName(e.target.value)} isInvalid={!!errors.user_lastname} />
                                    <Form.Control.Feedback type="invalid">{errors.user_lastname}</Form.Control.Feedback>
                                </InputGroup>
                            </Form.Group>
                        </Col>
                    </Row>
    
                    <Form.Group className="mb-3">
                        <InputGroup>
                            <InputGroup.Text className="icon-prefix"><FontAwesomeIcon icon={faIdCard} /></InputGroup.Text>
                            <Form.Control type="text" placeholder="Cédula de Identidad" value={user_ced} onChange={(e) => setCed_user(e.target.value)} isInvalid={!!errors.user_ced} />
                            <Form.Control.Feedback type="invalid">{errors.user_ced}</Form.Control.Feedback>
                        </InputGroup>
                    </Form.Group>
    
                    <Form.Group className="mb-3">
                        <InputGroup>
                            <InputGroup.Text className="icon-prefix"><FontAwesomeIcon icon={faEnvelope} /></InputGroup.Text>
                            <Form.Control type="email" placeholder="Correo Electrónico" value={user_email} onChange={(e) => setEmail(e.target.value)} isInvalid={!!errors.user_email} />
                            <Form.Control.Feedback type="invalid">{errors.user_email}</Form.Control.Feedback>
                        </InputGroup>
                    </Form.Group>
    
                    {pressButton ? (
                        <div className='text-center py-2'>
                            <l-ping size="45" speed="2" color="#4f46e5"></l-ping>
                        </div>
                    ) : (
                        <Button type="submit" className="btn-register w-100 fw-bold" size="lg">
                            Registrar Estudiante
                        </Button>
                    )}
                </Form>
            </div>
        );
}

export default RegisterStundentForm