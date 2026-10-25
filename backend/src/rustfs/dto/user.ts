import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class Usercredentials {
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  email!: string;
  @IsNotEmpty()
  @IsString()
  @MinLength(6, { message: ' password must be within 6-digits' })
  password!: string;
}
