import React, { useEffect, useState } from 'react';
import axios from 'axios';

const LocationManagement = () => {
    const [countries, setCountries] = useState([]);

    useEffect(() => {
        fetchCountries();
    }, []);

    const fetchCountries = async () => {
        try {
            const res = await axios.get('/api/profile/get/countries');
            setCountries(res.data.countries || []);
        } catch (err) {
            console.error('Error fetching countries', err);
        }
    };

    return (
        <div>
            <h2>Gestión de Ubicaciones</h2>
            <p>Desde aquí podrá gestionar Países, Estados, Municipios, Parroquias e Instituciones.</p>
            <section>
                <h3>Países</h3>
                <ul>
                    {countries.map(c => (
                        <li key={c.id_country}>{c.country_name}</li>
                    ))}
                </ul>
            </section>
            <p>(CRUD básico aún por implementar — endpoints ya añadidos en backend)</p>
        </div>
    );
};

export default LocationManagement;
