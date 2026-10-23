import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';
import { VideoEventListener } from './rmqlistener'; // Adjust path to your listener file
import { TranscodeService } from '../transcode/transcode.service'; // Adjust path to your transcode service

@Module({
  imports: [ConfigModule],
  providers: [
    TranscodeService,
    VideoEventListener,
    {
      provide: 'VIDEO_AMQP_CHANNEL',
      useFactory: async (configService: ConfigService) => {
        const cloudamqp =
          configService.get<string>('CLOUDAMQP_URL') || 'amqp://localhost:5672';
        const connect = await amqp.connect(cloudamqp);
        const channel = await connect.createChannel();

        const exchange = 'VIDEO_EXCHANGE';
        const queue = 'video_queue';

        await channel.assertExchange(exchange, 'direct', { durable: true });
        await channel.assertQueue(queue, { durable: true });
        await channel.bindQueue(queue, exchange, 'video.uploaded');

        return channel;
      },
      inject: [ConfigService],
    },
  ],
})
export class RmqwrokerModule {}
