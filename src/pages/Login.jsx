// Production-ready, accessible, and SEO-friendly login page for Wordins.
import React, { useState } from "react";
import { signInWithPopup } from "firebase/auth";
import { auth, provider } from "../firebase";
import { FcGoogle } from "react-icons/fc";
import { Helmet } from "react-helmet";
import { useToast } from "../components/Toast";

function Login() {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const handleLogin = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      toast.showToast("Google sign-in failed. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-indigo-900 via-purple-800 to-blue-700 relative overflow-hidden animate-fade-in-up">
      {/* Animated background shapes (subtler) */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute top-[-80px] left-[-80px] w-80 h-80 bg-purple-400 opacity-10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-[-100px] right-[-100px] w-96 h-96 bg-blue-400 opacity-10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 left-1/2 w-60 h-60 bg-pink-400 opacity-5 rounded-full blur-2xl animate-pulse" style={{transform:'translate(-50%,-50%)'}} />
      </div>
      {/* Profile floating card (top right) */}
      {auth.currentUser && (
        <div className="fixed top-6 right-8 z-50 flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-lg border border-gray-200">
          <img src={auth.currentUser.photoURL} alt="Profile avatar" className="h-8 w-8 rounded-full border" />
          <span className="font-semibold text-purple-700">{auth.currentUser.displayName}</span>
        </div>
      )}
      <Helmet>
        <title>Wordins – Chat. Create. Connect.</title>
        <meta name="description" content="Wordins is your space for real-time conversations, creative collaboration, and vibrant communities." />
      </Helmet>
      {/* Navbar */}
      <nav className="flex items-center justify-between px-4 sm:px-8 py-6 z-10 relative">
        <div className="flex items-center gap-2">
          <span className="bg-gradient-to-r from-purple-400 to-blue-400 text-white rounded-full px-3 py-1 font-bold text-lg shadow flex items-center gap-2">
            <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="#a78bfa"/><text x="50%" y="60%" textAnchor="middle" fill="#fff" fontSize="18" fontFamily="Arial" dy=".3em">💬</text></svg>
            Wordins
          </span>
        </div>
        <button
          className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-5 py-2 rounded-lg font-semibold shadow hover:scale-105 focus:outline-none focus:ring-2 focus:ring-purple-400 transition disabled:opacity-60 disabled:cursor-not-allowed"
          onClick={handleLogin}
          aria-label="Get Started with Google"
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center gap-2"><span className="loader mr-2"></span>Loading...</span>
          ) : (
            "Get Started"
          )}
        </button>
      </nav>
      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-2 sm:px-4 z-10 relative animate-fade-in-up">
        <div className="max-w-2xl w-full mx-auto bg-white/20 rounded-3xl shadow-2xl p-6 sm:p-8 md:p-12 backdrop-blur-lg border border-white/30 animate-fade-in-up transition-all duration-700">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-6 bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent drop-shadow-lg">Chat. Create. Connect.</h1>
          <p className="text-base sm:text-lg md:text-xl text-white/90 mb-8">Welcome to Wordins — your space for real-time conversations, creative collaboration, and vibrant communities. Join public or private rooms, personalize your profile, and experience chat reimagined for the modern world.</p>
          <div className="flex flex-col md:flex-row gap-4 justify-center mb-8">
            <button
              className="flex items-center justify-center gap-2 bg-white text-purple-700 px-8 py-3 rounded-lg font-bold text-lg shadow hover:bg-purple-100 focus:outline-none focus:ring-2 focus:ring-purple-400 transition border border-purple-200 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
              onClick={handleLogin}
              aria-label="Sign in with Google"
              disabled={loading}
            >
              <FcGoogle className="text-2xl" aria-label="Google icon" />
              {loading ? "Signing in..." : "Sign in with Google"}
            </button>
            <button
              className="flex items-center justify-center gap-2 bg-gray-200 text-gray-500 px-8 py-3 rounded-lg font-bold text-lg shadow cursor-not-allowed opacity-60 animate-fade-in"
              disabled
              aria-label="Continue as guest (coming soon)"
              tabIndex={-1}
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
            <div className="bg-white/20 rounded-2xl p-6 shadow-lg">
              <h3 className="text-xl font-bold text-purple-200 mb-2">Create & Join Rooms</h3>
              <p className="text-white/80">Start your own chat rooms or join existing ones. Public or invite-only — you choose how you connect.</p>
            </div>
            <div className="bg-white/20 rounded-2xl p-6 shadow-lg">
              <h3 className="text-xl font-bold text-blue-200 mb-2">Custom Avatars & Profiles</h3>
              <p className="text-white/80">Express yourself with unique avatars and profile customization. Your identity, your way.</p>
            </div>
            <div className="bg-white/20 rounded-2xl p-6 shadow-lg flex flex-col items-center">
              <h3 className="text-xl font-bold text-pink-200 mb-2">Fun & Collaboration</h3>
              <p className="text-white/80">Play mini-games, share files, and collaborate in real time. Wordins is more than chat — it's your creative hub.</p>
            </div>
          </div>
        </div>
      </main>
      {/* Footer */}
      <footer className="text-center text-white/70 py-6 text-sm z-10 relative">
        &copy; {new Date().getFullYear()} Wordins. Chat, create, and connect your way.
        <div className="flex justify-center gap-4 mt-2">
          <a href="https://github.com/sjsreehari" target="_blank" rel="noopener noreferrer" aria-label="GitHub" title="GitHub">
            <svg className="inline h-6 w-6 text-white hover:text-purple-300 transition" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.387.6.113.82-.263.82-.582 0-.288-.012-1.243-.017-2.25-3.338.726-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.729.083-.729 1.205.085 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.775.418-1.305.762-1.606-2.665-.304-5.466-1.334-5.466-5.933 0-1.31.468-2.382 1.236-3.222-.124-.303-.535-1.523.117-3.176 0 0 1.008-.322 3.3 1.23.96-.267 1.98-.399 3-.404 1.02.005 2.04.137 3 .404 2.29-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.873.12 3.176.77.84 1.235 1.912 1.235 3.222 0 4.61-2.803 5.625-5.475 5.922.43.37.823 1.102.823 2.222 0 1.606-.015 2.898-.015 3.293 0 .322.216.699.825.58C20.565 21.796 24 17.297 24 12c0-6.63-5.37-12-12-12z"/></svg>
          </a>
          <a href="https://www.linkedin.com/in/sreeharisj/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" title="LinkedIn">
            <svg className="inline h-6 w-6 text-white hover:text-blue-300 transition" fill="currentColor" viewBox="0 0 24 24"><path d="M19 0h-14c-2.76 0-5 2.24-5 5v14c0 2.76 2.24 5 5 5h14c2.76 0 5-2.24 5-5v-14c0-2.76-2.24-5-5-5zm-11 19h-3v-9h3v9zm-1.5-10.28c-.97 0-1.75-.79-1.75-1.75s.78-1.75 1.75-1.75 1.75.79 1.75 1.75-.78 1.75-1.75 1.75zm15.5 10.28h-3v-4.5c0-1.08-.02-2.47-1.5-2.47-1.5 0-1.73 1.17-1.73 2.39v4.58h-3v-9h2.89v1.23h.04c.4-.75 1.38-1.54 2.84-1.54 3.04 0 3.6 2 3.6 4.59v4.72z"/></svg>
          </a>
          <a href="https://www.instagram.com/sj_sreehari/?" target="_blank" rel="noopener noreferrer" aria-label="Instagram" title="Instagram">
            <svg className="inline h-6 w-6 text-white hover:text-pink-300 transition" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.334 3.608 1.308.974.974 1.246 2.241 1.308 3.608.058 1.266.069 1.646.069 4.85s-.011 3.584-.069 4.85c-.062 1.366-.334 2.633-1.308 3.608-.974.974-2.241 1.246-3.608 1.308-1.266.058-1.646.069-4.85.069s-3.584-.011-4.85-.069c-1.366-.062-2.633-.334-3.608-1.308-.974-.974-1.246-2.241-1.308-3.608C2.175 15.647 2.163 15.267 2.163 12s.012-3.584.07-4.85c.062-1.366.334-2.633 1.308-3.608.974-.974 2.241-1.246 3.608-1.308C8.416 2.175 8.796 2.163 12 2.163zm0-2.163C8.741 0 8.332.013 7.052.072 5.775.131 4.602.425 3.635 1.392 2.668 2.359 2.374 3.532 2.315 4.808 2.256 6.088 2.243 6.497 2.243 12c0 5.503.013 5.912.072 7.192.059 1.276.353 2.449 1.32 3.416.967.967 2.14 1.261 3.416 1.32 1.28.059 1.689.072 7.192.072s5.912-.013 7.192-.072c1.276-.059 2.449-.353 3.416-1.32.967-.967 1.261-2.14 1.32-3.416.059-1.28.072-1.689.072-7.192s-.013-5.912-.072-7.192c-.059-1.276-.353-2.449-1.32-3.416C21.449.425 20.276.131 19 .072 17.72.013 17.311 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zm0 10.162a3.999 3.999 0 1 1 0-7.998 3.999 3.999 0 0 1 0 7.998zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
          </a>
        </div>
      </footer>
    </div>
  );
}

export default Login;

/* Loader spinner for loading state */
// Add this to your CSS (e.g., index.css):
// .loader { border: 2px solid #e5e7eb; border-top: 2px solid #8b5cf6; border-radius: 50%; width: 1.25rem; height: 1.25rem; animation: spin 0.8s linear infinite; display: inline-block; vertical-align: middle; }
// @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
