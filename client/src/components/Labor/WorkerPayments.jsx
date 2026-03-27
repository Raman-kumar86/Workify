import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  IndianRupee,
  CreditCard,
  Landmark,
  Smartphone,
  CheckCircle2,
  History,
  Plus,
  ShieldAlert,
  ArrowDownCircle,
  Wallet,
} from "lucide-react";
import axiosInstance from "../../api/axios.jsx";
import { usePopup } from "../../context/PopupContext";

const PRESET_AMOUNTS = [100, 250, 500, 1000];
const METHODS = [
  { key: "upi", label: "UPI", icon: Smartphone },
  { key: "card", label: "Card", icon: CreditCard },
  { key: "netbanking", label: "Net Banking", icon: Landmark },
];

const formatAmount = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

const WorkerPayments = () => {
  const navigate = useNavigate();
  const { showPopup } = usePopup();

  const [method, setMethod] = useState("upi");
  const [amount, setAmount] = useState("");
  const [upiId, setUpiId] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [bankName, setBankName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [history, setHistory] = useState([]);
  const [summary, setSummary] = useState({
    totalEarnings: 0,
    totalWithdrawn: 0,
    totalSpentOnDues: 0,
    walletCredit: 0,
    outstandingDue: 0,
    withdrawableAmount: 0,
  });
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [addAmount, setAddAmount] = useState("");
  const [addLoading, setAddLoading] = useState(false);

  const fetchData = async () => {
    try {
      const [profileRes, historyRes] = await Promise.all([
        axiosInstance.get("/api/worker/profile"),
        axiosInstance.get("/api/worker/wallet/history"),
      ]);

      const profileWorker = profileRes.data?.worker || {};
      const historySummary = historyRes.data?.summary || {};
      setSummary({
        totalEarnings: Number(historySummary.totalEarnings ?? profileWorker.totalEarnings ?? 0),
        totalWithdrawn: Number(historySummary.totalWithdrawn ?? profileWorker.totalWithdrawn ?? 0),
        totalSpentOnDues: Number(historySummary.totalSpentOnDues ?? profileWorker.totalSpentOnDues ?? 0),
        walletCredit: Number(historySummary.walletCredit ?? profileWorker.walletCredit ?? 0),
        outstandingDue: Number(historySummary.outstandingDue ?? profileWorker.outstandingFines ?? 0),
        withdrawableAmount: Number(historySummary.withdrawableAmount ?? Math.max(0, Number(profileWorker.totalEarnings || 0) + Number(profileWorker.walletCredit || 0) - Number(profileWorker.totalWithdrawn || 0) - Number(profileWorker.totalSpentOnDues || 0))),
      });
      setHistory(Array.isArray(historyRes.data?.transactions) ? historyRes.data.transactions : []);
    } catch {
      setSummary({
        totalEarnings: 0,
        totalWithdrawn: 0,
        totalSpentOnDues: 0,
        walletCredit: 0,
        outstandingDue: 0,
        withdrawableAmount: 0,
      });
      setHistory([]);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const totalPaidDues = useMemo(
    () => history
      .filter((item) => item.type === "due_payment")
      .reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [history],
  );

  const outstandingDue = Number(summary.outstandingDue || 0);
  const withdrawableAmount = Number(summary.withdrawableAmount || 0);

  const resetMethodFields = () => {
    setUpiId("");
    setCardNumber("");
    setCardName("");
    setExpiry("");
    setCvv("");
    setBankName("");
  };

  const handleMethodChange = (nextMethod) => {
    setMethod(nextMethod);
    resetMethodFields();
  };

  const validate = () => {
    const payAmount = Number(amount);

    if (!payAmount || payAmount <= 0) return "Enter a valid amount";
    if (payAmount > outstandingDue) return `Amount cannot exceed due amount (${formatAmount(outstandingDue)})`;

    if (method === "upi") {
      if (!upiId.includes("@")) return "Enter a valid UPI ID";
    }

    if (method === "card") {
      if (cardNumber.replace(/\s/g, "").length < 12) return "Enter a valid card number";
      if (!cardName.trim()) return "Card holder name is required";
      if (!/^\d{2}\/\d{2}$/.test(expiry)) return "Use expiry in MM/YY format";
      if (!/^\d{3,4}$/.test(cvv)) return "Enter a valid CVV";
    }

    if (method === "netbanking") {
      if (!bankName.trim()) return "Select or enter your bank name";
    }

    return "";
  };

  const validateAddFunds = () => {
    const value = Number(addAmount);
    if (!value || value <= 0) return "Enter a valid amount to add";

    if (method === "upi") {
      if (!upiId.includes("@")) return "Enter a valid UPI ID";
    }

    if (method === "card") {
      if (cardNumber.replace(/\s/g, "").length < 12) return "Enter a valid card number";
      if (!cardName.trim()) return "Card holder name is required";
      if (!/^\d{2}\/\d{2}$/.test(expiry)) return "Use expiry in MM/YY format";
      if (!/^\d{3,4}$/.test(cvv)) return "Enter a valid CVV";
    }

    if (method === "netbanking") {
      if (!bankName.trim()) return "Select or enter your bank name";
    }

    return "";
  };

  const handleAddFunds = async (e) => {
    e.preventDefault();

    const error = validateAddFunds();
    if (error) {
      showPopup({
        type: "error",
        title: "Validation Error",
        message: error,
      });
      return;
    }

    setAddLoading(true);
    try {
      const { data } = await axiosInstance.post("/api/worker/wallet/add-funds", {
        amount: Number(addAmount),
        method,
      });

      if (data?.transaction) {
        setHistory((prev) => [data.transaction, ...prev].slice(0, 50));
      }

      setSummary((prev) => ({
        ...prev,
        ...(data?.summary || {}),
      }));
      setAddAmount("");
      resetMethodFields();
      showPopup({
        type: "success",
        title: "Top-up Successful",
        message: "Amount added to wallet successfully.",
      });
    } catch (error) {
      showPopup({
        type: "error",
        title: "Top-up Failed",
        message: error?.response?.data?.message || "Failed to add amount. Please try again.",
      });
    } finally {
      setAddLoading(false);
    }
  };

  const handlePay = async (e) => {
    e.preventDefault();

    const error = validate();
    if (error) {
      showPopup({
        type: "error",
        title: "Validation Error",
        message: error,
      });
      return;
    }

    const payAmount = Number(amount);
    setIsProcessing(true);

    try {
      const { data } = await axiosInstance.post("/api/worker/wallet/pay-due", {
        amount: payAmount,
        method,
      });

      if (data?.transaction) {
        setHistory((prev) => [data.transaction, ...prev].slice(0, 50));
      }

      setSummary((prev) => ({
        ...prev,
        ...(data?.summary || {}),
        outstandingDue: Number(data?.remainingDue ?? data?.summary?.outstandingDue ?? prev.outstandingDue ?? 0),
      }));
      showPopup({
        type: "success",
        title: "Payment Successful",
        message: "Your dues were updated.",
      });
      setAmount("");
      resetMethodFields();
    } catch (error) {
      showPopup({
        type: "error",
        title: "Payment Failed",
        message: error?.response?.data?.message || "Payment failed. Please try again.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();

    const amountNumber = Number(withdrawAmount);
    if (!amountNumber || amountNumber <= 0) {
      showPopup({
        type: "error",
        title: "Validation Error",
        message: "Enter a valid withdraw amount",
      });
      return;
    }

    if (amountNumber > withdrawableAmount) {
      showPopup({
        type: "error",
        title: "Validation Error",
        message: `Amount cannot exceed withdrawable balance (${formatAmount(withdrawableAmount)})`,
      });
      return;
    }

    setWithdrawLoading(true);
    try {
      const { data } = await axiosInstance.post("/api/worker/wallet/withdraw", {
        amount: amountNumber,
        method,
      });

      if (data?.transaction) {
        setHistory((prev) => [data.transaction, ...prev].slice(0, 50));
      }

      setSummary((prev) => ({
        ...prev,
        ...(data?.summary || {}),
      }));
      setWithdrawAmount("");
      showPopup({
        type: "success",
        title: "Withdrawal Successful",
        message: "Withdrawal successful.",
      });
    } catch (error) {
      showPopup({
        type: "error",
        title: "Withdrawal Failed",
        message: error?.response?.data?.message || "Withdraw failed. Please try again.",
      });
    } finally {
      setWithdrawLoading(false);
    }
  };

  const handlePayFromEarnings = async () => {
    const payAmount = Number(amount);
    if (!payAmount || payAmount <= 0) {
      showPopup({
        type: "error",
        title: "Validation Error",
        message: "Enter a valid amount",
      });
      return;
    }

    if (payAmount > outstandingDue) {
      showPopup({
        type: "error",
        title: "Validation Error",
        message: `Amount cannot exceed due amount (${formatAmount(outstandingDue)})`,
      });
      return;
    }

    if (payAmount > withdrawableAmount) {
      showPopup({
        type: "error",
        title: "Insufficient Earnings",
        message: `You can pay up to ${formatAmount(withdrawableAmount)} from earnings.`,
      });
      return;
    }

    setIsProcessing(true);
    try {
      const { data } = await axiosInstance.post("/api/worker/wallet/pay-due", {
        amount: payAmount,
        method: "wallet",
      });

      if (data?.transaction) {
        setHistory((prev) => [data.transaction, ...prev].slice(0, 50));
      }

      setSummary((prev) => ({
        ...prev,
        ...(data?.summary || {}),
        outstandingDue: Number(data?.remainingDue ?? data?.summary?.outstandingDue ?? prev.outstandingDue ?? 0),
      }));
      setAmount("");
      showPopup({
        type: "success",
        title: "Due Cleared From Earnings",
        message: "Dues paid successfully using your earnings balance.",
      });
    } catch (error) {
      showPopup({
        type: "error",
        title: "Payment Failed",
        message: error?.response?.data?.message || "Could not pay due from earnings.",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4 sticky top-0 z-50">
        <button
          onClick={() => navigate("/worker/dashboard")}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <span className="text-lg font-black uppercase tracking-tight">Worker Payments</span>
      </nav>

      <main className="max-w-5xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-1 bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
            Dues Summary
          </p>
          <div className="rounded-2xl bg-linear-to-r from-red-700 to-red-500 p-4 text-white">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-red-100 font-bold">
              <ShieldAlert size={14} />
              Outstanding Due
            </div>
            <p className="text-3xl font-black mt-2">{formatAmount(outstandingDue)}</p>
          </div>

          <div className="mt-4 p-4 rounded-2xl border border-gray-100 bg-gray-50">
            <p className="text-xs font-bold text-gray-500">Total Earnings</p>
            <p className="text-2xl font-black text-green-700 mt-1">{formatAmount(summary.totalEarnings)}</p>
            <p className="text-xs font-bold text-gray-500 mt-3">Withdrawable</p>
            <p className="text-xl font-black text-blue-700 mt-1">{formatAmount(withdrawableAmount)}</p>
            <p className="text-xs font-bold text-gray-500 mt-3">Paid From Earnings</p>
            <p className="text-lg font-black text-purple-700 mt-1">{formatAmount(summary.totalSpentOnDues)}</p>
            <p className="text-xs font-bold text-gray-500 mt-3">Total Dues Paid</p>
            <p className="text-xl font-black text-gray-900 mt-1">{formatAmount(totalPaidDues)}</p>
          </div>

          <div className="mt-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
              Quick Amount
            </p>
            <div className="grid grid-cols-2 gap-2">
              {PRESET_AMOUNTS.map((value) => (
                <button
                  type="button"
                  key={value}
                  onClick={() => {
                    setAddAmount(String(value));
                    setAmount(String(Math.min(value, outstandingDue || value)));
                  }}
                  className="px-3 py-2 rounded-xl border border-gray-200 text-sm font-bold hover:bg-gray-100 transition-colors"
                >
                  {formatAmount(value)}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">
            Add Funds To Wallet
          </p>

          <form onSubmit={handleAddFunds} className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {METHODS.map(({ key, label, icon: Icon }) => (
                <button
                  key={`add-${key}`}
                  type="button"
                  onClick={() => handleMethodChange(key)}
                  className={`px-4 py-2 rounded-full text-sm font-bold border transition-colors flex items-center gap-2 ${
                    method === key
                      ? "bg-black text-white border-black"
                      : "bg-white text-gray-700 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  <Icon size={15} />
                  {label}
                </button>
              ))}
            </div>

            <label className="block">
              <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Amount</span>
              <div className="mt-1 flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2">
                <IndianRupee size={16} className="text-gray-400" />
                <input
                  type="number"
                  min="1"
                  value={addAmount}
                  onChange={(e) => setAddAmount(e.target.value)}
                  placeholder="Enter amount to add"
                  className="w-full bg-transparent outline-none text-sm font-bold"
                />
              </div>
            </label>

            {method === "upi" && (
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-widest text-gray-400">UPI ID</span>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="example@upi"
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 outline-none focus:border-gray-400"
                />
              </label>
            )}

            {method === "card" && (
              <>
                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Card Number</span>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="1234 5678 9012 3456"
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 outline-none focus:border-gray-400"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Card Holder Name</span>
                  <input
                    type="text"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder="Name on card"
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 outline-none focus:border-gray-400"
                  />
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Expiry (MM/YY)</span>
                    <input
                      type="text"
                      value={expiry}
                      onChange={(e) => setExpiry(e.target.value)}
                      placeholder="07/29"
                      className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 outline-none focus:border-gray-400"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-bold uppercase tracking-widest text-gray-400">CVV</span>
                    <input
                      type="password"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value)}
                      placeholder="123"
                      className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 outline-none focus:border-gray-400"
                    />
                  </label>
                </div>
              </>
            )}

            {method === "netbanking" && (
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Bank Name</span>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="Enter bank name"
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 outline-none focus:border-gray-400"
                />
              </label>
            )}

            <button
              type="submit"
              disabled={addLoading}
              className="mt-2 w-full rounded-xl bg-black text-white py-3 text-sm font-black uppercase tracking-widest hover:bg-zinc-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {addLoading ? (
                <>Adding Amount...</>
              ) : (
                <>
                  <Plus size={16} />
                  Add Amount To Wallet
                </>
              )}
            </button>
          </form>

          <div className="my-6 border-t border-gray-100" />

          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">
            Clear Dues
          </p>

          <div className="flex flex-wrap gap-2 mb-4">
            {METHODS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                onClick={() => handleMethodChange(key)}
                className={`px-4 py-2 rounded-full text-sm font-bold border transition-colors flex items-center gap-2 ${
                  method === key
                    ? "bg-black text-white border-black"
                    : "bg-white text-gray-700 border-gray-200 hover:bg-gray-100"
                }`}
              >
                <Icon size={15} />
                {label}
              </button>
            ))}
          </div>

          <form onSubmit={handlePay} className="space-y-3">
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Amount</span>
              <div className="mt-1 flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2">
                <IndianRupee size={16} className="text-gray-400" />
                <input
                  type="number"
                  min="1"
                  max={outstandingDue || undefined}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  className="w-full bg-transparent outline-none text-sm font-bold"
                />
              </div>
            </label>

            {method === "upi" && (
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-widest text-gray-400">UPI ID</span>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="example@upi"
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 outline-none focus:border-gray-400"
                />
              </label>
            )}

            {method === "card" && (
              <>
                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Card Number</span>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="1234 5678 9012 3456"
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 outline-none focus:border-gray-400"
                  />
                </label>

                <label className="block">
                  <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Card Holder Name</span>
                  <input
                    type="text"
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder="Name on card"
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 outline-none focus:border-gray-400"
                  />
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label className="block">
                    <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Expiry (MM/YY)</span>
                    <input
                      type="text"
                      value={expiry}
                      onChange={(e) => setExpiry(e.target.value)}
                      placeholder="07/29"
                      className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 outline-none focus:border-gray-400"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs font-bold uppercase tracking-widest text-gray-400">CVV</span>
                    <input
                      type="password"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value)}
                      placeholder="123"
                      className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 outline-none focus:border-gray-400"
                    />
                  </label>
                </div>
              </>
            )}

            {method === "netbanking" && (
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Bank Name</span>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="Enter bank name"
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 outline-none focus:border-gray-400"
                />
              </label>
            )}

            <button
              type="submit"
              disabled={isProcessing || outstandingDue <= 0}
              className="mt-2 w-full rounded-xl bg-black text-white py-3 text-sm font-black uppercase tracking-widest hover:bg-zinc-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>Processing Payment...</>
              ) : (
                <>
                  <Plus size={16} />
                  Pay Dues
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handlePayFromEarnings}
              disabled={isProcessing || outstandingDue <= 0 || withdrawableAmount <= 0}
              className="w-full rounded-xl border border-gray-300 bg-white text-gray-900 py-3 text-sm font-black uppercase tracking-widest hover:bg-gray-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Wallet size={16} />
              Pay Due From Earnings
            </button>
            <p className="text-xs text-gray-500">
              Available from earnings: <span className="font-black text-gray-800">{formatAmount(withdrawableAmount)}</span>
            </p>
          </form>

          <div className="my-6 border-t border-gray-100" />

          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">
            Withdraw Funds
          </p>
          <form onSubmit={handleWithdraw} className="space-y-3">
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Amount</span>
              <div className="mt-1 flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2">
                <IndianRupee size={16} className="text-gray-400" />
                <input
                  type="number"
                  min="1"
                  max={withdrawableAmount || undefined}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="Enter withdraw amount"
                  className="w-full bg-transparent outline-none text-sm font-bold"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Available to withdraw: <span className="font-black text-gray-800">{formatAmount(withdrawableAmount)}</span>
              </p>
            </label>

            <button
              type="submit"
              disabled={withdrawLoading || withdrawableAmount <= 0}
              className="mt-2 w-full rounded-xl bg-black text-white py-3 text-sm font-black uppercase tracking-widest hover:bg-zinc-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {withdrawLoading ? (
                <>Processing Withdrawal...</>
              ) : (
                <>
                  <ArrowDownCircle size={16} />
                  Withdraw Funds
                </>
              )}
            </button>
          </form>
        </section>

        <section className="lg:col-span-3 bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
              Payment History
            </p>
            <div className="flex items-center gap-2 text-xs text-gray-500 font-bold">
              <History size={14} />
              Last {history.length} transactions
            </div>
          </div>

          {history.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-gray-300 p-8 text-center text-gray-400 text-sm font-semibold">
              No dues payments yet.
            </div>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-400 uppercase text-[10px] tracking-widest border-b border-gray-100">
                    <th className="py-2">Transaction ID</th>
                    <th className="py-2">Type</th>
                    <th className="py-2">Method</th>
                    <th className="py-2">Amount</th>
                    <th className="py-2">Status</th>
                    <th className="py-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((txn) => (
                    <tr key={txn.id} className="border-b border-gray-50">
                      <td className="py-3 font-semibold text-gray-700">{txn.id}</td>
                      <td className="py-3 capitalize font-semibold text-gray-700">{String(txn.type || "-").replace("_", " ")}</td>
                      <td className="py-3 capitalize font-semibold text-gray-700">{txn.method}</td>
                      <td className="py-3 font-black text-gray-900">{formatAmount(txn.amount)}</td>
                      <td className="py-3">
                        <span className="inline-flex items-center gap-1 text-green-700 bg-green-50 px-2 py-1 rounded-full text-xs font-bold">
                          <CheckCircle2 size={13} />
                          {txn.status}
                        </span>
                      </td>
                      <td className="py-3 text-gray-500 font-medium">
                        {new Date(txn.date).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default WorkerPayments;
