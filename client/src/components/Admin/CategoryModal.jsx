import { useState } from "react";
import { OVERLAY, inputCls, labelCls, btnCls } from "./adminUtils";

const CategoryModal = ({ category, onClose, onSave }) => {
  const [name, setName] = useState(category?.name ?? "");
  const [minPrice, setMinPrice] = useState(category?.minPrice ?? "");
  const [icon, setIcon] = useState(category?.icon ?? "");
  const [subCategories, setSubCategories] = useState(
    category?.subCategories?.map((s) => ({ name: s.name, minPrice: s.minPrice })) ?? []
  );
  const [saving, setSaving] = useState(false);

  const addSub = () => setSubCategories((prev) => [...prev, { name: "", minPrice: "" }]);
  const removeSub = (i) => setSubCategories((prev) => prev.filter((_, idx) => idx !== i));
  const updateSub = (i, field, val) =>
    setSubCategories((prev) => prev.map((s, idx) => idx === i ? { ...s, [field]: val } : s));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        name,
        minPrice: Number(minPrice),
        icon,
        subCategories: subCategories
          .filter((s) => s.name && s.minPrice !== "")
          .map((s) => ({ name: s.name, minPrice: Number(s.minPrice) })),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={OVERLAY} onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-gray-900 mb-4">{category ? "Edit Category" : "New Category"}</h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className={labelCls}>Category Name *</label>
              <input className={inputCls} required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Plumbing" />
            </div>
            <div>
              <label className={labelCls}>Min Price (INR ) *</label>
              <input className={inputCls} required type="number" min={0} value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="e.g. 200" />
            </div>
          </div>
          <div className="mb-4">
            <label className={labelCls}>Icon (emoji, optional)</label>
            <input className={inputCls} value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="e.g. 🔧" />
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-700">Subcategories</span>
              <button type="button" className={btnCls("ghost", true)} onClick={addSub}>+ Add</button>
            </div>
            <div className="space-y-2">
              {subCategories.map((sub, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    className="flex-[2] px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Subcategory name"
                    value={sub.name}
                    onChange={(e) => updateSub(i, "name", e.target.value)}
                  />
                  <input
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    type="number" min={0} placeholder="Min INR "
                    value={sub.minPrice}
                    onChange={(e) => updateSub(i, "minPrice", e.target.value)}
                  />
                  <button type="button" className={btnCls("danger", true)} onClick={() => removeSub(i)}>✕</button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button type="button" className={btnCls("ghost")} onClick={onClose}>Cancel</button>
            <button type="submit" className={btnCls("primary")} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CategoryModal;
