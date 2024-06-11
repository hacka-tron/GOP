import { Request, Response } from 'express';
import { getIframeMetadata, getVideoSegmentCommand, getVideoDuration } from '../utils/ffmpeg';
import { PassThrough } from 'stream';

export async function getIFrames(req: Request, res: Response) {
    try {
        const framesMetadata = await getIframeMetadata(req.params.videoFilePath);
        res.json(framesMetadata);
    } catch (error) {
        console.error('Error analyzing video:', error);
        res.status(500).send('Error analyzing video');
    }
}

export async function getGOPVideo(req: Request, res: Response) {
    const groupIndex = Number(req.params.groupIndex);
    const videoFilePath = req.params.videoFilePath;
    const iFrameMetadata = await getIframeMetadata(videoFilePath);

    if (groupIndex < 0 || groupIndex >= iFrameMetadata.length) {
        res.status(400).send('Invalid iFrame index');
        return;
    }

    try {
        const videoDuration = Number(await getVideoDuration(videoFilePath));
        const startTime = Number(iFrameMetadata[groupIndex].pts_time);
        const endTime = (groupIndex + 1 < iFrameMetadata.length) ? Number(iFrameMetadata[groupIndex + 1].pts_time) : videoDuration;
        const duration = endTime - startTime;

        const process = await getVideoSegmentCommand(videoFilePath, startTime, duration);
        const passThrough = new PassThrough();

        process.on('error', (err, stdout, stderr) => {
            console.error('Error during processing: ', err);
            console.error('ffmpeg stderr: ', stderr);
            res.status(500).send('Error processing video');
        }).pipe(passThrough);

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

export async function getAllGOPVideos(req: Request, res: Response) {
    const videoFilePath = req.params.videoFilePath;
    const iFrameMetadata = await getIframeMetadata(videoFilePath);

    if (!iFrameMetadata || iFrameMetadata.length === 0) {
        res.status(400).send('No iFrame metadata found');
        return;
    }

    try {
        let htmlContent = `
            <style>
                .video-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                }
                .video-item {
                    display: flex;
                    flex-direction: column;
                }
                .video-item video {
                    width: 100%;
                    max-width: 300px;
                    height: auto;
                }
            </style>
            <div class="video-grid">
        `;
        
        const videoDuration = Number(await getVideoDuration(videoFilePath));
        for (let groupIndex = 0; groupIndex < iFrameMetadata.length; groupIndex++) {
            const startTime = Number(iFrameMetadata[groupIndex].pts_time);
            const endTime = (groupIndex + 1 < iFrameMetadata.length) ? Number(iFrameMetadata[groupIndex + 1].pts_time) : videoDuration;
            const duration = endTime - startTime;

            const process = await getVideoSegmentCommand(req.params.videoFilePath, startTime, duration);
            const passThrough = new PassThrough();

            process.on('error', (err, stdout, stderr) => {
                console.error('Error during processing: ', err);
                console.error('ffmpeg stderr: ', stderr);
            }).pipe(passThrough);

            htmlContent += `
                <div class="video-item">
                    <h1>Group ${groupIndex + 1}</h1>
                    <p>From ${startTime.toFixed(6)} to ${(startTime + duration).toFixed(6)}</p>
                    <video controls>
                        <source src="data:video/mp4;base64,${(await streamToBase64(passThrough)).toString('base64')}" type="video/mp4">
                        Your browser does not support the video tag.
                    </video> 
                </div>
            `;
        }

        htmlContent += '</div>';

        // Set headers and send the HTML response
        res.setHeader('Content-Type', 'text/html');
        res.send(htmlContent);

    } catch (error) {
        console.error('Error analyzing video:', error);
        res.status(500).send('Error analyzing video');
    }
}

// Helper function to convert stream to base64
function streamToBase64(stream: PassThrough): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const chunks: any = [];
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', reject);
    });
}