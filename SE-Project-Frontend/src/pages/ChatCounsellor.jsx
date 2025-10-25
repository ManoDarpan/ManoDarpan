import React, { useEffect, useState, useRef } from 'react';
import { FiCheck, FiX, FiSend, FiLogOut } from 'react-icons/fi'; // Icons for check, cross, send, logout
import { HiChevronDown, HiChevronUp ,  } from 'react-icons/hi'; // Icons for chevron up/down
import {CiSearch} from 'react-icons/ci'; // Search icon
import { io } from 'socket.io-client'; // Socket.IO client for real-time communication
import { useLocation } from 'react-router-dom'; // Hook to get current URL location
import './Chat.css'; // Component-specific styling
import toast, { Toaster } from 'react-hot-toast'; // Library for notifications/toasts
import ConfirmPopup from '../components/ConfirmPopup'; // Component for confirmation dialogs
import ChatWindow from '../components/ChatWindow'; // Reusable chat window component
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'; // Backend API URL

export default function ChatCounsellor() {
  const [socket, setSocket] = useState(null); // Socket.IO instance state
  const [message, setMessage] = useState(''); // Current message text input state
  const [messages, setMessages] = useState([]); // List of messages in the current conversation
  const messagesRef = useRef(null); // Ref for the messages container for scrolling
  const textareaRef = useRef(null); // Ref for the message input textarea
  const location = useLocation(); // Current URL location object
  const [error, setError] = useState(''); // General error message state
  const [conversationId, setConversationId] = useState(null); // ID of the currently active conversation
  const [isActive, setIsActive] = useState(true); // Flag if the current conversation is active
  const [storedConversationId, setStoredConversationId] = useState(null); // Stored conversation ID from local storage
  // partnerName is the user's name/alias
  const [partnerName, setPartnerName] = useState('Counsellor'); // Name of the person the counsellor is talking to
  const [pendingRequests, setPendingRequests] = useState([]); // List of incoming chat requests
  const [pendingLoading, setPendingLoading] = useState(true); // Loading state for pending requests fetch
  const [activeRequestId, setActiveRequestId] = useState(null); // ID of the request corresponding to the active conversation
  // counsellor does not show conversation list; only incoming requests
  const [acceptingRequestId, setAcceptingRequestId] = useState(null); // ID of the request currently being accepted (to disable buttons)
  const [acceptMessage, setAcceptMessage] = useState(''); // Unused state (placeholder)
  const prevConvRef = useRef(null); // Ref to store the previous conversationId
  const convIdRef = useRef(null); // Ref to store the current conversationId for use in socket listeners
  const [showEndConfirm, setShowEndConfirm] = useState(false); // State to show/hide end conversation confirmation popup
  const [searchQuery, setSearchQuery] = useState(''); // State for searching incoming requests
  const [userProfile, setUserProfile] = useState({}); // Profile data of the currently chatting user

  // Load stored conversation on mount
  useEffect(() => {
    const storedConvId = localStorage.getItem('activeConversationId');
    const storedConvUserName = localStorage.getItem('activeConversationUserName');
    if (storedConvId) {
      setConversationId(storedConvId);
      setPartnerName(storedConvUserName || 'User');
      setIsActive(true);
    }
  }, []);

  // Save conversation to localStorage when it changes
  useEffect(() => {
    if (conversationId) {
      localStorage.setItem('activeConversationId', conversationId);
      localStorage.setItem('activeConversationUserName', partnerName);
    } else {
      localStorage.removeItem('activeConversationId');
      localStorage.removeItem('activeConversationUserName');
    }
  }, [conversationId, partnerName]);

  // Fetch initial pending requests list on mount
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
          setPendingRequests(data.requests || []); // Update pending requests list
        }
      } catch (error) {
        console.error('Failed to fetch pending requests', error);
      } finally {
        setPendingLoading(false); // Finish loading
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

    // Check for conversation ID in URL and local storage
    const urlConv = new URLSearchParams(location.search).get('conversationId');
    const storedConv = localStorage.getItem('activeConversationId');
    setStoredConversationId(storedConv);
    if (urlConv) {
      setConversationId(urlConv);
  localStorage.setItem('activeConversationId', urlConv);
    }

    // Connect to Socket.IO server with authentication
    const s = io(API_URL, { auth: { token } });
    // Expose socket globally for external use (e.g., setting counsellor offline status on logout)
    try { window.socket = s; } catch (e) { /* ignore */ }
    setSocket(s);

    s.on('connect', () => {
      console.log('Counsellor connected'); // Socket connected
    });

    s.on('joined', () => console.log('Joined conversation')); // Confirmed joining conversation room

    s.on('newMessage', (data) => {
      setMessages((prev) => [...prev, data]); // Add new incoming message
    });

    s.on('newRequest', (payload) => {
      if (payload && payload.request) setPendingRequests(prev => [payload.request, ...prev]); // Add new incoming request to list
    });

    s.on('requestAccepted', (payload) => {
      if (payload && payload.conversationId) {
        setConversationId(payload.conversationId); // Set the new conversation as active
  localStorage.setItem('activeConversationId', payload.conversationId);
        setPendingRequests(prev => prev.filter(r => r._id !== payload.requestId)); // Remove accepted request from pending list
      }
    });

    s.on('requestRejected', (payload) => {
      if (payload && payload.requestId) setPendingRequests(prev => prev.filter(r => r._id !== payload.requestId)); // Remove rejected request from pending list
    });

    s.on('conversationEnded', (payload) => {
      console.debug('[socket] conversationEnded received (counsellor):', { payload, currentConversationId: conversationId, partnerName, socketId: s.id });
      if (payload && payload.conversationId) {
        const endedConv = payload.conversationId;
        // Refresh pending requests to ensure current state
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

        // If the ended conversation is the current one, reset chat state
        try {
          const current = convIdRef.current ? String(convIdRef.current) : null;
          const endedStr = endedConv ? String(endedConv) : null;
          if (current && endedStr && current === endedStr) {
            setIsActive(false);
            localStorage.removeItem('activeConversationId');
            try { const whoName = payload.endedByName || (payload.endedBy === 'counsellor' ? 'Counsellor' : 'User'); toast(`${whoName} ended the conversation`); } catch (e) { }
            setConversationId(null); // Clear active conversation
          } else {
            // Handle case where the partner name matches the ended name, even if IDs differ (safer reset)
            const endedName = payload && payload.endedByName ? String(payload.endedByName).trim() : null;
            if (endedName && partnerName && String(partnerName).trim() === endedName) {
              setIsActive(false);
              localStorage.removeItem('activeConversationId');
              try { toast(`${endedName} ended the conversation`); } catch (e) { }
              setConversationId(null);
            }
          }
        } catch (e) { /* ignore */ }
      }
    });

    s.on('counsellorStatus', (payload) => {
      console.log('counsellorStatus', payload); // Log status updates (for debugging)
    });

    s.on('error', (err) => {
      console.error('Socket Error:', err);
      // Handle errors, especially related to inactive/expired conversations
      const raw = typeof err === 'string' ? err : (err && err.message ? err.message : 'Socket error');
      if (raw.toLowerCase().includes('inactive') || raw.toLowerCase().includes('expired')) {
        setError("You can't send messages right now.");
        setIsActive(false);
      } else {
        setError(raw);
      }
    });

    // Cleanup function for socket listeners and disconnection
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
    // Dependency array ensures hook runs once on mount
  }, [location.search]);

  // Join/leave conversation rooms and fetch messages/metadata when conversationId changes
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!socket) return; // Wait for socket to be initialized

    // Leave previous room if conversation ID changes
    const prev = prevConvRef.current;
    if (prev && prev !== conversationId) {
      try { socket.emit('leaveConversation', { conversationId: prev }); } catch (e) { /* ignore */ }
    }

    if (conversationId) {
      socket.emit('joinConversation', { conversationId }); // Join the new room
      
      // Fetch conversation metadata
      (async () => {
        try {
          const resMeta = await fetch(`${API_URL}/api/chat/conversation/${conversationId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (resMeta.ok) {
            const { conversation } = await resMeta.json();
            // Check if conversation is active
            if (conversation.isActive === false) {
              setError('This conversation is inactive; sending is disabled.');
              setIsActive(false);
            } else {
              setIsActive(true);
            }
            // Set partner name and profile
            if (conversation) {
              const uname = conversation.user && (conversation.user.name || conversation.user.username || 'User');
              setPartnerName(conversation.isAnonymous ? 'Anonymous' : (uname || 'User'));
              setUserProfile(conversation.user);
              
              // Highlight the corresponding pending request if applicable
              if (conversation.requestId) {
                setActiveRequestId(conversation.requestId);
                setPendingRequests(prev => {
                  const updated = prev.map(r => ({ ...r, _isActiveReq: r._id === conversation.requestId }));
                  updated.sort((a, b) => (b._isActiveReq === true) - (a._isActiveReq === true)); // Move active request to top
                  return updated;
                });
              } else if (conversation.user && conversation.user._id) {
                // Fallback: try to match by user ID
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

      // Fetch stored messages for the conversation
      (async () => {
        try {
          const resMsgs = await fetch(`${API_URL}/api/chat/${conversationId}/messages`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (resMsgs.ok) {
            const msgs = await resMsgs.json();
            setMessages(msgs || []); // Set messages
          }
        } catch (err) {
          console.error('Error fetching stored messages', err);
        }
      })();
    } else {
      // Clear state when no conversation is selected
      setMessages([]);
      setIsActive(true);
    }

    prevConvRef.current = conversationId; // Update previous conversation ref
    convIdRef.current = conversationId; // Update current conversation ref for socket events
  }, [conversationId, socket]);

  // Scroll messages to the bottom when new messages arrive
  useEffect(() => {
    if (messagesRef.current) messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [messages]);

  // Function to send a message
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
      // Emit message via socket
      socket.emit('sendMessage', { conversationId, text: message }, (resp) => {
        if (resp && resp.ok) {
          setMessage(''); // Clear input
          if (textareaRef.current) textareaRef.current.style.height = 'auto'; // Reset textarea height
        } else if (resp && resp.error) {
          // Handle errors from server response
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

  // Handle Enter key to send message (Shift+Enter for new line)
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Handle message input change and adjust textarea height
  const handleChange = (e) => {
    setMessage(e.target.value);
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 300) + 'px';
  };

  // Function to end the current conversation
  const endConversation = async () => {
    try {
      const token = localStorage.getItem('token');
      // Send POST request to API to end conversation
      const res = await fetch(`${API_URL}/api/chat/end`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ conversationId }) });
      if (res.ok) {
        setIsActive(false); // Mark as inactive
        try { if (socket) socket.emit('leaveConversation', { conversationId }); } catch (e) { } // Leave socket room
  localStorage.removeItem('activeConversationId');
        setConversationId(null); // Clear active conversation
      }
    } catch (e) { console.warn('end chat failed', e) }
    setShowEndConfirm(false); // Close confirmation popup
  };


  return (
    <>
  {/* Toaster for displaying notifications */}
  <div className={`chat-container chat-layout ${conversationId ? 'chat-active' : ''}`}>
        <Toaster />
    {/* Sidebar for incoming requests */}
    <aside className={`chat-side drawer open ${conversationId ? 'hide-on-mobile' : ''}`}>

          <div className="side-search" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h4 style={{ margin: 0 }}><pre>  Incoming Requests</pre></h4> {/* Section title */}
          </div>
          <div id="requests-list" style={{ marginTop: 0 , borderRadius: 0 }} className="side-search">
            <input placeholder={'Search requests...'} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} /> {/* Search input */}
          </div>

          <div className="side-section">
            <div className="conversations-list requests-list">
              {pendingRequests.length === 0 && <div className="empty-requests">No pending requests</div>} {/* Empty list message */}
              {/* Map and filter pending requests */}
              {pendingRequests.filter(r => ((r.user?.name || r.user?.username || 'anonymous')).toLowerCase().includes(searchQuery.toLowerCase())).map((r) => (
                <div className={`conv-item ${r._isActiveReq ? 'active-conv' : ''}`} key={r._id}>
                  <img className="item-avatar" src={r.user?.profilePic || '/assets/male.svg'} alt="requester avatar" /> {/* User avatar */}
                  <div className="item-body">
                    <div className="item-title">{r.anonymous ? 'Anonymous' : (r.user && (r.user.name || r.user.username)) || 'User'}</div> {/* User name/alias */}
                    <div className="item-sub">{r._isActiveReq ? 'Active' : `Requested ${new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}</div> {/* Status/Time */}
                  </div>
                  <div className="item-actions">
                    <button className="accept-btn" disabled={!!conversationId || acceptingRequestId === r._id} onClick={async () => { /* Accept button logic */
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
                          localStorage.setItem('activeConversationId', convId);
                          setPendingRequests((prev) => prev.filter(x => x._id !== r._id)); // Remove from pending
                        } else {
                          const err = await res.json().catch(() => ({}));
                          console.warn('Accept failed', err);
                          if (err && err.message) toast.error(err.message);
                        }
                      } catch (err) {
                        console.error('Accept error', err);
                      } finally {
                        setAcceptingRequestId(null);
                      }
                    }}>{acceptingRequestId === r._id ? 'Accepting...' : <FiCheck color='green' fontSize='1.2rem' />}</button>
                    <button className="reject-btn" onClick={async () => { /* Reject button logic */
                      try {
                        const token = localStorage.getItem('token');
                        const res = await fetch(`${API_URL}/api/requests/reject/${r._id}`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
                        if (res.ok) {
                          setPendingRequests(prev => prev.filter(x => x._id !== r._id));
                        } else {
                          setPendingRequests(prev => prev.filter(x => x._id !== r._id)); // Remove on fail as a fallback
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
        
        {/* Main Chat Window Component */}
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
          isCounsellor={true} /* Flag indicating counsellor view */
        />
      </div>
    </>
  );
}
