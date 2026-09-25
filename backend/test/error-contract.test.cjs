const test = require('node:test');
const assert = require('node:assert/strict');
const { BadRequestException } = require('@nestjs/common');
const { HttpExceptionFilter } = require('../dist/common/http-exception.filter.js');

test('central exception filter returns Persian safe error and correlation header', () => {
  let body; let status; const headers = {};
  const response = { setHeader: (key, value) => { headers[key] = value; }, status: (value) => { status = value; return { json: (value) => { body = value; } }; } };
  new HttpExceptionFilter().catch(new BadRequestException('invalid payload'), { switchToHttp: () => ({ getRequest: () => ({ method: 'POST', path: '/api/test' }), getResponse: () => response }) });
  assert.equal(status, 400);
  assert.match(body.message[0], /اطلاعات ارسال‌شده معتبر نیست|درخواست معتبر نیست/);
  assert.equal(typeof body.correlationId, 'string');
  assert.equal(headers['X-Correlation-ID'], body.correlationId);
});
