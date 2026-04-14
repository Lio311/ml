"use client";
import { useState, useEffect } from 'react';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

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

  const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      checkSubscription();
    } else {
      setLoading(false);
    }
  }, []);

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

  if (!isSupported) return null;

  return (
    <div className="fixed bottom-24 right-6 z-50">
      <button
        onClick={subscription ? unsubscribe : subscribe}
        disabled={loading}
        className={`p-3 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center ${
          subscription 
            ? 'bg-white text-gray-800 hover:bg-gray-50 border border-gray-100' 
            : 'bg-black text-white hover:bg-gray-900'
        }`}
        title={subscription ? 'בטל התראות' : 'הפעל התראות'}
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : subscription ? (
          <Bell className="w-5 h-5 text-indigo-500 fill-indigo-500" />
        ) : (
          <Bell className="w-5 h-5" />
        )}
      </button>
      
      {/* Toast-like hint for new visitors */}
      {!subscription && !loading && !error && (
        <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-white px-4 py-2 rounded-xl shadow-xl border border-gray-100 whitespace-nowrap hidden md:block animate-in fade-in slide-in-from-right-2">
          <p className="text-xs font-bold text-gray-800">הפעל התראות על מוצרים חדשים 🔔</p>
        </div>
      )}
    </div>
  );
}
