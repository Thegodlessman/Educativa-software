import { useRef, useEffect, useCallback } from 'react';
import * as PIXI from 'pixi.js';
import { 
    GAME_CONFIG, 
    PLAYER_CONFIG, 
    OBSTACLE_CONFIG,
    PROJECTILE_CONFIG,
    PERSPECTIVE_CONFIG,
    DIFFICULTY_SETTINGS,
    GAME_RULES
} from '../constants/gameConfig';

// --- Funciones de Ayuda para la Perspectiva ---
const getRoadWidthAtY = (y, screenWidth, screenHeight) => {
    const { HORIZON_Y_RATIO, ROAD_WIDTH_TOP_RATIO, ROAD_WIDTH_BOTTOM_RATIO } = PERSPECTIVE_CONFIG;
    const effectiveRoadHeight = screenHeight * (1 - HORIZON_Y_RATIO);
    const normalizedY = Math.max(0, Math.min(1, (y - (screenHeight * HORIZON_Y_RATIO)) / effectiveRoadHeight));
    return screenWidth * (ROAD_WIDTH_TOP_RATIO * (1 - normalizedY) + ROAD_WIDTH_BOTTOM_RATIO * normalizedY);
};

const getAbsoluteX = (normalizedRoadX, y, screenWidth, screenHeight) => {
    const currentRoadWidth = getRoadWidthAtY(y, screenWidth, screenHeight);
    const horizontalOffset = normalizedRoadX * currentRoadWidth / 2;
    return screenWidth / 2 + horizontalOffset;
};

const updatePerspective = (graphic, y, screenWidth, screenHeight) => {
    const { MIN_OBSTACLE_SCALE, MAX_OBSTACLE_SCALE, HORIZON_Y_RATIO } = PERSPECTIVE_CONFIG;
    const effectiveRoadHeight = screenHeight * (1 - HORIZON_Y_RATIO);
    const normalizedY = Math.max(0, Math.min(1, (y - (screenHeight * HORIZON_Y_RATIO)) / effectiveRoadHeight));
    
    const scaleFactor = MIN_OBSTACLE_SCALE + (normalizedY * (MAX_OBSTACLE_SCALE - MIN_OBSTACLE_SCALE));
    graphic.scale.set(scaleFactor);
    graphic.x = getAbsoluteX(graphic.laneFactor, y, screenWidth, screenHeight);
    graphic.y = y;
};


export const usePixiGame = ({ assets, onGameEnd, onMetricUpdate, onQuestion, id_test_actual }) => {
    const pixiApp = useRef(null);
    const pixiContainerRef = useRef(null);
    const textures = useRef({});
    const sfx = useRef({});

    // --- Referencias de elementos del juego ---
    const player = useRef(null);
    const background = useRef(null);
    const obstacles = useRef([]);
    const projectiles = useRef([]);
    const obstaclePool = useRef([]);
    const projectilePool = useRef([]);
    const lanePositions = useRef([]);

    // --- Referencias para control y estado ---
    const keys = useRef({});
    const isPaused = useRef(false);
    const gameTime = useRef(0);
    const questionTimer = useRef(0);
    const nextQuestionIndex = useRef(0);

    // --- Dificultad Dinámica ---
    const gameSpeed = useRef(DIFFICULTY_SETTINGS.INITIAL_GAMESPEED_Y);
    const obstacleMoveSpeed = useRef(DIFFICULTY_SETTINGS.INITIAL_OBSTACLE_SPEED);
    const spawnInterval = useRef(DIFFICULTY_SETTINGS.INITIAL_SPAWN_INTERVAL);
    const timeSinceSpeedIncrease = useRef(0);

    // --- Mecánicas del Jugador ---
    const currentLaneIndex = useRef(1);
    const targetPlayerX = useRef(0);
    const shootCooldown = useRef(0);
    const isInvincible = useRef(false);
    const invincibilityTimer = useRef(0);

    // --- Métricas ---
    const gameMetrics = useRef({});
    const onGameEndRef = useRef(onGameEnd);
    const onMetricUpdateRef = useRef(onMetricUpdate);
    const onQuestionRef = useRef(onQuestion);

    useEffect(() => {
        onGameEndRef.current = onGameEnd;
        onMetricUpdateRef.current = onMetricUpdate;
        onQuestionRef.current = onQuestion;
    });

    const resetMetrics = () => {
        gameMetrics.current = {
            id_test_para_actualizar: id_test_actual,
            score: 0, correct_hits: 0, collision_errors: 0,
            omission_errors: 0, commission_errors: 0,
            missed_shots: 0, reactionTimes: [],
        };
        onMetricUpdateRef.current(gameMetrics.current);
    };

    const playSound = (soundName, volume = 0.5) => {
        if (sfx.current[soundName]) {
            const sound = sfx.current[soundName];
            sound.currentTime = 0;
            sound.volume = volume;
            sound.play().catch(e => console.error("Error al reproducir sonido:", e));
        }
    };
    
    // --- Lógica principal del juego ---
    const gameLoop = useCallback((ticker) => {
        if (isPaused.current || !pixiApp.current || pixiApp.current.destroyed) return;
        
        const delta = ticker.deltaMS;
        gameTime.current += delta;
        questionTimer.current += delta;
        timeSinceSpeedIncrease.current += delta;

        // Dificultad progresiva
        if (timeSinceSpeedIncrease.current > DIFFICULTY_SETTINGS.SPEED_INCREASE_INTERVAL) {
            gameSpeed.current *= DIFFICULTY_SETTINGS.SPEED_INCREASE_FACTOR;
            obstacleMoveSpeed.current *= DIFFICULTY_SETTINGS.SPEED_INCREASE_FACTOR;
            spawnInterval.current -= DIFFICULTY_SETTINGS.SPAWN_INTERVAL_DECREASE;
            spawnInterval.current = Math.max(DIFFICULTY_SETTINGS.MIN_SPAWN_INTERVAL, spawnInterval.current);
            timeSinceSpeedIncrease.current = 0;
        }

        // Mover fondo
        if(background.current) background.current.tilePosition.y += gameSpeed.current * 0.5;

        // Lógica de preguntas
        if (questionTimer.current >= GAME_CONFIG.QUESTION_INTERVAL) {
            onQuestionRef.current(nextQuestionIndex.current);
            nextQuestionIndex.current += 1;
            questionTimer.current = 0;
        }

        // Lógica del jugador
        targetPlayerX.current = lanePositions.current[currentLaneIndex.current];
        player.current.x += (targetPlayerX.current - player.current.x) * PLAYER_CONFIG.LANE_CHANGE_SPEED;
        
        if (isInvincible.current) {
            invincibilityTimer.current -= delta;
            player.current.alpha = Math.floor(invincibilityTimer.current / 150) % 2 === 0 ? 0.5 : 1;
            if (invincibilityTimer.current <= 0) {
                isInvincible.current = false;
                player.current.alpha = 1;
            }
        }
        
        shootCooldown.current -= delta;
        if (keys.current['Space'] && shootCooldown.current <= 0) {
            playSound('shoot');
            const projectileSprite = projectilePool.current.pop() || new PIXI.Sprite(textures.current.projectile);
            projectileSprite.width = PROJECTILE_CONFIG.WIDTH;
            projectileSprite.height = PROJECTILE_CONFIG.HEIGHT;
            projectileSprite.anchor.set(0.5);
            projectileSprite.x = player.current.x;
            projectileSprite.y = player.current.y;
            projectileSprite.visible = true;
            pixiApp.current.stage.addChild(projectileSprite);
            
            let speedX = 0;
            if (currentLaneIndex.current === 0) { // Carril izquierdo, disparar a la derecha
                speedX = -PROJECTILE_CONFIG.ANGLE_STRENGTH;
            } else if (currentLaneIndex.current === 2) { // Carril derecho, disparar a la izquierda
                speedX = PROJECTILE_CONFIG.ANGLE_STRENGTH;
            }
            
            projectiles.current.push({ graphic: projectileSprite, speedX: speedX });
            shootCooldown.current = PLAYER_CONFIG.SHOOT_COOLDOWN;
        }

        // Lógica de Proyectiles
        projectiles.current = projectiles.current.filter(p => {
            p.graphic.y -= PROJECTILE_CONFIG.SPEED_Y;
            p.graphic.x -= p.speedX;
            if (p.graphic.y < 0) {
                p.graphic.visible = false;
                projectilePool.current.push(p.graphic);
                return false;
            }
            return true;
        });

        // Lógica de Obstáculos
        spawnInterval.current -= delta;
        if (spawnInterval.current <= 0) {
            const type = Math.random() < OBSTACLE_CONFIG.TARGET_SPAWN_CHANCE ? OBSTACLE_CONFIG.TYPES.TARGET : OBSTACLE_CONFIG.TYPES.NON_TARGET;
            const lane = Math.floor(Math.random() * 3);
            
            const obstacleSprite = obstaclePool.current.pop() || new PIXI.Sprite();
            obstacleSprite.texture = type === OBSTACLE_CONFIG.TYPES.TARGET ? textures.current.asteroid : textures.current.friendly;
            obstacleSprite.anchor.set(0.5);
            obstacleSprite.visible = true;
            obstacleSprite.laneFactor = (lane - 1) * 0.75;
            
            pixiApp.current.stage.addChild(obstacleSprite);
            
            obstacles.current.push({
                graphic: obstacleSprite, type, lane,
                y: pixiApp.current.screen.height * PERSPECTIVE_CONFIG.HORIZON_Y_RATIO,
                isHit: false, spawnTime: gameTime.current
            });
            spawnInterval.current = DIFFICULTY_SETTINGS.INITIAL_SPAWN_INTERVAL;
        }
        
        obstacles.current.forEach(obs => {
            obs.y += obstacleMoveSpeed.current;
            updatePerspective(obs.graphic, obs.y, pixiApp.current.screen.width, pixiApp.current.screen.height);
        });

        // Colisiones
        for (const obs of obstacles.current) {
            if (obs.isHit) continue;

            // Colisión Jugador-Obstáculo
            if (!isInvincible.current && checkCollision(player.current, obs.graphic)) {
                if (obs.type === OBSTACLE_CONFIG.TYPES.TARGET) {
                    playSound('playerHit');
                    gameMetrics.current.collision_errors += 1;
                    gameMetrics.current.score += GAME_RULES.COLLISION_PENALTY;
                    isInvincible.current = true;
                    invincibilityTimer.current = PLAYER_CONFIG.INVINCIBILITY_DURATION;
                }
                obs.isHit = true;
            }

            // Colisión Proyectil-Obstáculo
            for (let i = projectiles.current.length - 1; i >= 0; i--) {
                const p = projectiles.current[i];
                if (checkCollision(p.graphic, obs.graphic)) {
                    if (obs.type === OBSTACLE_CONFIG.TYPES.TARGET) {
                        playSound('explosion');
                        gameMetrics.current.correct_hits += 1;
                        gameMetrics.current.score += GAME_RULES.HIT_REWARD;
                        gameMetrics.current.reactionTimes.push({
                            time: gameTime.current - obs.spawnTime,
                            type: GAME_RULES.REACTION_TYPE.HIT
                        });
                    } else {
                        playSound('error');
                        gameMetrics.current.commission_errors += 1;
                        gameMetrics.current.score += GAME_RULES.COMMISSION_PENALTY;
                    }
                    obs.isHit = true;
                    p.graphic.visible = false;
                    projectilePool.current.push(p.graphic);
                    projectiles.current.splice(i, 1);
                    break; 
                }
            }
        }
        
        // Limpiar obstáculos
        obstacles.current = obstacles.current.filter(obs => {
            if (obs.graphic.y > pixiApp.current.screen.height) {
                if (!obs.isHit && obs.type === OBSTACLE_CONFIG.TYPES.TARGET) {
                    gameMetrics.current.omission_errors += 1;
                    gameMetrics.current.score += GAME_RULES.OMISSION_PENALTY;
                }
                obs.graphic.visible = false;
                obstaclePool.current.push(obs.graphic);
                return false;
            }
            if (obs.isHit) {
                obs.graphic.visible = false;
                obstaclePool.current.push(obs.graphic);
                return false;
            }
            return true;
        });

        onMetricUpdateRef.current({
            ...gameMetrics.current,
            time: gameTime.current
        });

        if (gameTime.current >= GAME_CONFIG.GAME_DURATION) {
            endGame();
        }
    }, []);

    const startGame = useCallback(() => {
        resetMetrics();
        gameTime.current = 0;
        questionTimer.current = 0;
        nextQuestionIndex.current = 0;
        isPaused.current = false;
        if(pixiApp.current) pixiApp.current.ticker.start();
    }, []);

    const pauseGame = useCallback(() => { isPaused.current = true; }, []);
    const resumeGame = useCallback(() => { isPaused.current = false; }, []);
    
    const endGame = useCallback(() => {
        isPaused.current = true;
        if(pixiApp.current) pixiApp.current.ticker.stop();
        gameMetrics.current.totalGameDuration = gameTime.current;
        onGameEndRef.current(gameMetrics.current);
    }, []);

    const checkCollision = (obj1, obj2) => {
        if (!obj1 || !obj2 || !obj1.visible || !obj2.visible) return false;
        const bounds1 = obj1.getBounds();
        const bounds2 = obj2.getBounds();
        return bounds1.x < bounds2.x + bounds2.width &&
               bounds1.x + bounds1.width > bounds2.x &&
               bounds1.y < bounds2.y + bounds2.height &&
               bounds1.y + bounds1.height > bounds2.y;
    };

    useEffect(() => {
        const initPixi = async () => {
            if (!pixiContainerRef.current) return;
            
            const app = new PIXI.Application();
            await app.init({
                resizeTo: pixiContainerRef.current,
                backgroundColor: GAME_CONFIG.BACKGROUND_COLOR,
                autoDensity: true,
                resolution: window.devicePixelRatio || 1,
            });
            
            pixiContainerRef.current.appendChild(app.view);
            pixiApp.current = app;

            await PIXI.Assets.load([
                { alias: 'player', src: assets.player },
                { alias: 'asteroid', src: assets.asteroid },
                { alias: 'friendly', src: assets.friendly },
                { alias: 'projectile', src: assets.projectile },
                { alias: 'background', src: assets.background },
            ]);
            
            textures.current = {
                player: PIXI.Assets.get('player'),
                asteroid: PIXI.Assets.get('asteroid'),
                friendly: PIXI.Assets.get('friendly'),
                projectile: PIXI.Assets.get('projectile'),
                background: PIXI.Assets.get('background'),
            };

            sfx.current = {
                shoot: new Audio(assets.shootSfx),
                explosion: new Audio(assets.explosionSfx),
                error: new Audio(assets.errorSfx),
                playerHit: new Audio(assets.playerHitSfx),
            };

            background.current = new PIXI.TilingSprite({
                texture: textures.current.background,
                width: app.screen.width,
                height: app.screen.height
            });
            app.stage.addChild(background.current);

            player.current = new PIXI.Sprite(textures.current.player);
            player.current.anchor.set(0.5, 0.8);
            player.current.width = PLAYER_CONFIG.WIDTH;
            player.current.height = PLAYER_CONFIG.HEIGHT;
            
            const playerGroundY = app.screen.height - (player.current.height / 2) - PLAYER_CONFIG.GROUND_Y_OFFSET;
            lanePositions.current = [
                getAbsoluteX(-0.75, playerGroundY, app.screen.width, app.screen.height),
                getAbsoluteX(0.0, playerGroundY, app.screen.width, app.screen.height),
                getAbsoluteX(0.75, playerGroundY, app.screen.width, app.screen.height),
            ];
            player.current.x = lanePositions.current[1];
            player.current.y = playerGroundY;
            app.stage.addChild(player.current);

            app.ticker.add(gameLoop);
            app.ticker.stop();
        };

        initPixi();

        const handleKeyDown = (e) => {
            keys.current[e.code] = true;
            if (e.code === 'ArrowLeft' && currentLaneIndex.current > 0) currentLaneIndex.current--;
            if (e.code === 'ArrowRight' && currentLaneIndex.current < 2) currentLaneIndex.current++;
        };
        const handleKeyUp = (e) => { keys.current[e.code] = false; };
        
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            if (pixiApp.current) {
                pixiApp.current.destroy(true, { children: true, texture: true, baseTexture: true });
                pixiApp.current = null;
            }
        };
    }, []);

    return { pixiContainerRef, startGame, pauseGame, resumeGame, endGame };
};