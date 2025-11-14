// api/create-order.js
import Razorpay from "razorpay";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  const { amount } = req.body; // amount in paise (e.g., 20000 = ₹200)
  if (!amount) return res.status(400).json({ error: "amount_required" });

  const rzp = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });

  try {
    const options = {
      amount: Number(amount),
      currency: "INR",
      receipt: `rcpt_${Date.now()}`,
      payment_capture: 1,
    };
    const order = await rzp.orders.create(options);
    return res.status(200).json({ order, key: process.env.RAZORPAY_KEY_ID });
  } catch (err) {
    console.error("rzp create err", err);
    return res.status(500).json({ error: "rzp_create_failed", details: err.message });
  }
}
