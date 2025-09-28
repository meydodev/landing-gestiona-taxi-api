

import express from 'express';
import cors from 'cors';
import DownloadCounterRoutes from './routes/downloadCounterRoutes';
import ReviewsRoutes from './routes/reviewsRoutes';
import { errorHandler } from './middlewares/errorHandler';

const app = express();

const corsOptions: cors.CorsOptions = {
  origin: ['http://localhost:4200', 'http://127.0.0.1:4200', 'https://www.gestionataxi.es'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

app.use(express.json());

// Routes
app.use('/api/downloadsCounter', DownloadCounterRoutes);
app.use('/api/reviews', ReviewsRoutes);


app.use(errorHandler);

export default app;
