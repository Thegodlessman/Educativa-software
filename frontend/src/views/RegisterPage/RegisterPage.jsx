import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import RegisterForm from '../../components/RegisterForm/RegisterForm';
import './RegisterPage.css';

function RegisterPage() {
    return (
        <Container fluid className="register-page-wrapper">
            <Row className="register-container w-100 my-5 mx-auto shadow-lg">
                <Col md={6} className="register-info-section p-5 d-none d-md-flex flex-column justify-content-center">
                    <h1 className="display-4 fw-bold text-white mb-4">Únete a Educativa</h1>
                    <p className="lead text-white">
                        Crea tu cuenta para empezar a disfrutar de todos los beneficios de nuestra plataforma educativa. ¡El proceso es rápido y fácil!
                    </p>
                </Col>
                <Col md={6} className="form-section p-5 d-flex align-items-center justify-content-center">
                    <RegisterForm />
                </Col>
            </Row>
        </Container>
    );
}

export default RegisterPage;