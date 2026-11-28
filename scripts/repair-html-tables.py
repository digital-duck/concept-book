#!/usr/bin/env python3
"""Repair flattened Markdown pipe tables in already-generated HTML pages.

A thin command-line wrapper around book-graph's repair API,
``bookgraph.tables.repair_with_report`` — the same function that
``bookgraph.render._md_to_html`` applies to every newly generated page. All the
repair logic lives there (one place to fix and test); this script only walks
files, reports, and writes.

    <p>| A | B | |---|---| | 1 | 2 |</p>     ->     <table> … </table>

Handles a whole table on one line in one ``<p>`` (text before/after it is kept as
its own paragraph) and one ``<p>| … |</p>`` per row; any column count; ``:---:``
alignment. A table whose rows don't match the header is skipped and reported,
never guessed at. ``<pre>``/``<code>`` content is left alone. Idempotent.

Usage
    python repair-html-tables.py PATH [PATH ...]            # dry run
    python repair-html-tables.py PATH --write               # apply
    python repair-html-tables.py PATH --write --backup      # keep file.html.bak
    python repair-html-tables.py PATH --no-style            # plain <table>, no inline borders

PATH is a file or a directory (searched recursively for ``*.html``). Example:
    python repair-html-tables.py ~/projects/digital-duck/*/public/domains --write

Where ``bookgraph`` comes from: an installed package if there is one, else the
source tree named by $BOOKGRAPH_SRC, else ~/projects/graf-proj/book-graph/src.
Only ``bookgraph/tables.py`` is used (standard library only), so no other
book-graph dependency has to be installed.
"""
from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

DEFAULT_SRC = Path.home() / "projects" / "graf-proj" / "book-graph" / "src"


def _load_repair():
    """Import bookgraph.tables, falling back to a source checkout."""
    try:
        from bookgraph.tables import repair_with_report
        return repair_with_report
    except ImportError:
        pass
    src = Path(os.environ.get("BOOKGRAPH_SRC", DEFAULT_SRC)).expanduser()
    if not (src / "bookgraph" / "tables.py").is_file():
        sys.exit(f"error: cannot import bookgraph.tables; looked in {src}. "
                 "Install book-graph or set BOOKGRAPH_SRC to its src/ folder.")
    sys.path.insert(0, str(src))
    from bookgraph.tables import repair_with_report
    return repair_with_report


def iter_files(paths: list[str]):
    for p in map(Path, paths):
        if p.is_dir():
            yield from sorted(p.rglob("*.html"))
        elif p.is_file():
            yield p
        else:
            print(f"warning: {p} not found", file=sys.stderr)


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("paths", nargs="+", help="HTML file(s) or directories (recursive)")
    ap.add_argument("--write", action="store_true", help="modify files (default: dry run)")
    ap.add_argument("--backup", action="store_true", help="save file.html.bak before writing")
    ap.add_argument("--no-style", action="store_true", help="emit a plain <table> without inline border styles")
    ap.add_argument("-v", "--verbose", action="store_true", help="list every table, not just per-file counts")
    args = ap.parse_args()

    repair_with_report = _load_repair()
    n_files = n_tables = n_skipped = 0
    for f in iter_files(args.paths):
        try:
            text = f.read_text(encoding="utf-8")
        except (UnicodeDecodeError, OSError) as e:
            print(f"warning: cannot read {f}: {e}", file=sys.stderr)
            continue
        if "---" not in text or "|" not in text:      # cheap pre-filter; the API does the real detection
            continue
        new, report = repair_with_report(text, styled=not args.no_style)
        fixed = [r for r in report if not r.startswith("SKIPPED")]
        skipped = [r for r in report if r.startswith("SKIPPED")]
        n_skipped += len(skipped)
        if new == text:
            if skipped:
                print(f"{f}: {len(skipped)} table(s) could not be repaired")
            continue
        n_files += 1
        n_tables += len(fixed)
        print(f"{'fixed' if args.write else 'would fix'} {f}: {len(fixed)} table(s)"
              + (f", {len(skipped)} skipped" if skipped else ""))
        if args.verbose:
            for r in report:
                print(f"    {r}")
        if args.write:
            if args.backup:
                f.with_suffix(f.suffix + ".bak").write_text(text, encoding="utf-8")
            f.write_text(new, encoding="utf-8")

    verb = "repaired" if args.write else "would repair"
    print(f"\n{verb} {n_tables} table(s) in {n_files} file(s); {n_skipped} skipped")
    if not args.write and n_tables:
        print("Dry run — re-run with --write to apply.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
