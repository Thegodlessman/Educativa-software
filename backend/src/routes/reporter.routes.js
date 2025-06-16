import { Router } from 'express';
import { generateStudentReport } from '../controllers/report.controller.js';

const reportRouter = Router();

reportRouter.get('/reports/test/:testId', generateStudentReport);

export default reportRouter;