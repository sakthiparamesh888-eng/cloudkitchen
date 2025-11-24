export default function Refund() {
  return (
    <div style={{ padding: "20px" }}>
      <h1>Cancellation & Refund Policy</h1>
      <p>Orders once placed cannot be cancelled after confirmation. Refunds will only be provided if payment was deducted but the order was not processed.</p>
      <p>If you face any issue, contact us at:</p>
      <p>Email: support@thaayarkitchen.com</p>
      <p>Phone: {import.meta.env.VITE_WHATSAPP_NUMBER}</p>
    </div>
  );
}
