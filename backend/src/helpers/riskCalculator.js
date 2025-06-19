function calculateStandardDeviation(arr) {
    if (arr.length < 2) return 0;
    const mean = arr.reduce((acc, val) => acc + val, 0) / arr.length;
    const variance = arr.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / arr.length;
    return Math.sqrt(variance);
}

export const calculateRiskProfile = (metrics) => {
    const DURATION_MINUTES = (metrics.totalGameDuration || 1) / 60; 

    const reactionTimesMs = metrics.reactionTimes.map(rt => rt.time);
    const avgReactionTime = reactionTimesMs.length > 0
        ? reactionTimesMs.reduce((a, b) => a + b, 0) / reactionTimesMs.length
        : 0;
    const reactionTimeVariability = calculateStandardDeviation(reactionTimesMs);

    const omissionRate = (metrics.omission_errors || 0) / DURATION_MINUTES;
    const commissionRate = (metrics.commission_errors || 0) / DURATION_MINUTES;
    const collisionRate = (metrics.collision_errors || 0) / DURATION_MINUTES;

    let inattentionScore = 0;
    if (omissionRate > 2) inattentionScore += 2;
    if (omissionRate > 4) inattentionScore += 3;
    if (reactionTimeVariability > 250) inattentionScore += 2;
    if (reactionTimeVariability > 400) inattentionScore += 3;

    let impulsivityScore = 0;
    if (commissionRate > 1.5) impulsivityScore += 2;
    if (commissionRate > 3) impulsivityScore += 3; 
    if (collisionRate > 1) impulsivityScore += 2;
    
    let processingSpeedScore = 0;
    if (avgReactionTime > 750) processingSpeedScore += 1;
    if (avgReactionTime > 900) processingSpeedScore += 2;

    const totalRiskScore = inattentionScore + impulsivityScore + processingSpeedScore;

    let riskLevelName;
    let recommendation;

    if (totalRiskScore >= 9) {
        riskLevelName = "Muy probable";
        recommendation = "Se observan múltiples indicadores significativos de inatención e impulsividad. Se recomienda encarecidamente una evaluación formal por parte de un especialista (psicólogo, psicopedagogo o neuropediatra) para un diagnóstico preciso y un plan de intervención adecuado.";
    } else if (totalRiskScore >= 6) {
        riskLevelName = "Probable";
        recommendation = "Se han detectado varios indicadores de inatención y/o impulsividad. Es aconsejable realizar un seguimiento cercano del estudiante, aplicar estrategias de apoyo en el aula y considerar la consulta con un especialista para una evaluación más profunda.";
    } else if (totalRiskScore >= 3) {
        riskLevelName = "Poco probable";
        recommendation = "Se identificaron algunos indicadores leves o inconsistentes. Se sugiere mantener una observación activa del comportamiento y rendimiento del estudiante, y reforzar técnicas de organización y manejo del tiempo en el aula.";
    } else {
        riskLevelName = "Nada probable";
        recommendation = "El rendimiento del estudiante se encuentra dentro de los parámetros esperados para su edad. No se observan indicadores significativos de TDAH en esta prueba. Se recomienda continuar fomentando un ambiente de aprendizaje positivo.";
    }

    return {
        riskLevelName,
        recommendation,
        scores: {
            inattention: inattentionScore,
            impulsivity: impulsivityScore,
            processingSpeed: processingSpeedScore,
            total: totalRiskScore,
        },
        analytics: {
            omissionRate: omissionRate.toFixed(2),
            commissionRate: commissionRate.toFixed(2),
            avgReactionTime: avgReactionTime.toFixed(2),
            reactionTimeVariability: reactionTimeVariability.toFixed(2),
        }
    };
};