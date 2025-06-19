import { pool } from '../db.js';
import PDFDocument from 'pdfkit';
import axios from 'axios';

const primaryColor = '#8552aa';
const secondaryColor = '#157347';

async function generateHeader(doc) {
    try {
        const logoUrl = process.env.CLOUDINARY_IMAGE + 'educativa/educativa-logo';
        if (logoUrl) {
            const response = await axios.get(logoUrl, { responseType: 'arraybuffer' });
            const logoBuffer = Buffer.from(response.data, 'binary');
            doc.image(logoBuffer, 50, 45, { width: 50 });
        }
    } catch (error) {
        console.error("No se pudo cargar el logo desde Cloudinary:", error.message);
    }

    doc
        .fillColor(primaryColor)
        .font('Helvetica-Bold')
        .fontSize(20)
        .text('Educativa Software', 110, 57)
        .fillColor('#444444')
        .font('Helvetica')
        .fontSize(10)
        .text('Reporte de Desempeño Individual', 200, 65, { align: 'right' })
        .moveDown();
}

function generateStudentInfo(doc, student) {
    doc
        .fillColor(secondaryColor)
        .font('Helvetica-Bold')
        .fontSize(12)
        .text(`Reporte para:`, 50, 120)
        .fillColor('#444444')
        .font('Helvetica-Bold')
        .text(`${student.user_name} ${student.user_lastname}`, 50, 135)
        .font('Helvetica')
        .text(`Correo: ${student.user_email}`, 50, 150)
        .text(`Fecha de Generación: ${new Date().toLocaleDateString('es-VE')}`, 50, 165)
        .moveDown();
}

function generateReportTable(doc, testData) {
    const primaryColor = '#8552aa';
    const reportTop = 200;

    doc.font('Helvetica-Bold').fillColor(primaryColor);
    doc.fontSize(10).text('Concepto', 50, reportTop).text('Valor', 350, reportTop, { width: 200, align: 'right' });
    generateHr(doc, reportTop + 20);

    doc.font('Helvetica').fillColor('#444444');

    //console.log(testData)

    const reportItems = [
        { item: "Fecha de la Prueba:", value: new Date(testData.test_date).toLocaleString('es-VE') },
        { item: "Puntuación Final:", value: testData.final_score ?? 'N/A' },
        { item: "Nivel de Riesgo Identificado:", value: testData.risk_name || 'No determinado' },
        { isTitle: true, title: "Indicadores de Desempeño" },
        { item: "Tiempo Promedio de Reacción:", value: testData.reaction_time_avg ? `${parseFloat(testData.reaction_time_avg).toFixed(0)} ms` : 'N/A' },
        { item: "Aciertos:", value: testData.correct_hits ?? 'N/A' },
        { isTitle: true, title: "Indicadores de Inatención" },
        { item: "Errores de Omisión (objetivos ignorados):", value: testData.omission_errors ?? 'N/A' },
        { item: "Colisiones con Objetivos:", value: testData.collision_errors ?? 'N/A' },
        { isTitle: true, title: "Indicadores de Impulsividad" },
        { item: "Errores de Comisión (disparos a no-objetivos):", value: testData.commission_errors ?? 'N/A' },
        { item: "Disparos al Vacío:", value: testData.missed_shots ?? 'N/A' },
    ];

    let position = reportTop + 30;
    reportItems.forEach(item => {
        if (item.isTitle) {
            doc.moveDown(0.5);
            position += 12.5;
            doc.font('Helvetica-Bold').fillColor('#555555').fontSize(10).text(item.title, 50, position);
            position += 25;
            generateHr(doc, position - 10);
        } else {
            doc.font('Helvetica').fillColor('#444444').fontSize(10).text(item.item, 50, position)
                .text(item.value, 350, position, { width: 200, align: 'right' });
            position += 25;
            generateHr(doc, position - 10);
        }
    });

    doc.moveDown(3).font('Helvetica-Bold').fillColor(primaryColor).text('Recomendaciones Generales:', 50);
    doc.font('Helvetica').fillColor('#444444').text(testData.recommendation || 'No se proporcionaron recomendaciones para esta prueba.', { align: 'justify' });
}

function generateFooter(doc) {
    doc
        .fontSize(8)
        .fillColor('#444444')
        .text(
            'Este reporte es una herramienta de apoyo y no constituye un diagnóstico formal. Se recomienda la consulta con un profesional cualificado.',
            50, 720, { align: 'center', width: 500 }
        );
}

function generateHr(doc, y) {
    doc.strokeColor("#aaaaaa").lineWidth(1).moveTo(50, y).lineTo(550, y).stroke();
}


export const generateStudentReport = async (req, res) => {
    try {
        const { testId } = req.params;
        const testQuery = await pool.query(
            `SELECT
                t.id_test, t.test_date, t.final_score, t.recommendation,
                rl.risk_name,
                u.id_user, u.user_name, u.user_lastname, u.user_email,
                tm.reaction_time_avg,
                tm.correct_hits,
                tm.collision_errors,
                tm.omission_errors,
                tm.commission_errors,
                tm.missed_shots
             FROM tests t
             JOIN user_room ur ON t.id_user_room = ur.id_user_room
             JOIN users u ON ur.id_user = u.id_user
             LEFT JOIN risk_levels rl ON t.id_risk_level = rl.id_risk_level
             LEFT JOIN test_metrics tm ON t.id_test = tm.id_test
             WHERE t.id_test = $1`,
            [testId]
        );

        if (testQuery.rowCount === 0) {
            return res.status(404).json({ message: "Prueba no encontrada." });
        }
        const testData = testQuery.rows[0];

        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        const userName = testData.user_name || 'Estudiante';
        const userLastName = testData.user_lastname || '';
        const filename = `Reporte-${userName}-${userLastName}.pdf`.replace(/\s+/g, '_').replace(/__+/g, '_');

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        doc.pipe(res);

        await generateHeader(doc);
        generateStudentInfo(doc, testData);
        generateReportTable(doc, testData);
        generateFooter(doc);

        doc.end();
    } catch (error) {
        console.error("Error generando el reporte PDF:", error);
        res.status(500).json({ message: "Error interno del servidor al generar el reporte." });
    }
};


export const getClassRiskDistribution = async (req, res) => {
    try {
        const { roomId } = req.params;

        const distributionQuery = await pool.query(
            `SELECT
                rl.risk_name,
                COUNT(DISTINCT ur.id_user) AS student_count
            FROM tests t
            JOIN risk_levels rl ON t.id_risk_level = rl.id_risk_level
            JOIN user_room ur ON t.id_user_room = ur.id_user_room
            WHERE ur.id_room = $1
            GROUP BY rl.risk_name
            ORDER BY rl.risk_name;`,
            [roomId]
        );

        res.json(distributionQuery.rows);

    } catch (error) {
        console.error("Error obteniendo la distribución de riesgos:", error);
        res.status(500).json({ message: "Error interno del servidor." });
    }
};