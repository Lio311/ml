"use client";
import { useState } from "react";
import toast from "react-hot-toast";
import CustomDropdown from "../../components/ui/CustomDropdown";

const Dot = ({ color }) => <div className={`w-2 h-2 rounded-full ${color}`} />;

const STATUS_OPTIONS = [
    { value: 'pending', label: 'ממתין', icon: <Dot color="bg-orange-500" /> },
    { value: 'processing', label: 'בטיפול', icon: <Dot color="bg-blue-500" /> },
    { value: 'shipped', label: 'נשלח', icon: <Dot color="bg-purple-500" /> },
    { value: 'ready_for_pickup', label: 'מוכן לאיסוף', icon: <Dot color="bg-indigo-500" /> },
    { value: 'completed', label: 'הושלם', icon: <Dot color="bg-green-500" /> },
    { value: 'cancelled', label: 'בוטל', icon: <Dot color="bg-gray-400" /> },
];

export default function AdminOrderStatusSelect({ orderId, initialStatus }) {
    const [status, setStatus] = useState(initialStatus);
    const [saving, setSaving] = useState(false);

    const handleChange = async (newStatus) => {
        setSaving(true);
        try {
            const formData = new FormData();
            formData.set("orderId", orderId);
            formData.set("status", newStatus);
            const res = await fetch("/api/admin/orders/update-status", {
                method: "POST",
                body: formData,
            });
            if (res.ok) {
                setStatus(newStatus);
                toast.success("סטטוס עודכן");
            } else {
                toast.error("שגיאה בעדכון סטטוס");
            }
        } catch (e) {
            toast.error("שגיאה בעדכון סטטוס");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="flex items-center gap-1.5">
            <CustomDropdown
                options={STATUS_OPTIONS}
                value={status}
                onChange={handleChange}
                variant="status"
            />
            {saving && <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />}
        </div>
    );
}
