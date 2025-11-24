export default function Refund() {
  return (
    <div style={{ padding: "20px", color: "white" }}>
      <h1>Cancellation & Refund Policy</h1>
      <p>Orders once confirmed cannot be cancelled. Refunds are only provided if a payment was deducted but the order was not processed.</p>
      <p>If you face any issue, contact us at:</p>
      <p>Phone: {import.meta.env.VITE_WHATSAPP_NUMBER}</p>
    </div>
  );
}
