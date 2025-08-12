import OllamaService from './ollama-service.js';
import GitService from './git-service.js';
import AIService from './ai-service.js';
import UI from './ui.js';
import config from './config.js';
import chalk from 'chalk';

export default class CommitGenerator {
    constructor() {
        this.ollamaService = new OllamaService();
        this.aiService = new AIService(this.ollamaService);
    }

    async execute() {
        if (!GitService.hasStagedChanges()) {
            console.log(chalk.yellow('ℹ No staged changes'));
            return;
        }

        try {
            const diff = await GitService.getStagedDiff();
            await this.ollamaService.start();

            // Display loading indicator
            const loading = UI.displayLoading();

            try {
                const options = await this.aiService.generateCommitMessage(diff);
                clearInterval(loading);
                process.stdout.write('\r' + ' '.repeat(40) + '\r'); // Clear line

                UI.displayCommitOptions(options);

                let choice = await UI.promptCommitSelection();
                let selectedOption = null;

                switch (true) {
                    case choice > 0 && choice <= options.length:
                        selectedOption = options[choice - 1];
                        break;
                    case choice === -1:
                        selectedOption = await UI.editCommitMessage(options[0]);
                        break;
                    case choice === 0:
                        console.log(chalk.yellow('Commit cancelled'));
                        return;
                    default:
                        console.log(chalk.red('Invalid choice'));
                        return;
                }

                const success = await GitService.commitWithMessage(selectedOption);
                if (success) {
                    UI.displayCommitSuccess(
                        `${selectedOption.emoji} ${selectedOption.type}${selectedOption.scope ? `(${selectedOption.scope})` : ''}: ${selectedOption.header}`
                    );
                }
            } catch (error) {
                clearInterval(loading);
                console.error(chalk.red('🚨 AI Error:'), error.message);
            }
        } catch (error) {
            console.error(chalk.red('🚨 System Error:'), error.message);
        } finally {
            this.ollamaService.stop();
        }
    }
}