import { useState } from "react";
import { useSelector } from "react-redux";
import useAdminCategories from "../../hooks/admin/useAdminCategories";
import CategoryModal from "./CategoryModal";
import { badgeCls, btnCls, TH, TD, TR, OVERLAY, MODAL } from "./adminUtils";
import { usePopup } from "../../context/PopupContext";

const CategoriesManager = () => {
  const { loading, error, createCategory, updateCategory, deleteCategory } = useAdminCategories();
  const categories = useSelector((s) => s.admin.categories);
  const [modal, setModal] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const { showPopup } = usePopup();

  const handleSave = async (data) => {
    try {
      if (modal === "create") {
        await createCategory(data);
        showPopup({ type: "success", title: "Category Created", message: "Category created successfully." });
      } else {
        await updateCategory(modal._id, data);
        showPopup({ type: "success", title: "Category Updated", message: "Category updated successfully." });
      }
      setModal(null);
    } catch (err) {
      showPopup({
        type: "error",
        title: "Save Failed",
        message: err.response?.data?.message || "Failed to save category",
      });
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteCategory(id);
      setDeleteConfirm(null);
      showPopup({ type: "success", title: "Category Deleted", message: "Category deleted successfully." });
    } catch {
      showPopup({ type: "error", title: "Delete Failed", message: "Failed to delete category" });
    }
  };

  if (loading) return <div className="text-center py-16 text-gray-400 text-sm">Loading categories...</div>;
  if (error)   return <div className="text-center py-16 text-red-500 text-sm">{error}</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Categories</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-800">Categories ({categories.length})</h2>
          <button className={btnCls("primary", true)} onClick={() => setModal("create")}>+ Add Category</button>
        </div>

        {categories.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">No categories yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className={TH}>Name</th>
                  <th className={TH}>Min Price</th>
                  <th className={TH}>Subcategories</th>
                  <th className={TH}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c._id} className={TR}>
                    <td className={TD}>
                      {c.icon && <span className="mr-1.5">{c.icon}</span>}
                      <strong>{c.name}</strong>
                    </td>
                    <td className={TD}>INR {c.minPrice}</td>
                    <td className={TD}>
                      {c.subCategories?.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {c.subCategories.map((sub, i) => (
                            <span key={i} className={badgeCls("blue")}>{sub.name} - INR {sub.minPrice}</span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">None</span>
                      )}
                    </td>
                    <td className={TD}>
                      <div className="flex gap-2">
                        <button className={btnCls("ghost", true)} onClick={() => setModal(c)}>Edit</button>
                        <button className={btnCls("danger", true)} onClick={() => setDeleteConfirm(c)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <CategoryModal
          category={modal === "create" ? null : modal}
          onClose={() => setModal(null)}
          onSave={handleSave}
        />
      )}

      {deleteConfirm && (
        <div className={OVERLAY} onClick={() => setDeleteConfirm(null)}>
          <div className={MODAL} onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900 mb-2">Delete Category</h2>
            <p className="text-sm text-gray-600 mb-5">
              Are you sure you want to delete <strong>{deleteConfirm.name}</strong>? This cannot be undone.
            </p>
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button className={btnCls("ghost")} onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className={btnCls("danger")} onClick={() => handleDelete(deleteConfirm._id)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoriesManager;
