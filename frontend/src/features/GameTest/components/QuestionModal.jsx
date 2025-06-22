import React, { useState, useEffect } from 'react';
import '../GameTest.css';

const QuestionModal = ({ question, onAnswer }) => {
    const [selectedAnswer, setSelectedAnswer] = useState(null);

    // Reiniciar la selección cuando la pregunta cambia
    useEffect(() => {
        setSelectedAnswer(null);
    }, [question]);

    const handleSubmit = () => {
        if (selectedAnswer !== null) {
            onAnswer({
                questionText: question.text,
                answer: selectedAnswer,
                timestamp: Date.now(),
            });
        }
    };

    return (
        <div className="question-modal-backdrop">
            <div className="question-modal-content">
                <h3>{question.text}</h3>
                <div className="question-modal-options">
                    {question.options.map((option, index) => (
                        <button
                            key={index}
                            onClick={() => setSelectedAnswer(option)}
                            className={selectedAnswer === option ? 'selected' : ''}
                        >
                            {option}
                        </button>
                    ))}
                </div>
                <button
                    className="question-modal-submit"
                    onClick={handleSubmit}
                    disabled={selectedAnswer === null}
                >
                    Enviar Respuesta
                </button>
            </div>
        </div>
    );
};

export default QuestionModal;