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
  const [socket, setSocket] = useState(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const messagesRef = useRef(null);
  const textareaRef = useRef(null);
  const [counsellors, setCounsellors] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [requestSentFor, setRequestSentFor] = useState({});
  const [anonymous, setAnonymous] = useState(false);
  const convToCounsellorRef = useRef({});
  const location = useLocation();
  const [error, setError] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const [isActive, setIsActive] = useState(true);
  const [storedConversationId, setStoredConversationId] = useState(null);
  const [sideOpen, setSideOpen] = useState(false);
  const [partnerName, setPartnerName] = useState('Chat');
  const [sendMenuOpen, setSendMenuOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState('available');
  const [searchQuery, setSearchQuery] = useState('');
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const prevConvRef = useRef(null);
  const convIdRef = useRef(null);

  const [userProfile, setUserProfile] = useState({});
  const [partnerProfile, setPartnerProfile] = useState(null);

  useEffect(() => {
    setError('');
    const token = localStorage.getItem('token');
    const urlConv = new URLSearchParams(location.search).get('conversationId');
    const urlTab = new URLSearchParams(location.search).get('tab');
    const storedConv = localStorage.getItem('conversationId');
    setStoredConversationId(storedConv);
    const convId = urlConv || null;

    if (!token) {
      setError('No auth token found. Please login first.');
      return;
    }

    (async () => {
      try {
  const resUser = await fetch(`${API_URL}/api/users/profile`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (resUser.ok) {
          const { user } = await resUser.json();
          setUserProfile(user);
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

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

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
    setSocket(s);

    s.on('requestAccepted', (data) => {
      console.debug('[socket] requestAccepted (user):', data);
      if (data && data.conversationId) {
        toast.success('Counsellor accepted your request!');
        setConversationId(data.conversationId);
        localStorage.setItem('conversationId', data.conversationId);
        // optimistically allow sending until server metadata confirms
        setIsActive(true);
        if (data.counsellor) {
          const cid = data.counsellor._id || data.counsellor.id || data.counsellor;
          setRequestSentFor(prev => ({ ...prev, [cid]: 'active' }));
          convToCounsellorRef.current[data.conversationId] = cid;
          setCounsellors(prev => prev.filter(c => c._id !== cid));
        }
      }
    });
    s.on('requestRejected', (data) => {
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
      console.debug('[socket] conversationEnded received (user):', { data, currentConversationId: conversationId, partnerName, socketId: s.id });
      if (data && data.conversationId) {
        const endedConv = String(data.conversationId);
        const mapped = convToCounsellorRef.current[endedConv];
        if (mapped) {
          setRequestSentFor(prev => ({ ...prev, [mapped]: false }));
          delete convToCounsellorRef.current[endedConv];
        }
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

        // avoid react "setState during render" by reading ref and updating state imperatively
        const current = convIdRef.current ? String(convIdRef.current) : null;
        if (current && current === endedConv) {
          setIsActive(false);
          localStorage.removeItem('conversationId');
          try { const whoName = data.endedByName || (data.endedBy === 'counsellor' ? 'Counsellor' : 'User'); toast(`${whoName} ended the conversation`); } catch(e) { }
          setConversationId(null);
        }
      }
    });
    s.on('counsellorStatus', (payload) => {
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
    s.on('newMessage', (data) => setMessages(prev => [...prev, data]));
    s.on('error', (err) => console.warn('socket error', err));

    return () => {
      s.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!socket) return;
    const token = localStorage.getItem('token');

    const prev = prevConvRef.current;
    if (prev && prev !== conversationId) {
      try { socket.emit('leaveConversation', { conversationId: prev }); } catch (e) { /* ignore */ }
    }

    if (conversationId) {
      socket.emit('joinConversation', { conversationId });
      (async () => {
        const data = await fetchConversationWithRetry(conversationId, token);
        if (data && data.conversation) {
          const { conversation } = data;
          setConversationId(conversationId);
          const cname = conversation.counsellor?.name || conversation.counsellor?.username || 'Counsellor';
          // For the user view, always show the counsellor's name and profile even if the user requested anonymity
          setPartnerName(cname);
          setPartnerProfile(conversation.counsellor || null);
          setIsActive(!!conversation.isActive);

          const resMsgs = await fetch(`${API_URL}/api/chat/${conversationId}/messages`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (resMsgs.ok) {
            const msgs = await resMsgs.json();
            setMessages(msgs || []);
          }
        } else {
          localStorage.removeItem('conversationId');
          setConversationId(null);
        }
      })();
    } else {
      setMessages([]);
      setIsActive(true);
    }

    prevConvRef.current = conversationId;
    convIdRef.current = conversationId;
  }, [conversationId, socket]);

  const pollForConversation = (targetCounsellorId) => {
    let attempts = 0;
    const token = localStorage.getItem('token');
    const iv = setInterval(async () => {
      attempts += 1;
      try {
  const res = await fetch(`${API_URL}/api/chat/conversations`, { headers: { Authorization: `Bearer ${token}` } });
        if (res.ok) {
          const j = await res.json();
          const conv = (j.conversations || []).find(c => c.counsellor && (c.counsellor._id === targetCounsellorId || c.counsellor === targetCounsellorId));
          if (conv) {
            clearInterval(iv);
            setConversationId(conv._id);
            localStorage.setItem('conversationId', conv._id);
          }
        }
      } catch (err) { console.warn('poll error', err) }
      if (attempts > 30) clearInterval(iv);
    }, 2000);
    return () => clearInterval(iv);
  };

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
        setRequestSentFor(prev => ({ ...prev, [cId]: true }));
        pollForConversation(cId);
      } else {
        const j = await res.json();
        setError(j.message || 'Failed to send request');
      }
    } catch (err) {
      console.error('request failed', err);
      setError('Failed to send request');
    }
  };

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages]);

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
          if (textareaRef.current) textareaRef.current.style.height = 'auto';
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

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleChange = (e) => {
    setMessage(e.target.value);
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 300) + 'px';
  };

  const endConversation = async () => {
    try {
      const token = localStorage.getItem('token');
  const res = await fetch(`${API_URL}/api/chat/end`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ conversationId }) });
      if (res.ok) {
        setIsActive(false);
        try { if (socket) socket.emit('leaveConversation', { conversationId }); } catch (e) { }
        localStorage.removeItem('conversationId');
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
                  {counsellors.filter(c => (c.name || c.username || '').toLowerCase().includes(searchQuery.toLowerCase())).map((c) => (
                    <div key={c._id || c.id} className={`conv-item ${activeStored && convToCounsellorRef.current && convToCounsellorRef.current[activeStored] === c._id ? 'active-stored' : ''}`}>
                      <img className="item-avatar" src={c.avatar || '/assets/male.svg'} alt="counsellor avatar" />
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
                          <button onClick={() => { requestCounsellor(c._id, anonymous); setSideOpen(false); }} className="chat-request-btn"><FiUserPlus /></button>
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
                    <div key={cv._id} className={`conv-item ${cv.isActive ? 'active-conv' : ''}`} onClick={() => { setConversationId(cv._id); localStorage.setItem('conversationId', cv._id); setSideOpen(false); }}>
                      <img className="item-avatar" src={cv.counsellor?.avatar || '/assets/male.svg'} alt="counsellor avatar" />
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
          isCounsellor={false}
          sideOpen={sideOpen}
          setSideOpen={setSideOpen}
        />
      </div>
      <div className={`side-overlay ${sideOpen ? 'visible' : ''}`} onClick={() => setSideOpen(false)} />
    </>
  );
}