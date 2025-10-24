import React, { useEffect, useState, useRef } from 'react';
import { FiCheck, FiX, FiSend, FiLogOut } from 'react-icons/fi';
import { HiChevronDown, HiChevronUp ,  } from 'react-icons/hi';
import {CiSearch} from 'react-icons/ci';
import { io } from 'socket.io-client';
import { useLocation } from 'react-router-dom';
import './Chat.css';
import toast, { Toaster } from 'react-hot-toast';
import ConfirmPopup from '../components/ConfirmPopup';
import ChatWindow from '../components/ChatWindow';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';


export default function ChatCounsellor() {
  const [socket, setSocket] = useState(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const messagesRef = useRef(null);
  const textareaRef = useRef(null);
  const location = useLocation();
  const [error, setError] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const [isActive, setIsActive] = useState(true);
  const [storedConversationId, setStoredConversationId] = useState(null);
  // counsellor UI doesn't use sliding side drawer; lists are always visible on mobile
  const [partnerName, setPartnerName] = useState('Counsellor');
  const [pendingRequests, setPendingRequests] = useState([]);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [activeRequestId, setActiveRequestId] = useState(null);
  // counsellor does not show conversation list; only incoming requests
  const [acceptingRequestId, setAcceptingRequestId] = useState(null);
  const [acceptMessage, setAcceptMessage] = useState('');
  const prevConvRef = useRef(null);
  const convIdRef = useRef(null);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userProfile, setUserProfile] = useState({});

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const fetchPendingRequests = async () => {
      try {
        setPendingLoading(true);
        const res = await fetch(`${API_URL}/api/requests/pending`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setPendingRequests(data.requests || []);
        }
      } catch (error) {
        console.error('Failed to fetch pending requests', error);
      } finally {
        setPendingLoading(false);
      }
    };

    fetchPendingRequests();
  }, []);

  // initialize socket once (persistent) and listeners
  useEffect(() => {
    setError('');
    const token = localStorage.getItem('token');
    if (!token) {
      setError('No auth token found. Please login first.');
      setPendingLoading(false);
      return;
    }

    // capture stored conv id but do not auto-open it; only open if url provides conversationId
    const urlConv = new URLSearchParams(location.search).get('conversationId');
    const storedConv = localStorage.getItem('conversationId');
    setStoredConversationId(storedConv);
    if (urlConv) {
      setConversationId(urlConv);
      localStorage.setItem('conversationId', urlConv);
    }

  const s = io(API_URL, { auth: { token } });
    setSocket(s);

    s.on('connect', () => {
      console.log('Counsellor connected');
    });

    s.on('joined', () => console.log('Joined conversation'));

    s.on('newMessage', (data) => {
      setMessages((prev) => [...prev, data]);
    });

    s.on('newRequest', (payload) => {
      if (payload && payload.request) setPendingRequests(prev => [payload.request, ...prev]);
    });

    s.on('requestAccepted', (payload) => {
      if (payload && payload.conversationId) {
        setConversationId(payload.conversationId);
        localStorage.setItem('conversationId', payload.conversationId);
        setPendingRequests(prev => prev.filter(r => r._id !== payload.requestId));
      }
    });

    s.on('requestRejected', (payload) => {
      if (payload && payload.requestId) setPendingRequests(prev => prev.filter(r => r._id !== payload.requestId));
    });

    s.on('conversationEnded', (payload) => {
      console.debug('[socket] conversationEnded received (counsellor):', { payload, currentConversationId: conversationId, partnerName, socketId: s.id });
      if (payload && payload.conversationId) {
        const endedConv = payload.conversationId;
        // refresh pending requests list
        (async () => {
          try {
            const token = localStorage.getItem('token');
            const reqRes = await fetch(`${API_URL}/api/requests/pending`, { headers: { Authorization: `Bearer ${token}` } });
            if (reqRes && reqRes.ok) {
              const rjson = await reqRes.json();
              setPendingRequests(rjson.requests || []);
            }
          } catch (e) { console.warn('Refresh after conversationEnded failed', e); }
        })();

        try {
          const current = convIdRef.current ? String(convIdRef.current) : null;
          const endedStr = endedConv ? String(endedConv) : null;
          if (current && endedStr && current === endedStr) {
            setIsActive(false);
            localStorage.removeItem('conversationId');
            try { const whoName = payload.endedByName || (payload.endedBy === 'counsellor' ? 'Counsellor' : 'User'); toast(`${whoName} ended the conversation`); } catch (e) { }
            setConversationId(null);
          } else {
            const endedName = payload && payload.endedByName ? String(payload.endedByName).trim() : null;
            if (endedName && partnerName && String(partnerName).trim() === endedName) {
              setIsActive(false);
              localStorage.removeItem('conversationId');
              try { toast(`${endedName} ended the conversation`); } catch (e) { }
              setConversationId(null);
            }
          }
        } catch (e) { /* ignore */ }
      }
    });

    s.on('counsellorStatus', (payload) => {
      console.log('counsellorStatus', payload);
    });

    s.on('error', (err) => {
      console.error('Socket Error:', err);
      const raw = typeof err === 'string' ? err : (err && err.message ? err.message : 'Socket error');
      if (raw.toLowerCase().includes('inactive') || raw.toLowerCase().includes('expired')) {
        setError("You can't send messages right now.");
        setIsActive(false);
      } else {
        setError(raw);
      }
    });

    return () => {
      s.off('newMessage');
      s.off('newRequest');
      s.off('requestAccepted');
      s.off('requestRejected');
      s.off('conversationEnded');
      s.off('joined');
      s.off('connect');
      s.disconnect();
    };
    // intentionally run once on mount
  }, [location.search]);

  // join/leave conversation rooms and fetch messages/metadata when conversationId changes
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!socket) return;

    const prev = prevConvRef.current;
    if (prev && prev !== conversationId) {
      try { socket.emit('leaveConversation', { conversationId: prev }); } catch (e) { /* ignore */ }
    }

    if (conversationId) {
      socket.emit('joinConversation', { conversationId });
      // fetch metadata & messages
      (async () => {
        try {
          const resMeta = await fetch(`${API_URL}/api/chat/conversation/${conversationId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (resMeta.ok) {
            const { conversation } = await resMeta.json();
            if (conversation.isActive === false) {
              setError('This conversation is inactive; sending is disabled.');
              setIsActive(false);
            } else {
              setIsActive(true);
            }
            // set partner name from conversation metadata (prefer name over username/email)
            if (conversation) {
              const uname = conversation.user && (conversation.user.name || conversation.user.username || conversation.user.email);
              setPartnerName(conversation.isAnonymous ? 'Anonymous' : (uname || 'User'));
              setUserProfile(conversation.counsellor);
              // if conversation maps to a request id or user id, mark corresponding pending request as active
              // server may include originalRequestId in conversation metadata; try that first
              if (conversation.requestId) {
                setActiveRequestId(conversation.requestId);
                setPendingRequests(prev => {
                  // mark the request active and move to top
                  const updated = prev.map(r => ({ ...r, _isActiveReq: r._id === conversation.requestId }));
                  updated.sort((a, b) => (b._isActiveReq === true) - (a._isActiveReq === true));
                  return updated;
                });
              } else if (conversation.user && conversation.user._id) {
                // fallback: mark pending request whose user matches
                setPendingRequests(prev => {
                  const updated = prev.map(r => ({ ...r, _isActiveReq: (r.user && r.user._id) === conversation.user._id }));
                  updated.sort((a, b) => (b._isActiveReq === true) - (a._isActiveReq === true));
                  const found = updated.find(r => r._isActiveReq);
                  if (found) setActiveRequestId(found._id);
                  return updated;
                });
              }
            }
          }
        } catch (err) {
          console.error('Error fetching conversation metadata', err);
        }
      })();

      (async () => {
        try {
          const resMsgs = await fetch(`${API_URL}/api/chat/${conversationId}/messages`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (resMsgs.ok) {
            const msgs = await resMsgs.json();
            setMessages(msgs || []);
          }
        } catch (err) {
          console.error('Error fetching stored messages', err);
        }
      })();
    } else {
      // clear messages and inactive state when no conversation selected
      setMessages([]);
      setIsActive(true);
    }

    prevConvRef.current = conversationId;
    convIdRef.current = conversationId;
  }, [conversationId, socket]);

  // keep messages scrolled to bottom
  useEffect(() => {
    if (messagesRef.current) messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
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
    if (message.trim() !== '') {
      if (!socket) { setError('Socket not connected'); return; }
      socket.emit('sendMessage', { conversationId, text: message }, (resp) => {
        if (resp && resp.ok) {
          setMessage('');
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


  return (
    <>
  {/* <Navbar /> */}
  <div className={`chat-container chat-layout ${conversationId ? 'chat-active' : ''}`}>
        <Toaster />
    {/* On mobile, hide the aside when a conversation is open to avoid duplicated request list */}
    <aside className={`chat-side drawer open ${conversationId ? 'hide-on-mobile' : ''}`}>

          <div className="side-search" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h4 style={{ margin: 0 }}><pre>  Incoming Requests</pre></h4>
          </div>
          <div id="requests-list" style={{ marginTop: 0 , borderRadius: 0 }} className="side-search">
            <input placeholder={'Search requests...'} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>

          <div className="side-section">
            <div className="conversations-list requests-list">
              {pendingRequests.length === 0 && <div className="empty-requests">No pending requests</div>}
              {pendingRequests.filter(r => ((r.user?.name || r.user?.username || 'anonymous')).toLowerCase().includes(searchQuery.toLowerCase())).map((r) => (
                <div className={`conv-item ${r._isActiveReq ? 'active-conv' : ''}`} key={r._id}>
                  <img className="item-avatar" src={r.user?.profilePic || '/assets/male.svg'} alt="requester avatar" />
                  <div className="item-body">
                    <div className="item-title">{r.anonymous ? 'Anonymous' : (r.user && (r.user.name || r.user.username)) || 'User'}</div>
                    <div className="item-sub">{r._isActiveReq ? 'Active' : `Requested ${new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}</div>
                  </div>
                  <div className="item-actions">
                    <button className="accept-btn" disabled={!!conversationId || acceptingRequestId === r._id} onClick={async () => {
                      if (conversationId) { toast.error('Finish the active conversation before accepting new requests'); return; }
                      try {
                        setAcceptingRequestId(r._id);
                        const token = localStorage.getItem('token');
                        const res = await fetch(`${API_URL}/api/requests/accept/${r._id}`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
                        });
                        if (res.ok) {
                          const data = await res.json();
                          const convId = data.conversationId;
                          setConversationId(convId);
                          setPartnerName(r.anonymous ? 'Anonymous' : (r.user && (r.user.name || r.user.username)) || 'User');
                          localStorage.setItem('conversationId', convId);
                          // remove from pending list
                          setPendingRequests((prev) => prev.filter(x => x._id !== r._id));
                        } else {
                          const err = await res.json().catch(() => ({}));
                          console.warn('Accept failed', err);
                          // surface server message
                          if (err && err.message) toast.error(err.message);
                        }
                      } catch (err) {
                        console.error('Accept error', err);
                      } finally {
                        setAcceptingRequestId(null);
                      }
                    }}>{acceptingRequestId === r._id ? 'Accepting...' : <FiCheck color='green' fontSize='1.2rem' />}</button>
                    <button className="reject-btn" onClick={async () => {
                      try {
                        const token = localStorage.getItem('token');
                        const res = await fetch(`${API_URL}/api/requests/reject/${r._id}`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
                        if (res.ok) {
                          setPendingRequests(prev => prev.filter(x => x._id !== r._id));
                        } else {
                          // fallback
                          setPendingRequests(prev => prev.filter(x => x._id !== r._id));
                        }
                      } catch (err) {
                        console.error('Reject error', err);
                        setPendingRequests(prev => prev.filter(x => x._id !== r._id));
                      }
                    }}><FiX color='red' fontSize='1.2rem' fontWeight='1200' /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
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
          conversationId={conversationId}
          showEndConfirm={showEndConfirm}
          setShowEndConfirm={setShowEndConfirm}
          endConversation={endConversation}
          isCounsellor={true}
        />
      </div>
    </>
  );
}