import { Request, Response, NextFunction } from 'express';
import { checkVideoNameAndGetPath} from '../utils/ffmpeg';

function checkVideoFile(req: Request, res: Response, next: NextFunction) {
    const videoFilePath = checkVideoNameAndGetPath(req.params.videoName)
    if (videoFilePath) {
        req.params.videoFilePath = videoFilePath;
        next();
    } else {
        res.status(404).send('Video not found');
    }
}

export default checkVideoFile;