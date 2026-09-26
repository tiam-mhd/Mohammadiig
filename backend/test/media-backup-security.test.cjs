const test = require("node:test");
const assert = require("node:assert/strict");
const AdmZip = require("adm-zip");
const fs = require("node:fs");
const path = require("node:path");
const { MediaService } = require("../dist/media/media.service.js");
const { BackupService } = require("../dist/backup/backup.service.js");

test("media upload rejects bytes that do not match the declared MIME type", async () => {
  const service = new MediaService({});
  await assert.rejects(
    service.upload(
      { userId: "admin" },
      {
        buffer: Buffer.from("not a png"),
        size: 10,
        mimetype: "image/png",
        originalname: "x.png",
      },
    ),
    /محتوای واقعی فایل/,
  );
});

test("media upload rejects active SVG scripts", async () => {
  const service = new MediaService({});
  const svg = Buffer.from("<svg><script>alert(1)</script></svg>");
  await assert.rejects(
    service.upload(
      { userId: "admin" },
      {
        buffer: svg,
        size: svg.length,
        mimetype: "image/svg+xml",
        originalname: "x.svg",
      },
    ),
    /SVG معتبر یا امن نیست/,
  );
});

test("backup inspection rejects ZIP path traversal and executable entries", async () => {
  const zip = new AdmZip();
  zip.addFile("../evil.sh", Buffer.from("echo hacked"));
  const service = new BackupService({});
  await assert.rejects(
    service.inspectArchive({
      buffer: zip.toBuffer(),
      size: zip.toBuffer().length,
    }),
    /مسیر یکی از فایل‌های ZIP ناامن|فایل اجرایی داخل ZIP/,
  );
});

test("media compression restores the original file when persistence fails", async () => {
  const root = fs.mkdtempSync(
    path.join(require("node:os").tmpdir(), "mig-media-"),
  );
  process.env.MEDIA_ROOT = root;
  const original = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
    "base64",
  );
  const entity = {
    id: "asset-1",
    relativePath: "2026/01/asset-1.png",
    storedName: "asset-1.png",
    url: "/media/2026/01/asset-1.png",
    mimeType: "image/png",
    fileSize: original.length,
    width: 1,
    height: 1,
    checksum: "old",
    originalName: "asset.png",
  };
  const absolute = path.join(root, entity.relativePath);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, original);
  const service = new MediaService({
    findOne: async () => entity,
    save: async () => {
      throw new Error("db failure");
    },
  });
  await assert.rejects(
    service.compress(entity.id, { mode: "replace", quality: 80 }),
    /بازگردانی شد/,
  );
  assert.deepEqual(fs.readFileSync(absolute), original);
  fs.rmSync(root, { recursive: true, force: true });
});
