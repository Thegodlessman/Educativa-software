import React, { useEffect, useRef, useState } from 'react';
import useSocket from '../../hooks/useSocket';
import * as _PIXI from 'pixi.js';
import importedMusicURL from './music/background_music_1.mp3';

const PIXI = _PIXI;

const generateUUID = () => crypto.randomUUID ? crypto.randomUUID() : ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c => (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16));

const MUSIC_URL = importedMusicURL;

const questions = [
    {
        id: 1,
        text: "Siempre encuentro mis clases en la escuela muy aburridas.",
        // Imagen de un niño aburrido en clases
        imageUrl: 'https://picsum.photos/seed/question1/400/300'
    },
    {
        id: 2,
        text: "Tengo mal genio.",
        // Imagen de un niño malhumorado
        imageUrl: 'https://picsum.photos/seed/question2/400/300'
    },
    {
        id: 3,
        text: "Leer se me hace aburrido si no hay imágenes.",
        // Imagen de un niño que no quiere leer
        imageUrl: 'https://picsum.photos/seed/question3/400/300'
    },
    {
        id: 4,
        text: "Casi siempre estoy en movimiento.",
        // Imagen de un niño corriendo y saltando
        imageUrl: 'https://picsum.photos/seed/question4/400/300'
    },
    {
        id: 5,
        text: "A veces olvido las cosas que estaba haciendo.",
        // Imagen de un niño dejando algo a medias y haciendo otra cosa
        imageUrl: 'https://picsum.photos/seed/question5/400/300'
    },
    {
        id: 6,
        text: "No presto atención cuando me hablan.",
        // Imagen de un niño distraído mientras le hablan
        imageUrl: 'https://picsum.photos/seed/question6/400/300'
    }
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

    const gameConstants = useRef({
        gameSpeedY: 5,
        laneChangeSpeed: 0.15,
        roadWidthAtBottom: 0.8,
        roadWidthAtTop: 0.05,
        horizonY: 0.1,
        lineThickness: 4,
        lineSegmentHeight: 30,
        lineSegmentSpacing: 70,
        numSegmentsPerLane: 10,
        outerLineColor: 0xFFFFFF,
        laneLineColors: [0x0000FF, 0xFF0000, 0x00FF00],
        bulletSpeedY: 20,
        bulletWidth: 8,
        bulletHeight: 15,
        bulletColor: 0xFFFF00,
        shootCooldown: 300,
        bulletAngleStrength: 9,
        obstacleSpawnInterval: 1200,
        obstacleMoveSpeed: 5,
        obstacleWidth: 50,
        obstacleHeight: 30,
        obstacleColor: 0xFF0000,
        minObstacleScale: 0.05,
        initialObstacleScale: 0,
        reactionZoneStartYRatio: 0.75,
        questionInterval: 15000, // 120000 2 minutos en milisegundos
    });

    const currentLaneIndex = useRef(1);
    const targetPlayerX = useRef(0);
    const lanePositions = useRef([]);
    const roadSegments = useRef([]);

    const bullets = useRef([]);
    const bulletPool = useRef([]);
    const canShoot = useRef(true);
    const shootCooldownTimer = useRef(0);

    const playerGroundY = useRef(0);

    const obstacles = useRef([]);
    const obstacleSpawnTimer = useRef(0);
    const obstaclePool = useRef([]);

    const metrics = useRef({
        id_test_para_actualizar: id_test_actual || null,
        gameSessionId: generateUUID(),
        userId: userId || 'anonymous_user',
        id_room: id_room || 'anonymous_room',
        gameStartTime: null,
        gameEndTime: null,
        totalGameDuration: 0,
        score: 0,
        error_count: 0,
        correct_decisions: 0,
        reactionTimes: [],
        missedShots: 0,
        questionsAnswered: [],
    });
    const gameEndedRef = useRef(false);
    const observerRef = useRef(null);

    const animateLoadingSpinner = (ticker) => {
        if (loadingSpinnerRef.current && !loadingSpinnerRef.current.destroyed) {
            loadingSpinnerRef.current.rotation += 0.05 * ticker.deltaTime;
        }
    };

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

    const updatePerspectiveSegment = (graphic, currentSegmentY, screenWidth, screenHeight, color, laneOffsetFactor) => {
        const gc = gameConstants.current;
        graphic.clear();
        const effectiveRoadHeight = screenHeight * (1 - gc.horizonY);

        if (graphic.isObstacle) {
            const normalizedObstacleY = Math.max(0, Math.min(1, (currentSegmentY - (screenHeight * gc.horizonY)) / effectiveRoadHeight));
            const scaleFactor = gc.initialObstacleScale + (normalizedObstacleY * (1 - gc.initialObstacleScale));
            let obstacleWidth = gc.obstacleWidth * scaleFactor;
            let obstacleHeight = gc.obstacleHeight * scaleFactor;

            obstacleWidth = Math.max(0.1, obstacleWidth);
            obstacleHeight = Math.max(0.1, obstacleHeight);

            graphic.visible = true;
            const obstacleCenterX = getAbsoluteX(laneOffsetFactor, currentSegmentY, screenWidth, screenHeight);
            graphic.rect(0, 0, obstacleWidth, obstacleHeight).fill({ color: color });
            graphic.x = obstacleCenterX - obstacleWidth / 2;
            graphic.y = currentSegmentY;
        } else {
            const segmentTopY = currentSegmentY;
            const segmentBottomY = currentSegmentY + gc.lineSegmentHeight;

            const normalizedTopY = Math.max(0, Math.min(1, (segmentTopY - (screenHeight * gc.horizonY)) / effectiveRoadHeight));
            const normalizedBottomY = Math.max(0, Math.min(1, (segmentBottomY - (screenHeight * gc.horizonY)) / effectiveRoadHeight));

            const roadWidthAtSegmentTop = screenWidth * (gc.roadWidthAtTop * (1 - normalizedTopY) + gc.roadWidthAtBottom * normalizedTopY);
            const roadWidthAtSegmentBottom = screenWidth * (gc.roadWidthAtTop * (1 - normalizedBottomY) + gc.roadWidthAtBottom * normalizedBottomY);

            const horizontalOffsetTop = (laneOffsetFactor * roadWidthAtSegmentTop / 2);
            const horizontalOffsetBottom = (laneOffsetFactor * roadWidthAtSegmentBottom / 2);
            const topLeftX = screenWidth / 2 + horizontalOffsetTop - gc.lineThickness / 2;
            const topRightX = screenWidth / 2 + horizontalOffsetTop + gc.lineThickness / 2;
            const bottomLeftX = screenWidth / 2 + horizontalOffsetBottom - gc.lineThickness / 2;
            const bottomRightX = screenWidth / 2 + horizontalOffsetBottom + gc.lineThickness / 2;
            graphic.poly([topLeftX, segmentTopY, topRightX, segmentTopY, bottomRightX, segmentBottomY, bottomLeftX, segmentBottomY]).fill({ color: color });
        }
    };

    const getBulletFromPool = () => {
        let bulletGraphic = bulletPool.current.pop(); if (!bulletGraphic) bulletGraphic = new PIXI.Graphics();
        if (appRef.current && appRef.current.stage && !appRef.current.destroyed) {
            if (!bulletGraphic.parent) appRef.current.stage.addChild(bulletGraphic);
            else if (bulletGraphic.parent !== appRef.current.stage) {
                bulletGraphic.parent.removeChild(bulletGraphic);
                appRef.current.stage.addChild(bulletGraphic);
            }
        }
        bulletGraphic.visible = true; return bulletGraphic;
    };

    const createBullet = () => {
        if (!player.current || !appRef.current?.stage || appRef.current.destroyed || gameState !== 'PLAYING') return;
        const gc = gameConstants.current;
        let isThreateningObstacleInLane = false;
        const playerLaneFactor = (currentLaneIndex.current === 0 ? -0.75 : (currentLaneIndex.current === 1 ? 0.0 : 0.75));
        for (const obs of obstacles.current) {
            if (obs.isThreatening && !obs.isHit && !obs.isCollision) {
                const obstacleLaneFactor = (obs.lane === 0 ? -0.75 : (obs.lane === 1 ? 0.0 : 0.75));
                if (obstacleLaneFactor === playerLaneFactor) {
                    if (obs.graphic.y > player.current.y - obs.graphic.height * 3 && obs.graphic.y < player.current.y + player.current.height) {
                        isThreateningObstacleInLane = true;
                        break;
                    }
                }
            }
        }
        if (!isThreateningObstacleInLane) {
            metrics.current.missedShots++;
        }
        const bulletGraphic = getBulletFromPool();
        bulletGraphic.clear(); bulletGraphic.rect(0, 0, gc.bulletWidth, gc.bulletHeight).fill({ color: gc.bulletColor });
        bulletGraphic.x = player.current.x + (player.current.width / 2) - (gc.bulletWidth / 2); bulletGraphic.y = player.current.y;
        let speedX = 0;
        if (currentLaneIndex.current === 0) speedX = gc.bulletAngleStrength;
        else if (currentLaneIndex.current === 2) speedX = -gc.bulletAngleStrength;
        const bulletObject = { graphic: bulletGraphic, speedX: speedX };
        bullets.current.push(bulletObject);
    };

    const getObstacleFromPool = () => {
        let graphic = obstaclePool.current.pop(); if (!graphic) graphic = new PIXI.Graphics();
        if (appRef.current && appRef.current.stage && !appRef.current.destroyed) {
            if (!graphic.parent) appRef.current.stage.addChild(graphic);
            else if (graphic.parent !== appRef.current.stage) {
                graphic.parent.removeChild(graphic);
                appRef.current.stage.addChild(graphic);
            }
        }
        graphic.isObstacle = true; graphic.visible = true; return graphic;
    };

    const createObstacle = (appInstance, type, laneIndex) => {
        if (!appInstance || !appInstance.screen || !appInstance.stage || appInstance.destroyed || gameState !== 'PLAYING') return;

        const obstacleGraphic = getObstacleFromPool();
        const gc = gameConstants.current;
        obstacleGraphic.y = appInstance.screen.height * gc.horizonY;
        const obstacleId = `obs-${generateUUID()}`;
        const obstacleObject = {
            id: obstacleId,
            graphic: obstacleGraphic, type, lane: laneIndex,
            isCollision: false, isHit: false,
            spawnTime: Date.now(),
            enteredReactionZoneTime: null,
            isThreatening: false,
        };
        obstacles.current.push(obstacleObject);
    };

    const checkCollision = (obj1Graphics, obj2Graphics) => {
        if (!obj1Graphics?.visible || !obj2Graphics?.visible) return false;
        if (obj1Graphics.destroyed || obj2Graphics.destroyed) return false;
        const bounds1 = obj1Graphics.getBounds(); const bounds2 = obj2Graphics.getBounds();
        return bounds1.x < bounds2.x + bounds2.width && bounds1.x + bounds1.width > bounds2.x &&
            bounds1.y < bounds2.y + bounds2.height && bounds1.y + bounds1.height > bounds2.y;
    };

    const createRoadLines = (appInstance) => {
        if (!appInstance || !appInstance.stage || appInstance.destroyed) return;
        const roadLinesContainer = new PIXI.Container(); appInstance.stage.addChild(roadLinesContainer);
        const screenHeight = appInstance.screen.height;
        for (let i = 0; i < gameConstants.current.numSegmentsPerLane + 2; i++) {
            const worldY = i * (gameConstants.current.lineSegmentHeight + gameConstants.current.lineSegmentSpacing) + (screenHeight * gameConstants.current.horizonY);
            const segmentGroup = { worldY, lines: [] }; const gc = gameConstants.current;
            const lineData = [
                { color: gc.outerLineColor, laneOffsetFactor: -1.0 }, { color: gc.laneLineColors[0], laneOffsetFactor: -0.5 },
                { color: gc.laneLineColors[1], laneOffsetFactor: 0.0 }, { color: gc.laneLineColors[2], laneOffsetFactor: 0.5 },
                { color: gc.outerLineColor, laneOffsetFactor: 1.0 },
            ];
            lineData.forEach(data => { const lineGraphic = new PIXI.Graphics(); lineGraphic.isObstacle = false; roadLinesContainer.addChild(lineGraphic); segmentGroup.lines.push({ graphic: lineGraphic, ...data }); });
            roadSegments.current.push(segmentGroup);
        }
        roadSegments.current.forEach(sg => sg.lines.forEach(ld => updatePerspectiveSegment(ld.graphic, sg.worldY, appInstance.screen.width, appInstance.screen.height, ld.color, ld.laneOffsetFactor)));
    };

    const sendGameDataToBackend = () => {
        if (gameEndedRef.current) return;
        gameEndedRef.current = true;

        metrics.current.gameEndTime = Date.now();
        if (metrics.current.gameStartTime) {
            metrics.current.totalGameDuration = metrics.current.gameEndTime - metrics.current.gameStartTime;
        }
        metrics.current.score = score;

        if (socket && isConnected) {
            socket.emit('submitGameTestResults', metrics.current);
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
        keys.current[event.code] = true;
        if (['Space', 'ArrowUp', 'ArrowLeft', 'KeyA', 'ArrowRight', 'KeyD'].includes(event.code)) {
            event.preventDefault();
        }
    };
    const handleGameKeyUp = (event) => { keys.current[event.code] = false; };

    const gameLoop = (ticker) => {
        if (gameEndedRef.current || !appRef.current?.stage || !player.current || !appRef.current.ticker || appRef.current.destroyed || gameState !== 'PLAYING') return;

        const delta = ticker.deltaMS / (1000 / 60);
        const actualDelta = typeof delta === 'number' && !isNaN(delta) ? Math.max(0.1, Math.min(delta, 3)) : 1;

        const screenWidth = appRef.current.screen.width; const screenHeight = appRef.current.screen.height;
        const gc = gameConstants.current; const playerHalfWidth = player.current.width / 2;
        const referenceYForLaneCalc = playerGroundY.current;

        lanePositions.current = [getAbsoluteX(-0.75, referenceYForLaneCalc, screenWidth, screenHeight), getAbsoluteX(0.0, referenceYForLaneCalc, screenWidth, screenHeight), getAbsoluteX(0.75, referenceYForLaneCalc, screenWidth, screenHeight)];
        targetPlayerX.current = lanePositions.current[currentLaneIndex.current] - playerHalfWidth;
        if (isNaN(player.current.x)) player.current.x = targetPlayerX.current;
        player.current.x += (targetPlayerX.current - player.current.x) * gc.laneChangeSpeed * actualDelta;
        const roadBoundLeft = getAbsoluteX(-1.0, player.current.y, screenWidth, screenHeight); const roadBoundRight = getAbsoluteX(1.0, player.current.y, screenWidth, screenHeight);
        player.current.x = Math.max(roadBoundLeft, Math.min(roadBoundRight - player.current.width, player.current.x));

        if (!canShoot.current) {
            shootCooldownTimer.current += appRef.current.ticker.deltaMS;
            if (shootCooldownTimer.current >= gc.shootCooldown) canShoot.current = true;
        }

        roadSegments.current.forEach(sg => {
            sg.worldY += gc.gameSpeedY * actualDelta;
            if (sg.worldY > screenHeight + gc.lineSegmentHeight + gc.lineSegmentSpacing) sg.worldY -= (gc.lineSegmentHeight + gc.lineSegmentSpacing) * (gc.numSegmentsPerLane + 2);
            sg.lines.forEach(ld => updatePerspectiveSegment(ld.graphic, sg.worldY, screenWidth, screenHeight, ld.color, ld.laneOffsetFactor));
        });

        obstacleSpawnTimer.current += appRef.current.ticker.deltaMS;
        if (obstacleSpawnTimer.current >= gc.obstacleSpawnInterval) {
            createObstacle(appRef.current, 'default_obstacle', Math.floor(Math.random() * 3));
            obstacleSpawnTimer.current = 0;
        }

        questionTimerRef.current += ticker.deltaMS;
        if (questionTimerRef.current >= gc.questionInterval) {
            questionTimerRef.current = 0;
            const questionToShow = questions[nextQuestionIndexRef.current];
            setCurrentQuestion(questionToShow);
            setGameState('SHOWING_QUESTION');
            
            nextQuestionIndexRef.current = (nextQuestionIndexRef.current + 1) % questions.length;
        }

        const activeBullets = [];
        bullets.current.forEach(bullet => {
            if (!bullet.graphic) return; bullet.graphic.x += bullet.speedX * actualDelta; bullet.graphic.y -= gc.bulletSpeedY * actualDelta;
            if (bullet.graphic.y + gc.bulletHeight < 0 || bullet.graphic.x < -gc.bulletWidth || bullet.graphic.x > screenWidth) {
                if (bullet.graphic.parent) bullet.graphic.parent.removeChild(bullet.graphic); bulletPool.current.push(bullet.graphic);
            } else activeBullets.push(bullet);
        });
        bullets.current = activeBullets;

        const bulletsToRemove = new Set();
        bullets.current.forEach(bullet => {
            if (!bullet.graphic?.visible) return;
            obstacles.current.forEach(obstacle => {
                if (!obstacle.graphic?.visible || obstacle.isHit || obstacle.isCollision) return;
                if (checkCollision(bullet.graphic, obstacle.graphic)) {
                    metrics.current.correct_decisions++;
                    setScore(prev => prev + 10);
                    obstacle.isHit = true;
                    if (obstacle.enteredReactionZoneTime && !obstacle.isCollision) {
                        const reactionTime = Date.now() - obstacle.enteredReactionZoneTime;
                        metrics.current.reactionTimes.push({ obstacleId: obstacle.id, time: reactionTime, type: 'destroy' });
                    }
                    bulletsToRemove.add(bullet);
                }
            });
        });
        bullets.current = bullets.current.filter(b => {
            if (bulletsToRemove.has(b)) { if (b.graphic.parent) b.graphic.parent.removeChild(b.graphic); bulletPool.current.push(b.graphic); return false; }
            return true;
        });

        const reactionZoneStartY = screenHeight * gc.reactionZoneStartYRatio;
        const activeObstacles = [];
        obstacles.current.forEach(obstacle => {
            if (!obstacle.graphic) return;
            if (obstacle.isHit) { if (obstacle.graphic.parent) obstacle.graphic.parent.removeChild(obstacle.graphic); obstaclePool.current.push(obstacle.graphic); return; }

            obstacle.graphic.y += gc.obstacleMoveSpeed * actualDelta;
            updatePerspectiveSegment(obstacle.graphic, obstacle.graphic.y, screenWidth, screenHeight, gc.obstacleColor, (obstacle.lane === 0 ? -0.75 : (obstacle.lane === 1 ? 0.0 : 0.75)));

            if (!obstacle.isThreatening && obstacle.graphic.y + obstacle.graphic.height > reactionZoneStartY) {
                obstacle.isThreatening = true;
                obstacle.enteredReactionZoneTime = Date.now();
            }

            if (!obstacle.isCollision && checkCollision(player.current, obstacle.graphic)) {
                metrics.current.error_count++;
                obstacle.isCollision = true;
                if (obstacle.enteredReactionZoneTime) {
                    const reactionTime = Date.now() - obstacle.enteredReactionZoneTime;
                    metrics.current.reactionTimes.push({ obstacleId: obstacle.id, time: reactionTime, type: 'collision' });
                }
            }
            if (obstacle.graphic.y > screenHeight + obstacle.graphic.height) {
                if (obstacle.graphic.parent) obstacle.graphic.parent.removeChild(obstacle.graphic);
                obstaclePool.current.push(obstacle.graphic);
            } else activeObstacles.push(obstacle);
        });
        obstacles.current = activeObstacles;
    };

    const cleanupPixiAndGame = (fullDestroy = true) => {
        window.removeEventListener('keydown', handleGameKeyDown);
        window.removeEventListener('keyup', handleGameKeyUp);

        if (loadingProcessTimerRef.current) {
            clearTimeout(loadingProcessTimerRef.current);
            loadingProcessTimerRef.current = null;
        }

        if (backgroundMusicRef.current) {
            backgroundMusicRef.current.pause();
            backgroundMusicRef.current.removeAttribute('src');
            backgroundMusicRef.current.load();
            backgroundMusicRef.current = null;
        }

        if (appRef.current) {
            appRef.current.ticker.remove(animateLoadingSpinner);
            if (appRef.current.ticker) {
                appRef.current.ticker.remove(gameLoop);
                appRef.current.ticker.stop();
            }

            if (fullDestroy && !appRef.current.destroyed) {
                const destroyOptions = { children: true, texture: true, baseTexture: true };
                [bullets, bulletPool, obstacles, obstaclePool, roadSegments].forEach(arrRef => {
                    arrRef.current.forEach(item => {
                        const graphic = item.graphic || (item.lines ? null : item);
                        if (graphic && typeof graphic.destroy === 'function' && !graphic.destroyed) {
                            graphic.destroy(destroyOptions);
                        } else if (item.lines) {
                            item.lines.forEach(line => {
                                if (line.graphic && typeof line.graphic.destroy === 'function' && !line.graphic.destroyed) {
                                    line.graphic.destroy(destroyOptions);
                                }
                            });
                        }
                    });
                    arrRef.current = [];
                });

                if (player.current && typeof player.current.destroy === 'function' && !player.current.destroyed) {
                    player.current.destroy(destroyOptions);
                }
                player.current = null;

                if (loadingTextRef.current && typeof loadingTextRef.current.destroy === 'function' && !loadingTextRef.current.destroyed) {
                    loadingTextRef.current.destroy();
                }
                loadingTextRef.current = null;

                if (startMessageRef.current && typeof startMessageRef.current.destroy === 'function' && !startMessageRef.current.destroyed) {
                    startMessageRef.current.destroy();
                }
                startMessageRef.current = null;

                if (backgroundSpriteRef.current && typeof backgroundSpriteRef.current.destroy === 'function' && !backgroundSpriteRef.current.destroyed) {
                    backgroundSpriteRef.current.destroy(destroyOptions);
                }
                backgroundSpriteRef.current = null;

                if (loadingSpinnerRef.current && typeof loadingSpinnerRef.current.destroy === 'function' && !loadingSpinnerRef.current.destroyed) {
                    loadingSpinnerRef.current.destroy(destroyOptions);
                }
                loadingSpinnerRef.current = null;

                if (appRef.current.stage) {
                    appRef.current.stage.removeChildren();
                }
                appRef.current.destroy(true, destroyOptions);
                appRef.current = null;

            } else if (!fullDestroy && appRef.current.stage) {
                appRef.current.stage.removeChildren();
                [bullets, bulletPool, obstacles, obstaclePool, roadSegments].forEach(arrRef => arrRef.current = []);
                if (player.current) player.current = null;
            }
        }
        setIsPixiAppReady(false);
        keys.current = {};
        currentLaneIndex.current = 1;
        canShoot.current = true;
        shootCooldownTimer.current = 0;
        obstacleSpawnTimer.current = 0;
        questionTimerRef.current = 0;
        nextQuestionIndexRef.current = 0;
    };


    useEffect(() => {
        gameEndedRef.current = false;
        metrics.current = {
            id_test_para_actualizar: id_test_actual || null,
            gameSessionId: generateUUID(),
            userId: userId || 'anonymous_user',
            id_room: id_room || 'anonymous_room',
            gameStartTime: null, gameEndTime: null, totalGameDuration: 0,
            score: 0, error_count: 0, correct_decisions: 0,
            reactionTimes: [], missedShots: 0,
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
                backgroundColor: 0x101010,
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
            if (pixiContainerRef.current.clientWidth > 0 && pixiContainerRef.current.clientHeight > 0) {
                initPixi();
            } else {
                if (observerRef.current) observerRef.current.disconnect();
                observerRef.current = new ResizeObserver(entries => {
                    for (let entry of entries) {
                        if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
                            if (observerRef.current) observerRef.current.disconnect();
                            initPixi();
                            break;
                        }
                    }
                });
                observerRef.current.observe(pixiContainerRef.current);
            }
        }

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
                observerRef.current = null;
            }
            sendGameDataToBackend();
            cleanupPixiAndGame(true);
            setGameState('INITIALIZING');
        };
    }, [id_test_actual, userId, id_room]);


    useEffect(() => {
        if (!isPixiAppReady || !appRef.current || appRef.current.destroyed) {
            if (loadingProcessTimerRef.current) clearTimeout(loadingProcessTimerRef.current);
            if (backgroundMusicRef.current) backgroundMusicRef.current.pause();
            return;
        }

        const app = appRef.current;
        const stage = app.stage;
        const ticker = app.ticker;

        ticker.remove(animateLoadingSpinner);
        if (loadingTextRef.current) { if (loadingTextRef.current.parent) stage.removeChild(loadingTextRef.current); if (!loadingTextRef.current.destroyed) loadingTextRef.current.destroy(); loadingTextRef.current = null; }
        if (startMessageRef.current) { if (startMessageRef.current.parent) stage.removeChild(startMessageRef.current); if (!startMessageRef.current.destroyed) startMessageRef.current.destroy(); startMessageRef.current = null; }
        if (backgroundSpriteRef.current) { if (backgroundSpriteRef.current.parent) stage.removeChild(backgroundSpriteRef.current); if (!backgroundSpriteRef.current.destroyed) backgroundSpriteRef.current.destroy({ texture: true, baseTexture: true }); backgroundSpriteRef.current = null; }
        if (loadingSpinnerRef.current) { if (loadingSpinnerRef.current.parent) stage.removeChild(loadingSpinnerRef.current); if (!loadingSpinnerRef.current.destroyed) loadingSpinnerRef.current.destroy(); loadingSpinnerRef.current = null; }
        if (loadingProcessTimerRef.current) { clearTimeout(loadingProcessTimerRef.current); loadingProcessTimerRef.current = null; }

        if (gameState !== 'PLAYING' && backgroundMusicRef.current && !backgroundMusicRef.current.paused) {
            backgroundMusicRef.current.pause();
        }
        
        if (gameState === 'SHOWING_QUESTION') {
            if(ticker.started) ticker.stop();
        } else {
            if(!ticker.started) ticker.start();
        }


        if (gameState === 'LOADING_ASSETS') {
            const BACKGROUND_IMAGE_URL = 'https://picsum.photos/seed/gamebg/1280/720';

            const textStyleOptions = { fill: 0xffffff, fontSize: 32, align: 'center', fontFamily: 'Arial', stroke: { color: 0x000000, width: 5, join: 'round' }, dropShadow: { color: '#000000', blur: 7, distance: 5, angle: Math.PI / 4, alpha: 0.5 } };
            loadingTextRef.current = new PIXI.Text('Cargando...', textStyleOptions);
            loadingTextRef.current.anchor.set(0.5);
            loadingTextRef.current.x = app.screen.width / 2;
            loadingTextRef.current.y = app.screen.height / 2 + 70;

            loadingSpinnerRef.current = new PIXI.Graphics()
                .roundRect(-30, -30, 60, 60, 12)
                .fill(0xE0E0E0)
                .stroke({ width: 4, color: 0xFFFFFF });
            loadingSpinnerRef.current.pivot.set(0, 0);
            loadingSpinnerRef.current.x = app.screen.width / 2;
            loadingSpinnerRef.current.y = app.screen.height / 2 - 20;

            stage.addChild(loadingSpinnerRef.current);
            stage.addChild(loadingTextRef.current);
            ticker.add(animateLoadingSpinner);

            (async () => {
                try {
                    PIXI.Assets.add({ alias: 'loadingBgAsset', src: BACKGROUND_IMAGE_URL });
                    PIXI.Assets.add({ alias: 'gameMusicAsset', src: MUSIC_URL });

                    const allAssets = await PIXI.Assets.load(['loadingBgAsset', 'gameMusicAsset']);

                    if (appRef.current && !appRef.current.destroyed && gameState === 'LOADING_ASSETS') {
                        if (allAssets.loadingBgAsset) {
                            backgroundSpriteRef.current = new PIXI.Sprite(allAssets.loadingBgAsset);
                            backgroundSpriteRef.current.width = app.screen.width;
                            backgroundSpriteRef.current.height = app.screen.height;
                            backgroundSpriteRef.current.anchor.set(0.5);
                            backgroundSpriteRef.current.x = app.screen.width / 2;
                            backgroundSpriteRef.current.y = app.screen.height / 2;
                            stage.addChildAt(backgroundSpriteRef.current, 0);
                        }
                        if (loadingSpinnerRef.current && loadingSpinnerRef.current.parent) stage.addChild(loadingSpinnerRef.current);
                        if (loadingTextRef.current && loadingTextRef.current.parent) stage.addChild(loadingTextRef.current);

                        if (MUSIC_URL && !backgroundMusicRef.current) {
                            backgroundMusicRef.current = new Audio(MUSIC_URL);
                            backgroundMusicRef.current.loop = true;
                            backgroundMusicRef.current.volume = 0.5;
                        }

                        loadingProcessTimerRef.current = setTimeout(() => {
                            if (gameState === 'LOADING_ASSETS') setGameState('READY_TO_START');
                        }, 1500);
                    }
                } catch (error) {
                    console.error("Error al cargar assets durante LOADING_ASSETS:", error);
                    if (appRef.current && !appRef.current.destroyed && gameState === 'LOADING_ASSETS') {
                        if (loadingTextRef.current) loadingTextRef.current.text = "Error de carga.";
                        loadingProcessTimerRef.current = setTimeout(() => {
                            if (gameState === 'LOADING_ASSETS') setGameState('READY_TO_START');
                        }, 2000);
                    }
                }
            })();

        } else if (gameState === 'READY_TO_START') {
            const textStyleOptions = { fill: 0xffffff, fontSize: 32, align: 'center', fontFamily: 'Arial', stroke: { color: 0x000000, width: 5, join: 'round' }, dropShadow: { color: '#000000', blur: 7, distance: 5, angle: Math.PI / 4, alpha: 0.5 } };
            startMessageRef.current = new PIXI.Text('Presiona cualquier tecla para empezar', textStyleOptions);
            startMessageRef.current.anchor.set(0.5);
            startMessageRef.current.x = app.screen.width / 2;
            startMessageRef.current.y = app.screen.height / 2;
            stage.addChild(startMessageRef.current);

            const handleKeyPress = (event) => {
                if (gameState === 'READY_TO_START') {
                    setGameState('PLAYING');
                }
            };
            window.addEventListener('keydown', handleKeyPress, { once: true });

            return () => {
                window.removeEventListener('keydown', handleKeyPress);
                if (startMessageRef.current && startMessageRef.current.parent) {
                    stage.removeChild(startMessageRef.current);
                    if (!startMessageRef.current.destroyed) startMessageRef.current.destroy();
                    startMessageRef.current = null;
                }
            };

        } else if (gameState === 'PLAYING') {
            if (player.current) {
                 if (backgroundMusicRef.current && backgroundMusicRef.current.paused) {
                    backgroundMusicRef.current.play().catch(e => console.warn("Error al reanudar música de fondo:", e));
                }
                return;
            }

            metrics.current.gameStartTime = Date.now();
            const screenWidth = app.screen.width; const screenHeight = app.screen.height;
            const playerWidth = 50; const playerHeight = 50;
            const playerGraphics = new PIXI.Graphics().rect(0, 0, playerWidth, playerHeight).fill({ color: 0x61dafb });
            playerGroundY.current = screenHeight - playerHeight - 50;
            lanePositions.current = [
                getAbsoluteX(-0.75, playerGroundY.current, screenWidth, screenHeight) - playerWidth / 2,
                getAbsoluteX(0.0, playerGroundY.current, screenWidth, screenHeight) - playerWidth / 2,
                getAbsoluteX(0.75, playerGroundY.current, screenWidth, screenHeight) - playerWidth / 2,
            ];
            playerGraphics.x = lanePositions.current[currentLaneIndex.current];
            playerGraphics.y = playerGroundY.current;
            stage.addChild(playerGraphics); player.current = playerGraphics;
            targetPlayerX.current = player.current.x;

            createRoadLines(app);
            window.addEventListener('keydown', handleGameKeyDown);
            window.addEventListener('keyup', handleGameKeyUp);

            if (backgroundMusicRef.current && backgroundMusicRef.current.paused) {
                backgroundMusicRef.current.play().catch(e => console.warn("Error al reproducir música de fondo:", e));
            }

            ticker.remove(gameLoop);
            ticker.add(gameLoop);
        }

    }, [gameState, isPixiAppReady, id_test_actual, userId, id_room]);


    const handleQuestionAnswer = (answer) => {
        if (!currentQuestion) return;

        const answerRecord = {
            questionId: currentQuestion.id,
            questionText: currentQuestion.text,
            answer: answer,
            timestamp: Date.now(),
        };

        metrics.current.questionsAnswered.push(answerRecord);
        setCurrentQuestion(null);
        setGameState('PLAYING');
    };

    const handleDebugEndGame = () => {
        if (gameEndedRef.current) return;
        if (appRef.current && appRef.current.ticker && !appRef.current.destroyed) {
            appRef.current.ticker.stop();
        }
        if (backgroundMusicRef.current) {
            backgroundMusicRef.current.pause();
        }
        sendGameDataToBackend();
        if (onGameEnd) onGameEnd();
        setGameState('INITIALIZING');
    };

    return (
        <div ref={pixiContainerRef} className="game-container" style={{ width: '100%', height: '600px', border: '1px solid #ccc', touchAction: 'none', position: 'relative', backgroundColor: '#101010' }}>
            {gameState === 'PLAYING' && (
                <>
                    <div style={{ position: 'absolute', top: 10, left: 10, color: 'white', fontSize: '16px', zIndex: 10, fontFamily: 'Arial, sans-serif', backgroundColor: 'rgba(0,0,0,0.5)', padding: '5px', borderRadius: '5px' }}>
                        <div>Score: {score}</div>
                        <div>Errores: {metrics.current.error_count}</div>
                        <div>Aciertos: {metrics.current.correct_decisions}</div>
                        <div>Disp. Fallidos: {metrics.current.missedShots}</div>
                    </div>
                    <button onClick={handleDebugEndGame} style={{ position: 'absolute', bottom: 10, left: 10, zIndex: 10, padding: '8px 15px', cursor: 'pointer', backgroundColor: '#f0f0f0', border: '1px solid #ccc', borderRadius: '4px' }}>
                        Terminar Juego (DEBUG)
                    </button>
                </>
            )}

            {gameState === 'SHOWING_QUESTION' && currentQuestion && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.75)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 20
                }}>
                    <div style={{
                        backgroundColor: '#FFFFFF', padding: '30px', borderRadius: '15px',
                        textAlign: 'center', maxWidth: '90%', width: '500px',
                        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)'
                    }}>
                        <img
                            src={currentQuestion.imageUrl}
                            alt="Ilustración de la pregunta"
                            style={{ maxWidth: '100%', height: 'auto', maxHeight: '200px', marginBottom: '20px', borderRadius: '10px' }}
                        />
                        <h2 style={{ color: '#333', marginBottom: '25px', fontSize: '1.4em' }}>
                            {currentQuestion.text}
                        </h2>
                        <div style={{ display: 'flex', justifyContent: 'space-around' }}>
                            <button
                                onClick={() => handleQuestionAnswer('Sí')}
                                style={{ padding: '15px 40px', fontSize: '1.2em', cursor: 'pointer', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '8px' }}
                            >
                                Sí
                            </button>
                            <button
                                onClick={() => handleQuestionAnswer('No')}
                                style={{ padding: '15px 40px', fontSize: '1.2em', cursor: 'pointer', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '8px' }}
                            >
                                No
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default GameTest;