import { Router } from 'express';
import { getIFrames, getGOPVideo } from '../controllers/videos';

const router = Router();

router.get('/:videoName/group-of-pictures.json', getIFrames);
router.get('/:videoName/group-of-pictures/:groupIndex.mp4', getGOPVideo);

export default router;
