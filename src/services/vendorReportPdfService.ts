import { BHANSA_BANNER_LOGO_BASE64 } from "@/constants/bannerLogoBase64";
import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Alert, Platform } from "react-native";

export interface ReportPdfData {
  monthLabel: string;
  storeName: string;
  vendorPhone?: string;
  vendorEmail?: string;
  panNumber?: string;
  curGrossRevenue: number;
  curNetEarnings: number;
  curPlatformCommission: number;
  curUnitsSold: number;
  curCompletedOrders: number;
  curCancelledOrders: number;
  curCancelledUnits: number;
  curCancelledValue: number;
  curReturnRate: string;
  curDispatchedToRiders: number;
  curDeliveredOrders: number;
  curInTransitOrders: number;
  curDeliverySuccessRate: string;
  curCodRevenue: number;
  curOnlineRevenue: number;
  curCodOrdersCount: number;
  curOnlineOrdersCount: number;
  riderCodCash: number;
  prevMonthLabel: string;
  prevGrossRevenue: number;
  prevOrdersCount: number;
  prevUnitsSold: number;
  revenueGrowthPct: number;
  isGrowing: boolean;
  topProducts: {
    name: string;
    quantity: number;
    revenue: number;
    category?: string;
  }[];
  codDueRiders?: {
    deliveryBoy?: {
      fullName?: string;
      phone?: string;
    };
    totalDue?: number;
    ordersCount?: number;
  }[];
}

export function buildVendorReportHtml(data: ReportPdfData): string {
  const generatedAt = new Date().toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const growthColor = data.isGrowing ? "#15803D" : "#DC2626";
  const growthBg = data.isGrowing ? "#DCFCE7" : "#FEE2E2";
  const growthSign = data.revenueGrowthPct >= 0 ? "+" : "";

  // Top products table rows
  const productsRows = (data.topProducts || [])
    .slice(0, 5)
    .map(
      (p, i) => `
      <tr style="border-bottom: 1px solid #E2E8F0;">
        <td style="padding: 10px; font-weight: 700; color: #475569; text-align: center; width: 40px;">#${i + 1}</td>
        <td style="padding: 10px; font-weight: 600; color: #0F172A;">
          ${p.name}
          <div style="font-size: 11px; color: #64748B; font-weight: 400;">${p.category || "General Grocery"}</div>
        </td>
        <td style="padding: 10px; text-align: right; font-weight: 600; color: #334155;">${p.quantity.toLocaleString()} units</td>
        <td style="padding: 10px; text-align: right; font-weight: 700; color: #016073;">NPR ${p.revenue.toLocaleString()}</td>
      </tr>
    `,
    )
    .join("");

  // Riders rows
  const ridersRows =
    data.codDueRiders && data.codDueRiders.length > 0
      ? data.codDueRiders
          .slice(0, 4)
          .map(
            (r) => `
        <tr style="border-bottom: 1px solid #E2E8F0;">
          <td style="padding: 8px 10px; font-weight: 600; color: #0F172A;">${r.deliveryBoy?.fullName || "Delivery Partner"}</td>
          <td style="padding: 8px 10px; color: #64748B; font-size: 11px;">${r.deliveryBoy?.phone || "N/A"}</td>
          <td style="padding: 8px 10px; text-align: center; color: #334155;">${r.ordersCount || 0}</td>
          <td style="padding: 8px 10px; text-align: right; font-weight: 700; color: #7E22CE;">NPR ${(r.totalDue || 0).toLocaleString()}</td>
        </tr>
      `,
          )
          .join("")
      : `<tr><td colspan="4" style="padding: 10px; text-align: center; color: #94A3B8; font-size: 12px;">No pending rider COD cash for this period.</td></tr>`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Bhansamart Vendor Monthly Statement - ${data.monthLabel}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 15mm 12mm 15mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0F172A;
      background: #FFFFFF;
      font-size: 12px;
      line-height: 1.45;
      padding: 0;
    }
    .header-container {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #016073;
      padding-bottom: 14px;
      margin-bottom: 16px;
    }
    .logo-img {
      max-height: 52px;
      width: auto;
      object-fit: contain;
    }
    .header-right {
      text-align: right;
    }
    .doc-title {
      font-size: 18px;
      font-weight: 800;
      color: #016073;
      letter-spacing: -0.3px;
      text-transform: uppercase;
    }
    .doc-sub {
      font-size: 11px;
      color: #64748B;
      margin-top: 2px;
    }
    .meta-grid {
      display: flex;
      justify-content: space-between;
      background: #F8FAFC;
      border: 1px solid #E2E8F0;
      border-radius: 8px;
      padding: 12px 16px;
      margin-bottom: 16px;
    }
    .meta-col {
      flex: 1;
    }
    .meta-col:last-child {
      text-align: right;
    }
    .meta-label {
      font-size: 10px;
      font-weight: 700;
      color: #64748B;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 2px;
    }
    .meta-val {
      font-size: 13px;
      font-weight: 700;
      color: #0F172A;
    }
    .meta-sub {
      font-size: 11px;
      color: #475569;
    }

    /* Executive Hero Card */
    .executive-card {
      background: linear-gradient(135deg, #016073 0%, #004754 100%);
      color: #FFFFFF;
      border-radius: 10px;
      padding: 16px 20px;
      margin-bottom: 16px;
      page-break-inside: avoid;
    }
    .exec-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .exec-rev-title {
      font-size: 11px;
      color: #E2E8F0;
      font-weight: 600;
      text-transform: uppercase;
    }
    .exec-rev-val {
      font-size: 26px;
      font-weight: 900;
      letter-spacing: -0.5px;
      margin-top: 2px;
    }
    .exec-badge {
      display: inline-block;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 800;
      background: ${growthBg};
      color: ${growthColor};
    }
    .exec-stats-grid {
      display: flex;
      justify-content: space-between;
      border-top: 1px solid rgba(255, 255, 255, 0.2);
      padding-top: 12px;
      gap: 16px;
    }
    .exec-stat-item {
      flex: 1;
    }
    .exec-stat-label {
      font-size: 10px;
      color: #CBD5E1;
      margin-bottom: 2px;
    }
    .exec-stat-val {
      font-size: 15px;
      font-weight: 800;
    }
    .val-green {
      color: #34D399;
    }

    /* Financial Breakdown Table */
    .section-title {
      font-size: 13px;
      font-weight: 800;
      color: #016073;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .table-container {
      width: 100%;
      border-collapse: collapse;
      border: 1px solid #E2E8F0;
      border-radius: 8px;
      overflow: hidden;
      margin-bottom: 16px;
      page-break-inside: avoid;
    }
    .table-container th {
      background: #F1F5F9;
      color: #475569;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 8px 10px;
      text-align: left;
      border-bottom: 1px solid #CBD5E1;
    }
    .table-container td {
      padding: 9px 10px;
      font-size: 11px;
    }

    /* KPI 4-Box Grid */
    .kpi-row {
      display: flex;
      gap: 12px;
      margin-bottom: 16px;
      page-break-inside: avoid;
    }
    .kpi-box {
      flex: 1;
      border: 1px solid #E2E8F0;
      border-radius: 8px;
      padding: 10px 12px;
      background: #FFFFFF;
    }
    .kpi-box-title {
      font-size: 10px;
      font-weight: 700;
      color: #64748B;
      text-transform: uppercase;
      margin-bottom: 4px;
    }
    .kpi-box-value {
      font-size: 17px;
      font-weight: 800;
      color: #0F172A;
    }
    .kpi-box-sub {
      font-size: 10px;
      color: #64748B;
      margin-top: 2px;
    }

    /* Two Column Split */
    .split-row {
      display: flex;
      gap: 16px;
      margin-bottom: 16px;
      page-break-inside: avoid;
    }
    .split-col {
      flex: 1;
    }

    /* Footer */
    .footer-note {
      border-top: 1px dashed #CBD5E1;
      padding-top: 10px;
      margin-top: 14px;
      font-size: 9.5px;
      color: #64748B;
      display: flex;
      justify-content: space-between;
      align-items: center;
      page-break-inside: avoid;
    }
  </style>
</head>
<body>

  <!-- Top Header with Banner Logo -->
  <div class="header-container">
    <div>
      <img src="${BHANSA_BANNER_LOGO_BASE64}" alt="Bhansamart Logo" class="logo-img" />
    </div>
    <div class="header-right">
      <div class="doc-title">Bhansamart Vendor Report</div>
      <div class="doc-sub">Monthly Performance & Financial Statement</div>
      <div style="font-size: 10px; color: #94A3B8; margin-top: 2px;">Generated on: ${generatedAt}</div>
    </div>
  </div>

  <!-- Vendor & Statement Meta -->
  <div class="meta-grid">
    <div class="meta-col">
      <div class="meta-label">Vendor Store Account</div>
      <div class="meta-val">${data.storeName}</div>
      <div class="meta-sub">Phone: ${data.vendorPhone || "N/A"} • Email: ${data.vendorEmail || "N/A"}</div>
      ${data.panNumber ? `<div class="meta-sub">PAN / VAT Reg: ${data.panNumber}</div>` : ""}
    </div>
    <div class="meta-col">
      <div class="meta-label">Billing Statement Cycle</div>
      <div class="meta-val">${data.monthLabel}</div>
      <div class="meta-sub">Compared vs: ${data.prevMonthLabel}</div>
    </div>
    <div class="meta-col">
      <div class="meta-label">Payout Status</div>
      <div class="meta-val" style="color: #10B981;">VERIFIED & RECONCILED</div>
      <div class="meta-sub">Bhansa Merchant Network</div>
    </div>
  </div>

  <!-- Executive Revenue Banner -->
  <div class="executive-card">
    <div class="exec-top">
      <div>
        <div class="exec-rev-title">Gross Merchandise Value (GMV) - ${data.monthLabel}</div>
        <div class="exec-rev-val">NPR ${data.curGrossRevenue.toLocaleString()}</div>
      </div>
      <div>
        <div class="exec-badge">
          ${growthSign}${data.revenueGrowthPct.toFixed(1)}% vs Last Month ${data.isGrowing ? "↗" : "↘"}
        </div>
      </div>
    </div>
    <div class="exec-stats-grid">
      <div class="exec-stat-item">
        <div class="exec-stat-label">Vendor Net Earnings (Take Home)</div>
        <div class="exec-stat-val val-green">NPR ${data.curNetEarnings.toLocaleString()}</div>
      </div>
      <div class="exec-stat-item">
        <div class="exec-stat-label">Platform Service Commission (10%)</div>
        <div class="exec-stat-val">NPR ${data.curPlatformCommission.toLocaleString()}</div>
      </div>
      <div class="exec-stat-item">
        <div class="exec-stat-label">Total Units Sold</div>
        <div class="exec-stat-val">${data.curUnitsSold.toLocaleString()} units</div>
      </div>
      <div class="exec-stat-item">
        <div class="exec-stat-label">Completed Orders</div>
        <div class="exec-stat-val">${data.curCompletedOrders} orders</div>
      </div>
    </div>
  </div>

  <!-- 4 Core Performance KPI Blocks -->
  <div class="kpi-row">
    <div class="kpi-box" style="border-left: 4px solid #2563EB;">
      <div class="kpi-box-title">Products Sold</div>
      <div class="kpi-box-value">${data.curUnitsSold.toLocaleString()} <span style="font-size: 11px; font-weight: normal;">units</span></div>
      <div class="kpi-box-sub">${data.curCompletedOrders} orders • Avg ${(data.curUnitsSold / Math.max(1, data.curCompletedOrders)).toFixed(1)} items/order</div>
    </div>

    <div class="kpi-box" style="border-left: 4px solid #DC2626;">
      <div class="kpi-box-title">Returns & Cancelled</div>
      <div class="kpi-box-value" style="color: #DC2626;">${data.curCancelledOrders} <span style="font-size: 11px; font-weight: normal;">orders (${data.curReturnRate}%)</span></div>
      <div class="kpi-box-sub">${data.curCancelledUnits} units • NPR ${data.curCancelledValue.toLocaleString()} lost</div>
    </div>

    <div class="kpi-box" style="border-left: 4px solid #7E22CE;">
      <div class="kpi-box-title">Delivery Dispatches</div>
      <div class="kpi-box-value" style="color: #7E22CE;">${data.curDispatchedToRiders} <span style="font-size: 11px; font-weight: normal;">orders</span></div>
      <div class="kpi-box-sub">${data.curDeliveredOrders} delivered (${data.curDeliverySuccessRate}%) • ${data.curInTransitOrders} on road</div>
    </div>

    <div class="kpi-box" style="border-left: 4px solid #10B981;">
      <div class="kpi-box-title">Rider COD Cash Custody</div>
      <div class="kpi-box-value" style="color: #059669;">NPR ${data.riderCodCash.toLocaleString()}</div>
      <div class="kpi-box-sub">Cash collected with riders to hand over</div>
    </div>
  </div>

  <!-- Financial Statement Ledger Table -->
  <div class="section-title">Financial Settlement Ledger Statement</div>
  <table class="table-container">
    <thead>
      <tr>
        <th>Transaction / Ledger Item</th>
        <th style="text-align: center;">Orders / Units</th>
        <th style="text-align: right;">Rate / Impact</th>
        <th style="text-align: right;">Total Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr style="border-bottom: 1px solid #E2E8F0;">
        <td style="font-weight: 700; color: #0F172A;">Gross Merchandise Value (GMV) Sales</td>
        <td style="text-align: center;">${data.curCompletedOrders} Orders (${data.curUnitsSold} Units)</td>
        <td style="text-align: right; color: #16A34A; font-weight: 600;">+100.0%</td>
        <td style="text-align: right; font-weight: 800; color: #0F172A;">NPR ${data.curGrossRevenue.toLocaleString()}</td>
      </tr>
      <tr style="border-bottom: 1px solid #E2E8F0; background: #FFFBFB;">
        <td style="color: #475569;">Bhansamart Marketplace Platform Commission</td>
        <td style="text-align: center;">All settled orders</td>
        <td style="text-align: right; color: #DC2626; font-weight: 600;">-10.0%</td>
        <td style="text-align: right; font-weight: 700; color: #DC2626;">- NPR ${data.curPlatformCommission.toLocaleString()}</td>
      </tr>
      <tr style="border-bottom: 1px solid #E2E8F0;">
        <td style="color: #475569;">Payment Gateway & Online Processing Fee</td>
        <td style="text-align: center;">${data.curOnlineOrdersCount} Online orders</td>
        <td style="text-align: right; color: #15803D; font-weight: 600;">Waived (0%)</td>
        <td style="text-align: right; font-weight: 600; color: #15803D;">NPR 0</td>
      </tr>
      <tr style="border-bottom: 1px solid #CBD5E1; background: #F8FAFC;">
        <td style="color: #475569;">Customer Returns & Cancellation Loss (Refunded)</td>
        <td style="text-align: center;">${data.curCancelledOrders} Cancelled orders</td>
        <td style="text-align: right; color: #DC2626; font-weight: 600;">Refunded</td>
        <td style="text-align: right; font-weight: 600; color: #DC2626;">- NPR ${data.curCancelledValue.toLocaleString()}</td>
      </tr>
      <tr style="background: #F0FDF4;">
        <td style="font-weight: 800; color: #15803D; font-size: 13px;">Net Vendor Payout (Credited to Wallet)</td>
        <td style="text-align: center; font-weight: 700; color: #15803D;">Net Settled</td>
        <td style="text-align: right; font-weight: 700; color: #15803D;">90.0% GMV</td>
        <td style="text-align: right; font-weight: 900; color: #15803D; font-size: 14px;">NPR ${data.curNetEarnings.toLocaleString()}</td>
      </tr>
    </tbody>
  </table>

  <!-- Two Column Split: MoM Comparison & Payment Mode Breakdown -->
  <div class="split-row">
    <!-- Left Column: MoM Growth Summary -->
    <div class="split-col">
      <div class="section-title">Month-over-Month Growth Analysis</div>
      <table class="table-container">
        <thead>
          <tr>
            <th>Metric</th>
            <th style="text-align: right;">${data.prevMonthLabel}</th>
            <th style="text-align: right;">${data.monthLabel}</th>
            <th style="text-align: right;">Change</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom: 1px solid #E2E8F0;">
            <td style="font-weight: 600;">Gross Revenue</td>
            <td style="text-align: right; color: #64748B;">NPR ${data.prevGrossRevenue.toLocaleString()}</td>
            <td style="text-align: right; font-weight: 700; color: #016073;">NPR ${data.curGrossRevenue.toLocaleString()}</td>
            <td style="text-align: right; font-weight: 800; color: ${growthColor};">${growthSign}${data.revenueGrowthPct.toFixed(1)}%</td>
          </tr>
          <tr style="border-bottom: 1px solid #E2E8F0;">
            <td style="font-weight: 600;">Orders Completed</td>
            <td style="text-align: right; color: #64748B;">${data.prevOrdersCount}</td>
            <td style="text-align: right; font-weight: 700; color: #2563EB;">${data.curCompletedOrders}</td>
            <td style="text-align: right; font-weight: 800; color: #16A34A;">
              ${data.curCompletedOrders >= data.prevOrdersCount ? "+" : ""}${(((data.curCompletedOrders - data.prevOrdersCount) / Math.max(1, data.prevOrdersCount)) * 100).toFixed(1)}%
            </td>
          </tr>
          <tr>
            <td style="font-weight: 600;">Units Sold</td>
            <td style="text-align: right; color: #64748B;">${data.prevUnitsSold}</td>
            <td style="text-align: right; font-weight: 700; color: #10B981;">${data.curUnitsSold}</td>
            <td style="text-align: right; font-weight: 800; color: #16A34A;">
              ${data.curUnitsSold >= data.prevUnitsSold ? "+" : ""}${(((data.curUnitsSold - data.prevUnitsSold) / Math.max(1, data.prevUnitsSold)) * 100).toFixed(1)}%
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Right Column: Payment Modes -->
    <div class="split-col">
      <div class="section-title">Payment Mode Distribution</div>
      <table class="table-container">
        <thead>
          <tr>
            <th>Channel</th>
            <th style="text-align: center;">Orders</th>
            <th style="text-align: right;">Amount</th>
            <th style="text-align: right;">Share</th>
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom: 1px solid #E2E8F0;">
            <td style="font-weight: 600; color: #2563EB;">Online / Digital (eSewa/Card)</td>
            <td style="text-align: center;">${data.curOnlineOrdersCount}</td>
            <td style="text-align: right; font-weight: 700;">NPR ${data.curOnlineRevenue.toLocaleString()}</td>
            <td style="text-align: right; font-weight: 700; color: #2563EB;">
              ${((data.curOnlineRevenue / Math.max(1, data.curGrossRevenue)) * 100).toFixed(0)}%
            </td>
          </tr>
          <tr style="border-bottom: 1px solid #E2E8F0;">
            <td style="font-weight: 600; color: #D97706;">Cash on Delivery (COD)</td>
            <td style="text-align: center;">${data.curCodOrdersCount}</td>
            <td style="text-align: right; font-weight: 700;">NPR ${data.curCodRevenue.toLocaleString()}</td>
            <td style="text-align: right; font-weight: 700; color: #D97706;">
              ${((data.curCodRevenue / Math.max(1, data.curGrossRevenue)) * 100).toFixed(0)}%
            </td>
          </tr>
          <tr style="background: #F8FAFC;">
            <td style="font-weight: 700;">Total Reconciliation</td>
            <td style="text-align: center; font-weight: 700;">${data.curCompletedOrders}</td>
            <td style="text-align: right; font-weight: 800; color: #016073;">NPR ${data.curGrossRevenue.toLocaleString()}</td>
            <td style="text-align: right; font-weight: 800;">100%</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Top 5 Best Selling Products Table -->
  <div class="section-title">Top 5 Best-Selling Products in ${data.monthLabel}</div>
  <table class="table-container">
    <thead>
      <tr>
        <th style="width: 40px; text-align: center;">Rank</th>
        <th>Product Name & Category</th>
        <th style="text-align: right;">Units Sold</th>
        <th style="text-align: right;">Total Sales (GMV)</th>
      </tr>
    </thead>
    <tbody>
      ${productsRows}
    </tbody>
  </table>

  <!-- Active Delivery Boy COD Custody Breakdown -->
  <div class="section-title">Delivery Logistics & Rider COD Cash Status</div>
  <table class="table-container">
    <thead>
      <tr>
        <th>Delivery Partner</th>
        <th>Phone Contact</th>
        <th style="text-align: center;">Orders Handled</th>
        <th style="text-align: right;">COD Cash in Custody</th>
      </tr>
    </thead>
    <tbody>
      ${ridersRows}
    </tbody>
  </table>

  <!-- Official Footer & Verification -->
  <div class="footer-note">
    <div>
      <strong>Bhansamart Marketplace Limited</strong> • Seller Account Services<br />
      Tinkune, Kathmandu, Nepal • Support: support@bhansamart.com • +977-1-4XXXXXX
    </div>
    <div style="text-align: right;">
      This is a computer-verified statement.<br />
      Document Ref: BHM-VND-${Date.now().toString().slice(-8)}
    </div>
  </div>

</body>
</html>
  `;
}

/**
 * Generates the PDF and presents the native share/save/download dialog
 */
export async function downloadVendorReportPdf(
  data: ReportPdfData,
): Promise<void> {
  try {
    const html = buildVendorReportHtml(data);

    if (Platform.OS === "web") {
      await Print.printAsync({ html });
      return;
    }

    // Generate PDF with base64 to save into scoped directory
    const printResult = await Print.printToFileAsync({
      html,
      base64: true,
    });

    const safeMonth = data.monthLabel.replace(/[^a-zA-Z0-9]/g, "_");
    const fileName = `Bhansamart_Vendor_Report_${safeMonth}.pdf`;
    const targetDir = FileSystem.documentDirectory || FileSystem.cacheDirectory;
    let shareUri = printResult.uri;

    if (targetDir && printResult.base64) {
      const destinationUri = `${targetDir}${fileName}`;
      try {
        await FileSystem.writeAsStringAsync(destinationUri, printResult.base64, {
          encoding: FileSystem.EncodingType.Base64,
        });
        shareUri = destinationUri;
      } catch (writeErr) {
        console.warn("Could not write to scoped directory, using printResult uri:", writeErr);
      }
    }

    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      try {
        await Sharing.shareAsync(shareUri, {
          UTI: ".pdf",
          mimeType: "application/pdf",
          dialogTitle: `Bhansamart Vendor Report - ${data.monthLabel}`,
        });
      } catch (shareErr) {
        console.warn("Sharing failed, opening system print dialog as fallback:", shareErr);
        // Fallback: System print dialog where user can save directly as PDF or print
        await Print.printAsync({ html });
      }
    } else {
      await Print.printAsync({ html });
    }
  } catch (error: any) {
    console.log("PDF error:", error);
    Alert.alert(
      "PDF Generation Failed",
      error?.message || "Could not generate PDF report. Please try again.",
    );
  }
}
