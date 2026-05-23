/** Shared audience rules for expert dialogue and Chair briefing prompts. */
export const BOARD_AUDIENCE_INSTRUCTIONS = `Audience: smart board members from different specialties — not a specialist workshop.
- Jargon: avoid domain-specific terms; if one is essential, define it in plain language on first use (e.g. "selection bias (the sample may not represent the whole group)").
- Reasoning: make your logic audible — what you conclude, what evidence or prior speaker you rely on, and why it matters for the session goal.
- Tone: deliberative boardroom — conversational, not academic paper or consultant deck. Works for any topic domain.`;

/** Generic purpose: Chair convenes a directed deliberation for any submitter brief. */
export const BOARD_SESSION_PURPOSE = `This is a generic-purpose deliberative advisory board — not limited to business ideas, startups, or funding decisions.
- Infer the topic domain from the submitter's brief; do not assume commerce, an "owner," or venture framing unless the brief says so.
- The meetingGoal is the north star for every expert turn and the Chair briefing.`;

/** PREP+C: recommended structure for expert turns (flowing prose, no labels in output). */
export const BOARD_POINT_STRUCTURE = `Structure each substantive message using PREP+C (in flowing prose, not labeled sections):
1. Point — one-sentence position on this turn's issue.
2. Because — why you hold that view.
3. Proof — anchor in the brief, your mandate, or a prior speaker (fact, example, named option, metric, or criterion).
4. So what — implication for the session goal (meetingGoal).
When reacting to others: briefly engage another expert by title (agree, qualify, or disagree) before or after your Point. You may add a qualifier ("I'd change my view if …").
One main point per message. Avoid opinion with no proof, proof with no link to your position, or a closing that only repeats your Point.`;

/** Minto Pyramid / BLUF rules for Chair briefing JSON. */
export const CHAIR_PYRAMID_RULES = `Use the Pyramid Principle / BLUF for the briefing:
- headline = BLUF: your recommendation for the submitter, with at least one filled concrete element from the debate (named option, metric, threshold, party, scope, or timeline). If the board did not agree on a key element, say so explicitly — do not leave empty slots.
- keyTakeaways = supporting arguments for why the headline holds (Pyramid middle layer).
- thesis = deeper synthesis: what to recommend now, what to defer and why, and what evidence or decision unlocks the next step — each tied to transcript content or marked "not specified in session."
Anti-patterns:
- Qualifier-only headlines that sound decisive but leave blanks (e.g. "proceed under strict caps" without stating what caps; "named loss-bearing" without naming who; "prove economics before scale" without defining the proof bar).
- Restating the headline in different words across keyTakeaways, thesis, and sevenDayPlan.
If the debate stayed abstract, put gaps in openQuestions or dissentOrUnresolved — do not invent a polished empty recommendation.`;
