import React from "react";
import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "../firebase";
import { FcGoogle } from "react-icons/fc";

function Login() {
  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-900 via-purple-800 to-blue-700">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-6">
        <div className="flex items-center gap-2">
          <span className="bg-gradient-to-r from-purple-400 to-blue-400 text-white rounded-full px-3 py-1 font-bold text-lg shadow">Wordins</span>
        </div>
        <button
          className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-5 py-2 rounded-lg font-semibold shadow hover:scale-105 transition"
          onClick={handleLogin}
        >
          Get Started
        </button>
      </nav>
      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4">
        <div className="max-w-2xl w-full">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">Chat. Create. Connect.</h1>
          <p className="text-lg md:text-xl text-white/90 mb-8">Welcome to Wordins — your space for real-time conversations, creative collaboration, and vibrant communities. Join public or private rooms, personalize your profile, and experience chat reimagined for the modern world.</p>
          <div className="flex flex-col md:flex-row gap-4 justify-center mb-12">
            <button
              className="bg-gradient-to-r from-purple-500 to-blue-500 text-white px-8 py-3 rounded-lg font-bold text-lg shadow hover:scale-105 transition"
              onClick={handleLogin}
            >
              Sign in with Google <FcGoogle className="inline ml-2 text-2xl align-middle" />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
            <div className="bg-white/10 rounded-2xl p-6 shadow-lg">
              <h3 className="text-xl font-bold text-purple-200 mb-2">Create & Join Rooms</h3>
              <p className="text-white/80">Start your own chat rooms or join existing ones. Public or invite-only — you choose how you connect.</p>
            </div>
            <div className="bg-white/10 rounded-2xl p-6 shadow-lg">
              <h3 className="text-xl font-bold text-blue-200 mb-2">Custom Avatars & Profiles</h3>
              <p className="text-white/80">Express yourself with unique avatars and profile customization. Your identity, your way.</p>
            </div>
            <div className="bg-white/10 rounded-2xl p-6 shadow-lg">
              <h3 className="text-xl font-bold text-pink-200 mb-2">Fun & Collaboration</h3>
              <p className="text-white/80">Play mini-games, share files, and collaborate in real time. Wordins is more than chat — it's your creative hub.</p>
            </div>
          </div>
        </div>
      </main>
      {/* Footer */}
      <footer className="text-center text-white/60 py-6 text-sm">
        &copy; {new Date().getFullYear()} Wordins. Chat, create, and connect your way.
      </footer>
    </div>
  );
}

export default Login;
