import { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Navbar from 'react-bootstrap/Navbar';
import { Form, FormControl, Container, InputGroup } from 'react-bootstrap';
import { useLocation, useNavigate } from 'react-router-dom';
import { FaSearch } from 'react-icons/fa';
import jwt_decode from 'jwt-decode';
import './NavBar.css';

function NavBar() {
  let [isLogin, setIsLogin] = useState(false);
  let user_url;
  let user_fullname;
  let rol;

  try {
    const token = localStorage.getItem('token');
    if (token) {
      let decodedToken = jwt_decode(token);
      user_url = decodedToken.user_url
      user_fullname = decodedToken.full_name;
      rol = decodedToken.rol_name;
      isLogin = true;
    }
  } catch (e) {
    console.log(e);
  }

  const location = useLocation();
  const navigate = useNavigate();

  const isDashboard = location.pathname === '/profile';

  const redirectLogin = () => {
    navigate('/login');
  };

  const redirectRegister = () => {
    navigate('/register');
  };

  const redirectProfile = () => {
    navigate('/profile');
  };

  return (
    <Navbar expand="lg" bg="light" className= {`container-navbar ${isDashboard ? 'navbar-dashboard' : ''}`}>
      <Container fluid>
        {/* Logo a la izquierda */}
        <Navbar.Brand className="fs-3 fw-bolder text-decoration-none logo-title" href="/">
          <img
            className="me-1"
            src="../../../src/assets/logo.png"
            width="50"
            height="50"
            alt="Logo Educativa"
          />
          Educativa
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="navbar-content" />
        <Navbar.Collapse id="navbar-content" className="justify-content-between">
          {/* Mostrar search bar en todas las rutas excepto en "/" */}
          {location.pathname !== '/' && (
            <Form className="d-flex mx-auto w-50">
              <InputGroup>
                <InputGroup.Text id="search-icon">
                  <FaSearch />
                </InputGroup.Text>
                <FormControl
                  type="search"
                  placeholder="Buscar"
                  aria-label="Buscar"
                  aria-describedby="search-icon"
                />
              </InputGroup>
            </Form>
          )}
          {/* Sección de usuario o botones de registro/inicio de sesión */}
          <div className={`d-flex align-items-center ${location.pathname === '/' ? 'ms-auto' : ''}`}>
            {isLogin ? (
              <div className="d-flex align-items-center navbar-account_navbar" onClick={redirectProfile}>
                <div className="navbar-img_navbar">
                  <img
                    src={user_url}
                    alt="Imagen de perfil"
                  />
                </div>
                <div className="navbar-account-details_navbar ms-2">
                  <p className="navbar-account-username_navbar m-0">{user_fullname}</p>
                  <p className="navbar-account-rol_navbar m-0">{rol}</p>
                </div>
              </div>
            ) : (
              <div className="d-flex align-items-center">
                <Button className="me-2 rounded-4 regis-btn_navbar" variant="link" onClick={redirectRegister}>
                  Regístrate
                </Button>
                <Button className="btn btn-success rounded-4" onClick={redirectLogin}>
                  Iniciar Sesión
                </Button>
              </div>
            )}
          </div>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default NavBar;
