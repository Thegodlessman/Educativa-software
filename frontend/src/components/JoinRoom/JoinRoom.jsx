import React, { useContext, useState } from 'react';
import { Modal, Button, Form, InputGroup } from 'react-bootstrap';
import jwtDecode from 'jwt-decode';
import axios from 'axios';
import { ClassContext } from '../../context/ClassContext';
import { notifyError, notifySuccess } from '../../utils/notify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHashtag } from '@fortawesome/free-solid-svg-icons';

import './JoinRoom.css';

function JoinRoom({ show, handleClose }) {
    const [roomCode, setRoomCode] = useState('');
    const { fetchClasses } = useContext(ClassContext);

    const handleJoin = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                notifyError('No se encontró la sesión. Por favor, inicie sesión de nuevo.');
                return;
            }
            const decodedToken = jwtDecode(token);

            if (!roomCode.trim()) {
                notifyError('Por favor, ingresa un código de clase.');
                return;
            }

            await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}room/join`,
                {
                    code_room: roomCode,
                    id_user: decodedToken.id_user
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            notifySuccess("Te has unido a la clase exitosamente.");
            await fetchClasses();
            setRoomCode("");
            handleClose();

        } catch (error) {
            const errorMessage = error.response?.data?.message || "Ocurrió un error al unirse a la clase.";
            notifyError(errorMessage);
            console.error("Error al unirse a la clase:", error);
        }
    };

    const handleEnterKey = (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            handleJoin();
        }
    };

    return (
        <Modal show={show} onHide={handleClose} centered dialogClassName="join-room-modal">
            <Modal.Header closeButton className="modal-header-custom text-white">
                <Modal.Title>Unirse a una Clase</Modal.Title>
            </Modal.Header>
            <Modal.Body className="text-center">
                <p className="text-muted mb-4">Ingresa el código que te proporcionó tu profesor para acceder a la clase.</p>
                <Form>
                    <InputGroup className="mb-3">
                        <InputGroup.Text className="icon-prefix">
                            <FontAwesomeIcon icon={faHashtag} />
                        </InputGroup.Text>
                        <Form.Control
                            type="text"
                            className="input-code"
                            placeholder="CÓDIGO DE LA CLASE"
                            value={roomCode}
                            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                            onKeyDown={handleEnterKey}
                            autoFocus
                        />
                    </InputGroup>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button className="btn-join-room w-100 fw-bold" onClick={handleJoin}>
                    Unirse a la Clase
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

export default JoinRoom;