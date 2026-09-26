import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { randomUUID } from "node:crypto";
import { Repository } from "typeorm";
import { AuthUser } from "../auth/jwt.strategy";
import { toRelativeMediaPath } from "../media/media-paths";
import { CreateAttachmentDto } from "./dto/create-attachment.dto";
import { AttachmentEntity } from "./attachment.entity";

@Injectable()
export class AttachmentsService {
  constructor(
    @InjectRepository(AttachmentEntity)
    private readonly attachments: Repository<AttachmentEntity>,
  ) {}
  async create(
    user: AuthUser,
    dto: CreateAttachmentDto,
  ): Promise<AttachmentEntity> {
    return this.attachments.save(
      this.attachments.create({
        id: randomUUID(),
        ownerType: dto.ownerType as AttachmentEntity["ownerType"],
        ownerId: dto.ownerId,
        fileName: dto.fileName,
        fileUrl: toRelativeMediaPath(dto.fileUrl) || dto.fileUrl.trim(),
        fileSize: dto.fileSize ?? null,
        fileType: dto.fileType ?? null,
        uploadedBy: user.userId,
      }),
    );
  }
  findByOwner(ownerType: string, ownerId: string): Promise<AttachmentEntity[]> {
    return this.attachments.find({
      where: { ownerType: ownerType as AttachmentEntity["ownerType"], ownerId },
    });
  }
  async findAll(page = 1, limit = 20, search = "") {
    const qb = this.attachments.createQueryBuilder("attachment");
    if (search.trim())
      qb.where(
        "(LOWER(attachment.file_name) LIKE LOWER(:search) OR LOWER(attachment.file_type) LIKE LOWER(:search))",
        { search: `%${search.trim()}%` },
      );
    const [data, total] = await qb
      .orderBy("attachment.uploaded_at", "DESC")
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
  async remove(id: string): Promise<void> {
    const attachment = await this.attachments.findOne({ where: { id } });
    if (!attachment) throw new NotFoundException("فایل پیدا نشد");
    await this.attachments.remove(attachment);
  }
}
