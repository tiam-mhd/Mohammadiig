import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { createHash, randomUUID } from 'node:crypto';
import {
  existsSync,
  promises as fs,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { basename, dirname, extname, join } from 'node:path';
import { IsNull, Repository } from 'typeorm';
import AdmZip from 'adm-zip';
import sharp from 'sharp';
import { AuthUser } from '../auth/jwt.strategy';
import {
  CompressMediaDto,
  ListMediaQueryDto,
  UpdateMediaDto,
  UpdateMediaSettingsDto,
} from './dto/media.dto';
import { MediaAssetEntity } from './media.entity';
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
} from './media-paths';

import {
  clampSettings,
  DEFAULT_MEDIA_SETTINGS,
  MediaCompressionSettings,
} from './media-settings';

const ALLOWED_IMAGE_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'image/avif',
]);

const ALLOWED_VIDEO_MIME = new Set([
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-msvideo',
  'video/ogg',
]);

const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

function isVideoMime(mime: string): boolean {
  return mime.startsWith('video/') || ALLOWED_VIDEO_MIME.has(mime);
}

export type MediaAssetView = MediaAssetEntity & { absoluteUrl: string };

@Injectable()
export class MediaService implements OnModuleInit {
  private mediaRoot = '';

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
  }

  getRoot(): string {
    return this.mediaRoot || resolveMediaRoot();
  }

  private toView(entity: MediaAssetEntity): MediaAssetView {
    const relative = toRelativeMediaPath(entity.url) || publicMediaUrl(entity.relativePath);
    // Keep response `url` relative so admin pickers never persist localhost/prod hosts.
    const normalized = Object.assign(entity, { url: relative });
    const absoluteUrl = this.resolveAbsoluteUrl(relative);
    return Object.assign(normalized, { absoluteUrl });
  }

  resolveAbsoluteUrl(urlOrPath: string): string {
    const relative = toRelativeMediaPath(urlOrPath);
    if (/^https?:\/\//i.test(relative) || relative.startsWith('data:')) return relative;
    const base = (process.env.MEDIA_PUBLIC_BASE_URL ?? '').trim().replace(/\/+$/, '');
    if (base) {
      if (relative.startsWith('/')) return `${base}${relative}`;
      return `${base}/media/${relative}`;
    }
    // Without MEDIA_PUBLIC_BASE_URL, still return a path starting with /media for clients
    // that resolve against NEXT_PUBLIC_API_URL — never invent a localhost host here.
    return relative.startsWith('/') ? relative : `/media/${relative}`;
  }

  getSettings(): MediaCompressionSettings {
    const path = settingsFilePath(this.getRoot());
    if (!existsSync(path)) return { ...DEFAULT_MEDIA_SETTINGS };
    try {
      const raw = JSON.parse(readFileSync(path, 'utf8')) as Partial<MediaCompressionSettings>;
      return clampSettings(raw);
    } catch {
      return { ...DEFAULT_MEDIA_SETTINGS };
    }
  }

  updateSettings(dto: UpdateMediaSettingsDto): MediaCompressionSettings {
    const next = clampSettings({ ...this.getSettings(), ...dto });
    writeFileSync(settingsFilePath(this.getRoot()), JSON.stringify(next, null, 2), 'utf8');
    return next;
  }

  async list(query: ListMediaQueryDto): Promise<{
    data: MediaAssetView[];
    meta: { page: number; limit: number; total: number; totalPages: number; folders: string[] };
  }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 40;
    const status = query.status ?? 'active';
    const qb = this.media.createQueryBuilder('m');

    if (status === 'active') {
      qb.withDeleted().andWhere('m.deletedAt IS NULL');
    } else if (status === 'trash') {
      qb.withDeleted().andWhere('m.deletedAt IS NOT NULL');
    } else {
      qb.withDeleted();
    }

    if (query.folder?.trim()) {
      qb.andWhere('m.folder = :folder', { folder: query.folder.trim() });
    }

    if (query.kind === 'image') {
      qb.andWhere('m.mimeType LIKE :imageKind', { imageKind: 'image/%' });
    } else if (query.kind === 'video') {
      qb.andWhere('m.mimeType LIKE :videoKind', { videoKind: 'video/%' });
    }

    if (query.q?.trim()) {
      const q = `%${query.q.trim().toLowerCase()}%`;
      qb.andWhere(
        `(LOWER(m.originalName) LIKE :q OR LOWER(COALESCE(m.altText, '')) LIKE :q OR LOWER(COALESCE(m.title, '')) LIKE :q OR LOWER(COALESCE(m.caption, '')) LIKE :q)`,
        { q },
      );
    }

    qb.orderBy('m.createdAt', 'DESC');
    const total = await qb.getCount();
    const rows = await qb.skip((page - 1) * limit).take(limit).getMany();

    const folderRows = await this.media
      .createQueryBuilder('m')
      .select('DISTINCT m.folder', 'folder')
      .where('m.deletedAt IS NULL')
      .orderBy('m.folder', 'ASC')
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
    if (!entity) throw new NotFoundException('تصویر در کتابخانه پیدا نشد');
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
      kind?: 'image' | 'video';
    },
  ): Promise<MediaAssetView> {
    if (!file?.buffer?.length) throw new BadRequestException('فایل ارسال نشده است');
    const mime = (file.mimetype || '').toLowerCase();
    const isVideo = isVideoMime(mime);
    const isImage = ALLOWED_IMAGE_MIME.has(mime);
    const requestedKind = options?.kind;

    if (requestedKind === 'image' && !isImage) {
      throw new BadRequestException('فقط فرمت‌های تصویری مجاز هستند');
    }
    if (requestedKind === 'video' && !isVideo) {
      throw new BadRequestException('فقط فرمت‌های ویدیویی مجاز هستند');
    }
    if (!isImage && !isVideo) {
      throw new BadRequestException('فرمت فایل پشتیبانی نمی‌شود');
    }

    if (isVideo && file.size > MAX_VIDEO_BYTES) {
      throw new BadRequestException('حجم ویدیو بیشتر از ۱۰۰ مگابایت است');
    }
    if (isImage && file.size > MAX_IMAGE_BYTES) {
      throw new BadRequestException('حجم تصویر بیشتر از ۱۵ مگابایت است');
    }

    const settings = this.getSettings();
    let buffer = file.buffer;
    let mimeType = mime;
    let ext = this.extensionFor(mime, file.originalname);
    let width: number | null = null;
    let height: number | null = null;

    if (isImage && mime !== 'image/svg+xml') {
      try {
        const meta = await sharp(buffer, { failOn: 'none' }).metadata();
        width = meta.width ?? null;
        height = meta.height ?? null;
      } catch {
        // keep null dimensions
      }

      if (settings.compressOnUpload && mime !== 'image/gif') {
        const compressed = await this.compressBuffer(buffer, settings);
        buffer = compressed.buffer;
        mimeType = compressed.mimeType;
        ext = compressed.ext;
        width = compressed.width;
        height = compressed.height;
      }
    }

    const checksum = createHash('sha256').update(buffer).digest('hex');
    const duplicate = await this.media.findOne({ where: { checksum, deletedAt: IsNull() } });
    if (duplicate) {
      // DB row may outlive files when MEDIA_ROOT is not on a persistent volume.
      const existingPath = safeJoinMedia(this.getRoot(), duplicate.relativePath);
      if (!existsSync(existingPath)) {
        ensureDir(dirname(existingPath));
        await fs.writeFile(existingPath, buffer);
      }
      return this.toView(duplicate);
    }

    const id = randomUUID();
    const { year, month } = dateFolderParts();
    const safeBase = this.sanitizeFilename(file.originalname || (isVideo ? 'video' : 'image'));
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
      folder: (options?.folder || 'general').trim().slice(0, 120) || 'general',
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
    if (!entity) throw new NotFoundException('تصویر در کتابخانه پیدا نشد');

    if (dto.altText !== undefined) entity.altText = dto.altText?.trim() || null;
    if (dto.title !== undefined) entity.title = dto.title?.trim() || null;
    if (dto.caption !== undefined) entity.caption = dto.caption?.trim() || null;
    if (dto.description !== undefined) entity.description = dto.description?.trim() || null;
    if (dto.folder !== undefined) entity.folder = dto.folder.trim().slice(0, 120) || 'general';
    if (dto.originalName !== undefined) entity.originalName = this.sanitizeFilename(dto.originalName);

    return this.toView(await this.media.save(entity));
  }

  async softDelete(id: string): Promise<{ ok: true }> {
    const entity = await this.media.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('تصویر در کتابخانه پیدا نشد');

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
    return { ok: true };
  }

  async restoreFromTrash(id: string): Promise<MediaAssetView> {
    const entity = await this.media.findOne({ where: { id }, withDeleted: true });
    if (!entity || !entity.deletedAt) throw new NotFoundException('آیتم در سطل زباله پیدا نشد');

    const trashFile = join(trashDir(this.getRoot()), `${entity.id}${extname(entity.storedName)}`);
    const dest = safeJoinMedia(this.getRoot(), entity.relativePath);
    ensureDir(dirname(dest));
    if (existsSync(trashFile)) {
      await fs.rename(trashFile, dest);
    } else if (!existsSync(dest)) {
      throw new BadRequestException('فایل فیزیکی تصویر در سطل زباله موجود نیست');
    }

    entity.deletedAt = null;
    return this.toView(await this.media.save(entity));
  }

  async purge(id: string): Promise<{ ok: true }> {
    const entity = await this.media.findOne({ where: { id }, withDeleted: true });
    if (!entity) throw new NotFoundException('تصویر پیدا نشد');

    for (const candidate of [
      safeJoinMedia(this.getRoot(), entity.relativePath),
      join(trashDir(this.getRoot()), `${entity.id}${extname(entity.storedName)}`),
    ]) {
      if (existsSync(candidate)) {
        await fs.unlink(candidate).catch(() => undefined);
      }
    }
    await this.media.remove(entity);
    return { ok: true };
  }

  async compress(id: string, dto: CompressMediaDto): Promise<MediaAssetView> {
    const entity = await this.media.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('تصویر در کتابخانه پیدا نشد');
    if (isVideoMime(entity.mimeType) || entity.mimeType === 'image/svg+xml' || entity.mimeType === 'image/gif') {
      throw new BadRequestException('فشرده‌سازی برای این نوع فایل پشتیبانی نمی‌شود');
    }

    const settings = clampSettings({
      ...this.getSettings(),
      quality: dto.quality,
      maxWidth: dto.maxWidth,
      maxHeight: dto.maxHeight,
      convertToWebp: dto.convertToWebp,
      stripMetadata: dto.stripMetadata,
    });

    const sourcePath = safeJoinMedia(this.getRoot(), entity.relativePath);
    if (!existsSync(sourcePath)) throw new BadRequestException('فایل تصویر روی دیسک موجود نیست');
    const sourceBuffer = await fs.readFile(sourcePath);
    const compressed = await this.compressBuffer(sourceBuffer, settings);
    const mode = dto.mode ?? 'copy';

    if (mode === 'replace') {
      const newRelative =
        extname(entity.relativePath).toLowerCase() === compressed.ext
          ? entity.relativePath
          : entity.relativePath.replace(/\.[^.]+$/, compressed.ext);
      const dest = safeJoinMedia(this.getRoot(), newRelative);
      ensureDir(dirname(dest));
      await fs.writeFile(dest, compressed.buffer);
      if (newRelative !== entity.relativePath && existsSync(sourcePath)) {
        await fs.unlink(sourcePath).catch(() => undefined);
      }
      entity.relativePath = newRelative;
      entity.storedName = basename(newRelative);
      entity.url = publicMediaUrl(newRelative);
      entity.mimeType = compressed.mimeType;
      entity.fileSize = compressed.buffer.length;
      entity.width = compressed.width;
      entity.height = compressed.height;
      entity.checksum = createHash('sha256').update(compressed.buffer).digest('hex');
      return this.toView(await this.media.save(entity));
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
      originalName: this.withSuffix(entity.originalName, '-compressed'),
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
      checksum: createHash('sha256').update(compressed.buffer).digest('hex'),
      parentId: entity.id,
      uploadedBy: entity.uploadedBy,
    });
    return this.toView(await this.media.save(copy));
  }

  async createBackupArchive(): Promise<{ filePath: string; fileName: string }> {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `media-backup-${stamp}.zip`;
    const filePath = join(backupsDir(this.getRoot()), fileName);
    ensureDir(backupsDir(this.getRoot()));

    const assets = await this.media.find({ withDeleted: false, order: { createdAt: 'ASC' } });
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
    zip.addFile('manifest.json', Buffer.from(JSON.stringify(manifest, null, 2), 'utf8'));
    for (const asset of assets) {
      const abs = safeJoinMedia(this.getRoot(), asset.relativePath);
      if (existsSync(abs)) {
        const fileBuffer = await fs.readFile(abs);
        zip.addFile(`files/${asset.relativePath.replace(/\\/g, '/')}`, fileBuffer);
      }
    }
    zip.writeZip(filePath);

    return { filePath, fileName };
  }

  async restoreFromZip(file: Express.Multer.File | undefined): Promise<{ restored: number; skipped: number }> {
    if (!file?.buffer?.length) throw new BadRequestException('فایل بک‌آپ ارسال نشده است');
    let zip: AdmZip;
    try {
      zip = new AdmZip(file.buffer);
    } catch {
      throw new BadRequestException('فایل ZIP نامعتبر است');
    }

    const manifestEntry = zip.getEntry('manifest.json');
    if (!manifestEntry) throw new BadRequestException('manifest.json در بک‌آپ پیدا نشد');

    const manifest = JSON.parse(manifestEntry.getData().toString('utf8')) as {
      settings?: Partial<MediaCompressionSettings>;
      assets?: Array<Partial<MediaAssetEntity> & { relativePath: string; id: string }>;
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

      const existing = await this.media.findOne({ where: { id: item.id }, withDeleted: true });
      if (existing) {
        Object.assign(existing, {
          originalName: item.originalName ?? existing.originalName,
          storedName: item.storedName ?? existing.storedName,
          relativePath: item.relativePath,
          url: item.url ?? publicMediaUrl(item.relativePath),
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
            url: item.url || publicMediaUrl(item.relativePath),
            mimeType: item.mimeType || 'image/jpeg',
            fileSize: item.fileSize || entry.header.size,
            width: item.width ?? null,
            height: item.height ?? null,
            folder: item.folder || 'general',
            altText: item.altText ?? null,
            title: item.title ?? null,
            caption: item.caption ?? null,
            description: item.description ?? null,
            checksum: item.checksum ?? null,
            parentId: item.parentId ?? null,
            uploadedBy: item.uploadedBy || 'restore',
          }),
        );
      }
      restored += 1;
    }

    return { restored, skipped };
  }

  async usage(id: string): Promise<{
    url: string;
    references: Array<{ table: string; field: string; id: string; label: string }>;
  }> {
    const asset = await this.findOne(id);
    const url = asset.url;
    const absolute = asset.absoluteUrl;
    const needles = Array.from(new Set([url, absolute].filter(Boolean)));
    const references: Array<{ table: string; field: string; id: string; label: string }> = [];

    const productRows = await this.media.manager
      .createQueryBuilder()
      .select(['p.id AS id', 'p.name_fa AS label', 'p.thumbnail_image_url AS thumb', 'p.gallery AS gallery'])
      .from('products', 'p')
      .getRawMany<{ id: string; label: string; thumb: string | null; gallery: string | null }>();
    for (const row of productRows) {
      if (needles.includes(row.thumb ?? '')) {
        references.push({ table: 'products', field: 'thumbnail_image_url', id: row.id, label: row.label });
      }
      if (this.jsonIncludesUrl(row.gallery, needles)) {
        references.push({ table: 'products', field: 'gallery', id: row.id, label: row.label });
      }
    }

    const spareRows = await this.media.manager
      .createQueryBuilder()
      .select(['s.id AS id', 's.name_fa AS label'])
      .from('spare_parts', 's')
      .where('s.image_url IN (:...needles)', { needles })
      .getRawMany<{ id: string; label: string }>();
    for (const row of spareRows) {
      references.push({ table: 'spare_parts', field: 'image_url', id: row.id, label: row.label });
    }

    const portfolioRows = await this.media.manager
      .createQueryBuilder()
      .select(['w.id AS id', 'w.title_fa AS label', 'w.cover_image_url AS cover', 'w.gallery AS gallery'])
      .from('portfolio_works', 'w')
      .getRawMany<{ id: string; label: string; cover: string | null; gallery: string | null }>();
    for (const row of portfolioRows) {
      if (needles.includes(row.cover ?? '')) {
        references.push({ table: 'portfolio_works', field: 'cover_image_url', id: row.id, label: row.label });
      }
      if (this.jsonIncludesUrl(row.gallery, needles)) {
        references.push({ table: 'portfolio_works', field: 'gallery', id: row.id, label: row.label });
      }
    }

    const projectRows = await this.media.manager
      .createQueryBuilder()
      .select(['p.id AS id', 'p.project_name AS label', 'p.cover_image_url AS cover', 'p.gallery AS gallery'])
      .from('projects', 'p')
      .getRawMany<{ id: string; label: string; cover: string | null; gallery: string | null }>();
    for (const row of projectRows) {
      if (needles.includes(row.cover ?? '')) {
        references.push({ table: 'projects', field: 'cover_image_url', id: row.id, label: row.label });
      }
      if (this.jsonIncludesUrl(row.gallery, needles)) {
        references.push({ table: 'projects', field: 'gallery', id: row.id, label: row.label });
      }
    }

    return { url, references };
  }

  private jsonIncludesUrl(raw: string | null, needles: string[]): boolean {
    if (!raw) return false;
    try {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      if (!Array.isArray(parsed)) return needles.some((n) => String(raw).includes(n));
      return parsed.some((item) => needles.includes(String(item)));
    } catch {
      return needles.some((n) => String(raw).includes(n));
    }
  }

  private async compressBuffer(
    buffer: Buffer,
    settings: MediaCompressionSettings,
  ): Promise<{ buffer: Buffer; mimeType: string; ext: string; width: number | null; height: number | null }> {
    let image = sharp(buffer, { failOn: 'none' }).rotate();
    image = image.resize({
      width: settings.maxWidth,
      height: settings.maxHeight,
      fit: 'inside',
      withoutEnlargement: true,
    });
    // sharp strips most metadata by default; keep orientation already applied via rotate()
    if (!settings.stripMetadata) {
      image = image.withMetadata();
    }

    let out: Buffer;
    let mimeType: string;
    let ext: string;

    if (settings.convertToWebp) {
      out = await image.webp({ quality: settings.quality, effort: 4 }).toBuffer();
      mimeType = 'image/webp';
      ext = '.webp';
    } else {
      const meta = await sharp(buffer, { failOn: 'none' }).metadata();
      if (meta.format === 'png') {
        out = await image.png({ compressionLevel: 9 }).toBuffer();
        mimeType = 'image/png';
        ext = '.png';
      } else {
        out = await image.jpeg({ quality: settings.quality, mozjpeg: true }).toBuffer();
        mimeType = 'image/jpeg';
        ext = '.jpg';
      }
    }

    const outMeta = await sharp(out, { failOn: 'none' }).metadata();
    return {
      buffer: out,
      mimeType,
      ext,
      width: outMeta.width ?? null,
      height: outMeta.height ?? null,
    };
  }

  private extensionFor(mime: string, originalName: string): string {
    const fromName = extname(originalName || '').toLowerCase();
    if (fromName && fromName.length <= 8) return fromName;
    switch (mime) {
      case 'image/png':
        return '.png';
      case 'image/webp':
        return '.webp';
      case 'image/gif':
        return '.gif';
      case 'image/svg+xml':
        return '.svg';
      case 'image/avif':
        return '.avif';
      case 'video/mp4':
        return '.mp4';
      case 'video/webm':
        return '.webm';
      case 'video/quicktime':
        return '.mov';
      case 'video/x-msvideo':
        return '.avi';
      case 'video/ogg':
        return '.ogv';
      default:
        return mime.startsWith('video/') ? '.mp4' : '.jpg';
    }
  }

  private sanitizeFilename(name: string): string {
    const base = basename(name || 'image').replace(/[^\w.\u0600-\u06FF\-]+/g, '_');
    return base.slice(0, 180) || 'image';
  }

  private withSuffix(name: string, suffix: string): string {
    const ext = extname(name);
    const stem = ext ? name.slice(0, -ext.length) : name;
    return `${stem}${suffix}${ext || ''}`;
  }
}
