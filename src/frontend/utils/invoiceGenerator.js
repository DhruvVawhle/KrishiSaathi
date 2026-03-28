import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * Generates and downloads a professional PDF invoice for a KrishiSaathi order.
 * @param {Object} order - The full order object containing items, totals, and customer info.
 */
export const generateInvoice = (order) => {
  if (!order) {
    console.error("No order data provided for invoice generation");
    alert("No order data available to generate invoice.");
    return;
  }

  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // --- 1. Header & Branding ---
    doc.setFillColor(45, 79, 30); // #2D4F1E
    doc.rect(0, 0, pageWidth, 40, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.text("KrishiSaathi", 20, 25);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Empowering Farmers, Enriching Lives", 20, 32);

    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("TAX INVOICE", pageWidth - 20, 25, { align: "right" });

    // --- 2. Invoice Meta Info ---
    doc.setTextColor(60, 60, 60);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`Invoice No: ${order.orderId || "N/A"}`, pageWidth - 20, 50, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.text(`Date: ${new Date(order.createdAt || Date.now()).toLocaleDateString("en-IN")}`, pageWidth - 20, 56, { align: "right" });
    doc.text(`Payment: ${String(order.paymentMethod || order.payment_method || "COD").toUpperCase()}`, pageWidth - 20, 62, { align: "right" });

    // --- 3. Seller & Buyer Details ---
    doc.setFont("helvetica", "bold");
    doc.text("Sold By:", 20, 50);
    doc.setFont("helvetica", "normal");
    doc.text("KrishiSaathi Agri-Tech Solutions", 20, 56);
    doc.text("Level 4, Krishi Bhavan, Shivaji Nagar", 20, 61);
    doc.text("Pune, Maharashtra - 411005", 20, 66);
    doc.text("GSTIN: 27AAACK1234A1Z5", 20, 71);

    // Buyer (Customer)
    const customer = order.deliveryAddress || order.customer || {};
    const buyerName = customer.name || order.buyerName || "Valued Customer";
    const address = customer.fullAddress || customer.address || "N/A";
    const phone = customer.phone || order.buyerPhone || "N/A";

    doc.setFont("helvetica", "bold");
    doc.text("Bill To:", 20, 85);
    doc.setFont("helvetica", "normal");
    doc.text(buyerName, 20, 91);

    const splitAddress = doc.splitTextToSize(address, 80);
    doc.text(splitAddress, 20, 96);

    const addressHeight = splitAddress.length * 5;
    doc.text(`Phone: ${phone}`, 20, 96 + addressHeight + 2);

    // --- 4. Items Table ---
    const tableColumn = ["#", "Item Description", "Category", "Qty", "Price", "Total"];
    const tableRows = (order.items || []).map((item, index) => {
      const qty = Number(item.qty || item.quantity || 1);
      const price = Number(item.price || 0);
      return [
        index + 1,
        item.name || "Product",
        item.category || "-",
        qty,
        `INR ${price.toFixed(2)}`,
        `INR ${(price * qty).toFixed(2)}`,
      ];
    });

    autoTable(doc, {
      startY: 120,
      head: [tableColumn],
      body: tableRows,
      theme: "striped",
      headStyles: { fillColor: [45, 79, 30], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [253, 250, 244] },
      margin: { left: 20, right: 20 },
    });

    // --- 5. Summary & Totals ---
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFont("helvetica", "bold");

    const summaryX = pageWidth - 70;

    // Calculate subtotal from items if not directly available
    const computedSubtotal = (order.items || []).reduce((sum, item) => {
      return sum + Number(item.price || 0) * Number(item.qty || item.quantity || 1);
    }, 0);
    const subtotal = Number(order.subtotal || computedSubtotal || 0);
    const deliveryFee = Number(order.deliveryFee || order.delivery_fee || 40);
    const discount = Number(order.discount || 0);
    const total = Number(order.total || order.totalAmount || (subtotal + deliveryFee - discount));

    doc.text("Subtotal:", summaryX, finalY);
    doc.setFont("helvetica", "normal");
    doc.text(`INR ${subtotal.toFixed(2)}`, pageWidth - 20, finalY, { align: "right" });

    doc.text("Delivery Fee:", summaryX, finalY + 6);
    doc.text(`INR ${deliveryFee.toFixed(2)}`, pageWidth - 20, finalY + 6, { align: "right" });

    if (discount > 0) {
      doc.setTextColor(226, 125, 96);
      doc.text("Discount:", summaryX, finalY + 12);
      doc.text(`- INR ${discount.toFixed(2)}`, pageWidth - 20, finalY + 12, { align: "right" });
      doc.setTextColor(60, 60, 60);
    }

    // Final Total Box
    const totalOffset = discount > 0 ? 20 : 14;
    doc.setFillColor(245, 230, 204);
    doc.rect(summaryX - 5, finalY + totalOffset - 5, 55, 10, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Total Amount:", summaryX, finalY + totalOffset + 2);
    doc.text(`INR ${total.toFixed(2)}`, pageWidth - 20, finalY + totalOffset + 2, { align: "right" });

    // --- 6. Footer ---
    const footerY = doc.internal.pageSize.height - 30;
    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(150, 150, 150);
    doc.text("This is a computer-generated invoice and does not require a physical signature.", pageWidth / 2, footerY, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(45, 79, 30);
    doc.text("Thank you for supporting sustainable farming with KrishiSaathi!", pageWidth / 2, footerY + 8, { align: "center" });

    // Download PDF
    doc.save(`KrishiSaathi_Invoice_${order.orderId || Date.now()}.pdf`);
    console.log("✅ Invoice downloaded for:", order.orderId);
  } catch (err) {
    console.error("❌ Invoice generation error:", err);
    alert("Failed to generate invoice. Please try again.");
  }
};
