import { Router } from "express";
import { getRoleId, getInstiByParish,setupUserProfile, getCountries, getStatesByCountry, getMunicipalitiesByState, getParishesByMunicipality } from "../controllers/profile.controller.js";

const profileRouter = Router();

profileRouter.get('/profile/get/role/:rol_name', getRoleId);

profileRouter.get('/profile/get/countries', getCountries)
profileRouter.get('/profile/get/stateByCountries/:id_country', getStatesByCountry)
profileRouter.get('/profile/get/munByStates/:id_state', getMunicipalitiesByState)
profileRouter.get('/profile/get/parishesByMunicipality/:id_mun', getParishesByMunicipality)
profileRouter.get('/profile/get/institutionsByParish/:id_parish', getInstiByParish)

profileRouter.put("/profile/setup/:id", setupUserProfile);

export default profileRouter; 