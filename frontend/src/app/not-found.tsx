import Link from "next/link";

export default function NotFound() {
  return (
    <main
      dir="rtl"
      className="content-shell flex min-h-[60vh] flex-col items-center justify-center text-center"
    >
      <h1 className="display-md">صفحه پیدا نشد</h1>
      <p className="mt-3 text-[var(--ops-muted)]">
        نشانی واردشده معتبر نیست یا صفحه حذف شده است.
      </p>
      <Link className="admin-button mt-6" href="/">
        بازگشت به صفحه اصلی
      </Link>
    </main>
  );
}
