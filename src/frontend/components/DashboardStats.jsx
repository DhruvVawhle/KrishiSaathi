// ✅ src/components/DashboardStats.jsx (Enhanced v2)
import React, { useMemo, useEffect, useState } from "react";
import { useProducts } from "@/frontend/contexts/ProductContext";
import {
  ShoppingCart,
  Clock,
  CheckCircle,
  TrendingUp,
  Printer,
  Copy,
  Info,
} from "lucide-react";
import { motion } from "motion/react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart as RePieChart,
  Pie,
  Cell,
} from "recharts";
import { toast } from "react-toastify";

const COLORS = ["#16A34A", "#4CAF50", "#A3E635", "#F59E0B", "#EF4444"];
const tinyAnimate = { whileHover: { y: -3 }, transition: { type: "spring", stiffness: 260 } };

const DashboardStats = () => {
  const { products } = useProducts();
  const [orders, setOrders] = useState([]);
  const [demoMode, setDemoMode] = useState(false);

  // ✅ Load orders from multiple sources safely
  const loadOrders = () => {
    try {
      const email = localStorage.getItem("userEmail") || "guest";
      const all = [];
      const byUser = JSON.parse(localStorage.getItem(`orders_${email}`) || "[]");
      const generic = JSON.parse(localStorage.getItem("orders") || "[]");
      const snap = JSON.parse(localStorage.getItem("lastOrderSnapshot") || "null");

      if (Array.isArray(byUser)) all.push(...byUser);
      if (Array.isArray(generic)) all.push(...generic);
      if (snap && snap.id && !all.find((o) => o.id === snap.id)) all.push(snap);

      const unique = Object.values(
        all.reduce((acc, o) => {
          const key = o.id || o._id || `temp_${Math.random()}`;
          acc[key] = o;
          return acc;
        }, {})
      ).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setOrders(unique);
    } catch (err) {
      console.warn("Error loading orders:", err);
      setOrders([]);
    }
  };

  useEffect(() => {
    loadOrders();
    const onStorage = (e) => {
      if (e.key?.startsWith("orders")) {
        clearTimeout(window.__loadOrdersTimeout);
        window.__loadOrdersTimeout = setTimeout(loadOrders, 300);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
      clearTimeout(window.__loadOrdersTimeout);
    };
  }, []);

  // ✅ Generate demo data if no orders exist
  useEffect(() => {
    if (!orders || orders.length === 0) {
      const now = Date.now();
      const mock = Array.from({ length: 7 }).map((_, i) => ({
        id: `mock-${i}`,
        createdAt: new Date(now - (6 - i) * 86400000).toISOString(),
        total: Math.round(1200 + Math.random() * 4000),
        status: Math.random() > 0.5 ? "completed" : "pending",
      }));
      setOrders(mock);
      setDemoMode(true);
    }
  }, [orders]);

  // KPIs
  const totalProducts = products?.length || 0;
  const ordersStats = useMemo(() => {
    const completed = orders.filter((o) => o.status === "completed").length;
    const pending = orders.filter((o) => o.status === "pending").length;
    const revenue = orders.reduce((s, o) => s + Number(o.total || 0), 0);
    return { completed, pending, revenue };
  }, [orders]);

  // Revenue trend (last 7 days)
  const revenueSeries = useMemo(() => {
    const map = {};
    for (let i = 6; i >= 0; i--) {
      const date = new Date(Date.now() - i * 86400000);
      const key = date.toISOString().slice(0, 10);
      map[key] = 0;
    }
    orders.forEach((o) => {
      const d = new Date(o.createdAt || Date.now()).toISOString().slice(0, 10);
      if (map[d] !== undefined) map[d] += Number(o.total || 0);
    });
    return Object.entries(map).map(([date, value]) => ({ date: date.slice(5), value }));
  }, [orders]);

  // Category breakdown
  const categoryBreakdown = useMemo(() => {
    const counts = (products || []).reduce((acc, p) => {
      const cat = p.category || "Other";
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [products]);

  // Simple animated numbers
  const AnimatedNumber = ({ target = 0, prefix = "", className = "" }) => {
    const [val, setVal] = useState(0);
    useEffect(() => {
      let raf;
      const start = performance.now();
      const from = val;
      const to = Number(target) || 0;
      const duration = 600;
      const step = (t) => {
        const p = Math.min(1, (t - start) / duration);
        const cur = Math.round(from + (to - from) * p);
        setVal(cur);
        if (p < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
      return () => cancelAnimationFrame(raf);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [target]);
    return (
      <span className={`tabular-nums ${className}`}>
        {prefix}
        {val.toLocaleString()}
      </span>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-6"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-green-700">📊 Farmer Dashboard</h2>
            <p className="text-sm text-gray-600">
              Overview of your products, orders, and recent revenue
            </p>
          </div>

          <div className="flex gap-2">
            <button
              className="flex items-center gap-1 px-3 py-2 bg-white border rounded-md text-sm hover:shadow-sm"
              onClick={() => window.print()}
            >
              <Printer className="w-4 h-4" /> Print
            </button>
            <button
              className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
              onClick={() => {
                const summary = { products: totalProducts, revenue: ordersStats.revenue };
                navigator.clipboard.writeText(JSON.stringify(summary, null, 2));
                toast.success("📋 Summary copied!", { autoClose: 1600 });
              }}
            >
              <Copy className="w-4 h-4" /> Copy Summary
            </button>
          </div>
        </div>

        {/* Demo Mode Banner */}
        {demoMode && (
          <div className="flex items-center gap-2 mb-5 bg-yellow-50 border border-yellow-200 p-3 rounded-md text-sm text-yellow-800">
            <Info className="w-4 h-4" /> Displaying demo data — no real orders yet.
          </div>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            {
              label: "Total Products",
              value: totalProducts,
              icon: <ShoppingCart className="text-green-600" />,
              color: "bg-green-50",
              note: "Active listings",
            },
            {
              label: "Pending Orders",
              value: ordersStats.pending,
              icon: <Clock className="text-yellow-600" />,
              color: "bg-yellow-50",
              note: "Awaiting processing",
            },
            {
              label: "Completed Sales",
              value: ordersStats.completed,
              icon: <CheckCircle className="text-blue-600" />,
              color: "bg-blue-50",
              note: "Orders fulfilled",
            },
            {
              label: "Total Revenue",
              value: ordersStats.revenue,
              icon: <TrendingUp className="text-emerald-600" />,
              color: "bg-emerald-50",
              note: "From confirmed orders",
              prefix: "₹",
            },
          ].map((kpi) => (
            <motion.div
              key={kpi.label}
              {...tinyAnimate}
              className="bg-white p-4 rounded-xl shadow-sm flex items-start gap-4 border border-gray-100"
              aria-label={kpi.label}
            >
              <div className={`p-3 rounded-lg ${kpi.color}`}>{kpi.icon}</div>
              <div className="flex-1">
                <div className="text-sm text-gray-500">{kpi.label}</div>
                <div className="text-2xl font-bold text-gray-800">
                  <AnimatedNumber target={Math.round(kpi.value)} prefix={kpi.prefix || ""} />
                </div>
                <div className="text-xs text-gray-400 mt-1">{kpi.note}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Area Chart */}
          <div className="lg:col-span-2 bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-md font-semibold text-gray-800">Revenue (7 days)</h3>
              <div className="text-xs text-gray-500">Auto-updated</div>
            </div>
            <div className="w-full h-44 min-w-[280px]">
              <ResponsiveContainer width="99%" height="100%">
                <AreaChart data={revenueSeries}>
                  <defs>
                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16A34A" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#16A34A" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#6B7280" }} />
                  <YAxis tickFormatter={(v) => `₹${v}`} tick={{ fontSize: 12, fill: "#6B7280" }} />
                  <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                  <Tooltip formatter={(val) => `₹${Number(val).toLocaleString()}`} />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#16A34A"
                    fill="url(#colorRev)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pie Chart */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <h3 className="text-md font-semibold text-gray-800 mb-3">Category Breakdown</h3>
            <div className="w-full h-32">
              {categoryBreakdown.length === 0 ? (
                <p className="text-sm text-gray-500">No category data</p>
              ) : (
                <ResponsiveContainer width="99%" height="100%">
                  <RePieChart>
                    <Pie
                      data={categoryBreakdown}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={30}
                      outerRadius={48}
                      paddingAngle={4}
                    >
                      {categoryBreakdown.map((entry, idx) => (
                        <Cell key={entry.name} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                  </RePieChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="mt-3 space-y-2">
              {categoryBreakdown.map((c, i) => (
                <div key={c.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[i % COLORS.length] }}
                    />
                    <span className="text-gray-700">{c.name}</span>
                  </div>
                  <div className="text-gray-600">{c.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-sm text-gray-500">Quick insights</p>
              <p className="text-sm text-gray-700">
                {totalProducts} products • {ordersStats.completed} completed •{" "}
                {ordersStats.pending} pending
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => toast.info("📤 Export not implemented (demo)", { autoClose: 1200 })}
                className="px-3 py-2 border rounded-md text-sm hover:bg-gray-50"
              >
                Export CSV
              </button>
              <button
                onClick={() => window.location.assign("/farmer-dashboard")}
                className="px-3 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
              >
                Manage Products
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default DashboardStats;
