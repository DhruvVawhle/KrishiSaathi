// src/frontend/pages/AccountSettings.jsx
import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Save, Trash2, Download, Lock, Bell, Mail } from "lucide-react";

/**
 * AccountSettings.jsx
 * - Integrates with FarmerProfile/localStorage
 * - Emits `profile-updated` custom event when displayName/farmName/avatar changes
 *
 * Notes:
 *  - For production, replace localStorage writes with real API calls and proper auth flows.
 *  - Integrate real password change endpoint & 2FA flows on the server side.
 */

const PROFILE_KEY = "farmerProfile_v1";

function readProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // ignore
  }
  return {
    displayName: (localStorage.getItem("userEmail") || "").split("@")[0] || "",
    farmName: localStorage.getItem("farmName") || "My Farm",
    avatarBase64: "",
    phone: "",
    address: "",
    bio: "",
    crops: [],
  };
}

export default function AccountSettings() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(readProfile);
  const [prefs, setPrefs] = useState({
    emailNotifications: true,
    smsNotifications: false,
    twoFactor: false,
  });

  const [status, setStatus] = useState("");
  const statusTimer = useRef(null);

  useEffect(() => {
    // load account preferences if present
    try {
      const p = JSON.parse(localStorage.getItem("account_prefs_v1") || "{}");
      setPrefs((s) => ({ ...s, ...p }));
    } catch (e) {}
    return () => {
      if (statusTimer.current) clearTimeout(statusTimer.current);
    };
  }, []);

  const setStatusMsg = (msg = "", ms = 3000) => {
    setStatus(msg);
    if (statusTimer.current) clearTimeout(statusTimer.current);
    if (msg)
      statusTimer.current = setTimeout(() => {
        setStatus("");
      }, ms);
  };

  const updateProfileField = (k, v) => {
    setProfile((p) => ({ ...p, [k]: v }));
  };

  const saveProfile = (e) => {
    e && e.preventDefault();
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
      // keep the layout keys in sync too
      if (profile.displayName) localStorage.setItem("userEmail", `${profile.displayName}@local`);
      if (profile.farmName) localStorage.setItem("farmName", profile.farmName);

      // notify layout/header to refresh
      window.dispatchEvent(new Event("profile-updated"));

      setStatusMsg("Profile settings saved.");
    } catch (err) {
      setStatusMsg("Failed to save (storage error).");
    }
  };

  const savePrefs = () => {
    try {
      localStorage.setItem("account_prefs_v1", JSON.stringify(prefs));
      setStatusMsg("Preferences saved.");
    } catch (e) {
      setStatusMsg("Failed to save preferences.");
    }
  };

  const exportAccount = () => {
    const data = {
      profile,
      prefs,
      savedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `krishisaathi-account-${profile.displayName || "user"}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setStatusMsg("Account exported (JSON).");
  };

  const deleteAccount = () => {
    const confirmed = window.confirm(
      "This will remove your local account data from this browser (profile, prefs, mock data). This is irreversible. Continue?"
    );
    if (!confirmed) return;
    // remove keys used in this demo — adapt if you persist more
    [
      PROFILE_KEY,
      "account_prefs_v1",
      "userEmail",
      "farmName",
      "mock_listings",
      "mock_orders",
      "mock_rating",
      // add others if needed
    ].forEach((k) => localStorage.removeItem(k));
    setStatusMsg("Local account data removed.");
    // optional: navigate to login
    setTimeout(() => {
      navigate("/login");
    }, 800);
  };

  // Simulated password change (client-only)
  const changePassword = (oldPw, newPw) => {
    // NOTE: never handle real passwords without server/auth
    if (!oldPw || !newPw) {
      setStatusMsg("Enter current and new password.");
      return;
    }
    // simple client-side fake "current pw" check (if stored)
    const stored = localStorage.getItem("mock_password");
    if (stored && stored !== oldPw) {
      setStatusMsg("Current password incorrect (demo).");
      return;
    }
    localStorage.setItem("mock_password", newPw);
    setStatusMsg("Password updated (demo).");
  };

  const onAvatarUpload = (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setStatusMsg("Avatar too large (max 5MB).");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      updateProfileField("avatarBase64", reader.result);
      setStatusMsg("Avatar updated (preview).");
    };
    reader.readAsDataURL(file);
  };

  // small helpers for toggles
  const toggle = (k) => {
    setPrefs((p) => ({ ...p, [k]: !p[k] }));
  };

  return (
    <div className="max-w-5xl mx-auto">
      <header className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Account settings</h1>
          <p className="text-sm text-gray-600">Manage your account, security and preferences.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              saveProfile();
              savePrefs();
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700"
          >
            <Save size={14} /> Save all
          </button>

          <button
            onClick={exportAccount}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white border hover:bg-gray-50"
          >
            <Download size={14} /> Export
          </button>

          <button
            onClick={deleteAccount}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* left: account + security */}
        <section className="bg-white rounded-lg shadow-sm p-5">
          <h2 className="text-lg font-medium mb-3">Account</h2>

          <label className="block text-sm font-medium text-gray-700">Display name</label>
          <input
            value={profile.displayName}
            onChange={(e) => updateProfileField("displayName", e.target.value)}
            className="mt-1 mb-3 block w-full rounded-md border px-3 py-2 border-gray-200 focus-visible:ring-2 focus-visible:ring-green-200"
          />

          <label className="block text-sm font-medium text-gray-700">Email (login)</label>
          <input
            value={(localStorage.getItem("userEmail") && localStorage.getItem("userEmail")) || ""}
            onChange={(e) => {
              // store as local "userEmail" key — for demo only
              localStorage.setItem("userEmail", e.target.value);
              setStatusMsg("Email updated locally (demo).");
            }}
            placeholder="you@example.com"
            className="mt-1 mb-3 block w-full rounded-md border px-3 py-2 border-gray-200 focus-visible:ring-2 focus-visible:ring-green-200"
            aria-label="Email"
          />

          <label className="block text-sm font-medium text-gray-700">Farm name</label>
          <input
            value={profile.farmName}
            onChange={(e) => updateProfileField("farmName", e.target.value)}
            className="mt-1 mb-3 block w-full rounded-md border px-3 py-2 border-gray-200 focus-visible:ring-2 focus-visible:ring-green-200"
          />

          <div className="mt-4">
            <h3 className="text-sm font-medium mb-2">Avatar</h3>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center border">
                {profile.avatarBase64 ? (
                  // eslint-disable-next-line jsx-a11y/img-redundant-alt
                  <img src={profile.avatarBase64} alt="avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-xl text-green-700 font-semibold">{(profile.displayName || "F")[0].toUpperCase()}</div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label className="inline-flex items-center gap-2 cursor-pointer px-3 py-1 rounded bg-white border hover:bg-gray-50">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files && e.target.files[0];
                      if (f) onAvatarUpload(f);
                    }}
                    className="hidden"
                  />
                  <span className="inline-flex items-center gap-2 text-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 15a4 4 0 004 4h10a4 4 0 004-4M8 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    Change
                  </span>
                </label>

                <button
                  onClick={() => {
                    updateProfileField("avatarBase64", "");
                    setStatusMsg("Avatar removed.");
                  }}
                  className="px-3 py-1 text-sm rounded bg-red-50 text-red-600"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-medium mb-2">Security</h3>

            <div className="mb-3">
              <label className="block text-sm text-gray-600">Change password (demo)</label>
              <PasswordChange onSave={(oldPw, newPw) => changePassword(oldPw, newPw)} />
              <p className="text-xs text-gray-500 mt-1">This demo stores a mock password in localStorage — replace with API.</p>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="twoFactor"
                type="checkbox"
                checked={prefs.twoFactor}
                onChange={() => toggle("twoFactor")}
                className="h-4 w-4"
              />
              <label htmlFor="twoFactor" className="text-sm">
                Two-factor authentication (UI only)
              </label>
            </div>
          </div>
        </section>

        {/* right: preferences */}
        <aside className="lg:col-span-2 bg-white rounded-lg shadow-sm p-5 space-y-6">
          <div>
            <h2 className="text-lg font-medium mb-3">Preferences</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded">
                <div className="flex items-start gap-3">
                  <Mail size={20} />
                  <div>
                    <div className="font-semibold">Email notifications</div>
                    <div className="text-sm text-gray-500">Updates about orders, messages and promotions.</div>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="text-sm text-gray-700">Enable</div>
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" checked={prefs.emailNotifications} onChange={() => toggle("emailNotifications")} />
                  </label>
                </div>
              </div>

              <div className="p-4 border rounded">
                <div className="flex items-start gap-3">
                  <Bell size={20} />
                  <div>
                    <div className="font-semibold">SMS alerts</div>
                    <div className="text-sm text-gray-500">Optional SMS alerts for urgent updates.</div>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="text-sm text-gray-700">Enable</div>
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" checked={prefs.smsNotifications} onChange={() => toggle("smsNotifications")} />
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <button onClick={savePrefs} className="px-4 py-2 rounded bg-green-600 text-white">
                Save preferences
              </button>
              <button onClick={() => { setPrefs({ emailNotifications: true, smsNotifications: false, twoFactor: prefs.twoFactor }); setStatusMsg("Preferences reset"); }} className="px-3 py-2 rounded bg-white border">
                Reset
              </button>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-medium mb-3">Account tools</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded flex flex-col">
                <div className="flex items-center gap-3">
                  <Download />
                  <div>
                    <div className="font-semibold">Export account data</div>
                    <div className="text-sm text-gray-500">Download a JSON snapshot of your profile and preferences.</div>
                  </div>
                </div>

                <div className="mt-3">
                  <button onClick={exportAccount} className="px-3 py-2 rounded bg-white border inline-flex items-center gap-2">
                    <Download size={14} /> Export JSON
                  </button>
                </div>
              </div>

              <div className="p-4 border rounded flex flex-col">
                <div className="flex items-center gap-3">
                  <Trash2 />
                  <div>
                    <div className="font-semibold">Delete local account</div>
                    <div className="text-sm text-gray-500">Removes local demo data from this browser.</div>
                  </div>
                </div>

                <div className="mt-3">
                  <button onClick={deleteAccount} className="px-3 py-2 rounded bg-red-50 text-red-600">
                    Delete account
                  </button>
                </div>
              </div>
            </div>
          </div>

          {status && (
            <div className="p-3 rounded bg-green-50 text-green-800 text-sm" role="status" aria-live="polite">
              {status}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

/* --- small helper component for password change UI --- */
function PasswordChange({ onSave }) {
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [msg, setMsg] = useState("");

  const submit = () => {
    if (!oldPw || !newPw) {
      setMsg("Both fields required.");
      return;
    }
    if (newPw.length < 6) {
      setMsg("New password must be at least 6 characters.");
      return;
    }
    if (newPw !== confirmPw) {
      setMsg("Passwords do not match.");
      return;
    }
    // pass to parent handler (demo)
    onSave && onSave(oldPw, newPw);
    setMsg("Password changed (demo).");
    setOldPw("");
    setNewPw("");
    setConfirmPw("");
    setTimeout(() => setMsg(""), 2500);
  };

  return (
    <div className="space-y-2 mt-2">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <input
          type="password"
          placeholder="Current password"
          value={oldPw}
          onChange={(e) => setOldPw(e.target.value)}
          className="px-3 py-2 rounded border"
        />
        <input
          type="password"
          placeholder="New password"
          value={newPw}
          onChange={(e) => setNewPw(e.target.value)}
          className="px-3 py-2 rounded border"
        />
        <input
          type="password"
          placeholder="Confirm"
          value={confirmPw}
          onChange={(e) => setConfirmPw(e.target.value)}
          className="px-3 py-2 rounded border"
        />
      </div>

      <div className="flex items-center gap-2">
        <button type="button" onClick={submit} className="px-3 py-2 rounded bg-white border">
          <Lock size={14} /> Update password
        </button>
        {msg && <div className="text-sm text-gray-600">{msg}</div>}
      </div>
    </div>
  );
}
