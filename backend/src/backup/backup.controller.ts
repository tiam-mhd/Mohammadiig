import {
  Body,
  Controller,
  Get,
  HttpCode,
  Logger,
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
import { memoryStorage } from 'multer';
import { AuthUser } from '../auth/jwt.strategy';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { BackupService } from './backup.service';
import { ExportBackupDto, RestoreBackupOptionsDto } from './dto/backup.dto';

type AuthenticatedRequest = Request & { user: AuthUser };

const uploadInterceptor = FileInterceptor('file', {
  storage: memoryStorage(),
  limits: { fileSize: 512 * 1024 * 1024 },
});

@ApiTags('backup')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('backup')
export class BackupController {
  private readonly logger = new Logger(BackupController.name);

  constructor(private readonly backupService: BackupService) {}

  @Get('datasets')
  @ApiOperation({ summary: 'List backup dataset definitions and live counts' })
  async datasets(@Query('includeSoftDeleted') includeSoftDeleted?: string) {
    const soft = includeSoftDeleted !== '0' && includeSoftDeleted !== 'false';
    const [definitions, counts] = await Promise.all([
      Promise.resolve(this.backupService.listDatasets()),
      this.backupService.getDatasetCounts(soft),
    ]);
    return { definitions, counts };
  }

  @Post('export')
  @ApiOperation({ summary: 'Create and download a selective ZIP backup' })
  async export(@Body() dto: ExportBackupDto, @Res() response: Response): Promise<void> {
    const { filePath, fileName, manifest } = await this.backupService.createExportArchive({
      datasets: dto.datasets,
      includeSoftDeleted: dto.includeSoftDeleted,
      includeMediaFiles: dto.includeMediaFiles,
    });
    response.setHeader('Content-Type', 'application/zip');
    response.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    response.setHeader('X-Backup-Datasets', manifest.datasets.join(','));
    response.setHeader('X-Backup-Created-At', manifest.createdAt);
    const stream = this.backupService.streamFile(filePath);
    stream.on('close', () => {
      void this.backupService.cleanupTemp(filePath);
    });
    stream.pipe(response);
  }

  @Post('inspect')
  @HttpCode(200)
  @ApiOperation({ summary: 'Inspect a backup ZIP without restoring' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
      required: ['file'],
    },
  })
  @UseInterceptors(uploadInterceptor)
  inspect(@UploadedFile() file: Express.Multer.File) {
    try {
      return this.backupService.inspectArchive(file);
    } catch (error) {
      this.logger.error(
        `inspect failed: ${error instanceof Error ? error.stack ?? error.message : String(error)}`,
      );
      throw error;
    }
  }

  @Post('restore')
  @HttpCode(200)
  @ApiOperation({ summary: 'Restore selected datasets from a backup ZIP' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        options: { type: 'string', description: 'JSON string of RestoreBackupOptionsDto' },
      },
      required: ['file', 'options'],
    },
  })
  @UseInterceptors(uploadInterceptor)
  async restore(
    @UploadedFile() file: Express.Multer.File,
    @Body('options') optionsRaw: string,
    @Req() request: AuthenticatedRequest,
  ) {
    let options: RestoreBackupOptionsDto;
    try {
      options = JSON.parse(optionsRaw || '{}') as RestoreBackupOptionsDto;
    } catch {
      options = { mode: 'skip' };
    }
    if (!options.mode) options.mode = 'skip';

    try {
      return await this.backupService.restoreArchive(file, {
        datasets: options.datasets,
        mode: options.mode,
        dryRun: options.dryRun,
        restoreMediaFiles: options.restoreMediaFiles,
        protectCurrentAdmin: options.protectCurrentAdmin,
        currentUserId: request.user.userId,
      });
    } catch (error) {
      this.logger.error(
        `restore failed: ${error instanceof Error ? error.stack ?? error.message : String(error)}`,
      );
      throw error;
    }
  }
}
