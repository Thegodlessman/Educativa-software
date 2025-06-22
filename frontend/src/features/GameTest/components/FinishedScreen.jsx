import React from 'react';
import '../GameTest.css';

const FinishedScreen = ({ finalScore }) => {
    return (
        <div className="game-screen">
            <h2>¡Prueba Completada!</h2>
            <p>Gracias por participar. Tus resultados están siendo procesados por el docente.</p>
            {finalScore !== undefined && <h3>Puntuación Final: {finalScore}</h3>}
        </div>
    );
};

export default FinishedScreen;