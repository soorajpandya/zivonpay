import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import { AuthProvider } from "@/context/AuthContext";
import { Landmark, FileText, LinkIcon, Layout as LayoutIcon, ExternalLink, Smartphone, Receipt, CreditCard, QrCode, Repeat, Users, Tag, Code } from "lucide-react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";


const DashboardStubRoute = ({ page, title }: { page: string; title: string }) => {
  const iconMap: Record<string, any> = {
    settlements: Landmark, reports: FileText, "payment-links": LinkIcon,
    "payment-pages": LayoutIcon, "zivonpay-me": ExternalLink, pos: Smartphone,
    invoices: Receipt, "payment-button": CreditCard, "qr-codes": QrCode,
    subscriptions: Repeat, customers: Users, offers: Tag, developers: Code,
  };
  const Icon = iconMap[page] || FileText;
  return <DashboardStubPage title={title} subtitle={`Manage your ${title.toLowerCase()}`} icon={Icon} />;
};

// Product pages
const PaymentGatewayPage = lazy(() => import("./pages/PaymentGatewayPage"));
const RecurringPaymentsPage = lazy(() => import("./pages/RecurringPaymentsPage"));
const NativeOtpPage = lazy(() => import("./pages/NativeOtpPage"));
const InternationalPaymentsPage = lazy(() => import("./pages/InternationalPaymentsPage"));
const WhatsappPaymentsPage = lazy(() => import("./pages/WhatsappPaymentsPage"));
const PrioritySettlementsPage = lazy(() => import("./pages/PrioritySettlementsPage"));
const InstantRefundsPage = lazy(() => import("./pages/InstantRefundsPage"));
const SplitSettlementsPage = lazy(() => import("./pages/SplitSettlementsPage"));
const TokenHubPage = lazy(() => import("./pages/TokenHubPage"));
const EmiPage = lazy(() => import("./pages/EmiPage"));
const BuyNowPayLaterPage = lazy(() => import("./pages/BuyNowPayLaterPage"));
const OfferEnginePage = lazy(() => import("./pages/OfferEnginePage"));
const LoyaltyEdgePage = lazy(() => import("./pages/LoyaltyEdgePage"));
const AffordabilityWidgetPage = lazy(() => import("./pages/AffordabilityWidgetPage"));
const WebPaymentLinksPage = lazy(() => import("./pages/WebPaymentLinksPage"));
const WebPaymentButtonsPage = lazy(() => import("./pages/WebPaymentButtonsPage"));
const ZivonpayConnectPage = lazy(() => import("./pages/ZivonpayConnectPage"));
const QrCodesPage = lazy(() => import("./pages/QrCodesPage"));
const PosDevicePage = lazy(() => import("./pages/PosDevicePage"));
const TransactPage = lazy(() => import("./pages/TransactPage"));
const AccountingAutomationPage = lazy(() => import("./pages/AccountingAutomationPage"));
const UpiPaymentGatewayPage = lazy(() => import("./pages/UpiPaymentGatewayPage"));
const PayoutsPage = lazy(() => import("./pages/PayoutsPage"));
const AiPage = lazy(() => import("./pages/AiPage"));

// Solution pages
const PaymentWebsitePage = lazy(() => import("./pages/PaymentWebsitePage"));
const ExcelPaymentPluginPage = lazy(() => import("./pages/ExcelPaymentPluginPage"));
const BharatQrPage = lazy(() => import("./pages/BharatQrPage"));

// Dashboard (eager imports for instant sidebar navigation)
import DashboardLayout from "./pages/dashboard/DashboardLayout";
import DashboardHome from "./pages/dashboard/DashboardHome";
import DashboardTransactions from "./pages/dashboard/DashboardTransactions";
import DashboardPayouts from "./pages/dashboard/DashboardPayouts";
import DashboardAccountSettings from "./pages/dashboard/DashboardAccountSettings";
import DashboardQRCodes from "./pages/dashboard/DashboardQRCodes";
import DashboardPaymentLinks from "./pages/dashboard/DashboardPaymentLinks";
import DashboardReports from "./pages/dashboard/DashboardReports";
import DashboardSettlements from "./pages/dashboard/DashboardSettlements";
import DashboardStubPage from "./pages/dashboard/DashboardStubPage";

// Main pages
const LoginPage = lazy(() => import("./pages/LoginPage"));
const PricingPage = lazy(() => import("./pages/PricingPage"));
const BlogPage = lazy(() => import("./pages/BlogPage"));
const DeveloperGuidePage = lazy(() => import("./pages/DeveloperGuidePage"));
const AboutUsPage = lazy(() => import("./pages/AboutUsPage"));
const ContactSalesPage = lazy(() => import("./pages/ContactSalesPage"));

// Policy/Legal pages
const ZivonpayPoliciesPage = lazy(() => import("./pages/ZivonpayPoliciesPage"));
const PrivacyPolicyPage = lazy(() => import("./pages/PrivacyPolicyPage"));
const CyberSecurityPage = lazy(() => import("./pages/CyberSecurityPage"));
const OnlinePaTncsPage = lazy(() => import("./pages/OnlinePaTncsPage"));
const BannedCategoryPage = lazy(() => import("./pages/BannedCategoryPage"));
const ResponsibleDisclosurePage = lazy(() => import("./pages/ResponsibleDisclosurePage"));
const DigitalLendingPartnersPage = lazy(() => import("./pages/DigitalLendingPartnersPage"));
const SplitpayServicesTncsPage = lazy(() => import("./pages/SplitpayServicesTncsPage"));

const queryClient = new QueryClient();

const Loading = () => (
  <div className="flex min-h-screen items-center justify-center bg-background">
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<Index />} />
            
            {/* Product pages */}
            <Route path="/payment-gateway" element={<PaymentGatewayPage />} />
            <Route path="/recurring-payments-suite" element={<RecurringPaymentsPage />} />
            <Route path="/native-otp" element={<NativeOtpPage />} />
            <Route path="/international-payments" element={<InternationalPaymentsPage />} />
            <Route path="/whatsapp-payments-zivonpay" element={<WhatsappPaymentsPage />} />
            <Route path="/priority-settlements" element={<PrioritySettlementsPage />} />
            <Route path="/instant-refunds" element={<InstantRefundsPage />} />
            <Route path="/split-settlements" element={<SplitSettlementsPage />} />
            <Route path="/token-hub" element={<TokenHubPage />} />
            <Route path="/emi" element={<EmiPage />} />
            <Route path="/buy-now-pay-later" element={<BuyNowPayLaterPage />} />
            <Route path="/offer-engine" element={<OfferEnginePage />} />
            <Route path="/loyalty-edge" element={<LoyaltyEdgePage />} />
            <Route path="/affordability-widget" element={<AffordabilityWidgetPage />} />
            <Route path="/web-payment-links" element={<WebPaymentLinksPage />} />
            <Route path="/web-payment-buttons" element={<WebPaymentButtonsPage />} />
            <Route path="/zivonpay-connect" element={<ZivonpayConnectPage />} />
            <Route path="/qr-codes" element={<QrCodesPage />} />
            <Route path="/pos-device" element={<PosDevicePage />} />
            <Route path="/transact" element={<TransactPage />} />
            <Route path="/accounting-automation" element={<AccountingAutomationPage />} />
            <Route path="/upi-payment-gateway" element={<UpiPaymentGatewayPage />} />
            <Route path="/payouts" element={<PayoutsPage />} />
            <Route path="/ai" element={<AiPage />} />

            {/* Solution pages */}
            <Route path="/payment-solutions/payment-website" element={<PaymentWebsitePage />} />
            <Route path="/payment-solutions/excel-payment-plugin" element={<ExcelPaymentPluginPage />} />
            <Route path="/payment-solutions/bharat-qr" element={<BharatQrPage />} />

            {/* Dashboard */}
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<DashboardHome />} />
              <Route path="transactions" element={<DashboardTransactions />} />
              <Route path="settlements" element={<DashboardSettlements />} />
              <Route path="payouts" element={<DashboardPayouts />} />
              <Route path="reports" element={<DashboardReports />} />
              <Route path="payment-links" element={<DashboardPaymentLinks />} />
              <Route path="payment-pages" element={<DashboardStubRoute page="payment-pages" title="Payment Pages" />} />
              <Route path="zivonpay-me" element={<DashboardStubRoute page="zivonpay-me" title="ZivonPay.me Link" />} />
              <Route path="pos" element={<DashboardStubRoute page="pos" title="POS" />} />
              <Route path="invoices" element={<DashboardStubRoute page="invoices" title="Invoices" />} />
              <Route path="payment-button" element={<DashboardStubRoute page="payment-button" title="Payment Button" />} />
              <Route path="qr-codes" element={<DashboardQRCodes />} />
              <Route path="subscriptions" element={<DashboardStubRoute page="subscriptions" title="Subscriptions" />} />
              <Route path="customers" element={<DashboardStubRoute page="customers" title="Customers" />} />
              <Route path="offers" element={<DashboardStubRoute page="offers" title="Offers" />} />
              <Route path="developers" element={<DashboardStubRoute page="developers" title="Developers" />} />
              <Route path="account-settings" element={<DashboardAccountSettings />} />
            </Route>

            {/* Main pages */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/developer-guide" element={<DeveloperGuidePage />} />
            <Route path="/about-us" element={<AboutUsPage />} />
            <Route path="/contact-sales" element={<ContactSalesPage />} />

            {/* Policy/Legal pages */}
            <Route path="/zivonpay-policies" element={<ZivonpayPoliciesPage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
            <Route path="/cyber-security" element={<CyberSecurityPage />} />
            <Route path="/online-pa-tncs" element={<OnlinePaTncsPage />} />
            <Route path="/BannedRestrictedCategorylist" element={<BannedCategoryPage />} />
            <Route path="/responsible-disclosure-policy" element={<ResponsibleDisclosurePage />} />
            <Route path="/digital-lending-partners" element={<DigitalLendingPartnersPage />} />
            <Route path="/splitpay-services-tncs" element={<SplitpayServicesTncsPage />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;