import { Request, Response } from 'express';
import { getIframeMetadata, checkVideoNameAndGetPath, getVideoSegmentCommand} from '../utils/ffmpeg';
import { PassThrough } from 'stream';

export async function getIFrames(req: Request, res: Response) {
    const videoName = req.params.videoName;
    const videoFilePath = checkVideoNameAndGetPath(videoName);
    if (!videoFilePath) {
        res.status(404).send('Video not found');
        return;
    }

    try {
        const framesMetadata = await getIframeMetadata(videoFilePath);
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
    const iFrameMetadata = await getIframeMetadata(videoFilePath);

    if (groupIndex < 0 || groupIndex >= iFrameMetadata.length) {
        res.status(400).send('Invalid iFrame index');
        return;
    }

    try {
        const process = await getVideoSegmentCommand(videoFilePath, iFrameMetadata, groupIndex, res);
        const passThrough = new PassThrough();

        process.on('start', (commandLine) => {
            console.log('Spawned ffmpeg with command: ' + commandLine);
        })
            .on('error', (err, stdout, stderr) => {
                console.error('Error during processing: ', err);
                console.error('ffmpeg stderr: ', stderr);
                res.status(500).send('Error processing video');
            })
            .on('end', () => {
                console.log('Processing finished successfully');
            })
            .pipe(passThrough);

        // Set headers and pipe the stream to the response
        res.setHeader('Content-Type', 'video/mp4');
        res.setHeader('Content-Disposition', 'inline');
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Cache-Control', 'no-cache');
        passThrough.pipe(res);

    } catch (error) {
        console.error('Error analyzing video:', error);
        res.status(500).send('Error analyzing video');
    }
}