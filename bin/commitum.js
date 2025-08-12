#!/usr/bin/env node
import CommitGenerator from '../lib/commit-generator.js';

(async () => {
    try {
        const generator = new CommitGenerator();
        await generator.execute();
    } catch (error) {
        console.error('🚨 Fatal Error:', error.message);
        process.exit(1);
    }
})();