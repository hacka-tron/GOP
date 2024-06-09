import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { Response } from 'express';
import ffmpeg from 'fluent-ffmpeg';
import { PassThrough } from 'stream';
import Ffmpeg from 'fluent-ffmpeg';

const VIDEOS_PATH = '../../videos/';

export function setFFmpegBinaryPath() {
    if (!process.env.FFMPEG_BINARY_PATH) {
        throw new Error('Please set the environment variable for "process.env.FFMPEG_BINARY_PATH"');
    }
    ffmpeg.setFfmpegPath(path.join(process.env.FFMPEG_BINARY_PATH, 'ffmpeg.exe'));
    ffmpeg.setFfprobePath(path.join(process.env.FFMPEG_BINARY_PATH, 'ffprobe.exe'));
}

export function checkVideoNameAndGetPath(name: string): string | undefined {
    const filePath = path.join(__dirname, VIDEOS_PATH, name);
    if (!fs.existsSync(filePath)) {
        return;
    }
    return filePath;
}

export async function getIframeMetadata(videoFilePath: string): Promise<any[]> {
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


export async function getVideoDuration(videoFilePath: string) {
    return new Promise((resolve, reject) => {
        ffmpeg.ffprobe(videoFilePath, (err, metadata) => {
            if (err) {
                reject(err);
            } else {
                resolve(metadata.format.duration);
            }
        });
    });
}

export async function getVideoSegmentCommand(videoFilePath: string, iFrameMetadata: any[], groupIndex: number, res: Response): Promise<ffmpeg.FfmpegCommand> {
    const videoDuration = Number(await getVideoDuration(videoFilePath));
    const startTime = Number(iFrameMetadata[groupIndex].pts_time);
    const endTime = (groupIndex + 1 < iFrameMetadata.length) ? Number(iFrameMetadata[groupIndex + 1].pts_time) : videoDuration;
    const duration = endTime - startTime;

    // Configure ffmpeg to stream the video directly
    return ffmpeg(videoFilePath)
        .setStartTime(startTime)
        .setDuration(duration)
        .outputOptions('-c', 'copy') // Copy without re-encoding
        .outputOptions('-movflags', 'frag_keyframe+empty_moov+faststart') // Make the MP4 container suitable for streaming
        .format('mp4'); // Use MP4 format
}