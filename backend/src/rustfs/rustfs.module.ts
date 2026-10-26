// src/rustfs/rustfs.module.ts
import { Module } from '@nestjs/common';
import { RustfsService } from './rustfs.service';
import { DbModule } from '../db/db.module'; // Import your database module
import { RmqwrokerModule } from 'src/rmqwroker/rmqwroker.module';

@Module({
  imports: [DbModule, RmqwrokerModule], // <--- Required so RustfsService can resolve DRIZZLE_CONNECTION
  providers: [RustfsService],
  exports: [RustfsService],
})
export class RustfsModule {}
