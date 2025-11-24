export default function Refund() {
  return (
    <div style={{ padding: "20px" }}>
      <h1>Refund Policy</h1>
      <p>We do not provide refunds once an order is placed. If there is any issue, please contact our support team.</p>
      <p>Email: support@thaayarkitchen.com</p>
      <p>Phone: {import.meta.env.VITE_WHATSAPP_NUMBER}</p>
    </div>
  );
}
