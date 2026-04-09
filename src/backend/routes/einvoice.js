import express from 'express';
import { buildInvoicePayload, validatePayload } from '../utils/gstPayloadBuilder.js';
import { generateIRN, cancelIRN } from '../utils/irpClient.js';
import { HSN_CODES, STATE_CODES, UNIT_CODES, SUPPLY_TYPES, DOC_TYPES, CANCEL_REASONS } from '../utils/gstConstants.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

/**
 * Apply authentication middleware to all e-invoice routes.
 * Enforces authentication and provides a hook for role-based checks.
 */
router.use(authMiddleware);

/**
 * GET /api/einvoice/constants
 * Returns all GST constants (HSN codes, states, units, etc.) for the frontend form.
 */
router.get('/constants', (req, res) => {
  res.json({
    hsnCodes: HSN_CODES,
    stateCodes: STATE_CODES,
    unitCodes: UNIT_CODES,
    supplyTypes: SUPPLY_TYPES,
    docTypes: DOC_TYPES,
    cancelReasons: CANCEL_REASONS,
  });
});

/**
 * POST /api/einvoice/build
 * Builds and validates the INV-01 JSON payload (preview mode — does not submit to IRP).
 */
router.post('/build', (req, res) => {
  try {
    const payload = buildInvoicePayload(req.body);
    const errors = validatePayload(payload);

    if (errors.length > 0) {
      return res.status(400).json({ status: 'validation_error', errors, payload });
    }

    return res.json({ status: 'valid', payload });
  } catch (err) {
    console.error('❌ Payload Build Error:', err);
    return res.status(500).json({ status: 'error', message: 'Internal server error while building payload' });
  }
});

/**
 * POST /api/einvoice/generate
 * Builds, validates, and submits the e-Invoice to NIC IRP.
 * Returns IRN, QR code, and acknowledgement details.
 */
router.post('/generate', async (req, res) => {
  try {
    // Step 1: Build & Validate
    const payload = buildInvoicePayload(req.body);
    const errors = validatePayload(payload);

    if (errors.length > 0) {
      return res.status(400).json({ status: 'validation_error', errors });
    }

    // Step 2: Submit to IRP
    const result = await generateIRN(payload);

    // Step 3: Store in DB (MongoDB)
    // The caller can handle persistence; we return all data here.
    return res.json({
      status: 'success',
      irn: result.irn,
      ackNo: result.ackNo,
      ackDt: result.ackDt,
      signedInvoice: result.signedInvoice,
      signedQRCode: result.signedQRCode,
      payload,
    });
  } catch (err) {
    console.error('❌ e-Invoice Generate Error:', err);
    // IRP-specific errors
    if (err.irpErrors) {
      return res.status(400).json({
        status: 'irp_error',
        errors: err.irpErrors,
      });
    }
    return res.status(500).json({ status: 'error', message: 'Internal server error while generating e-Invoice' });
  }
});

/**
 * POST /api/einvoice/cancel
 * Cancels an existing IRN (within 24 hours).
 * Body: { irn, reason, remark }
 */
router.post('/cancel', async (req, res) => {
  try {
    const { irn, reason, remark } = req.body;
    if (!irn) return res.status(400).json({ status: 'error', message: 'IRN is required' });

    // Validate Cancellation Reason (1-4 as per IRP schema)
    if (reason === undefined || reason === null) {
      return res.status(400).json({ status: 'error', message: 'Cancellation reason is required' });
    }
    const reasonCode = Number(reason);
    if (isNaN(reasonCode) || ![1, 2, 3, 4].includes(reasonCode)) {
      return res.status(400).json({ status: 'error', message: 'Invalid cancellation reason. Allowed codes: 1 (Duplicate), 2 (Data Entry Mistake), 3 (Order Cancelled), 4 (Others)' });
    }

    const result = await cancelIRN(irn, reasonCode, remark);
    return res.json(result);
  } catch (err) {
    console.error('❌ IRN Cancel Error:', err);
    return res.status(500).json({ status: 'error', message: 'Internal server error while canceling IRN' });
  }
});

export default router;
