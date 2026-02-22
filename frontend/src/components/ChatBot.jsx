import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User } from 'lucide-react';
import axios from 'axios';

const ChatBot = ({ contextPlot }) => {
    const [messages, setMessages] = useState([
        { role: 'ai', text: "Hi! How can I assist you today?" }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [copiedIndex, setCopiedIndex] = useState(null);
    const messagesEndRef = useRef(null);

    const handleCopy = (text, index) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(index);
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg = input;
        setInput("");
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setLoading(true);

        try {
            // Build context string from selected plot
            let contextStr = "No specific plot selected.";
            if (contextPlot) {
                contextStr = `Plot No: ${contextPlot.plot_no}, Owner: ${contextPlot.owner}, Status: ${contextPlot.status}, Area: ${contextPlot.area || 'N/A'}`;
            }

            const response = await axios.post('http://localhost:8000/api/chat', {
                message: userMsg,
                context: contextStr
            });

            setMessages(prev => [...prev, { role: 'ai', text: response.data.reply }]);
        } catch (error) {
            console.error("Chat Error:", error);
            setMessages(prev => [...prev, { role: 'ai', text: "⚠ connection error. Ensure backend is running at localhost:8000." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="chat-container">
            <div className="card chat-messages">
                {messages.map((msg, index) => (
                    <div key={index} className={`message ${msg.role}`}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', width: '100%' }}>
                            <div style={{ display: 'flex', marginTop: '4px' }}>
                                {msg.role === 'ai' && <Bot size={16} />}
                                {msg.role === 'user' && <User size={16} />}
                            </div>
                            <span style={{ whiteSpace: 'pre-wrap', flex: 1 }}>{msg.text}</span>
                            {msg.role === 'ai' && (
                                <button 
                                    className="copy-btn"
                                    onClick={() => handleCopy(msg.text, index)}
                                    title="Copy message"
                                >
                                    {copiedIndex === index ? '✓' : '📋'}
                                </button>
                            )}
                        </div>
                    </div>
                ))}
                {loading && <div className="message ai">Thinking...</div>}
                <div ref={messagesEndRef} />
            </div>

            <div className="input-group">
                <input
                    type="text"
                    placeholder="Ask Nagarik Sahayak..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                />
                <button onClick={handleSend} disabled={loading}>
                    <Send size={18} />
                </button>
            </div>
        </div>
    );
};

export default ChatBot;
