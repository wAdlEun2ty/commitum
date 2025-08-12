import { EventEmitter } from 'events';
import fetch from 'node-fetch';
import PromptEngineer from './prompt-engineer.js';

export default class AIService extends EventEmitter {
    constructor(ollamaService) {
        super();
        this.ollama = ollamaService;
    }

    async generateCommitMessage(diff) {
        const prompt = PromptEngineer.generatePrompt(diff);
        let fullResponse = '';
        let jsonBuffer = '';

        const response = await fetch(this.ollama.getEndpoint(), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: this.ollama.config.model,
                prompt,
                stream: true,
                format: 'json',
                options: {
                    temperature: 0.2,
                    num_ctx: 4096
                }
            })
        });

        if (!response.ok) {
            throw new Error(`AI request failed: ${response.status} ${response.statusText}`);
        }

        return new Promise((resolve, reject) => {
            response.body.on('data', chunk => {
                const data = chunk.toString();
                try {
                    const parsed = JSON.parse(data);
                    fullResponse += parsed.response;
                    jsonBuffer += parsed.response;

                    // Attempt to parse complete JSON objects
                    const jsonObjects = this.extractJSONObjects(jsonBuffer);
                    if (jsonObjects.length > 0) {
                        this.emit('partial', jsonObjects);
                        jsonBuffer = jsonBuffer.slice(jsonObjects[jsonObjects.length - 1].endIndex);
                    }

                    this.emit('token', parsed.response);
                } catch (e) {
                    this.emit('error', e);
                }
            });

            response.body.on('end', () => {
                try {
                    const finalObjects = this.extractJSONObjects(fullResponse);
                    if (finalObjects.length === 0) {
                        throw new Error('Invalid JSON response from AI');
                    }
                    resolve(finalObjects[0].data.options.slice(0, 5));
                } catch (e) {
                    reject(e);
                }
            });

            response.body.on('error', reject);
        });
    }

    extractJSONObjects(str) {
        const objects = [];
        let depth = 0;
        let inString = false;
        let startIndex = -1;
        let escape = false;

        for (let i = 0; i < str.length; i++) {
            const char = str[i];

            if (char === '\\' && !escape) {
                escape = true;
                continue;
            }

            if (escape) {
                escape = false;
                continue;
            }

            if (char === '"' && !escape) {
                inString = !inString;
            }

            if (!inString) {
                if (char === '{') {
                    if (depth === 0) {
                        startIndex = i;
                    }
                    depth++;
                } else if (char === '}') {
                    depth--;
                    if (depth === 0 && startIndex !== -1) {
                        try {
                            const jsonStr = str.substring(startIndex, i + 1);
                            const data = JSON.parse(jsonStr);
                            objects.push({
                                data,
                                startIndex,
                                endIndex: i + 1
                            });
                            startIndex = -1;
                        } catch (e) {
                            // Invalid JSON, continue
                        }
                    }
                }
            }
        }

        return objects;
    }
}