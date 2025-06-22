import React from 'react';
import '../GameTest.css';

const ReadyScreen = ({ onStart }) => {
    return (
        <div className="game-screen">
            <h2>Instrucciones de la Prueba</h2>
            <p>Usa las flechas ⬅️ y ➡️ para moverte. Presiona la **barra espaciadora** para disparar a los objetivos correctos. ¡Evita chocar y no dispares a los distractores!</p>
            <button onClick={onStart}>Comenzar</button>
        </div>
    );
};

export default ReadyScreen;