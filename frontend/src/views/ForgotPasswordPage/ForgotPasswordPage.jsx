import React, { useState } from 'react';
import { Form, Button, Card, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import logo from '../../assets/logo.png';
import '../../styles/AuthForm.css';

function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await axios.post(`${import.meta.env.VITE_BACKEND_URL}forgot-password`, { user_email: email });
            setSubmitted(true);
        } catch (err) {
            console.error("Error en la solicitud de forgot-password:", err);
            setSubmitted(true); 
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
                        <h2 className="mt-3">Recuperar Contraseña</h2>
                    </div>
                    {submitted ? (
                        <Alert variant="success" className="text-center">
                            <Alert.Heading>¡Solicitud enviada!</Alert.Heading>
                            <p className="mb-0">Si tu correo está registrado, recibirás un enlace.</p>
                            <hr />
                            <Link to="/login">Volver a Inicio de Sesión</Link>
                        </Alert>
                    ) : (
                        <>
                            <p className="text-center text-muted mb-4">Ingresa tu correo para enviarte un enlace de recuperación.</p>
                            <Form onSubmit={handleSubmit}>
                                <Form.Group controlId="formBasicEmail">
                                    <Form.Label>Correo Electrónico</Form.Label>
                                    <Form.Control type="email" placeholder="ejemplo@correo.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                                </Form.Group>
                                <button variant="primary" type="submit" className="w-100 mt-4 auth-form-button" disabled={loading}>
                                    {loading ? (<Spinner as="span" animation="border" size="sm"/>) : (<FontAwesomeIcon icon={faPaperPlane} className="me-2" />)}
                                    {loading ? 'Enviando...' : 'Enviar Enlace'}
                                </button>
                            </Form>
                        </>
                    )}
                </Card.Body>
                {!submitted && (
                    <Card.Footer className="text-center"><small><Link to="/login">Volver a Inicio de Sesión</Link></small></Card.Footer>
                )}
            </Card>
        </div>
    );
}

export default ForgotPasswordPage;