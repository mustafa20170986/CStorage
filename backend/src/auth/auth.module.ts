import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { DbModule } from 'src/db/db.module';
import { PassportModule } from '@nestjs/passport';
import { LocalStrategy } from './strategies/passport.stra';
import { JwtStrategy } from './strategies/jwt.strategy';
// import other dependencies like Drizzle module if needed

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_secret || 'access_token_secret',
      signOptions: { expiresIn: '15m' },
    }),
    DbModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, LocalStrategy, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
