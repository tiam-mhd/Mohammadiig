import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { Repository } from 'typeorm';
import { AuthUser } from '../auth/jwt.strategy';
import { CreateAttachmentDto } from './dto/create-attachment.dto';
import { AttachmentEntity } from './attachment.entity';

@Injectable()
export class AttachmentsService {
  constructor(@InjectRepository(AttachmentEntity) private readonly attachments: Repository<AttachmentEntity>) {}
  async create(user: AuthUser, dto: CreateAttachmentDto): Promise<AttachmentEntity> { return this.attachments.save(this.attachments.create({ id: randomUUID(), ownerType: dto.ownerType as AttachmentEntity['ownerType'], ownerId: dto.ownerId, fileName: dto.fileName, fileUrl: dto.fileUrl, fileSize: dto.fileSize ?? null, fileType: dto.fileType ?? null, uploadedBy: user.userId })); }
  findByOwner(ownerType: string, ownerId: string): Promise<AttachmentEntity[]> { return this.attachments.find({ where: { ownerType: ownerType as AttachmentEntity['ownerType'], ownerId } }); }
  findAll(): Promise<AttachmentEntity[]> { return this.attachments.find({ order: { uploadedAt: 'DESC' } }); }
  async remove(id: string): Promise<void> {
    const attachment = await this.attachments.findOne({ where: { id } });
    if (!attachment) throw new NotFoundException('فایل پیدا نشد');
    await this.attachments.remove(attachment);
  }
}
