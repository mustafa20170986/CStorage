import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RustfsService } from './rustfs/rustfs.service';
import { UploadController } from './upload/upload.controller';
import { UploadModule } from './upload/upload.module';
import { TranscodeService } from './transcode/transcode.service';
import { RmqwrokerService } from './rmqwroker/rmqwroker.service';
import { DbModule } from './db/db.module';
import { RustfsModule } from './rustfs/rustfs.module';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { VideoEventListener } from './rmqwroker/rmqlistener';
import { RmqwrokerModule } from './rmqwroker/rmqwroker.module';
import { AuthService } from './auth/auth.service';
import { AuthController } from './auth/auth.controller';
import { AuthModule } from './auth/auth.module';
@Module({
  imports: [
    UploadModule,
    DbModule,
    RustfsModule,
    ConfigModule.forRoot({
      isGlobal: true, // <--- Makes env variables globally available
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    RmqwrokerModule,
    DbModule,
  ],
  controllers: [AppController, UploadController],
  providers: [
    AppService,
    RustfsService,
    TranscodeService,
    RmqwrokerService,
    VideoEventListener,
  ],
})
export class AppModule {}
