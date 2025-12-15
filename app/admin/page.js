import pool from "../lib/db";
import Link from "next/link";

export default async function AdminDashboard() {
    const client = await pool.connect();
    let kpis = {
        totalOrders: 0,
        totalRevenue: 0,
        pendingOrders: 0,
        recentOrders: [],
        monthlyVisits: 0
    };

    try {
        // KPI Queries
        const ordersRes = await client.query('SELECT * FROM orders ORDER BY created_at DESC LIMIT 5');
        kpis.recentOrders = ordersRes.rows;

        const countRes = await client.query('SELECT COUNT(*) FROM orders');
        kpis.totalOrders = parseInt(countRes.rows[0].count);

        const revRes = await client.query('SELECT SUM(total_amount) FROM orders');
        kpis.totalRevenue = parseInt(revRes.rows[0].sum || 0);

        const pendingRes = await client.query("SELECT COUNT(*) FROM orders WHERE status = 'pending'");
        kpis.pendingOrders = parseInt(pendingRes.rows[0].count);

        // Analytics: Monthly Visits
        const visitsRes = await client.query(`
            SELECT COUNT(*) FROM site_visits 
            WHERE EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE) 
            AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)
        `);
        kpis.monthlyVisits = parseInt(visitsRes.rows[0].count || 0);

    } finally {
        client.release();
    }

    const currentMonth = new Date().toLocaleString('he-IL', { month: 'long', year: 'numeric' });

    return (
        <div>
            <h1 className="text-3xl font-bold mb-8">לוח בקרה</h1>

            {/* Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="text-gray-500 text-sm font-bold uppercase mb-2">הכנסות</div>
                    <div className="text-3xl font-bold">{kpis.totalRevenue} ₪</div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="text-gray-500 text-sm font-bold uppercase mb-2">הזמנות סה״כ</div>
                    <div className="text-3xl font-bold">{kpis.totalOrders}</div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="text-gray-500 text-sm font-bold uppercase mb-2">הזמנות ממתינות</div>
                    <div className="text-3xl font-bold text-orange-600">{kpis.pendingOrders}</div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="text-gray-500 text-sm font-bold uppercase mb-2">כניסות לאתר</div>
                    <div className="text-xl font-bold">חודש {currentMonth}: <span className="text-blue-600">{kpis.monthlyVisits}</span> כניסות</div>
                    <div className="text-xs text-gray-400 mt-1">נספר לפי ביקורים ייחודיים</div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-6 border-b flex justify-between items-center">
                    <h3 className="font-bold">הזמנות אחרונות</h3>
                    <Link href="/admin/orders" className="text-blue-600 text-sm hover:underline">לכל ההזמנות</Link>
                </div>
                <div className="divide-y">
                    {kpis.recentOrders.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            עדיין אין הזמנות...
                        </div>
                    ) : (
                        kpis.recentOrders.map(order => (
                            <div key={order.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                                <div>
                                    <div className="font-bold">הזמנה #{order.id}</div>
                                    <div className="text-sm text-gray-500">
                                        {order.customer_details?.name} • {new Date(order.created_at).toLocaleDateString('he-IL')}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold">{order.total_amount} ₪</div>
                                    <span className={`text-xs px-2 py-1 rounded-full ${order.status === 'pending' ? 'bg-orange-100 text-orange-800' :
                                        order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                                            order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                                                order.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                    'bg-gray-100 text-gray-800'
                                        }`}>
                                        {
                                            order.status === 'pending' ? 'ממתין' :
                                                order.status === 'processing' ? 'בטיפול' :
                                                    order.status === 'shipped' ? 'נשלח' :
                                                        order.status === 'completed' ? 'הושלם' :
                                                            order.status === 'cancelled' ? 'בוטל' :
                                                                order.status
                                        }
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
