import { Zap, Building2, Shield, BarChart3, Clock, Users } from "lucide-react";
import ProductPageLayout from "@/components/ProductPageLayout";
import heroImage from "@/assets/hero-settlements.jpg";
import sectionImg from "@/assets/hero-analytics.jpg";

const PayoutsPage = () => (
  <ProductPageLayout
    badge="Payouts"
    title="Send Money"
    titleHighlight="Instantly"
    subtitle="Disburse payments to vendors, partners, and customers instantly via IMPS, NEFT, UPI, and bank transfer."
    heroImage={heroImage}
    sectionImages={[sectionImg]}
    features={[
      { icon: Zap, title: "Instant Payouts", description: "Send money instantly via IMPS, UPI, and NEFT to any bank account." },
      { icon: Building2, title: "Bulk Disbursement", description: "Process thousands of payouts at once with CSV upload or API." },
      { icon: Shield, title: "Bank Verification", description: "Auto-verify beneficiary bank accounts before disbursement." },
      { icon: BarChart3, title: "Payout Dashboard", description: "Track all disbursements with real-time status and reporting." },
      { icon: Clock, title: "Scheduled Payouts", description: "Schedule payouts for future dates with automated processing." },
      { icon: Users, title: "Multi-mode", description: "Pay via IMPS, NEFT, RTGS, UPI, and Amazon Pay." },
    ]}
  />
);

export default PayoutsPage;