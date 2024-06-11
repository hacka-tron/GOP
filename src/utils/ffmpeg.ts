import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import ffmpeg from 'fluent-ffmpeg';

const VIDEOS_PATH = '../../videos/';

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

export async function getVideoSegmentCommand(videoFilePath: string, startTime: number, duration: number): Promise<ffmpeg.FfmpegCommand> {
    // Configure ffmpeg to stream the video directly
    return ffmpeg(videoFilePath)
        .setStartTime(startTime)
        .setDuration(duration)
        .outputOptions('-c', 'copy') // Copy without re-encoding
        .outputOptions('-movflags', 'frag_keyframe+empty_moov+faststart') // Make the MP4 container suitable for streaming
        .format('mp4'); // Use MP4 format
}