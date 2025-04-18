import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";

function Home() {
  const [mode, setMode] = useState(null); // "create" or "join"
  const [roomName, setRoomName] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleCreateRoom = async () => {
    if (!roomName.trim()) {
      setError("Please enter a room name.");
      return;
    }

    try {
      const docRef = doc(db, "chatrooms", roomName);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setError("Room already exists. Try joining instead.");
      } else {
        await setDoc(docRef, {
          createdAt: Date.now(),
          roomName: roomName,
        });
        navigate(`/chat/${roomName}`);
      }
    } catch (err) {
      setError("Failed to create room.");
      console.error("Error creating room:", err);
    }
  };

  const handleJoinRoom = async () => {
    if (!roomName.trim()) {
      setError("Please enter a room name.");
      return;
    }

    try {
      const docRef = doc(db, "chatrooms", roomName);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        navigate(`/chat/${roomName}`);
      } else {
        setError("Room not found. Please create it first.");
      }
    } catch (err) {
      setError("Failed to join room.");
      console.error("Error joining room:", err);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/"); // Redirect to the login page
    } catch (err) {
      console.error("Error logging out:", err);
    }
  };

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen bg-cover bg-center text-black px-4"
      style={{ backgroundImage: "url('/image.png')" }}
    >
      <h1 className="text-4xl font-bold text-center mb-8 bg-white bg-opacity-70 px-4 py-2 rounded">
        Welcome to Chat App 🚀
      </h1>

      <button
        onClick={handleLogout}
        className="absolute top-4 right-4 px-4 py-2 bg-red-500 text-white rounded-lg shadow-md hover:bg-red-600 transition"
      >
        Log Out
      </button>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {!mode && (
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={() => setMode("create")}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg shadow-md hover:bg-purple-700 transition w-full max-w-xs"
          >
            Create Chat Room
          </button>
          <button
            onClick={() => setMode("join")}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition w-full max-w-xs"
          >
            Join Chat Room
          </button>
        </div>
      )}

      {mode === "create" && (
        <div className="flex flex-col items-center gap-4 w-full max-w-xs">
          <input
            type="text"
            placeholder="Enter Room Name"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            onClick={handleCreateRoom}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg shadow-md hover:bg-purple-700 transition w-full"
          >
            Create Room
          </button>
        </div>
      )}

      {mode === "join" && (
        <div className="flex flex-col items-center gap-4 w-full max-w-xs">
          <input
            type="text"
            placeholder="Enter Room Name"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            onClick={handleJoinRoom}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition w-full"
          >
            Join Room
          </button>
        </div>
      )}
    </div>
  );
}

export default Home;
