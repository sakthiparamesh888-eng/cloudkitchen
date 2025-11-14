import { google } from "googleapis";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Only POST allowed" });
    }

    const { cart, paymentId } = req.body;

    if (!cart || cart.length === 0) {
      return res.status(400).json({ error: "Cart empty" });
    }

    // -----------------------------------------------------------------------------
    // 1️⃣ Authenticate Google Sheets
    // -----------------------------------------------------------------------------

    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY),
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });

    const sheets = google.sheets({ version: "v4", auth });

    const sheetId = process.env.SHEET_ID;

    // -----------------------------------------------------------------------------
    // 2️⃣ Prepare order data for sheet (flatten cart)
    // -----------------------------------------------------------------------------

    const total = cart.reduce((n, i) => n + Number(i.price || 0), 0);

    const items = cart
      .map((i) => `${i.name} - ₹${i.price}`)
      .join("\n");

    const row = [
      new Date().toLocaleString("en-IN"), // timestamp
      paymentId,
      items,
      total,
      "PAID"
    ];

    // -----------------------------------------------------------------------------
    // 3️⃣ Append order to Google Sheet (Orders sheet)
    // -----------------------------------------------------------------------------

    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: "Orders!A1",
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [row] },
    });

    // -----------------------------------------------------------------------------
    // 4️⃣ Create WhatsApp redirect message
    // -----------------------------------------------------------------------------

    const store = process.env.STORE_NAME || "Sakthi Kitchen";
    const number = process.env.WHATSAPP_NUMBER;

    const message = `
Hello, I placed a new order from *${store}*.

🧾 *Payment ID:* ${paymentId}
💰 *Total:* ₹${total}

🍽️ *Items:*
${items}

Please confirm my order.
    `.trim();

    const url = `https://wa.me/${number}?text=${encodeURIComponent(message)}`;

    // -----------------------------------------------------------------------------
    // 5️⃣ Return WhatsApp URL to frontend
    // -----------------------------------------------------------------------------

    return res.json({
      success: true,
      whatsappUrl: url,
    });

  } catch (err) {
    console.error("SAVE ORDER ERROR:", err);
    return res.status(500).json({
      success: false,
      error: "Saving order failed",
      details: err.message,
    });
  }
}
