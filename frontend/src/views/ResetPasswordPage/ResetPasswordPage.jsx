import React, { useState } from 'react';
import { Form, Button, Card, Spinner, Alert } from 'react-bootstrap';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faKey, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { notifyError, notifySuccess } from '../../utils/notify';
import logo from '../../assets/logo.png';
import '../../styles/AuthForm.css';

function ResetPasswordPage() {
    const { token } = useParams();
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError("Las contraseñas no coinciden.");
            notifyError("Las contraseñas no coinciden.");
            return;
        }

        if (password.length < 8) {
             setError("La contraseña debe tener al menos 8 caracteres.");
             notifyError("La contraseña debe tener al menos 8 caracteres.");
             return;
        }

        setLoading(true);

        try {
            const response = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}reset-password/${token}`, 
                { password }
            );
            
            notifySuccess(response.data.message);
            setSuccess(true);

            setTimeout(() => {
                navigate('/login');
            }, 3000);

        } catch (err) {
            if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
                const firstErrorMessage = err.response.data.errors[0]?.msg || "Error de validación.";
                setError(firstErrorMessage); 
                notifyError(firstErrorMessage); 
            } else {
                const errorMessage = err.response?.data?.message || "Ocurrió un error inesperado.";
                setError(errorMessage);
                notifyError(errorMessage);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-form-container"> 
            <Card className="auth-form-card shadow-lg">
                <Card.Body>
                    <div className="text-center mb-4">
                        <Link to="/">
                            <img src={logo} alt="Educativa Logo" className="auth-form-logo" />
                        </Link>
                        <h2 className="mt-3">Establecer Nueva Contraseña</h2>
                    </div>
                    {success ? (
                        <Alert variant="success" className="text-center">
                            <Alert.Heading><FontAwesomeIcon icon={faCheckCircle} size="2x" /></Alert.Heading>
                            <p className="mb-0">¡Contraseña actualizada con éxito!</p>
                            <p>Redirigiendo al inicio de sesión...</p>
                        </Alert>
                    ) : (
                        <>
                            <p className="text-center text-muted mb-4">Introduce tu nueva contraseña.</p>
                            <Form onSubmit={handleSubmit}>
                                {error && <Alert variant="danger">{error}</Alert>}
                                <Form.Group className="mb-3" controlId="formNewPassword">
                                    <Form.Label>Nueva Contraseña</Form.Label>
                                    <Form.Control type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                                </Form.Group>
                                <Form.Group className="mb-3" controlId="formConfirmPassword">
                                    <Form.Label>Confirmar Contraseña</Form.Label>
                                    <Form.Control type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                                </Form.Group>
                                <button variant="primary" type="submit" className="w-100 mt-3 auth-form-button btn-green" disabled={loading}> {/* <-- 3. Añadida clase 'btn-green' */}
                                    {loading ? (<Spinner as="span" animation="border" size="sm"/>) : (<FontAwesomeIcon icon={faKey} className="me-2" />)}
                                    {loading ? 'Actualizando...' : 'Actualizar Contraseña'}
                                </button>
                            </Form>
                        </>
                    )}
                </Card.Body>
            </Card>
        </div>
    );
}

export default ResetPasswordPage;