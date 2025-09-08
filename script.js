/**
 * AI Chat Application
 * Aplikasi chat dengan AI yang mendukung file upload dan analisis gambar
 */

class AIChatApp {
    constructor() {
        this.apiKey = 'sk-jIs2RTjvVgR_WFnutgpAjRTkGdAqleLWaW7eZo1U3wT3BlbkFJ0YU-UsCCDHnlBRtKCtaMw67E-dloPQMNACosFfh0cA';
        this.isConnected = false;
        this.currentFile = null;
        this.messages = [];
        
        this.initElements();
        this.bindEvents();
        this.adjustTextareaHeight();
    }

    /**
     * Inisialisasi elemen-elemen DOM
     */
    initElements() {
        this.apiKeyInput = document.getElementById('apiKey');
        this.connectBtn = document.getElementById('connectBtn');
        this.chatContainer = document.getElementById('chatContainer');
        this.messageInput = document.getElementById('messageInput');
        this.sendBtn = document.getElementById('sendBtn');
        this.fileBtn = document.getElementById('fileBtn');
        this.fileInput = document.getElementById('fileInput');
        this.connectionStatus = document.getElementById('connectionStatus');
    }

    /**
     * Binding event listeners
     */
    bindEvents() {
        // Button events
        this.connectBtn.addEventListener('click', () => this.connectAPI());
        this.sendBtn.addEventListener('click', () => this.sendMessage());
        this.fileBtn.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        
        // Keyboard events
        this.messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        this.messageInput.addEventListener('input', () => this.adjustTextareaHeight());
        
        this.apiKeyInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.connectAPI();
            }
        });
    }

    /**
     * Menyesuaikan tinggi textarea secara otomatis
     */
    adjustTextareaHeight() {
        this.messageInput.style.height = 'auto';
        this.messageInput.style.height = Math.min(this.messageInput.scrollHeight, 120) + 'px';
    }

    /**
     * Menghubungkan ke OpenAI API
     */
    async connectAPI() {
        const apiKey = this.apiKeyInput.value.trim();
        
        if (!apiKey) {
            this.showError('Silakan masukkan API Key');
            return;
        }

        this.connectBtn.disabled = true;
        this.connectBtn.textContent = 'MENGHUBUNGKAN...';

        try {
            // Test API key dengan request ke models endpoint
            const response = await fetch('https://api.openai.com/v1/models', {
                headers: {
                    'Authorization': `Bearer ${apiKey}`
                }
            });

            if (response.ok) {
                this.apiKey = apiKey;
                this.isConnected = true;
                this.connectionStatus.textContent = 'TERHUBUNG';
                this.enableChat();
                this.clearWelcomeMessage();
                this.addMessage('ai', 'Halo! Saya AI assistant yang siap membantu Anda. Anda bisa mengirim pesan teks, gambar, atau file untuk saya analisis. Silakan tanya apa saja!');
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error?.message || 'API Key tidak valid');
            }
        } catch (error) {
            this.showError('Gagal terhubung: ' + error.message);
        } finally {
            this.connectBtn.disabled = false;
            this.connectBtn.textContent = 'HUBUNGKAN';
        }
    }

    /**
     * Mengaktifkan interface chat
     */
    enableChat() {
        this.messageInput.disabled = false;
        this.sendBtn.disabled = false;
        this.fileBtn.disabled = false;
        this.messageInput.focus();
        this.messageInput.placeholder = 'Ketik pesan...';
    }

    /**
     * Menghapus pesan welcome
     */
    clearWelcomeMessage() {
        const welcomeMsg = this.chatContainer.querySelector('.welcome-message');
        if (welcomeMsg) {
            welcomeMsg.remove();
        }
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
     * Menambahkan preview file ke pesan
     * @param {HTMLElement} messageDiv - Element pesan
     * @param {File} file - File yang diupload
     * @param {string} fileData - Data file dalam format base64
     */
    addFilePreview(messageDiv, file, fileData) {
        const bubble = messageDiv.querySelector('.message-bubble');
        const preview = document.createElement('div');
        preview.className = 'file-preview';
        
        if (file.type.startsWith('image/')) {
            const img = document.createElement('img');
            img.src = fileData;
            img.alt = file.name;
            preview.appendChild(img);
        } else {
            const fileIcon = document.createElement('div');
            fileIcon.innerHTML = `📎 ${file.name}`;
            fileIcon.style.fontSize = '14px';
            fileIcon.style.marginBottom = '5px';
            preview.appendChild(fileIcon);
        }
        
        const fileDetails = document.createElement('div');
        fileDetails.className = 'file-info';
        fileDetails.textContent = `${file.name} (${this.formatFileSize(file.size)})`;
        preview.appendChild(fileDetails);
        
        bubble.insertBefore(preview, bubble.querySelector('.timestamp'));
    }

    /**
     * Format ukuran file
     * @param {number} bytes - Ukuran dalam bytes
     * @returns {string} - Ukuran yang diformat
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Menampilkan indikator typing
     * @returns {HTMLElement} - Element typing indicator
     */
    showTyping() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'typing';
        typingDiv.textContent = 'AI sedang mengetik';
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
     * Handle pemilihan file
     * @param {Event} event - Event dari file input
     */
    async handleFileSelect(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        // Check file size (max 20MB)
        if (file.size > 20 * 1024 * 1024) {
            this.showError('File terlalu besar. Maksimal 20MB.');
            return;
        }
        
        this.currentFile = file;
        
        // Show file selection feedback
        const fileName = file.name.length > 25 ? file.name.substring(0, 25) + '...' : file.name;
        this.messageInput.placeholder = `File dipilih: ${fileName} - Ketik pesan atau langsung kirim...`;
    }

    /**
     * Mengkonversi file ke base64
     * @param {File} file - File yang akan dikonversi
     * @returns {Promise<string>} - Data base64
     */
    async getFileAsBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    /**
     * Mengirim pesan ke chat
     */
    async sendMessage() {
        if (!this.isConnected) {
            this.showError('Silakan hubungkan API Key terlebih dahulu');
            return;
        }

        const message = this.messageInput.value.trim();
        const file = this.currentFile;

        if (!message && !file) return;

        // Add user message
        const userMessageDiv = this.addMessage('user', message || 'Menganalisis file...');
        
        // Add file preview if exists
        if (file) {
            const fileData = await this.getFileAsBase64(file);
            this.addFilePreview(userMessageDiv, file, fileData);
        }

        // Clear input
        this.messageInput.value = '';
        this.messageInput.placeholder = 'Ketik pesan...';
        this.currentFile = null;
        this.fileInput.value = '';
        this.adjustTextareaHeight();

        // Show typing indicator
        const typing = this.showTyping();

        try {
            await this.sendToOpenAI(message, file);
        } catch (error) {
            this.showError('Terjadi kesalahan: ' + error.message);
        } finally {
            this.hideTyping();
        }
    }

    /**
     * Mengirim request ke OpenAI API
     * @param {string} message - Pesan text
     * @param {File} file - File yang diupload
     */
    async sendToOpenAI(message, file) {
        let messages = [
            {
                role: "system",
                content: "Anda adalah AI assistant yang membantu dalam bahasa Indonesia. Anda dapat menganalisis gambar, file, dan menjawab pertanyaan dengan ramah dan informatif. Berikan jawaban yang detail dan berguna."
            }
        ];

        // Add conversation history (last 10 messages for context)
        const recentMessages = this.messages.slice(-10);
        messages = messages.concat(recentMessages);

        const userMessage = {
            role: "user",
            content: []
        };

        if (message) {
            userMessage.content.push({
                type: "text",
                text: message
            });
        }

        if (file && file.type.startsWith('image/')) {
            const base64Data = await this.getFileAsBase64(file);
            userMessage.content.push({
                type: "image_url",
                image_url: {
                    url: base64Data,
                    detail: "high"
                }
            });
        } else if (file) {
            // For non-image files, convert to text if possible
            const fileText = await this.getFileText(file);
            userMessage.content.push({
                type: "text",
                text: `File yang diupload: ${file.name} (${this.formatFileSize(file.size)})\nKonten file: ${fileText}`
            });
        }

        messages.push(userMessage);

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "gpt-4o",
                messages: messages,
                max_tokens: 1500,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || `HTTP Error: ${response.status}`);
        }

        const data = await response.json();
        const aiResponse = data.choices[0].message.content;
        
        this.addMessage('ai', aiResponse);
        
        // Store messages in history
        this.messages.push(userMessage);
        this.messages.push({
            role: "assistant",
            content: aiResponse
        });

        // Keep only last 20 messages to manage memory
        if (this.messages.length > 20) {
            this.messages = this.messages.slice(-20);
        }
    }

    /**
     * Membaca konten file sebagai text
     * @param {File} file - File yang akan dibaca
     * @returns {Promise<string>} - Konten file
     */
    async getFileText(file) {
        try {
            if (file.type === 'text/plain' || file.name.endsWith('.txt')) {
                const text = await this.readAsText(file);
                return text.length > 1000 ? text.substring(0, 1000) + '...' : text;
            } else if (file.type === 'application/pdf') {
                return `[File PDF: ${file.name} - Tidak dapat membaca konten PDF secara langsung]`;
            } else {
                return `[File: ${file.name} - ${this.formatFileSize(file.size)} - Tipe: ${file.type}]`;
            }
        } catch (error) {
            return `[Tidak dapat membaca file: ${file.name}]`;
        }
    }

    /**
     * Membaca file sebagai text
     * @param {File} file - File yang akan dibaca
     * @returns {Promise<string>} - Isi file
     */
    readAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsText(file, 'UTF-8');
        });
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
    new AIChatApp();
});

// Prevent form submission on enter
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
    }
});