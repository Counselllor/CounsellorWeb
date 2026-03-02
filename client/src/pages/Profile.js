import { useEffect, useState } from "react";
import Footer from "../components/Footer";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { getCurrentUser, updateUserProfile } from "../api/api";

function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    bio: "",
    course: "",
    year: "",
    skills: []
  });

  // fetch user from server
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await getCurrentUser();

        setUser(data);
        setFormData({
          name: data.name || "",
          bio: data.bio || "",
          course: data.course || "",
          year: data.year || "",
          skills: data.skills || []
        });
      } catch (err) {
        console.error(err);
        toast.error("❌ Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const saveProfile = async () => {
    setIsSaving(true);
    try {
      // Only send fields that can be updated (exclude email, college, role)
      const updateData = {
        name: formData.name,
        bio: formData.bio,
        course: formData.course,
        year: formData.year,
        skills: formData.skills
      };

      const { data } = await updateUserProfile(updateData);
      setUser(data);
      setEditMode(false);
      toast.success("✅ Profile updated successfully");
    } catch (err) {
      console.error(err);
      toast.error("❌ Error updating profile");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <p className="p-6">Loading profile...</p>;
  }

  return (
    <>

      <div className="max-w-4xl mx-auto p-8">
        <h1 className="text-2xl font-bold mb-4 text-blue-800">My Profile</h1>

        {/* Avatar */}
        <div className="flex flex-col items-center mb-6">
          <div className="h-20 w-20 rounded-full bg-blue-600 flex items-center justify-center text-white text-xl font-bold">
            {user?.name ? user.name.charAt(0) : user?.username?.charAt(0) || "U"}
          </div>
          <h2 className="mt-2 text-xl">{user?.name || user?.username}</h2>
          <p className="text-gray-600">{user?.email}</p>
          <p className="text-sm text-gray-500 capitalize">{user?.role}</p>
        </div>

        {/* Info card */}
        <div className="bg-blue-50 p-6 rounded shadow">
          <div className="flex justify-between mb-4">
            <h3 className="font-semibold text-lg">Personal Information</h3>
            {!editMode && (
              <button
                onClick={() => setEditMode(true)}
                className="bg-blue-600 text-white px-4 py-1 rounded"
              >
                Edit Profile
              </button>
            )}
          </div>

          {editMode ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Full Name</label>
                <input
                  type="text"
                  name="name"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full p-2 border-2 border-gray-300 rounded-lg outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Bio</label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  placeholder="Tell us about yourself..."
                  className="w-full p-2 border-2 border-gray-300 rounded-lg outline-none focus:border-blue-500"
                  rows="3"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-500">College (Read-only)</label>
                <input
                  type="text"
                  value={user?.college?.name || "Not specified"}
                  disabled
                  className="w-full p-2 border-2 border-gray-200 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">College cannot be changed after registration</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Course</label>
                  <input
                    type="text"
                    name="course"
                    placeholder="e.g., BTech, MBA"
                    value={formData.course}
                    onChange={handleChange}
                    className="w-full p-2 border-2 border-gray-300 rounded-lg outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Year</label>
                  <select
                    name="year"
                    value={formData.year}
                    onChange={handleChange}
                    className="w-full p-2 border-2 border-gray-300 rounded-lg outline-none focus:border-blue-500"
                  >
                    <option value="">Select Year</option>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                    <option value="Graduated">Graduated</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-500">Email (Read-only)</label>
                <input
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="w-full p-2 border-2 border-gray-200 rounded-lg bg-gray-100 text-gray-600 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  className="bg-gray-400 text-white px-6 py-2 rounded-lg hover:bg-gray-500 disabled:opacity-50 transition-colors"
                  onClick={() => setEditMode(false)}
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:bg-green-400 transition-colors"
                  onClick={saveProfile}
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p><strong>Name:</strong> {user?.name || user?.username || "N/A"}</p>
              <p><strong>Bio:</strong> {user?.bio || "No bio added yet"}</p>
              <p><strong>College:</strong> {user?.college?.name || "Not specified"}</p>
              <p><strong>Course:</strong> {user?.course || "Not specified"}</p>
              <p><strong>Year:</strong> {user?.year || "Not specified"}</p>
              <p><strong>Email:</strong> {user?.email || "N/A"}</p>
              <p><strong>Username:</strong> {user?.username || "N/A"}</p>
              <p><strong>Role:</strong> <span className="capitalize">{user?.role || "N/A"}</span></p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}

export default Profile;
