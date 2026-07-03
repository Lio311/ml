"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
    Search, 
    User, 
    ShoppingCart, 
    Trash2, 
    Plus, 
    Minus, 
    CheckCircle2, 
    Ticket, 
    Truck, 
    Store,
    Loader2,
    ChevronDown,
    X,
    AlertCircle,
    Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import Image from '@/app/components/CImage';
import { cleanProductName } from '@/app/lib/productUtils';
import AutocompleteInput from '@/app/cart/components/AutocompleteInput';

export default function PhoneOrderClient() {
    const router = useRouter();
    
    // -- State --
    const [customer, setCustomer] = useState(null);
    const [customerQuery, setCustomerQuery] = useState('');
    const [customerResults, setCustomerResults] = useState([]);
    const [isCustomerLoading, setIsCustomerLoading] = useState(false);
    
    const [productQuery, setProductQuery] = useState('');
    const [productResults, setProductResults] = useState([]);
    const [isProductLoading, setIsProductLoading] = useState(false);
    
    const [cart, setCart] = useState([]);
    const [deliveryMethod, setDeliveryMethod] = useState('mail'); // 'mail' or 'self_pickup'
    const [couponCode, setCouponCode] = useState('');
    const [couponDiscount, setCouponDiscount] = useState(null);
    const [notes, setNotes] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    
    // Address logic
    const [address, setAddress] = useState({ street: '', houseNumber: '', apartment: '', city: '' });
    const [addressError, setAddressError] = useState('');
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showProductModal, setShowProductModal] = useState(null);
    const [placedOrderId, setPlacedOrderId] = useState(null);

    // -- Refs --
    const customerRef = useRef(null);
    const productRef = useRef(null);
    const cachedCities = useRef(null);
    const cachedStreets = useRef({});

    // -- Effects --
    
    // Customer Search logic
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (customerQuery.length >= 2 && !customer) {
                setIsCustomerLoading(true);
                try {
                    const res = await fetch(`/api/admin/users?q=${encodeURIComponent(customerQuery)}`);
                    const data = await res.json();
                    setCustomerResults(Array.isArray(data) ? data : []);
                } catch (err) {
                    console.error('Customer search error:', err);
                } finally {
                    setIsCustomerLoading(false);
                }
            } else {
                setCustomerResults([]);
            }
        }, 400);
        return () => clearTimeout(timer);
    }, [customerQuery, customer]);

    // Product Search logic
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (productQuery.length >= 2) {
                setIsProductLoading(true);
                try {
                    const res = await fetch(`/api/search/autocomplete?q=${encodeURIComponent(productQuery)}&source=admin`);
                    const data = await res.json();
                    setProductResults(data.results || []);
                } catch (err) {
                    console.error('Product search error:', err);
                } finally {
                    setIsProductLoading(false);
                }
            } else {
                setProductResults([]);
            }
        }, 400);
        return () => clearTimeout(timer);
    }, [productQuery]);

    // -- Calculations --
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shippingPrice = deliveryMethod === 'mail' ? 30 : 0;
    
    let discountAmount = 0;
    if (couponDiscount) {
        discountAmount = Math.round((subtotal * (couponDiscount.percent / 100)));
    }
    
    const total = Math.max(0, subtotal - discountAmount + shippingPrice);

    // -- Helpers --
    const getDiscountedPrice = (product, size) => {
        if (!product) return 0;
        const originalPrice = Number(product[`price_${size}ml`]);
        if (!originalPrice) return 0;

        const sizeStr = `${size}ml`;
        const hasDiscount = product.discount_percentage > 0 && (product.discount_sizes || []).includes(sizeStr);
        
        // Optional: check discount_end_date if you want to be super strict
        if (product.discount_end_date && new Date(product.discount_end_date) < new Date()) {
            return originalPrice;
        }

        if (!hasDiscount) return originalPrice;
        // Match site rounding logic: round to nearest 5
        return Math.round((originalPrice * (1 - product.discount_percentage / 100)) / 5) * 5;
    };
    
    const fetchCitySuggestions = async (val) => {
        try {
            if (!cachedCities.current) {
                const res = await fetch(`https://data.gov.il/api/3/action/datastore_search?resource_id=5c78e9fa-c2e2-4771-93ff-7f400a12f7ba&limit=3000`);
                const data = await res.json();
                cachedCities.current = data.result.records.map(r => r['שם_ישוב'].trim()).filter(c => c !== 'לא רשום');
            }
            let records = cachedCities.current.filter(c => c.includes(val));
            records.sort((a, b) => {
                const aStarts = a.startsWith(val);
                const bStarts = b.startsWith(val);
                if (aStarts && !bStarts) return -1;
                if (!aStarts && bStarts) return 1;
                return a.localeCompare(b);
            });
            return [...new Set(records)].slice(0, 5);
        } catch (e) {
            return [];
        }
    };

    const fetchStreetSuggestions = async (val) => {
        try {
            if (!address.city) return [];
            if (!cachedStreets.current[address.city]) {
                const res = await fetch(`https://data.gov.il/api/3/action/datastore_search?resource_id=9ad3862c-8391-4b2f-84a4-2d4c68625f4b&q=${encodeURIComponent(address.city)}&limit=5000`);
                const data = await res.json();
                cachedStreets.current[address.city] = data.result.records
                    .filter(r => r['שם_ישוב'].trim() === address.city)
                    .map(r => r['שם_רחוב'].trim());
            }
            let records = cachedStreets.current[address.city].filter(c => c.includes(val));
            records.sort((a, b) => {
                const aStarts = a.startsWith(val);
                const bStarts = b.startsWith(val);
                if (aStarts && !bStarts) return -1;
                if (!aStarts && bStarts) return 1;
                return a.localeCompare(b);
            });
            return [...new Set(records)].slice(0, 5);
        } catch (e) {
            return [];
        }
    };

    // -- Actions --
    const getConsumedStock = (productId) => {
        return cart
            .filter(item => item.id === productId)
            .reduce((sum, item) => sum + (item.quantity * item.size), 0);
    };

    const handleAddProduct = (product, size) => {
        const discountedPrice = getDiscountedPrice(product, size);
        
        // Stock Check
        const currentConsumed = getConsumedStock(product.id);
        if (currentConsumed + size > product.stock) {
            toast.error(`אין מספיק מלאי! נותרו ${product.stock - currentConsumed} מ"ל`);
            return;
        }

        const cartItem = {
            id: product.id,
            name: product.name,
            brand: product.brand,
            image: product.image,
            size: size,
            price: discountedPrice,
            originalPrice: Number(product[`price_${size}ml`]),
            quantity: 1,
            itemKey: `${product.id}-${size}`,
            stock: product.stock // Keep track of product stock
        };

        setCart(prev => {
            const existing = prev.find(i => i.itemKey === cartItem.itemKey);
            if (existing) {
                return prev.map(i => i.itemKey === cartItem.itemKey ? { ...i, quantity: i.quantity + 1 } : i);
            }
            return [...prev, cartItem];
        });
        
        setProductQuery('');
        setProductResults([]);
        setShowProductModal(null);
        toast.success(`נוסף לסל: ${product.name} (${size}ml)`);
    };

    const updateQuantity = (itemKey, delta) => {
        setCart(prev => prev.map(i => {
            if (i.itemKey === itemKey) {
                const newQuantity = Math.max(1, i.quantity + delta);
                if (delta > 0) {
                    const currentConsumed = getConsumedStock(i.id);
                    if (currentConsumed + i.size > i.stock) {
                        toast.error(`הגעת למקסימום המלאי הזמין (${i.stock} מ"ל)`);
                        return i;
                    }
                }
                return { ...i, quantity: newQuantity };
            }
            return i;
        }));
    };

    const removeItem = (itemKey) => {
        setCart(prev => prev.filter(i => i.itemKey !== itemKey));
    };

    const validateCoupon = async () => {
        if (!couponCode) return;
        try {
            const res = await fetch('/api/coupons/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    code: couponCode, 
                    userEmail: customer?.email,
                    subtotal: subtotal,
                    items: cart.map(i => ({ id: i.id, size: i.size }))
                })
            });
            const data = await res.json();
            if (res.ok && data.success) {
                setCouponDiscount({ 
                    percent: data.coupon.discount_value, 
                    code: couponCode 
                });
                toast.success(`קופון הופעל: ${data.coupon.discount_value}% הנחה`);
            } else {
                toast.error(data.error || 'קופון לא תקף');
            }
        } catch (err) {
            toast.error('שגיאה בבדיקת קופון');
        }
    };

    const handleSubmitOrder = async () => {
        if (!customer) return toast.error('אנא בחר לקוח');
        if (cart.length === 0) return toast.error('הסל ריק');
        
        if (deliveryMethod === 'mail') {
            if (!address.city || !address.street || !address.houseNumber) {
                setAddressError('נא למלא עיר, רחוב ומספר בית');
                toast.error('נא למלא את כל שדות הכתובת (עיר, רחוב ומספר בית)');
                return;
            }
            setAddressError('');
        }
        
        setIsSubmitting(true);
        try {
            const res = await fetch('/api/admin/orders/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customerId: customer.id,
                    items: cart,
                    total: total,
                    discountAmount,
                    couponCode: couponDiscount?.code,
                    notes,
                    deliveryMethod,
                    shippingCost: shippingPrice,
                    address: deliveryMethod === 'mail' ? address : null,
                    phoneNumber
                })
            });
            
            const data = await res.json();
            if (res.ok) {
                toast.success(`הזמנה #${data.orderId} נוצרה בהצלחה!`);
                setPlacedOrderId(data.orderId);
            } else {
                toast.error(data.error || 'שגיאה ביצירת הזמנה');
            }
        } catch (err) {
            toast.error('שגיאה בתקשורת עם השרת');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (placedOrderId) {
        return (
            <div className="max-w-6xl mx-auto p-4 md:p-8 min-h-[70vh] flex items-center justify-center" dir="rtl">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-[3rem] shadow-2xl border border-gray-100 p-12 text-center max-w-xl w-full relative overflow-hidden"
                >
                    {/* Background decoration */}
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 via-green-500 to-blue-600" />
                    
                    <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                        <CheckCircle2 className="w-12 h-12 text-green-500" />
                    </div>

                    <h1 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">ההזמנה נוצרה!</h1>
                    <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                        הזמנה <span className="text-blue-600 font-bold">#{placedOrderId}</span> נוצרה בהצלחה עבור <span className="font-bold text-gray-900">{customer?.firstName} {customer?.lastName}</span>.
                        <br />
                        אישור הזמנה נשלח ללקוח במייל.
                    </p>

                    <div className="flex flex-col gap-4">
                        <button
                            onClick={() => {
                                setPlacedOrderId(null);
                                setCustomer(null);
                                setCustomerQuery('');
                                setCart([]);
                                setCouponCode('');
                                setCouponDiscount(null);
                                setNotes('');
                            }}
                            className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 text-lg flex items-center justify-center gap-2 group"
                        >
                            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                            צור הזמנה חדשה
                        </button>
                        <button
                            onClick={() => router.push('/admin/orders')}
                            className="w-full py-5 bg-gray-50 text-gray-600 font-bold rounded-2xl hover:bg-gray-100 transition-all text-lg"
                        >
                            מעבר לניהול הזמנות
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-8" dir="rtl">
            <header className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-gray-900 flex items-center gap-3">
                        <span className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shadow-blue-200">
                            <Truck className="w-6 h-6" />
                        </span>
                        הזמנה טלפונית
                    </h1>
                    <p className="text-gray-500 mt-1 font-medium italic">יצירת הזמנה ידנית עבור לקוח קיים</p>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Flow */}
                <div className="lg:col-span-2 space-y-6">
                    
                    {/* Step 1: Customer */}
                    <section className="bg-white rounded-3xl shadow-sm border border-gray-100 relative">
                        <div className="bg-gray-50/50 p-4 border-b border-gray-100 flex items-center gap-2">
                            <User className="w-5 h-5 text-gray-400" />
                            <h2 className="font-bold text-gray-800">1. פרטי לקוח</h2>
                        </div>
                        <div className="p-6">
                            {!customer ? (
                                <div className="relative" ref={customerRef}>
                                    <div className="relative">
                                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                        <input 
                                            type="text"
                                            placeholder="חפש לקוח לפי שם או אימייל..."
                                            className="w-full bg-gray-50 ps-12 pe-4 py-4 rounded-2xl border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none transition-all font-medium"
                                            value={customerQuery}
                                            onChange={(e) => setCustomerQuery(e.target.value)}
                                        />
                                        {isCustomerLoading && (
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2">
                                                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                                            </div>
                                        )}
                                    </div>

                                    <AnimatePresence>
                                        {customerResults.length > 0 && (
                                            <motion.div 
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 max-h-64 overflow-y-auto"
                                            >
                                                {customerResults.map(c => (
                                                    <button 
                                                        key={c.id}
                                                        onClick={() => { 
                                                            setCustomer(c); 
                                                            setPhoneNumber(c.phone || ''); 
                                                            if (c.address) {
                                                                setAddress(c.address);
                                                            } else {
                                                                setAddress({ street: '', houseNumber: '', apartment: '', city: '' });
                                                            }
                                                        }}
                                                        className="w-full p-4 hover:bg-blue-50 flex items-center gap-4 transition-colors group text-right"
                                                    >
                                                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                                                            {c.firstName?.[0]}{c.lastName?.[0]}
                                                        </div>
                                                        <div className="flex-1">
                                                            <div className="font-bold text-gray-900 group-hover:text-blue-700">{c.firstName} {c.lastName}</div>
                                                            <div className="text-xs text-gray-500">{c.email}</div>
                                                        </div>
                                                        <ChevronDown className="w-4 h-4 text-gray-300 -rotate-90" />
                                                    </button>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ) : (
                                                <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex flex-col gap-4">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-4">
                                                            <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shadow-lg shadow-blue-100">
                                                                {customer.firstName?.[0]}{customer.lastName?.[0]}
                                                            </div>
                                                            <div>
                                                                <div className="font-black text-blue-900">{customer.firstName} {customer.lastName}</div>
                                                                <div className="text-sm text-blue-600 opacity-80">{customer.email}</div>
                                                            </div>
                                                        </div>
                                                        <button 
                                                            onClick={() => { setCustomer(null); setCustomerQuery(''); setPhoneNumber(''); }}
                                                            className="p-2 hover:bg-blue-100 rounded-xl text-blue-600 transition-colors"
                                                        >
                                                            שינוי לקוח
                                                        </button>
                                                    </div>
                                                    <div className="pt-2 border-t border-blue-200/50">
                                                        <label className="block text-sm font-bold text-blue-900 mb-2">מספר טלפון</label>
                                                        <input
                                                            type="tel"
                                                            dir="ltr"
                                                            className="w-full bg-white p-3 rounded-xl border border-blue-100 focus:border-blue-500 outline-none transition-all text-right"
                                                            placeholder="...הזן מספר טלפון"
                                                            value={phoneNumber}
                                                            onChange={(e) => setPhoneNumber(e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                        </div>
                    </section>

                    {/* Step 2: Products */}
                    <section className="bg-white rounded-3xl shadow-sm border border-gray-100 relative">
                        <div className="bg-gray-50/50 p-4 border-b border-gray-100 flex items-center gap-2">
                            <ShoppingCart className="w-5 h-5 text-gray-400" />
                            <h2 className="font-bold text-gray-800">2. בחירת בשמים</h2>
                        </div>
                        <div className="p-6">
                            <div className="relative mb-6">
                                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input 
                                    type="text"
                                    placeholder="חפש בושם לפי שם או מותג..."
                                    className="w-full bg-gray-50 ps-12 pe-4 py-4 rounded-2xl border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none transition-all font-medium"
                                    value={productQuery}
                                    onChange={(e) => setProductQuery(e.target.value)}
                                />
                                {isProductLoading && (
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2">
                                        <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                                    </div>
                                )}
                                
                                <AnimatePresence>
                                    {productResults.length > 0 && (
                                        <motion.div 
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 max-h-96 overflow-y-auto p-2"
                                        >
                                            {productResults.map(p => (
                                                <button 
                                                    key={p.id}
                                                    onClick={() => setShowProductModal(p)}
                                                    className="w-full p-3 hover:bg-gray-50 rounded-xl flex items-center gap-4 transition-colors group text-right"
                                                >
                                                    <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 relative">
                                                        <Image src={p.image} alt={p.name} fill className="object-contain" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="font-bold text-gray-900 group-hover:text-blue-700">{cleanProductName(p.name, p.brand)}</div>
                                                        <div className="text-xs text-gray-500">{p.brand}</div>
                                                    </div>
                                                    <div className="text-blue-600 font-black"><span dir="ltr">₪ {p.price?.toLocaleString()}</span></div>
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Cart Items */}
                            {cart.length > 0 ? (
                                <div className="space-y-3">
                                    {cart.map((item) => (
                                        <div key={item.itemKey} className="group flex items-center gap-4 p-4 rounded-2xl border border-gray-100 hover:border-blue-200 transition-colors">
                                            <div className="w-14 h-14 rounded-xl bg-gray-50 flex-shrink-0 relative border border-gray-100">
                                                <Image src={item.image} alt={item.name} fill className="object-contain" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-bold text-gray-900 truncate">{cleanProductName(item.name, item.brand)}</div>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full font-bold">{item.size}ml</span>
                                                    <span className="text-sm font-bold text-gray-900"><span dir="ltr">₪ {item.price?.toLocaleString()}</span></span>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center bg-gray-50 rounded-xl p-1">
                                                <button 
                                                    onClick={() => updateQuantity(item.itemKey, -1)}
                                                    className="p-1 hover:bg-white hover:shadow-sm rounded-lg transition-all"
                                                >
                                                    <Minus size={16} />
                                                </button>
                                                <span className="w-8 text-center font-bold">{item.quantity}</span>
                                                <button 
                                                    onClick={() => updateQuantity(item.itemKey, 1)}
                                                    className={`p-1 hover:bg-white hover:shadow-sm rounded-lg transition-all ${getConsumedStock(item.id) + item.size > item.stock ? 'opacity-20 cursor-not-allowed' : ''}`}
                                                    disabled={getConsumedStock(item.id) + item.size > item.stock}
                                                >
                                                    <Plus size={16} />
                                                </button>
                                            </div>

                                            <button 
                                                onClick={() => removeItem(item.itemKey)}
                                                className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-3xl">
                                    <ShoppingCart className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                                    <p className="text-gray-400 font-medium">הסל ריק. חפש מוצר והוסף אותו.</p>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Step 3: Delivery */}
                    <section className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-gray-50/50 p-4 border-b border-gray-100 flex items-center gap-2">
                            <Truck className="w-5 h-5 text-gray-400" />
                            <h2 className="font-bold text-gray-800">3. שיטת משלוח והערות</h2>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <button 
                                    onClick={() => setDeliveryMethod('mail')}
                                    className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                                        deliveryMethod === 'mail' 
                                        ? 'border-blue-600 bg-blue-50 text-blue-900' 
                                        : 'border-gray-100 hover:border-gray-200 grayscale opacity-60'
                                    }`}
                                >
                                    <Truck className={deliveryMethod === 'mail' ? 'text-blue-600' : ''} />
                                    <span className="font-black text-sm">משלוח (30 ₪)</span>
                                </button>
                                <button 
                                    onClick={() => setDeliveryMethod('self_pickup')}
                                    className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                                        deliveryMethod === 'self_pickup' 
                                        ? 'border-blue-600 bg-blue-50 text-blue-900' 
                                        : 'border-gray-100 hover:border-gray-200 grayscale opacity-60'
                                    }`}
                                >
                                    <Store className={deliveryMethod === 'self_pickup' ? 'text-blue-600' : ''} />
                                    <span className="font-black text-sm">איסוף עצמי (0 ₪)</span>
                                </button>
                            </div>

                            {deliveryMethod === 'mail' && (
                                <div className="mb-6 space-y-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                    <label className="block text-sm font-bold text-gray-700">כתובת למשלוח</label>
                                    <div className="space-y-3">
                                        <div className="relative z-20">
                                            <AutocompleteInput
                                                placeholder="עיר *"
                                                value={address.city}
                                                onChange={(val) => {
                                                    setAddress(prev => ({ ...prev, city: val, street: '' }));
                                                    if (addressError) setAddressError('');
                                                }}
                                                fetchSuggestions={fetchCitySuggestions}
                                            />
                                        </div>
                                        <div className="grid grid-cols-5 gap-3 relative z-10">
                                            <div className="col-span-5 relative">
                                                <AutocompleteInput
                                                    disabled={!address.city}
                                                    placeholder={address.city ? "רחוב *" : "יש לבחור עיר תחילה"}
                                                    value={address.street}
                                                    onChange={(val) => {
                                                        setAddress(prev => ({ ...prev, street: val }));
                                                        if (addressError) setAddressError('');
                                                    }}
                                                    fetchSuggestions={fetchStreetSuggestions}
                                                />
                                            </div>
                                            <div className="col-span-2 relative">
                                                <input
                                                    type="text"
                                                    inputMode="numeric"
                                                    pattern="[0-9]*"
                                                    className="w-full p-3 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white transition-all pl-10"
                                                    placeholder="מס' בית *"
                                                    value={address.houseNumber || ''}
                                                    onChange={(e) => {
                                                        const val = e.target.value.replace(/\D/g, '');
                                                        setAddress(prev => ({ ...prev, houseNumber: val }));
                                                    }}
                                                />
                                                {address.houseNumber && (
                                                    <Check className="w-5 h-5 text-green-500 absolute left-3 top-1/2 -translate-y-1/2" />
                                                )}
                                            </div>
                                            <div className="col-span-3 relative">
                                                <input
                                                    type="text"
                                                    inputMode="numeric"
                                                    pattern="[0-9]*"
                                                    className="w-full p-3 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white transition-all pl-10"
                                                    placeholder="דירה (0 לבית פרטי)"
                                                    value={address.apartment || ''}
                                                    onChange={(e) => {
                                                        const val = e.target.value.replace(/\D/g, '');
                                                        setAddress(prev => ({ ...prev, apartment: val }));
                                                    }}
                                                />
                                                {address.apartment && (
                                                    <Check className="w-5 h-5 text-green-500 absolute left-3 top-1/2 -translate-y-1/2" />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    {addressError && <p className="text-red-600 text-xs font-bold mt-1">{addressError}</p>}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">הערות להזמנה</label>
                                <textarea 
                                    className="w-full bg-gray-50 p-4 rounded-2xl border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none transition-all min-h-[100px]"
                                    placeholder="פרטים נוספים, הוראות מיוחדות..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />
                            </div>
                        </div>
                    </section>
                </div>

                {/* Right Column: Summary */}
                <div className="lg:col-span-1">
                    <div className="sticky top-24 space-y-6">
                        <div className="bg-gray-900 text-white rounded-[2rem] p-8 shadow-2xl shadow-blue-900/10">
                            <h3 className="text-xl font-black mb-6 flex items-center gap-2 border-b border-white/10 pb-4">
                                <CheckCircle2 className="w-5 h-5 text-blue-400" />
                                סיכום הזמנה
                            </h3>

                            <div className="space-y-4 mb-8">
                                <div className="flex justify-between text-gray-400 font-medium">
                                    <span>סכום ביניים</span>
                                    <span><span dir="ltr">₪ {subtotal.toLocaleString()}</span></span>
                                </div>
                                {discountAmount > 0 && (
                                    <div className="flex justify-between text-emerald-400 font-bold">
                                        <span>הנחה ({couponDiscount.percent}%)</span>
                                        <span dir="ltr">-₪ {discountAmount.toLocaleString()}</span>
                                    </div>
                                )}
                                <div className="flex justify-between text-gray-400 font-medium">
                                    <span>משלוח</span>
                                    <span>{shippingPrice === 0 ? 'חינם' : <span dir="ltr">₪ {shippingPrice}</span>}</span>
                                </div>
                                <div className="pt-4 border-t border-white/10 flex justify-between items-end">
                                    <span className="text-sm font-bold opacity-60">סה"כ לתשלום</span>
                                    <span className="text-4xl font-black text-blue-400 tracking-tight"><span dir="ltr">₪ {total.toLocaleString()}</span></span>
                                </div>
                            </div>

                            {/* Coupon in Summary */}
                            <div className="mb-8">
                                <div className="relative">
                                    <Ticket className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                                    <input 
                                        type="text"
                                        placeholder="קוד קופון..."
                                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 ps-10 pe-16 text-sm focus:bg-white/10 outline-none transition-all uppercase"
                                        value={couponCode}
                                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                    />
                                    <button 
                                        onClick={validateCoupon}
                                        className="absolute left-2 top-1/2 -translate-y-1/2 px-3 py-1 bg-blue-600 text-[10px] font-black rounded-lg hover:bg-blue-500 transition-colors uppercase"
                                    >
                                        הפעל
                                    </button>
                                </div>
                            </div>

                            <button 
                                onClick={handleSubmitOrder}
                                disabled={isSubmitting || cart.length === 0 || !customer}
                                className={`w-full py-5 rounded-2xl font-black text-lg shadow-xl transition-all flex items-center justify-center gap-2 ${
                                    isSubmitting || cart.length === 0 || !customer
                                    ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-500 text-white hover:-translate-y-1 active:scale-95'
                                }`}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        מייצר הזמנה...
                                    </>
                                ) : (
                                    'בצע הזמנה עכשיו'
                                )}
                            </button>
                            
                            {!customer && cart.length > 0 && (
                                <p className="text-[10px] text-red-400 mt-4 text-center font-bold flex items-center justify-center gap-1 uppercase tracking-widest">
                                    <AlertCircle size={12} /> אנא בחר לקוח כדי להמשיך
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Product Size Selection Modal */}
            <AnimatePresence>
                {showProductModal && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
                        onClick={() => setShowProductModal(null)}
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden relative shadow-2xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <button 
                                onClick={() => setShowProductModal(null)}
                                className="absolute top-6 left-6 p-2 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors z-10"
                            >
                                <X size={20} />
                            </button>

                            <div className="p-8">
                                <div className="flex gap-6 mb-8">
                                    <div className="w-24 h-24 bg-gray-50 rounded-2xl relative border border-gray-100 overflow-hidden">
                                        <Image src={showProductModal.image} alt={showProductModal.name} fill className="object-contain" />
                                    </div>
                                    <div className="flex-1 pt-2">
                                        <div className="text-gray-500 text-sm font-bold uppercase tracking-wider">{showProductModal.brand}</div>
                                        <h3 className="text-2xl font-black text-gray-900 leading-tight">
                                            {cleanProductName(showProductModal.name, showProductModal.brand)}
                                        </h3>
                                        <div className="mt-1 flex items-center gap-2">
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${showProductModal.stock < 50 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                                                מלאי זמין: {showProductModal.stock - getConsumedStock(showProductModal.id)} מ"ל
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <h4 className="font-black text-gray-900 mb-4 text-lg">בחר גודל בקבוק:</h4>
                                <div className="grid grid-cols-1 gap-3">
                                    {[2, 5, 10].map(size => {
                                        const price = showProductModal[`price_${size}ml`];
                                        if (!price) return null;
                                        const discountedPrice = getDiscountedPrice(showProductModal, size);
                                        const isDiscounted = discountedPrice !== Number(price);

                                        return (
                                            <button 
                                                key={size}
                                                onClick={() => handleAddProduct(showProductModal, size)}
                                                className={`group flex items-center justify-between p-5 rounded-2xl border-2 transition-all text-right relative ${isDiscounted ? 'border-red-100 bg-red-50/30 hover:border-red-600 hover:bg-red-50' : 'border-gray-100 hover:border-blue-600 hover:bg-blue-50'}`}
                                            >
                                                {isDiscounted && (
                                                    <div className="absolute -top-2 -left-2 bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded shadow-sm z-10 animate-pulse">
                                                        SALE
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center font-bold transition-colors ${isDiscounted ? 'bg-white border-red-200 text-red-600 group-hover:border-red-400' : 'bg-white border-gray-100 text-gray-900 group-hover:border-blue-200'}`}>
                                                        {size}
                                                    </div>
                                                    <div>
                                                        <div className={`font-black ${isDiscounted ? 'text-red-700' : 'text-gray-900'}`}>{size}ml</div>
                                                        <div className="text-xs text-gray-500 uppercase font-black tracking-widest">דוגמית</div>
                                                    </div>
                                                </div>
                                                {size > (showProductModal.stock - getConsumedStock(showProductModal.id)) && (
                                                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-20">
                                                        <span className="bg-red-600 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg">אזל מהמלאי</span>
                                                    </div>
                                                )}
                                                <div className="flex flex-col items-end">
                                                    {isDiscounted ? (
                                                        <>
                                                            <div className="text-[10px] text-gray-400 line-through leading-none mb-1">{price} ₪</div>
                                                            <div className="text-xl font-black text-red-600"><span dir="ltr">₪ {discountedPrice.toLocaleString()}</span></div>
                                                        </>
                                                    ) : (
                                                        <div className="text-xl font-black text-blue-600"><span dir="ltr">₪ {price.toLocaleString()}</span></div>
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style jsx global>{`
                .no-scrollbar::-webkit-scrollbar {
                    display: none;
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #cbd5e1;
                }
            `}</style>
        </div>
    );
}
