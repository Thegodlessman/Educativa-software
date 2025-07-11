import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSocketContext } from '../../../context/SocketContext';
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
import shootSfx from '../assets/sfx/shoot.mp3';
import explosionSfx from '../assets/sfx/explosion.mp3';
import errorSfx from '../assets/sfx/error.mp3';
import playerHitSfx from '../assets/sfx/player_hit.mp3';
import thrusterSfx from '../assets/sfx/thruster.wav';
import backgroundMusic from '../assets/music/background_music_1.mp3';
import spaceBackground1 from '../assets/space_background_scrolling.png';
import spaceBackground2 from '../assets/space_background_scrolling2.png';
import spaceBackground3 from '../assets/space_background_scrolling3.png';

const questions = [
    { id: 1, text: "¿Cómo son tus clases?", options: ["Aburridas", "Divertidas"] },
    { id: 2, text: "¿A menudo tienes mal genio o te enojas fácilmente?", options: ["Sí", "No"] },
    { id: 3, text: "¿Te gusta leer libros?", options: ["Sí", "No"] },
    { id: 4, text: "¿Te gusta conversar con tus compañeros durante las clases?", options: ["Sí", "No"] },
    { id: 5, text: "¿Saltas, caminas o corres dentro del salón de clases?", options: ["Sí", "No"] },
    { id: 6, text: "¿Mantienes tus cosas organizadas y guardadas adecuadamente?", options: ["Sí", "No"] },
    { id: 7, text: "¿Te gusta jugar durante las clases?.", options: ["Sí", "No"] },
    { id: 8, text: "¿Ayudas a recoger y organizar el salón de clase?", options: ["Sí", "No"] },
    { id: 9, text: "¿Recuerdas fechas, nombres o tareas fácilmente?", options: ["Sí", "No"] }
];

const GameTest = ({ userId, id_room, onGameEnd: onTestComplete, studentName, id_test_actual }) => {
    const { socket } = useSocketContext();
    const navigate = useNavigate();

    const [gameState, setGameState] = useState('loading');
    const [currentMetrics, setCurrentMetrics] = useState(null);
    const [currentQuestion, setCurrentQuestion] = useState(null);
    const [answeredQuestions, setAnsweredQuestions] = useState([]);
    const [loadProgress, setLoadProgress] = useState(0);

    const assets = useMemo(() => ({
        player: playerShipImg, asteroid: asteroidAImg, friendly: friendlyShipImg,
        projectile: energyBoltImg,
        backgrounds: [spaceBackground1, spaceBackground2, spaceBackground3],
        shootSfx, explosionSfx, errorSfx, playerHitSfx, thrusterSfx, backgroundMusic,
    }), []);

    const handleGameEnd = useCallback((finalMetrics) => {
        setGameState('finished');
        setCurrentMetrics(finalMetrics);

        if (socket) {
            const metricsToSend = {
                ...finalMetrics,
                id_test_para_actualizar: id_test_actual,
                userId, id_room,
                questionsAnswered: answeredQuestions,
            };
            socket.emit('submitGameTestResults', metricsToSend);
        }

    }, [socket, id_test_actual, userId, id_room, answeredQuestions]);

    const handleCloseReport = () => {
        if (onTestComplete) {
            onTestComplete();
        }
    };

    const handleShowQuestion = useCallback((questionIndex) => {

        if (pauseGame) pauseGame();
        if (questions[questionIndex]) {
            setCurrentQuestion(questions[questionIndex]);
            setGameState('paused');
        }
    }, []);

    const { pixiContainerRef, startGame, pauseGame, resumeGame, endGame } = usePixiGame({
        assets,
        onGameEnd: handleGameEnd,
        onMetricUpdate: setCurrentMetrics,
        onQuestion: handleShowQuestion,
        onLoadProgress: setLoadProgress,
        id_test_actual: id_test_actual,
    });

    useEffect(() => {
        handleShowQuestion.dependencies = [pauseGame];
    }, [pauseGame, handleShowQuestion]);


    useEffect(() => {
        if (loadProgress >= 1) {
            setTimeout(() => setGameState('ready'), 500);
        }
    }, [loadProgress]);

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
                {gameState === 'loading' && <LoadingScreen progress={loadProgress} />}
                {gameState === 'ready' && <ReadyScreen onStart={handleStartGame} />}

                {gameState === 'finished' && <FinishedScreen finalMetrics={currentMetrics} onClose={handleCloseReport} />}

                <div style={{ position: 'relative', display: isGameVisible ? 'block' : 'none', width: '800px', height: '600px', margin: 'auto' }}>
                    <GameUI
                        score={currentMetrics?.score || 0}
                        time={currentMetrics?.time || 0}
                        hits={currentMetrics?.correct_hits || 0}
                        omissions={currentMetrics?.omission_errors || 0}
                        commissions={currentMetrics?.commission_errors || 0}
                        collisions={currentMetrics?.collision_errors || 0}
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