import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Wallet,
  IndianRupee,
  CreditCard,
  Landmark,
  Smartphone,
  CheckCircle2,
  History,
  Plus,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import axiosInstance from "../../api/axios.jsx";

const PRESET_AMOUNTS = [199, 499, 999, 1999];
const METHODS = [
  { key: "upi", label: "UPI", icon: Smartphone },
  { key: "card", label: "Card", icon: CreditCard },
  { key: "netbanking", label: "Net Banking", icon: Landmark },
];

const formatAmount = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;

const UserPayments = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();

  const [method, setMethod] = useState("upi");
  const [amount, setAmount] = useState("");
  const [upiId, setUpiId] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [bankName, setBankName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const fetchWalletHistory = async () => {
      try {
        const { data } = await axiosInstance.get("/api/user/wallet/history");
        setHistory(Array.isArray(data?.transactions) ? data.transactions : []);
      } catch {
        setHistory([]);
      }
    };

    fetchWalletHistory();
  }, []);

  const totalTopups = useMemo(
    () => history.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [history]
  );

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
    setMessage("");
    resetMethodFields();
  };

  const validate = () => {
    const topup = Number(amount);
    if (!topup || topup <= 0) return "Enter a valid amount";

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

  const handlePay = async (e) => {
    e.preventDefault();
    setMessage("");

    const error = validate();
    if (error) {
      setMessage(error);
      return;
    }

    const topup = Number(amount);
    setIsProcessing(true);

    try {
      const { data } = await axiosInstance.post("/api/user/wallet/topup", {
        amount: topup,
        method,
      });

      if (data?.transaction) {
        setHistory((prev) => [data.transaction, ...prev].slice(0, 50));
      }
      updateUser((prev) => ({
        ...(prev || {}),
        walletBalance: Number(data?.walletBalance || 0),
      }));
      setMessage("Payment successful. Wallet top-up recorded.");
      setAmount("");
      resetMethodFields();
    } catch (error) {
      setMessage(error?.response?.data?.message || "Payment failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4 sticky top-0 z-50">
        <button
          onClick={() => navigate("/user")}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <span className="text-lg font-black uppercase tracking-tight">Payments</span>
      </nav>

      <main className="max-w-5xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-1 bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">
            Wallet Summary
          </p>
          <div className="rounded-2xl bg-linear-to-r from-zinc-900 to-zinc-700 p-4 text-white">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-zinc-300 font-bold">
              <Wallet size={14} />
              Current Wallet
            </div>
            <p className="text-3xl font-black mt-2">{formatAmount(user?.walletBalance ?? 0)}</p>
          </div>

          <div className="mt-4 p-4 rounded-2xl border border-gray-100 bg-gray-50">
            <p className="text-xs font-bold text-gray-500">Total Top-ups</p>
            <p className="text-2xl font-black text-gray-900 mt-1">{formatAmount(totalTopups)}</p>
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
                  onClick={() => setAmount(String(value))}
                  className="px-3 py-2 rounded-xl border border-gray-200 text-sm font-bold hover:bg-gray-100 transition-colors"
                >
                  + {formatAmount(value)}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">
            Add Money
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

            {message && (
              <div
                className={`rounded-xl p-3 text-sm font-semibold ${
                  message.toLowerCase().includes("successful")
                    ? "bg-green-50 text-green-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={isProcessing}
              className="mt-2 w-full rounded-xl bg-black text-white py-3 text-sm font-black uppercase tracking-widest hover:bg-zinc-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>Processing Payment...</>
              ) : (
                <>
                  <Plus size={16} />
                  Add To Wallet
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
              No payments yet. Your successful payments will appear here.
            </div>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-400 uppercase text-[10px] tracking-widest border-b border-gray-100">
                    <th className="py-2">Transaction ID</th>
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

export default UserPayments;
