import { useState, useMemo, useEffect } from "react";
import { useSelector } from "react-redux";
import { ChevronDown, X, Camera } from "lucide-react";
import {
  TIME_SLOTS,
  TASK_FORM_DEFAULTS,
  MAX_DESCRIPTION_LENGTH,
  PHONE_REGEX,
} from "../../constants/task.constants";
import Map from "../../map/User/Map";
import useCreateWork from "../../hooks/user/useCreateWork.jsx";
import useCategories from "../../hooks/useCategories";

export default function CreateTask({ onClose }) {
  const [formData, setFormData] = useState(TASK_FORM_DEFAULTS);
  const [previewImage, setPreviewImage] = useState(null);
  const storedLocation = useSelector((state) => state.user.location);
  const { categories, loading: categoriesLoading } = useCategories();

  // Initialize with stored location if available and not already set
  useEffect(() => {
    if (storedLocation && !formData.location.lat) {
      setFormData((prev) => ({
        ...prev,
        location: storedLocation,
      }));
      // Trigger reverse geocoding to fill address
      handleLocationSelect(storedLocation.lat, storedLocation.lng);
    }
  }, [storedLocation]);

  const selectedCategory = useMemo(
    () => categories.find((c) => c._id === formData.category),
    [formData.category, categories],
  );

  const selectedSubCategory = useMemo(
    () =>
      selectedCategory?.subCategories.find(
        (s) => s.name === formData.subcategory,
      ),
    [formData.subcategory, selectedCategory],
  );

  const minPrice =
    selectedSubCategory?.minPrice || selectedCategory?.minPrice || null;

  useEffect(() => {
    if (minPrice) {
      setFormData((prev) => ({ ...prev, cost: minPrice }));
    }
  }, [minPrice]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "category" && { subcategory: "", cost: "" }),
    }));
  };

  const toggleSlot = (slot) => {
    setFormData((prev) => ({
      ...prev,
      availabilityTimeSlots: prev.availabilityTimeSlots.includes(slot)
        ? prev.availabilityTimeSlots.filter((s) => s !== slot)
        : [...prev.availabilityTimeSlots, slot],
    }));
  };

  /* IMAGE HANDLING */

  const handleImageAdd = (e) => {
    const files = Array.from(e.target.files);
    if (formData.images.length + files.length > 3) return;

    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, ...files],
    }));
  };

  const handleLocationSelect = async (lat, lng) => {
    // 1. Update form location state
    setFormData((prev) => ({
      ...prev,
      location: { lat, lng },
    }));

    // 2. Reverse Geocode using Nominatim (OSM)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      );
      const data = await response.json();

      if (data && data.display_name) {
        setFormData((prev) => ({
          ...prev,
          address: data.display_name,
        }));
      }
    } catch (error) {
      console.error("Failed to fetch address:", error);
      // Optional: don't overwrite address if fetch fails, or show toast
    }
  };

  const handleAddressBlur = async () => {
    if (!formData.address) return;

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          formData.address,
        )}`,
      );
      const data = await response.json();

      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        setFormData((prev) => ({
          ...prev,
          location: { lat: parseFloat(lat), lng: parseFloat(lon) },
        }));
      }
    } catch (error) {
      console.error("Failed to fetch coordinates:", error);
    }
  };

  const removeImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
    setPreviewImage(null);
  };

  const { createWork, loading, error, success } = useCreateWork();
  /* Token is now stored directly at state.user.token (Redux refactor) */
  const token = useSelector((state) => state.user.token);

  useEffect(() => {
    if (success) {
      if (onClose) onClose();
      // Optional: reset form or show success message globally if needed
      // alert("Work created successfully!");
    }
  }, [success, onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      alert("You must be logged in to create a task.");
      return;
    }

    try {
      /* token is injected automatically by axiosInstance interceptor from Redux */
      await createWork(formData);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      {/* Glass Morphism Background Overlay */}
      <div className="fixed inset-0 z-40 flex items-center justify-center">
        {/* Animated Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-purple-50/20 to-pink-50/30"></div>

        {/* Glass Effect Layers */}
        <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px]"></div>

        {/* Animated Gradient Orbs */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-300/20 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-pink-300/20 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-blue-300/20 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-500"></div>
      </div>

      {/* Main Modal Container */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <style>{`
          .no-scrollbar::-webkit-scrollbar {
            display: none;
          }
          .no-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          
          /* Glass morphism effects */
          .glass-effect {
            background: rgba(255, 255, 255, 0.7);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.3);
            box-shadow: 
              0 8px 32px 0 rgba(31, 38, 135, 0.07),
              0 4px 16px 0 rgba(0, 0, 0, 0.05),
              inset 0 0 0 1px rgba(255, 255, 255, 0.6);
          }
          
          .glass-border {
            position: relative;
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.4), rgba(255, 255, 255, 0.1));
            padding: 1px;
            border-radius: 24px;
            overflow: hidden;
          }
          
          .glass-border::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            border-radius: 24px;
            padding: 1px;
            background: linear-gradient(135deg, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.2));
            -webkit-mask: 
              linear-gradient(#fff 0 0) content-box, 
              linear-gradient(#fff 0 0);
            -webkit-mask-composite: xor;
            mask-composite: exclude;
          }
        `}</style>

        {/* MAIN CONTAINER */}
        <div className="glass-border w-full max-w-6xl h-[90vh] grid grid-cols-2 rounded-2xl overflow-hidden relative">
          {/* Close Button */}
          {onClose && (
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-[60] glass-effect hover:bg-white/80 p-2 rounded-full transition-all duration-300 shadow-lg cursor-pointer group"
            >
              <X
                size={20}
                className="text-gray-700 group-hover:scale-110 transition-transform"
              />
            </button>
          )}

          {/* MAP SECTION */}
          <div className="relative flex flex-col items-center justify-center bg-gradient-to-br from-blue-50/50 to-purple-50/50">
            <div className="glass-effect w-full h-full rounded-r-none">
              <Map
                onLocationSelect={handleLocationSelect}
                selectedLocation={formData.location}
              />
            </div>
          </div>

          {/* FORM SECTION */}
          <div className="glass-effect p-6 overflow-y-auto relative no-scrollbar">
            <form onSubmit={handleSubmit} className="h-full space-y-4">
              <h1 className="text-2xl font-semibold text-gray-900 mt-2 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                New Work
              </h1>

              {/* CATEGORY & SUBCATEGORY ROW */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <div className="relative">
                    <select
                      name="category"
                      onChange={handleChange}
                      className="w-full rounded-lg border border-gray-300/50 bg-white/50 backdrop-blur-sm px-4 py-2 appearance-none pr-10 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all"
                      required
                    >
                      <option value="">Select Category</option>
                      {categoriesLoading ? (
                        <option disabled>Loading...</option>
                      ) : (
                        categories.map((c) => (
                          <option key={c._id} value={c._id}>
                            {c.name}
                          </option>
                        ))
                      )}
                    </select>
                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-500">
                      <ChevronDown size={16} />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Subcategory
                  </label>
                  <div className="relative">
                    <select
                      name="subcategory"
                      onChange={handleChange}
                      disabled={!selectedCategory}
                      className="w-full rounded-lg border border-gray-300/50 bg-white/50 backdrop-blur-sm px-4 py-2 appearance-none pr-10 disabled:bg-gray-100/50 disabled:text-gray-400 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all"
                      required
                    >
                      <option value="">Select Subcategory</option>
                      {selectedCategory?.subCategories.map((s) => (
                        <option key={s.name} value={s.name}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-gray-500">
                      <ChevronDown size={16} />
                    </div>
                  </div>
                </div>
              </div>

              {/* TITLE */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Task Title
                </label>
                <input
                  name="taskTitle"
                  value={formData.taskTitle}
                  onChange={handleChange}
                  placeholder="Task title"
                  className="w-full rounded-lg border border-gray-300/50 bg-white/50 backdrop-blur-sm px-4 py-2 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all"
                  required
                />
              </div>

              {/* DESCRIPTION */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  maxLength={MAX_DESCRIPTION_LENGTH}
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe your task"
                  className="w-full rounded-lg border border-gray-300/50 bg-white/50 backdrop-blur-sm px-4 py-2 h-24 resize-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all"
                />
                <p className="text-xs text-gray-400 text-right">
                  {formData.description.length}/{MAX_DESCRIPTION_LENGTH}
                </p>
              </div>

              {/* ADDRESS */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Enter your address"
                  className="w-full rounded-lg border border-gray-300/50 bg-white/50 backdrop-blur-sm px-4 py-2 h-20 resize-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all"
                  required
                />
              </div>

              {/* CONTACT DETAILS */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleChange}
                    placeholder="10-digit mobile"
                    className="w-full rounded-lg border border-gray-300/50 bg-white/50 backdrop-blur-sm px-4 py-2 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all"
                    pattern={PHONE_REGEX.source}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Alternate Phone{" "}
                    <span className="text-gray-400 font-normal">
                      (Optional)
                    </span>
                  </label>
                  <input
                    type="tel"
                    name="alternateContactNumber"
                    value={formData.alternateContactNumber}
                    onChange={handleChange}
                    placeholder="Optional"
                    className="w-full rounded-lg border border-gray-300/50 bg-white/50 backdrop-blur-sm px-4 py-2 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all"
                    pattern={PHONE_REGEX.source}
                  />
                </div>
              </div>

              {/* BUDGET DISPLAY */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Budget
                </label>
                <div className="w-full rounded-lg border border-gray-300/50 bg-white/50 backdrop-blur-sm px-4 py-2 text-gray-900 font-medium">
                  {minPrice ? `₹${minPrice}` : "Select category to see budget"}
                </div>
              </div>

              {/* AVAILABILITY (DATE & TIME) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Availability
                </label>

                <div className="mb-3">
                  <input
                    type="date"
                    name="availabilityDate"
                    value={formData.availabilityDate}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300/50 bg-white/50 backdrop-blur-sm px-4 py-2 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all"
                    required
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  {TIME_SLOTS.map((slot) => (
                    <button
                      key={slot.value}
                      type="button"
                      onClick={() => toggleSlot(slot.value)}
                      className={`px-4 py-2 rounded-full border border-gray-300/50 text-sm cursor-pointer backdrop-blur-sm transition-all duration-300 ${formData.availabilityTimeSlots.includes(slot.value)
                          ? "bg-gradient-to-r from-gray-900 to-gray-700 text-white shadow-lg"
                          : "bg-white/50 hover:bg-white/70"
                        }`}
                    >
                      {slot.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* IMAGES */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Task Images{" "}
                  <span className="text-gray-400 font-normal">(Max 3)</span>
                </label>

                <div className="flex flex-wrap gap-4">
                  {/* PREVIEW LIST */}
                  {formData.images.map((img, i) => (
                    <div
                      key={i}
                      className="relative w-24 h-24 rounded-xl overflow-hidden border border-gray-300/50 group shadow-sm backdrop-blur-sm"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent"></div>
                      <img
                        src={URL.createObjectURL(img)}
                        alt="preview"
                        onClick={() => setPreviewImage({ img, index: i })}
                        className="relative w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImage(i);
                        }}
                        className="absolute top-1 right-1 bg-black/50 hover:bg-red-500/90 text-white rounded-full p-1 backdrop-blur-sm transition-all duration-300 cursor-pointer hover:scale-110"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}

                  {/* UPLOAD BUTTON */}
                  {formData.images.length < 3 && (
                    <label className="w-24 h-24 flex flex-col items-center justify-center border-2 border-dashed border-gray-300/50 rounded-xl cursor-pointer hover:bg-white/50 hover:border-gray-400/50 transition-all duration-300 group backdrop-blur-sm">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageAdd}
                        className="hidden"
                        disabled={formData.images.length >= 3}
                      />
                      <div className="bg-white/50 p-2 rounded-full mb-1 group-hover:bg-white/80 group-hover:scale-110 transition-all duration-300">
                        <Camera size={20} className="text-gray-500" />
                      </div>
                      <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">
                        Add Photo
                      </span>
                    </label>
                  )}
                </div>
              </div>

              <button
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-gray-900 to-gray-700 text-white font-medium cursor-pointer hover:shadow-lg hover:from-gray-800 hover:to-gray-600 transition-all duration-300 shadow-md backdrop-blur-sm mb-3 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? "Creating..." : "Create Work"}
              </button>
              {error && (
                <p className="text-red-500 text-sm text-center">{error}</p>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* IMAGE PREVIEW MODAL */}
      {previewImage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          {/* Glass background */}
          <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]"></div>

          {/* Preview container */}
          <div className="relative glass-effect rounded-2xl p-6 max-w-lg mx-4">
            <img
              src={URL.createObjectURL(previewImage.img)}
              alt="full preview"
              className="max-h-[70vh] rounded-lg shadow-2xl"
            />
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => removeImage(previewImage.index)}
                className="flex-1 py-2 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-lg cursor-pointer hover:shadow-lg transition-all duration-300"
              >
                Remove Image
              </button>
              <button
                onClick={() => setPreviewImage(null)}
                className="flex-1 py-2 bg-gradient-to-r from-gray-600 to-gray-500 text-white rounded-lg cursor-pointer hover:shadow-lg transition-all duration-300"
              >
                Cancel
              </button>
            </div>
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute -top-3 -right-3 glass-effect hover:bg-white/80 p-2 rounded-full shadow-lg transition-all duration-300 cursor-pointer"
            >
              <X size={20} className="text-gray-700" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
