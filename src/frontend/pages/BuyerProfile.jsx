// src/pages/BuyerProfile.jsx
import React, { useEffect, useState, useCallback } from "react";
import { auth, db } from "../config/firebaseConfig";
import { onAuthStateChanged, updateProfile as updateAuthProfile } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { Download, Edit3, Save, X, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import OrderHistory from "./OrderHistory";
import axios from "axios";

/**
 * BuyerProfile (modernized)
 * - Glassy profile card with avatar initial
 * - Inline edit mode with validation and clear save flow
 * - Export CSV action + export PDF button
 * - Order history panel embedded
 */

const API_BASE = import.meta.env.VITE_API_BASE?.trim() ? import.meta.env.VITE_API_BASE : "http://localhost:5000";

const BuyerProfile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [profileData, setProfileData] = useState({
    fullName: "",
    phone: "",
    address: "",
    city: "",
    pincode: "",
  });

  // Load user + sync
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setUser(null);
        setLoading(false);
        return;
      }
      setUser(u);
      setLoading(true);
      setSyncing(true);

      const cached = localStorage.getItem("buyerProfile");
      if (cached) setProfileData(JSON.parse(cached));

      const withTimeout = (p, ms = 5000) =>
        Promise.race([p, new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), ms))]);

      try {
        const [fireRes, mongoRes] = await Promise.allSettled([
          withTimeout(fetchUserProfile(u.uid), 6000),
          withTimeout(fetchFromMongo(u.email), 5000),
        ]);

        if (fireRes.status === "rejected" && mongoRes.status === "rejected") {
          toast.error("⚠️ Failed to sync profile from servers.");
        }
      } catch (err) {
        console.error("Profile sync error:", err);
      } finally {
        setLoading(false);
        setSyncing(false);
      }
    });

    return () => unsub();
  }, []);

  // Fetch firebase profile
  const fetchUserProfile = async (uid) => {
    const userRef = doc(db, "buyers", uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const data = snap.data();
      setProfileData((prev) => ({ ...prev, ...data }));
      localStorage.setItem("buyerProfile", JSON.stringify({ ...prev, ...data }));
    } else {
      const newDoc = {
        fullName: auth.currentUser?.displayName || "",
        phone: "",
        address: "",
        city: "",
        pincode: "",
        createdAt: serverTimestamp(),
      };
      await setDoc(userRef, newDoc, { merge: true });
      setProfileData((prev) => ({ ...prev, ...newDoc }));
      localStorage.setItem("buyerProfile", JSON.stringify(newDoc));
    }
  };

  // Fetch from Mongo if available
  const fetchFromMongo = async (email) => {
    try {
      const res = await axios.get(`${API_BASE}/api/users/profile`, { params: { email }, timeout: 5000 });
      if (res.data?.email) {
        const mongoData = res.data;
        const merged = {
          fullName: mongoData.fullName || profileData.fullName,
          phone: mongoData.phone || profileData.phone,
          address: mongoData.address || profileData.address,
          city: mongoData.city || profileData.city,
          pincode: mongoData.pincode || profileData.pincode,
        };
        setProfileData((prev) => ({ ...prev, ...merged }));
        localStorage.setItem("buyerProfile", JSON.stringify(merged));
      }
    } catch (err) {
      console.warn("Mongo fetch skipped or timed out:", err?.message || err);
    }
  };

  // Save profile
  const handleSaveProfile = async () => {
    if (!user) return;
    if (!profileData.fullName.trim()) return toast.warning("Full name required");
    if (profileData.phone && !/^\d{10}$/.test(profileData.phone)) return toast.warning("Enter a valid 10-digit phone number");
    if (profileData.pincode && !/^\d{6}$/.test(profileData.pincode)) return toast.warning("Enter a valid 6-digit pincode");

    setIsSaving(true);
    try {
      const userRef = doc(db, "buyers", user.uid);
      try {
        await updateDoc(userRef, { ...profileData, updatedAt: serverTimestamp() });
      } catch (fireErr) {
        console.warn("Firestore update failed, trying setDoc:", fireErr?.message || fireErr);
        try {
          await setDoc(userRef, { ...profileData, createdAt: serverTimestamp() }, { merge: true });
        } catch (setErr) {
          console.warn("setDoc also failed:", setErr?.message || setErr);
        }
      }

      try {
        await updateAuthProfile(user, { displayName: profileData.fullName });
      } catch (authErr) {
        console.warn("Auth profile update failed:", authErr?.message || authErr);
      }

      // Optional backend sync
      try {
        const res = await axios.post(`${API_BASE}/api/users/sync-profile`, { email: user.email, ...profileData }, { timeout: 8000 });
        if (res?.status === 200) toast.success("Profile synced with backend");
        else toast.info("Profile saved locally. Backend did not confirm sync.");
      } catch (syncErr) {
        console.warn("Mongo sync skipped or failed:", syncErr?.message || syncErr);
        toast.info("Profile saved locally. Backend sync skipped.");
      }

      localStorage.setItem("buyerProfile", JSON.stringify(profileData));
      const checkoutCopy = {
        name: profileData.fullName,
        fullName: profileData.fullName,
        email: user.email,
        phone: profileData.phone,
        address: profileData.address,
        city: profileData.city,
        pincode: profileData.pincode,
      };
      localStorage.setItem("checkoutData", JSON.stringify(checkoutCopy));
      localStorage.setItem("userName", profileData.fullName || "");
      localStorage.setItem("userEmail", user.email || "");

      toast.success("✅ Profile updated!");
      setEditing(false);
    } catch (err) {
      console.error("Profile save error:", err);
      toast.error("Failed to save profile");
    } finally {
      setTimeout(() => setIsSaving(false), 200);
    }
  };

  const exportProfileInfo = useCallback(() => {
    if (!user) return toast.info("No profile to export");
    const rows = [
      ["Field", "Value"],
      ["Name", profileData.fullName],
      ["Email", user.email],
      ["Phone", profileData.phone],
      ["Address", profileData.address],
      ["City", profileData.city],
      ["Pincode", profileData.pincode],
      ["UID", user.uid],
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `BuyerProfile_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Profile exported successfully");
  }, [user, profileData]);

  // Loading UI
  if (loading) {
    return <div className="text-center py-20 text-gray-600 animate-pulse">Loading your profile…</div>;
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-72 text-center">
        <img src="https://illustrations.popsy.co/violet/sign-up.svg" alt="Login required" className="w-56 mb-4" />
        <p className="text-gray-700 text-lg">Please <span className="text-green-600 font-semibold">log in</span> to access your profile and order history.</p>
        <a href="/login" className="mt-3 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md">Go to Login</a>
      </div>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-6 py-10 space-y-8 pb-20">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-3xl font-bold text-green-700">👤 My Profile</h1>
        <div className="flex items-center gap-3">
          {syncing && (
            <span className="flex items-center gap-2 text-gray-500 text-sm">
              <Loader2 size={14} className="animate-spin" /> Syncing…
            </span>
          )}
          <button onClick={exportProfileInfo} className="inline-flex items-center gap-2 bg-white border px-3 py-2 rounded-md hover:bg-gray-50">
            <Download size={14} /> Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* PROFILE CARD */}
        <div className="lg:col-span-1 bg-white/85 backdrop-blur-md border border-white/60 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center text-green-700 text-2xl font-semibold">
              {profileData.fullName ? profileData.fullName[0].toUpperCase() : (user.email ? user.email[0].toUpperCase() : "?")}
            </div>
            <div>
              <div className="text-lg font-semibold text-gray-800">{profileData.fullName || user.displayName || "—"}</div>
              <div className="text-sm text-gray-500">{user.email}</div>
            </div>
          </div>

          <div className="mt-4">
            {!editing ? (
              <>
                <div className="text-sm text-gray-700 space-y-2">
                  <p><strong>Phone:</strong> {profileData.phone || "Not provided"}</p>
                  <p><strong>Address:</strong> {profileData.address || "Not provided"}</p>
                  <p><strong>City:</strong> {profileData.city || "Not provided"}</p>
                  <p><strong>Pincode:</strong> {profileData.pincode || "Not provided"}</p>
                </div>

                <div className="mt-4 flex gap-2">
                  <button onClick={() => setEditing(true)} className="px-4 py-2 rounded-md border hover:bg-gray-50 inline-flex items-center gap-2">
                    <Edit3 size={16} /> Edit
                  </button>
                  <button onClick={() => { navigator.clipboard.writeText(user.email || ""); toast.info("Email copied"); }} className="px-4 py-2 rounded-md border hover:bg-gray-50 text-sm">Copy Email</button>
                </div>
              </>
            ) : (
              <>
                <div className="mt-3 space-y-3">
                  <label className="text-sm text-gray-700">Full name</label>
                  <input value={profileData.fullName} onChange={(e) => setProfileData((p) => ({ ...p, fullName: e.target.value }))} className="w-full border rounded-md px-3 py-2" />
                  <label className="text-sm text-gray-700">Phone</label>
                  <input value={profileData.phone} onChange={(e) => setProfileData((p) => ({ ...p, phone: e.target.value }))} className="w-full border rounded-md px-3 py-2" />
                  <label className="text-sm text-gray-700">Address</label>
                  <textarea value={profileData.address} onChange={(e) => setProfileData((p) => ({ ...p, address: e.target.value }))} rows={3} className="w-full border rounded-md px-3 py-2" />
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm text-gray-700">City</label>
                      <input value={profileData.city} onChange={(e) => setProfileData((p) => ({ ...p, city: e.target.value }))} className="w-full border rounded-md px-3 py-2" />
                    </div>
                    <div>
                      <label className="text-sm text-gray-700">Pincode</label>
                      <input value={profileData.pincode} onChange={(e) => setProfileData((p) => ({ ...p, pincode: e.target.value }))} className="w-full border rounded-md px-3 py-2" />
                    </div>
                  </div>

                  <div className="mt-3 flex gap-2">
                    <button onClick={handleSaveProfile} disabled={isSaving} className="px-4 py-2 bg-green-600 text-white rounded-md inline-flex items-center gap-2">
                      {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} {isSaving ? "Saving…" : "Save"}
                    </button>
                    <button onClick={() => setEditing(false)} className="px-4 py-2 rounded-md border hover:bg-gray-50 inline-flex items-center gap-2"><X size={14} /> Cancel</button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ORDER HISTORY / DETAILS */}
        <div className="lg:col-span-2 space-y-4">
          <section className="bg-white rounded-2xl border p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">📦 My Order History</h2>
              <div className="text-sm text-gray-500">Quick view of your latest orders</div>
            </div>

            <div className="mt-4">
              {/* Reuse your OrderHistory component (embedded) */}
              <OrderHistory userEmail={user.email} embedded />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
};

export default BuyerProfile;
