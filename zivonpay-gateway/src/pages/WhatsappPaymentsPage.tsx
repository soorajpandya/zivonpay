import { MessageCircle, Smartphone, Shield, Zap, Users, BarChart3 } from "lucide-react";
import ProductPageLayout from "@/components/ProductPageLayout";
import heroImage from "@/assets/hero-upi-mobile.jpg";

const WhatsappPaymentsPage = () => (
  <ProductPageLayout
    badge="WhatsApp Payments"
    title="Collect Payments on"
    titleHighlight="WhatsApp"
    subtitle="Enable seamless payments within WhatsApp conversations. Let customers pay where they already chat."
    heroImage={heroImage}
    features={[
      { icon: MessageCircle, title: "In-Chat Payments", description: "Send payment links directly in WhatsApp conversations for instant collection." },
      { icon: Smartphone, title: "One-Tap Checkout", description: "Customers complete payment with a single tap, no app switching needed." },
      { icon: Shield, title: "Secure & Compliant", description: "End-to-end encrypted payments meeting all regulatory requirements." },
      { icon: Zap, title: "Instant Notifications", description: "Real-time payment confirmations for both merchant and customer." },
      { icon: Users, title: "Broadcast Payments", description: "Send payment requests to multiple customers at once via WhatsApp." },
      { icon: BarChart3, title: "Conversation Analytics", description: "Track payment conversions from WhatsApp interactions." },
    ]}
  />
);

export default WhatsappPaymentsPage;