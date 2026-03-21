// src/pages/BuyerOrders.jsx
import React, { useEffect, useState, useMemo, useRef } from "react";
import { auth, db } from "@/frontend/config/firebaseConfig";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  limit,
} from "firebase/firestore";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { motion, AnimatePresence } from "framer-motion";
import { Download, FileText, ChevronLeft, ChevronRight, Search as SearchIcon } from "lucide-react";

/**
 * BuyerOrders (modernized)
 * - Glassmorphic header + card list + table view toggle
 * - Pagination & lightweight client-side filtering
 * - Improved invoice export + copy ID + cancel flow
 * - Accessibility improvements and keyboard-friendly controls
 */

/* --- Helpers --- */
const formatDate = (ts) => {
  try {
    if (!ts) return "Unknown";
    if (ts.toDate) return ts.toDate().toLocaleString();
    if (ts.seconds) return new Date(ts.seconds * 1000).toLocaleString();
    return new Date(ts).toLocaleString();
  } catch {
    return "Unknown";
  }
};

const currency = (n) => `₹${Number(n || 0).toFixed(2)}`;

/* --- Status colors map --- */
const statusClasses = {
  Delivered: "bg-green-100 text-green-800",
  Pending: "bg-yellow-100 text-yellow-800",
  Cancelled: "bg-red-100 text-red-800",
  default: "bg-gray-100 text-gray-800",
};

const PAGE_SIZE = 8;

const BuyerOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [queryText, setQueryText] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [viewMode, setViewMode] = useState("cards"); // cards | table
  const [page, setPage] = useState(1);
  const lastToastRef = useRef(0);

  // Role check (defensive)
  useEffect(() => {
    const role = localStorage.getItem("userRole");
    if (role && role !== "buyer") {
      toast.warn("Access denied — buyers only");
      setTimeout(() => (window.location.href = "/"), 1200);
    }
  }, []);

  // Realtime orders subscriber
  useEffect(() => {
    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (!user) {
        setOrders([]);
        setLoading(false);
        return;
      }

      const ordersRef = collection(db, "orders");
      const q = query(
        ordersRef,
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc"),
        limit(200)
      );

      const unsubOrders = onSnapshot(
        q,
        (snap) => {
          setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
          setLoading(false);
        },
        (err) => {
          const now = Date.now();
          if (now - lastToastRef.current > 3000) {
            toast.error("⚠️ Failed to fetch orders. Check your connection.");
            lastToastRef.current = now;
          }
          setLoading(false);
        }
      );

      return () => unsubOrders();
    });

    return () => unsubAuth();
  }, []);

  // Filters & search (memoized)
  const filtered = useMemo(() => {
    const q = queryText.trim().toLowerCase();
    return orders.filter((o) => {
      const matchesText =
        !q ||
        o.id.toLowerCase().includes(q) ||
        (o.customerName || "").toLowerCase().includes(q);
      const matchesStatus = statusFilter === "All" || (o.status || "Pending") === statusFilter;
      return matchesText && matchesStatus;
    });
  }, [orders, queryText, statusFilter]);

  // Pagination calculations
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [pageCount]);

  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  /* --- Invoice generation (improved layout) --- */
  const generateInvoice = (order) => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });

    doc.setFontSize(20);
    doc.setTextColor("#0f5132");
    doc.text("KrishiSaathi — Invoice", 40, 60);

    doc.setFontSize(11);
    doc.setTextColor("#333");
    doc.text(`Order ID: ${order.id}`, 40, 90);
    doc.text(`Status: ${order.status || "Pending"}`, 40, 106);
    doc.text(`Placed: ${formatDate(order.createdAt)}`, 40, 122);
    doc.text(`Customer: ${order.customerName || "—"}`, 40, 138);

    const body = (order.items || []).map((it, i) => [
      i + 1,
      it.name,
      it.quantity,
      currency(it.price),
      currency(it.price * it.quantity),
    ]);

    doc.autoTable({
      startY: 160,
      head: [["#", "Product", "Qty", "Price", "Subtotal"]],
      body,
      headStyles: { fillColor: [22, 101, 52] },
      theme: "grid",
    });

    const subtotal = (order.items || []).reduce((s, it) => s + it.price * it.quantity, 0);
    const tax = subtotal * 0.05;
    const total = subtotal + tax;

    const finalY = doc.lastAutoTable?.finalY ? doc.lastAutoTable.finalY + 20 : 260;
    doc.setFontSize(12);
    doc.text(`Subtotal: ${currency(subtotal)}`, 40, finalY);
    doc.text(`Tax (5%): ${currency(tax)}`, 40, finalY + 16);
    doc.setFont("helvetica", "bold");
    doc.text(`Total: ${currency(total)}`, 40, finalY + 36);
    doc.setFont("helvetica", "normal");

    doc.setFontSize(10);
    doc.text("Thank you for supporting local farmers — KrishiSaathi 🌾", 40, finalY + 60);

    doc.save(`Invoice_${order.id}.pdf`);
  };

  const copyOrderId = async (id) => {
    try {
      await navigator.clipboard.writeText(id);
      toast.success("✅ Order ID copied!");
    } catch {
      toast.error("Failed to copy Order ID");
    }
  };

  const cancelOrder = async (order) => {
    if (!order.id || order.status !== "Pending") {
      toast.info("Only pending orders can be cancelled.");
      return;
    }
    if (!window.confirm(`Cancel order ${order.id}? This cannot be undone.`)) return;

    setUpdatingOrderId(order.id);
    try {
      await updateDoc(doc(db, "orders", order.id), {
        status: "Cancelled",
        cancelledAt: new Date(),
      });
      toast.success("🚫 Order cancelled");
    } catch (err) {
      console.error(err);
      toast.error("Failed to cancel order.");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Loading placeholder
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="space-y-2 animate-pulse text-center">
          <div className="h-6 w-64 bg-gray-200 rounded mx-auto" />
          <div className="h-4 w-48 bg-gray-200 rounded mx-auto" />
        </div>
      </div>
    );
  }

  if (!auth.currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
        <div className="max-w-md bg-white p-8 rounded-xl shadow text-center">
          <h2 className="text-2xl font-bold text-green-700 mb-3">Please login to view orders</h2>
          <p className="text-gray-600 mb-5">Orders are linked to your account.</p>
          <a href="/login" className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-md font-medium">Go to Login</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* header: glass card */}
        <div className="bg-white/80 backdrop-blur-md border border-white/60 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">📦 My Orders</h1>
            <p className="text-sm text-gray-500">Track status, download invoices, and manage your orders.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-3 text-gray-400" size={16} />
              <input
                className="pl-10 pr-3 py-2 rounded-lg border bg-white text-sm w-60 focus:ring-2 focus:ring-green-200"
                placeholder="Search Order ID or customer..."
                value={queryText}
                onChange={(e) => {
                  setQueryText(e.target.value);
                  setPage(1);
                }}
                aria-label="Search orders"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 rounded-lg border bg-white text-sm"
            >
              <option>All</option>
              <option>Pending</option>
              <option>Delivered</option>
              <option>Cancelled</option>
            </select>

            <div className="flex items-center gap-2 ml-1">
              <button
                onClick={() => setViewMode("cards")}
                className={`px-3 py-2 rounded-lg ${viewMode === "cards" ? "bg-green-600 text-white" : "bg-white border"}`}
                aria-pressed={viewMode === "cards"}
                title="Card view"
              >
                Cards
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`px-3 py-2 rounded-lg ${viewMode === "table" ? "bg-green-600 text-white" : "bg-white border"}`}
                aria-pressed={viewMode === "table"}
                title="Table view"
              >
                Table
              </button>
            </div>

            <button
              onClick={() => {
                // export simple CSV of filtered results
                const rows = [
                  ["Order ID", "Status", "Placed", "Items", "Total"],
                  ...filtered.map((o) => {
                    const total = (o.items || []).reduce((s, it) => s + it.price * it.quantity, 0);
                    return [o.id, o.status || "Pending", formatDate(o.createdAt), (o.items || []).length, total];
                  }),
                ];
                const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
                const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `Orders_${new Date().toISOString().slice(0,10)}.csv`;
                a.click();
                URL.revokeObjectURL(url);
                toast.success("Exported orders CSV");
              }}
              className="px-3 py-2 rounded-lg bg-white border flex items-center gap-2 text-sm"
              title="Export CSV"
            >
              <Download size={14} /> Export
            </button>
          </div>
        </div>

        {/* content */}
        <div className="space-y-4">
          {filtered.length === 0 ? (
            <div className="bg-white rounded-xl p-10 shadow text-center">
              <h3 className="text-lg font-semibold text-gray-700">No orders found</h3>
              <p className="text-gray-500 mt-2">Try a different search or place a new order.</p>
              <div className="mt-4">
                <a href="/marketplace" className="inline-block bg-green-600 text-white px-4 py-2 rounded-md">Browse Marketplace</a>
              </div>
            </div>
          ) : viewMode === "cards" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <AnimatePresence>
                {paginated.map((order) => {
                  const isExpanded = expandedOrder === order.id;
                  const status = order.status || "Pending";
                  const total = (order.items || []).reduce((s, it) => s + it.price * it.quantity, 0);

                  return (
                    <motion.article
                      key={order.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="bg-white/90 backdrop-blur-sm border border-white/60 rounded-2xl p-4 shadow-sm"
                    >
                      <div className="flex justify-between items-start gap-3">
                        <div>
                          <h3 className="font-semibold text-gray-800">Order • <span className="font-mono text-xs text-gray-500">{order.id}</span></h3>
                          <div className={`inline-block mt-2 px-3 py-1 rounded-full text-sm font-semibold ${statusClasses[status] || statusClasses.default}`}>
                            {status}
                          </div>
                          <p className="text-sm text-gray-500 mt-1">Placed: {formatDate(order.createdAt)} • {(order.items || []).length} items</p>
                        </div>

                        <div className="text-right">
                          <div className="text-lg font-bold text-gray-800">{currency(total)}</div>
                          <div className="text-sm text-gray-500 mt-1">{order.paymentMethod || "—"}</div>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <button onClick={() => copyOrderId(order.id)} className="px-3 py-1 border rounded-md text-sm hover:bg-gray-50">Copy ID</button>
                        <button onClick={() => generateInvoice(order)} className="px-3 py-1 bg-green-600 text-white rounded-md text-sm hover:bg-green-700 flex items-center gap-2"><FileText size={14} /> Invoice</button>
                        <button onClick={() => setExpandedOrder(isExpanded ? null : order.id)} className="px-3 py-1 border rounded-md text-sm">{isExpanded ? "Hide Details" : "View Details"}</button>
                      </div>

                      {isExpanded && (
                        <div className="mt-4 border-t pt-4 grid grid-cols-1 gap-3">
                          {(order.items || []).map((it, idx) => (
                            <div key={idx} className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                {it.image ? <img src={it.image} alt={it.name} className="w-14 h-14 rounded-md object-cover" /> : <div className="w-14 h-14 bg-gray-100 rounded-md" />}
                                <div>
                                  <div className="font-medium text-gray-800">{it.name}</div>
                                  <div className="text-sm text-gray-500">Qty: {it.quantity} • {currency(it.price)}</div>
                                </div>
                              </div>
                              <div className="text-gray-800">{currency(it.price * it.quantity)}</div>
                            </div>
                          ))}

                          <div className="flex items-center gap-3 mt-2">
                            {status === "Pending" && (
                              <button disabled={updatingOrderId === order.id} onClick={() => cancelOrder(order)} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50">
                                {updatingOrderId === order.id ? "Cancelling..." : "Cancel Order"}
                              </button>
                            )}
                            {order.trackingUrl && <a href={order.trackingUrl} target="_blank" rel="noreferrer" className="px-4 py-2 border rounded-md hover:bg-gray-50">Track Shipment</a>}
                          </div>
                        </div>
                      )}
                    </motion.article>
                  );
                })}
              </AnimatePresence>
            </div>
          ) : (
            /* TABLE VIEW */
            <div className="bg-white rounded-2xl overflow-auto border">
              <table className="min-w-full divide-y">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Order ID</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Placed</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Items</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Payment</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Status</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold text-gray-600">Total</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y">
                  {paginated.map((order) => {
                    const total = (order.items || []).reduce((s, it) => s + it.price * it.quantity, 0);
                    return (
                      <tr key={order.id}>
                        <td className="px-4 py-3 text-sm text-gray-700 font-mono">{order.id}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{formatDate(order.createdAt)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{(order.items || []).length}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{order.paymentMethod || "—"}</td>
                        <td className="px-4 py-3">
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusClasses[order.status] || statusClasses.default}`}>
                            {order.status || "Pending"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-semibold text-gray-800">{currency(total)}</td>
                        <td className="px-4 py-3 text-center">
                          <div className="inline-flex gap-2">
                            <button onClick={() => copyOrderId(order.id)} className="px-2 py-1 border rounded text-sm">Copy</button>
                            <button onClick={() => generateInvoice(order)} className="px-2 py-1 bg-green-600 text-white rounded text-sm">Invoice</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-between gap-4">
            <div className="text-sm text-gray-600">
              Showing {(filtered.length === 0) ? 0 : (Math.min((page - 1) * PAGE_SIZE + 1, filtered.length))} - {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} orders
            </div>

            <div className="flex items-center gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-2 rounded-lg border bg-white">
                <ChevronLeft size={16} />
              </button>
              <div className="px-3 py-2 bg-white border rounded-lg">
                Page {page} / {pageCount}
              </div>
              <button onClick={() => setPage((p) => Math.min(pageCount, p + 1))} disabled={page === pageCount} className="px-3 py-2 rounded-lg border bg-white">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuyerOrders;
