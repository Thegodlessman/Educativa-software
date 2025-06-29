import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Modal, Form, Spinner, Alert, Col, Row } from 'react-bootstrap';
import axios from 'axios';
import { notifySuccess, notifyError } from '../../utils/notify';

const InstitutionManagement = () => {
    const [institutions, setInstitutions] = useState([]);
    const [parishes, setParishes] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentInstitution, setCurrentInstitution] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const institutionsRes = await axios.get(`${import.meta.env.VITE_BACKEND_URL}api/admin/institutions`, config);
            
            const parishesRes = await axios.get(`${import.meta.env.VITE_BACKEND_URL}profile/get/parishesByMunicipality/some-default-municipality-id`, config);

            setInstitutions(institutionsRes.data || []);
            setParishes(parishesRes.data.parishes || []);

        } catch (error) {
            notifyError('Error al cargar los datos.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleShowCreate = () => {
        setCurrentInstitution({ insti_name: '', insti_descrip: '', id_location: '' });
        setIsEditing(false);
        setShowModal(true);
    };

    const handleShowEdit = (institution) => {
        setCurrentInstitution(institution);
        setIsEditing(true);
        setShowModal(true);
    };

    const handleDelete = async (instiId) => {
        if (window.confirm('¿Estás seguro? Las clases asociadas podrían impedir la eliminación.')) {
            try {
                const token = localStorage.getItem('token');
                await axios.delete(`${import.meta.env.VITE_BACKEND_URL}api/admin/institutions/${instiId}`, { headers: { Authorization: `Bearer ${token}` } });
                notifySuccess('Institución eliminada.');
                fetchData();
            } catch (error) {
                notifyError(error.response?.data?.message || 'Error al eliminar.');
            }
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const url = isEditing
            ? `${import.meta.env.VITE_BACKEND_URL}api/admin/institutions/${currentInstitution.id_insti}`
            : `${import.meta.env.VITE_BACKEND_URL}api/admin/institutions`;
        const method = isEditing ? 'put' : 'post';

        try {
            await axios[method](url, currentInstitution, config);
            notifySuccess(`Institución ${isEditing ? 'actualizada' : 'creada'} con éxito.`);
            setShowModal(false);
            fetchData();
        } catch (error) {
            notifyError(error.response?.data?.message || 'Error al guardar.');
        }
    };

    const handleChange = (e) => {
        setCurrentInstitution(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Gestión de Instituciones</h2>
                <Button onClick={handleShowCreate}>Crear Institución</Button>
            </div>
            {loading ? <Spinner animation="border" /> : (
                <Table striped bordered hover responsive>
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Descripción</th>
                            <th>Localidad (Parroquia)</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {institutions.map(inst => (
                            <tr key={inst.id_insti}>
                                <td>{inst.insti_name}</td>
                                <td>{inst.insti_descrip}</td>
                                <td>{inst.parish_name}, {inst.municipality_name}</td>
                                <td>
                                    <Button variant="primary" size="sm" onClick={() => handleShowEdit(inst)}>Editar</Button>{' '}
                                    <Button variant="danger" size="sm" onClick={() => handleDelete(inst.id_insti)}>Eliminar</Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            )}

            <Modal show={showModal} onHide={() => setShowModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>{isEditing ? 'Editar' : 'Crear'} Institución</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {currentInstitution && (
                        <Form onSubmit={handleSave}>
                            <Form.Group className="mb-3">
                                <Form.Label>Nombre</Form.Label>
                                <Form.Control type="text" name="insti_name" value={currentInstitution.insti_name} onChange={handleChange} required />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Descripción</Form.Label>
                                <Form.Control as="textarea" name="insti_descrip" value={currentInstitution.insti_descrip} onChange={handleChange} required />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Parroquia</Form.Label>
                                <Form.Select name="id_location" value={currentInstitution.id_location} onChange={handleChange} required>
                                    <option value="">Seleccione una parroquia...</option>
                                    {/* Nota: Necesitarás un selector completo de País->Estado->etc para esto */}
                                    {parishes.map(p => <option key={p.id_parish} value={p.id_parish}>{p.parish_name}</option>)}
                                </Form.Select>
                            </Form.Group>
                            <Button variant="primary" type="submit">Guardar</Button>
                        </Form>
                    )}
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default InstitutionManagement;