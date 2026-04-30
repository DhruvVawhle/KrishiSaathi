// src/pages/FarmerProfile.jsx
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Save, Edit3 } from "lucide-react";

/**
 * FarmerProfile.jsx
 * - Integrates with FarmerDashboardLayout (uses localStorage for simplicity)
 * - Accessible, responsive, saves to localStorage
 *
 * Usage:
 *  - Add route: <Route path="profile" element={<FarmerProfile />} /> under /farmer-dashboard routes
 */

const defaultProfile = {
  displayName: "",
  farmName: "",
  phone: "",
  address: "",
  bio: "",
  crops: [], // array of strings
  avatarBase64: "", // base64 image string
};

const STORAGE_KEY = "farmerProfile_v1";

function readProfileFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore parse errors
  }

  return {
    ...defaultProfile,
    // fallback to layout keys if present
    displayName: (localStorage.getItem("userEmail") || "").split("@")[0] || "",
    farmName: localStorage.getItem("farmName") || "My Farm",
  };
}

export default function FarmerProfile() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState(readProfileFromStorage);
  const [editing, setEditing] = useState(true);
  const [errors, setErrors] = useState({});
  const [statusMsg, setStatusMsg] = useState("");
  const [cropInput, setCropInput] = useState("");
  const fileInputRef = useRef(null);
  const statusTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current);
    };
  }, []);

  const updateField = (key, val) => {
    setProfile((p) => ({ ...p, [key]: val }));
    setErrors((e) => ({ ...e, [key]: null }));
  };

  const validate = () => {
    const errs = {};
    if (!profile.displayName.trim()) errs.displayName = "Display name is required.";
    if (!profile.farmName.trim()) errs.farmName = "Farm name is required.";
    // phone optional but if present do a simple pattern check
    if (profile.phone && !/^[+\d][\d\s\-()]{4,}$/.test(profile.phone))
      errs.phone = "Please enter a valid phone number.";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const saveProfile = (e) => {
    e && e.preventDefault();
    if (!validate()) return;

    // persist
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
      // also keep some keys used by layout in sync
      if (profile.displayName) localStorage.setItem("userEmail", `${profile.displayName}@local`);
      if (profile.farmName) localStorage.setItem("farmName", profile.farmName);

      setStatusMsg("Profile saved.");
      statusTimeoutRef.current = setTimeout(() => setStatusMsg(""), 3500);
      setEditing(false);
    } catch {
      setStatusMsg("Failed to save profile — localStorage error.");
      statusTimeoutRef.current = setTimeout(() => setStatusMsg(""), 3500);
    }
  };

  const handleAvatarUpload = (file) => {
    if (!file) return;
    // basic size limit (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrors((e) => ({ ...e, avatar: "Image too large (max 5MB)." }));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result;
      updateField("avatarBase64", base64);
    };
    reader.readAsDataURL(file);
  };

  const removeAvatar = () => {
    updateField("avatarBase64", "");
    if (fileInputRef.current) fileInputRef.current.value = null;
  };

  const addCropTag = () => {
    const tag = cropInput.trim();
    if (!tag) return;
    if (profile.crops.includes(tag)) {
      setCropInput("");
      return;
    }
    updateField("crops", [...profile.crops, tag]);
    setCropInput("");
  };

  const removeCropTag = (tag) => {
    updateField("crops", profile.crops.filter((c) => c !== tag));
  };

  // Simple placeholder stats (replace with real data fetch)
  const stats = {
    listings: parseInt(localStorage.getItem("mock_listings") || "12"),
    orders: parseInt(localStorage.getItem("mock_orders") || "34"),
    rating: parseFloat(localStorage.getItem("mock_rating") || "4.6"),
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* header row */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-semibold">Farmer Profile</h2>
          <p className="text-sm text-gray-600">
            Manage your farm details, contact info and crops. These values are stored locally for this demo.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setEditing((s) => !s);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border text-sm hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-green-200"
            aria-pressed={editing}
          >
            <Edit3 size={14} /> {editing ? "Editing" : "Edit"}
          </button>

          <button
            onClick={() => {
              saveProfile();
            }}
            disabled={!editing}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white text-sm hover:bg-green-700 disabled:opacity-50"
            aria-disabled={!editing}
          >
            <Save size={14} /> Save
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: profile card */}
        <aside className="bg-white rounded-lg shadow-sm p-5">
          <div className="flex flex-col items-center text-center gap-4">
            <div className="relative">
              <div className="w-28 h-28 rounded-full bg-gray-100 overflow-hidden border">
                {profile.avatarBase64 ? (
                  
                  <img src={profile.avatarBase64} alt="Profile avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl text-green-700">
                    {profile.displayName ? profile.displayName[0].toUpperCase() : "F"}
                  </div>
                )}
              </div>

              {/* small overlay upload button */}
              <button
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                className="absolute right-0 bottom-0 bg-white border p-1 rounded-full shadow-sm hover:bg-gray-50 focus-visible:ring-2 focus-visible:ring-green-200"
                aria-label="Change avatar"
              >
                <Camera size={16} />
              </button>
            </div>

            <div>
              <h3 className="font-semibold">{profile.displayName || "Farmer"}</h3>
              <p className="text-sm text-gray-600">{profile.farmName || "Farm name"}</p>
              <p className="mt-2 text-xs text-gray-500">{profile.bio || "No bio set yet."}</p>
            </div>

            <div className="flex gap-2 mt-3">
              <button
                onClick={() => {
                  // quick mock: go to marketplace
                  navigate("/marketplace");
                }}
                className="px-3 py-1 rounded-full bg-white border text-sm hover:bg-gray-50"
              >
                View Marketplace
              </button>

              <button
                onClick={() => removeAvatar()}
                className="px-3 py-1 rounded-full bg-red-50 text-sm text-red-600 hover:bg-red-100"
              >
                Remove Avatar
              </button>
            </div>
          </div>

          {/* small stats */}
          <div className="mt-6 grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-xs text-gray-500">Listings</div>
              <div className="font-semibold">{stats.listings}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Orders</div>
              <div className="font-semibold">{stats.orders}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Rating</div>
              <div className="font-semibold">{stats.rating.toFixed(1)}</div>
            </div>
          </div>
        </aside>

        {/* RIGHT: form (spans 2 columns on large) */}
        <section className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6">
          <form onSubmit={saveProfile} noValidate>
            {/* hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files && e.target.files[0];
                if (f) handleAvatarUpload(f);
              }}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700" htmlFor="displayName">
                  Display name
                </label>
                <input
                  id="displayName"
                  value={profile.displayName}
                  onChange={(e) => updateField("displayName", e.target.value)}
                  disabled={!editing}
                  className={`mt-1 block w-full rounded-md border px-3 py-2 ${
                    errors.displayName ? "border-red-500" : "border-gray-200"
                  } focus-visible:ring-2 focus-visible:ring-green-200`}
                />
                {errors.displayName && <p className="text-xs text-red-600 mt-1">{errors.displayName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700" htmlFor="farmName">
                  Farm name
                </label>
                <input
                  id="farmName"
                  value={profile.farmName}
                  onChange={(e) => updateField("farmName", e.target.value)}
                  disabled={!editing}
                  className={`mt-1 block w-full rounded-md border px-3 py-2 ${
                    errors.farmName ? "border-red-500" : "border-gray-200"
                  } focus-visible:ring-2 focus-visible:ring-green-200`}
                />
                {errors.farmName && <p className="text-xs text-red-600 mt-1">{errors.farmName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700" htmlFor="phone">
                  Phone
                </label>
                <input
                  id="phone"
                  value={profile.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  disabled={!editing}
                  placeholder="+91 98xx xxx xxx"
                  className={`mt-1 block w-full rounded-md border px-3 py-2 ${
                    errors.phone ? "border-red-500" : "border-gray-200"
                  } focus-visible:ring-2 focus-visible:ring-green-200`}
                />
                {errors.phone && <p className="text-xs text-red-600 mt-1">{errors.phone}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700" htmlFor="address">
                  Address
                </label>
                <input
                  id="address"
                  value={profile.address}
                  onChange={(e) => updateField("address", e.target.value)}
                  disabled={!editing}
                  className="mt-1 block w-full rounded-md border px-3 py-2 border-gray-200 focus-visible:ring-2 focus-visible:ring-green-200"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700" htmlFor="bio">
                Short bio
              </label>
              <textarea
                id="bio"
                rows={4}
                value={profile.bio}
                onChange={(e) => updateField("bio", e.target.value)}
                disabled={!editing}
                className="mt-1 block w-full rounded-md border px-3 py-2 border-gray-200 focus-visible:ring-2 focus-visible:ring-green-200"
              />
            </div>

            {/* crops tag input */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700">Primary crops</label>
              <div className="mt-2 flex gap-2 flex-wrap">
                {profile.crops.length === 0 ? (
                  <div className="text-xs text-gray-500">No crops added</div>
                ) : (
                  profile.crops.map((c) => (
                    <span
                      key={c}
                      className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 text-sm text-green-700 border border-green-100"
                    >
                      <span>{c}</span>
                      {editing && (
                        <button
                          type="button"
                          onClick={() => removeCropTag(c)}
                          aria-label={`Remove ${c}`}
                          className="text-xs text-green-700 hover:underline"
                        >
                          ✕
                        </button>
                      )}
                    </span>
                  ))
                )}
              </div>

              {/* add tag UI */}
              {editing && (
                <div className="mt-3 flex gap-2">
                  <input
                    value={cropInput}
                    onChange={(e) => setCropInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addCropTag();
                      }
                    }}
                    placeholder="Add a crop (e.g., Mango)"
                    className="flex-1 rounded-md border px-3 py-2 border-gray-200 focus-visible:ring-2 focus-visible:ring-green-200"
                    aria-label="Add crop"
                  />
                  <button
                    type="button"
                    onClick={addCropTag}
                    className="px-4 py-2 rounded-lg bg-green-600 text-white"
                  >
                    Add
                  </button>
                </div>
              )}
            </div>

            {/* actions */}
            <div className="mt-6 flex items-center justify-between gap-3">
              <div>
                {statusMsg && (
                  <div
                    className="inline-block bg-green-50 text-green-800 px-3 py-1 rounded text-sm"
                    role="status"
                    aria-live="polite"
                  >
                    {statusMsg}
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    // quick reset on demo
                    setProfile(readProfileFromStorage());
                    setStatusMsg("Changes reverted.");
                    statusTimeoutRef.current = setTimeout(() => setStatusMsg(""), 2500);
                  }}
                  className="px-4 py-2 rounded-lg bg-white border hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={!editing}
                  className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                >
                  Save profile
                </button>
              </div>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
