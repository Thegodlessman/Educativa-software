import { Modal, Button, Form, InputGroup, Row, Col, ProgressBar } from "react-bootstrap";
import React, { useState, useEffect } from "react";
import axios from "axios";
import jwt_decode from "jwt-decode";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMap, faGlobe, faMapMarkedAlt, faCity, faSchool, faCamera, faCheckCircle } from '@fortawesome/free-solid-svg-icons';

import logo from "../../../src/assets/logo.png";
import { notifyError, notifySuccess } from "../../utils/notify";
import "./SelectRole.css";

const teacherRoleImg = import.meta.env.VITE_CLOUDNARY_IMAGE + "educativa/TeacherRole";
const studentRoleImg = import.meta.env.VITE_CLOUDNARY_IMAGE + "educativa/StudentRole";

// Helper para los títulos del modal
const stepTitles = [
  "1. Selecciona tu Rol",
  "2. Ubicación de tu Institución",
  "3. Añade una Foto de Perfil",
  "4. Confirma tu Información"
];

function SelectRole({ show, handleClose }) {
  const [step, setStep] = useState(1);
  const [roles, setRoles] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState(null);
  const [selectedInstitution, setSelectedInstitution] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [userData, setUserData] = useState(null);
  const [institutions, setInstitutions] = useState([]);
  const [countries, setCountries] = useState([]);
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [state, setState] = useState([]);
  const [selectedState, setSelectedState] = useState(null)
  const [muni, setMuni] = useState([]);
  const [selectedMuni, setSelectedMuni] = useState(null)
  const [parish, setParish] = useState([]);
  const [selectedParish, setSelectedParish] = useState(null)

  useEffect(() => {
    if (show) {
      fetchRoles();
      fetchCountries();
      setStep(1);
      setSelectedRoleId(null);
      setSelectedInstitution(null);
      setSelectedImage(null);
      setPreviewUrl(null);
      setSelectedCountry(null);
      setSelectedState(null);
      setSelectedMuni(null);
      setSelectedParish(null);
      setState([]);
      setMuni([]);
      setParish([]);
      setInstitutions([]);
    }
  }, [show]);

  useEffect(() => { if (selectedCountry) fetchStates(); }, [selectedCountry]);
  useEffect(() => { if (selectedState) fetchMunicipalities(); }, [selectedState]);
  useEffect(() => { if (selectedMuni) fetchParishes(); }, [selectedMuni]);
  useEffect(() => { if (selectedParish) fetchInstitutions(); }, [selectedParish]);

  const fetchCountries = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}profile/get/countries`);
      setCountries(response.data.countries);
    } catch (error) { console.error(error); }
  };
  const fetchStates = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}profile/get/stateByCountries/${selectedCountry}`);
      setState(response.data.states);
    } catch (error) { console.error("Error al cargar los estados:", error); }
  };
  const fetchMunicipalities = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}profile/get/munByStates/${selectedState}`);
      setMuni(response.data.mun);
    } catch (error) { console.error("Error al cargar municipios:", error); }
  };
  const fetchParishes = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}profile/get/parishesByMunicipality/${selectedMuni}`);
      setParish(response.data.parishes);
    } catch (error) { console.error("Error al cargar parroquias:", error); }
  };
  const fetchInstitutions = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}profile/get/institutionsByParish/${selectedParish}`);
      setInstitutions(response.data.institutions);
    } catch (error) { notifyError("Error al cargar las instituciones"); console.error(error); }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        setUserData(jwt_decode(token));
      } catch (e) { console.error("Error decoding token", e); }
    }
  }, []);
  const fetchRoles = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}profile/roles`, { headers: { Authorization: `Bearer ${token}` } });
      const allowedRoles = response.data.roles.filter(role => role.rol_name === "Estudiante" || role.rol_name === "Profesor");
      setRoles(allowedRoles);
    } catch (error) { notifyError("Error al obtener los roles:", error.response?.data || error.message); }
  };

  const handleNext = () => setStep(prev => prev + 1);
  const handleBack = () => setStep(prev => prev - 1);
  const handleFinish = async () => {
    if (!selectedRoleId) {
      notifyError("Por favor, selecciona un rol.");
      setStep(1); return;
    }
    if (!selectedInstitution) {
      notifyError("Por favor, selecciona una institución.");
      setStep(2); return;
    }
    try {
      const token = localStorage.getItem("token");
      let photoUrl = "";
      if (selectedImage) {
        const uploadFormData = new FormData();
        uploadFormData.append("photo", selectedImage);
        const uploadResponse = await axios.post(`${import.meta.env.VITE_BACKEND_URL}uploadProfile`, uploadFormData, { headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" } });
        photoUrl = uploadResponse.data.imageUrl;
      }
      const response = await axios.put(`${import.meta.env.VITE_BACKEND_URL}profile/setup/${userData.id_user}`, { institution: selectedInstitution, photoUrl: photoUrl, id_rol: selectedRoleId, }, { headers: { Authorization: `Bearer ${token}` } });
      localStorage.setItem('token', response.data.tokenSession);
      notifySuccess("Perfil completado exitosamente");
      handleClose();
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Error al guardar la información";
      notifyError(errorMessage);
    }
  };
  const handleCountryChange = (e) => {
    const value = e.target.value; setSelectedCountry(value); setSelectedState(null); setSelectedMuni(null); setSelectedParish(null); setSelectedInstitution(null); setState([]); setMuni([]); setParish([]); setInstitutions([]);
  };
  const handleStateChange = (e) => {
    const value = e.target.value; setSelectedState(value); setSelectedMuni(null); setSelectedParish(null); setSelectedInstitution(null); setMuni([]); setParish([]); setInstitutions([]);
  };
  const handleMunicipalityChange = (e) => {
    const value = e.target.value; setSelectedMuni(value); setSelectedParish(null); setSelectedInstitution(null); setParish([]); setInstitutions([]);
  };
  const handleParishChange = (e) => {
    const value = e.target.value; setSelectedParish(value); setSelectedInstitution(null); setInstitutions([]);
  };
  const getRoleNameById = (roleId) => roles.find(r => r.id_rol === roleId)?.rol_name || "Desconocido";

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { notifyError("El archivo es demasiado grande (Máx 5MB)."); return; }
    if (!file.type.startsWith('image/')) { notifyError("Por favor, selecciona un archivo de imagen válido."); return; }
    setSelectedImage(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreviewUrl(reader.result);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setSelectedImage(null);
    setPreviewUrl(null);
    const inputFile = document.getElementById('file-upload');
    if (inputFile) inputFile.value = "";
  };

  const progress = (step / 4) * 100;

  return (
    <Modal show={show} centered backdrop="static" keyboard={false} size='lg' dialogClassName="select-role-modal" contentClassName="select-role-content">
      <Modal.Header className="modal-header-custom text-white border-0">
        <Modal.Title>{stepTitles[step - 1]}</Modal.Title>
      </Modal.Header>

      <ProgressBar now={progress} className="wizard-progress-bar" />

      <Modal.Body className="d-flex flex-column">
        <div className="wizard-content">
          {step === 1 && (
            <div className="d-flex justify-content-center align-items-center h-100 gap-4">
              {roles.map(role => (
                <div key={role.id_rol} className={`role-card ${selectedRoleId === role.id_rol ? "selected" : ""}`} onClick={() => setSelectedRoleId(role.id_rol)}>
                  {selectedRoleId === role.id_rol && <FontAwesomeIcon icon={faCheckCircle} className="check-icon" />}
                  <img src={role.rol_name === "Estudiante" ? studentRoleImg : teacherRoleImg} className="role-image" alt={role.rol_name} />
                  <span className="role-name">{role.rol_name}</span>
                </div>
              ))}
            </div>
          )}

          {step === 2 && (
            <Form>
              <Row>
                <Col md={6}><InputGroup className="mb-3"><InputGroup.Text className="icon-prefix"><FontAwesomeIcon icon={faGlobe} /></InputGroup.Text><Form.Select value={selectedCountry || ""} onChange={handleCountryChange}><option value="">País...</option>{countries.map(c => <option key={c.id_country} value={c.id_country}>{c.country_name}</option>)}</Form.Select></InputGroup></Col>
                <Col md={6}><InputGroup className="mb-3"><InputGroup.Text className="icon-prefix"><FontAwesomeIcon icon={faMap} /></InputGroup.Text><Form.Select value={selectedState || ""} onChange={handleStateChange} disabled={!selectedCountry}><option value="">Estado...</option>{state.map(st => <option key={st.id_state} value={st.id_state}>{st.state_name}</option>)}</Form.Select></InputGroup></Col>
                <Col md={6}><InputGroup className="mb-3"><InputGroup.Text className="icon-prefix"><FontAwesomeIcon icon={faCity} /></InputGroup.Text><Form.Select value={selectedMuni || ""} onChange={handleMunicipalityChange} disabled={!selectedState}><option value="">Municipio...</option>{muni.map(m => <option key={m.id_municipality} value={m.id_municipality}>{m.municipality_name}</option>)}</Form.Select></InputGroup></Col>
                <Col md={6}><InputGroup className="mb-3"><InputGroup.Text className="icon-prefix"><FontAwesomeIcon icon={faMapMarkedAlt} /></InputGroup.Text><Form.Select value={selectedParish || ""} onChange={handleParishChange} disabled={!selectedMuni}><option value="">Parroquia...</option>{parish.map(p => <option key={p.id_parish} value={p.id_parish}>{p.parish_name}</option>)}</Form.Select></InputGroup></Col>
                <Col xs={12}><InputGroup className="mb-3"><InputGroup.Text className="icon-prefix"><FontAwesomeIcon icon={faSchool} /></InputGroup.Text><Form.Select value={selectedInstitution || ""} onChange={(e) => setSelectedInstitution(e.target.value)} disabled={!selectedParish}><option value="">Institución...</option>{institutions.map(inst => <option key={inst.id_insti} value={inst.id_insti}>{inst.insti_name}</option>)}</Form.Select></InputGroup></Col>
              </Row>
            </Form>
          )}

          {step === 3 && (
            <div className="d-flex flex-column align-items-center justify-content-center h-100">
              <label htmlFor="file-upload" className="upload-zone">
                {previewUrl ? (
                  <img src={previewUrl} alt="Vista previa" className="preview-image" />
                ) : (
                  <div className="upload-placeholder">
                    <FontAwesomeIcon icon={faCamera} size="3x" />
                    <span>Click para subir foto</span>
                  </div>
                )}
              </label>
              <input id="file-upload" type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />
              {previewUrl && <Button variant="link" className="text-danger mt-2" onClick={removeImage}>Quitar Imagen</Button>}
            </div>
          )}

          {step === 4 && (
            <div className="d-flex justify-content-center align-items-center h-100">
              <div className="summary-card">
                <img src={previewUrl || userData.user_url || logo} alt="Foto de perfil" className="summary-image" />
                <div className="summary-details">
                  <h4 className="fw-bold">{userData?.full_name || 'Usuario'}</h4>
                  <p><strong>Rol:</strong> {getRoleNameById(selectedRoleId)}</p>
                  <p><strong>Institución:</strong> {institutions.find(inst => inst.id_insti == selectedInstitution)?.insti_name || "No seleccionada"}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal.Body>

      <Modal.Footer className="border-0">
        {step > 1 && <Button variant="outline-secondary" onClick={handleBack}>Atrás</Button>}
        <div className="ms-auto">
          {step < 4 && <Button className="btn-select-rol" disabled={(step === 1 && !selectedRoleId) || (step === 2 && !selectedInstitution)} onClick={handleNext}>Siguiente</Button>}
          {step === 4 && <Button className="btn-select-rol" onClick={handleFinish}>Confirmar y Continuar</Button>}
        </div>
      </Modal.Footer>
    </Modal>
  );
}

export default SelectRole;