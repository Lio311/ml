"use client";

import React, { memo, useState, useEffect } from 'react';
import { Handle, Position } from 'reactflow';
import { Box, Send, Mail, MessageSquare, Ticket, RefreshCw, FileText, ExternalLink } from 'lucide-react';

import AutomationDropdown from '../AutomationDropdown';

const actionOptions = [
  { value: "email", label: "שליחת מייל ללקוח" },
  { value: "admin_notify", label: "התראה למנהל (מייל/פוץ')" },
  { value: "coupon", label: "יצירת קופון אישי" },
  { value: "change_status", label: "שנה סטטוס הזמנה" },
  { value: "order_note", label: "הוספת הערה פנימית להזמנה" },
];

const icons = {
    email: Mail,
    admin_notify: Send,
    coupon: Ticket,
    change_status: RefreshCw,
    order_note: MessageSquare,
    default: Box
};

const statusOptions = [
    { value: "pending", label: "ממתין לתשלום" },
    { value: "processing", label: "בטיפול" },
    { value: "on-hold", label: "בהמתנה" },
    { value: "completed", label: "הושלם" },
    { value: "cancelled", label: "בוטל" },
    { value: "refunded", label: "זוכה" },
    { value: "failed", label: "נכשל" },
    { value: "ready-for-pickup", label: "מוכן לאיסוף" },
    { value: "shipped", label: "נשלח" },
];

const ActionNode = memo(({ data, isConnectable }) => {
  const Icon = icons[data.actionType] || icons.default;
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Fetch email templates when action type is email/admin_notify
  useEffect(() => {
    const shouldFetch = ['email', 'admin_notify'].includes(data.actionType);
    if (shouldFetch && templates.length === 0) {
      setLoadingTemplates(true);
      fetch('/api/admin/mailing/templates')
        .then(res => res.ok ? res.json() : [])
        .then(data => {
          setTemplates(data || []);
          setLoadingTemplates(false);
        })
        .catch(() => setLoadingTemplates(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.actionType]);

  const templateOptions = templates.map(t => ({
    value: t.slug || `id_${t.id}`,
    label: t.name || t.slug || `טמפלייט #${t.id}`
  }));

  const selectedTemplate = templates.find(t => 
    (t.slug === data.templateSlug) || (`id_${t.id}` === data.templateSlug)
  );

  const showTemplateSelector = ['email', 'admin_notify'].includes(data.actionType);

  return (
    <div className="bg-white border-2 border-blue-500/30 p-5 rounded-[2rem] min-w-[240px] max-w-[280px] shadow-sm hover:shadow-md transition-all group" dir="rtl">
      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        style={{ width: '14px', height: '14px', border: '3px solid white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
        className="!bg-blue-500 hover:scale-125 transition-transform -left-2"
      />

      <div className="flex flex-col items-center gap-4 text-center">
        <div className="bg-blue-500/10 p-3 rounded-2xl text-blue-500 group-hover:scale-110 transition-transform">
          <Icon size={24} />
        </div>
        <div className="flex flex-col flex-1 w-full">
          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-2">פעולה (Action)</span>
          <AutomationDropdown 
            value={data.actionType || 'email'}
            onChange={(val) => data.onChange?.(val)}
            options={actionOptions}
          />

          {/* Template Selector */}
          {showTemplateSelector && (
            <div className="mt-3 w-full">
              <div className="flex items-center justify-center gap-1 mb-1.5">
                <FileText size={10} className="text-purple-500" />
                <label className="text-[8px] font-black text-purple-500 uppercase tracking-wider">טמפלייט דיוור</label>
              </div>
              {loadingTemplates ? (
                <div className="text-[10px] text-gray-400 py-1">טוען טמפלייטים...</div>
              ) : templateOptions.length > 0 ? (
                <AutomationDropdown 
                  value={data.templateSlug || ''}
                  onChange={(val) => data.onChangeParams?.('templateSlug', val)}
                  options={templateOptions}
                  placeholder="בחר טמפלייט..."
                />
              ) : (
                <div className="text-[10px] text-gray-400 py-1">אין טמפלייטים זמינים</div>
              )}

              {/* Template Preview Badge */}
              {selectedTemplate && (
                <div className="mt-2 bg-purple-50 border border-purple-100 rounded-xl p-2.5 text-right">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[9px] font-bold text-purple-600 truncate flex-1">{selectedTemplate.name || selectedTemplate.slug}</span>
                    <a 
                      href="/admin/mailing" 
                      target="_blank"
                      className="text-purple-400 hover:text-purple-600 transition-colors nodrag"
                      title="ערוך טמפלייט בדיוור"
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                      <ExternalLink size={10} />
                    </a>
                  </div>
                  {selectedTemplate.subject && (
                    <div className="text-[9px] text-gray-500 truncate" title={selectedTemplate.subject}>
                      נושא: {selectedTemplate.subject}
                    </div>
                  )}
                  <button
                    type="button"
                    className="mt-1.5 text-[8px] font-bold text-purple-500 hover:text-purple-700 underline underline-offset-2 nodrag"
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setShowPreview(!showPreview);
                    }}
                  >
                    {showPreview ? 'הסתר תצוגה מקדימה' : 'תצוגה מקדימה'}
                  </button>
                  
                  {showPreview && selectedTemplate.content_html && (
                    <div className="mt-2 bg-white border border-gray-100 rounded-lg p-2 max-h-[200px] overflow-y-auto text-[10px] nodrag nowheel"
                      onMouseDown={(e) => e.stopPropagation()}
                    >
                      <div 
                        dangerouslySetInnerHTML={{ __html: selectedTemplate.content_html }} 
                        className="text-right [&_*]:!text-[10px] [&_*]:!leading-tight [&_img]:!max-w-full [&_img]:!h-auto"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {data.actionType === 'change_status' && (
            <div className="mt-3">
               <label className="text-[8px] font-bold text-gray-400 uppercase block mb-1">בחר סטטוס יעד:</label>
               <AutomationDropdown 
                 value={data.targetStatus || 'processing'}
                 onChange={(val) => data.onChangeParams?.('targetStatus', val)}
                 options={statusOptions}
               />
            </div>
          )}

          {data.actionType === 'order_note' && (
            <input 
              type="text"
              placeholder="הכנס פרטים..."
              className="mt-3 text-[11px] border-b border-gray-200 focus:border-blue-500 outline-none w-full py-1 text-center"
              value={data.customAction || ''}
              onChange={(e) => data.onChangeCustom?.(e.target.value)}
            />
          )}

          {/* Coupon params for coupon action */}
          {data.actionType === 'coupon' && (
            <div className="mt-3 space-y-2 w-full">
              <div className="flex items-center gap-2 justify-center">
                <label className="text-[8px] font-bold text-gray-400 whitespace-nowrap">% הנחה:</label>
                <input 
                  type="number"
                  className="w-14 text-[11px] font-bold border-b border-gray-100 focus:border-blue-500 outline-none py-0.5 text-center nodrag"
                  value={data.discount_percent || ''}
                  placeholder="5"
                  onChange={(e) => data.onChangeParams?.('discount_percent', e.target.value)}
                  onMouseDown={(e) => e.stopPropagation()}
                />
              </div>
              <div className="flex items-center gap-2 justify-center">
                <label className="text-[8px] font-bold text-gray-400 whitespace-nowrap">תוקף (שעות):</label>
                <input 
                  type="number"
                  className="w-14 text-[11px] font-bold border-b border-gray-100 focus:border-blue-500 outline-none py-0.5 text-center nodrag"
                  value={data.coupon_validity_hours || ''}
                  placeholder="24"
                  onChange={(e) => data.onChangeParams?.('coupon_validity_hours', e.target.value)}
                  onMouseDown={(e) => e.stopPropagation()}
                />
              </div>
              <div className="flex items-center gap-2 justify-center">
                <label className="text-[8px] font-bold text-gray-400 whitespace-nowrap">צינון (ימים):</label>
                <input 
                  type="number"
                  className="w-14 text-[11px] font-bold border-b border-gray-100 focus:border-blue-500 outline-none py-0.5 text-center nodrag"
                  value={data.cooldown_days || ''}
                  placeholder="7"
                  onChange={(e) => data.onChangeParams?.('cooldown_days', e.target.value)}
                  onMouseDown={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        style={{ width: '16px', height: '16px', border: '4px solid white', boxShadow: '0 0 0 1px #3b82f6' }}
        className="!bg-blue-500 hover:scale-125 transition-transform cursor-crosshair -right-2"
      />
    </div>
  );
});

export default ActionNode;

ActionNode.displayName = 'ActionNode';
