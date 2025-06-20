import React from 'react';
import '../GameTest.css';

const GameUI = ({ score, time, hits, omissions, commissions, collisions, onGameEnd }) => {
    const formatTime = (ms) => {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
        const seconds = (totalSeconds % 60).toString().padStart(2, '0');
        return `${minutes}:${seconds}`;
    };

    return (
        <div className="game-ui-overlay">
            <div className="game-stats-main">
                <span>Puntuación: <strong>{score}</strong></span>
                <span>Tiempo: <strong>{formatTime(time)}</strong></span>
            </div>
            <div className="game-stats-debug">
                <span>Aciertos: <strong>{hits}</strong></span>
                <span>Omisión: <strong>{omissions}</strong></span>
                <span>Comisión: <strong>{commissions}</strong></span>
                <span>Choques: <strong>{collisions}</strong></span>
            </div>
            <button onClick={onGameEnd} className="debug-end-button">
                Terminar
            </button>
        </div>
    );
};

export default GameUI;