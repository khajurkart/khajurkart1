import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AdminDelivery() {
  const { token } = useAuth();
  const [summary, setSummary] = useState(null);
  const [partner, setPartner] = useState(null);
  const [orderId, setOrderId] = useState('');
  const [orderInfo, setOrderInfo] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [s, p] = await Promise.allSettled([
        axios.get(`${API}/admin/delivery/summary`, { headers }),
        axios.get(`${API}/admin/delivery/partner-on-duty`, { headers }),
      ]);
      if (s.status === 'fulfilled') setSummary(s.value.data);
      else { setError('Unable to load delivery summary. Check backend integration and admin access.'); }
      if (p.status === 'fulfilled') setPartner(p.value.data);
    } catch { setError('Unable to load delivery data.'); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  async function findOrder(e) {
    e.preventDefault();
    if (!orderId.trim() || !token) return;
    setBusy(true);
    setOrderInfo(null);
    setError('');
    try {
      const response = await axios.get(
        `${API}/admin/delivery/orders/${encodeURIComponent(orderId.trim())}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setOrderInfo(response.data);
    } catch (err) {
      const message = err.response?.status === 404 ? 'Order not found.' : 'Unable to retrieve this order.';
      setError(message);
      toast.error(message);
    } finally { setBusy(false); }
  }

  const money = (paise) => Number.isInteger(paise) && paise >= 0
    ? `₹${(paise / 100).toFixed(2)}` : 'Not available';

  return (
    <div className="min-h-screen bg-white py-20">
      <div className="max-w-5xl mx-auto px-6 md:px-12 space-y-8">
        <div>
          <Link to="/admin/dashboard" className="text-sm text-khajur-gold hover:underline">← Back to dashboard</Link>
          <h1 className="font-serif text-4xl text-khajur-primary mt-3">Delivery Gateway</h1>
          <p className="text-sm text-khajur-dark/60 mt-2">Read-only operational overview. Live courier booking is disabled.</p>
        </div>
        {error && <p role="alert" className="p-4 bg-red-50 text-red-700 border border-red-200">{error}</p>}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            ['Shipments', summary?.shipments_total],
            ['Booking pending', summary?.shipments_pending],
            ['Booking uncertain', summary?.shipments_unknown],
            ['COD accounts', summary?.cod_accounts_total],
          ].map(([label, value]) => (
            <div key={label} className="bg-khajur-cream border border-khajur-border p-5">
              <p className="text-xs uppercase tracking-wide text-khajur-dark/60">{label}</p>
              <p className="font-serif text-3xl text-khajur-primary mt-2">{value ?? '—'}</p>
            </div>
          ))}
        </div>
        <section className="border border-khajur-border p-5 space-y-2">
          <h2 className="font-serif text-xl text-khajur-primary">Partner on duty</h2>
          <p className="text-sm">{partner?.configured ? String(partner.partner ?? 'Not assigned') : 'Rotation not configured'}</p>
          {partner?.configured && <p className="text-xs text-khajur-dark/60">Rotation: every {partner.days_per_partner} days (UTC)</p>}
          <p className="text-xs text-khajur-dark/60">Partner assignment does not change the merchant settlement bank account.</p>
        </section>
        <section className="border border-khajur-border p-5 space-y-5">
          <h2 className="font-serif text-xl text-khajur-primary">Look up an order</h2>
          <form onSubmit={findOrder} className="flex flex-col sm:flex-row gap-3">
            <input aria-label="Order ID" value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder="Enter full order ID" className="flex-1 border border-khajur-border px-3 py-2" required />
            <button disabled={busy || !token} className="bg-khajur-primary text-white px-6 py-2 disabled:opacity-50">{busy ? 'Loading…' : 'View delivery details'}</button>
          </form>
          {orderInfo && <div className="space-y-4 text-sm">
            <p><strong>Payment method:</strong> {orderInfo.payment_method || '—'}</p>
            <p><strong>COD reconciliation:</strong> {orderInfo.cod_status || 'No COD account recorded'}</p>
            <div className="bg-khajur-cream p-4 space-y-1">
              <p className="font-semibold">COD ledger</p>
              <p>Expected: {money(orderInfo.cod_account?.expected_paise)}</p>
              <p>Collected: {money(orderInfo.cod_account?.collected_paise)}</p>
              <p>Courier payout reported: {money(orderInfo.cod_account?.payout_reported_paise)}</p>
              <p>Bank verified: {money(orderInfo.cod_account?.bank_verified_paise)}</p>
              <p>Courier deductions: {money(orderInfo.cod_account?.courier_deductions_paise)}</p>
            </div>
            <h3 className="font-semibold">Shipment records ({orderInfo.shipments?.length ?? 0})</h3>
            {orderInfo.shipments?.length ? orderInfo.shipments.map((shipment, i) => (
              <div key={shipment.id || i} className="border border-khajur-border p-3 space-y-1">
                <p>Status: {shipment.status || 'Unknown'}</p>
                <p>Provider: {shipment.provider || 'Not assigned'}</p>
                <p>Courier AWB: {shipment.awb || shipment.awb_number || 'Not assigned'}</p>
              </div>
            )) : <p>No shipment records found. This does not mean a courier has been booked.</p>}
          </div>}
        </section>
      </div>
    </div>
  );
}
