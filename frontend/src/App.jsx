import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import LandingPage from './views/LandingPage/LandingPage';
import LoginPage from './views/LoginPage/LoginPage.jsx';
import RegisterPage from './views/RegisterPage/RegisterPage.jsx';
import ProfilePage from './views/ProfilePage/ProfilePage.jsx';
import ForgotPasswordPage from './views/ForgotPasswordPage/ForgotPasswordPage.jsx';
import ResetPasswordPage from './views/ResetPasswordPage/ResetPasswordPage.jsx';
import FastAccessPage from './views/FastAccessPage/FastAccessPage.jsx';

import RoleProtectedRoute from './components/RoleProtectedRoute/RoleProtectedRoute';

function App() {
    return (
        <> 
            <ToastContainer 
                position="bottom-center"
                autoClose={3000} // Tiempo que dura la notificación (ms)
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="colored"
            />  
            <Router>
                <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                    <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
                    <Route path="/fast-access" element={<FastAccessPage/>}/>

                    <Route element={<RoleProtectedRoute allowedRoles={['usuario', 'Estudiante', 'Profesor', 'administrador', 'Desarrollador']} />}>
                        <Route path="/profile" element={<ProfilePage />} />
                    </Route>
                </Routes>
            </Router>
        </>
    );
}

export default App;