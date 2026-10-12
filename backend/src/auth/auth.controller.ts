import {
  Body,
  Controller,
  Post,
  Request,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Usercredentials } from 'src/rustfs/dto/user';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async Signup(@Body() dto: Usercredentials) {
    return this.authService.signup(dto);
  }
  @Post('login')
  @UseGuards(AuthGuard('local'))
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async Login(@Request() req, @Body() dto: Usercredentials) {
    return this.authService.signin(req.user);
  }
}
