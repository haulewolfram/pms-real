import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Package, DollarSign, Activity, AlertCircle, X } from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({
    sales: 0,
    lowStockCount: 0,
    nearExpiryCount: 0,
    expiredCount: 0,
    totalMedicines: 0,
    recentAlerts: []
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [summaryRes, notifRes] = await Promise.all([
          api.get('/reports/summary'),
          api.get('/notifications')
        ]);

        const summary = summaryRes.data || {};

        setStats({
          sales: summary.total_revenue || 0,
          lowStockCount: summary.low_stock_alerts || 0,
          nearExpiryCount: summary.near_expiry_alerts || 0,
          expiredCount: summary.expired_alerts || 0,
          totalMedicines: summary.medicines_total || 0,
          recentAlerts: notifRes.data?.data?.slice(0, 5) || []
        });

      } catch (err) {
        console.error("Dashboard Fetch Error:", err);
      }
    };
    fetchDashboardData();
  }, []);

  const cards = [
    { label: 'Total Revenue', value: `$${stats.sales.toFixed(2)}`, icon: <DollarSign size={20} className="text-slate-500 dark:text-slate-400"/>, color: 'text-slate-900 dark:text-slate-100' },
    { label: 'Low Stock', value: stats.lowStockCount, icon: <Activity size={20} className="text-slate-500 dark:text-slate-400"/>, color: stats.lowStockCount > 0 ? 'text-orange-600 dark:text-orange-500' : 'text-slate-900 dark:text-slate-100' },
    { label: 'Near Expiry', value: stats.nearExpiryCount, icon: <AlertCircle size={20} className="text-amber-500 dark:text-amber-400"/>, color: stats.nearExpiryCount > 0 ? 'text-amber-600 dark:text-amber-500' : 'text-slate-900 dark:text-slate-100' },
    { label: 'Expired', value: stats.expiredCount, icon: <X size={20} className="text-red-500 dark:text-red-400"/>, color: stats.expiredCount > 0 ? 'text-red-700 dark:text-red-500' : 'text-slate-900 dark:text-slate-100' },
  ];

  return (
    <div className="space-y-6 pt-2 max-w-7xl mx-auto">
      
      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, i) => (
          <div key={i} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm transition-colors duration-300">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400">{card.label}</h3>
              {card.icon}
            </div>
            <div className={`text-3xl font-semibold tracking-tight ${card.color}`}>
              {card.value}
            </div>
          </div>
        ))}
      </div>

      {/* Notifications Panel */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden transition-colors duration-300">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <h3 className="text-[15px] font-semibold text-slate-900 dark:text-slate-100">Recent Alerts & Activity</h3>
        </div>
        
        <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
          {stats.recentAlerts.length === 0 ? (
            <div className="p-8 text-center text-[14px] text-slate-500 dark:text-slate-400">
              No recent alerts to display. Operations normal.
            </div>
          ) : (
            stats.recentAlerts.map((alert) => (
              <div key={alert.id} className="p-5 flex items-start space-x-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors duration-150">
                <div className={`mt-1 flex-shrink-0 w-2 h-2 rounded-full ${
                    alert.type === 'expired' ? 'bg-red-500' :
                    alert.type === 'near_expiry' ? 'bg-orange-500' :
                    'bg-slate-300 dark:bg-slate-500'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-medium text-slate-900 dark:text-slate-200">{alert.message}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-[12px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest">{alert.type.replace('_', ' ')}</span>
                    <span className="text-slate-300 dark:text-slate-600">&middot;</span>
                    <span className="text-[12px] text-slate-400 dark:text-slate-500 font-mono">{new Date(alert.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
