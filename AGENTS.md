<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **Mohammadiig** (8164 symbols, 19049 relationships, 703 execution flows).

> Index stale? Run `node C:/Users/T.mohammadi/.gitnexus/stores/Mohammadiig-068a67c397de/checkouts/Mohammadiig-068a67c397de/run.cjs analyze --index-only` from the project root — it auto-selects an available runner. No `C:/Users/T.mohammadi/.gitnexus/stores/Mohammadiig-068a67c397de/checkouts/Mohammadiig-068a67c397de/run.cjs` yet? Bootstrap with `npx`, `bunx`, or `pnpm dlx` — e.g. `bunx gitnexus@latest analyze` (npm 11 npx crash; #1939).

## Always Do

- **MUST run impact before editing.** Use `impact({target: "symbolName", direction: "upstream"})` or `node C:/Users/T.mohammadi/.gitnexus/stores/Mohammadiig-068a67c397de/checkouts/Mohammadiig-068a67c397de/run.cjs impact "symbolName" --direction upstream --repo .`; report callers, processes, and risk. Never substitute grep for graph analysis.
- **MUST analyze graph changes before committing.** Use `detect_changes({scope: "all"})` (MCP) or `node C:/Users/T.mohammadi/.gitnexus/stores/Mohammadiig-068a67c397de/checkouts/Mohammadiig-068a67c397de/run.cjs detect-changes --scope all --repo .` (CLI fallback). `partial: true` or `truncated: true` is not a clean check — a zero means unseen, not unaffected; re-run it. For regression review: `detect_changes({scope: "compare", base_ref: "main"})` or `node C:/Users/T.mohammadi/.gitnexus/stores/Mohammadiig-068a67c397de/checkouts/Mohammadiig-068a67c397de/run.cjs detect-changes --scope compare --base-ref "main" --repo .`.
- MUST warn on HIGH/CRITICAL `risk` pre-edit; never use `riskSharedAxes` to waive a HIGH/CRITICAL `risk` warning. Compare File/symbol: MCP File omits axes; Graph-RAG expands File.
- **MUST treat `risk: UNKNOWN` as unresolved, not as low.** An empty caller set is not evidence the symbol is unused — it can also mean the callers are not resolvable by the index (plain-object property access, dynamic dispatch, cross-language calls). `impact` pairs `UNKNOWN` with a `riskNote` saying so. Confirm with a text search before treating the symbol as safe to change or delete; do not proceed on the strength of a zero.
- **MUST use `query({search_query: "concept"})` for concepts/flows, `context({name: "symbolName"})` for a named symbol, or `impact` for blast radius, on read-only callers, dependencies, imports, or execution flow.** Graph first; text search only for empty/`UNKNOWN`/literals.
- For security review, `explain({target: "fileOrSymbol"})` lists taint findings (source→sink flows; needs `analyze --pdg`).

## Never Do

- NEVER edit a function, class, or method before MCP/CLI impact analysis.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis, and never read `UNKNOWN` as an all-clear — it means the walk could not answer, which is the one verdict that requires confirming by other means.
- NEVER rename symbols with find-and-replace — use `rename` which understands the call graph.
- NEVER commit before MCP/CLI graph change analysis.

## Resources

| Resource | Use for |
| --- | --- |
| `gitnexus://repo/Mohammadiig/context` | Codebase overview, check index freshness |
| `gitnexus://repo/Mohammadiig/clusters` | All functional areas |
| `gitnexus://repo/Mohammadiig/processes` | All execution flows |
| `gitnexus://repo/Mohammadiig/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
| --- | --- |
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->

## توسعه و قالب‌بندی کد

### پیش‌نیاز اجباری هر تغییر UI پنل مدیریت

- پیش از طراحی، افزودن یا اصلاح هر UI در پنل مدیریت، بخش «قواعد اجباری UI پنل مدیریت» در فایل IMPLEMENTATION_GUIDELINES.md و بخش ۱۴ فایل 0-DOCS/bugatti/MIG-UI-SYSTEM.md را کامل بخوانید؛ این قواعد لازم‌الاجرا هستند.
- هیچ کامپوننتی را پیش از بررسی حاشیه‌های امن، فاصله‌گذاری، رفتار ریسپانسیو، دسترس‌پذیری دکمه‌های آیکونی و توکن‌های رنگی پنل پیاده‌سازی یا تحویل ندهید.

- کد جدید و کد اصلاح‌شده باید چندخطی، منظم و قابل‌خواندن نوشته شود؛ از نوشتن JSX، TypeScript، JavaScript، CSS و SQL به‌صورت تک‌خطی خودداری کنید.
- پیش از تحویل تغییرات، فایل‌های سورس مربوط را با Prettier قالب‌بندی کنید و ساختار منطقی، نام‌گذاری و فاصله‌گذاری را خوانا نگه دارید.
- قالب‌بندی نباید منطق، شرط‌ها، importها، متن‌های کاربر، نوع‌ها یا رفتار برنامه را حذف یا تغییر دهد. قالب‌بندی فایل‌های تولیدی، وابستگی‌ها، آرشیوها و داده‌های runtime ممنوع است.
- پس از قالب‌بندی، typecheck/build و آزمون‌های مرتبط را اجرا کنید و هر خطای ناشی از تغییر را پیش از تحویل برطرف کنید.
