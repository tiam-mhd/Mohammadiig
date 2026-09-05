import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthUser } from '../auth/jwt.strategy';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateAttachmentDto } from './dto/create-attachment.dto';
import { AttachmentsService } from './attachments.service';

type AuthenticatedRequest = Request & { user: AuthUser };

@ApiTags('attachments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('attachments')
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) {}
  @Post() @ApiOperation({ summary: 'Register an uploaded attachment' }) create(@Req() request: AuthenticatedRequest, @Body() dto: CreateAttachmentDto) { return this.attachmentsService.create(request.user, dto); }
  @Get() @ApiOperation({ summary: 'List attachments by owner' }) findByOwner(@Query('ownerType') ownerType: string, @Query('ownerId') ownerId: string) { return this.attachmentsService.findByOwner(ownerType, ownerId); }
}
