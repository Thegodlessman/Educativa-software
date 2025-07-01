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

// --- Funciones de Ayuda (sin cambios) ---
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
const updatePerspective = (graphic, y) => {
    const { MIN_OBSTACLE_SCALE, MAX_OBSTACLE_SCALE, HORIZON_Y_RATIO } = PERSPECTIVE_CONFIG;
    const screenHeight = GAME_CONFIG.HEIGHT;
    const effectiveRoadHeight = screenHeight * (1 - HORIZON_Y_RATIO);
    const normalizedY = Math.max(0, Math.min(1, (y - (screenHeight * HORIZON_Y_RATIO)) / effectiveRoadHeight));
    const scaleFactor = MIN_OBSTACLE_SCALE + (normalizedY * (MAX_OBSTACLE_SCALE - MIN_OBSTACLE_SCALE));
    graphic.scale.set(scaleFactor);
    graphic.y = y;
};

export const usePixiGame = ({ assets, onGameEnd, onMetricUpdate, onQuestion, onLoadProgress, id_test_actual }) => {
    const pixiApp = useRef(null);
    const pixiContainerRef = useRef(null);
    const textures = useRef({});
    const sfx = useRef({});
    const player = useRef(null);
    const obstacles = useRef([]);
    const projectiles = useRef([]);
    const obstaclePool = useRef([]);
    const projectilePool = useRef([]);
    const lanePositions = useRef([]);
    const keys = useRef({});
    const isPaused = useRef(false);
    const gameTime = useRef(0);
    const questionTimer = useRef(0);
    const nextQuestionIndex = useRef(0);
    const gameSpeed = useRef(DIFFICULTY_SETTINGS.INITIAL_GAMESPEED_Y);
    const obstacleMoveSpeed = useRef(DIFFICULTY_SETTINGS.INITIAL_OBSTACLE_SPEED);
    const spawnInterval = useRef(DIFFICULTY_SETTINGS.INITIAL_SPAWN_INTERVAL);
    const timeSinceSpeedIncrease = useRef(0);
    const currentLaneIndex = useRef(1);
    const targetPlayerX = useRef(0);
    const shootCooldown = useRef(0);
    const isInvincible = useRef(false);
    const invincibilityTimer = useRef(0);
    const gameMetrics = useRef({});

    // Eliminamos las refs para los callbacks, usaremos las props directamente en los useCallback
    const backgrounds = useRef([]);
    const activeBgIndex = useRef(0);
    const isTransitioning = useRef(false);
    const transitionProgress = useRef(0);
    const timeSinceLastBgChange = useRef(0);

    const resetMetrics = useCallback(() => {
        gameMetrics.current = {
            id_test_para_actualizar: id_test_actual,
            score: 0, correct_hits: 0, collision_errors: 0,
            omission_errors: 0, commission_errors: 0,
            missed_shots: 0, reactionTimes: [],
        };
        onMetricUpdate(gameMetrics.current);
    }, [id_test_actual, onMetricUpdate]);

    const playSound = (soundName, volume) => {
        if (sfx.current[soundName]) {
            const sound = sfx.current[soundName];
            sound.currentTime = 0;
            sound.volume = volume;
            sound.play().catch(e => console.error("Error al reproducir sonido:", e));
        }
    }

    function showScoreMessage(text, color, position) {
        if (!pixiApp.current) return;
        const message = new PIXI.Text(text, {
            fontFamily: 'Arial', fontSize: 24, fill: color,
            stroke: '#ffffff', strokeThickness: 4, fontWeight: 'bold'
        });
        message.anchor.set(0.5);
        message.x = position.x;
        message.y = position.y;
        pixiApp.current.stage.addChild(message);
        const animation = (ticker) => {
            const delta = ticker.deltaMS;
            message.y -= 1 * (delta / 16);
            message.alpha -= 0.02 * (delta / 16);
            if (message.alpha <= 0) {
                pixiApp.current.ticker.remove(animation);
                message.destroy();
            }
        };
        pixiApp.current.ticker.add(animation);
    }

    const gameLoop = useCallback((ticker) => {
        if (isPaused.current || !pixiApp.current || pixiApp.current.destroyed) return;

        const delta = ticker.deltaMS;
        gameTime.current += delta;
        questionTimer.current += delta;
        timeSinceSpeedIncrease.current += delta;
        timeSinceLastBgChange.current += delta;

        const BG_CHANGE_INTERVAL = 90000;
        const TRANSITION_DURATION = 30000;

        backgrounds.current.forEach(bg => {
            if (bg) bg.tilePosition.y += gameSpeed.current * 0.5;
        });

        if (isTransitioning.current) {
            transitionProgress.current += delta;
            const alpha = Math.min(1, transitionProgress.current / TRANSITION_DURATION);
            if (backgrounds.current[1]) backgrounds.current[1].alpha = alpha;
            if (backgrounds.current[0]) backgrounds.current[0].alpha = 1 - alpha;
            if (alpha >= 1) {
                isTransitioning.current = false;
                if (backgrounds.current[0]) backgrounds.current[0].destroy();
                backgrounds.current.shift();
                activeBgIndex.current = (activeBgIndex.current + 1) % textures.current.backgrounds.length;
                const nextTextureIndex = (activeBgIndex.current + 1) % textures.current.backgrounds.length;
                if (textures.current.backgrounds[nextTextureIndex]) {
                    const nextBg = new PIXI.TilingSprite({
                        texture: textures.current.backgrounds[nextTextureIndex],
                        width: pixiApp.current.screen.width, height: pixiApp.current.screen.height,
                        alpha: 0
                    });
                    pixiApp.current.stage.addChildAt(nextBg, 0);
                    backgrounds.current.push(nextBg);
                }
            }
        } else if (timeSinceLastBgChange.current >= BG_CHANGE_INTERVAL) {
            if (backgrounds.current.length > 1) {
                isTransitioning.current = true;
                transitionProgress.current = 0;
                timeSinceLastBgChange.current = 0;
            }
        }

        if (timeSinceSpeedIncrease.current > DIFFICULTY_SETTINGS.SPEED_INCREASE_INTERVAL) {
            gameSpeed.current *= DIFFICULTY_SETTINGS.SPEED_INCREASE_FACTOR;
            obstacleMoveSpeed.current *= DIFFICULTY_SETTINGS.SPEED_INCREASE_FACTOR;
            spawnInterval.current -= DIFFICULTY_SETTINGS.SPAWN_INTERVAL_DECREASE;
            spawnInterval.current = Math.max(DIFFICULTY_SETTINGS.MIN_SPAWN_INTERVAL, spawnInterval.current);
            timeSinceSpeedIncrease.current = 0;
        }

        if (sfx.current.backgroundMusic && sfx.current.backgroundMusic.readyState > 0) {
            const minVolume = 0.2, maxVolume = 1.0, maxSpeed = 15;
            const speedProgress = Math.min(1, (gameSpeed.current - DIFFICULTY_SETTINGS.INITIAL_GAMESPEED_Y) / (maxSpeed - DIFFICULTY_SETTINGS.INITIAL_GAMESPEED_Y));
            const targetVolume = minVolume + (speedProgress * (maxVolume - minVolume));
            sfx.current.backgroundMusic.volume += (targetVolume - sfx.current.backgroundMusic.volume) * 0.1;
        }

        if (questionTimer.current >= GAME_CONFIG.QUESTION_INTERVAL) {
            onQuestion(nextQuestionIndex.current);
            nextQuestionIndex.current += 1;
            questionTimer.current = 0;
        }

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
            playSound('shoot', 0.1);
            const projectileSprite = projectilePool.current.pop() || new PIXI.Sprite(textures.current.projectile);
            projectileSprite.width = PROJECTILE_CONFIG.WIDTH;
            projectileSprite.height = PROJECTILE_CONFIG.HEIGHT;
            projectileSprite.anchor.set(0.5);
            projectileSprite.x = player.current.x;
            projectileSprite.y = player.current.y - (player.current.height / 2);
            projectileSprite.visible = true;
            pixiApp.current.stage.addChild(projectileSprite);
            projectiles.current.push({ graphic: projectileSprite, hit: false });
            shootCooldown.current = PLAYER_CONFIG.SHOOT_COOLDOWN;
        }

        projectiles.current = projectiles.current.filter(p => {
            p.graphic.y -= PROJECTILE_CONFIG.SPEED_Y;
            if (p.graphic.y < 0) {
                if (!p.hit) gameMetrics.current.missed_shots += 1;
                p.graphic.visible = false;
                projectilePool.current.push(p.graphic);
                return false;
            }
            return true;
        });

        spawnInterval.current -= delta;
        if (spawnInterval.current <= 0) {
            const type = Math.random() < OBSTACLE_CONFIG.TARGET_SPAWN_CHANCE ? OBSTACLE_CONFIG.TYPES.TARGET : OBSTACLE_CONFIG.TYPES.NON_TARGET;
            const lane = Math.floor(Math.random() * 3);
            const obstacleSprite = obstaclePool.current.pop() || new PIXI.Sprite();
            obstacleSprite.texture = type === OBSTACLE_CONFIG.TYPES.TARGET ? textures.current.asteroid : textures.current.friendly;
            obstacleSprite.anchor.set(0.5);
            obstacleSprite.visible = true;
            obstacleSprite.x = lanePositions.current[lane];
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
            updatePerspective(obs.graphic, obs.y);
        });

        const checkCollision = (obj1, obj2) => {
            if (!obj1 || !obj2 || !obj1.visible || !obj2.visible) return false;
            const bounds1 = obj1.getBounds();
            const bounds2 = obj2.getBounds();
            return bounds1.x < bounds2.x + bounds2.width &&
                bounds1.x + bounds1.width > bounds2.x &&
                bounds1.y < bounds2.y + bounds2.height &&
                bounds1.y + bounds1.height > bounds2.y;
        };

        for (const obs of obstacles.current) {
            if (obs.isHit) continue;
            if (!isInvincible.current && checkCollision(player.current, obs.graphic)) {
                if (obs.type === OBSTACLE_CONFIG.TYPES.TARGET) {
                    playSound('playerHit', 0.2);
                    gameMetrics.current.collision_errors += 1;
                    gameMetrics.current.score += GAME_RULES.COLLISION_PENALTY;
                    isInvincible.current = true;
                    invincibilityTimer.current = PLAYER_CONFIG.INVINCIBILITY_DURATION;
                }
                obs.isHit = true;
            }
            for (let i = projectiles.current.length - 1; i >= 0; i--) {
                const p = projectiles.current[i];
                if (checkCollision(p.graphic, obs.graphic)) {
                    p.hit = true;
                    if (obs.type === OBSTACLE_CONFIG.TYPES.TARGET) {
                        playSound('explosion', 0.2);
                        gameMetrics.current.correct_hits += 1;
                        gameMetrics.current.score += GAME_RULES.HIT_REWARD;
                        gameMetrics.current.reactionTimes.push({ time: gameTime.current - obs.spawnTime, type: GAME_RULES.REACTION_TYPE.HIT });
                        showScoreMessage('+10', '#4CAF50', obs.graphic.position);
                    } else {
                        playSound('error', 0.2);
                        gameMetrics.current.commission_errors += 1;
                        gameMetrics.current.score += GAME_RULES.COMMISSION_PENALTY;
                        showScoreMessage('-15', '#F44336', obs.graphic.position);
                    }
                    obs.isHit = true;
                    p.graphic.visible = false;
                    projectilePool.current.push(p.graphic);
                    projectiles.current.splice(i, 1);
                    break;
                }
            }
        }

        obstacles.current = obstacles.current.filter(obs => {
            if (obs.graphic.y > pixiApp.current.screen.height + 50) {
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

        // --- CORRECCIÓN CLAVE 1: Usar onMetricUpdate directamente ---
        onMetricUpdate({ ...gameMetrics.current, time: gameTime.current });

        if (gameTime.current >= GAME_CONFIG.GAME_DURATION) {
            endGame();
        }
    }, [onMetricUpdate, onQuestion]); // <-- CORRECCIÓN CLAVE 2: Se añaden dependencias

    const startGame = useCallback(() => {
        resetMetrics();
        gameTime.current = 0;
        questionTimer.current = 0;
        nextQuestionIndex.current = 0;
        isPaused.current = false;
        if (sfx.current.backgroundMusic) {
            sfx.current.backgroundMusic.currentTime = 0;
            sfx.current.backgroundMusic.volume = 0.2;
            sfx.current.backgroundMusic.loop = true;
            sfx.current.backgroundMusic.play().catch(e => console.error("Error al reproducir música de fondo:", e));
        }
        if (pixiApp.current) pixiApp.current.ticker.start();
    }, [resetMetrics]);

    const pauseGame = useCallback(() => { isPaused.current = true; }, []);
    const resumeGame = useCallback(() => { isPaused.current = false; }, []);

    const endGame = useCallback(() => {
        isPaused.current = true;
        if (sfx.current.backgroundMusic) {
            sfx.current.backgroundMusic.pause();
        }
        if (pixiApp.current) pixiApp.current.ticker.stop();

        // --- CORRECCIÓN CLAVE 3: Llamar onGameEnd directamente ---
        onGameEnd({
            ...gameMetrics.current,
            totalGameDuration: gameTime.current
        });

    }, [onGameEnd]); // <-- CORRECCIÓN CLAVE 4: Se añade dependencia

    useEffect(() => {
        const initPixi = async () => {
            if (!pixiContainerRef.current || pixiApp.current) return;
            const app = new PIXI.Application();
            await app.init({
                resizeTo: pixiContainerRef.current,
                backgroundColor: GAME_CONFIG.BACKGROUND_COLOR,
                autoDensity: true,
                resolution: window.devicePixelRatio || 1,
            });
            pixiContainerRef.current.appendChild(app.view);
            pixiApp.current = app;

            const backgroundAliases = assets.backgrounds.map((bg, i) => ({ alias: `bg${i}`, src: bg }));
            await PIXI.Assets.load([
                { alias: 'player', src: assets.player }, { alias: 'asteroid', src: assets.asteroid },
                { alias: 'friendly', src: assets.friendly }, { alias: 'projectile', src: assets.projectile },
                ...backgroundAliases
            ], onLoadProgress);

            textures.current = {
                player: PIXI.Assets.get('player'), asteroid: PIXI.Assets.get('asteroid'),
                friendly: PIXI.Assets.get('friendly'), projectile: PIXI.Assets.get('projectile'),
                backgrounds: backgroundAliases.map(bg => PIXI.Assets.get(bg.alias)),
            };

            sfx.current = {
                shoot: new Audio(assets.shootSfx), explosion: new Audio(assets.explosionSfx),
                error: new Audio(assets.errorSfx), playerHit: new Audio(assets.playerHitSfx),
                thruster: new Audio(assets.thrusterSfx), backgroundMusic: new Audio(assets.backgroundMusic)
            };

            if (textures.current.backgrounds.length > 0) {
                const bg1 = new PIXI.TilingSprite({
                    texture: textures.current.backgrounds[0], width: app.screen.width, height: app.screen.height,
                });
                app.stage.addChildAt(bg1, 0);
                const nextTextureIndex = textures.current.backgrounds.length > 1 ? 1 : 0;
                const bg2 = new PIXI.TilingSprite({
                    texture: textures.current.backgrounds[nextTextureIndex],
                    width: app.screen.width, height: app.screen.height,
                    alpha: 0
                });
                app.stage.addChildAt(bg2, 0);
                backgrounds.current = [bg1, bg2];
                activeBgIndex.current = 0;
            }

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
            if (e.code === 'ArrowLeft' && currentLaneIndex.current > 0) {
                currentLaneIndex.current--;
                playSound('thruster', 0.05);
            }
            if (e.code === 'ArrowRight' && currentLaneIndex.current < 2) {
                currentLaneIndex.current++;
                playSound('thruster', 0.05);
            }
        };
        const handleKeyUp = (e) => { keys.current[e.code] = false; };

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            if (sfx.current.backgroundMusic) sfx.current.backgroundMusic.pause();
            if (pixiApp.current) {
                pixiApp.current.destroy(true, { children: true, texture: true, baseTexture: true });
                pixiApp.current = null;
            }
        };
    }, [assets, gameLoop, onLoadProgress]);

    return { pixiContainerRef, startGame, pauseGame, resumeGame, endGame };
};