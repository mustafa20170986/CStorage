import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import * as amqp from 'amqplib';
import { Interval } from '@nestjs/schedule';
import { asc, eq } from 'drizzle-orm';
import * as schema from '../db/schema';
import { DRIZZLE } from '../db/drizzle';

@Injectable()
export class RmqwrokerService implements OnModuleInit {
  private readonly logger = new Logger(RmqwrokerService.name);
  private channel: amqp.Channel;
  private connection: any;

  constructor(
    @Inject(DRIZZLE) private drizzle: PostgresJsDatabase<typeof schema>,
  ) {}

  async onModuleInit() {
    try {
      const cloudamqpUrl = process.env.CLOUDAMQP_URL || 'amqp://localhost:5672';
      this.connection = await amqp.connect(cloudamqpUrl);
      this.channel = await this.connection.createChannel();

      // 1. Assert Exchange and Queue matching your event architecture
      const exchange = 'VIDEO_EXCHANGE';
      const queue = 'video_queue';

      await this.channel.assertExchange(exchange, 'direct', { durable: true });
      await this.channel.assertQueue(queue, { durable: true });
      await this.channel.bindQueue(queue, exchange, 'video.uploaded');

      this.logger.log(
        'Connected to RabbitMQ and initialized exchange/queue successfully.',
      );
    } catch (error) {
      this.logger.error('Failed to connect to RabbitMQ:', error);
    }
  }

  @Interval(5000)
  async RmqWorker() {
    if (!this.channel) return;
    try {
      // 2. Fetch pending outbox events from PostgreSQL
      const pendingEvents = await this.drizzle
        .select()
        .from(schema.outboxEvents)
        .where(eq(schema.outboxEvents.processed, false))
        .orderBy(asc(schema.outboxEvents.createdAt))
        .limit(10);

      for (const event of pendingEvents) {
        // 3. Publish to the direct exchange using the exact eventType routing key ('video.uploaded')
        const exchange = 'VIDEO_EXCHANGE';
        const routingKey = event.eventType; // 'video.uploaded'

        const success = this.channel.publish(
          exchange,
          routingKey,
          Buffer.from(event.payload),
          { persistent: true },
        );

        if (success) {
          await this.drizzle
            .update(schema.outboxEvents)
            .set({ processed: true })
            .where(eq(schema.outboxEvents.id, event.id));

          this.logger.log(
            `Published and marked outbox event ${event.id} as processed.`,
          );
        }
      }
    } catch (error) {
      this.logger.error('Error in RmqWorker interval:', error);
    }
  }
}
