import { Request, Response } from 'express';
import { analyzeVideo, checkVideoNameAndGetPath } from '../utils/ffmpeg';
import ffmpeg from 'fluent-ffmpeg';

export async function getIFrames(req: Request, res: Response) {
    const videoName = req.params.videoName;
    const videoFilePath = checkVideoNameAndGetPath(videoName);
    if (!videoFilePath) {
        res.status(404).send('Video not found');
        return;
    }

    try {
        const framesMetadata = await analyzeVideo(videoFilePath);
        res.json(framesMetadata);
    } catch (error) {
        console.error('Error analyzing video:', error);
        res.status(500).send('Error analyzing video');
    }
}

export async function getGOPVideo(req: Request, res: Response) {
    const videoName = req.params.videoName;
    const videoFilePath = checkVideoNameAndGetPath(videoName);

    if (!videoFilePath) {
        res.status(404).send('Video not found');
        return;
    }

    const groupIndex = Number(req.params.groupIndex);
    console.log(groupIndex)

    try {
        const iFrames: any[] = await analyzeVideo(videoFilePath);

        if (groupIndex < 0 || groupIndex >= iFrames.length) {
            res.status(400).send('Invalid group index');
            return;
        }

        console.log(iFrames[groupIndex]);
        const startTime = iFrames[groupIndex]['pts_time'];
        const endTime = (groupIndex + 1 < iFrames.length) ? iFrames[groupIndex + 1]['pts_time'] : null;

        const command = ffmpeg(videoFilePath)
            .setStartTime(startTime)
            .outputOptions('-c copy'); // Copy the codec without re-encoding

        if (endTime) {
            command.setDuration(endTime - startTime);
        }

        res.setHeader('Content-Disposition', `attachment; filename="${groupIndex}.mp4"`);
        res.setHeader('Content-Type', 'video/mp4');

        command
            .format('mp4')
            .on('error', (err) => {
                console.error('Error processing video:', err);
                res.status(500).send('Error processing video');
            })
            .pipe(res, { end: true });

    } catch (error) {
        console.error('Error analyzing video:', error);
        res.status(500).send('Error analyzing video');
    }
}

