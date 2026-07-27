# Outreach Template — Open Textbook Authors

**Purpose:** reach out to the authors of open textbooks ConceptBook has ingested, once the ConceptBook arXiv paper is submitted, to share what was built from their work and invite feedback.

**Recipients (6):**

| Author | Book | Repo | License | Contact notes |
|---|---|---|---|---|
| Robert A. Beezer | *A First Course in Linear Algebra* | [cb-linalg](https://digital-duck.github.io/cb-linalg/) | GNU FDL | Individual author — use the personal version below |
| Pat Morin | *Open Data Structures* | [cb-data-structure](https://digital-duck.github.io/cb-data-structure/) | CC BY | Individual author — use the personal version below |
| Jeff Erickson | *Algorithms* | [cb-algorithms](https://digital-duck.github.io/cb-algorithms/) | CC BY 4.0 | Individual author — use the personal version below |
| OpenStax.org (×3) | *Introductory Statistics 2e*, *Calculus Vol. 1*, *College Physics 2e* | [cb-statistics](https://digital-duck.github.io/cb-statistics/), [cb-calculus](https://digital-duck.github.io/cb-calculus/), [cb-college-physics](https://digital-duck.github.io/cb-college-physics/) | CC BY 4.0 | Institutional — use the OpenStax version below, one email covering all three titles (or three separate emails if OpenStax routes feedback per subject team) |

**Fill in before sending:**
- `[ARXIV_URL]` — the ConceptBook paper's arXiv link, once live
- `[AUTHOR_NAME]`, `[BOOK_TITLE]`, `[REPO_URL]` — per row above
- `[N_CHAPTERS]`, `[N_CONCEPTS]` — pull from the domain's `catalog.json` / `graph.yaml` node counts
- Your contact info in the sign-off

---

## Version A — Individual authors (Beezer, Morin, Erickson)

> Subject: A concept-graph companion built from *[BOOK_TITLE]* — feedback welcome

Dear [AUTHOR_NAME],

My name is Wen Gong. I'm an independent AI researcher, and I wanted to reach out because I think the work you've put into *[BOOK_TITLE]* and the work I've been doing are aimed at the same thing: lowering the barrier to learning as much as possible.

I recently published a paper, *ConceptBook: A Graph-First Framework for AI-Generated Curricula* ([ARXIV_URL]), which explores generating LLM-verified, prerequisite-ordered study companions from a single concept graph. The foundation for this is not new — it builds directly on Joseph Novak and D. Bob Gowin's *Learning How to Learn* (Cornell, 1984) and Novak's work on concept mapping, which I consider the intellectual root of this entire project. What I've tried to add is a way to extract that same kind of concept map automatically from an existing text, and to make each node's explanation LLM-generated but verifiable against its stated prerequisites, rather than hand-drawn once and left static. One of the two paths the paper describes — "Path B" — takes an existing open textbook and ingests it into a concept graph this way, so every idea in the book becomes a node with explicit prerequisites, and a reader can generate a machine-checked explanation of any concept along its dependency chain.

I used *[BOOK_TITLE]* as one of the source texts, and I want to be upfront about that: what's live here — [REPO_URL] — is a derived work built on top of *[BOOK_TITLE]*, not an independent creation. [N_CHAPTERS] chapters and [N_CONCEPTS] concepts were extracted into a graph, and every generated page cites you and the book directly and links back to it. It's a companion navigation and study layer, not a replacement, but I don't want to undersell what it is: your material, restructured and extended by an LLM pipeline.

If you have any feedback — on whether the extracted graph reflects how you'd actually teach the material's dependencies, on the idea itself, or on the use of your book this way — I'd welcome it, and I'm glad to adjust or take it down if any part of this doesn't sit right with you. But I also don't want to put you in the position of having to bless it. The people I'd ultimately want judging whether this is useful are the students and teachers actually using *[BOOK_TITLE]* alongside the companion graph — if it doesn't hold up for them, that's the real signal, not my say-so or yours.

Thank you for making *[BOOK_TITLE]* freely available in the first place — that choice is the only reason a project like this is possible at all.

Best,
Wen Gong
[email / contact]
[LinkedIn / GitHub / ArXiv links]

---

## Version B — OpenStax.org

> Subject: Concept-graph companions built from three OpenStax titles — feedback welcome

Dear OpenStax Team,

My name is Wen Gong. I'm an independent AI researcher working on a project called ConceptBook, and I wanted to reach out because OpenStax's mission — removing cost as a barrier to a quality education — is exactly the problem I've been trying to help solve from a different angle: navigation and comprehension, once the book is already free.

I recently published a paper, *ConceptBook: A Graph-First Framework for AI-Generated Curricula* ([ARXIV_URL]), which describes generating LLM-verified, prerequisite-ordered study companions from a concept graph. The idea isn't new — it builds directly on Joseph Novak and D. Bob Gowin's *Learning How to Learn* (Cornell, 1984) and Novak's work on concept mapping, which I consider the intellectual root of this project. What I've tried to add is automatic extraction of that same kind of concept map from an existing text, with each node's explanation LLM-generated but verifiable against its stated prerequisites. One path the paper covers ingests an existing open textbook into a concept graph this way, turning every idea in the book into a node with explicit prerequisite edges, so a student can generate a machine-checked explanation of any concept by following its actual dependency chain rather than the book's linear chapter order.

I used three OpenStax titles as source texts, and I want to be upfront about that: *Introductory Statistics 2e* ([cb-statistics](https://digital-duck.github.io/cb-statistics/)), *Calculus Volume 1* ([cb-calculus](https://digital-duck.github.io/cb-calculus/)), and *College Physics 2e* ([cb-college-physics](https://digital-duck.github.io/cb-college-physics/)) are each derived works built on top of your books, not independent creations — every generated page cites the original book and carries the CC BY 4.0 attribution it requires. Each is a companion navigation and study layer, not a replacement, but I don't want to undersell what it is: your material, restructured and extended by an LLM pipeline.

If OpenStax has any feedback — on whether this kind of derivative use fits comfortably within how you'd like your content extended, or on the idea itself — I'd welcome it, and I'm glad to adjust or remove anything that doesn't align with your preferences. But I also don't want to put you in the position of having to bless it. The people I'd ultimately want judging whether this is useful are the students and teachers actually using your textbooks alongside the companion graphs — if it doesn't hold up for them, that's the real signal, not my say-so or yours.

Thank you for OpenStax's work — free, high-quality, openly licensed textbooks are the foundation this entire project stands on.

Best,
Wen Gong
[email / contact]
[LinkedIn / GitHub / ArXiv links]

---

## Notes

- **Timing**: send after the arXiv submission is live, not before — the letter references it directly and reads oddly without a working link.
- **Beezer's license is GNU FDL, not CC BY** — the individual-author version above stays license-agnostic ("carries the license attribution it requires") so it doesn't misstate his book's terms. Checked `cb-linalg`'s `catalog.json`: the attribution string is already FDL-appropriate ("This concept graph is a companion learning aid, not a reproduction... Download the full textbook free at linear.pugetsound.edu") — clean, nothing to fix before sending.
- **Don't oversell**: the ask is feedback, not endorsement or partnership — keep it that way even if a reply is enthusiastic; let them propose anything further.
