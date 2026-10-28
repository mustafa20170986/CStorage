import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { promisify } from 'util';
const execPromise = promisify(exec);

@Injectable()
export class TranscodeService {
  private readonly s3Client: S3Client;
  private readonly logger = new Logger(TranscodeService.name);

  constructor() {
    this.s3Client = new S3Client({
      region: 'us-east-1',
      endpoint: 'http://localhost:9000',
      forcePathStyle: true,
      credentials: {
        accessKeyId: process.env.RUSTFS_ACCESS_KEY!,
        secretAccessKey: process.env.RUSTFS_SECRET_KEY!,
      },
    });
  }

  async transcoding(filekey: string) {
    // Use the system's official temp directory (e.g., C:\Users\HP\AppData\Local\Temp)
    const tempdir = path.join(os.tmpdir(), 'nest-video-temp');

    const inputpath = path.join(
      tempdir,
      `input-${Date.now()}-${path.basename(filekey)}`,
    );
    const outputFilename = `720p-${Date.now()}-${path.basename(filekey, path.extname(filekey))}.mp4`;
    const outputpath = path.join(tempdir, outputFilename);

    try {
      if (!fs.existsSync(tempdir)) {
        fs.mkdirSync(tempdir, { recursive: true });
      }

      this.logger.log(`Downloading video from storage: ${filekey}`);
      const downloadVideo = new GetObjectCommand({
        Bucket: 'cstorage',
        Key: filekey,
      });
      const s3response = await this.s3Client.send(downloadVideo);

      const streamfile = fs.createWriteStream(inputpath);
      await new Promise((resolve, reject) => {
        (s3response.Body as NodeJS.ReadableStream).pipe(streamfile);
        streamfile.on('finish', () => resolve(true));
        streamfile.on('error', reject);
      });
      this.logger.log(`Source video downloaded successfully to: ${inputpath}`);

      this.logger.log('Transcoding video to 720p via FFmpeg...');

      // 🟢 Use absolute path to FFmpeg binary to avoid Windows shell lookup issues
      const ffmpegPath = 'C:\\ffmpeg\\bin\\ffmpeg.exe';
      const ffmpegCommand = `"${ffmpegPath}" -i "${inputpath}" -vf scale=-2:720 -c:v libx264 -preset fast -crf 23 -c:a aac "${outputpath}"`;

      const { stderr } = await execPromise(ffmpegCommand);
      this.logger.log('FFmpeg process finished.');
      if (stderr) {
        this.logger.debug(stderr);
      }

      if (!fs.existsSync(outputpath)) {
        throw new Error(
          'FFmpeg completed but output 720p file was not found on disk.',
        );
      }

      const fileBuffer = fs.readFileSync(outputpath);

      this.logger.log('Uploading transcoded video back to RustFS...');
      const outputkey = `transcoded/${outputFilename}`;

      const putBackVideo = new PutObjectCommand({
        Bucket: 'cstorage',
        Key: outputkey,
        Body: fileBuffer,
        ContentType: 'video/mp4',
      });

      await this.s3Client.send(putBackVideo);
      this.logger.log(
        'Video successfully uploaded to RustFS under transcoded folder.',
      );
    } catch (error) {
      this.logger.error('Error during video transcoding pipeline:', error);
    } finally {
      if (fs.existsSync(inputpath)) {
        try {
          fs.unlinkSync(inputpath);
        } catch (e) {}
      }
      if (fs.existsSync(outputpath)) {
        try {
          fs.unlinkSync(outputpath);
        } catch (e) {}
      }
    }
  }
}
