import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Rewrite absolute media hosts (e.g. http://localhost:3001/media/...) to portable `/media/...` paths.
 * Runs once via migrationsRun on backend boot.
 */
export class NormalizeMediaUrls1710000016000 implements MigrationInterface {
  name = 'NormalizeMediaUrls1710000016000';

  async up(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === 'postgres';

    if (await queryRunner.hasTable('media_assets')) {
      await this.rewriteStringColumn(queryRunner, isPostgres, 'media_assets', 'url', 'id');
    }

    if (await queryRunner.hasTable('products')) {
      if (await queryRunner.hasColumn('products', 'thumbnail_image_url')) {
        await this.rewriteStringColumn(queryRunner, isPostgres, 'products', 'thumbnail_image_url', 'id');
      }
      if (await queryRunner.hasColumn('products', 'gallery')) {
        await this.rewriteJsonUrlArray(queryRunner, isPostgres, 'products', 'gallery', 'id');
      }
    }

    if (await queryRunner.hasTable('portfolio_works')) {
      if (await queryRunner.hasColumn('portfolio_works', 'cover_image_url')) {
        await this.rewriteStringColumn(queryRunner, isPostgres, 'portfolio_works', 'cover_image_url', 'id');
      }
      if (await queryRunner.hasColumn('portfolio_works', 'gallery')) {
        await this.rewriteJsonUrlArray(queryRunner, isPostgres, 'portfolio_works', 'gallery', 'id');
      }
    }

    if (await queryRunner.hasTable('projects')) {
      if (await queryRunner.hasColumn('projects', 'cover_image_url')) {
        await this.rewriteStringColumn(queryRunner, isPostgres, 'projects', 'cover_image_url', 'id');
      }
      if (await queryRunner.hasColumn('projects', 'gallery')) {
        await this.rewriteJsonUrlArray(queryRunner, isPostgres, 'projects', 'gallery', 'id');
      }
    }

    if (await queryRunner.hasTable('attachments') && (await queryRunner.hasColumn('attachments', 'file_url'))) {
      await this.rewriteStringColumn(queryRunner, isPostgres, 'attachments', 'file_url', 'id');
    }
  }

  async down(): Promise<void> {
    // Irreversible data cleanup — absolute hosts cannot be reconstructed safely.
  }

  private toRelativeMediaPath(urlOrPath: unknown): string {
    const raw = String(urlOrPath ?? '').trim();
    if (!raw) return '';
    if (raw.startsWith('/media/')) return raw.replace(/\/{2,}/g, '/');
    if (raw.startsWith('data:')) return raw;

    try {
      if (/^https?:\/\//i.test(raw)) {
        const parsed = new URL(raw);
        if (parsed.pathname.startsWith('/media/')) {
          return `${parsed.pathname}${parsed.search}`;
        }
        return raw;
      }
    } catch {
      /* ignore */
    }

    if (/^\d{4}\/\d{2}\//.test(raw)) return `/media/${raw}`;
    return raw;
  }

  private async rewriteStringColumn(
    queryRunner: QueryRunner,
    isPostgres: boolean,
    table: string,
    column: string,
    idColumn: string,
  ): Promise<void> {
    const rows = (await queryRunner.query(
      `SELECT "${idColumn}" AS id, "${column}" AS value FROM "${table}"`,
    )) as Array<{ id: string; value: string | null }>;

    for (const row of rows) {
      if (row.value == null || row.value === '') continue;
      const next = this.toRelativeMediaPath(row.value);
      if (!next || next === row.value) continue;
      if (isPostgres) {
        await queryRunner.query(`UPDATE "${table}" SET "${column}" = $1 WHERE "${idColumn}" = $2`, [next, row.id]);
      } else {
        await queryRunner.query(`UPDATE "${table}" SET "${column}" = ? WHERE "${idColumn}" = ?`, [next, row.id]);
      }
    }
  }

  private parseUrlList(value: string | string[] | null | undefined): string[] {
    if (Array.isArray(value)) {
      return value.map((item) => String(item ?? '').trim()).filter(Boolean);
    }
    if (typeof value !== 'string' || !value.trim()) return [];
    try {
      const parsed = JSON.parse(value) as unknown;
      if (!Array.isArray(parsed)) return [];
      return parsed.map((item) => String(item ?? '').trim()).filter(Boolean);
    } catch {
      return [];
    }
  }

  private async rewriteJsonUrlArray(
    queryRunner: QueryRunner,
    isPostgres: boolean,
    table: string,
    column: string,
    idColumn: string,
  ): Promise<void> {
    const rows = (await queryRunner.query(
      `SELECT "${idColumn}" AS id, "${column}" AS value FROM "${table}"`,
    )) as Array<{ id: string; value: string | string[] | null }>;

    for (const row of rows) {
      const prev = this.parseUrlList(row.value);
      if (prev.length === 0) continue;

      const next = prev.map((item) => this.toRelativeMediaPath(item)).filter(Boolean);
      if (JSON.stringify(next) === JSON.stringify(prev)) continue;

      const payload = JSON.stringify(next);
      if (isPostgres) {
        await queryRunner.query(`UPDATE "${table}" SET "${column}" = $1 WHERE "${idColumn}" = $2`, [payload, row.id]);
      } else {
        await queryRunner.query(`UPDATE "${table}" SET "${column}" = ? WHERE "${idColumn}" = ?`, [payload, row.id]);
      }
    }
  }
}
