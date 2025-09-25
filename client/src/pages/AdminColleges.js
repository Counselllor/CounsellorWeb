import React, { useEffect, useState } from "react";
import axios from "axios";

function AdminColleges() {
  const [colleges, setColleges] = useState([]);
  const [form, setForm] = useState({ name: "", location: "", address: "", description: "", email: "", phone: "", websiteUrl: "", imageUrl: "" });
  const token = JSON.parse(localStorage.getItem("user"))?.token;

  // Fetch colleges
  useEffect(() => {
    fetchColleges();
  }, []);

  const fetchColleges = async () => {
    try {
      const { data } = await axios.get("http://localhost:5000/api/colleges");
      setColleges(data);
    } catch (err) {
      console.error(err);
    }
  };

  // Add new college
  const addCollege = async (e) => {
  e.preventDefault();
  try {
    await axios.post(
      "http://localhost:5000/api/colleges",
      form,    // ✅ send all fields
      { headers: { Authorization: `Bearer ${token}` } } // ✅ send JWT
    );
    setForm({ name: "", location: "", address: "", description: "", email: "", phone: "", websiteUrl: "", imageUrl: "" });
    fetchColleges(); // refresh list
  } catch (err) {
    console.error("Add error:", err.response?.data || err.message);
    alert(err.response?.data?.message || "Error adding college");
  }
};

  // Delete college
  const deleteCollege = async (id) => {
  try {
    await axios.delete(`http://localhost:5000/api/colleges/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchColleges(); // refresh after deleting
  } catch (err) {
    console.error("Delete error:", err.response?.data || err.message);
    alert(err.response?.data?.message || "Error deleting college");
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
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          ➕ Add College
        </button>
      </form>

      {/* List of Colleges */}
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
      onClick={() => deleteCollege(college._id)}   // ✅ use _id
      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
    >
      🗑 Delete
    </button>
  </div>
))}
      </div>
    </div>
  );
}

export default AdminColleges;
