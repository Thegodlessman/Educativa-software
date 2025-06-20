import React, { useState } from "react";
import { Form, Button, InputGroup, Row, Col } from "react-bootstrap";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { ping } from "ldrs";
import { notifyError, notifySuccess } from "../../utils/notify";
import logo from '../../../src/assets/logo.png';
import './RegisterForm.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faIdCard, faEnvelope, faLock } from '@fortawesome/free-solid-svg-icons';

ping.register();

function RegisterForm() {
    const navigate = useNavigate();
    const [user_name, setName] = useState("");
    const [user_lastname, setLastName] = useState("");
    const [user_ced, setCed_user] = useState("");
    const [user_email, setEmail] = useState("");
    const [user_password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [errors, setErrors] = useState({});
    const [pressButton, setPressButton] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (user_password !== confirmPassword) {
            notifyError("Las contraseñas no coinciden.");
            return;
        }

        setErrors({});
        setPressButton(true);

        const userData = { user_ced, user_name, user_lastname, user_email, user_password };

        try {
            await axios.post(`${import.meta.env.VITE_BACKEND_URL}users`, userData);
            notifySuccess("¡Te has registrado exitosamente!");
            setTimeout(() => {
                navigate("/login");
            }, 1500);
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

    const redirectHome = () => {
        navigate("/");
    };

    return (
        <div className="register-form-container">
            <div className="text-center mb-4" onClick={redirectHome} style={{ cursor: 'pointer' }}>
                <img className="me-2" src={logo} width="60" height="60" alt="logo de educativa" />
                <h1 className="logo-title fw-bolder d-inline-block align-middle">Educativa</h1>
            </div>

            <h2 className="mb-4 fw-bold text-center">Crear una Cuenta</h2>

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

                <Form.Group className="mb-3">
                    <InputGroup>
                        <InputGroup.Text className="icon-prefix"><FontAwesomeIcon icon={faLock} /></InputGroup.Text>
                        <Form.Control type="password" placeholder="Contraseña" value={user_password} onChange={(e) => setPassword(e.target.value)} isInvalid={!!errors.user_password} />
                        <Form.Control.Feedback type="invalid">{errors.user_password}</Form.Control.Feedback>
                    </InputGroup>
                </Form.Group>

                <Form.Group className="mb-3">
                    <InputGroup>
                        <InputGroup.Text className="icon-prefix"><FontAwesomeIcon icon={faLock} /></InputGroup.Text>
                        <Form.Control type="password" placeholder="Confirmar Contraseña" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} isInvalid={!!errors.confirmPassword} />
                        <Form.Control.Feedback type="invalid">{errors.confirmPassword}</Form.Control.Feedback>
                    </InputGroup>
                </Form.Group>

                {pressButton ? (
                    <div className='text-center py-2'>
                        <l-ping size="45" speed="2" color="#4f46e5"></l-ping>
                    </div>
                ) : (
                    <Button type="submit" className="btn-register w-100 fw-bold" size="lg">
                        Crear Cuenta
                    </Button>
                )}

                <div className="text-center mt-4 small">
                    ¿Ya tienes una cuenta? <a className="fw-bold" href="/login">Inicia Sesión</a>
                </div>
            </Form>
        </div>
    );
}

export default RegisterForm;