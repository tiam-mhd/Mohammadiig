import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { createReadStream } from 'node:fs';
import { memoryStorage } from 'multer';
import { AuthUser } from '../auth/jwt.strategy';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import {
  CompressMediaDto,
  ListMediaQueryDto,
  UpdateMediaDto,
  UpdateMediaSettingsDto,
} from './dto/media.dto';
import { MediaService } from './media.service';

type AuthenticatedRequest = Request & { user: AuthUser };

const uploadInterceptor = FileInterceptor('file', {
  storage: memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
});

@ApiTags('media')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Get('settings')
  @ApiOperation({ summary: 'Get media compression defaults' })
  getSettings() {
    return this.mediaService.getSettings();
  }

  @Patch('settings')
  @ApiOperation({ summary: 'Update media compression defaults' })
  updateSettings(@Body() dto: UpdateMediaSettingsDto) {
    return this.mediaService.updateSettings(dto);
  }

  @Get('backup/download')
  @ApiOperation({ summary: 'Download ZIP backup of media library' })
  async backup(@Res() response: Response): Promise<void> {
    const { filePath, fileName } = await this.mediaService.createBackupArchive();
    response.setHeader('Content-Type', 'application/zip');
    response.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    createReadStream(filePath).pipe(response);
  }

  @Post('backup/restore')
  @ApiOperation({ summary: 'Restore media library from ZIP backup' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(uploadInterceptor)
  restoreBackup(@UploadedFile() file: Express.Multer.File) {
    return this.mediaService.restoreFromZip(file);
  }

  @Get()
  @ApiOperation({ summary: 'List media library assets' })
  list(@Query() query: ListMediaQueryDto) {
    return this.mediaService.list(query);
  }

  @Post('upload')
  @ApiOperation({ summary: 'Upload image or video into media library' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        folder: { type: 'string' },
        altText: { type: 'string' },
        title: { type: 'string' },
        caption: { type: 'string' },
        description: { type: 'string' },
        kind: { type: 'string', enum: ['image', 'video'] },
      },
      required: ['file'],
    },
  })
  @UseInterceptors(uploadInterceptor)
  upload(
    @Req() request: AuthenticatedRequest,
    @UploadedFile() file: Express.Multer.File,
    @Body()
    body: {
      folder?: string;
      altText?: string;
      title?: string;
      caption?: string;
      description?: string;
      kind?: 'image' | 'video';
    },
  ) {
    return this.mediaService.upload(request.user, file, body);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one media asset' })
  findOne(@Param('id') id: string) {
    return this.mediaService.findOne(id);
  }

  @Get(':id/usage')
  @ApiOperation({ summary: 'Find references to this media URL' })
  usage(@Param('id') id: string) {
    return this.mediaService.usage(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update SEO / metadata' })
  update(@Param('id') id: string, @Body() dto: UpdateMediaDto) {
    return this.mediaService.update(id, dto);
  }

  @Post(':id/compress')
  @ApiOperation({ summary: 'Compress image (replace or save copy)' })
  compress(@Param('id') id: string, @Body() dto: CompressMediaDto) {
    return this.mediaService.compress(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Move media asset to trash' })
  softDelete(@Param('id') id: string) {
    return this.mediaService.softDelete(id);
  }

  @Post(':id/restore')
  @ApiOperation({ summary: 'Restore media asset from trash' })
  restore(@Param('id') id: string) {
    return this.mediaService.restoreFromTrash(id);
  }

  @Delete(':id/purge')
  @ApiOperation({ summary: 'Permanently delete media asset' })
  purge(@Param('id') id: string) {
    return this.mediaService.purge(id);
  }
}
