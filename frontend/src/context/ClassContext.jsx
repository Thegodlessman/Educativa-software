import { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import jwt_decode from 'jwt-decode';

export const ClassContext = createContext();

export const useClass = () => {
    const context = useContext(ClassContext);
    if (!context) {
        throw new Error('useClass debe ser usado dentro de un ClassProvider');
    }
    return context;
};

export const ClassProvider = ({ children }) => {
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(localStorage.getItem('token') || null);
    const [userData, setUserData] = useState(null);
    const [selectedRoom, setSelectedRoom] = useState(null);

    const selectClass = (room) => {
        setSelectedRoom(room);
    };

    const fetchClasses = async () => {
        try {
            if (!token) {
                setClasses([]);
                setLoading(false);
                setUserData(null)
                return;
            }

            const decoded = jwt_decode(token);
            const {id_user, rol_name} = decoded
            setUserData( {id_user, rol_name})
            let endpoint = ""

            if(rol_name === "Profesor"){
                endpoint = `${import.meta.env.VITE_BACKEND_URL}room/classes/created`
            }else if(rol_name === "Estudiante"){
                endpoint = `${import.meta.env.VITE_BACKEND_URL}room/classes/joined`
            } else {
                setClasses([]);
                setLoading(false);
                setUserData(null)
                return;
            }

            const response = await axios.post(
                endpoint,
                { id_user: id_user },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setClasses(response.data.classes || []);
        } catch (error) {
            console.error("Error fetching classes:", error);
            setClasses([]);
            setUserData(null)
        } finally {
            setLoading(false);
        }
    };

    const addClass = (newClass) => {
        setClasses((prev) => [...prev, newClass]);
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUserData(null);
        setClasses([]);
        setSelectedRoom(null);
    }

    useEffect(() => {
        fetchClasses();
    }, [token]);

    useEffect(() => {
        
        const handleStorageChange = (e) => {
            if (e.key === "token") {
                setToken(e.newValue);
            }
        };
        window.addEventListener("storage", handleStorageChange);

        return () => {
            window.removeEventListener("storage", handleStorageChange);
        };
    }, []);

    const contextValue = {
        userData,
        classes,
        setClasses,
        loading,
        fetchClasses,
        addClass,
        setToken,
        selectedRoom,
        selectClass,
        logout
    };

    return (
        <ClassContext.Provider value={contextValue}>
            {children}
        </ClassContext.Provider>
    );
};
