#!/usr/bin/env python3
"""Repair malformed Markdown pipe tables left inside generated HTML pages.

LLMs sometimes emit a Markdown table inside a book/concept page, and the
HTML renderer wraps it in a paragraph, so the page shows raw text like

    <p>| A | B | |---|---| | a1 | b1 | | a2 | b2 |</p>

(the whole table flattened onto one line), or one ``<p>| … |</p>`` per row.
This script finds those and replaces them with a real ``<table>``.

Handled forms
  1. A whole table on one line inside one ``<p>…</p>`` (the common case).
     Text before the table in the same paragraph (``<p>intro: | A | B | …``)
     is kept as its own paragraph; text after it likewise.
  2. A table split across consecutive ``<p>| … |</p>`` lines, one per row,
     with a ``<p>|---|---|</p>`` separator row.

Alignment markers in the separator (``:---``, ``:---:``, ``---:``) become
``text-align`` styles. Cells keep their inner HTML (``<em>``, ``<strong>``…).

Safety
  * Dry-run by default: lists what would change. Pass ``--write`` to modify.
  * A table whose rows do not all have the header's column count is skipped
    and reported (never guessed at), e.g. a cell that itself contains ``|``.
  * Idempotent: repaired files no longer contain a pipe separator row.
  * Content inside ``<pre>`` / ``<code>`` is left alone.
  * ``--backup`` writes ``file.html.bak`` before overwriting.

Usage
    python repair-html-tables.py PATH [PATH ...]            # dry run
    python repair-html-tables.py PATH --write               # apply
    python repair-html-tables.py PATH --write --backup
    python repair-html-tables.py PATH --no-style            # plain <table>

PATH is a file or a directory (searched recursively for ``*.html``).
Example:
    python repair-html-tables.py ~/projects/digital-duck/cb-meta-health/public/domains
"""
from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

# A separator run: |---|---| / | :---: | ---: | …  (one or more dashed cells)
SEP_RUN = re.compile(r"\|(?:\s*:?-{3,}:?\s*\|)+")
SEP_CELL = re.compile(r"^\s*(:?)-{3,}(:?)\s*$")
P_BLOCK = re.compile(r"<p>(.*?)</p>", re.S)
PROTECTED = re.compile(r"<(pre|code)\b.*?</\1>", re.S | re.I)

TABLE_STYLE = "border-collapse: collapse; border: 1px solid #333;"
CELL_STYLE = "border: 1px solid #333; padding: 6px 12px;"


def _align(spec: str) -> str | None:
    m = SEP_CELL.match(spec)
    if not m:
        return None
    left, right = m.group(1), m.group(2)
    if left and right:
        return "center"
    if right:
        return "right"
    if left:
        return "left"
    return None


def _build_table(header: list[str], aligns: list[str | None], rows: list[list[str]], styled: bool) -> str:
    ts = f' style="{TABLE_STYLE}"' if styled else ""

    def cell(tag: str, text: str, al: str | None) -> str:
        st = CELL_STYLE + (f" text-align: {al};" if al else "") if styled else (f"text-align: {al};" if al else "")
        attr = f' style="{st}"' if st else ""
        return f"      <{tag}{attr}>{text.strip()}</{tag}>"

    out = [f"<table{ts}>", "  <thead>", "    <tr>"]
    out += [cell("th", h, a) for h, a in zip(header, aligns)]
    out += ["    </tr>", "  </thead>", "  <tbody>"]
    for r in rows:
        out.append("    <tr>")
        out += [cell("td", c, a) for c, a in zip(r, aligns)]
        out.append("    </tr>")
    out += ["  </tbody>", "</table>"]
    return "\n".join(out)


def _split_cells(row_text: str) -> list[str]:
    """'| a | b |' -> ['a', 'b'] (outer pipes optional)."""
    t = row_text.strip()
    if t.startswith("|"):
        t = t[1:]
    if t.endswith("|"):
        t = t[:-1]
    return [c.strip() for c in t.split("|")]


def _flat_table(inner: str, styled: bool) -> tuple[str, str] | None:
    """Convert a one-paragraph flattened table. Returns (html, note) or None."""
    m = SEP_RUN.search(inner)
    if not m:
        return None
    sep_cells = [c for c in m.group(0).split("|")[1:-1]]
    ncols = len(sep_cells)
    aligns = [_align(c) for c in sep_cells]

    # Header: the ncols+1 pipes immediately before the separator run.
    before = inner[: m.start()].rstrip()
    if not before.endswith("|"):
        return None
    idx = len(before)
    for _ in range(ncols + 1):
        idx = before.rfind("|", 0, idx)
        if idx == -1:
            return None
    prefix, header_text = before[:idx].strip(), before[idx:]
    header = _split_cells(header_text)
    if len(header) != ncols:
        return None

    # Body: after the separator, ncols cells per row; rows are joined by '| |'.
    tokens = inner[m.end():].split("|")
    # tokens[0] is whitespace before the first row's opening pipe
    # (the separator's closing pipe was consumed by SEP_RUN, so the row's own
    # opening pipe is tokens[0]/tokens[1] boundary).
    toks = tokens[1:] if tokens and tokens[0].strip() == "" else None
    if toks is None:
        return None
    rows: list[list[str]] = []
    suffix = ""
    i = 0
    while i < len(toks):
        remaining = toks[i:]
        if len(remaining) < ncols + 1:
            suffix = "|".join(remaining).strip()
            break
        cells = [c.strip() for c in remaining[:ncols]]
        boundary = remaining[ncols]
        rows.append(cells)
        i += ncols + 1
        if boundary.strip() != "":  # text after the last row's closing pipe
            suffix = boundary.strip()
            break
    if not rows or any(len(r) != ncols for r in rows):
        return None
    if suffix and "|" in suffix:
        return None

    parts = []
    if prefix:
        parts.append(f"<p>{prefix}</p>")
    parts.append(_build_table(header, aligns, rows, styled))
    if suffix:
        parts.append(f"<p>{suffix}</p>")
    return "\n".join(parts), f"{ncols} cols x {len(rows)} rows"


def _row_paragraph(line: str) -> str | None:
    m = re.fullmatch(r"\s*<p>\s*(\|.*\|)\s*</p>\s*", line)
    return m.group(1) if m else None


def _fix_row_paragraphs(text: str, styled: bool, report: list[str]) -> str:
    """Form 2: consecutive one-row-per-<p> lines."""
    lines = text.split("\n")
    out: list[str] = []
    i = 0
    while i < len(lines):
        j = i
        block = []
        while j < len(lines) and _row_paragraph(lines[j]) is not None:
            block.append(_row_paragraph(lines[j]))
            j += 1
        if len(block) >= 2 and SEP_RUN.fullmatch(block[1].strip()):
            header = _split_cells(block[0])
            sep = [c for c in block[1].strip().split("|")[1:-1]]
            rows = [_split_cells(b) for b in block[2:]]
            if len(sep) == len(header) and rows and all(len(r) == len(header) for r in rows):
                out.append(_build_table(header, [_align(c) for c in sep], rows, styled))
                report.append(f"row-per-<p> table ({len(header)} cols x {len(rows)} rows)")
                i = j
                continue
            report.append("SKIPPED row-per-<p> table: ragged rows")
        if block:
            out.extend(lines[i:j])
            i = j
        else:
            out.append(lines[i])
            i += 1
    return "\n".join(out)


def repair(text: str, styled: bool = True) -> tuple[str, list[str]]:
    report: list[str] = []

    # Hide <pre>/<code> so their content is never touched.
    stash: list[str] = []

    def hide(m: re.Match) -> str:
        stash.append(m.group(0))
        return f"\x00{len(stash) - 1}\x00"

    work = PROTECTED.sub(hide, text)

    def fix_p(m: re.Match) -> str:
        inner = m.group(1)
        if not SEP_RUN.search(inner):
            return m.group(0)
        res = _flat_table(inner, styled)
        if res is None:
            # leave one-row-per-<p> separator paragraphs for the second pass
            if not _row_paragraph(m.group(0)):
                report.append("SKIPPED malformed table (left unchanged): " + inner[:60].replace("\n", " "))
            return m.group(0)
        html, note = res
        report.append(f"flattened table ({note})")
        return html

    work = P_BLOCK.sub(fix_p, work)
    work = _fix_row_paragraphs(work, styled, report)
    work = re.sub(r"\x00(\d+)\x00", lambda m: stash[int(m.group(1))], work)
    return work, report


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

    n_files = n_tables = n_skipped = 0
    for f in iter_files(args.paths):
        try:
            text = f.read_text(encoding="utf-8")
        except (UnicodeDecodeError, OSError) as e:
            print(f"warning: cannot read {f}: {e}", file=sys.stderr)
            continue
        if not SEP_RUN.search(text):
            continue
        new, report = repair(text, styled=not args.no_style)
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
