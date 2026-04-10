import { QrCode, Smartphone, Shield, Zap, BarChart3, Users } from "lucide-react";
import ProductPageLayout from "@/components/ProductPageLayout";
import heroImage from "@/assets/hero-upi-mobile.jpg";

const BharatQrPage = () => (
  <ProductPageLayout
    badge="Bharat QR"
    title="Accept Payments via"
    titleHighlight="Bharat QR"
    subtitle="India's interoperable QR code standard. Accept payments from any UPI app, Visa, Mastercard, and RuPay cards."
    heroImage={heroImage}
    features={[
      { icon: QrCode, title: "Interoperable QR", description: "Single QR code accepts UPI, Visa, Mastercard, and RuPay payments." },
      { icon: Smartphone, title: "Any App Works", description: "Customers scan with any UPI app or bank's mobile banking app." },
      { icon: Shield, title: "RBI Approved", description: "Fully compliant with RBI and NPCI Bharat QR specifications." },
      { icon: Zap, title: "Zero MDR on UPI", description: "No merchant discount rate on UPI transactions via Bharat QR." },
      { icon: BarChart3, title: "Transaction Reports", description: "Detailed reports on QR payments with bank-wise breakdown." },
      { icon: Users, title: "Multi-location", description: "Deploy unique QR codes across all your store locations." },
    ]}
  />
);

export default BharatQrPage;