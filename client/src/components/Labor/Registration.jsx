import React, { useState, useEffect } from "react";
import {
  Upload,
  CheckCircle,
  Briefcase,
  Award,
  ShieldCheck,
} from "lucide-react";
import useWorkerRegistration from "../../hooks/user/useWorkerRegistration";
import { useNavigate, Link } from "react-router-dom";
import axiosInstance from "../../api/axios";
import useCategories from "../../hooks/useCategories";
import { usePopup } from "../../context/PopupContext";

const Registration = () => {
  const [step, setStep] = useState(1); // 1: Info, 2: Upload, 3: Pending
  const [formData, setFormData] = useState({
    primarySkill: "",
    contactNumber: "",
    experience: "",
    adharCardNumber: "",
    address: "",
  });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const navigate = useNavigate();
  const { registerWorker, loading, error } = useWorkerRegistration();
  const { categories: skillCategories, loading: categoriesLoading } = useCategories();
  const { showPopup } = usePopup();

  // null = loading, "none" = no record, "pending" | "rejected" | "verified"
  const [workerStatus, setWorkerStatus] = useState(null);
  const [banExpiresAt, setBanExpiresAt] = useState(null);
  const [statusLoading, setStatusLoading] = useState(true);

  // Check existing worker status on mount
  useEffect(() => {
    axiosInstance
      .get("/api/worker/profile")
      .then((res) => {
        const status = res.data?.worker?.status;
        setWorkerStatus(status || "none");
        if (res.data?.userBanExpiresAt) setBanExpiresAt(res.data.userBanExpiresAt);
        if (status === "verified") navigate("/worker/dashboard");
      })
      .catch((err) => {
        if (err.response?.status === 404) {
          setWorkerStatus("none");
        } else {
          setWorkerStatus("none");
        }
      })
      .finally(() => setStatusLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const banDate = banExpiresAt ? new Date(banExpiresAt) : null;
  const banDaysLeft = banDate
    ? Math.max(0, Math.ceil((banDate - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      showPopup({ type: "warning", title: "ID Required", message: "Please upload your ID card." });
      return;
    }
    const payload = { ...formData, file };
    try {
      await registerWorker(payload);
      setStep(3);
    } catch (err) {
      console.error(err);
      showPopup({ type: "error", title: "Registration Failed", message: err.message || "Registration failed" });
    }
  };

  // ── Status-based early returns ────────────────────────────────────────────

  if (statusLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-bold uppercase tracking-widest text-gray-400">
            Checking status…
          </p>
        </div>
      </div>
    );
  }

  // Worker already has a pending application
  if (workerStatus === "pending") {
    return (
      <div className="min-h-screen bg-white text-black flex flex-col items-center justify-center p-6">
        <div className="max-w-xl w-full text-center space-y-6 animate-in zoom-in duration-500">
          <div className="flex justify-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center">
              <ShieldCheck size={48} className="text-black" />
            </div>
          </div>
          <div className="inline-flex items-center gap-2 bg-amber-100 text-amber-700 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full">
            <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse inline-block" />
            Application Under Verification
          </div>
          <h2 className="text-3xl font-black uppercase tracking-tighter">
            Under Review
          </h2>
          <p className="text-gray-500 font-medium leading-relaxed px-8">
            Your documents have been submitted and are currently being reviewed
            by our team. This typically takes up to 24 hours. You will receive
            an email once a decision is made.
          </p>
          <Link to="/">
            <button className="px-8 py-3 border-2 border-black font-black uppercase tracking-widest text-xs rounded-full hover:bg-black hover:text-white transition-all">
              Return to Home
            </button>
          </Link>
        </div>
      </div>
    );
  }

  // Worker was rejected and the 3-day ban is still active
  if (workerStatus === "rejected" && banDate && banDate > new Date()) {
    return (
      <div className="min-h-screen bg-white text-black flex flex-col items-center justify-center p-6">
        <div className="max-w-xl w-full text-center space-y-6 animate-in zoom-in duration-500">
          <div className="flex justify-center">
            <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center">
              <Award size={48} className="text-red-500" />
            </div>
          </div>
          <div className="inline-flex items-center gap-2 bg-red-100 text-red-700 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full">
            Application Rejected
          </div>
          <h2 className="text-3xl font-black uppercase tracking-tighter">
            Not Approved
          </h2>
          <p className="text-gray-500 font-medium leading-relaxed px-8">
            Your application was reviewed and could not be approved at this
            time. You can re-apply in{" "}
            <strong className="text-black">
              {banDaysLeft} {banDaysLeft === 1 ? "day" : "days"}
            </strong>{" "}
            with updated documents.
          </p>
          <p className="text-xs text-gray-400 font-medium">
            Re-apply available after:{" "}
            {banDate.toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
          <Link to="/">
            <button className="px-8 py-3 border-2 border-black font-black uppercase tracking-widest text-xs rounded-full hover:bg-black hover:text-white transition-all">
              Return to Home
            </button>
          </Link>
        </div>
      </div>
    );
  }

  // ── Registration form (no worker record, or ban has expired) ──────────────

  return (
    <div className="min-h-screen bg-white text-black flex flex-col items-center justify-center p-6">
      <div className="max-w-xl w-full">
        {/* Progress Header */}
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-2">
            <div className="bg-black text-white p-1 rounded">
              <Briefcase size={20} />
            </div>
            <span className="font-black uppercase tracking-tighter text-xl">
              Workify Partner
            </span>
          </div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
            Step {step} of 3
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <h2 className="text-3xl font-black uppercase tracking-tighter">
              Professional Details
            </h2>
            <p className="text-gray-500 font-medium">
              Tell us about your expertise to get matched with tasks.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest mb-2">
                  Primary Skill
                </label>
                <select
                  name="primarySkill"
                  value={formData.primarySkill}
                  onChange={handleChange}
                  className="w-full p-4 border-2 border-black rounded-xl font-bold appearance-none bg-white focus:ring-4 focus:ring-gray-100 transition-all"
                  required
                >
                  <option value="">Select a skill</option>
                  {categoriesLoading ? (
                    <option disabled>Loading...</option>
                  ) : (
                    skillCategories.map((cat) => (
                      <option key={cat._id} value={cat.name}>
                        {cat.name}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest mb-2">
                  Contact Number
                </label>
                <input
                  type="number"
                  name="contactNumber"
                  value={formData.contactNumber}
                  onChange={handleChange}
                  placeholder="e.g. 1234567890"
                  className="w-full p-4 border-2 border-black rounded-xl font-bold"
                  maxLength={10}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest mb-2">
                  Years of Experience
                </label>
                <input
                  type="number"
                  name="experience"
                  value={formData.experience}
                  onChange={handleChange}
                  placeholder="e.g. 5"
                  className="w-full p-4 border-2 border-black rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest mb-2">
                  Adhar Card Number (Mandatory)
                </label>
                <input
                  type="number"
                  name="adharCardNumber"
                  value={formData.adharCardNumber}
                  onChange={handleChange}
                  placeholder="e.g. 1234 5678 9012"
                  className="w-full p-4 border-2 border-black rounded-xl font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest mb-2">
                  Residential Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Enter your full address"
                  className="w-full p-4 border-2 border-black rounded-xl font-bold"
                  required
                />
              </div>

              <button
                onClick={() => {
                  if (
                    !formData.adharCardNumber ||
                    !formData.address ||
                    !formData.contactNumber
                  ) {
                    showPopup({
                      type: "warning",
                      title: "Missing Details",
                      message: "Please fill all mandatory fields",
                    });
                    return;
                  }
                  setStep(2);
                }}
                className="w-full py-4 bg-black text-white font-black uppercase tracking-widest rounded-xl hover:bg-zinc-800 transition-all"
              >
                Continue to Verification
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in slide-in-from-right duration-500">
            <h2 className="text-3xl font-black uppercase tracking-tighter">
              Verify Identity
            </h2>
            <p className="text-gray-500 font-medium">
              Upload your Aadhaar or ID card to build trust with clients.
            </p>

            <label className="border-4 border-dashed border-gray-100 rounded-3xl p-12 flex flex-col items-center justify-center hover:border-black transition-colors cursor-pointer group relative overflow-hidden">
              <input
                type="file"
                onChange={handleFileChange}
                className="hidden"
                accept="image/*"
              />
              {file ? (
                <div className="text-center w-full h-full">
                  <img
                    src={preview}
                    alt="ID Preview"
                    className="w-full h-48 object-contain mb-4 rounded-lg"
                  />
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle size={20} className="text-green-500" />
                    <span className="font-bold uppercase tracking-widest text-xs text-green-600 block">
                      {file.name}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400 mt-2 block">
                    Click to change
                  </span>
                </div>
              ) : (
                <>
                  <Upload
                    size={48}
                    className="mb-4 group-hover:scale-110 transition-transform"
                  />
                  <span className="font-bold uppercase tracking-widest text-xs">
                    Drop ID Photo Here
                  </span>
                </>
              )}
            </label>

            {error && (
              <p className="text-red-500 text-sm font-bold text-center">
                {error}
              </p>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-4 bg-black text-white font-black uppercase tracking-widest rounded-xl hover:bg-zinc-800 transition-all disabled:opacity-50"
            >
              {loading ? "Submitting..." : "Submit Application"}
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="text-center space-y-6 animate-in zoom-in duration-500">
            <div className="flex justify-center">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center text-black">
                <ShieldCheck size={48} />
              </div>
            </div>
            <h2 className="text-3xl font-black uppercase tracking-tighter">
              Under Review
            </h2>
            <p className="text-gray-500 font-medium leading-relaxed px-8">
              Thanks for applying! Our team will verify your documents within 24
              hours. You'll receive an email once your dashboard is ready.
            </p>
            <Link to="/">
              <button className="px-8 py-3 border-2 border-black font-black uppercase tracking-widest text-xs rounded-full hover:bg-black hover:text-white transition-all">
                Return to Home
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Registration;
