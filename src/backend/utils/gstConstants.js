/**
 * KrishiSaathi — GST e-Invoicing Constants
 * Agriculture-specific HSN codes, GST rates, unit codes, and state codes.
 */

// ─── AGRI HSN CODES ──────────────────────────────────────────
export const HSN_CODES = [
  { hsn: '0702', desc: 'Tomatoes (fresh)', gst: 0, category: 'Fresh Vegetables' },
  { hsn: '0703', desc: 'Onions, garlic, leeks (fresh)', gst: 0, category: 'Fresh Vegetables' },
  { hsn: '0709', desc: 'Other vegetables (fresh)', gst: 0, category: 'Fresh Vegetables' },
  { hsn: '0803', desc: 'Bananas (fresh)', gst: 0, category: 'Fresh Fruits' },
  { hsn: '0805', desc: 'Citrus fruits (fresh)', gst: 0, category: 'Fresh Fruits' },
  { hsn: '0808', desc: 'Apples, pears (fresh)', gst: 0, category: 'Fresh Fruits' },
  { hsn: '0401', desc: 'Milk (unprocessed)', gst: 0, category: 'Dairy' },
  { hsn: '1001', desc: 'Wheat', gst: 0, category: 'Grains' },
  { hsn: '1006', desc: 'Rice', gst: 0, category: 'Grains' },
  { hsn: '0713', desc: 'Dried pulses (dal)', gst: 0, category: 'Grains' },
  { hsn: '1209', desc: 'Seeds for sowing', gst: 5, category: 'Agri Inputs' },
  { hsn: '0901', desc: 'Coffee', gst: 5, category: 'Beverages' },
  { hsn: '0902', desc: 'Tea', gst: 5, category: 'Beverages' },
  { hsn: '1701', desc: 'Sugar', gst: 5, category: 'Sweeteners' },
  { hsn: '3102', desc: 'Urea / Nitrogen fertilizers', gst: 5, category: 'Fertilizers' },
  { hsn: '3105', desc: 'Mixed / NPK fertilizers', gst: 5, category: 'Fertilizers' },
  { hsn: '3808', desc: 'Pesticides / Insecticides', gst: 5, category: 'Pest Control' },
  { hsn: '8701', desc: 'Tractors', gst: 5, category: 'Machinery' },
  { hsn: '8432', desc: 'Agricultural machinery (ploughs, seeders)', gst: 12, category: 'Machinery' },
  { hsn: '8424', desc: 'Sprayers for agriculture', gst: 12, category: 'Machinery' },
  { hsn: '8421', desc: 'Irrigation equipment / drip systems', gst: 18, category: 'Irrigation' },
  { hsn: '8523', desc: 'Agri software / digital tools', gst: 18, category: 'Technology' },
];

// ─── INDIAN STATE CODES ──────────────────────────────────────
export const STATE_CODES = [
  { code: '01', name: 'Jammu & Kashmir' },
  { code: '02', name: 'Himachal Pradesh' },
  { code: '03', name: 'Punjab' },
  { code: '04', name: 'Chandigarh' },
  { code: '05', name: 'Uttarakhand' },
  { code: '06', name: 'Haryana' },
  { code: '07', name: 'Delhi' },
  { code: '08', name: 'Rajasthan' },
  { code: '09', name: 'Uttar Pradesh' },
  { code: '10', name: 'Bihar' },
  { code: '11', name: 'Sikkim' },
  { code: '12', name: 'Arunachal Pradesh' },
  { code: '13', name: 'Nagaland' },
  { code: '14', name: 'Manipur' },
  { code: '15', name: 'Mizoram' },
  { code: '16', name: 'Tripura' },
  { code: '17', name: 'Meghalaya' },
  { code: '18', name: 'Assam' },
  { code: '19', name: 'West Bengal' },
  { code: '20', name: 'Jharkhand' },
  { code: '21', name: 'Odisha' },
  { code: '22', name: 'Chhattisgarh' },
  { code: '23', name: 'Madhya Pradesh' },
  { code: '24', name: 'Gujarat' },
  { code: '26', name: 'Dadra & Nagar Haveli and Daman & Diu' },
  { code: '27', name: 'Maharashtra' },
  { code: '29', name: 'Karnataka' },
  { code: '30', name: 'Goa' },
  { code: '31', name: 'Lakshadweep' },
  { code: '32', name: 'Kerala' },
  { code: '33', name: 'Tamil Nadu' },
  { code: '34', name: 'Puducherry' },
  { code: '35', name: 'Andaman & Nicobar Islands' },
  { code: '36', name: 'Telangana' },
  { code: '37', name: 'Andhra Pradesh' },
  { code: '38', name: 'Ladakh' },
  { code: '97', name: 'Other Territory' },
];

// ─── UQC UNIT CODES (as per NIC schema) ──────────────────────
export const UNIT_CODES = [
  { code: 'BAG', label: 'Bags' },
  { code: 'KGS', label: 'Kilograms' },
  { code: 'QTL', label: 'Quintals' },
  { code: 'TON', label: 'Tonnes (Metric)' },
  { code: 'NOS', label: 'Numbers' },
  { code: 'LTR', label: 'Litres' },
  { code: 'MTR', label: 'Metres' },
  { code: 'BOX', label: 'Box' },
  { code: 'PCS', label: 'Pieces' },
  { code: 'OTH', label: 'Others' },
];

// ─── SUPPLY TYPE OPTIONS ─────────────────────────────────────
export const SUPPLY_TYPES = [
  { code: 'B2B', label: 'Business to Business' },
  { code: 'SEZWP', label: 'SEZ with Payment' },
  { code: 'SEZWOP', label: 'SEZ without Payment' },
  { code: 'EXPWP', label: 'Export with Payment' },
  { code: 'EXPWOP', label: 'Export without Payment' },
  { code: 'DEXP', label: 'Deemed Export' },
];

// ─── DOCUMENT TYPES ──────────────────────────────────────────
export const DOC_TYPES = [
  { code: 'INV', label: 'Invoice' },
  { code: 'CRN', label: 'Credit Note' },
  { code: 'DBN', label: 'Debit Note' },
];

// ─── CANCEL REASONS ──────────────────────────────────────────
export const CANCEL_REASONS = [
  { code: '1', label: 'Duplicate' },
  { code: '2', label: 'Data Entry Mistake' },
  { code: '3', label: 'Order Cancelled' },
  { code: '4', label: 'Others' },
];
