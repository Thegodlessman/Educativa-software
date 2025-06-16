import React, { useState, useContext } from "react";
import { Form, Button, Alert, InputGroup } from 'react-bootstrap';
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { ClassContext } from "../../context/ClassContext";
import { notifyError, notifySuccess } from '../../utils/notify';
import logo from '../../../src/assets/logo.png';
import './LoginForm.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faLock } from '@fortawesome/free-solid-svg-icons';

function LoginForm() {
    const navigate = useNavigate();
    const [user_email, setEmail] = useState('');
    const [user_password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [errors, setErrors] = useState({});
    const [pressButton, setPressButton] = useState(false);
    const { setToken } = useContext(ClassContext);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setErrors({});
        setPressButton(true);

        try {
            const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}login`, { user_email, user_password });
            if (response.data && response.data.tokenSession) {
                const { tokenSession } = response.data;
                localStorage.setItem('token', tokenSession);
                setToken(tokenSession);
                notifySuccess("Se ha iniciado sesión correctamente.");
                navigate("/profile");
            } else {
                notifyError("Respuesta inesperada del servidor al iniciar sesión.");
            }
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
                notifyError(error.response?.data?.message || "Error al conectar con el servidor.");
            }
        } finally {
            setPressButton(false);
        }
    };
    
    const redirectHome = () => {
        navigate("/");
    };

    return (
        <div className="login-form-container">
            <div className="text-center mb-4" onClick={redirectHome} style={{ cursor: 'pointer' }}>
                <img className="me-2" src={logo} width="60" height="60" alt="logo de educativa" />
                <h1 className="logo-title fw-bolder d-inline-block align-middle">Educativa</h1>
            </div>

            <h2 className="mb-4 fw-bold text-center">Acceso de Usuario</h2>
            
            <Form onSubmit={handleSubmit} noValidate>

                <InputGroup className="mb-3">
                    <InputGroup.Text className="icon-prefix">
                        <FontAwesomeIcon icon={faEnvelope} />
                    </InputGroup.Text>
                    <Form.Control
                        className="input-login"
                        type="email"
                        placeholder="Correo electrónico"
                        value={user_email}
                        onChange={(e) => setEmail(e.target.value)}
                        isInvalid={!!errors.user_email}
                        size="lg"
                        aria-label="Correo electrónico"
                    />
                </InputGroup>

                <InputGroup className="mb-3">
                    <InputGroup.Text className="icon-prefix">
                        <FontAwesomeIcon icon={faLock} />
                    </InputGroup.Text>
                    <Form.Control
                        className="input-login"
                        type="password"
                        placeholder="Contraseña"
                        value={user_password}
                        onChange={(e) => setPassword(e.target.value)}
                        isInvalid={!!errors.user_password}
                        size="lg"
                        aria-label="Contraseña"
                    />
                </InputGroup>

                <div className="d-flex justify-content-between align-items-center mb-4">
                    <Form.Check
                        type="checkbox"
                        label="Recordarme"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        id="rememberMeCheckbox"
                    />
                    <a className="small" href="/forgot-password">¿Olvidaste tu contraseña?</a>
                </div>


                {pressButton ? (
                    <div className='text-center py-2'>
                        <l-ping size="45" speed="2" color="#4f46e5"></l-ping>
                    </div>
                ) : (
                    <Button type="submit" className="btn-login w-100 fw-bold" size="lg">
                        Iniciar Sesión
                    </Button>
                )}

                <div className="text-center mt-4 small">
                    ¿No tienes cuenta? <a className="fw-bold" href="/register">Regístrate aquí</a>
                </div>
            </Form>
        </div>
    );
}

export default LoginForm;