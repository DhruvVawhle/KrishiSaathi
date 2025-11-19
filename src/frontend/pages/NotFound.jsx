// src/pages/NotFound.jsx
import React, { useState, useRef, useEffect, Suspense } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Search, ShoppingBag, Mail, ArrowLeft } from "lucide-react";
import { Helmet } from "react-helmet-async";

const NotFound = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);
  const [imgError, setImgError] = useState(false);

  // Autofocus search
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 300);
    return () => clearTimeout(t);
  }, []);

  const submitSearch = (e) => {
    e?.preventDefault();
    const q = query.trim();
    navigate(q ? `/marketplace?q=${encodeURIComponent(q)}` : "/marketplace");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100 p-6 relative overflow-hidden">
      <Helmet>
        <title>Page Not Found – KisanBazaar</title>
      </Helmet>

      {/* Decorative background shapes */}
      <Suspense fallback={null}>
        <svg
          className="hidden md:block absolute left-[-8%] top-[-8%] opacity-30"
          width="650"
          height="650"
          viewBox="0 0 600 600"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <g transform="translate(50,50)">
            <circle cx="200" cy="150" r="160" fill="#D1FAE5" />
            <circle cx="360" cy="300" r="140" fill="#BBF7D0" />
          </g>
        </svg>

        <svg
          className="absolute right-[-6%] bottom-[-6%] opacity-20"
          width="420"
          height="420"
          viewBox="0 0 600 600"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <g transform="translate(0,40)">
            <ellipse cx="300" cy="300" rx="260" ry="160" fill="#ECFCCB" />
          </g>
        </svg>
      </Suspense>

      <AnimatePresence mode="wait">
        <motion.main
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 w-full max-w-3xl bg-white rounded-2xl shadow-2xl p-8 sm:p-12"
          role="main"
          aria-labelledby="notfound-title"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-green-600 to-green-400 text-white font-bold flex items-center justify-center shadow">
                KB
              </div>
              <div>
                <h2 id="notfound-title" className="text-lg font-bold text-gray-800">
                  Page not found
                </h2>
                <p className="text-xs text-gray-500">
                  We can’t find the page you’re looking for.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate(-1)}
                aria-label="Go back"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border border-gray-200 hover:bg-gray-50 focus:ring-2 focus:ring-green-200"
              >
                <ArrowLeft size={16} /> Back
              </button>

              <Link
                to="/"
                aria-label="Go to homepage"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-600 text-white text-sm hover:bg-green-700 focus:ring-2 focus:ring-green-300"
              >
                <Home size={16} /> Home
              </Link>
            </div>
          </div>

          {/* Body */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="flex flex-col items-center text-center md:text-left">
              <img
                src={
                  imgError
                    ? "https://via.placeholder.com/256x160?text=404"
                    : "https://illustrations.popsy.co/violet/404-error.svg"
                }
                alt="404 Illustration"
                className="w-56 h-auto mb-4"
                onError={() => setImgError(true)}
              />

              <h1 className="text-5xl font-extrabold text-green-700 leading-tight mb-2">
                404
              </h1>
              <p className="text-gray-700 mb-4">
                Oops — the page you’re looking for doesn’t exist or has been moved.
              </p>

              <div className="flex flex-wrap gap-3 justify-center md:justify-start mt-2">
                <button
                  onClick={() => navigate("/marketplace")}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-white font-semibold focus:ring-2 focus:ring-yellow-200"
                >
                  <ShoppingBag size={16} /> Browse Marketplace
                </button>

                <a
                  href="mailto:support@kisanbazaar.app?subject=Broken%20link%20(404)"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-sm font-medium focus:ring-2 focus:ring-green-200"
                >
                  <Mail size={16} /> Report issue
                </a>
              </div>
            </div>

            {/* Search */}
            <form onSubmit={submitSearch} className="flex flex-col gap-4">
              <label htmlFor="notfound-search" className="sr-only">
                Search marketplace
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-green-600">
                  <Search size={18} />
                </span>
                <input
                  id="notfound-search"
                  ref={inputRef}
                  type="search"
                  placeholder="Search fresh produce (e.g. tomatoes)..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-300 focus:border-transparent"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold focus:ring-2 focus:ring-green-300"
                >
                  <Search size={16} /> Search
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    inputRef.current?.focus();
                  }}
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm"
                >
                  Clear
                </button>
              </div>

              <div className="text-sm text-gray-600 mt-2">
                Quick links:
                <div className="flex flex-wrap gap-2 mt-2">
                  <Link to="/" className="text-green-700 hover:underline text-sm">
                    Home
                  </Link>
                  <Link
                    to="/marketplace"
                    className="text-green-700 hover:underline text-sm"
                  >
                    Marketplace
                  </Link>
                  <Link to="/about" className="text-green-700 hover:underline text-sm">
                    About
                  </Link>
                  <a
                    href="mailto:support@kisanbazaar.app"
                    className="text-green-700 hover:underline text-sm"
                  >
                    Contact
                  </a>
                </div>
              </div>
            </form>
          </div>

          <footer className="mt-6 text-center text-xs text-gray-400">
            © {new Date().getFullYear()} KisanBazaar — Fresh · Local · Trusted
          </footer>
        </motion.main>
      </AnimatePresence>
    </div>
  );
};

export default NotFound;
