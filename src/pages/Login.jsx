// Production-ready, accessible, and SEO-friendly login page for Wordins.
import React from "react";
import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "../firebase";
import { FcGoogle } from "react-icons/fc";
import { Helmet } from "react-helmet";
import { useToast } from "../components/Toast";

function Login() {
  const toast = useToast();
  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      toast.showToast("Google sign-in failed. Please try again.", "error");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-900 via-purple-800 to-blue-700 relative overflow-hidden">
      {/* Animated background shapes */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[-80px] left-[-80px] w-96 h-96 bg-purple-400 opacity-20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-[-100px] right-[-100px] w-[28rem] h-[28rem] bg-blue-400 opacity-20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-pink-400 opacity-10 rounded-full blur-2xl animate-pulse" style={{transform:'translate(-50%,-50%)'}} />
      </div>
      {/* Profile floating card (top right) */}
      {auth.currentUser && (
        <div className="fixed top-6 right-8 z-50 flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-lg border border-gray-200">
          <img src={auth.currentUser.photoURL} alt="Profile" className="h-8 w-8 rounded-full border" />
          <span className="font-semibold text-purple-700">{auth.currentUser.displayName}</span>
        </div>
      )}
      <Helmet>
        <title>Wordins – Chat. Create. Connect.</title>
        <meta name="description" content="Wordins is your space for real-time conversations, creative collaboration, and vibrant communities." />
      </Helmet>
      {/* Navbar */}
      <nav className="flex items-center justify-between px-8 py-6 z-10 relative">
        <div className="flex items-center gap-2">
          <span className="bg-gradient-to-r from-purple-400 to-blue-400 text-white rounded-full px-3 py-1 font-bold text-lg shadow flex items-center gap-2">
            <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="#a78bfa"/><text x="50%" y="60%" textAnchor="middle" fill="#fff" fontSize="18" fontFamily="Arial" dy=".3em">💬</text></svg>
            Wordins
          </span>
        </div>
        <button
          className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-5 py-2 rounded-lg font-semibold shadow hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-400 transition"
          onClick={handleLogin}
          aria-label="Get Started with Google"
        >
          Get Started
        </button>
      </nav>
      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 z-10 relative animate-fade-in-up">
        <div className="max-w-2xl w-full mx-auto bg-white/10 rounded-3xl shadow-2xl p-8 md:p-12 backdrop-blur-md border border-white/20 animate-fade-in-up transition-all duration-700">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent drop-shadow-lg">Chat. Create. Connect.</h1>
          <p className="text-lg md:text-xl text-white/90 mb-8">Welcome to Wordins — your space for real-time conversations, creative collaboration, and vibrant communities. Join public or private rooms, personalize your profile, and experience chat reimagined for the modern world.</p>
          <div className="flex flex-col md:flex-row gap-4 justify-center mb-8">
            <button
              className="flex items-center justify-center gap-2 bg-white text-purple-700 px-8 py-3 rounded-lg font-bold text-lg shadow hover:bg-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-400 transition border border-purple-200 active:scale-95 animate-bounce-slow"
              onClick={handleLogin}
              aria-label="Sign in with Google"
            >
              <FcGoogle className="text-2xl animate-spin-slow" aria-label="Google icon" />
              Sign in with Google
            </button>
            <button
              className="flex items-center justify-center gap-2 bg-gray-200 text-gray-500 px-8 py-3 rounded-lg font-bold text-lg shadow cursor-not-allowed opacity-60 animate-fade-in"
              disabled
              aria-label="Continue as guest (coming soon)"
            >
              <span className="text-xl">👤</span>
              Continue as Guest
            </button>
          </div>
          <div className="flex items-center gap-4 mb-8">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-purple-400 to-transparent" />
            <span className="text-white/60 font-semibold">or</span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-purple-400 to-transparent" />
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
      <footer className="text-center text-white/60 py-6 text-sm z-10 relative">
        &copy; {new Date().getFullYear()} Wordins. Chat, create, and connect your way.
      </footer>
    </div>
  );
}

export default Login;
