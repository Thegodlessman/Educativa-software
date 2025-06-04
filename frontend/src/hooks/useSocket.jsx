import { useEffect, useState } from 'react';
import io from 'socket.io-client';

const useSocket = (serverUrl) => {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const newSocket = io(serverUrl);

        newSocket.on('connect', () => {
            setIsConnected(true);

            newSocket.emit('client_hello', {
                message: '¡Hola desde React!',
                clientId: newSocket.id
            });
        });

        // Evento: 'disconnect' - se dispara cuando la conexión se cierra
        newSocket.on('disconnect', (reason) => {;
            setIsConnected(false);
        });

        // Evento: 'connect_error' - se dispara si hay un error al intentar conectar
        newSocket.on('connect_error', (error) => {
            setIsConnected(false);
        });

        setSocket(newSocket);

        return () => {
            console.log('Limpiando efecto: Desconectando WebSocket...');
            // Desconectar el socket para evitar pérdidas de memoria y conexiones zombie
            if (newSocket) {
                newSocket.disconnect();
            }
        };
    }, [serverUrl]);

    // El hook devuelve la instancia del socket y el estado de conexión
    return { socket, isConnected };
};

export default useSocket;