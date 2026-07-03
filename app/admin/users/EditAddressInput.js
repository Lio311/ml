'use client';

import { useState } from 'react';
import { Pencil, Check, X, Loader2, MapPin } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import AutocompleteInput from '../../cart/components/AutocompleteInput';

export default function EditAddressInput({ userId, initialAddress, canEdit, onSaveSuccess }) {
    const [isEditing, setIsEditing] = useState(false);
    const [address, setAddress] = useState(initialAddress || { city: '', street: '', houseNumber: '', apartment: '' });
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const fetchCitySuggestions = async (query) => {
        try {
            const res = await fetch(`https://data.gov.il/api/3/action/datastore_search?resource_id=5c78e9fa-c2e2-4771-93ff-7f400a12f7ba&q=${encodeURIComponent(query)}&limit=5`);
            const data = await res.json();
            return [...new Set(data.result.records.map(r => r['שם_ישוב'].trim()))];
        } catch (err) {
            console.error("City fetch error", err);
            return [];
        }
    };

    const fetchStreetSuggestions = async (query) => {
        if (!address.city) return [];
        try {
            const res = await fetch(`https://data.gov.il/api/3/action/datastore_search?resource_id=a7296d1a-f8c9-4b70-96c2-6ebb4352f8e3&q=${encodeURIComponent(query)}&filters={"שם_ישוב":"${address.city}"}&limit=5`);
            const data = await res.json();
            return [...new Set(data.result.records.map(r => r['שם_רחוב'].trim()))];
        } catch (err) {
            console.error("Street fetch error", err);
            return [];
        }
    };

    const handleSave = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/admin/users/${userId}/address`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ address: address.city ? address : null })
            });
            if (res.ok) {
                toast.success('הכתובת עודכנה');
                setIsEditing(false);
                if (onSaveSuccess) onSaveSuccess(address);
                router.refresh();
            } else {
                toast.error('שגיאה בעדכון הכתובת');
            }
        } catch (error) {
            console.error('Error updating address', error);
            toast.error('שגיאה בעדכון הכתובת');
        } finally {
            setIsLoading(false);
        }
    };

    const formatAddress = (addr) => {
        if (!addr || !addr.city) return null;
        let str = `${addr.street} ${addr.houseNumber}`;
        if (addr.apartment && addr.apartment !== '0') str += ` דירה ${addr.apartment}`;
        str += `, ${addr.city}`;
        return str;
    };

    if (isEditing) {
        return (
            <div className="w-full bg-gray-50 p-4 rounded-2xl border border-gray-100">
                <div className="flex justify-between items-center mb-4">
                    <label className="text-sm font-bold text-gray-700">עריכת כתובת</label>
                    <div className="flex gap-2">
                        <button
                            onClick={handleSave}
                            disabled={isLoading}
                            className="text-green-600 hover:text-green-700 bg-green-50 p-1.5 rounded-lg transition-colors disabled:opacity-50"
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                        </button>
                        <button
                            onClick={() => {
                                setAddress(initialAddress || { city: '', street: '', houseNumber: '', apartment: '' });
                                setIsEditing(false);
                            }}
                            disabled={isLoading}
                            className="text-gray-400 hover:text-red-600 bg-white p-1.5 rounded-lg transition-colors border border-gray-100"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>
                <div className="space-y-3">
                    <AutocompleteInput
                        placeholder="עיר *"
                        value={address.city}
                        onChange={(val) => setAddress(prev => ({ ...prev, city: val, street: '' }))}
                        fetchSuggestions={fetchCitySuggestions}
                    />
                    <AutocompleteInput
                        disabled={!address.city}
                        placeholder={address.city ? "רחוב *" : "יש לבחור עיר תחילה"}
                        value={address.street}
                        onChange={(val) => setAddress(prev => ({ ...prev, street: val }))}
                        fetchSuggestions={fetchStreetSuggestions}
                    />
                    <div className="grid grid-cols-2 gap-3">
                        <input
                            type="text"
                            inputMode="numeric"
                            className="w-full p-3 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="מס' בית *"
                            value={address.houseNumber || ''}
                            onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '');
                                setAddress(prev => ({ ...prev, houseNumber: val }));
                            }}
                        />
                        <input
                            type="text"
                            inputMode="numeric"
                            className="w-full p-3 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="דירה (0 לבית פרטי)"
                            value={address.apartment || ''}
                            onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '');
                                setAddress(prev => ({ ...prev, apartment: val }));
                            }}
                        />
                    </div>
                </div>
            </div>
        );
    }

    const addrStr = formatAddress(initialAddress);

    return (
        <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-100 rounded-2xl shadow-sm text-sm font-bold text-gray-700 group relative">
            <MapPin className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="truncate max-w-[200px] md:max-w-xs text-right">
                {addrStr || <span className="text-gray-400 font-medium text-xs">אין כתובת רשומה</span>}
            </span>
            {canEdit && (
                <button
                    onClick={() => setIsEditing(true)}
                    className="mr-auto opacity-0 group-hover:opacity-100 text-gray-400 hover:text-blue-600 transition-all p-1"
                    title="ערוך כתובת"
                >
                    <Pencil className="w-3.5 h-3.5" />
                </button>
            )}
        </div>
    );
}
