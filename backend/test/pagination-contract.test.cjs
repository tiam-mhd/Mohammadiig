require("reflect-metadata");
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { plainToInstance } = require("class-transformer");
const { validate } = require("class-validator");
const { PaginationQueryDto } = require("../dist/common/pagination.dto");

test("pagination contract accepts valid Persian admin query values", async () => {
  const dto = plainToInstance(PaginationQueryDto, {
    page: "2",
    limit: "50",
    search: "مشتری",
    sort: "createdAt",
    order: "desc",
  });
  assert.equal((await validate(dto)).length, 0);
  assert.equal(dto.page, 2);
  assert.equal(dto.limit, 50);
});

test("pagination contract rejects unsafe or oversized limits", async () => {
  const dto = plainToInstance(PaginationQueryDto, {
    page: "0",
    limit: "101",
    order: "sideways",
  });
  const errors = await validate(dto);
  assert.ok(errors.length >= 3);
});
