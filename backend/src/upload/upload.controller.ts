import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
  UploadedFile,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { FilevalidationDTO } from 'src/rustfs/dto/fileval';
import { RustfsService } from 'src/rustfs/rustfs.service';

@Controller('upload')
export class UploadController {
  constructor(private readonly rustfsService: RustfsService) {}
  @Post('init')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async initmultipart(@Body() dto: FilevalidationDTO) {
    const res = await this.rustfsService.initmultipart(
      dto.filename,
      dto.filetype,
    );
    return { success: true, data: res };
  }
  @Post('getpresigned')
  @HttpCode(HttpStatus.OK)
  async getpresignedurl(
    @Body() body: { filekey: string; uploadId: string; totalparts: number },
  ) {
    const res = await this.rustfsService.presignedpart(
      body.filekey,
      body.uploadId,
      body.totalparts,
    );
    return { success: true, data: res };
  }
  @Post('complete')
  @HttpCode(HttpStatus.OK)
  async completeuplaod(
    @Body() body: any, // Use `any` temporarily to inspect everything
  ) {
    console.log('--- COMPLETE UPLOAD BODY RECEIVED ---', body);

    if (!body.userId) {
      throw new Error('userId is missing from request body!');
    }

    const res = await this.rustfsService.completeuplaod(
      body.filekey,
      body.uploadid,
      body.parts,
      body.userId,
    );

    return { success: true, data: res };
  }

  @Post('abort')
  @HttpCode(HttpStatus.OK)
  async abortuhplaod(@Body() body: { filekey: string; uploadid: string }) {
    const res = await this.rustfsService.abortmultipart(
      body.filekey,
      body.uploadid,
    );
    return { success: true, data: res };
  }
  @Post('imageupload')
  @UseInterceptors(FileInterceptor('image'))
  async imageupload(
    @UploadedFile() file: Express.Multer.File,
    @Body('userId') userId: string,
  ) {
    if (!userId) {
      throw new Error('userid not fund');
    }
    if (!file) {
      throw new Error(' file not found');
    }
    if (!file.mimetype.startsWith('image/')) {
      throw new Error('this type is not supported');
    }
    return this.rustfsService.imageupload(file, userId);
  }
}
