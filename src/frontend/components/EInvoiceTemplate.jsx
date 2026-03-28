import React, { useRef } from 'react';
import { ArrowLeft, Printer, Download } from 'lucide-react';

/**
 * Professional Printable GST e-Invoice Template with IRN & QR Code.
 * Props:
 *   - result: { irn, ackNo, ackDt, signedQRCode }
 *   - payload: The full GST INV-01 v1.04 JSON object
 *   - onBack: Function to go back to the form
 */

const T = {
  page: { minHeight: '100vh', background: '#F5E6CC', padding: '32px 16px', fontFamily: 'DM Sans' },
  container: { maxWidth: 900, margin: '0 auto' },
  invoiceCard: {
    background: 'white', borderRadius: 0, padding: '48px 40px',
    boxShadow: '0 8px 40px rgba(0,0,0,0.08)', border: '1px solid #ddd',
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
    borderBottom: '3px solid #2D4F1E', paddingBottom: 20, marginBottom: 24,
  },
  table: {
    width: '100%', borderCollapse: 'collapse', fontSize: 12, marginTop: 16,
  },
  th: {
    background: '#2D4F1E', color: 'white', padding: '8px 10px', textAlign: 'left',
    fontWeight: 700, fontSize: 11, letterSpacing: '0.03em',
  },
  td: {
    padding: '8px 10px', borderBottom: '1px solid #eee', fontSize: 12, color: '#333',
  },
  tdRight: {
    padding: '8px 10px', borderBottom: '1px solid #eee', fontSize: 12, color: '#333', textAlign: 'right',
  },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 11, fontWeight: 700, color: '#2D4F1E', textTransform: 'uppercase',
    letterSpacing: '0.08em', marginBottom: 8, borderBottom: '1px solid #EDD9B0', paddingBottom: 4,
  },
  flex2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 },
  info: { fontSize: 12, color: '#333', lineHeight: 1.8 },
  bold: { fontWeight: 700, color: '#1a1a1a' },
};

const EInvoiceTemplate = ({ result, payload, onBack }) => {
  const printRef = useRef();

  const handlePrint = () => {
    const printContent = printRef.current;
    const win = window.open('', '_blank');
    win.document.write(`
      <html><head><title>GST e-Invoice</title>
      <style>
        body { font-family: 'Segoe UI', sans-serif; margin: 0; padding: 20px; }
        table { width: 100%; border-collapse: collapse; }
        th { background: #2D4F1E; color: white; padding: 8px; text-align: left; font-size: 11px; }
        td { padding: 8px; border-bottom: 1px solid #eee; font-size: 12px; }
        .header { border-bottom: 3px solid #2D4F1E; padding-bottom: 16px; margin-bottom: 20px; }
        .irn-box { background: #f5f5f5; padding: 12px; border-radius: 4px; margin: 16px 0; font-family: monospace; }
        @media print { body { padding: 0; } }
      </style></head><body>
      ${printContent.innerHTML}
      </body></html>
    `);
    win.document.close();
    win.print();
  };

  const sel = payload?.SellerDtls || {};
  const buy = payload?.BuyerDtls || {};
  const doc = payload?.DocDtls || {};
  const val = payload?.ValDtls || {};
  const items = payload?.ItemList || [];
  const isInterState = sel.Stcd !== buy.Stcd;

  return (
    <div style={T.page}>
      <div style={T.container}>
        {/* Action Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <button onClick={onBack} style={{
            display: 'flex', alignItems: 'center', gap: 8, background: 'none',
            border: '1.5px solid #EDD9B0', borderRadius: 10, padding: '8px 16px',
            cursor: 'pointer', fontFamily: 'DM Sans', fontWeight: 600, color: '#2D4F1E',
          }}>
            <ArrowLeft size={16} /> Back to Form
          </button>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={handlePrint} style={{
              display: 'flex', alignItems: 'center', gap: 8, background: '#2D4F1E',
              border: 'none', borderRadius: 10, padding: '10px 20px',
              cursor: 'pointer', fontFamily: 'DM Sans', fontWeight: 700, color: 'white',
              boxShadow: '0 4px 12px rgba(45,79,30,0.2)',
            }}>
              <Printer size={16} /> Print Invoice
            </button>
          </div>
        </div>

        {/* Printable Invoice */}
        <div ref={printRef} style={T.invoiceCard}>
          {/* Header */}
          <div style={T.header} className="header">
            <div>
              <h1 style={{ fontFamily: 'Playfair Display', fontSize: 28, color: '#2D4F1E', margin: 0, fontWeight: 700 }}>
                KrishiSaathi
              </h1>
              <p style={{ fontSize: 11, color: '#7A7A7A', margin: '4px 0 0' }}>Empowering Farmers, Enriching Lives</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: '#2D4F1E', margin: 0 }}>TAX INVOICE</h2>
              <p style={{ fontSize: 12, color: '#7A7A7A', margin: '4px 0 0' }}>
                {doc.Typ === 'CRN' ? 'Credit Note' : doc.Typ === 'DBN' ? 'Debit Note' : 'Original for Recipient'}
              </p>
            </div>
          </div>

          {/* IRN & ACK Box */}
          {result?.irn && (
            <div className="irn-box" style={{
              background: '#f0f7f0', border: '1.5px solid #c8e6c9', borderRadius: 8,
              padding: '14px 18px', marginBottom: 24, fontFamily: 'Consolas, monospace',
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#2D4F1E', letterSpacing: '0.1em', marginBottom: 6 }}>
                IRN (Invoice Reference Number)
              </div>
              <div style={{ fontSize: 13, wordBreak: 'break-all', color: '#1a1a1a', fontWeight: 700 }}>
                {result.irn}
              </div>
              <div style={{ display: 'flex', gap: 24, marginTop: 10, fontSize: 11, color: '#555' }}>
                <span>Ack No: <strong>{result.ackNo}</strong></span>
                <span>Ack Date: <strong>{result.ackDt}</strong></span>
              </div>
            </div>
          )}

          {/* Seller & Buyer */}
          <div style={T.flex2}>
            <div style={T.section}>
              <div style={T.sectionTitle}>Seller (Supplier)</div>
              <div style={T.info}>
                <div style={T.bold}>{sel.LglNm}</div>
                {sel.TrdNm && sel.TrdNm !== sel.LglNm && <div>T/A: {sel.TrdNm}</div>}
                <div>{sel.Addr1}{sel.Addr2 ? `, ${sel.Addr2}` : ''}</div>
                <div>{sel.Loc} — {sel.Pin}</div>
                <div>GSTIN: <strong>{sel.Gstin}</strong></div>
                <div>State Code: {sel.Stcd}</div>
                {sel.Ph && <div>📞 {sel.Ph}</div>}
                {sel.Em && <div>✉️ {sel.Em}</div>}
              </div>
            </div>
            <div style={T.section}>
              <div style={T.sectionTitle}>Buyer</div>
              <div style={T.info}>
                <div style={T.bold}>{buy.LglNm}</div>
                {buy.TrdNm && buy.TrdNm !== buy.LglNm && <div>T/A: {buy.TrdNm}</div>}
                <div>{buy.Addr1}{buy.Addr2 ? `, ${buy.Addr2}` : ''}</div>
                <div>{buy.Loc} — {buy.Pin}</div>
                <div>GSTIN: <strong>{buy.Gstin}</strong></div>
                <div>Place of Supply: {buy.Pos}</div>
                {buy.Ph && <div>📞 {buy.Ph}</div>}
                {buy.Em && <div>✉️ {buy.Em}</div>}
              </div>
            </div>
          </div>

          {/* Invoice Details Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', background: '#f9f9f9', borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: 12 }}>
            <span><strong>Invoice No:</strong> {doc.No}</span>
            <span><strong>Date:</strong> {doc.Dt}</span>
            <span><strong>Type:</strong> {isInterState ? 'Inter-State (IGST)' : 'Intra-State (CGST+SGST)'}</span>
          </div>

          {/* Items Table */}
          <table style={T.table}>
            <thead>
              <tr>
                <th style={T.th}>#</th>
                <th style={T.th}>Description</th>
                <th style={T.th}>HSN</th>
                <th style={{ ...T.th, textAlign: 'right' }}>Qty</th>
                <th style={T.th}>Unit</th>
                <th style={{ ...T.th, textAlign: 'right' }}>Rate (₹)</th>
                <th style={{ ...T.th, textAlign: 'right' }}>Taxable (₹)</th>
                {isInterState ? (
                  <th style={{ ...T.th, textAlign: 'right' }}>IGST (₹)</th>
                ) : (
                  <>
                    <th style={{ ...T.th, textAlign: 'right' }}>CGST (₹)</th>
                    <th style={{ ...T.th, textAlign: 'right' }}>SGST (₹)</th>
                  </>
                )}
                <th style={{ ...T.th, textAlign: 'right' }}>Total (₹)</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                  <td style={T.td}>{item.SlNo}</td>
                  <td style={T.td}>{item.PrdDesc}</td>
                  <td style={T.td}>{item.HsnCd}</td>
                  <td style={T.tdRight}>{item.Qty}</td>
                  <td style={T.td}>{item.Unit}</td>
                  <td style={T.tdRight}>{Number(item.UnitPrice).toFixed(2)}</td>
                  <td style={T.tdRight}>{Number(item.AssAmt).toFixed(2)}</td>
                  {isInterState ? (
                    <td style={T.tdRight}>{Number(item.IgstAmt).toFixed(2)}</td>
                  ) : (
                    <>
                      <td style={T.tdRight}>{Number(item.CgstAmt).toFixed(2)}</td>
                      <td style={T.tdRight}>{Number(item.SgstAmt).toFixed(2)}</td>
                    </>
                  )}
                  <td style={{ ...T.tdRight, fontWeight: 700 }}>{Number(item.TotItemVal).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals Summary */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
            <div style={{ width: 300 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13, borderBottom: '1px solid #eee' }}>
                <span>Taxable Amount</span>
                <span style={{ fontWeight: 600 }}>₹{Number(val.AssVal).toFixed(2)}</span>
              </div>
              {isInterState ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13, borderBottom: '1px solid #eee' }}>
                  <span>IGST</span>
                  <span style={{ fontWeight: 600 }}>₹{Number(val.IgstVal).toFixed(2)}</span>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13, borderBottom: '1px solid #eee' }}>
                    <span>CGST</span>
                    <span style={{ fontWeight: 600 }}>₹{Number(val.CgstVal).toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13, borderBottom: '1px solid #eee' }}>
                    <span>SGST</span>
                    <span style={{ fontWeight: 600 }}>₹{Number(val.SgstVal).toFixed(2)}</span>
                  </div>
                </>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontSize: 16, fontWeight: 800, color: '#2D4F1E', borderTop: '2px solid #2D4F1E', marginTop: 6 }}>
                <span>Total Invoice Value</span>
                <span>₹{Number(val.TotInvVal).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* QR Code */}
          {result?.signedQRCode && (
            <div style={{ display: 'flex', justifyContent: 'center', margin: '32px 0 16px', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#7A7A7A', letterSpacing: '0.1em', marginBottom: 8, textTransform: 'uppercase' }}>
                Scan QR Code to Verify
              </div>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(result.signedQRCode)}`}
                alt="e-Invoice QR Code"
                style={{ width: 150, height: 150, border: '2px solid #EDD9B0', borderRadius: 8 }}
              />
            </div>
          )}

          {/* Footer */}
          <div style={{ borderTop: '1px solid #eee', paddingTop: 16, marginTop: 32, textAlign: 'center' }}>
            <p style={{ fontSize: 10, color: '#999', fontStyle: 'italic' }}>
              This is a computer-generated e-Invoice and does not require a physical signature.
            </p>
            <p style={{ fontSize: 11, color: '#2D4F1E', fontWeight: 600 }}>
              Thank you for supporting sustainable farming with KrishiSaathi! 🌾
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EInvoiceTemplate;
