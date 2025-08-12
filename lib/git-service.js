import { spawn, execSync } from 'child_process';
import config from './config.js';
import CommitLinter from './commit-linter.js';

export default class GitService {
    static async getStagedDiff() {
        return new Promise((resolve, reject) => {
            const maxSize = config.getConfig().maxDiffSize;
            let diff = '';
            const child = spawn('git', ['diff', '--cached', '--diff-algorithm=minimal']);

            child.stdout.on('data', chunk => {
                if (diff.length < maxSize) {
                    diff += chunk.toString();
                }
            });

            child.stderr.on('data', err => reject(new Error(err.toString())));

            child.on('close', code => {
                if (code !== 0) return reject(new Error(`git diff exited with code ${code}`));

                if (diff.length >= maxSize) {
                    diff = this.truncateDiff(diff, maxSize);
                }
                resolve(diff.trim());
            });
        });
    }

    static truncateDiff(diff, maxSize) {
        // Prioritize keeping important parts
        const importantPatterns = [
            /@@ [^@]+ @@/g,         // Hunk headers
            /^\+[^+].*$/gm,          // Added lines
            /^\-[^-].*$/gm           // Removed lines
        ];

        let importantParts = '';
        for (const pattern of importantPatterns) {
            let match;
            while ((match = pattern.exec(diff)) !== null) {
                importantParts += match[0] + '\n';
            }
        }

        return importantParts.slice(0, maxSize) + '\n... [diff truncated]';
    }

    static hasStagedChanges() {
        try {
            return execSync('git diff --cached --quiet', { stdio: 'ignore' }).status !== 0;
        } catch {
            return true;
        }
    }

    static async commitWithMessage(message) {
        try {
            // Validate commit format
            const validation = CommitLinter.validate(message);
            if (!validation.valid) {
                console.error('❌ Invalid commit format:', validation.errors.join(', '));
                return false;
            }

            execSync(`git commit -m "${validation.formatted.replace(/"/g, '\\"')}"`, { stdio: 'inherit' });
            return true;
        } catch {
            return false;
        }
    }
}