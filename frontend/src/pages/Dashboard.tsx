import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import type { Booking, DashboardStats } from '../types';
import { ALL_ROOMS, ROOM_TYPE } from '../types';
import { formatCurrency, formatDate, getToday, getCurrentMonth, calculateNights } from '../hooks/useApi';
import StatCard from '../components/StatCard';
import Modal from '../components/Modal';
import toast from 'react-hot-toast';

const emptyBooking = {
  guestName: '', phone: '', pax: 1, kot: '', roomNo: '', noOfRooms: 1,
  roomCategory: '', checkIn: getToday(), checkOut: '', mealPlan: '', source: 'Walk-in',
  sourceName: '', complimentary: '', actualRoomRent: 0, totalAmount: 0, hotelShare: 0,
  paymentType: 'Postpaid', advanceReceived: 0, paymentMode: '', remarks: '',
  collectionAmount: 0, agentId: undefined as number | undefined,
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [filterDate, setFilterDate] = useState(getToday());
  const [filterViewBy, setFilterViewBy] = useState('checkout');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSource, setFilterSource] = useState('');
  const [filterAgent, setFilterAgent] = useState('');

  // Summary
  const [summaryStart, setSummaryStart] = useState(getCurrentMonth() + '-01');
  const [summaryEnd, setSummaryEnd] = useState(getToday());

  // Modals
  const [bookingModal, setBookingModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyBooking);
  const [bookingAddOns, setBookingAddOns] = useState<{type: string; amount: number}[]>([]);
  const [paymentSubCategory, setPaymentSubCategory] = useState('');
  const [collectModal, setCollectModal] = useState(false);
  const [collectBooking, setCollectBooking] = useState<Booking | null>(null);
  const [collectAmount, setCollectAmount] = useState(0);
  const [collectMode, setCollectMode] = useState('');
  const [collectSubCategory, setCollectSubCategory] = useState('');
  const [collectKotAmount, setCollectKotAmount] = useState(0);
  const [collectSplitPayment, setCollectSplitPayment] = useState(false);
  const [collectBookingAmount, setCollectBookingAmount] = useState(0);
  const [collectBookingMode, setCollectBookingMode] = useState('');
  const [collectBookingSubCategory, setCollectBookingSubCategory] = useState('');
  const [collectKotMode, setCollectKotMode] = useState('');
  const [collectTransferToAgent, setCollectTransferToAgent] = useState(false);
  const [collectAmountFromGuest, setCollectAmountFromGuest] = useState(0);
  const [cancelModal, setCancelModal] = useState(false);
  const [cancelBooking, setCancelBooking] = useState<Booking | null>(null);
  const [cancelAction, setCancelAction] = useState('cancel');
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [checkinModal, setCheckinModal] = useState(false);
  const [checkinBooking, setCheckinBooking] = useState<Booking | null>(null);
  const [checkinRooms, setCheckinRooms] = useState<string[]>(['']);
  const [checkoutModal, setCheckoutModal] = useState(false);
  const [checkoutBooking, setCheckoutBooking] = useState<Booking | null>(null);
  const [kotAmount, setKotAmount] = useState(0);
  const [unpaidKotOrders, setUnpaidKotOrders] = useState<any[]>([]);
  const [addOns, setAddOns] = useState<{type: string; amount: number}[]>([]);
  const [checkoutPayMode, setCheckoutPayMode] = useState('');
  const [checkoutSubCategory, setCheckoutSubCategory] = useState('');
  const [transferToAgent, setTransferToAgent] = useState(false);
  const [collectFromGuest, setCollectFromGuest] = useState(0);

  // Loading states to prevent double-click
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // KOT Modal
  const [kotModal, setKotModal] = useState(false);
  const [kotCustomerType, setKotCustomerType] = useState<'inhouse' | 'walkin'>('walkin');
  const [kotSelectedBooking, setKotSelectedBooking] = useState<Booking | null>(null);
  const [kotCustomerName, setKotCustomerName] = useState('');
  const [kotItems, setKotItems] = useState<Array<{itemName: string; quantity: number; rate: number}>>([
    { itemName: '', quantity: 1, rate: 0 }
  ]);
  const [kotPaymentMode, setKotPaymentMode] = useState('Cash');

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await api.get('/bookings/dashboard/stats');
      setStats(res.data);
    } catch { /* ignore */ }
  }, []);

  const fetchBookings = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filterDate) params.set('date', filterDate);
      if (filterViewBy) params.set('viewBy', filterViewBy);
      if (filterStatus) params.set('status', filterStatus);
      if (filterSource) params.set('source', filterSource);
      if (filterAgent) params.set('agent', filterAgent);
      const res = await api.get('/bookings?' + params.toString());
      setBookings(res.data);
    } catch { /* ignore */ }
  }, [filterDate, filterViewBy, filterStatus, filterSource, filterAgent]);

  const fetchUsers = useCallback(async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { fetchDashboard(); fetchBookings(); fetchUsers(); }, [fetchDashboard, fetchBookings, fetchUsers]);

  // Check for openKOT query parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('openKOT') === 'true') {
      openKotModal();
      // Clear the query parameter
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const refreshAll = () => { fetchDashboard(); fetchBookings(); };

  // Summary calculation
  const summaryBookings = bookings.filter(b => {
    if (b.status === 'CANCELLED') return false;
    return b.checkOut && b.checkOut >= summaryStart && b.checkOut <= summaryEnd;
  });
  const summaryData = summaryBookings.reduce((acc, b) => {
    const total = Number(b.totalAmount) || 0;
    const kotAmt = Number(b.kotAmount) || 0;
    const addOnAmt = (b.addOns || []).reduce((s, a) => s + (Number(a.amount) || 0), 0);
    const baseRoom = Math.max(total - kotAmt - addOnAmt, 0);
    const recv = (Number(b.advanceReceived) || 0) + (Number(b.balanceReceived) || 0);
    const pend = Math.max(total - recv, 0);
    return {
      count: acc.count + 1, roomCharge: acc.roomCharge + baseRoom, kot: acc.kot + kotAmt,
      addOn: acc.addOn + addOnAmt, collection: acc.collection + total,
      collected: acc.collected + recv, pending: acc.pending + pend,
    };
  }, { count: 0, roomCharge: 0, kot: 0, addOn: 0, collection: 0, collected: 0, pending: 0 });

  // Booking CRUD
  const openEditBooking = (b: Booking) => {
    setEditId(b.id);
    setForm({
      guestName: b.guestName, phone: b.phone || '', pax: b.pax || 1, kot: b.kot || '',
      roomNo: b.roomNo || '', noOfRooms: b.noOfRooms || 1, roomCategory: b.roomCategory || '',
      checkIn: b.checkIn, checkOut: b.checkOut, mealPlan: b.mealPlan || '',
      source: b.source || 'Walk-in', sourceName: b.sourceName || '',
      complimentary: b.complimentary || '', actualRoomRent: Number(b.actualRoomRent) || 0,
      totalAmount: Number(b.totalAmount), hotelShare: Number(b.hotelShare) || 0,
      paymentType: b.paymentType || 'Postpaid',
      advanceReceived: Number(b.advanceReceived) || 0, paymentMode: b.paymentMode || '',
      remarks: b.remarks || '',
      collectionAmount: Number(b.collectionAmount) || 0,
      agentId: (b as any).agentId || undefined,
    });
    setBookingAddOns(b.addOns || []);
    setPaymentSubCategory('');
    setBookingModal(true);
  };

  const saveBooking = async () => {
    if (!form.guestName || !form.checkIn || !form.checkOut || !form.totalAmount) {
      toast.error('Please fill all required fields');
      return;
    }
    try {
      const payload = {
        ...form,
        addOns: bookingAddOns.filter(a => a.type && a.amount > 0),
        paymentSubCategory: form.paymentMode === 'AKS Office' ? paymentSubCategory : undefined,
      };
      if (editId) {
        await api.put(`/bookings/${editId}`, payload);
        toast.success('Booking updated!');
      } else {
        await api.post('/bookings', payload);
        toast.success('Booking added!');
      }
      setBookingModal(false);
      refreshAll();
    } catch { toast.error('Error saving booking'); }
  };

  const deleteBooking = async (id: number) => {
    if (!confirm('Permanently delete this booking?')) return;
    try {
      await api.delete(`/bookings/${id}`);
      toast.success('Booking deleted');
      refreshAll();
    } catch { toast.error('Error deleting booking'); }
  };

  // Collect
  const openCollect = async (b: Booking) => {
    const recv = (Number(b.advanceReceived) || 0) + (Number(b.balanceReceived) || 0);
    const bookingPending = Number(b.collectionAmount) - recv;

    // Fetch pending KOT amount if guest is in-house
    let kotPending = 0;
    if (b.checkedIn && !b.checkedOut) {
      try {
        const kotRes = await api.get(`/kot/booking/${b.id}/unpaid`);
        const unpaidOrders = kotRes.data || [];
        kotPending = unpaidOrders.reduce((sum: number, order: any) =>
          sum + Number(order.totalAmount || order.amount || 0), 0
        );
      } catch {
        kotPending = Number(b.kotAmount) || 0;
      }
    }

    setCollectBooking(b);
    setCollectBookingAmount(bookingPending > 0 ? bookingPending : 0);
    setCollectKotAmount(kotPending);
    setCollectAmount(bookingPending + kotPending);
    setCollectMode('');
    setCollectBookingMode('');
    setCollectKotMode('');
    setCollectSplitPayment(false);
    setCollectSubCategory('');
    setCollectBookingSubCategory('');
    setCollectTransferToAgent(false);
    setCollectAmountFromGuest(0);
    setCollectModal(true);
  };

  const doCollect = async () => {
    if (!collectBooking) return;

    if (collectSplitPayment) {
      // Split payment validation
      if (collectBookingAmount > 0 && !collectBookingMode) {
        toast.error('Please select payment mode for booking collection');
        return;
      }
      if (collectKotAmount > 0 && !collectKotMode) {
        toast.error('Please select payment mode for KOT/Add-on collection');
        return;
      }
      if (collectBookingMode === 'AKS Office' && !collectBookingSubCategory) {
        toast.error('Please select AKS Office sub-category for booking');
        return;
      }
      if (collectKotMode === 'AKS Office') {
        toast.error('KOT/Add-ons cannot be collected via AKS Office. Please choose Cash/Card/SBI.');
        return;
      }
    } else {
      // Single payment validation
      if (!collectMode) {
        toast.error('Please select payment mode');
        return;
      }
      if (collectMode === 'AKS Office' && !collectSubCategory) {
        toast.error('Please select AKS Office sub-category');
        return;
      }
      if (collectMode === 'AKS Office' && collectKotAmount > 0) {
        toast.error('Cannot collect KOT/Add-ons via AKS Office. Please use split payment.');
        return;
      }
    }

    try {
      const payload: any = collectSplitPayment ? {
        splitPayment: true,
        bookingAmount: collectBookingAmount,
        bookingPaymentMode: collectBookingMode,
        bookingSubCategory: collectBookingMode === 'AKS Office' ? collectBookingSubCategory : undefined,
        kotAmount: collectKotAmount,
        kotPaymentMode: collectKotMode,
        transferToAgentLedger: collectTransferToAgent,
        amountFromGuest: collectTransferToAgent ? collectAmountFromGuest : undefined
      } : {
        splitPayment: false,
        amount: collectTransferToAgent ? collectAmountFromGuest : collectAmount,
        paymentMode: collectMode,
        subCategory: collectMode === 'AKS Office' ? collectSubCategory : undefined,
        transferToAgentLedger: collectTransferToAgent,
        totalPending: collectTransferToAgent ? collectBookingAmount : undefined
      };

      await api.post(`/bookings/${collectBooking.id}/collect`, payload);
      toast.success(collectTransferToAgent ? 'Payment collected and balance transferred to agent ledger!' : 'Payment collected!');
      setCollectModal(false);
      setCollectSubCategory('');
      setCollectBookingSubCategory('');
      setCollectTransferToAgent(false);
      setCollectAmountFromGuest(0);
      refreshAll();
    } catch { toast.error('Error collecting payment'); }
  };

  // Cancel/Reschedule
  const openCancel = (b: Booking) => {
    setCancelBooking(b);
    setCancelAction('cancel');
    setRescheduleDate('');
    setCancelModal(true);
  };

  const doCancel = async () => {
    if (!cancelBooking) return;
    try {
      if (cancelAction === 'cancel') {
        await api.post(`/bookings/${cancelBooking.id}/cancel`);
        toast.success('Booking cancelled');
      } else {
        if (!rescheduleDate) { toast.error('Select new date'); return; }
        await api.post(`/bookings/${cancelBooking.id}/reschedule`, { newCheckOut: rescheduleDate });
        toast.success('Booking rescheduled');
      }
      setCancelModal(false);
      refreshAll();
    } catch { toast.error('Error'); }
  };

  // Check-in
  const openCheckin = (b: Booking) => {
    setCheckinBooking(b);
    const existing = (b.roomNo || '').split(',').map(r => r.trim()).filter(Boolean);
    setCheckinRooms(existing.length > 0 ? existing : ['']);
    setCheckinModal(true);
  };

  const doCheckin = async () => {
    if (!checkinBooking || isCheckingIn) return;
    const rooms = checkinRooms.filter(Boolean);
    if (rooms.length === 0) { toast.error('Select at least one room'); return; }

    setIsCheckingIn(true);
    try {
      await api.post(`/bookings/${checkinBooking.id}/checkin`, { roomNo: rooms.join(','), noOfRooms: rooms.length });
      toast.success(`${checkinBooking.guestName} checked in!`);
      setCheckinModal(false);
      refreshAll();
    } catch {
      toast.error('Error');
    } finally {
      setIsCheckingIn(false);
    }
  };

  // KOT Functions
  const openKotModal = () => {
    setKotCustomerType('walkin');
    setKotSelectedBooking(null);
    setKotCustomerName('');
    setKotItems([{ itemName: '', quantity: 1, rate: 0 }]);
    setKotPaymentMode('Cash');
    setKotModal(true);
  };

  const addKotItem = () => {
    setKotItems([...kotItems, { itemName: '', quantity: 1, rate: 0 }]);
  };

  const removeKotItem = (index: number) => {
    if (kotItems.length > 1) {
      setKotItems(kotItems.filter((_, i) => i !== index));
    }
  };

  const updateKotItem = (index: number, field: 'itemName' | 'quantity' | 'rate', value: string | number) => {
    const updated = [...kotItems];
    updated[index] = { ...updated[index], [field]: value };
    setKotItems(updated);
  };

  const calculateKotSubtotal = () => {
    return kotItems.reduce((sum, item) => sum + (item.quantity * item.rate), 0);
  };

  const calculateKotGST = () => {
    return calculateKotSubtotal() * 0.05;
  };

  const calculateKotTotal = () => {
    return calculateKotSubtotal() + calculateKotGST();
  };

  const generateKotBill = (kotId: string, customerName: string) => {
    const subtotal = calculateKotSubtotal();
    const gst = calculateKotGST();
    const total = calculateKotTotal();
    const validItems = kotItems.filter(i => i.itemName && i.quantity > 0 && i.rate > 0);

    const billHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>KOT Bill - ${kotId}</title>
        <style>
          @media print {
            @page { size: A5; margin: 10mm; }
            body { margin: 0; }
          }
          body {
            font-family: 'Courier New', monospace;
            max-width: 80mm;
            margin: 0 auto;
            padding: 10px;
            font-size: 12px;
          }
          .header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
          .header h2 { margin: 5px 0; font-size: 18px; }
          .header p { margin: 2px 0; font-size: 11px; }
          .info { margin: 10px 0; font-size: 11px; }
          .info div { margin: 3px 0; }
          table { width: 100%; border-collapse: collapse; margin: 10px 0; }
          th { text-align: left; border-bottom: 1px solid #000; padding: 5px 0; font-size: 11px; }
          td { padding: 5px 0; font-size: 11px; }
          .right { text-align: right; }
          .totals { border-top: 1px dashed #000; margin-top: 10px; padding-top: 5px; }
          .totals div { display: flex; justify-content: space-between; margin: 3px 0; }
          .grand-total { font-weight: bold; font-size: 14px; border-top: 2px solid #000; padding-top: 5px; margin-top: 5px; }
          .footer { text-align: center; margin-top: 15px; padding-top: 10px; border-top: 2px dashed #000; font-size: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>AKS HOSPITALITY</h2>
          <p>THE NEELKANTH GRAND</p>
          <p>Travel & Tourism</p>
          <p>Manali, Himachal Pradesh</p>
        </div>

        <div class="info">
          <div><strong>KOT No:</strong> ${kotId}</div>
          <div><strong>Date:</strong> ${new Date().toLocaleDateString('en-IN')} ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
          <div><strong>Customer:</strong> ${customerName}</div>
          ${kotCustomerType === 'inhouse' && kotSelectedBooking ? `<div><strong>Room:</strong> ${kotSelectedBooking.roomNo}</div>` : ''}
        </div>

        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th class="right">Qty</th>
              <th class="right">Rate</th>
              <th class="right">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${validItems.map(item => `
              <tr>
                <td>${item.itemName}</td>
                <td class="right">${item.quantity}</td>
                <td class="right">₹${item.rate.toFixed(2)}</td>
                <td class="right">₹${(item.quantity * item.rate).toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="totals">
          <div><span>Subtotal:</span><span>₹${subtotal.toFixed(2)}</span></div>
          <div><span>GST (5%):</span><span>₹${gst.toFixed(2)}</span></div>
          <div class="grand-total">
            <span>GRAND TOTAL:</span><span>₹${total.toFixed(2)}</span>
          </div>
          <div style="margin-top: 8px;"><span>Payment:</span><span><strong>${kotPaymentMode === 'Pay at Checkout' ? 'UNPAID (At Checkout)' : kotPaymentMode}</strong></span></div>
        </div>

        <div class="footer">
          <p>Thank you for your order!</p>
          <p>GST Bill | Tax Invoice</p>
        </div>

        <script>
          window.onload = function() {
            window.print();
          }
        </script>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (printWindow) {
      printWindow.document.write(billHtml);
      printWindow.document.close();
    }
  };

  const submitKotOrder = async () => {
    const validItems = kotItems.filter(i => i.itemName && i.quantity > 0 && i.rate > 0);
    if (validItems.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    if (kotCustomerType === 'inhouse' && !kotSelectedBooking) {
      toast.error('Please select a guest/room');
      return;
    }

    if (kotCustomerType === 'walkin' && !kotCustomerName.trim()) {
      toast.error('Please enter customer name');
      return;
    }

    try {
      const payload: any = {
        items: validItems,
        orderDate: getToday(),
        status: kotPaymentMode === 'Pay at Checkout' ? 'UNPAID' : 'PAID',
        paymentMode: kotPaymentMode === 'Pay at Checkout' ? '' : kotPaymentMode,
      };

      if (kotCustomerType === 'inhouse' && kotSelectedBooking) {
        payload.bookingId = kotSelectedBooking.bookingId;
        payload.roomNo = kotSelectedBooking.roomNo;
        payload.customerName = `${kotSelectedBooking.guestName} - Room ${kotSelectedBooking.roomNo}`;
      } else {
        payload.customerName = kotCustomerName;
      }

      const response = await api.post('/kot', payload);
      const createdOrder = response.data;

      if (kotPaymentMode === 'Pay at Checkout') {
        toast.success('KOT order created - Will be collected at checkout');
      } else {
        toast.success('KOT order created and paid');
      }

      // Generate and print bill
      const customerName = kotCustomerType === 'inhouse' && kotSelectedBooking
        ? `${kotSelectedBooking.guestName} - Room ${kotSelectedBooking.roomNo}`
        : kotCustomerName;

      generateKotBill(createdOrder.kotId || 'KOT-NEW', customerName);

      setKotModal(false);
      refreshAll();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create KOT order');
    }
  };

  // Checkout
  const openCheckout = async (b: Booking) => {
    setCheckoutBooking(b);
    setAddOns(b.addOns?.map(a => ({ type: a.type, amount: Number(a.amount) })) || []);
    setCheckoutPayMode('');

    // Fetch unpaid KOT orders for this booking
    try {
      const { data } = await api.get(`/kot`, {
        params: {
          bookingId: b.bookingId,
          status: 'UNPAID'
        }
      });
      const unpaidOrders = data.filter((order: any) =>
        order.bookingId === b.bookingId && order.status === 'UNPAID'
      );
      setUnpaidKotOrders(unpaidOrders);

      // Auto-calculate KOT amount from unpaid orders
      const totalKot = unpaidOrders.reduce((sum: number, order: any) =>
        sum + (Number(order.totalAmount) || Number(order.amount) || 0), 0
      );
      setKotAmount(totalKot || Number(b.kotAmount) || 0);
    } catch (error) {
      // Fallback to booking's kotAmount if API fails
      setUnpaidKotOrders([]);
      setKotAmount(Number(b.kotAmount) || 0);
    }

    setCheckoutModal(true);
  };

  const doCheckout = async () => {
    if (!checkoutBooking || isCheckingOut) return;

    // Validate AKS Office sub-category if selected
    if (checkoutPayMode === 'AKS Office' && !checkoutSubCategory) {
      toast.error('Please select AKS Office sub-category');
      return;
    }

    setIsCheckingOut(true);
    try {
      await api.post(`/bookings/${checkoutBooking.id}/checkout`, {
        kotAmount,
        addOns,
        paymentMode: checkoutPayMode || undefined,
        subCategory: checkoutPayMode === 'AKS Office' ? checkoutSubCategory : undefined,
        transferToAgentLedger: transferToAgent,
        collectAmount: transferToAgent ? collectFromGuest : undefined,
      });
      toast.success('Guest checked out!');
      setCheckoutModal(false);
      setCheckoutPayMode('');
      setCheckoutSubCategory('');
      setTransferToAgent(false);
      setCollectFromGuest(0);
      refreshAll();
    } catch {
      toast.error('Error');
    } finally {
      setIsCheckingOut(false);
    }
  };

  const getCheckoutTotals = () => {
    if (!checkoutBooking) return { origTotal: 0, grandTotal: 0, received: 0, balance: 0 };
    const origTotal = Number(checkoutBooking.totalAmount) || 0;
    const addOnTotal = addOns.reduce((s, a) => s + (a.amount || 0), 0);
    const grandTotal = origTotal + kotAmount + addOnTotal;
    const received = (Number(checkoutBooking.advanceReceived) || 0) + (Number(checkoutBooking.balanceReceived) || 0);
    return { origTotal, grandTotal, received, balance: Math.max(grandTotal - received, 0) };
  };

  const renderGuestTable = (title: string, guests: Booking[], type: 'checkin' | 'inhouse' | 'checkout') => {
    return (
      <div className={`guest-list-section ${type === 'checkin' ? 'checkin-section' : type === 'inhouse' ? 'inhouse-section' : 'checkout-section'}`}>
        <div className="section-title">
          <span className="material-icons">{type === 'checkin' ? 'login' : type === 'inhouse' ? 'hotel' : 'logout'}</span>
          {title} ({guests.length})
        </div>
        {guests.length === 0 ? (
          <div className="guest-list-empty">No {type === 'checkin' ? 'check-ins' : type === 'inhouse' ? 'in-house guests' : 'check-outs'} today</div>
        ) : (
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table className="guest-list-table" style={{ minWidth: '1000px' }}>
              <thead><tr>
                <th>Guest</th><th>Pax</th><th>Room</th><th>Source</th>
                <th>Check-in</th><th>Checkout</th><th>Collection</th>
                {type === 'inhouse' && <th>Received</th>}
                <th>Pending</th><th>Status</th>
                <th>Actions</th>
              </tr></thead>
              <tbody>
                {guests.map((b) => {
                  // Debug logging
                  if (b.guestName?.includes('Shubhasis') || b.guestName?.includes('shubhasis')) {
                    console.log('DEBUG - Shubhasis booking:', {
                      guestName: b.guestName,
                      paymentType: b.paymentType,
                      paymentMode: b.paymentMode,
                      totalAmount: b.totalAmount,
                      collectionAmount: b.collectionAmount,
                      hotelShare: b.hotelShare,
                      advanceReceived: b.advanceReceived
                    });
                  }

                  // Always use collectionAmount (MEMORY.md rule)
                  const collAmt = Number(b.collectionAmount) || 0;
                  const recv = (Number(b.advanceReceived) || 0) + (Number(b.balanceReceived) || 0);
                  const pend = collAmt - recv;
                  const statusClass = b.status === 'COLLECTED' ? 'badge-collected' : b.status === 'PARTIAL' ? 'badge-partial' : 'badge-pending';
                  return (
                    <tr key={b.id}>
                      <td><strong>{b.guestName}</strong>{b.phone && <><br /><small style={{ color: 'var(--text-muted)' }}>{b.phone}</small></>}</td>
                      <td>{b.pax || 1}</td>
                      <td>{b.roomNo ? <strong>{b.roomNo.replace(/,/g, ' / ')}</strong> : <em style={{ color: 'var(--accent-orange)', fontSize: '12px' }}>Not assigned</em>}</td>
                      <td>{b.source}{b.sourceName && <><br /><small>{b.sourceName}</small></>}</td>
                      <td>{formatDate(b.checkIn)}</td>
                      <td>{formatDate(b.checkOut)}</td>
                      <td className="amount">{formatCurrency(collAmt)}</td>
                      {type === 'inhouse' && <td className="amount amount-received">{formatCurrency(recv)}</td>}
                      <td className={`amount ${pend > 0 ? 'amount-pending' : ''}`}>{formatCurrency(pend)}</td>
                      <td><span className={`badge ${statusClass}`}>{b.status}</span></td>
                      {type === 'checkin' && (
                        <td style={{ minWidth: '250px' }}>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'nowrap' }}>
                            <button className="btn btn-primary btn-small" onClick={() => openCheckin(b)}>
                              <span className="material-icons" style={{ fontSize: '14px' }}>login</span> Check-in
                            </button>
                            {pend > 0 && <button className="btn btn-secondary btn-small" onClick={() => openCollect(b)}>Collect</button>}
                            <button className="btn btn-secondary btn-small" onClick={() => openEditBooking(b)} title="Edit Booking">
                              <span className="material-icons" style={{ fontSize: '14px' }}>edit</span>
                            </button>
                          </div>
                        </td>
                      )}
                      {type === 'inhouse' && (
                        <td style={{ minWidth: '200px' }}>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'nowrap' }}>
                            <button
                              className="btn btn-primary btn-small"
                              onClick={() => navigate('/kot')}
                              style={{ background: '#6b7b93' }}
                            >
                              <span className="material-icons" style={{ fontSize: '14px' }}>restaurant</span> Add KOT
                            </button>
                            <button className="btn btn-secondary btn-small" onClick={() => openEditBooking(b)} title="Edit Booking">
                              <span className="material-icons" style={{ fontSize: '14px' }}>edit</span>
                            </button>
                          </div>
                        </td>
                      )}
                      {type === 'checkout' && (
                        <td style={{ minWidth: '250px' }}>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'nowrap' }}>
                            <button className="btn btn-warning btn-small" onClick={() => openCheckout(b)}>
                              <span className="material-icons" style={{ fontSize: '14px' }}>logout</span> Checkout
                            </button>
                            {pend > 0 && <button className="btn btn-primary btn-small" onClick={() => openCollect(b)}>Collect</button>}
                            <button className="btn btn-secondary btn-small" onClick={() => openEditBooking(b)} title="Edit Booking">
                              <span className="material-icons" style={{ fontSize: '14px' }}>edit</span>
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userName = user.name || 'User';

  return (
    <div className="page-container">
      {/* Welcome Header */}
      <div className="welcome-header">
        <h1>Welcome, {userName}</h1>
        <p>Admin Dashboard</p>
      </div>

      {/* Header Actions */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <button className="btn btn-primary" onClick={() => navigate('/bookings/new')}>
          <span className="material-icons">add</span> New Booking
        </button>
        <button
          className="btn btn-primary"
          onClick={openKotModal}
          style={{ background: 'var(--accent-blue)' }}
        >
          <span className="material-icons">restaurant</span> New KOT Order
        </button>
      </div>

      {/* Guest Lists */}
      <div className="guest-lists">
        {stats && renderGuestTable('Today Check-in', stats.checkinGuests, 'checkin')}
        {stats && renderGuestTable('In-House Guests', stats.inhouseGuests, 'inhouse')}
        {stats && renderGuestTable('Today Check-out', stats.checkoutGuests, 'checkout')}
      </div>

      {/* Stat Cards */}
      {stats && (
        <>
          <div className="dashboard">
            <StatCard label="Today Collection" value={formatCurrency(stats.todayCollectionAmt)} color="blue" />
            <StatCard label="Collected" value={formatCurrency(stats.todayCollectedAmt)} color="green" />
            <StatCard label="Pending" value={formatCurrency(stats.todayPendingAmt)} color="red" />
            <StatCard label="Ledger Due" value={formatCurrency(stats.ledgerDueAmt)} color="orange" />
          </div>
          {stats.todayPendingAmt > 0 && (
            <div className="alert-box">
              <span className="material-icons">warning</span>
              <div><h4>Pending Collection</h4><p>Checkout today: {formatCurrency(stats.todayPendingAmt)} pending</p></div>
            </div>
          )}
          {Object.keys(stats.ledgerByAgent).length > 0 && (
            <div className="ledger-summary">
              <h3><span className="material-icons">account_balance</span> Ledger Due by Agent</h3>
              <div className="ledger-grid">
                {Object.entries(stats.ledgerByAgent).map(([agent, amt]) => (
                  <div className="ledger-item" key={agent}><span className="name">{agent}</span><span className="amount">{formatCurrency(amt)}</span></div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Summary */}
      <div className="monthly-summary">
        <div className="section-header">
          <h3><span className="material-icons">bar_chart</span> Summary</h3>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <input type="date" value={summaryStart} onChange={(e) => setSummaryStart(e.target.value)} className="month-selector" />
            <span>to</span>
            <input type="date" value={summaryEnd} onChange={(e) => setSummaryEnd(e.target.value)} className="month-selector" />
          </div>
        </div>
        <div className="monthly-grid">
          <div className="monthly-card"><div className="mc-label">Bookings</div><div className="mc-value blue">{summaryData.count}</div></div>
          <div className="monthly-card"><div className="mc-label">Room Charge</div><div className="mc-value blue">{formatCurrency(summaryData.roomCharge)}</div></div>
          <div className="monthly-card"><div className="mc-label">KOT</div><div className="mc-value blue">{formatCurrency(summaryData.kot)}</div></div>
          <div className="monthly-card"><div className="mc-label">Add-On</div><div className="mc-value blue">{formatCurrency(summaryData.addOn)}</div></div>
          <div className="monthly-card"><div className="mc-label">Total Collection</div><div className="mc-value blue">{formatCurrency(summaryData.collection)}</div></div>
          <div className="monthly-card"><div className="mc-label">Collected</div><div className="mc-value green">{formatCurrency(summaryData.collected)}</div></div>
          <div className="monthly-card"><div className="mc-label">Pending</div><div className="mc-value red">{formatCurrency(summaryData.pending)}</div></div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-card">
        <div className="filters-row">
          <div className="filter-group">
            <label>View By</label>
            <select value={filterViewBy} onChange={(e) => setFilterViewBy(e.target.value)}>
              <option value="checkout">Checkout Date</option>
              <option value="checkin">Check-in Date</option>
              <option value="sameday">Same Day</option>
            </select>
          </div>
          <div className="filter-group"><label>Date</label><input type="date" value={filterDate} onChange={(e) => setFilterDate(e.target.value)} /></div>
          <div className="filter-group">
            <label>Status</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="">All</option>
              <option value="PENDING">Pending</option><option value="PARTIAL">Partial</option>
              <option value="COLLECTED">Collected</option><option value="CANCELLED">Cancelled</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Source</label>
            <select value={filterSource} onChange={(e) => setFilterSource(e.target.value)}>
              <option value="">All</option>
              <option value="Walk-in">Walk-in</option><option value="OTA">OTA</option><option value="Agent">Agent</option>
            </select>
          </div>
          <div className="filter-group"><label>Agent</label><input type="text" value={filterAgent} onChange={(e) => setFilterAgent(e.target.value)} placeholder="Agent name" /></div>
          <button className="btn btn-secondary" onClick={() => { setFilterDate(''); setFilterStatus(''); setFilterSource(''); setFilterAgent(''); }}>Clear</button>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="table-card">
        <div className="table-header">
          <h2>Bookings</h2>
          <span className="record-count">{bookings.length} records</span>
        </div>
        {bookings.length === 0 ? (
          <div className="empty-state"><span className="material-icons">inbox</span><h3>No bookings found</h3></div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead><tr>
                <th>ID</th><th>Guest</th><th>Pax</th><th>Room</th><th>Source</th>
                <th>Check-in</th><th>Checkout</th><th>Nights</th><th>Payment</th>
                <th>Rent</th><th>Total</th><th>Received</th><th>Pending</th><th>Status</th><th>Actions</th>
              </tr></thead>
              <tbody>
                {bookings.map((b) => {
                  const recv = (Number(b.advanceReceived) || 0) + (Number(b.balanceReceived) || 0);
                  const pend = Number(b.totalAmount) - recv;
                  const isCR = b.status === 'CANCELLED' || b.status === 'RESCHEDULED';
                  const sourceClass = b.source === 'Walk-in' ? 'badge-walkin' : b.source === 'OTA' ? 'badge-ota' : 'badge-agent';
                  const statusClass = b.status === 'COLLECTED' ? 'badge-collected' : b.status === 'PARTIAL' ? 'badge-partial' : b.status === 'CANCELLED' ? 'badge-cancelled' : b.status === 'RESCHEDULED' ? 'badge-rescheduled' : 'badge-pending';
                  return (
                    <tr key={b.id} style={isCR ? { opacity: 0.6 } : undefined}>
                      <td><strong>{b.bookingId}</strong></td>
                      <td><div className="guest-info"><div className="name">{b.guestName}{b.kot === 'Yes' && <span className="badge-kot">KOT</span>}</div>{b.phone && <div className="phone">{b.phone}</div>}</div></td>
                      <td>{b.pax || 1}</td>
                      <td>{b.roomNo ? <strong>{b.roomNo.replace(/,/g, ' / ')}</strong> : <em style={{ color: 'var(--accent-orange)', fontSize: '12px' }}>Not assigned</em>}</td>
                      <td><span className={`badge ${sourceClass}`}>{b.source}</span>{b.sourceName && <><br /><small style={{ color: 'var(--text-muted)' }}>{b.sourceName}</small></>}</td>
                      <td>{formatDate(b.checkIn)}</td>
                      <td><strong>{formatDate(b.checkOut)}</strong>{b.rescheduledFrom && <><br /><small style={{ color: 'var(--text-muted)' }}>was {formatDate(b.rescheduledFrom)}</small></>}</td>
                      <td><strong>{calculateNights(b.checkIn, b.checkOut)}</strong></td>
                      <td><span className="payment-type">{b.paymentType}</span></td>
                      <td className="amount">{formatCurrency(b.actualRoomRent)}</td>
                      <td className="amount">{formatCurrency(b.totalAmount)}</td>
                      <td className="amount amount-received">{formatCurrency(recv)}</td>
                      <td className={`amount ${pend > 0 ? 'amount-pending' : ''}`}>{formatCurrency(pend)}</td>
                      <td><span className={`badge ${statusClass}`}>{b.status}</span></td>
                      <td style={{ minWidth: '350px' }}>
                        <div className="action-buttons-row" style={{
                          display: 'flex !important' as any,
                          flexDirection: 'row !important' as any,
                          gap: '6px',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          justifyContent: 'flex-start',
                        }}>
                          {!isCR && pend > 0 && (
                            <button
                              className="btn btn-primary btn-small"
                              onClick={() => openCollect(b)}
                              style={{
                                minWidth: '70px',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              Collect
                            </button>
                          )}
                          {!isCR && (
                            <button
                              className="btn btn-warning btn-small"
                              onClick={() => openCheckout(b)}
                              style={{
                                alignItems: 'center',
                                gap: '4px',
                                minWidth: '90px',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              <span className="material-icons" style={{ fontSize: '16px' }}>logout</span>
                              Checkout
                            </button>
                          )}
                          {!isCR && (
                            <button
                              className="btn btn-secondary btn-small"
                              onClick={() => openEditBooking(b)}
                              style={{
                                minWidth: '60px',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              Edit
                            </button>
                          )}
                          {!isCR && (
                            <button
                              className="btn btn-danger btn-small"
                              onClick={() => openCancel(b)}
                              style={{
                                minWidth: '70px',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              Cancel
                            </button>
                          )}
                          <button
                            className="btn btn-danger btn-small"
                            onClick={() => deleteBooking(b.id)}
                            title="Delete"
                            style={{
                              minWidth: '40px',
                              padding: '6px 8px',
                              justifyContent: 'center',
                            }}
                          >
                            <span className="material-icons" style={{ fontSize: '16px' }}>delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Booking Modal */}
      <Modal open={bookingModal} onClose={() => setBookingModal(false)} title={editId ? 'Edit Booking' : 'New Booking'}
        footer={<><button className="btn btn-secondary" onClick={() => setBookingModal(false)}>Cancel</button><button className="btn btn-primary" onClick={saveBooking}><span className="material-icons">save</span> Save Booking</button></>}>

        {/* Guest Information */}
        <div style={{ marginBottom: '24px', padding: '16px', background: 'linear-gradient(135deg, rgba(0, 102, 204, 0.08), rgba(0, 102, 204, 0.04))', borderRadius: '12px', border: '1px solid rgba(0, 102, 204, 0.15)' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: '600', color: '#0066cc', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-icons" style={{ fontSize: '20px' }}>person</span>
            Guest Information
          </h3>
          <div className="form-row">
            <div className="form-group"><label>Guest Name *</label><input value={form.guestName} onChange={(e) => setForm({ ...form, guestName: e.target.value })} placeholder="Enter guest full name" /></div>
            <div className="form-group"><label>Phone Number</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="10-digit mobile" /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Number of Adults (Pax)</label><input type="number" min="1" value={form.pax} onChange={(e) => setForm({ ...form, pax: Number(e.target.value) })} /></div>
            <div className="form-group"><label>KOT Required?</label><select value={form.kot} onChange={(e) => setForm({ ...form, kot: e.target.value })}><option value="">No</option><option value="Yes">Yes</option></select></div>
          </div>
        </div>

        {/* Room Details */}
        <div style={{ marginBottom: '24px', padding: '16px', background: 'linear-gradient(135deg, rgba(201, 163, 95, 0.08), rgba(201, 163, 95, 0.04))', borderRadius: '12px', border: '1px solid rgba(201, 163, 95, 0.15)' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: '600', color: '#c9a35f', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-icons" style={{ fontSize: '20px' }}>meeting_room</span>
            Room Details
          </h3>
          <div className="form-row">
            <div className="form-group"><label>Number of Rooms</label><input type="number" min="1" value={form.noOfRooms} onChange={(e) => setForm({ ...form, noOfRooms: Number(e.target.value) })} /></div>
            <div className="form-group"><label>Room Number(s)</label><input value={form.roomNo} onChange={(e) => setForm({ ...form, roomNo: e.target.value })} placeholder="e.g. 201, 202" /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Room Category</label>
              <select value={form.roomCategory} onChange={(e) => setForm({ ...form, roomCategory: e.target.value })}>
                <option value="">Select Category</option>
                <option value="Non-Balcony">Non-Balcony</option>
                <option value="Balcony">Balcony</option>
                <option value="Mini Family">Mini Family</option>
                <option value="Royal Suite Duplex">Royal Suite Duplex</option>
              </select>
            </div>
            <div className="form-group"><label>Meal Plan</label>
              <select value={form.mealPlan} onChange={(e) => setForm({ ...form, mealPlan: e.target.value })}>
                <option value="">Select Plan</option>
                <option value="EP">EP (Room Only)</option>
                <option value="CP">CP (Breakfast)</option>
                <option value="MAP">MAP (Breakfast + Dinner)</option>
                <option value="AP">AP (All Meals)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Booking Dates */}
        <div style={{ marginBottom: '24px', padding: '16px', background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.08), rgba(34, 197, 94, 0.04))', borderRadius: '12px', border: '1px solid rgba(34, 197, 94, 0.15)' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: '600', color: '#22c55e', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-icons" style={{ fontSize: '20px' }}>calendar_today</span>
            Booking Dates
          </h3>
          <div className="form-row">
            <div className="form-group"><label>Check-in Date *</label><input type="date" value={form.checkIn} onChange={(e) => setForm({ ...form, checkIn: e.target.value })} /></div>
            <div className="form-group"><label>Check-out Date *</label><input type="date" value={form.checkOut} onChange={(e) => setForm({ ...form, checkOut: e.target.value })} /></div>
            {form.checkIn && form.checkOut && (
              <div className="form-group">
                <label>Total Nights</label>
                <input readOnly value={calculateNights(form.checkIn, form.checkOut)} style={{ background: 'rgba(34, 197, 94, 0.1)', fontWeight: '600', color: '#22c55e' }} />
              </div>
            )}
          </div>
        </div>

        {/* Booking Source */}
        <div style={{ marginBottom: '24px', padding: '16px', background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.08), rgba(168, 85, 247, 0.04))', borderRadius: '12px', border: '1px solid rgba(168, 85, 247, 0.15)' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: '600', color: '#a855f7', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-icons" style={{ fontSize: '20px' }}>source</span>
            Booking Source
          </h3>
          <div className="form-row">
            <div className="form-group"><label>Source Type</label>
              <select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })}>
                <option value="Walk-in">Walk-in</option>
                <option value="OTA">OTA (MakeMyTrip, Goibibo, etc.)</option>
                <option value="Agent">Agent</option>
              </select>
            </div>
            {(form.source === 'OTA' || form.source === 'Agent') && (
              <div className="form-group"><label>{form.source} Name</label><input value={form.sourceName} onChange={(e) => setForm({ ...form, sourceName: e.target.value })} placeholder={form.source === 'Agent' ? 'Agent name' : 'OTA platform name'} /></div>
            )}
          </div>
        </div>

        {/* Pricing */}
        <div style={{ marginBottom: '24px', padding: '16px', background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.08), rgba(249, 115, 22, 0.04))', borderRadius: '12px', border: '1px solid rgba(249, 115, 22, 0.15)' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: '600', color: '#f97316', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-icons" style={{ fontSize: '20px' }}>payments</span>
            Pricing & Add-ons
          </h3>
          <div className="form-group"><label>Base Room Rent</label><input type="number" value={form.actualRoomRent || ''} onChange={(e) => { const rent = Number(e.target.value); const addOnsTotal = bookingAddOns.reduce((s, a) => s + (a.amount || 0), 0); setForm({ ...form, actualRoomRent: rent, totalAmount: rent + addOnsTotal }); }} placeholder="Enter room rent" /></div>

          {/* Add-ons Section */}
          <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(249, 115, 22, 0.08)', borderRadius: '8px', border: '1px dashed rgba(249, 115, 22, 0.25)' }}>
            <label style={{ fontWeight: 600, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', color: '#f97316' }}>
              <span className="material-icons" style={{ fontSize: '18px' }}>add_circle</span>
              Add-ons (Honeymoon, Heater, etc.)
            </label>
            {bookingAddOns.map((ao, i) => (
              <div key={i} style={{ display: 'flex', gap: '8px', marginTop: '8px', alignItems: 'center' }}>
                <select value={ao.type} onChange={(e) => { const na = [...bookingAddOns]; na[i].type = e.target.value; setBookingAddOns(na); }} style={{ flex: 1, padding: '10px', border: '1px solid var(--input-border)', borderRadius: '8px', fontSize: '14px' }}>
                  <option value="">Select Add-on</option>
                  <option value="Honeymoon">🌹 Honeymoon Package</option>
                  <option value="Candle Night Dinner">🕯️ Candle Night Dinner</option>
                  <option value="Heater">🔥 Heater</option>
                  <option value="Other">Other</option>
                </select>
                <input type="number" placeholder="₹ Amount" value={ao.amount || ''} onChange={(e) => { const na = [...bookingAddOns]; na[i].amount = Number(e.target.value); setBookingAddOns(na); const addOnsTotal = na.reduce((s, a) => s + (a.amount || 0), 0); setForm({ ...form, totalAmount: form.actualRoomRent + addOnsTotal }); }} style={{ width: '140px', padding: '10px', border: '1px solid var(--input-border)', borderRadius: '8px', fontSize: '14px' }} />
                <button onClick={() => { const na = bookingAddOns.filter((_, j) => j !== i); setBookingAddOns(na); const addOnsTotal = na.reduce((s, a) => s + (a.amount || 0), 0); setForm({ ...form, totalAmount: form.actualRoomRent + addOnsTotal }); }} style={{ background: 'rgba(244,63,94,0.15)', border: '1px solid rgba(244,63,94,0.25)', borderRadius: '8px', width: '36px', height: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="material-icons" style={{ fontSize: '18px', color: 'var(--accent-red)' }}>close</span>
                </button>
              </div>
            ))}
            <button className="btn btn-secondary btn-small" style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => setBookingAddOns([...bookingAddOns, { type: '', amount: 0 }])}>
              <span className="material-icons" style={{ fontSize: '16px' }}>add</span>
              Add Item
            </button>
          </div>

          <div className="form-row" style={{ marginTop: '16px' }}>
            <div className="form-group">
              <label style={{ fontWeight: '600', color: '#f97316' }}>Total Amount (Room + Add-ons)</label>
              <input type="number" value={form.totalAmount || ''} readOnly style={{ background: 'rgba(249, 115, 22, 0.15)', fontWeight: '700', fontSize: '16px', color: '#f97316', border: '2px solid rgba(249, 115, 22, 0.3)' }} />
            </div>
            <div className="form-group">
              <label>Hotel Share</label>
              <input type="number" value={form.hotelShare || ''} onChange={(e) => setForm({ ...form, hotelShare: Number(e.target.value) })} placeholder="Hotel's portion" />
              <small style={{ display: 'block', marginTop: '4px', color: '#f97316', fontSize: '12px' }}>
                Agent Commission: {formatCurrency((form.totalAmount || 0) - (form.hotelShare || 0))}
              </small>
            </div>
          </div>
        </div>

        {/* Payment Details */}
        <div style={{ marginBottom: '16px', padding: '16px', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(59, 130, 246, 0.04))', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.15)' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: '600', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-icons" style={{ fontSize: '20px' }}>account_balance_wallet</span>
            Payment Details
          </h3>
          <div className="form-row">
            <div className="form-group"><label>Payment Type</label>
              <select value={form.paymentType} onChange={(e) => setForm({ ...form, paymentType: e.target.value })}>
                <option value="Postpaid">Postpaid (Pay at checkout)</option>
                <option value="Prepaid">Prepaid (Paid in advance)</option>
                <option value="Ledger">Ledger (Agent account)</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Advance Received</label><input type="number" value={form.advanceReceived || ''} onChange={(e) => setForm({ ...form, advanceReceived: Number(e.target.value) })} placeholder="0" /></div>
            <div className="form-group"><label>Payment Mode</label>
              <select value={form.paymentMode} onChange={(e) => { setForm({ ...form, paymentMode: e.target.value }); if (e.target.value !== 'AKS Office') setPaymentSubCategory(''); }}>
                <option value="">Select Mode</option>
                <option value="Cash">💵 Cash</option>
                <option value="Card">💳 Card</option>
                <option value="Bank Transfer">🏦 Bank Transfer (SBI Neelkanth)</option>
                <option value="AKS Office">🏢 AKS Office</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Collection Amount</label><input type="number" value={form.collectionAmount || ''} onChange={(e) => setForm({ ...form, collectionAmount: Number(e.target.value) })} placeholder="Amount collected" /></div>
            <div className="form-group"><label>Assign to Agent</label>
              <select value={form.agentId || ''} onChange={(e) => setForm({ ...form, agentId: e.target.value ? Number(e.target.value) : undefined })}>
                <option value="">No Agent</option>
                {users.filter(u => u.role === 'admin' || u.role === 'staff').map(user => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
            </div>
          </div>
          {form.paymentMode === 'AKS Office' && (
            <div className="form-group" style={{ marginTop: '12px' }}>
              <label>AKS Office Sub-Category</label>
              <select value={paymentSubCategory} onChange={(e) => setPaymentSubCategory(e.target.value)}>
                <option value="">Select Sub-Category</option>
                <option value="Rajat">Rajat</option>
                <option value="Happy">Happy</option>
                <option value="Vishal">Vishal</option>
                <option value="Gateway">Gateway</option>
                <option value="Fyra">Fyra</option>
                <option value="Other">Other</option>
              </select>
            </div>
          )}
        </div>

        {/* Additional Notes */}
        <div className="form-group">
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="material-icons" style={{ fontSize: '18px' }}>note</span>
            Remarks / Special Instructions
          </label>
          <input value={form.remarks} onChange={(e) => setForm({ ...form, remarks: e.target.value })} placeholder="Any special requests or notes..." />
        </div>
      </Modal>

      {/* Collect Modal */}
      <Modal open={collectModal} onClose={() => setCollectModal(false)} title="💰 Collect Payment"
        footer={<><button className="btn btn-secondary" onClick={() => setCollectModal(false)}>Cancel</button><button className="btn btn-primary" onClick={doCollect}><span className="material-icons">check_circle</span> Collect Payment</button></>}>
        {collectBooking && (
          <>
            {/* Payment Breakdown */}
            <div style={{ padding: '16px', background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(59, 130, 246, 0.05))', borderRadius: '12px', border: '1px solid rgba(59, 130, 246, 0.2)', marginBottom: '20px' }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', fontWeight: '600', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-icons" style={{ fontSize: '20px' }}>receipt_long</span>
                Payment Breakdown
              </h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', padding: '8px', background: 'rgba(255,255,255,0.5)', borderRadius: '8px' }}>
                <span>Booking Collection Remaining:</span>
                <strong style={{ color: '#ef4444' }}>{formatCurrency(collectBookingAmount)}</strong>
              </div>
              {collectKotAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', padding: '8px', background: 'rgba(255,255,255,0.5)', borderRadius: '8px' }}>
                  <span>KOT/Add-on Charges:</span>
                  <strong style={{ color: '#f97316' }}>{formatCurrency(collectKotAmount)}</strong>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', padding: '12px', background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(34, 197, 94, 0.05))', borderRadius: '8px', border: '2px solid rgba(34, 197, 94, 0.3)' }}>
                <span style={{ fontWeight: '700', fontSize: '16px' }}>Total to Collect:</span>
                <strong style={{ color: '#22c55e', fontSize: '18px' }}>{formatCurrency(collectAmount)}</strong>
              </div>
            </div>

            {/* Split Payment Option */}
            {collectBookingAmount > 0 && collectKotAmount > 0 && (
              <div style={{ marginBottom: '20px', padding: '12px', background: 'rgba(251, 191, 36, 0.1)', borderRadius: '8px', border: '1px solid rgba(251, 191, 36, 0.3)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: '600', color: '#92400e' }}>
                  <input type="checkbox" checked={collectSplitPayment} onChange={(e) => setCollectSplitPayment(e.target.checked)} style={{ width: '18px', height: '18px' }} />
                  <span className="material-icons" style={{ fontSize: '20px', color: '#f59e0b' }}>call_split</span>
                  Split Payment (Different payment modes for booking & KOT)
                </label>
              </div>
            )}

            {/* Payment Details */}
            {!collectSplitPayment ? (
              <div style={{ padding: '16px', background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.08), rgba(34, 197, 94, 0.04))', borderRadius: '12px', border: '1px solid rgba(34, 197, 94, 0.15)', marginBottom: '20px' }}>
                <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: '600', color: '#22c55e', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="material-icons" style={{ fontSize: '20px' }}>payments</span>
                  Payment Details
                </h3>
                <div className="form-group" style={{ marginBottom: '16px' }}>
                  <label>Payment Mode</label>
                  <select value={collectMode} onChange={(e) => { setCollectMode(e.target.value); setCollectSubCategory(''); }}>
                    <option value="">Select Mode</option>
                    <option value="Cash">💵 Cash</option>
                    <option value="Card">💳 Card</option>
                    <option value="Bank Transfer">🏦 Bank Transfer (SBI Neelkanth)</option>
                    <option value="AKS Office">🏢 AKS Office</option>
                  </select>
                </div>
                {collectMode === 'AKS Office' && (
                  <div className="form-group">
                    <label>AKS Office Sub-Category</label>
                    <select value={collectSubCategory} onChange={(e) => setCollectSubCategory(e.target.value)}>
                      <option value="">Select Person</option>
                      <option value="Rajat">Rajat</option>
                      <option value="Happy">Happy</option>
                      <option value="Vishal">Vishal</option>
                      <option value="Fyra">Fyra</option>
                      <option value="Gateway">Gateway</option>
                      <option value="Other">Other (Manual Entry)</option>
                    </select>
                    {collectSubCategory === 'Other' && (
                      <input type="text" placeholder="Enter name manually" style={{ marginTop: '12px' }} onChange={(e) => setCollectSubCategory(e.target.value)} />
                    )}
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Booking Payment */}
                {collectBookingAmount > 0 && (
                  <div style={{ padding: '16px', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.08), rgba(139, 92, 246, 0.04))', borderRadius: '12px', border: '1px solid rgba(139, 92, 246, 0.15)', marginBottom: '16px' }}>
                    <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', color: '#8b5cf6', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="material-icons" style={{ fontSize: '18px' }}>hotel</span>
                      Booking Payment ({formatCurrency(collectBookingAmount)})
                    </h3>
                    <div className="form-group" style={{ marginBottom: '12px' }}>
                      <label>Payment Mode</label>
                      <select value={collectBookingMode} onChange={(e) => { setCollectBookingMode(e.target.value); setCollectBookingSubCategory(''); }}>
                        <option value="">Select Mode</option>
                        <option value="Cash">💵 Cash</option>
                        <option value="Card">💳 Card</option>
                        <option value="Bank Transfer">🏦 Bank Transfer (SBI Neelkanth)</option>
                        <option value="AKS Office">🏢 AKS Office</option>
                      </select>
                    </div>
                    {collectBookingMode === 'AKS Office' && (
                      <div className="form-group">
                        <label>AKS Office Sub-Category</label>
                        <select value={collectBookingSubCategory} onChange={(e) => setCollectBookingSubCategory(e.target.value)}>
                          <option value="">Select Person</option>
                          <option value="Rajat">Rajat</option>
                          <option value="Happy">Happy</option>
                          <option value="Vishal">Vishal</option>
                          <option value="Fyra">Fyra</option>
                          <option value="Gateway">Gateway</option>
                          <option value="Other">Other (Manual Entry)</option>
                        </select>
                        {collectBookingSubCategory === 'Other' && (
                          <input type="text" placeholder="Enter name manually" style={{ marginTop: '12px' }} onChange={(e) => setCollectBookingSubCategory(e.target.value)} />
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* KOT/Add-on Payment */}
                {collectKotAmount > 0 && (
                  <div style={{ padding: '16px', background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.08), rgba(249, 115, 22, 0.04))', borderRadius: '12px', border: '1px solid rgba(249, 115, 22, 0.15)' }}>
                    <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', color: '#f97316', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="material-icons" style={{ fontSize: '18px' }}>restaurant</span>
                      KOT/Add-on Payment ({formatCurrency(collectKotAmount)})
                    </h3>
                    <div className="form-group">
                      <label>Payment Mode (Cash/Card/SBI only)</label>
                      <select value={collectKotMode} onChange={(e) => setCollectKotMode(e.target.value)}>
                        <option value="">Select Mode</option>
                        <option value="Cash">💵 Cash</option>
                        <option value="Card">💳 Card</option>
                        <option value="Bank Transfer">🏦 Bank Transfer (SBI Neelkanth)</option>
                      </select>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Transfer to Agent Ledger Option */}
            {collectBooking && (collectBooking.source === 'Agent' || collectBooking.paymentType === 'Ledger') && collectBookingAmount > 0 && (
              <div style={{ marginTop: '20px', padding: '16px', background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1), rgba(251, 191, 36, 0.05))', borderRadius: '12px', border: '1px solid rgba(251, 191, 36, 0.3)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '12px', fontWeight: '600', color: '#92400e' }}>
                  <input
                    type="checkbox"
                    checked={collectTransferToAgent}
                    onChange={(e) => {
                      setCollectTransferToAgent(e.target.checked);
                      if (e.target.checked) setCollectAmountFromGuest(0);
                    }}
                    style={{ width: '18px', height: '18px' }}
                  />
                  <span className="material-icons" style={{ fontSize: '20px', color: '#f59e0b' }}>account_balance</span>
                  Transfer unpaid balance to Agent Ledger
                </label>
                <p style={{ fontSize: '13px', color: '#92400e', marginBottom: '12px', marginLeft: '26px' }}>
                  Guest didn't pay or paid partial? Remaining amount will be added to agent's ledger as debit (agent will pay later)
                </p>
                {collectTransferToAgent && (
                  <div className="form-group" style={{ marginTop: '12px' }}>
                    <label style={{ fontWeight: '600' }}>Amount Collected from Guest</label>
                    <input
                      type="number"
                      value={collectAmountFromGuest || ''}
                      onChange={(e) => setCollectAmountFromGuest(Number(e.target.value))}
                      placeholder={`Max: ${formatCurrency(collectBookingAmount)}`}
                      max={collectBookingAmount}
                      style={{ fontSize: '16px', fontWeight: '600' }}
                    />
                    <small style={{ display: 'block', marginTop: '8px', color: '#92400e', fontWeight: '600' }}>
                      Remaining {formatCurrency(Math.max(0, collectBookingAmount - (collectAmountFromGuest || 0)))} will go to agent ledger
                    </small>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </Modal>

      {/* Cancel/Reschedule Modal */}
      <Modal open={cancelModal} onClose={() => setCancelModal(false)} title={cancelAction === 'cancel' ? '🚫 Cancel Booking' : '📅 Reschedule Booking'}
        footer={<><button className="btn btn-secondary" onClick={() => setCancelModal(false)}>Close</button>
          <button className={cancelAction === 'cancel' ? 'btn btn-danger' : 'btn btn-warning'} onClick={doCancel}>
            <span className="material-icons">{cancelAction === 'cancel' ? 'cancel' : 'event'}</span>
            {cancelAction === 'cancel' ? 'Cancel Booking' : 'Reschedule'}
          </button></>}>
        {cancelBooking && (
          <>
            <div style={{ padding: '16px', background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.08), rgba(168, 85, 247, 0.04))', borderRadius: '12px', border: '1px solid rgba(168, 85, 247, 0.15)', marginBottom: '20px' }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', fontWeight: '600', color: '#a855f7', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-icons" style={{ fontSize: '20px' }}>info</span>
                Booking Details
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px' }}>
                <div><small style={{ color: '#7a8699' }}>Guest Name</small><br /><strong>{cancelBooking.guestName}</strong></div>
                <div><small style={{ color: '#7a8699' }}>Booking ID</small><br /><strong>{cancelBooking.bookingId}</strong></div>
                <div><small style={{ color: '#7a8699' }}>Check-in</small><br />{formatDate(cancelBooking.checkIn)}</div>
                <div><small style={{ color: '#7a8699' }}>Check-out</small><br />{formatDate(cancelBooking.checkOut)}</div>
              </div>
            </div>

            <div style={{ padding: '16px', background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.08), rgba(249, 115, 22, 0.04))', borderRadius: '12px', border: '1px solid rgba(249, 115, 22, 0.15)' }}>
              <div className="form-group" style={{ marginBottom: cancelAction === 'reschedule' ? '16px' : '0' }}>
                <label style={{ fontWeight: '600' }}>Select Action</label>
                <select value={cancelAction} onChange={(e) => setCancelAction(e.target.value)} style={{ fontSize: '15px' }}>
                  <option value="cancel">🚫 Cancel Booking</option>
                  <option value="reschedule">📅 Reschedule to New Date</option>
                </select>
              </div>
              {cancelAction === 'reschedule' && (
                <div className="form-group">
                  <label style={{ fontWeight: '600' }}>New Checkout Date</label>
                  <input type="date" value={rescheduleDate} onChange={(e) => setRescheduleDate(e.target.value)} style={{ fontSize: '15px' }} />
                </div>
              )}
            </div>
          </>
        )}
      </Modal>

      {/* Check-in Modal */}
      <Modal open={checkinModal} onClose={() => setCheckinModal(false)} title="🏨 Check-in & Room Allotment"
        footer={<><button className="btn btn-secondary" onClick={() => setCheckinModal(false)} disabled={isCheckingIn}>Cancel</button><button className="btn btn-primary" onClick={doCheckin} disabled={isCheckingIn}><span className="material-icons">{isCheckingIn ? 'hourglass_empty' : 'login'}</span> {isCheckingIn ? 'Processing...' : 'Confirm Check-in'}</button></>}>
        {checkinBooking && (
          <>
            <div style={{ padding: '16px', background: 'linear-gradient(135deg, rgba(0, 102, 204, 0.08), rgba(0, 102, 204, 0.04))', borderRadius: '12px', border: '1px solid rgba(0, 102, 204, 0.15)', marginBottom: '20px' }}>
              <h3 style={{ margin: '0 0 12px 0', fontSize: '15px', fontWeight: '600', color: '#0066cc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-icons" style={{ fontSize: '20px' }}>person</span>
                Guest Information
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px' }}>
                <div><small style={{ color: '#7a8699' }}>Guest Name</small><br /><strong>{checkinBooking.guestName}</strong></div>
                <div><small style={{ color: '#7a8699' }}>Number of Guests</small><br /><strong>{checkinBooking.pax || 1} adults</strong></div>
                <div><small style={{ color: '#7a8699' }}>Check-in Date</small><br />{formatDate(checkinBooking.checkIn)}</div>
                <div><small style={{ color: '#7a8699' }}>Check-out Date</small><br />{formatDate(checkinBooking.checkOut)}</div>
              </div>
            </div>

            <div style={{ padding: '16px', background: 'linear-gradient(135deg, rgba(201, 163, 95, 0.08), rgba(201, 163, 95, 0.04))', borderRadius: '12px', border: '1px solid rgba(201, 163, 95, 0.15)' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: '600', color: '#c9a35f', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="material-icons" style={{ fontSize: '20px' }}>meeting_room</span>
                Assign Rooms
              </h3>
              {checkinRooms.map((rm, i) => (
                <div className="form-group" key={i} style={{ marginBottom: '12px' }}>
                  <label style={{ fontWeight: '600' }}>Room {i + 1}</label>
                  <select value={rm} onChange={(e) => { const nr = [...checkinRooms]; nr[i] = e.target.value; setCheckinRooms(nr); }} style={{ fontSize: '15px' }}>
                    <option value="">Select Room Number</option>
                    {ALL_ROOMS.map(r => <option key={r} value={r}>{r} - {ROOM_TYPE[r] || ''}</option>)}
                  </select>
                </div>
              ))}
              <button className="btn btn-secondary btn-small" onClick={() => setCheckinRooms([...checkinRooms, ''])} style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span className="material-icons" style={{ fontSize: '16px' }}>add</span>
                Add Another Room
              </button>
            </div>
          </>
        )}
      </Modal>

      {/* Checkout Modal */}
      <Modal open={checkoutModal} onClose={() => { setCheckoutModal(false); setCheckoutPayMode(''); setCheckoutSubCategory(''); }} title="Checkout" wide
        footer={<><button className="btn btn-secondary" onClick={() => { setCheckoutModal(false); setCheckoutPayMode(''); setCheckoutSubCategory(''); }} disabled={isCheckingOut}>Cancel</button><button className="btn btn-warning" onClick={doCheckout} disabled={isCheckingOut}><span className="material-icons">{isCheckingOut ? 'hourglass_empty' : 'logout'}</span> {isCheckingOut ? 'Processing...' : 'Process Checkout'}</button></>}>
        {checkoutBooking && (() => {
          const t = getCheckoutTotals();
          return (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
                <div><small style={{ color: 'var(--text-muted)' }}>Guest</small><br /><strong>{checkoutBooking.guestName}</strong></div>
                <div><small style={{ color: 'var(--text-muted)' }}>Room</small><br /><strong>{checkoutBooking.roomNo || 'N/A'}</strong></div>
                <div><small style={{ color: 'var(--text-muted)' }}>Check-in</small><br />{formatDate(checkoutBooking.checkIn)}</div>
                <div><small style={{ color: 'var(--text-muted)' }}>Check-out</small><br />{formatDate(checkoutBooking.checkOut)}</div>
              </div>

              {/* Unpaid KOT Orders - Date-wise Bill */}
              {unpaidKotOrders.length > 0 && (
                <div style={{
                  marginBottom: '16px',
                  padding: '16px',
                  background: '#fef3c7',
                  borderRadius: '8px',
                  border: '1px solid #fcd34d'
                }}>
                  <div style={{ fontWeight: '700', marginBottom: '12px', color: '#92400e', fontSize: '15px', borderBottom: '2px solid #fcd34d', paddingBottom: '8px' }}>
                    🍽️ KOT Bill - Consolidated
                  </div>

                  {/* Group orders by date */}
                  {Object.entries(
                    unpaidKotOrders.reduce((acc: any, order: any) => {
                      const date = new Date(order.orderDate || order.createdAt).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                      });
                      if (!acc[date]) acc[date] = [];
                      acc[date].push(order);
                      return acc;
                    }, {})
                  ).map(([date, dateOrders]: [string, any]) => (
                    <div key={date} style={{ marginBottom: '12px' }}>
                      <div style={{
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#92400e',
                        marginBottom: '6px',
                        background: '#fde68a',
                        padding: '4px 8px',
                        borderRadius: '4px',
                      }}>
                        📅 {date}
                      </div>
                      {dateOrders.map((order: any) => (
                        <div key={order.id} style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          padding: '6px 8px',
                          fontSize: '13px',
                          background: 'white',
                          borderRadius: '4px',
                          marginBottom: '4px',
                        }}>
                          <span style={{ flex: 1 }}>
                            <span style={{ fontWeight: '600', color: '#374151' }}>{order.kotId}</span>
                            {' • '}
                            <span style={{ color: '#6b7280' }}>{order.description || 'Items'}</span>
                          </span>
                          <span style={{ fontWeight: '600', color: '#1a2332', minWidth: '80px', textAlign: 'right' }}>
                            ₹{Number(order.totalAmount || order.amount).toFixed(2)}
                          </span>
                        </div>
                      ))}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '4px 8px',
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#92400e',
                        borderTop: '1px solid #fcd34d',
                        marginTop: '4px',
                      }}>
                        <span>Date Total:</span>
                        <span>₹{dateOrders.reduce((sum: number, o: any) =>
                          sum + Number(o.totalAmount || o.amount), 0
                        ).toFixed(2)}</span>
                      </div>
                    </div>
                  ))}

                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    paddingTop: '12px',
                    marginTop: '8px',
                    fontWeight: '700',
                    color: '#92400e',
                    fontSize: '15px',
                    borderTop: '2px solid #fcd34d',
                  }}>
                    <span>Grand Total KOT:</span>
                    <span>₹{kotAmount.toFixed(2)}</span>
                  </div>
                </div>
              )}

              <div className="form-group">
                <label>KOT Amount {unpaidKotOrders.length > 0 && <span style={{ fontSize: '12px', color: '#6b7280' }}>(Auto-calculated from unpaid orders)</span>}</label>
                <input type="number" value={kotAmount || ''} onChange={(e) => setKotAmount(Number(e.target.value))} />
              </div>
              <div style={{ marginTop: '16px' }}>
                <label style={{ fontWeight: 600 }}>Add-On Charges</label>
                {addOns.map((ao, i) => (
                  <div key={i} style={{ display: 'flex', gap: '8px', marginTop: '8px', alignItems: 'center' }}>
                    <select value={ao.type} onChange={(e) => { const na = [...addOns]; na[i].type = e.target.value; setAddOns(na); }} style={{ flex: 1, padding: '8px', border: '1px solid var(--input-border)', borderRadius: '8px' }}>
                      <option value="">Select</option><option value="Heater">Heater</option><option value="Bonfire">Bonfire</option><option value="BJ">BJ</option>
                      <option value="Honeymoon">Honeymoon</option><option value="Birthday">Birthday</option><option value="DJ">DJ</option><option value="Cake">Cake</option><option value="Other">Other</option>
                    </select>
                    <input type="number" placeholder="Amount" value={ao.amount || ''} onChange={(e) => { const na = [...addOns]; na[i].amount = Number(e.target.value); setAddOns(na); }} style={{ width: '120px', padding: '8px', border: '1px solid var(--input-border)', borderRadius: '8px' }} />
                    <button onClick={() => setAddOns(addOns.filter((_, j) => j !== i))} style={{ background: 'rgba(244,63,94,0.15)', border: '1px solid rgba(244,63,94,0.25)', borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer' }}>
                      <span className="material-icons" style={{ fontSize: '16px', color: 'var(--accent-red)' }}>close</span>
                    </button>
                  </div>
                ))}
                <button className="btn btn-secondary btn-small" style={{ marginTop: '8px' }} onClick={() => setAddOns([...addOns, { type: '', amount: 0 }])}>+ Add Charge</button>
              </div>
              <div style={{ marginTop: '16px', padding: '16px', background: 'rgba(255,255,255,0.04)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><span>Original Total</span><strong>{formatCurrency(t.origTotal)}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><span>KOT</span><strong>{formatCurrency(kotAmount)}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}><span>Add-Ons</span><strong>{formatCurrency(addOns.reduce((s, a) => s + (a.amount || 0), 0))}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontWeight: 700, fontSize: '16px', borderTop: '2px solid var(--accent-cyan)', paddingTop: '8px' }}><span>Grand Total</span><strong>{formatCurrency(t.grandTotal)}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: 'var(--accent-green)' }}><span>Received</span><strong>{formatCurrency(t.received)}</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--accent-red)', fontWeight: 700 }}><span>Balance</span><strong>{formatCurrency(t.balance)}</strong></div>
              </div>
              <div className="form-group" style={{ marginTop: '16px' }}><label>Collect Balance Via</label>
                <select value={checkoutPayMode} onChange={(e) => { setCheckoutPayMode(e.target.value); setCheckoutSubCategory(''); }}>
                  <option value="">Don't collect now</option>
                  <option value="Cash">💵 Cash</option>
                  <option value="Card">💳 Card</option>
                  <option value="Bank Transfer">🏦 Bank Transfer (SBI Neelkanth)</option>
                  <option value="AKS Office">🏢 AKS Office</option>
                </select>
              </div>

              {checkoutPayMode === 'AKS Office' && (
                <div className="form-group" style={{ marginTop: '12px' }}>
                  <label>AKS Office Sub-Category</label>
                  <select value={checkoutSubCategory} onChange={(e) => setCheckoutSubCategory(e.target.value)}>
                    <option value="">Select Person</option>
                    <option value="Rajat">Rajat</option>
                    <option value="Happy">Happy</option>
                    <option value="Vishal">Vishal</option>
                    <option value="Fyra">Fyra</option>
                    <option value="Gateway">Gateway</option>
                    <option value="Other">Other (Manual Entry)</option>
                  </select>
                </div>
              )}

              {/* Transfer to Agent Ledger Option */}
              {checkoutBooking && (checkoutBooking.paymentType === 'Ledger' || checkoutBooking.source === 'Agent') && t.balance > 0 && (
                <div style={{ marginTop: '16px', padding: '12px', background: '#fef3c7', borderRadius: '8px', border: '1px solid #fcd34d' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '12px' }}>
                    <input type="checkbox" checked={transferToAgent} onChange={(e) => setTransferToAgent(e.target.checked)} />
                    <span style={{ fontWeight: '600' }}>Transfer pending balance to Agent Ledger</span>
                  </label>
                  {transferToAgent && (
                    <div className="form-group" style={{ marginTop: '8px' }}>
                      <label>Amount to Collect from Guest (rest will be added to agent ledger)</label>
                      <input
                        type="number"
                        value={collectFromGuest || ''}
                        onChange={(e) => setCollectFromGuest(Math.min(Number(e.target.value), t.balance))}
                        placeholder="0"
                        max={t.balance}
                      />
                      <small style={{ color: '#92400e', marginTop: '4px', display: 'block' }}>
                        Agent ledger will be: {formatCurrency(t.balance - (collectFromGuest || 0))}
                      </small>
                    </div>
                  )}
                </div>
              )}
            </>
          );
        })()}
      </Modal>

      {/* KOT Order Modal */}
      <Modal open={kotModal} onClose={() => setKotModal(false)} title="Create KOT Order" wide
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setKotModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={submitKotOrder} style={{ background: '#6b7b93' }}>
              <span className="material-icons">restaurant</span> Create Order
            </button>
          </>
        }>
        {/* Customer Type Selection */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ fontWeight: '600', marginBottom: '8px', display: 'block' }}>Customer Type</label>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => setKotCustomerType('walkin')}
              style={{
                flex: 1,
                padding: '12px',
                background: kotCustomerType === 'walkin' ? '#6b7b93' : '#f3f4f6',
                color: kotCustomerType === 'walkin' ? 'white' : '#374151',
                border: kotCustomerType === 'walkin' ? '2px solid #6b7b93' : '2px solid #e5e7eb',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
              }}
            >
              <span className="material-icons" style={{ fontSize: '20px', verticalAlign: 'middle' }}>person</span>
              <br />Walk-in Customer
            </button>
            <button
              onClick={() => setKotCustomerType('inhouse')}
              style={{
                flex: 1,
                padding: '12px',
                background: kotCustomerType === 'inhouse' ? '#6b7b93' : '#f3f4f6',
                color: kotCustomerType === 'inhouse' ? 'white' : '#374151',
                border: kotCustomerType === 'inhouse' ? '2px solid #6b7b93' : '2px solid #e5e7eb',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
              }}
            >
              <span className="material-icons" style={{ fontSize: '20px', verticalAlign: 'middle' }}>hotel</span>
              <br />In-House Guest
            </button>
          </div>
        </div>

        {/* Customer Selection */}
        {kotCustomerType === 'walkin' ? (
          <div className="form-group">
            <label>Customer Name *</label>
            <input
              value={kotCustomerName}
              onChange={(e) => setKotCustomerName(e.target.value)}
              placeholder="Enter customer name"
            />
          </div>
        ) : (
          <div className="form-group">
            <label>Select Guest/Room *</label>
            <select
              value={kotSelectedBooking?.id || ''}
              onChange={(e) => {
                const booking = stats?.inhouseGuests.find(b => b.id === Number(e.target.value));
                setKotSelectedBooking(booking || null);
              }}
            >
              <option value="">Select a guest</option>
              {stats?.inhouseGuests.map(b => (
                <option key={b.id} value={b.id}>
                  {b.guestName} - Room {b.roomNo} ({b.bookingId})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Items Table */}
        <div style={{ marginTop: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <label style={{ fontWeight: '600', fontSize: '15px' }}>Order Items *</label>
            <button
              type="button"
              onClick={addKotItem}
              className="btn btn-secondary btn-small"
            >
              + Add Item
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ minWidth: '600px' }}>
              <thead>
                <tr>
                  <th style={{ width: '40%' }}>Item Name</th>
                  <th style={{ width: '15%' }}>Quantity</th>
                  <th style={{ width: '20%' }}>Rate (₹)</th>
                  <th style={{ width: '20%' }}>Total (₹)</th>
                  <th style={{ width: '5%' }}></th>
                </tr>
              </thead>
              <tbody>
                {kotItems.map((item, index) => (
                  <tr key={index}>
                    <td>
                      <input
                        type="text"
                        placeholder="Item name"
                        value={item.itemName}
                        onChange={(e) => updateKotItem(index, 'itemName', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '8px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                        }}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateKotItem(index, 'quantity', parseInt(e.target.value) || 1)}
                        style={{
                          width: '100%',
                          padding: '8px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                        }}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.rate}
                        onChange={(e) => updateKotItem(index, 'rate', parseFloat(e.target.value) || 0)}
                        style={{
                          width: '100%',
                          padding: '8px',
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                        }}
                      />
                    </td>
                    <td style={{ fontWeight: '600', textAlign: 'right' }}>
                      ₹{(item.quantity * item.rate).toFixed(2)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      {kotItems.length > 1 && (
                        <button
                          onClick={() => removeKotItem(index)}
                          style={{
                            background: '#fee',
                            color: '#dc2626',
                            border: 'none',
                            borderRadius: '6px',
                            width: '32px',
                            height: '32px',
                            cursor: 'pointer',
                          }}
                        >
                          <span className="material-icons" style={{ fontSize: '18px' }}>delete</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Total Calculation */}
        <div style={{
          marginTop: '24px',
          padding: '16px',
          background: '#f9fafb',
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
            <span>Subtotal:</span>
            <span style={{ fontWeight: '600' }}>₹{calculateKotSubtotal().toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px', paddingBottom: '8px', borderBottom: '1px solid #e5e7eb' }}>
            <span>GST (5%):</span>
            <span style={{ fontWeight: '600' }}>₹{calculateKotGST().toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: '700', color: '#1a2332' }}>
            <span>Grand Total:</span>
            <span>₹{calculateKotTotal().toFixed(2)}</span>
          </div>
        </div>

        {/* Payment Mode */}
        <div className="form-group" style={{ marginTop: '20px' }}>
          <label>Payment Mode *</label>
          <select value={kotPaymentMode} onChange={(e) => setKotPaymentMode(e.target.value)}>
            <option value="Cash">Cash</option>
            <option value="Card">Card</option>
            <option value="UPI">Online / UPI</option>
            {kotCustomerType === 'inhouse' && (
              <option value="Pay at Checkout">Pay at Checkout (Unpaid)</option>
            )}
          </select>
        </div>

        {/* Payment Status Info */}
        {kotPaymentMode === 'Pay at Checkout' ? (
          <div style={{
            marginTop: '12px',
            padding: '12px',
            background: '#fef3c7',
            borderRadius: '8px',
            fontSize: '13px',
            color: '#92400e',
          }}>
            <strong>Note:</strong> This order will be marked as UNPAID and will be collected at checkout
          </div>
        ) : (
          <div style={{
            marginTop: '12px',
            padding: '12px',
            background: '#dcfce7',
            borderRadius: '8px',
            fontSize: '13px',
            color: '#166534',
          }}>
            <strong>✓ Payment collected:</strong> ₹{calculateKotTotal().toFixed(2)} via {kotPaymentMode}
          </div>
        )}
      </Modal>
    </div>
  );
}
