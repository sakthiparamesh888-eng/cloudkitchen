export default function Contact() {
  return (
    <div style={{ padding: "20px" }}>
      <h1>Contact Us</h1>
      <p>You can contact us via WhatsApp or phone.</p>
      <p>Phone: {import.meta.env.VITE_WHATSAPP_NUMBER}</p>
    </div>
  );
}
