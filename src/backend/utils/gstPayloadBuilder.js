import { validateGSTIN } from './gstCrypto.js';
import { HSN_CODES } from './gstConstants.js';

/**
 * GST INV-01 v1.04 — Invoice Payload Builder & Validator
 * Generates the full GST e-Invoice JSON from KrishiSaathi order data.
 */

/**
 * Determines if a transaction is inter-state (IGST) or intra-state (CGST+SGST).
 */
const isInterState = (sellerStateCode, buyerStateCode) =>
  String(sellerStateCode) !== String(buyerStateCode);

/**
 * Calculates tax for a single line item.
 * Ensures CGST + SGST = total tax amount by deriving the second half via subtraction.
 */
const calculateItemTax = (preTaxVal, gstRate, interState) => {
  const taxAmt = +(preTaxVal * (gstRate / 100)).toFixed(2);
  if (interState) {
    return { IgstAmt: taxAmt, CgstAmt: 0, SgstAmt: 0 };
  } else {
    const cgst = +(taxAmt / 2).toFixed(2);
    const sgst = +(taxAmt - cgst).toFixed(2); // Derive second half by subtraction to avoid precision errors
    return { IgstAmt: 0, CgstAmt: cgst, SgstAmt: sgst };
  }
};

/**
 * Builds a complete GST INV-01 v1.04 JSON payload.
 * @param {object} input - Structured form data from the frontend.
 * @returns {object} - The final NIC-compliant payload.
 */
export const buildInvoicePayload = (input) => {
  const {
    docType = 'INV',
    docNo,
    docDate,
    supplyType = 'B2B',
    reverseCharge = 'N',
    seller,
    buyer,
    items = [],
    dispatch,
    shipTo,
    exportDetails,
    paymentDetails,
    remarks,
  } = input;

  const interState = isInterState(seller.stateCode, buyer.stateCode || buyer.pos);

  // Build Item List
  let totalAssVal = 0, totalCgst = 0, totalSgst = 0, totalIgst = 0;
  const itemList = items.map((item, idx) => {
    const qty = Number(item.qty || 1);
    const unitPrice = Number(item.unitPrice || 0);
    const discount = Number(item.discount || 0);
    const totAmt = +(qty * unitPrice).toFixed(2);
    const preTaxVal = +(totAmt - discount).toFixed(2);
    const gstRate = Number(item.gstRate ?? 0);
    const taxAmts = calculateItemTax(preTaxVal, gstRate, interState);
    const totItemVal = +(preTaxVal + taxAmts.IgstAmt + taxAmts.CgstAmt + taxAmts.SgstAmt).toFixed(2);

    totalAssVal += preTaxVal;
    totalCgst += taxAmts.CgstAmt;
    totalSgst += taxAmts.SgstAmt;
    totalIgst += taxAmts.IgstAmt;

    return {
      SlNo: String(idx + 1),
      PrdDesc: item.description || '',
      IsServc: item.isService ? 'Y' : 'N',
      HsnCd: String(item.hsnCode || ''),
      Barcde: null,
      Qty: qty,
      FreeQty: 0,
      Unit: item.unit || 'KGS',
      UnitPrice: unitPrice,
      TotAmt: totAmt,
      Discount: discount,
      PreTaxVal: preTaxVal,
      AssAmt: preTaxVal,
      GstRt: gstRate,
      ...taxAmts,
      CesRt: 0, CesAmt: 0, CesNonAdvlAmt: 0,
      StateCesRt: 0, StateCesAmt: 0, StateCesNonAdvlAmt: 0,
      OthChrg: 0,
      TotItemVal: totItemVal,
    };
  });

  totalAssVal = +totalAssVal.toFixed(2);
  totalCgst = +totalCgst.toFixed(2);
  totalSgst = +totalSgst.toFixed(2);
  totalIgst = +totalIgst.toFixed(2);

  const payload = {
    Version: '1.1',

    TranDtls: {
      TaxSch: 'GST',
      SupTyp: supplyType,
      RegRev: reverseCharge,
      EcmGstin: null,
      IgstOnIntra: 'N',
    },

    DocDtls: {
      Typ: docType,
      No: docNo,
      Dt: docDate, // DD/MM/YYYY
    },

    SellerDtls: {
      Gstin: seller.gstin,
      LglNm: seller.legalName,
      TrdNm: seller.tradeName || seller.legalName,
      Addr1: seller.addr1,
      Addr2: seller.addr2 || '',
      Loc: seller.city,
      Pin: Number(seller.pin || 0),
      Stcd: String(seller.stateCode),
      Ph: seller.phone || '',
      Em: seller.email || '',
    },

    BuyerDtls: {
      Gstin: buyer.gstin || 'URP',
      LglNm: buyer.legalName,
      TrdNm: buyer.tradeName || buyer.legalName,
      Pos: String(buyer.pos || buyer.stateCode),
      Addr1: buyer.addr1,
      Addr2: buyer.addr2 || '',
      Loc: buyer.city,
      Pin: Number(buyer.pin || 0),
      Stcd: String(buyer.stateCode),
      Ph: buyer.phone || '',
      Em: buyer.email || '',
    },

    ItemList: itemList,

    ValDtls: {
      AssVal: totalAssVal,
      CgstVal: totalCgst,
      SgstVal: totalSgst,
      IgstVal: totalIgst,
      CesVal: 0,
      StCesVal: 0,
      Discount: 0,
      OthChrg: 0,
      RndOffAmt: 0,
      TotInvVal: +(totalAssVal + totalCgst + totalSgst + totalIgst).toFixed(2),
      TotInvValFc: null,
    },
  };

  // Optional sections
  if (dispatch) {
    payload.DispDtls = {
      Nm: dispatch.name || '',
      Addr1: dispatch.addr1 || '',
      Addr2: dispatch.addr2 || '',
      Loc: dispatch.city || '',
      Pin: Number(dispatch.pin || 0),
      Stcd: String(dispatch.stateCode || ''),
    };
  }

  if (shipTo) {
    payload.ShipDtls = {
      Gstin: shipTo.gstin || '',
      LglNm: shipTo.legalName || '',
      TrdNm: shipTo.tradeName || '',
      Addr1: shipTo.addr1 || '',
      Addr2: shipTo.addr2 || '',
      Loc: shipTo.city || '',
      Pin: Number(shipTo.pin || 0),
      Stcd: String(shipTo.stateCode || ''),
    };
  }

  if (exportDetails && ['EXPWP', 'EXPWOP'].includes(supplyType)) {
    payload.ExpDtls = {
      ShipBNo: exportDetails.shipBillNo || '',
      ShipBDt: exportDetails.shipBillDate || '',
      Port: exportDetails.port || '',
      RefClm: exportDetails.refundClaim || 'N',
      ForCur: exportDetails.foreignCurrency || '',
      CntCode: exportDetails.countryCode || '',
      ExpDuty: exportDetails.exportDuty || 0,
    };
  }

  if (paymentDetails) {
    payload.PayDtls = {
      Nm: paymentDetails.name || '',
      AccDet: paymentDetails.accountNo || '',
      Mode: paymentDetails.mode || '',
      FinInsBr: paymentDetails.ifsc || '',
      PayTerm: paymentDetails.terms || '',
      PayInstr: paymentDetails.instructions || '',
      CrTrn: paymentDetails.creditTransfer || '',
      DirDr: paymentDetails.directDebit || '',
      CrDay: paymentDetails.creditDays || 0,
      PaidAmt: paymentDetails.paidAmount || 0,
      PaymtDue: paymentDetails.due || 0,
    };
  }

  if (remarks) {
    payload.RefDtls = { InvRm: remarks };
  }

  return payload;
};

/**
 * Validates a fully built GST INV-01 payload before IRP submission.
 * Returns an array of error objects: { field, message, messageHi }
 */
export const validatePayload = (payload) => {
  const errors = [];
  const add = (field, msg, hi) => errors.push({ field, message: msg, messageHi: hi || msg });

  // Document Details
  if (!payload.DocDtls?.No) add('DocDtls.No', 'Invoice number is required', 'चालान संख्या आवश्यक है');
  if (payload.DocDtls?.No?.length > 16) add('DocDtls.No', 'Invoice number max 16 chars', 'चालान संख्या अधिकतम 16 अक्षर');
  if (!payload.DocDtls?.Dt) add('DocDtls.Dt', 'Invoice date is required', 'चालान तिथि आवश्यक है');

  // Date freshness (must be within 30 days)
  if (payload.DocDtls?.Dt) {
    const parts = payload.DocDtls.Dt.split('/');
    if (parts.length === 3) {
      const invDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      invDate.setHours(0, 0, 0, 0);
      
      const daysDiff = (now.getTime() - invDate.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysDiff < 0) {
        add('DocDtls.Dt', 'Invoice date cannot be in the future', 'चालान तिथि भविष्य की नहीं हो सकती');
      } else if (daysDiff > 30) {
        add('DocDtls.Dt', 'Invoice date cannot be older than 30 days', 'चालान तिथि 30 दिन से अधिक पुरानी नहीं हो सकती');
      }
    }
  }

  // Seller
  if (!validateGSTIN(payload.SellerDtls?.Gstin)) add('SellerDtls.Gstin', 'Invalid Seller GSTIN', 'आपूर्तिकर्ता का GSTIN अमान्य है');
  if (!payload.SellerDtls?.LglNm) add('SellerDtls.LglNm', 'Seller legal name is required', 'आपूर्तिकर्ता का कानूनी नाम आवश्यक है');
  if (!payload.SellerDtls?.Addr1) add('SellerDtls.Addr1', 'Seller address is required', 'आपूर्तिकर्ता का पता आवश्यक है');
  if (!payload.SellerDtls?.Pin) add('SellerDtls.Pin', 'Seller PIN code is required', 'आपूर्तिकर्ता का पिन कोड आवश्यक है');

  // Buyer
  const buyerGstin = payload.BuyerDtls?.Gstin;
  if (buyerGstin && buyerGstin !== 'URP' && !validateGSTIN(buyerGstin)) {
    add('BuyerDtls.Gstin', 'Invalid Buyer GSTIN', 'खरीदार का GSTIN अमान्य है');
  }
  if (!payload.BuyerDtls?.LglNm) add('BuyerDtls.LglNm', 'Buyer legal name is required', 'खरीदार का कानूनी नाम आवश्यक है');

  // Items validation
  if (!payload.ItemList?.length) {
    add('ItemList', 'At least one item is required', 'कम से कम एक वस्तु आवश्यक है');
  } else {
    payload.ItemList.forEach((item, i) => {
      if (!item.HsnCd || item.HsnCd.length < 4) {
        add(`ItemList[${i}].HsnCd`, `Item ${i + 1}: HSN code must be at least 4 digits`, `वस्तु ${i + 1}: HSN कोड कम से कम 4 अंकों का होना चाहिए`);
      }
      if (!item.Qty || item.Qty <= 0) {
        add(`ItemList[${i}].Qty`, `Item ${i + 1}: Quantity must be positive`, `वस्तु ${i + 1}: मात्रा सकारात्मक होनी चाहिए`);
      }
    });
  }

  // Value cross-check
  if (payload.ValDtls) {
    const computedTotal = +(
      (payload.ValDtls.AssVal || 0) +
      (payload.ValDtls.CgstVal || 0) +
      (payload.ValDtls.SgstVal || 0) +
      (payload.ValDtls.IgstVal || 0) +
      (payload.ValDtls.OthChrg || 0) -
      (payload.ValDtls.Discount || 0) +
      (payload.ValDtls.RndOffAmt || 0)
    ).toFixed(2);
    if (Math.abs(computedTotal - payload.ValDtls.TotInvVal) > 0.01) {
      add('ValDtls.TotInvVal', `Total mismatch: expected ₹${computedTotal}, got ₹${payload.ValDtls.TotInvVal}`, 'कुल राशि मिलान त्रुटि');
    }
  }

  // Export-specific
  if (['EXPWP', 'EXPWOP'].includes(payload.TranDtls?.SupTyp)) {
    if (!payload.ExpDtls?.ForCur) add('ExpDtls.ForCur', 'Foreign currency code required for exports', 'निर्यात के लिए विदेशी मुद्रा कोड आवश्यक है');
    if (!payload.ExpDtls?.CntCode) add('ExpDtls.CntCode', 'Country code required for exports', 'निर्यात के लिए देश कोड आवश्यक है');
  }

  return errors;
};
