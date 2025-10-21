import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Modal, Form, Spinner, Alert, Tabs, Tab } from 'react-bootstrap';
import axios from 'axios';
import { notifySuccess, notifyError } from '../../utils/notify';

const MaterialManagement = () => {
    const [materials, setMaterials] = useState([]);
    const [materialTypes, setMaterialTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [savingMaterial, setSavingMaterial] = useState(false);
    const [savingType, setSavingType] = useState(false);
    const [searchMaterials, setSearchMaterials] = useState('');
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    // modals
    const [showMaterialModal, setShowMaterialModal] = useState(false);
    const [showTypeModal, setShowTypeModal] = useState(false);
    const [isEditingMaterial, setIsEditingMaterial] = useState(false);
    const [isEditingType, setIsEditingType] = useState(false);
    const [currentMaterial, setCurrentMaterial] = useState(null);
    const [currentType, setCurrentType] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const materialsRes = await axios.get(`${import.meta.env.VITE_BACKEND_URL}api/admin/support-materials?page=${page}&limit=${limit}&search=${encodeURIComponent(searchMaterials)}`, config);
            const typesRes = await axios.get(`${import.meta.env.VITE_BACKEND_URL}api/admin/material-types`, config);
            setMaterials(materialsRes.data.items || []);
            setTotalPages(materialsRes.data.totalPages || 1);
            setMaterialTypes(typesRes.data || []);
        } catch (error) {
            notifyError("Error al cargar los materiales.");
        } finally {
            setLoading(false);
        }
    }, [page, limit, searchMaterials]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Aquí irían las funciones para manejar los modales de edición/creación para materiales y tipos
    // Handlers para CRUD de Materials y Types
    const openCreateMaterial = () => {
        setCurrentMaterial({ id_material_type: '', material_title: '', material_description: '', material_url: '', target_audience: '', source_organization: '', keywords: '' });
        setIsEditingMaterial(false);
        setShowMaterialModal(true);
    };

    const openEditMaterial = async (id_material) => {
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}api/admin/support-materials/${id_material}`, config);
            setCurrentMaterial(res.data);
            setIsEditingMaterial(true);
            setShowMaterialModal(true);
        } catch (err) {
            notifyError('Error cargando material.');
        }
    };

    const handleSaveMaterial = async (e) => {
        e.preventDefault();
        setSavingMaterial(true);
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            // Validación avanzada
            if (currentMaterial.material_url && currentMaterial.material_url.length > 0) {
                const urlRegex = /^(https?:\/\/)?([\w\-]+\.)+[\w\-]+(\/[\w\-._~:?#[\]@!$&'()*+,;=\/\%]*)?$/i;
                if (!urlRegex.test(currentMaterial.material_url)) {
                    notifyError('La URL del material no es válida.');
                    setSavingMaterial(false);
                    return;
                }
            }

            // Si existe archivo en currentMaterial._file, enviar FormData
            if (currentMaterial._file) {
                const form = new FormData();
                form.append('file', currentMaterial._file);
                form.append('id_material_type', currentMaterial.id_material_type);
                form.append('material_title', currentMaterial.material_title);
                form.append('material_description', currentMaterial.material_description || '');
                form.append('target_audience', currentMaterial.target_audience || '');
                form.append('source_organization', currentMaterial.source_organization || '');
                form.append('keywords', currentMaterial.keywords || '');
                if (isEditingMaterial) {
                    await axios.put(`${import.meta.env.VITE_BACKEND_URL}api/admin/support-materials/${currentMaterial.id_material}`, form, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } });
                    notifySuccess('Material actualizado');
                } else {
                    await axios.post(`${import.meta.env.VITE_BACKEND_URL}api/admin/support-materials`, form, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } });
                    notifySuccess('Material creado');
                }
            } else {
                if (isEditingMaterial) {
                    await axios.put(`${import.meta.env.VITE_BACKEND_URL}api/admin/support-materials/${currentMaterial.id_material}`, currentMaterial, config);
                    notifySuccess('Material actualizado');
                } else {
                    await axios.post(`${import.meta.env.VITE_BACKEND_URL}api/admin/support-materials`, currentMaterial, config);
                    notifySuccess('Material creado');
                }
            }
            setShowMaterialModal(false);
            fetchData();
        } catch (err) {
            notifyError(err.response?.data?.message || 'Error guardando material');
        } finally {
            setSavingMaterial(false);
        }
    };

    const handleDeleteMaterial = async (id_material) => {
        if (!confirm('¿Seguro que deseas eliminar este material?')) return;
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.delete(`${import.meta.env.VITE_BACKEND_URL}api/admin/support-materials/${id_material}`, config);
            notifySuccess('Material eliminado');
            fetchData();
        } catch (err) {
            notifyError(err.response?.data?.message || 'Error eliminando');
        }
    };

    // Types handlers
    const openCreateType = () => {
        setCurrentType({ type_name: '', type_description: '', icon_identifier: '' });
        setIsEditingType(false);
        setShowTypeModal(true);
    };

    const openEditType = (type) => {
        setCurrentType(type);
        setIsEditingType(true);
        setShowTypeModal(true);
    };

    const handleSaveType = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            if (isEditingType) {
                await axios.put(`${import.meta.env.VITE_BACKEND_URL}api/admin/material-types/${currentType.id_material_type}`, currentType, config);
                notifySuccess('Tipo actualizado');
            } else {
                await axios.post(`${import.meta.env.VITE_BACKEND_URL}api/admin/material-types`, currentType, config);
                notifySuccess('Tipo creado');
            }
            setShowTypeModal(false);
            fetchData();
        } catch (err) {
            notifyError(err.response?.data?.message || 'Error guardando tipo');
        }
    };

    const handleDeleteType = async (id_material_type) => {
        if (!confirm('¿Seguro que deseas eliminar este tipo?')) return;
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.delete(`${import.meta.env.VITE_BACKEND_URL}api/admin/material-types/${id_material_type}`, config);
            notifySuccess('Tipo eliminado');
            fetchData();
        } catch (err) {
            notifyError(err.response?.data?.message || 'Error eliminando tipo');
        }
    };

    if (loading) return <Spinner animation="border" />;

    return (
        <div>
            <h2>Gestión de Material de Apoyo</h2>
            <Tabs defaultActiveKey="materials" className="mb-3">
                <Tab eventKey="materials" title="Materiales">
                    <div className="d-flex justify-content-between mb-3">
                        <div>
                            <Button onClick={openCreateMaterial}>Crear Nuevo Material</Button>
                        </div>
                        <div className="d-flex gap-2">
                            <input className="form-control" placeholder="Buscar..." value={searchMaterials} onChange={(e) => { setSearchMaterials(e.target.value); setPage(1); }} />
                            <select className="form-select" style={{ width: 120 }} value={limit} onChange={(e) => { setLimit(parseInt(e.target.value, 10)); setPage(1); }}>
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                            </select>
                        </div>
                    </div>
                    <Table striped bordered hover responsive>
                        <thead>
                            <tr>
                                <th>Título</th>
                                <th>Tipo</th>
                                <th>Audiencia</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {materials.map(mat => (
                                <tr key={mat.id_material}>
                                    <td>{mat.material_title}</td>
                                    <td>{mat.type_name}</td>
                                    <td>{mat.target_audience}</td>
                                    <td>
                                        <Button variant="primary" size="sm" onClick={() => openEditMaterial(mat.id_material)}>Editar</Button>{' '}
                                        <Button variant="danger" size="sm" onClick={() => handleDeleteMaterial(mat.id_material)}>Eliminar</Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                    <div className="d-flex justify-content-end gap-2">
                        <Button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Anterior</Button>
                        <div className="align-self-center">Página {page} de {totalPages}</div>
                        <Button disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Siguiente</Button>
                    </div>
                </Tab>
                <Tab eventKey="types" title="Tipos de Material">
                    <Button className="mb-3" onClick={openCreateType}>Crear Nuevo Tipo</Button>
                    <Table striped bordered hover responsive>
                        <thead>
                            <tr>
                                <th>Nombre del Tipo</th>
                                <th>Descripción</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {materialTypes.map(type => (
                                <tr key={type.id_material_type}>
                                    <td>{type.type_name}</td>
                                    <td>{type.type_description}</td>
                                    <td>
                                        <Button variant="primary" size="sm" onClick={() => openEditType(type)}>Editar</Button>{' '}
                                        <Button variant="danger" size="sm" onClick={() => handleDeleteType(type.id_material_type)}>Eliminar</Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </Tab>
            </Tabs>

            {/* Modal Material */}
            <Modal show={showMaterialModal} onHide={() => setShowMaterialModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>{isEditingMaterial ? 'Editar Material' : 'Crear Material'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {currentMaterial && (
                        <Form onSubmit={handleSaveMaterial}>
                            <Form.Group className="mb-3">
                                <Form.Label>Título</Form.Label>
                                <Form.Control name="material_title" value={currentMaterial.material_title} onChange={(e) => setCurrentMaterial(prev => ({ ...prev, material_title: e.target.value }))} required />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Tipo</Form.Label>
                                <Form.Select name="id_material_type" value={currentMaterial.id_material_type} onChange={(e) => setCurrentMaterial(prev => ({ ...prev, id_material_type: e.target.value }))} required>
                                    <option value="">Seleccione un tipo...</option>
                                    {materialTypes.map(t => <option key={t.id_material_type} value={t.id_material_type}>{t.type_name}</option>)}
                                </Form.Select>
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>URL (opcional si subes un archivo)</Form.Label>
                                <Form.Control name="material_url" value={currentMaterial.material_url || ''} onChange={(e) => setCurrentMaterial(prev => ({ ...prev, material_url: e.target.value }))} />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Archivo (PDF/Imagen) - opcional</Form.Label>
                                <Form.Control type="file" onChange={(e) => setCurrentMaterial(prev => ({ ...prev, _file: e.target.files[0] }))} />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Descripción</Form.Label>
                                <Form.Control as="textarea" name="material_description" value={currentMaterial.material_description} onChange={(e) => setCurrentMaterial(prev => ({ ...prev, material_description: e.target.value }))} />
                            </Form.Group>
                            <div className="d-flex justify-content-end">
                                <Button variant="secondary" className="me-2" onClick={() => setShowMaterialModal(false)}>Cancelar</Button>
                                <Button type="submit" variant="primary" disabled={savingMaterial}>{savingMaterial ? (<><Spinner animation="border" size="sm" /> Guardando...</>) : 'Guardar'}</Button>
                            </div>
                        </Form>
                    )}
                </Modal.Body>
            </Modal>

            {/* Modal Type */}
            <Modal show={showTypeModal} onHide={() => setShowTypeModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>{isEditingType ? 'Editar Tipo' : 'Crear Tipo'}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {currentType && (
                        <Form onSubmit={handleSaveType}>
                            <Form.Group className="mb-3">
                                <Form.Label>Nombre</Form.Label>
                                <Form.Control name="type_name" value={currentType.type_name} onChange={(e) => setCurrentType(prev => ({ ...prev, type_name: e.target.value }))} required />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Descripción</Form.Label>
                                <Form.Control as="textarea" name="type_description" value={currentType.type_description} onChange={(e) => setCurrentType(prev => ({ ...prev, type_description: e.target.value }))} />
                            </Form.Group>
                            <div className="d-flex justify-content-end">
                                <Button variant="secondary" className="me-2" onClick={() => setShowTypeModal(false)}>Cancelar</Button>
                                <Button type="submit" variant="primary">Guardar</Button>
                            </div>
                        </Form>
                    )}
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default MaterialManagement;