import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  S3Client,
  UploadPartCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable } from '@nestjs/common';

@Injectable()
export class RustfsService {
  //initalize bucket name
  private bucketName: string;
  //initialize s3 client
  private s3Client: S3Client;

  constructor() {
    this.bucketName = process.env.RUSTFS_BUCKET_NAME || 'CStroage';
    this.s3Client = new S3Client({
      region: 'us-east-1',
      endpoint: process.env.RUSTFS_ENDPOINT!,
      credentials: {
        accessKeyId: process.env.RUSTFS_ACCESS_KEY!,
        secretAccessKey: process.env.RUSTFS_SECRET_KEY!,
      },
      forcePathStyle: true, // Required for local S3/RustFS engines
      requestChecksumCalculation: 'WHEN_REQUIRED', // Prevents local BadDigest errors
      responseChecksumValidation: 'WHEN_REQUIRED',
    });
  }

  async initmultipart(filname: string, filetype: string) {
    try {
      //unique identifyier for file key
      const up = Date.now() + '-' + Math.round(Math.random() * 1e9);
      //file key is the destination where does the datastore
      const filekey = `${up}-${filname}`;

      const command = new CreateMultipartUploadCommand({
        Bucket: this.bucketName,
        Key: filekey,
        ContentType: filetype,
      });
      //send the  commanad .
      const resposne = await this.s3Client.send(command);
      //we will get back the upalod id which is the session id and
      // we need the file key as it is the destination
      return { uploadId: resposne.UploadId, filekey };
    } catch (error) {
      throw new Error('multipart init error', error);
    }
  }

  async presignedpart(filekey: string, uploadId: string, totalparts: number) {
    try {
      //initializing an empty array to store the partnmebr and
      //coresponding presigned url
      const url: { partnumber: number; presignedurl: string }[] = [];
      for (let partnumber = 1; partnumber <= totalparts; partnumber++) {
        //genertae presigned url for every part
        const command = new UploadPartCommand({
          Bucket: this.bucketName,
          Key: filekey,
          UploadId: uploadId,
          PartNumber: partnumber,
        });
        //signed the url with attached headers and expires time
        const presignedurl = await getSignedUrl(this.s3Client, command, {
          expiresIn: 3600,
          unhoistableHeaders: new Set([
            'x-amz-checksum-algorithm',
            'x-amz-sdk-checksum-algorithm',
          ]),
        });
        // push the link with part numbe in the array
        url.push({ partnumber, presignedurl });
      }
      //return the urls of the parts
      return { parts: url };
    } catch (error) {
      throw new Error('failed to presigned url for parts', error);
    }
  }
  async completeuplaod(
    filekey: string,
    upalodid: string,
    parts: { partnumber: number; etag: string }[],
  ) {
    try {
      const command = new CompleteMultipartUploadCommand({
        Bucket: this.bucketName,
        Key: filekey,
        UploadId: upalodid,
        MultipartUpload: {
          // parts needed to be sorted
          // as newtwork is unpredictable
          Parts: parts
            .sort((a, b) => a.partnumber - b.partnumber)
            .map((p) => ({
              PartNumber: p.partnumebr,
              ETag: p.etag,
            })),
        },
      });
      const reposne = await this.s3Client.send(command);
      return {
        localtion: reposne.Location,
        filekey,
      };
    } catch (error) {
      throw new Error('failed to compelte', error);
    }
  }
  async abortmultipart(filekey: string, upalodid: string) {
    try {
      const command = new AbortMultipartUploadCommand({
        Bucket: this.bucketName,
        Key: filekey,
        UploadId: upalodid,
      });
      await this.s3Client.send(command);
    } catch (error) {
      throw new Error(' failed to abort multipart', error);
    }
  }
}
