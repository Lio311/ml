'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from 'react-hot-toast';

export default function UserRoleSelect({ userId, initialRole, canEdit }) {
    const [role, setRole] = useState(initialRole);
    const [updating, setUpdating] = useState(false);
    const router = useRouter();

    const roleColors = {
        'admin': 'bg-red-100 text-red-800 border-red-200',
        'deputy': 'bg-purple-100 text-purple-800 border-purple-200',
        'warehouse': 'bg-orange-100 text-orange-800 border-orange-200',
        'customer': 'bg-gray-100 text-gray-800 border-gray-200'
    };

    const roleLabels = {
        'admin': 'מנהל',
        'deputy': 'סגן מנהל',
        'warehouse': 'מחסנאי',
        'customer': 'לקוח'
    };

    const handleRoleUpdate = async (newRole) => {
        if (!confirm(`האם אתה בטוח שברצונך לשנות את הרשאת המשתמש ל-${newRole}?`)) return;

        setUpdating(true);
        try {
            const res = await fetch('/api/admin/users', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, role: newRole })
            });

            if (res.ok) {
                setRole(newRole);
                toast.success("ההרשאה עודכנה בהצלחה");
                router.refresh(); // Refresh server components to reflect changes if necessary
            } else {
                toast.error("שגיאה בעדכון ההרשאה");
            }
        } catch (e) {
            console.error(e);
            toast.error("שגיאה בעדכון ההרשאה");
        } finally {
            setUpdating(false);
        }
    };

    if (!canEdit) {
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${roleColors[role] || roleColors['customer']}`}>
                {roleLabels[role] || role}
            </span>
        );
    }

    return (
        <div className="flex items-center gap-2">
            <select
                value={role}
                onChange={(e) => handleRoleUpdate(e.target.value)}
                disabled={updating}
                className={`text-xs font-bold border rounded px-2 py-1 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-100 ${roleColors[role] || roleColors['customer']}`}
            >
                <option value="admin">מנהל</option>
                <option value="deputy">סגן מנהל</option>
                <option value="warehouse">מחסנאי</option>
                <option value="customer">לקוח</option>
            </select>
            {updating && <span className="text-xs text-blue-500 animate-pulse">...</span>}
        </div>
    );
}
