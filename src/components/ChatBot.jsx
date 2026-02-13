import React, { useState } from 'react';
import axios from 'axios';
import { Send, Bot, User } from 'lucide-react';

const ChatBot = ({ selectedPlot }) => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Hello! I am your AI Land Assistant. Click a plot or ask me about encroachment laws.' }
  ]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = input;
    setInput("");
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);

    // Build context string
    const context = selectedPlot
      ? `Selected Plot: ${selectedPlot.plot_no}, Owner: ${selectedPlot.owner}, Status: ${selectedPlot.status}`
      : "No plot selected.";

    try {
      const res = await axios.post('http://localhost:8000/api/chat', {
        message: userMsg,
        context: context
      });
      setMessages(prev => [...prev, { role: 'ai', text: res.data.reply }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', text: "Error connecting to AI server." }]);
    }
    setLoading(false);
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-800 rounded-lg overflow-hidden border border-slate-700 mt-2">
      <div className="bg-slate-700 p-3 font-bold flex items-center gap-2">
        <Bot size={20} /> AI Assistant
      </div>

      <div className="flex-1 p-3 overflow-y-auto space-y-3" style={{ maxHeight: '300px' }}>
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-2 rounded-lg text-sm ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-600 text-gray-200'
              }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {loading && <div className="text-gray-400 text-xs italic ml-2">Thinking...</div>}
      </div>

      <div className="p-2 bg-slate-700 flex gap-2">
        <input
          className="flex-1 bg-slate-600 text-white px-3 py-1 rounded outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
        />
        <button
          onClick={sendMessage}
          className="bg-blue-600 p-2 rounded hover:bg-blue-700 transition"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};

export default ChatBot;