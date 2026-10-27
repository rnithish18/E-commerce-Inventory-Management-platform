import PDFDocument from 'pdfkit';
import { getOrderDetail } from './order';
import { AppError } from '../middleware/errorHandler';

function formatRupees(paise: number): string {
  return '₹' + (paise / 100).toFixed(2);
}

export async function generateInvoicePdf(
  orderId: string,
  userId?: string
): Promise<PDFKit.PDFDocument> {
  const order = await getOrderDetail(orderId, userId);

  if (!['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'REFUNDED'].includes(order.status)) {
    throw new AppError(400, 'Tax invoice is only available for confirmed/paid orders', 'INVOICE_NOT_AVAILABLE');
  }

  const doc = new PDFDocument({ margin: 50, size: 'A4' });

  // Colors
  const navy = '#0f172a';
  const orange = '#f97316';
  const gray = '#64748b';
  const lightGray = '#f1f5f9';

  // Header
  doc
    .fillColor(orange)
    .fontSize(22)
    .font('Helvetica-Bold')
    .text('ShopNest', 50, 45)
    .fontSize(10)
    .fillColor(navy)
    .font('Helvetica-Bold')
    .text('TAX INVOICE / BILL OF SUPPLY', 50, 72)
    .font('Helvetica')
    .fillColor(gray)
    .text('Original for Recipient', 50, 86);

  // Seller Details (Right Side)
  doc
    .fontSize(8)
    .fillColor(navy)
    .font('Helvetica-Bold')
    .text('Sold By: ShopNest Retail Private Limited', 320, 45, { align: 'right' })
    .font('Helvetica')
    .fillColor(gray)
    .text('Plot 42, Electronic City Phase 1', 320, 57, { align: 'right' })
    .text('Bengaluru, Karnataka - 560100, India', 320, 69, { align: 'right' })
    .text('GSTIN: 29AAAAA0000A1Z5 | PAN: AAAAA0000A', 320, 81, { align: 'right' });

  doc
    .moveTo(50, 105)
    .lineTo(550, 105)
    .strokeColor('#cbd5e1')
    .lineWidth(1)
    .stroke();

  // Invoice & Order Metadata
  const shortId = order.id.slice(0, 8).toUpperCase();
  const orderDate = new Date(order.created_at).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  doc
    .fontSize(9)
    .fillColor(navy)
    .font('Helvetica-Bold')
    .text('Invoice Number:', 50, 120)
    .font('Helvetica')
    .text(`INV-${shortId}`, 130, 120)
    .font('Helvetica-Bold')
    .text('Invoice Date:', 50, 135)
    .font('Helvetica')
    .text(orderDate, 130, 135)
    .font('Helvetica-Bold')
    .text('Order ID:', 50, 150)
    .font('Helvetica')
    .text(order.id, 130, 150);

  // Billing & Shipping Info
  const addr = order.shipping_address as Record<string, string> || {};
  const recipientName = addr.full_name || order.user_email || 'Valued Customer';
  const recipientPhone = addr.phone || '';
  const street = [addr.line1, addr.line2].filter(Boolean).join(', ');
  const locality = [addr.city, addr.state, addr.pincode].filter(Boolean).join(', ');

  doc
    .font('Helvetica-Bold')
    .text('Bill To / Ship To:', 340, 120)
    .font('Helvetica')
    .fillColor(navy)
    .text(recipientName, 340, 135)
    .fillColor(gray)
    .text(street || 'Address on file', 340, 148, { width: 210 })
    .text(locality, 340, 160)
    .text(`Phone: ${recipientPhone || 'N/A'}`, 340, 172)
    .text(`Place of Supply: ${addr.state || 'Karnataka'}`, 340, 184);

  // Items Table Header
  const tableTop = 210;
  doc
    .rect(50, tableTop, 500, 22)
    .fill(lightGray);

  doc
    .fillColor(navy)
    .font('Helvetica-Bold')
    .fontSize(8)
    .text('Sl.', 55, tableTop + 6)
    .text('Item Description', 85, tableTop + 6)
    .text('HSN', 270, tableTop + 6)
    .text('Qty', 320, tableTop + 6)
    .text('Unit Price', 360, tableTop + 6)
    .text('Tax (18%)', 430, tableTop + 6)
    .text('Total', 500, tableTop + 6, { align: 'right' });

  let currentY = tableTop + 28;

  // Items Rows
  const items = order.items || [];
  items.forEach((item: any, idx: number) => {
    const itemTotal = item.unit_price_paise * item.quantity;
    const taxPaise = Math.round(itemTotal * (18 / 118));
    const basePaise = itemTotal - taxPaise;

    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor(navy)
      .text(String(idx + 1), 55, currentY)
      .text(item.product_name || 'Standard Product', 85, currentY, { width: 175, lineBreak: false })
      .fillColor(gray)
      .text('8518', 270, currentY)
      .text(String(item.quantity), 320, currentY)
      .text(formatRupees(item.unit_price_paise), 360, currentY)
      .text(formatRupees(taxPaise), 430, currentY)
      .fillColor(navy)
      .text(formatRupees(itemTotal), 490, currentY, { align: 'right' });

    currentY += 20;
  });

  doc
    .moveTo(50, currentY + 5)
    .lineTo(550, currentY + 5)
    .strokeColor('#cbd5e1')
    .lineWidth(0.5)
    .stroke();

  currentY += 15;

  // Calculation Breakdown
  const subtotal = order.subtotal_paise || order.total_paise;
  const discount = order.discount_paise || 0;
  const shipping = order.shipping_paise || 0;
  const tax = order.tax_paise || Math.round(order.total_paise * (18 / 118));
  const grandTotal = order.total_paise;

  const summaryLeft = 350;
  const summaryValRight = 550;

  doc.font('Helvetica').fontSize(8).fillColor(gray);

  doc.text('Subtotal:', summaryLeft, currentY);
  doc.text(formatRupees(subtotal), summaryLeft, currentY, { align: 'right', width: 200 });
  currentY += 14;

  if (discount > 0) {
    doc.text('Discount (Coupon):', summaryLeft, currentY);
    doc.text(`-${formatRupees(discount)}`, summaryLeft, currentY, { align: 'right', width: 200 });
    currentY += 14;
  }

  doc.text('Shipping & Handling:', summaryLeft, currentY);
  doc.text(shipping > 0 ? formatRupees(shipping) : 'FREE', summaryLeft, currentY, { align: 'right', width: 200 });
  currentY += 14;

  doc.text('Integrated GST (18%):', summaryLeft, currentY);
  doc.text(formatRupees(tax), summaryLeft, currentY, { align: 'right', width: 200 });
  currentY += 16;

  // Grand Total Box
  doc
    .rect(summaryLeft - 5, currentY - 3, 205, 24)
    .fill('#fff7ed');

  doc
    .font('Helvetica-Bold')
    .fontSize(10)
    .fillColor(navy)
    .text('Grand Total (INR):', summaryLeft, currentY + 3);

  doc
    .fillColor(orange)
    .text(formatRupees(grandTotal), summaryLeft, currentY + 3, { align: 'right', width: 195 });

  currentY += 45;

  // Footer notes & Signatory
  doc
    .fontSize(8)
    .font('Helvetica-Bold')
    .fillColor(navy)
    .text('Declaration & Terms:', 50, currentY)
    .font('Helvetica')
    .fillColor(gray)
    .text(
      'We declare that this invoice shows the actual price of the goods described and that all particulars are true and correct. ' +
      'Goods sold are intended for end-user consumption. ShopNest is a demonstration platform.',
      50,
      currentY + 12,
      { width: 320 }
    );

  doc
    .font('Helvetica-Bold')
    .fillColor(navy)
    .text('For ShopNest Retail Private Limited', 360, currentY, { align: 'right' })
    .font('Helvetica')
    .fillColor(gray)
    .text('[Digitally Signed]', 360, currentY + 14, { align: 'right' })
    .text('Authorized Signatory', 360, currentY + 26, { align: 'right' });

  doc
    .moveTo(50, 750)
    .lineTo(550, 750)
    .strokeColor('#e2e8f0')
    .stroke();

  doc
    .fontSize(7)
    .fillColor('#94a3b8')
    .text(
      'ShopNest Inc. • support@shopnest.com • Toll Free: 1800-SHOP-NEST • CIN: U72200KA2024PTC188888',
      50,
      760,
      { align: 'center', width: 500 }
    );

  return doc;
}
