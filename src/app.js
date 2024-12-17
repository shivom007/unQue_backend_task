import express from 'express';
import bodyParser from 'body-parser';
import "dotenv/config";
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import availabilityRoutes from './routes/availabilityRoutes.js';
import appointmentRoutes from './routes/appointmentRoutes.js';
import { errorHandler } from './middleware/errorHandlerMiddleware.js';
const app = express();

//Middlewares
app.use(cors())
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({extended : true}))
app.use(errorHandler)
//Auth Routes
app.use('/api/v1/auth', authRoutes); 

//Availability Routes
app.use('/api/v1/availability', availabilityRoutes);

//Appointment Routes
app.use('/api/v1/appointment', appointmentRoutes );

export default app

