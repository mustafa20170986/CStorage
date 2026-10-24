import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as amqp from 'amqplib';
import { TranscodeService } from '../transcode/transcode.service';

@Injectable()
export class VideoEventListener implements OnModuleInit {
  private readonly logger = new Logger(VideoEventListener.name);
  private channel: amqp.Channel;
  private connection: any;

  constructor(private readonly transcodeService: TranscodeService) {}

  async onModuleInit() {
    try {
      const cloudamqpUrl = process.env.CLOUDAMQP_URL || 'amqp://localhost:5672';
      this.connection = await amqp.connect(cloudamqpUrl);
      this.channel = await this.connection.createChannel();

      const exchange = 'VIDEO_EXCHANGE';
      const queue = 'video_queue';

      await this.channel.assertExchange(exchange, 'direct', { durable: true });
      await this.channel.assertQueue(queue, { durable: true });
      await this.channel.bindQueue(queue, exchange, 'video.uploaded');

      this.logger.log(
        'VideoEventListener connected to CloudAMQP and listening for events...',
      );

      // Start consuming messages manually via amqplib channel
      await this.channel.consume(queue, async (msg) => {
        if (msg !== null) {
          try {
            const data = JSON.parse(msg.content.toString());
            this.logger.log(
              `Received video.uploaded event for key: ${data.filekey}`,
            );

            // Trigger your transcoding workflow
            await this.transcodeService.transcoding(data.filekey);

            // Acknowledge the message upon successful processing
            this.channel.ack(msg);
            this.logger.log(
              `Successfully processed and ACKed event for: ${data.filekey}`,
            );
          } catch (error) {
            this.logger.error('Error processing video transcode event:', error);
            // Nack without requeue to prevent loops if payload fails
            this.channel.nack(msg, false, false);
          }
        }
      });
    } catch (error) {
      this.logger.error(
        'Failed to initialize VideoEventListener consumer:',
        error,
      );
    }
  }
}
