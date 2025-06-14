import React, { useState, useEffect, useContext } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import axios from "axios";
import jwt_decode from "jwt-decode";
import { ClassContext } from "../../context/ClassContext";
import { notifyError, notifySuccess } from "../../utils/notify";
import "./CreateRoom.css";

function CreateRoom({ show, handleClose }) {
    const [institutions, setInstitutions] = useState([]);
    const [selectedInstitution, setSelectedInstitution] = useState("");
    const [section, setSection] = useState("");
    const [maxCapacity, setMaxCapacity] = useState("");
    const [grate, setGrate] = useState("");

    const { fetchClasses } = useContext(ClassContext);

    useEffect(() => {
        const fetchInstitutions = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) throw new Error("Token no encontrado");

                const decodedToken = jwt_decode(token);
                const response = await axios.post(
                    "http://localhost:4555/room/insti",
                    { id_user: decodedToken.id_user },
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                if (response.data.success) {
                    setInstitutions(response.data.insti);
                } else {
                    console.error("Error al obtener instituciones", response.data);
                }
            } catch (error) {
                console.error("Error fetching institutions:", error);
            }
        };

        if (show) fetchInstitutions();
    }, [show]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const capacity = parseInt(maxCapacity, 10);
        const trimmedSection = section.trim();
        const seccRegex = /^[A-Za-z]+$/;

        if (!selectedInstitution || !trimmedSection || !maxCapacity || !grate) {
            notifyError("Por favor, completa todos los campos antes de continuar.");
            return;
        }

        if (!seccRegex.test(trimmedSection)) {
            notifyError("La sección solo debe contener letras del abecedario.");
            return;
        }

        if (capacity > 50) {
            notifyError("La capacidad máxima permitida por clase es de 50 estudiantes.");
            return;
        }

        const token = localStorage.getItem("token");
        if (!token) return console.error("Token no encontrado");

        try {
            const decodedToken = jwt_decode(token);
            const adminId = decodedToken.id_user;

            await axios.post(
                "http://localhost:4555/room/create",
                {
                    admin_room: adminId,
                    secc_room: trimmedSection,
                    id_institution: selectedInstitution,
                    max_room: capacity,
                    room_grate: grate
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            notifySuccess("Se ha creado la clase correctamente");
            await fetchClasses();

            setSection("");
            setMaxCapacity("");
            setSelectedInstitution("");
            setGrate("");

            handleClose();

        } catch (error) {
            notifyError("Ocurrió un error al crear la clase");
            console.error("Error al crear clase:", error);
        }
    };

  return (
    <Modal show={show} onHide={handleClose} centered backdrop="static">
      <Modal.Header closeButton className="header_create-class">
        <Modal.Title className="title_create-class">Crear Clase</Modal.Title>
      </Modal.Header>
      <Modal.Body className="body_create-class">
        <Form onSubmit={handleSubmit} className="form_create-class">
          <Form.Group className="group_create-class">
            <Form.Label className="label_create-class">Institución</Form.Label>
            <Form.Select
              className="select_create-class"
              value={selectedInstitution}
              onChange={(e) => setSelectedInstitution(e.target.value)}
            >
              <option value="">Seleccionar institución</option>
              {institutions.length > 0 ? (
                institutions.map((inst) => (
                  <option key={inst.id_insti} value={inst.id_insti}>
                    {inst.insti_name}
                  </option>
                ))
              ) : (
                <option value="" disabled>Cargando instituciones...</option>
              )}
            </Form.Select>
          </Form.Group>

          <Form.Group className="group_create-class">
            <Form.Label className="label_create-class">Grado</Form.Label>
            <Form.Select
              className="select_create-class"
              value={grate}
              onChange={(e) => setGrate(e.target.value)}
            >
              <option value="">Selecciona el grado</option>
              <option value="4to">4to Grado</option>
              <option value="5to">5to Grado</option>
              <option value="6to">6to Grado</option>
              <option value="7mo">7mo Grado</option>
            </Form.Select>
          </Form.Group>

          <Form.Group className="group_create-class">
            <Form.Label className="label_create-class">Sección</Form.Label>
            <Form.Control
              className="input_create-class"
              type="text"
              placeholder="Ejemplo: A, B, C..."
              value={section}
              onChange={(e) => {
                const value = e.target.value.toUpperCase();
                if (/^[A-Za-z]*$/.test(value)) setSection(value);
              }}
            />
          </Form.Group>

          <Form.Group className="group_create-class">
            <Form.Label className="label_create-class">Capacidad Máxima de Estudiantes</Form.Label>
            <Form.Control
              className="input_create-class"
              type="number"
              placeholder="Ejemplo: 30"
              value={maxCapacity}
              onChange={(e) => setMaxCapacity(e.target.value)}
              min={1}
            />
          </Form.Group>

          <Button variant="success" type="submit" className="button_create-class">
            Crear
          </Button>
        </Form>
      </Modal.Body>
    </Modal>
  );
}

export default CreateRoom;
