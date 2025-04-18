import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { addDoc, collection, query, onSnapshot, orderBy, serverTimestamp } from "firebase/firestore";
import { format } from "date-fns";

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

  useEffect(() => {
    if (!roomId) {
      navigate("/");
      return;
    }

    const q = query(
      collection(db, "chatrooms", roomId, "messages"),
      orderBy("timestamp")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map((doc) => doc.data()));
      setLoading(false);
    });

    return () => unsubscribe();
  }, [roomId, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (input.trim()) {
      await addDoc(collection(db, "chatrooms", roomId, "messages"), {
        text: input,
        sender: auth.currentUser.displayName,
        uid: auth.currentUser.uid,
        timestamp: serverTimestamp(),
      });
      setInput("");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
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
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center shadow-sm">
        <div className="flex items-center">
          <button
            onClick={() => navigate("/")}
            className="mr-3 text-gray-500 hover:text-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <h1 className="text-xl font-semibold text-gray-800">Chat Room</h1>
            <p className="text-sm text-gray-500">Room ID: {roomId}</p>
          </div>
        </div>
        <div className="flex items-center">
          {auth.currentUser?.photoURL && (
            <img
              src={auth.currentUser.photoURL}
              alt="Profile"
              className="h-8 w-8 rounded-full"
            />
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-lg">No messages yet</p>
            <p className="text-sm">Be the first to send a message!</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isCurrentUser = msg.uid === auth.currentUser?.uid;
            return (
              <div key={i} className={`flex mb-4 ${isCurrentUser ? "justify-end" : "justify-start"}`}>
                {!isCurrentUser && (
                  <img
                    src={msg.senderPhotoURL || "https://via.placeholder.com/40"}
                    alt={msg.senderName}
                    className="h-10 w-10 rounded-full mr-3 mt-1"
                  />
                )}
                <div className={`max-w-xs md:max-w-md lg:max-w-lg ${
                  isCurrentUser
                    ? "bg-purple-600 text-white rounded-l-lg rounded-br-lg"
                    : "bg-white text-gray-800 rounded-r-lg rounded-bl-lg"
                } px-4 py-2 shadow`}>
                  {!isCurrentUser && (
                    <p className="text-xs font-medium mb-1">{msg.senderName}</p>
                  )}
                  <p>{msg.text}</p>
                  <p className={`text-xs mt-1 ${isCurrentUser ? "text-purple-200" : "text-gray-500"}`}>
                    {msg.timestamp ? format(msg.timestamp.toDate(), "h:mm a") : ""}
                  </p>
                </div>
                {isCurrentUser && (
                  <img
                    src={auth.currentUser?.photoURL || "https://via.placeholder.com/40"}
                    alt="You"
                    className="h-10 w-10 rounded-full ml-3 mt-1"
                  />
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t border-gray-200 bg-white p-4">
  <form onSubmit={sendMessage} className="flex items-center">
    <input
      ref={inputRef}
      type="text"
      value={input}
      onChange={(e) => setInput(e.target.value)}
      className="flex-1 border border-gray-300 rounded-l-lg h-10 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
      placeholder="Type a message..."
    />
    <button
      type="submit"
      disabled={!input.trim()}
      className={`ml-2 px-4 py-2 rounded-r-lg ${input.trim() ? "bg-purple-600 text-white hover:bg-purple-700" : "bg-gray-300 text-gray-500 cursor-not-allowed"}`}
    >
      Send
    </button>
  </form>
</div>

    </div>
  );
};

export default ChatRoom;
