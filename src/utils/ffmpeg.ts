import fs from 'fs';
import path from 'path';
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
    if (!fs.existsSync(filePath)) {
        return;
    }
    return filePath;
}

export async function analyszeVideo(videoFilePath: string) {
    return new Promise((resolve, reject) => {
        ffmpeg(videoFilePath)
            .outputOptions([
                '-vf', 'select=eq(pict_type\\,I)', // Select only I frames
                '-show_entries', 'frame=pkt_pts_time', // Show timestamps of I frames
                '-of', 'json' // Output in JSON format
            ])
            .on('error', (err) => {
                reject(err);
            })
            .on('end', (stdout: any) => {
                const framesMetadata = JSON.parse(stdout);
                console.log(framesMetadata)
                resolve(framesMetadata);
            })
            .save('null'); // Output to null to discard the frames
    });
}