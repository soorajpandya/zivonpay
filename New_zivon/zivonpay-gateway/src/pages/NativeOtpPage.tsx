import { Smartphone, Shield, Zap, Clock, Users, Lock } from "lucide-react";
import ProductPageLayout from "@/components/ProductPageLayout";
import heroImage from "@/assets/hero-upi-mobile.jpg";

const NativeOtpPage = () => (
  <ProductPageLayout
    badge="Native OTP"
    title="Seamless OTP with"
    titleHighlight="Native Experience"
    subtitle="Reduce drop-offs with native OTP auto-read functionality. Customers complete payment without leaving your app."
    heroImage={heroImage}
    features={[
      { icon: Smartphone, title: "Auto-Read OTP", description: "Automatically reads OTP from SMS, eliminating manual entry for customers." },
      { icon: Zap, title: "Faster Checkout", description: "Reduce payment completion time by up to 40% with native OTP flow." },
      { icon: Shield, title: "Bank-Grade Security", description: "Fully compliant with RBI guidelines and PCI DSS standards." },
      { icon: Clock, title: "Reduced Drop-offs", description: "Minimize cart abandonment caused by OTP-related friction." },
      { icon: Users, title: "Better UX", description: "Customers stay in your app throughout the payment journey." },
      { icon: Lock, title: "Encrypted Transit", description: "End-to-end encryption ensures OTP security during transmission." },
    ]}
  />
);

export default NativeOtpPage;