import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import {
  TrendingUp, DollarSign, Package, AlertCircle, BarChart3,
  RefreshCw, ShoppingCart, CreditCard, Banknote, Shield,
  AlertTriangle, XCircle, Boxes, ArrowUpRight, Clock
} from 'lucide-react';

// ─── Tiny bar chart (pure CSS/SVG-free) ─────────────────────────────────────
function BarChart({ data, height = 180 }) {
  if (!data.length) return <div className="text-slate-400 dark:text-slate-500 text-sm text-center py-10">No data</div>;
  const max = Math.max(...data.map(d => parseFloat(d.total) || 0), 1);

  return (
    <div className="flex items-end gap-[3px]" style={{ height }}>
      {data.map((d, i) => {
        const pct = ((parseFloat(d.total) || 0) / max) * 100;
        return (
          <div key={i} className="flex-1 flex flex-col items-center justify-end group relative h-full">
            <div
              className="w-full bg-indigo-500 rounded-t-sm hover:bg-indigo-600 transition-colors duration-150 relative"
              style={{ height: `${Math.max(pct, 1)}%` }}
            >
              {/* Tooltip */}
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold py-1 px-2 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 pointer-events-none">
                ${parseFloat(d.total).toFixed(2)}{d.count ? ` (${d.count})` : ''}
              </div>
            </div>
            {data.length <= 14 && (
              <span className="text-[8px] text-slate-400 dark:text-slate-500 mt-1 font-medium">
                {new Date(d.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Donut chart for payment methods ────────────────────────────────────────
function DonutChart({ data }) {
  if (!data.length) return <div className="text-slate-400 text-sm text-center py-10">No data</div>;
  const total = data.reduce((a, d) => a + parseFloat(d.total), 0);
  const colors = ['#6366f1', '#f59e0b', '#10b981', '#f43f5e'];
  const labels = { cash: 'Cash', card: 'Card', insurance: 'Insurance' };

  let cumulative = 0;
  const slices = data.map((d, i) => {
    const pct = (parseFloat(d.total) / total) * 100;
    const slice = { ...d, pct, color: colors[i % colors.length], offset: cumulative };
    cumulative += pct;
    return slice;
  });

  const r = 40, cx = 50, cy = 50;
  const circumference = 2 * Math.PI * r;

  return (
    <div className="flex items-center gap-6">
      <svg viewBox="0 0 100 100" className="w-28 h-28 -rotate-90 shrink-0">
        {slices.map((s, i) => (
          <circle
            key={i}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={s.color}
            strokeWidth="18"
            strokeDasharray={`${(s.pct / 100) * circumference} ${circumference}`}
            strokeDashoffset={`${-((s.offset / 100) * circumference)}`}
          />
        ))}
      </svg>
      <div className="space-y-2 flex-1">
        {slices.map((s, i) => (
          <div key={i} className="flex items-center justify-between text-[12px]">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }}/>
              <span className="font-medium text-slate-700 dark:text-slate-300 capitalize">{labels[s.payment_method] || s.payment_method}</span>
            </div>
            <div className="text-right">
              <span className="font-bold text-slate-900 dark:text-slate-100">{s.pct.toFixed(1)}%</span>
              <span className="text-slate-400 dark:text-slate-500 ml-1 text-[10px]">${parseFloat(s.total).toFixed(0)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Horizontal bar for top medicines ───────────────────────────────────────
function TopMedicinesBar({ data }) {
  if (!data.length) return <div className="text-slate-400 dark:text-slate-500 text-sm text-center py-10">No sales data yet</div>;
  const max = Math.max(...data.map(d => d.total_qty), 1);
  const colors = ['bg-indigo-500', 'bg-violet-500', 'bg-blue-500', 'bg-cyan-500', 'bg-teal-500',
                  'bg-emerald-500', 'bg-amber-500', 'bg-orange-500', 'bg-rose-500', 'bg-pink-500'];

  return (
    <div className="space-y-3">
      {data.map((item, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 w-4">{i + 1}</span>
          <div className="flex-1">
            <div className="flex justify-between mb-1">
              <span className="text-[12px] font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[160px]">
                {item.medicine?.name || `Med #${item.medicine_id}`}
              </span>
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">{item.total_qty} units</span>
            </div>
            <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full ${colors[i % colors.length]} rounded-full transition-all duration-500`}
                style={{ width: `${(item.total_qty / max) * 100}%` }}
              />
            </div>
          </div>
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 w-16 text-right">
            ${parseFloat(item.total_revenue).toFixed(0)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Stat Card ───────────────────────────────────────────────────────────────
function KpiCard({ label, value, icon: Icon, iconBg, valueColor, sub }) {
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm flex flex-col gap-3 transition-colors duration-300">
      <div className="flex items-center justify-between">
        <div className={`p-2.5 rounded-xl ${iconBg}`}>
          <Icon size={18} className="opacity-80"/>
        </div>
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">{label}</p>
        <p className={`text-[24px] font-black tracking-tight ${valueColor || 'text-slate-900 dark:text-slate-100'}`}>{value}</p>
        {sub && <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Section wrapper ─────────────────────────────────────────────────────────
function Section({ title, icon: Icon, children, className = '' }) {
  return (
    <div className={`bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden transition-colors duration-300 ${className}`}>
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2">
        <Icon size={16} className="text-slate-500 dark:text-slate-400"/>
        <h3 className="text-[14px] font-bold text-slate-800 dark:text-slate-100">{title}</h3>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Reports() {
  const [summary, setSummary]       = useState(null);
  const [salesByDay, setSalesByDay] = useState([]);
  const [topMeds, setTopMeds]       = useState([]);
  const [payments, setPayments]     = useState([]);
  const [expiry, setExpiry]         = useState(null);
  const [stock, setStock]           = useState(null);
  const [loading, setLoading]       = useState(true);
  const [days, setDays]             = useState(30);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [sRes, dayRes, topRes, payRes, expRes, stkRes] = await Promise.all([
        api.get('/reports/summary'),
        api.get(`/reports/sales-by-day?days=${days}`),
        api.get('/reports/top-medicines?limit=8'),
        api.get('/reports/payment-methods'),
        api.get('/reports/expiry'),
        api.get('/reports/stock'),
      ]);
      setSummary(sRes.data);
      setSalesByDay(dayRes.data);
      setTopMeds(topRes.data);
      setPayments(payRes.data);
      setExpiry(expRes.data);
      setStock(stkRes.data);
    } catch (err) {
      console.error('Report fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-slate-400">
      <RefreshCw size={20} className="animate-spin mr-2"/> Loading analytics...
    </div>
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pt-2">

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 shadow-sm transition-colors duration-300">
        <div>
          <h2 className="text-[17px] font-black text-slate-900 dark:text-slate-100 tracking-tight">Business Intelligence</h2>
          <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-0.5">Real-time analytics and performance metrics for your pharmacy.</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Range selector */}
          <div className="flex bg-slate-50 dark:bg-slate-900/50 p-1 rounded-lg border border-slate-200 dark:border-slate-700 gap-1 transition-colors">
            {[7, 14, 30, 90].map(d => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1.5 rounded-md text-[11px] font-bold transition-all ${
                  days === d ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm' : 'text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                {d}d
              </button>
            ))}
          </div>
          <button
            onClick={fetchData}
            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-all border border-slate-200 dark:border-slate-700"
            title="Refresh"
          >
            <RefreshCw size={16}/>
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="Total Revenue" value={`$${(summary?.total_revenue || 0).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}`}
          icon={DollarSign} iconBg="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" valueColor="text-emerald-700 dark:text-emerald-400"
          sub={`$${(summary?.today_revenue || 0).toFixed(2)} today`}/>
        <KpiCard label="Transactions" value={summary?.total_transactions || 0}
          icon={ShoppingCart} iconBg="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
          sub={`Avg $${(summary?.avg_transaction || 0).toFixed(2)} / sale`}/>
        <KpiCard label="Near Expiry" value={summary?.near_expiry_alerts || 0}
          icon={AlertTriangle} iconBg="bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" valueColor={summary?.near_expiry_alerts > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-slate-100'}
          sub={`${summary?.expired_alerts || 0} already expired`}/>
        <KpiCard label="Low Stock" value={summary?.low_stock_alerts || 0}
          icon={Boxes} iconBg="bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400" valueColor={summary?.low_stock_alerts > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-slate-100'}
          sub={`${summary?.medicines_total || 0} total medicines`}/>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* Sales trend chart */}
        <Section title={`Revenue Trend — Last ${days} Days`} icon={BarChart3} className="xl:col-span-2">
          {salesByDay.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400 space-y-2">
              <TrendingUp size={32} className="opacity-20"/>
              <span className="text-[13px]">No completed sales in this period</span>
            </div>
          ) : (
            <>
              <div className="flex justify-between text-[11px] text-slate-400 mb-3">
                <span>{salesByDay.length} selling days</span>
                <span className="font-bold text-slate-600">
                  ${salesByDay.reduce((a, d) => a + parseFloat(d.total || 0), 0).toFixed(2)} total
                </span>
              </div>
              <BarChart data={salesByDay} height={180}/>
            </>
          )}
        </Section>

        {/* Payment method donut */}
        <Section title="Payment Methods" icon={CreditCard}>
          {payments.length === 0 ? (
            <div className="text-slate-400 dark:text-slate-500 text-[13px] text-center py-10">No sales data</div>
          ) : (
            <>
              <DonutChart data={payments}/>
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/50 space-y-1">
                {payments.map((p, i) => (
                  <div key={i} className="flex justify-between text-[12px]">
                    <span className="text-slate-500 dark:text-slate-400 capitalize">{p.payment_method}</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{p.count} txns</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Section>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* Top Medicines */}
        <Section title="Top Selling Medicines" icon={Package} className="xl:col-span-2">
          <TopMedicinesBar data={topMeds}/>
        </Section>

        {/* Expiry Risk */}
        <Section title="Expiry Risk Summary" icon={AlertCircle}>
          <div className="space-y-3">
            {[
              { label: 'Expiring in 30 days', count: expiry?.expiring_within_30?.length || 0, color: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800', icon: XCircle },
              { label: 'Expiring in 60 days', count: expiry?.expiring_within_60?.length || 0, color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800', icon: AlertTriangle },
              { label: 'Already expired', count: expiry?.already_expired?.length || 0, color: 'text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-900/30 border-rose-200 dark:border-rose-800', icon: XCircle },
            ].map((r, i) => {
              const Icon = r.icon;
              return (
                <div key={i} className={`flex items-center justify-between p-3 rounded-lg border ${r.color}`}>
                  <div className="flex items-center gap-2">
                    <Icon size={14}/>
                    <span className="text-[12px] font-semibold">{r.label}</span>
                  </div>
                  <span className="font-black text-[16px]">{r.count}</span>
                </div>
              );
            })}
          </div>

          {/* Expiring items list */}
          {(expiry?.expiring_within_30 || []).length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700/50">
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Critical (≤30 days)</p>
              <div className="space-y-1.5">
                {(expiry.expiring_within_30 || []).slice(0, 4).map((m, i) => (
                  <div key={i} className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-[130px]">{m.name}</span>
                    <span className="text-red-600 dark:text-red-400 font-bold">{new Date(m.expiry_date).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Section>
      </div>

      {/* Stock Alerts Table */}
      {((stock?.out_of_stock?.length || 0) + (stock?.critical?.length || 0)) > 0 && (
        <Section title="Stock Alert Details" icon={Boxes}>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Medicine</th>
                  <th className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Category</th>
                  <th className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 text-center">Current Qty</th>
                  <th className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 text-center">Min Level</th>
                  <th className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {[...(stock?.out_of_stock || []), ...(stock?.critical || [])].map((inv, i) => (
                  <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200 text-[13px]">
                      {inv.medicine?.name || `Medicine #${inv.medicine_id}`}
                    </td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 text-[12px]">{inv.medicine?.category || '—'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-black text-[14px] ${inv.quantity === 0 ? 'text-red-700 dark:text-red-500' : 'text-amber-600 dark:text-amber-500'}`}>
                        {inv.quantity}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-slate-500 dark:text-slate-400 text-[12px]">{inv.min_stock_level}</td>
                    <td className="px-4 py-3">
                      {inv.quantity === 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800">
                          <XCircle size={10}/> Out of Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                          <AlertTriangle size={10}/> Critical Low
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      {/* Footer refresh timestamp */}
      <div className="flex items-center justify-end gap-1.5 text-[11px] text-slate-400 pb-2">
        <Clock size={12}/>
        <span>Last updated: {new Date().toLocaleTimeString()}</span>
      </div>
    </div>
  );
}
