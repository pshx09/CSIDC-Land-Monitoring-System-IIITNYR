import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User } from 'lucide-react';
import axios from 'axios';

const ChatBot = ({ contextPlot }) => {
    const [messages, setMessages] = useState([
        { role: 'ai', text: "Hello! I am Nagarik Sahayak. Select a plot on the map to begin analysis or ask me to draft a notice." }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (contextPlot) {
            setMessages(prev => [...prev, {
                role: 'ai',
                text: `Creating context for Plot ${contextPlot.plot_no}. Owner: ${contextPlot.owner}. Status: ${contextPlot.status}. How can I assist?`
            }]);
        }
    }, [contextPlot]);

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
                        {msg.role === 'ai' && <Bot size={16} style={{ marginRight: '8px', display: 'inline-block' }} />}
                        {msg.role === 'user' && <User size={16} style={{ marginRight: '8px', display: 'inline-block' }} />}
                        <span style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</span>
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
