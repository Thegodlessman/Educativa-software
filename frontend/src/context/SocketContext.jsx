import React, { createContext, useEffect, useState, useContext } from 'react';
import io from 'socket.io-client';

const SocketContext = createContext();

export const useSocketContext = () => {
    return useContext(SocketContext);
};

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        const serverUrl = import.meta.env.VITE_BACKEND_SOCKET || 'http://localhost:3000';
        const newSocket = io(serverUrl);

        newSocket.on('connect', () => {
            //console.log('Socket conectado exitosamente en el Context:', newSocket.id);
            setIsConnected(true);
        });

        newSocket.on('disconnect', () => {
            console.log('Socket desconectado.');
            setIsConnected(false);
        });
        
        setSocket(newSocket);

        // Limpieza al desmontar el componente principal de la App
        return () => {
            //console.log('Limpiando SocketProvider: Desconectando socket.');
            newSocket.disconnect();
        };
    }, []); // El arreglo vacío asegura que esto se ejecute UNA SOLA VEZ.

    // El proveedor comparte el socket y el estado de conexión a todos sus hijos
    const value = {
        socket,
        isConnected,
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
};