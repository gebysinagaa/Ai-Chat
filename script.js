/**
 * Berviz Assistant Chat Application
 * Aplikasi chat dengan Berviz Assistant menggunakan API Meta AI
 */

class BervizAssistant {
    constructor() {
        this.apiUrl = 'https://api.siputzx.my.id/api/ai/metaai?query=';
        this.messages = [];
        
        this.initElements();
        this.bindEvents();
        this.adjustTextareaHeight();
    }

    /**
     * Inisialisasi elemen-elemen DOM
     */
    initElements() {
        this.chatContainer = document.getElementById('chatContainer');
        this.messageInput = document.getElementById('messageInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.connectionStatus = document.getElementById('connectionStatus');
    }

    /**
     * Binding event listeners
     */
    bindEvents() {
        // Button events
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        
        // Keyboard events
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        this.messageInput.addEventListener('input', () => this.adjustTextareaHeight());
    }

    /**
     * Menyesuaikan tinggi textarea secara otomatis
     */
    adjustTextareaHeight() {
        this.messageInput.style.height = 'auto';
        this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 120) + 'px';
    }

    /**
     * Menampilkan pesan error
     * @param {string} message - Pesan error
     */
    showError(message) {
        this.addMessage('ai', message, true);
    }

    /**
     * Menambahkan pesan ke chat
     * @param {string} sender - 'user' atau 'ai'
     * @param {string} content - Isi pesan
     * @param {boolean} isError - Apakah ini pesan error
     * @returns {HTMLElement} - Element pesan yang dibuat
     */
    addMessage(sender, content, isError = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        
        const bubbleDiv = document.createElement('div');
        bubbleDiv.className = `message-bubble ${isError ? 'error' : ''}`;
        bubbleDiv.textContent = content;
        
        const timestamp = document.createElement('div');
        timestamp.className = 'timestamp';
        timestamp.textContent = new Date().toLocaleTimeString('id-ID', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        messageDiv.appendChild(bubbleDiv);
        bubbleDiv.appendChild(timestamp);
        
        this.chatContainer.appendChild(messageDiv);
        this.scrollToBottom();
        
        return messageDiv;
    }

    /**
     * Menampilkan indikator typing
     * @returns {HTMLElement} - Element typing indicator
     */
    showTyping() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'typing';
        typingDiv.textContent = 'Berviz Assistant sedang mengetik';
        typingDiv.id = 'typing-indicator';
        this.chatContainer.appendChild(typingDiv);
        this.scrollToBottom();
        return typingDiv;
    }

    /**
     * Menyembunyikan indikator typing
     */
    hideTyping() {
        const typing = document.getElementById('typing-indicator');
        if (typing) {
            typing.remove();
        }
    }

    /**
     * Mengirim pesan ke chat
     */
    async sendMessage() {
        const message = this.messageInput.value.trim();

        if (!message) return;

        // Add user message
        this.addMessage('user', message);
        
        // Clear input
        this.messageInput.value = '';
        this.adjustTextareaHeight();

        // Show typing indicator
        const typing = this.showTyping();

        try {
            await this.sendToBervizAI(message);
        } catch (error) {
            this.showError('Terjadi kesalahan: ' + error.message);
        } finally {
            this.hideTyping();
        }
    }

    /**
     * Mengirim request ke Berviz AI API
     * @param {string} message - Pesan text
     */
    async sendToBervizAI(message) {
        // Encode query for URL
        const encodedQuery = encodeURIComponent(message);
        
        try {
            const response = await fetch(`${this.apiUrl}${encodedQuery}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP Error: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Extract response text from the API response
            // Based on the JSON structure from the screenshot
            let aiResponse = data.data || data.result || data.response || 
                            data.answer || data.message || 'Tidak dapat memproses respons dari Berviz Assistant';
            
            this.addMessage('ai', aiResponse);
            
        } catch (error) {
            console.error('Error calling Berviz AI API:', error);
            this.showError('Terjadi kesalahan saat menghubungi Berviz Assistant: ' + error.message);
        }
    }

    /**
     * Scroll ke bawah chat container
     */
    scrollToBottom() {
        setTimeout(() => {
            this.chatContainer.scrollTop = this.chatContainer.scrollHeight;
        }, 100);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new BervizAssistant();
});

// Prevent form submission on enter
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
    }
});
