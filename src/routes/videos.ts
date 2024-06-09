import { Router } from 'express';
import { getVideos } from '../controllers/videos';

const router = Router();

router.get('/:videoName/group-of-pictures.json', getVideos);

export default router;
