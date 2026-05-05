import { getItem } from "./localStorage";
import { showError } from "./toastHelpers";

const generateTempOrderNumber = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `TEMP-${timestamp}-${random}`;
};

const getOrderNumber = (order) => {
  if (order.orderNumber) return order.orderNumber;
  if (order._id) return `TEMP-${order._id.toString().slice(-6).toUpperCase()}`;
  return generateTempOrderNumber();
};

export const printOrder = (order, title) => {
  // Printer settings from localStorage
  const printWidth = getItem("printWidth") || 400;
  const printHeight = getItem("printHeight") || 600;
  const printCenter = getItem("printCenter") !== "false"; // default true
  const printFullscreen = getItem("printFullscreen") === "true"; // default false
  const printShowWindow = getItem("printShowWindow") !== "false"; // default true

  const styles = `
    <style>
      @media print {
        @page { margin: 0; size: ${printWidth}pt ${printHeight}pt; }
        body { margin: 0; padding: 8mm; }
      }
      body {
        font-family: 'Courier New', monospace;
        font-size: 12px;
        max-width: ${printWidth}px;
        margin: ${printCenter ? "0 auto" : "0"};
        line-height: 1.4;
        color: #000;
        padding: 16px;
      }
      .header { text-align: center; margin-bottom: 12px; border-bottom: 1px dashed #000; padding-bottom: 8px; }
      .header h2 { font-size: 18px; font-weight: bold; margin: 0 0 4px 0; }
      .order-info div { margin: 4px 0; }
      .order-id { font-size: 14px; font-weight: bold; text-align: center; padding: 6px; background: #f0f0f0; border: 1px solid #000; margin-bottom: 8px; }
      .items { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 11px; }
      .items td, .items th { border-bottom: 1px dashed #000; padding: 4px 2px; text-align: left; }
      .items th { font-weight: bold; border-bottom: 2px solid #000; padding-bottom: 6px; }
      .totals { margin-top: 12px; width: 100%; font-size: 12px; border-top: 2px solid #000; padding-top: 8px; }
      .totals tr:last-child td { font-weight: bold; border-bottom: 2px solid #000; padding-bottom: 8px; }
      .right { text-align: right; }
      .footer { text-align: center; margin-top: 16px; padding-top: 12px; border-top: 1px dashed #000; font-size: 11px; }
    </style>`;

  const itemsHtml = (order.items || [])
    .map(
      (it) => `
      <tr>
        <td>${it.name} ${it.qty > 1 ? `x${it.qty}` : ""}</td>
        <td class="right">Rs ${Number(it.unitPrice || 0).toFixed(0)}</td>
        <td class="right">Rs ${Number(it.lineTotal || 0).toFixed(0)}</td>
      </tr>`
    )
    .join("");

  const orderNumber = getOrderNumber(order);
  const paymentType = order.paymentMethod === "credit" ? "Qarza" : "Cash";
  const customerName =
    order.paymentMethod === "credit"
      ? order.qarzaAccount?.name || order.qarzaAccount || "N/A"
      : order.customerName || "N/A";

  const orderDate = new Date(order.createdAt || new Date());
  const formattedDate = orderDate.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const mobileNumber = getItem("phoneNumber");
  const address = getItem("address");
  const name = getItem("name");

  const html = `
    <html>
      <head><title>${title || "Order Receipt"}</title>${styles}</head>
      <body>
        <div class="header">
          <h2>${name || "Unknown"}</h2>
          <div>${address || "Unknown"} / ${mobileNumber || "Unknown"}</div>
        </div>
        <div class="order-id">ORDER ID: ${orderNumber}</div>
        <div class="order-info">
          <div><strong>Name:</strong> ${customerName}</div>
          <div><strong>Date:</strong> ${formattedDate}</div>
          ${order.room ? `<div><strong>Room:</strong> ${order.room}</div>` : ""}
          ${order.hall ? `<div><strong>Hall:</strong> ${order.hall}</div>` : ""}
           ${order.tableNo ? `<div><strong>Table No:</strong> ${order.tableNo}</div>` : ""}
          <div><strong>Payment:</strong> ${paymentType}</div>
          <div><strong>Status:</strong> Completed</div>
        </div>
        <table class="items">
          <thead>
            <tr><th>Item</th><th class="right">Unit</th><th class="right">Total</th></tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>
        <table class="totals">
          <tr><td>Subtotal:</td><td class="right">Rs ${Number(order.subtotal || 0).toFixed(0)}</td></tr>
          <tr><td>Discount:</td><td class="right">Rs ${Number(order.discountAmount || 0).toFixed(0)}</td></tr>
          <tr><td><strong>Grand Total:</strong></td><td class="right"><strong>Rs ${Number(order.total || order.totalAmount || 0).toFixed(0)}</strong></td></tr>
          ${
            order.paymentMethod === "cash"
              ? `<tr><td>Cash Received:</td><td class="right">Rs ${Number(order.cashReceived || 0).toFixed(0)}</td></tr>
               <tr><td>Change:</td><td class="right">Rs ${Number(order.change || 0).toFixed(0)}</td></tr>`
              : ""
          }
        </table>
        ${order.note ? `<div style="margin-top:10px; padding: 8px; background-color: #fff3cd; border: 1px solid #ffc107;"><strong>Note:</strong> ${order.note}</div>` : ""}
        <div class="footer">Thank you for visiting!<br/>Have a great day!</div>
      </body>
    </html>`;

  if (printShowWindow) {
    const w = window.open(
      "",
      "PRINT",
      `height=${printHeight},width=${printWidth}`
    );
    if (!w) return showError("Please allow popups for printing.");
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 200);
  } else {
    // Print without opening visible window (works in same tab)
    const printFrame = document.createElement("iframe");
    printFrame.style.position = "absolute";
    printFrame.style.left = "-9999px";
    document.body.appendChild(printFrame);
    printFrame.contentDocument.write(html);
    printFrame.contentDocument.close();
    printFrame.contentWindow.focus();
    setTimeout(() => {
      printFrame.contentWindow.print();
      document.body.removeChild(printFrame);
    }, 200);
  }
};
