# MINDFRAME scoring proposal

**Status:** The scoring function and first 24-question content draft are implemented. The scoring and content tests pass (20 tests). The proposed archetype signatures, affinity thresholds, and question wording still need product review before this scoring version is treated as final.

This document proposes a deterministic rulebook: the same validated answers always produce the same six dimension scores and archetype affinities. The scoring module will contain plain TypeScript functions and data; it will not depend on React, the database, or an LLM.

## Assessment shape

- **24 required questions:** 12 situational choices and 12 agreement ratings.
- **Four questions per dimension:** two situational and two rating questions for each of Planning, Reasoning, Exploration, Execution, Risk approach, and Social approach.
- Each question contributes to one dimension in the first version. This keeps the score trail easy to explain and prevents one answer from silently shifting several unrelated dimensions.
- Question wording, options, and weights live in a versioned data file. A completed result records both the assessment version and scoring version.

The question count is a proposed product decision. It should be reviewed against the expected completion time once the question wording exists.

The current draft is in `src/lib/assessment/v1.ts`, separate from both the scoring algorithm and the page components. It has 24 questions: two scenarios and two ratings per dimension. Treat the first content as a reviewable draft; the questions describe everyday preferences, have no right answers, and do not attempt diagnosis.

## Answer weights

Each answer contributes a signed integer from **-2 to +2** to its assigned dimension. Negative values point toward the first pole; positive values point toward the second pole. Zero means the answer gives no evidence in either direction.

For rating questions, the five choices map to `-2, -1, 0, +1, +2`. If a statement is phrased toward the second pole, its mapping is reversed so that the sign convention stays consistent. Situational options receive explicit weights in the question data; they are not inferred from their text.

Example for Planning (Adaptive ↔ Structured):

| Answer | Weight | Meaning |
|---|---:|---|
| strongly favors adapting plans | -2 | strong Adaptive signal |
| somewhat favors adapting plans | -1 | mild Adaptive signal |
| neither direction | 0 | no directional signal |
| somewhat favors making a plan | +1 | mild Structured signal |
| strongly favors making a plan | +2 | strong Structured signal |

## Dimension normalization

For each dimension `d`:

1. `total[d]` is the sum of the selected answer weights for that dimension.
2. `maximum[d]` is the sum, across its questions, of the largest possible absolute weight for that question.
3. `score[d] = round(100 * total[d] / maximum[d])`.

The result is an integer from -100 to +100. Negative points toward the first pole; positive points toward the second. A zero score means the answers were balanced on that dimension; it does not mean the person has no trait.

With four questions capped at an absolute weight of 2, `maximum[d]` is 8. If the selected weights are `+2, +1, 0, -1`, then the total is `+2` and the normalized score is `round(100 * 2 / 8) = +25`.

All 24 answers are required. The server rejects missing, duplicate, unknown, or out-of-range answers before scoring. A dimension with no possible variance is a configuration error; it must not be silently assigned zero. Calculations use integers, with rounding only at the final normalized score.

## Archetype affinity proposal

An archetype signature says which poles are evidence for that archetype: `+1` aligns with the second pole, `-1` aligns with the first, and `0` means that dimension does not contribute. The table is a draft interpretation of the six archetype descriptions and needs review alongside the final question bank.

Dimensions are ordered as Planning, Reasoning, Exploration, Execution, Risk approach, Social approach.

| Archetype | Signature |
|---|---|
| Architect | `[+1, +1, -1, 0, -1, 0]` |
| Analyst | `[0, +1, 0, -1, -1, 0]` |
| Explorer | `[0, 0, +1, +1, +1, 0]` |
| Creator | `[-1, -1, +1, 0, 0, +1]` |
| Sentinel | `[+1, 0, -1, -1, -1, +1]` |
| Catalyst | `[-1, 0, +1, +1, +1, +1]` |

Treat the six normalized scores as a vector `p`, where each score is divided by 100. For archetype `a`, treat its signature as a vector `s` and calculate cosine similarity:

`similarity[a] = dot(p, s) / (length(p) * length(s))`

Then convert it to a 0–100 affinity:

`affinity[a] = round(50 * (1 + similarity[a]))`

If every dimension score is zero, the profile has no direction, so all affinities are set to 50. Otherwise, an affinity compares the direction of the result with a fictional product profile; it is not a probability or scientific measurement. Strong patterns on dimensions absent from a signature reduce that signature's match, so the same shared trait does not automatically make several archetypes perfect matches.

### Balanced profiles and secondary influence

The specification asks for a primary archetype, but also says not to invent one when the scores do not support a distinct profile. A fully balanced score vector produces 50 affinity for all six archetypes. Forcing a primary in that case would be misleading.

**Approved resolution:** allow `primary_archetype_id` to be null and show a neutral “Balanced profile” when the highest affinity is below 80, or when the highest two affinities tie. This avoids assigning a type from one isolated dimension alone. A secondary archetype is returned only when a unique primary exists, the second affinity is at least 75, and it is within 15 points of the primary. These numeric thresholds should be reviewed with sample profiles.

This changes the original “one primary archetype” requirement and the corresponding database/API fields. The user approved allowing a neutral result without an archetype on 2026-10-20.

## Worked examples

### Dimension normalization

For Planning, selected weights `+2, +1, 0, -1` produce `+25`. Repeating the same answers produces `+25`; no browser-supplied score is accepted as authoritative.

### Balanced profile

If all six normalized scores are `0`, every archetype affinity is `50`. Under the approved threshold rule, the result has no primary or secondary archetype and uses the neutral balanced presentation.

### Explorer-leaning profile

For `[0, 0, +100, +100, +100, +50]`, the draft affinities are Explorer `98`, Catalyst `93`, Creator `71`, and the other profiles lower. Explorer is primary; Catalyst qualifies as a secondary influence.

## Rules to protect with tests

- Each dimension's two boundaries normalize to -100 and +100.
- A signal in only one dimension does not by itself force a primary archetype.
- The same answer set always returns byte-for-byte equivalent score data.
- Missing, duplicate, unknown, and malformed answers are rejected.
- A zero-variance dimension configuration is rejected.
- A balanced profile does not get an invented archetype under the proposed rule.
- The Explorer example above produces the fixed expected affinities and selection.
- Exact ties at the top produce no primary archetype; lower ties are ordered by stable archetype ID for consistent display.
- Changing the question bank or any scoring signature requires a new recorded version.

## Limitations

These dimensions, questions, and archetypes are product language for guided self-reflection. They are not clinically validated measures and must not be presented as diagnosis or scientific personality scores. Signature choices and thresholds are design decisions that should be reviewed for clarity and balanced wording, not treated as discovered psychological facts.
