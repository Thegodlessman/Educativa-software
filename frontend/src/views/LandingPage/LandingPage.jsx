import React from 'react';
import { Container, Row, Col, Button, Accordion } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faVial, faBookOpen, faChalkboardTeacher, faQuoteLeft, faRocket } from '@fortawesome/free-solid-svg-icons';
import NavBar from "../../components/Navbar/Navbar";
import './LandingPage.css';

const heroImage = import.meta.env.VITE_CLOUDNARY_IMAGE + 'educativa/welcome1'
const uruLogo = import.meta.env.VITE_CLOUDNARY_IMAGE + 'educativa/uru-logo'

function LandingPage() {

    // --- Contenido extraído de la tesis ---
    const features = [
        { icon: faVial, title: "Detección Temprana Adaptada", description: "Incluye una prueba digital inspirada en los tests CPT para evaluar de forma no invasiva indicadores de atención en estudiantes de 10 a 12 años." },
        { icon: faBookOpen, title: "Biblioteca de Recursos Pedagógicos", description: "Ofrece videos y libros de apoyo para que los docentes puedan construir sus propias estrategias pedagógicas personalizadas para estudiantes con TDAH." },
        { icon: faChalkboardTeacher, title: "Gestión Sencilla del Aula", description: "Permite registrar estudiantes, aplicar pruebas y visualizar métricas e indicadores de cada alumno de forma clara y centralizada." },
    ];
    const faqs = [
        { q: "¿Qué es 'Educativa' exactamente?", a: "Educativa es un software educativo de apoyo, resultado de un Trabajo Especial de Grado de la Universidad Rafael Urdaneta, diseñado para ayudar a docentes a identificar y orientar a estudiantes con posibles indicadores de TDAH." },
        { q: "¿Cómo funciona la prueba de detección?", a: "La plataforma incluye un módulo de diagnóstico inspirado en las Pruebas de Rendimiento Continuo (CPT). A través de una tarea repetitiva, evalúa la atención sostenida y el control inhibitorio, que son aspectos clave en el TDAH." },
        { q: "¿Este software reemplaza un diagnóstico clínico profesional?", a: "No. Es muy importante aclarar que 'Educativa' es una herramienta de apoyo y orientación para el docente. Su objetivo es facilitar la detección temprana de indicadores, pero no constituye un diagnóstico clínico, el cual debe ser realizado por un profesional especializado." },
        { q: "¿Para qué rango de edad está diseñado?", a: "El software está específicamente diseñado y validado para un rango de edad de 10 a 12 años, correspondiente a la etapa final de la educación primaria." },
    ];

    return (
        <>
            <NavBar />
            <div className="landing-page">

                {/* === SECCIÓN HERO === */}
                <header className="hero-section">
                    <Container>
                        <Row className="align-items-center">
                            <Col lg={6} className="hero-text">
                                <h1 className="display-4 fw-bold">Apoyo al Docente en la Detección y Orientación del TDAH</h1>
                                <p className="lead my-4">"Educativa" es un software que nace de la investigación académica para ofrecer a los docentes herramientas prácticas en la identificación y manejo del TDAH en el aula.</p>
                                <Button href="/register" className="btn-landing me-3" size="lg">Explorar Herramienta</Button>
                                <Button href="#project-purpose" className="btn-landing-2" variant="outline-secondary" size="lg">Conocer el Proyecto</Button>
                            </Col>
                            <Col lg={6} className="d-none d-lg-block">
                                <img src={heroImage} alt="Ilustración de apoyo educativo" className="img-fluid hero-image" />
                            </Col>
                        </Row>
                    </Container>
                </header>

                {/* === NUEVA SECCIÓN: CONTEXTO DEL PROYECTO === */}
                <section id="project-purpose" className="project-purpose-section">
                    <Container>
                        <Row className="align-items-center">
                            <Col lg={4} className="text-center">
                                <img src={uruLogo} alt="Logo Universidad Rafael Urdaneta" className="uru-logo mb-3" />
                            </Col>
                            <Col lg={8}>
                                <h2 className="section-title">Un Proyecto con Propósito Académico</h2>
                                <p className="section-subtitle text-start">"Educativa" es el resultado del Trabajo Especial de Grado para optar al título de Ingeniero en Computación en la <strong>Universidad Rafael Urdaneta</strong>.</p>
                                <p className="mt-3">Nace de la necesidad real identificada en la U.E. San Rafael, donde los docentes manifestaron la falta de herramientas para apoyar a estudiantes con TDAH. Este proyecto busca cerrar esa brecha, aplicando la tecnología para crear un entorno de aprendizaje más inclusivo.</p>
                                <p className="text-muted mt-4">Autores: Br. Luis Chang & Br. Sophia Molina</p>
                            </Col>
                        </Row>
                    </Container>
                </section>


                {/* === SECCIÓN DE CARACTERÍSTICAS CLAVE === */}
                <section id="features" className="features-section">
                    <Container>
                        <div className="text-center mb-5">
                            <h2 className="section-title">Características Clave del Software</h2>
                            <p className="section-subtitle">Diseñado con base en las necesidades reales del aula.</p>
                        </div>
                        <Row className="g-4">
                            {features.map((feature, index) => (
                                <Col md={4} key={index}>
                                    <div className="feature-card">
                                        <div className="feature-icon-wrapper"><FontAwesomeIcon icon={feature.icon} className="feature-icon" /></div>
                                        <h4 className="feature-title">{feature.title}</h4>
                                        <p className="feature-description">{feature.description}</p>
                                    </div>
                                </Col>
                            ))}
                        </Row>
                    </Container>
                </section>
                
                {/* === SECCIÓN DE PREGUNTAS FRECUENTES (FAQ) === */}
                <section className="faq-section">
                    <Container>
                        <div className="text-center mb-5">
                            <h2 className="section-title">Preguntas Frecuentes</h2>
                            <p className="section-subtitle">Aclarando dudas sobre el proyecto "Educativa".</p>
                        </div>
                        <Row className="justify-content-center">
                            <Col md={8}>
                                <Accordion defaultActiveKey="0" flush>
                                    {faqs.map((faq, index) => (
                                        <Accordion.Item eventKey={String(index)} key={index} className="faq-item">
                                            <Accordion.Header>{faq.q}</Accordion.Header>
                                            <Accordion.Body>{faq.a}</Accordion.Body>
                                        </Accordion.Item>
                                    ))}
                                </Accordion>
                            </Col>
                        </Row>
                    </Container>
                </section>

                {/* === SECCIÓN FINAL DE LLAMADA A LA ACCIÓN (CTA) === */}
                <section className="cta-section">
                    <Container className="text-center">
                        <FontAwesomeIcon icon={faRocket} size="3x" className="mb-3" />
                        <h2 className="display-5 fw-bold">Explora el Potencial de Educativa</h2>
                        <p className="lead my-4">Descubre cómo la tecnología puede ser una aliada en la creación de aulas más inclusivas.</p>
                        <Button href="/register" className="btn-landing" size="lg">Probar la Herramienta</Button>
                    </Container>
                </section>

                {/* === FOOTER === */}
                <footer className="footer-section">
                    <Container className="text-center">
                        <p className="text-white-50">"Educativa" - Un Trabajo Especial de Grado para optar al título de Ingeniero en Computación.</p>
                        <p><strong>Autores: Luis Chang & Sophia Molina</strong> | Tutor: Ing. Jesús Fernández</p>
                        <p>Universidad Rafael Urdaneta | Maracaibo, Venezuela {new Date().getFullYear()}</p>
                    </Container>
                </footer>
            </div>
        </>
    );
}

export default LandingPage;