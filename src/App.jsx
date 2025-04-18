import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "./firebase";
import Login from "./pages/Login";
import Home from "./pages/Home";
import ChatRoom from "./pages/ChatRoom";

function App() {
  const [user] = useAuthState(auth);

  return (
    <Router>
      <Routes>
        <Route path="/" element={user ? <Home /> : <Login />} />
        <Route path="/chat/:roomId" element={<ChatRoom />} />
      </Routes>
    </Router>
  );
}

export default App;
