import React, { useContext, useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';
import jwtDecode from 'jwt-decode';
import axios from 'axios'
import { ClassContext } from '../../context/ClassContext';

import './JoinRoom.css'
import { notifyError, notifySuccess } from '../../utils/notify';

function JoinRoom({ show, handleClose }) {
    const [roomCode, setRoomCode] = useState('');
    const token = localStorage.getItem('token')
    const decodedToken = jwtDecode(token)

    const { addClass } = useContext(ClassContext)

    const handleJoin = async () => {
        try {
            if (!roomCode.trim()) {
                notifyError('Por favor, ingresa un código válido');
                return;
            }

            const response = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}room/join`,
                {
                    code_room: roomCode,
                    id_user: decodedToken.id_user
                }
                , { headers: { Authorization: `Bearer ${token}` } }
            )

            if(response.data.classes){
                const nuevaClase = response.data.classes

                notifySuccess("Te has unido a la clase")
                addClass(nuevaClase)
                setRoomCode("")
                handleClose();
            }
        } catch (error) {
            if (error.response && error.response.data && error.response.data.message) {
                notifyError(error.response.data.message);
            } else {
                notifyError("Ocurrió un error al unirse a la clase");
            }
            notifyError("Error al unirse a la clase:", error);
        }

    };

    return (
        <Modal show={show} onHide={handleClose} centered>
            <Modal.Header closeButton className="header_create-class">
                <Modal.Title className='title_create-class'>Ingrese el código de la clase</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form>
                    <Form.Group controlId="formRoomCode">
                        <Form.Control
                            type="text"
                            className="input-code"
                            placeholder=""
                            value={roomCode}
                            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                        />
                    </Form.Group>
                </Form>
            </Modal.Body>
            <Modal.Footer className="d-flex justify-content-between">
                <Button variant='success' className='button_create-class' onClick={handleJoin}>
                    Unirse
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

export default JoinRoom;
