import React from 'react';
import './QuestionModal.css'; // Usaremos el mismo archivo de estilos

const QuestionModal = ({ question, onAnswer }) => {
    // Esta función ahora pasa el valor del botón a onAnswer
    const handleAnswerClick = (answer) => {
        onAnswer({ questionId: question.id, answer: answer });
    };

    return (
        <div className="modal-overlay">
            <div className="modal-hologram-panel">
                <div className="modal-header">
                    <p>// EVALUACIÓN DE ESTADO //</p>
                </div>
                <div className="modal-content">
                    <p className="modal-instruction-text">{question.text}</p>
                </div>
                <div className="modal-footer">
                    {/* Contenedor para los botones de opción */}
                    <div className="modal-options">
                        <button 
                            onClick={() => handleAnswerClick('Sí')} 
                            className="modal-option-button yes-button"
                        >
                            SÍ
                        </button>
                        <button 
                            onClick={() => handleAnswerClick('No')} 
                            className="modal-option-button no-button"
                        >
                            NO
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuestionModal;