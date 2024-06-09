import { Router } from 'express';
import { getIFrames, getGOPVideo } from '../controllers/videos';
import checkVideoFile from '../middleware/checkVideoFile';

const router = Router();

router.get('/:videoName/group-of-pictures.json', checkVideoFile, getIFrames);
router.get('/:videoName/group-of-pictures/:groupIndex.mp4', checkVideoFile, getGOPVideo);

export default router;
