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
import { motion, AnimatePresence } from 'framer-motion'

// Lucide icons
import {
  TrendingUp,
  TrendingDown,
  Package,
  ShoppingBag,
  BarChart3,
  Leaf,
  Plus,
  RefreshCw,
  AlertTriangle,
  Eye,
  EyeOff,
  Trash2,
  Edit,
  Edit2,
  ChevronDown,
  ChevronUp,
  Star,
  Bell,
  Settings,
  LogOut,
  Upload,
  Download,
  Search,
  Filter,
  Grid,
  List,
  ArrowUp,
  ArrowDown,
  Minus,
  Check,
  X,
  Menu,
  PackageOpen
} from 'lucide-react'

import { useUser } from "@/frontend/contexts/UserContext";
import { useProducts } from "@/frontend/contexts/ProductContext";
import { useToast } from "@/frontend/contexts/ToastContext";
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
  addProductToFirestore,
  getFarmerProductsFromFirestore,
  updateProductInFirestore,
  deleteProductFromFirestore,
  toggleProductPublishFirestore
} from '../services/firestoreService';
import "./FarmerDashboard.css";

const COLORS = ["#2D4F1E", "#4CAF50", "#8BC34A", "#CDDC39", "#FFEB3B"];

const Counter = ({ value, duration = 1.5 }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = parseInt(value) || 0;
    if (start === end) return;

    let totalMiliseconds = duration * 1000;
    let incrementTime = totalMiliseconds / end;

    let timer = setInterval(() => {
      start += 1;
      setCount(start);
      if (start === end) clearInterval(timer);
    }, incrementTime);

    return () => clearInterval(timer);
  }, [value, duration]);

  return <span>{count.toLocaleString()}</span>;
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
  const toast = useToast();

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
  const [tableFilter, setTableFilter] = useState("all");

  // Profile Dropdown
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Add product state
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    category: "",
    price: "",
    quantity: "",
    unit: "kg",
    image: "",
    published: true,
    grade: "local"
  });

  const [priceAdvice, setPriceAdvice] = useState(null);
  const [priceLoading, setPriceLoading] = useState(false);

  const [costInputs, setCostInputs] = useState({
    seedCost: '',
    laborCost: '',
    transportCost: '',
    otherCost: ''
  })

  const [profitAnalysis, setProfitAnalysis] = useState(null)

  // Profile state
  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    farmName: '',
    farmLocation: '',
    farmSize: '',
    farmSizeUnit: 'acres',
    primaryCrops: '',
    state: '',
    district: '',
    pincode: '',
    experience: '',
    bio: '',
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    upiId: ''
  })

  const [profileLoading, setProfileLoading] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState('')
  const [profileError, setProfileError] = useState('')

  const calculateProfit = (
    sellingPrice,
    quantity,
    costs,
    mandiRate
  ) => {
    const price = parseFloat(sellingPrice || 0)
    const qty = parseFloat(quantity || 0)

    // Total cost per kg
    const seedCost = parseFloat(costs.seedCost || 0)
    const laborCost = parseFloat(costs.laborCost || 0)
    const transportCost = parseFloat(costs.transportCost || 0)
    const otherCost = parseFloat(costs.otherCost || 0)

    // Platform fee 2%
    const platformFee = price * 0.02

    const totalCostPerKg =
      seedCost +
      laborCost +
      transportCost +
      otherCost +
      platformFee

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
    const term = tableSearchTerm.toLowerCase()
    return (localProducts || []).filter(p => {
      const matchesTab = tableFilter === 'all' ||
        (tableFilter === 'published' && (p.isPublished || p.published)) ||
        (tableFilter === 'hidden' && !(p.isPublished || p.published))

      const matchesSearch = (p.name || '').toLowerCase().includes(term) ||
        (p.category || '').toLowerCase().includes(term)

      return matchesTab && matchesSearch
    })
  }, [localProducts, tableFilter, tableSearchTerm])

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
  const loadProducts = useCallback(async () => {
    if (!farmerId) return;
    setProductsLoading(true);
    setProductsError(null);
    try {
      let data = [];
      try {
        const { getFarmerProductsFromFirestore } = await import('../services/firestoreService');
        data = await getFarmerProductsFromFirestore(farmerId);
      } catch (err) {
        console.warn("Firestore fetch failed, trying API fallback", err);
        const res = await fetch(`/api/products?farmerId=${farmerId}`);
        const json = await res.json();
        data = json.products || [];
      }
      setProducts(data);
      setLocalProducts(data);
      setInventory(data);
    } catch (err) {
      console.error("Load products failed:", err);
      setProductsError("Failed to sync inventory.");
    } finally {
      setProductsLoading(false);
    }
  }, [farmerId]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Fetch Analytics & Mandi
  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!farmerId) return;
      setAnalyticsLoading(true);
      setAnalyticsError(null);
      try {
        const res = await fetch(`/api/orders/farmer/${farmerId}?period=${chartPeriod}`);
        const data = await res.json();
        
        console.log(`[DASHBOARD] Analytics for ${farmerId}:`, data);

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
        console.error("Analytics fetch failed:", err);
        setAnalyticsError("Failed to load trends.");
        // Fallback to zeros if API fails
        setChartData([]);
        setHasSalesData(false);
      } finally {
        setAnalyticsLoading(false);
      }
    };

    const fetchMandi = async () => {
      setMandiLoading(true);
      try {
        const res = await fetch('/api/mandi/today?state=Maharashtra');
        const data = await res.json();
        if (data.success && data.prices) {
          // Sort to put Tomato, Onion, Potato, Spinach at the top if possible
          const priority = ['Tomato', 'Onion', 'Potato', 'Spinach'];
          const sorted = [...data.prices].sort((a, b) => {
            const aIdx = priority.indexOf(a.commodity);
            const bIdx = priority.indexOf(b.commodity);
            if (aIdx > -1 && bIdx > -1) return aIdx - bIdx;
            if (aIdx > -1) return -1;
            if (bIdx > -1) return 1;
            return 0;
          });
          setTodayPrices(sorted);
        }
      } catch (err) {
        console.error("Mandi fetch failed:", err);
      } finally {
        setMandiLoading(false);
      }
    };

    fetchAnalytics();
    fetchMandi();
  }, [farmerId, chartPeriod]);

  // Load existing profile data
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const uid = user?.uid
          || JSON.parse(
            localStorage.getItem('ks_user')
            || 'null'
          )?.uid

        if (!uid) return

        // Pre-fill from user context
        setProfileForm(prev => ({
          ...prev,
          name: user?.name
            || user?.displayName
            || '',
          phone: user?.phone
            || user?.phoneNumber
            || ''
        }))

        // Try MongoDB
        const res = await fetch(
          `/api/users/${uid}`
        )
        if (res.ok) {
          const data = await res.json()
          const u = data.user || data
          setProfileForm(prev => ({
            ...prev,
            name: u.name || prev.name,
            phone: u.phone || prev.phone,
            farmName: u.farmName
              || u.farm_name || '',
            farmLocation: u.farmLocation
              || u.farm_location || '',
            farmSize: u.farmSize
              || u.farm_size || '',
            farmSizeUnit: u.farmSizeUnit
              || 'acres',
            primaryCrops: u.primaryCrops
              || u.primary_crops || '',
            state: u.state || '',
            district: u.district || '',
            pincode: u.pincode || '',
            experience: u.experience || '',
            bio: u.bio || '',
            upiId: u.upiId
              || u.upi_id || '',
            bankName: u.bankName || '',
            accountNumber: u.accountNumber || '',
            ifscCode: u.ifscCode || ''
          }))
        }
      } catch (err) {
        console.warn(
          '[Profile] Load error:',
          err.message
        )
      }
    }

    if (activeTab === 'profile') {
      loadProfile()
    }
  }, [activeTab, user?.uid])

  // Save profile to both databases
  const saveProfile = async () => {
    setProfileLoading(true)
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

      console.log(
        '[SaveProfile] uid:', uid
      )
      console.log(
        '[SaveProfile] form:', profileForm
      )

      if (!uid) {
        setProfileError(
          'Not logged in. ' +
          'Please logout and login again.'
        )
        setProfileLoading(false)
        return
      }

      if (!profileForm.name?.trim()) {
        setProfileError(
          'Name is required'
        )
        setProfileLoading(false)
        return
      }

      // Build clean payload
      const payload = {
        uid,
        name: profileForm.name?.trim()
          || '',
        phone: profileForm.phone?.trim()
          || '',
        farmName: profileForm.farmName
          ?.trim() || '',
        farmLocation:
          profileForm.farmLocation
            ?.trim() || '',
        farmSize: profileForm.farmSize
          || '',
        farmSizeUnit:
          profileForm.farmSizeUnit
          || 'acres',
        primaryCrops:
          profileForm.primaryCrops
            ?.trim() || '',
        state: profileForm.state?.trim()
          || '',
        district:
          profileForm.district?.trim()
          || '',
        pincode:
          profileForm.pincode?.trim()
          || '',
        experience:
          profileForm.experience || '',
        bio: profileForm.bio?.trim()
          || '',
        upiId: profileForm.upiId?.trim()
          || '',
        bankName:
          profileForm.bankName?.trim()
          || '',
        accountNumber:
          profileForm.accountNumber
            ?.trim() || '',
        ifscCode:
          profileForm.ifscCode?.trim()
          || '',
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
        const {
          doc,
          setDoc,
          serverTimestamp
        } = await import(
          'firebase/firestore'
        )
        const { db } = await import(
          '../config/firebaseConfig'
        )

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
        setProfileSuccess(
          '✅ Profile saved successfully!'
        )
        toast.success('Profile updated!')
        setTimeout(() =>
          setProfileSuccess(''), 4000
        )
      } else {
        // Saved to localStorage at least
        setProfileSuccess(
          '✅ Profile saved locally! ' +
          'Will sync when online.'
        )
        toast.info(
          'Saved locally. Will sync later.',
          4000
        )
        setTimeout(() =>
          setProfileSuccess(''), 4000
        )
      }

    } catch (err) {
      console.error(
        '❌ [SaveProfile] Fatal:',
        err.message,
        err.stack
      )
      setProfileError(
        `Failed to save: ${err.message}`
      )
      toast.error('Save failed')
    } finally {
      setProfileLoading(false)
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
      toast.success("Product updated successfully");
    } catch (err) {
      toast.error("Failed to save changes");
    }
  };

  /* --- HANDLERS --- */
  const handleLogout = useCallback(() => {
    if (!window.confirm("Logout from KrishiSaathi?")) return;
    localStorage.clear();
    navigate("/login");
  }, [navigate]);

  const debouncedUpdate = (id, changes, delay = 800) => {
    if (updateTimersRef.current[id]) clearTimeout(updateTimersRef.current[id]);
    updateTimersRef.current[id] = setTimeout(() => {
      updateProduct(id, changes);
      toast.success("Changes saved organically");
      delete updateTimersRef.current[id];
    }, delay);
  };

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
      toast.info(newStatus ? "Published to marketplace" : "Hidden from marketplace")
    } catch (err) {
      console.error('Toggle failed:', err)
      toast.error("Failed to update status")
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
      toast.info("Product removed successfully")
    } catch (err) {
      console.error('Delete failed:', err)
      toast.error("Failed to delete product")
    }
  }

  // Debounced price check
  const checkPrice = async (price, commodity, grade) => {
    if (!price || !commodity || price < 1) {
      setPriceAdvice(null);
      return;
    }
    setPriceLoading(true);
    try {
      const res = await fetch(
        `/api/products/price-check?commodity=${encodeURIComponent(commodity)}&price=${price}&grade=${grade}`
      );
      const data = await res.json();
      if (data.success) {
        setPriceAdvice(data);
      }
    } catch (err) {
      console.error("Price check failed:", err);
      setPriceAdvice(null);
    } finally {
      setPriceLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (newProduct.price && newProduct.name) {
        checkPrice(newProduct.price, newProduct.name, newProduct.grade || 'local');
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [newProduct.price, newProduct.name, newProduct.grade]);

  // Recalculate when price or costs change
  useEffect(() => {
    if (newProduct.price && newProduct.quantity) {
      const analysis = calculateProfit(
        newProduct.price,
        newProduct.quantity,
        costInputs,
        priceAdvice?.mandi_rate || null
      )
      setProfitAnalysis(analysis)
    } else {
      setProfitAnalysis(null)
    }
  }, [newProduct.price, newProduct.quantity, costInputs, priceAdvice])


  // --- Add new product handler (Firestore integration) ---
  const handleAddProduct = async (formData) => {
    // If called from form event
    if (formData?.preventDefault) formData.preventDefault()
    
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
        setFormError('Please login to add products')
        toast.error('Please login to add products')
        cleanup()
        return
      }

      const payload = {
        farmerId: uid,
        farmerName: user?.name || 'Farmer',
        name: (newProduct.name || '').trim(),
        description: newProduct.description || '',
        price: parseFloat(newProduct.price || 0),
        unit: newProduct.unit || 'kg',
        priceUnit: newProduct.unit || 'kg',
        quantity: parseInt(newProduct.quantity || 0),
        category: newProduct.category || '',
        image: newProduct.image || '',
        grade: newProduct.grade || 'local',
        isPublished: true,
        createdAt: new Date().toISOString()
      }

      // Validate
      if (!payload.name) {
        setFormError('Product name required')
        cleanup()
        return
      }
      if (!payload.price || payload.price <= 0) {
        setFormError('Valid price required')
        cleanup()
        return
      }
      if (!payload.category) {
        setFormError('Category (Vegetables, Fruits, etc.) required')
        cleanup()
        return
      }

      let savedProduct = null

      // SAVE TO FIRESTORE
      try {
        const {
          collection,
          addDoc,
          serverTimestamp
        } = await import('firebase/firestore')
        const { db } = await import('../config/firebaseConfig')
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
        const data = await res.json()
        if (res.ok && data.product) {
          console.log('✅ Product → MongoDB:', data.product._id)
          if (!savedProduct) {
            savedProduct = data.product
          }
        } else {
          console.warn('MongoDB product save:', data.message)
        }
      } catch (err) {
        console.warn('MongoDB product save:', err.message)
      }

      if (!savedProduct) {
        throw new Error('Failed to save to any database')
      }

      // Update local state
      setProducts(prev => [savedProduct, ...(prev || [])])
      setLocalProducts(prev => [savedProduct, ...(prev || [])])
      setInventory(prev => [savedProduct, ...(prev || [])])

      toast.success(`✅ ${savedProduct.name} listed!`)
      setShowAddProduct(false)
      setNewProduct({
        name: '', description: '',
        price: '', unit: 'kg',
        quantity: '', category: '',
        image: '', grade: 'local'
      })

    } catch (err) {
      console.error('Add product error:', err.message)
      setFormError(err.message || 'Failed to add product')
      toast.error(err.message || 'Failed to add product')
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
                <form onSubmit={handleAddProduct}>
                  <div className="fd-form-grid">
                    <div className="fd-form-group span-2">
                      <Input label="Product Name" required placeholder="e.g. Organic Bell Peppers" value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} />
                    </div>
                    <div className="fd-form-group">
                      <label className="fd-label">Category</label>
                      <select className="fd-select" value={newProduct.category} onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}>
                        <option value="">Select Category</option>
                        <option value="Vegetables">Vegetables</option>
                        <option value="Fruits">Fruits</option>
                        <option value="Dairy">Dairy</option>
                        <option value="Grains">Grains & Pulses</option>
                        <option value="Spices">Spices</option>
                      </select>
                    </div>
                    <div className="fd-form-group span-2">
                      <label className="fd-label">Short Description</label>
                      <textarea className="fd-textarea" placeholder="Highlight key freshness or organic details..." value={newProduct.description} onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}></textarea>
                    </div>
                    <div className="fd-form-group">
                      <Input label="Price" type="number" required placeholder="0.00" icon="₹" value={newProduct.price} onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })} />
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
                                placeholder={field.placeholder}
                                value={costInputs[field.key]}
                                onChange={e =>
                                  setCostInputs(prev => ({
                                    ...prev,
                                    [field.key]: e.target.value
                                  }))
                                }
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
                      </div>

                      {/* Profit Analysis Result */}
                      {profitAnalysis &&
                       newProduct.price &&
                       newProduct.quantity && (
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
                              onClick={() => setNewProduct(
                                prev => ({
                                  ...prev,
                                  price: String(
                                    profitAnalysis
                                      .suggestedMinPrice
                                  )
                                })
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
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: '8px', alignItems: 'flex-end' }}>
                        <Input label="Quantity" type="number" required placeholder="Qty" value={newProduct.quantity} onChange={(e) => setNewProduct({ ...newProduct, quantity: e.target.value })} />
                        <select className="fd-select" style={{ height: '44px' }} value={newProduct.unit} onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}>
                          {(units || []).map((u) => <option key={u} value={u}>{u}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="fd-form-group span-2">
                      <Input label="Image URL" placeholder="Paste image URL..." value={newProduct.image} onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })} />
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
                                  ₹{priceAdvice.grade_ranges?.[newProduct.grade || 'local']?.min}–₹{priceAdvice.grade_ranges?.[newProduct.grade || 'local']?.max}/kg
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
                              onClick={() => setNewProduct(p => ({ ...p, price: String(priceAdvice.advice?.suggestedPrice) }))}
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
                            onClick={() => setNewProduct(p => ({ ...p, grade: g.value }))}
                            style={{
                              padding: '10px 12px',
                              borderRadius: 14,
                              border: `1.5px solid ${newProduct.grade === g.value ? '#2D4F1E' : '#EDD9B0'}`,
                              background: newProduct.grade === g.value ? 'rgba(45,79,30,0.08)' : '#FDFAF4',
                              cursor: 'pointer',
                              textAlign: 'left',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <div style={{
                              fontFamily: 'DM Sans',
                              fontWeight: 700,
                              fontSize: 13,
                              color: newProduct.grade === g.value ? '#2D4F1E' : '#4A4A4A'
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
                    <Button variant="ghost" onClick={() => {
                      setNewProduct({ name: "", description: "", category: "", price: "", quantity: "", unit: "kg", image: "", published: true, grade: "local" });
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
                  name={profileForm.name
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
                    {profileForm.name
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

              {/* Success/Error messages */}
              {profileSuccess && (
                <div style={{
                  padding: '12px 16px',
                  background:
                    'rgba(76,175,80,0.10)',
                  borderRadius: 10,
                  border:
                    '1px solid rgba(76,175,80,0.25)',
                  fontFamily: 'DM Sans',
                  fontSize: 13,
                  color: '#2E7D32',
                  fontWeight: 600,
                  marginBottom: 16
                }}>
                  {profileSuccess}
                </div>
              )}

              {profileError && (
                <div style={{
                  padding: '12px 16px',
                  background:
                    'rgba(255,82,82,0.08)',
                  borderRadius: 10,
                  border:
                    '1px solid rgba(255,82,82,0.25)',
                  fontFamily: 'DM Sans',
                  fontSize: 13,
                  color: '#FF5252',
                  fontWeight: 600,
                  marginBottom: 16
                }}>
                  {profileError}
                </div>
              )}

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
                  {[
                    {
                      key: 'name',
                      label: 'Full Name *',
                      placeholder: 'Ramesh Kumar',
                      type: 'text'
                    },
                    {
                      key: 'phone',
                      label: 'Phone Number',
                      placeholder: '+91 9876543210',
                      type: 'tel'
                    },
                    {
                      key: 'experience',
                      label: 'Years of Farming',
                      placeholder: '15',
                      type: 'number'
                    },
                    {
                      key: 'state',
                      label: 'State',
                      placeholder: 'Maharashtra',
                      type: 'text'
                    },
                    {
                      key: 'district',
                      label: 'District',
                      placeholder: 'Nashik',
                      type: 'text'
                    },
                    {
                      key: 'pincode',
                      label: 'Pincode',
                      placeholder: '422001',
                      type: 'text'
                    }
                  ].map(field => (
                    <div key={field.key}>
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
                        {field.label}
                      </label>
                      <input
                        type={field.type}
                        placeholder={field.placeholder}
                        value={
                          profileForm[field.key]
                        }
                        onChange={e =>
                          setProfileForm(prev =>
                            ({
                              ...prev,
                              [field.key]:
                                e.target.value
                            })
                          )
                        }
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: 10,
                          border:
                            '1.5px solid #EDD9B0',
                          background: '#F5E6CC',
                          fontFamily: 'DM Sans',
                          fontSize: 13,
                          color: '#4A4A4A',
                          boxSizing: 'border-box',
                          outline: 'none'
                        }}
                        onFocus={e => {
                          e.target.style.border =
                            '1.5px solid #2D4F1E'
                        }}
                        onBlur={e => {
                          e.target.style.border =
                            '1.5px solid #EDD9B0'
                        }}
                      />
                    </div>
                  ))}
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
                    value={profileForm.bio}
                    onChange={e =>
                      setProfileForm(prev => ({
                        ...prev,
                        bio: e.target.value
                      }))
                    }
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

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 14
                }}>
                  {[
                    {
                      key: 'farmName',
                      label: 'Farm Name',
                      placeholder:
                        'Green Valley Farm',
                      span: 2
                    },
                    {
                      key: 'farmLocation',
                      label: 'Farm Location / Village',
                      placeholder:
                        'Village name, Taluka',
                      span: 2
                    },
                    {
                      key: 'primaryCrops',
                      label: 'Primary Crops',
                      placeholder:
                        'Tomato, Onion, Wheat',
                      span: 2
                    }
                  ].map(field => (
                    <div
                      key={field.key}
                      style={{
                        gridColumn:
                          field.span === 2
                            ? '1 / -1' : 'auto'
                      }}
                    >
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
                        {field.label}
                      </label>
                      <input
                        type="text"
                        placeholder={
                          field.placeholder
                        }
                        value={
                          profileForm[field.key]
                        }
                        onChange={e =>
                          setProfileForm(prev =>
                            ({
                              ...prev,
                              [field.key]:
                                e.target.value
                            })
                          )
                        }
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: 10,
                          border:
                            '1.5px solid #EDD9B0',
                          background: '#F5E6CC',
                          fontFamily: 'DM Sans',
                          fontSize: 13,
                          color: '#4A4A4A',
                          boxSizing: 'border-box',
                          outline: 'none'
                        }}
                      />
                    </div>
                  ))}

                  {/* Farm size with unit */}
                  <div>
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
                      Farm Size
                    </label>
                    <div style={{
                      display: 'flex',
                      gap: 8
                    }}>
                      <input
                        type="number"
                        placeholder="5"
                        value={profileForm.farmSize}
                        onChange={e =>
                          setProfileForm(prev =>
                            ({
                              ...prev,
                              farmSize: e.target.value
                            })
                          )
                        }
                        style={{
                          flex: 1,
                          padding: '10px 12px',
                          borderRadius: 10,
                          border:
                            '1.5px solid #EDD9B0',
                          background: '#F5E6CC',
                          fontFamily: 'DM Sans',
                          fontSize: 13,
                          color: '#4A4A4A',
                          outline: 'none'
                        }}
                      />
                      <select
                        value={
                          profileForm.farmSizeUnit
                        }
                        onChange={e =>
                          setProfileForm(prev =>
                            ({
                              ...prev,
                              farmSizeUnit:
                                e.target.value
                            })
                          )
                        }
                        style={{
                          padding: '10px 12px',
                          borderRadius: 10,
                          border:
                            '1.5px solid #EDD9B0',
                          background: '#F5E6CC',
                          fontFamily: 'DM Sans',
                          fontSize: 13,
                          color: '#4A4A4A',
                          cursor: 'pointer'
                        }}
                      >
                        <option value="acres">
                          Acres
                        </option>
                        <option value="hectares">
                          Hectares
                        </option>
                        <option value="bigha">
                          Bigha
                        </option>
                        <option value="guntha">
                          Guntha
                        </option>
                      </select>
                    </div>
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

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 14
                }}>
                  {[
                    {
                      key: 'upiId',
                      label: 'UPI ID',
                      placeholder:
                        'yourname@upi',
                      span: 2
                    },
                    {
                      key: 'bankName',
                      label: 'Bank Name',
                      placeholder:
                        'State Bank of India'
                    },
                    {
                      key: 'accountNumber',
                      label: 'Account Number',
                      placeholder:
                        'XXXXXXXXXXXX',
                      type: 'password'
                    },
                    {
                      key: 'ifscCode',
                      label: 'IFSC Code',
                      placeholder: 'SBIN0001234'
                    }
                  ].map(field => (
                    <div
                      key={field.key}
                      style={{
                        gridColumn:
                          field.span === 2
                            ? '1 / -1' : 'auto'
                      }}
                    >
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
                        {field.label}
                      </label>
                      <input
                        type={field.type || 'text'}
                        placeholder={
                          field.placeholder
                        }
                        value={
                          profileForm[field.key]
                        }
                        onChange={e =>
                          setProfileForm(prev =>
                            ({
                              ...prev,
                              [field.key]:
                                e.target.value
                            })
                          )
                        }
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: 10,
                          border:
                            '1.5px solid #EDD9B0',
                          background: '#F5E6CC',
                          fontFamily: 'DM Sans',
                          fontSize: 13,
                          color: '#4A4A4A',
                          boxSizing: 'border-box',
                          outline: 'none'
                        }}
                      />
                    </div>
                  ))}
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
                onClick={saveProfile}
                disabled={profileLoading}
                style={{
                  width: '100%',
                  padding: '16px',
                  background: profileLoading
                    ? '#7A7A7A'
                    : 'linear-gradient(135deg,' +
                      '#2D4F1E,#3D6B2A)',
                  border: 'none',
                  borderRadius: 14,
                  color: 'white',
                  fontFamily: 'DM Sans',
                  fontWeight: 700,
                  fontSize: 16,
                  cursor: profileLoading
                    ? 'not-allowed' : 'pointer',
                  boxShadow: profileLoading
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
                {profileLoading ? (
                  <>⏳ Saving Profile...</>
                ) : (
                  <>💾 Save Profile</>
                )}
              </button>

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
