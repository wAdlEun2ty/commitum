const VALID_TYPES = new Set([
  'feat', 'fix', 'refactor', 'perf', 'chore', 
  'docs', 'style', 'test', 'build', 'ci'
]);

const EMOJI_MAP = {
  feat: ['🚀', '✨'],
  fix: ['🐛', '🩹'],
  refactor: ['♻️', '🔧'],
  perf: ['⚡️', '🚤'],
  chore: ['🔨', '🧹'],
  docs: ['📝', '📚'],
  style: ['💄', '🎨'],
  test: ['✅', '🧪'],
  build: ['👷', '📦'],
  ci: ['🔁', '💚']
};

export default class CommitLinter {
  static validate(commit) {
    const errors = [];
    
    // Type validation
    if (!VALID_TYPES.has(commit.type)) {
      errors.push(`Invalid type: ${commit.type}`);
    }
    
    // Scope validation
    if (commit.scope && commit.scope.length > 12) {
      errors.push(`Scope too long (${commit.scope.length} > 12)`);
    }
    
    // Header validation
    if (commit.header.length > 50) {
      errors.push(`Header too long (${commit.header.length} > 50)`);
    }
    
    // Body validation
    if (commit.body.length > 120) {
      errors.push(`Body too long (${commit.body.length} > 120)`);
    }
    
    // Emoji validation
    const validEmojis = EMOJI_MAP[commit.type] || [];
    if (!validEmojis.includes(commit.emoji)) {
      errors.push(`Invalid emoji for ${commit.type}`);
    }
    
    return {
      valid: errors.length === 0,
      errors,
      formatted: `${commit.emoji} ${commit.type}${commit.scope ? `(${commit.scope})` : ''}: ${commit.header}\n  ${commit.body}`
    };
  }
}