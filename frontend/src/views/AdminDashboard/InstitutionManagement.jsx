import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Modal, Form, Spinner, Col, Row, Pagination } from 'react-bootstrap';
import { FiPlus, FiEdit, FiTrash2, FiMapPin, FiSave, FiX } from 'react-icons/fi';
import axios from 'axios';
import { notifySuccess, notifyError } from '../../utils/notify';

const InstitutionManagement = () => {
    const [institutions, setInstitutions] = useState([]);
    const [parishes, setParishes] = useState([]);
    const [countries, setCountries] = useState([]);
    const [states, setStates] = useState([]);
    const [municipalities, setMunicipalities] = useState([]);
    // pagination
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 8;
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
            // Obtener países (endpoint público en profile)
            const countriesRes = await axios.get(`${import.meta.env.VITE_BACKEND_URL}profile/get/countries`);
            // Usamos la ruta admin para obtener todas las parroquias como respaldo
            const parishesRes = await axios.get(`${import.meta.env.VITE_BACKEND_URL}api/admin/parishes`, config);

            setInstitutions(institutionsRes.data || []);
            setCountries(countriesRes.data.countries || []);
            setParishes(Array.isArray(parishesRes.data) ? parishesRes.data : (parishesRes.data.parishes || []));

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
        setCurrentInstitution({ insti_name: '', insti_descrip: '', id_location: '', country_id: '', state_id: '', municipality_id: '' });
        setIsEditing(false);
        setShowModal(true);
    };

    const handleShowEdit = (institution) => {
        // Obtener datos frescos desde backend
        (async () => {
            try {
                const token = localStorage.getItem('token');
                const config = { headers: { Authorization: `Bearer ${token}` } };
                const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}api/admin/institutions/${institution.id_insti}`, config);
                const inst = res.data;
                setCurrentInstitution({
                    ...inst,
                    country_id: inst.id_country || '',
                    state_id: inst.id_state || '',
                    municipality_id: inst.id_municipality || ''
                });

                if (inst.id_country) await fetchStates(inst.id_country);
                if (inst.id_state) await fetchMunicipalities(inst.id_state);
                if (inst.id_municipality) await fetchParishes(inst.id_municipality);

                setIsEditing(true);
                setShowModal(true);
            } catch (err) {
                notifyError('Error cargando datos de la institución.');
            }
        })();
    };

    const fetchStates = async (countryId) => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}profile/get/stateByCountries/${countryId}`);
            setStates(res.data.states || res.data || []);
        } catch (err) {
            console.error('Error fetching states', err);
        }
    };

    const fetchMunicipalities = async (stateId) => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}profile/get/munByStates/${stateId}`);
            setMunicipalities(res.data.mun || res.data || []);
        } catch (err) {
            console.error('Error fetching municipalities', err);
        }
    };

    const fetchParishes = async (municipalityId) => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}profile/get/parishesByMunicipality/${municipalityId}`);
            // respuesta: { parishes: [...] }
            setParishes(res.data.parishes || res.data || []);
        } catch (err) {
            console.error('Error fetching parishes', err);
        }
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
        const { name, value } = e.target;
        setCurrentInstitution(prev => ({ ...prev, [name]: value }));

        // Si cambia country => cargar estados y limpiar select encadenados
        if (name === 'country_id') {
            setStates([]);
            setMunicipalities([]);
            setParishes([]);
            setCurrentInstitution(prev => ({ ...prev, state_id: '', municipality_id: '', id_location: '' }));
            if (value) fetchStates(value);
        }

        if (name === 'state_id') {
            setMunicipalities([]);
            setParishes([]);
            setCurrentInstitution(prev => ({ ...prev, municipality_id: '', id_location: '' }));
            if (value) fetchMunicipalities(value);
        }

        if (name === 'municipality_id') {
            setParishes([]);
            setCurrentInstitution(prev => ({ ...prev, id_location: '' }));
            if (value) fetchParishes(value);
        }
    };

    // Pagination helpers
    const totalPages = Math.max(1, Math.ceil(institutions.length / pageSize));
    const pagedInstitutions = institutions.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2>Gestión de Instituciones</h2>
                <Button onClick={handleShowCreate} variant="primary"><FiPlus style={{ marginRight: 8 }} />Crear Institución</Button>
            </div>
            {loading ? <Spinner animation="border" /> : (
                <div className="admin-card">
                    <Table striped hover responsive>
                        <thead>
                            <tr>
                                <th>Nombre</th>
                                <th>Descripción</th>
                                <th>Localidad (Parroquia)</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pagedInstitutions.map(inst => (
                                <tr key={inst.id_insti}>
                                    <td>{inst.insti_name}</td>
                                    <td>{inst.insti_descrip}</td>
                                    <td>{inst.parish_name}, {inst.municipality_name}</td>
                                    <td>
                                        <div className="admin-actions">
                                            <Button variant="outline-primary" size="sm" onClick={() => handleShowEdit(inst)}><FiEdit /> Editar</Button>
                                            <Button variant="outline-danger" size="sm" onClick={() => handleDelete(inst.id_insti)}><FiTrash2 /> Eliminar</Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                    <div className="d-flex justify-content-end">
                        <Pagination>
                            <Pagination.First onClick={() => handlePageChange(1)} disabled={currentPage === 1} />
                            <Pagination.Prev onClick={() => handlePageChange(Math.max(1, currentPage - 1))} disabled={currentPage === 1} />
                            {Array.from({ length: totalPages }).map((_, idx) => (
                                <Pagination.Item key={idx + 1} active={currentPage === idx + 1} onClick={() => handlePageChange(idx + 1)}>{idx + 1}</Pagination.Item>
                            ))}
                            <Pagination.Next onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages} />
                            <Pagination.Last onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages} />
                        </Pagination>
                    </div>
                </div>
            )}

            <Modal size="lg" show={showModal} onHide={() => setShowModal(false)} dialogClassName="admin-modal" contentClassName="admin-modal-content">
                <Modal.Header closeButton>
                    <Modal.Title className="d-flex align-items-center"><FiMapPin style={{ marginRight: 10 }} />{isEditing ? 'Editar' : 'Crear'} Institución</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {currentInstitution && (
                        <div className="admin-card">
                            <Form onSubmit={handleSave}>
                                <Row>
                                    <Col md={8}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Nombre</Form.Label>
                                            <Form.Control type="text" name="insti_name" value={currentInstitution.insti_name} onChange={handleChange} required />
                                        </Form.Group>
                                    </Col>
                                    <Col md={4}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>País</Form.Label>
                                            <Form.Select name="country_id" value={currentInstitution.country_id || ''} onChange={handleChange} required>
                                                <option value="">Seleccione un país...</option>
                                                {countries.map(c => <option key={c.id_country} value={c.id_country}>{c.country_name}</option>)}
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Row>
                                    <Col md={4}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Estado</Form.Label>
                                            <Form.Select name="state_id" value={currentInstitution.state_id || ''} onChange={handleChange} required>
                                                <option value="">Seleccione un estado...</option>
                                                {states.map(s => <option key={s.id_state} value={s.id_state}>{s.state_name}</option>)}
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                    <Col md={4}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Municipio</Form.Label>
                                            <Form.Select name="municipality_id" value={currentInstitution.municipality_id || ''} onChange={handleChange} required>
                                                <option value="">Seleccione un municipio...</option>
                                                {municipalities.map(m => <option key={m.id_municipality} value={m.id_municipality}>{m.municipality_name}</option>)}
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                    <Col md={4}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Parroquia</Form.Label>
                                            <Form.Select name="id_location" value={currentInstitution.id_location || ''} onChange={handleChange} required>
                                                <option value="">Seleccione una parroquia...</option>
                                                {parishes.map(p => <option key={p.id_parish} value={p.id_parish}>{p.parish_name}</option>)}
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Form.Group className="mb-3">
                                    <Form.Label>Descripción</Form.Label>
                                    <Form.Control as="textarea" name="insti_descrip" value={currentInstitution.insti_descrip} onChange={handleChange} required />
                                </Form.Group>
                                <div className="d-flex justify-content-end">
                                    <Button variant="outline-secondary" className="me-2" onClick={() => setShowModal(false)}><FiX /> Cancelar</Button>
                                    <Button variant="primary" type="submit"><FiSave style={{ marginRight: 8 }} />Guardar</Button>
                                </div>
                            </Form>
                        </div>
                    )}
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default InstitutionManagement;