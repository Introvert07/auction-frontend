import { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_BASE, socket } from '../api';
import { fmt } from '../utils/format';

// ---------------------------------------------------------------------------
// All state, DB fetches, and socket wiring for the auction, in one hook.
// App.jsx just calls this and passes the values down to the routed pages.
// ---------------------------------------------------------------------------
export default function useAuctionSocket() {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('auction_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [components, setComponents] = useState([]);
  const [componentsLoaded, setComponentsLoaded] = useState(false); // tracks whether the first /api/components fetch has actually finished
  const [teams, setTeams] = useState([]);
  const [activeItemId, setActiveItemId] = useState(null);
  const [timerEndsAt, setTimerEndsAt] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const [bidIncrement, setBidIncrement] = useState(200000);
  const [connected, setConnected] = useState(socket.connected);
  const [btnLoading, setBtnLoading] = useState(null);
  // FIX: true once we've heard back (success or failure) from the very first
  // /api/user/:id hydration call, so the UI can avoid flashing a stale/default
  // purse & squad from localStorage before the DB truth arrives.
  const [userHydrated, setUserHydrated] = useState(false);

  // Refs to avoid stale closures in socket callbacks
  const userRef = useRef(user);
  userRef.current = user;
  const activeItemIdRef = useRef(activeItemId);
  activeItemIdRef.current = activeItemId;

  // FIX (root cause of "squad empty / purse full on refresh"): localStorage is
  // now treated as just a cache of {_id, sessionToken}. The moment the app
  // mounts (or reconnects), we ask the DB directly for this user's current
  // purse/squad/isAdmin and overwrite whatever was cached locally. Previously
  // the only re-sync path was fetchLeaderboard, which excludes admins entirely
  // and only fires after other fetches — this hits the DB directly and first.
  const fetchUser = useCallback(async (userId) => {
    try {
      const res = await axios.get(`${API_BASE}/api/user/${userId}`);
      setUser((prev) => {
        if (!prev) return prev;
        const updated = { ...prev, ...res.data };
        localStorage.setItem('auction_user', JSON.stringify(updated));
        return updated;
      });
    } catch (e) {
      if (e.response?.status === 404) {
        // The room was reset/restarted and this user no longer exists in the DB.
        // Don't keep showing a stale cached squad/purse — log them out cleanly.
        localStorage.removeItem('auction_user');
        setUser(null);
        toast.error('Your session is no longer valid — please rejoin.');
      } else {
        console.error('User fetch failed:', e);
      }
    } finally {
      setUserHydrated(true);
    }
  }, []);

  const fetchLeaderboard = useCallback(async (sessionToken) => {
    try {
      const res = await axios.get(`${API_BASE}/api/leaderboard/${sessionToken}`);
      setTeams(res.data.sort((a, b) => b.purse - a.purse));

      // Update the current user's local purse/squad from server truth
      const me = res.data.find((x) => x._id === userRef.current?._id);
      if (me) {
        setUser((prev) => {
          if (!prev) return prev;
          const updated = { ...prev, purse: me.purse, squad: me.squad };
          localStorage.setItem('auction_user', JSON.stringify(updated));
          return updated;
        });
      }
    } catch (e) {
      console.error('Leaderboard fetch failed:', e);
    }
  }, []);

  const fetchComponents = useCallback(async (sessionToken) => {
    try {
      const res = await axios.get(`${API_BASE}/api/components/${sessionToken}`);
      setComponents(res.data);
    } catch (e) {
      console.error('Components fetch failed:', e);
    } finally {
      setComponentsLoaded(true); // mark loaded whether it succeeded or failed, so the Admin panel stops waiting
    }
  }, []);

  // Socket event wiring
  useEffect(() => {
    if (!user) return;

    fetchUser(user._id);
    fetchComponents(user.sessionToken);
    fetchLeaderboard(user.sessionToken);

    const joinRoom = () => socket.emit('join_room', user.sessionToken);
    joinRoom();

    const onConnect = () => {
      setConnected(true);
      joinRoom();
      // Re-fetch everything on reconnect — DB truth wins over whatever we had
      fetchUser(user._id);
      fetchComponents(user.sessionToken);
      fetchLeaderboard(user.sessionToken);
    };
    const onDisconnect = () => setConnected(false);

    const onSyncState = ({ activeItemId: aid, bidIncrement: bi, timerEndsAt: te }) => {
      setActiveItemId(aid || null);
      setBidIncrement(bi || 200000);
      setTimerEndsAt(te || null);
    };

    const onNewItemLive = ({ itemId, timerEndsAt: te }) => {
      setActiveItemId(itemId);
      setTimerEndsAt(te);
      fetchComponents(user.sessionToken);
      toast('New item is LIVE! 🔥', { icon: '⚡', duration: 3000 });
    };

    // Patch just the changed item — keeps it snappy
    const onBidUpdated = ({ componentId, currentBid, highestBidderName, highestBidderId }) => {
      setComponents((prev) =>
        prev.map((c) =>
          c._id === componentId
            ? { ...c, currentBid, highestBidderName, highestBidder: highestBidderId }
            : c
        )
      );
    };

    const onBidRejected = ({ reason }) => {
      toast.error(reason || 'Bid rejected');
      setBtnLoading(null);
    };

    const onItemSold = (data) => {
      if (!data.componentId || data.componentId === activeItemIdRef.current) {
        setActiveItemId(null);
        setTimerEndsAt(null);
      }
      fetchComponents(user.sessionToken);
      fetchLeaderboard(user.sessionToken);
      toast.success(`${data.winnerName} bought ${data.itemName} for ${fmt(data.price)}!`, { duration: 5000 });
    };

    const onItemSkipped = () => {
      setActiveItemId(null);
      setTimerEndsAt(null);
      fetchComponents(user.sessionToken);
    };

    const onIncrementUpdated = (amt) => setBidIncrement(amt);

    const onRoomReset = () => {
      setActiveItemId(null);
      setTimerEndsAt(null);
      fetchComponents(user.sessionToken);
      fetchLeaderboard(user.sessionToken);
      toast('Room has been reset by the admin 🔄', { duration: 4000 });
    };

    const onTeamJoined = () => {
      fetchLeaderboard(user.sessionToken);
    };

    const onTimerPaused = () => {
      setTimerEndsAt(null);
      toast('Timer paused ⏸️', { duration: 2000 });
    };

    const onTimerResumed = ({ timerEndsAt: te }) => {
      setTimerEndsAt(te);
      toast('Timer resumed ▶️', { duration: 2000 });
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('sync_state', onSyncState);
    socket.on('new_item_live', onNewItemLive);
    socket.on('bid_updated', onBidUpdated);
    socket.on('bid_rejected', onBidRejected);
    socket.on('item_sold', onItemSold);
    socket.on('item_skipped', onItemSkipped);
    socket.on('increment_updated', onIncrementUpdated);
    socket.on('room_reset', onRoomReset);
    socket.on('team_joined', onTeamJoined);
    socket.on('timer_paused', onTimerPaused);
    socket.on('timer_resumed', onTimerResumed);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('sync_state', onSyncState);
      socket.off('new_item_live', onNewItemLive);
      socket.off('bid_updated', onBidUpdated);
      socket.off('bid_rejected', onBidRejected);
      socket.off('item_sold', onItemSold);
      socket.off('item_skipped', onItemSkipped);
      socket.off('increment_updated', onIncrementUpdated);
      socket.off('room_reset', onRoomReset);
      socket.off('team_joined', onTeamJoined);
      socket.off('timer_paused', onTimerPaused);
      socket.off('timer_resumed', onTimerResumed);
    };
  }, [user?.sessionToken, user?._id, fetchUser, fetchComponents, fetchLeaderboard]);

  // Local countdown timer
  useEffect(() => {
    if (!timerEndsAt) {
      setTimeLeft(null);
      return;
    }
    const tick = () => {
      const remaining = Math.max(0, Math.round((new Date(timerEndsAt) - Date.now()) / 1000));
      setTimeLeft(remaining);
    };
    tick();
    const id = setInterval(tick, 250); // tick 4x/sec for smoother UX
    return () => clearInterval(id);
  }, [timerEndsAt]);

  // Action handler with loading state + auto-clear
  const handleAction = useCallback((action, payload, id) => {
    setBtnLoading(id);
    socket.emit(action, payload);
    // Auto-clear loading after a timeout in case no response
    setTimeout(() => setBtnLoading((cur) => (cur === id ? null : cur)), 3000);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('auction_user');
    setUser(null);
    setComponents([]);
    setTeams([]);
    setActiveItemId(null);
    setTimerEndsAt(null);
    window.location.href = '/';
  }, []);

  return {
    user, setUser,
    components, componentsLoaded,
    teams,
    activeItemId, timerEndsAt, timeLeft, bidIncrement,
    connected, btnLoading, userHydrated,
    handleAction, logout,
  };
}
