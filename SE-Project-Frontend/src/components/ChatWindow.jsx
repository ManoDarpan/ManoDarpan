import React, { useRef, useEffect } from 'react';
import { FiSend, FiLogOut } from 'react-icons/fi';
import ConfirmPopup from './ConfirmPopup';

export default function ChatWindow({
  partnerName,
  isActive,
  messages,
  message,
  onMessageChange,
  onSendMessage,
  onKeyDown,
  textareaRef,
  messagesRef,
  userProfile,
  conversationId,
  showEndConfirm,
  setShowEndConfirm,
  endConversation,
  isCounsellor = false,
  sideOpen,
  setSideOpen
  ,
  partnerProfile = null
}) {
  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <main className="chat-main">
      {conversationId ? (
        <>
          <div className="chat-top card">
              <div className="chat-top-left">
              <img src={(partnerProfile && partnerProfile.profilePic) || (userProfile && userProfile.profilePic) || '/assets/male.svg'} alt="avatar" className="chat-avatar" />
              <div>
                {/* Prefer partnerName (remote participant), then partnerProfile name, then profile name */}
                <div className="chat-top-name">{partnerName || (partnerProfile && (partnerProfile.name || partnerProfile.username)) || (userProfile && (userProfile.name || userProfile.fullName)) || 'User'}</div>
                <div className="chat-top-sub">{isActive ? 'Connected' : 'Inactive'}</div>
              </div>
            </div>
            <div className="chat-top-right">
              <button className="chat-end-btn chat-end-top" onClick={() => setShowEndConfirm(true)} disabled={!conversationId || !isActive}><FiLogOut /> End Chat</button>
            </div>
            {showEndConfirm && (
              <ConfirmPopup
                message="Are you sure you want to end this conversation?"
                onConfirm={endConversation}
                onCancel={() => setShowEndConfirm(false)}
              />
            )}
          </div>

            <div className="chat-card">
              <div className="chat-messages" ref={messagesRef}>
                {messages.map((msg, i) => {
                  const fromMe = msg.senderType === (isCounsellor ? 'counsellor' : 'user') || msg.from === 'me' || msg.isFromMe;
                  const time = new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  return (
                    <div key={i} className={`chat-message ${fromMe ? 'from-me' : 'from-them'}`}>
                      <div className="chat-msg-text">{msg.text}</div>
                      <div className="chat-msg-meta">{time}</div>
                    </div>
                  );
                })}
              </div>

              <div className="chat-actions-row">
                <div className="chat-input-row">
                  <textarea
                    ref={textareaRef}
                    value={message}
                    onChange={onMessageChange}
                    onKeyDown={onKeyDown}
                    className="chat-input chat-textarea"
                    placeholder="Type a message... (Enter to send, Shift+Enter for newline)"
                    disabled={!isActive}
                  />
                  <div className="composer-controls">
                    <button className="chat-send-btn" onClick={onSendMessage} disabled={!isActive || message.trim().length === 0}><FiSend /></button>
                  </div>
                </div>
              </div>
            </div>
        </>
      ) : (
        <div className="chat-placeholder">
          <div className="chat-placeholder-card">
            {isCounsellor ? 'Accept an incoming request from the list to start chatting.' : 'Select a counsellor from the list to start chatting.'}
          </div>
        </div>
      )}
    </main>
  );
}
