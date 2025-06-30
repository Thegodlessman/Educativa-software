import React, { useState } from "react";
import { Form, Button, InputGroup, Row, Col } from "react-bootstrap";
import axios from "axios";
import { ping } from "ldrs";
import { notifyError, notifySuccess } from "../../utils/notify";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faIdCard, faEnvelope, faCamera } from '@fortawesome/free-solid-svg-icons';
import './RegisterStudentForm.css';

ping.register();

function RegisterStundentForm({ id_room }) {
    const [formData, setFormData] = useState({
        user_name: "",
        user_lastname: "",
        user_ced: "",
        user_email: ""
    });
    const [errors, setErrors] = useState({});
    const [pressButton, setPressButton] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [selectedImage, setSelectedImage] = useState(null);

    const handleInputChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) { notifyError("El archivo es demasiado grande (Máx 5MB)."); return; }
        if (!file.type.startsWith('image/')) { notifyError("Por favor, selecciona un archivo de imagen válido."); return; }
        setSelectedImage(file);
        const reader = new FileReader();
        reader.onloadend = () => setPreviewUrl(reader.result);
        reader.readAsDataURL(file);
    };

    const removeImage = () => {
        setSelectedImage(null);
        setPreviewUrl(null);
        document.getElementById('file-upload-student').value = "";
    };

    const resetForm = () => {
        setFormData({ user_name: "", user_lastname: "", user_ced: "", user_email: "" });
        removeImage();
        setErrors({});
        setPressButton(false);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setErrors({});
        setPressButton(true);
        
        const data = new FormData();
        Object.keys(formData).forEach(key => data.append(key, formData[key]));
        if (selectedImage) {
            data.append('photo', selectedImage);
        }

        try {
            await axios.post(`${import.meta.env.VITE_BACKEND_URL}users/${id_room}/register-student`, data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            notifySuccess("¡El estudiante ha sido registrado exitosamente!");
            resetForm();
        } catch (error) {
            const errData = error.response?.data;
            if (errData?.errors) {
                const fieldErrors = errData.errors.reduce((acc, err) => ({ ...acc, [err.path]: err.msg }), {});
                setErrors(fieldErrors);
                notifyError(errData.errors[0]?.msg || "Error de validación.");
            } else {
                notifyError(errData?.message || "Error en el registro.");
            }
        } finally {
            setPressButton(false);
        }
    };

    return (
        <div className="register-student-container">
            <h2 className="mb-4 fw-bold text-center">Registro Rápido de Estudiantes</h2>
            <Form noValidate onSubmit={handleSubmit}>
                <Row className="align-items-center">
                    <Col md={7}>
                        <Form.Group className="mb-3">
                            <InputGroup>
                                <InputGroup.Text className="icon-prefix"><FontAwesomeIcon icon={faUser} /></InputGroup.Text>
                                <Form.Control type="text" placeholder="Nombre" name="user_name" value={formData.user_name} onChange={handleInputChange} isInvalid={!!errors.user_name} />
                            </InputGroup>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <InputGroup>
                                <InputGroup.Text className="icon-prefix"><FontAwesomeIcon icon={faUser} /></InputGroup.Text>
                                <Form.Control type="text" placeholder="Apellido" name="user_lastname" value={formData.user_lastname} onChange={handleInputChange} isInvalid={!!errors.user_lastname} />
                            </InputGroup>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <InputGroup>
                                <InputGroup.Text className="icon-prefix"><FontAwesomeIcon icon={faIdCard} /></InputGroup.Text>
                                <Form.Control type="text" placeholder="Cédula" name="user_ced" value={formData.user_ced} onChange={handleInputChange} isInvalid={!!errors.user_ced} />
                            </InputGroup>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <InputGroup>
                                <InputGroup.Text className="icon-prefix"><FontAwesomeIcon icon={faEnvelope} /></InputGroup.Text>
                                <Form.Control type="email" placeholder="Correo" name="user_email" value={formData.user_email} onChange={handleInputChange} isInvalid={!!errors.user_email} />
                            </InputGroup>
                        </Form.Group>
                    </Col>
                    <Col md={5}>
                        <div className="d-flex flex-column align-items-center justify-content-center">
                            <label htmlFor="file-upload-student" className="upload-zone-student">
                                {previewUrl ? (
                                    <img src={previewUrl} alt="Vista previa" className="preview-image-student" />
                                ) : (
                                    <div className="upload-placeholder-student">
                                        <FontAwesomeIcon icon={faCamera} size="3x" />
                                        <span>Subir foto (Opcional)</span>
                                    </div>
                                )}
                            </label>
                            <input id="file-upload-student" type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
                            {previewUrl && <Button variant="link" className="text-danger mt-2" onClick={removeImage}>Quitar Imagen</Button>}
                        </div>
                    </Col>
                </Row>

                <div className="mt-4">
                    {pressButton ? (
                        <div className='text-center py-2'>
                            <l-ping size="45" speed="2" color="#8552aa"></l-ping>
                        </div>
                    ) : (
                        <Button type="submit" className="btn-register-student w-100 fw-bold" size="lg">
                            Registrar Estudiante
                        </Button>
                    )}
                </div>
            </Form>
        </div>
    );
}

export default RegisterStundentForm;