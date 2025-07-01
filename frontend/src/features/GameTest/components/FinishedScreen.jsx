import React from 'react';
import './FinishedScreen.css';

const FinishedScreen = ({ finalMetrics, onClose }) => {
    return (
        <div className="finished-screen-overlay">
            <div className="finished-screen-panel">
                <div className="finished-header">
                    <p>// FIN DE LA MISIÓN //</p>
                </div>
                <div className="finished-content">
                    <h2>INFORME DE RENDIMIENTO</h2>

                    <div className="final-score-container">
                        <span className="final-score-label">PUNTUACIÓN FINAL</span>
                        <span className="final-score-value">{finalMetrics?.score || 0}</span>
                    </div>

                    <div className="metrics-grid">
                        <div className="metric-box">
                            <span className="metric-box-label">Meteoritos Destuidos</span>
                            <span className="metric-box-value success">{finalMetrics?.correct_hits || 0}</span>
                        </div>
                        {/* <div className="metric-box">
                            <span className="metric-box-label">Disparos Fallidos</span>
                            <span className="metric-box-value neutral">{finalMetrics?.missed_shots || 0}</span>
                        </div> */}
                        <div className="metric-box">
                            <span className="metric-box-label">Aliados destruidos</span>
                            <span className="metric-box-value error">{finalMetrics?.commission_errors || 0}</span>
                        </div>
                        {/* <div className="metric-box">
                            <span className="metric-box-label">Meteoritos que cayeron en la estación</span>
                            <span className="metric-box-value error">{finalMetrics?.omission_errors || 0}</span>
                        </div> */}
                        {/* <div className="metric-box">
                            <span className="metric-box-label">Colisiones</span>
                            <span className="metric-box-value error">{finalMetrics?.collision_errors || 0}</span>
                        </div> */}
                    </div>
                </div>
                <div className="finished-footer">
                    <button onClick={onClose} className="close-report-button">
                        Cerrar Informe
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FinishedScreen;