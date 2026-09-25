import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
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
    @Body() body: { filekey: string; upalodId: string; totalparts: number },
  ) {
    const res = await this.rustfsService.presignedpart(
      body.filekey,
      body.upalodId,
      body.totalparts,
    );
    return { success: true, data: res };
  }
  @Post('complete')
  @HttpCode(HttpStatus.OK)
  async completeuplaod(
    @Body()
    body: {
      filekey: string;
      uploadid: string;
      parts: { partnumber: number; etag: string }[];
    },
  ) {
    const res = await this.rustfsService.completeuplaod(
      body.filekey,
      body.uploadid,
      body.parts,
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
}
