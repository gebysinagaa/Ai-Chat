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
        this.fileBtn = document.getElementById('fileBtn');
        this.fileInput = document.getElementById('fileInput');
        this.connectionStatus = document.getElementById('connectionStatus');
    }

    /**
     * Binding event listeners
     */
    bindEvents() {
        // Button events
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
        
        // Show file selection feedback
        const fileName = file.name.length > 25 ? file.name.substring(0, 25) + '...' : file.name;
        this.messageInput.placeholder = `File dipilih: ${fileName} - Ketik pesan atau langsung kirim...`;
        
        // Add user message with file
        const userMessageDiv = this.addMessage('user', 'Mengirim file...');
        const fileData = await this.getFileAsBase64(file);
        this.addFilePreview(userMessageDiv, file, fileData);
        
        // Send file to API
        this.sendToBervizAI(null, file);
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
        const message = this.messageInput.value.trim();

        if (!message) return;

        // Add user message
        this.addMessage('user', message);
        
        // Clear input
        this.messageInput.value = '';
        this.messageInput.placeholder = 'Ketik pesan...';
        this.adjustTextareaHeight();

        // Show typing indicator
        const typing = this.showTyping();

        try {
            await this.sendToBervizAI(message, null);
        } catch (error) {
            this.showError('Terjadi kesalahan: ' + error.message);
        } finally {
            this.hideTyping();
        }
    }

    /**
     * Mengirim request ke Berviz AI API
     * @param {string} message - Pesan text
     * @param {File} file - File yang diupload
     */
    async sendToBervizAI(message, file) {
        let query = message || 'Analisis file ini';
        
        if (file) {
            // For files, we'll just send a description
            query += ` (File: ${file.name}, Tipe: ${file.type}, Ukuran: ${this.formatFileSize(file.size)})`;
        }
        
        // Encode query for URL
        const encodedQuery = encodeURIComponent(query);
        
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
            let aiResponse = data.result || data.response || data.answer || 
                            data.message || 'Tidak dapat memproses respons dari Berviz Assistant';
            
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
