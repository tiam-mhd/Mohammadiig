import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { createHash, randomUUID } from "node:crypto";
import {
  existsSync,
  promises as fs,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, extname, join, posix } from "node:path";
import { IsNull, Repository } from "typeorm";
import AdmZip from "adm-zip";
import sharp from "sharp";
import { AuthUser } from "../auth/jwt.strategy";
import { AuditService } from "../audit/audit.service";
import { AttachmentEntity } from "../attachments/attachment.entity";
import { PortfolioWorkEntity } from "../portfolio/portfolio-work.entity";
import { ProductEntity } from "../products/product.entity";
import { SparePartEntity } from "../products/spare-part.entity";
import { ProjectEntity } from "../projects/project.entity";
import { ServiceEntity } from "../services/service.entity";
import {
  CompressMediaDto,
  ListMediaQueryDto,
  UpdateMediaDto,
  UpdateMediaSettingsDto,
} from "./dto/media.dto";
import { MediaAssetEntity } from "./media.entity";
import {
  backupsDir,
  dateFolderParts,
  ensureDir,
  publicMediaUrl,
  resolveMediaRoot,
  safeJoinMedia,
  settingsFilePath,
  toRelativeMediaPath,
  trashDir,
} from "./media-paths";

import {
  clampSettings,
  DEFAULT_MEDIA_SETTINGS,
  MediaCompressionSettings,
} from "./media-settings";

const ALLOWED_IMAGE_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "image/avif",
]);

const ALLOWED_VIDEO_MIME = new Set([
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-msvideo",
  "video/ogg",
]);

const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const MAX_VIDEO_BYTES = 100 * 1024 * 1024;
const MAX_MEDIA_BACKUP_BYTES = 128 * 1024 * 1024;

function hasBytes(
  buffer: Buffer,
  offset: number,
  signature: number[],
): boolean {
  return signature.every((value, index) => buffer[offset + index] === value);
}

function validateFileContent(
  buffer: Buffer,
  mime: string,
  isVideo: boolean,
): void {
  if (!buffer.length) throw new BadRequestException("فایل خالی است");
  if (mime === "image/svg+xml") {
    const text = buffer.toString("utf8").slice(0, 2 * 1024 * 1024);
    if (
      !/^\s*(?:<\?xml[^>]*>\s*)?<svg[\s>]/i.test(text) ||
      /<script|javascript:|on[a-z]+\s*=/i.test(text)
    ) {
      throw new BadRequestException("محتوای SVG معتبر یا امن نیست");
    }
    return;
  }
  const validImage =
    (mime === "image/jpeg" && hasBytes(buffer, 0, [0xff, 0xd8, 0xff])) ||
    (mime === "image/png" &&
      hasBytes(buffer, 0, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) ||
    (mime === "image/gif" &&
      buffer.subarray(0, 4).toString("ascii") === "GIF8") ||
    (mime === "image/webp" &&
      buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
      buffer.subarray(8, 12).toString("ascii") === "WEBP") ||
    (mime === "image/avif" &&
      buffer.subarray(4, 8).toString("ascii") === "ftyp");
  const validVideo =
    (mime === "video/mp4" &&
      buffer.subarray(4, 8).toString("ascii") === "ftyp") ||
    (mime === "video/quicktime" &&
      buffer.subarray(4, 8).toString("ascii") === "ftyp") ||
    (mime === "video/webm" && hasBytes(buffer, 0, [0x1a, 0x45, 0xdf, 0xa3])) ||
    (mime === "video/ogg" &&
      buffer.subarray(0, 4).toString("ascii") === "OggS") ||
    (mime === "video/x-msvideo" &&
      buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
      buffer.subarray(8, 12).toString("ascii") === "AVI ");
  if (!(isVideo ? validVideo : validImage))
    throw new BadRequestException(
      "محتوای واقعی فایل با نوع اعلام‌شده سازگار نیست",
    );
}

function isVideoMime(mime: string): boolean {
  return mime.startsWith("video/") || ALLOWED_VIDEO_MIME.has(mime);
}

export type MediaAssetView = MediaAssetEntity & { absoluteUrl: string };

@Injectable()
export class MediaService implements OnModuleInit {
  private mediaRoot = "";

  constructor(
    @InjectRepository(MediaAssetEntity)
    private readonly media: Repository<MediaAssetEntity>,
  ) {}

  onModuleInit(): void {
    this.mediaRoot = resolveMediaRoot();
    ensureDir(this.mediaRoot);
    ensureDir(trashDir(this.mediaRoot));
    ensureDir(backupsDir(this.mediaRoot));
    console.log(`[Media] root=${this.mediaRoot}`);
    // Fix product/portfolio refs left on old .png after compress→webp replace.
    void this.repairStemMismatches().then((n) => {
      if (n > 0) console.log(`[Media] repaired ${n} stale media reference(s)`);
    });
  }

  getRoot(): string {
    return this.mediaRoot || resolveMediaRoot();
  }

  private toView(entity: MediaAssetEntity): MediaAssetView {
    const relative =
      toRelativeMediaPath(entity.url) || publicMediaUrl(entity.relativePath);
    // Keep response `url` relative so admin pickers never persist localhost/prod hosts.
    const normalized = Object.assign(entity, { url: relative });
    const absoluteUrl = this.resolveAbsoluteUrl(relative);
    return Object.assign(normalized, { absoluteUrl });
  }

  resolveAbsoluteUrl(urlOrPath: string): string {
    const relative = toRelativeMediaPath(urlOrPath);
    if (/^https?:\/\//i.test(relative) || relative.startsWith("data:"))
      return relative;
    const base = (process.env.MEDIA_PUBLIC_BASE_URL ?? "")
      .trim()
      .replace(/\/+$/, "");
    if (base) {
      if (relative.startsWith("/")) return `${base}${relative}`;
      return `${base}/media/${relative}`;
    }
    // Without MEDIA_PUBLIC_BASE_URL, still return a path starting with /media for clients
    // that resolve against NEXT_PUBLIC_API_URL — never invent a localhost host here.
    return relative.startsWith("/") ? relative : `/media/${relative}`;
  }

  getSettings(): MediaCompressionSettings {
    const path = settingsFilePath(this.getRoot());
    if (!existsSync(path)) return { ...DEFAULT_MEDIA_SETTINGS };
    try {
      const raw = JSON.parse(
        readFileSync(path, "utf8"),
      ) as Partial<MediaCompressionSettings>;
      return clampSettings(raw);
    } catch {
      return { ...DEFAULT_MEDIA_SETTINGS };
    }
  }

  updateSettings(dto: UpdateMediaSettingsDto): MediaCompressionSettings {
    const next = clampSettings({ ...this.getSettings(), ...dto });
    writeFileSync(
      settingsFilePath(this.getRoot()),
      JSON.stringify(next, null, 2),
      "utf8",
    );
    return next;
  }

  async list(query: ListMediaQueryDto): Promise<{
    data: MediaAssetView[];
    meta: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      folders: string[];
    };
  }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 40;
    const status = query.status ?? "active";
    const qb = this.media.createQueryBuilder("m");

    if (status === "active") {
      qb.withDeleted().andWhere("m.deletedAt IS NULL");
    } else if (status === "trash") {
      qb.withDeleted().andWhere("m.deletedAt IS NOT NULL");
    } else {
      qb.withDeleted();
    }

    if (query.folder?.trim()) {
      qb.andWhere("m.folder = :folder", { folder: query.folder.trim() });
    }

    if (query.kind === "image") {
      qb.andWhere("m.mimeType LIKE :imageKind", { imageKind: "image/%" });
    } else if (query.kind === "video") {
      qb.andWhere("m.mimeType LIKE :videoKind", { videoKind: "video/%" });
    }

    if (query.q?.trim()) {
      const q = `%${query.q.trim().toLowerCase()}%`;
      qb.andWhere(
        `(LOWER(m.originalName) LIKE :q OR LOWER(COALESCE(m.altText, '')) LIKE :q OR LOWER(COALESCE(m.title, '')) LIKE :q OR LOWER(COALESCE(m.caption, '')) LIKE :q)`,
        { q },
      );
    }

    qb.orderBy("m.createdAt", "DESC");
    const total = await qb.getCount();
    const rows = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    const folderRows = await this.media
      .createQueryBuilder("m")
      .select("DISTINCT m.folder", "folder")
      .where("m.deletedAt IS NULL")
      .orderBy("m.folder", "ASC")
      .getRawMany<{ folder: string }>();

    return {
      data: rows.map((row) => this.toView(row)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
        folders: folderRows.map((r) => r.folder).filter(Boolean),
      },
    };
  }

  async findOne(id: string, withDeleted = false): Promise<MediaAssetView> {
    const entity = await this.media.findOne({ where: { id }, withDeleted });
    if (!entity) throw new NotFoundException("تصویر در کتابخانه پیدا نشد");
    return this.toView(entity);
  }

  async upload(
    user: AuthUser,
    file: Express.Multer.File | undefined,
    options?: {
      folder?: string;
      altText?: string;
      title?: string;
      caption?: string;
      description?: string;
      kind?: "image" | "video";
    },
  ): Promise<MediaAssetView> {
    if (file?.path && !file.buffer) {
      file.buffer = await fs.readFile(file.path);
      await fs.unlink(file.path).catch(() => undefined);
    }
    if (!file?.buffer?.length)
      throw new BadRequestException("فایل ارسال نشده است");
    const mime = (file.mimetype || "").toLowerCase();
    const isVideo = isVideoMime(mime);
    const isImage = ALLOWED_IMAGE_MIME.has(mime);
    const requestedKind = options?.kind;

    if (requestedKind === "image" && !isImage) {
      throw new BadRequestException("فقط فرمت‌های تصویری مجاز هستند");
    }
    if (requestedKind === "video" && !isVideo) {
      throw new BadRequestException("فقط فرمت‌های ویدیویی مجاز هستند");
    }
    if (!isImage && !isVideo) {
      throw new BadRequestException("فرمت فایل پشتیبانی نمی‌شود");
    }

    if (isVideo && file.size > MAX_VIDEO_BYTES) {
      throw new BadRequestException("حجم ویدیو بیشتر از ۱۰۰ مگابایت است");
    }
    if (isImage && file.size > MAX_IMAGE_BYTES) {
      throw new BadRequestException("حجم تصویر بیشتر از ۱۵ مگابایت است");
    }
    validateFileContent(file.buffer, mime, isVideo);

    const settings = this.getSettings();
    let buffer = file.buffer;
    let mimeType = mime;
    let ext = this.extensionFor(mime, file.originalname);
    let width: number | null = null;
    let height: number | null = null;

    if (isImage && mime !== "image/svg+xml") {
      try {
        const meta = await sharp(buffer, { failOn: "none" }).metadata();
        width = meta.width ?? null;
        height = meta.height ?? null;
      } catch {
        // keep null dimensions
      }

      if (settings.compressOnUpload && mime !== "image/gif") {
        const compressed = await this.compressBuffer(buffer, settings);
        buffer = compressed.buffer;
        mimeType = compressed.mimeType;
        ext = compressed.ext;
        width = compressed.width;
        height = compressed.height;
      }
    }

    const checksum = createHash("sha256").update(buffer).digest("hex");
    const duplicate = await this.media.findOne({
      where: { checksum, deletedAt: IsNull() },
    });
    if (duplicate) {
      // DB row may outlive files when MEDIA_ROOT is not on a persistent volume.
      const existingPath = safeJoinMedia(
        this.getRoot(),
        duplicate.relativePath,
      );
      if (!existsSync(existingPath)) {
        ensureDir(dirname(existingPath));
        await fs.writeFile(existingPath, buffer);
      }
      return this.toView(duplicate);
    }

    const id = randomUUID();
    const { year, month } = dateFolderParts();
    const safeBase = this.sanitizeFilename(
      file.originalname || (isVideo ? "video" : "image"),
    );
    const storedName = `${id}${ext}`;
    const relativePath = `${year}/${month}/${storedName}`;
    const absolute = safeJoinMedia(this.getRoot(), relativePath);
    ensureDir(dirname(absolute));
    await fs.writeFile(absolute, buffer);

    const entity = this.media.create({
      id,
      originalName: safeBase,
      storedName,
      relativePath,
      url: publicMediaUrl(relativePath),
      mimeType,
      fileSize: buffer.length,
      width,
      height,
      folder: (options?.folder || "general").trim().slice(0, 120) || "general",
      altText: options?.altText?.trim() || null,
      title: options?.title?.trim() || safeBase,
      caption: options?.caption?.trim() || null,
      description: options?.description?.trim() || null,
      checksum,
      parentId: null,
      uploadedBy: user.userId,
    });

    const saved = await this.media.save(entity);
    return this.toView(saved);
  }

  async update(id: string, dto: UpdateMediaDto): Promise<MediaAssetView> {
    const entity = await this.media.findOne({ where: { id } });
    if (!entity) throw new NotFoundException("تصویر در کتابخانه پیدا نشد");

    if (dto.altText !== undefined) entity.altText = dto.altText?.trim() || null;
    if (dto.title !== undefined) entity.title = dto.title?.trim() || null;
    if (dto.caption !== undefined) entity.caption = dto.caption?.trim() || null;
    if (dto.description !== undefined)
      entity.description = dto.description?.trim() || null;
    if (dto.folder !== undefined)
      entity.folder = dto.folder.trim().slice(0, 120) || "general";
    if (dto.originalName !== undefined)
      entity.originalName = this.sanitizeFilename(dto.originalName);

    return this.toView(await this.media.save(entity));
  }

  async softDelete(id: string, actor?: AuthUser): Promise<{ ok: true }> {
    const entity = await this.media.findOne({ where: { id } });
    if (!entity) throw new NotFoundException("تصویر در کتابخانه پیدا نشد");

    const source = safeJoinMedia(this.getRoot(), entity.relativePath);
    if (existsSync(source)) {
      const trash = trashDir(this.getRoot());
      ensureDir(trash);
      const dest = join(trash, `${entity.id}${extname(entity.storedName)}`);
      try {
        await fs.rename(source, dest);
      } catch {
        await fs.copyFile(source, dest);
        await fs.unlink(source);
      }
    }

    await this.media.softRemove(entity);
    if (actor)
      await AuditService.record(
        this.media.manager,
        actor,
        "media.deleted",
        "media",
        id,
        { relativePath: entity.relativePath },
        { deleted: true },
      );
    return { ok: true };
  }

  async restoreFromTrash(id: string): Promise<MediaAssetView> {
    const entity = await this.media.findOne({
      where: { id },
      withDeleted: true,
    });
    if (!entity || !entity.deletedAt)
      throw new NotFoundException("آیتم در سطل زباله پیدا نشد");

    const trashFile = join(
      trashDir(this.getRoot()),
      `${entity.id}${extname(entity.storedName)}`,
    );
    const dest = safeJoinMedia(this.getRoot(), entity.relativePath);
    ensureDir(dirname(dest));
    if (existsSync(trashFile)) {
      await fs.rename(trashFile, dest);
    } else if (!existsSync(dest)) {
      throw new BadRequestException(
        "فایل فیزیکی تصویر در سطل زباله موجود نیست",
      );
    }

    entity.deletedAt = null;
    return this.toView(await this.media.save(entity));
  }

  async purge(id: string, actor?: AuthUser): Promise<{ ok: true }> {
    const entity = await this.media.findOne({
      where: { id },
      withDeleted: true,
    });
    if (!entity) throw new NotFoundException("تصویر پیدا نشد");
    const references = await this.usage(id);
    if (references.references.length > 0) {
      throw new ConflictException(
        `حذف دائمی ممکن نیست؛ رسانه در ${references.references.length.toLocaleString("fa-IR")} مورد استفاده است`,
      );
    }

    for (const candidate of [
      safeJoinMedia(this.getRoot(), entity.relativePath),
      join(
        trashDir(this.getRoot()),
        `${entity.id}${extname(entity.storedName)}`,
      ),
    ]) {
      if (existsSync(candidate)) {
        await fs.unlink(candidate).catch(() => undefined);
      }
    }
    await this.media.remove(entity);
    if (actor)
      await AuditService.record(
        this.media.manager,
        actor,
        "media.purged",
        "media",
        id,
        { relativePath: entity.relativePath },
        null,
      );
    return { ok: true };
  }

  async compress(
    id: string,
    dto: CompressMediaDto,
  ): Promise<MediaAssetView & { referencesUpdated?: number }> {
    const entity = await this.media.findOne({ where: { id } });
    if (!entity) throw new NotFoundException("تصویر در کتابخانه پیدا نشد");
    if (
      isVideoMime(entity.mimeType) ||
      entity.mimeType === "image/svg+xml" ||
      entity.mimeType === "image/gif"
    ) {
      throw new BadRequestException(
        "فشرده‌سازی برای این نوع فایل پشتیبانی نمی‌شود",
      );
    }

    const mode = dto.mode ?? "copy";
    const settings = clampSettings({
      ...this.getSettings(),
      quality: dto.quality,
      maxWidth: dto.maxWidth,
      maxHeight: dto.maxHeight,
      convertToWebp: dto.convertToWebp,
      stripMetadata: dto.stripMetadata,
    });

    const sourcePath = safeJoinMedia(this.getRoot(), entity.relativePath);
    if (!existsSync(sourcePath))
      throw new BadRequestException("فایل تصویر روی دیسک موجود نیست");
    const sourceBuffer = await fs.readFile(sourcePath);
    const compressed = await this.compressBuffer(
      sourceBuffer,
      settings,
      entity.mimeType,
    );

    if (mode === "replace") {
      const previousUrl =
        toRelativeMediaPath(entity.url) || publicMediaUrl(entity.relativePath);
      const previousRelative = entity.relativePath;
      const previousNeedles = this.mediaNeedlesForStem(
        previousUrl,
        previousRelative,
      );

      const newRelative =
        extname(entity.relativePath).toLowerCase() ===
        compressed.ext.toLowerCase()
          ? entity.relativePath
          : entity.relativePath.replace(/\.[^.]+$/, compressed.ext);
      const nextUrl = publicMediaUrl(newRelative);
      const dest = safeJoinMedia(this.getRoot(), newRelative);
      ensureDir(dirname(dest));
      const rollbackPath = join(
        backupsDir(this.getRoot()),
        `${entity.id}-${Date.now()}.rollback`,
      );
      ensureDir(dirname(rollbackPath));
      await fs.copyFile(sourcePath, rollbackPath);
      let referencesUpdated = 0;
      const previousEntity = {
        relativePath: entity.relativePath,
        storedName: entity.storedName,
        url: entity.url,
        mimeType: entity.mimeType,
        fileSize: entity.fileSize,
        width: entity.width,
        height: entity.height,
        checksum: entity.checksum,
        originalName: entity.originalName,
      };
      try {
        await fs.writeFile(dest, compressed.buffer);
        if (newRelative !== previousRelative && existsSync(sourcePath))
          await fs.unlink(sourcePath);
        entity.relativePath = newRelative;
        entity.storedName = basename(newRelative);
        entity.url = nextUrl;
        entity.mimeType = compressed.mimeType;
        entity.fileSize = compressed.buffer.length;
        entity.width = compressed.width;
        entity.height = compressed.height;
        entity.checksum = createHash("sha256")
          .update(compressed.buffer)
          .digest("hex");
        entity.originalName = this.withExtension(
          entity.originalName || entity.storedName,
          compressed.ext,
        );
        const saved = await this.media.save(entity);
        if (previousUrl !== nextUrl || previousRelative !== newRelative) {
          referencesUpdated = await this.rewriteMediaReferences(
            previousNeedles,
            nextUrl,
          );
          console.log(
            `[Media] compress replace ${previousUrl} → ${nextUrl} (referencesUpdated=${referencesUpdated})`,
          );
        }
        await fs.unlink(rollbackPath).catch(() => undefined);
        return Object.assign(this.toView(saved), { referencesUpdated });
      } catch (error) {
        await fs.copyFile(rollbackPath, sourcePath).catch(() => undefined);
        if (newRelative !== previousRelative)
          await fs.unlink(dest).catch(() => undefined);
        if (referencesUpdated > 0)
          await this.rewriteMediaReferences([nextUrl], previousUrl).catch(
            () => undefined,
          );
        Object.assign(entity, previousEntity);
        await this.media.save(entity).catch(() => undefined);
        await fs.unlink(rollbackPath).catch(() => undefined);
        throw new BadRequestException(
          "فشرده‌سازی انجام نشد و تغییرات به‌طور کامل بازگردانی شد",
        );
      }
    }

    const copyId = randomUUID();
    const { year, month } = dateFolderParts();
    const storedName = `${copyId}${compressed.ext}`;
    const relativePath = `${year}/${month}/${storedName}`;
    const dest = safeJoinMedia(this.getRoot(), relativePath);
    ensureDir(dirname(dest));
    await fs.writeFile(dest, compressed.buffer);

    const copy = this.media.create({
      id: copyId,
      originalName: this.withSuffix(entity.originalName, "-compressed"),
      storedName,
      relativePath,
      url: publicMediaUrl(relativePath),
      mimeType: compressed.mimeType,
      fileSize: compressed.buffer.length,
      width: compressed.width,
      height: compressed.height,
      folder: entity.folder,
      altText: entity.altText,
      title: entity.title ? `${entity.title} (فشرده)` : entity.title,
      caption: entity.caption,
      description: entity.description,
      checksum: createHash("sha256").update(compressed.buffer).digest("hex"),
      parentId: entity.id,
      uploadedBy: entity.uploadedBy,
    });
    return this.toView(await this.media.save(copy));
  }

  async createBackupArchive(): Promise<{ filePath: string; fileName: string }> {
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `media-backup-${stamp}.zip`;
    const filePath = join(backupsDir(this.getRoot()), fileName);
    ensureDir(backupsDir(this.getRoot()));

    const assets = await this.media.find({
      withDeleted: false,
      order: { createdAt: "ASC" },
    });
    const manifest = {
      version: 1,
      createdAt: new Date().toISOString(),
      settings: this.getSettings(),
      assets: assets.map((a) => ({
        id: a.id,
        originalName: a.originalName,
        storedName: a.storedName,
        relativePath: a.relativePath,
        url: a.url,
        mimeType: a.mimeType,
        fileSize: a.fileSize,
        width: a.width,
        height: a.height,
        folder: a.folder,
        altText: a.altText,
        title: a.title,
        caption: a.caption,
        description: a.description,
        checksum: a.checksum,
        parentId: a.parentId,
        uploadedBy: a.uploadedBy,
        createdAt: a.createdAt,
      })),
    };

    const zip = new AdmZip();
    zip.addFile(
      "manifest.json",
      Buffer.from(JSON.stringify(manifest, null, 2), "utf8"),
    );
    for (const asset of assets) {
      const abs = safeJoinMedia(this.getRoot(), asset.relativePath);
      if (existsSync(abs)) {
        const fileBuffer = await fs.readFile(abs);
        zip.addFile(
          `files/${asset.relativePath.replace(/\\/g, "/")}`,
          fileBuffer,
        );
      }
    }
    zip.writeZip(filePath);

    return { filePath, fileName };
  }

  async restoreFromZip(
    file: Express.Multer.File | undefined,
  ): Promise<{ restored: number; skipped: number }> {
    if (!file?.buffer?.length)
      throw new BadRequestException("فایل بک‌آپ ارسال نشده است");
    if (
      file.size > MAX_MEDIA_BACKUP_BYTES ||
      file.buffer.length > MAX_MEDIA_BACKUP_BYTES
    )
      throw new BadRequestException(
        "حجم فایل بک‌آپ رسانه بیشتر از حد مجاز است",
      );
    let zip: AdmZip;
    try {
      zip = new AdmZip(file.buffer);
    } catch {
      throw new BadRequestException("فایل ZIP نامعتبر است");
    }

    for (const entry of zip.getEntries()) {
      const normalized = posix.normalize(entry.entryName.replace(/\\/g, "/"));
      if (
        normalized.startsWith("../") ||
        normalized.startsWith("/") ||
        normalized !== entry.entryName.replace(/\\/g, "/")
      ) {
        throw new BadRequestException(
          "مسیر یکی از فایل‌های ZIP رسانه ناامن است",
        );
      }
      if (entry.header.size > MAX_MEDIA_BACKUP_BYTES)
        throw new BadRequestException("فایل داخل ZIP رسانه بیش از حد بزرگ است");
    }

    const manifestEntry = zip.getEntry("manifest.json");
    if (!manifestEntry)
      throw new BadRequestException("manifest.json در بک‌آپ پیدا نشد");

    const manifest = JSON.parse(manifestEntry.getData().toString("utf8")) as {
      settings?: Partial<MediaCompressionSettings>;
      assets?: Array<
        Partial<MediaAssetEntity> & { relativePath: string; id: string }
      >;
    };

    if (manifest.settings) {
      this.updateSettings(manifest.settings);
    }

    let restored = 0;
    let skipped = 0;
    for (const item of manifest.assets ?? []) {
      if (!item.id || !item.relativePath) {
        skipped += 1;
        continue;
      }
      const entry = zip.getEntry(`files/${item.relativePath}`);
      if (!entry) {
        skipped += 1;
        continue;
      }
      const dest = safeJoinMedia(this.getRoot(), item.relativePath);
      ensureDir(dirname(dest));
      await fs.writeFile(dest, entry.getData());

      const existing = await this.media.findOne({
        where: { id: item.id },
        withDeleted: true,
      });
      if (existing) {
        Object.assign(existing, {
          originalName: item.originalName ?? existing.originalName,
          storedName: item.storedName ?? existing.storedName,
          relativePath: item.relativePath,
          url:
            toRelativeMediaPath(item.url) || publicMediaUrl(item.relativePath),
          mimeType: item.mimeType ?? existing.mimeType,
          fileSize: item.fileSize ?? existing.fileSize,
          width: item.width ?? existing.width,
          height: item.height ?? existing.height,
          folder: item.folder ?? existing.folder,
          altText: item.altText ?? existing.altText,
          title: item.title ?? existing.title,
          caption: item.caption ?? existing.caption,
          description: item.description ?? existing.description,
          checksum: item.checksum ?? existing.checksum,
          parentId: item.parentId ?? existing.parentId,
          deletedAt: null,
        });
        await this.media.save(existing);
      } else {
        await this.media.save(
          this.media.create({
            id: item.id,
            originalName: item.originalName || basename(item.relativePath),
            storedName: item.storedName || basename(item.relativePath),
            relativePath: item.relativePath,
            url:
              toRelativeMediaPath(item.url) ||
              publicMediaUrl(item.relativePath),
            mimeType: item.mimeType || "image/jpeg",
            fileSize: item.fileSize || entry.header.size,
            width: item.width ?? null,
            height: item.height ?? null,
            folder: item.folder || "general",
            altText: item.altText ?? null,
            title: item.title ?? null,
            caption: item.caption ?? null,
            description: item.description ?? null,
            checksum: item.checksum ?? null,
            parentId: item.parentId ?? null,
            uploadedBy: item.uploadedBy || "restore",
          }),
        );
      }
      restored += 1;
    }

    return { restored, skipped };
  }

  async usage(id: string): Promise<{
    url: string;
    references: Array<{
      table: string;
      field: string;
      id: string;
      label: string;
    }>;
  }> {
    const asset = await this.findOne(id);
    const url = asset.url;
    const absolute = asset.absoluteUrl;
    const needles = this.mediaNeedlesFor(url, asset.relativePath);
    if (absolute) needles.push(absolute);
    const references: Array<{
      table: string;
      field: string;
      id: string;
      label: string;
    }> = [];

    const productRows = await this.media.manager
      .createQueryBuilder()
      .select([
        "p.id AS id",
        "p.name_fa AS label",
        "p.thumbnail_image_url AS thumb",
        "p.gallery AS gallery",
      ])
      .from("products", "p")
      .getRawMany<{
        id: string;
        label: string;
        thumb: string | null;
        gallery: string | null;
      }>();
    for (const row of productRows) {
      if (this.urlsMatch(row.thumb, needles)) {
        references.push({
          table: "products",
          field: "thumbnail_image_url",
          id: row.id,
          label: row.label,
        });
      }
      if (this.jsonIncludesUrl(row.gallery, needles)) {
        references.push({
          table: "products",
          field: "gallery",
          id: row.id,
          label: row.label,
        });
      }
    }

    const spareRows = await this.media.manager
      .createQueryBuilder()
      .select(["s.id AS id", "s.name_fa AS label", "s.image_url AS imageUrl"])
      .from("spare_parts", "s")
      .getRawMany<{ id: string; label: string; imageUrl: string | null }>();
    for (const row of spareRows) {
      if (this.urlsMatch(row.imageUrl, needles)) {
        references.push({
          table: "spare_parts",
          field: "image_url",
          id: row.id,
          label: row.label,
        });
      }
    }

    const serviceRows = await this.media.manager
      .createQueryBuilder()
      .select([
        "s.id AS id",
        "s.name_fa AS label",
        "s.cover_image_url AS cover",
        "s.gallery AS gallery",
      ])
      .from("services", "s")
      .getRawMany<{
        id: string;
        label: string;
        cover: string | null;
        gallery: string | null;
      }>();
    for (const row of serviceRows) {
      if (this.urlsMatch(row.cover, needles)) {
        references.push({
          table: "services",
          field: "cover_image_url",
          id: row.id,
          label: row.label,
        });
      }
      if (this.jsonIncludesUrl(row.gallery, needles)) {
        references.push({
          table: "services",
          field: "gallery",
          id: row.id,
          label: row.label,
        });
      }
    }

    const portfolioRows = await this.media.manager
      .createQueryBuilder()
      .select([
        "w.id AS id",
        "w.title_fa AS label",
        "w.cover_image_url AS cover",
        "w.gallery AS gallery",
      ])
      .from("portfolio_works", "w")
      .getRawMany<{
        id: string;
        label: string;
        cover: string | null;
        gallery: string | null;
      }>();
    for (const row of portfolioRows) {
      if (this.urlsMatch(row.cover, needles)) {
        references.push({
          table: "portfolio_works",
          field: "cover_image_url",
          id: row.id,
          label: row.label,
        });
      }
      if (this.jsonIncludesUrl(row.gallery, needles)) {
        references.push({
          table: "portfolio_works",
          field: "gallery",
          id: row.id,
          label: row.label,
        });
      }
    }

    const projectRows = await this.media.manager
      .createQueryBuilder()
      .select([
        "p.id AS id",
        "p.project_name AS label",
        "p.cover_image_url AS cover",
        "p.gallery AS gallery",
      ])
      .from("projects", "p")
      .getRawMany<{
        id: string;
        label: string;
        cover: string | null;
        gallery: string | null;
      }>();
    for (const row of projectRows) {
      if (this.urlsMatch(row.cover, needles)) {
        references.push({
          table: "projects",
          field: "cover_image_url",
          id: row.id,
          label: row.label,
        });
      }
      if (this.jsonIncludesUrl(row.gallery, needles)) {
        references.push({
          table: "projects",
          field: "gallery",
          id: row.id,
          label: row.label,
        });
      }
    }

    return { url, references };
  }

  private mediaNeedlesFor(
    urlOrPath: string | null | undefined,
    relativePath?: string | null,
  ): string[] {
    const set = new Set<string>();
    const raw = String(urlOrPath ?? "").trim();
    const relative = toRelativeMediaPath(raw);
    if (raw) set.add(raw);
    if (relative) set.add(relative);
    if (relativePath) {
      const cleaned = relativePath.replace(/\\/g, "/").replace(/^\/+/, "");
      set.add(cleaned);
      set.add(publicMediaUrl(cleaned));
    }
    return [...set].filter(Boolean);
  }

  /** All extension variants of the same media stem (uuid.png, uuid.webp, …). */
  private mediaNeedlesForStem(
    urlOrPath: string | null | undefined,
    relativePath?: string | null,
  ): string[] {
    const base = this.mediaNeedlesFor(urlOrPath, relativePath);
    const set = new Set(base);
    const seed =
      toRelativeMediaPath(urlOrPath) ||
      (relativePath ? publicMediaUrl(relativePath.replace(/\\/g, "/")) : "");
    if (!seed.startsWith("/media/")) return [...set];

    const withoutPrefix = seed.slice("/media/".length);
    const currentExt = extname(withoutPrefix);
    const stem = currentExt
      ? withoutPrefix.slice(0, -currentExt.length)
      : withoutPrefix;
    for (const ext of [".png", ".jpg", ".jpeg", ".webp", ".gif", ".avif"]) {
      set.add(`/media/${stem}${ext}`);
      set.add(`${stem}${ext}`);
    }
    return [...set].filter(Boolean);
  }

  private withExtension(name: string, ext: string): string {
    const normalizedExt = ext.startsWith(".") ? ext : `.${ext}`;
    const current = extname(name || "");
    if (!name) return `image${normalizedExt}`;
    if (!current) return `${name}${normalizedExt}`;
    return `${name.slice(0, -current.length)}${normalizedExt}`;
  }

  private urlsMatch(
    stored: string | null | undefined,
    needles: string[],
  ): boolean {
    if (!stored) return false;
    if (needles.includes(stored)) return true;
    const rel = toRelativeMediaPath(stored);
    if (!rel) return false;
    return needles.some(
      (needle) => needle === rel || toRelativeMediaPath(needle) === rel,
    );
  }

  private rewriteJsonUrlList(
    raw: string | string[] | null | undefined,
    needles: string[],
    nextUrl: string,
  ): string | null {
    if (raw == null) return null;
    try {
      const parsed =
        typeof raw === "string" ? (JSON.parse(raw) as unknown) : raw;
      if (!Array.isArray(parsed)) return null;
      let changed = false;
      const next = parsed.map((item) => {
        const value = String(item ?? "");
        if (this.urlsMatch(value, needles)) {
          changed = true;
          return nextUrl;
        }
        return value;
      });
      return changed ? JSON.stringify(next) : null;
    } catch {
      return null;
    }
  }

  /** After compress-replace (e.g. .png → .webp), keep products/portfolio/projects in sync. */
  private async rewriteMediaReferences(
    needles: string[],
    nextUrl: string,
  ): Promise<number> {
    const uniqueNeedles = Array.from(
      new Set(needles.map((n) => toRelativeMediaPath(n) || n).filter(Boolean)),
    );
    if (!uniqueNeedles.length || !nextUrl) return 0;
    if (uniqueNeedles.every((n) => n === nextUrl)) return 0;

    let updated = 0;
    const manager = this.media.manager;

    const productRows = await manager
      .createQueryBuilder()
      .select([
        "p.id AS id",
        "p.thumbnail_image_url AS thumb",
        "p.gallery AS gallery",
      ])
      .from("products", "p")
      .getRawMany<{
        id: string;
        thumb: string | null;
        gallery: string | string[] | null;
      }>();
    for (const row of productRows) {
      let thumb = row.thumb;
      let dirty = false;
      if (this.urlsMatch(thumb, uniqueNeedles)) {
        thumb = nextUrl;
        dirty = true;
      }
      const galleryList = this.parseUrlList(row.gallery);
      const nextGallery = galleryList.map((item) =>
        this.urlsMatch(item, uniqueNeedles) ? nextUrl : item,
      );
      const galleryChanged =
        JSON.stringify(nextGallery) !== JSON.stringify(galleryList);
      if (galleryChanged) dirty = true;
      if (dirty) {
        await manager
          .createQueryBuilder()
          .update(ProductEntity)
          .set({ thumbnailImageUrl: thumb, gallery: nextGallery })
          .where("id = :id", { id: row.id })
          .execute();
        updated += 1;
      }
    }

    const spareRows = await manager
      .createQueryBuilder()
      .select(["s.id AS id", "s.image_url AS imageUrl"])
      .from("spare_parts", "s")
      .getRawMany<{ id: string; imageUrl: string | null }>();
    for (const row of spareRows) {
      if (!this.urlsMatch(row.imageUrl, uniqueNeedles)) continue;
      await manager
        .createQueryBuilder()
        .update(SparePartEntity)
        .set({ imageUrl: nextUrl })
        .where("id = :id", { id: row.id })
        .execute();
      updated += 1;
    }

    const serviceRows = await manager
      .createQueryBuilder()
      .select([
        "s.id AS id",
        "s.cover_image_url AS cover",
        "s.gallery AS gallery",
      ])
      .from("services", "s")
      .getRawMany<{
        id: string;
        cover: string | null;
        gallery: string | string[] | null;
      }>();
    for (const row of serviceRows) {
      let cover = row.cover;
      let dirty = false;
      if (this.urlsMatch(cover, uniqueNeedles)) {
        cover = nextUrl;
        dirty = true;
      }
      const galleryList = this.parseUrlList(row.gallery);
      const nextGallery = galleryList.map((item) =>
        this.urlsMatch(item, uniqueNeedles) ? nextUrl : item,
      );
      if (JSON.stringify(nextGallery) !== JSON.stringify(galleryList))
        dirty = true;
      if (dirty) {
        await manager
          .createQueryBuilder()
          .update(ServiceEntity)
          .set({ coverImageUrl: cover, gallery: nextGallery })
          .where("id = :id", { id: row.id })
          .execute();
        updated += 1;
      }
    }

    const portfolioRows = await manager
      .createQueryBuilder()
      .select([
        "w.id AS id",
        "w.cover_image_url AS cover",
        "w.gallery AS gallery",
      ])
      .from("portfolio_works", "w")
      .getRawMany<{
        id: string;
        cover: string | null;
        gallery: string | string[] | null;
      }>();
    for (const row of portfolioRows) {
      let cover = row.cover;
      let dirty = false;
      if (this.urlsMatch(cover, uniqueNeedles)) {
        cover = nextUrl;
        dirty = true;
      }
      const galleryList = this.parseUrlList(row.gallery);
      const nextGallery = galleryList.map((item) =>
        this.urlsMatch(item, uniqueNeedles) ? nextUrl : item,
      );
      if (JSON.stringify(nextGallery) !== JSON.stringify(galleryList))
        dirty = true;
      if (dirty) {
        await manager
          .createQueryBuilder()
          .update(PortfolioWorkEntity)
          .set({ coverImageUrl: cover, gallery: nextGallery })
          .where("id = :id", { id: row.id })
          .execute();
        updated += 1;
      }
    }

    const projectRows = await manager
      .createQueryBuilder()
      .select([
        "p.id AS id",
        "p.cover_image_url AS cover",
        "p.gallery AS gallery",
      ])
      .from("projects", "p")
      .getRawMany<{
        id: string;
        cover: string | null;
        gallery: string | string[] | null;
      }>();
    for (const row of projectRows) {
      let cover = row.cover;
      let dirty = false;
      if (this.urlsMatch(cover, uniqueNeedles)) {
        cover = nextUrl;
        dirty = true;
      }
      const galleryList = this.parseUrlList(row.gallery);
      const nextGallery = galleryList.map((item) =>
        this.urlsMatch(item, uniqueNeedles) ? nextUrl : item,
      );
      if (JSON.stringify(nextGallery) !== JSON.stringify(galleryList))
        dirty = true;
      if (dirty) {
        await manager
          .createQueryBuilder()
          .update(ProjectEntity)
          .set({ coverImageUrl: cover, gallery: nextGallery })
          .where("id = :id", { id: row.id })
          .execute();
        updated += 1;
      }
    }

    const attachmentRows = await manager
      .createQueryBuilder()
      .select(["a.id AS id", "a.file_url AS fileUrl"])
      .from("attachments", "a")
      .getRawMany<{ id: string; fileUrl: string | null }>();
    for (const row of attachmentRows) {
      if (!this.urlsMatch(row.fileUrl, uniqueNeedles)) continue;
      await manager
        .createQueryBuilder()
        .update(AttachmentEntity)
        .set({ fileUrl: nextUrl })
        .where("id = :id", { id: row.id })
        .execute();
      updated += 1;
    }

    return updated;
  }

  private parseUrlList(raw: string | string[] | null | undefined): string[] {
    if (Array.isArray(raw)) {
      return raw.map((item) => String(item ?? "").trim()).filter(Boolean);
    }
    if (typeof raw !== "string" || !raw.trim()) return [];
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) return [];
      return parsed.map((item) => String(item ?? "").trim()).filter(Boolean);
    } catch {
      return [];
    }
  }

  /**
   * Repair refs that still point at uuid.png while the library file is uuid.webp
   * (leftover from compress-replace before URL-stable replace).
   */
  private async repairStemMismatches(): Promise<number> {
    const assets = await this.media.find({ withDeleted: false });
    let total = 0;
    const altExts = [".png", ".jpg", ".jpeg", ".webp", ".gif", ".avif"];

    for (const asset of assets) {
      const correct =
        toRelativeMediaPath(asset.url) || publicMediaUrl(asset.relativePath);
      if (!correct.startsWith("/media/")) continue;
      const stem = asset.relativePath
        .replace(/\\/g, "/")
        .replace(/\.[^.]+$/, "");
      if (!stem) continue;

      const staleNeedles: string[] = [];
      for (const ext of altExts) {
        const candidate = `/media/${stem}${ext}`;
        if (candidate === correct) continue;
        staleNeedles.push(candidate);
        staleNeedles.push(`${stem}${ext}`);
      }
      if (!staleNeedles.length) continue;
      total += await this.rewriteMediaReferences(staleNeedles, correct);
    }

    // Also: product points to missing file → point to existing sibling extension on disk.
    total += await this.repairMissingFileRefs();
    return total;
  }

  private async repairMissingFileRefs(): Promise<number> {
    const altExts = [".webp", ".jpg", ".jpeg", ".png", ".gif", ".avif"];
    let updated = 0;
    const manager = this.media.manager;
    const productRows = await manager
      .createQueryBuilder()
      .select([
        "p.id AS id",
        "p.thumbnail_image_url AS thumb",
        "p.gallery AS gallery",
      ])
      .from("products", "p")
      .getRawMany<{
        id: string;
        thumb: string | null;
        gallery: string | null;
      }>();

    for (const row of productRows) {
      let thumb = row.thumb;
      let galleryRaw = row.gallery;
      let dirty = false;

      const fixOne = (url: string | null | undefined): string | null => {
        const relative = toRelativeMediaPath(url);
        if (!relative.startsWith("/media/")) return url ?? null;
        const relPath = relative.slice("/media/".length);
        const abs = safeJoinMedia(this.getRoot(), relPath);
        if (existsSync(abs)) return relative;
        const currentExt = extname(relPath).toLowerCase();
        const stem = currentExt
          ? relPath.slice(0, -currentExt.length)
          : relPath;
        for (const ext of altExts) {
          if (ext === currentExt) continue;
          const candidateRel = `${stem}${ext}`;
          if (existsSync(safeJoinMedia(this.getRoot(), candidateRel))) {
            dirty = true;
            return publicMediaUrl(candidateRel);
          }
        }
        return relative;
      };

      const nextThumb = fixOne(thumb);
      if (nextThumb !== thumb) {
        thumb = nextThumb;
        dirty = true;
      }

      try {
        const parsed =
          typeof galleryRaw === "string"
            ? (JSON.parse(galleryRaw) as unknown)
            : galleryRaw;
        if (Array.isArray(parsed)) {
          const nextGallery = parsed
            .map((item) => fixOne(String(item ?? "")))
            .filter(Boolean) as string[];
          if (JSON.stringify(nextGallery) !== JSON.stringify(parsed)) {
            galleryRaw = JSON.stringify(nextGallery);
            dirty = true;
          }
        }
      } catch {
        /* ignore */
      }

      if (dirty) {
        const galleryList = this.parseUrlList(galleryRaw);
        await manager
          .createQueryBuilder()
          .update(ProductEntity)
          .set({
            thumbnailImageUrl: thumb,
            gallery: galleryList,
          })
          .where("id = :id", { id: row.id })
          .execute();
        updated += 1;
      }
    }
    return updated;
  }

  private jsonIncludesUrl(raw: string | null, needles: string[]): boolean {
    if (!raw) return false;
    try {
      const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
      if (!Array.isArray(parsed))
        return needles.some((n) => String(raw).includes(n));
      return parsed.some((item) => this.urlsMatch(String(item), needles));
    } catch {
      return needles.some((n) => String(raw).includes(n));
    }
  }

  private async compressBuffer(
    buffer: Buffer,
    settings: MediaCompressionSettings,
    sourceMime?: string,
  ): Promise<{
    buffer: Buffer;
    mimeType: string;
    ext: string;
    width: number | null;
    height: number | null;
  }> {
    let image = sharp(buffer, { failOn: "none" }).rotate();
    image = image.resize({
      width: settings.maxWidth,
      height: settings.maxHeight,
      fit: "inside",
      withoutEnlargement: true,
    });
    if (!settings.stripMetadata) {
      image = image.withMetadata();
    }

    let out: Buffer;
    let mimeType: string;
    let ext: string;

    const source = (sourceMime || "").toLowerCase();
    const preferWebp = settings.convertToWebp;

    if (preferWebp) {
      out = await image
        .webp({ quality: settings.quality, effort: 4 })
        .toBuffer();
      mimeType = "image/webp";
      ext = ".webp";
    } else if (source.includes("png")) {
      out = await image.png({ compressionLevel: 9 }).toBuffer();
      mimeType = "image/png";
      ext = ".png";
    } else if (source.includes("webp")) {
      out = await image
        .webp({ quality: settings.quality, effort: 4 })
        .toBuffer();
      mimeType = "image/webp";
      ext = ".webp";
    } else if (source.includes("avif")) {
      out = await image.avif({ quality: settings.quality }).toBuffer();
      mimeType = "image/avif";
      ext = ".avif";
    } else {
      out = await image
        .jpeg({ quality: settings.quality, mozjpeg: true })
        .toBuffer();
      mimeType = "image/jpeg";
      ext = ".jpg";
    }

    const outMeta = await sharp(out, { failOn: "none" }).metadata();
    return {
      buffer: out,
      mimeType,
      ext,
      width: outMeta.width ?? null,
      height: outMeta.height ?? null,
    };
  }

  private extensionFor(mime: string, originalName: string): string {
    const fromName = extname(originalName || "").toLowerCase();
    if (fromName && fromName.length <= 8) return fromName;
    switch (mime) {
      case "image/png":
        return ".png";
      case "image/webp":
        return ".webp";
      case "image/gif":
        return ".gif";
      case "image/svg+xml":
        return ".svg";
      case "image/avif":
        return ".avif";
      case "video/mp4":
        return ".mp4";
      case "video/webm":
        return ".webm";
      case "video/quicktime":
        return ".mov";
      case "video/x-msvideo":
        return ".avi";
      case "video/ogg":
        return ".ogv";
      default:
        return mime.startsWith("video/") ? ".mp4" : ".jpg";
    }
  }

  private sanitizeFilename(name: string): string {
    const base = basename(name || "image").replace(
      /[^\w.\u0600-\u06FF\-]+/g,
      "_",
    );
    return base.slice(0, 180) || "image";
  }

  private withSuffix(name: string, suffix: string): string {
    const ext = extname(name);
    const stem = ext ? name.slice(0, -ext.length) : name;
    return `${stem}${suffix}${ext || ""}`;
  }
}
