import express from 'express';
import cors from 'cors';
import http from 'http';
import dotenv from 'dotenv';

import videoRoutes from './routes/videos';

dotenv.config();

const PORT = process.env.PORT || 3000;
const app = express();
const server = http.createServer(app);

app.use('/videos', videoRoutes)

app.use(cors());
app.use(express.json());

server.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});