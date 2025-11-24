export default function Contact() {
  return (
    <div style={{ padding: "20px", color: "white" }}>
      <h1>Contact Us</h1>
      <p>Phone: {import.meta.env.VITE_WHATSAPP_NUMBER}</p>
      <p>Email: support@thaayarkitchen.com</p>
    </div>
  );
}
