import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Modal, Form, Spinner, Alert, Tabs, Tab } from 'react-bootstrap';
import axios from 'axios';
import { notifySuccess, notifyError } from '../../utils/notify';

const MaterialManagement = () => {
    const [materials, setMaterials] = useState([]);
    const [materialTypes, setMaterialTypes] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const [materialsRes, typesRes] = await Promise.all([
                axios.get(`${import.meta.env.VITE_BACKEND_URL}api/admin/support-materials`, config),
                axios.get(`${import.meta.env.VITE_BACKEND_URL}api/admin/material-types`, config),
            ]);
            setMaterials(materialsRes.data || []);
            setMaterialTypes(typesRes.data || []);
        } catch (error) {
            notifyError("Error al cargar los materiales.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Aquí irían las funciones para manejar los modales de edición/creación para materiales y tipos
    // (handleSaveMaterial, handleDeleteMaterial, etc.)
    // Por simplicidad, esta plantilla se enfoca en mostrar los datos.

    if (loading) return <Spinner animation="border" />;

    return (
        <div>
            <h2>Gestión de Material de Apoyo</h2>
            <Tabs defaultActiveKey="materials" className="mb-3">
                <Tab eventKey="materials" title="Materiales">
                    <Button className="mb-3">Crear Nuevo Material</Button>
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
                                        <Button variant="primary" size="sm">Editar</Button>{' '}
                                        <Button variant="danger" size="sm">Eliminar</Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </Tab>
                <Tab eventKey="types" title="Tipos de Material">
                    <Button className="mb-3">Crear Nuevo Tipo</Button>
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
                                        <Button variant="primary" size="sm">Editar</Button>{' '}
                                        <Button variant="danger" size="sm">Eliminar</Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </Tab>
            </Tabs>
        </div>
    );
};

export default MaterialManagement;