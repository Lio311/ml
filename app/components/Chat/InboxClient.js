"use client";

import { useState, useEffect, useRef } from 'react';
import { Reply, User as UserIcon, Loader2, MessageSquare, Search, Store, Package, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import toast from 'react-hot-toast';
import Link from 'next/link';
import OrderStatusTimeline from '../OrderStatusTimeline';

export default function InboxClient({ role = 'buyer', catalogId = null, preSelectConversationWith = null, initialOrderId = null, initialCatalogId = null }) {
    const { user, isLoaded } = useUser();
    const [conversations, setConversations] = useState([]);
    const [orders, setOrders] = useState([]);
    const [messages, setMessages] = useState([]);
    const [activeConvId, setActiveConvId] = useState(null);
    const [newMessage, setNewMessage] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [orderData, setOrderData] = useState({}); // Cache for order details
    const [isLoadingOrder, setIsLoadingOrder] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [catalogsData, setCatalogsData] = useState({});
    const [otherParticipantStatus, setOtherParticipantStatus] = useState(null);
    const [hasSubmittedReview, setHasSubmittedReview] = useState({}); // orderId -> boolean
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (!isLoaded || !user) return;
        const loadInitialData = async () => {
            if (role === 'buyer') {
                try {
                    const res = await fetch('/api/user/orders');
                    if (res.ok) {
                        const data = await res.json();
                        if (Array.isArray(data)) setOrders(data);
                    }
                } catch(e) {}
            }
            // Fetch catalog info for icons/names if needed
            try {
                const catRes = await fetch('/api/catalogs-info');
                if (catRes.ok) {
                    const cData = await catRes.json();
                    if (Array.isArray(cData)) {
                        const map = {};
                        cData.forEach(c => map[c.id] = c);
                        setCatalogsData(map);
                    }
                }
            } catch(e) {}
            
            await fetchConversations(true);
        };
        loadInitialData();
        
        const interval = setInterval(() => fetchConversations(), 10000); // Poll inbox list every 10s
        return () => clearInterval(interval);
    }, [isLoaded, user]);

    useEffect(() => {
        // Initial scroll to bottom when messages first load
        if (messages.length > 0 && activeConvId && !String(activeConvId).startsWith('order_')) {
            scrollToBottom();
            
            // For admin/seller, we don't mark as read immediately on click
            // We'll do it via scroll or if they are already at the bottom
            if (role === 'buyer') {
                markAsRead(activeConvId);
            }
        }
    }, [activeConvId]);

    useEffect(() => {
        if (activeConvId && activeConvId !== 'new' && activeConvId !== 'general' && !String(activeConvId).startsWith('order_')) {
            fetchMessages(activeConvId);
            const interval = setInterval(() => fetchMessages(activeConvId, true), 5000); // Poll every 5s
            return () => clearInterval(interval);
        } else {
            setMessages([]); // Clear messages for placeholder chats
        }
    }, [activeConvId]);

    const fetchConversations = async (isInitial = false) => {
        try {
            let url = '/api/inbox';
            if (role === 'admin') url += '?as_admin=true';
            if (role === 'seller' && catalogId) url += `?catalog_id=${catalogId}`;

            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setConversations(data);
                
                if (isInitial) {
                    if (initialOrderId) {
                        const existingConv = data.find(c => String(c.order_id) === String(initialOrderId));
                        if (existingConv) setActiveConvId(existingConv.id);
                        else setActiveConvId(`order_${initialOrderId}`);
                    } else if (data.length > 0) {
                        setActiveConvId(data[0].id);
                    } else if (role === 'buyer') {
                        // Default to general contact if no conversations and no initial order ID
                        setActiveConvId('general');
                    }
                }
            }
        } catch (error) {
            console.error("Failed to fetch conversations", error);
        } finally {
            setIsLoading(false);
        }
    };

    const markAsRead = async (convId) => {
        if (!convId || convId === 'new' || String(convId).startsWith('order_')) return;
        try {
            await fetch(`/api/inbox/${convId}/read`, { method: 'PATCH' });
            // Update counts locally
            setConversations(prev => prev.map(c => 
                c.id === convId ? { ...c, unread_count: 0 } : c
            ));
        } catch (err) {
            console.error("Failed to mark as read", err);
        }
    };

    const fetchOrderDetails = async (orderId) => {
        if (!orderId || orderData[orderId]) return;
        setIsLoadingOrder(true);
        try {
            const res = await fetch(`/api/orders/${orderId}`);
            if (res.ok) {
                const data = await res.json();
                setOrderData(prev => ({ ...prev, [orderId]: data }));
                
                // Also check if review exists for this order
                if (role === 'buyer') {
                    const revRes = await fetch(`/api/reviews/status?orderId=${orderId}`);
                    if (revRes.ok) {
                        const { exists } = await revRes.json();
                        setHasSubmittedReview(prev => ({ ...prev, [orderId]: exists }));
                    }
                }
            }
        } catch (error) {
            console.error("Failed to fetch order details", error);
        } finally {
            setIsLoadingOrder(false);
        }
    };

    const fetchMessages = async (convId, isPolling = false) => {
        if (convId === 'new') return;
        
        // Find conversation in displays to see if it holds an order
        const conv = displayConversations.find(c => c.id === convId);
        if (conv?.order_id && !isPolling) {
            fetchOrderDetails(conv.order_id);
        }

        try {
            const res = await fetch(`/api/inbox/${convId}/messages`);
            if (res.ok) {
                const data = await res.json();
                if (data.messages) {
                    setMessages(data.messages);
                    setOtherParticipantStatus(data.other_participant || null);
                } else {
                    setMessages(data); // Fallback for old API if any
                }
                
                // Only mark as read if NOT polling
                if (!isPolling) {
                    fetch(`/api/inbox/${convId}/read`, { method: 'PATCH' });
                    
                    // Update unread count locally
                    setConversations(prev => prev.map(c => 
                        c.id === convId ? { ...c, unread_count: 0 } : c
                    ));
                }
            }
        } catch (error) {
            console.error("Failed to fetch messages", error);
        }
    };

    const getActiveDisplayConv = () => {
        return displayConversations.find(c => c.id === activeConvId);
    };

    const handleScroll = (e) => {
        if (role === 'buyer') return;
        
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        // If close to bottom (within 50px)
        if (scrollHeight - scrollTop - clientHeight < 50) {
            if (activeConvId && activeConvId !== 'new' && !String(activeConvId).startsWith('order_')) {
                markAsRead(activeConvId);
            }
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        setIsSending(true);
        try {
            const activeDispConv = getActiveDisplayConv();
            const participant2 = role === 'buyer' && !activeDispConv?.catalog_id ? 'admin' : null;

            const res = await fetch('/api/inbox', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    conversation_id: (activeConvId === 'new' || activeConvId === 'general' || String(activeConvId).startsWith('order_')) ? null : activeConvId,
                    participant2_id: participant2,
                    catalog_id: activeDispConv?.catalog_id || catalogId || null,
                    order_id: activeDispConv?.order_id || null,
                    content: newMessage
                })
            });

            if (res.ok) {
                const sentMsg = await res.json();
                setNewMessage("");
                
                // If this was a new conversation, we need to refresh to get the real ID and update active tab
                if (String(activeConvId).startsWith('order_') || activeConvId === 'new' || activeConvId === 'general') {
                    await fetchConversations();
                    setActiveConvId(sentMsg.conversation_id);
                } else {
                    setMessages(prev => [...prev, sentMsg]);
                    setConversations(prev => prev.map(c => 
                        c.id === activeConvId ? { ...c, last_message: sentMsg.content, last_message_time: sentMsg.created_at } : c
                    ).sort((a,b) => new Date(b.last_message_time || 0) - new Date(a.last_message_time || 0)));
                }
            } else {
                toast.error("שגיאה בשליחת הודעה");
            }
        } catch (error) {
            toast.error("שגיאה בשליחת הודעה");
        } finally {
            setIsSending(false);
        }
    };

    let displayConversations = [...conversations];

    if (role === 'buyer') {
        const hasGeneral = displayConversations.some(c => c.catalog_id == null && c.order_id == null);
        if (!hasGeneral) {
            displayConversations.push({
                id: 'general',
                participant1_id: user?.id,
                participant2_id: 'admin',
                catalog_id: null,
                order_id: null,
                last_message: "התחל פנייה כללית...",
                unread_count: 0,
                last_message_time: 0
            });
        }

        orders.forEach(order => {
            const hasOrderConv = displayConversations.some(c => String(c.order_id) === String(order.id));
            if (!hasOrderConv) {
                displayConversations.push({
                    id: `order_${order.id}`,
                    participant1_id: user?.id,
                    participant2_id: order.catalog_id ? null : 'admin',
                    catalog_id: order.catalog_id || null,
                    order_id: order.id,
                    last_message: "התחל שיחה חדשה על ההזמנה...",
                    unread_count: 0,
                    last_message_time: 0
                });
            }
        });
    }

    displayConversations.sort((a,b) => {
        // Unread first
        if (a.unread_count > 0 && b.unread_count === 0) return -1;
        if (b.unread_count > 0 && a.unread_count === 0) return 1;
        // Then by time
        return new Date(b.last_message_time || 0) - new Date(a.last_message_time || 0)
    });

    const activeConversation = getActiveDisplayConv();

    const formatLastSeen = (dateString) => {
        if (!dateString) return null;
        const lastActive = new Date(dateString);
        const now = new Date();
        const diffMinutes = Math.floor((now - lastActive) / 60000);

        if (diffMinutes < 2) return "זמין כעת";
        
        const isToday = lastActive.toDateString() === now.toDateString();
        const timeStr = lastActive.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', hour12: false });
        
        if (isToday) return `נראה לאחרונה היום ב-${timeStr}`;
        
        const dateStr = lastActive.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit' });
        return `נראה לאחרונה ב-${dateStr} ${timeStr}`;
    };

    const getChatName = (conv) => {
        if (role === 'admin' || role === 'seller') {
            const clientName = conv.participant1_name || "לקוח (ID: " + conv.participant1_id.slice(-4) + ")";
            if (conv.order_id) return `${clientName} | הזמנה #${conv.order_id}`;
            return `${clientName} | פנייה כללית`;
        }
        
        // Buyer view
        if (conv.order_id) {
            return `הזמנה מספר ${conv.order_id}`;
        }
        
        if (conv.catalog_id) {
            return catalogsData[conv.catalog_id]?.name || "מוכר קטלוג (#" + conv.catalog_id + ")";
        }
        
        return "ml_tlv (הנהלת האתר)";
    };

    if (!isLoaded || isLoading) return <div className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-gray-400" /></div>;

    const filteredConversations = displayConversations.filter(c => getChatName(c).toLowerCase().includes(searchQuery.toLowerCase()));

    return (
        <div className="flex h-[calc(100vh-200px)] min-h-[500px] border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm font-sans" dir="rtl">
            {/* Sidebar (Conversations List) */}
            <div className={`w-full md:w-1/3 bg-gray-50 border-l border-gray-200 flex flex-col ${activeConvId ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 border-b border-gray-200 bg-white">
                    <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-black" />
                        תיבת דואר
                    </h2>
                    <div className="relative">
                        <Search className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            placeholder="חיפוש שיחה..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-3 pr-10 py-2 bg-gray-100 border-transparent rounded-xl text-sm focus:bg-white focus:border-black focus:ring-0 transition outline-none"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {filteredConversations.length === 0 ? (
                        <div className="p-8 text-center text-gray-400 text-sm">
                            {searchQuery ? "לא נמצאו שיחות תואמות." : "אין לך הודעות כרגע."}
                        </div>
                    ) : (
                        filteredConversations.map(conv => (
                            <button
                                key={conv.id}
                                onClick={() => setActiveConvId(conv.id)}
                                className={`w-full text-right p-4 border-b border-gray-100 hover:bg-gray-100 transition flex items-center gap-3 ${activeConvId === conv.id ? 'bg-blue-50/50 relative' : ''}`}
                            >
                                {activeConvId === conv.id && <div className="absolute right-0 top-0 bottom-0 w-1 bg-black rounded-r-full" />}
                                
                                <div className={`w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden border ${((role === 'buyer' && !conv.catalog_id) || (role === 'seller' && conv.participant2_id === 'admin')) ? 'bg-white border-gray-100' : 'bg-gray-200 border-gray-300'}`}>
                                    {(role === 'buyer' && !conv.catalog_id) || (role === 'seller' && conv.participant2_id === 'admin') ? (
                                        <img src="/ml_CHAT.png" alt="ml_tlv" className="w-full h-full object-cover" />
                                    ) : role === 'buyer' && conv.catalog_id ? (
                                        catalogsData[conv.catalog_id]?.logo_url ? (
                                            <img src={catalogsData[conv.catalog_id].logo_url} alt="Store" className="w-full h-full object-cover" />
                                        ) : (
                                            <Store className="w-6 h-6 text-gray-500" />
                                        )
                                    ) : (
                                        conv.participant1_image ? (
                                            <img src={conv.participant1_image} alt="User" className="w-full h-full object-cover" />
                                        ) : (
                                            <UserIcon className="w-6 h-6 text-gray-500" />
                                        )
                                    )}
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <h3 className={`font-bold text-sm truncate ${Number(conv.unread_count) > 0 ? 'text-black' : 'text-gray-800'}`}>
                                            {getChatName(conv)}
                                        </h3>
                                        <span className="text-[10px] text-gray-400 font-medium">
                                            {conv.last_message_time ? new Date(conv.last_message_time).toLocaleDateString('he-IL') : ''}
                                        </span>
                                    </div>
                                    <p className={`text-xs truncate ${Number(conv.unread_count) > 0 ? 'text-black font-semibold' : 'text-gray-500'}`}>
                                        {conv.last_message || "התחל שיחה חדשה..."}
                                    </p>
                                </div>

                                {Number(conv.unread_count) > 0 && (
                                    <div className="w-5 h-5 bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center rounded-full shadow-sm">
                                        {conv.unread_count}
                                    </div>
                                )}
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* Main Chat Area */}
            <div className={`flex-1 flex flex-col bg-white ${!activeConvId ? 'hidden md:flex items-center justify-center' : 'flex'}`}>
                {!activeConvId ? (
                    <div className="text-center text-gray-400">
                        <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-20" />
                        <p>בחר שיחה מהרשימה כדי להתחיל</p>
                    </div>
                ) : (
                    <>
                        {/* Chat Header */}
                        <div className="p-4 border-b border-gray-200 bg-white flex items-center gap-3 shadow-sm z-10">
                            <button className="md:hidden text-gray-500 p-2 ml-2 bg-gray-100 rounded-full" onClick={() => setActiveConvId(null)}>
                                חזור
                            </button>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center overflow-hidden border flex-shrink-0 ${((role === 'buyer' && !activeConversation?.catalog_id) || (role === 'seller' && activeConversation?.participant2_id === 'admin')) ? 'bg-white border-gray-100' : 'bg-gray-200 border-gray-300'}`}>
                                {(role === 'buyer' && !activeConversation?.catalog_id) || (role === 'seller' && activeConversation?.participant2_id === 'admin') ? (
                                    <img src="/ml_CHAT.png" alt="ml_tlv" className="w-full h-full object-cover" />
                                ) : role === 'buyer' && activeConversation?.catalog_id ? (
                                    catalogsData[activeConversation.catalog_id]?.logo_url ? (
                                        <img src={catalogsData[activeConversation.catalog_id].logo_url} alt="Store" className="w-full h-full object-cover" />
                                    ) : (
                                        <Store className="w-5 h-5 text-gray-500" />
                                    )
                                ) : (
                                    activeConversation?.participant1_image ? (
                                        <img src={activeConversation.participant1_image} alt="User" className="w-full h-full object-cover" />
                                    ) : (
                                        <UserIcon className="w-5 h-5 text-gray-500" />
                                    )
                                )}
                            </div>
                                        <div className="flex flex-col">
                                            <h2 className="font-bold text-gray-900 leading-tight">
                                                {activeConversation ? getChatName(activeConversation) : '...'}
                                            </h2>
                                            <div className="flex items-center gap-1">
                                                <div className={`w-1.5 h-1.5 rounded-full ${otherParticipantStatus?.last_active_at && (new Date() - new Date(otherParticipantStatus.last_active_at)) < 120000 ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                                                <span className="text-[10px] text-gray-500">
                                                    {formatLastSeen(otherParticipantStatus?.last_active_at) || "זמין כעת"}
                                                </span>
                                            </div>
                                        </div>
                        </div>

                        <div 
                            className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30"
                            onScroll={handleScroll}
                        >
                            {activeConversation?.order_id && orderData[activeConversation.order_id] && (
                                <div className="mb-4 bg-white rounded-2xl py-3 px-4 border border-teal-100 shadow-sm flex flex-col gap-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${
                                                ['delivered', 'completed'].includes(orderData[activeConversation.order_id].status) ? 'bg-green-500' :
                                                ['shipped'].includes(orderData[activeConversation.order_id].status) ? 'bg-blue-500' :
                                                ['cancelled'].includes(orderData[activeConversation.order_id].status) ? 'bg-red-500' : 'bg-teal-500'
                                            }`} />
                                            <span className="font-bold text-xs text-teal-800">
                                                סטטוס: {
                                                 orderData[activeConversation.order_id].status === 'pending' ? 'ממתין' :
                                                 orderData[activeConversation.order_id].status === 'processing' ? 'בטיפול' :
                                                 orderData[activeConversation.order_id].status === 'shipped' ? 'נשלח' :
                                                 orderData[activeConversation.order_id].status === 'delivered' ? 'נמסר' :
                                                 orderData[activeConversation.order_id].status === 'completed' ? 'הושלם' :
                                                 orderData[activeConversation.order_id].status === 'cancelled' ? 'בוטל' : 'חדש'
                                                }
                                            </span>
                                        </div>
                                        <Link href="/orders" className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 transition-colors">
                                            פרטי הזמנה מלאים <ExternalLink className="w-3 h-3" />
                                        </Link>
                                    </div>

                                    <div className="flex gap-4 overflow-x-auto pb-1 custom-scrollbar">
                                        {orderData[activeConversation.order_id].items?.map((item, idx) => (
                                            <div key={idx} className="flex items-center gap-2 bg-gray-50/80 rounded-xl p-1.5 border border-gray-100/50 flex-shrink-0 group hover:bg-white hover:shadow-sm transition-all duration-300">
                                                <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-100 bg-white">
                                                    <img src={item.image_url || '/placeholder.png'} alt="" className="w-full h-full object-contain group-hover:scale-110 transition-transform" />
                                                </div>
                                                <div className="flex flex-col min-w-0 flex-1">
                                                    <span className="text-[10px] font-bold text-gray-800 leading-tight">{item.name}</span>
                                                    <div className="flex items-center gap-1 text-[9px] text-gray-400 mt-0.5">
                                                        <span className="bg-gray-200 px-1 rounded font-medium text-gray-600">{item.size}</span>
                                                        <span className="font-bold text-black">x{item.quantity}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {role === 'buyer' && (orderData[activeConversation.order_id].status === 'completed' || orderData[activeConversation.order_id].status === 'הושלם') && (
                                        <OrderReviewPrompt 
                                            orderId={activeConversation.order_id} 
                                            initialHasSubmitted={hasSubmittedReview[activeConversation.order_id]}
                                            onSubmitted={() => setHasSubmittedReview(prev => ({ ...prev, [activeConversation.order_id]: true }))}
                                        />
                                    )}
                                </div>
                            )}

                            {messages.map((msg, idx) => {
                                    // Rule: Admin (staff) always LEFT (black), Customer always RIGHT (gray)
                                    // This applies to BOTH user and admin interfaces (absolute alignment)
                                    const isClientMessage = msg.sender_role === 'customer' || 
                                                          (msg.sender_role !== 'admin' && msg.sender_id === activeConversation?.participant1_id);

                                    return (
                                        <div key={idx} className={`flex w-full mb-3 ${isClientMessage ? 'justify-start' : 'justify-end'}`} dir="rtl">
                                            <div className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow-sm transition-all duration-300 transform hover:scale-[1.01] ${
                                                isClientMessage
                                                ? 'bg-gray-200 text-black rounded-br-none' 
                                                : 'bg-black text-white rounded-bl-none'
                                            }`}>
                                                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                                                <div className={`text-[9px] mt-1 flex ${isClientMessage ? 'justify-end' : 'justify-start'} opacity-50`}>
                                                    {new Date(msg.created_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', hour12: false })}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-white border-t border-gray-200">
                            <form onSubmit={handleSendMessage} className="flex items-center gap-2 relative">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="הקלד הודעה..."
                                    className="flex-1 pl-12 pr-4 py-3 bg-gray-100 hover:bg-gray-200 focus:bg-white border focus:border-black rounded-full outline-none transition-all text-sm shadow-inner"
                                    disabled={isSending}
                                />
                                <button
                                    type="submit"
                                    disabled={!newMessage.trim() || isSending}
                                    className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 bg-black text-white rounded-full flex items-center justify-center hover:bg-gray-800 disabled:opacity-50 transition shadow-md"
                                >
                                    {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Reply className="w-4 h-4 mr-0.5" />}
                                </button>
                            </form>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
