import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../AuthContext';
import {
  Receipt, RotateCcw, AlertCircle, CheckCircle2,
  ChevronDown, ChevronUp, Search, Calendar, DollarSign
} from 'lucide-react';

export default function Sales() {
  const { user } = useAuth();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [stats, setStats] = useState({ total: 0, refunded: 0, revenue: 0 });

  useEffect(() => { fetchSales(); }, []);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const res = await api.get('/sales');
      const data = res.data?.data || [];
      setSales(data);

      const total = data.length;
      const refunded = data.filter(s => s.status === 'refunded').length;
      const revenue = data
        .filter(s => s.status === 'completed')
        .reduce((acc, s) => acc + parseFloat(s.total_amount), 0);
      setStats({ total, refunded, revenue });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async (saleId) => {
    const reason = window.prompt('Enter reason for refund:');
    if (!reason) return;
    try {
      await api.post(`/sales/${saleId}/refund`, { reason });
      fetchSales();
    } catch (error) {
      alert(error.response?.data?.message || 'Refund failed');
    }
  };

  const toggleExpand = (id) => setExpandedId(expandedId === id ? null : id);

  const filtered = sales.filter(s => {
    const matchStatus = statusFilter === 'all' || s.status === statusFilter;
    const matchSearch = search === '' ||
      String(s.id).includes(search) ||
      (s.user?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      s.payment_method?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="space-y-5 max-w-7xl mx-auto pt-2">

      {/* Summary stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Transactions', value: stats.total, icon: Receipt, color: 'text-slate-900 dark:text-slate-100', bg: 'bg-slate-50 dark:bg-slate-900/50' },
          { label: 'Completed Revenue', value: `$${stats.revenue.toFixed(2)}`, icon: DollarSign, color: 'text-emerald-700 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/30' },
          { label: 'Refunded', value: stats.refunded, icon: RotateCcw, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-900/30' },
        ].map((c, i) => {
          const Icon = c.icon;
          return (
            <div key={i} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 shadow-sm flex items-center gap-4 transition-colors duration-300">
              <div className={`p-3 rounded-xl ${c.bg}`}>
                <Icon size={20} className={c.color}/>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{c.label}</p>
                <p className={`text-[22px] font-black tracking-tight ${c.color}`}>{c.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors duration-300">

        {/* Toolbar */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt size={18} className="text-slate-500 dark:text-slate-400"/>
            <h2 className="text-[15px] font-bold text-slate-900 dark:text-slate-100">Sales Ledger</h2>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"/>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search TXN, user..."
                className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg pl-8 pr-3 py-2 text-[12px] text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600 w-48 transition-colors"
              />
            </div>
            <div className="flex gap-1 bg-slate-50 dark:bg-slate-900/50 p-1 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors">
              {['all', 'completed', 'refunded'].map(f => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={`px-3 py-1 rounded-md text-[11px] font-bold capitalize transition-all ${
                    statusFilter === f ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 w-8"></th>
                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">TXN ID</th>
                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Cashier</th>
                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Date & Time</th>
                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Payment</th>
                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Status</th>
                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 text-right">Amount</th>
                <th className="px-5 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 bg-white dark:bg-slate-800">
              {loading ? (
                <tr><td colSpan="8" className="p-10 text-center text-[13px] text-slate-400 dark:text-slate-500 italic">Loading transactions...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="8" className="p-10 text-center text-[13px] text-slate-400 dark:text-slate-500 italic">No transactions found.</td></tr>
              ) : filtered.map(sale => (
                <>
                  <tr
                    key={sale.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors cursor-pointer group"
                    onClick={() => toggleExpand(sale.id)}
                  >
                    <td className="px-5 py-4 text-slate-400 dark:text-slate-500">
                      {expandedId === sale.id
                        ? <ChevronUp size={14}/>
                        : <ChevronDown size={14}/>
                      }
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-[12px] font-black text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded-md">
                        #{String(sale.id).padStart(5, '0')}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-bold text-slate-800 dark:text-slate-100 text-[13px]">
                        {sale.user?.name || `Clerk #${sale.user_id}`}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-[12px] text-slate-500 dark:text-slate-400 font-medium">
                      <div className="flex items-center gap-1">
                        <Calendar size={12}/>
                        {new Date(sale.created_at).toLocaleString()}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-[11px] font-bold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                        {sale.payment_method}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                        sale.status === 'refunded'
                          ? 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-800'
                          : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800'
                      }`}>
                        {sale.status === 'refunded'
                          ? <><AlertCircle size={10} className="mr-1"/> Refunded</>
                          : <><CheckCircle2 size={10} className="mr-1"/> Completed</>
                        }
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="text-[15px] font-black text-slate-900 dark:text-slate-100">
                        ${parseFloat(sale.total_amount).toFixed(2)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right" onClick={e => e.stopPropagation()}>
                      {sale.status !== 'refunded' && (
                        <button
                          onClick={() => handleRefund(sale.id)}
                          className="p-2 text-slate-300 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-all"
                          title="Issue Refund"
                        >
                          <RotateCcw size={16}/>
                        </button>
                      )}
                    </td>
                  </tr>

                  {/* Expandable items row */}
                  {expandedId === sale.id && (
                    <tr key={`exp-${sale.id}`} className="bg-slate-50/80 dark:bg-slate-900/40">
                      <td colSpan={8} className="px-8 py-4">
                        <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-800/80">
                          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700/50 bg-slate-50 dark:bg-slate-900/50 flex justify-between items-center">
                            <p className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">Itemized Breakdown</p>
                            <div className="flex gap-4 text-[11px] text-slate-500 dark:text-slate-400">
                              {parseFloat(sale.discount) > 0 && <span>Discount: <strong className="text-green-600 dark:text-green-400">-${parseFloat(sale.discount).toFixed(2)}</strong></span>}
                              {parseFloat(sale.tax) > 0 && <span>Tax: <strong>+${parseFloat(sale.tax).toFixed(2)}</strong></span>}
                              {sale.refund_reason && <span className="text-rose-600 dark:text-rose-400">Reason: {sale.refund_reason}</span>}
                            </div>
                          </div>
                          <table className="w-full text-left">
                            <thead>
                              <tr className="bg-slate-50 dark:bg-slate-900/30 border-b border-slate-100 dark:border-slate-700/50">
                                <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Medicine</th>
                                <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 text-center">Qty</th>
                                <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 text-right">Unit Price</th>
                                <th className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 text-right">Line Total</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-700/30">
                              {(sale.items || []).map((item, idx) => (
                                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                                  <td className="px-4 py-2.5 text-[13px] font-semibold text-slate-800 dark:text-slate-200">
                                    {item.medicine?.name || `Medicine #${item.medicine_id}`}
                                  </td>
                                  <td className="px-4 py-2.5 text-center">
                                    <span className="text-[12px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">{item.quantity}</span>
                                  </td>
                                  <td className="px-4 py-2.5 text-right text-[12px] text-slate-600 dark:text-slate-400">${parseFloat(item.price).toFixed(2)}</td>
                                  <td className="px-4 py-2.5 text-right text-[13px] font-bold text-slate-900 dark:text-slate-100">${(item.quantity * item.price).toFixed(2)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
