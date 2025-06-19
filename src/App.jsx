import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "./firebase";
import Login from "./pages/Login";
import Home from "./pages/Home";
import ChatRoom from "./pages/ChatRoom";
import { ToastProvider } from "./components/Toast";
import React from "react";

function GameChatPlaceholder() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <h1 className="text-3xl font-bold text-purple-700">GameChat coming soon!</h1>
    </div>
  );
}

function App() {
  const [user] = useAuthState(auth);

  return (
    <ToastProvider>
      <Router>
        <Routes>
          <Route path="/" element={user ? <Home /> : <Login />} />
          <Route path="/chat/:roomId" element={<ChatRoom />} />
          <Route path="/gamechat" element={<GameChatPlaceholder />} />
        </Routes>
      </Router>
    </ToastProvider>
  );
}

export default App;
