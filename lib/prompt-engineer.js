export default class PromptEngineer {
  /**
   * Generate a strict prompt to feed the AI.
   * @param {string} diff - The git diff (staged) to analyze.
   * @param {Object} opts
   * @param {number} opts.count - number of commit options to generate (default 5).
   */
  static generatePrompt(diff = '', opts = {}) {
    const count = Math.min(Math.max(Number(opts.count) || 5, 1), 10);

    return `INSTRUCTIONS: OUTPUT MUST BE A SINGLE JSON OBJECT AND NOTHING ELSE.
You are a Senior Software Engineer specialized in writing short, precise, and Conventional-Commits–compliant commit messages.
Read the provided DIFF and produce exactly ${count} commit message options that match the schema below.

--- DIFF START ---
${diff}
--- DIFF END ---

TASK:
- Analyze the diff above and produce ${count} distinct commit message options.
- Each option MUST be tightly related to the actual changes in the diff (file names, modified functions, added/removed lines, or hunk contexts).
- Prioritize clarity: the header must explain WHAT changed (imperative present tense), the body must explain WHY or WHAT EFFECT in 1-2 short sentences.

SCHEMA (STRICT — return ONLY this JSON object, no prose, no comments):
{
  "options": [
    {
      "type": "feat|fix|refactor|perf|chore|docs|style|test|build|ci",
      "scope": "string or null (max 12 chars)",
      "header": "string (max 50 chars, imperative)",
      "body": "string (1-2 sentences, max 120 chars)",
      "emoji": "single emoji string from allowed list"
    }
    // ... repeat up to ${count} items
  ]
}

VALIDATION RULES:
1. type must be one of: feat, fix, refactor, perf, chore, docs, style, test, build, ci.
2. If no meaningful scope can be inferred, set scope to null. Otherwise scope must be <= 12 chars and concise (e.g. auth, api, ui).
3. header: imperative, <= 50 characters. No trailing punctuation other than necessary.
4. body: 1-2 short sentences, <= 120 characters total. If breaking change, include the phrase \"BREAKING CHANGE:\" at the start of the body and append a '!' to the type or type(scope)!.
5. emoji: choose exactly one emoji from the mapping below that best matches the type.
6. Do NOT include any other keys or metadata. The AI must output a single valid JSON object parseable by standard JSON.parse.

EMOJI MAP (use one emoji per option):
feat: ["🚀","✨"]
fix: ["🐛","🩹"]
refactor: ["♻️","🔧"]
perf: ["⚡️","🚤"]
docs: ["📝","📚"]
test: ["✅","🧪"]
chore: ["🔨","🧹"]
style: ["💄","🎨"]
build: ["👷","📦"]
ci: ["🔁","💚"]

EXTRA GUIDANCE FOR QUALITY:
- Prefer concrete headers like \"add X feature\", \"fix race condition in Y\", \"refactor Z for readability\" rather than vague ones.
- If multiple files changed, prefer scopes that reflect the primary module (e.g., 'auth', 'db', 'cli').
- If the diff is a small bugfix, prefer 'fix'. If it adds behavior, prefer 'feat'. If it only renames or reformats, consider 'refactor' or 'style'.
- For each option, ensure body clearly connects to the diff: mention the affected file/function or the symptom that was fixed.
- If the diff includes tests, prefer adding a 'test' option describing the added test purpose.

EXAMPLE (for reference only — DO NOT emit this example in the output):
{
  "options": [
    {
      "type": "feat",
      "scope": "auth",
      "header": "add Google OAuth2 login",
      "body": "Implement Google OAuth2 and link accounts to existing users",
      "emoji": "✨"
    },
    {
      "type": "fix",
      "scope": null,
      "header": "fix race condition in upload queue",
      "body": "Prevent duplicated processing by adding mutex around queue worker",
      "emoji": "🐛"
    }
  ]
}

NOW: produce the single JSON object described above with exactly ${count} options.`;
  }
}
