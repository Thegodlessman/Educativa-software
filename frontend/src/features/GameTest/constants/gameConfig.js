export const GAME_CONFIG = {
    WIDTH: 800,
    HEIGHT: 600,
    BACKGROUND_COLOR: 0x0c0c1e,
    GAME_DURATION: 600000, // 10 minutos en ms
    // Aproximadamente una pregunta cada 90 segundos para tener 6 preguntas en 10 min
    QUESTION_INTERVAL: 10000, 
};

export const PLAYER_CONFIG = {
    WIDTH: 70,
    HEIGHT: 70,
    GROUND_Y_OFFSET: 20,
    LANE_CHANGE_SPEED: 0.15,
    INVINCIBILITY_DURATION: 2000,
    SHOOT_COOLDOWN: 300,
};

export const OBSTACLE_CONFIG = {
    TYPES: {
        TARGET: 'target', // Asteroides
        NON_TARGET: 'non-target' // Naves amigas
    },
    TARGET_SPAWN_CHANCE: 0.7, // 70% de probabilidad de que sea un objetivo
};

export const PROJECTILE_CONFIG = {
    WIDTH: 30,
    HEIGHT: 60,
    SPEED_Y: 20,
    ANGLE_STRENGTH: 9, // Inclinación al disparar desde los lados
};

export const PERSPECTIVE_CONFIG = {
    HORIZON_Y_RATIO: 0.1, // Línea del horizonte (10% desde arriba)
    ROAD_WIDTH_BOTTOM_RATIO: 0.8,
    ROAD_WIDTH_TOP_RATIO: 0.05,
    MIN_OBSTACLE_SCALE: 0.05,
    MAX_OBSTACLE_SCALE: 0.3,
};

export const DIFFICULTY_SETTINGS = {
    INITIAL_GAMESPEED_Y: 4,
    INITIAL_OBSTACLE_SPEED: 4,
    // El multiplicador máximo ahora es más bajo para que no sea injugable a los 10 min
    MAX_SPEED_MULTIPLIER: 1.6, 
    // Aumento de la velocidad cada 45 segundos para que haya progresión constante
    SPEED_INCREASE_INTERVAL: 45000, 
    // El factor de aumento es más pequeño para que sea gradual
    SPEED_INCREASE_FACTOR: 1.05, 
    
    INITIAL_SPAWN_INTERVAL: 1300,
    MIN_SPAWN_INTERVAL: 600,
    SPAWN_INTERVAL_DECREASE: 35, // Se reduce el intervalo más lentamente
};

export const GAME_RULES = {
    // Puntuaciones
    HIT_REWARD: 10,
    OMISSION_PENALTY: -5,
    COMMISSION_PENALTY: -15, // Disparar a una nave amiga
    COLLISION_PENALTY: -10, // Chocar con un asteroide

    // Definición de tipos para las métricas
    REACTION_TYPE: {
        HIT: 'hit',
        COLLISION: 'collision'
    },
};