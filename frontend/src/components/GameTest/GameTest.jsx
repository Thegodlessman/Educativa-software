import React, { useEffect, useRef, useState } from 'react';
import useSocket from '../../hooks/useSocket';
import * as _PIXI from 'pixi.js';
import importedMusicURL from './music/background_music_1.mp3';

// Imports de todos los assets, incluyendo los nuevos
import playerShipImg from '../../assets/game/player_ship_perspective.png';
import asteroidAImg from '../../assets/game/asteroid_a.png';
import asteroidBImg from '../../assets/game/asteroid_b.png';
import energyBoltImg from '../../assets/game/energy_bolt.png';
import friendlyShipImg from '../../assets/game/friendly_ship.png';
import spaceBackgroundImg from '../../assets/game/space_background_scrolling.png';


import shootSfx from '../../assets/game/sfx/shoot.mp3';
import explosionSfx from '../../assets/game/sfx/explosion.mp3';
import errorSfx from '../../assets/game/sfx/error.mp3';
import playerHitSfx from '../../assets/game/sfx/player_hit.mp3';

const PIXI = _PIXI;

const generateUUID = () => crypto.randomUUID ? crypto.randomUUID() : ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c => (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16));

const MUSIC_URL = importedMusicURL;

const questions = [
    { id: 1, text: "Siempre encuentro mis clases en la escuela muy aburridas.", imageUrl: 'https://picsum.photos/seed/question1/400/300' },
    { id: 2, text: "Tengo mal genio.", imageUrl: 'https://picsum.photos/seed/question2/400/300' },
    { id: 3, text: "Leer se me hace aburrido si no hay imágenes.", imageUrl: 'https://picsum.photos/seed/question3/400/300' },
    { id: 4, text: "Casi siempre estoy en movimiento.", imageUrl: 'https://picsum.photos/seed/question4/400/300' },
    { id: 5, text: "A veces olvido las cosas que estaba haciendo.", imageUrl: 'https://picsum.photos/seed/question5/400/300' },
    { id: 6, text: "No presto atención cuando me hablan.", imageUrl: 'https://picsum.photos/seed/question6/400/300' }
];

// Manifiesto de carga actualizado con los nuevos assets
const assets = [
    { alias: 'playerShip', src: playerShipImg },
    { alias: 'asteroidA', src: asteroidAImg },
    { alias: 'asteroidB', src: asteroidBImg },
    { alias: 'energyBolt', src: energyBoltImg },
    { alias: 'friendlyShip', src: friendlyShipImg },
    { alias: 'spaceBackground', src: spaceBackgroundImg },
    { alias: 'gameMusic', src: importedMusicURL }
];


function GameTest({ id_test_actual, userId, onGameEnd, id_room }) {
    const BACKEND_SOCKET_URL = import.meta.env.VITE_BACKEND_URL;
    const { socket, isConnected } = useSocket(BACKEND_SOCKET_URL);

    const pixiContainerRef = useRef(null);
    const [score, setScore] = useState(0);

    const appRef = useRef(null);
    const player = useRef(null);
    const keys = useRef({});

    const [gameState, setGameState] = useState('INITIALIZING');
    const [isPixiAppReady, setIsPixiAppReady] = useState(false);
    const [currentQuestion, setCurrentQuestion] = useState(null);

    const loadingTextRef = useRef(null);
    const startMessageRef = useRef(null);
    const backgroundSpriteRef = useRef(null);
    const loadingSpinnerRef = useRef(null);
    const loadingProcessTimerRef = useRef(null);
    const backgroundMusicRef = useRef(null);
    const questionTimerRef = useRef(0);
    const nextQuestionIndexRef = useRef(0);

    const sfx = useRef({});

    const gameDifficultySettings = useRef({
        INITIAL_GAMESPEED_Y: 5,
        INITIAL_OBSTACLE_SPEED: 5,
        MAX_SPEED_MULTIPLIER: 1.8,
        SPEED_INCREASE_INTERVAL: 30000,
        SPEED_INCREASE_FACTOR: 1.1,
        INITIAL_SPAWN_INTERVAL: 1200,
        MIN_SPAWN_INTERVAL: 500,
        SPAWN_INTERVAL_DECREASE: 75,
    });

    const gameTime = useRef(0);
    const timeSinceLastSpeedIncrease = useRef(0);

    const gameConstants = useRef({
        playerWidth: 70,
        playerHeight: 70,
        bulletWidth: 30,
        bulletHeight: 60,
        minObstacleScale: 0.05,
        maxObstacleScale: 0.3,
        gameSpeedY: 5,
        laneChangeSpeed: 0.15,
        roadWidthAtBottom: 0.8,
        roadWidthAtTop: 0.05,
        horizonY: 0.1,
        bulletSpeedY: 20,
        shootCooldown: 300,
        bulletAngleStrength: 9,
        obstacleSpawnInterval: 1200,
        obstacleMoveSpeed: 5,
        reactionZoneStartYRatio: 0.75,
        questionInterval: 240000,
        INVINCIBILITY_DURATION: 2000,
    });

    const currentLaneIndex = useRef(1);
    const targetPlayerX = useRef(0);
    const lanePositions = useRef([]);

    const bullets = useRef([]);
    const bulletPool = useRef([]);
    const canShoot = useRef(true);
    const shootCooldownTimer = useRef(0);

    const playerGroundY = useRef(0);

    const obstacles = useRef([]);
    const obstacleSpawnTimer = useRef(0);
    const obstaclePool = useRef([]);

    const metrics = useRef({});
    const gameEndedRef = useRef(false);
    const observerRef = useRef(null);

    const getRoadWidthAtY = (y, screenWidth, screenHeight) => {
        const gc = gameConstants.current;
        const effectiveRoadHeight = screenHeight * (1 - gc.horizonY);
        const normalizedY = Math.max(0, Math.min(1, (y - (screenHeight * gc.horizonY)) / effectiveRoadHeight));
        return screenWidth * (gc.roadWidthAtTop * (1 - normalizedY) + gc.roadWidthAtBottom * normalizedY);
    };

    const getAbsoluteX = (normalizedRoadX, y, screenWidth, screenHeight) => {
        const currentRoadWidth = getRoadWidthAtY(y, screenWidth, screenHeight);
        const horizontalOffset = normalizedRoadX * currentRoadWidth / 2;
        return screenWidth / 2 + horizontalOffset;
    };

    const updatePerspectiveSegment = (graphic, currentSegmentY, screenWidth, screenHeight) => {
        const gc = gameConstants.current;
        const effectiveRoadHeight = screenHeight * (1 - gc.horizonY);
        const normalizedY = Math.max(0, Math.min(1, (currentSegmentY - (screenHeight * gc.horizonY)) / effectiveRoadHeight));

        const scaleFactor = gc.minObstacleScale + (normalizedY * (gc.maxObstacleScale - gc.minObstacleScale));
        graphic.scale.set(scaleFactor);

        graphic.visible = true;
        const obstacleCenterX = getAbsoluteX(graphic.laneFactor, currentSegmentY, screenWidth, screenHeight);
        graphic.x = obstacleCenterX;
        graphic.y = currentSegmentY;
    };

    const getBulletFromPool = () => {
        let bullet = bulletPool.current.pop();
        if (!bullet) {
            const bulletTexture = PIXI.Assets.get('energyBolt');
            bullet = new PIXI.Sprite(bulletTexture);
            bullet.anchor.set(0.5);
        }
        if (appRef.current?.stage && !bullet.parent) {
            appRef.current.stage.addChild(bullet);
        }
        bullet.visible = true;
        return bullet;
    };

    const playSound = (soundName, volume = 0.5) => {
        if (sfx.current[soundName]) {
            sfx.current[soundName].currentTime = 0; // Permite que el sonido se repita rápidamente
            sfx.current[soundName].volume = volume;
            sfx.current[soundName].play().catch(e => console.error("Error al reproducir sonido:", e));
        }
    };

    const createBullet = () => {
        if (!player.current || appRef.current.destroyed || gameState !== 'PLAYING') return;

        playSound('shoot');
        
        let isThreateningTargetInLane = false;
        const playerLaneFactor = (currentLaneIndex.current - 1) * 0.75;
        for (const obs of obstacles.current) {
            if (obs.type === 'target' && obs.isThreatening && !obs.isHit && !obs.isCollision) {
                const obstacleLaneFactor = (obs.lane - 1) * 0.75;
                if (obstacleLaneFactor === playerLaneFactor) {
                    isThreateningTargetInLane = true;
                    break;
                }
            }
        }
        if (!isThreateningTargetInLane) {
            metrics.current.missed_shots++;
        }

        const gc = gameConstants.current;
        const bulletSprite = getBulletFromPool();
        bulletSprite.width = gc.bulletWidth;
        bulletSprite.height = gc.bulletHeight;
        bulletSprite.x = player.current.x;
        bulletSprite.y = player.current.y - (player.current.height / 2);
        let speedX = 0;
        if (currentLaneIndex.current === 0) speedX = gc.bulletAngleStrength;
        else if (currentLaneIndex.current === 2) speedX = -gc.bulletAngleStrength;
        const bulletObject = { graphic: bulletSprite, speedX: speedX };
        bullets.current.push(bulletObject);
    };

    const getObstacleFromPool = (type) => {
        let obstacle = obstaclePool.current.pop();
        const texture = type === 'target'
            ? PIXI.Assets.get(['asteroidA', 'asteroidB'][Math.floor(Math.random() * 2)])
            : PIXI.Assets.get('friendlyShip');

        if (!obstacle) {
            obstacle = new PIXI.Sprite(texture);
            obstacle.anchor.set(0.5);
        } else {
            obstacle.texture = texture;
        }

        if (appRef.current?.stage && !obstacle.parent) {
            appRef.current.stage.addChild(obstacle);
        }
        obstacle.visible = true;
        return obstacle;
    };

    const createObstacle = (appInstance, laneIndex) => {
        if (!appInstance || appInstance.destroyed || gameState !== 'PLAYING') return;
        
        const type = Math.random() < 0.8 ? 'target' : 'non-target';
        const obstacleSprite = getObstacleFromPool(type);
        
        obstacleSprite.y = appInstance.screen.height * gameConstants.current.horizonY;
        const obstacleId = `obs-${generateUUID()}`;
        const laneFactor = (laneIndex - 1) * 0.75;
        obstacleSprite.laneFactor = laneFactor;

        const obstacleObject = {
            id: obstacleId,
            graphic: obstacleSprite,
            type: type,
            lane: laneIndex,
            isCollision: false,
            isHit: false,
            spawnTime: Date.now(),
            enteredReactionZoneTime: null,
            isThreatening: false,
        };
        obstacles.current.push(obstacleObject);
    };
    
    const checkCollision = (obj1, obj2) => {
        if (!obj1?.visible || !obj2?.visible || obj1.destroyed || obj2.destroyed) return false;
        const bounds1 = obj1.getBounds();
        const bounds2 = obj2.getBounds();
        return bounds1.x < bounds2.x + bounds2.width &&
               bounds1.x + bounds1.width > bounds2.x &&
               bounds1.y < bounds2.y + bounds2.height &&
               bounds1.y + bounds1.height > bounds2.y;
    };

    const createLaneMarkers = (appInstance) => {
        if (!appInstance || !appInstance.stage || appInstance.destroyed) return;
        const screenWidth = appInstance.screen.width;
        const screenHeight = appInstance.screen.height;
        const markerY = screenHeight - 15;
        const laneFactors = [-0.75, 0.0, 0.75];
        laneFactors.forEach(factor => {
            const marker = new PIXI.Graphics();
            const markerX = getAbsoluteX(factor, markerY, screenWidth, screenHeight);
            marker.circle(0, 0, 10).fill({ color: 0xFFFFFF, alpha: 0.2 });
            marker.x = markerX;
            marker.y = markerY;
            appInstance.stage.addChild(marker);
        });
    };
    
    const sendGameDataToBackend = () => {
        if (gameEndedRef.current) return;
        gameEndedRef.current = true;
        metrics.current.gameEndTime = Date.now();
        if (metrics.current.gameStartTime) {
            metrics.current.totalGameDuration = (metrics.current.gameEndTime - metrics.current.gameStartTime) / 1000;
        }
        metrics.current.score = score;
        if (socket && isConnected) {
            socket.emit('submitGameTestResults', metrics.current);
            console.log(metrics.current)
        }
    };
    
    const handleGameKeyDown = (event) => {
        if (gameEndedRef.current || gameState !== 'PLAYING') return;
        if ((event.code === 'ArrowLeft' || event.code === 'KeyA')) {
            if (currentLaneIndex.current > 0) currentLaneIndex.current--;
        } else if ((event.code === 'ArrowRight' || event.code === 'KeyD')) {
            if (currentLaneIndex.current < 2) currentLaneIndex.current++;
        } else if ((event.code === 'Space' || event.code === 'ArrowUp')) {
            if (canShoot.current) {
                createBullet();
                canShoot.current = false;
                shootCooldownTimer.current = 0;
            }
        }
        if (['Space', 'ArrowUp', 'ArrowLeft', 'KeyA', 'ArrowRight', 'KeyD'].includes(event.code)) {
            event.preventDefault();
        }
    };
    
    const handleGameKeyUp = (event) => { keys.current[event.code] = false; };

    const gameLoop = (ticker) => {
        if (gameEndedRef.current || !appRef.current?.stage || !player.current || appRef.current.destroyed || gameState !== 'PLAYING') return;
        
        const deltaMs = ticker.deltaMS;
        gameTime.current += deltaMs;
        timeSinceLastSpeedIncrease.current += deltaMs;

        if (timeSinceLastSpeedIncrease.current > gameDifficultySettings.current.SPEED_INCREASE_INTERVAL) {
            const settings = gameDifficultySettings.current;
            const currentMaxSpeedY = settings.INITIAL_GAMESPEED_Y * settings.MAX_SPEED_MULTIPLIER;

            if (gameConstants.current.gameSpeedY < currentMaxSpeedY) {
                gameConstants.current.gameSpeedY *= settings.SPEED_INCREASE_FACTOR;
                gameConstants.current.obstacleMoveSpeed *= settings.SPEED_INCREASE_FACTOR;
            }
            if (gameConstants.current.obstacleSpawnInterval > settings.MIN_SPAWN_INTERVAL) {
                gameConstants.current.obstacleSpawnInterval -= settings.SPAWN_INTERVAL_DECREASE;
            }
            timeSinceLastSpeedIncrease.current = 0;
        }

        const delta = deltaMs / (1000 / 60);
        const actualDelta = Math.max(0.1, Math.min(delta, 3));
        const screenWidth = appRef.current.screen.width;
        const screenHeight = appRef.current.screen.height;
        const gc = gameConstants.current;

        targetPlayerX.current = lanePositions.current[currentLaneIndex.current];
        if (isNaN(player.current.x)) player.current.x = targetPlayerX.current;
        player.current.x += (targetPlayerX.current - player.current.x) * gc.laneChangeSpeed * actualDelta;

        const roadBoundLeft = getAbsoluteX(-1.0, player.current.y, screenWidth, screenHeight);
        const roadBoundRight = getAbsoluteX(1.0, player.current.y, screenWidth, screenHeight);
        player.current.x = Math.max(roadBoundLeft + player.current.width / 2, Math.min(roadBoundRight - player.current.width / 2, player.current.x));

        if (!canShoot.current) {
            shootCooldownTimer.current += deltaMs;
            if (shootCooldownTimer.current >= gc.shootCooldown) canShoot.current = true;
        }

        obstacleSpawnTimer.current += deltaMs;
        if (obstacleSpawnTimer.current >= gc.obstacleSpawnInterval) {
            createObstacle(appRef.current, Math.floor(Math.random() * 3));
            obstacleSpawnTimer.current = 0;
        }
        
        questionTimerRef.current += deltaMs;
        if (questionTimerRef.current >= gc.questionInterval) {
            questionTimerRef.current = 0;
            const questionToShow = questions[nextQuestionIndexRef.current];
            setCurrentQuestion(questionToShow);
            setGameState('SHOWING_QUESTION');
            nextQuestionIndexRef.current = (nextQuestionIndexRef.current + 1) % questions.length;
        }

        if (player.current.isInvincible) {
            player.current.invincibilityTimer += deltaMs;
            player.current.visible = Math.floor(player.current.invincibilityTimer / 150) % 2 === 0;

            // Comprobamos si el tiempo de invulnerabilidad ha terminado
            if (player.current.invincibilityTimer >= gameConstants.current.INVINCIBILITY_DURATION) {
                player.current.isInvincible = false;
                player.current.invincibilityTimer = 0;
                player.current.visible = true; // Nos aseguramos de que el jugador sea visible al final
            }
        }

        const activeBullets = [];
        bullets.current.forEach(bullet => {
            bullet.graphic.y -= gc.bulletSpeedY * actualDelta;
            bullet.graphic.x += bullet.speedX * actualDelta;
            if (bullet.graphic.y < -bullet.graphic.height) {
                bullet.graphic.visible = false;
                bulletPool.current.push(bullet.graphic);
            } else {
                activeBullets.push(bullet);
            }
        });
        bullets.current = activeBullets;
        
        const bulletsToRemove = new Set();
        obstacles.current.forEach(obstacle => {
            if (!obstacle.graphic.visible || obstacle.isHit || obstacle.isCollision) return;
            bullets.current.forEach(bullet => {
                if (!bullet.graphic.visible) return;
                if (checkCollision(bullet.graphic, obstacle.graphic)) {
                    bullet.graphic.visible = false;
                    bulletsToRemove.add(bullet);
                    if (obstacle.type === 'target') {
                        playSound('explosion');
                        metrics.current.correct_hits++;
                        setScore(prev => prev + 10);
                        obstacle.isHit = true;
                        obstacle.graphic.visible = false;
                        if (obstacle.enteredReactionZoneTime) {
                            metrics.current.reactionTimes.push({ obstacleId: obstacle.id, time: Date.now() - obstacle.enteredReactionZoneTime, type: 'hit' });
                        }
                    } else { // type === 'non-target'
                        playSound('error'); 
                        metrics.current.commission_errors++;
                    }
                }
            });
        });
        bullets.current = bullets.current.filter(b => !bulletsToRemove.has(b));
        bulletsToRemove.forEach(b => bulletPool.current.push(b.graphic));

        const reactionZoneStartY = screenHeight * gc.reactionZoneStartYRatio;
        const activeObstacles = [];
        obstacles.current.forEach(obstacle => {
            if (obstacle.isHit) {
                obstaclePool.current.push(obstacle.graphic);
                return;
            }
            obstacle.graphic.y += gc.obstacleMoveSpeed * actualDelta;
            updatePerspectiveSegment(obstacle.graphic, obstacle.graphic.y, screenWidth, screenHeight);

            if (!obstacle.isThreatening && (obstacle.graphic.y + obstacle.graphic.height) > reactionZoneStartY) {
                obstacle.isThreatening = true;
                obstacle.enteredReactionZoneTime = Date.now();
            }

            if (!obstacle.isCollision && obstacle.type === 'target' && !player.current.isInvincible && checkCollision(player.current, obstacle.graphic)) {
                playSound('playerHit');
                metrics.current.collision_errors++;
                obstacle.isCollision = true;

                // Activamos la invulnerabilidad en el jugador
                player.current.isInvincible = true;
                player.current.invincibilityTimer = 0;

                if (obstacle.enteredReactionZoneTime) {
                    metrics.current.reactionTimes.push({ obstacleId: obstacle.id, time: Date.now() - obstacle.enteredReactionZoneTime, type: 'collision' });
                }
            }

            if (obstacle.graphic.y > screenHeight + obstacle.graphic.height) {
                if (obstacle.type === 'target' && !obstacle.isHit && !obstacle.isCollision) {
                    metrics.current.omission_errors++;
                }
                obstacle.graphic.visible = false;
                obstaclePool.current.push(obstacle.graphic);
            } else {
                activeObstacles.push(obstacle);
            }
        });
        obstacles.current = activeObstacles;
    };
    
    const cleanupPixiAndGame = (fullDestroy = true) => {
        window.removeEventListener('keydown', handleGameKeyDown);
        window.removeEventListener('keyup', handleGameKeyUp);
        if (loadingProcessTimerRef.current) clearTimeout(loadingProcessTimerRef.current);
        if (backgroundMusicRef.current) {
            backgroundMusicRef.current.pause();
            backgroundMusicRef.current.removeAttribute('src');
            backgroundMusicRef.current.load();
            backgroundMusicRef.current = null;
        }
        if (appRef.current) {
            if (appRef.current.ticker) appRef.current.ticker.stop();
            if (fullDestroy && !appRef.current.destroyed) {
                appRef.current.destroy(true, { children: true, texture: true, baseTexture: true });
                appRef.current = null;
            } else if (!fullDestroy && appRef.current.stage) {
                appRef.current.stage.removeChildren();
            }
        }
        [bullets, bulletPool, obstacles, obstaclePool].forEach(arrRef => arrRef.current = []);
        setIsPixiAppReady(false);
        keys.current = {};
    };

    useEffect(() => {
        gameEndedRef.current = false;
        metrics.current = {
            id_test_para_actualizar: id_test_actual,
            gameSessionId: generateUUID(),
            userId, id_room,
            gameStartTime: null, gameEndTime: null, totalGameDuration: 0,
            score: 0,
            correct_hits: 0,
            collision_errors: 0,
            omission_errors: 0,
            commission_errors: 0,
            missed_shots: 0,
            reactionTimes: [],
            questionsAnswered: [],
        };
        setScore(0);
        setGameState('INITIALIZING');
        setIsPixiAppReady(false);
        const initPixi = async () => {
            if (!pixiContainerRef.current) return;
            cleanupPixiAndGame(true);
            const app = new PIXI.Application();
            await app.init({
                backgroundColor: 0x0c0c1e,
                resizeTo: pixiContainerRef.current,
                autoDensity: true,
                resolution: window.devicePixelRatio || 1,
            });
            if (pixiContainerRef.current && !pixiContainerRef.current.contains(app.canvas)) {
                pixiContainerRef.current.innerHTML = '';
                pixiContainerRef.current.appendChild(app.canvas);
            }
            appRef.current = app;
            setIsPixiAppReady(true);
            setGameState('LOADING_ASSETS');
        };
        if (pixiContainerRef.current) {
            const observer = new ResizeObserver(entries => {
                if (entries[0].contentRect.width > 0 && entries[0].contentRect.height > 0) {
                    observer.disconnect();
                    initPixi();
                }
            });
            observer.observe(pixiContainerRef.current);
            observerRef.current = observer;
        }
        return () => {
            if (observerRef.current) observerRef.current.disconnect();
            sendGameDataToBackend();
            cleanupPixiAndGame(true);
        };
    }, [id_test_actual, userId, id_room]);

    useEffect(() => {
        if (!isPixiAppReady || !appRef.current || appRef.current.destroyed) return;
        const app = appRef.current;
        const stage = app.stage;
        const ticker = app.ticker;

        sfx.current = {
            shoot: new Audio(shootSfx),
            explosion: new Audio(explosionSfx),
            error: new Audio(errorSfx),
            playerHit: new Audio(playerHitSfx),
        };
        // Precargamos los sonidos para reducir el lag la primera vez que se usan
        Object.values(sfx.current).forEach(sound => sound.load());

        
        stage.removeChildren();
        ticker.stop();
        ticker.remove(gameLoop);
        
        const gameLoopWithBackground = (ticker) => {
            if (backgroundSpriteRef.current) {
                backgroundSpriteRef.current.tilePosition.y += gameConstants.current.gameSpeedY * 0.5;
            }
            gameLoop(ticker);
        };

        if (gameState !== 'PLAYING' && backgroundMusicRef.current && !backgroundMusicRef.current.paused) {
            backgroundMusicRef.current.pause();
        }

        if (gameState === 'LOADING_ASSETS') {
            const textStyle = { fill: 0xffffff, fontSize: 24, align: 'center', fontFamily: 'Arial' };
            const loadingText = new PIXI.Text('Cargando recursos...', textStyle);
            loadingText.anchor.set(0.5);
            loadingText.x = app.screen.width / 2;
            loadingText.y = app.screen.height / 2;
            stage.addChild(loadingText);
            (async () => {
                try {
                    await PIXI.Assets.load(assets);
                    if (appRef.current && !appRef.current.destroyed) setGameState('READY_TO_START');
                } catch (error) {
                    console.error("Error al cargar assets:", error);
                    if(loadingText) loadingText.text = "Error de carga.";
                }
            })();
        } else if (gameState === 'READY_TO_START') {
            const bgTexture = PIXI.Assets.get('spaceBackground');
            backgroundSpriteRef.current = new PIXI.TilingSprite({ texture: bgTexture, width: app.screen.width, height: app.screen.height });
            stage.addChild(backgroundSpriteRef.current);
            
            const textStyle = { fill: 0xffffff, fontSize: 32, align: 'center', fontFamily: 'Arial', stroke: { color: 0x000000, width: 4 } };
            const startMessage = new PIXI.Text('Presiona cualquier tecla para empezar', textStyle);
            startMessage.anchor.set(0.5);
            startMessage.x = app.screen.width / 2;
            startMessage.y = app.screen.height / 2;
            stage.addChild(startMessage);

            const handleKeyPress = () => {
                if (gameState === 'READY_TO_START') setGameState('PLAYING');
            };
            window.addEventListener('keydown', handleKeyPress, { once: true });
            return () => window.removeEventListener('keydown', handleKeyPress);

        } else if (gameState === 'PLAYING') {
            const settings = gameDifficultySettings.current;
            gameConstants.current.gameSpeedY = settings.INITIAL_GAMESPEED_Y;
            gameConstants.current.obstacleMoveSpeed = settings.INITIAL_OBSTACLE_SPEED;
            gameConstants.current.obstacleSpawnInterval = settings.INITIAL_SPAWN_INTERVAL;
            gameTime.current = 0;
            timeSinceLastSpeedIncrease.current = 0;

            metrics.current.gameStartTime = Date.now();
            stage.addChild(backgroundSpriteRef.current);
            createLaneMarkers(app);

            const screenWidth = app.screen.width;
            const screenHeight = app.screen.height;
            const gc = gameConstants.current;

            const playerTexture = PIXI.Assets.get('playerShip');
            const playerSprite = new PIXI.Sprite(playerTexture);
            playerSprite.anchor.set(0.5, 0.8);
            playerSprite.width = gc.playerWidth;
            playerSprite.height = gc.playerHeight;
            playerSprite.isInvincible = false;
            playerSprite.invincibilityTimer = 0;

            playerGroundY.current = screenHeight - playerSprite.height / 2 - 20;
            lanePositions.current = [
                getAbsoluteX(-0.75, playerGroundY.current, screenWidth, screenHeight),
                getAbsoluteX(0.0, playerGroundY.current, screenWidth, screenHeight),
                getAbsoluteX(0.75, playerGroundY.current, screenWidth, screenHeight),
            ];
            playerSprite.x = lanePositions.current[currentLaneIndex.current];
            playerSprite.y = playerGroundY.current;
            stage.addChild(playerSprite);
            player.current = playerSprite;
            targetPlayerX.current = player.current.x;

            window.addEventListener('keydown', handleGameKeyDown);
            window.addEventListener('keyup', handleGameKeyUp);
            if (!backgroundMusicRef.current && MUSIC_URL) {
                backgroundMusicRef.current = new Audio(MUSIC_URL);
                backgroundMusicRef.current.loop = true;
                backgroundMusicRef.current.volume = 0.5;
            }
            if (backgroundMusicRef.current) {
                backgroundMusicRef.current.play().catch(e => console.warn("Error al reproducir música:", e));
            }
            
            ticker.add(gameLoopWithBackground);
            ticker.start();
        }
        if (gameState === 'SHOWING_QUESTION') {
            ticker.stop();
        }

    }, [gameState, isPixiAppReady, id_test_actual, userId, id_room]);

    const handleQuestionAnswer = (answer) => {
        if (!currentQuestion) return;
        metrics.current.questionsAnswered.push({
            questionId: currentQuestion.id,
            questionText: currentQuestion.text,
            answer: answer,
            timestamp: Date.now(),
        });
        setCurrentQuestion(null);
        setGameState('PLAYING');
    };

    const handleDebugEndGame = () => {
        if (gameEndedRef.current) return;
        if (appRef.current?.ticker) appRef.current.ticker.stop();
        if (backgroundMusicRef.current) backgroundMusicRef.current.pause();
        sendGameDataToBackend();
        if (onGameEnd) onGameEnd();
    };

    return (
        <div ref={pixiContainerRef} className="game-container" style={{ width: '100%', height: '100%', position: 'relative', backgroundColor: '#101010' }}>
            {gameState === 'PLAYING' && (
                <div style={{ position: 'absolute', top: 10, left: 10, color: 'white', fontSize: '16px', zIndex: 10, fontFamily: 'Arial, sans-serif', backgroundColor: 'rgba(0,0,0,0.5)', padding: '5px', borderRadius: '5px' }}>
                    <div>Puntuación: {score}</div>
                    <div>Aciertos: {metrics.current.correct_hits || 0}</div>
                    <div>Errores Omisión: {metrics.current.omission_errors || 0}</div>
                    <div>Errores Comisión: {metrics.current.commission_errors || 0}</div>
                    <div>Colisiones: {metrics.current.collision_errors || 0}</div>
                    <div>Disp. Fallidos: {metrics.current.missed_shots || 0}</div>
                    <button onClick={handleDebugEndGame} >Terminar Juego (DEBUG)</button>
                </div>
            )}
            {gameState === 'SHOWING_QUESTION' && currentQuestion && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.75)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 20 }}>
                    <div style={{ backgroundColor: '#FFFFFF', padding: '30px', borderRadius: '15px', textAlign: 'center', maxWidth: '90%', width: '500px', boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)' }}>
                        <img src={currentQuestion.imageUrl} alt="Ilustración de la pregunta" style={{ maxWidth: '100%', height: 'auto', maxHeight: '200px', marginBottom: '20px', borderRadius: '10px' }} />
                        <h2 style={{ color: '#333', marginBottom: '25px', fontSize: '1.4em' }}>{currentQuestion.text}</h2>
                        <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                            <button onClick={() => handleQuestionAnswer('Sí')} style={{ padding: '15px 40px', fontSize: '1.2em', cursor: 'pointer', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '8px' }}>Sí</button>
                            <button onClick={() => handleQuestionAnswer('No')} style={{ padding: '15px 40px', fontSize: '1.2em', cursor: 'pointer', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '8px' }}>No</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default GameTest;