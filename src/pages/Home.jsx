import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { db, auth } from "../firebase";
import { doc, getDoc, setDoc, collection, getDocs, updateDoc, onSnapshot, query, where } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useToast } from "../components/Toast";
import Button from '../components/Button';

function Home() {
  const [mode, setMode] = useState(null); // "create" or "join"
  const [roomName, setRoomName] = useState("");
  const [inviteOnly, setInviteOnly] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const navigate = useNavigate();
  const [recentRooms, setRecentRooms] = useState([]);
  const [search, setSearch] = useState("");
  const [recentRoomsMeta, setRecentRoomsMeta] = useState({});
  const [loadingAction, setLoadingAction] = useState("");
  const [logoutMsg, setLogoutMsg] = useState("");
  const [pendingJoin, setPendingJoin] = useState(false);
  const [pendingRequests, setPendingRequests] = useState({});
  const [sidebarLoading, setSidebarLoading] = useState(true);
  const toast = useToast();
  const [roomMenuOpen, setRoomMenuOpen] = useState(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef();
  const sidebarRef = useRef();

  const avatarList = [
    '/src/assets/avatar1.png',
    '/src/assets/avatar2.png',
    '/src/assets/avatar3.png',
    '/src/assets/avatar4.png',
    '/src/assets/avatar5.png',
    '/src/assets/avatar6.png',
    '/src/assets/avatar7.png',
    '/src/assets/avatar8.png',
  ];
  const [selectedAvatar, setSelectedAvatar] = useState(auth.currentUser?.photoURL || avatarList[0]);
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  // Fetch recent rooms from Firestore for the logged-in user
  useEffect(() => {
    setSidebarLoading(true);
    if (!auth.currentUser) return;
    const userRef = doc(db, "users", auth.currentUser.uid);
    const fetchRecent = async () => {
      const userSnap = await getDoc(userRef);
      let recent = [];
      if (userSnap.exists() && userSnap.data().recentRooms) {
        recent = userSnap.data().recentRooms;
      }
      setRecentRooms(recent);
      // Fetch meta for each room
      const meta = {};
      for (const room of recent) {
        const docRef = doc(db, "chatrooms", room.trim().toLowerCase());
        const snap = await getDoc(docRef);
        if (snap.exists()) meta[room] = snap.data();
      }
      setRecentRoomsMeta(meta);
    };
    fetchRecent();
    // Listen for changes
    const unsub = onSnapshot(userRef, (snap) => {
      setSidebarLoading(false);
      if (snap.exists() && snap.data().recentRooms) {
        setRecentRooms(snap.data().recentRooms);
      }
    });
    return () => unsub();
  }, [auth.currentUser]);

  useEffect(() => {
    if (!auth.currentUser) return;
    // For each recent room, check if user is a member or has a pending request
    const fetchPending = async () => {
      const pendings = {};
      for (const room of recentRooms) {
        const normalized = room.trim().toLowerCase();
        const docRef = doc(db, "chatrooms", normalized);
        const snap = await getDoc(docRef);
        if (!snap.exists()) continue;
        const data = snap.data();
        if (data.members && data.members.includes(auth.currentUser.uid)) {
          pendings[room] = false;
        } else {
          // Check join request
          const joinReqRef = doc(db, `chatrooms/${normalized}/joinRequests`, auth.currentUser.uid);
          const joinReqSnap = await getDoc(joinReqRef);
          if (joinReqSnap.exists() && joinReqSnap.data().status === "pending") {
            pendings[room] = true;
          } else {
            pendings[room] = false;
          }
        }
      }
      setPendingRequests(pendings);
    };
    fetchPending();
  }, [recentRooms, auth.currentUser]);

  // Listen for join request approval and update sidebar
  useEffect(() => {
    if (!auth.currentUser) return;
    const unsubscribes = [];
    recentRooms.forEach(room => {
      const normalized = room.trim().toLowerCase();
      const docRef = doc(db, "chatrooms", normalized);
      const unsub = onSnapshot(docRef, (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (data.members && data.members.includes(auth.currentUser.uid)) {
            // User is now a member, update pending state
            setPendingRequests(prev => ({ ...prev, [room]: false }));
          }
        }
      });
      unsubscribes.push(unsub);
    });
    return () => unsubscribes.forEach(unsub => unsub());
  }, [recentRooms, auth.currentUser]);

  const filteredRooms = recentRooms.filter(room => {
    const meta = recentRoomsMeta[room];
    if (!meta) return false;
    if (meta.members && meta.members.includes(auth.currentUser.uid)) return true;
    if (pendingRequests[room]) return true;
    return false;
  });

  const handleRecentJoin = (room) => {
    setRoomName(room);
    setMode("join");
  };

  // Helper to normalize room names for case-insensitive uniqueness
  const normalizeRoomName = (name) => name.trim().toLowerCase();

  // When creating or joining a room, update Firestore recentRooms for the user
  const updateRecentRooms = async (roomName) => {
    const userRef = doc(db, "users", auth.currentUser.uid);
    const userSnap = await getDoc(userRef);
    let recent = [];
    if (userSnap.exists() && userSnap.data().recentRooms) {
      recent = userSnap.data().recentRooms;
    }
    recent = [roomName.trim(), ...recent.filter(r => r !== roomName.trim())].slice(0, 10);
    await setDoc(userRef, { recentRooms: recent }, { merge: true });
  };

  const handleCreateRoom = async () => {
    setError("");
    setInfo("");
    setLoadingAction("creating");
    if (!roomName.trim() || roomName.trim().length < 8) {
      setError("Room name must be at least 8 characters.");
      toast.showToast("Room name must be at least 8 characters.", "error");
      setLoadingAction("");
      return;
    }
    try {
      const normalized = normalizeRoomName(roomName);
      const docRef = doc(db, "chatrooms", normalized);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setError("Room already exists. Try joining instead.");
        toast.showToast("Room already exists. Try joining instead.", "error");
      } else {
        await setDoc(docRef, {
          createdAt: Date.now(),
          roomName: roomName.trim(),
          inviteOnly,
          members: [auth.currentUser.uid],
          createdBy: auth.currentUser.uid,
        });
        // Wait for Firestore to confirm membership
        let confirmed = false;
        for (let i = 0; i < 10; i++) {
          const checkSnap = await getDoc(docRef);
          if (checkSnap.exists() && (checkSnap.data().members || []).includes(auth.currentUser.uid)) {
            confirmed = true;
            break;
          }
          await new Promise(res => setTimeout(res, 150));
        }
        if (!confirmed) {
          setError("Failed to confirm membership. Please try again.");
          setLoadingAction("");
          return;
        }
        await updateRecentRooms(roomName);
        toast.showToast("Room created!", "success");
        navigate(`/chat/${normalized}`);
      }
    } catch (err) {
      setError("Failed to create room.");
      toast.showToast("Failed to create room.", "error");
      setLoadingAction("");
      console.error("Error creating room:", err);
    }
    setLoadingAction("");
  };

  const handleSidebarJoin = async (room) => {
    setError("");
    setInfo("");
    setLoadingAction("joining");
    const meta = recentRoomsMeta[room];
    if (!meta) {
      setError("Room not found.");
      setLoadingAction("");
      return;
    }
    const isMember = meta.members && meta.members.includes(auth.currentUser.uid);
    if (isMember) {
      setInfo("You are already a member. Redirecting to chat...");
      toast.showToast("You are already a member.", "info");
      await updateRecentRooms(meta.roomName);
      navigate(`/chat/${room.trim().toLowerCase()}`);
      setLoadingAction("");
      return;
    }
    if (meta.inviteOnly) {
      // Check if already pending
      const joinReqRef = doc(db, `chatrooms/${room.trim().toLowerCase()}/joinRequests`, auth.currentUser.uid);
      const joinReqSnap = await getDoc(joinReqRef);
      if (joinReqSnap.exists() && joinReqSnap.data().status === "pending") {
        setInfo("Join request already sent. Please wait for approval.");
        toast.showToast("Join request already sent. Please wait for approval.", "info");
        setLoadingAction("");
        setPendingJoin(true);
        await updateRecentRooms(meta.roomName);
        return;
      }
      // Send join request
      try {
        await setDoc(joinReqRef, {
          userId: auth.currentUser.uid,
          requestedAt: Date.now(),
          status: "pending",
          displayName: auth.currentUser.displayName || "",
          photoURL: auth.currentUser.photoURL || "",
        });
        setInfo("Join request sent! Please wait for approval.");
        toast.showToast("Join request sent!", "info");
        setPendingJoin(true);
        await updateRecentRooms(meta.roomName);
      } catch (err) {
        setError("Failed to send join request: " + err.message);
        toast.showToast("Failed to send join request.", "error");
      }
      setLoadingAction("");
      return;
    }
    // Public room: join immediately
    setInfo("This is a public room. Adding you as a member...");
    toast.showToast("Joined public room!", "success");
    try {
      await setDoc(doc(db, "chatrooms", room.trim().toLowerCase()), { ...meta, members: [...(meta.members || []), auth.currentUser.uid] }, { merge: true });
      await updateRecentRooms(meta.roomName);
      navigate(`/chat/${room.trim().toLowerCase()}`);
    } catch (err) {
      setError("Failed to join room: " + err.message);
      toast.showToast("Failed to join room.", "error");
    }
    setLoadingAction("");
  };

  // Loading spinner component
  const LoadingSpinner = () => (
    <div className="flex justify-center items-center my-2">
      <svg className="animate-spin h-5 w-5 text-purple-600" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
      </svg>
    </div>
  );

  // Confirmation dialog for leaving a room
  const [confirmLeave, setConfirmLeave] = useState(null);

  // Add this function to handle the leave confirmation
  const confirmLeaveRoom = async () => {
    if (confirmLeave) {
      await handleLeaveRoom(confirmLeave);
      setConfirmLeave(null);
    }
  };

  // Leave room handler with confirmation
  const handleLeaveRoom = async (room) => {
    setError("");
    setInfo("");
    setLoadingAction("leaving");
    try {
      const normalized = room.trim().toLowerCase();
      const docRef = doc(db, "chatrooms", normalized);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        setError("Room not found.");
        setLoadingAction("");
        return;
      }
      const data = docSnap.data();
      const members = data.members || [];
      // Prevent creator from leaving their own room
      if (data.createdBy === auth.currentUser.uid) {
        setError("You are the creator of this room and cannot leave it.");
        setLoadingAction("");
        return;
      }
      if (!members.includes(auth.currentUser.uid)) {
        setError("You are not a member of this room.");
        setLoadingAction("");
        return;
      }
      const updatedMembers = members.filter(uid => uid !== auth.currentUser.uid);
      await updateDoc(docRef, { members: updatedMembers });
      // Remove from recentRooms
      const userRef = doc(db, "users", auth.currentUser.uid);
      const userSnap = await getDoc(userRef);
      let recent = [];
      if (userSnap.exists() && userSnap.data().recentRooms) {
        recent = userSnap.data().recentRooms.filter(r => r.trim().toLowerCase() !== normalized);
        await updateDoc(userRef, { recentRooms: recent });
      }
      setInfo("You have left the room.");
      setLoadingAction("");
      setRecentRooms(recent);
    } catch (err) {
      setError("Failed to leave room: " + err.message);
      setLoadingAction("");
      console.error("Error leaving room:", err);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setLogoutMsg("Logged out successfully.");
      setTimeout(() => setLogoutMsg(""), 2000);
      navigate("/"); // Redirect to the login page
    } catch (err) {
      setLogoutMsg("Error logging out. Please try again.");
      setTimeout(() => setLogoutMsg(""), 4000);
      console.error("Error logging out:", err);
    }
  };

  // Keyboard accessibility for room actions
  const handleKeyRoomAction = (e, action, room) => {
    if (e.key === 'Enter' || e.key === ' ') {
      action(room);
    }
  };

  // Fallback for missing user info
  const userDisplayName = auth.currentUser?.displayName || 'Anonymous';
  const userPhotoURL = auth.currentUser?.photoURL || '';

  // Check for authentication before Firestore actions
  if (!auth.currentUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4 w-full max-w-md text-center">
          You are not authenticated. Please log in.
        </div>
      </div>
    );
  }

  // Redirect to login page if user is not authenticated
  useEffect(() => {
    if (!auth.currentUser) {
      navigate("/", { replace: true });
    }
  }, []);

  // Cancel join request
  const cancelJoinRequest = async (room) => {
    setError("");
    setInfo("");
    setLoadingAction("cancelling");
    try {
      const normalized = room.trim().toLowerCase();
      const joinReqRef = doc(db, `chatrooms/${normalized}/joinRequests`, auth.currentUser.uid);
      await setDoc(joinReqRef, { status: "cancelled" }, { merge: true });
      setInfo("Join request cancelled.");
      setPendingJoin(false);
    } catch (err) {
      setError("Failed to cancel join request: " + err.message);
    }
    setLoadingAction("");
  };

  // See pending join requests as owner
  const [ownerRequests, setOwnerRequests] = useState([]);
  useEffect(() => {
    const fetchOwnerRequests = async () => {
      if (!auth.currentUser) return;
      // Find rooms where user is a member
      const chatroomsSnap = await getDocs(collection(db, "chatrooms"));
      for (const docSnap of chatroomsSnap.docs) {
        const data = docSnap.data();
        if (data.members && data.members.includes(auth.currentUser.uid)) {
          // Fetch join requests for this room
          const joinReqsSnap = await getDocs(collection(db, `chatrooms/${docSnap.id}/joinRequests`));
          joinReqsSnap.forEach(reqSnap => {
            const reqData = reqSnap.data();
            if (reqData.status === "pending") {
              setOwnerRequests(prev => [...prev, { ...reqData, roomId: docSnap.id, userId: reqSnap.id }]);
            }
          });
        }
      }
    };
    setOwnerRequests([]);
    fetchOwnerRequests();
  }, [auth.currentUser]);

  // Approve/reject join requests as owner
  const handleApproveRequest = async (roomId, userId) => {
    try {
      const joinReqRef = doc(db, `chatrooms/${roomId}/joinRequests`, userId);
      await setDoc(joinReqRef, { status: "approved" }, { merge: true });
      // Add user to members
      const roomRef = doc(db, "chatrooms", roomId);
      const roomSnap = await getDoc(roomRef);
      if (roomSnap.exists()) {
        const data = roomSnap.data();
        const members = data.members || [];
        if (!members.includes(userId)) {
          await updateDoc(roomRef, { members: [...members, userId] });
        }
      }
      setInfo("User approved and added to room.");
    } catch (err) {
      setError("Failed to approve request: " + err.message);
    }
  };
  const handleRejectRequest = async (roomId, userId) => {
    try {
      const joinReqRef = doc(db, `chatrooms/${roomId}/joinRequests`, userId);
      await setDoc(joinReqRef, { status: "rejected" }, { merge: true });
      setInfo("User join request rejected.");
    } catch (err) {
      setError("Failed to reject request: " + err.message);
    }
  };

  // See who is in a room before joining
  const [roomPreview, setRoomPreview] = useState(null);
  const previewRoom = async (room) => {
    setRoomPreview(null);
    const normalized = room.trim().toLowerCase();
    const docRef = doc(db, "chatrooms", normalized);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      setRoomPreview(docSnap.data());
    }
  };

  // Add useEffect to close profile menu on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    }
    if (profileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [profileMenuOpen]);

  // Add useEffect to close room menu on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        setRoomMenuOpen(null);
      }
    }
    if (roomMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [roomMenuOpen]);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Sidebar for recent rooms */}
      <aside ref={sidebarRef} className="w-full md:w-80 bg-white shadow-lg md:rounded-r-3xl flex flex-col items-center py-8 px-4 md:px-6 mb-4 md:mb-0 overflow-y-auto max-h-screen border-r border-gray-200">
        <h2 className="text-2xl font-bold mb-4 text-purple-700">Recent Rooms</h2>
        <div className="w-full mb-4">
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search..."
            className={`w-full px-3 py-2 rounded border ${error ? 'border-red-400' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-500`}
            aria-label="Search rooms"
            tabIndex={0}
          />
        </div>
        {sidebarLoading && <LoadingSpinner />}
        {filteredRooms.length === 0 && !sidebarLoading && (
          <div className="text-gray-500 text-center my-8 flex flex-col items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <circle cx="12" cy="12" r="10" stroke="#a78bfa" strokeWidth="2" fill="#f3e8ff" />
              <text x="50%" y="55%" textAnchor="middle" fill="#a78bfa" fontSize="24" fontFamily="Arial" dy=".3em">💬</text>
            </svg>
            No recent rooms found.
          </div>
        )}
        <ul className="w-full space-y-2">
          {filteredRooms.map(room => (
            <li key={room} className="flex items-center justify-between bg-purple-50 rounded px-3 py-2 relative transition duration-200 ease-in-out hover:scale-105 hover:bg-purple-100">
              <button
                className="truncate flex items-center gap-1 text-left focus:outline-none focus:ring-2 focus:ring-purple-400 w-full"
                title={room}
                style={{ maxWidth: 'calc(100% - 40px)' }}
                onClick={() => handleSidebarJoin(room)}
                tabIndex={0}
                aria-label={`Open or join ${room}`}
              >
                {recentRoomsMeta[room]?.inviteOnly && (
                  <span title="Invite Only" className="text-purple-400" aria-label="Invite Only Room">🔒</span>
                )}
                {room}
              </button>
              <button
                className="ml-2 p-2 rounded-full hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
                aria-label={`Show actions for ${room}`}
                onClick={() => setRoomMenuOpen(roomMenuOpen === room ? null : room)}
                tabIndex={0}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/></svg>
              </button>
              {roomMenuOpen === room && (
                <div className="absolute right-0 top-10 bg-white border border-gray-200 rounded-lg shadow-lg z-50 flex flex-col min-w-[120px]">
                  <Button
                    onClick={() => { handleLeaveRoom(room); setRoomMenuOpen(null); }}
                    ariaLabel={`Leave ${room}`}
                    disabled={loadingAction === "leaving" || !(recentRoomsMeta[room]?.members || []).includes(auth.currentUser.uid)}
                    className="rounded-none text-left justify-start px-4 py-2"
                    tabIndex={0}
                  >
                    Leave
                  </Button>
                  <Button
                    onClick={() => { previewRoom(room); setRoomMenuOpen(null); }}
                    ariaLabel={`Preview ${room}`}
                    className="rounded-none text-left justify-start px-4 py-2"
                    tabIndex={0}
                  >
                    Info
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
        {/* Confirmation dialog for leaving a room */}
        {confirmLeave && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full relative flex flex-col items-center">
              <button
                className="absolute top-3 right-3 text-gray-400 hover:text-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-400 rounded-full z-10"
                aria-label="Close leave confirmation"
                style={{ background: 'white', padding: 2 }}
                onClick={() => setConfirmLeave(null)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
              <h3 className="text-lg font-bold mb-2">Leave Room</h3>
              <p className="mb-4">Are you sure you want to leave <span className="font-semibold">{confirmLeave}</span>?</p>
              <div className="flex justify-end gap-2 w-full">
                <Button className="bg-gray-200 text-gray-700" onClick={() => setConfirmLeave(null)}>Cancel</Button>
                <Button className="bg-red-500 hover:bg-red-600" onClick={confirmLeaveRoom}>Leave</Button>
              </div>
            </div>
          </div>
        )}
      </aside>
      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6">
        {/* Error/info messages */}
        {(error || info || logoutMsg) && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4">
            <div className={`p-3 rounded-lg shadow text-center text-sm font-medium border animate-fade-in-up ${error ? 'bg-red-50 text-red-700 border-red-200' : info ? 'bg-green-50 text-green-700 border-green-200' : 'bg-purple-50 text-purple-700 border-purple-200'}`}
              aria-live="assertive">
              {error || info || logoutMsg}
            </div>
          </div>
        )}
        {loadingAction && <LoadingSpinner />}
        {/* Room preview modal */}
        {roomPreview && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full relative flex flex-col items-center">
              <button
                className="absolute top-3 right-3 text-gray-400 hover:text-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-400 rounded-full z-10"
                aria-label="Close room info"
                style={{ background: 'white', padding: 2 }}
                onClick={() => setRoomPreview(null)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
              <h3 className="text-lg font-bold mb-2 flex items-center gap-2">Room Info {roomPreview?.inviteOnly && <span title="Invite Only" className="text-purple-400">🔒</span>}</h3>
              <p><b>Name:</b> {roomPreview.roomName}</p>
              <p><b>Members:</b> {roomPreview.members?.length || 0}</p>
              <p><b>Invite Only:</b> {roomPreview.inviteOnly ? 'Yes' : 'No'}</p>
            </div>
          </div>
        )}
        {/* Owner join requests UI */}
        {ownerRequests.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-400 text-yellow-800 px-4 py-2 rounded mb-4 w-full max-w-md">
            <h4 className="font-bold mb-2">Pending Join Requests</h4>
            <ul>
              {ownerRequests.map(req => (
                <li key={req.userId + req.roomId} className="flex justify-between items-center mb-1">
                  <span>{req.displayName || req.userId} for <b>{req.roomId}</b></span>
                  <div className="flex gap-2">
                    <button className="text-green-600 hover:underline" onClick={() => handleApproveRequest(req.roomId, req.userId)}>Approve</button>
                    <button className="text-red-600 hover:underline" onClick={() => handleRejectRequest(req.roomId, req.userId)}>Reject</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
        {/* Welcome header at the top */}
        <h1 className="text-4xl font-extrabold text-center mb-8 text-purple-700 tracking-tight">Welcome to Wordins 🚀</h1>
        {/* Feature boxes side by side on desktop, stacked on mobile */}
        <div className="w-full flex flex-col md:flex-row gap-8 items-stretch justify-center">
          {/* First box: Chat with your friends */}
          <div className="flex-1 bg-white rounded-3xl shadow-xl p-8 relative flex flex-col items-center mb-8 md:mb-0">
            <h2 className="text-2xl font-bold text-center mb-6 text-purple-700">Chat with your friends</h2>
            {/* Move the profile section to the top right corner of the page */}
            <div className="fixed top-6 right-8 z-50" ref={profileMenuRef}>
              <button
                className="flex items-center gap-2 px-3 py-2 bg-white rounded-full shadow hover:bg-purple-50 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
                onClick={() => setProfileMenuOpen((open) => !open)}
                aria-label="Open profile menu"
              >
                {selectedAvatar ? (
                  <img src={selectedAvatar} alt="Profile" className="h-8 w-8 rounded-full border" />
                ) : (
                  <span className="h-8 w-8 rounded-full bg-purple-200 flex items-center justify-center text-lg font-bold text-purple-700">{userDisplayName[0]}</span>
                )}
                <span className="font-semibold text-purple-700 max-w-[120px] truncate">{userDisplayName}</span>
              </button>
              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50 flex flex-col p-4">
                  <div className="flex flex-col items-center mb-3">
                    {selectedAvatar ? (
                      <img src={selectedAvatar} alt="Profile" className="h-14 w-14 rounded-full border mb-2" />
                    ) : (
                      <span className="h-14 w-14 rounded-full bg-purple-200 flex items-center justify-center text-2xl font-bold text-purple-700 mb-2">{userDisplayName[0]}</span>
                    )}
                    <span className="font-bold text-lg text-purple-700">{userDisplayName}</span>
                    <span className="text-gray-500 text-sm mt-1">{auth.currentUser?.email || "No email"}</span>
                    <span className="text-gray-400 text-xs mt-1 italic">Bio: Coming soon</span>
                  </div>
                  <Button className="w-full bg-blue-500 hover:bg-blue-600 mb-2" onClick={() => setShowAvatarModal(true)} ariaLabel="Edit profile">Edit Profile</Button>
                  <Button className="w-full bg-red-500 hover:bg-red-600" onClick={handleLogout} ariaLabel="Log out">Log Out</Button>
                </div>
              )}
            </div>
            {/* Existing create/join room UI */}
            {!mode && (
              <div className="flex flex-col items-center gap-4 w-full">
                <Button
                  onClick={() => setMode("create")}
                  loading={loadingAction === 'creating'}
                  ariaLabel="Create room"
                >
                  Create Chat Room
                </Button>
                <Button
                  onClick={() => setMode("join")}
                  loading={loadingAction === 'joining' || pendingJoin}
                  ariaLabel="Join room"
                >
                  Join Chat Room
                </Button>
              </div>
            )}
            {mode === "create" && (
              <div className="flex flex-col items-center gap-4 w-full mt-4">
                <input
                  type="text"
                  placeholder="Enter Room Name (min 8 chars)"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 w-full"
                  aria-label="Room name"
                />
                <label className="flex items-center gap-2 w-full">
                  <input
                    type="checkbox"
                    checked={inviteOnly}
                    onChange={e => setInviteOnly(e.target.checked)}
                    className="form-checkbox h-5 w-5 text-purple-600"
                    aria-label="Invite only room"
                  />
                  <span className="text-gray-700">Invite Only Room</span>
                </label>
                <Button
                  onClick={handleCreateRoom}
                  loading={loadingAction === 'creating'}
                  ariaLabel="Create room"
                >
                  {loadingAction === "creating" ? (
                    <span className="flex items-center gap-2"><span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span> Creating...</span>
                  ) : "Create Room"}
                </Button>
              </div>
            )}
            {mode === "join" && (
              <div className="flex flex-col items-center gap-4 w-full mt-4">
                <input
                  type="text"
                  placeholder="Enter Room Name"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 w-full"
                  aria-label="Room name"
                />
                <Button
                  onClick={handleSidebarJoin}
                  loading={loadingAction === 'joining' || pendingJoin}
                  ariaLabel="Join room"
                >
                  {loadingAction === "joining" ? (
                    <span className="flex items-center gap-2"><span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span> Joining...</span>
                  ) : pendingJoin ? (
                    <span className="flex items-center gap-2">Request Pending...</span>
                  ) : "Join Room"}
                </Button>
                {info && <div className="bg-blue-50 text-blue-700 p-2 rounded-lg mt-2 w-full text-center">{info}</div>}
              </div>
            )}
          </div>
          {/* Second box: GameChat */}
          <div className="flex-1 bg-white rounded-3xl shadow-xl p-8 relative flex flex-col items-center mb-8 md:mb-0">
            <h2 className="text-2xl font-bold text-center mb-6 text-purple-700">GameChat</h2>
            <Button className="w-full text-lg py-4" ariaLabel="Start GameChat" onClick={() => navigate('/gamechat')}>Start</Button>
          </div>
        </div>
        {/* Avatar selection modal */}
        {showAvatarModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md relative flex flex-col items-center">
              <button
                onClick={() => setShowAvatarModal(false)}
                className="absolute top-3 right-3 text-gray-400 hover:text-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-400 rounded-full z-10"
                aria-label="Close avatar selection"
                style={{ background: 'white', padding: 2 }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
              <h2 className="text-lg font-bold mb-4 text-purple-700">Choose Your Avatar</h2>
              <div className="grid grid-cols-3 gap-4 mb-4">
                {avatarList.map((src, idx) => (
                  <button key={src} onClick={() => { setSelectedAvatar(src); setShowAvatarModal(false); }} className={`rounded-full border-2 ${selectedAvatar === src ? 'border-purple-500' : 'border-transparent'} focus:outline-none focus:ring-2 focus:ring-purple-400`} aria-label={`Select avatar ${idx+1}`}>
                    <img src={src} alt={`Avatar ${idx+1}`} className="h-16 w-16 rounded-full" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default Home;
