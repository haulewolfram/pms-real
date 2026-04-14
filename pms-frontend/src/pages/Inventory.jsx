import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Package } from 'lucide-react';

export default function Inventory() {
  const [inventories, setInventories] = useState([]);
  const [medicines, setMedicines] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [invRes, medRes] = await Promise.all([
          api.get('/inventories'),
          api.get('/medicines')
        ]);
        setInventories(invRes.data?.data || []);
        
        const medMap = {};
        medRes.data?.data?.forEach(m => medMap[m.id] = m);
        setMedicines(medMap);
      } catch (err) {
        console.error("Failed to fetch inventory", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden max-w-7xl mx-auto mt-2 transition-colors duration-300">
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-white dark:bg-slate-800 transition-colors duration-300">
        <div className="flex items-center space-x-2">
           <Package size={18} className="text-slate-500 dark:text-slate-400" />
           <h2 className="text-[16px] font-semibold text-slate-900 dark:text-slate-100 tracking-tight">Perpetual Stock Database</h2>
        </div>
      </div>
      
      <div className="overflow-x-auto min-h-[400px]">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
            <tr>
              <th className="px-6 py-3 font-semibold text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">ID</th>
              <th className="px-6 py-3 font-semibold text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">Medical Item</th>
              <th className="px-6 py-3 font-semibold text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">Physical Stock</th>
              <th className="px-6 py-3 font-semibold text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">Min Setup</th>
              <th className="px-6 py-3 font-semibold text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">Network Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 bg-white dark:bg-slate-800 transition-colors duration-300">
            {loading ? (
              <tr><td colSpan="5" className="p-10 text-center text-[13px] text-slate-400 dark:text-slate-500">Syncing database...</td></tr>
            ) : inventories.map((inv) => {
              const med = medicines[inv.medicine_id];
              const isOut = inv.quantity === 0;
              const isLow = inv.quantity > 0 && inv.quantity <= inv.min_stock_level;

              return (
                <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors duration-150">
                  <td className="px-6 py-4 text-[13px] text-slate-500 dark:text-slate-400 font-mono">
                    {inv.medicine_id.toString().padStart(4, '0')}
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-semibold text-slate-900 dark:text-slate-100 text-[14px]">{med?.name || 'Unknown Item'}</p>
                    <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 mt-0.5 uppercase tracking-wide">{med?.category || '-'}</p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`text-[15px] font-semibold ${isOut ? 'text-red-500' : isLow ? 'text-orange-500' : 'text-slate-900 dark:text-slate-100'}`}>
                      {inv.quantity}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-500 dark:text-slate-400 text-right tabular-nums">
                    {inv.min_stock_level}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <span className={`flex-shrink-0 w-2 h-2 rounded-full ${isOut ? 'bg-red-500' : isLow ? 'bg-orange-500' : 'bg-emerald-500'}`}></span>
                      <span className="text-[12px] font-semibold text-slate-700 dark:text-slate-300">
                        {isOut ? 'Depleted' : isLow ? 'Restock Required' : 'Healthy'}
                      </span>
                    </div>
                  </td>
                </tr>
              )
            })}
            
            {!loading && inventories.length === 0 && (
              <tr>
                <td colSpan="5" className="px-10 py-16 text-center text-[13px] text-slate-500 dark:text-slate-400">
                  Empty ledger array. No records detected.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
