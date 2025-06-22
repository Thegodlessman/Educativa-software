import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSocketContext } from '../../../context/SocketContext';
import { notifyError, notifySuccess } from '../../../utils/notify';

// Importar todas nuestras nuevas piezas
import { usePixiGame } from '../hooks/usePixiGame.jsx';
import LoadingScreen from '../components/LoadingScreen';
import ReadyScreen from '../components/ReadyScreen';
import GameUI from '../components/GameUI';
import QuestionModal from '../components/QuestionModal';
import FinishedScreen from '../components/FinishedScreen';
import '../GameTest.css';

// Importar los assets. Asegúrate que las rutas son correctas.
import playerShipImg from '../assets/player_ship_perspective.png';
import asteroidAImg from '../assets/asteroid_a.png';
import friendlyShipImg from '../assets/friendly_ship.png';
import energyBoltImg from '../assets/energy_bolt.png';
import spaceBackgroundImg from '../assets/space_background_scrolling.png';
import shootSfx from '../assets/sfx/shoot.mp3';
import explosionSfx from '../assets/sfx/explosion.mp3';
import errorSfx from '../assets/sfx/error.mp3';
import playerHitSfx from '../assets/sfx/player_hit.mp3';

const questions = [
    { id: 1, text: "Siempre encuentro mis clases en la escuela muy aburridas.", options: ["Sí", "No"] },
    { id: 2, text: "Tengo mal genio.", options: ["Sí", "No"] },
    { id: 3, text: "Leer se me hace aburrido si no hay imágenes.", options: ["Sí", "No"] },
    { id: 4, text: "Casi siempre estoy en movimiento.", options: ["Sí", "No"] },
    { id: 5, text: "A veces olvido las cosas que estaba haciendo.", options: ["Sí", "No"] },
    { id: 6, text: "No presto atención cuando me hablan.", options: ["Sí", "No"] }
];

const GameTest = ({ userId, id_room, onGameEnd: onTestComplete, studentName, id_test_actual }) => {
    const { socket, isConnected } = useSocketContext();
    const navigate = useNavigate();

    const [gameState, setGameState] = useState('loading');
    const [currentMetrics, setCurrentMetrics] = useState({ score: 0, time: 0 });
    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [answeredQuestions, setAnsweredQuestions] = useState([]);

    const assets = useMemo(() => ({
        player: playerShipImg,
        asteroid: asteroidAImg,
        friendly: friendlyShipImg,
        projectile: energyBoltImg,
        background: spaceBackgroundImg,
        shootSfx, explosionSfx, errorSfx, playerHitSfx,
    }), []);

    const handleGameEnd = useCallback((finalMetrics) => {
        setGameState('finished');
        if (socket) {
            const metricsToSend = {
                ...finalMetrics,
                id_test_para_actualizar: id_test_actual,
                userId, id_room,
                questionsAnswered: answeredQuestions,
            };
            socket.emit('submitGameTestResults', metricsToSend);
        }
        if (onTestComplete) onTestComplete();
    }, [socket, id_test_actual, userId, id_room, answeredQuestions, onTestComplete]);

    const handleShowQuestion = useCallback((questionIndex) => {
        if (questions[questionIndex]) {
            setCurrentQuestion(questions[questionIndex]);
            pauseGame();
            setGameState('paused');
        }
    }, []);

    const { pixiContainerRef, startGame, pauseGame, resumeGame, endGame } = usePixiGame({
        assets,
        onGameEnd: handleGameEnd,
        onMetricUpdate: setCurrentMetrics,
        onQuestion: handleShowQuestion,
        id_test_actual: id_test_actual,
    });

    useEffect(() => {
        if (pixiContainerRef.current) {
            setGameState('ready');
        }
    }, [pixiContainerRef.current]);

    const handleStartGame = () => {
        setGameState('playing');
        startGame();
    };

    const handleAnswerSubmit = (answer) => {
        setAnsweredQuestions(prev => [...prev, answer]);
        setCurrentQuestion(null);
        setGameState('playing');
        resumeGame();
    };

    const renderGameState = () => {
        const isGameVisible = gameState === 'playing' || gameState === 'paused';
        return (
            <>
                {gameState === 'loading' && <LoadingScreen />}
                {gameState === 'ready' && <ReadyScreen onStart={handleStartGame} />}
                {gameState === 'finished' && <FinishedScreen finalScore={currentMetrics.score} />}

                <div style={{ position: 'relative', display: isGameVisible ? 'block' : 'none', width: '800px', height: '600px', margin: 'auto' }}>
                    <GameUI
                        score={currentMetrics.score}
                        time={currentMetrics.time}
                        hits={currentMetrics.correct_hits}
                        omissions={currentMetrics.omission_errors}
                        commissions={currentMetrics.commission_errors}
                        collisions={currentMetrics.collision_errors}
                        onGameEnd={endGame}
                    />
                    <div ref={pixiContainerRef} style={{ width: '100%', height: '100%' }} />
                </div>

                {gameState === 'paused' && currentQuestion && (
                    <QuestionModal question={currentQuestion} onAnswer={handleAnswerSubmit} />
                )}
            </>
        );
    };

    return (
        <div className="game-wrapper">
            {renderGameState()}
        </div>
    );
};

export default GameTest;