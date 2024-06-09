import { Request, Response } from 'express';
import { analyszeVideo, checkVideoNameAndGetPath} from '../utils/ffmpeg';

export function getVideos(req: Request, res: Response) {
    const videoName = req.params.videoName;
    const videoFileName = checkVideoNameAndGetPath(videoName);
    if (!videoFileName){
        res.send('problem');
        return 
    }
    console.log(analyszeVideo(videoFileName));
    res.send('Video route');
}