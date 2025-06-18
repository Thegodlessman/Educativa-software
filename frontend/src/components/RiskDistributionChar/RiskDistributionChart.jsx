import React from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Card } from 'react-bootstrap';

ChartJS.register(ArcElement, Tooltip, Legend);

// Mapeo de nombres de riesgo 
const riskColorMap = {
    'Probable': 'rgba(255, 99, 132, 0.8)',      // Rojo
    'Poco probable': 'rgba(255, 206, 86, 0.8)',     // Amarillo
    'Nada probable': 'rgba(75, 192, 192, 0.8)',      // Verde
    'Sin Riesgo': 'rgba(54, 162, 235, 0.8)', // Azul
};

const RiskDistributionChart = ({ chartData }) => {
    if (!chartData || chartData.length === 0) {
        return (
            <Card className="text-center shadow-sm h-100">
                <Card.Body>
                    <Card.Title>Distribución de Riesgo</Card.Title>
                    <p className="text-muted mt-3">No hay datos suficientes para mostrar el gráfico.</p>
                </Card.Body>
            </Card>
        );
    }

    const data = {
        labels: chartData.map(d => d.risk_name),
        datasets: [
            {
                label: '# de Estudiantes',
                data: chartData.map(d => d.student_count),
                backgroundColor: chartData.map(d => riskColorMap[d.risk_name] || 'rgba(201, 203, 207, 0.8)'), // Color gris por defecto
                borderColor: chartData.map(d => riskColorMap[d.risk_name]?.replace('0.8', '1') || 'rgba(201, 203, 207, 1)'),
                borderWidth: 1,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Distribución de Niveles de Riesgo en la Clase',
                font: {
                    size: 16
                }
            },
        },
    };

    return (
        <Card className="shadow-sm h-100">
            <Card.Body style={{ height: '350px', position: 'relative' }}>
                <Doughnut data={data} options={options} />
            </Card.Body>
        </Card>
    );
};

export default RiskDistributionChart;