import React from 'react';
import './LoadingScreen.css'; 

const LoadingScreen = ({ progress }) => {
    const percent = Math.round(progress * 100);

    return (
        <div className="loading-screen-overlay">
            <div className="loading-panel">
                <h2 className="loading-title">INICIANDO SISTEMAS</h2>
                <p className="loading-subtitle">Calibrando propulsores y cargando datos de misión...</p>
                <div className="progress-bar-container">
                    <div 
                        className="progress-bar-fill" 
                        style={{ width: `${percent}%` }}
                    ></div>
                </div>
                <p className="loading-percent">{percent}%</p>
            </div>
        </div>
    );
};

export default LoadingScreen;