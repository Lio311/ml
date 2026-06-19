"use client";

import { useState, useEffect, useRef } from 'react';
import { 
    Search, 
    ShoppingCart, 
    Trash2, 
    Plus, 
    Minus, 
    Truck, 
    Store,
    Loader2,
    X,
    AlertCircle,
    Save,
    Tag
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import Image from '@/app/components/CImage';
import { cleanProductName } from '@/app/lib/productUtils';

export default function EditOrderModal({ order, onClose, onSuccess }) {
    // -- State --
    const [cart, setCart] = useState([]);
    const [deliveryMethod, setDeliveryMethod] = useState('mail');
    const [notes, setNotes] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [productQuery, setProductQuery] = useState('');
    const [productResults, setProductResults] = useState([]);
    const [isProductLoading, setIsProductLoading] = useState(false);
    const [showProductModal, setShowProductModal] = useState(null);
    const [coupon, setCoupon] = useState(null);

    // -- Refs --
    const productRef = useRef(null);

    // -- Initialize from Order --
    useEffect(() => {
        if (order) {
            // Transform order items to cart items if needed
            const initialCart = order.items.map(item => ({
                id: item.id,
                name: item.name || `${item.brand} ${item.model}`,
                brand: item.brand,
                image: item.image || item.image_url,
                size: parseInt(item.size) || item.size, // Handle 'set' or other non-numeric sizes gracefully if they exist
                price: item.price,
                quantity: item.quantity || 1,
                itemKey: `${item.id}-${item.size}`,
                stock: 9999, // We'll re-check stock during edit if possible, but for initial load we trust the order
                // Keep original product pricing properties if they exist in the snapshot to support size changing
                price_2ml: item.price_2ml,
                price_5ml: item.price_5ml,
                price_10ml: item.price_10ml,
                single_price: item.single_price,
                discount_percentage: item.discount_percentage,
                discount_sizes: item.discount_sizes,
                discount_end_date: item.discount_end_date,
            }));
            setCart(initialCart);
            setDeliveryMethod(order.delivery_method || 'mail');
            setNotes(order.notes || '');

            // If order has a coupon, fetch its details to support recalculation
            if (order.coupon_code) {
                fetch('/api/admin/coupons')
                    .then(res => res.json())
                    .then(allCoupons => {
                        const found = allCoupons.find(c => c.code === order.coupon_code);
                        if (found) setCoupon(found);
                    })
                    .catch(err => console.error("Error fetching coupon details:", err));
            }

            // Enrich old orders with current product data to populate price_2ml etc. for the dropdown
            fetch('/api/products')
                .then(res => res.json())
                .then(data => {
                    if (data.products) {
                        setCart(prev => prev.map(cartItem => {
                            const dbProduct = data.products.find(p => p.id === cartItem.id);
                            if (dbProduct) {
                                return {
                                    ...cartItem,
                                    // Override missing or outdated pricing properties from the DB
                                    price_2ml: dbProduct.price_2ml,
                                    price_5ml: dbProduct.price_5ml,
                                    price_10ml: dbProduct.price_10ml,
                                    single_price: dbProduct.single_price,
                                    discount_percentage: dbProduct.discount_percentage,
                                    discount_sizes: dbProduct.discount_sizes,
                                    discount_end_date: dbProduct.discount_end_date,
                                };
                            }
                            return cartItem;
                        }));
                    }
                })
                .catch(err => console.error("Error fetching product details for cart enrichment:", err));
        }
    }, [order]);

    // -- Dropdown State --
    const [editingSizeKey, setEditingSizeKey] = useState(null);
    const dropdownRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setEditingSizeKey(null);
            }
        }
        if (editingSizeKey) document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [editingSizeKey]);

    // Product Search logic (copied from PhoneOrderClient)
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
    
    let couponDiscount = 0;
    if (coupon) {
        const limits = coupon.limitations || {};
        const eligibleSubtotal = cart.reduce((sum, item) => {
            let cleanId = item.id;
            if (typeof cleanId === 'string' && cleanId.includes('-')) cleanId = cleanId.split('-')[0];
            
            const productMatch = !limits.allowed_products || limits.allowed_products.length === 0 || 
                limits.allowed_products.map(String).includes(String(cleanId));
            const sizeMatch = !limits.allowed_sizes || limits.allowed_sizes.length === 0 || 
                limits.allowed_sizes.map(Number).includes(Number(item.size));
            const brandMatch = !limits.allowed_brands || limits.allowed_brands.length === 0 || 
                limits.allowed_brands.includes(item.brand);
            
            if (productMatch && sizeMatch && brandMatch) {
                return sum + (item.price * item.quantity);
            }
            return sum;
        }, 0);

        if (coupon.discount_percent) {
            couponDiscount = Math.round(eligibleSubtotal * (Number(coupon.discount_percent) / 100));
        } else if (coupon.discount_value) {
            couponDiscount = Math.min(eligibleSubtotal, Number(coupon.discount_value));
        }
    }

    const shippingPrice = deliveryMethod === 'mail' ? 30 : 0;
    const total = subtotal - couponDiscount + shippingPrice;

    // -- Helpers --
    const getDiscountedPrice = (product, size) => {
        if (!product) return 0;
        const originalPrice = Number(product[`price_${size}ml`]);
        if (!originalPrice) return 0;
        const sizeStr = `${size}ml`;
        const hasDiscount = product.discount_percentage > 0 && (product.discount_sizes || []).includes(sizeStr);
        if (product.discount_end_date && new Date(product.discount_end_date) < new Date()) {
            return originalPrice;
        }
        if (!hasDiscount) return originalPrice;
        return Math.round((originalPrice * (1 - product.discount_percentage / 100)) / 5) * 5;
    };

    const getConsumedStock = (productId) => {
        return cart
            .filter(item => item.id === productId)
            .reduce((sum, item) => sum + (item.quantity * item.size), 0);
    };

    // -- Actions --
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
            quantity: 1,
            itemKey: `${product.id}-${size}`,
            stock: product.stock,
            price_2ml: product.price_2ml,
            price_5ml: product.price_5ml,
            price_10ml: product.price_10ml,
            single_price: product.single_price,
            discount_percentage: product.discount_percentage,
            discount_sizes: product.discount_sizes,
            discount_end_date: product.discount_end_date,
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
        toast.success(`נוסף: ${product.name} (${size}ml)`);
    };

    const handleUpdateItemSize = (itemKey, newSize) => {
        setEditingSizeKey(null);
        setCart(prev => {
            const item = prev.find(i => i.itemKey === itemKey);
            if (!item) return prev;
            if (String(item.size) === String(newSize)) return prev;

            const discountedPrice = getDiscountedPrice(item, newSize);
            const newCartItem = {
                ...item,
                size: newSize,
                price: discountedPrice,
                itemKey: `${item.id}-${newSize}`
            };

            const existingWithNewSize = prev.find(i => i.itemKey === newCartItem.itemKey);
            if (existingWithNewSize) {
                // merge into existing
                return prev.map(i => i.itemKey === newCartItem.itemKey ? { ...i, quantity: i.quantity + item.quantity } : i)
                           .filter(i => i.itemKey !== itemKey);
            } else {
                // update in place
                return prev.map(i => i.itemKey === itemKey ? newCartItem : i);
            }
        });
    };

    const updateQuantity = (itemKey, delta) => {
        setCart(prev => prev.map(i => {
            if (i.itemKey === itemKey) {
                const newQuantity = Math.max(1, i.quantity + delta);
                if (delta > 0) {
                    const currentConsumed = getConsumedStock(i.id);
                    // For existing items in order, we don't have their true DB stock here easily, 
                    // but the backend will validate it anyway.
                    if (i.stock !== 9999 && currentConsumed + i.size > i.stock) {
                        toast.error(`הגעת למקסימום המלאי הזמין`);
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

    const handleSave = async () => {
        if (cart.length === 0) return toast.error('הסל לא יכול להיות ריק');
        
        setIsSubmitting(true);
        try {
            const res = await fetch('/api/admin/orders/update', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId: order.id,
                    items: cart,
                    total: total,
                    notes,
                    deliveryMethod,
                    shippingCost: shippingPrice
                })
            });
            
            const data = await res.json();
            if (res.ok) {
                toast.success(`הזמנה #${order.id} עודכנה בהצלחה!`);
                onSuccess();
            } else {
                toast.error(data.error || 'שגיאה בעדכון הזמנה');
            }
        } catch (err) {
            toast.error('שגיאה בתקשורת עם השרת');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-0 md:p-4 overflow-hidden" dir="rtl">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white md:rounded-[2.5rem] w-full max-w-5xl max-h-[100dvh] md:max-h-[90vh] overflow-hidden flex flex-col relative shadow-2xl"
            >
                {/* Header */}
                <div className="bg-gray-50/50 p-3 md:p-4 border-b border-gray-100 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3 md:gap-4">
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-600 rounded-xl md:rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
                            <Save className="w-5 h-5 md:w-6 md:h-6" />
                        </div>
                        <div>
                            <h2 className="text-lg md:text-xl font-black text-gray-900">עריכת הזמנה #{order?.id}</h2>
                            <p className="text-sm text-gray-500 font-medium">עבור: {order?.customer_details?.name}</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-3 hover:bg-gray-100 rounded-2xl text-gray-400 transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-3 md:p-6 flex flex-col lg:flex-row gap-4 md:gap-6">
                    {/* Left: Content */}
                    <div className="flex-1 space-y-4 md:space-y-6">
                        {/* Products Section */}
                        <section className="space-y-4">
                            <h3 className="font-black text-gray-900 flex items-center gap-2">
                                <ShoppingCart className="w-5 h-5 text-blue-600" />
                                מוצרים בהזמנה
                            </h3>
                            
                            <div className="relative" ref={productRef}>
                                <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input 
                                    type="text"
                                    placeholder="הוסף בושם להזמנה..."
                                    className="w-full bg-gray-50 ps-12 pe-4 py-2.5 rounded-2xl border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none transition-all font-medium text-sm"
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
                                            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 max-h-64 overflow-y-auto p-2"
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
                                                    <div className="text-blue-600 font-black"><span dir="ltr">₪ {p.price}</span></div>
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <div className="space-y-2 md:space-y-3">
                                {cart.map((item) => (
                                    <div key={item.itemKey} className="group flex items-center gap-3 md:gap-4 p-2.5 md:p-4 rounded-2xl border border-gray-100 hover:border-blue-200 transition-colors bg-white shadow-sm">
                                        <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gray-50 flex-shrink-0 relative border border-gray-100">
                                            <Image src={item.image} alt={item.name} fill className="object-contain" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-bold text-gray-900 truncate">{item.name}</div>
                                            <div className="flex items-center gap-3 mt-1">
                                                {['2', '5', '10'].some(sz => item[`price_${sz}ml`]) ? (
                                                    <div className="relative inline-block" ref={editingSizeKey === item.itemKey ? dropdownRef : null}>
                                                        <button 
                                                            onClick={(e) => { e.preventDefault(); setEditingSizeKey(editingSizeKey === item.itemKey ? null : item.itemKey); }}
                                                            className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-bold hover:bg-blue-100 transition-colors flex items-center gap-1"
                                                        >
                                                            {String(item.size).replace(/ml$/i, '')}ml
                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={`w-3 h-3 transition-transform ${editingSizeKey === item.itemKey ? 'rotate-180' : ''}`}>
                                                              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                                                            </svg>
                                                        </button>
                                                        
                                                        {editingSizeKey === item.itemKey && (
                                                            <div className="absolute top-full mt-2 start-0 bg-white border shadow-xl rounded-xl overflow-hidden z-[120] flex flex-col min-w-[120px]">
                                                                {['2', '5', '10'].map(sz => {
                                                                    const price = item[`price_${sz}ml`];
                                                                    if (!price || Number(price) <= 0) return null;
                                                                    return (
                                                                        <button 
                                                                            key={sz}
                                                                            onClick={(e) => { e.preventDefault(); handleUpdateItemSize(item.itemKey, sz); }}
                                                                            className={`px-4 py-3 text-sm text-start hover:bg-gray-50 transition-colors flex justify-between items-center ${String(item.size) === sz ? 'font-bold bg-blue-50/50 text-blue-600' : 'text-gray-700'}`}
                                                                        >
                                                                            <span>{sz}ml</span>
                                                                            {String(item.size) !== sz && <span className="text-xs text-gray-400 ms-3">{price}₪</span>}
                                                                        </button>
                                                                    )
                                                                })}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full font-bold">{String(item.size).replace(/ml$/i, '')}ml</span>
                                                )}
                                                <span className="text-sm font-bold text-gray-900"><span dir="ltr">₪ {item.price}</span></span>
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
                                                className="p-1 hover:bg-white hover:shadow-sm rounded-lg transition-all"
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
                        </section>

                        {/* Delivery Section */}
                        <section className="space-y-3 md:space-y-4">
                            <h3 className="font-black text-gray-900 flex items-center gap-2 text-sm md:text-base">
                                <Truck className="w-4 h-4 md:w-5 md:h-5 text-blue-600" />
                                שיטת שילוח והערות
                            </h3>
                            <div className="grid grid-cols-2 gap-2 md:gap-3">
                                <button 
                                    onClick={() => setDeliveryMethod('mail')}
                                    className={`p-2.5 md:p-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 ${
                                        deliveryMethod === 'mail' 
                                        ? 'border-blue-600 bg-blue-50 text-blue-900' 
                                        : 'border-gray-100 hover:border-gray-200 grayscale opacity-60'
                                    }`}
                                >
                                    <Truck className={deliveryMethod === 'mail' ? 'w-4 h-4 md:w-5 md:h-5 text-blue-600' : 'w-4 h-4 md:w-5 md:h-5'} />
                                    <span className="font-black text-[11px] md:text-[12px]">משלוח (30 ₪)</span>
                                </button>
                                <button 
                                    onClick={() => setDeliveryMethod('self_pickup')}
                                    className={`p-2.5 md:p-3 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 ${
                                        deliveryMethod === 'self_pickup' 
                                        ? 'border-blue-600 bg-blue-50 text-blue-900' 
                                        : 'border-gray-100 hover:border-gray-200 grayscale opacity-60'
                                    }`}
                                >
                                    <Store className={deliveryMethod === 'self_pickup' ? 'w-4 h-4 md:w-5 md:h-5 text-blue-600' : 'w-4 h-4 md:w-5 md:h-5'} />
                                    <span className="font-black text-[11px] md:text-[12px]">איסוף עצמי (0 ₪)</span>
                                </button>
                            </div>
                            <textarea 
                                className="w-full bg-gray-50 p-3 rounded-2xl border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none transition-all h-[50px] text-sm resize-none"
                                placeholder="הערות להזמנה..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                        </section>
                    </div>

                    {/* Right: Summary */}
                    <div className="w-full lg:w-80 shrink-0">
                        <div className="bg-gray-900 text-white rounded-[1.5rem] md:rounded-[2rem] p-5 md:p-8 shadow-2xl sticky top-0">
                            <h3 className="text-lg md:text-xl font-black mb-4 md:mb-6 flex items-center gap-2 border-b border-white/10 pb-3 md:pb-4">
                                סיכום שינויים
                            </h3>

                            <div className="space-y-3 md:space-y-4 mb-5 md:mb-8 text-sm md:text-base">
                                <div className="flex justify-between text-gray-400 font-medium">
                                    <span>סכום ביניים</span>
                                    <span><span dir="ltr">₪ {subtotal.toLocaleString()}</span></span>
                                </div>
                                {coupon && (
                                    <div className="flex justify-between text-green-400 font-bold bg-green-400/10 p-2 rounded-xl border border-green-400/20">
                                        <div className="flex items-center gap-2">
                                            <Tag size={14} />
                                            <span>קופון ({coupon.code})</span>
                                        </div>
                                        <span><span dir="ltr">- ₪ {couponDiscount.toLocaleString()}</span></span>
                                    </div>
                                )}
                                <div className="flex justify-between text-gray-400 font-medium">
                                    <span>משלוח</span>
                                    <span>{shippingPrice === 0 ? 'חינם' : <span dir="ltr">₪ {shippingPrice}</span>}</span>
                                </div>
                                <div className="pt-3 md:pt-4 border-t border-white/10 flex justify-between items-end">
                                    <span className="text-xs md:text-sm font-bold opacity-60">סה"כ לתשלום</span>
                                    <span className="text-2xl md:text-3xl font-black text-blue-400 tracking-tight"><span dir="ltr">₪ {total.toLocaleString()}</span></span>
                                </div>
                            </div>

                            <button 
                                onClick={handleSave}
                                disabled={isSubmitting || cart.length === 0}
                                className={`w-full py-3 md:py-5 rounded-xl md:rounded-2xl font-black text-base md:text-lg transition-all flex items-center justify-center gap-2 ${
                                    isSubmitting || cart.length === 0
                                    ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/40'
                                }`}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        שומר שינויים...
                                    </>
                                ) : (
                                    'עדכן הזמנה'
                                )}
                            </button>
                            <p className="text-[9px] md:text-[10px] text-gray-400 mt-3 md:mt-4 text-center leading-relaxed">
                                לחיצה על עדכון תשלח מייל מעודכן ללקוח ולמנהל ותעדכן את המלאי בהתאם.
                            </p>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Product Size Selection Modal (Nested) */}
            <AnimatePresence>
                {showProductModal && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4"
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
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center font-bold transition-colors bg-white`}>
                                                        {size}
                                                    </div>
                                                    <div>
                                                        <div className={`font-black`}>{size}ml</div>
                                                        <div className="text-xs text-gray-500 uppercase font-black tracking-widest">דוגמית</div>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <div className="text-xl font-black text-blue-600"><span dir="ltr">₪ {discountedPrice}</span></div>
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
        </div>
    );
}
