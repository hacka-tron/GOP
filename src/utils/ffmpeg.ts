import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import ffmpeg from 'fluent-ffmpeg';

const VIDEOS_PATH = '../videos/';

export function setFFmpegBinaryPath() {
    if (!process.env.FFMPEG_BINARY_PATH) {
        throw new Error('Please set the environment variable for "process.env.FFMPEG_BINARY_PATH"');
    }
    ffmpeg.setFfmpegPath(path.join(process.env.FFMPEG_BINARY_PATH, 'ffmpeg.exe'));
    ffmpeg.setFfprobePath(path.join(process.env.FFMPEG_BINARY_PATH, 'ffprobe.exe'));
}

export function checkVideoNameAndGetPath(name: string): string | undefined {
    const filePath = path.join(__dirname, VIDEOS_PATH, name);
    console.log(name);
    if (!fs.existsSync(filePath)) {
        return;
    }
    return filePath;
}

export async function analyzeVideo(videoFilePath: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
        const command = `ffprobe -show_frames -print_format json "${videoFilePath}"`;

        exec(command, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
            if (error) {
                reject(`Error: ${stderr}`);
                return;
            }

            try {
                const frames = JSON.parse(stdout)['frames'].filter((frame: any) => frame['pict_type'] == 'I');
                resolve(frames);
            } catch (parseError) {
                reject(`Failed to parse JSON: ${parseError}`);
            }
        });
    });
}


// export async function getVideoWithIndex(videoFilePath: string, groupIndex: number): Promise<any | undefined> {
//     return new Promise((resolve, reject) => {
//     const iFrames: any[] = await analyzeVideo(videoFilePath);

//     if (groupIndex < 0 || groupIndex >= iFrames.length) {
//         reject('Invalid group index');
//         return;
//     }

//     const startTime = iFrames[groupIndex].pkt_pts_time;
//     const endTime = (groupIndex + 1 < iFrames.length) ? iFrames[groupIndex + 1].pkt_pts_time : null;

//     const command = ffmpeg(videoFilePath)
//         .setStartTime(startTime)
//         .outputOptions('-c copy'); // Copy the codec without re-encoding

//     if (endTime) {
//         command.setDuration(endTime - startTime);
//     }

//     res.setHeader('Content-Disposition', `attachment; filename="${groupIndex}.mp4"`);
//     res.setHeader('Content-Type', 'video/mp4');

//     command
//         .format('mp4')
//         .on('error', (err) => {
//             console.error('Error processing video:', err);
//             res.status(500).send('Error processing video');
//         })
//         .pipe(res, { end: true });

// } catch (error) {
//     console.error('Error analyzing video:', error);
//     res.status(500).send('Error analyzing video');
// }
// }