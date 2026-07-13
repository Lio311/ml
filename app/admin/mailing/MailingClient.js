"use client";
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
    Mail, Plus, Calendar, Clock, Send, Trash2, Edit, ChevronRight, 
    User, Users, CheckCircle2, AlertCircle, RefreshCcw, 
    Settings, Play, ExternalLink, ShoppingBag, Search, X, MailCheck, Bell,
    History, Monitor
} from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { useUser } from '@clerk/nextjs';
import VisualEditor from '@/app/components/VisualEditor';
import ModernDateTimePicker from '@/app/components/ui/ModernDateTimePicker';
import ObjectTagInput from '@/app/components/ObjectTagInput';
import { generateCatalogHTML } from '@/app/lib/catalogEmailGenerator';

export default function MailingClient() {
    const { user } = useUser();
    const adminEmail = user?.primaryEmailAddress?.emailAddress || 'lior31197@gmail.com';
    const adminName = user?.firstName || 'מנהל';

    const [templates, setTemplates] = useState([]);
    const [campaigns, setCampaigns] = useState([]);
    const [users, setUsers] = useState([]);
    const [allProducts, setAllProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('templates'); // 'templates' | 'campaigns' | 'admin-alerts' | 'edit-template' | 'create-campaign' | 'push-notification'
    const [lastTab, setLastTab] = useState('templates'); 
    const [selectedCategory, setSelectedCategory] = useState('all');
    
    // Push State
    const [pushForm, setPushForm] = useState({ title: '', message: '', url: '/', image: '' });
    const [isSendingPush, setIsSendingPush] = useState(false);
    const [pushHistory, setPushHistory] = useState([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    
    // Editor / Form States
    const [activeTemplate, setActiveTemplate] = useState(null);
    const [activeCampaign, setActiveCampaign] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    
    // Catalog Selector State
    const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [productSearch, setProductSearch] = useState('');
    const [showStarterPicker, setShowStarterPicker] = useState(false);
    const editorInsertRef = useRef(null);

    useEffect(() => {
        fetchData();
        fetchUsers();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [tRes, cRes] = await Promise.all([
                fetch('/api/admin/mailing/templates'),
                fetch('/api/admin/mailing/campaigns')
            ]);
            if (tRes.ok) setTemplates(await tRes.json());
            if (cRes.ok) setCampaigns(await cRes.json());
        } catch (err) {
            toast.error('שגיאה בטעינת נתונים');
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/admin/users');
            if (res.ok) {
                const data = await res.json();
                setUsers(data || []);
            }
        } catch (err) {}
    };

    const fetchPushHistory = async () => {
        setIsLoadingHistory(true);
        try {
            const res = await fetch('/api/admin/push/history');
            if (res.ok) {
                const data = await res.json();
                setPushHistory(data || []);
            }
        } catch (err) {
            console.error('Error fetching push history:', err);
        } finally {
            setIsLoadingHistory(false);
        }
    };

    const fetchAllProducts = async () => {
        try {
            const res = await fetch('/api/products?limit=1000');
            if (res.ok) {
                const data = await res.json();
                setAllProducts(data.products || []);
            }
        } catch (err) {}
    };

    const getTemplateCategory = (slug) => {
        if (!slug) return 'general';
        if (['order_confirmation', 'status_update'].includes(slug)) return 'orders';
        if (['welcome', 'review_request', 'discovery_launch', 'monthly_discovery'].includes(slug)) return 'marketing';
        if (['cart_recovery', 'nurture_10_days', 'nurture_25_days', 'recommendations', 'monthly_recommendation', 'nurture_3_days'].includes(slug)) return 'retention';
        if (['educational'].includes(slug)) return 'educational';
        if (['back_in_stock', 'new_product', 'new_perfumes_batch', 'new_discovery_sets'].includes(slug)) return 'inventory';
        return 'general';
    };

    useEffect(() => {
        if (isCatalogModalOpen && allProducts.length === 0) {
            fetchAllProducts();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isCatalogModalOpen]);

    useEffect(() => {
        if (view === 'push-notification') {
            fetchPushHistory();
        }
    }, [view]);

    const handleSaveTemplate = async (template) => {
        setIsSaving(true);
        try {
            const res = await fetch('/api/admin/mailing/templates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: template.id,
                    name: template.name,
                    subject: template.subject,
                    content_html: template.content_html,
                    type: template.type || 'manual',
                    slug: template.slug,
                    is_active: template.is_active !== false
                })
            });
            if (res.ok) {
                toast.success('הטמפלייט נשמר בהצלחה');
                fetchData();
                setView(lastTab);
            } else {
                const err = await res.json();
                toast.error(err.error || 'שגיאה בשמירה');
            }
        } catch (err) {
            toast.error('שגיאה בתקשורת');
        } finally {
            setIsSaving(false);
        }
    };

    const handleResetToDefault = async (slug) => {
        if (!slug) return;
        
        toast((t) => (
            <div className="flex flex-col gap-3 text-right" dir="rtl">
                <span className="font-bold text-sm text-gray-900">האם לשחזר את העיצוב להגדרות המערכת המקוריות?</span>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">פעולה זו תדרוס את הטקסט הנוכחי בעורך (אל תשכח לשמור לאחר מכן)</p>
                <div className="flex gap-2 justify-end">
                    <button 
                        onClick={() => toast.dismiss(t.id)}
                        className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-lg transition-all"
                    >
                        ביטול
                    </button>
                    <button 
                        onClick={async () => {
                            toast.dismiss(t.id);
                            const tid = toast.loading('מושך עיצוב מהמערכת...');
                            try {
                                const res = await fetch(`/api/admin/mailing/templates?default=true&slug=${slug}`);
                                if (res.ok) {
                                    const data = await res.json();
                                    setActiveTemplate(prev => ({
                                        ...prev,
                                        subject: data.subject,
                                        content_html: data.content_html
                                    }));
                                    toast.success('העיצוב המקורי נטען לעורך! אל תשכח ללחוץ על שמירה.', { id: tid });
                                } else {
                                    toast.error('לא נמצא עיצוב מערכת לטמפלייט זה', { id: tid });
                                }
                            } catch (err) {
                                toast.error('שגיאה בתקשורת', { id: tid });
                            }
                        }}
                        className="px-3 py-1.5 text-xs font-black bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all"
                    >
                        שחזר עכשיו
                    </button>
                </div>
            </div>
        ), { duration: 6000, position: 'top-center' });
    };

    const handleSendTest = async (subject, html) => {
        let processedHtml = html || '';
        let processedSubject = subject || '';
        
        const mockData = {
            name: adminName,
            customerName: adminName,
            firstName: user?.firstName || 'ליאור',
            lastName: user?.lastName || 'בדיקה',
            phoneNumber: '0501234567',
            orderId: 'T-100',
            orderDate: new Intl.DateTimeFormat('he-IL', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Jerusalem' }).format(new Date()),
            total: '150',
            shippingCost: 'חינם',
            deliveryMethod: 'איסוף עצמי',
            notesHtml: `<div style="margin-top: 20px; background-color: #fffde7; padding: 15px 20px; border-radius: 16px; border: 1px dashed #fde047;"><div style="font-size: 12px; font-weight: 900; color: #ca8a04; margin-bottom: 5px; text-transform: uppercase;">הערות להזמנה:</div><div style="font-size: 14px; color: #854d0e;">זוהי הערת בדיקה במסגרת טסט של המערכת.</div></div>`,
            productsHtml: `<div style="background: white; border: 1px solid #eee; padding: 15px; border-radius: 8px; margin-bottom: 15px; text-align: center;"><br><strong>בושם לדוגמה</strong> - ml_tlv<br><span style="color: #666; font-size: 14px;">תווים דומים: בדיקה</span></div>`,
            itemsHtml: `
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
                    <thead>
                        <tr style="background-color: #f8f8f8; color: #999;">
                            <th style="padding: 12px 10px; text-align: right; font-size: 10px; font-weight: 900; text-transform: uppercase;">מוצר</th>
                            <th style="padding: 12px 10px; text-align: center; font-size: 10px; font-weight: 900; text-transform: uppercase;">כמות</th>
                            <th style="padding: 12px 10px; text-align: left; font-size: 10px; font-weight: 900; text-transform: uppercase;">מחיר</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr style="border-bottom: 1px solid #f5f5f5;">
                            <td style="padding: 12px 10px; text-align: right; font-size: 14px; color: #333;">
                                <img src="https://ml-tlv.com/logo.png" width="40" style="vertical-align: middle; margin-left: 10px; border-radius: 6px; display: inline-block; border: 1px solid #f0f0f0; height: auto; max-height: 40px; object-fit: contain;" alt="product test" />
                                <span style="vertical-align: middle;">בושם לדוגמה טסט (10 מ"ל)</span>
                            </td>
                            <td style="padding: 12px 10px; text-align: center; font-size: 14px; color: #333;">1</td>
                            <td style="padding: 12px 10px; text-align: left; font-size: 14px; font-weight: bold; color: #000;">150 ₪</td>
                        </tr>
                    </tbody>
                </table>
            `,
            itemsHtmlAdmin: `
                <li style="margin-bottom: 12px; border-bottom: 1px solid #f0f0f0; padding-bottom: 12px; display: table; width: 100%;">
                    <div style="display: table-cell; vertical-align: middle; width: 50px;"><img src="https://ml-tlv.com/logo.png" width="40" style="border-radius: 6px; border: 1px solid #f0f0f0; height: auto; max-height: 40px; object-fit: contain;" alt="product test" /></div>
                    <div style="display: table-cell; vertical-align: middle;">
                        <span style="font-weight: 900; color: #000;">בושם לדוגמה טסט ml_tlv</span>
                        <div style="font-size: 12px; color: #666;">10ml x1</div>
                    </div>
                </li>
            `,
            message: 'זוהי הודעת בדיקה שנשלחה מעמוד צור קשר באתר.',
            email: adminEmail
        };

        Object.keys(mockData).forEach(key => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            processedHtml = processedHtml.replace(regex, mockData[key]);
            processedSubject = processedSubject.replace(regex, mockData[key]);
        });

        // Clear out any remaining unmapped placeholders
        processedHtml = processedHtml.replace(/\{\{(.*?)\}\}/g, '');
        processedSubject = processedSubject.replace(/\{\{(.*?)\}\}/g, '');

        toast.promise(
            fetch('/api/admin/mailing/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    recipient_type: 'specific',
                    recipients: [adminEmail],
                    subject: processedSubject,
                    content_html: processedHtml,
                    title: 'בדיקת מערכת'
                })
            }).then(async res => {
                if (!res.ok) throw new Error(await res.text());
                return res.json();
            }),
            {
                loading: 'שולח מייל בדיקה...',
                success: `מייל בדיקה נשלח ל-${adminEmail}`,
                error: 'שגיאה בשליחת בדיקה'
            }
        );
    };

    const handleSendCampaign = async (campaignId) => {
        const toastId = toast.loading('מתחיל שליחת דיוור...');
        try {
            const res = await fetch('/api/admin/mailing/campaigns/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ campaignId })
            });

            if (res.ok) {
                const result = await res.json();
                toast.success(`הדיוור נשלח בהצלחה ל-${result.sent} נמענים!`, { id: toastId });
                fetchData();
            } else {
                const data = await res.json();
                toast.error(data.error || 'שגיאה בשליחת הדיוור', { id: toastId });
            }
        } catch (err) {
            toast.error('שגיאה בתקשורת עם השרת', { id: toastId });
        }
    };

    const handleSendPush = async () => {
        if (!pushForm.title || !pushForm.message) {
            toast.error('נא להזין כותרת והודעה');
            return;
        }

        setIsSendingPush(true);
        const tid = toast.loading('שולח התראות Push...');
        try {
            const res = await fetch('/api/admin/push/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(pushForm)
            });

            if (res.ok) {
                const result = await res.json();
                toast.success(`ההתראה נשלחה ל-${result.sent} מכשירים!`, { id: tid });
                setPushForm({ title: '', message: '', url: '/', image: '' });
                fetchPushHistory();
            } else {
                const err = await res.json();
                toast.error(err.error || 'שגיאה בשליחת ההתראה', { id: tid });
            }
        } catch (err) {
            toast.error('שגיאה בתקשורת עם השרת', { id: tid });
        } finally {
            setIsSendingPush(false);
        }
    };


    const handleCreateCampaign = async (campaignData) => {
        setIsSaving(true);
        try {
            const res = await fetch('/api/admin/mailing/campaigns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(campaignData)
            });
            if (res.ok) {
                toast.success('הדיוור תוזמן בהצלחה');
                fetchData();
                setView('campaigns');
            } else {
                toast.error('שגיאה ביצירת דיוור');
            }
        } catch (err) {
            toast.error('שגיאה בתקשורת');
        } finally {
            setIsSaving(false);
        }
    };

    const deleteTemplate = async (id) => {
        toast((t) => (
            <div className="flex flex-col gap-3">
                <span className="font-bold text-sm text-gray-900">האם אתה בטוח שברצונך למחוק טמפלייט זה?</span>
                <div className="flex gap-2 justify-end">
                    <button 
                        onClick={() => toast.dismiss(t.id)}
                        className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-lg transition-all"
                    >
                        ביטול
                    </button>
                    <button 
                        onClick={async () => {
                            toast.dismiss(t.id);
                            try {
                                const res = await fetch(`/api/admin/mailing/templates?id=${id}`, { method: 'DELETE' });
                                if (res.ok) {
                                    toast.success('הטמפלייט נמחק בהצלחה');
                                    fetchData();
                                } else {
                                    const data = await res.json();
                                    toast.error(data.error || 'שגיאה במחיקה');
                                }
                            } catch (err) {
                                toast.error('שגיאה בתקשורת');
                            }
                        }}
                        className="px-3 py-1.5 text-xs font-black bg-red-500 text-white rounded-lg hover:bg-red-600 shadow-lg shadow-red-200 transition-all"
                    >
                        מחק לצמיתות
                    </button>
                </div>
            </div>
        ), { duration: 5000, position: 'top-center' });
    };

    const deleteCampaign = async (id) => {
        toast((t) => (
            <div className="flex flex-col gap-3">
                <span className="font-bold text-sm text-gray-900">האם לבטל ולמחוק דיוור זה?</span>
                <div className="flex gap-2 justify-end">
                    <button 
                        onClick={() => toast.dismiss(t.id)}
                        className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-lg transition-all"
                    >
                        חזור
                    </button>
                    <button 
                        onClick={async () => {
                            toast.dismiss(t.id);
                            try {
                                const res = await fetch(`/api/admin/mailing/campaigns?id=${id}`, { method: 'DELETE' });
                                if (res.ok) {
                                    toast.success('הדיוור בוטל ונמחק');
                                    fetchData();
                                } else {
                                    toast.error('שגיאה בביטול הדיוור');
                                }
                            } catch (err) {
                                toast.error('שגיאה בתקשורת');
                            }
                        }}
                        className="px-3 py-1.5 text-xs font-black bg-black text-white rounded-lg hover:bg-gray-800 shadow-lg transition-all"
                    >
                        בטל שליחה
                    </button>
                </div>
            </div>
        ), { duration: 5000, position: 'top-center' });
    };

    const handleInjectCatalog = () => {
        if (selectedProducts.length === 0) {
            toast.error('נא לבחור מוצרים לקטלוג');
            return;
        }
        const html = generateCatalogHTML(selectedProducts);
        if (editorInsertRef.current) {
            editorInsertRef.current(html);
            setIsCatalogModalOpen(false);
            setSelectedProducts([]);
            toast.success('הקטלוג הוזרק לעורך המייל');
        } else {
            toast.error('שגיאה בהזרקה לעורך');
        }
    };

    const starterTemplates = [
        {
            id: 'announcement',
            name: 'הודעה / עדכון',
            emoji: '📢',
            desc: 'עדכון כללי, חדשות, או הודעה ללקוחות',
            preview: 'bg-gradient-to-br from-blue-50 to-indigo-50',
            html: `<div dir="rtl" style="font-family: 'Open Sans', 'Open Sans Hebrew', Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; line-height: 1.6;">
    <div style="background-color: #fff; padding: 30px; border-radius: 24px; border: 1px solid #f0f0f0; box-shadow: 0 4px 20px rgba(0,0,0,0.03);">
        <h1 style="margin: 0 0 10px; font-size: 24px; font-weight: 900; color: #000; text-align: center;">כותרת ההודעה שלך ✨</h1>
        <p style="margin: 0 0 25px; color: #666; text-align: center;">היי {{name}},</p>
        <p style="margin-bottom: 20px; color: #333;">כאן תוכל לכתוב את תוכן ההודעה שלך. תוכל לספר על עדכונים חדשים, שינויים בשירות, או כל מידע שתרצה לשתף עם הלקוחות.</p>
        <div style="background-color: #f8f8f8; padding: 20px; border-radius: 16px; margin: 25px 0;">
            <p style="margin: 0; font-weight: 900; color: #000;">💡 טיפ:</p>
            <p style="margin: 5px 0 0; color: #666; font-size: 14px;">תוכל להוסיף כל מידע חשוב כאן בתיבה המודגשת.</p>
        </div>
        <div style="text-align: center; margin-top: 30px;">
            <a href="https://www.ml-tlv.com" style="display: inline-block; background-color: #000; color: #fff; padding: 16px 32px; text-decoration: none; border-radius: 16px; font-weight: 900; font-size: 14px;">לצפייה באתר</a>
        </div>
    </div>
    <div style="text-align: center; padding: 30px 0; color: #ccc; font-size: 11px;">ml - יוקרה בחתיכות קטנות</div>
</div>`
        },
        {
            id: 'promotion',
            name: 'מבצע / הנחה',
            emoji: '🔥',
            desc: 'קודי קופון, מבצעים, או הנחות מיוחדות',
            preview: 'bg-gradient-to-br from-orange-50 to-red-50',
            html: `<div dir="rtl" style="font-family: 'Open Sans', 'Open Sans Hebrew', Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; line-height: 1.6;">
    <div style="background-color: #fff; padding: 30px; border-radius: 24px; border: 1px solid #f0f0f0; box-shadow: 0 4px 20px rgba(0,0,0,0.03);">
        <h1 style="margin: 0 0 10px; font-size: 24px; font-weight: 900; color: #000; text-align: center;">🔥 מבצע מיוחד רק בשבילך!</h1>
        <p style="margin: 0 0 25px; color: #666; text-align: center;">היי {{name}}, יש לנו הפתעה קטנה...</p>
        <div style="background: linear-gradient(135deg, #000 0%, #333 100%); color: #fff; padding: 30px; border-radius: 20px; text-align: center; margin: 25px 0;">
            <div style="font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 3px; opacity: 0.7; margin-bottom: 10px;">קוד קופון בלעדי</div>
            <div style="font-size: 36px; font-weight: 900; letter-spacing: 4px; margin-bottom: 10px;">MLVIP</div>
            <div style="font-size: 18px; font-weight: 900;">15% הנחה על כל ההזמנה</div>
            <div style="font-size: 12px; opacity: 0.6; margin-top: 10px;">תקף עד XX/XX/XXXX</div>
        </div>
        <p style="margin-bottom: 20px; color: #333; text-align: center;">לא לפספס — המבצע תקף לזמן מוגבל בלבד!</p>
        <div style="text-align: center; margin-top: 30px;">
            <a href="https://www.ml-tlv.com/catalog" style="display: inline-block; background-color: #000; color: #fff; padding: 16px 32px; text-decoration: none; border-radius: 16px; font-weight: 900; font-size: 14px;">לקטלוג המלא &gt;&gt;</a>
        </div>
    </div>
    <div style="text-align: center; padding: 30px 0; color: #ccc; font-size: 11px;">ml - יוקרה בחתיכות קטנות</div>
</div>`
        },
        {
            id: 'info',
            name: 'מידע / טיפים',
            emoji: '📋',
            desc: 'תוכן חינוכי, טיפים, או מדריכים',
            preview: 'bg-gradient-to-br from-emerald-50 to-teal-50',
            html: `<div dir="rtl" style="font-family: 'Open Sans', 'Open Sans Hebrew', Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; line-height: 1.6;">
    <div style="background-color: #fff; padding: 30px; border-radius: 24px; border: 1px solid #f0f0f0; box-shadow: 0 4px 20px rgba(0,0,0,0.03);">
        <h1 style="margin: 0 0 10px; font-size: 24px; font-weight: 900; color: #000; text-align: center;">ידעת ש...? 💡</h1>
        <p style="margin: 0 0 25px; color: #666; text-align: center;">היי {{name}}, הכנו בשבילך כמה טיפים שימושיים</p>
        <div style="background-color: #f8f8f8; padding: 20px; border-radius: 16px; margin-bottom: 20px; border-right: 4px solid #000;">
            <h3 style="margin: 0 0 8px; font-size: 16px; font-weight: 900; color: #000;">טיפ #1</h3>
            <p style="margin: 0; color: #666; font-size: 14px;">כאן תוכל לכתוב את הטיפ הראשון שלך ללקוחות.</p>
        </div>
        <div style="background-color: #f8f8f8; padding: 20px; border-radius: 16px; margin-bottom: 20px; border-right: 4px solid #000;">
            <h3 style="margin: 0 0 8px; font-size: 16px; font-weight: 900; color: #000;">טיפ #2</h3>
            <p style="margin: 0; color: #666; font-size: 14px;">כאן תוכל לכתוב את הטיפ השני שלך.</p>
        </div>
        <div style="background-color: #f8f8f8; padding: 20px; border-radius: 16px; margin-bottom: 20px; border-right: 4px solid #000;">
            <h3 style="margin: 0 0 8px; font-size: 16px; font-weight: 900; color: #000;">טיפ #3</h3>
            <p style="margin: 0; color: #666; font-size: 14px;">ואת הטיפ השלישי כאן.</p>
        </div>
        <div style="text-align: center; margin-top: 30px;">
            <a href="https://www.ml-tlv.com/catalog" style="display: inline-block; background-color: #000; color: #fff; padding: 16px 32px; text-decoration: none; border-radius: 16px; font-weight: 900; font-size: 14px;">לגלות עוד &gt;&gt;</a>
        </div>
    </div>
    <div style="text-align: center; padding: 30px 0; color: #ccc; font-size: 11px;">ml - יוקרה בחתיכות קטנות</div>
</div>`
        },
        {
            id: 'blank',
            name: 'ריק',
            emoji: '📄',
            desc: 'מסגרת בסיסית ריקה עם לוגו ופוטר',
            preview: 'bg-gradient-to-br from-gray-50 to-gray-100',
            html: `<div dir="rtl" style="font-family: 'Open Sans', 'Open Sans Hebrew', Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; line-height: 1.6;">
    <div style="background-color: #fff; padding: 30px; border-radius: 24px; border: 1px solid #f0f0f0; box-shadow: 0 4px 20px rgba(0,0,0,0.03);">
        <p>היי {{name}},</p>
        <p>כאן תוכן המייל שלך...</p>
    </div>
    <div style="text-align: center; padding: 30px 0; color: #ccc; font-size: 11px;">ml - יוקרה בחתיכות קטנות</div>
</div>`
        }
    ];

    return (
        <div className="container mx-auto py-8 px-4 text-right" dir="rtl">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-0 mb-8">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                         דיוור ושיווק
                    </h1>
                    <p className="text-gray-500 font-bold mt-1 uppercase text-[10px] tracking-widest">Email Templates & Campaigns</p>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <button 
                        onClick={() => setShowStarterPicker(true)}
                        className="w-full md:w-auto justify-center bg-black text-white px-6 py-3 rounded-2xl font-black text-sm shadow-xl shadow-black/10 hover:shadow-black/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
                    >
                        <Plus size={18} /> טמפלייט חדש
                    </button>
                </div>
            </header>

            {/* Navigation Tabs */}
            {(view === 'templates' || view === 'campaigns' || view === 'admin-alerts' || view === 'push-notification') && (
                <div className="flex flex-wrap sm:flex-nowrap gap-2 mb-8 bg-gray-100 p-1.5 rounded-3xl w-full sm:w-fit mx-auto md:mx-0 justify-center">
                    <button 
                        onClick={() => { setView('templates'); setLastTab('templates'); }}
                        className={`flex-1 sm:flex-none px-4 sm:px-8 py-2.5 sm:py-3 rounded-[1.5rem] font-black text-[11px] sm:text-sm transition-all ${view === 'templates' ? 'bg-white text-black shadow-lg shadow-white/20' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        מייל ללקוחות
                    </button>
                    <button 
                        onClick={() => { setView('admin-alerts'); setLastTab('admin-alerts'); }}
                        className={`flex-1 sm:flex-none px-4 sm:px-8 py-2.5 sm:py-3 rounded-[1.5rem] font-black text-[11px] sm:text-sm transition-all ${view === 'admin-alerts' ? 'bg-white text-black shadow-lg shadow-white/20' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        התראות מנהל
                    </button>
                    <button 
                        onClick={() => { setView('campaigns'); setLastTab('campaigns'); }}
                        className={`flex-1 sm:flex-none px-4 sm:px-8 py-2.5 sm:py-3 rounded-[1.5rem] font-black text-[11px] sm:text-sm transition-all ${view === 'campaigns' ? 'bg-white text-black shadow-lg shadow-white/20' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        דיוורים מתוזמנים
                    </button>
                    <button 
                        onClick={() => { setView('push-notification'); setLastTab('push-notification'); }}
                        className={`flex-1 sm:flex-none px-4 sm:px-8 py-2.5 sm:py-3 rounded-[1.5rem] font-black text-[11px] sm:text-sm transition-all ${view === 'push-notification' ? 'bg-white text-black shadow-lg shadow-white/20' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        התראות Push
                    </button>
                </div>
            )}

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <RefreshCcw className="animate-spin text-gray-200" size={48} />
                    <p className="font-black text-gray-300 uppercase text-xs tracking-widest">טוען מערכת...</p>
                </div>
            ) : (
                <>
                    {view === 'templates' && (
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
                                <button 
                                    onClick={() => setSelectedCategory('all')}
                                    className={`px-4 py-1.5 rounded-full text-xs font-black transition-all whitespace-nowrap ${selectedCategory === 'all' ? 'bg-black text-white shadow-md' : 'bg-white text-gray-400 border border-gray-100 hover:bg-gray-50'}`}
                                >
                                    הכל
                                </button>
                                <button 
                                    onClick={() => setSelectedCategory('orders')}
                                    className={`px-4 py-1.5 rounded-full text-xs font-black transition-all whitespace-nowrap ${selectedCategory === 'orders' ? 'bg-black text-white shadow-md' : 'bg-white text-gray-400 border border-gray-100 hover:bg-gray-50'}`}
                                >
                                    הזמנות
                                </button>
                                <button 
                                    onClick={() => setSelectedCategory('marketing')}
                                    className={`px-4 py-1.5 rounded-full text-xs font-black transition-all whitespace-nowrap ${selectedCategory === 'marketing' ? 'bg-black text-white shadow-md' : 'bg-white text-gray-400 border border-gray-100 hover:bg-gray-50'}`}
                                >
                                    שיווק
                                </button>
                                <button 
                                    onClick={() => setSelectedCategory('retention')}
                                    className={`px-4 py-1.5 rounded-full text-xs font-black transition-all whitespace-nowrap ${selectedCategory === 'retention' ? 'bg-black text-white shadow-md' : 'bg-white text-gray-400 border border-gray-100 hover:bg-gray-50'}`}
                                >
                                    שימור לקוחות
                                </button>
                                <button 
                                    onClick={() => setSelectedCategory('educational')}
                                    className={`px-4 py-1.5 rounded-full text-xs font-black transition-all whitespace-nowrap ${selectedCategory === 'educational' ? 'bg-black text-white shadow-md' : 'bg-white text-gray-400 border border-gray-100 hover:bg-gray-50'}`}
                                >
                                    הסברים
                                </button>
                                <button 
                                    onClick={() => setSelectedCategory('inventory')}
                                    className={`px-4 py-1.5 rounded-full text-xs font-black transition-all whitespace-nowrap ${selectedCategory === 'inventory' ? 'bg-black text-white shadow-md' : 'bg-white text-gray-400 border border-gray-100 hover:bg-gray-50'}`}
                                >
                                    מלאי
                                </button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {templates.filter(t => {
                                    if (t.slug?.includes('admin_') || t.slug?.includes('contact_form') || t.slug === 'admin_alert' || t.slug === 'daily_summary') return false;
                                    if (selectedCategory === 'all') return true;
                                    return getTemplateCategory(t.slug) === selectedCategory;
                                }).map(t => (
                                <TemplateCard 
                                    key={t.id} 
                                    template={t} 
                                    onEdit={() => { setLastTab('templates'); setActiveTemplate(t); setView('edit-template'); }}
                                    onDelete={() => deleteTemplate(t.id)}
                                    onSendTest={() => handleSendTest(t.subject, t.content_html)}
                                    onSend={() => { 
                                        setLastTab(view);
                                        setActiveCampaign({ 
                                            template_id: t.id, 
                                            title: `קמפיין - ${t.name}`, 
                                            subject: t.subject || '', 
                                            content_html: t.content_html || '',
                                            recipient_type: 'all',
                                            scheduled_at: null
                                        }); 
                                        setView('create-campaign'); 
                                    }}
                                />
                            ))}
                            </div>
                        </div>
                    )}

                    {view === 'admin-alerts' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {templates.filter(t => (t.slug?.includes('admin_') || t.slug?.includes('contact_form') || t.slug === 'daily_summary') && t.slug !== 'admin_alert').map(t => (
                                <TemplateCard 
                                    key={t.id} 
                                    template={t} 
                                    onEdit={() => { setLastTab('admin-alerts'); setActiveTemplate(t); setView('edit-template'); }}
                                    onDelete={() => deleteTemplate(t.id)}
                                    onSendTest={() => handleSendTest(t.subject, t.content_html)}
                                    onSend={null} // Usually no direct send for admin alerts
                                />
                            ))}
                        </div>
                    )}

                    {view === 'campaigns' && (
                        <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                            <div className="w-full">
                                <div className="hidden md:grid md:grid-cols-6 bg-gray-50/50 text-gray-400 font-black text-[10px] uppercase tracking-widest border-b border-gray-100">
                                    <div className="p-6 text-right">קמפיין</div>
                                    <div className="p-6 text-right">טמפלייט</div>
                                    <div className="p-6 text-center">זמן שליחה</div>
                                    <div className="p-6 text-center">נמענים</div>
                                    <div className="p-6 text-center">סטטוס</div>
                                    <div className="p-6 text-center">פעולות</div>
                                </div>
                                <div className="divide-y divide-gray-50 flex flex-col">
                                    {campaigns.length === 0 ? (
                                        <div className="p-20 text-center text-gray-300 font-bold">אין דיוורים ברשימה</div>
                                    ) : (
                                        campaigns.map(c => (
                                            <CampaignRow 
                                                key={c.id} 
                                                campaign={c} 
                                                onDelete={() => deleteCampaign(c.id)} 
                                                onSend={() => handleSendCampaign(c.id)}
                                            />
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {view === 'push-notification' && (
                        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
                            {/* Push Form */}
                            <div className="bg-white p-6 md:p-10 rounded-[2.5rem] shadow-xl border border-gray-50 flex flex-col md:flex-row gap-8 md:gap-12">
                                <div className="flex-1 space-y-8">
                                    <div className="flex items-center gap-4 border-b border-gray-50 pb-6">
                                        <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500 shadow-inner">
                                            <Bell className="w-8 h-8" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-black text-gray-900">שליחת התראת Push</h2>
                                            <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Broadcast to browser subscribers</p>
                                        </div>
                                    </div>

                                    <div className="space-y-5">
                                        <div className="space-y-2">
                                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest px-2">כותרת ההתראה</label>
                                            <input 
                                                className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all font-bold"
                                                value={pushForm.title}
                                                onChange={e => setPushForm({...pushForm, title: e.target.value})}
                                                placeholder="מה הכותרת שתוצג בטלפון/מחשב?"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest px-2">תוכן ההודעה</label>
                                            <textarea 
                                                className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all font-bold min-h-[100px]"
                                                value={pushForm.message}
                                                onChange={e => setPushForm({...pushForm, message: e.target.value})}
                                                placeholder="כתוב כאן את המסר הקצר שלך..."
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest px-2">לינק ליעד (URL)</label>
                                                <input 
                                                    className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all font-bold text-sm"
                                                    value={pushForm.url}
                                                    onChange={e => setPushForm({...pushForm, url: e.target.value})}
                                                    placeholder="/catalog or https://..."
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest px-2">לינק לתמונה (אופציונלי)</label>
                                                <input 
                                                    className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-100 transition-all font-bold text-sm"
                                                    value={pushForm.image}
                                                    onChange={e => setPushForm({...pushForm, image: e.target.value})}
                                                    placeholder="https://... (תמונה גדולה)"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-6 border-t border-gray-50">
                                        <button 
                                            disabled={isSendingPush || !pushForm.title || !pushForm.message}
                                            onClick={handleSendPush}
                                            className="w-full py-4 bg-black text-white rounded-2xl font-black hover:bg-gray-800 shadow-2xl shadow-black/20 active:scale-95 transition-all text-lg disabled:opacity-50 disabled:scale-100 flex items-center justify-center"
                                        >
                                            {isSendingPush ? (
                                                <div className="flex items-center gap-3">
                                                    <RefreshCcw className="animate-spin" size={20} />
                                                    שולח כעת...
                                                </div>
                                            ) : (
                                                "שלח לכל המנויים"
                                            )}
                                        </button>
                                        <p className="text-center text-[10px] text-gray-400 font-bold mt-4 uppercase tracking-widest">
                                            ההתראה תישלח לכל הדפדפנים והמכשירים שאישרו קבלת התראות
                                        </p>
                                    </div>
                                </div>
                                
                                {/* Preview / Info Column (Optional, but makes it look professional) */}
                                <div className="hidden lg:flex w-72 flex-col gap-6">
                                    <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100 space-y-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Monitor size={18} className="text-gray-400" />
                                            <span className="font-black text-gray-400 text-[10px] uppercase tracking-widest">תצוגה מקדימה</span>
                                        </div>
                                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                            <div className="p-3 bg-gray-100/50 flex items-center gap-2 border-b border-gray-100">
                                                <div className="w-4 h-4 rounded bg-black/10" />
                                                <div className="w-16 h-1 bg-black/5 rounded-full" />
                                            </div>
                                            <div className="p-4 space-y-2">
                                                <div className="font-black text-xs text-black truncate">{pushForm.title || 'כותרת ההתראה'}</div>
                                                <div className="text-[10px] text-gray-500 leading-snug line-clamp-2">{pushForm.message || 'תוכן ההודעה שתוצג למשתמש...'}</div>
                                                {pushForm.image && (
                                                    <div className="mt-2 aspect-video bg-gray-50 rounded-lg overflow-hidden border border-gray-100">
                                                        <img src={pushForm.image} alt="Push image" className="w-full h-full object-cover opacity-50" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="px-4 text-[10px] text-gray-400 font-bold leading-relaxed">
                                        * שים לב: התראות Push פועלות רק במכשירים שתומכים בשירות (Chrome, Edge, Safari, Android). ב-iOS נדרשת גרסה 16.4 ומעלה.
                                    </div>
                                </div>
                            </div>

                            {/* Push History Section */}
                            <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-xl border border-gray-50 space-y-6">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                                            <History className="text-indigo-600" /> היסטוריית התראות
                                        </h3>
                                        <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest">Review past broadcast performance</p>
                                    </div>
                                    <button 
                                        onClick={fetchPushHistory}
                                        className="p-2 hover:bg-gray-100 rounded-xl transition-all text-gray-400"
                                        title="רענן היסטוריה"
                                    >
                                        <RefreshCcw size={18} className={isLoadingHistory ? 'animate-spin' : ''} />
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {isLoadingHistory && pushHistory.length === 0 ? (
                                        <div className="py-10 text-center animate-pulse">
                                            <div className="w-12 h-1 bg-gray-100 rounded-full mx-auto mb-4" />
                                            <div className="text-gray-300 font-black text-xs uppercase tracking-widest">טוען היסטוריה...</div>
                                        </div>
                                    ) : pushHistory.length === 0 ? (
                                        <div className="py-12 text-center text-gray-300 font-bold border-2 border-dashed border-gray-50 rounded-[2rem]">
                                            טרם נשלחו התראות Push מהמערכת
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto -mx-6 px-6 no-scrollbar">
                                            <table className="w-full text-right border-separate border-spacing-y-2">
                                                <thead>
                                                    <tr className="text-gray-400 text-[10px] font-black uppercase tracking-widest px-4">
                                                        <th className="pb-2 pr-4 font-black">התראה</th>
                                                        <th className="pb-2 text-center font-black">זמן</th>
                                                        <th className="pb-2 text-center font-black">תוצאות</th>
                                                        <th className="pb-2 text-center font-black">שולח</th>
                                                        <th className="pb-2"></th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {pushHistory.map((item) => (
                                                        <tr key={item.id} className="group hover:bg-gray-50 transition-all rounded-2xl overflow-hidden">
                                                            <td className="py-4 pr-4 bg-gray-50/50 group-hover:bg-white rounded-r-2xl border-y border-r border-transparent">
                                                                <div className="flex flex-col">
                                                                    <span className="font-black text-gray-900 text-sm">{item.title}</span>
                                                                    <span className="text-[10px] text-gray-400 font-bold line-clamp-1 max-w-[200px]">{item.message}</span>
                                                                </div>
                                                            </td>
                                                            <td className="py-4 text-center bg-gray-50/50 group-hover:bg-white border-y border-transparent">
                                                                <div className="flex flex-col items-center">
                                                                    <span className="text-[11px] font-bold text-gray-800">{format(new Date(item.sent_at), 'dd/MM/yy')}</span>
                                                                    <span className="text-[10px] text-gray-400 font-bold">{format(new Date(item.sent_at), 'HH:mm')}</span>
                                                                </div>
                                                            </td>
                                                            <td className="py-4 text-center bg-gray-50/50 group-hover:bg-white border-y border-transparent">
                                                                <div className="flex items-center justify-center gap-3">
                                                                    <div className="flex flex-col items-center">
                                                                        <span className="text-xs font-black text-green-600">{item.sent_count}</span>
                                                                        <span className="text-[8px] font-bold text-gray-400 uppercase">נמסרו</span>
                                                                    </div>
                                                                    {item.fail_count > 0 && (
                                                                        <div className="flex flex-col items-center">
                                                                            <span className="text-xs font-black text-red-400">{item.fail_count}</span>
                                                                            <span className="text-[8px] font-bold text-gray-400 uppercase">נכשלו</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="py-4 text-center bg-gray-50/50 group-hover:bg-white border-y border-transparent">
                                                                <span className="text-[10px] font-black text-gray-500 bg-white px-2.5 py-1 rounded-full border border-gray-100 group-hover:border-gray-200">{item.admin_name || 'Admin'}</span>
                                                            </td>
                                                            <td className="py-4 pl-4 bg-gray-50/50 group-hover:bg-white rounded-l-2xl border-y border-l border-transparent text-left">
                                                                <button 
                                                                    onClick={() => setPushForm({ title: item.title, message: item.message, url: item.url, image: item.image })}
                                                                    className="p-2 hover:bg-black hover:text-white rounded-xl transition-all"
                                                                    title="שכפל לקמפיין חדש"
                                                                >
                                                                    <RefreshCcw size={14} />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) || null}


                    {view === 'edit-template' && (
                        <div className="max-w-4xl mx-auto space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                             <div className="bg-white p-4 md:p-8 rounded-3xl md:rounded-[3rem] shadow-xl border border-gray-50 space-y-6">
                                <div className="flex justify-between items-center mb-2">
                                    <button 
                                        onClick={() => setView(lastTab)}
                                        className="px-4 py-2 hover:bg-gray-50 rounded-2xl flex items-center gap-2 text-gray-500 font-bold transition-all text-sm md:text-base"
                                    >
                                        <ChevronRight size={18} /> חזרה
                                    </button>
                                </div>
                                <div className="flex flex-col md:grid md:grid-cols-2 gap-4 md:gap-6">
                                    <div className="space-y-2">
                                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest px-2">שם הטמפלייט (לשימוש פנימי)</label>
                                        <input 
                                            className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-100 transition-all font-bold text-lg"
                                            value={activeTemplate.name || ''}
                                            onChange={e => setActiveTemplate(prev => ({...prev, name: e.target.value}))}
                                            placeholder="לדוגמה: מייל ברוכים הבאים חגיגי"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest px-2">נושא המייל (Subject)</label>
                                        <input 
                                            className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-100 transition-all font-bold text-lg"
                                            value={activeTemplate.subject || ''}
                                            onChange={e => setActiveTemplate(prev => ({...prev, subject: e.target.value}))}
                                            placeholder="מה הלקוח יראה בכותרת המייל?"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest px-2 flex justify-between">
                                        <span>תוכן המייל</span>
                                        <button 
                                            onClick={() => setIsCatalogModalOpen(true)}
                                            className="text-indigo-600 hover:text-indigo-800 font-black text-[10px] uppercase flex items-center gap-1.5 transition-all"
                                        >
                                            <ShoppingBag size={14} /> הוסף קטלוג מוצרים
                                        </button>
                                    </label>
                                    <VisualEditor 
                                        value={activeTemplate.content_html || ''} 
                                        onChange={val => setActiveTemplate(prev => ({...prev, content_html: val}))}
                                        onInsertHTML={editorInsertRef}
                                    />
                                </div>

                                <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end pt-4">
                                    {activeTemplate.slug && (
                                        <button 
                                            onClick={() => handleResetToDefault(activeTemplate.slug)}
                                            className="w-full sm:w-auto justify-center px-6 py-3 rounded-2xl font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all flex items-center gap-2"
                                            title="שחזר לעיצוב המקורי של המערכת (600px)"
                                        >
                                            שחזר עיצוב <RefreshCcw size={18} />
                                        </button>
                                    )}
                                    <button 
                                        onClick={() => handleSendTest(activeTemplate.subject, activeTemplate.content_html)}
                                        className="w-full sm:w-auto justify-center px-6 py-3 rounded-2xl font-bold bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all flex items-center gap-2"
                                    >
                                        שלח בדיקה <Mail size={18} />
                                    </button>
                                    <button 
                                        disabled={isSaving}
                                        onClick={() => handleSaveTemplate(activeTemplate)}
                                        className="w-full sm:w-auto justify-center px-10 py-3 rounded-2xl font-black bg-black text-white hover:bg-gray-800 shadow-xl shadow-black/10 active:scale-95 transition-all"
                                    >
                                        {isSaving ? 'שומר...' : 'שמור טמפלייט'}
                                    </button>
                                </div>
                             </div>
                        </div>
                    )}

                    {view === 'create-campaign' && (
                        <div className="max-w-4xl mx-auto space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                             <div className="bg-white p-4 md:p-8 rounded-3xl md:rounded-[3rem] shadow-xl border border-gray-50 space-y-6 md:space-y-8">
                                <div className="flex justify-between items-center mb-2">
                                    <button 
                                        onClick={() => setView(lastTab)}
                                        className="px-4 py-2 hover:bg-gray-50 rounded-2xl flex items-center gap-2 text-gray-500 font-bold transition-all text-sm md:text-base"
                                    >
                                        <ChevronRight size={18} /> חזרה
                                    </button>
                                </div>
                                <div className="flex items-center gap-3 md:gap-4 border-b border-gray-50 pb-4 md:pb-6 mb-2">
                                    <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-50 rounded-2xl md:rounded-[1.5rem] flex items-center justify-center text-blue-500 shrink-0">
                                        <Send className="w-6 h-6 md:w-8 md:h-8" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl md:text-2xl font-black text-gray-900">הגדרת דיוור חדש</h2>
                                        <p className="text-gray-400 font-bold text-[10px] md:text-xs">קמפיין שליחה מתוזמן</p>
                                    </div>
                                </div>

                                <div className="flex flex-col md:grid md:grid-cols-2 gap-6 md:gap-8">
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest px-2">כותרת הקמפיין (לשימוש פנימי)</label>
                                            <input 
                                                className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-100 transition-all font-bold"
                                                value={activeCampaign.title || ''}
                                                onChange={e => setActiveCampaign(prev => ({...prev, title: e.target.value}))}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest px-2">נושא המייל</label>
                                            <input 
                                                className="w-full px-5 py-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 focus:ring-blue-100 transition-all font-bold"
                                                value={activeCampaign.subject || ''}
                                                onChange={e => setActiveCampaign(prev => ({...prev, subject: e.target.value}))}
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest px-2">תזמון שליחה</label>
                                            <ModernDateTimePicker 
                                                value={activeCampaign.scheduled_at}
                                                onChange={val => setActiveCampaign(prev => ({...prev, scheduled_at: val}))}
                                                placeholder="שלח מיד (או בחר זמן...)"
                                            />
                                            <p className="text-[10px] text-gray-400 font-bold px-2">אם לא נבחר זמן, המייל יישלח בהרצה הקרובה של המערכת.</p>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 p-6 rounded-[2.5rem] space-y-6 flex flex-col">
                                        <h3 className="font-black text-gray-900 flex items-center gap-2">
                                            <Users size={18} className="text-blue-500" /> בחירת נמענים
                                        </h3>
                                        
                                        <div className="flex bg-white p-1.5 rounded-2xl border border-gray-100">
                                            <button 
                                                onClick={() => setActiveCampaign({...activeCampaign, recipient_type: 'all'})}
                                                className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${activeCampaign.recipient_type === 'all' ? 'bg-black text-white' : 'text-gray-400 hover:text-gray-600'}`}
                                            >
                                                כל המשתמשים
                                            </button>
                                            <button 
                                                onClick={() => setActiveCampaign(prev => ({...prev, recipient_type: 'specific'}))}
                                                className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${activeCampaign.recipient_type === 'specific' ? 'bg-black text-white' : 'text-gray-400 hover:text-gray-600'}`}
                                            >
                                                רשימה ספציפית
                                            </button>
                                        </div>

                                        {activeCampaign.recipient_type === 'specific' && (
                                            <div className="animate-in fade-in zoom-in-95 duration-300">
                                                <ObjectTagInput 
                                                    options={users.map(u => ({ id: u.email, label: `${u.firstName || ''} ${u.lastName || ''}`, subLabel: u.email }))}
                                                    value={activeCampaign.recipients || []}
                                                    onChange={newVal => setActiveCampaign(prev => ({...prev, recipients: newVal}))}
                                                    placeholder="חפש משתמשים לפי שם או מייל..."
                                                />
                                            </div>
                                        )}

                                        <div className="mt-auto p-4 bg-white/50 rounded-2xl border border-white flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                                                {activeCampaign.recipient_type === 'all' ? <Users size={20} /> : <User size={20} />}
                                            </div>
                                            <div>
                                                <div className="font-black text-gray-900 text-sm">
                                                    {activeCampaign.recipient_type === 'all' ? 'כל רשימת התפוצה' : `${(activeCampaign.recipients?.length || 0)} נמענים נבחרו`}
                                                </div>
                                                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Target Audience</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end pt-6 md:pt-8 border-t border-gray-50">
                                    <button 
                                        onClick={() => handleSendTest(activeCampaign.subject, activeCampaign.content_html)}
                                        className="w-full sm:w-auto justify-center px-6 py-3 rounded-2xl font-bold bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all flex items-center gap-2"
                                    >
                                        <Mail size={18} /> שלח בדיקה
                                    </button>
                                    <button 
                                        disabled={isSaving}
                                        onClick={() => handleCreateCampaign(activeCampaign)}
                                        className="w-full sm:w-auto justify-center px-8 md:px-10 py-3 md:py-4 bg-black text-white rounded-[1.5rem] font-black hover:bg-gray-800 shadow-2xl shadow-black/20 active:scale-95 transition-all text-base md:text-lg min-w-[200px]"
                                    >
                                        {isSaving ? 'מעבד...' : (activeCampaign.scheduled_at ? 'תזמן דיוור' : 'שלח עכשיו')}
                                    </button>
                                </div>
                             </div>
                        </div>
                    )}
                </>
            )}

            {/* Starter Template Picker Modal */}
            {showStarterPicker && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowStarterPicker(false)} />
                    <div className="relative bg-white w-full max-w-3xl rounded-[3rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                                    בחר עיצוב בסיס
                                </h3>
                                <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest">Choose a starter template</p>
                            </div>
                            <button onClick={() => setShowStarterPicker(false)} className="p-3 hover:bg-gray-100 rounded-2xl transition-all">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-5 grid grid-cols-2 gap-3">
                            {starterTemplates.map(starter => (
                                <button
                                    key={starter.id}
                                    onClick={() => {
                                        setActiveTemplate({ name: '', subject: '', content_html: starter.html, type: 'manual' });
                                        setLastTab(view === 'edit-template' || view === 'create-campaign' ? lastTab : view);
                                        setShowStarterPicker(false);
                                        setView('edit-template');
                                    }}
                                    className="group text-right p-4 rounded-2xl border-2 border-gray-100 hover:border-black/20 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-95"
                                >
                                    <div className={`w-full h-16 rounded-xl mb-3 flex items-center justify-center ${starter.preview} transition-all`}>
                                        <div className="text-3xl group-hover:scale-125 transition-transform duration-300">{starter.emoji}</div>
                                    </div>
                                    <h4 className="font-black text-gray-900 text-sm mb-0.5">{starter.name}</h4>
                                    <p className="text-gray-400 text-xs font-bold">{starter.desc}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Catalog Selector Modal */}
            {isCatalogModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsCatalogModalOpen(false)} />
                    <div className="relative bg-white w-full max-w-2xl rounded-3xl md:rounded-[3rem] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                        <div className="p-4 md:p-8 border-b border-gray-100 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl md:text-2xl font-black text-gray-900 flex items-center gap-2 md:gap-3">
                                    <ShoppingBag className="text-indigo-600" /> בחירת מוצרים לקטלוג
                                </h3>
                                <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Select products to generate a catalog grid</p>
                            </div>
                            <button onClick={() => setIsCatalogModalOpen(false)} className="p-2 md:p-3 hover:bg-gray-100 rounded-2xl transition-all">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-4 md:p-8 flex-1 overflow-y-auto space-y-6 custom-scrollbar">
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">חיפוש והוספה</label>
                                <ObjectTagInput 
                                    options={allProducts.map(p => ({ 
                                        id: p.id, 
                                        label: `${p.brand_he || p.brand} ${p.model_he || p.model}`,
                                        subLabel: `₪${p.price_10ml}`,
                                        image_url: p.image_url,
                                        ...p
                                    }))}
                                    value={selectedProducts}
                                    onChange={(ids) => {
                                        // Filter IDs and map back to full objects from allProducts
                                        const fullObjects = ids.map(idOrObj => {
                                            const id = typeof idOrObj === 'object' ? idOrObj.id : idOrObj;
                                            const originalProduct = allProducts.find(p => p.id === id);
                                            if (!originalProduct) return null;
                                            return {
                                                ...originalProduct,
                                                label: `${originalProduct.brand_he || originalProduct.brand} ${originalProduct.model_he || originalProduct.model}`
                                            };
                                        }).filter(Boolean);
                                        setSelectedProducts(fullObjects);
                                    }}
                                    placeholder="חפש מוצר להוספה..."
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">מוצרים שנבחרו ({selectedProducts.length})</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {selectedProducts.map(p => (
                                        <div key={p.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100 group">
                                            <img src={p.image_url} alt={p.label || "Product image"} className="w-10 h-10 object-contain bg-white rounded-lg p-1" />
                                            <div className="flex-1 min-w-0">
                                                <div className="text-[11px] font-bold text-gray-900 truncate">{p.label}</div>
                                                <div className="text-[9px] text-gray-400 font-black">₪{p.price_10ml}</div>
                                            </div>
                                            <button 
                                                onClick={() => setSelectedProducts(selectedProducts.filter(item => item.id !== p.id))}
                                                className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-white rounded-lg transition-all"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                    {selectedProducts.length === 0 && (
                                        <div className="col-span-2 py-10 text-center text-gray-300 font-bold text-sm bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-100">
                                            טרם נבחרו מוצרים
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-2">
                                {[4, 8, 12].map(num => (
                                    <button 
                                        key={num}
                                        onClick={() => {
                                            // Select top N products for convenience
                                            setSelectedProducts(allProducts.slice(0, num).map(p => ({ 
                                                id: p.id, 
                                                label: `${p.brand_he || p.brand} ${p.model_he || p.model}`,
                                                subLabel: `₪${p.price_10ml}`,
                                                image: p.image_url,
                                                ...p
                                            })));
                                        }}
                                        className="flex-1 py-2 bg-indigo-50 text-indigo-600 text-[10px] font-black rounded-xl hover:bg-indigo-100 transition-all uppercase"
                                    >
                                        הוסף {num} מוצרים
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="p-4 md:p-8 bg-gray-50 border-t border-gray-100 flex gap-4">
                            <button 
                                onClick={() => setIsCatalogModalOpen(false)}
                                className="flex-1 py-3 md:py-4 font-black text-gray-400 hover:text-gray-900 transition-all uppercase text-xs"
                            >
                                ביטול
                            </button>
                            <button 
                                onClick={handleInjectCatalog}
                                disabled={selectedProducts.length === 0}
                                className="flex-[2] py-3 md:py-4 bg-black text-white rounded-2xl font-black text-xs md:text-sm shadow-xl shadow-black/10 hover:shadow-black/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                            >
                                ייצר והזרק לעורך
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const getTemplateTiming = (slug) => {
    switch(slug) {
        case 'order_confirmation': return 'מיד לאחר אישור ההזמנה';
        case 'status_update': return 'בעת שינוי סטטוס הזמנה';
        case 'welcome': return 'מיד לאחר הרשמת משתמש';
        case 'review_request': return '7 ימים לאחר ההזמנה';
        case 'cart_recovery': return 'אחרי נטישת הסל (שחזור)';
        case 'educational': return '3-4 ימים לאחר ההזמנה';
        case 'recommendations': return '30 ימים לאחר ההזמנה';
        case 'nurture_10_days': return '10 ימים לאחר הרשמה';
        case 'nurture_25_days': return '25 ימים לאחר הרשמה';
        case 'back_in_stock': return 'כאשר מוצר שוב במלאי';
        case 'admin_order_alert': return 'מיידי (מנהלים)';
        case 'admin_user_alert': return 'מיידי (מנהלים)';
        case 'contact_form_alert': return 'מיידי (צור קשר)';
        case 'daily_summary': return 'בסוף כל יום (מנהלים)';
        default: return 'ידני / דיוור מתוזמן';
    }
};

function TemplateCard({ template, onEdit, onDelete, onSend, onSendTest }) {
    return (
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 hover:shadow-xl hover:shadow-black/5 hover:-translate-y-1 transition-all duration-300 group flex flex-col h-full relative overflow-hidden">
            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                    template.slug?.includes('admin_') || template.slug?.includes('contact_form') || template.slug === 'daily_summary' 
                    ? 'bg-red-50 text-red-500' 
                    : template.type === 'system' 
                    ? 'bg-blue-50 text-blue-500' 
                    : 'bg-green-50 text-green-500'
                }`}>
                    <Mail size={24} />
                </div>
                <div className="flex flex-col items-end gap-1.5">
                    {template.type === 'system' && (
                        <span className="bg-blue-50 text-blue-500 text-[9px] font-black uppercase px-2.5 py-1 rounded-full border border-blue-100 tracking-widest">
                            System
                        </span>
                    )}
                </div>
            </div>

            <h3 className="text-xl font-black text-gray-900 mb-2 leading-tight relative z-10">{template.name}</h3>
            {template.type === 'system' && template.slug && (
                <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-bold mb-2">
                    <Clock size={12} className="text-gray-400" />
                    {getTemplateTiming(template.slug)}
                </div>
            )}
            <p className="text-xs text-gray-400 font-bold line-clamp-2 mb-6 flex-grow relative z-10 bg-gray-50 p-3 rounded-xl border border-gray-50/50">{template.subject || '(ללא נושא)'}</p>

            <div className="flex items-center gap-2 pt-4 border-t border-gray-50">
                {onSend ? (
                    <button 
                        onClick={onSend}
                        className="flex-1 bg-black text-white py-3 rounded-2xl font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-gray-800 transition-all active:scale-95"
                    >
                        שליחה <Send size={14} />
                    </button>
                ) : <div className="flex-1"></div>}
                
                <div className="flex gap-1 flex-1 justify-end">
                    <button 
                        onClick={(e) => { e.stopPropagation(); onSendTest(); }}
                        className="p-3 bg-blue-50 text-blue-500 rounded-2xl hover:bg-blue-100 transition-all"
                        title="שלח טסט למייל שלי"
                    >
                        <MailCheck size={16} />
                    </button>
                    <button 
                        onClick={onEdit}
                        className="p-3 bg-gray-50 text-gray-500 rounded-2xl hover:bg-gray-100 hover:text-black transition-all"
                        title="ערוך טמפלייט"
                    >
                        <Edit size={16} />
                    </button>
                    {template.type !== 'system' && (
                        <button 
                            onClick={onDelete}
                            className="p-3 bg-gray-50 text-gray-300 hover:bg-red-50 hover:text-red-500 rounded-2xl transition-all"
                            title="מחק"
                        >
                            <Trash2 size={16} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

function CampaignRow({ campaign, onDelete, onSend }) {
    const isSent = campaign.status === 'sent';
    const isScheduled = campaign.status === 'scheduled';
    const isSending = campaign.status === 'sending';
    const isFailed = campaign.status === 'failed';

    return (
        <div className="flex flex-col md:grid md:grid-cols-6 hover:bg-gray-50/50 transition-colors group p-5 md:p-0 gap-4 md:gap-0 relative">
            <div className="md:p-6 text-right flex flex-col justify-center">
                <span className="md:hidden text-gray-400 text-[10px] font-black uppercase mb-1">קמפיין</span>
                <div className="flex flex-col">
                    <span className="font-black text-gray-900 leading-tight">{campaign.title}</span>
                    <span className="text-[11px] text-gray-400 font-bold line-clamp-1">{campaign.subject}</span>
                </div>
            </div>
            <div className="md:p-6 flex items-center md:justify-start justify-between">
                <span className="md:hidden text-gray-400 text-[10px] font-black uppercase mb-1">טמפלייט</span>
                <span className="text-[10px] font-black text-gray-500 bg-gray-100 px-3 py-1.5 rounded-full uppercase tracking-tighter">{campaign.template_name || 'מותאם ידנית'}</span>
            </div>
            <div className="md:p-6 text-center flex items-center md:flex-col justify-between md:justify-center">
                <span className="md:hidden text-gray-400 text-[10px] font-black uppercase mb-1">זמן שליחה</span>
                <div className="flex flex-col items-end md:items-center gap-0.5 md:min-w-[120px]">
                    <span className="font-mono text-xs font-bold text-gray-800 bg-gray-50 md:bg-transparent px-2 py-1 md:p-0 rounded-lg">
                        {campaign.scheduled_at ? format(new Date(campaign.scheduled_at), 'dd/MM/yy HH:mm') : 'מיידי'}
                    </span>
                    {isSent && campaign.sent_at && (
                        <span className="text-[9px] text-green-500 font-black uppercase tracking-tighter">
                            נשלח ב-{format(new Date(campaign.sent_at), 'dd/MM/yy HH:mm')}
                        </span>
                    )}
                    {isSending && (
                        <span className="text-[9px] text-blue-500 font-black animate-pulse">
                            שולח כעת...
                        </span>
                    )}
                </div>
            </div>
            <div className="md:p-6 text-center flex items-center md:flex-col justify-between md:justify-center border-t border-dashed border-gray-100 md:border-none pt-4 md:pt-0">
                <span className="md:hidden text-gray-400 text-[10px] font-black uppercase mb-1">נמענים</span>
                <div className="flex flex-col items-end md:items-center">
                    <span className="text-sm md:text-xs font-black text-gray-700">{campaign.recipient_type === 'all' ? 'כל הרשימה' : (campaign.recipients?.length || 0)}</span>
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{campaign.recipient_type === 'all' ? 'All Users' : 'Targeted'}</span>
                </div>
            </div>
            <div className="md:p-6 text-center flex items-center md:flex-col justify-between md:justify-center">
                <span className="md:hidden text-gray-400 text-[10px] font-black uppercase mb-1">סטטוס</span>
                <div className="flex justify-center">
                    {isSent ? (
                        <span className="bg-green-50 text-green-600 px-3 py-1.5 rounded-full text-[10px] font-black uppercase border border-green-100 flex items-center gap-1.5 shadow-sm">
                            <CheckCircle2 size={12} /> נשלח
                        </span>
                    ) : isSending ? (
                        <span className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full text-[10px] font-black uppercase border border-blue-100 flex items-center gap-1.5 animate-pulse">
                            <RefreshCcw size={12} className="animate-spin" /> שולח
                        </span>
                    ) : isFailed ? (
                        <span className="bg-red-50 text-red-600 px-3 py-1.5 rounded-full text-[10px] font-black uppercase border border-red-100 flex items-center gap-1.5" title={campaign.error_log}>
                            <AlertCircle size={12} /> נכשל
                        </span>
                    ) : (
                        <span className="bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full text-[10px] font-black uppercase border border-blue-100 flex items-center gap-1.5">
                            <Clock size={12} /> מתוזמן
                        </span>
                    )}
                </div>
            </div>
            <div className="md:p-6 absolute top-5 left-5 md:relative md:top-0 md:left-0">
                <div className="flex justify-center md:justify-center gap-2">
                    {!isSent && !isSending && (
                        <button 
                            onClick={onSend}
                            className="p-2.5 md:p-1.5 bg-black text-white rounded-xl md:rounded-lg hover:bg-gray-800 transition-all hover:scale-105 active:scale-95 shadow-md shadow-black/10"
                            title="שלח עכשיו"
                        >
                            <Play size={16} fill="currentColor" />
                        </button>
                    )}
                    
                    {isSent && (
                        <Link href="/admin/email-logs" className="p-2.5 md:p-1.5 bg-gray-50 md:bg-transparent text-gray-600 md:text-gray-400 hover:text-black hover:bg-gray-100 rounded-xl md:rounded-lg transition-all" title="צפה בדו''ח">
                            <ExternalLink size={18} />
                        </Link>
                    )}

                    {!isSending && (
                        <button 
                            onClick={onDelete}
                            className="p-2.5 md:p-1.5 bg-gray-50 md:bg-transparent text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl md:rounded-lg transition-all"
                            title="מחק דיווח"
                        >
                            <Trash2 size={18} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
