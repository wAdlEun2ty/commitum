export default {
    MODEL: 'deepseek-coder-v2',
    OLLAMA_PORT: 11434,
    SERVER_START_TIMEOUT: 3000,
    MAX_DIFF_SIZE: 15000,

    getConfig() {
        return {
            model: this.MODEL,
            port: this.OLLAMA_PORT,
            timeout: this.SERVER_START_TIMEOUT,
            maxDiffSize: this.MAX_DIFF_SIZE
        };
    }
};