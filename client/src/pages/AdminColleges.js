import { useEffect, useState, useCallback } from "react";
import { toast } from "react-toastify";
import { getColleges, createCollege, deleteCollege as deleteCollegeAPI } from "../api/api";

function AdminColleges() {
  const [colleges, setColleges] = useState([]);
  const [form, setForm] = useState({ name: "", location: "", address: "", description: "", email: "", phone: "", websiteUrl: "", imageUrl: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch colleges
  const fetchColleges = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data } = await getColleges();
      setColleges(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load colleges");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchColleges();
  }, [fetchColleges]);

  // Add new college
  const addCollege = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createCollege(form);
      setForm({ name: "", location: "", address: "", description: "", email: "", phone: "", websiteUrl: "", imageUrl: "" });
      fetchColleges(); // refresh list
      toast.success("College added successfully!");
    } catch (err) {
      console.error("Add error:", err.response?.data || err.message);
      toast.error(err.response?.data?.message || "Error adding college");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete college
  const handleDeleteCollege = async (id) => {
    if (!window.confirm("Are you sure you want to delete this college?")) return;

    try {
      await deleteCollegeAPI(id);
      fetchColleges(); // refresh after deleting
      toast.success("College deleted successfully!");
    } catch (err) {
      console.error("Delete error:", err.response?.data || err.message);
      toast.error(err.response?.data?.message || "Error deleting college");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-10">
      <h1 className="text-2xl font-bold mb-5">🎓 Admin: Manage Colleges</h1>

      {/* Add College Form */}
      <form onSubmit={addCollege} className="space-y-3 mb-6">
        <input
          type="text"
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="border p-2 rounded w-full"
          required
        />
        <input
          type="text"
          placeholder="Location"
          value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
          className="border p-2 rounded w-full"
          required
        />
        <input
          type="text"
          placeholder="Address"
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
          className="border p-2 rounded w-full"
        />
        <textarea
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="border p-2 rounded w-full"
        />
        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="border p-2 rounded w-full"
        />
        <input
          type="text"
          placeholder="Phone"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className="border p-2 rounded w-full"
        />
        <input
          type="url"
          placeholder="Website URL"
          value={form.websiteUrl}
          onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })}
          className="border p-2 rounded w-full"
        />
        <input
          type="url"
          placeholder="Image URL"
          value={form.imageUrl}
          onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
          className="border p-2 rounded w-full"
        />

        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-green-400"
        >
          {isSubmitting ? "Adding..." : "➕ Add College"}
        </button>
      </form>

      {/* Loading State */}
      {isLoading && (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* List of Colleges */}
      {!isLoading && (
        <div className="grid gap-4">
          {colleges.map((college) => (
            <div key={college._id} className="p-5 bg-white shadow flex justify-between items-center rounded">
              <div>
                <h2 className="font-semibold">{college.name}</h2>
                <p className="text-gray-500">📍 {college.location}</p>
                {college.description && <p className="text-gray-600">{college.description}</p>}
                {college.email && <p className="text-gray-600">📧 {college.email}</p>}
              </div>
              <button
                onClick={() => handleDeleteCollege(college._id)}
                className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
              >
                🗑 Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminColleges;
