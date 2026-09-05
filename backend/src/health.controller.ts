import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DataSource } from 'typeorm';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly dataSource: DataSource) {}

  @Get()
  @ApiOperation({ summary: 'Check API and database availability' })
  @ApiResponse({ status: 200, description: 'API and database are available' })
  @ApiResponse({ status: 503, description: 'Database is unavailable' })
  async check(): Promise<{ status: string; service: string; database: string; timestamp: string }> {
    if (!this.dataSource.isInitialized) throw new ServiceUnavailableException('Database is unavailable');
    await this.dataSource.query('SELECT 1');
    return { status: 'ok', service: 'mig-api', database: 'ok', timestamp: new Date().toISOString() };
  }
}
