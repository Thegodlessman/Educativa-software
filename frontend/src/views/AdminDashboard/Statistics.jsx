import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Statistics = () => {
    const [stats, setStats] = useState(null);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await axios.get('/api/admin/statistics/tdah');
            setStats(res.data);
        } catch (err) {
            console.error('Error fetching statistics', err);
        }
    };

    return (
        <div>
            <h2>Estadísticas</h2>
            {!stats && <p>Cargando estadísticas...</p>}
            {stats && (
                <div>
                    <h3>Resumen por País</h3>
                    <ul>
                        {stats.countries && stats.countries.map(c => (
                            <li key={c.id_country}>{c.country_name}: {c.tdah_percentage}%</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default Statistics;
