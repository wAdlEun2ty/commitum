import chalk from 'chalk';
import readline from 'readline';
import fs from 'fs';
import util from 'util';
import { execSync } from 'child_process';
import CommitLinter from './commit-linter.js';

const writeFile = util.promisify(fs.writeFile);
const unlink = util.promisify(fs.unlink);

export default class UI {
    static displayLoading() {
        const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
        let i = 0;

        return setInterval(() => {
            process.stdout.write(chalk.yellow(`\r${frames[i = ++i % frames.length]} Generating commit options...`));
        }, 80);
    }

    static displayCommitOptions(options) {
        console.log(chalk.bold.cyan('\n🚀 5 AI-Powered Commit Recommendations\n'));

        options.forEach((opt, idx) => {
            const validation = CommitLinter.validate(opt);
            const status = validation.valid ? '✅' : '⚠️';

            console.log(
                chalk.bold.yellow(`${idx + 1}. ${status} `) +
                chalk.hex('#FF79C6')(`${opt.emoji} ${opt.type}${opt.scope ? `(${opt.scope})` : ''}: `) +
                chalk.bold(opt.header)
            );

            console.log(chalk.gray(`   ${opt.body}`));

            if (!validation.valid) {
                console.log(chalk.red(`   Validation errors: ${validation.errors.join(', ')}`));
            }
        });

        console.log(chalk.cyan('\n' + '―'.repeat(80) + '\n'));
    }

    static async promptCommitSelection() {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        return new Promise(resolve => {
            rl.question(chalk.bold.green('? Choose option (1-5) or (e)dit/(c)ancel: '), answer => {
                rl.close();

                if (answer.toLowerCase() === 'c') return resolve(0);
                if (answer.toLowerCase() === 'e') return resolve(-1);

                const choice = parseInt(answer);
                resolve(isNaN(choice) ? -2 : choice);
            });
        });
    }

    static async editCommitMessage(option) {
        console.log(chalk.yellow('\n✏️  Editing commit message...'));

        const tempFile = '.commitum_edit.txt';
        const initialContent = `${option.emoji} ${option.type}${option.scope ? `(${opt.scope})` : ''}: ${option.header}\n\n${option.body}`;

        await writeFile(tempFile, initialContent);

        try {
            // Use system editor
            execSync(`"${process.env.EDITOR || 'nano'}" "${tempFile}"`, { stdio: 'inherit' });

            // Read edited content
            const edited = fs.readFileSync(tempFile, 'utf8').trim();
            await unlink(tempFile);

            // Parse edited content
            const match = edited.match(/(\S+) (\w+)(?:\(([\w-]+)\))?: (.+)\n\n(.+)/s);
            if (!match) throw new Error('Invalid format');

            return {
                emoji: match[1],
                type: match[2],
                scope: match[3] || null,
                header: match[4],
                body: match[5]
            };
        } catch (error) {
            console.error('Failed to edit:', error.message);
            return option;
        }
    }

    static displayCommitSuccess(message) {
        console.log(chalk.bold.green(`\n✓ Successfully committed:\n"${message}"\n`));
    }
}