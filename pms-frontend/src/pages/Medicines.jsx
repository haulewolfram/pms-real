import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Plus, Trash2, X, Loader2, Pill, History as HistoryIcon } from 'lucide-react';

export default function Medicines() {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const initialForm = { name: '', category: '', batch_no: '', expiry_date: '', purchase_price: '', selling_price: '', manufacturer: '' };
  const [form, setForm] = useState(initialForm);
  const [editingMedicine, setEditingMedicine] = useState(null);
  const [filter, setFilter] = useState('all');

  const fetchMedicines = async () => {
    try {
      const res = await api.get('/medicines');
      setMedicines(res.data?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMedicines(); }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-50 border-green-200';
      case 'near_expiry': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'expired': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const filteredMedicines = medicines.filter(m => {
    if (filter === 'all') return true;
    return m.status === filter;
  });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingMedicine) {
        await api.put(`/medicines/${editingMedicine.id}`, form);
      } else {
        await api.post('/medicines', form);
      }
      fetchMedicines();
      handleCloseModal();
    } catch (err) {
      alert("Failed to save: " + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (med) => {
    setEditingMedicine(med);
    setForm({
      name: med.name,
      category: med.category,
      batch_no: med.batch_no || '',
      expiry_date: med.expiry_date ? med.expiry_date.split('T')[0] : '',
      purchase_price: med.purchase_price,
      selling_price: med.selling_price,
      manufacturer: med.manufacturer || ''
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingMedicine(null);
    setForm(initialForm);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this medical record permanently?")) return;
    try {
      await api.delete(`/medicines/${id}`);
      setMedicines(medicines.filter(m => m.id !== id));
    } catch (err) {
      alert("Error deleting medicine");
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto mt-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors duration-300">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-lg">
            <Pill size={20} className="text-slate-600 dark:text-slate-400" />
          </div>
          <div>
            <h2 className="text-[16px] font-bold text-slate-900 dark:text-slate-100 tracking-tight">Drug Catalog</h2>
            <p className="text-[12px] text-slate-500 dark:text-slate-400 font-medium">Manage medicine inventory and expiry status</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 bg-slate-50 dark:bg-slate-900/50 p-1 rounded-lg self-start">
          {['all', 'active', 'near_expiry', 'expired'].map((f) => (
            <button
               key={f}
               onClick={() => setFilter(f)}
               className={`px-3 py-1.5 rounded-md text-[12px] font-semibold transition-all ${
                 filter === f 
                   ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm' 
                   : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
               }`}
            >
              {f.replace('_', ' ').toUpperCase()}
            </button>
          ))}
        </div>

        <button 
          onClick={() => { setEditingMedicine(null); setForm(initialForm); setShowModal(true); }}
          className="flex items-center space-x-1.5 bg-slate-900 text-white px-4 py-2 rounded-md text-[13px] font-bold hover:bg-slate-800 transition-colors shadow-sm self-start sm:self-center"
        >
          <Plus size={16} />
          <span>New Catalog Item</span>
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors duration-300">
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-3 font-semibold text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">Item Details</th>
                <th className="px-6 py-3 font-semibold text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">Batch & Exp</th>
                <th className="px-6 py-3 font-semibold text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 text-right">Pricing (Buy/Sell)</th>
                <th className="px-6 py-3 font-semibold text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">Stock Status</th>
                <th className="px-6 py-3 font-semibold text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">Manufacturer</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 bg-white dark:bg-slate-800">
              {loading ? (
                <tr><td colSpan="6" className="p-10 text-center text-[13px] text-slate-400 dark:text-slate-500">Loading catalog...</td></tr>
              ) : filteredMedicines.length === 0 ? (
                <tr><td colSpan="6" className="p-10 text-center text-[13px] text-slate-400 dark:text-slate-500 whitespace-pre">No {filter !== 'all' ? filter.replace('_', ' ') : ''} medicines found matching your criteria.</td></tr>
              ) : filteredMedicines.map((med) => (
                <tr key={med.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors duration-150 group">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-[14px] text-slate-900 dark:text-slate-100">{med.name}</p>
                    <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400 mt-0.5">{med.category}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-[13px] text-slate-900 dark:text-slate-100 font-mono font-medium">{med.batch_no || 'N/A'}</span>
                        {med.status && (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border ${getStatusColor(med.status)}`}>
                            {med.status.replace('_', ' ')}
                          </span>
                        )}
                      </div>
                      <p className={`text-[12px] font-bold ${
                        med.status === 'expired' ? 'text-red-500' : 
                        med.status === 'near_expiry' ? 'text-amber-500' : 'text-slate-500 dark:text-slate-400'
                      }`}>
                        {med.expiry_date ? new Date(med.expiry_date).toLocaleDateString() : 'No date'}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <p className="text-[14px] text-slate-900 dark:text-slate-100 font-semibold">${med.selling_price}</p>
                    <p className="text-[12px] text-slate-500 dark:text-slate-400 font-medium">${med.purchase_price} cost</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className={`text-[13px] font-bold ${med.inventory?.quantity > (med.inventory?.min_stock_level || 10) ? 'text-green-600 dark:text-emerald-500' : 'text-amber-600 dark:text-orange-500'}`}>
                        {med.inventory?.quantity || 0} Units
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-tighter">Current Inventory</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-[13px] text-slate-600 dark:text-slate-400 font-medium">{med.manufacturer}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                      <button onClick={() => handleEdit(med)} className="p-1.5 text-slate-400 hover:text-medical-600 hover:bg-medical-50 rounded-md transition-colors">
                        <HistoryIcon size={16} title="Edit Record" />
                      </button>
                      <button onClick={() => handleDelete(med.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-elevated w-full max-w-lg overflow-hidden border border-slate-200 dark:border-slate-700">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-white dark:bg-slate-800">
              <h3 className="text-[15px] font-semibold text-slate-900 dark:text-slate-100">
                {editingMedicine ? `Edit Record: ${editingMedicine.name}` : 'Add New Medication'}
              </h3>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"><X size={18}/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-[12px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Drug Name</label>
                  <input required name="name" value={form.name} onChange={handleChange} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-[13px] rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-medical-500/20 focus:border-medical-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Category</label>
                  <input required name="category" value={form.category} onChange={handleChange} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-[13px] rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-medical-500/20 focus:border-medical-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Batch No</label>
                  <input required name="batch_no" value={form.batch_no} onChange={handleChange} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-[13px] rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-medical-500/20 focus:border-medical-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Expiry Date</label>
                  <input required type="date" name="expiry_date" value={form.expiry_date} onChange={handleChange} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-[13px] rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-medical-500/20 focus:border-medical-500 transition-colors" />
                  
                  {form.expiry_date && (
                    <div className="mt-2.5 flex items-center justify-between px-3 py-1.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md">
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Status:</span>
                      {(() => {
                        const expiry = new Date(form.expiry_date);
                        const today = new Date();
                        today.setHours(0,0,0,0);
                        const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
                        let calcStatus = 'active';
                        let colors = 'text-green-700 bg-green-100 border-green-200 dark:bg-green-900/30 dark:border-green-800 dark:text-green-400';
                        if (diffDays < 0) { calcStatus = 'expired'; colors = 'text-red-700 bg-red-100 border-red-200 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400'; }
                        else if (diffDays <= 60) { calcStatus = 'near_expiry'; colors = 'text-amber-700 bg-amber-100 border-amber-200 dark:bg-amber-900/30 dark:border-amber-800 dark:text-amber-400'; }
                        
                        return (
                           <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border ${colors}`}>
                             {calcStatus.replace('_', ' ')}
                           </span>
                        );
                      })()}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Manufacturer</label>
                  <input required name="manufacturer" value={form.manufacturer} onChange={handleChange} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-[13px] rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-medical-500/20 focus:border-medical-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Buy Price ($)</label>
                  <input required type="number" step="0.01" name="purchase_price" value={form.purchase_price} onChange={handleChange} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-[13px] rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-medical-500/20 focus:border-medical-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">Sell Price ($)</label>
                  <input required type="number" step="0.01" name="selling_price" value={form.selling_price} onChange={handleChange} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-[13px] rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-medical-500/20 focus:border-medical-500 transition-colors" />
                </div>
              </div>
              <div className="pt-2 flex justify-end">
                <button disabled={isSubmitting} type="submit" className="flex items-center bg-slate-900 text-white px-5 py-2 rounded-md text-[13px] font-medium hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-50">
                  {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <span>{editingMedicine ? 'Update Record' : 'Save Item'}</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
