import React, { useEffect, useRef, useState } from 'react';
import useSocket from '../../hooks/useSocket'; 
import * as PIXI from 'pixi.js';

const generateUUID = () => crypto.randomUUID ? crypto.randomUUID() : ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c => (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16));

function GameTest({ id_test_actual, userId, onGameEnd, id_room }) {
    const BACKEND_SOCKET_URL = import.meta.env.VITE_BACKEND_URL;
    const { socket, isConnected } = useSocket(BACKEND_SOCKET_URL);

    const pixiContainerRef = useRef(null);
    const [score, setScore] = useState(0);
    const [isPixiInitialized, setIsPixiInitialized] = useState(false);

    const appRef = useRef(null);
    const player = useRef(null);
    const keys = useRef({});

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
    });
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

    const updatePerspectiveSegment = (graphic, currentSegmentY, screenWidth, screenHeight, color, laneOffsetFactor) => {
        const gc = gameConstants.current;
        graphic.clear();
        const effectiveRoadHeight = screenHeight * (1 - gc.horizonY);

        if (graphic.isObstacle) {
            const normalizedObstacleY = Math.max(0, Math.min(1, (currentSegmentY - (screenHeight * gc.horizonY)) / effectiveRoadHeight));
            const scaleFactor = gc.initialObstacleScale + (normalizedObstacleY * (1 - gc.initialObstacleScale));
            const obstacleWidth = gc.obstacleWidth * scaleFactor;
            const obstacleHeight = gc.obstacleHeight * scaleFactor;
            if (isNaN(obstacleWidth) || isNaN(obstacleHeight) || obstacleWidth < 0.1 || obstacleHeight < 0.1) {
                graphic.visible = false;
                return;
            }
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
        if (!player.current || !appRef.current?.stage || appRef.current.destroyed) return;
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

    const getObstacleFromPool = (type, lane) => {
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
        if (!appInstance || !appInstance.screen || !appInstance.stage || appInstance.destroyed) return;

        const obstacleGraphic = getObstacleFromPool(type, laneIndex);
        const gc = gameConstants.current;
        obstacleGraphic.y = appInstance.screen.height * gc.horizonY;

        // Usar generateUUID directamente ya que PIXI.utils.uid() no está en v8+
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

    useEffect(() => {
        gameEndedRef.current = false; 
        metrics.current = { 
            id_test_para_actualizar: id_test_actual || null, // Usar la prop
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
        };
        setScore(0);
        const onKeyDown = (event) => {
            if (gameEndedRef.current) return;
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
        const onKeyUp = (event) => { keys.current[event.code] = false; };

        const gameLoop = (delta) => {
            if (gameEndedRef.current || !appRef.current?.stage || !player.current || !appRef.current.ticker || appRef.current.destroyed) return;
            const actualDelta = typeof delta === 'number' && !isNaN(delta) ? Math.max(0.1, Math.min(delta, 2)) : 1;
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
                if (appRef.current && appRef.current.ticker && !appRef.current.destroyed) {
                    shootCooldownTimer.current += appRef.current.ticker.deltaMS;
                }
                if (shootCooldownTimer.current >= gc.shootCooldown) canShoot.current = true;
            }

            roadSegments.current.forEach(sg => {
                sg.worldY += gc.gameSpeedY * actualDelta;
                if (sg.worldY > screenHeight + gc.lineSegmentHeight + gc.lineSegmentSpacing) sg.worldY -= (gc.lineSegmentHeight + gc.lineSegmentSpacing) * (gc.numSegmentsPerLane + 2);
                sg.lines.forEach(ld => updatePerspectiveSegment(ld.graphic, sg.worldY, screenWidth, screenHeight, ld.color, ld.laneOffsetFactor));
            });

            if (appRef.current && appRef.current.ticker && !appRef.current.destroyed) {
                obstacleSpawnTimer.current += appRef.current.ticker.deltaMS;
                if (obstacleSpawnTimer.current >= gc.obstacleSpawnInterval) {
                    createObstacle(appRef.current, 'default_obstacle', Math.floor(Math.random() * 3));
                    obstacleSpawnTimer.current = 0;
                }
            }

            const activeBullets = [];
            bullets.current.forEach(bullet => {
                if (!bullet.graphic) return; bullet.graphic.x += bullet.speedX * actualDelta; bullet.graphic.y -= gc.bulletSpeedY * actualDelta;
                if (bullet.graphic.y + gc.bulletHeight < 0 || bullet.graphic.x < -gc.bulletWidth || bullet.graphic.x > screenWidth) {
                    if (bullet.graphic.parent && appRef.current?.stage) appRef.current.stage.removeChild(bullet.graphic); bulletPool.current.push(bullet.graphic);
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
                if (bulletsToRemove.has(b)) { if (b.graphic.parent && appRef.current?.stage) appRef.current.stage.removeChild(b.graphic); bulletPool.current.push(b.graphic); return false; }
                return true;
            });

            const reactionZoneStartY = screenHeight * (1 - gc.reactionZoneStartYRatio);
            const activeObstacles = [];
            obstacles.current.forEach(obstacle => {
                if (!obstacle.graphic) return;
                if (obstacle.isHit) { if (obstacle.graphic.parent && appRef.current?.stage) appRef.current.stage.removeChild(obstacle.graphic); obstaclePool.current.push(obstacle.graphic); return; }

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
                    if (obstacle.graphic.parent && appRef.current?.stage) appRef.current.stage.removeChild(obstacle.graphic);
                    obstaclePool.current.push(obstacle.graphic);
                } else activeObstacles.push(obstacle);
            });
            obstacles.current = activeObstacles;
        };

        const endGameCleanupLogic = () => {
            sendGameDataToBackend();

            if (observerRef.current && pixiContainerRef.current) {
                observerRef.current.unobserve(pixiContainerRef.current);
            }
            observerRef.current = null;
            window.removeEventListener('keydown', onKeyDown);
            window.removeEventListener('keyup', onKeyUp);

            const appToDestroy = appRef.current;
            if (appToDestroy) {
                if (!appToDestroy.destroyed) {
                    if (appToDestroy.ticker) {
                        appToDestroy.ticker.remove(gameLoop);
                        appToDestroy.ticker.stop();
                    }

                    if (appToDestroy.canvas && pixiContainerRef.current && pixiContainerRef.current.contains(appToDestroy.canvas)) {
                        try {
                            pixiContainerRef.current.removeChild(appToDestroy.canvas);
                        } catch (e) { /* Silenciar */ }
                    }

                    const destroyOptions = { children: true, texture: true, basePath: true };
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

                    appToDestroy.destroy(false, destroyOptions);
                }
                appRef.current = null;
            }
            setIsPixiInitialized(false);
        };

        const setupPixiAndGame = async () => {
            if (!pixiContainerRef.current) {
                // console.error("setupPixiAndGame: pixiContainerRef.current es null al inicio.");
                setIsPixiInitialized(false);
                return;
            }

            if (!appRef.current || appRef.current.destroyed) {
                // console.warn("setupPixiAndGame: appRef.current es null o está destruido. Recreando.");
                appRef.current = new PIXI.Application();
                if (!appRef.current) {
                    // console.error("setupPixiAndGame: Falló la recreación de PIXI.Application.");
                    setIsPixiInitialized(false);
                    return;
                }
            }

            try {
                metrics.current.gameStartTime = Date.now();
                await appRef.current.init({ backgroundColor: 0x1a1a1a, resizeTo: pixiContainerRef.current, autoDensity: true, resolution: window.devicePixelRatio || 1 });

                if (!appRef.current.canvas || !appRef.current.renderer) {
                    // console.error("setupPixiAndGame: Falló la inicialización de Pixi (canvas o renderer no disponibles).");
                    if (appRef.current && typeof appRef.current.destroy === 'function' && !appRef.current.destroyed) {
                        appRef.current.destroy(true, { children: true, texture: true, basePath: true });
                    }
                    appRef.current = null;
                    setIsPixiInitialized(false);
                    return;
                }

                if (!pixiContainerRef.current) {
                    // console.error("setupPixiAndGame: pixiContainerRef.current se volvió null justo antes de appendChild.");
                    if (appRef.current && !appRef.current.destroyed) {
                        appRef.current.destroy(true, { children: true, texture: true, basePath: true });
                    }
                    appRef.current = null;
                    setIsPixiInitialized(false);
                    return;
                }

                if (!pixiContainerRef.current.contains(appRef.current.canvas)) {
                    pixiContainerRef.current.appendChild(appRef.current.canvas);
                }

                if (!appRef.current.stage) {
                    // console.error("setupPixiAndGame: appRef.current.stage no está definido después de init.");
                    if (appRef.current && !appRef.current.destroyed) {
                        appRef.current.destroy(true, { children: true, texture: true, basePath: true });
                    }
                    appRef.current = null;
                    setIsPixiInitialized(false);
                    return;
                }

                const screenWidth = appRef.current.screen.width; const screenHeight = appRef.current.screen.height;
                const playerWidth = 50; const playerHeight = 50;
                const playerGraphics = new PIXI.Graphics().rect(0, 0, playerWidth, playerHeight).fill({ color: 0x61dafb });
                playerGroundY.current = screenHeight - playerHeight - 50;
                lanePositions.current = [getAbsoluteX(-0.75, playerGroundY.current, screenWidth, screenHeight) - playerWidth / 2, getAbsoluteX(0.0, playerGroundY.current, screenWidth, screenHeight) - playerWidth / 2, getAbsoluteX(0.75, playerGroundY.current, screenWidth, screenHeight) - playerWidth / 2];
                playerGraphics.x = lanePositions.current[currentLaneIndex.current]; playerGraphics.y = playerGroundY.current;
                appRef.current.stage.addChild(playerGraphics); player.current = playerGraphics; targetPlayerX.current = player.current.x;

                createRoadLines(appRef.current);
                window.addEventListener('keydown', onKeyDown); window.addEventListener('keyup', onKeyUp);

                if (appRef.current && appRef.current.ticker && !appRef.current.destroyed) {
                    appRef.current.ticker.remove(gameLoop);
                    appRef.current.ticker.add(gameLoop);
                    if (!appRef.current.ticker.started) appRef.current.ticker.start();
                } else {
                    // console.error("setupPixiAndGame: appRef.current.ticker no está disponible o la app está destruida.");
                }
                setIsPixiInitialized(true);

            } catch (error) {
                console.error("Error detallado al inicializar PixiJS:", error);
                if (appRef.current && typeof appRef.current.destroy === 'function' && !appRef.current.destroyed) {
                    appRef.current.destroy(true, { children: true, texture: true, basePath: true });
                }
                appRef.current = null;
                setIsPixiInitialized(false);
            }
        };

        if (!appRef.current) {
            appRef.current = new PIXI.Application();
        }

        if (pixiContainerRef.current && !isPixiInitialized) {
            if (pixiContainerRef.current.clientWidth > 0 && pixiContainerRef.current.clientHeight > 0) {
                setupPixiAndGame();
            } else {
                if (observerRef.current) {
                    observerRef.current.disconnect();
                }
                observerRef.current = new ResizeObserver(entries => {
                    for (let entry of entries) {
                        if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
                            if (observerRef.current) {
                                observerRef.current.disconnect();
                            }
                            if (pixiContainerRef.current && appRef.current && !isPixiInitialized && (appRef.current.destroyed === false || typeof appRef.current.destroyed === 'undefined')) {
                                setupPixiAndGame();
                            }
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
            endGameCleanupLogic();
        };
    }, [id_test_actual, userId, id_room]);

    const handleDebugEndGame = () => {
        if (gameEndedRef.current) return;

        if (appRef.current && appRef.current.ticker && !appRef.current.destroyed) {
            appRef.current.ticker.stop();
        }

        sendGameDataToBackend();

        if (onGameEnd) {
            onGameEnd();
        }
    };

    return (
        <div ref={pixiContainerRef} className="game-container" style={{ width: '100%', height: '600px', border: '1px solid #ccc', touchAction: 'none', position: 'relative', backgroundColor: '#1a1a1a' }}>
            <div style={{ position: 'absolute', top: 10, left: 10, color: 'white', fontSize: '16px', zIndex: 10, fontFamily: 'Arial, sans-serif', backgroundColor: 'rgba(0,0,0,0.5)', padding: '5px', borderRadius: '5px' }}>
                <div>Score: {score}</div>
                <div>Errores: {metrics.current.error_count}</div>
                <div>Aciertos: {metrics.current.correct_decisions}</div>
                <div>Disp. Fallidos: {metrics.current.missedShots}</div>
            </div>
            <button onClick={handleDebugEndGame} style={{ position: 'absolute', bottom: 10, left: 10, zIndex: 10, padding: '8px 15px', cursor: 'pointer', backgroundColor: '#f0f0f0', border: '1px solid #ccc', borderRadius: '4px' }}>
                Terminar Juego (DEBUG)
            </button>
        </div>
    );
}

export default GameTest;