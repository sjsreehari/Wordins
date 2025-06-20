import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { addDoc, collection, query, onSnapshot, orderBy, serverTimestamp, doc, getDoc, updateDoc, onSnapshot as onDocSnapshot, setDoc, deleteDoc, getDocs } from "firebase/firestore";
import { format } from "date-fns";
import ReactCanvasConfetti from "react-canvas-confetti";
import Button from '../components/ui/Button';
import { useToast } from '../components/Toast';

const ChatRoom = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [roomExists, setRoomExists] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const [room, setRoom] = useState(null);
  const [isMember, setIsMember] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const [showSparkle, setShowSparkle] = useState(false);
  const confettiRef = useRef();
  const [sendError, setSendError] = useState("");
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const mainRef = useRef();
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [effect, setEffect] = useState("");
  const [autoScroll, setAutoScroll] = useState(true);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const toast = useToast();
  const [effectOverlay, setEffectOverlay] = useState("");

  useEffect(() => {
    if (!roomId) {
      navigate("/");
      return;
    }
    const roomRef = doc(db, "chatrooms", roomId);
    const unsubRoom = onDocSnapshot(roomRef, (docSnap) => {
      if (!docSnap.exists()) {
        setRoomExists(false);
        setLoading(false);
        return;
      }
      const data = docSnap.data();
      setRoom(data);
      setIsMember(data.members?.includes(auth.currentUser.uid));
      setLoading(false);
    });
    return () => unsubRoom();
  }, [roomId, navigate]);

  useEffect(() => {
    if (room && room.inviteOnly && isMember) {
      const q = collection(db, "chatrooms", roomId, "joinRequests");
      const unsub = onSnapshot(q, (snap) => {
        setPendingRequests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      });
      return () => unsub();
    }
  }, [room, isMember, roomId]);

  useEffect(() => {
    if (!roomId || !isMember) return;
    setLoading(true);
    let unsub;
    try {
      const q = query(
        collection(db, "chatrooms", roomId, "messages"),
        orderBy("timestamp")
      );
      unsub = onSnapshot(q, (snapshot) => {
        let docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setMessages(docs);
        setLoading(false);
      }, (err) => {
        // If orderBy fails, fallback to unsorted fetch
        const fallbackCol = collection(db, "chatrooms", roomId, "messages");
        onSnapshot(fallbackCol, (snap) => {
          let docs = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          // Sort: by timestamp if available, else by doc ID
          docs.sort((a, b) => {
            const aTime = a.timestamp && a.timestamp.toMillis ? a.timestamp.toMillis() : 0;
            const bTime = b.timestamp && b.timestamp.toMillis ? b.timestamp.toMillis() : 0;
            if (aTime === bTime) return a.id.localeCompare(b.id);
            return aTime - bTime;
          });
          setMessages(docs);
          setLoading(false);
        });
      });
    } catch (e) {
      // Fallback in case query fails
      const fallbackCol = collection(db, "chatrooms", roomId, "messages");
      unsub = onSnapshot(fallbackCol, (snap) => {
        let docs = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        docs.sort((a, b) => {
          const aTime = a.timestamp && a.timestamp.toMillis ? a.timestamp.toMillis() : 0;
          const bTime = b.timestamp && b.timestamp.toMillis ? b.timestamp.toMillis() : 0;
          if (aTime === bTime) return a.id.localeCompare(b.id);
          return aTime - bTime;
        });
        setMessages(docs);
        setLoading(false);
      });
    }
    return () => unsub && unsub();
  }, [roomId, isMember]);

  useEffect(() => {
    if (!roomId || !isMember) return;
    const typingCol = collection(db, "chatrooms", roomId, "typing");
    const unsub = onSnapshot(typingCol, (snap) => {
      const typing = [];
      snap.forEach(doc => {
        const data = doc.data();
        if (data.typing && data.userId !== auth.currentUser.uid) {
          typing.push(data.displayName || "Someone");
        }
      });
      setTypingUsers(typing);
    });
    return () => unsub();
  }, [roomId, isMember]);

  const handleApprove = async (req) => {
    if (!window.confirm('Approve this join request?')) return;
    const roomRef = doc(db, "chatrooms", roomId);
    const joinReqRef = doc(db, `chatrooms/${roomId}/joinRequests`, req.id);
    const roomSnap = await getDoc(roomRef);
    if (!roomSnap.exists()) return;
    const currentMembers = roomSnap.data().members || [];
    if (!currentMembers.includes(req.userId)) {
      await updateDoc(roomRef, { members: [...currentMembers, req.userId] });
    }
    await updateDoc(joinReqRef, { status: "approved" });
    toast.showToast("User approved and added to room.", "success");
  };

  const handleReject = async (req) => {
    if (!window.confirm('Reject this join request?')) return;
    const joinReqRef = doc(db, `chatrooms/${roomId}/joinRequests`, req.id);
    await updateDoc(joinReqRef, { status: "rejected" });
    toast.showToast("Join request rejected.", "info");
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (!isMember) return;
    const typingRef = doc(db, "chatrooms", roomId, "typing", auth.currentUser.uid);
    setDoc(typingRef, {
      userId: auth.currentUser.uid,
      displayName: auth.currentUser.displayName || "Someone",
      typing: true,
      updatedAt: Date.now(),
    });
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!isMember) return;
    if (input.trim()) {
      try {
        await addDoc(collection(db, "chatrooms", roomId, "messages"), {
          text: input,
          senderName: auth.currentUser.displayName,
          senderPhotoURL: auth.currentUser.photoURL,
          uid: auth.currentUser.uid,
          timestamp: serverTimestamp(),
        });
        setInput("");
        const typingRef = doc(db, "chatrooms", roomId, "typing", auth.currentUser.uid);
        setDoc(typingRef, {
          userId: auth.currentUser.uid,
          displayName: auth.currentUser.displayName || "Someone",
          typing: false,
          updatedAt: Date.now(),
        });
        // Trigger sparkle effect
        setShowSparkle(true);
        confettiRef.current && confettiRef.current({
          particleCount: 60,
          spread: 80,
          startVelocity: 40,
          origin: { y: 0.7 },
          scalar: 0.7,
          colors: ["#fbbf24", "#a78bfa", "#38bdf8", "#f472b6", "#f87171", "#34d399", "#facc15"],
          shapes: ["circle", "square"],
        });
        setTimeout(() => setShowSparkle(false), 1200);
      } catch (err) {
        setSendError("Failed to send message: " + (err.message || err));
        setTimeout(() => setSendError(""), 4000);
      }
    }
  };

  // Add this function to send an effect message
  const sendEffect = async (effectType) => {
    if (!isMember) return;
    try {
      await addDoc(collection(db, "chatrooms", roomId, "messages"), {
        text: "", // No text for effect messages
        senderName: auth.currentUser.displayName,
        senderPhotoURL: auth.currentUser.photoURL,
        uid: auth.currentUser.uid,
        timestamp: serverTimestamp(),
        effect: effectType,
      });
    } catch (err) {
      setSendError("Failed to send effect: " + (err.message || err));
      setTimeout(() => setSendError(""), 4000);
    }
  };

  useEffect(() => {
    if (!mainRef.current) return;
    const el = mainRef.current;
    const handleScroll = () => {
      const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
      setAutoScroll(nearBottom);
      setShowScrollToBottom(!nearBottom);
    };
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (!mainRef.current) return;
    if (autoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, autoScroll]);

  const handleEmoji = (emoji) => {
    setInput(input + emoji);
    setEmojiPickerOpen(false);
  };

  useEffect(() => {
    if (!emojiPickerOpen) return;
    const handleClick = (e) => {
      if (!document.getElementById('emoji-picker')?.contains(e.target)) {
        setEmojiPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [emojiPickerOpen]);

  const DefaultAvatar = ({ size = 40 }) => (
    <span
      className={`inline-flex items-center justify-center rounded-full bg-purple-200 text-purple-700 font-bold`}
      style={{ width: size, height: size, fontSize: size / 2 }}
      aria-label="Default avatar"
    >
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none"><circle cx="20" cy="20" r="20" fill="#E9D5FF"/><text x="50%" y="55%" textAnchor="middle" fill="#7C3AED" fontSize="18" fontFamily="Arial" dy=".3em">👤</text></svg>
    </span>
  );

  useEffect(() => {
    if (!messages.length) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.effect && ["hearts", "confetti", "balloons", "pop", "fireworks"].includes(lastMsg.effect)) {
      setEffectOverlay(lastMsg.effect);
      setTimeout(() => setEffectOverlay(""), 2000);
      if (lastMsg.effect === "confetti" && confettiRef.current) {
        confettiRef.current({
          particleCount: 80,
          spread: 100,
          startVelocity: 45,
          origin: { y: 0.7 },
          scalar: 0.9,
          colors: ["#fbbf24", "#a78bfa", "#38bdf8", "#f472b6", "#f87171", "#34d399", "#facc15"],
          shapes: ["circle", "square"]
        });
      }
      if (lastMsg.effect === "fireworks" && confettiRef.current) {
        // Fireworks burst
        for (let i = 0; i < 3; i++) {
          setTimeout(() => {
            confettiRef.current({
              particleCount: 50,
              spread: 70 + i * 20,
              startVelocity: 60,
              origin: { y: 0.5 - i * 0.1 },
              scalar: 1,
              colors: ["#fbbf24", "#a78bfa", "#38bdf8", "#f472b6", "#f87171", "#34d399", "#facc15"],
              shapes: ["circle", "square"]
            });
          }, i * 400);
        }
      }
      if (lastMsg.effect === "pop" && confettiRef.current) {
        // Star burst pop
        confettiRef.current({
          particleCount: 40,
          spread: 120,
          startVelocity: 55,
          origin: { y: 0.7 },
          scalar: 1.2,
          colors: ["#fbbf24", "#facc15", "#fff", "#a78bfa"],
          shapes: ["circle", "square"]
        });
      }
    }
  }, [messages]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!isMember) {
    if (room?.inviteOnly) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Join Request Pending</h2>
            <p className="text-gray-600 mb-4">You are not a member of this invite-only room. If you have sent a join request, please wait for approval.</p>
            <button onClick={() => navigate("/")} className="px-6 py-2 bg-purple-600 text-white rounded-md font-medium hover:bg-purple-700">Back to Home</button>
          </div>
        </div>
      );
    } else {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
          <div className="bg-white rounded-lg shadow-lg p-6 text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Not a Member</h2>
            <p className="text-gray-600 mb-4">You are not a member of this room.</p>
            <button onClick={() => navigate("/")} className="px-6 py-2 bg-purple-600 text-white rounded-md font-medium hover:bg-purple-700">Back to Home</button>
          </div>
        </div>
      );
    }
  }

  if (error || !roomExists) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Chat Room Error</h2>
          <p className="text-gray-600 mb-6">{error || "This chat room doesn't exist or has been deleted."}</p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-2 bg-purple-600 text-white rounded-md font-medium hover:bg-purple-700"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-indigo-900 via-purple-800 to-blue-700 relative overflow-hidden">
      {/* Full-screen Effects */}
      <ReactCanvasConfetti
        refConfetti={confettiRef}
        style={{
          position: "fixed",
          pointerEvents: "none",
          width: "100vw",
          height: "100vh",
          top: 0,
          left: 0,
          zIndex: 1000,
          display: showSparkle ? "block" : "none"
        }}
      />
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/10 backdrop-blur-md border-b border-white/20 px-6 py-4 flex justify-between items-center shadow-lg">
        <div className="flex items-center">
          <button
            onClick={() => navigate("/")}
            className="mr-3 text-gray-500 hover:text-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-400"
            aria-label="Back to Home"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-extrabold text-purple-700 flex items-center gap-2">{room?.roomName || "Chat Room"} {room?.inviteOnly && <span title="Invite Only" className="text-purple-400">🔒</span>}
              <button
                className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition focus:outline-none focus:ring-2 focus:ring-blue-400"
                aria-label="Copy room link"
                onClick={() => {navigator.clipboard.writeText(window.location.href); toast.showToast('Room link copied!', 'success');}}
              >Copy Link</button>
            </h1>
            <p className="text-xs text-gray-400">Room ID: {roomId}</p>
            <button
              onClick={() => setShowMembersModal(true)}
              className="ml-2 px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition focus:outline-none focus:ring-2 focus:ring-purple-400"
              aria-label="View members"
            >
              View Members
            </button>
            {room?.inviteOnly && isMember && auth.currentUser?.uid === room?.createdBy && (
              <button onClick={() => setShowRequestsModal(true)} className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition focus:outline-none focus:ring-2 focus:ring-blue-400" aria-label="View join requests">View Join Requests</button>
            )}
          </div>
        </div>
        <div className="flex items-center">
          {auth.currentUser?.photoURL ? (
            <img
              src={auth.currentUser.photoURL}
              alt="Profile"
              className="h-9 w-9 rounded-full border-2 border-purple-300 shadow"
            />
          ) : <DefaultAvatar size={36} />}
        </div>
      </header>
      {/* Member List Modal */}
      {showMembersModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md relative flex flex-col items-center transition-all duration-300 ease-out opacity-100 scale-100">
            <button
              onClick={() => setShowMembersModal(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-400 rounded-full z-10"
              aria-label="Close members list"
              style={{ background: 'white', padding: 2 }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <h2 className="text-lg font-bold mb-4 text-purple-700">Room Members</h2>
            <ul className="space-y-2 w-full">
              {room?.members?.map(uid => (
                <li key={uid} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-purple-50">
                  {/* Show avatar if available, else default */}
                  {room?.memberMeta?.[uid]?.photoURL ? (
                    <img src={room.memberMeta[uid].photoURL} alt={room.memberMeta[uid].displayName || uid} className="h-8 w-8 rounded-full border" />
                  ) : <span><DefaultAvatar size={32} /></span>}
                  {room?.createdBy === uid ? <span title="Owner" className="text-yellow-500">👑</span> : null}
                  {auth.currentUser?.uid === uid ? <span className="text-green-500 font-bold" title="You">You</span> : null}
                  <span className="text-gray-700 break-all">{room?.memberMeta?.[uid]?.displayName || uid}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      {/* Join Requests Modal */}
      {showRequestsModal && auth.currentUser?.uid === room?.createdBy && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md relative flex flex-col items-center transition-all duration-300 ease-out opacity-100 scale-100">
            <button
              onClick={() => setShowRequestsModal(false)}
              className="absolute top-3 right-3 text-gray-400 hover:text-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-400 rounded-full z-10"
              aria-label="Close join requests"
              style={{ background: 'white', padding: 2 }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
            <h2 className="text-lg font-bold mb-4 text-purple-700">Pending Join Requests</h2>
            {pendingRequests.length === 0 ? (
              <p className="text-gray-500">No pending requests.</p>
            ) : (
              pendingRequests.filter(r => r.status === "pending").map(req => (
                <div key={req.id} className="flex items-center justify-between mb-2 p-2 border rounded-lg w-full">
                  <div className="flex items-center gap-2">
                    <img src={req.photoURL || "https://via.placeholder.com/32"} alt={req.displayName} className="h-8 w-8 rounded-full border" />
                    <span className="font-semibold text-gray-700 break-all">{req.displayName || req.userId}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleApprove(req)} className="px-2 py-1 bg-green-500 text-white rounded hover:bg-green-600">Approve</button>
                    <button onClick={() => handleReject(req)} className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600">Reject</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
      {/* Chat Messages Area */}
      <div className="flex-1 flex flex-col items-center justify-end w-full">
        <main ref={mainRef} className="flex-1 w-full max-w-2xl mx-auto flex flex-col gap-3 overflow-y-auto px-2 sm:px-4 md:px-6 pb-2" style={{minHeight:0}}>
          {/* Typing indicator */}
          {typingUsers.length > 0 && (
            <div className="flex items-center gap-2 mb-2 text-sm text-purple-500 animate-pulse" aria-live="polite">
              <span>{typingUsers.join(", ")}</span>
              <span className="inline-flex items-center ml-1">
                <span className="dot bg-purple-400 mx-0.5 rounded-full" style={{width:6,height:6,display:'inline-block',animation:'bounce 1s infinite alternate'}}></span>
                <span className="dot bg-purple-400 mx-0.5 rounded-full" style={{width:6,height:6,display:'inline-block',animation:'bounce 1s 0.2s infinite alternate'}}></span>
                <span className="dot bg-purple-400 mx-0.5 rounded-full" style={{width:6,height:6,display:'inline-block',animation:'bounce 1s 0.4s infinite alternate'}}></span>
              </span>
            </div>
          )}
          {loading ? (
            <div className="flex-1 flex items-center justify-center text-purple-400 animate-pulse">Loading messages...</div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 py-12">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <circle cx="12" cy="12" r="10" stroke="#a78bfa" strokeWidth="2" fill="#f3e8ff" />
                <text x="50%" y="55%" textAnchor="middle" fill="#a78bfa" fontSize="24" fontFamily="Arial" dy=".3em">💬</text>
              </svg>
              <p className="text-lg font-semibold">No messages yet</p>
              <p className="text-sm">Be the first to send a message!</p>
            </div>
          ) : (
            (() => {
              let lastDate = null;
              return messages.map((msg, i) => {
                const isCurrentUser = msg.uid === auth.currentUser?.uid;
                const msgDate = msg.timestamp && msg.timestamp.toDate ? msg.timestamp.toDate().toDateString() : null;
                const showDate = msgDate && msgDate !== lastDate;
                lastDate = msgDate;
                return (
                  <React.Fragment key={msg.id || i}>
                    {showDate && (
                      <div className="flex justify-center my-2">
                        <span className="bg-purple-100 text-purple-700 px-4 py-1 rounded-full text-xs font-semibold shadow">{msgDate}</span>
                      </div>
                    )}
                    <div className={`flex mb-2 w-full ${isCurrentUser ? "justify-end" : "justify-start"}`}>
                      {!isCurrentUser && (
                        msg.senderPhotoURL ? (
                          <img
                            src={msg.senderPhotoURL}
                            alt={msg.senderName}
                            className="h-9 w-9 rounded-full mr-3 border shadow"
                          />
                        ) : <span className="mr-3"><DefaultAvatar size={36} /></span>
                      )}
                      <div className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 shadow-lg relative flex flex-col items-${isCurrentUser ? 'end' : 'start'} "
                        ${isCurrentUser
                          ? "bg-gradient-to-br from-purple-600 to-blue-500 text-white rounded-l-2xl rounded-br-2xl ml-auto"
                          : "bg-white text-gray-800 rounded-r-2xl rounded-bl-2xl border mr-auto"}
                      `}>
                        {!isCurrentUser && (
                          <p className="text-xs font-bold mb-1 text-purple-700">{msg.senderName || "Unknown"}</p>
                        )}
                        <p className="break-words text-base">{msg.text}</p>
                        <p className={`text-xs mt-1 ${isCurrentUser ? "text-purple-200" : "text-gray-400"}`}>
                          {msg.timestamp && msg.timestamp.toDate
                            ? format(msg.timestamp.toDate(), "h:mm a")
                            : "Just now"}
                        </p>
                      </div>
                      {isCurrentUser && (
                        auth.currentUser?.photoURL ? (
                          <img
                            src={auth.currentUser?.photoURL}
                            alt="You"
                            className="h-9 w-9 rounded-full ml-3 border shadow"
                          />
                        ) : <span className="ml-3"><DefaultAvatar size={36} /></span>
                      )}
                    </div>
                  </React.Fragment>
                );
              });
            })()
          )}
          <div ref={messagesEndRef} />
          {showScrollToBottom && (
            <button
              className="fixed bottom-28 right-6 z-40 bg-purple-600 text-white px-4 py-2 rounded-full shadow-lg hover:bg-purple-700 transition"
              onClick={() => {
                messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
                setShowScrollToBottom(false);
              }}
              style={{ minWidth: 120 }}
            >
              New messages ↓
            </button>
          )}
        </main>
        {/* Message Input */}
        <footer className="w-full max-w-2xl mx-auto sticky bottom-0 z-10">
          <div className="bg-white/80 rounded-2xl shadow-2xl border border-gray-200 px-4 py-3 flex flex-col gap-2">
            {/* Error feedback for send */}
            {sendError && (
              <div className="mb-2 text-sm text-red-600 bg-red-50 rounded p-2 text-center animate-pulse" aria-live="assertive">{sendError}</div>
            )}
            <form
              onSubmit={sendMessage}
              className="flex items-center w-full gap-2"
              style={{ position: 'relative' }}
            >
              {/* Emoji button on far left */}
              <button
                type="button"
                aria-label="Open emoji picker"
                onClick={() => setEmojiPickerOpen(!emojiPickerOpen)}
                className="h-12 w-12 flex items-center justify-center bg-yellow-100 hover:bg-yellow-200 transition text-2xl rounded-full border-none focus:outline-none shadow-sm mr-2 focus:ring-2 focus:ring-purple-400"
                tabIndex={0}
                style={{ minWidth: 48 }}
              >
                <span role="img" aria-label="emoji">😊</span>
              </button>
              {emojiPickerOpen && (
                <div id="emoji-picker" className="absolute bottom-16 left-0 bg-white border rounded shadow p-2 z-10 flex flex-wrap gap-1">
                  {["😀","😂","😍","😎","😭","👍","🎉","❤️","🔥","👏"].map(e => (
                    <button key={e} type="button" className="text-2xl" onClick={() => handleEmoji(e)}>{e}</button>
                  ))}
                </div>
              )}
              {/* Input box in the center */}
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => input.length < 500 && handleInputChange(e)}
                maxLength={500}
                className="flex-1 h-12 px-4 py-2 border-none focus:ring-0 focus:outline-none text-base bg-transparent min-w-[100px]"
                placeholder="Type a message..."
                disabled={!isMember}
                aria-label="Type a message"
                style={{ minWidth: 0 }}
              />
              {/* Send button on far right */}
              <Button onClick={sendMessage} loading={loading} ariaLabel="Send message">Send</Button>
            </form>
            <p className="text-xs text-gray-400 mt-1 ml-2">Press <b>Enter</b> to send</p>
          </div>
        </footer>
      </div>
      {effectOverlay === "balloons" && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-end justify-center">
          {[...Array(8)].map((_, i) => (
            <span key={i} className={`absolute creative-balloon`} style={{
              left: `calc(50% + ${(i-4)*32}px)`,
              bottom: '0%',
              '--sway': `${(i%2===0?1:-1)*1.5}deg`,
              '--delay': `${i*0.12}s`,
              fontSize: `${36 + Math.random() * 18}px`,
              color: `hsl(${Math.random() * 360},80%,70%)`
            }}>🎈</span>
          ))}
        </div>
      )}
      {effectOverlay === "pop" && (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center">
          {[...Array(10)].map((_, i) => (
            <span key={i} className={`absolute creative-pop`} style={{
              left: '50%',
              top: '50%',
              '--angle': `${(i/10)*2*Math.PI}rad`,
              '--delay': `${i*0.05}s`,
              fontSize: `${30 + Math.random() * 10}px`,
              color: `#facc15`,
              opacity: 0.95
            }}>✨</span>
          ))}
        </div>
      )}
      {effectOverlay === "fireworks" && (
        <div className="pointer-events-none fixed inset-0 z-50">
          <span className="absolute creative-firework-launch" style={{left:'50%',bottom:'0%',fontSize:48,color:'#a78bfa'}}>🎇</span>
          {[...Array(8)].map((_, i) => (
            <span key={i} className={`absolute creative-firework-explode`} style={{
              left: '50%',
              top: '20%',
              '--angle': `${(i/8)*2*Math.PI}rad`,
              '--delay': `${i*0.08}s`,
              fontSize: `${32 + Math.random() * 16}px`,
              color: `hsl(${Math.random() * 360},90%,60%)`,
              opacity: 0.95
            }}>✨</span>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChatRoom;
