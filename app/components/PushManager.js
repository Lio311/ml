"use client";
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Bell, BellOff, Loader2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useUser } from '@clerk/nextjs';

// Helper to convert base64 to Uint8Array for VAPID key
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function PushManager() {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const { user, isLoaded } = useUser();
  const pathname = usePathname();

  const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  useEffect(() => {
    const checkDismissal = async () => {
      let dismissedAt = localStorage.getItem('push_dismissed_at');
      
      if (isLoaded && user) {
        try {
          const res = await fetch('/api/user/preferences');
          if (res.ok) {
            const data = await res.json();
            if (data.preferences?.push_dismissed_at) {
              dismissedAt = data.preferences.push_dismissed_at;
              localStorage.setItem('push_dismissed_at', dismissedAt);
            }
          }
        } catch (e) {
          console.error("Failed to fetch preferences", e);
        }
      }

      if (dismissedAt) {
        const thirtyDays = 30 * 24 * 60 * 60 * 1000;
        if (Date.now() - new Date(dismissedAt).getTime() < thirtyDays) {
          setIsDismissed(true);
        }
      }
    };

    checkDismissal();

    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      checkSubscription();
    } else {
      setLoading(false);
    }
  }, [isLoaded, user]);

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.getSubscription();
      setSubscription(sub);
    } catch (err) {
      console.error('Failed to get subscription', err);
    } finally {
      setLoading(false);
    }
  };

  const subscribe = async () => {
    if (!VAPID_PUBLIC_KEY) {
      toast.error('שגיאת הגדרה: חסר מפתח VAPID');
      return;
    }

    setLoading(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Permission not granted');
      }

      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      });

      // Send to server
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          subscription: sub,
          userAgent: navigator.userAgent
        })
      });

      if (!res.ok) throw new Error('Failed to save on server');

      setSubscription(sub);
      toast.success('התראות הופעלו בהצלחה!');
    } catch (err) {
      console.error('Subscription failed', err);
      toast.error('לא ניתן היה להפעיל התראות');
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const unsubscribe = async () => {
    setLoading(true);
    try {
      if (subscription) {
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription })
        });
        await subscription.unsubscribe();
      }
      setSubscription(null);
      toast.success('התראות בוטלו');
    } catch (err) {
      console.error('Unsubscription failed', err);
      toast.error('ביטול ההתראות נכשל');
    } finally {
      setLoading(false);
    }
  };

  // Hide in Admin or if already subscribed or dismissed
  if (!isSupported) return null;
  if (pathname?.startsWith('/admin')) return null;
  if (subscription || isDismissed) return null;

  const handleDismiss = async (e) => {
    e.stopPropagation();
    setIsDismissed(true);
    const now = new Date().toISOString();
    localStorage.setItem('push_dismissed_at', now);
    
    if (isLoaded && user) {
        try {
            await fetch('/api/user/preferences', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    preferences: { push_dismissed_at: now }
                })
            });
        } catch (error) {
            console.error("Failed to save preference", error);
        }
    }
  };

  return (
    <div className="fixed bottom-24 left-6 z-[9998] flex flex-col items-center group">
       {/* Close Button (X) */}
       <button 
        onClick={handleDismiss}
        className="absolute -top-2 -right-2 bg-gray-100 text-gray-400 rounded-full p-1 hover:bg-red-500 hover:text-white transition-all shadow-sm z-20 opacity-0 group-hover:opacity-100"
        title="הסתר"
      >
        <X size={10} />
      </button>

      {/* Floating Bell Button */}
      <button
        onClick={subscribe}
        disabled={loading}
        className={`p-4 rounded-full shadow-2xl transition-all duration-500 hover:scale-110 active:scale-95 bg-black text-white flex items-center justify-center`}
        title="הפעל התראות"
      >
        {loading ? (
          <Loader2 className="w-6 h-6 animate-spin text-white" />
        ) : (
          <Bell className="w-6 h-6 text-white animate-ring" />
        )}
      </button>
      
      {/* Toast-like hint for new visitors */}
      {!loading && !error && (
        <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 bg-black text-white px-4 py-2 rounded-2xl shadow-2xl border border-gray-800 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-300 translate-x-[-10px] group-hover:translate-x-0">
          <div className="relative font-bold text-sm">
            הפעל התראות לקבלת עדכונים
            <div className="absolute top-1/2 -left-2 -translate-y-1/2 w-2 h-2 bg-black transform rotate-45"></div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes ring {
          0% { transform: rotate(0); }
          10% { transform: rotate(15deg); }
          20% { transform: rotate(-15deg); }
          30% { transform: rotate(10deg); }
          40% { transform: rotate(-10deg); }
          50% { transform: rotate(0); }
          100% { transform: rotate(0); }
        }
        .animate-ring {
          animation: ring 2s infinite;
        }
      `}</style>
    </div>
  );
}
