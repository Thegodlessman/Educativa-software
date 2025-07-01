import React from 'react';
import './ReadyScreen.css';

const ReadyScreen = ({ onStart }) => {
    return (
        <div className="ready-screen-overlay">
            <div className="ready-screen-panel">
                <div className="ready-header">
                    <p>// INFORME DE MISIÓN //</p>
                </div>
                <div className="ready-content">
                    <h2>OBJETIVO PRINCIPAL</h2>
                    <p>
                        Piloto, tu misión es despejar el sector de la amenaza de asteroides.
                        Usa las flechas <strong>[ ⬅️ ]</strong> y <strong>[ ➡️ ]</strong> para navegar.
                    </p>
                    <p>
                        Utiliza la <strong>[ BARRA ESPACIADORA ]</strong> para disparar y destruir los objetivos.
                    </p>
                    
                    <div className="warning-section">
                        <h3>ADVERTENCIA:</h3>
                        <p>Evita colisionar con los asteroides y no dispares a las naves aliadas. La precisión es clave.</p>
                    </div>
                </div>
                <div className="ready-footer">
                    <button onClick={onStart} className="start-mission-button">
                        INICIAR MISIÓN
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReadyScreen;