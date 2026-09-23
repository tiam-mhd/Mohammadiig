# Customer checkout and account lifecycle

- An authenticated, active account with no customer profile gets a profile when requesting `/customers/me` or checking out. Customer login also repairs a missing profile. Concurrent requests reuse the unique `user_id`; deleted profiles are never automatically restored.
- `/users/admin/all` lists staff roles only. Customer authentication records remain in `users`, with their business profiles in `customers`.
- `/customers/admin/all` defaults to current customers. `?status=deleted` returns only soft-deleted profiles. Permanently erased customers are excluded from both lists and their 360 endpoint returns 404. Both lists are admin-only; invalid status values return 400.
- Administrators change status through `PATCH /customers/admin/:id/status` with `status`, boolean `isVerified`, and an optional `reason` (up to 1000 characters). `blocked` requires a nonblank reason. The legacy `isActive` field still maps to active/inactive; conflicting fields are rejected.
- Access states: `active` (login and purchase allowed), `inactive` (disabled until the administrator activates it), `blocked` (disabled with a mandatory staff reason), `pending_review` (disabled until the administrator completes review and activates it). Verification is independent of access. Registration still defaults to active access with an unverified business profile.
- Current reason, last status change time and administrator ID are stored. This is the latest state, not a full change-history log. Staff reasons are not exposed through `/customers/me` or public login/OTP errors.
- `DELETE /customers/admin/:id` atomically soft-deletes the profile and deactivates its customer account. Orders, invoices and payments remain intact. Deleted profiles appear only in the separate deleted list, with read-only 360-degree history. There is no restore action.
- Staff accounts cannot be disabled or deleted through customer controls. They remain managed under Users, even if they have purchased through the store.
- Every authenticated request checks current account status and role in the database. OTP, password and pending two-factor logins cannot restore deleted/inactive accounts.

## Permanent customer erasure

`DELETE /customers/admin/:id/permanent` requires an administrator, an already soft-deleted customer, and the body `{ "confirmation": "حذف دائمی" }`. The UI requires the administrator to type the phrase. Staff accounts cannot be erased here. No live customer data is erased when installing this feature.

Erasure is transactional. It wipes profile identifiers, contact information, private notes/status reason, credentials and OTP challenges (including pending new-mobile steps); releases phone/email for a new, unrelated registration; clears shipping/billing addresses and identity snapshots from all related orders and invoices, including soft-deleted financial records; clears related financial notes and the legacy project's client display name. Monetary totals, line items, payment status, transaction references and the financial relationships stay intact.

Anonymous, disabled user/customer rows remain internally to preserve accounting keys. They contain no profile/contact credentials and are not accessible as customer profiles. Erasure is irreversible and is not a restore operation. File attachment contents, public project content, product customizations, external payment-provider data, existing exports and backup files are outside this structured-data erasure; the confirmation dialog calls out attachments and backups. Review those separately if they contain personal information.

## Validation

Run `npm.cmd --prefix backend test` on Windows (`npm --prefix backend test` elsewhere). The suite uses an in-memory SQLite database with the project migrations, real Nest HTTP routes and a fake SMS provider. It does not read `.env`, contact the SMS service or modify the application database.

Deploy backend and frontend together. The registered `1710000021000-customer-lifecycle` migration adds status, reason, change metadata and the permanent-erasure marker; the existing application startup runs pending migrations. Legacy inactive accounts remain inactive. Rollback is refused once an erasure marker exists, because losing the marker would expose anonymous customer tombstones. Payment tests exercise the existing test gateway, not a live banking gateway. The integration suite covers 19 scenarios, including the migration, data isolation and transactional rollback on purge failure.
