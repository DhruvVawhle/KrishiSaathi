import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Building2, Users, Package, Eye,
  Send, ChevronLeft, ChevronRight, Plus, Trash2,
  Check, AlertCircle, Search, Download
} from 'lucide-react';
import EInvoiceTemplate from '../components/EInvoiceTemplate';

const STEPS = [
  { id: 1, label: 'Document', icon: FileText },
  { id: 2, label: 'Seller', icon: Building2 },
  { id: 3, label: 'Buyer', icon: Users },
  { id: 4, label: 'Items', icon: Package },
  { id: 5, label: 'Preview', icon: Eye },
];

const EMPTY_ITEM = {
  description: '', hsnCode: '', qty: 1, unit: 'KGS',
  unitPrice: 0, gstRate: 0, discount: 0, isService: false, category: '',
};

// ─── STYLES ────────────────────────────────────────────────
const S = {
  page: { minHeight: '100vh', background: '#F5E6CC', padding: '32px 16px', fontFamily: 'DM Sans' },
  container: { maxWidth: 900, margin: '0 auto' },
  card: {
    background: '#FDFAF4', borderRadius: 20, border: '1.5px solid #EDD9B0',
    padding: '32px 28px', boxShadow: '0 8px 32px rgba(45,79,30,0.08)', marginBottom: 24,
  },
  title: { fontFamily: 'Playfair Display', fontWeight: 700, fontSize: 28, color: '#2D4F1E', margin: '0 0 4px' },
  subtitle: { fontFamily: 'Caveat', fontSize: 18, color: '#E27D60', fontWeight: 700 },
  label: { fontSize: 12, fontWeight: 700, color: '#4A4A4A', marginBottom: 6, display: 'block', letterSpacing: '0.03em' },
  input: (focused) => ({
    width: '100%', padding: '10px 14px', borderRadius: 10, border: `1.5px solid ${focused ? '#2D4F1E' : '#EDD9B0'}`,
    background: '#FDFAF4', fontSize: 14, color: '#2D4F1E', outline: 'none', fontFamily: 'DM Sans',
    transition: 'all 0.2s', boxShadow: focused ? '0 0 0 3px rgba(45,79,30,0.1)' : 'none',
  }),
  select: (focused) => ({
    width: '100%', padding: '10px 14px', borderRadius: 10, border: `1.5px solid ${focused ? '#2D4F1E' : '#EDD9B0'}`,
    background: '#FDFAF4', fontSize: 14, color: '#2D4F1E', outline: 'none', fontFamily: 'DM Sans',
    transition: 'all 0.2s', boxShadow: focused ? '0 0 0 3px rgba(45,79,30,0.1)' : 'none',
  }),
  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  grid3: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 },
  btn: (primary) => ({
    padding: '12px 24px', borderRadius: 12, border: primary ? 'none' : '1.5px solid #EDD9B0',
    background: primary ? '#2D4F1E' : 'white', color: primary ? 'white' : '#2D4F1E',
    fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
    fontFamily: 'DM Sans', transition: 'all 0.2s', boxShadow: primary ? '0 4px 12px rgba(45,79,30,0.2)' : 'none',
  }),
  error: { fontSize: 12, color: '#FF5252', marginTop: 4 },
  badge: (active) => ({
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, cursor: 'pointer', flex: 1,
    outline: 'none',
  }),
  badgeCircle: (active, done) => ({
    width: 36, height: 36, borderRadius: '50%',
    background: done ? '#4CAF50' : active ? '#2D4F1E' : '#FDFAF4',
    border: `2px solid ${done ? '#4CAF50' : active ? '#2D4F1E' : '#EDD9B0'}`,
    display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.3s',
    boxShadow: active ? '0 0 0 3px rgba(45,79,30,0.2)' : 'none',
  }),
};

// ─── COMPONENT ─────────────────────────────────────────────
const EInvoiceForm = () => {
  const [step, setStep] = useState(1);
  const [constants, setConstants] = useState(null);
  const [hsnSearch, setHsnSearch] = useState('');
  const [previewPayload, setPreviewPayload] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);
  const [irpResult, setIrpResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showTemplate, setShowTemplate] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  
  // Form State
  const [doc, setDoc] = useState({
    type: 'INV',
    number: '',
    date: '' // Set in useEffect to avoid hydration mismatch
  });

  useEffect(() => {
    // Set date only on client side
    setDoc(p => ({ ...p, date: new Date().toLocaleDateString('en-GB') }));
  }, []);

  const [supplyType, setSupplyType] = useState('B2B');
  const [seller, setSeller] = useState({
    gstin: '', legalName: '', tradeName: '', addr1: '', addr2: '',
    city: '', pin: '', stateCode: '', phone: '', email: '',
  });
  const [buyer, setBuyer] = useState({
    gstin: '', legalName: '', tradeName: '', addr1: '', addr2: '',
    city: '', pin: '', stateCode: '', pos: '', phone: '', email: '',
  });
  const [items, setItems] = useState([{ ...EMPTY_ITEM }]);

  // Fetch constants
  useEffect(() => {
    fetch('/api/einvoice/constants')
      .then(r => r.json())
      .then(setConstants)
      .catch(() => console.warn('⚠️ Could not load GST constants'));
  }, []);

  const updateItem = (idx, field, value) => {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, [field]: value } : it));
  };

  const addItem = () => setItems(prev => [...prev, { ...EMPTY_ITEM }]);
  const removeItem = (idx) => setItems(prev => prev.filter((_, i) => i !== idx));

  // GSTIN Lookup with AbortController to prevent race conditions
  useEffect(() => {
    if (!seller.gstin || seller.gstin.length < 15) return;
    const controller = new AbortController();
    
    const verifyGSTIN = async () => {
      try {
        const res = await fetch(`/api/einvoice/verify-gstin?gstin=${seller.gstin}`, { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const data = await res.json();
        if (data.success && data.taxpayer) {
          setSeller(p => ({
            ...p,
            legalName: data.taxpayer.lgnm || p.legalName,
            tradeName: data.taxpayer.trdn || p.tradeName,
            addr1: data.taxpayer.addr?.bno || p.addr1,
            city: data.taxpayer.addr?.loc || p.city,
            pin: data.taxpayer.addr?.pncd || p.pin,
            stateCode: data.taxpayer.addr?.stcd || p.stateCode,
          }));
        }
      } catch (err) {
        if (err.name !== 'AbortError') console.error('GSTIN Verify Error:', err);
      }
    };

    verifyGSTIN();
    return () => controller.abort();
  }, [seller.gstin]);

  // Auto-populate GST rate from HSN lookup
  const applyHSN = (idx, hsn) => {
    const found = constants?.hsnCodes?.find(h => h.hsn === hsn);
    if (found) {
      setItems(prev => prev.map((it, i) =>
        i === idx ? { ...it, hsnCode: hsn, gstRate: found.gst, description: found.desc, category: found.category } : it
      ));
    }
  };

  // Preview & Validate
  const handlePreview = async () => {
    const body = {
      docType: doc.type, docNo: doc.number, docDate: doc.date,
      supplyType, reverseCharge: 'N', seller, buyer, items,
    };
    try {
      const res = await fetch('/api/einvoice/build', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      setPreviewPayload(data.payload);
      setValidationErrors(data.errors || []);
      setStep(5);
    } catch (err) {
      setValidationErrors([{ field: 'general', message: err.message }]);
    }
  };

  // Submit to IRP
  const handleSubmit = async () => {
    setSubmitting(true);
    const body = {
      docType: doc.type, docNo: doc.number, docDate: doc.date,
      supplyType, reverseCharge: 'N', seller, buyer, items,
    };
    try {
      const res = await fetch('/api/einvoice/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.status === 'success') {
        setIrpResult(data);
        setShowTemplate(true);
      } else {
        setValidationErrors(data.errors || [{ message: data.message }]);
      }
    } catch (err) {
      setValidationErrors([{ message: err.message }]);
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate item totals for the table
  const getItemTotal = (item) => {
    const tot = item.qty * item.unitPrice - (item.discount || 0);
    const tax = tot * ((item.gstRate || 0) / 100);
    return +(tot + tax).toFixed(2);
  };

  const filteredHSN = constants?.hsnCodes?.filter(h =>
    !hsnSearch || h.hsn.includes(hsnSearch) || h.desc.toLowerCase().includes(hsnSearch.toLowerCase())
  ) || [];

  if (showTemplate && irpResult) {
    return <EInvoiceTemplate result={irpResult} payload={previewPayload} onBack={() => setShowTemplate(false)} />;
  }

  return (
    <div style={S.page}>
      <div style={S.container}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <span style={S.subtitle}>GST Compliant</span>
          <h1 style={S.title}>e-Invoice Generator</h1>
          <p style={{ fontSize: 13, color: '#7A7A7A', marginTop: 4 }}>Form GST INV-01 • Schema v1.04</p>
        </div>

        {/* Step Indicator */}
        <div style={{ ...S.card, padding: '16px 24px', display: 'flex', alignItems: 'center', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '50%', left: '14%', right: '14%', height: 2, background: '#EDD9B0', zIndex: 0 }} />
          {STEPS.map(s => (
            <div
              key={s.id}
              role="button"
              tabIndex={s.id <= step ? 0 : -1}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && s.id <= step) {
                  e.preventDefault();
                  setStep(s.id);
                }
              }}
              style={S.badge(step === s.id)}
              onClick={() => s.id <= step && setStep(s.id)}
              aria-current={step === s.id ? 'step' : undefined}
              aria-label={`Step ${s.id}: ${s.label}`}
            >
              <div style={S.badgeCircle(step === s.id, step > s.id)}>
                {step > s.id ? <Check size={14} color="white" /> : <s.icon size={14} color={step === s.id ? 'white' : '#B0A898'} />}
              </div>
              <span style={{ fontSize: 10, fontWeight: step === s.id ? 700 : 500, color: step === s.id ? '#2D4F1E' : '#B0A898' }}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div
            style={{ ...S.card, borderColor: 'rgba(255,82,82,0.3)', background: 'rgba(255,82,82,0.04)' }}
            role="alert"
            aria-live="assertive"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <AlertCircle size={18} color="#FF5252" />
              <span style={{ fontWeight: 700, color: '#FF5252', fontSize: 14 }}>Validation Errors</span>
            </div>
            {validationErrors.map((e, i) => (
              <div key={i} style={{ fontSize: 13, color: '#4A4A4A', padding: '4px 0', borderBottom: '0.5px solid rgba(255,82,82,0.1)' }}>
                <strong style={{ color: '#FF5252' }}>{e.field || '•'}</strong>: {e.message}
                {e.messageHi && <span style={{ color: '#7A7A7A', marginLeft: 8 }}>({e.messageHi})</span>}
              </div>
            ))}
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* STEP 1: Document Details */}
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} style={S.card}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#2D4F1E', marginBottom: 20 }}>📄 Document Details</h2>
              <div style={S.grid3}>
                <div>
                  <label style={S.label}>Document Type *</label>
                  <select 
                    style={S.select(focusedField === 'docType')} 
                    onFocus={() => setFocusedField('docType')}
                    onBlur={() => setFocusedField(null)}
                    value={doc.type} 
                    onChange={e => setDoc(p => ({ ...p, type: e.target.value }))}
                  >
                    {(constants?.docTypes || [{ code: 'INV', label: 'Invoice' }, { code: 'CRN', label: 'Credit Note' }, { code: 'DBN', label: 'Debit Note' }]).map(d => (
                      <option key={d.code} value={d.code}>{d.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={S.label}>Invoice Number * (max 16 chars)</label>
                  <input 
                    style={S.input(focusedField === 'docNo')} 
                    onFocus={() => setFocusedField('docNo')}
                    onBlur={() => setFocusedField(null)}
                    maxLength={16} 
                    placeholder="e.g. KS/2025/001" 
                    value={doc.number} 
                    onChange={e => setDoc(p => ({ ...p, number: e.target.value }))} 
                  />
                </div>
                <div>
                  <label style={S.label}>Invoice Date * (DD/MM/YYYY)</label>
                  <input 
                    style={S.input(focusedField === 'docDate')} 
                    onFocus={() => setFocusedField('docDate')}
                    onBlur={() => setFocusedField(null)}
                    placeholder="27/03/2026" 
                    value={doc.date} 
                    onChange={e => setDoc(p => ({ ...p, date: e.target.value }))} 
                  />
                </div>
              </div>
              <div style={{ marginTop: 16 }}>
                <label style={S.label}>Supply Type *</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {(constants?.supplyTypes || [{ code: 'B2B', label: 'B2B' }]).map(st => (
                    <button key={st.code} onClick={() => setSupplyType(st.code)} style={{
                      ...S.btn(supplyType === st.code), padding: '8px 16px', fontSize: 12,
                    }}>{st.label}</button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Seller Details */}
          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} style={S.card}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#2D4F1E', marginBottom: 20 }}>🏢 Seller Details (Supplier)</h2>
              <div style={S.grid2}>
                <div>
                  <label style={S.label}>GSTIN * (15 chars)</label>
                  <input style={S.input} maxLength={15} placeholder="27AAACK1234A1Z5" value={seller.gstin} onChange={e => setSeller(p => ({ ...p, gstin: e.target.value.toUpperCase() }))} />
                </div>
                <div>
                  <label style={S.label}>Legal Name *</label>
                  <input style={S.input} placeholder="KrishiSaathi Agri-Tech Pvt Ltd" value={seller.legalName} onChange={e => setSeller(p => ({ ...p, legalName: e.target.value }))} />
                </div>
                <div>
                  <label style={S.label}>Trade Name</label>
                  <input style={S.input} placeholder="KrishiSaathi" value={seller.tradeName} onChange={e => setSeller(p => ({ ...p, tradeName: e.target.value }))} />
                </div>
                <div>
                  <label style={S.label}>Address Line 1 *</label>
                  <input style={S.input} placeholder="Level 4, Krishi Bhavan" value={seller.addr1} onChange={e => setSeller(p => ({ ...p, addr1: e.target.value }))} />
                </div>
                <div>
                  <label style={S.label}>Address Line 2</label>
                  <input style={S.input} placeholder="Shivaji Nagar" value={seller.addr2} onChange={e => setSeller(p => ({ ...p, addr2: e.target.value }))} />
                </div>
                <div>
                  <label style={S.label}>City / Town *</label>
                  <input style={S.input} placeholder="Pune" value={seller.city} onChange={e => setSeller(p => ({ ...p, city: e.target.value }))} />
                </div>
                <div>
                  <label style={S.label}>PIN Code * (6 digits)</label>
                  <input style={S.input} maxLength={6} placeholder="411005" value={seller.pin} onChange={e => setSeller(p => ({ ...p, pin: e.target.value.replace(/\D/g, '').slice(0, 6) }))} />
                </div>
                <div>
                  <label style={S.label}>State Code *</label>
                  <select style={S.select} value={seller.stateCode} onChange={e => setSeller(p => ({ ...p, stateCode: e.target.value }))}>
                    <option value="">Select State</option>
                    {(constants?.stateCodes || []).map(s => <option key={s.code} value={s.code}>{s.code} — {s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={S.label}>Phone</label>
                  <input style={S.input} placeholder="9876543210" value={seller.phone} onChange={e => setSeller(p => ({ ...p, phone: e.target.value }))} />
                </div>
                <div>
                  <label style={S.label}>Email</label>
                  <input style={S.input} placeholder="gst@krishisaathi.com" value={seller.email} onChange={e => setSeller(p => ({ ...p, email: e.target.value }))} />
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Buyer Details */}
          {step === 3 && (
            <motion.div key="s3" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} style={S.card}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#2D4F1E', marginBottom: 20 }}>👤 Buyer Details</h2>
              <div style={S.grid2}>
                <div>
                  <label style={S.label}>GSTIN (15 chars or "URP" for unregistered)</label>
                  <input style={S.input} maxLength={15} placeholder="29GGGGG1314R9Z6 or URP" value={buyer.gstin} onChange={e => setBuyer(p => ({ ...p, gstin: e.target.value.toUpperCase() }))} />
                </div>
                <div>
                  <label style={S.label}>Legal Name *</label>
                  <input style={S.input} placeholder="Buyer Enterprises Pvt Ltd" value={buyer.legalName} onChange={e => setBuyer(p => ({ ...p, legalName: e.target.value }))} />
                </div>
                <div>
                  <label style={S.label}>Trade Name</label>
                  <input style={S.input} value={buyer.tradeName} onChange={e => setBuyer(p => ({ ...p, tradeName: e.target.value }))} />
                </div>
                <div>
                  <label style={S.label}>Place of Supply (State Code) *</label>
                  <select style={S.select} value={buyer.pos} onChange={e => setBuyer(p => ({ ...p, pos: e.target.value }))}>
                    <option value="">Select PoS</option>
                    {(constants?.stateCodes || []).map(s => <option key={s.code} value={s.code}>{s.code} — {s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={S.label}>Address Line 1 *</label>
                  <input style={S.input} value={buyer.addr1} onChange={e => setBuyer(p => ({ ...p, addr1: e.target.value }))} />
                </div>
                <div>
                  <label style={S.label}>City *</label>
                  <input style={S.input} value={buyer.city} onChange={e => setBuyer(p => ({ ...p, city: e.target.value }))} />
                </div>
                <div>
                  <label style={S.label}>PIN Code *</label>
                  <input style={S.input} maxLength={6} value={buyer.pin} onChange={e => setBuyer(p => ({ ...p, pin: e.target.value.replace(/\D/g, '').slice(0, 6) }))} />
                </div>
                <div>
                  <label style={S.label}>State Code *</label>
                  <select style={S.select} value={buyer.stateCode} onChange={e => setBuyer(p => ({ ...p, stateCode: e.target.value }))}>
                    <option value="">Select State</option>
                    {(constants?.stateCodes || []).map(s => <option key={s.code} value={s.code}>{s.code} — {s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={S.label}>Phone</label>
                  <input style={S.input} value={buyer.phone} onChange={e => setBuyer(p => ({ ...p, phone: e.target.value }))} />
                </div>
                <div>
                  <label style={S.label}>Email</label>
                  <input style={S.input} value={buyer.email} onChange={e => setBuyer(p => ({ ...p, email: e.target.value }))} />
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 4: Items */}
          {step === 4 && (
            <motion.div key="s4" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} style={S.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: '#2D4F1E', margin: 0 }}>📦 Line Items</h2>
                <button onClick={addItem} style={{ ...S.btn(true), padding: '6px 14px', fontSize: 12 }}>
                  <Plus size={14} /> Add Item
                </button>
              </div>

              {/* HSN Quick Search */}
              <div style={{ marginBottom: 16, position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: 12, top: 12, color: '#B0A898' }} />
                <input
                  style={{ ...S.input, paddingLeft: 32 }}
                  placeholder="Search HSN code or product..."
                  value={hsnSearch}
                  onChange={e => setHsnSearch(e.target.value)}
                />
                {hsnSearch && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
                    background: 'white', border: '1.5px solid #EDD9B0', borderRadius: 12,
                    maxHeight: 200, overflowY: 'auto', boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                  }}>
                    {filteredHSN.slice(0, 10).map(h => (
                      <div key={h.hsn}
                        onClick={() => {
                          if (items.length > 0) applyHSN(items.length - 1, h.hsn);
                          setHsnSearch('');
                        }}
                        style={{ padding: '8px 14px', cursor: 'pointer', fontSize: 13, borderBottom: '0.5px solid #EDD9B0' }}
                      >
                        <strong style={{ color: '#2D4F1E' }}>{h.hsn}</strong> — {h.desc}
                        <span style={{ float: 'right', color: '#E27D60', fontWeight: 700 }}>{h.gst}% GST</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {items.map((item, idx) => (
                <div key={idx} style={{
                  background: idx % 2 === 0 ? '#FDFAF4' : '#F9F3E8',
                  border: '1px solid #EDD9B0', borderRadius: 14, padding: 16, marginBottom: 12,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#2D4F1E' }}>Item #{idx + 1}</span>
                    {items.length > 1 && (
                      <button onClick={() => removeItem(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#FF5252' }}>
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 10 }}>
                    <div>
                      <label style={{ ...S.label, fontSize: 11 }}>Description *</label>
                      <input style={S.input} value={item.description} placeholder="e.g. Urea 50kg bag" onChange={e => updateItem(idx, 'description', e.target.value)} />
                    </div>
                    <div>
                      <label style={{ ...S.label, fontSize: 11 }}>HSN Code *</label>
                      <input style={S.input} maxLength={8} value={item.hsnCode} placeholder="3102" onChange={e => { updateItem(idx, 'hsnCode', e.target.value); applyHSN(idx, e.target.value); }} />
                    </div>
                    <div>
                      <label style={{ ...S.label, fontSize: 11 }}>Category</label>
                      <input style={S.input} value={item.category} disabled placeholder="Auto-filled" />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', gap: 10, marginTop: 10 }}>
                    <div>
                      <label style={{ ...S.label, fontSize: 11 }}>Qty *</label>
                      <input style={S.input} type="number" min={1} value={item.qty} onChange={e => updateItem(idx, 'qty', +e.target.value)} />
                    </div>
                    <div>
                      <label style={{ ...S.label, fontSize: 11 }}>Unit</label>
                      <select style={S.select} value={item.unit} onChange={e => updateItem(idx, 'unit', e.target.value)}>
                        {(constants?.unitCodes || [{ code: 'KGS', label: 'KGS' }]).map(u => <option key={u.code} value={u.code}>{u.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ ...S.label, fontSize: 11 }}>Unit Price (₹)</label>
                      <input style={S.input} type="number" min={0} value={item.unitPrice} onChange={e => updateItem(idx, 'unitPrice', +e.target.value)} />
                    </div>
                    <div>
                      <label style={{ ...S.label, fontSize: 11 }}>GST Rate (%)</label>
                      <select style={S.select} value={item.gstRate} onChange={e => updateItem(idx, 'gstRate', +e.target.value)}>
                        <option value={0}>0%</option><option value={5}>5%</option>
                        <option value={12}>12%</option><option value={18}>18%</option><option value={28}>28%</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ ...S.label, fontSize: 11 }}>Total</label>
                      <div style={{ ...S.input, background: '#E8F5E9', fontWeight: 700, color: '#2D4F1E', cursor: 'default' }}>
                        ₹{getItemTotal(item)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Grand Total */}
              <div style={{ textAlign: 'right', marginTop: 16, padding: '12px 20px', background: '#F5E6CC', borderRadius: 14 }}>
                <span style={{ fontSize: 14, color: '#7A7A7A' }}>Grand Total: </span>
                <span style={{ fontSize: 22, fontWeight: 800, color: '#2D4F1E' }}>
                  ₹{items.reduce((sum, it) => sum + getItemTotal(it), 0).toFixed(2)}
                </span>
              </div>
            </motion.div>
          )}

          {/* STEP 5: Preview */}
          {step === 5 && previewPayload && (
            <motion.div key="s5" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} style={S.card}>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#2D4F1E', marginBottom: 20 }}>👁️ JSON Preview (INV-01 v1.04)</h2>
              <pre style={{
                background: '#1a1a2e', color: '#e0e0e0', padding: 20, borderRadius: 14,
                fontSize: 12, fontFamily: 'Consolas, monospace', overflowX: 'auto', maxHeight: 500,
                lineHeight: 1.6,
              }}>
                {JSON.stringify(previewPayload, null, 2)}
              </pre>

              <div style={{ display: 'flex', gap: 12, marginTop: 20, justifyContent: 'flex-end' }}>
                <button style={S.btn(false)} onClick={() => {
                  const blob = new Blob([JSON.stringify(previewPayload, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a'); a.href = url;
                  a.download = `GST_Invoice_${doc.number || 'draft'}.json`;
                  a.click(); URL.revokeObjectURL(url);
                }}>
                  <Download size={16} /> Download JSON
                </button>
                <button
                  style={{ ...S.btn(true), opacity: submitting ? 0.6 : 1 }}
                  onClick={handleSubmit}
                  disabled={submitting || validationErrors.length > 0}
                >
                  <Send size={16} /> {submitting ? 'Submitting...' : 'Submit to IRP'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
          {step > 1 && (
            <button style={S.btn(false)} onClick={() => setStep(s => s - 1)}>
              <ChevronLeft size={16} /> Previous
            </button>
          )}
          <div style={{ flex: 1 }} />
          {step < 4 && (
            <button style={S.btn(true)} onClick={() => setStep(s => s + 1)}>
              Next <ChevronRight size={16} />
            </button>
          )}
          {step === 4 && (
            <button style={S.btn(true)} onClick={handlePreview}>
              <Eye size={16} /> Preview & Validate
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EInvoiceForm;
