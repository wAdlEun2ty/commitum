import { spawn } from 'child_process';
import http from 'http';
import config from './config.js';

export default class OllamaService {
    constructor() {
        this.serverProcess = null;
        this.config = config.getConfig();
        this.maxRetries = 3;
        this.retryDelay = 2000;
    }

    async start() {
        if (await this.isHealthy()) return;

        console.log('🚀 Starting Ollama server...');
        this.serverProcess = spawn('ollama', ['serve'], {
            stdio: 'ignore',
            detached: true
        });

        // Wait for server to become healthy
        for (let i = 0; i < this.maxRetries; i++) {
            await new Promise(r => setTimeout(r, this.retryDelay));
            if (await this.isHealthy()) return;
        }

        throw new Error('Failed to start Ollama server');
    }

    async isHealthy() {
        return new Promise(resolve => {
            const req = http.get(`http://localhost:${this.config.port}`, res => {
                resolve(res.statusCode === 200);
            });

            req.on('error', () => resolve(false));
            req.setTimeout(1000, () => {
                req.destroy();
                resolve(false);
            });
        });
    }

    stop() {
        if (this.serverProcess) {
            try {
                process.kill(-this.serverProcess.pid, 'SIGTERM');
            } catch (e) {
                console.warn('⚠️ Failed to stop Ollama:', e.message);
            }
            this.serverProcess = null;
        }
    }

    getEndpoint() {
        return `http://localhost:${this.config.port}/api/generate`;
    }
}