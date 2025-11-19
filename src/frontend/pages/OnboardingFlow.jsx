// src/frontend/pages/Onboarding.jsx
import React, { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";

const STATES_IN = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat",
  "Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh",
  "Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab",
  "Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh",
  "Uttarakhand","West Bengal","Delhi","Jammu and Kashmir","Ladakh","Puducherry"
];

// small toast helper
const notify = (type, msg) => {
  if (type === "success") toast.success(msg);
  else if (type === "warn") toast.warn(msg);
  else toast.error(msg);
};

const Onboarding = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    role: localStorage.getItem("userRole") || "",
    address: "",
    state: "",
    district: "",
    pincode: "",
    farmType: "",
    accept: false,
  });

  const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5001";

  /* ------------------------- Prefill + Load ------------------------- */
  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      notify("warn", "Please log in first");
      navigate("/login");
      return;
    }

    setLoading(true);
    (async () => {
      try {
        // prefill firebase basics
        setProfile((p) => ({
          ...p,
          email: user.email || "",
          phone: user.phoneNumber || "",
        }));

        // attempt load existing profile
        const res = await fetch(`${API_BASE}/api/users/${user.uid}`);
        if (res.ok) {
          const data = await res.json();
          if (data?.user) {
            setProfile((p) => ({
              ...p,
              name: data.user.name || "",
              email: data.user.email || user.email || "",
              phone: data.user.phone || user.phoneNumber || "",
              role: data.user.role || p.role,
              address: data.user.address || "",
              state: data.user.state || "",
              district: data.user.district || "",
              pincode: data.user.pincode || "",
              farmType: data.user.farmType || "",
            }));
          }
        }
      } catch (err) {
        console.warn("Profile load failed:", err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [API_BASE, navigate]);

  /* ------------------------- Handlers ------------------------- */
  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProfile((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
  };

  const validateFields = () => {
    if (!profile.name.trim()) return "Name is required.";
    if (profile.pincode && !/^\d{6}$/.test(profile.pincode))
      return "Enter valid 6-digit pincode.";
    if (!profile.accept) return "Please accept the confirmation.";
    return null;
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    const errorMsg = validateFields();
    if (errorMsg) return notify("warn", errorMsg);

    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      notify("error", "Session expired. Please login again.");
      navigate("/login");
      return;
    }

    setSaving(true);
    try {
      // ensure onboarded user
      await fetch(`${API_BASE}/api/users/onboard`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: user.uid,
          email: profile.email || "",
          phone: profile.phone || "",
          role: profile.role || localStorage.getItem("userRole") || "",
        }),
      });

      // update profile
      const res = await fetch(`${API_BASE}/api/users/${user.uid}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      if (!res.ok) throw new Error("Failed to save profile");

      notify("success", "Profile saved successfully!");
      const role = profile.role || localStorage.getItem("userRole") || "buyer";
      navigate(role === "farmer" ? "/farmer-dashboard" : "/buyer-dashboard");
    } catch (err) {
      notify("error", err.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  /* ------------------------- Render ------------------------- */
  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="animate-pulse text-gray-600">Loading your onboarding…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 p-6">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">Complete your Profile</h1>
          <Link to="/" className="text-sm text-green-600 hover:underline">
            Home
          </Link>
        </div>
        <p className="text-gray-500 mt-1">
          Tell us a bit about you so we can set up your KrishiSaathi account.
        </p>

        <form className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={saveProfile}>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Role</label>
            <input
              value={profile.role}
              readOnly
              className="mt-1 w-full px-3 py-2 border rounded-lg bg-gray-50 text-gray-500"
            />
          </div>

          {/* Personal info */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Full Name</label>
            <input
              name="name"
              value={profile.name}
              onChange={onChange}
              placeholder="e.g., Ramesh Patil"
              className="mt-1 w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-400 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <input
              name="phone"
              value={profile.phone}
              onChange={onChange}
              placeholder="+91XXXXXXXXXX"
              className="mt-1 w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              name="email"
              type="email"
              value={profile.email}
              onChange={onChange}
              placeholder="user@example.com"
              className="mt-1 w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Farm Type</label>
            <select
              name="farmType"
              value={profile.farmType}
              onChange={onChange}
              className="mt-1 w-full px-3 py-2 border rounded-lg"
            >
              <option value="">Select</option>
              {["Vegetables","Fruits","Grains","Dairy","Poultry","Other"].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Address</label>
            <textarea
              name="address"
              value={profile.address}
              onChange={onChange}
              placeholder="House / Village / Taluka"
              className="mt-1 w-full px-3 py-2 border rounded-lg"
              rows={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">State</label>
            <select
              name="state"
              value={profile.state}
              onChange={onChange}
              className="mt-1 w-full px-3 py-2 border rounded-lg"
            >
              <option value="">Select State</option>
              {STATES_IN.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">District</label>
            <input
              name="district"
              value={profile.district}
              onChange={onChange}
              placeholder="e.g., Thane"
              className="mt-1 w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Pincode</label>
            <input
              name="pincode"
              value={profile.pincode}
              onChange={onChange}
              inputMode="numeric"
              pattern="\d{6}"
              placeholder="6-digit"
              className="mt-1 w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div className="md:col-span-2 flex items-center gap-2 mt-2">
            <input
              id="accept"
              name="accept"
              type="checkbox"
              checked={profile.accept}
              onChange={onChange}
              className="h-4 w-4"
            />
            <label htmlFor="accept" className="text-sm text-gray-700">
              I confirm the details are correct and I agree to proceed.
            </label>
          </div>

          <div className="md:col-span-2 mt-2">
            <button
              type="submit"
              disabled={saving}
              className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                saving
                  ? "bg-green-300 cursor-not-allowed"
                  : "bg-green-600 text-white hover:bg-green-700"
              }`}
            >
              {saving ? "Saving…" : "Save & Continue"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Onboarding;
