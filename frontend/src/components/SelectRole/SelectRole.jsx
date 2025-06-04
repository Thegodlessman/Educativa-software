import { Modal } from "react-bootstrap";
import React, { useState, useEffect } from "react";
import axios from "axios";
import jwt_decode from "jwt-decode";

import logo from "../../../src/assets/logo.png";
import { notifyError, notifySuccess } from "../../utils/notify";
import "./SelectRole.css";

const teacherRole =
  import.meta.env.VITE_CLOUDNARY_IMAGE + "educativa/TeacherRole";
const studentRole =
  import.meta.env.VITE_CLOUDNARY_IMAGE + "educativa/StudentRole";

function SelectRole({ show, handleClose}) {
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
      // Resetear estados al mostrar el modal
      setStep(1);
      setSelectedRoleId(null); // Resetear ID del rol
      setSelectedInstitution(null);
      setSelectedImage(null);
      setPreviewUrl(null);
      setSelectedCountry(null);
      setSelectedState(null);
      setSelectedMuni(null);
      setSelectedParish(null);
      // Resetear listas dependientes
      setState([]);
      setMuni([]);
      setParish([]);
      setInstitutions([]);

    }
  }, [show]);

  useEffect(() => {
    if (selectedCountry) {
      fetchStates();
    }
  }, [selectedCountry]);

  useEffect(() => {
    if (selectedState) {
      fetchMunicipalities();
    }
  }, [selectedState]);

  useEffect(() => {
    if (selectedMuni) {
      fetchParishes();
    }
  }, [selectedMuni]);

  useEffect(() => {
    if (selectedParish) {
      fetchInstitutions()
    }
  }, [selectedParish])

  const fetchCountries = async () => {
    try {
      const response = await axios.get(
        "http://localhost:4555/profile/get/countries"
      );
      setCountries(response.data.countries);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchStates = async () => {
    try {
      const response = await axios.get(
        `http://localhost:4555/profile/get/stateByCountries/${selectedCountry}`
      );
      setState(response.data.states);
    } catch (error) {
      console.error("Error al cargar los estados:", error);
    }
  };

  const fetchMunicipalities = async () => {
    try {
      const response = await axios.get(
        `http://localhost:4555/profile/get/munByStates/${selectedState}`
      );
      setMuni(response.data.mun);
    } catch (error) {
      console.error("Error al cargar municipios:", error);
    }
  };

  const fetchParishes = async () => {
    try {
      const response = await axios.get(
        `http://localhost:4555/profile/get/parishesByMunicipality/${selectedMuni}`
      );
      setParish(response.data.parishes);
    } catch (error) {
      console.error("Error al cargar parroquias:", error);
    }
  };

  const fetchInstitutions = async () => {
    try {
      const response = await axios.get(
        `http://localhost:4555/profile/get/institutionsByParish/${selectedParish}`
      );
      setInstitutions(response.data.institutions);
    } catch (error) {
      notifyError("Error al cargar las instituciones");
      console.error(error);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwt_decode(token);
        setUserData(decoded);
      } catch (e) {
        console.error("Error decoding token", e);
      }
    }
  }, []);

  const fetchRoles = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("http://localhost:4555/profile/roles", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const allowedRoles = response.data.roles.filter(
        (role) => role.rol_name === "Estudiante" || role.rol_name === "Profesor"
      );
      setRoles(allowedRoles);
    } catch (error) {
      notifyError(
        "Error al obtener los roles:",
        error.response?.data || error.message
      );
    }
  };

  const handleNext = () => setStep((prev) => prev + 1);
  const handleBack = () => setStep((prev) => prev - 1);

  const handleFinish = async () => {

    if (!selectedRoleId) {
      notifyError("Por favor, selecciona un rol.");
      setStep(1); // Regresar al paso de selección de rol si es necesario
      return;
    }
    if (!selectedInstitution) {
      notifyError("Por favor, selecciona una institución.");
      setStep(2); // Regresar al paso de selección de institución si es necesario
      return;
    }

    try {
      const formData = new FormData();
      const token = localStorage.getItem("token");

      let photoUrl = "";
      if (selectedImage) {
        const uploadFormData = new FormData();
        uploadFormData.append("photo", selectedImage);

        const uploadResponse = await axios.post(
          "http://localhost:4555/uploadProfile",
          uploadFormData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );

        photoUrl = uploadResponse.data.imageUrl;
      }
      const response = await axios.put(
        `http://localhost:4555/profile/setup/${userData.id_user}`,
        {
          institution: selectedInstitution,
          photoUrl: photoUrl,
          id_rol: selectedRoleId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      localStorage.setItem('token', response.data.tokenSession);
      console.log(response.data.tokenSession)

      notifySuccess("Perfil completado exitosamente");
      handleClose();
    } catch (err) {
      console.error(err)
      const errorMessage = err.response?.data?.message || "Error al guardar la información";
      notifyError(errorMessage);
    }
  };


  const handleCountryChange = (e) => {
    const value = e.target.value;
    setSelectedCountry(value);
    setSelectedState(null);
    setSelectedMuni(null);
    setSelectedParish(null);
    setSelectedInstitution(null);
    setState([]);
    setMuni([]);
    setParish([]);
    setInstitutions([]);
  };

  const handleStateChange = (e) => {
    const value = e.target.value;
    setSelectedState(value);
    setSelectedMuni(null);
    setSelectedParish(null);
    setSelectedInstitution(null);
    setMuni([]);
    setParish([]);
    setInstitutions([]);
  };

  const handleMunicipalityChange = (e) => {
    const value = e.target.value;
    setSelectedMuni(value);
    setSelectedParish(null);
    setSelectedInstitution(null);
    setParish([]);
    setInstitutions([]);
  };

  const handleParishChange = (e) => {
    const value = e.target.value;
    setSelectedParish(value);
    setSelectedInstitution(null);
    setInstitutions([]);
  };
  const getRoleNameById = (roleId) => {
    const role = roles.find(r => r.id_rol === roleId);
    return role ? role.rol_name : "Desconocido";
  }


  return (
    <Modal
      show={show}
      centered
      backdrop="static"
      keyboard={false}
      dialogClassName="fixed-size-modal"
    >
      <div className="modal-container_Role">
        <div className="modal-custom-header">
          <img src={logo} width="80" height="80" alt="Logo Educativa" />
          <h4 className="mt-1 logo-title">Educativa</h4>
        </div>

        <Modal.Body
          className="text-center d-flex flex-column"
          style={{ flex: 1, height: "100%" }}
        >
          <div className="modal-body-content flex-grow-1 overflow-auto px-2">
            {step === 1 && (
              <>
                <h5>Selecciona tu rol</h5>
                <div className="d-flex justify-content-around mt-4">
                  {roles.length > 0 ? (
                    roles.map((role) => (
                      <div
                        key={role.id_rol}
                        className={`role-selection ${selectedRoleId === role.id_rol ? "selected-role" : "" // Comparar con selectedRoleId
                          }`}
                        onClick={() => setSelectedRoleId(role.id_rol)} // Almacenar el id_rol
                      >
                        <img
                          src={
                            role.rol_name === "Estudiante"
                              ? studentRole
                              : teacherRole
                          }
                          className="role-image"
                          alt={role.rol_name}
                          width={100}
                          height={100}
                        />
                        <span>{role.rol_name}</span> {/* Mostrar el nombre */}
                      </div>
                    ))
                  ) : (
                    <p>No hay roles disponibles</p>
                  )}
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <h5>Ubicación de la institución</h5>
                <div className="select-group mt-4">
                  <div className="form-group">
                    <select
                      className="form-select"
                      value={selectedCountry || ""}
                      onChange={(e) => handleCountryChange(e)}
                    >
                      <option value="" disabled>-- Selecciona un país</option>
                      {countries.map((c) => (
                        <option key={c.id_country} value={c.id_country}>
                          {c.country_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <select
                      className="form-select"
                      value={selectedState || ""}
                      onChange={(e) => handleStateChange(e)}
                      disabled={!selectedCountry}
                    >
                      <option value="" disabled>-- Selecciona un estado </option>
                      {state.map((st) => (
                        <option key={st.id_state} value={st.id_state}>
                          {st.state_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <select
                      className="form-select"
                      value={selectedMuni || ""}
                      onChange={(e) => handleMunicipalityChange(e)}
                      disabled={!selectedState}
                    >
                      <option value="" disabled>-- Selecciona un municipio</option>
                      {muni.map((m) => (
                        <option key={m.id_municipality} value={m.id_municipality}>
                          {m.municipality_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <select
                      className="form-select"
                      value={selectedParish || ""}
                      onChange={(e) => handleParishChange(e)}
                      disabled={!selectedMuni}
                    >
                      <option value="" disabled>-- Selecciona una parroquia</option>
                      {parish.map((p) => (
                        <option key={p.id_parish} value={p.id_parish}>
                          {p.parish_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group" style={{ flex: "1 1 100%" }}>
                    <select
                      className="form-select"
                      value={selectedInstitution || ""}
                      onChange={(e) => setSelectedInstitution(e.target.value)}
                      disabled={!selectedParish}
                    >
                      <option value="" disabled>-- Selecciona una institución</option>
                      {institutions.map((inst) => (
                        <option key={inst.id_insti} value={inst.id_insti}>
                          {inst.insti_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </>

            )}

            {step === 3 && (
              <>
                <h5>
                  ¡Sube una foto de perfil!{" "}
                  <span style={{ fontSize: "14px", color: "#888" }}>
                    (opcional)
                  </span>
                </h5>

                <div className="image-upload mt-4">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="preview"
                      className="preview-img"
                    />
                  ) : (
                    <label htmlFor="file-upload" className="upload-placeholder">
                      Seleccionar imagen
                    </label>
                  )}
                  <input
                    id="file-upload"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        // Validación básica de tamaño (ej: 5MB)
                        if (file.size > 5 * 1024 * 1024) {
                          notifyError("El archivo es demasiado grande. Máximo 5MB.");
                          return;
                        }
                        // Validación básica de tipo (aunque 'accept' ya ayuda)
                        if (!file.type.startsWith('image/')) {
                          notifyError("Por favor, selecciona un archivo de imagen válido.");
                          return;
                        }
                        setSelectedImage(file);
                        const reader = new FileReader();
                        reader.onloadend = () => setPreviewUrl(reader.result);
                        reader.readAsDataURL(file);
                      } else {
                        setSelectedImage(null);
                        setPreviewUrl(null);
                      }
                    }}
                    style={{ display: "none" }}
                  />
                </div>
                {/* Botón para quitar la imagen seleccionada */}
                {previewUrl && (
                  <button
                    className="btn btn-sm btn-outline-danger mt-2"
                    onClick={() => {
                      setSelectedImage(null);
                      setPreviewUrl(null);
                      const inputFile = document.getElementById('file-upload');
                      if (inputFile) {
                        inputFile.value = "";
                      }
                    }}
                  >
                    Quitar Imagen
                  </button>
                )}
              </>
            )}

            {step === 4 && (
              <>
                <h4 className="mb-2">¡Tu perfil está casi listo!</h4>
                <div className="user-summary-card">
                  <img
                    src={previewUrl || userData.user_url}
                    alt="Foto de perfil"
                    className="summary-img"
                  />
                  <div className="summary-info">
                    <p>
                      <strong>Nombre:</strong> {userData?.full_name || 'Usuario'}
                    </p>
                    <p>
                      <strong>Rol:</strong> {getRoleNameById(selectedRoleId)}
                    </p>
                    <p>
                      <strong>Institución: </strong>
                      {institutions.find(
                        (inst) => inst.id_insti == selectedInstitution
                      )?.insti_name || "Sin nombre"}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Botonera fija al fondo */}
          <div className="d-flex justify-content-between mt-4">
            {step > 1 && (
              <button className="btn-back" onClick={handleBack}>
                Atrás
              </button>
            )}
            {step === 1 && <div style={{ width: '80px' }}></div> }
            {step < 4 && (
              <button
                className="btn-next ms-auto"
                disabled={
                  (step === 1 && !selectedRoleId) ||
                  (step === 2 && !selectedInstitution)
                }
                onClick={handleNext}
              >
                Siguiente
              </button>
            )}
            {step === 4 && (
              <button className="btn-finish ms-auto" onClick={handleFinish}>
                Confirmar y continuar
              </button>
            )}
          </div>
        </Modal.Body>
      </div>

      <div className="progress-bar-container">
        <div
          className="progress-bar-fill"
          style={{ width: `${(step / 4) * 100}%` }}
        ></div>
      </div>

    </Modal>
  );
}

export default SelectRole;