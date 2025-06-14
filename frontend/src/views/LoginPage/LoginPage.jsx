import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import LoginForm from '../../components/LoginForm/LoginForm';
import './LoginPage.css';

function LoginPage() {
    return (
        <Container fluid className="login-page-wrapper">
            <Row className="login-container w-100 my-5 mx-auto shadow-lg">
                <Col md={6} className="login-info-section p-5 d-none d-md-flex flex-column justify-content-center">
                    <h1 className="display-4 fw-bold text-white mb-4">Bienvenido a Educativa</h1>
                    <p className="lead text-white-75">
                        Accede a tu cuenta para gestionar tus clases. Estamos contentos de tenerte aquí.
                    </p>
                </Col>
                <Col md={6} className="form-section p-5 d-flex align-items-center justify-content-center">
                    <LoginForm />
                </Col>
            </Row>
        </Container>
    );
}

export default LoginPage;