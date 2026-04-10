import { QrCode, Smartphone, Shield, Zap, BarChart3, Users } from "lucide-react";
import ProductPageLayout from "@/components/ProductPageLayout";
import heroImage from "@/assets/hero-upi-mobile.jpg";
import sectionImg from "@/assets/hero-payment-gateway.jpg";

const QrCodesPage = () => (
  <ProductPageLayout
    badge="QR Code Payments"
    title="Accept Payments via"
    titleHighlight="QR Codes"
    subtitle="Generate static and dynamic QR codes for UPI payments. Perfect for offline stores, events, and invoicing."
    heroImage={heroImage}
    sectionImages={[sectionImg]}
    features={[
      { icon: QrCode, title: "Dynamic QR Codes", description: "Generate unique QR codes for each transaction with amount pre-filled." },
      { icon: Smartphone, title: "UPI Compatible", description: "Works with all UPI apps — Google Pay, PhonePe, Paytm, and more." },
      { icon: Shield, title: "Verified Payments", description: "Real-time payment verification and confirmation notifications." },
      { icon: Zap, title: "Instant Setup", description: "Start accepting QR payments in minutes with zero hardware." },
      { icon: BarChart3, title: "QR Analytics", description: "Track scan rates, payment conversions, and revenue per QR." },
      { icon: Users, title: "Bulk Generation", description: "Generate thousands of QR codes at once for large-scale deployment." },
    ]}
  />
);

export default QrCodesPage;