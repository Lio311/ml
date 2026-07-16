"use client";

import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { Card, CardHeader, CardContent, CardTitle, CardFooter } from "../ui/card";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { ScrollArea } from "../ui/scroll-area";
import { ShoppingCart, Clock } from "lucide-react";

export function LiveCartCard({ cart, isNew }) {
    const cardRef = useRef(null);
    const [prevUpdatedAt, setPrevUpdatedAt] = useState(cart.updated_at);

    // Initial load animation
    useEffect(() => {
        if (isNew && cardRef.current) {
            gsap.fromTo(
                cardRef.current,
                { y: 30, opacity: 0, scale: 0.95 },
                { y: 0, opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.5)" }
            );
        }
    }, [isNew]);

    // Update pulse animation
    useEffect(() => {
        if (cart.updated_at !== prevUpdatedAt) {
            setPrevUpdatedAt(cart.updated_at);
            if (cardRef.current) {
                gsap.fromTo(
                    cardRef.current,
                    { scale: 1, boxShadow: "0 0 0px rgba(16, 185, 129, 0)" },
                    { 
                        scale: 1.02, 
                        boxShadow: "0 0 20px rgba(16, 185, 129, 0.4)", 
                        duration: 0.2, 
                        yoyo: true, 
                        repeat: 1, 
                        ease: "power1.inOut" 
                    }
                );
            }
        }
    }, [cart.updated_at, prevUpdatedAt]);

    const isAnonymous = !cart.email;
    const items = cart.items ? (typeof cart.items === 'string' ? JSON.parse(cart.items) : cart.items) : [];
    
    // Format timestamp
    const updatedTime = new Date(cart.updated_at);
    const now = new Date();
    const diffMins = Math.floor((now - updatedTime) / 60000);
    const timeDisplay = diffMins < 1 ? "ממש עכשיו" : `לפני ${diffMins} דקות`;

    return (
        <Card ref={cardRef} className="w-full flex flex-col shadow-md border border-gray-200/50 hover:shadow-lg transition-all duration-300 overflow-hidden bg-white/60 backdrop-blur-md">
            <CardHeader className="pb-3 border-b border-gray-100 flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border border-gray-200">
                        {cart.user_image ? (
                            <img src={cart.user_image} alt="User" className="w-full h-full object-cover rounded-full" />
                        ) : (
                            <AvatarFallback className={isAnonymous ? "bg-gray-100 text-gray-500" : "bg-blue-100 text-blue-700"}>
                                {isAnonymous ? "?" : cart.email.charAt(0).toUpperCase()}
                            </AvatarFallback>
                        )}
                    </Avatar>
                    <div className="flex flex-col">
                        <CardTitle className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                            {isAnonymous ? "משתמש אנונימי" : cart.email}
                        </CardTitle>
                        <span className="text-xs text-gray-500">ID: {cart.session_id.substring(0, 8)}...</span>
                    </div>
                </div>
                <Badge variant={isAnonymous ? "secondary" : "default"} className={isAnonymous ? "bg-gray-100 text-gray-600 hover:bg-gray-200" : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"}>
                    {isAnonymous ? "אנונימי" : "רשום"}
                </Badge>
            </CardHeader>
            <CardContent className="pt-4 pb-2 flex-grow">
                <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-medium text-gray-700 flex items-center gap-1.5" dir="rtl">
                        <ShoppingCart className="w-4 h-4 text-gray-400 ml-1.5" />
                        {items.length} {items.length === 1 ? 'פריט' : 'פריטים'}
                    </span>
                    <span className="text-lg font-bold text-gray-900">
                        ₪{Number(cart.total_price || 0).toLocaleString()}
                    </span>
                </div>
                <ScrollArea className="h-32 rounded-md border border-gray-100 p-2 bg-gray-50/50">
                    <div className="space-y-2">
                        {items.map((item, idx) => (
                            <div key={`${item.id}-${idx}`} className="flex items-center justify-between text-sm py-1 border-b border-gray-100 last:border-0">
                                <div className="flex items-center gap-2 truncate" dir="rtl">
                                    {item.image_url ? (
                                        <div className="w-8 h-8 rounded bg-gray-50 flex-shrink-0 border border-gray-100 flex items-center justify-center overflow-hidden">
                                            <img src={item.image_url} alt="Product" className="w-full h-full object-contain p-0.5" />
                                        </div>
                                    ) : (
                                        <div className="w-8 h-8 rounded bg-gray-50 flex-shrink-0 border border-gray-100 flex items-center justify-center text-xs text-gray-400">
                                            {item.isPrize ? '🎁' : '🧴'}
                                        </div>
                                    )}
                                    <span className="truncate w-32 text-gray-600" title={item.name_he || item.name || item.model_he || item.model || item.title || 'מוצר'}>{item.name_he || item.name || item.model_he || item.model || item.title || 'מוצר'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-400">x{item.quantity}</span>
                                    <span className="font-medium text-gray-700">₪{item.price}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </CardContent>
            <CardFooter className="pt-2 pb-3 bg-gray-50/30 flex justify-between items-center text-xs text-gray-500" dir="rtl">
                <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 ml-1" /> פעילות אחרונה:
                </span>
                <span className="font-medium">{timeDisplay}</span>
            </CardFooter>
        </Card>
    );
}
