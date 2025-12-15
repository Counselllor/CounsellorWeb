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
    firstname: "",
    surname: "",
    bio: "",
    college: "",
    course: "",
    year: "",
    email: ""
  });

  // fetch user from server
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await getCurrentUser();

        setUser(data);
        setFormData({
          firstname: data.firstname || "",
          surname: data.surname || "",
          bio: data.bio || "",
          college: data.college?.name || "",
          course: data.course || "",
          year: data.year || "",
          email: data.email || ""
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
      const { data } = await updateUserProfile(formData);
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
            {user?.firstname ? user.firstname.charAt(0) : user?.username.charAt(0)}
          </div>
          <h2 className="mt-2 text-xl">{user?.firstname} {user?.surname}</h2>
          <p className="text-gray-600">{user?.email}</p>
          <p className="text-sm text-gray-500">{user?.role}</p>
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
            <div className="space-y-3">
              <input
                type="text"
                name="firstname"
                placeholder="First Name"
                value={formData.firstname}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              />
              <input
                type="text"
                name="surname"
                placeholder="Surname"
                value={formData.surname}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              />
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                placeholder="Your biography"
                className="w-full p-2 border rounded"
              />
              <input
                type="text"
                name="college"
                placeholder="College"
                value={formData.college}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              />
              <input
                type="text"
                name="course"
                placeholder="Course"
                value={formData.course}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              />
              <select
                name="year"
                value={formData.year}
                onChange={handleChange}
                className="w-full p-2 border rounded"
              >
                <option value="">Select Year</option>
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
                <option value="Graduated">Graduated</option>
              </select>

              <div className="flex gap-2">
                <button
                  className="bg-gray-400 text-white px-4 py-2 rounded disabled:opacity-50"
                  onClick={() => setEditMode(false)}
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  className="bg-green-600 text-white px-4 py-2 rounded disabled:bg-green-400"
                  onClick={saveProfile}
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p><strong>Bio:</strong> {user?.bio || "No bio yet"}</p>
              <p><strong>College:</strong> {user?.college?.name || "Not specified"}</p>
              <p><strong>Course:</strong> {user?.course || "Not specified"}</p>
              <p><strong>Year:</strong> {user?.year || "Not specified"}</p>
              <p><strong>Email:</strong> {user?.email}</p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}

export default Profile;
