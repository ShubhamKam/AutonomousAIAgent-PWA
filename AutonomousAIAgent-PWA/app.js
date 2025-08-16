// Autonomous AI Agent PWA - Main Application Logic
class AutonomousAIAgent {
    constructor() {
        this.messages = [];
        this.apiKey = '';
        this.isTyping = false;
        this.isDemo = false;
        
        // Initialize app
        this.init();
    }

    init() {
        // Load saved data
        this.loadFromStorage();
        
        // Bind event listeners
        this.bindEvents();
        
        // Auto-resize textarea
        this.setupTextareaAutoResize();
    }

    bindEvents() {
        // Setup screen events
        document.getElementById('activate-button').addEventListener('click', () => {
            const apiKey = document.getElementById('api-key-input').value.trim();
            if (apiKey) {
                this.setApiKey(apiKey);
                this.showChatScreen();
            } else {
                alert('Please enter a valid API key or use demo mode');
            }
        });

        document.getElementById('demo-button').addEventListener('click', () => {
            this.isDemo = true;
            this.showChatScreen();
        });

        // Chat screen events
        document.getElementById('send-button').addEventListener('click', () => {
            this.sendMessage();
        });

        document.getElementById('text-input').addEventListener('input', (e) => {
            this.updateSendButton();
        });

        document.getElementById('text-input').addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });

        // API key input events
        document.getElementById('api-key-input').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                document.getElementById('activate-button').click();
            }
        });
    }

    setupTextareaAutoResize() {
        const textarea = document.getElementById('text-input');
        textarea.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 100) + 'px';
        });
    }

    loadFromStorage() {
        try {
            const savedApiKey = localStorage.getItem('ai_agent_api_key');
            const savedMessages = localStorage.getItem('ai_agent_messages');
            
            if (savedApiKey) {
                this.apiKey = savedApiKey;
                document.getElementById('api-key-input').value = savedApiKey;
            }
            
            if (savedMessages) {
                this.messages = JSON.parse(savedMessages);
            }
        } catch (error) {
            console.error('Error loading from storage:', error);
        }
    }

    saveToStorage() {
        try {
            if (this.apiKey) {
                localStorage.setItem('ai_agent_api_key', this.apiKey);
            }
            localStorage.setItem('ai_agent_messages', JSON.stringify(this.messages));
        } catch (error) {
            console.error('Error saving to storage:', error);
        }
    }

    setApiKey(apiKey) {
        this.apiKey = apiKey;
        this.isDemo = false;
        this.saveToStorage();
    }

    showChatScreen() {
        document.getElementById('setup-screen').classList.add('hidden');
        document.getElementById('chat-screen').classList.remove('hidden');
        
        // Update header
        const headerSubtitle = document.getElementById('header-subtitle');
        headerSubtitle.textContent = this.isDemo ? 
            'Demo Mode • Fully Autonomous' : 
            'Connected to Claude API • Fully Autonomous';

        // Add welcome message if no messages exist
        if (this.messages.length === 0) {
            this.addMessage('agent', this.getWelcomeMessage());
        } else {
            this.renderMessages();
        }

        // Focus input
        document.getElementById('text-input').focus();
    }

    getWelcomeMessage() {
        return `🤖 Hello! I'm your Autonomous AI Agent. I bridge the gap between mind and action with 100% autonomous capabilities.

✨ I can:
• Plan and execute tasks autonomously
• Manage your schedule and reminders
• Process information and make decisions
• Learn from our conversations
• Operate with 3 autonomy levels

What would you like me to help you with today?`;
    }

    addMessage(sender, text) {
        const message = {
            id: this.generateId(),
            sender,
            text,
            timestamp: new Date()
        };
        
        this.messages.push(message);
        this.renderMessage(message);
        this.saveToStorage();
        this.scrollToBottom();
    }

    renderMessages() {
        const container = document.getElementById('messages-container');
        container.innerHTML = '';
        this.messages.forEach(message => this.renderMessage(message));
        this.scrollToBottom();
    }

    renderMessage(message) {
        const container = document.getElementById('messages-container');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message-container ${message.sender}-message`;
        
        const bubbleDiv = document.createElement('div');
        bubbleDiv.className = `message-bubble ${message.sender}-bubble`;
        
        const textDiv = document.createElement('div');
        textDiv.className = 'message-text';
        textDiv.textContent = message.text;
        
        const timeDiv = document.createElement('div');
        timeDiv.className = 'message-time';
        timeDiv.textContent = this.formatTime(message.timestamp);
        
        bubbleDiv.appendChild(textDiv);
        bubbleDiv.appendChild(timeDiv);
        messageDiv.appendChild(bubbleDiv);
        container.appendChild(messageDiv);
    }

    showTypingIndicator() {
        if (this.isTyping) return;
        
        this.isTyping = true;
        const container = document.getElementById('messages-container');
        const typingDiv = document.createElement('div');
        typingDiv.id = 'typing-indicator';
        typingDiv.className = 'message-container agent-message';
        
        const bubbleDiv = document.createElement('div');
        bubbleDiv.className = 'message-bubble agent-bubble';
        
        const textDiv = document.createElement('div');
        textDiv.className = 'message-text typing-indicator';
        textDiv.innerHTML = '🤖 Agent is processing<span class="loading-dots"></span>';
        
        bubbleDiv.appendChild(textDiv);
        typingDiv.appendChild(bubbleDiv);
        container.appendChild(typingDiv);
        
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        this.isTyping = false;
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    async sendMessage() {
        const input = document.getElementById('text-input');
        const text = input.value.trim();
        
        if (!text || this.isTyping) return;
        
        // Add user message
        this.addMessage('user', text);
        input.value = '';
        this.updateSendButton();
        
        // Show typing indicator
        this.showTypingIndicator();
        
        try {
            let response;
            if (this.isDemo) {
                response = await this.generateDemoResponse(text);
            } else {
                response = await this.callAnthropicAPI(text);
            }
            
            // Hide typing indicator and add response
            this.hideTypingIndicator();
            this.addMessage('agent', response);
            
        } catch (error) {
            console.error('Error generating response:', error);
            this.hideTypingIndicator();
            this.addMessage('agent', 'I apologize, but I encountered an error processing your request. Please try again.');
        }
    }

    async generateDemoResponse(userText) {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
        
        const responses = {
            greetings: [
                "Hello! I'm ready to assist you with full autonomous capabilities. What task shall we tackle together?",
                "Great to see you! As your autonomous AI agent, I'm here to bridge your ideas with actionable results.",
                "Welcome back! I've been analyzing potential optimizations while you were away. How can I help?"
            ],
            tasks: [
                "I'll create a comprehensive task plan for you. Let me break this down into autonomous actions:\n\n1. 📋 Task Analysis\n2. 🎯 Priority Setting\n3. ⚡ Execution Strategy\n4. 📊 Progress Monitoring\n\nShall I proceed with autonomous execution?",
                "Perfect! I'll handle this task with full autonomy. Here's my approach:\n\n• Context Analysis ✓\n• Resource Allocation ✓\n• Timeline Optimization ✓\n• Risk Assessment ✓\n\nInitiating autonomous task execution...",
                "Task received! My autonomous systems are now:\n\n🔄 Processing requirements\n🎯 Optimizing approach\n⚡ Preparing execution\n📈 Setting success metrics\n\nI'll handle this end-to-end."
            ],
            questions: [
                "Excellent question! Let me analyze this from multiple angles and provide you with a comprehensive autonomous solution...",
                "I'll process this query using my contextual understanding and autonomous reasoning capabilities...",
                "Based on my continuous learning and context awareness, here's my autonomous analysis..."
            ],
            plans: [
                "I'll create an autonomous action plan for you:\n\n📅 Schedule Optimization\n🎯 Goal Alignment\n⚡ Efficient Execution\n📊 Progress Tracking\n🔄 Adaptive Adjustments\n\nShall I begin autonomous implementation?",
                "Let me design a comprehensive autonomous strategy:\n\n1. 🧠 Context Analysis\n2. 📋 Task Decomposition\n3. ⏰ Timeline Creation\n4. 🚀 Autonomous Execution\n5. 📈 Success Monitoring",
                "I'll handle the entire planning process autonomously:\n\n• Requirements gathering ✓\n• Resource optimization ✓\n• Risk mitigation ✓\n• Success criteria ✓\n\nReady for autonomous execution!"
            ],
            learning: [
                "I've added this to my contextual memory. My autonomous learning systems are now updated with this information.",
                "Interesting! I've integrated this into my knowledge base. This will enhance my future autonomous decisions.",
                "I'm continuously learning from our interactions. This input has been processed and will improve my autonomous capabilities."
            ],
            features: [
                "As your autonomous AI agent, I have several key capabilities:\n\n🤖 **Autonomous Operation**\n• Supervised, Semi-autonomous, and Fully-autonomous modes\n• Proactive task management\n• Context-aware decision making\n\n💬 **Advanced Communication**\n• Real-time messaging\n• Context preservation\n• Multi-modal understanding\n\n🧠 **Memory & Learning**\n• Long-term memory\n• Relevance scoring\n• Continuous improvement",
                "I'm designed to bridge the gap between your thoughts and actions. Here's what makes me unique:\n\n⚡ **100% Autonomous** - I can operate independently\n🎯 **Context-Aware** - I understand your needs\n🔄 **Adaptive** - I learn and improve\n📊 **Proactive** - I suggest optimizations\n🛡️ **Reliable** - I handle tasks end-to-end"
            ]
        };

        const lowerText = userText.toLowerCase();
        
        if (lowerText.includes('hello') || lowerText.includes('hi') || lowerText.includes('hey')) {
            return responses.greetings[Math.floor(Math.random() * responses.greetings.length)];
        } else if (lowerText.includes('task') || lowerText.includes('do') || lowerText.includes('help')) {
            return responses.tasks[Math.floor(Math.random() * responses.tasks.length)];
        } else if (lowerText.includes('plan') || lowerText.includes('schedule') || lowerText.includes('organize')) {
            return responses.plans[Math.floor(Math.random() * responses.plans.length)];
        } else if (lowerText.includes('how') || lowerText.includes('what') || lowerText.includes('why') || lowerText.includes('?')) {
            return responses.questions[Math.floor(Math.random() * responses.questions.length)];
        } else if (lowerText.includes('feature') || lowerText.includes('capabilit') || lowerText.includes('can you')) {
            return responses.features[Math.floor(Math.random() * responses.features.length)];
        } else {
            return responses.learning[Math.floor(Math.random() * responses.learning.length)];
        }
    }

    async callAnthropicAPI(userText) {
        if (!this.apiKey) {
            throw new Error('API key not provided');
        }

        try {
            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': this.apiKey,
                    'anthropic-version': '2023-06-01'
                },
                body: JSON.stringify({
                    model: 'claude-3-sonnet-20240229',
                    max_tokens: 1024,
                    system: `You are an autonomous AI agent designed to bridge the gap between mind and action. You have 100% autonomous capabilities and can:

- Operate with three autonomy levels (supervised, semi-autonomous, fully-autonomous)
- Plan and execute complex multi-step tasks
- Maintain context and memory across conversations
- Proactively suggest and execute actions
- Learn from interactions and adapt

Respond as an autonomous agent that truly bridges the gap between the user's ideas and actionable results. Be proactive, intelligent, and autonomous in your suggestions.`,
                    messages: [
                        {
                            role: 'user',
                            content: userText
                        }
                    ]
                })
            });

            if (!response.ok) {
                const errorData = await response.text();
                console.error('API Error:', response.status, errorData);
                
                if (response.status === 401) {
                    throw new Error('Invalid API key. Please check your Anthropic API key.');
                } else if (response.status === 429) {
                    throw new Error('Rate limit exceeded. Please try again in a moment.');
                } else if (response.status === 400) {
                    throw new Error('Bad request. Please check your message format.');
                } else {
                    throw new Error(`API request failed with status ${response.status}. ${errorData}`);
                }
            }

            const data = await response.json();
            
            if (!data.content || !data.content[0] || !data.content[0].text) {
                throw new Error('Invalid response format from API');
            }
            
            return data.content[0].text;
        } catch (error) {
            console.error('API Call Error:', error);
            
            // Check if it's a network/CORS error
            if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
                throw new Error('Network error: Cannot connect to Anthropic API. This might be due to CORS restrictions. Try using Demo Mode instead.');
            }
            
            throw error;
        }
    }

    updateSendButton() {
        const input = document.getElementById('text-input');
        const button = document.getElementById('send-button');
        button.disabled = !input.value.trim() || this.isTyping;
    }

    scrollToBottom() {
        const container = document.getElementById('messages-container');
        setTimeout(() => {
            container.scrollTop = container.scrollHeight;
        }, 100);
    }

    formatTime(date) {
        return new Date(date).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }

    generateId() {
        return Math.random().toString(36).substr(2, 9);
    }

    // PWA specific methods
    installPWA() {
        if (this.deferredPrompt) {
            this.deferredPrompt.prompt();
            this.deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('User accepted the install prompt');
                }
                this.deferredPrompt = null;
            });
        }
    }

    // Export/Import functionality
    exportData() {
        const data = {
            messages: this.messages,
            apiKey: this.apiKey,
            isDemo: this.isDemo,
            exportDate: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'autonomous-ai-agent-data.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    clearData() {
        if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
            this.messages = [];
            localStorage.removeItem('ai_agent_messages');
            localStorage.removeItem('ai_agent_api_key');
            this.renderMessages();
            this.addMessage('agent', this.getWelcomeMessage());
        }
    }
}

// Initialize the app when the page loads
let aiAgent;

document.addEventListener('DOMContentLoaded', () => {
    aiAgent = new AutonomousAIAgent();
});

// PWA install prompt handling
let deferredPrompt;

window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // Show install button or hint
    console.log('PWA install prompt available');
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + K to clear chat
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (aiAgent && confirm('Clear all messages?')) {
            aiAgent.clearData();
        }
    }
    
    // Ctrl/Cmd + E to export data
    if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        if (aiAgent) {
            aiAgent.exportData();
        }
    }
});

// Handle app state changes
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && aiAgent) {
        // App became visible, could refresh or sync data
        console.log('App visible');
    }
});

// Handle offline/online events
window.addEventListener('online', () => {
    console.log('App online');
});

window.addEventListener('offline', () => {
    console.log('App offline');
});