import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useLocation } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import './Chat.css';
import ConfirmPopup from '../components/ConfirmPopup';
import { FiSend, FiUserPlus, FiMenu } from "react-icons/fi";
import { HiChevronDown, HiChevronUp } from 'react-icons/hi';
import ChatWindow from '../components/ChatWindow';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Helper to fetch conversation metadata with retry logic for eventual consistency
const fetchConversationWithRetry = async (convId, token, retries = 3, delay = 500) => {
  for (let i = 0; i < retries; i++) {
    try {
      const resMeta = await fetch(`${API_URL}/api/chat/conversation/${convId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (resMeta.ok) {
        return await resMeta.json();
      }
      if (resMeta.status === 404) {
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        return null;
      }
    } catch (err) {
      return null;
    }
  }
  return null;
};

export default function ChatUser() {
  // Socket and chat message state
  const [socket, setSocket] = useState(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const messagesRef = useRef(null); // Ref for scrolling chat window
  const textareaRef = useRef(null); // Ref for chat input auto-resize

  // Counsellor and conversation list state
  const [counsellors, setCounsellors] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [requestSentFor, setRequestSentFor] = useState({}); // Tracks pending/active requests by counsellor ID
  const [anonymous, setAnonymous] = useState(false); // Toggle for anonymous chat request
  const convToCounsellorRef = useRef({}); // Map for lookup (conversation ID to counsellor ID)

  // Navigation, error, and active conversation state
  const location = useLocation();
  const [error, setError] = useState('');
  const [conversationId, setConversationId] = useState(null); // ID of the currently active conversation
  const [isActive, setIsActive] = useState(true); // Can user send messages (conversation status)
  const [storedConversationId, setStoredConversationId] = useState(null); // For initial UI check
  const [sideOpen, setSideOpen] = useState(false); // Sidebar visibility state
  const [partnerName, setPartnerName] = useState('Chat'); // Display name of the chat partner
  const [sendMenuOpen, setSendMenuOpen] = useState(false); // UI state (currently unused)
  const [sidebarTab, setSidebarTab] = useState('available'); // 'available' or 'conversations'
  const [searchQuery, setSearchQuery] = useState('');
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const prevConvRef = useRef(null); // Tracks previous conversationId for socket 'leave'
  const convIdRef = useRef(null); // Imperative ref to current conversationId for async handlers

  // Profile data state
  const [userProfile, setUserProfile] = useState({});
  const [partnerProfile, setPartnerProfile] = useState(null);

  // Effect 1: Load stored conversation on mount from localStorage
  useEffect(() => {
    const storedConvId = localStorage.getItem('activeConversationId');
    const storedConvCounsellorName = localStorage.getItem('activeConversationCounsellorName');
    if (storedConvId) {
      setConversationId(storedConvId);
      setPartnerName(storedConvCounsellorName || 'Counsellor');
      setIsActive(true);
    }
  }, []);

  // Effect 2: Save conversation to localStorage when state changes
  useEffect(() => {
    if (conversationId) {
      localStorage.setItem('activeConversationId', conversationId);
      localStorage.setItem('activeConversationCounsellorName', partnerName);
    } else {
      localStorage.removeItem('activeConversationId');
      localStorage.removeItem('activeConversationCounsellorName');
    }
  }, [conversationId, partnerName]);

  // Effect 3: Initial setup (Auth, User Profile, URL params)
  useEffect(() => {
    setError('');
    const token = localStorage.getItem('token');
  const urlConv = new URLSearchParams(location.search).get('conversationId');
  const urlTab = new URLSearchParams(location.search).get('tab');
  const storedConv = localStorage.getItem('activeConversationId');
  // keep track of stored conversation id for UI (do not overwrite stored value with url param)
  setStoredConversationId(storedConv);
  // prefer explicit url param, then any stored active conversation
  const convId = urlConv || storedConv || null;

    if (!token) {
      setError('No auth token found. Please login first.');
      return;
    }

    (async () => {
      try {
  const resUser = await fetch(`${API_URL}/api/users/profile`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (resUser.ok) {
          const { user } = await resUser.json();
          setUserProfile(user); // Set current user profile
        }
      } catch (err) {
        console.warn('Failed to fetch user profile', err);
      }
    })();

    if (!convId) {
      setConversationId(null);
      // if the URL explicitly asked to show the conversations list, set sidebarTab accordingly
      if (urlTab === 'conversations') {
        setSidebarTab('conversations');
      }
    }

  }, [location.search]);

  // Effect 4: Socket connection and listener setup
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    // Fetch available counsellors and past conversations
    const fetchLists = async () => {
      try {
        const [cRes, convRes] = await Promise.all([
          fetch(`${API_URL}/api/counsellors`),
          fetch(`${API_URL}/api/chat/conversations`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        if (cRes.ok) {
          const cdata = await cRes.json();
          setCounsellors(cdata.counsellors || cdata || []);
        }
        if (convRes.ok) {
          const j = await convRes.json();
          setConversations(j.conversations || []);
        }
      } catch (err) {
        console.warn('Failed to fetch lists', err);
      }
    };
    fetchLists();
    
  const s = io(API_URL, { auth: { token } });
  // Expose socket globally for external cleanup (e.g., logout from navbar)
  try { window.socket = s; } catch (e) { /* ignore */ }
  setSocket(s);

    // Socket Listeners:
    s.on('requestAccepted', (data) => {
      // Counsellor accepted: activate chat with received conversation ID
      if (data && data.conversationId) {
        toast.success('Counsellor accepted your request!');
        setConversationId(data.conversationId);
  localStorage.setItem('activeConversationId', data.conversationId);
        setIsActive(true);
        if (data.counsellor) {
          const cid = data.counsellor._id || data.counsellor.id || data.counsellor;
          setRequestSentFor(prev => ({ ...prev, [cid]: 'active' }));
          convToCounsellorRef.current[data.conversationId] = cid;
          setCounsellors(prev => prev.filter(c => c._id !== cid)); // Remove from available list if active
        }
      }
    });
    s.on('requestRejected', (data) => {
      // Counsellor rejected: clear pending request status
      if (data && data.requestId) {
        toast.error('Counsellor rejected your request.');
        setRequestSentFor(prev => {
          const copy = { ...prev };
          Object.keys(copy).forEach(k => { if (copy[k]) copy[k] = false; });
          return copy;
        });
      }
    });
    s.on('conversationEnded', (data) => {
      // Conversation ended by either party (user or counsellor)
      localStorage.removeItem('activeConversationId');
      localStorage.removeItem('activeConversationCounsellorName');
      if (data && data.conversationId) {
        const endedConv = String(data.conversationId);
        const mapped = convToCounsellorRef.current[endedConv];
        if (mapped) {
          setRequestSentFor(prev => ({ ...prev, [mapped]: false }));
          delete convToCounsellorRef.current[endedConv];
        }
        // Re-fetch conversations list to show ended status
        (async () => {
          try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_URL}/api/chat/conversations`, { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) {
              const json = await res.json();
              setConversations(json.conversations || []);
            }
          } catch (e) { }
        })();

        // Check if the ended conversation is the one currently open
        const current = convIdRef.current ? String(convIdRef.current) : null;
        if (current && current === endedConv) {
          setIsActive(false);
          localStorage.removeItem('activeConversationId');
          try { const whoName = data.endedByName || (data.endedBy === 'counsellor' ? 'Counsellor' : 'User'); toast(`${whoName} ended the conversation`); } catch(e) { }
          setConversationId(null);
        }
      }
    });
    s.on('counsellorStatus', (payload) => {
      // Counsellor status changed: re-fetch the list to update online/offline status
      (async () => {
        try {
          const res = await fetch(`${API_URL}/api/counsellors`);
          if (res.ok) {
            const d = await res.json();
            setCounsellors(d.counsellors || d || []);
          }
        } catch (e) { }
      })();
    });
    s.on('newMessage', (data) => setMessages(prev => [...prev, data])); // Append new messages in real-time
    s.on('error', (err) => console.warn('socket error', err));

    return () => {
      s.disconnect(); // Cleanup on component unmount
    };
  }, []);

  // Effect 5: Conversation change handler (join/leave rooms, fetch history)
  useEffect(() => {
    if (!socket) return;
    const token = localStorage.getItem('token');

    const prev = prevConvRef.current;
    if (prev && prev !== conversationId) {
      // Leave the old conversation room
      try { socket.emit('leaveConversation', { conversationId: prev }); } catch (e) { /* ignore */ }
    }

    if (conversationId) {
      socket.emit('joinConversation', { conversationId }); // Join the new conversation room
      (async () => {
        const data = await fetchConversationWithRetry(conversationId, token); // Fetch conversation metadata
        if (data && data.conversation) {
          const { conversation } = data;
          setConversationId(conversationId);
          const cname = conversation.counsellor?.name || conversation.counsellor?.username || 'Counsellor';
          setPartnerName(cname);
          setPartnerProfile(conversation.counsellor || null);
          setIsActive(!!conversation.isActive);

          // Fetch message history for the conversation
          const resMsgs = await fetch(`${API_URL}/api/chat/${conversationId}/messages`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (resMsgs.ok) {
            const msgs = await resMsgs.json();
            setMessages(msgs || []);
          }
        } else {
          // If fetch fails, clear the local conversation state
          localStorage.removeItem('activeConversationId');
          setConversationId(null);
        }
      })();
    } else {
      // No conversation selected: clear messages
      setMessages([]);
      setIsActive(true);
    }

    prevConvRef.current = conversationId;
    convIdRef.current = conversationId;
  }, [conversationId, socket]);

  // Function to poll for the newly created conversation after sending a request
  const pollForConversation = (targetCounsellorId) => {
    let attempts = 0;
    const token = localStorage.getItem('token');
    const iv = setInterval(async () => {
      attempts += 1;
      try {
  const res = await fetch(`${API_URL}/api/chat/conversations`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const j = await res.json();
          // Check if a conversation exists with the requested counsellor
          const conv = (j.conversations || []).find(c => c.counsellor && (c.counsellor._id === targetCounsellorId || c.counsellor === targetCounsellorId));
          if (conv) {
            clearInterval(iv);
            setConversationId(conv._id);
            localStorage.setItem('activeConversationId', conv._id);
          }
        }
      } catch (err) { console.warn('poll error', err) }
      if (attempts > 30) clearInterval(iv);
    }, 2000);
    return () => clearInterval(iv);
  };

  // Function to send a request to a counsellor
  const requestCounsellor = async (cId, anon = false) => {
    if (conversationId) {
      setError('You already have an active conversation. Finish it before sending another request.');
      return;
    }
    const token = localStorage.getItem('token');
    try {
  const res = await fetch(`${API_URL}/api/requests/create`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ counsellorId: cId, anonymous: !!anon })
      });
      if (res.ok) {
        setRequestSentFor(prev => ({ ...prev, [cId]: true })); // Set status to 'request sent'
        pollForConversation(cId); // Start polling for conversation creation
      } else {
        const j = await res.json();
        setError(j.message || 'Failed to send request');
      }
    } catch (err) {
      console.error('request failed', err);
      setError('Failed to send request');
    }
  };

  // Effect 6: Scroll to bottom of chat window when messages update
  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages]);

  // Function to send a message via Socket.IO
  const sendMessage = () => {
    if (!conversationId) {
      setError('No conversation selected.');
      return;
    }
    if (!isActive) {
      setError('This conversation is inactive — sending messages is disabled.');
      return;
    }
    if (!socket || !socket.connected) {
      setError('Not connected to server. Please wait a moment and try again.');
      return;
    }
    if (message.trim() !== '') {
      socket.emit('sendMessage', { conversationId, text: message }, (resp) => {
        if (resp && resp.ok) {
          setMessage('');
          setError('');
          if (textareaRef.current) textareaRef.current.style.height = 'auto'; // Reset textarea height
        } else if (resp && resp.error) {
          const raw = resp.error;
          if (raw.toLowerCase().includes('inactive') || raw.toLowerCase().includes('expired')) {
            setError("You can't send messages right now.");
            setIsActive(false);
          } else {
            setError(raw);
          }
        } else {
          setError('Failed to send message');
        }
      });
    }
  };

  // Handler for 'Enter' key press (sends message if Shift is not held)
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Handler for input change and auto-resizing the textarea
  const handleChange = (e) => {
    setMessage(e.target.value);
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 300) + 'px';
  };

  // Function to end the active conversation
  const endConversation = async () => {
    try {
      const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}/api/chat/end`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ conversationId }) });
      if (res.ok) {
        setIsActive(false);
        try { if (socket) socket.emit('leaveConversation', { conversationId }); } catch (e) { }
  localStorage.removeItem('activeConversationId');
        setConversationId(null);
      }
    } catch (e) { console.warn('end chat failed', e) }
    setShowEndConfirm(false);
  };

  const isChatActive = conversationId !== null;

  const activeStored = storedConversationId;

  return (
    <>
      <div className={`chat-container chat-layout ${conversationId ? 'chat-active' : ''}`}>
        <Toaster />
        <aside className={`chat-lists ${isChatActive ? 'collapsed' : ''} ${sideOpen ? 'open' : ''}`}>
          <div className="drawer-header">
            <div className="tabs">
              <button className={`tab ${sidebarTab === 'available' ? 'active' : ''}`} onClick={() => setSidebarTab('available')}>Available</button>
              <button className={`tab ${sidebarTab === 'conversations' ? 'active' : ''}`} onClick={() => setSidebarTab('conversations')}>Conversations</button>
            </div>
            {isChatActive && <button className="drawer-close" onClick={() => setSideOpen(false)} aria-label="Close list">✕</button>}
          </div>

          <div className="side-search">
            <input placeholder={sidebarTab === 'available' ? 'Search counsellors...' : 'Search conversations...'} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>

          {sidebarTab === 'available' && (
            <div className="side-section">
              <div className="available-header" style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
                <h4 style={{margin:0}}>Available Counsellors</h4>
              </div>
              <div id="available-list">
                <div style={{marginTop:'8px', marginBottom:'10px'}}>
                  <label className="anon-label side-anon pill-toggle">
                    <input id="anonToggle" type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} aria-label="Stay anonymous" />
                    <span className="pill-toggle-switch" aria-hidden="true"> Anonymous</span>
                    {/* <span className="anon-label-text"> </span> */}
                  </label>
                </div>
                <div className="conversations-list counsellors-list">
                  {counsellors
                    .filter(c => (c.isOnline === undefined || c.isOnline) ) // Filter for online counsellors
                    .filter(c => (c.name || c.username || '').toLowerCase().includes(searchQuery.toLowerCase())) // Filter by search query
                    .map((c) => (
                    <div key={c._id || c.id} className={`conv-item ${activeStored && convToCounsellorRef.current && convToCounsellorRef.current[activeStored] === c._id ? 'active-stored' : ''}`}>
                      <div className="avatar-wrap">
                        <img className="item-avatar" src={c.profilePic || '/assets/male.svg'} alt="counsellor avatar" />
                        {c.isOnline && <span className="online-badge" aria-hidden="true" />}
                      </div>
                      <div className="item-body">
                        <div className="item-title">{c.name || c.username || 'Counsellor'}</div>
                        <div className="item-sub">{c.areaOfExpertise || ''}</div>
                      </div>
                      <div className="item-actions">
                        {requestSentFor[c._id] === 'active' ? (
                          <div className="active-badge">Active</div>
                        ) : requestSentFor[c._id] ? (
                          <div className="request-sent">Request sent</div>
                        ) : (
                          <button onClick={() => { requestCounsellor(c._id, anonymous); setSideOpen(false); }} className="chat-request-btn"><FiUserPlus /></button> // Send chat request
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {sidebarTab === 'conversations' && (
            <div className="side-section">
              <div style={{display:'flex', alignItems:'center', justifyContent:'space-between'}}>
                <h4 style={{margin:0}}>Your Conversations</h4>
              </div>
              <div id="conversations-list" style={{marginTop:'8px'}}>
                <div className="conversations-list">
                  {conversations.filter(cv => (cv.counsellor?.name || cv.counsellor?.username || '').toLowerCase().includes(searchQuery.toLowerCase())).map((cv) => (
                    <div key={cv._id} className={`conv-item ${cv.isActive ? 'active-conv' : ''}`} onClick={() => { setConversationId(cv._id); localStorage.setItem('activeConversationId', cv._id); setSideOpen(false); }}>
                      <img className="item-avatar" src={cv.counsellor?.profilePic || '/assets/male.svg'} alt="counsellor avatar" />
                      <div className="item-body">
                        <div className="item-title">{cv.counsellor?.name || cv.counsellor?.username || 'Counsellor'}</div>
                        <div className="item-sub">{cv.isActive ? 'Active' : 'Inactive'}</div>
                      </div>
                      <div className="item-time">{new Date(cv.createdAt).toLocaleString(navigator.language, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </aside>
        {/* The main chat interface component */}
        <ChatWindow
          partnerName={partnerName}
          isActive={isActive}
          messages={messages}
          message={message}
          onMessageChange={handleChange}
          onSendMessage={sendMessage}
          onKeyDown={handleKeyDown}
          textareaRef={textareaRef}
          messagesRef={messagesRef}
          userProfile={userProfile}
          partnerProfile={partnerProfile}
          conversationId={conversationId}
          showEndConfirm={showEndConfirm}
          setShowEndConfirm={setShowEndConfirm}
          endConversation={endConversation}
          isCounsellor={false} // Identity prop: This is the user/client view
          sideOpen={sideOpen}
          setSideOpen={setSideOpen}
        />
      </div>
      {/* Overlay for closing the sidebar on mobile/small screens */}
      <div className={`side-overlay ${sideOpen ? 'visible' : ''}`} onClick={() => setSideOpen(false)} />
    </>
  );
}
