import { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import {
  ShoppingCart, Plus, Minus, Trash2, Tag, Loader2, CheckCircle2,
  Search, AlertTriangle, XCircle, CreditCard, Banknote, Shield,
  Printer, X, Package
} from 'lucide-react';

const PAYMENT_METHODS = [
  { id: 'cash',      label: 'Cash',      icon: Banknote },
  { id: 'card',      label: 'Card',      icon: CreditCard },
  { id: 'insurance', label: 'Insurance', icon: Shield },
];

function StatusBadge({ status }) {
  if (status === 'expired') return (
    <span className="flex items-center gap-0.5 text-[9px] font-bold uppercase text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 px-1.5 py-0.5 rounded border border-red-200 dark:border-red-800">
      <XCircle size={8}/> Expired
    </span>
  );
  if (status === 'near_expiry') return (
    <span className="flex items-center gap-0.5 text-[9px] font-bold uppercase text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800">
      <AlertTriangle size={8}/> Near Exp.
    </span>
  );
  return null;
}

function ReceiptModal({ sale, onClose }) {
  const printRef = useRef();

  const handlePrint = () => {
    const content = printRef.current.innerHTML;
    const win = window.open('', '_blank');
    win.document.write(`<html><head><title>Receipt</title>
      <style>body{font-family:monospace;padding:24px;max-width:320px;margin:auto} table{width:100%} td{padding:2px 0} .border-t{border-top:1px dashed #000;margin:8px 0;padding-top:8px} .right{text-align:right} .bold{font-weight:bold} .center{text-align:center}</style>
      </head><body>${content}</body></html>`);
    win.document.close();
    win.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200">
        <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-white">
          <h3 className="font-bold text-slate-900 text-[15px]">Sale Receipt</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700"><X size={18}/></button>
        </div>

        <div ref={printRef} className="p-5 font-mono text-[12px]">
          <div className="text-center mb-4">
            <p className="font-bold text-[14px]">PharmaCore PMS</p>
            <p className="text-slate-500">-- Sales Receipt --</p>
            <p className="text-slate-400">{new Date().toLocaleString()}</p>
          </div>
          <div className="border-t border-dashed border-slate-300 pt-3 mb-3">
            <table className="w-full text-[11px]">
              <thead><tr>
                <td className="font-bold">Item</td>
                <td className="text-right font-bold">Qty</td>
                <td className="text-right font-bold">Price</td>
                <td className="text-right font-bold">Sub</td>
              </tr></thead>
              <tbody>
                {sale.items?.map((item, i) => (
                  <tr key={i}>
                    <td className="truncate max-w-[100px]">{item.medicine?.name || item.name}</td>
                    <td className="text-right">{item.quantity}</td>
                    <td className="text-right">${parseFloat(item.price).toFixed(2)}</td>
                    <td className="text-right">${(item.quantity * item.price).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-dashed border-slate-300 pt-3 space-y-1">
            <div className="flex justify-between"><span>Subtotal</span><span>${parseFloat(sale.subtotal || 0).toFixed(2)}</span></div>
            {sale.discount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-${parseFloat(sale.discount).toFixed(2)}</span></div>}
            {sale.tax > 0 && <div className="flex justify-between"><span>Tax</span><span>+${parseFloat(sale.tax).toFixed(2)}</span></div>}
            <div className="flex justify-between font-bold text-[13px] border-t border-slate-300 pt-2 mt-2">
              <span>TOTAL</span><span>${parseFloat(sale.total_amount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-500 text-[11px] pt-1">
              <span>Payment</span><span className="uppercase">{sale.payment_method}</span>
            </div>
            <div className="flex justify-between text-slate-500 text-[11px]">
              <span>TXN #</span><span>#{String(sale.id).padStart(5,'0')}</span>
            </div>
          </div>
          <div className="text-center mt-4 text-slate-400 text-[10px]">Thank you for your purchase!</div>
        </div>

        <div className="px-5 py-4 border-t border-slate-100 flex gap-3">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg border border-slate-200 text-slate-600 text-[13px] font-medium hover:bg-slate-50 transition-colors">
            Close
          </button>
          <button onClick={handlePrint} className="flex-1 py-2 rounded-lg bg-slate-900 text-white text-[13px] font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors">
            <Printer size={14}/> Print
          </button>
        </div>
      </div>
    </div>
  );
}

export default function POS() {
  const [medicines, setMedicines] = useState([]);
  const [inventory, setInventory] = useState({});
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [search, setSearch] = useState('');
  const [discount, setDiscount] = useState('');
  const [tax, setTax] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');

  const fetchStock = async () => {
    try {
      setLoading(true);
      const [medRes, invRes] = await Promise.all([
        api.get('/medicines?per_page=100'),
        api.get('/inventories'),
      ]);

      const meds = medRes.data?.data || [];
      setMedicines(meds);

      const invMap = {};
      (invRes.data?.data || []).forEach(inv => { invMap[inv.medicine_id] = inv; });
      setInventory(invMap);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStock(); }, []);

  const filteredMeds = medicines.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.category?.toLowerCase().includes(search.toLowerCase())
  );

  const addToCart = (med) => {
    if (med.status === 'expired') return; // Block expired
    const inv = inventory[med.id];
    if (!inv || inv.quantity === 0) return;

    const existing = cart.find(i => i.medicine_id === med.id);
    if (existing) {
      if (existing.quantity < inv.quantity) {
        setCart(cart.map(i => i.medicine_id === med.id ? { ...i, quantity: i.quantity + 1 } : i));
      } else {
        alert('Maximum available stock reached.');
      }
    } else {
      setCart([...cart, {
        medicine_id: med.id,
        name: med.name,
        quantity: 1,
        price: parseFloat(med.selling_price),
        max: inv.quantity,
        status: med.status,
      }]);
    }
  };

  const adjustQty = (id, delta) => {
    setCart(cart.map(item => {
      if (item.medicine_id === id) {
        const newQ = item.quantity + delta;
        if (newQ > 0 && newQ <= item.max) return { ...item, quantity: newQ };
      }
      return item;
    }));
  };

  const removeItem = (id) => setCart(cart.filter(i => i.medicine_id !== id));

  const subtotal = cart.reduce((acc, i) => acc + i.quantity * i.price, 0);
  const discountVal = parseFloat(discount) || 0;
  const taxVal = (subtotal - discountVal) * ((parseFloat(tax) || 0) / 100);
  const total = Math.max(0, subtotal - discountVal + taxVal);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setSubmitting(true);
    try {
      const res = await api.post('/sales', {
        payment_method: paymentMethod,
        discount: discountVal,
        tax: parseFloat(taxVal.toFixed(2)),
        items: cart.map(i => ({ medicine_id: i.medicine_id, quantity: i.quantity })),
      });

      const saleData = res.data?.data || {};
      // Attach local cart items for receipt (already enriched by backend with medicine names)
      setReceipt({ ...saleData, subtotal });
      setCart([]);
      setDiscount('');
      setTax('');
      fetchStock();
    } catch (err) {
      alert('Checkout failed: ' + (err.response?.data?.error || err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-5 h-[calc(100vh-90px)] max-w-[1400px] mx-auto pt-2">

      {/* Product Grid */}
      <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col overflow-hidden transition-colors">
        <div className="flex-none p-4 border-b border-slate-100 dark:border-slate-700 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package size={18} className="text-slate-500 dark:text-slate-400"/>
              <h2 className="text-[15px] font-bold text-slate-800 dark:text-slate-100">Available Products</h2>
            </div>
            <span className="text-[12px] text-slate-400 dark:text-slate-500 font-medium">{filteredMeds.length} items</span>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"/>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or category..."
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg pl-8 pr-3 py-2 text-[13px] text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600 transition-all"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto p-4 bg-slate-50/30 dark:bg-slate-900/30">
          {loading ? (
            <div className="flex items-center justify-center h-40 text-slate-400 dark:text-slate-500 text-[13px]">
              <Loader2 size={20} className="animate-spin mr-2"/> Fetching catalog...
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredMeds.map(med => {
                const inv = inventory[med.id];
                const qty = inv?.quantity || 0;
                const isExpired = med.status === 'expired';
                const isOOS = qty === 0;
                const disabled = isExpired || isOOS;

                return (
                  <div
                    key={med.id}
                    onClick={() => !disabled && addToCart(med)}
                    className={`bg-white dark:bg-slate-800 border rounded-xl p-3.5 flex flex-col justify-between min-h-[110px] transition-all duration-150 select-none ${
                      disabled
                        ? 'opacity-40 border-slate-100 dark:border-slate-800 cursor-not-allowed'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 hover:shadow-md cursor-pointer active:scale-[0.97]'
                    }`}
                  >
                    <div>
                      <p className="font-bold text-slate-900 dark:text-slate-100 text-[13px] leading-tight line-clamp-2">{med.name}</p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{med.category}</p>
                    </div>
                    <div className="mt-3 space-y-1.5">
                      <StatusBadge status={med.status}/>
                      <div className="flex justify-between items-center">
                        <span className="text-[15px] font-black text-slate-900 dark:text-slate-100">${parseFloat(med.selling_price).toFixed(2)}</span>
                        <span className={`text-[10px] font-bold tracking-wide ${isOOS || isExpired ? 'text-red-400' : 'text-slate-400 dark:text-slate-500'}`}>
                          {isExpired ? 'EXPIRED' : isOOS ? 'OUT' : `${qty} CT`}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Cart Panel */}
      <div className="w-full lg:w-[360px] bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col shrink-0 transition-colors">
        <div className="flex-none px-5 py-4 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <ShoppingCart size={18} className="text-slate-600 dark:text-slate-400"/>
            <h2 className="text-[15px] font-bold text-slate-800 dark:text-slate-100">Current Cart</h2>
            {cart.length > 0 && (
              <span className="ml-auto bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-[10px] font-bold px-2 py-0.5 rounded-full">{cart.length}</span>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-auto px-4 py-3 space-y-2">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-slate-400 dark:text-slate-500 space-y-2">
              <Tag size={28} className="opacity-30"/>
              <span className="text-[13px]">Cart is empty</span>
            </div>
          ) : cart.map(item => (
            <div key={item.medicine_id} className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg p-3">
              <div className="flex justify-between items-start mb-2">
                <p className="text-[12px] font-bold text-slate-900 dark:text-slate-100 flex-1 pr-2 line-clamp-2">{item.name}</p>
                <button onClick={() => removeItem(item.medicine_id)} className="text-slate-300 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 transition-colors shrink-0">
                  <Trash2 size={14}/>
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 overflow-hidden">
                  <button onClick={() => adjustQty(item.medicine_id, -1)} className="px-2.5 py-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                    <Minus size={12}/>
                  </button>
                  <span className="text-[12px] font-bold text-slate-900 dark:text-slate-100 w-8 text-center">{item.quantity}</span>
                  <button onClick={() => adjustQty(item.medicine_id, 1)} className="px-2.5 py-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                    <Plus size={12}/>
                  </button>
                </div>
                <span className="text-[13px] font-bold text-slate-800 dark:text-slate-100">${(item.quantity * item.price).toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Totals & Checkout */}
        <div className="flex-none p-4 border-t border-slate-100 dark:border-slate-700 space-y-3 bg-slate-50/50 dark:bg-slate-900/50 rounded-b-xl">
          {/* Discount & Tax */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Discount ($)</label>
              <input
                type="number" min="0" step="0.01"
                value={discount} onChange={e => setDiscount(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-[12px] text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Tax (%)</label>
              <input
                type="number" min="0" max="100" step="0.1"
                value={tax} onChange={e => setTax(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-[12px] text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-slate-300 dark:focus:ring-slate-600"
                placeholder="0"
              />
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Payment Method</label>
            <div className="flex gap-2">
              {PAYMENT_METHODS.map(pm => {
                const Icon = pm.icon;
                return (
                  <button
                    key={pm.id}
                    onClick={() => setPaymentMethod(pm.id)}
                    className={`flex-1 flex flex-col items-center justify-center py-2 rounded-lg border text-[10px] font-bold transition-all ${
                      paymentMethod === pm.id
                        ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 dark:border-slate-100'
                        : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500'
                    }`}
                  >
                    <Icon size={14} className="mb-1"/>
                    {pm.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg p-3 space-y-1 text-[12px]">
            <div className="flex justify-between text-slate-500 dark:text-slate-400"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
            {discountVal > 0 && <div className="flex justify-between text-green-600 dark:text-green-500"><span>Discount</span><span>-${discountVal.toFixed(2)}</span></div>}
            {taxVal > 0 && <div className="flex justify-between text-slate-500 dark:text-slate-400"><span>Tax</span><span>+${taxVal.toFixed(2)}</span></div>}
            <div className="flex justify-between font-black text-[16px] text-slate-900 dark:text-slate-100 border-t border-dashed border-slate-200 dark:border-slate-700 pt-2 mt-1">
              <span>Total</span><span>${total.toFixed(2)}</span>
            </div>
          </div>

          <button
            disabled={submitting || cart.length === 0}
            onClick={handleCheckout}
            className="w-full bg-slate-900 dark:bg-medical-600 text-white font-bold text-[14px] py-3 rounded-xl hover:bg-slate-800 dark:hover:bg-medical-500 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex justify-center items-center gap-2 shadow-sm"
          >
            {submitting ? <Loader2 className="animate-spin" size={18}/> : <><CheckCircle2 size={18}/> Complete Sale</>}
          </button>
        </div>
      </div>

      {receipt && (
        <ReceiptModal sale={receipt} onClose={() => setReceipt(null)}/>
      )}
    </div>
  );
}
