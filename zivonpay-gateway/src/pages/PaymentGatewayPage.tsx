import { motion } from "framer-motion";
import {
  ArrowRight, CreditCard, Shield, Zap, BarChart3, Globe2, Repeat,
  Smartphone, Code2, Lock, RefreshCw, CheckCircle2, Layers, Wallet,
  Clock, TrendingUp, Users, FileCode2, Webhook, BookOpen, ChevronRight,
  Monitor, ShieldCheck, Award, Banknote, QrCode, IndianRupee
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import heroImage from "@/assets/hero-payment-gateway.jpg";
import sectionSecurity from "@/assets/hero-security.jpg";
import sectionAnalytics from "@/assets/hero-analytics.jpg";
import sectionIntegration from "@/assets/section-integration.jpg";

const paymentMethods = [
  { icon: Smartphone, name: "UPI", desc: "Google Pay, PhonePe, Paytm, BHIM & 50+ UPI apps" },
  { icon: CreditCard, name: "Cards", desc: "Visa, Mastercard, RuPay, Amex & Diners Club" },
  { icon: Banknote, name: "Net Banking", desc: "58+ banks including SBI, HDFC, ICICI, Axis & more" },
  { icon: Wallet, name: "Wallets", desc: "Paytm, PhonePe, Amazon Pay, Mobikwik & more" },
  { icon: Clock, name: "EMI", desc: "Credit Card EMI, Debit Card EMI & Cardless EMI" },
  { icon: IndianRupee, name: "BNPL", desc: "Simpl, LazyPay, ZestMoney, FlexiPay & more" },
  { icon: QrCode, name: "QR Codes", desc: "Static & dynamic QR, Bharat QR for offline payments" },
  { icon: Globe2, name: "International", desc: "PayPal, international cards & 20+ currencies" },
];

const coreFeatures = [
  {
    icon: TrendingUp,
    title: "Industry-Best Success Rates",
    description: "Our intelligent payment infrastructure delivers unmatched success rates across all payment methods. AI-powered routing ensures every transaction finds the optimal path to completion."
  },
  {
    icon: Zap,
    title: "Intelligent Payment Routing",
    description: "Smart routing engine automatically selects the best payment processor in real-time based on success rate, cost, and speed. Maximize conversions with zero manual intervention."
  },
  {
    icon: RefreshCw,
    title: "Smart Retry & Recovery",
    description: "Automatically recover failed payments with intelligent retry logic. Our system analyzes failure reasons and retries via alternate routes, recovering up to 15% of otherwise lost transactions."
  },
  {
    icon: Monitor,
    title: "Conversion-Optimized Checkout",
    description: "High-performance checkout designed to minimize friction. Saved card tokens, one-click UPI, address auto-fill, and dynamic payment method ordering based on customer preferences."
  },
  {
    icon: ShieldCheck,
    title: "Enterprise-Grade Security",
    description: "PCI DSS Level 1 certified with continuous monitoring, tokenization, 3D Secure 2.0, device fingerprinting, and advanced encryption to protect every transaction."
  },
  {
    icon: BarChart3,
    title: "All-in-One Dashboard",
    description: "Track payments, refunds, settlements, chargebacks, and analytics from a single intuitive dashboard. Get real-time insights with custom reports and automated alerts."
  },
];

const advancedFeatures = [
  {
    icon: Layers,
    title: "Split Payments",
    description: "Automatically split payments between multiple parties. Ideal for marketplaces, aggregators, and platforms with complex fund flow requirements."
  },
  {
    icon: Repeat,
    title: "Recurring Payments",
    description: "Set up subscriptions and recurring billing with UPI Autopay, e-NACH, and card standing instructions. Automated retry and dunning management included."
  },
  {
    icon: Globe2,
    title: "International Payments",
    description: "Accept payments in 20+ currencies from 100+ countries. Support for international cards, PayPal, and localized payment methods with automatic currency conversion."
  },
  {
    icon: Clock,
    title: "Instant Settlements",
    description: "Get your money in minutes, not days. Choose from T+0 instant, same-day, or next-day settlement options to improve your cash flow."
  },
  {
    icon: Lock,
    title: "Tokenization (Token Hub)",
    description: "RBI-compliant card tokenization for secure stored payments. Improve repeat purchase conversions with one-click checkout for returning customers."
  },
  {
    icon: Award,
    title: "Offer Engine",
    description: "Drive conversions with bank offers, discount coupons, and cashback campaigns. Configure offers by payment method, card type, issuing bank, and more."
  },
];

const integrationOptions = [
  { icon: Code2, title: "RESTful APIs", desc: "Clean, well-documented APIs with SDKs for Java, Python, PHP, Node.js, .NET, Ruby, and Go." },
  { icon: FileCode2, title: "Plugin Integrations", desc: "Ready-to-use plugins for WooCommerce, Shopify, Magento, OpenCart, PrestaShop, and WHMCS." },
  { icon: Webhook, title: "Webhooks", desc: "Real-time event notifications for payments, refunds, settlements, disputes, and more." },
  { icon: BookOpen, title: "Comprehensive Docs", desc: "Step-by-step guides, API reference, sample code, and Postman collections to get started fast." },
];

const stats = [
  { value: "99.99%", label: "Uptime SLA" },
  { value: "100+", label: "Payment Methods" },
  { value: "5L+", label: "Businesses Trust Us" },
  { value: "<2s", label: "Avg. Settlement Time" },
  { value: "20+", label: "Currencies Supported" },
  { value: "₹2L Cr+", label: "Processed Annually" },
];

const useCases = [
  { title: "E-Commerce & D2C", desc: "Seamless checkout for online stores with cart abandonment recovery, saved cards, and one-click payments." },
  { title: "SaaS & Subscriptions", desc: "Recurring billing, usage-based pricing, trial management, and automated dunning for subscription businesses." },
  { title: "Marketplaces", desc: "Split payments, vendor settlements, commission management, and multi-party fund flows." },
  { title: "Education", desc: "Fee collection with EMI options, partial payments, payment reminders, and bulk payment links." },
  { title: "BFSI & Insurance", desc: "Secure payment collection for premiums, loan EMIs, investments, and financial services." },
  { title: "Freelancers & SMBs", desc: "Payment links, invoicing, QR codes, and simple dashboard for small businesses and individuals." },
];

const faqs = [
  {
    q: "What is a payment gateway?",
    a: "A payment gateway is a technology that captures and transfers payment data from the customer to the acquirer and then transfers the payment acceptance or decline back to the customer. It acts as an intermediary between your website/app and the payment networks (Visa, Mastercard, UPI, etc.) to securely process transactions."
  },
  {
    q: "How long does integration take?",
    a: "With our well-documented APIs and ready-to-use SDKs, most businesses can go live within a few hours. Plugin integrations for platforms like Shopify or WooCommerce can be set up in minutes. Our developer support team is available to assist throughout the process."
  },
  {
    q: "What are the charges for ZivonPay Payment Gateway?",
    a: "ZivonPay offers competitive, transparent pricing with no hidden fees. Charges vary by payment method — typically 2% for domestic cards and net banking, and 3% for international transactions. UPI transactions are available at significantly lower rates. Visit our Pricing page for detailed information."
  },
  {
    q: "How does ZivonPay ensure payment security?",
    a: "ZivonPay is PCI DSS Level 1 certified — the highest level of security certification in the payments industry. We use 256-bit SSL encryption, tokenization, 3D Secure authentication, AI-powered fraud detection, and continuous security monitoring to protect every transaction."
  },
  {
    q: "What settlement options are available?",
    a: "We offer flexible settlement options: Standard T+1 (next business day), Same-day T+0 settlements, and Instant settlements where funds are credited to your bank account within minutes. Priority settlement options are available at a nominal additional fee."
  },
  {
    q: "Can I accept international payments?",
    a: "Yes, ZivonPay supports international payments in 20+ currencies from 100+ countries. Accept payments via international Visa, Mastercard, American Express cards, and PayPal. Automatic currency conversion and competitive forex rates are included."
  },
];

const PaymentGatewayPage = () => (
  <div className="min-h-screen bg-background">
    <Navbar />

    {/* Hero Section */}
    <section className="relative overflow-x-hidden pt-24" style={{ background: "var(--gradient-hero)" }}>
      <div className="absolute inset-0 bg-grid-pattern opacity-20" />
      <div className="absolute left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-[120px]" />
      <div className="relative mx-auto max-w-7xl px-6 py-24 lg:py-32">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="text-center lg:text-left">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-glow" />
              Best Payment Gateway in India
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Accept Payments Online with{" "}
              <span className="text-gradient">ZivonPay Payment Gateway</span>
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="mt-6 text-lg text-muted-foreground">
              Power your business with India's most reliable payment gateway. Accept payments via 100+ methods including UPI, cards, net banking, wallets, EMI, and BNPL with industry-best success rates, instant settlements, and 99.99% uptime.
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center lg:justify-start">
              <Button size="lg" className="gap-2 bg-primary px-8 text-primary-foreground hover:bg-primary/90" style={{ boxShadow: "var(--shadow-glow)" }} asChild>
                <Link to="/login">Start Accepting Payments <ArrowRight size={18} /></Link>
              </Button>
              <Button size="lg" variant="outline" className="border-border px-8 text-foreground hover:bg-secondary" asChild>
                <Link to="/developer-guide">View Documentation</Link>
              </Button>
            </motion.div>
          </div>
          <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3, duration: 0.6 }} className="hidden lg:block">
            <div className="overflow-hidden rounded-xl border border-border/30 shadow-2xl" style={{ boxShadow: "var(--shadow-card)" }}>
              <img src={heroImage} alt="ZivonPay Payment Gateway" className="h-auto w-full object-cover" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>

    {/* Stats Bar */}
    <section className="relative border-y border-border/50 bg-card/50">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-6">
          {stats.map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} className="text-center">
              <p className="text-gradient text-2xl font-bold lg:text-3xl" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{stat.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    {/* Payment Methods */}
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center">
          <h2 className="text-3xl font-bold sm:text-4xl" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Accept <span className="text-gradient">Every Payment</span>, Delight Every Customer
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            No matter what payment method your customers prefer, ZivonPay ensures every payment is accepted. Support for 100+ payment methods with the best success rates in the industry.
          </p>
        </motion.div>
        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {paymentMethods.map((method, i) => (
            <motion.div
              key={method.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="group rounded-xl border border-border/50 bg-card p-6 transition-all hover:border-primary/30 hover:shadow-lg"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                <method.icon size={24} />
              </div>
              <h3 className="text-lg font-semibold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{method.name}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{method.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    {/* Core Features — Payments That Just Work */}
    <section className="border-t border-border/50 py-24" style={{ background: "var(--gradient-hero)" }}>
      <div className="mx-auto max-w-7xl px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center">
          <h2 className="text-3xl font-bold sm:text-4xl" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Payments That <span className="text-gradient">Just Work</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Our payment gateway is engineered with features that ensure every transaction goes through effortlessly. Built for performance, optimized for conversions.
          </p>
        </motion.div>
        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {coreFeatures.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="rounded-xl border border-border/50 bg-card p-6 transition-all hover:border-primary/30"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <feature.icon size={24} />
              </div>
              <h3 className="text-lg font-semibold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{feature.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    {/* Security Section — Image + Content */}
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <div className="overflow-hidden rounded-xl border border-border/30" style={{ boxShadow: "var(--shadow-card)" }}>
              <img src={sectionSecurity} alt="ZivonPay Security" className="h-auto w-full object-cover" />
            </div>
          </motion.div>
          <div>
            <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="text-3xl font-bold sm:text-4xl" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Bank-Grade <span className="text-gradient">Security</span>
            </motion.h2>
            <motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
              className="mt-4 text-muted-foreground leading-relaxed">
              Your customers' payment data deserves the highest level of protection. ZivonPay employs multiple layers of security to ensure every transaction is safe and compliant.
            </motion.p>
            <div className="mt-8 space-y-4">
              {[
                "PCI DSS Level 1 Certified — highest security standard",
                "256-bit SSL/TLS encryption for all data in transit",
                "RBI-compliant card tokenization (Token Hub)",
                "3D Secure 2.0 authentication for card payments",
                "AI-powered real-time fraud detection & prevention",
                "Continuous security monitoring & vulnerability scanning",
                "SOC 2 Type II compliant infrastructure",
                "GDPR-ready data handling practices",
              ].map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                  className="flex items-start gap-3">
                  <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-primary" />
                  <span className="text-sm text-muted-foreground">{item}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* Advanced Features */}
    <section className="border-t border-border/50 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center">
          <h2 className="text-3xl font-bold sm:text-4xl" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Advanced <span className="text-gradient">Capabilities</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Go beyond basic payment acceptance. ZivonPay's advanced features help you optimize revenue, reduce costs, and scale your payment operations.
          </p>
        </motion.div>
        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {advancedFeatures.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="flex gap-4 rounded-xl border border-border/50 bg-card p-5 transition-all hover:border-primary/30"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <div className="shrink-0 inline-flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <feature.icon size={22} />
              </div>
              <div>
                <h3 className="font-semibold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    {/* Developer Integration Section */}
    <section className="border-t border-border/50 py-24" style={{ background: "var(--gradient-hero)" }}>
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="text-3xl font-bold sm:text-4xl" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Ready-to-Launch <span className="text-gradient">Integration Stack</span>
            </motion.h2>
            <motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
              className="mt-4 text-muted-foreground leading-relaxed">
              Developer-friendly APIs and comprehensive SDKs that let you integrate payments effortlessly. Go live in hours, not weeks.
            </motion.p>
            <div className="mt-8 space-y-4">
              {integrationOptions.map((opt, i) => (
                <motion.div key={opt.title} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                  className="flex gap-4 rounded-lg border border-border/50 bg-card p-4 transition-all hover:border-primary/30">
                  <div className="shrink-0 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <opt.icon size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{opt.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{opt.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            {/* Code snippet mockup */}
            <div className="overflow-hidden rounded-xl border border-border/50 bg-card" style={{ boxShadow: "var(--shadow-card)" }}>
              <div className="flex items-center gap-2 border-b border-border/50 px-4 py-3">
                <div className="h-3 w-3 rounded-full bg-destructive/60" />
                <div className="h-3 w-3 rounded-full bg-primary/60" />
                <div className="h-3 w-3 rounded-full bg-primary/40" />
                <span className="ml-2 text-xs text-muted-foreground">create-order.js</span>
              </div>
              <pre className="p-5 text-sm leading-relaxed overflow-x-auto">
                <code className="text-muted-foreground">
{`const zivonpay = require('zivonpay');

const instance = new zivonpay({
  key_id: 'YOUR_KEY_ID',
  key_secret: 'YOUR_KEY_SECRET',
});

const order = await instance.orders.create({
  amount: 50000, // ₹500.00
  currency: 'INR',
  receipt: 'order_rcpt_001',
  payment_capture: true,
  notes: {
    customer_name: 'John Doe',
    product: 'Premium Plan'
  }
});

console.log(order.id);
// => order_ZvP1234567890`}
                </code>
              </pre>
            </div>
          </motion.div>
        </div>
      </div>
    </section>

    {/* Use Cases / Industries */}
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center">
          <h2 className="text-3xl font-bold sm:text-4xl" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Built for <span className="text-gradient">Every Business</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            From startups to enterprises, ZivonPay powers payments for businesses across industries.
          </p>
        </motion.div>
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {useCases.map((uc, i) => (
            <motion.div
              key={uc.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="rounded-xl border border-border/50 bg-card p-6 transition-all hover:border-primary/30"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <h3 className="text-lg font-semibold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{uc.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{uc.desc}</p>
              <button className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                Learn more <ChevronRight size={14} />
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    {/* Dashboard / Analytics Image Section */}
    <section className="border-t border-border/50 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="order-2 lg:order-1">
            <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="text-3xl font-bold sm:text-4xl" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Powerful <span className="text-gradient">Analytics &amp; Reporting</span>
            </motion.h2>
            <motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
              className="mt-4 text-muted-foreground leading-relaxed">
              Make data-driven decisions with comprehensive real-time analytics. Monitor everything from transaction success rates to customer payment preferences.
            </motion.p>
            <div className="mt-8 space-y-4">
              {[
                "Real-time transaction monitoring & alerts",
                "Custom reports with advanced filters & export options",
                "Payment method performance analytics",
                "Settlement tracking & reconciliation tools",
                "Chargeback & dispute management dashboard",
                "Revenue analytics with trend analysis",
              ].map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                  className="flex items-start gap-3">
                  <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-primary" />
                  <span className="text-sm text-muted-foreground">{item}</span>
                </motion.div>
              ))}
            </div>
          </div>
          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }} className="order-1 lg:order-2">
            <div className="overflow-hidden rounded-xl border border-border/30" style={{ boxShadow: "var(--shadow-card)" }}>
              <img src={sectionAnalytics} alt="ZivonPay Analytics Dashboard" className="h-auto w-full object-cover" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>

    {/* FAQs */}
    <section className="border-t border-border/50 py-24" style={{ background: "var(--gradient-hero)" }}>
      <div className="mx-auto max-w-4xl px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center">
          <h2 className="text-3xl font-bold sm:text-4xl" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Frequently Asked <span className="text-gradient">Questions</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Everything you need to know about ZivonPay Payment Gateway.
          </p>
        </motion.div>
        <div className="mt-12 space-y-4">
          {faqs.map((faq, i) => (
            <motion.details
              key={i}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="group rounded-xl border border-border/50 bg-card transition-all hover:border-primary/30 [&[open]]:border-primary/30"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <summary className="cursor-pointer px-6 py-5 text-foreground font-medium list-none flex items-center justify-between" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {faq.q}
                <ChevronRight size={18} className="shrink-0 text-muted-foreground transition-transform group-open:rotate-90" />
              </summary>
              <div className="px-6 pb-5 text-sm leading-relaxed text-muted-foreground">
                {faq.a}
              </div>
            </motion.details>
          ))}
        </div>
      </div>
    </section>

    {/* Final CTA */}
    <section className="border-t border-border/50 py-24">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="text-3xl font-bold sm:text-4xl" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Ready to grow with <span className="text-gradient">ZivonPay</span>?
        </motion.h2>
        <motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
          className="mt-4 text-muted-foreground">
          Join 5,00,000+ businesses already using ZivonPay to accept payments, boost conversions, and grow their revenue. Get started in minutes.
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
          className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Button size="lg" className="gap-2 bg-primary px-8 text-primary-foreground hover:bg-primary/90" style={{ boxShadow: "var(--shadow-glow)" }} asChild>
            <Link to="/login">Start Accepting Payments <ArrowRight size={18} /></Link>
          </Button>
          <Button size="lg" variant="outline" className="border-border px-8 text-foreground hover:bg-secondary" asChild>
            <Link to="/contact-sales">Contact Sales</Link>
          </Button>
        </motion.div>
      </div>
    </section>

    <Footer />
  </div>
);

export default PaymentGatewayPage;
