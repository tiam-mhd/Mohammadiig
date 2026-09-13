import {
  BadRequestException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { createHash } from 'node:crypto';
import { existsSync, promises as fs, createReadStream } from 'node:fs';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import AdmZip from 'adm-zip';
import {
  DataSource,
  EntityTarget,
  ObjectLiteral,
  QueryRunner,
  Repository,
} from 'typeorm';
import {
  ALL_DATASET_KEYS,
  BACKUP_DATASET_MAP,
  BACKUP_DATASETS,
  BackupDatasetKey,
  RestoreConflictMode,
  sortDatasetsForClear,
  sortDatasetsForRestore,
} from './backup.datasets';
import { normalizeDatasetSelection } from './dto/backup.dto';
import { ensureDir, resolveMediaRoot, safeJoinMedia } from '../media/media-paths';

const FORMAT = 'mohammadiig-backup';
const VERSION = 1;

type BackupManifest = {
  format: typeof FORMAT;
  version: number;
  createdAt: string;
  datasets: BackupDatasetKey[];
  counts: Record<string, number>;
  tableCounts: Record<string, number>;
  includeSoftDeleted: boolean;
  includeMediaFiles: boolean;
  notes?: string[];
};

type TablePayload = {
  name: string;
  rows: Record<string, unknown>[];
};

type DatasetPayload = {
  key: BackupDatasetKey;
  tables: TablePayload[];
};

type RestoreTableStats = {
  table: string;
  inserted: number;
  updated: number;
  skipped: number;
  cleared: number;
  errors: string[];
};

export type RestoreReport = {
  dryRun: boolean;
  mode: RestoreConflictMode;
  datasets: BackupDatasetKey[];
  tables: RestoreTableStats[];
  mediaFilesRestored: number;
  mediaFilesSkipped: number;
  warnings: string[];
};

@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);

  constructor(private readonly dataSource: DataSource) {}

  listDatasets() {
    return BACKUP_DATASETS.map((d) => ({
      key: d.key,
      labelFa: d.labelFa,
      descriptionFa: d.descriptionFa,
      groupFa: d.groupFa,
      dependsOn: d.dependsOn,
      includesFiles: Boolean(d.includesFiles),
      warningFa: d.warningFa ?? null,
      tables: d.tables.map((t) => t.name),
    }));
  }

  async getDatasetCounts(includeSoftDeleted = true): Promise<
    Array<{
      key: BackupDatasetKey;
      labelFa: string;
      groupFa: string;
      count: number;
      tableCounts: Record<string, number>;
      warningFa: string | null;
      includesFiles: boolean;
      dependsOn: BackupDatasetKey[];
    }>
  > {
    const result = [];
    for (const dataset of BACKUP_DATASETS) {
      const tableCounts: Record<string, number> = {};
      let total = 0;
      for (const table of dataset.tables) {
        const repo = this.repo(table.entity);
        const count = table.softDelete && includeSoftDeleted
          ? await repo.count({ withDeleted: true })
          : await repo.count();
        tableCounts[table.name] = count;
        total += count;
      }
      result.push({
        key: dataset.key,
        labelFa: dataset.labelFa,
        groupFa: dataset.groupFa,
        count: total,
        tableCounts,
        warningFa: dataset.warningFa ?? null,
        includesFiles: Boolean(dataset.includesFiles),
        dependsOn: dataset.dependsOn,
      });
    }
    return result;
  }

  async createExportArchive(options: {
    datasets?: string[];
    includeSoftDeleted?: boolean;
    includeMediaFiles?: boolean;
  }): Promise<{ filePath: string; fileName: string; manifest: BackupManifest }> {
    const selection = normalizeDatasetSelection(options.datasets);
    const keys =
      selection === 'all'
        ? ALL_DATASET_KEYS
        : sortDatasetsForRestore(selection);
    const includeSoftDeleted = options.includeSoftDeleted !== false;
    const includeMediaFiles = options.includeMediaFiles !== false;

    const notes: string[] = [];
    if (keys.includes('users')) {
      notes.push('این بک‌آپ شامل هش رمز عبور کاربران است.');
    }

    const payloads: DatasetPayload[] = [];
    const counts: Record<string, number> = {};
    const tableCounts: Record<string, number> = {};

    for (const key of keys) {
      const def = BACKUP_DATASET_MAP[key];
      const tables: TablePayload[] = [];
      let datasetTotal = 0;
      for (const table of def.tables) {
        const repo = this.repo(table.entity);
        const rows = table.softDelete && includeSoftDeleted
          ? await repo.find({ withDeleted: true })
          : await repo.find();
        const plain = rows.map((row) => this.serializeRow(row as ObjectLiteral));
        tables.push({ name: table.name, rows: plain });
        tableCounts[table.name] = plain.length;
        datasetTotal += plain.length;
      }
      counts[key] = datasetTotal;
      payloads.push({ key, tables });
    }

    const manifest: BackupManifest = {
      format: FORMAT,
      version: VERSION,
      createdAt: new Date().toISOString(),
      datasets: keys,
      counts,
      tableCounts,
      includeSoftDeleted,
      includeMediaFiles: includeMediaFiles && keys.includes('media'),
      notes: notes.length ? notes : undefined,
    };

    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `mig-backup-${stamp}.zip`;
    const filePath = join(tmpdir(), fileName);

    const zip = new AdmZip();
    zip.addFile('manifest.json', Buffer.from(JSON.stringify(manifest, null, 2), 'utf8'));
    zip.addFile('data.json', Buffer.from(JSON.stringify({ datasets: payloads }, null, 2), 'utf8'));

    if (manifest.includeMediaFiles) {
      const mediaRoot = resolveMediaRoot();
      const mediaPayload = payloads.find((p) => p.key === 'media');
      const assetsTable = mediaPayload?.tables.find((t) => t.name === 'media_assets');
      for (const row of assetsTable?.rows ?? []) {
        const relativePath = String(row.relativePath ?? '');
        if (!relativePath) continue;
        try {
          const abs = safeJoinMedia(mediaRoot, relativePath);
          if (!existsSync(abs)) continue;
          const buffer = await fs.readFile(abs);
          zip.addFile(`media-files/${relativePath.replace(/\\/g, '/')}`, buffer);
        } catch (error) {
          this.logger.warn(`Skip media file ${relativePath}: ${String(error)}`);
        }
      }
    }

    zip.writeZip(filePath);
    return { filePath, fileName, manifest };
  }

  async inspectArchive(file: Express.Multer.File | undefined) {
    const { manifest, payloads } = this.readArchive(file);
    return {
      manifest,
      availableDatasets: manifest.datasets.map((key) => ({
        key,
        labelFa: BACKUP_DATASET_MAP[key]?.labelFa ?? key,
        groupFa: BACKUP_DATASET_MAP[key]?.groupFa ?? 'سایر',
        count: manifest.counts[key] ?? 0,
        inFile: true,
        warningFa: BACKUP_DATASET_MAP[key]?.warningFa ?? null,
        includesFiles: Boolean(BACKUP_DATASET_MAP[key]?.includesFiles),
        dependsOn: BACKUP_DATASET_MAP[key]?.dependsOn ?? [],
      })),
      tableCounts: manifest.tableCounts,
      datasetDetails: payloads.map((p) => ({
        key: p.key,
        tables: p.tables.map((t) => ({ name: t.name, rows: t.rows.length })),
      })),
    };
  }

  async restoreArchive(
    file: Express.Multer.File | undefined,
    options: {
      datasets?: string[];
      mode: RestoreConflictMode;
      dryRun?: boolean;
      restoreMediaFiles?: boolean;
      protectCurrentAdmin?: boolean;
      currentUserId?: string;
    },
  ): Promise<RestoreReport> {
    const { manifest, payloads, zip } = this.readArchive(file);
    const selection = normalizeDatasetSelection(options.datasets);
    const requested =
      selection === 'all'
        ? manifest.datasets
        : selection.filter((k) => manifest.datasets.includes(k));

    if (!requested.length) {
      throw new BadRequestException('هیچ دیتاست معتبری برای بازیابی انتخاب نشده است');
    }

    const warnings: string[] = [];
    for (const key of requested) {
      const missing = BACKUP_DATASET_MAP[key].dependsOn.filter(
        (dep) => !requested.includes(dep) && !manifest.datasets.includes(dep),
      );
      // Soft warning if dependency not being restored in this run
      for (const dep of BACKUP_DATASET_MAP[key].dependsOn) {
        if (!requested.includes(dep)) {
          warnings.push(
            `دیتاست «${BACKUP_DATASET_MAP[key].labelFa}» معمولاً به «${BACKUP_DATASET_MAP[dep].labelFa}» وابسته است ولی در این بازیابی انتخاب نشده.`,
          );
        }
      }
      void missing;
    }

    const ordered = sortDatasetsForRestore(requested);
    const dryRun = Boolean(options.dryRun);
    const mode = options.mode;
    const restoreMediaFiles = options.restoreMediaFiles !== false;
    const protectCurrentAdmin = options.protectCurrentAdmin !== false;
    const currentUserId = options.currentUserId;

    const report: RestoreReport = {
      dryRun,
      mode,
      datasets: ordered,
      tables: [],
      mediaFilesRestored: 0,
      mediaFilesSkipped: 0,
      warnings,
    };

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await this.disableForeignKeys(queryRunner);

      if (mode === 'replace' && !dryRun) {
        for (const key of sortDatasetsForClear(ordered)) {
          const def = BACKUP_DATASET_MAP[key];
          for (const table of [...def.tables].reverse()) {
            const stats = this.emptyStats(table.name);
            const repo = queryRunner.manager.getRepository(table.entity);
            if (key === 'users' && protectCurrentAdmin && currentUserId) {
              const deleted = await repo
                .createQueryBuilder()
                .delete()
                .where('id != :id', { id: currentUserId })
                .execute();
              stats.cleared = deleted.affected ?? 0;
            } else {
              const deleted = await repo.createQueryBuilder().delete().execute();
              stats.cleared = deleted.affected ?? 0;
            }
            report.tables.push(stats);
          }
        }
      }

      for (const key of ordered) {
        const payload = payloads.find((p) => p.key === key);
        if (!payload) continue;
        const def = BACKUP_DATASET_MAP[key];

        for (const tableDef of def.tables) {
          const tableData = payload.tables.find((t) => t.name === tableDef.name);
          const rows = tableData?.rows ?? [];
          // Find existing stats from replace clear, or create new
          let stats = report.tables.find((t) => t.table === tableDef.name);
          if (!stats) {
            stats = this.emptyStats(tableDef.name);
            report.tables.push(stats);
          }

          const repo = queryRunner.manager.getRepository(tableDef.entity);

          for (const raw of rows) {
            const row = this.deserializeRow(raw);
            const id = String(row.id ?? '');
            if (!id) {
              stats.skipped += 1;
              stats.errors.push('ردیف بدون شناسه رد شد');
              continue;
            }

            if (
              key === 'users' &&
              protectCurrentAdmin &&
              currentUserId &&
              id === currentUserId &&
              mode !== 'skip'
            ) {
              // Still allow skip path; for overwrite/replace keep current admin intact
              stats.skipped += 1;
              continue;
            }

            try {
              const existing = tableDef.softDelete
                ? await repo.findOne({ where: { id } as never, withDeleted: true })
                : await repo.findOne({ where: { id } as never });

              if (dryRun) {
                if (mode === 'replace') {
                  stats.inserted += 1;
                } else if (!existing) {
                  stats.inserted += 1;
                } else if (mode === 'skip') {
                  stats.skipped += 1;
                } else {
                  stats.updated += 1;
                }
                continue;
              }

              if (!existing) {
                await repo.save(repo.create(row));
                stats.inserted += 1;
              } else if (mode === 'skip') {
                stats.skipped += 1;
              } else {
                // overwrite or replace (after clear, usually insert path; still handle leftovers)
                await repo.save({ ...existing, ...row, id });
                stats.updated += 1;
              }
            } catch (error) {
              stats.skipped += 1;
              stats.errors.push(
                `ردیف ${id}: ${error instanceof Error ? error.message : String(error)}`,
              );
            }
          }
        }
      }

      if (ordered.includes('media') && restoreMediaFiles && manifest.includeMediaFiles) {
        const mediaRoot = resolveMediaRoot();
        const mediaPayload = payloads.find((p) => p.key === 'media');
        const assets = mediaPayload?.tables.find((t) => t.name === 'media_assets')?.rows ?? [];
        for (const row of assets) {
          const relativePath = String(row.relativePath ?? '');
          if (!relativePath) {
            report.mediaFilesSkipped += 1;
            continue;
          }
          const entry = zip.getEntry(`media-files/${relativePath.replace(/\\/g, '/')}`);
          if (!entry) {
            report.mediaFilesSkipped += 1;
            continue;
          }
          if (dryRun) {
            report.mediaFilesRestored += 1;
            continue;
          }
          try {
            const dest = safeJoinMedia(mediaRoot, relativePath);
            ensureDir(dirname(dest));
            await fs.writeFile(dest, entry.getData());
            report.mediaFilesRestored += 1;
          } catch (error) {
            report.mediaFilesSkipped += 1;
            report.warnings.push(
              `فایل رسانه ${relativePath}: ${error instanceof Error ? error.message : String(error)}`,
            );
          }
        }
      }

      await this.enableForeignKeys(queryRunner);

      if (dryRun) {
        await queryRunner.rollbackTransaction();
      } else {
        await queryRunner.commitTransaction();
      }
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }

    return report;
  }

  streamFile(filePath: string) {
    return createReadStream(filePath);
  }

  async cleanupTemp(filePath: string) {
    try {
      await fs.unlink(filePath);
    } catch {
      /* ignore */
    }
  }

  private readArchive(file: Express.Multer.File | undefined): {
    manifest: BackupManifest;
    payloads: DatasetPayload[];
    zip: AdmZip;
  } {
    if (!file?.buffer?.length) {
      throw new BadRequestException('فایل بک‌آپ ارسال نشده است');
    }
    let zip: AdmZip;
    try {
      zip = new AdmZip(file.buffer);
    } catch {
      throw new BadRequestException('فایل ZIP نامعتبر است');
    }

    const manifestEntry = zip.getEntry('manifest.json');
    const dataEntry = zip.getEntry('data.json');
    if (!manifestEntry || !dataEntry) {
      throw new BadRequestException('ساختار بک‌آپ ناقص است (manifest/data)');
    }

    let manifest: BackupManifest;
    let payloads: DatasetPayload[];
    try {
      manifest = JSON.parse(manifestEntry.getData().toString('utf8')) as BackupManifest;
      const data = JSON.parse(dataEntry.getData().toString('utf8')) as { datasets: DatasetPayload[] };
      payloads = data.datasets ?? [];
    } catch {
      throw new BadRequestException('خواندن محتوای بک‌آپ ممکن نشد');
    }

    if (manifest.format !== FORMAT) {
      throw new BadRequestException('این فایل بک‌آپ سامانه محمدی نیست');
    }
    if (!manifest.version || manifest.version > VERSION) {
      throw new BadRequestException('نسخه بک‌آپ پشتیبانی نمی‌شود');
    }

    const known = new Set<string>(ALL_DATASET_KEYS);
    manifest.datasets = (manifest.datasets ?? []).filter((k): k is BackupDatasetKey => known.has(k));
    payloads = payloads.filter((p) => known.has(p.key));

    return { manifest, payloads, zip };
  }

  private repo(entity: EntityTarget<ObjectLiteral>): Repository<ObjectLiteral> {
    return this.dataSource.getRepository(entity);
  }

  private serializeRow(row: ObjectLiteral): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(row)) {
      if (value instanceof Date) out[key] = value.toISOString();
      else out[key] = value;
    }
    return out;
  }

  private deserializeRow(row: Record<string, unknown>): Record<string, unknown> {
    const out: Record<string, unknown> = { ...row };
    for (const key of ['createdAt', 'updatedAt', 'deletedAt', 'lastLoginAt']) {
      if (out[key] === undefined) continue;
      // keep string dates; TypeORM accepts ISO strings for date columns in most drivers
    }
    return out;
  }

  private emptyStats(table: string): RestoreTableStats {
    return { table, inserted: 0, updated: 0, skipped: 0, cleared: 0, errors: [] };
  }

  private async disableForeignKeys(queryRunner: QueryRunner) {
    if (this.dataSource.options.type === 'better-sqlite3' || this.dataSource.options.type === 'sqlite') {
      await queryRunner.query('PRAGMA foreign_keys = OFF');
      return;
    }
    if (this.dataSource.options.type === 'postgres') {
      await queryRunner.query("SET session_replication_role = 'replica'");
    }
  }

  private async enableForeignKeys(queryRunner: QueryRunner) {
    if (this.dataSource.options.type === 'better-sqlite3' || this.dataSource.options.type === 'sqlite') {
      await queryRunner.query('PRAGMA foreign_keys = ON');
      return;
    }
    if (this.dataSource.options.type === 'postgres') {
      await queryRunner.query("SET session_replication_role = 'origin'");
    }
  }

  /** Hash helper kept for future integrity checks */
  checksum(buffer: Buffer): string {
    return createHash('sha256').update(buffer).digest('hex');
  }
}
