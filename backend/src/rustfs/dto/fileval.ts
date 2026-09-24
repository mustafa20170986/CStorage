import { IsNotEmpty, IsNumber, IsString, Max } from 'class-validator';

export class FilevalidationDTO {
  @IsNotEmpty()
  @IsString()
  filename!: string;

  @IsNotEmpty()
  @IsString()
  filetype!: string;

  @IsNotEmpty()
  @IsNumber()
  @Max(100 * 1024 * 1024, {
    message: 'file exceeds the limit',
  })
  filesize!: number;
}
