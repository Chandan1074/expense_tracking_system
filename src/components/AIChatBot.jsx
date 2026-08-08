import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { supabase } from "../utils/supabaseClient";
import "./AIChatbot.css";

function AIChatbot() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [messages, setMessages] = useState([
    {
      sender: "ai",
      text: "👋 Hi! I'm your AI Financial Assistant. How can I help you today?",
      time: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    },
  ]);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  const sendMessage = async () => {
    if (!message.trim() || loading) return;

    const currentMessage = message;

    setMessages((prev) => [
      ...prev,
      {
        sender: "user",
        text: currentMessage,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      },
    ]);

    setMessage("");
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const res = await axios.post(
        "https://expense-tracking-system-r1bn-c0bb7wfws.vercel.app/api/ai/chat",
        {
          message: currentMessage,
          userId: user.id,
        }
      );

      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: res.data.reply,
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "❌ Something went wrong.",
          time: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-container">

      <div className="chat-header">
        <div className="chat-avatar"></div>

        <div className="chat-header-info">
          <div className="chat-header-name">
            AI Financial Assistant
          </div>

          <div className="chat-header-status">
            Powered by Gemini AI
          </div>
        </div>
      </div>

      <div className="messages">

        {messages.map((msg, index) => (
          <div
            key={index}
            className={`message-group ${msg.sender}`}
          >

            <div className={`message ${msg.sender}`}>
              {msg.text}
            </div>

            <div className="message-time">
              {msg.time}
            </div>

          </div>
        ))}

        {loading && (
          <div className="message-group ai">
            <div className="typing">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef}></div>

      </div>

      <div className="input-area">

        <div className="input-row">

          <input
            type="text"
            placeholder="Ask anything about your expenses..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                sendMessage();
              }
            }}
          />

          <button
            className="send-btn"
            onClick={sendMessage}
            disabled={loading || !message.trim()}
          >
            ➜
          </button>

        </div>

        <div className="input-hint">
          Press Enter to send
        </div>

      </div>

    </div>
  );
}

export default AIChatbot;