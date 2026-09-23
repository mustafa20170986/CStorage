import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RustfsService } from './rustfs/rustfs.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, RustfsService],
})
export class AppModule {}
