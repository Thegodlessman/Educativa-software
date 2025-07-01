import React from 'react';
import './GameUI.css';

const formatTime = (timeInMs) => {
    const totalSeconds = Math.floor(timeInMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const GameUI = ({ score, time, hits, omissions, commissions, collisions, onGameEnd }) => {
    return (
        <div className="game-ui-container">
            <div className="metric-item">
                <span className="metric-label">TIEMPO</span>
                <span className="metric-value">{formatTime(time)}</span>
            </div>
            <div className="metric-item">
                <span className="metric-label">PUNTOS</span>
                <span className="metric-value">{score}</span>
            </div>
            {/* <div className="metric-item">
                <span className="metric-label">ACIERTOS</span>
                <span className="metric-value">{hits}</span>
            </div>
            <div className="metric-item">
                <span className="metric-label">ERRORES COMISIÓN</span>
                <span className="metric-value">{commissions}</span>
            </div>
            <div className="metric-item">
                <span className="metric-label">ERRORES OMISIÓN</span>
                <span className="metric-value">{omissions}</span>
            </div>
            <div className="metric-item">
                <span className="metric-label">COLISIONES</span>
                <span className="metric-value">{collisions}</span>
            </div> */}
            <button onClick={onGameEnd} className="end-game-button">
                Terminar Prueba
            </button>
        </div>
    );
};

export default GameUI;