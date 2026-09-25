const test = require('node:test');
const assert = require('node:assert/strict');
const AdmZip = require('adm-zip');
const { MediaService } = require('../dist/media/media.service.js');
const { BackupService } = require('../dist/backup/backup.service.js');

test('media upload rejects bytes that do not match the declared MIME type', async () => {
  const service = new MediaService({});
  await assert.rejects(
    service.upload({ userId: 'admin' }, { buffer: Buffer.from('not a png'), size: 10, mimetype: 'image/png', originalname: 'x.png' }),
    /محتوای واقعی فایل/,
  );
});

test('media upload rejects active SVG scripts', async () => {
  const service = new MediaService({});
  const svg = Buffer.from('<svg><script>alert(1)</script></svg>');
  await assert.rejects(
    service.upload({ userId: 'admin' }, { buffer: svg, size: svg.length, mimetype: 'image/svg+xml', originalname: 'x.svg' }),
    /SVG معتبر یا امن نیست/,
  );
});

test('backup inspection rejects ZIP path traversal and executable entries', async () => {
  const zip = new AdmZip();
  zip.addFile('../evil.sh', Buffer.from('echo hacked'));
  const service = new BackupService({});
  await assert.rejects(
    service.inspectArchive({ buffer: zip.toBuffer(), size: zip.toBuffer().length }),
    /مسیر یکی از فایل‌های ZIP ناامن|فایل اجرایی داخل ZIP/,
  );
});
