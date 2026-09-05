import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttachmentEntity } from './attachment.entity';
import { AttachmentsController } from './attachments.controller';
import { AttachmentsService } from './attachments.service';

@Module({ imports: [PassportModule, TypeOrmModule.forFeature([AttachmentEntity])], controllers: [AttachmentsController], providers: [AttachmentsService] })
export class AttachmentsModule {}
