import { useEffect, useState, useCallback, useMemo, memo } from "react";
import { toast } from "react-toastify";
import { 
  getColleges, 
  createCollege, 
  updateCollege as updateCollegeAPI, 
  deleteCollege as deleteCollegeAPI 
} from "../api/api";

// Memoized Form Input Component to prevent re-renders and cursor loss
const FormInput = memo(({ label, name, value, onChange, type = "text", required = false, disabled = false }) => (
  <div className="mb-3">
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {type === "textarea" ? (
      <textarea
        value={value}
        onChange={onChange}
        className="border border-gray-300 p-2 rounded w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        rows={3}
        disabled={disabled}
        required={required}
      />
    ) : (
      <input
        type={type}
        value={value}
        onChange={onChange}
        className="border border-gray-300 p-2 rounded w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        required={required}
        disabled={disabled}
      />
    )}
  </div>
));

FormInput.displayName = 'FormInput';

function AdminColleges() {
  const [colleges, setColleges] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state with all fields initialized as empty strings
  // useMemo ensures the object doesn't change on every render
  const emptyForm = useMemo(() => ({ 
    name: "", 
    location: "", 
    address: "", 
    description: "", 
    email: "", 
    phone: "", 
    websiteUrl: "", 
    imageUrl: "", 
    imageFile: null 
  }), []);
  
  const [form, setForm] = useState(emptyForm);
  const [imagePreview, setImagePreview] = useState(null);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // "create", "edit", "view"
  const [selectedCollege, setSelectedCollege] = useState(null);

  // Fetch colleges
  const fetchColleges = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data } = await getColleges();
      setColleges(data || []); // Ensure we always set an array
    } catch (err) {
      console.error("Error fetching colleges:", err);
      toast.error("Failed to load colleges");
      setColleges([]); // Set empty array on error
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchColleges();
  }, [fetchColleges]);

  // Cleanup image preview URL to prevent memory leaks
  useEffect(() => {
    return () => {
      if (imagePreview && imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  // Open modal for different modes
  const openModal = useCallback((mode, college = null) => {
    setModalMode(mode);
    setSelectedCollege(college);
    
    if (mode === "create") {
      setForm(emptyForm);
      setImagePreview(null);
    } else if (college) {
      // Ensure all fields have values (never undefined)
      setForm({
        name: college.name || "",
        location: college.location || "",
        address: college.address || "",
        description: college.description || "",
        email: college.email || "",
        phone: college.phone || "",
        websiteUrl: college.websiteUrl || "",
        imageUrl: college.imageUrl || "",
        imageFile: null
      });
      setImagePreview(null);
    }
    setShowModal(true);
  }, [emptyForm]);

  const closeModal = useCallback(() => {
    // Cleanup image preview URL
    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }
    
    setShowModal(false);
    setSelectedCollege(null);
    setForm(emptyForm);
    setImagePreview(null);
  }, [imagePreview, emptyForm]);

  // Handle file input change
  const handleFileChange = useCallback((e) => {
    const file = e.target.files?.[0];
    
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error("Please select a valid image file (JPG, PNG, GIF, WEBP)");
      return;
    }

    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      toast.error("File size must be less than 5MB");
      return;
    }

    // Cleanup old preview URL
    if (imagePreview && imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(imagePreview);
    }

    setForm(prev => ({ ...prev, imageFile: file, imageUrl: "" }));
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
  }, [imagePreview]);

  // Handle form input changes
  const handleInputChange = useCallback((name, value) => {
    setForm(prev => ({ ...prev, [name]: value }));
  }, []);

  // Validate form
  const validateForm = () => {
    if (!form.name.trim()) {
      toast.error("College name is required");
      return false;
    }
    if (!form.location.trim()) {
      toast.error("Location is required");
      return false;
    }
    
    // Validate email if provided
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      toast.error("Please enter a valid email address");
      return false;
    }
    
    // Validate URL if provided
    if (form.websiteUrl && form.websiteUrl.trim()) {
      try {
        new URL(form.websiteUrl);
      } catch {
        toast.error("Please enter a valid website URL");
        return false;
      }
    }
    
    if (form.imageUrl && form.imageUrl.trim()) {
      try {
        new URL(form.imageUrl);
      } catch {
        toast.error("Please enter a valid image URL");
        return false;
      }
    }
    
    return true;
  };

  // Handle form submission (Create or Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("name", form.name.trim());
      formData.append("location", form.location.trim());
      formData.append("address", form.address.trim());
      formData.append("description", form.description.trim());
      formData.append("email", form.email.trim());
      formData.append("phone", form.phone.trim());
      formData.append("websiteUrl", form.websiteUrl.trim());

      // Append image file if selected, otherwise append existing imageUrl
      if (form.imageFile) {
        formData.append("image", form.imageFile);
      } else if (form.imageUrl.trim()) {
        formData.append("imageUrl", form.imageUrl.trim());
      }

      if (modalMode === "create") {
        await createCollege(formData);
        toast.success("College added successfully!");
      } else if (modalMode === "edit" && selectedCollege) {
        await updateCollegeAPI(selectedCollege._id, formData);
        toast.success("College updated successfully!");
      }
      
      closeModal();
      fetchColleges();
    } catch (err) {
      console.error("Submit error:", err);
      const errorMessage = err.response?.data?.message || 
                          err.message || 
                          "Error saving college";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete college
  const handleDeleteCollege = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?\n\nThis action cannot be undone.`)) {
      return;
    }

    try {
      await deleteCollegeAPI(id);
      toast.success("College deleted successfully!");
      fetchColleges();
    } catch (err) {
      console.error("Delete error:", err);
      const errorMessage = err.response?.data?.message || 
                          err.message || 
                          "Error deleting college";
      toast.error(errorMessage);
    }
  };

  // Image error handler
  const handleImageError = (e) => {
    e.target.style.display = 'none';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
          🎓 Admin: Manage Colleges
        </h1>
        <button
          onClick={() => openModal("create")}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition flex items-center gap-2 shadow-md hover:shadow-lg"
        >
          <span>➕</span> Add New College
        </button>
      </div>

      {/* Stats */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <p className="text-gray-600">
          Total Colleges: <span className="font-bold text-blue-600">{colleges.length}</span>
        </p>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* College Cards Grid */}
      {!isLoading && (
        <div className="grid gap-4 md:gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {colleges.length === 0 ? (
            <div className="col-span-full text-center py-20 text-gray-500">
              <p className="text-lg">No colleges found.</p>
              <p className="text-sm mt-2">Click "Add New College" to get started!</p>
            </div>
          ) : (
            colleges.map((college) => (
              <div 
                key={college._id} 
                className="bg-white shadow-lg rounded-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
              >
                {/* College Image */}
                {college.imageUrl && (
                  <div className="w-full h-40 bg-gray-200 overflow-hidden">
                    <img
                      src={college.imageUrl}
                      alt={college.name}
                      className="w-full h-full object-cover"
                      onError={handleImageError}
                      loading="lazy"
                    />
                  </div>
                )}

                {/* College Info */}
                <div className="p-4">
                  <h2 className="font-bold text-lg text-gray-800 mb-1 line-clamp-1">
                    {college.name}
                  </h2>
                  <p className="text-gray-500 text-sm mb-2">📍 {college.location}</p>
                  {college.description && (
                    <p className="text-gray-600 text-sm mt-2 line-clamp-2">
                      {college.description}
                    </p>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => openModal("view", college)}
                      className="flex-1 bg-blue-100 text-blue-700 px-3 py-2 rounded hover:bg-blue-200 transition text-sm font-medium"
                      title="View details"
                    >
                      👁️ View
                    </button>
                    <button
                      onClick={() => openModal("edit", college)}
                      className="flex-1 bg-yellow-100 text-yellow-700 px-3 py-2 rounded hover:bg-yellow-200 transition text-sm font-medium"
                      title="Edit college"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDeleteCollege(college._id, college.name)}
                      className="flex-1 bg-red-100 text-red-700 px-3 py-2 rounded hover:bg-red-200 transition text-sm font-medium"
                      title="Delete college"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            // Close modal when clicking on backdrop
            if (e.target === e.currentTarget) {
              closeModal();
            }
          }}
        >
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 border-b sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold">
                {modalMode === "create" && "➕ Add New College"}
                {modalMode === "edit" && "✏️ Edit College"}
                {modalMode === "view" && "👁️ College Details"}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700 text-2xl w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100"
                title="Close"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-4">
              <div className="grid md:grid-cols-2 gap-4">
                <FormInput 
                  label="College Name" 
                  name="name" 
                  value={form.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  required 
                  disabled={modalMode === "view"} 
                />
                <FormInput 
                  label="Location" 
                  name="location" 
                  value={form.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  required 
                  disabled={modalMode === "view"} 
                />
                <FormInput 
                  label="Address" 
                  name="address" 
                  value={form.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  disabled={modalMode === "view"} 
                />
                <FormInput 
                  label="Email" 
                  name="email" 
                  value={form.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  type="email" 
                  disabled={modalMode === "view"} 
                />
                <FormInput 
                  label="Phone" 
                  name="phone" 
                  value={form.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  type="tel"
                  disabled={modalMode === "view"} 
                />
                <FormInput 
                  label="Website URL" 
                  name="websiteUrl" 
                  value={form.websiteUrl}
                  onChange={(e) => handleInputChange('websiteUrl', e.target.value)}
                  type="url" 
                  disabled={modalMode === "view"} 
                />
                
                <div className="md:col-span-2">
                  <FormInput 
                    label="Image URL (optional)" 
                    name="imageUrl" 
                    value={form.imageUrl}
                    onChange={(e) => handleInputChange('imageUrl', e.target.value)}
                    type="url" 
                    disabled={modalMode === "view"} 
                  />
                </div>
                
                {modalMode !== "view" && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Or Upload Image
                    </label>
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      onChange={handleFileChange}
                      className="border border-gray-300 p-2 rounded w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Supported formats: JPG, PNG, GIF, WEBP (max 5MB)
                    </p>
                  </div>
                )}
                
                <div className="md:col-span-2">
                  <FormInput 
                    label="Description" 
                    name="description" 
                    value={form.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    type="textarea" 
                    disabled={modalMode === "view"} 
                  />
                </div>
              </div>

              {/* Image Preview */}
              {(imagePreview || form.imageUrl) && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image Preview
                  </label>
                  <img
                    src={imagePreview || form.imageUrl}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-lg border border-gray-300"
                    onError={(e) => { 
                      e.target.src = 'https://via.placeholder.com/400x200?text=Invalid+Image+URL'; 
                    }}
                  />
                  {imagePreview && form.imageFile && (
                    <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                      <span>✓</span> New image selected: {form.imageFile.name}
                    </p>
                  )}
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  {modalMode === "view" ? "Close" : "Cancel"}
                </button>
                {modalMode !== "view" && (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition"
                  >
                    {isSubmitting
                      ? "Saving..."
                      : modalMode === "create"
                        ? "Add College"
                        : "Save Changes"
                    }
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminColleges;