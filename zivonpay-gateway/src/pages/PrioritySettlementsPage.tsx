import { Clock, Zap, Shield, BarChart3, Building2, CreditCard } from "lucide-react";
import ProductPageLayout from "@/components/ProductPageLayout";
import heroImage from "@/assets/hero-settlements.jpg";

const PrioritySettlementsPage = () => (
  <ProductPageLayout
    badge="Priority Settlements"
    title="Get Your Money"
    titleHighlight="Faster"
    subtitle="Don't wait for T+2 settlement cycles. Get your funds settled within minutes with ZivonPay Priority Settlements."
    heroImage={heroImage}
    features={[
      { icon: Clock, title: "Same-Day Settlement", description: "Receive your payment proceeds on the same day of the transaction." },
      { icon: Zap, title: "Instant Settlements", description: "Get funds in your bank account within minutes of successful payment." },
      { icon: Shield, title: "Reliable & Secure", description: "Bank-grade security with guaranteed settlement timelines." },
      { icon: BarChart3, title: "Settlement Dashboard", description: "Track all settlements in real-time with detailed breakdown reports." },
      { icon: Building2, title: "Multi-bank Support", description: "Settle to any bank account across major Indian banks." },
      { icon: CreditCard, title: "All Payment Modes", description: "Priority settlement available for UPI, cards, net banking and more." },
    ]}
  />
);

export default PrioritySettlementsPage;