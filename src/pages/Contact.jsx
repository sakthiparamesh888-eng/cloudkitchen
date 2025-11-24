export default function Contact() {
  return (
    <div style={{ padding: "20px" }}>
      <h1>Contact Us</h1>
      <p>If you need help, you can reach us through WhatsApp or phone.</p>
      <p>Phone: {import.meta.env.VITE_WHATSAPP_NUMBER}</p>
      <p>Email: support@thaayarkitchen.com</p>
    </div>
  );
}
