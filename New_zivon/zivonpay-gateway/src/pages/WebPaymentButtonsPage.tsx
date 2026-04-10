import { MousePointer, CreditCard, Shield, Zap, BarChart3, Users } from "lucide-react";
import ProductPageLayout from "@/components/ProductPageLayout";
import heroImage from "@/assets/hero-payment-gateway.jpg";

const WebPaymentButtonsPage = () => (
  <ProductPageLayout
    badge="Payment Buttons"
    title="Add Pay Buttons to"
    titleHighlight="Any Website"
    subtitle="Embed customizable payment buttons on your website. No coding required — just copy-paste the HTML snippet."
    heroImage={heroImage}
    features={[
      { icon: MousePointer, title: "One-click Setup", description: "Generate a payment button and embed it with a simple HTML snippet." },
      { icon: CreditCard, title: "All Payment Modes", description: "Customers can pay via UPI, cards, net banking, and wallets." },
      { icon: Shield, title: "Secure Checkout", description: "PCI-compliant checkout experience hosted by ZivonPay." },
      { icon: Zap, title: "Customizable", description: "Match button style, color, and text to your brand identity." },
      { icon: BarChart3, title: "Track Payments", description: "Monitor all button payments from your ZivonPay dashboard." },
      { icon: Users, title: "No Coding Needed", description: "Perfect for small businesses, freelancers, and bloggers." },
    ]}
  />
);

export default WebPaymentButtonsPage;