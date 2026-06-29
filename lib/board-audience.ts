/** Shared audience rules for expert dialogue and Chair briefing prompts. */
export const BOARD_AUDIENCE_INSTRUCTIONS = `Audience: board members from different specialties, not a specialist workshop, which is why you should follow simple language.
- Jargon: avoid domain-specific terms; if one is essential, define it in plain language on first use (e.g. "churn (customers leaving)").
- Reasoning: make your logic audible in normal prose — what you conclude, what evidence or prior speaker you rely on, and why it matters for the decision. Never label reasoning steps with meta-words ("because", "implication", "so what") or arrow symbols (→).
- Tone: conversational boardroom, not academic paper or consultant deck.`;

export const EXPERT_STRUCTURE_RULES = `Structure (invisible to the reader — do NOT name these beats in your text):
- Open with one short sentence reacting to the prior point or the owner's question.
- Follow with 2–4 markdown bullets for your position, reasoning, and evidence.
- Close with one short sentence on what your point means for the decision.
Write as you would speak in a live board meeting. Do NOT use meta-labels, arrows (→), or step headers in the message.`;
