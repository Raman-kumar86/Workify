import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import useWorkerProfile from "../../hooks/worker/useWorkerProfile";
import { usePopup } from "../../context/PopupContext.jsx";
import axiosInstance from "../../api/axios.jsx";
import {
  ArrowLeft,
  Save,
  CheckCircle,
  Mail,
  Phone,
  Wallet,
  Shield,
  ExternalLink,
  User,
  Upload,
  Trash2,
  Lock,
} from "lucide-react";

const WorkerProfile = () => {
  const { user: authUser } = useAuth();
  const { data: profile, loading, updateProfile } = useWorkerProfile();
  const { showPopup } = usePopup();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("contact");
  const [saving, setSaving] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [profilePreview, setProfilePreview] = useState("");
  const [profileFile, setProfileFile] = useState(null);
  const [removeProfileImage, setRemoveProfileImage] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    contactNumber: "",
    address: "",
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const profileUser = profile?.user || authUser;
  const worker = profile?.worker;

  useEffect(() => {
    setForm({
      name: profileUser?.name || "",
      email: profileUser?.email || "",
      contactNumber: profileUser?.contactNumber || "",
      address: profileUser?.address || "",
    });
    setProfilePreview(profileUser?.profileImage || "");
    setProfileFile(null);
    setRemoveProfileImage(false);
  }, [
    profileUser?.name,
    profileUser?.email,
    profileUser?.contactNumber,
    profileUser?.address,
    profileUser?.profileImage,
  ]);

  const memberSince = profileUser?.createdAt
    ? new Date(profileUser.createdAt).toLocaleDateString("en-IN", {
      month: "long",
      year: "numeric",
    })
    : "N/A";

  const maskedAadhaar = useMemo(() => {
    if (!worker?.adharCardNumber) return "Not available";
    return `XXXX-XXXX-${worker.adharCardNumber.slice(-4)}`;
  }, [worker?.adharCardNumber]);

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onPasswordChange = (event) => {
    const { name, value } = event.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const onProfileFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setProfileFile(file);
    setRemoveProfileImage(false);
    setProfilePreview(URL.createObjectURL(file));
  };

  const onRemoveProfileImage = () => {
    setProfileFile(null);
    setRemoveProfileImage(true);
    setProfilePreview("");
  };

  const uploadToCloudinary = async (file) => {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      throw new Error("Cloudinary config is missing");
    }

    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", uploadPreset);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
      method: "POST",
      body: data,
    });

    if (!response.ok) {
      throw new Error("Failed to upload profile image");
    }

    const body = await response.json();
    return body.secure_url;
  };

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      let profileImagePayload;
      if (removeProfileImage) {
        profileImagePayload = "";
      } else if (profileFile) {
        profileImagePayload = await uploadToCloudinary(profileFile);
      }

      await updateProfile({
        name: form.name,
        contactNumber: form.contactNumber,
        address: form.address,
        ...(profileImagePayload !== undefined ? { profileImage: profileImagePayload } : {}),
      });
      setProfileFile(null);
      setRemoveProfileImage(false);
      showPopup({ type: "success", title: "Profile Updated", message: "Profile updated successfully." });
    } catch (error) {
      showPopup({ type: "error", title: "Update Failed", message: error.response?.data?.message || "Could not update profile" });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      showPopup({ type: "error", title: "Missing Fields", message: "Fill all password fields." });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showPopup({ type: "error", title: "Mismatch", message: "New password and confirm password must match." });
      return;
    }

    setSavingPassword(true);
    try {
      await axiosInstance.post("/api/auth/change-password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      showPopup({ type: "success", title: "Password Updated", message: "Your password was changed successfully." });
    } catch (error) {
      showPopup({ type: "error", title: "Update Failed", message: error.response?.data?.message || "Could not change password" });
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Top Bar ── */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4 sticky top-0 z-50">
        <button
          onClick={() => navigate("/worker/dashboard")}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <span className="text-lg font-black uppercase tracking-tight">
          My Profile
        </span>
      </nav>

      <main className="max-w-5xl mx-auto p-6">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="grid md:grid-cols-[300px_1fr]">
            <aside className="border-r border-gray-200 p-5 space-y-5 bg-gray-50/60">
              <p className="text-xs font-bold tracking-wide text-gray-500 uppercase">
                Account Management
              </p>

              <div className="rounded-2xl border border-gray-200 bg-white p-4">
                <div className="aspect-4/3 w-full rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden">
                  {profilePreview ? (
                    <img
                      src={profilePreview}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center text-gray-500 px-3">
                      <User size={26} className="mx-auto mb-2" />
                      <p className="text-xs font-medium">No profile image uploaded</p>
                    </div>
                  )}
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <label className="inline-flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2 text-xs font-semibold hover:bg-gray-50 cursor-pointer">
                    <Upload size={13} /> Change Image
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={onProfileFileChange}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={onRemoveProfileImage}
                    className="inline-flex items-center gap-1 border border-red-200 text-red-600 rounded-lg px-3 py-2 text-xs font-semibold hover:bg-red-50"
                  >
                    <Trash2 size={13} /> Remove
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-4 space-y-2">
                <p className="text-xs font-bold uppercase text-gray-500">Verification</p>
                <p className="text-sm font-semibold text-gray-800">Aadhaar: {maskedAadhaar}</p>
                <p className="text-sm text-gray-700">Member since: {memberSince}</p>
                <p className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full bg-green-50 text-green-700">
                  <CheckCircle size={12} /> {worker?.status || "pending"}
                </p>
              </div>
            </aside>

            <section className="p-5 md:p-6">
              <div className="flex items-center gap-2 border-b border-gray-200 pb-4 mb-6">
                <button
                  type="button"
                  onClick={() => setActiveTab("contact")}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    activeTab === "contact"
                      ? "bg-black text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Contact Details
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("documents")}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    activeTab === "documents"
                      ? "bg-black text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Documents
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("wallet")}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    activeTab === "wallet"
                      ? "bg-black text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Wallet
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("security")}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    activeTab === "security"
                      ? "bg-black text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Security
                </button>
              </div>

              {activeTab === "contact" ? (
                <form onSubmit={handleSave} className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Contact Details</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Update your profile and contact information. Email is locked.
                    </p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Name</label>
                      <input
                        name="name"
                        value={form.name}
                        onChange={onChange}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
                        placeholder="Your full name"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email (read-only)</label>
                      <div className="relative">
                        <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          name="email"
                          value={form.email}
                          readOnly
                          disabled
                          className="w-full border border-gray-200 bg-gray-100 rounded-lg pl-9 pr-3 py-2.5 text-sm text-gray-500 cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Phone</label>
                      <div className="relative">
                        <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          name="contactNumber"
                          value={form.contactNumber}
                          onChange={onChange}
                          maxLength={10}
                          className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
                          placeholder="10-digit phone"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Status</label>
                      <div className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2.5 text-sm text-gray-700 capitalize">
                        {worker?.status || "pending"}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Address</label>
                    <textarea
                      name="address"
                      value={form.address}
                      onChange={onChange}
                      rows={4}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
                      placeholder="Your address"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-zinc-800 disabled:opacity-60"
                  >
                    <Save size={14} /> {saving ? "Saving..." : "Save Changes"}
                  </button>
                </form>
              ) : activeTab === "documents" ? (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Uploaded Documents</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      You can view the document used for worker verification.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                    <p className="text-sm text-gray-700 mb-3 flex items-center gap-2">
                      <Shield size={15} /> Aadhaar: <span className="font-semibold">{maskedAadhaar}</span>
                    </p>

                    {worker?.idCardImage ? (
                      <>
                        <img
                          src={worker.idCardImage}
                          alt="Worker ID"
                          className="w-full max-w-xl rounded-xl border border-gray-200"
                        />
                        <a
                          href={worker.idCardImage}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 mt-3 text-sm font-semibold text-blue-700 hover:text-blue-800"
                        >
                          Open document in new tab <ExternalLink size={14} />
                        </a>
                      </>
                    ) : (
                      <div className="text-sm text-gray-500">No document uploaded yet.</div>
                    )}
                  </div>
                </div>
              ) : activeTab === "wallet" ? (
                <div className="space-y-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Wallet</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Manage pending dues and add/pay amount from your payments section.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                    <p className="text-xs uppercase tracking-wide font-semibold text-gray-500 mb-2">Pending Amount</p>
                    <p className="text-3xl font-black text-amber-700">₹{Number(worker?.outstandingFines || 0).toLocaleString("en-IN")}</p>

                    <p className="text-xs uppercase tracking-wide font-semibold text-gray-500 mb-2 mt-4">Total Earnings</p>
                    <p className="text-2xl font-black text-green-700">₹{Number(worker?.totalEarnings || 0).toLocaleString("en-IN")}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => navigate("/worker/payments")}
                      className="inline-flex items-center gap-2 bg-black text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-zinc-800"
                    >
                      <Wallet size={15} /> Add Amount To Wallet
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate("/worker/payments")}
                      className="inline-flex items-center gap-2 border border-gray-300 rounded-lg px-4 py-2 text-sm font-semibold hover:bg-gray-50"
                    >
                      <Wallet size={15} /> Open Payments
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleChangePassword} className="space-y-6 max-w-xl">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Change Password</h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Use a strong password with uppercase, lowercase, number and symbol.
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Current Password</label>
                    <div className="relative">
                      <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="password"
                        name="currentPassword"
                        value={passwordForm.currentPassword}
                        onChange={onPasswordChange}
                        className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
                        placeholder="Enter current password"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">New Password</label>
                    <div className="relative">
                      <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="password"
                        name="newPassword"
                        value={passwordForm.newPassword}
                        onChange={onPasswordChange}
                        className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
                        placeholder="Enter new password"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Confirm New Password</label>
                    <div className="relative">
                      <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="password"
                        name="confirmPassword"
                        value={passwordForm.confirmPassword}
                        onChange={onPasswordChange}
                        className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black/20"
                        placeholder="Confirm new password"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={savingPassword}
                    className="inline-flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-zinc-800 disabled:opacity-60"
                  >
                    <Save size={14} /> {savingPassword ? "Updating..." : "Update Password"}
                  </button>
                </form>
              )}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default WorkerProfile;
