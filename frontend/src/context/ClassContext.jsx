import { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import jwtDecode from 'jwt-decode'; 

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

    const processTokenAndSetState = (newToken) => {
        console.log("processTokenAndSetState llamado con:", newToken); 
        if (newToken && typeof newToken === 'string' && newToken.trim() !== '') {
            try {
                localStorage.setItem('token', newToken); 
                setToken(newToken); 

                const decoded = jwtDecode(newToken); // Decodifica el token
                const { id_user, rol_name } = decoded;
                setUserData({ id_user, rol_name }); // Establece userData

                axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

            } catch (error) {
                console.error("Error decodificando el token en processTokenAndSetState:", error);
                logout(); 
            }
        } else {
            console.log("Token inválido o vacío pasado a processTokenAndSetState, limpiando sesión.");
            logout();
        }
    };

    const selectClass = (room) => {
        setSelectedRoom(room);
    };

    const fetchClasses = async () => {
        setLoading(true); 
        try {
            if (!token || !userData) {
                console.log("No token o userData disponible para fetchClasses, saltando la carga.");
                setClasses([]);
                setUserData(null);n
                return;
            }

            const { id_user, rol_name } = userData;
            let endpoint = "";

            if (rol_name === "Profesor") {
                endpoint = `${import.meta.env.VITE_BACKEND_URL}room/classes/created`;
            } else if (rol_name === "Estudiante") {
                endpoint = `${import.meta.env.VITE_BACKEND_URL}room/classes/joined`;
            } else if (rol_name === "Administrador") {
                setClasses([]);
                setLoading(false);
                return;
            } else if (rol_name === "usuario") {
                setClasses([]);
                setLoading(false);
                return;
            } else {
                console.warn("Rol no reconocido, no se pueden cargar las clases.");
                console.log(rol_name)
                setClasses([]);
                setUserData(null);
                return;
            }

            const response = await axios.post(
                endpoint,
                { id_user: id_user },
                { headers: { Authorization: `Bearer ${token}` } } // Usa el estado 'token'
            );

            setClasses(response.data.classes || []);
        } catch (error) {
            console.error("Error fetching classes:", error);
            setClasses([]);
            setUserData(null);
            if (axios.isAxiosError(error) && error.response && (error.response.status === 401 || error.response.status === 403)) {
                console.warn("API respondió con error de autorización. Forzando logout.");
                logout();
            }
        } finally {
            setLoading(false);
        }
    };

    const addClass = (newClass) => {
        setClasses((prev) => [...prev, newClass]);
    };

    const logout = () => {
        console.log("Ejecutando logout."); // Para depuración
        localStorage.removeItem('token');
        setToken(null); // Limpia el estado 'token'
        setUserData(null);
        setClasses([]);
        setSelectedRoom(null);
        delete axios.defaults.headers.common['Authorization']; // Limpia el header de Axios
    };

    useEffect(() => {
        const storedToken = localStorage.getItem('token');
        if (storedToken) {
            processTokenAndSetState(storedToken); 
        } else {
            setLoading(false); 
        }
    }, []);

    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === "token") {
                console.log("Cambio en localStorage detectado. Nuevo valor:", e.newValue);
                processTokenAndSetState(e.newValue); 
            }
        };
        window.addEventListener("storage", handleStorageChange);

        return () => {
            window.removeEventListener("storage", handleStorageChange);
        };
    }, []);

    // Este efecto se dispara cuando el 'token' o 'userData' cambian, para cargar las clases
    useEffect(() => {
        if (token && userData) {
            fetchClasses();
        } else if (!token) {
            setClasses([]);
            setLoading(false);
        }
    }, [token, userData?.id_user, userData?.rol_name]); 

    const contextValue = {
        token,
        userData,
        classes,
        setClasses,
        loading,
        fetchClasses,
        addClass,
        setToken: processTokenAndSetState,
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