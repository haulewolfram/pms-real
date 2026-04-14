import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Package, Calendar, AlertTriangle, CheckCircle2, History as HistoryIcon, Trash2, Filter, Plus, X, Loader2 } from 'lucide-react';

export default function Batches() {
  const [batches, setBatches] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); 
  const [showModal, setShowModal] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initialForm = { medicine_id: '', batch_no: '', expiry_date: '', quantity_received: '', status: 'active' };
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    fetchBatches();
    fetchMedicines();
  }, []);

  const fetchMedicines = async () => {
    try {
      const res = await api.get('/medicines');
      setMedicines(res.data?.data || []);
    } catch (err) { console.error(err); }
  };

  const fetchBatches = async () => {
    try {
      const res = await api.get('/batches');
      setBatches(res.data);
    } catch (error) {
      console.error("Failed to fetch batches", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:border-green-800 dark:text-green-400';
      case 'near_expiry': return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:border-amber-800 dark:text-amber-400';
      case 'expired': return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400';
      default: return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300';
    }
  };

  const filteredBatches = batches.filter(b => {
    if (filter === 'all') return true;
    return b.status === filter;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingBatch) {
        await api.put(`/batches/${editingBatch.id}`, form);
      } else {
        await api.post('/batches', form);
      }
      fetchBatches();
      handleCloseModal();
    } catch (err) {
      alert("Failed to save: " + (err.response?.data?.message || err.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (batch) => {
    setEditingBatch(batch);
    setForm({
      medicine_id: batch.medicine_id,
      batch_no: batch.batch_no,
      expiry_date: batch.expiry_date ? batch.expiry_date.split('T')[0] : '',
      quantity_received: batch.quantity_received,
      current_quantity: batch.current_quantity,
      status: batch.status
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingBatch(null);
    setForm(initialForm);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this batch from records? This will also update total inventory.")) return;
    try {
      await api.delete(`/batches/${id}`);
      fetchBatches();
    } catch (err) {
      alert("Error deleting batch");
    }
  };

  if (loading) return <div className="flex justify-center p-10">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col">
          <p className="text-slate-500 dark:text-slate-400 text-sm italic max-w-md">Track individual batches of medicine, monitor their unique expiry dates, and manage stock distribution.</p>
          <button 
            onClick={() => { setEditingBatch(null); setForm(initialForm); setShowModal(true); }}
            className="mt-3 flex items-center w-fit space-x-1.5 bg-medical-600 text-white px-3 py-1.5 rounded-md text-[13px] font-medium hover:bg-medical-700 transition-colors shadow-sm"
          >
            <Plus size={14} />
            <span>Record New Batch</span>
          </button>
        </div>
        
        <div className="flex items-center space-x-2 bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm self-start transition-colors duration-300">
          <Filter size={16} className="ml-2 text-slate-400 dark:text-slate-500" />
          {['all', 'active', 'near_expiry', 'expired'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${
                filter === f 
                  ? 'bg-medical-600 text-white shadow-md' 
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {f.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {filteredBatches.map((batch) => (
          <div key={batch.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-card hover:shadow-lg transition-all duration-300 group overflow-hidden flex h-36">
            <div className={`w-2 h-full ${
              batch.status === 'active' ? 'bg-green-500' : 
              batch.status === 'near_expiry' ? 'bg-amber-500' : 'bg-red-500'
            }`}></div>
            
            <div className="flex-1 p-5 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-slate-100 line-clamp-1">{batch.medicine?.name}</h4>
                  <div className="flex items-center mt-1 text-slate-500 dark:text-slate-400 text-xs font-medium">
                    <HistoryIcon size={12} className="mr-1.5" />
                    <span>Batch: </span>
                    <span className="ml-1 text-medical-600 dark:text-medical-400 font-bold tracking-tight">{batch.batch_no}</span>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border ${getStatusColor(batch.status)}`}>
                  {batch.status.replace('_', ' ')}
                </span>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex-1">
                  <div className="flex items-center text-slate-600 dark:text-slate-400 text-sm">
                    <Calendar size={14} className="mr-2 text-slate-400 dark:text-slate-500" />
                    <span className="font-medium">Expires:</span>
                    <span className={`ml-2 font-bold ${batch.status === 'expired' ? 'text-red-500 underline' : 'text-slate-900 dark:text-slate-100'}`}>
                      {new Date(batch.expiry_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 rounded-lg px-4 py-1.5 text-right shadow-inner">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-1">Current Stock</p>
                  <p className="text-xl font-black text-slate-900 dark:text-slate-100 leading-none">
                    {batch.current_quantity}<span className="text-xs font-bold text-slate-400 dark:text-slate-500 ml-1">/ {batch.quantity_received}</span>
                  </p>
                </div>
              </div>
            </div>
            
            <div className="w-12 border-l border-slate-50 dark:border-slate-700 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity space-y-4 py-4">
              <button 
                onClick={() => handleEdit(batch)}
                className="p-2 text-slate-300 hover:text-medical-600 transition-colors"
                title="Edit Details"
              >
                <HistoryIcon size={18} />
              </button>
              <button 
                onClick={() => handleDelete(batch.id)}
                className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                title="Delete Batch"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
        {filteredBatches.length === 0 && (
          <div className="col-span-full py-20 text-center bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
             <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package size={32} className="text-slate-300 dark:text-slate-600" />
             </div>
             <h4 className="text-slate-900 dark:text-slate-100 font-bold text-lg">No batches found</h4>
             <p className="text-slate-500 dark:text-slate-400">Try adjusting your filters or add a new batch via the Medicines portal.</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-elevated w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-white dark:bg-slate-800">
              <h3 className="text-[15px] font-semibold text-slate-900 dark:text-slate-100">
                {editingBatch ? `Update Batch: ${editingBatch.batch_no}` : 'Record New Batch Received'}
              </h3>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"><X size={18}/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 bg-slate-50/50 dark:bg-slate-900/50">
              {!editingBatch && (
                <div>
                  <label className="block text-[12px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase">Select Medication</label>
                  <select 
                    required 
                    name="medicine_id" 
                    value={form.medicine_id} 
                    onChange={(e) => setForm({...form, medicine_id: e.target.value})}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-[13px] rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-medical-500/20 focus:border-medical-500 transition-colors"
                  >
                    <option value="">-- Choose Medicine --</option>
                    {medicines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-[12px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase">Batch Number</label>
                  <input required name="batch_no" value={form.batch_no} onChange={(e) => setForm({...form, batch_no: e.target.value})} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-[13px] rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-medical-500/20 focus:border-medical-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase">Expiry Date</label>
                  <input required type="date" name="expiry_date" value={form.expiry_date} onChange={(e) => setForm({...form, expiry_date: e.target.value})} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-[13px] rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-medical-500/20 focus:border-medical-500 transition-colors" />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase">Quantity {editingBatch ? 'Current' : 'Received'}</label>
                  <input 
                    required 
                    type="number" 
                    name={editingBatch ? "current_quantity" : "quantity_received"} 
                    value={editingBatch ? form.current_quantity : form.quantity_received} 
                    onChange={(e) => setForm({...form, [editingBatch ? 'current_quantity' : 'quantity_received']: e.target.value})} 
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-[13px] rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-medical-500/20 focus:border-medical-500 transition-colors" 
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[12px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5 uppercase">Calculated Status</label>
                  <div className="flex px-4 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md">
                     {(() => {
                        if (!form.expiry_date) return <span className="text-[11px] font-bold text-slate-400">AWAITING DATE</span>;
                        const expiry = new Date(form.expiry_date);
                        const today = new Date();
                        today.setHours(0,0,0,0);
                        const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
                        let calcStatus = 'active';
                        let colors = 'text-green-700 bg-green-100 border-green-200 dark:bg-green-900/30 dark:border-green-800 dark:text-green-400';
                        if (diffDays < 0) { calcStatus = 'expired'; colors = 'text-red-700 bg-red-100 border-red-200 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400'; }
                        else if (diffDays <= 60) { calcStatus = 'near_expiry'; colors = 'text-amber-700 bg-amber-100 border-amber-200 dark:bg-amber-900/30 dark:border-amber-800 dark:text-amber-400'; }
                        
                        return (
                           <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border ${colors}`}>
                             {calcStatus.replace('_', ' ')}
                           </span>
                        );
                     })()}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Status is automatically determined based on the expiry date (≤ 60 days is Near Expiry).</p>
                </div>
              </div>
              <div className="pt-2 flex justify-end">
                <button disabled={isSubmitting} type="submit" className="flex items-center bg-slate-900 text-white px-5 py-2 rounded-md text-[13px] font-medium hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-50">
                  {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : <span>{editingBatch ? 'Update Batch' : 'Confirm Receipt'}</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
