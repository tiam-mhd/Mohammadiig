require("dotenv/config");
const {
  environmentValidationSchema,
} = require("../dist/config/env.validation");
const { error } = environmentValidationSchema.validate(process.env, {
  allowUnknown: true,
  abortEarly: false,
});
if (error) {
  // Never print environment values or Joi's error context, which can include secrets.
  console.error("پیکربندی محیط معتبر نیست:");
  for (const detail of error.details) console.error(detail.message);
  process.exitCode = 1;
} else {
  console.log("بررسی امنیت تنظیمات محیط موفق بود.");
}
