import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo
} from 'react'

import { useNavigate, Link, useLocation } from 'react-router-dom'

// Recharts
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Label,
  Legend,
  LineChart,
  Line
} from 'recharts'

// Framer Motion
import { motion, AnimatePresence } from "motion/react";
import { auth, db } from "../config/firebaseConfig";
import { doc, setDoc, getDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";

// Lucide icons
import {
  ChevronDown,
  ChevronUp,
  Star,
  Bell,
  Settings,
  LogOut,
  Menu,
  Search,
  ChevronRight,
  TrendingUp,
  Package,
  PackageOpen,
  Edit2,
  Eye,
  Trash2,
  AlertTriangle
} from 'lucide-react'

import { useUser } from "@/frontend/contexts/UserContext";
import { useProducts } from "@/frontend/contexts/ProductContext";
import { notifications } from '@mantine/notifications';
import { useForm } from 'react-hook-form';
import MagneticButton from "@/frontend/components/MagneticButton";
import Button from "@/frontend/components/ui/Button";
import Input from "@/frontend/components/ui/Input";
import Card from "@/frontend/components/ui/Card";
import Skeleton, { SkeletonCard } from "@/frontend/components/ui/Skeleton";
import StatusBadge from "@/frontend/components/ui/StatusBadge";
import EmptyState from "@/frontend/components/ui/EmptyState";
import { updateSEO } from '@/frontend/utils/seo';
import Breadcrumb from '@/frontend/components/ui/Breadcrumb';
import MandiRates from "../components/ui/MandiRates";
import {
  getFarmerHybridProducts
} from '../services/hybridService';
import { safeDate, formatDate } from '@/frontend/utils/dateUtils';
import { fetchJSON, handleFetchError } from '@/frontend/utils/fetchUtils';
import "./FarmerDashboard.css";

const COLORS = ["#2D4F1E", "#4CAF50", "#8BC34A", "#CDDC39", "#FFEB3B"];

const Counter = ({ value, duration = 1.5 }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    let requestID;
    const end = parseInt(value) || 0;
    if (end === 0) {
      setCount(0); // Reset if value is 0
      return;
    }

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / (duration * 1000), 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) {
        requestID = window.requestAnimationFrame(step);
      }
    };

    requestID = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(requestID);
  }, [value, duration]);

  return <span>{(count || 0).toLocaleString()}</span>;
};


// Indian farmer avatar component
const FarmerAvatar = ({
  name = '',
  size = 56
}) => {
  const initial = name
    ? name.charAt(0).toUpperCase()
    : 'F'

  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background:
        'linear-gradient(135deg,' +
        '#2D4F1E 0%,' +
        '#4A7C30 50%,' +
        '#1A2E12 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: '3px solid #EDD9B0',
      boxShadow:
        '0 4px 12px rgba(45,79,30,0.30)',
      position: 'relative',
      overflow: 'hidden',
      flexShrink: 0
    }}>
      {/* Indian farm background */}
      <svg
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          opacity: 0.3
        }}
        viewBox="0 0 56 20"
      >
        {/* Field rows */}
        <rect x="0" y="14"
          width="56" height="6"
          fill="#4CAF50" />
        <rect x="0" y="10"
          width="56" height="4"
          fill="#388E3C" />
        {/* Crop lines */}
        {[4,10,16,22,28,34,40,46,52]
          .map(x => (
          <line key={x}
            x1={x} y1="10"
            x2={x} y2="20"
            stroke="#2D4F1E"
            strokeWidth="0.5"
          />
        ))}
      </svg>

      {/* Initial letter */}
      <span style={{
        fontFamily: 'Playfair Display',
        fontWeight: 700,
        fontSize: size * 0.4,
        color: 'white',
        zIndex: 1,
        textShadow:
          '0 2px 4px rgba(0,0,0,0.3)',
        lineHeight: 1
      }}>
        {initial}
      </span>

      {/* Farmer hat indicator */}
      <div style={{
        position: 'absolute',
        top: -2,
        right: -2,
        width: size * 0.28,
        height: size * 0.28,
        borderRadius: '50%',
        background: '#E27D60',
        border: '2px solid white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.14,
        zIndex: 2
      }}>
        🌾
      </div>
    </div>
  )
}

const formatCurrency = (val) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(val || 0);

const SalesTrendTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="fd-chart-tooltip">
        <div className="fd-ct-date">{payload[0].payload.date}</div>
        <div className="fd-ct-val">{formatCurrency(payload[0].value)}</div>
        <div className="fd-ct-lbl">{payload[0].payload.orders} orders</div>
      </div>
    );
  }
  return null;
};

const CategoryTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="fd-chart-tooltip" style={{ textAlign: "center" }}>
        <div className="fd-ct-val" style={{ fontSize: 16 }}>{payload[0].name}</div>
        <div className="fd-ct-lbl">{payload[0].value}% of sales</div>
      </div>
    );
  }
  return null;
};

// Safe render — never crashes on objects
const safeRender = (value, fallback = '') => {
  if (value === null || value === undefined) {
    return fallback
  }
  if (typeof value === 'string'
      || typeof value === 'number'
      || typeof value === 'boolean') {
    return value
  }
  if (typeof value === 'object') {
    // Try common string properties
    return value.name
      || value.label
      || value.title
      || value.type
      || value.message
      || value.text
      || fallback
  }
  return fallback
}

const LoadingSkeleton = () => (
  <div style={{
    height: 200,
    borderRadius: 16,
    background: 'linear-gradient(90deg, #EDD9B0, #F5E6CC, #EDD9B0)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.5s infinite'
  }}>
    <style>{`
      @keyframes shimmer {
        0% { background-position: 200% center }
        100% { background-position: -200% center }
      }
    `}</style>
  </div>
)

const LoadingSkeleton2 = () => (
  <div style={{
    height: 200,
    borderRadius: 16,
    background: '#FDFAF4',
    border: '1.5px solid #EDD9B0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    animation: 'pulse 2s infinite'
  }}>
    <style>{`
      @keyframes pulse {
        0% { opacity: 1; }
        50% { opacity: 0.6; }
        100% { opacity: 1; }
      }
    `}</style>
    <div style={{ textAlign: 'center' }}>
      <RefreshCw className="animate-spin" style={{ color: '#E27D60', margin: '0 auto 8px', display: 'block' }} size={24} />
      <span style={{ color: '#7A7A7A', fontSize: '12px', fontFamily: 'DM Sans' }}>Harvesting data...</span>
    </div>
  </div>
)

const SkeletonCardInline = () => (
  <div style={{
    background: '#FDFAF4',
    borderRadius: 16,
    padding: 24,
    border: '1.5px solid #EDD9B0'
  }}>
    {[1, 2, 3].map(i => (
      <div key={i} style={{
        height: 14,
        borderRadius: 7,
        background: 'linear-gradient(90deg, #EDD9B0, #F5E6CC, #EDD9B0)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
        marginBottom: 10,
        width: i === 3 ? '60%' : '100%'
      }} />
    ))}
  </div>
)

const LoadingGridSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    {[1, 2, 3, 4].map((i) => (
      <SkeletonCardInline key={i} />
    ))}
  </div>
);


const FarmerDashboard = () => {
  const { user } = useUser();
  const { products: contextProducts = [], addProduct, updateProduct, removeProduct } = useProducts();
  const navigate = useNavigate();
  const location = useLocation();

  const ownerEmail =
    localStorage.getItem("userEmail") ||
    JSON.parse(localStorage.getItem("ks_user") || "{}")?.email ||
    "farmer@local";

  const farmName = localStorage.getItem("farmName") || "Green Valley Farm";

  // Navigation / Tabs
  const [activeTab, setActiveTab] = useState('overview');

  // Products State
  const [products, setProducts] = useState([]);
  const [localProducts, setLocalProducts] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState(null);

  // Search state
  const [searchTerm, setSearchTerm] = useState("");
  const [tableSearchTerm, setTableSearchTerm] = useState("");
  const [debouncedTableSearchTerm, setDebouncedTableSearchTerm] = useState("");
  const [tableFilter, setTableFilter] = useState("all");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTableSearchTerm(tableSearchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [tableSearchTerm]);

  // Profile Dropdown
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Form for Add Product
  const {
    register: registerProduct,
    handleSubmit: handleProductSubmit,
    reset: resetProduct,
    formState: { errors: productErrors },
    watch: watchProduct,
    setValue: setProductValue
  } = useForm({
    defaultValues: {
      name: "",
      description: "",
      category: "",
      price: "",
      quantity: "",
      unit: "kg",
      image: "",
      published: true,
      grade: "local",
      seedCost: '',
      laborCost: '',
      transportCost: '',
      otherCost: ''
    }
  });

  const productFormData = watchProduct();
  const [priceAdvice, setPriceAdvice] = useState(null);
  const [priceLoading, setPriceLoading] = useState(false);

  const [profitAnalysis, setProfitAnalysis] = useState(null)
  const [isAdding, setIsAdding] = useState(false)
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')
  const [showAddProduct, setShowAddProduct] = useState(false)

  // Profile state using React Hook Form
  const { register, handleSubmit, watch, reset: resetProfile, formState: { errors: profileErrors, isSubmitting: profileSubmitting } } = useForm({
    defaultValues: {
      name: '', phone: '', farmName: '', farmLocation: '', farmSize: '', farmSizeUnit: 'acres',
      primaryCrops: '', state: '', district: '', pincode: '', experience: '', bio: '', bankName: '', accountNumber: '', ifscCode: '', upiId: ''
    }
  });

  const [profileSuccess, setProfileSuccess] = useState('');
  // const [profileError, setProfileError] = useState('')

  const calculateProfit = (
    sellingPrice,
    quantity,
    costs,
    mandiRate
  ) => {
    const price = parseFloat(sellingPrice || 0)
    const qty = parseFloat(quantity || 0)

    // Total cost entered (raw sum)
    const seedCost = parseFloat(costs.seedCost || 0)
    const laborCost = parseFloat(costs.laborCost || 0)
    const transportCost = parseFloat(costs.transportCost || 0)
    const otherCost = parseFloat(costs.otherCost || 0)
    const rawCostTotal = seedCost + laborCost + transportCost + otherCost

    // Platform fee 2%
    const platformFee = price * 0.02

    // Divide by quantity to get per-kg cost
    const costPerKg = qty > 0 ? rawCostTotal / qty : rawCostTotal
    const totalCostPerKg = costPerKg + platformFee

    // Per kg calculations
    const profitPerKg = price - totalCostPerKg

    // Break even price
    const breakEvenPrice = totalCostPerKg

    // Total revenue and profit
    const totalRevenue = price * qty
    const totalCost = totalCostPerKg * qty
    const totalProfit = totalRevenue - totalCost

    // Profit margin %
    const profitMargin = price > 0
      ? Math.round((profitPerKg / price) * 100)
      : 0

    // Status
    let status, statusColor, statusIcon
    if (price < totalCostPerKg) {
      status = 'LOSS'
      statusColor = '#FF5252'
      statusIcon = '⚠️'
    } else if (profitMargin < 10) {
      status = 'LOW PROFIT'
      statusColor = '#E27D60'
      statusIcon = '⚡'
    } else if (profitMargin < 25) {
      status = 'FAIR PROFIT'
      statusColor = '#F5A623'
      statusIcon = '✅'
    } else {
      status = 'GOOD PROFIT'
      statusColor = '#4CAF50'
      statusIcon = '🌟'
    }

    // Suggested minimum price
    const suggestedMinPrice = Math.ceil(totalCostPerKg * 1.20) // 20% minimum margin

    return {
      sellingPrice: price,
      quantity: qty,
      totalCostPerKg: Math.round(totalCostPerKg * 100) / 100,
      profitPerKg: Math.round(profitPerKg * 100) / 100,
      breakEvenPrice: Math.round(breakEvenPrice * 100) / 100,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
      totalProfit: Math.round(totalProfit * 100) / 100,
      profitMargin,
      status,
      statusColor,
      statusIcon,
      suggestedMinPrice,
      platformFee: Math.round(platformFee * 100) / 100,
      mandiRate: mandiRate || 0,
      vsMandiRate: mandiRate
        ? Math.round(((price - mandiRate) / mandiRate) * 100)
        : null
    }
  }

  const GRADES = [
    { value: 'local', label: '🥬 Local Grade', desc: 'Standard quality' },
    { value: 'b_grade', label: '🌿 B Grade', desc: 'Good quality' },
    { value: 'a_grade', label: '⭐ A Grade', desc: 'High quality' },
    { value: 'farm_fresh', label: '🌱 Farm Fresh', desc: 'Freshly harvested' },
    { value: 'premium', label: '💎 Premium', desc: 'Best quality' },
    { value: 'organic', label: '🌿 Organic', desc: 'No pesticides' },
    { value: 'export_quality', label: '✈️ Export Quality', desc: 'International standard' },
  ];


  // Editing rows
  const [editingRows, setEditingRows] = useState({});
  const updateTimersRef = useRef({});

  // Analytics / Charts
  const [recentOrders, setRecentOrders] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [hasSalesData, setHasSalesData] = useState(false);
  const [totalSales, setTotalSales] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalOrderCount, setTotalOrderCount] = useState(0);
  const [chartPeriod, setChartPeriod] = useState("7d");
  const [mandiOverlay, setMandiOverlay] = useState(null);
  const [analyticsError, setAnalyticsError] = useState(null);
  const [earnings, setEarnings] = useState(0);

  // Farmer Stats
  const [farmerStats, setFarmerStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    activeListings: 0,
    pendingOrders: 0
  });

  // Market / Mandi
  const [todayPrices, setTodayPrices] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [mandiLoading, setMandiLoading] = useState(false);

  // Dashboard UI
  const [isLoading, setIsLoading] = useState(true);
  const [activeNav, setActiveNav] = useState("dashboard");
  const [alerts, setAlerts] = useState([]);

  // ML Utils
  const getModelName = (prediction) => {
    if (!prediction?.model) return 'ML Model'
    if (typeof prediction.model === 'string') return prediction.model
    if (typeof prediction.model === 'object') {
      return prediction.model.name || prediction.model.type || 'ML Model'
    }
    return 'ML Model'
  }

  const getModelType = (prediction) => {
    if (!prediction?.model) return 'unknown'
    if (typeof prediction.model === 'object') return prediction.model.type || 'unknown'
    return String(prediction.model)
  }

  const isARIMA = (prediction) => {
    if (!prediction?.model) return false
    if (typeof prediction.model === 'object') return prediction.model.is_arima === true
    return String(prediction.model).includes('ARIMA')
  }

  const units = ["kg", "grams", "litre", "ml", "dozen", "piece"];

  const getFarmerId = () => {
    try {
      const user = JSON.parse(
        localStorage.getItem('ks_user')
        || localStorage.getItem('user')
        || 'null'
      )
      return user?.uid || user?.id || user?._id || null
    } catch {
      return null
    }
  }

  const farmerId = getFarmerId()

  const filteredProducts = useMemo(() => {
    const term = debouncedTableSearchTerm.toLowerCase()
    return (localProducts || []).filter(p => {
      const matchesTab = tableFilter === 'all' ||
        (tableFilter === 'published' && (p.isPublished || p.published)) ||
        (tableFilter === 'hidden' && !(p.isPublished || p.published))

      const matchesSearch = (p.name || '').toLowerCase().includes(term) ||
        (p.category || '').toLowerCase().includes(term)

      return matchesTab && matchesSearch
    })
  }, [localProducts, tableFilter, debouncedTableSearchTerm])

  const TABS = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'products', label: 'Products', icon: '🌾' },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
    { id: 'mandi', label: 'Mandi', icon: '💹' },
    { id: 'profile', label: 'Profile', icon: '👤' },
  ]

  const CATEGORY_COLORS = {
    'Vegetables': '#2D4F1E',
    'Fruits': '#E27D60',
    'Grains': '#F0A080',
    'Dairy': '#4CAF50',
    'Herbs': '#4A7A35',
    'Pulses': '#C96848',
    'Oils': '#F5A623',
    'Dry Fruits': '#7A7A7A',
    'Organic': '#3D6B2A',
    'Grocery': '#B0A898',
    'Others': '#EDD9B0'
  }

  const getCategoryColor = (name, index) =>
    CATEGORY_COLORS[name] || Object.values(CATEGORY_COLORS)[index % Object.values(CATEGORY_COLORS).length]


  /* --- EFFECTS --- */
  useEffect(() => {
    updateSEO("Farmer Dashboard | KrishiSaathi", "Manage your farm inventory and view market trends.");
    window.scrollTo(0, 0);
  }, []);

  // Fetch Products
  const loadProducts = useCallback(async (signal) => {
    if (!farmerId) return;
    setProductsLoading(true);
    setProductsError(null);
    try {
      const data = await getFarmerHybridProducts(farmerId);
      if (signal.aborted) return;
      setProducts(data);
      setLocalProducts(data);
      setInventory(data);
    } catch (err) {
      const handled = handleFetchError(err);
      if (!handled.aborted) {
        console.error("Load products failed:", handled.error);
        setProductsError("Failed to sync inventory.");
      }
    } finally {
      setProductsLoading(false);
    }
  }, [farmerId]);

  useEffect(() => {
    const controller = new AbortController();
    loadProducts(controller.signal);
    return () => controller.abort();
  }, [loadProducts]);


  const fetchMandi = useCallback(async (signal) => {
    const selectedState = watch('state') || 'Maharashtra';
    setMandiLoading(true);
    try {
      const data = await fetchJSON(`/api/mandi/today?state=${selectedState}`, { signal });
      
      if (data.aborted) return;

      if (data.success && data.prices) {
        setTodayPrices(data.prices);
      }
    } catch (err) {
      handleFetchError(err);
    } finally {
      setMandiLoading(false);
    }
  }, [watch]);

  // Fetch Analytics & Mandi
  useEffect(() => {
    const controller = new AbortController();
    const fetchAnalytics = async (signal) => {
      if (!farmerId) return;
      setAnalyticsLoading(true);
      setAnalyticsError(null);
      try {
        const data = await fetchJSON(`/api/orders/farmer/${farmerId}?period=${chartPeriod}`, { signal });
        
        if (data.aborted) return;

        if (data.success) {
          setChartData(data.sales_trend || []);
          setCategoryData(data.category_spread || []);
          setRecentOrders(data.recent_orders || []);
          setHasSalesData(data.has_real_data || false);
          setTotalRevenue(data.summary?.total_revenue || 0);
          setTotalOrderCount(data.summary?.total_orders || 0);
          setEarnings(data.summary?.total_revenue || 0);
        } else {
          throw new Error(data.error || "Failed to fetch analytics");
        }
      } catch (err) {
        const handled = handleFetchError(err);
        if (!handled.aborted) {
          setAnalyticsError("Failed to load trends.");
          setChartData([]);
          setHasSalesData(false);
        }
      } finally {
        setAnalyticsLoading(false);
      }
    };

    fetchAnalytics(controller.signal);
    return () => controller.abort();
  }, [farmerId, chartPeriod]);

  // Consolidate fetchMandi to fire only once on mount with cleanup
  useEffect(() => {
    const controller = new AbortController();
    fetchMandi(controller.signal);
    return () => controller.abort();
  }, [fetchMandi]);

  // Load existing profile data
  useEffect(() => {
    const loadProfile = async (signal) => {
      try {
        const uid = user?.uid || farmerId;
        if (!uid) return;

        const initialData = {
          name: user?.name || user?.displayName || '',
          phone: user?.phone || user?.phoneNumber || '',
          farmName: '', farmLocation: '', farmSize: '', farmSizeUnit: 'acres',
          primaryCrops: '', state: '', district: '', pincode: '', experience: '', bio: '',
          upiId: '', bankName: '', accountNumber: '', ifscCode: ''
        };

        const data = await fetchJSON(`/api/users/${uid}`, { signal });
        
        if (data.aborted) return;

        if (data.success || data.user) {
          const u = data.user || data;
          resetProfile({
            ...initialData,
            name: u.name || initialData.name,
            phone: u.phone || initialData.phone,
            farmName: u.farmName || u.farm_name || '',
            farmLocation: u.farmLocation || u.farm_location || '',
            farmSize: u.farmSize || u.farm_size || '',
            farmSizeUnit: u.farmSizeUnit || 'acres',
            primaryCrops: u.primaryCrops || u.primary_crops || '',
            state: u.state || '', district: u.district || '',
            pincode: u.pincode || '', experience: u.experience || '', bio: u.bio || '',
            upiId: u.upiId || u.upi_id || '', bankName: u.bankName || '',
            accountNumber: u.accountNumber || '', ifscCode: u.ifscCode || ''
          });
        } else {
          resetProfile(initialData);
        }
      } catch (err) {
        handleFetchError(err);
      }
    };

    if (activeTab === 'profile') {
      const controller = new AbortController();
      loadProfile(controller.signal);
      return () => controller.abort();
    }
  }, [activeTab, user?.uid, farmerId]);

  // Save profile to both databases
  const onSubmitProfile = async (formData) => {
    setProfileError('')
    setProfileSuccess('')

    try {
      // Get user UID from all sources
      const uid = (() => {
        if (user?.uid) return user.uid
        if (user?.id) return user.id
        try {
          const stored = JSON.parse(
            localStorage.getItem('ks_user')
            || 'null'
          )
          return stored?.uid
            || stored?.id
            || null
        } catch {
          return null
        }
      })()

      if (!uid) {
        notifications.show({
          title: '❌ Login Required',
          message: 'Not logged in. Please logout and login again.',
          color: 'red', autoClose: 5000,
          styles: { root: { fontFamily: 'DM Sans', borderLeft: '4px solid #FF5252' } }
        });
        return
      }

      // Build clean payload
      const payload = {
        uid,
        name: formData.name?.trim() || '',
        phone: formData.phone?.trim() || '',
        farmName: formData.farmName?.trim() || '',
        farmLocation: formData.farmLocation?.trim() || '',
        farmSize: formData.farmSize || '',
        farmSizeUnit: formData.farmSizeUnit || 'acres',
        primaryCrops: formData.primaryCrops?.trim() || '',
        state: formData.state?.trim() || '',
        district: formData.district?.trim() || '',
        pincode: formData.pincode?.trim() || '',
        experience: formData.experience || '',
        bio: formData.bio?.trim() || '',
        upiId: formData.upiId?.trim() || '',
        bankName: formData.bankName?.trim() || '',
        accountNumber: formData.accountNumber?.trim() || '',
        ifscCode: formData.ifscCode?.trim() || '',
        role: user?.role || 'farmer',
        updatedAt: new Date().toISOString()
      }

      console.log(
        '[SaveProfile] Saving payload:',
        payload
      )

      let firebaseSaved = false
      let mongoSaved = false

        // ── SAVE TO FIRESTORE ──────────
      try {

        await setDoc(
          doc(db, 'users', uid),
          {
            ...payload,
            updatedAt: serverTimestamp()
          },
          { merge: true }
        )

        firebaseSaved = true
        console.log(
          '✅ [SaveProfile] → Firestore'
        )
      } catch (fsErr) {
        console.warn(
          '⚠️ [SaveProfile] Firestore:',
          fsErr.message
        )
        // Continue to MongoDB even if
        // Firestore fails
      }

      // ── SAVE TO MONGODB ────────────
      try {
        const res = await fetch(
          '/api/users/sync',
          {
            method: 'POST',
            headers: {
              'Content-Type':
                'application/json',
              'Accept':
                'application/json'
            },
            body: JSON.stringify(payload)
          }
        )

        console.log(
          '[SaveProfile] MongoDB status:',
          res.status
        )

        if (res.ok) {
          const data = await res.json()
          console.log(
            '✅ [SaveProfile] → MongoDB:',
            data
          )
          mongoSaved = true
        } else {
          // Read error body
          let errorText = ''
          try {
            const errData =
              await res.json()
            errorText =
              errData.message
              || errData.error
              || `HTTP ${res.status}`
          } catch {
            errorText =
              `HTTP ${res.status}`
          }
          console.error(
            '❌ [SaveProfile] MongoDB:',
            errorText
          )
          // Don't throw — still
          // save to localStorage
        }
      } catch (mongoErr) {
        console.warn(
          '⚠️ [SaveProfile] MongoDB:',
          mongoErr.message
        )
      }

      // ── SAVE TO LOCALSTORAGE ───────
      // Always save locally as backup
      try {
        const existing = JSON.parse(
          localStorage.getItem('ks_user')
          || '{}'
        )
        const updated = {
          ...existing,
          ...payload,
          uid
        }
        localStorage.setItem(
          'ks_user',
          JSON.stringify(updated)
        )
        console.log(
          '✅ [SaveProfile] → localStorage'
        )
      } catch (lsErr) {
        console.warn(
          '[SaveProfile] localStorage:',
          lsErr.message
        )
      }

      // ── SHOW RESULT ────────────────
      if (firebaseSaved || mongoSaved) {
        notifications.show({
          title: '✅ Profile updated!',
          message: 'Your info has been saved safely.',
          color: 'green', autoClose: 3000,
          styles: {
            root: {
              fontFamily: 'DM Sans',
              borderLeft: '4px solid #2D4F1E'
            },
            title: { fontWeight: 700, color: '#2D4F1E' }
          }
        });
      } else {
        notifications.show({
          title: '⚠️ Saved locally',
          message: 'Profile saved locally. Will sync when online.',
          color: 'yellow', autoClose: 4000,
          styles: {
            root: {
              fontFamily: 'DM Sans',
              borderLeft: '4px solid #F5A623'
            }
          }
        });
      }

    } catch (err) {
      console.error('❌ [SaveProfile] Fatal:', err.message)
      notifications.show({
        title: '❌ Save failed',
        message: err.message,
        color: 'red', autoClose: 5000,
        styles: {
          root: {
            fontFamily: 'DM Sans',
            borderLeft: '4px solid #FF5252'
          }
        }
      });
    }
  }
  useEffect(() => {
    if (!productsLoading) {
      setIsLoading(false);
    }
  }, [productsLoading]);

  /* --- HANDLERS --- */

  const handleEditField = (id, field, value) => {
    setEditingRows(prev => ({
      ...prev,
      [id]: { ...prev[id], [field]: value }
    }));
  };

  const startEditRow = (product) => {
    setEditingRows(prev => ({
      ...prev,
      [product._id || product.id]: {
        price: product.price,
        quantity: product.quantity,
        isPublished: product.isPublished
      }
    }));
  };

  const cancelEditRow = (id) => {
    setEditingRows(prev => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  };

  const saveEditRow = async (id) => {
    const changes = editingRows[id];
    try {
      try {
        const { updateProductInFirestore } = await import('../services/firestoreService');
        await updateProductInFirestore(id, changes);
      } catch {
        await fetch(`/api/products/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(changes)
        });
      }

      setProducts(prev => (prev || []).map(p => (p._id || p.id) === id ? { ...p, ...changes } : p));
      setLocalProducts(prev => (prev || []).map(p => (p._id || p.id) === id ? { ...p, ...changes } : p));
      cancelEditRow(id);
      notifications.show({
        title: '✅ Product updated',
        message: 'Changes have been saved successfully.',
        color: 'green',
        styles: { root: { fontFamily: 'DM Sans', background: '#FDFAF4', border: '1.5px solid #EDD9B0', borderLeft: '4px solid #2D4F1E', borderRadius: 12 } }
      });
    } catch (err) {
      notifications.show({
        title: '❌ Save failed',
        message: 'Could not update the product.',
        color: 'red',
        styles: { root: { fontFamily: 'DM Sans', background: '#FDFAF4', border: '1.5px solid #EDD9B0', borderLeft: '4px solid #FF5252', borderRadius: 12 } }
      });
    }
  };

  /* --- HANDLERS --- */
  const handleLogout = useCallback(() => {
    if (!window.confirm("Logout from KrishiSaathi?")) return;
    localStorage.clear();
    navigate("/login");
  }, [navigate]);

  /*
  const debouncedUpdate = (id, changes, delay = 800) => {
    if (updateTimersRef.current[id]) clearTimeout(updateTimersRef.current[id]);
    updateTimersRef.current[id] = setTimeout(() => {
      updateProduct(id, changes);
      notifications.show({
        title: '💾 Saved',
        message: 'Changes saved organically.',
        color: 'blue',
        styles: { root: { fontFamily: 'DM Sans', background: '#FDFAF4', border: '1.5px solid #EDD9B0', borderLeft: '4px solid #2D4F1E', borderRadius: 12 } }
      });
      delete updateTimersRef.current[id];
    }, delay);
  };
  */

  const handleTogglePublish = async (productId, currentStatus) => {
    try {
      let newStatus = !currentStatus
      try {
        const { toggleProductPublishFirestore } = await import('../services/firestoreService')
        newStatus = await toggleProductPublishFirestore(productId, currentStatus)
      } catch {
        await fetch(`/api/products/${productId}/publish`, { method: 'PATCH' })
      }

      setProducts(prev => (prev || []).map(p => (p.id || p._id) === productId ? { ...p, isPublished: newStatus, published: newStatus } : p))
      setLocalProducts(prev => (prev || []).map(p => (p.id || p._id) === productId ? { ...p, isPublished: newStatus, published: newStatus } : p))
      notifications.show({
        title: newStatus ? '🌐 Published' : '🔒 Hidden',
        message: newStatus ? 'Product is now visible in the marketplace.' : 'Product is hidden from buyers.',
        color: newStatus ? 'green' : 'gray',
        styles: { root: { fontFamily: 'DM Sans', background: '#FDFAF4', border: '1.5px solid #EDD9B0', borderLeft: `4px solid ${newStatus ? '#2D4F1E' : '#7A7A7A'}`, borderRadius: 12 } }
      });
    } catch (err) {
      console.error('Toggle failed:', err)
      notifications.show({
        title: '❌ Status update failed',
        message: 'Could not update visibility.',
        color: 'red'
      });
    }
  }

  const confirmAndDelete = async (productId, productName) => {
    if (!window.confirm(`Delete "${productName}"?\nThis cannot be undone.`)) return

    try {
      try {
        const { deleteProductFromFirestore } = await import('../services/firestoreService')
        await deleteProductFromFirestore(productId)
      } catch {
        await fetch(`/api/products/${productId}`, { method: 'DELETE' })
      }

      setProducts(prev => (prev || []).filter(p => (p.id || p._id) !== productId))
      setLocalProducts(prev => (prev || []).filter(p => (p.id || p._id) !== productId))
      setInventory(prev => (prev || []).filter(p => (p.id || p._id) !== productId))
      notifications.show({
        title: '🗑️ Deleted',
        message: `"${productName}" removed from your inventory.`,
        color: 'red',
        styles: { root: { fontFamily: 'DM Sans', background: '#FDFAF4', border: '1.5px solid #EDD9B0', borderLeft: '4px solid #FF5252', borderRadius: 12 } }
      });
    } catch (err) {
      console.error('Delete failed:', err)
      notifications.show({
        title: '❌ Delete failed',
        message: 'Could not remove the product.',
        color: 'red'
      });
    }
  }

  // Debounced price check
  const checkPrice = useCallback(async (price, commodity, grade, signal) => {
    if (!price || !commodity || price < 1) {
      setPriceAdvice(null);
      return;
    }
    setPriceLoading(true);
    try {
      const data = await fetchJSON(
        `/api/products/price-check?commodity=${encodeURIComponent(commodity)}&price=${price}&grade=${grade}`,
        { signal }
      );
      if (data.aborted) return;
      if (data.success) {
        setPriceAdvice(data);
      }
    } catch (err) {
      handleFetchError(err);
      setPriceAdvice(null);
    } finally {
      setPriceLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      if (productFormData.price && productFormData.name) {
        checkPrice(productFormData.price, productFormData.name, productFormData.grade || 'local', controller.signal);
      }
    }, 800);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [productFormData.price, productFormData.name, productFormData.grade, checkPrice]);

  // Recalculate when price or costs change
  useEffect(() => {
    if (productFormData.price && productFormData.quantity) {
      const costs = {
        seedCost: productFormData.seedCost,
        laborCost: productFormData.laborCost,
        transportCost: productFormData.transportCost,
        otherCost: productFormData.otherCost
      };
      const analysis = calculateProfit(
        productFormData.price,
        productFormData.quantity,
        costs,
        priceAdvice?.mandi_rate || null
      )
      setProfitAnalysis(analysis)
    } else {
      setProfitAnalysis(null)
    }
  }, [productFormData.price, productFormData.quantity, productFormData.seedCost, productFormData.laborCost, productFormData.transportCost, productFormData.otherCost, priceAdvice])


  // --- Add new product handler (Firestore integration) ---
  const onAddProductSubmit = async (data) => {
    setIsAdding(true)
    setFormLoading(true)
    setFormError('')

    const cleanup = () => {
      setIsAdding(false)
      setFormLoading(false)
    }

    try {
      const user = JSON.parse(
        localStorage.getItem('ks_user')
        || 'null'
      )
      const uid = user?.uid
        || user?.id
        || null

      if (!uid) {
        notifications.show({
          title: '❌ Login Required',
          message: 'Please login to add products',
          color: 'red',
          autoClose: 5000,
          styles: { root: { fontFamily: 'DM Sans', borderLeft: '4px solid #FF5252' } }
        })
        cleanup()
        return
      }

      const payload = {
        farmerId: uid,
        farmerName: user?.name || 'Farmer',
        name: (data.name || '').trim(),
        description: data.description || '',
        price: parseFloat(data.price || 0),
        unit: data.unit || 'kg',
        priceUnit: data.unit || 'kg',
        quantity: parseInt(data.quantity || 0),
        category: data.category || '',
        image: data.image || '',
        grade: data.grade || 'local',
        isPublished: true,
        createdAt: new Date().toISOString()
      }

      let savedProduct = null

      // SAVE TO FIRESTORE
      try {
        const docRef = await addDoc(
          collection(db, 'products'),
          {
            ...payload,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          }
        )
        savedProduct = {
          id: docRef.id,
          _id: docRef.id,
          ...payload
        }
        console.log('✅ Product → Firestore:', docRef.id)
      } catch (err) {
        console.warn('Firestore product save:', err.message)
      }

      // SAVE TO MONGODB
      try {
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        })
        const resData = await res.json()
        if (res.ok && resData.product) {
          console.log('✅ Product → MongoDB:', resData.product._id)
          if (!savedProduct) {
            savedProduct = resData.product
          }
        } else {
          console.warn('MongoDB product save:', resData.message)
        }
      } catch (err) {
        console.warn('MongoDB product save:', err.message)
      }

      if (!savedProduct) {
        throw new Error('Failed to save to any database')
      }

      setProducts(prev => [savedProduct, ...(prev || [])])
      setLocalProducts(prev => [savedProduct, ...(prev || [])])
      setInventory(prev => [savedProduct, ...(prev || [])])

      notifications.show({
        title: '🚀 Product listed!',
        message: `✅ ${savedProduct.name} is now live in the marketplace.`,
        color: 'green',
        styles: { root: { fontFamily: 'DM Sans', background: '#FDFAF4', border: '1.5px solid #EDD9B0', borderLeft: '4px solid #2D4F1E', borderRadius: 12 } }
      });

      setShowAddProduct(false)
      resetProduct()

    } catch (err) {
      console.error('Add product error:', err.message)
      notifications.show({
        title: '❌ Listing failed',
        message: err.message || 'Failed to add product',
        color: 'red',
        autoClose: 5000,
        styles: { root: { fontFamily: 'DM Sans', borderLeft: '4px solid #FF5252' } }
      })
    } finally {
      cleanup()
    }
  }

  // --- KPI Stats Calculation ---
  const stats = useMemo(() => {
    const list = localProducts || []
    return {
      totalProducts: list.length,
      totalStock: list.reduce((s, p) => s + (Number(p.quantity) || 0), 0),
      lowStock: list.filter(p => Number(p.quantity) > 0 && Number(p.quantity) <= 5).length,
      unpublished: list.filter(p => !(p.isPublished || p.published)).length
    }
  }, [localProducts])


  /* --- RENDER --- */
  if (isLoading) {
    return (
      <div className="fd-container fd-loading-state">
        <LoadingGridSkeleton />
      </div>
    );
  }

  return (
    <div className="fd-container">
      {/* TOP BAR */}
      <header className="fd-top-bar">
        <button className="fd-hamburger" onClick={() => setMobileMenuOpen(true)} aria-label="Open menu">
          <Menu size={24} />
        </button>

        <div className="fd-logo-row">
          <div style={{ fontSize: "24px" }}>🌾</div>
          <div className="fd-logo-text">KrishiSaathi</div>
        </div>

        <div className="fd-divider hidden md:block"></div>

        <div className="fd-breadcrumb hidden md:flex">
          <span className="fd-bc-base">Dashboard</span>
          <span className="fd-bc-sep">/</span>
          <span className="fd-bc-curr">Overview</span>
        </div>

        <div className="fd-search-wrapper">
          <Search className="fd-search-icon" size={16} />
          <input
            type="text"
            className="fd-search"
            placeholder="Search products, orders, categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="fd-top-actions">
          <Link to="/marketplace" className="fd-top-link hidden sm:flex">
            <span>Marketplace</span>
          </Link>
          <Button
            variant="primary"
            onClick={() => {
              setActiveTab('products')
              setTimeout(() => {
                document.getElementById("add-product-form")?.scrollIntoView({ behavior: "smooth" })
              }, 100)
            }}
          >
            + Add Product
          </Button>

          <div
            className="fd-user-dropdown"
            ref={profileRef}
            onClick={() => setProfileOpen(!profileOpen)}
          >
            <FarmerAvatar
              name={user?.name || user?.displayName || farmName}
              size={32}
            />
            <div className="fd-user-name hidden sm:block">
              {(() => {
                if (user?.name &&
                    !user.name.toLowerCase()
                      .includes('farm')) {
                  return user.name
                }
                if (user?.displayName &&
                    !user.displayName.toLowerCase()
                      .includes('farm')) {
                  return user.displayName
                }
                try {
                  const s = JSON.parse(
                    localStorage.getItem('ks_user')
                    || 'null'
                  )
                  if (s?.name &&
                      !s.name.toLowerCase()
                        .includes('farm')) {
                    return s.name
                  }
                  if (s?.email) {
                    return s.email.split('@')[0]
                  }
                } catch {}
                return 'Farmer'
              })()}
            </div>
            <ChevronDown size={14} color="#fff" />

            <AnimatePresence>
              {profileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="fd-dropdown-menu"
                >
                  <button
                    className="fd-dropdown-item"
                    onClick={() => {
                      setActiveTab('profile')
                      setProfileOpen(false)
                    }}
                  >
                    Profile Settings
                  </button>
                  <div
                    style={{
                      height: "1px",
                      background: "var(--color-bg-soft)",
                      margin: "4px 0",
                    }}
                  />
                  <button
                    className="fd-dropdown-item"
                    onClick={handleLogout}
                    style={{ color: "#FF5252" }}
                  >
                    <LogOut size={14} /> Logout
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* BODY */}
      <div className="fd-body">
        {/* SIDEBAR */}
        <aside className="fd-sidebar">
          <div className="fd-profile-card">
            <FarmerAvatar
              name={user?.name || user?.displayName || farmName}
              size={72}
            />
            <div className="fd-pc-role">Verified Farmer</div>
            <div className="fd-pc-name">
              {(() => {
                if (user?.name &&
                    !user.name.toLowerCase()
                      .includes('farm')) {
                  return user.name
                }
                if (user?.displayName &&
                    !user.displayName.toLowerCase()
                      .includes('farm')) {
                  return user.displayName
                }
                try {
                  const s = JSON.parse(
                    localStorage.getItem('ks_user')
                    || 'null'
                  )
                  if (s?.name &&
                      !s.name.toLowerCase()
                        .includes('farm')) {
                    return s.name
                  }
                  if (s?.email) {
                    return s.email.split('@')[0]
                  }
                } catch {}
                return 'Farmer'
              })()}
            </div>

            {/* Farm name shown separately */}
            {(user?.farmName ||
              user?.name?.toLowerCase()
                .includes('farm')) && (
              <div style={{
                fontFamily: 'DM Sans',
                fontSize: 11,
                color: '#B0A898',
                marginTop: 2
              }}>
                🌾 {user?.farmName
                  || user?.name}
              </div>
            )}
            <div className="fd-pc-email">{ownerEmail}</div>
            <div className="fd-pc-status">
              <div className="fd-status-dot"></div> Output Active
            </div>
          </div>

          <div className="fd-nav-label">Main Menu</div>
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`fd-nav-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span style={{ fontSize: "18px" }}>{tab.icon}</span> {tab.label}
            </button>
          ))}
          <button className="fd-nav-item" onClick={() => navigate("/marketplace")}>
            <span style={{ fontSize: "18px" }}>🛒</span> Marketplace
          </button>
          <button className="fd-nav-item" onClick={() => navigate("/support")}>
            <span style={{ fontSize: "18px" }}>🎧</span> Support
          </button>

          <div className="fd-sb-div"></div>

          <Button
            variant="ghost"
            fullWidth
            style={{ border: '1px solid #EDD9B0', marginTop: '16px' }}
            onClick={() =>
              navigate(`/marketplace?owner=${encodeURIComponent(ownerEmail)}`)
            }
          >
            View My Store
          </Button>

          <div className="fd-qs-grid">
            <div className="fd-qs-cell">
              <div className="fd-qs-val">{stats?.totalProducts || 0}</div>
              <div className="fd-qs-lbl">Listings</div>
            </div>
            <div className="fd-qs-cell">
              <div className="fd-qs-val warn">{(products || []).filter(p => (Number(p.quantity) || 0) < 5).length}</div>
              <div className="fd-qs-lbl">Low Stock</div>
            </div>
          </div>

          <button className="fd-btn-logout" onClick={handleLogout}>
            <LogOut size={16} /> Logout
          </button>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="fd-main-area">
          <div style={{ marginBottom: '1.5rem' }}>
            <Breadcrumb items={[
              { label: 'Home', path: '/' },
              { label: 'Farmer Dashboard' }
            ]} />
          </div>

          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {/* Welcome Hero */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="fd-hero"
              >
                <svg className="fd-hero-leaf" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22l1-2.3A13.89,13.89 0 0,0 20.25,10.05C21.5,7.45 21.54,4.74 20.5,2C19.22,2.44 17.65,3.62 16.42,5.19C15.11,6.87 14,9.27 14,12C14,14.62 15.03,16.71 16.27,18.06L17.52,16.81C16.48,15.68 15.65,13.93 15.65,12C15.65,9.66 16.63,7.5 17.84,6C18.84,4.72 20.14,3.77 21.14,3.34C20.69,5 19.82,6.96 17,8M6.28,15.68L4.39,15C5.9,11.23 8.35,9.08 11.29,7.67L12.35,9.3C10,10.45 8.16,12.23 6.28,15.68Z" />
                </svg>
                <div className="fd-hero-dots"></div>

                <div className="fd-hero-left">
                  <div className="fd-hero-tag">Welcome back,</div>
                  <h1 className="fd-hero-title">
                    {(() => {
                      if (user?.name &&
                          !user.name.toLowerCase()
                            .includes('farm')) {
                        return user.name
                      }
                      if (user?.displayName &&
                          !user.displayName.toLowerCase()
                            .includes('farm')) {
                        return user.displayName
                      }
                      return farmName
                    })()}
                  </h1>
                  <p className="fd-hero-sub">
                    Your digital command center. Monitor stock levels, track incoming
                    orders, and manage your marketplace listings all in one place.
                  </p>
                  <div className="fd-hero-actions">
                    <button
                      className="fd-btn-hero-pri"
                      onClick={() => setActiveTab('products')}
                    >
                      Manage Inventory
                    </button>
                    <button
                      className="fd-btn-hero-sec"
                      onClick={() => {
                        setActiveTab('products')
                        setTimeout(() => document.getElementById("add-product-form")?.scrollIntoView({ behavior: "smooth" }), 100)
                      }}
                    >
                      Add New Item
                    </button>
                  </div>
                </div>

                <div className="fd-hero-right hidden sm:block">
                  <div className="fd-hero-login-pill">
                    <div className="fd-hl-top">
                      <span>Last signed in</span>
                    </div>
                    <div className="fd-hl-date">
                      {new Date().toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </div>
                    <div className="fd-hl-time">
                      {new Date().toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* KPI Cards */}
              <div className="fd-stats-grid">
                <Card className="fd-stat-card" style={{ padding: '24px', position: 'relative' }}>
                  <div className="fd-sc-bg-shape"></div>
                  <div className="fd-sc-top">
                    <div className="fd-sc-icon-box" style={{ background: "rgba(45, 79, 30, 0.1)", color: "#2D4F1E" }}>
                      <span style={{ fontSize: "20px" }}>📦</span>
                    </div>
                    <StatusBadge status="Delivered" text="Live" />
                  </div>
                  <div className="fd-sc-value"><Counter value={stats?.totalProducts || 0} /></div>
                  <div className="fd-sc-label">Total Listings</div>
                  <div className="fd-sc-sub">Active in marketplace</div>
                </Card>

                <Card className="fd-stat-card" style={{ padding: '24px', position: 'relative' }}>
                  <div className="fd-sc-bg-shape" style={{ backgroundColor: "#4CAF50" }}></div>
                  <div className="fd-sc-top">
                    <div className="fd-sc-icon-box" style={{ background: "rgba(76, 175, 80, 0.1)", color: "#4CAF50" }}>
                      <span style={{ fontSize: "20px" }}>📊</span>
                    </div>
                    <StatusBadge status="Delivered" text="Stocked" />
                  </div>
                  <div className="fd-sc-value"><Counter value={stats?.totalStock || 0} /></div>
                  <div className="fd-sc-label">Total Units</div>
                  <div className="fd-sc-sub">Available across listings</div>
                </Card>

                <Card className="fd-stat-card" style={{ padding: '24px', position: 'relative' }}>
                  <div className="fd-sc-bg-shape" style={{ backgroundColor: "#E27D60" }}></div>
                  <div className="fd-sc-top">
                    <div className="fd-sc-icon-box" style={{ background: "rgba(226, 125, 96, 0.1)", color: "#E27D60" }}>
                      <span style={{ fontSize: "20px" }}>⚠️</span>
                    </div>
                    <StatusBadge status="processing" text="Action Req" />
                  </div>
                  <div className="fd-sc-value" style={{ color: "#E27D60" }}>
                    <Counter value={stats?.lowStock || 0} />
                  </div>
                  <div className="fd-sc-label">Low Stock</div>
                  <div className="fd-sc-sub">&lt; 5 units remaining</div>
                </Card>

                <Card className="fd-stat-card" style={{ padding: '24px', position: 'relative' }}>
                  <div className="fd-sc-bg-shape" style={{ backgroundColor: "#7A7A7A" }}></div>
                  <div className="fd-sc-top">
                    <div className="fd-sc-icon-box" style={{ background: "rgba(122, 122, 122, 0.1)", color: "#7A7A7A" }}>
                      <span style={{ fontSize: "20px" }}>🔒</span>
                    </div>
                    <StatusBadge status="Cancelled" text="Drafts" />
                  </div>
                  <div className="fd-sc-value" style={{ color: "#7A7A7A" }}>
                    <Counter value={stats?.unpublished || 0} />
                  </div>
                  <div className="fd-sc-label">Unpublished</div>
                  <div className="fd-sc-sub">Hidden from buyers</div>
                </Card>
              </div>

              <div className="fd-bottom-row">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="fd-rev-card">
                  <svg className="fd-hero-leaf" viewBox="0 0 24 24" fill="currentColor"><path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22l1-2.3A13.89,13.89 0 0,0 20.25,10.05C21.5,7.45 21.54,4.74 20.5,2C19.22,2.44 17.65,3.62 16.42,5.19C15.11,6.87 14,9.27 14,12C14,14.62 15.03,16.71 16.27,18.06L17.52,16.81C16.48,15.68 15.65,13.93 15.65,12C15.65,9.66 16.63,7.5 17.84,6C18.84,4.72 20.14,3.77 21.14,3.34C20.69,5 19.82,6.96 17,8M6.28,15.68L4.39,15C5.9,11.23 8.35,9.08 11.29,7.67L12.35,9.3C10,10.45 8.16,12.23 6.28,15.68Z" /></svg>
                  <h3 className="fd-rev-title">Earnings Summary</h3>
                  <div className="fd-rev-stats">
                    <div className="fd-rev-col">
                      <div className="fd-rev-val">{formatCurrency(totalRevenue / 4)}</div>
                      <div className="fd-rev-lbl">This Week</div>
                    </div>
                    <div className="fd-rev-col">
                      <div className="fd-rev-val">{formatCurrency(totalRevenue)}</div>
                      <div className="fd-rev-lbl">This Month</div>
                    </div>
                  </div>
                  <button className="fd-btn-payout">Request Payout</button>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="fd-orders-card">
                  <div className="fd-orders-header">
                    <div>
                      <h3 className="fd-orders-title">Recent Orders</h3>
                      <div className="text-sm text-gray-500 mt-1">Latest incoming customer requests</div>
                    </div>
                    <Link to="#" onClick={() => setActiveTab('analytics')} className="fd-orders-view-all">View All →</Link>
                  </div>
                  <div>
                    {(recentOrders || []).length > 0 ? (recentOrders || []).map((ord, idx) => (
                      <div key={idx} className="fd-order-row">
                        <div className="fd-order-icon"><span style={{ fontSize: '18px' }}>📦</span></div>
                        <div className="fd-order-mid">
                          <div className="fd-order-id">{ord.id} • {ord.item}</div>
                          <div className="fd-order-meta">{ord.status || 'Recent'} • {(ord.quantity || 1)} items</div>
                        </div>
                        <div className="fd-order-amt">{formatCurrency(ord.total)}</div>
                      </div>
                    )) : (
                      <div style={{ padding: '20px', textAlign: 'center', color: '#7A7A7A', fontSize: '13px' }}>
                        No recent orders found. Start listing items to get sales!
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>

              <div className="fd-alerts-strip" role="alert" style={{ marginTop: '24px' }}>
                <div className="fd-alert-pill warn">
                  <span style={{ fontSize: '14px' }}>⚠️</span> Action Item: You have 2 new unread messages from buyers.
                </div>
                {(stats?.lowStock || 0) > 0 && (
                  <div className="fd-alert-pill info">
                    <span style={{ fontSize: '14px' }}>💡</span> Tip: Restock the {stats.lowStock} items running low to boost visibility.
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ANALYTICS TAB */}
          {activeTab === 'analytics' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="fd-charts-row">
                <div className="fd-chart-card">
                  <div className="fd-cc-header">
                    <div>
                      <div className="fd-cc-tag">Analytics</div>
                      <h3 className="fd-cc-title">Weekly Sales Trend</h3>
                      <div className="fd-cc-sub">Your revenue over the last {chartPeriod === '7d' ? '7 days' : 'month'}</div>
                    </div>
                    <div className="fd-cc-right">
                      <span style={{
                        fontFamily: "DM Sans", fontSize: 11, color: hasSalesData ? "#4CAF50" : "#E27D60",
                        padding: "3px 10px", background: hasSalesData ? "rgba(76,175,80,0.1)" : "rgba(226,125,96,0.1)",
                        borderRadius: 999, marginRight: 4, fontWeight: 700,
                      }}>{hasSalesData ? "🟢 Real Data" : "📊 Market Data"}</span>
                      <div className="fd-period-selector">
                        {["7d", "1m"].map((p) => (
                          <button key={p} className={`fd-period-btn ${chartPeriod === p ? "active" : ""}`} onClick={() => setChartPeriod(p)}>{p.toUpperCase()}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                  {analyticsLoading ? <LoadingSkeleton2 /> : (
                    <div style={{ width: '100%', minHeight: 240, position: 'relative' }}>
                      <ResponsiveContainer width="100%" height={240} minWidth={200}>
                        <AreaChart data={chartData || []}>
                          <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#2D4F1E" stopOpacity={0.8} />
                              <stop offset="95%" stopColor="#2D4F1E" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EDD9B0" />
                          <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#7A7A7A' }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#7A7A7A' }} tickFormatter={v => `₹${v}`} />
                          <Tooltip content={<SalesTrendTooltip />} cursor={{ fill: "rgba(45, 79, 30, 0.05)" }} />
                          <Area type="monotone" dataKey="revenue" stroke="#2D4F1E" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                        </AreaChart>
                      </ResponsiveContainer>

                      {!hasSalesData && (
                        <div style={{
                          position: 'absolute',
                          top: 0, left: 0, right: 0, bottom: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'rgba(253, 250, 244, 0.4)',
                          backdropFilter: 'blur(1px)',
                          borderRadius: 12,
                          zIndex: 10,
                          padding: 20,
                          textAlign: 'center'
                        }}>
                          <div style={{
                            padding: '16px 24px',
                            background: 'white',
                            borderRadius: 16,
                            boxShadow: '0 8px 24px rgba(45,79,30,0.12)',
                            border: '1.5px solid #EDD9B0',
                            maxWidth: 320
                          }}>
                            <div style={{ fontSize: 24, marginBottom: 8 }}>
                              {localProducts.length > 0 ? '📢' : '🌾'}
                            </div>
                            <h4 style={{ fontFamily: 'DM Sans', color: '#2D4F1E', margin: '0 0 6px', fontSize: 16, fontWeight: 700 }}>
                              {localProducts.length > 0 ? 'Awaiting First Order' : 'No orders yet'}
                            </h4>
                            <p style={{ fontFamily: 'DM Sans', color: '#7A7A7A', fontSize: 12, margin: '0 0 16px', lineHeight: 1.5 }}>
                              {localProducts.length > 0 
                                ? `You have ${localProducts.length} items live in the market. Once buyers place an order, your sales trends will appear here!` 
                                : 'List your products in the marketplace to start seeing sales trends and revenue!'}
                            </p>
                            
                            {localProducts.length === 0 && (
                              <Button 
                                variant="primary" 
                                size="sm" 
                                onClick={() => {
                                  setMobileMenuOpen(false);
                                  setActiveTab('products');
                                  setShowAddProduct(true);
                                }}
                                style={{ width: '100%', fontSize: 11 }}
                              >
                                Add Your First Product
                              </Button>
                            )}
                            
                            {localProducts.length > 0 && (
                              <div style={{ 
                                fontSize: 11, color: '#2D4F1E', padding: '8px', 
                                background: 'rgba(45,79,30,0.05)', borderRadius: 8,
                                fontWeight: 500
                              }}>
                                Tip: Share your shop link with farmers to get traction!
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="fd-chart-card">
                  <div className="fd-cc-header">
                    <h3 className="fd-cc-title">Category Spread</h3>
                    <div className="fd-cc-sub">Distribution of your sales</div>
                  </div>
                  {analyticsLoading ? <LoadingSkeleton /> : (
                    <div style={{ width: '100%', minHeight: 240, position: 'relative' }}>
                      <ResponsiveContainer width="100%" height={240} minWidth={200}>
                        <PieChart>
                          <Pie
                            data={categoryData || []}
                            innerRadius={65}
                            outerRadius={90}
                            paddingAngle={4}
                            dataKey="value"
                            stroke="none"
                          >
                            {(categoryData || []).map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={getCategoryColor(entry.name, index)} />
                            ))}
                          </Pie>
                          <Tooltip content={<CategoryTooltip />} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="fd-pie-center">
                        <div className="fd-pie-val">{(categoryData || []).length}</div>
                        <div className="fd-pie-lbl">Categories</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* PRODUCTS TAB */}
          {activeTab === 'products' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {/* Add Product Form */}
              <section id="add-product-form" className="fd-form-section" style={{ marginTop: 0 }}>
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-gray-800 font-serif" style={{ fontFamily: "'Playfair Display', serif" }}>Add New Listing</h3>
                  <p className="text-sm text-gray-500 mt-1">Fill out the details below to add a product to your inventory.</p>
                </div>
                <form onSubmit={handleProductSubmit(onAddProductSubmit)}>
                  <div className="fd-form-grid">
                    <div className="fd-form-group span-2">
                      <div className={`fd-input-wrapper ${productErrors.name ? 'error' : ''}`}>
                        <label className="fd-label">Product Name *</label>
                        <input
                          type="text"
                          className="fd-input"
                          placeholder="e.g. Organic Bell Peppers"
                          {...registerProduct('name', { required: 'Product name is required' })}
                        />
                        {productErrors.name && <span className="fd-error-msg">{productErrors.name.message}</span>}
                      </div>
                    </div>
                    <div className="fd-form-group">
                      <label className="fd-label">Category *</label>
                      <select
                        className="fd-select"
                        {...registerProduct('category', { required: 'Category is required' })}
                      >
                        <option value="">Select Category</option>
                        <option value="Vegetables">Vegetables</option>
                        <option value="Fruits">Fruits</option>
                        <option value="Dairy">Dairy</option>
                        <option value="Grains">Grains & Pulses</option>
                        <option value="Spices">Spices</option>
                      </select>
                      {productErrors.category && <span className="fd-error-msg">{productErrors.category.message}</span>}
                    </div>
                    <div className="fd-form-group span-2">
                      <label className="fd-label">Short Description</label>
                      <textarea
                        className="fd-textarea"
                        placeholder="Highlight key freshness or organic details..."
                        {...registerProduct('description')}
                      ></textarea>
                    </div>
                    <div className="fd-form-group">
                      <div className={`fd-input-wrapper ${productErrors.price ? 'error' : ''}`}>
                        <label className="fd-label">Price per Unit *</label>
                        <div style={{ position: 'relative' }}>
                          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#7A7A7A' }}>₹</span>
                          <input
                            type="number"
                            step="0.01"
                            className="fd-input"
                            style={{ paddingLeft: 28 }}
                            placeholder="0.00"
                            {...registerProduct('price', { required: 'Price is required', min: { value: 0.1, message: 'Price must be greater than 0' } })}
                          />
                        </div>
                        {productErrors.price && <span className="fd-error-msg">{productErrors.price.message}</span>}
                      </div>
                      {priceLoading && (
                        <div style={{ marginTop: 2, fontFamily: 'DM Sans', fontSize: 10, color: '#7A7A7A' }}>
                          Checking mandi rate...
                        </div>
                      )}

                      {/* Cost inputs */}
                      <div style={{
                        marginTop: 16,
                        padding: 16,
                        background: '#F5E6CC',
                        borderRadius: 12,
                        border: '1px solid #EDD9B0'
                      }}>
                        <p style={{
                          fontFamily: 'DM Sans',
                          fontWeight: 700,
                          fontSize: 12,
                          color: '#2D4F1E',
                          margin: '0 0 12px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em'
                        }}>
                          💰 Enter Your Costs (per kg)
                        </p>

                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: 8
                        }}>
                        {[
                            {
                              key: 'seedCost',
                              label: 'Seeds/Plants',
                              placeholder: '₹2'
                            },
                            {
                              key: 'laborCost',
                              label: 'Labor',
                              placeholder: '₹1.5'
                            },
                            {
                              key: 'transportCost',
                              label: 'Transport',
                              placeholder: '₹1'
                            },
                            {
                              key: 'otherCost',
                              label: 'Other',
                              placeholder: '₹0.5'
                            }
                          ].map(field => (
                            <div key={field.key}>
                              <label style={{
                                fontFamily: 'DM Sans',
                                fontSize: 10,
                                color: '#7A7A7A',
                                display: 'block',
                                marginBottom: 3,
                                textTransform: 'uppercase'
                              }}>
                                {field.label}
                              </label>
                              <input
                                type="number"
                                step="0.01"
                                placeholder={field.placeholder}
                                {...registerProduct(field.key)}
                                style={{
                                  width: '100%',
                                  padding: '6px 10px',
                                  borderRadius: 8,
                                  border: '1px solid #EDD9B0',
                                  background: 'white',
                                  fontFamily: 'DM Sans',
                                  fontSize: 13,
                                  color: '#4A4A4A',
                                  boxSizing: 'border-box'
                                }}
                              />
                            </div>
                          ))}
                        </div>

                        {/* ── Live Cost Total ── */}
                        {(() => {
                          const rawTotal = (
                            parseFloat(productFormData.seedCost || 0) +
                            parseFloat(productFormData.laborCost || 0) +
                            parseFloat(productFormData.transportCost || 0) +
                            parseFloat(productFormData.otherCost || 0)
                          );
                          const hasCosts = rawTotal > 0;
                          const qty = parseFloat(productFormData.quantity || 0);
                          // If quantity is entered, divide total costs by qty to get per-kg cost
                          const costPerKg = qty > 0 ? rawTotal / qty : rawTotal;
                          const costPerKgRounded = Math.round(costPerKg * 100) / 100;
                          const price = parseFloat(productFormData.price || 0);
                          const suggestedPrice = Math.ceil(costPerKgRounded * 1.20); // 20% margin
                          return hasCosts ? (
                            <div style={{
                              marginTop: 12,
                              padding: '10px 12px',
                              background: '#FDFAF4',
                              borderRadius: 10,
                              border: '1.5px solid #EDD9B040'
                            }}>
                              {/* Raw total entered */}
                              <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: qty > 0 ? 4 : 6
                              }}>
                                <span style={{
                                  fontFamily: 'DM Sans',
                                  fontWeight: 600,
                                  fontSize: 10,
                                  color: '#B0A898',
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.05em'
                                }}>
                                  Total Costs Entered
                                </span>
                                <span style={{
                                  fontFamily: 'DM Sans',
                                  fontWeight: 700,
                                  fontSize: 13,
                                  color: '#7A7A7A'
                                }}>
                                  ₹{rawTotal.toFixed(2)}
                                </span>
                              </div>

                              {/* Per-kg cost (main highlight) */}
                              {qty > 0 && (
                                <div style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  marginBottom: 6,
                                  paddingTop: 4,
                                  borderTop: '1px dashed #EDD9B0'
                                }}>
                                  <span style={{
                                    fontFamily: 'DM Sans',
                                    fontWeight: 700,
                                    fontSize: 11,
                                    color: '#7A7A7A',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em'
                                  }}>
                                    Cost per kg (÷ {qty})
                                  </span>
                                  <span style={{
                                    fontFamily: 'DM Sans',
                                    fontWeight: 800,
                                    fontSize: 18,
                                    color: '#FF5252'
                                  }}>
                                    ₹{costPerKgRounded}
                                  </span>
                                </div>
                              )}

                              {/* Per-kg if no quantity */}
                              {qty <= 0 && (
                                <div style={{
                                  fontFamily: 'DM Sans',
                                  fontSize: 10,
                                  color: '#B0A898',
                                  marginBottom: 6
                                }}>
                                  Enter quantity to see per-kg breakdown
                                </div>
                              )}

                              {/* Profit/loss per kg */}
                              {price > 0 && (
                                <div style={{
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  marginBottom: 6,
                                  paddingTop: 6,
                                  borderTop: '1px dashed #EDD9B0'
                                }}>
                                  <span style={{
                                    fontFamily: 'DM Sans',
                                    fontSize: 11,
                                    color: '#7A7A7A'
                                  }}>
                                    Profit per kg
                                  </span>
                                  <span style={{
                                    fontFamily: 'DM Sans',
                                    fontWeight: 800,
                                    fontSize: 14,
                                    color: price >= costPerKgRounded ? '#4CAF50' : '#FF5252'
                                  }}>
                                    {price >= costPerKgRounded ? '✅' : '❌'}{' '}
                                    ₹{Math.round((price - costPerKgRounded) * 100) / 100}/kg
                                  </span>
                                </div>
                              )}

                              <button
                                type="button"
                                onClick={() => setProductValue('price', String(suggestedPrice))}
                                style={{
                                  width: '100%',
                                  marginTop: 6,
                                  padding: '7px 12px',
                                  background: 'linear-gradient(135deg, #2D4F1E, #3D6B2A)',
                                  border: 'none',
                                  borderRadius: 8,
                                  color: 'white',
                                  fontFamily: 'DM Sans',
                                  fontWeight: 700,
                                  fontSize: 11,
                                  cursor: 'pointer',
                                  boxShadow: '0 2px 6px rgba(45,79,30,0.2)'
                                }}
                              >
                                Use ₹{suggestedPrice}/kg as Price (cost + 20% profit)
                              </button>
                            </div>
                          ) : null;
                        })()}
                      </div>

                      {/* Profit Analysis Result */}
                      {profitAnalysis &&
                       productFormData.price &&
                       productFormData.quantity && (
                        <div style={{
                          marginTop: 12,
                          padding: 16,
                          background: '#FDFAF4',
                          borderRadius: 12,
                          border: `1.5px solid ${
                            profitAnalysis.statusColor
                          }40`
                        }}>
                          {/* Status badge */}
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: 12
                          }}>
                            <span style={{
                              fontFamily: 'DM Sans',
                              fontWeight: 800,
                              fontSize: 14,
                              color: profitAnalysis.statusColor
                            }}>
                              {profitAnalysis.statusIcon}
                              {' '}{profitAnalysis.status}
                            </span>
                            <span style={{
                              fontFamily: 'DM Sans',
                              fontWeight: 700,
                              fontSize: 12,
                              color: profitAnalysis.statusColor,
                              background: `${
                                profitAnalysis.statusColor
                              }15`,
                              padding: '2px 10px',
                              borderRadius: 999
                            }}>
                              {profitAnalysis.profitMargin}%
                              margin
                            </span>
                          </div>

                          {/* Key numbers */}
                          <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3,1fr)',
                            gap: 8,
                            marginBottom: 12
                          }}>
                            {[
                              {
                                label: 'Cost/kg',
                                value: `₹${profitAnalysis.totalCostPerKg}`,
                                color: '#FF5252'
                              },
                              {
                                label: 'Profit/kg',
                                value: `₹${profitAnalysis.profitPerKg}`,
                                color: profitAnalysis.profitPerKg >= 0
                                  ? '#4CAF50' : '#FF5252'
                              },
                              {
                                label: 'Break Even',
                                value: `₹${profitAnalysis.breakEvenPrice}`,
                                color: '#E27D60'
                              }
                            ].map(item => (
                              <div key={item.label} style={{
                                background: '#F5E6CC',
                                borderRadius: 8,
                                padding: '8px 10px',
                                textAlign: 'center'
                              }}>
                                <div style={{
                                  fontFamily: 'DM Sans',
                                  fontSize: 9,
                                  color: '#7A7A7A',
                                  textTransform: 'uppercase',
                                  marginBottom: 3
                                }}>
                                  {item.label}
                                </div>
                                <div style={{
                                  fontFamily: 'DM Sans',
                                  fontWeight: 800,
                                  fontSize: 16,
                                  color: item.color
                                }}>
                                  {item.value}
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Total projection */}
                          <div style={{
                            background: '#F5E6CC',
                            borderRadius: 8,
                            padding: '10px 12px',
                            marginBottom: 10
                          }}>
                            <div style={{
                              fontFamily: 'DM Sans',
                              fontSize: 11,
                              color: '#7A7A7A',
                              marginBottom: 4
                            }}>
                              If you sell all{' '}
                              {profitAnalysis.quantity} kg:
                            </div>
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between'
                            }}>
                              <span style={{
                                fontFamily: 'DM Sans',
                                fontSize: 12,
                                color: '#4A4A4A'
                              }}>
                                Revenue: ₹{
                                  profitAnalysis.totalRevenue
                                }
                              </span>
                              <span style={{
                                fontFamily: 'DM Sans',
                                fontSize: 12,
                                color: '#4A4A4A'
                              }}>
                                Cost: ₹{profitAnalysis.totalCost}
                              </span>
                              <span style={{
                                fontFamily: 'DM Sans',
                                fontWeight: 800,
                                fontSize: 13,
                                color: profitAnalysis.totalProfit
                                  >= 0 ? '#4CAF50' : '#FF5252'
                              }}>
                                {profitAnalysis.totalProfit >= 0
                                  ? '✅' : '❌'
                                } Profit: ₹{
                                  profitAnalysis.totalProfit
                                }
                              </span>
                            </div>
                          </div>

                          {/* Warning if loss */}
                          {profitAnalysis.status === 'LOSS' && (
                            <div style={{
                              padding: '8px 12px',
                              background: 'rgba(255,82,82,0.08)',
                              borderRadius: 8,
                              marginBottom: 8
                            }}>
                              <p style={{
                                fontFamily: 'DM Sans',
                                fontSize: 12,
                                color: '#FF5252',
                                margin: 0,
                                fontWeight: 600
                              }}>
                                ⚠️ Your price ₹{
                                  profitAnalysis.sellingPrice
                                }/kg is below your cost ₹{
                                  profitAnalysis.totalCostPerKg
                                }/kg. You will lose money!
                              </p>
                            </div>
                          )}

                          {/* Suggested price */}
                          {profitAnalysis.status === 'LOSS' && (
                            <button
                              type="button"
                              onClick={() => setProductValue(
                                'price',
                                String(
                                  profitAnalysis
                                    .suggestedMinPrice
                                )
                              )}
                              style={{
                                width: '100%',
                                padding: '8px',
                                background:
                                  'linear-gradient(135deg,' +
                                  '#2D4F1E,#3D6B2A)',
                                border: 'none',
                                borderRadius: 8,
                                color: 'white',
                                fontFamily: 'DM Sans',
                                fontWeight: 700,
                                fontSize: 12,
                                cursor: 'pointer'
                              }}
                            >
                              Use Suggested Price ₹{
                                profitAnalysis.suggestedMinPrice
                              }/kg (20% profit margin)
                            </button>
                          )}

                          {/* Platform fee note */}
                          <p style={{
                            fontFamily: 'DM Sans',
                            fontSize: 10,
                            color: '#B0A898',
                            margin: '8px 0 0',
                            textAlign: 'center'
                          }}>
                            Platform fee ₹{
                              profitAnalysis.platformFee
                            }/kg (2%) included in calculation
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="fd-form-group">
                      <div className={`fd-input-wrapper ${productErrors.quantity ? 'error' : ''}`}>
                        <label className="fd-label">Quantity *</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: '8px' }}>
                          <input
                            type="number"
                            className="fd-input"
                            placeholder="Qty"
                            {...registerProduct('quantity', { required: 'Quantity is required', min: { value: 1, message: 'Minimum 1' } })}
                          />
                          <select 
                            className="fd-select" 
                            style={{ height: '44px' }}
                            {...registerProduct('unit')}
                          >
                            {(units || []).map((u) => <option key={u} value={u}>{u}</option>)}
                          </select>
                        </div>
                        {productErrors.quantity && <span className="fd-error-msg">{productErrors.quantity.message}</span>}
                      </div>
                    </div>
                    <div className="fd-form-group span-2">
                      <label className="fd-label">Image URL</label>
                      <input 
                        type="text" 
                        className="fd-input" 
                        placeholder="Paste image URL..." 
                        {...registerProduct('image')} 
                      />
                    </div>

                    {/* Price Advisor Box */}
                    {priceAdvice && !priceLoading && (
                      <div className="fd-form-group span-2">
                        <div style={{
                          padding: '12px 16px',
                          borderRadius: 16,
                          background: priceAdvice.advice?.status === 'optimal' 
                            ? 'rgba(76,175,80,0.08)' 
                            : priceAdvice.advice?.status === 'too_low' 
                              ? 'rgba(255,82,82,0.08)' 
                              : 'rgba(226,125,96,0.08)',
                          border: `1.5px solid ${priceAdvice.advice?.color || '#EDD9B0'}40`,
                        }}>
                          {priceAdvice.mandi_rate && (
                            <div style={{ display: 'flex', gap: 20, marginBottom: 10, flexWrap: 'wrap' }}>
                              <div>
                                <div style={{ fontFamily: 'DM Sans', fontSize: 10, color: '#7A7A7A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mandi Rate</div>
                                <div style={{ fontFamily: 'DM Sans', fontWeight: 800, fontSize: 16, color: '#2D4F1E' }}>₹{priceAdvice.mandi_rate}/kg</div>
                              </div>
                              <div>
                                <div style={{ fontFamily: 'DM Sans', fontSize: 10, color: '#7A7A7A', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ideal Range</div>
                                <div style={{ fontFamily: 'DM Sans', fontWeight: 700, fontSize: 14, color: '#4A4A4A' }}>
                                  ₹{priceAdvice.grade_ranges?.[productFormData.grade || 'local']?.min}–₹{priceAdvice.grade_ranges?.[productFormData.grade || 'local']?.max}/kg
                                </div>
                              </div>
                            </div>
                          )}
                          
                          <p style={{ fontFamily: 'DM Sans', fontSize: 13, color: '#4A4A4A', margin: 0, lineHeight: 1.5, fontWeight: 500 }}>
                            {priceAdvice.advice?.advice}
                          </p>

                          {priceAdvice.advice?.status !== 'optimal' && (
                            <button
                              type="button"
                              onClick={() => setProductValue('price', String(priceAdvice.advice?.suggestedPrice))}
                              style={{
                                marginTop: 10,
                                padding: '6px 14px',
                                background: '#2D4F1E',
                                border: 'none',
                                borderRadius: 10,
                                color: 'white',
                                fontFamily: 'DM Sans',
                                fontWeight: 700,
                                fontSize: 12,
                                cursor: 'pointer',
                              }}
                            >
                              Use Suggested Price (₹{priceAdvice.advice?.suggestedPrice}/kg)
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Grade Selector */}
                    <div className="fd-form-group span-2">
                      <label style={{
                        fontFamily: 'DM Sans',
                        fontWeight: 700,
                        fontSize: 11,
                        color: '#4A4A4A',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        display: 'block',
                        marginBottom: 10
                      }}>
                        Product Grade *
                      </label>
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                        gap: 10
                      }}>
                        {GRADES.map(g => (
                          <button
                            key={g.value}
                            type="button"
                            onClick={() => setProductValue('grade', g.value)}
                            style={{
                              padding: '10px 12px',
                              borderRadius: 14,
                              border: `1.5px solid ${productFormData.grade === g.value ? '#2D4F1E' : '#EDD9B0'}`,
                              background: productFormData.grade === g.value ? 'rgba(45,79,30,0.08)' : '#FDFAF4',
                              cursor: 'pointer',
                              textAlign: 'left',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <div style={{
                              fontFamily: 'DM Sans',
                              fontWeight: 700,
                              fontSize: 13,
                              color: productFormData.grade === g.value ? '#2D4F1E' : '#4A4A4A'
                            }}>
                              {g.label}
                            </div>
                            <div style={{ fontFamily: 'DM Sans', fontSize: 11, color: '#7A7A7A', marginTop: 3 }}>
                              {g.desc}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                  </div>
                  <div className="mt-8 flex justify-end gap-3">
                    <Button variant="ghost" type="button" onClick={() => {
                      resetProduct();
                      setPriceAdvice(null);
                    }}>Clear Details</Button>

                    <Button type="submit" loading={isAdding} variant="secondary">Create Product</Button>
                  </div>
                  {formError && (
                    <div style={{
                      marginTop: 12,
                      padding: '10px 16px',
                      background: 'rgba(255,82,82,0.1)',
                      borderRadius: 10,
                      border: '1px solid #FF525230',
                      color: '#FF5252',
                      fontFamily: 'DM Sans',
                      fontSize: 13,
                      fontWeight: 500,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8
                    }}>
                      <AlertTriangle size={16} />
                      {formError}
                    </div>
                  )}
                </form>
              </section>

              {/* Inventory Table */}
              <section id="inventory-table" className="fd-table-section">
                <Card style={{ padding: 0, overflow: 'hidden' }}>
                  <div className="fd-tbl-header" style={{ padding: '24px', borderBottom: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <h3 style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700, fontSize: '20px', color: 'var(--color-primary)' }}>Manage Inventory</h3>
                      <div className="fd-tbl-count">{(localProducts || []).length} Total</div>
                    </div>
                  </div>
                  <div className="fd-tbl-filters" style={{ padding: '16px 24px', background: 'var(--color-bg-soft)' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className={`fd-tbl-pill ${tableFilter === 'all' ? 'active' : ''}`} onClick={() => setTableFilter('all')}>All Items</button>
                      <button className={`fd-tbl-pill ${tableFilter === 'published' ? 'active' : ''}`} onClick={() => setTableFilter('published')}>Published</button>
                      <button className={`fd-tbl-pill ${tableFilter === 'hidden' ? 'active' : ''}`} onClick={() => setTableFilter('hidden')}>Drafts</button>
                    </div>
                    <div className="fd-tbl-search-wrap">
                      <Search className="fd-tbl-search-icon" size={14} />
                      <input type="text" className="fd-tbl-search" placeholder="Search by name or cat..." value={tableSearchTerm} onChange={e => setTableSearchTerm(e.target.value)} />
                    </div>
                  </div>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="fd-table">
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Category</th>
                          <th>Price</th>
                          <th>Stock</th>
                          <th>Status</th>
                          <th style={{ textAlign: "right" }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        <AnimatePresence mode="popLayout">
                          {(filteredProducts || []).length > 0 ? (filteredProducts || []).map((p) => {
                            const isEditing = editingRows[p._id || p.id];
                            return (
                              <motion.tr key={p._id || p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="hoverable">
                                <td>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <img src={p.image || "https://images.unsplash.com/photo-1596040033229-a9821ebd058d"} alt={p.name} className="fd-td-img" />
                                    <div>{isEditing ? <input type="text" className="fd-input" style={{ height: '32px', fontSize: '12px', width: '150px' }} value={isEditing.name} onChange={(e) => handleEditField(p._id || p.id, "name", e.target.value)} /> : <div style={{ fontWeight: 600 }}>{p.name}</div>}</div>
                                  </div>
                                </td>
                                <td>{isEditing ? <input type="text" className="fd-input" style={{ height: '32px', fontSize: '12px', width: '100px' }} value={isEditing.category} onChange={(e) => handleEditField(p._id || p.id, "category", e.target.value)} /> : <StatusBadge status="Delivered" text={p.category || 'Other'} />}</td>
                                <td>{isEditing ? <input type="number" className="fd-input" style={{ height: '32px', fontSize: '12px', width: '80px' }} value={isEditing.price} onChange={(e) => handleEditField(p._id || p.id, "price", e.target.value)} /> : <div className="fd-td-price">{formatCurrency(p.price)}</div>}</td>
                                <td>{isEditing ? <input type="number" className="fd-input" style={{ height: '32px', fontSize: '12px', width: '60px' }} value={isEditing.quantity} onChange={(e) => handleEditField(p._id || p.id, "quantity", e.target.value)} /> : <div className="fd-td-qty">{p.quantity} <span style={{ fontSize: '12px' }}>{p.unit}</span></div>}</td>
                                <td><StatusBadge status={(p.isPublished || p.published) ? "Delivered" : "Cancelled"} text={(p.isPublished || p.published) ? "Published" : "Draft"} /></td>
                                <td style={{ textAlign: 'right' }}>
                                  <div className="fd-td-actions" style={{ justifyContent: 'flex-end' }}>
                                    {isEditing ? (
                                      <><Button size="sm" variant="success" onClick={() => saveEditRow(p._id || p.id)}>Save</Button><Button size="sm" variant="ghost" onClick={() => cancelEditRow(p._id || p.id)}>Cancel</Button></>
                                    ) : (
                                      <><Button size="sm" variant="ghost" onClick={() => startEditRow(p)}><Edit2 size={14} /></Button><Button size="sm" variant="ghost" onClick={() => handleTogglePublish(p._id || p.id, (p.isPublished || p.published))}><Eye size={14} /></Button><Button size="sm" variant="danger" onClick={() => confirmAndDelete(p._id || p.id, p.name)}><Trash2 size={14} /></Button></>
                                    )}
                                  </div>
                                </td>
                              </motion.tr>
                            );
                          }) : (
                            <tr><td colSpan={6}><div style={{ padding: '40px 0' }}><EmptyState icon={PackageOpen} title="Nothing to show" subtitle="Your inventory is empty." action={{ label: "Add Product", onClick: () => document.getElementById("add-product-form")?.scrollIntoView({ behavior: "smooth" }) }} /></div></td></tr>
                          )}
                        </AnimatePresence>
                      </tbody>
                    </table>
                  </div>
                </Card>
              </section>
            </motion.div>
          )}

          {/* MANDI TAB */}
          {activeTab === 'mandi' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {/* Today's Market Overview */}
              <div style={{ background: '#FDFAF4', borderRadius: 20, border: '1.5px solid #EDD9B0', padding: 24, marginBottom: 24 }}>
                <div style={{ marginBottom: 16 }}>
                  <span style={{ fontFamily: 'Caveat', fontSize: 16, color: '#E27D60' }}>Live from Agmarknet</span>
                  <h3 style={{ fontFamily: 'Playfair Display', fontWeight: 700, fontSize: 20, color: '#2D4F1E', margin: '4px 0 4px' }}>Today's Market Prices 📊</h3>
                  <p style={{ fontFamily: 'DM Sans', fontSize: 12, color: '#7A7A7A', margin: 0 }}>National Mandi Average • Source: Agmarknet</p>
                </div>
                {mandiLoading ? <LoadingSkeleton2 /> : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                    {(todayPrices || []).slice(0, 8).map(item => (
                      <div key={item.commodity} style={{ background: '#F5E6CC', borderRadius: 12, padding: '12px 14px', border: '1px solid #EDD9B0' }}>
                        <div style={{ fontFamily: 'DM Sans', fontSize: 10, color: '#7A7A7A', marginBottom: 4, textTransform: 'uppercase' }}>{item.commodity}</div>
                        <div style={{ fontFamily: 'DM Sans', fontWeight: 800, fontSize: 18, color: '#2D4F1E', lineHeight: 1 }}>
                          ₹{item.price_kg}<span style={{ fontSize: 10, fontWeight: 400 }}>/kg</span>
                        </div>
                        {item.price_qtl && (
                          <div style={{ fontFamily: 'DM Sans', fontSize: 11, fontWeight: 600, color: '#E27D60', marginTop: 4 }}>
                            ₹{item.price_qtl}<span style={{ fontSize: 9, fontWeight: 400 }}>/qtl</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <MandiRates />
            </motion.div>
          )}

          {activeTab === 'profile' && (
            <div style={{
              maxWidth: 700,
              margin: '0 auto',
              padding: '0 0 40px'
            }}>

              {/* Header */}
              <div style={{
                marginBottom: 28
              }}>
                <h2 style={{
                  fontFamily: 'Playfair Display',
                  fontWeight: 700,
                  fontSize: 28,
                  color: '#2D4F1E',
                  margin: '0 0 6px'
                }}>
                  Profile Settings
                </h2>
                <p style={{
                  fontFamily: 'DM Sans',
                  fontSize: 14,
                  color: '#7A7A7A',
                  margin: 0
                }}>
                  Your information is saved to
                  Firebase and MongoDB securely
                </p>
              </div>

              {/* Avatar section */}
              <div style={{
                background: '#FDFAF4',
                borderRadius: 16,
                border: '1.5px solid #EDD9B0',
                padding: '20px 24px',
                marginBottom: 20,
                display: 'flex',
                alignItems: 'center',
                gap: 20
              }}>
                <FarmerAvatar
                  name={watch('name')
                    || user?.name
                    || 'F'}
                  size={72}
                />
                <div>
                  <div style={{
                    fontFamily:
                      'Playfair Display',
                    fontWeight: 700,
                    fontSize: 20,
                    color: '#2D4F1E'
                  }}>
                    {watch('name')
                      || user?.name
                      || 'Your Name'}
                  </div>
                  <div style={{
                    fontFamily: 'DM Sans',
                    fontSize: 13,
                    color: '#7A7A7A',
                    marginTop: 4
                  }}>
                    {user?.email || ''}
                  </div>
                  <div style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    marginTop: 6,
                    padding: '3px 10px',
                    borderRadius: 999,
                    background:
                      'rgba(45,79,30,0.10)',
                    fontFamily: 'DM Sans',
                    fontWeight: 700,
                    fontSize: 11,
                    color: '#2D4F1E'
                  }}>
                    ✅ Verified Farmer
                  </div>
                </div>
              </div>

              {/* Messages are now handled by Mantine notifications */}

              <form onSubmit={handleSubmit(onSubmitProfile)}>
              {/* SECTION 1 — Personal Info */}
              <div style={{
                background: '#FDFAF4',
                borderRadius: 16,
                border: '1.5px solid #EDD9B0',
                padding: '20px 24px',
                marginBottom: 16
              }}>
                <h3 style={{
                  fontFamily: 'Playfair Display',
                  fontWeight: 700,
                  fontSize: 18,
                  color: '#2D4F1E',
                  margin: '0 0 16px'
                }}>
                  👤 Personal Information
                </h3>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 14
                }}>
                  <div key="name">
                    <label style={{ fontFamily: 'DM Sans', fontSize: 11, fontWeight: 700, color: '#4A4A4A', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Full Name *</label>
                    <input
                      type="text"
                      placeholder="Ramesh Kumar"
                      {...register('name', { required: 'Name is required' })}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1.5px solid ${profileErrors.name ? '#FF5252' : '#EDD9B0'}`, background: '#F5E6CC', fontFamily: 'DM Sans', fontSize: 13, color: '#4A4A4A', boxSizing: 'border-box', outline: 'none' }}
                    />
                    {profileErrors.name && <span style={{ fontSize: 10, color: '#FF5252', marginTop: 4, display: 'block', fontWeight: 600 }}>{profileErrors.name.message}</span>}
                  </div>

                  <div key="phone">
                    <label style={{ fontFamily: 'DM Sans', fontSize: 11, fontWeight: 700, color: '#4A4A4A', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Phone Number *</label>
                    <input
                      type="tel"
                      placeholder="+91 9876543210"
                      {...register('phone', { 
                        required: 'Phone is required',
                        pattern: { value: /^[0-9]{10}$/, message: 'Must be 10 digits' }
                      })}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1.5px solid ${profileErrors.phone ? '#FF5252' : '#EDD9B0'}`, background: '#F5E6CC', fontFamily: 'DM Sans', fontSize: 13, color: '#4A4A4A', boxSizing: 'border-box', outline: 'none' }}
                    />
                    {profileErrors.phone && <span style={{ fontSize: 10, color: '#FF5252', marginTop: 4, display: 'block', fontWeight: 600 }}>{profileErrors.phone.message}</span>}
                  </div>

                  <div key="experience">
                    <label style={{ fontFamily: 'DM Sans', fontSize: 11, fontWeight: 700, color: '#4A4A4A', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Years of Farming</label>
                    <input
                      type="number"
                      placeholder="15"
                      {...register('experience', { min: { value: 0, message: 'Invalid value' } })}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1.5px solid ${profileErrors.experience ? '#FF5252' : '#EDD9B0'}`, background: '#F5E6CC', fontFamily: 'DM Sans', fontSize: 13, color: '#4A4A4A', boxSizing: 'border-box', outline: 'none' }}
                    />
                    {profileErrors.experience && <span style={{ fontSize: 10, color: '#FF5252', marginTop: 4, display: 'block', fontWeight: 600 }}>{profileErrors.experience.message}</span>}
                  </div>

                  <div key="state">
                    <label style={{ fontFamily: 'DM Sans', fontSize: 11, fontWeight: 700, color: '#4A4A4A', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>State</label>
                    <input
                      type="text"
                      placeholder="Maharashtra"
                      {...register('state')}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #EDD9B0', background: '#F5E6CC', fontFamily: 'DM Sans', fontSize: 13, color: '#4A4A4A', boxSizing: 'border-box', outline: 'none' }}
                    />
                  </div>

                  <div key="district">
                    <label style={{ fontFamily: 'DM Sans', fontSize: 11, fontWeight: 700, color: '#4A4A4A', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>District</label>
                    <input
                      type="text"
                      placeholder="Nashik"
                      {...register('district')}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #EDD9B0', background: '#F5E6CC', fontFamily: 'DM Sans', fontSize: 13, color: '#4A4A4A', boxSizing: 'border-box', outline: 'none' }}
                    />
                  </div>

                  <div key="pincode">
                    <label style={{ fontFamily: 'DM Sans', fontSize: 11, fontWeight: 700, color: '#4A4A4A', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Pincode</label>
                    <input
                      type="text"
                      placeholder="422001"
                      {...register('pincode', {
                        pattern: { value: /^[0-9]{6}$/, message: 'Must be 6 digits' }
                      })}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1.5px solid ${profileErrors.pincode ? '#FF5252' : '#EDD9B0'}`, background: '#F5E6CC', fontFamily: 'DM Sans', fontSize: 13, color: '#4A4A4A', boxSizing: 'border-box', outline: 'none' }}
                    />
                    {profileErrors.pincode && <span style={{ fontSize: 10, color: '#FF5252', marginTop: 4, display: 'block', fontWeight: 600 }}>{profileErrors.pincode.message}</span>}
                  </div>
                </div>

                {/* Bio full width */}
                <div style={{ marginTop: 14 }}>
                  <label style={{
                    fontFamily: 'DM Sans',
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#4A4A4A',
                    display: 'block',
                    marginBottom: 5,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em'
                  }}>
                    About You
                  </label>
                  <textarea
                    placeholder="Tell buyers about yourself and your farming practices..."
                    {...register('bio')}
                    rows={3}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: '1.5px solid #EDD9B0',
                      background: '#F5E6CC',
                      fontFamily: 'DM Sans',
                      fontSize: 13,
                      color: '#4A4A4A',
                      boxSizing: 'border-box',
                      resize: 'vertical',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              {/* SECTION 2 — Farm Details */}
              <div style={{
                background: '#FDFAF4',
                borderRadius: 16,
                border: '1.5px solid #EDD9B0',
                padding: '20px 24px',
                marginBottom: 16
              }}>
                <h3 style={{
                  fontFamily: 'Playfair Display',
                  fontWeight: 700,
                  fontSize: 18,
                  color: '#2D4F1E',
                  margin: '0 0 16px'
                }}>
                  🌾 Farm Details
                </h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ fontFamily: 'DM Sans', fontSize: 11, fontWeight: 700, color: '#4A4A4A', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Farm Name</label>
                    <input type="text" placeholder="Green Valley Farm" {...register('farmName')} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #EDD9B0', background: '#F5E6CC', fontFamily: 'DM Sans', fontSize: 13, color: '#4A4A4A', boxSizing: 'border-box', outline: 'none' }} />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ fontFamily: 'DM Sans', fontSize: 11, fontWeight: 700, color: '#4A4A4A', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Farm Location / Village</label>
                    <input type="text" placeholder="Village name, Taluka" {...register('farmLocation')} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #EDD9B0', background: '#F5E6CC', fontFamily: 'DM Sans', fontSize: 13, color: '#4A4A4A', boxSizing: 'border-box', outline: 'none' }} />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ fontFamily: 'DM Sans', fontSize: 11, fontWeight: 700, color: '#4A4A4A', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Primary Crops</label>
                    <input type="text" placeholder="Tomato, Onion, Wheat" {...register('primaryCrops')} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #EDD9B0', background: '#F5E6CC', fontFamily: 'DM Sans', fontSize: 13, color: '#4A4A4A', boxSizing: 'border-box', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ fontFamily: 'DM Sans', fontSize: 11, fontWeight: 700, color: '#4A4A4A', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Farm Size</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input type="number" placeholder="5" {...register('farmSize', { min: { value: 0, message: 'Invalid' } })} style={{ flex: 1, padding: '10px 12px', borderRadius: 10, border: `1.5px solid ${profileErrors.farmSize ? '#FF5252' : '#EDD9B0'}`, background: '#F5E6CC', fontFamily: 'DM Sans', fontSize: 13, color: '#4A4A4A', outline: 'none' }} />
                      <select {...register('farmSizeUnit')} style={{ padding: '10px 12px', borderRadius: 10, border: '1.5px solid #EDD9B0', background: '#F5E6CC', fontFamily: 'DM Sans', fontSize: 13, color: '#4A4A4A', cursor: 'pointer' }}>
                        <option value="acres">Acres</option>
                        <option value="hectares">Hectares</option>
                        <option value="bigha">Bigha</option>
                        <option value="guntha">Guntha</option>
                      </select>
                    </div>
                    {profileErrors.farmSize && <span style={{ fontSize: 10, color: '#FF5252', marginTop: 4, display: 'block', fontWeight: 600 }}>{profileErrors.farmSize.message}</span>}
                  </div>
                </div>
              </div>

              {/* SECTION 3 — Payment Info */}
              <div style={{
                background: '#FDFAF4',
                borderRadius: 16,
                border: '1.5px solid #EDD9B0',
                padding: '20px 24px',
                marginBottom: 24
              }}>
                <h3 style={{
                  fontFamily: 'Playfair Display',
                  fontWeight: 700,
                  fontSize: 18,
                  color: '#2D4F1E',
                  margin: '0 0 4px'
                }}>
                  💳 Payment Details
                </h3>
                <p style={{
                  fontFamily: 'DM Sans',
                  fontSize: 12,
                  color: '#7A7A7A',
                  margin: '0 0 16px'
                }}>
                  For receiving payments from buyers
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ fontFamily: 'DM Sans', fontSize: 11, fontWeight: 700, color: '#4A4A4A', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>UPI ID</label>
                    <input type="text" placeholder="yourname@upi" {...register('upiId', { pattern: { value: /^[\w.-]+@[\w.-]+$/, message: 'Invalid UPI ID format' } })} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1.5px solid ${profileErrors.upiId ? '#FF5252' : '#EDD9B0'}`, background: '#F5E6CC', fontFamily: 'DM Sans', fontSize: 13, color: '#4A4A4A', boxSizing: 'border-box', outline: 'none' }} />
                    {profileErrors.upiId && <span style={{ fontSize: 10, color: '#FF5252', marginTop: 4, display: 'block', fontWeight: 600 }}>{profileErrors.upiId.message}</span>}
                  </div>
                  <div>
                    <label style={{ fontFamily: 'DM Sans', fontSize: 11, fontWeight: 700, color: '#4A4A4A', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Bank Name</label>
                    <input type="text" placeholder="State Bank of India" {...register('bankName')} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: '1.5px solid #EDD9B0', background: '#F5E6CC', fontFamily: 'DM Sans', fontSize: 13, color: '#4A4A4A', boxSizing: 'border-box', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ fontFamily: 'DM Sans', fontSize: 11, fontWeight: 700, color: '#4A4A4A', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Account Number</label>
                    <input type="password" autoComplete="off" placeholder="XXXXXXXXXXXX" {...register('accountNumber', { minLength: { value: 9, message: 'Too short' } })} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1.5px solid ${profileErrors.accountNumber ? '#FF5252' : '#EDD9B0'}`, background: '#F5E6CC', fontFamily: 'DM Sans', fontSize: 13, color: '#4A4A4A', boxSizing: 'border-box', outline: 'none' }} />
                    {profileErrors.accountNumber && <span style={{ fontSize: 10, color: '#FF5252', marginTop: 4, display: 'block', fontWeight: 600 }}>{profileErrors.accountNumber.message}</span>}
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ fontFamily: 'DM Sans', fontSize: 11, fontWeight: 700, color: '#4A4A4A', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.06em' }}>IFSC Code</label>
                    <input type="text" placeholder="SBIN0001234" {...register('ifscCode', { pattern: { value: /^[A-Z]{4}0[A-Z0-9]{6}$/, message: 'Invalid IFSC (e.g. SBIN0001234)' } })} style={{ width: '100%', padding: '10px 12px', borderRadius: 10, border: `1.5px solid ${profileErrors.ifscCode ? '#FF5252' : '#EDD9B0'}`, background: '#F5E6CC', fontFamily: 'DM Sans', fontSize: 13, color: '#4A4A4A', boxSizing: 'border-box', outline: 'none' }} />
                    {profileErrors.ifscCode && <span style={{ fontSize: 10, color: '#FF5252', marginTop: 4, display: 'block', fontWeight: 600 }}>{profileErrors.ifscCode.message}</span>}
                  </div>
                </div>

                <p style={{
                  fontFamily: 'DM Sans',
                  fontSize: 11,
                  color: '#B0A898',
                  marginTop: 12,
                  marginBottom: 0
                }}>
                  🔒 Your payment details are
                  encrypted and stored securely
                </p>
              </div>

              {/* Save Button */}
              <button
                type="submit"
                disabled={profileSubmitting}
                style={{
                  width: '100%',
                  padding: '16px',
                  background: profileSubmitting
                    ? '#7A7A7A'
                    : 'linear-gradient(135deg,' +
                      '#2D4F1E,#3D6B2A)',
                  border: 'none',
                  borderRadius: 14,
                  color: 'white',
                  fontFamily: 'DM Sans',
                  fontWeight: 700,
                  fontSize: 16,
                  cursor: profileSubmitting
                    ? 'not-allowed' : 'pointer',
                  boxShadow: profileSubmitting
                    ? 'none'
                    : '0 4px 16px ' +
                      'rgba(45,79,30,0.35)',
                  transition: 'all 200ms',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8
                }}
              >
                {profileSubmitting ? (
                  <>⏳ Saving Profile...</>
                ) : (
                  <>💾 Save Profile</>
                )}
              </button>
              </form>

            </div>
          )}



          {/* Mini Footer */}
          <footer className="fd-footer">
            <div className="fd-footer-text">
              © {new Date().getFullYear()} KrishiSaathi. Developed for local farmers.
            </div>
            <div className="fd-footer-links">
              <Link to="/about" className="fd-footer-link">About</Link>
              <Link to="/contact" className="fd-footer-link">Contact Support</Link>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
};

class DashboardErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('Dashboard crashed:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          background: '#F5E6CC',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'DM Sans',
          padding: 20
        }}>
          <div style={{
            background: '#FDFAF4',
            borderRadius: 20,
            padding: '40px 32px',
            textAlign: 'center',
            maxWidth: 440,
            width: '100%',
            border: '1.5px solid #EDD9B0',
            boxShadow: '0 8px 32px rgba(45,79,30,0.12)'
          }}>
            <div style={{ fontSize: 48 }}>🌾</div>
            <h2 style={{
              fontFamily: 'Playfair Display',
              fontWeight: 700,
              fontSize: 24,
              color: '#2D4F1E',
              margin: '16px 0 8px'
            }}>
              Dashboard Error
            </h2>
            <p style={{
              fontFamily: 'DM Sans',
              fontSize: 13,
              color: '#7A7A7A',
              marginBottom: 8,
              lineHeight: 1.6
            }}>
              {this.state.error?.message || 'Something went wrong'}
            </p>
            <p style={{
              fontFamily: 'DM Sans',
              fontSize: 11,
              color: '#B0A898',
              marginBottom: 24
            }}>
              Open F12 console for details
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '12px 28px',
                background: 'linear-gradient(135deg, #E27D60, #C96848)',
                border: 'none',
                borderRadius: 12,
                color: 'white',
                fontFamily: 'DM Sans',
                fontWeight: 700,
                fontSize: 14,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(226,125,96,0.35)'
              }}
            >
              Reload Dashboard
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function FarmerDashboardPage() {
  return (
    <DashboardErrorBoundary>
      <FarmerDashboard />
    </DashboardErrorBoundary>
  );
}
