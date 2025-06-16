import { Router } from 'express';
import { generateStudentReport, getClassRiskDistribution } from '../controllers/report.controller.js';

const reportRouter = Router();

reportRouter.get('/reports/test/:testId', generateStudentReport);
reportRouter.get('/reports/class/:roomId/risk-distribution', getClassRiskDistribution)

export default reportRouter;