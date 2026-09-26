import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Normalize leftover absolute media hosts and cover spare_parts.image_url
 * (missed by 1710000016000).
 */
export class NormalizeSparePartMediaUrls1710000017000
  implements MigrationInterface
{
  name = "NormalizeSparePartMediaUrls1710000017000";

  async up(queryRunner: QueryRunner): Promise<void> {
    const isPostgres = queryRunner.connection.options.type === "postgres";

    if (await queryRunner.hasTable("spare_parts")) {
      if (await queryRunner.hasColumn("spare_parts", "image_url")) {
        await this.rewriteStringColumn(
          queryRunner,
          isPostgres,
          "spare_parts",
          "image_url",
          "id",
        );
      }
    }

    // Re-normalize common media columns in case absolute hosts reappeared before the proxy fix.
    for (const [table, column] of [
      ["media_assets", "url"],
      ["products", "thumbnail_image_url"],
      ["portfolio_works", "cover_image_url"],
      ["projects", "cover_image_url"],
      ["attachments", "file_url"],
    ] as const) {
      if (
        (await queryRunner.hasTable(table)) &&
        (await queryRunner.hasColumn(table, column))
      ) {
        await this.rewriteStringColumn(
          queryRunner,
          isPostgres,
          table,
          column,
          "id",
        );
      }
    }

    for (const [table, column] of [
      ["products", "gallery"],
      ["portfolio_works", "gallery"],
      ["projects", "gallery"],
    ] as const) {
      if (
        (await queryRunner.hasTable(table)) &&
        (await queryRunner.hasColumn(table, column))
      ) {
        await this.rewriteJsonUrlArray(
          queryRunner,
          isPostgres,
          table,
          column,
          "id",
        );
      }
    }
  }

  async down(): Promise<void> {
    // Irreversible data cleanup.
  }

  private toRelativeMediaPath(urlOrPath: unknown): string {
    const raw = String(urlOrPath ?? "").trim();
    if (!raw) return "";
    if (raw.startsWith("data:") || raw.startsWith("blob:")) return raw;

    let value = raw.replace(/\\/g, "/");

    try {
      if (/^https?:\/\//i.test(value)) {
        const parsed = new URL(value);
        let pathname = parsed.pathname || "";
        if (pathname.startsWith("/api/media/")) pathname = pathname.slice(4);
        if (pathname.startsWith("/media/")) {
          return `${pathname}${parsed.search}`.replace(/\/{2,}/g, "/");
        }
        return value;
      }
    } catch {
      /* ignore */
    }

    if (value.startsWith("/api/media/")) value = value.slice(4);
    if (value.startsWith("/media/")) return value.replace(/\/{2,}/g, "/");
    if (/^media\//i.test(value)) return `/${value}`.replace(/\/{2,}/g, "/");
    if (/^\d{4}\/\d{2}\//.test(value)) return `/media/${value}`;
    return value;
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
      if (row.value == null || row.value === "") continue;
      const next = this.toRelativeMediaPath(row.value);
      if (!next || next === row.value) continue;
      if (isPostgres) {
        await queryRunner.query(
          `UPDATE "${table}" SET "${column}" = $1 WHERE "${idColumn}" = $2`,
          [next, row.id],
        );
      } else {
        await queryRunner.query(
          `UPDATE "${table}" SET "${column}" = ? WHERE "${idColumn}" = ?`,
          [next, row.id],
        );
      }
    }
  }

  private parseUrlList(value: string | string[] | null | undefined): string[] {
    if (Array.isArray(value)) {
      return value.map((item) => String(item ?? "").trim()).filter(Boolean);
    }
    if (typeof value !== "string" || !value.trim()) return [];
    try {
      const parsed = JSON.parse(value) as unknown;
      if (!Array.isArray(parsed)) return [];
      return parsed.map((item) => String(item ?? "").trim()).filter(Boolean);
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

      const next = prev
        .map((item) => this.toRelativeMediaPath(item))
        .filter(Boolean);
      if (JSON.stringify(next) === JSON.stringify(prev)) continue;

      const payload = JSON.stringify(next);
      if (isPostgres) {
        await queryRunner.query(
          `UPDATE "${table}" SET "${column}" = $1 WHERE "${idColumn}" = $2`,
          [payload, row.id],
        );
      } else {
        await queryRunner.query(
          `UPDATE "${table}" SET "${column}" = ? WHERE "${idColumn}" = ?`,
          [payload, row.id],
        );
      }
    }
  }
}
