# Token-Efficiency Analysis

> **Status:** Analysis / documentation phase. No code changes proposed here are implemented yet.
> **Scope:** `@silverassist/performance-toolkit`, with cross-references to `agents-toolkit` and `jsdoc-to-tsdoc`.
> **Origin:** Prompted by a review of [JuliusBrussee/caveman](https://github.com/JuliusBrussee/caveman) and by high token consumption in agent sessions that read this toolkit's output.

## 1. Why this document exists

AI agents (GitHub Copilot, Claude Code, Codex) consume this toolkit's output as **input tokens**: they run `perf-check ... --insights` or `--json`, then read the result to propose fixes. The `--json` mode emits the near-raw PageSpeed Insights (PSI) payload, which is large. Every agent turn that ingests a full PSI report pays for tens of thousands of input tokens before it reasons about a single opportunity.

This document analyzes where those tokens go and where we can cut them without losing the signal an agent needs.

## 2. What the caveman tool actually teaches (signal vs. meme)

Caveman is a prompt that tells an agent to write telegraphically (drop articles, filler, pleasantries) while preserving code and errors verbatim. Its own `HONEST-NUMBERS.md` is candid about the ceiling:

| Claim | Reality |
|-------|---------|
| "65% fewer tokens" | **Output only.** It does not touch input, context, files, or reasoning tokens. |
| Overhead | The injected prompt adds **~1–1.5k input tokens per turn**. |
| Whole-session saving | **14–21%** on verbose workloads; **net-negative** on short replies. |
| Per-message billing (Copilot) | Shorter output yields **zero cost benefit** when a platform bills per message, not per token. |

**Transferable lessons (the parts worth keeping):**

1. **Tokenizer facts, not folklore.** Inventing abbreviations (`cfg`, `impl`, `req`, `res`, `fn`) saves nothing: the tokenizer splits them the same as the full word, and the reader still has to decode. Unicode arrows (the `->` glyph rendered as a single arrow character) cost their own token and save nothing. Full words are cheaper *and* clearer.
2. **The input side is the bigger lever.** Compressing text that is loaded *repeatedly* (reference docs, and here, tool output an agent reads every run) beats squeezing a one-time reply.
3. **Structured, minimal output beats prose.** The most reliable token win is emitting only decision-relevant data.
4. **Measure, do not assume.** Caveman ships A/B benchmarks; any change we make should be measured before/after.

**What we explicitly do not adopt:** the "talk like caveman" output style. This toolkit's user-facing output is already terse, and our primary agent target (Copilot) bills per message, so output-style compression is the wrong lever here.

## 3. Where this toolkit's tokens actually go

The toolkit produces several LLM-facing outputs today:

- **`--json`** — structured PSI result. The single largest token sink. It mirrors the PSI response shape (`opportunities[]`, `diagnostics[]`, `fieldData`, per-metric detail), most of which an agent does not need to decide on a fix.
- **`--insights`** — human-formatted detailed insights (LCP breakdown, third-party impact, unused JS/CSS, cache, images, legacy JS, render-blocking, long tasks). Rich, and framed "for AI agents," but formatted for a terminal reader, not for token economy.
- **`--actionable`** — the closest to a token-lean shape already (top opportunities, LCP analysis, next steps).
- **Embedded prompts/skills** (`npx perf-prompts install`) — prose `.md` files loaded into agent context. Same tokenizer hygiene applies as to any loaded reference prose.

The opportunity is concentrated in `--json` and `--insights`: they are the outputs an agent ingests wholesale.

## 4. Opportunities (prioritized)

### P1 — A token-lean agent output mode (`--llm` / `--compact`)

**Problem.** `--json` emits the full PSI payload; an agent reads all of it to find the few fields it acts on.

**Proposal.** A dedicated output mode that emits only decision-relevant data, in a compact, stable shape:

- Scores (performance only, unless others requested).
- Core Web Vitals as `{ metric, ms, rating }` — numeric value + Good/NI/Poor, no display strings, no distribution histograms.
- Top **N** opportunities (default 3–5) as `{ title, savingsMs, wastedBytes, attribution }`, sorted by impact; drop the long human descriptions and the audit boilerplate.
- LCP breakdown as four numbers (TTFB, load delay, load time, render delay) plus the LCP element selector.
- Third-party summary: total blocking ms + top offenders, not the full vendor list.
- Omit passing audits and null metrics entirely.

**Shape.** Prefer compact JSON (agents parse it deterministically) with an optional minimal-Markdown variant. Keys stable and short but **real words** (no invented abbreviations).

**Why it wins.** This cuts the agent's input by roughly an order of magnitude versus raw `--json`, and it benefits **every** agent — including Copilot, where less context means a better, cheaper-to-reason response even though billing is per message. This is the highest-ROI item in the analysis.

**Measurement.** Count tokens of `--json` vs. `--llm` on the same URL (e.g. with a tokenizer such as `tiktoken`/`gpt-tokenizer`) and record the ratio in the docs.

### P2 — Tokenizer hygiene in embedded prompts/skills

**Problem.** The `.md` prompts and skills shipped by `perf-prompts` are loaded into agent context; any Unicode arrows or invented abbreviations cost tokens for no benefit.

**Proposal.** Sweep the shipped `.md` assets: replace arrow glyphs with words (`to`, `then`, `becomes`), expand invented abbreviations, drop filler/hedging while preserving code blocks, paths, and commands verbatim. Add a one-paragraph "LLM-facing writing" note to the contributor docs so it does not regress.

**Effort.** Low. **Benefit.** Permanent, per-session, cross-agent.

### P3 — Make `--insights` respect the same lean contract

**Proposal.** Either fold `--insights` into the `--llm` contract or add a `--llm` flavor of it, so the "for AI agents" framing actually maps to a token-economical shape rather than terminal formatting.

### P4 — Document the token cost of each output mode

**Proposal.** A short table in the README: approximate token count of `--json` vs. `--insights` vs. `--actionable` vs. `--llm` for a representative URL, so users pick the right mode for an agent workflow deliberately.

## 5. Non-goals / explicit caveats

- **No caveman output style.** We are not making the toolkit "talk like a caveman."
- **Do not conflate output and input savings.** Our win is on the *input an agent reads*, not on shortening the agent's replies.
- **Do not micro-optimize for Copilot billing.** Copilot bills per message; the goal here is smaller context and better answers, not a per-token invoice.
- **Never drop correctness for brevity.** The lean mode must keep every field an agent needs to propose a correct fix; if in doubt, keep it and measure.

## 6. Cross-repo notes

- **`agents-toolkit` (Copilot-primary):** same tokenizer hygiene applies to its ~386 KB of loaded skill/prompt/instruction prose (measured at 123 arrow-glyph occurrences across 23 files at time of analysis). Input-side prose hygiene is the lever there, not output style.
- **`jsdoc-to-tsdoc`:** its `convert` command is *already* a token reducer for code context — stripping `{Type}` braces, `Promise<T>` wrappers, and redundant tags removes tokens an LLM would otherwise read when scanning a file. Worth documenting and measuring as a feature, plus a possible `--report llm` mode (one-line contract per symbol).

## 7. Suggested sequence

1. **P1** — design and measure the `--llm` output mode (biggest lever, all agents).
2. **P2** — tokenizer-hygiene sweep of embedded prompts/skills (trivial, permanent).
3. **P3 / P4** — align `--insights` and document per-mode token cost.

## References

- caveman: <https://github.com/JuliusBrussee/caveman> — `README.md`, `docs/HONEST-NUMBERS.md`, `plugins/caveman/skills/caveman-compress/SKILL.md`.
- PageSpeed Insights API v5: <https://developers.google.com/speed/docs/insights/v5/get-started>
