const calculateStandardDeviation = (array) => {
    if (!array || array.length < 2) return 0;
    const n = array.length;
    const mean = array.reduce((a, b) => a + b) / n;
    const variance = array.map(x => Math.pow(x - mean, 2)).reduce((a, b) => a + b) / (n - 1);
    return Math.sqrt(variance);
};

export const calculateRiskProfile = (metrics) => {
    // 1. Verificación y Normalización de Datos de Juego
    const reactionTimesMs = (metrics.reactionTimes && Array.isArray(metrics.reactionTimes))
        ? metrics.reactionTimes.map(rt => rt.time)
        : [];
    
    const totalCorrectHits = metrics.correct_hits || 0;
    const commissionErrors = metrics.commission_errors || 0; // Disparar a naves amigas
    const omissionErrors = metrics.omission_errors || 0;     // No disparar a meteoritos
    const collisions = metrics.collision_errors || 0;        // Chocar con meteoritos

    const totalTargets = totalCorrectHits + omissionErrors;
    
    // 2. Cálculo de Puntuaciones de Componentes

    // --- Puntuación de Inatención ---
    let inattentionScore = 0;
    const inattentionRatio = totalTargets > 0 ? (omissionErrors + collisions) / totalTargets : 0;
    // Si más del 30% de los objetivos se omiten o chocan, es un indicador fuerte.
    if (inattentionRatio > 0.3) inattentionScore += 3;
    else if (inattentionRatio > 0.15) inattentionScore += 2;
    
    const reactionTimeVariability = calculateStandardDeviation(reactionTimesMs);
    // Una alta variabilidad (>450ms) es un fuerte indicador de inatención sostenida.
    if (reactionTimeVariability > 450) inattentionScore += 3;
    else if (reactionTimeVariability > 300) inattentionScore += 2;
    
    // --- Puntuación de Impulsividad ---
    let impulsivityScore = 0;
    const totalShots = totalCorrectHits + commissionErrors + (metrics.missed_shots || 0);
    const commissionRatio = totalShots > 0 ? commissionErrors / totalShots : 0;
    // Disparar a aliados es un error de impulsividad claro.
    if (commissionRatio > 0.25) impulsivityScore += 4; // Penalización alta
    else if (commissionRatio > 0.1) impulsivityScore += 2;

    // Chocar frecuentemente también puede indicar impulsividad.
    const collisionRate = (collisions * 60000) / (metrics.totalGameDuration || 1); // Colisiones por minuto
    if (collisionRate > 3) impulsivityScore += 2; // Más de 3 colisiones por minuto
    
    // --- Puntuación de Cuestionario (el nuevo componente) ---
    let questionnaireScore = 0;
    if (metrics.questionsAnswered && Array.isArray(metrics.questionsAnswered)) {
        const yesAnswers = metrics.questionsAnswered.filter(a => a.answer === 'Sí').length;
        if (yesAnswers >= 4) questionnaireScore = 3; // 4 o más respuestas "Sí" es significativo
        else if (yesAnswers >= 2) questionnaireScore = 1;
    }
    
    // 3. Puntuación de Riesgo Total y Determinación Final
    // La puntuación del cuestionario actúa como un multiplicador o un bono.
    const totalRiskScore = inattentionScore + impulsivityScore + questionnaireScore;
    
    let riskLevelName;
    let recommendation;

    // Umbrales ajustados para ser más sensibles
    if (totalRiskScore >= 10) {
        riskLevelName = "Muy probable";
        recommendation = "Se observan múltiples indicadores significativos y consistentes de inatención e impulsividad, tanto en el desempeño en el juego como en las respuestas del cuestionario. Se recomienda encarecidamente una evaluación formal por parte de un especialista.";
    } else if (totalRiskScore >= 7) {
        riskLevelName = "Probable";
        recommendation = "Se han detectado varios indicadores de inatención y/o impulsividad. Es aconsejable realizar un seguimiento cercano del estudiante, aplicar estrategias de apoyo en el aula y considerar la consulta con un especialista para una evaluación más profunda.";
    } else if (totalRiskScore >= 4) {
        riskLevelName = "Poco probable";
        recommendation = "Se identificaron algunos indicadores leves o inconsistentes. Se sugiere mantener una observación activa del comportamiento y rendimiento del estudiante, y reforzar técnicas de organización y manejo del tiempo en el aula.";
    } else {
        riskLevelName = "Nada probable";
        recommendation = "El rendimiento del estudiante se encuentra dentro de los parámetros esperados. No se observan indicadores significativos de TDAH en esta prueba. Se recomienda continuar fomentando un ambiente de aprendizaje positivo.";
    }

    return {
        riskLevelName,
        recommendation,
        scores: {
            inattention: inattentionScore,
            impulsivity: impulsivityScore,
            questionnaire: questionnaireScore,
            total: totalRiskScore,
        },
        analytics: {
            omissionRatio: (inattentionRatio * 100).toFixed(2),
            commissionRatio: (commissionRatio * 100).toFixed(2),
            avgReactionTime: (reactionTimesMs.length > 0 ? reactionTimesMs.reduce((a, b) => a + b, 0) / reactionTimesMs.length : 0).toFixed(2),
            reactionTimeVariability: reactionTimeVariability.toFixed(2),
        }
    };
};