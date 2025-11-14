// api/verify-payment.js
import crypto from "crypto";
import { google } from "googleapis";

async function appendOrderToSheet(rowArray) {
  const key = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
  const jwtClient = new google.auth.JWT(
    key.client_email,
    null,
    key.private_key,
    ["https://www.googleapis.com/auth/spreadsheets"]
  );

  await jwtClient.authorize();

  const sheets = google.sheets({ version: "v4", auth: jwtClient });
  const sheetId = process.env.SHEET_ID;

  // Append to 'orders' sheet
  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: "orders!A1", // orders sheet
    valueInputOption: "RAW",
    requestBody: {
      values: [rowArray],
    },
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({error:"method_not_allowed"});
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderData } = req.body;
  // orderData: {orderId, customerName, customerPhone, items, totalAmount}

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: "missing_params" });
  }

  const generatedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (generatedSignature !== razorpay_signature) {
    return res.status(400).json({ verified: false, message: "invalid_signature" });
  }

  // Verified -> save order into Google Sheet
  try {
    const row = [
      orderData.orderId,
      new Date().toISOString(),
      orderData.customerName || "",
      orderData.customerPhone || "",
      JSON.stringify(orderData.items || []),
      orderData.totalAmount || 0,
      razorpay_order_id,
      razorpay_payment_id,
      "PAID",
    ];
    await appendOrderToSheet(row);
    return res.status(200).json({ verified: true });
  } catch (err) {
    console.error("Append sheet err:", err);
    return res.status(500).json({ verified: true, saved:false, error: err.message });
  }
}
