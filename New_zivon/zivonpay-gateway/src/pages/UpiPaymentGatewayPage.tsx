import { useState } from "react";
import { motion } from "framer-motion";
import {
  Smartphone, Shield, Zap, BarChart3, Users, CreditCard, ArrowRight,
  CheckCircle2, Building2, ShoppingCart, GraduationCap, Heart, Wifi,
  Clock, Globe, QrCode, RefreshCw, Lock, TrendingUp, Layers, Code,
  ChevronDown, ChevronUp, FileText, Repeat, Send, Eye, Banknote,
  Landmark, Activity, BadgeCheck, Target, Cpu, IndianRupee
} from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-upi-mobile.jpg";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } }),
};

const stats = [
  { value: "99.9%", label: "UPI Success Rate" },
  { value: "50+", label: "UPI Apps Supported" },
  { value: "<2s", label: "Avg. Transaction Time" },
  { value: "₹0", label: "Setup Cost" },
];

const upiModes = [
  {
    icon: Smartphone,
    title: "UPI Intent",
    description: "Automatically redirect customers to their preferred UPI app (GPay, PhonePe, Paytm, BHIM) for one-tap payment. No manual VPA entry — highest conversion rates on mobile.",
    highlights: ["Auto app detection", "One-tap payment", "Best for mobile web & in-app"],
  },
  {
    icon: Send,
    title: "UPI Collect",
    description: "Send a payment request directly to the customer's UPI ID (VPA). The customer approves the request in their UPI app. Ideal for desktop and invoice payments.",
    highlights: ["VPA-based collection", "Works on desktop", "Push notification to customer"],
  },
  {
    icon: QrCode,
    title: "UPI QR Code",
    description: "Generate dynamic QR codes for each transaction. Customers scan using any UPI app to pay instantly. Perfect for omnichannel — online, in-store, and events.",
    highlights: ["Dynamic per-transaction QR", "Bharat QR compatible", "Online + offline"],
  },
  {
    icon: Repeat,
    title: "UPI AutoPay (Mandates)",
    description: "Set up RBI-compliant recurring UPI mandates for subscriptions, EMIs, SIPs, and utility bills. One-time authorization, automatic future debits up to ₹1 lakh.",
    highlights: ["RBI e-mandate compliant", "Up to ₹1,00,000 limit", "Auto-debit on schedule"],
  },
  {
    icon: FileText,
    title: "UPI Payment Links",
    description: "Create and share payment links via SMS, WhatsApp, email, or social media. Customers click and pay using any UPI app — no integration needed.",
    highlights: ["Share anywhere", "No coding required", "Track in real-time"],
  },
  {
    icon: Globe,
    title: "UPI for International",
    description: "Accept payments from NRIs and international users linked to Indian bank accounts via UPI. Expanding cross-border UPI with Singapore, UAE, and more.",
    highlights: ["NRI payments", "Cross-border UPI", "Multi-currency settlement"],
  },
];

const features = [
  { icon: Zap, title: "Instant Settlement", desc: "Get UPI payments settled to your bank account within minutes with our instant settlement feature. No more waiting for T+1 or T+2 cycles." },
  { icon: TrendingUp, title: "Intelligent Routing", desc: "AI-powered smart routing across multiple UPI PSPs (NPCI, HDFC, Axis, ICICI) to maximize success rates and minimize downtime." },
  { icon: RefreshCw, title: "Smart Retry", desc: "Automatic retry on failed UPI transactions with alternate PSP routing. Recover up to 15% of failed payments without customer intervention." },
  { icon: Lock, title: "End-to-End Encryption", desc: "256-bit SSL encryption, PCI DSS Level 1 compliance, and tokenized UPI credentials. Every transaction is secured with bank-grade security." },
  { icon: BarChart3, title: "Real-Time Analytics", desc: "Track UPI transactions by app, bank, amount, success rate, and more. Get live dashboards, hourly trends, and automated reports." },
  { icon: Activity, title: "99.99% Uptime", desc: "Enterprise-grade infrastructure with multi-region redundancy. Our UPI gateway handles millions of transactions daily with near-zero downtime." },
  { icon: BadgeCheck, title: "Fraud Detection", desc: "AI-powered fraud detection engine that monitors UPI transaction patterns, flags suspicious activity, and blocks fraudulent payments in real-time." },
  { icon: Cpu, title: "Webhooks & Callbacks", desc: "Real-time payment status webhooks with retry logic. Get instant server-to-server notifications for every UPI payment event." },
];

const howItWorks = [
  { step: "1", title: "Customer Initiates Payment", desc: "Customer selects UPI as payment method on your checkout page and chooses their preferred UPI app or enters VPA." },
  { step: "2", title: "Payment Request Created", desc: "ZivonPay creates a secure UPI payment request via NPCI's UPI infrastructure and routes it through the optimal PSP." },
  { step: "3", title: "Customer Authorizes", desc: "Customer receives a notification in their UPI app, verifies the amount and merchant, and authorizes with their UPI PIN." },
  { step: "4", title: "Instant Confirmation", desc: "Payment is confirmed in under 2 seconds. ZivonPay sends real-time webhook to your server and updates the dashboard." },
];

const useCases = [
  { icon: ShoppingCart, title: "E-Commerce", desc: "Accept UPI payments on your online store with intent flow for mobile and QR for desktop. Reduce cart abandonment by 30%." },
  { icon: Building2, title: "SaaS & Subscriptions", desc: "Use UPI AutoPay for recurring billing. Automated mandate creation, smart dunning, and seamless plan upgrades." },
  { icon: GraduationCap, title: "EdTech", desc: "Collect course fees, EMIs, and subscription payments via UPI. Send payment links to students via WhatsApp." },
  { icon: Heart, title: "Healthcare", desc: "Enable UPI payments for consultations, lab tests, pharmacy orders, and insurance premiums with instant confirmation." },
  { icon: Banknote, title: "Insurance & BFSI", desc: "Collect premiums, SIP payments, and loan EMIs via UPI AutoPay mandates. RBI-compliant with full audit trail." },
  { icon: Landmark, title: "Government & Utilities", desc: "Accept tax payments, utility bills, and challan payments via UPI. Bharat QR support for walk-in counters." },
];

const advantages = [
  "Zero MDR on UPI transactions for merchants",
  "Supports all 300+ banks on UPI network",
  "Works with 50+ UPI apps including GPay, PhonePe, Paytm, BHIM",
  "Multi-PSP routing for 99.9%+ success rate",
  "RBI-compliant UPI AutoPay mandates up to ₹1 lakh",
  "Dynamic QR codes with Bharat QR compatibility",
  "Real-time webhooks and server-to-server callbacks",
  "Instant settlement — funds in your account within minutes",
  "Detailed analytics by app, bank, and transaction type",
  "24/7 dedicated support with dedicated account manager",
];

const faqs = [
  { q: "What is a UPI Payment Gateway?", a: "A UPI Payment Gateway enables businesses to accept payments directly from customers' bank accounts via the Unified Payments Interface (UPI) infrastructure. It serves as a bridge between the customer's and merchant's bank accounts, allowing instant, secure, real-time money transfers. ZivonPay's UPI gateway supports all UPI modes — Intent, Collect, QR, AutoPay, and Payment Links." },
  { q: "Which UPI apps are supported?", a: "ZivonPay supports all 50+ UPI apps available in India, including Google Pay (GPay), PhonePe, Paytm, BHIM, Amazon Pay, WhatsApp Pay, CRED, and all major bank UPI apps like SBI Pay, iMobile Pay, and HDFC PayZapp." },
  { q: "What is the UPI transaction limit?", a: "The standard UPI transaction limit is ₹1 lakh per transaction per day, as defined by NPCI. However, specific limits may vary by bank. For UPI AutoPay mandates, the limit is also ₹1 lakh per recurring debit. Some categories like IPO, insurance, and tax payments have enhanced limits up to ₹5 lakh." },
  { q: "How does UPI AutoPay work?", a: "UPI AutoPay allows merchants to set up recurring payment mandates. The customer authorizes a one-time mandate through their UPI app (specifying amount, frequency, and validity). After authorization, subsequent payments are automatically debited on schedule without customer intervention. ZivonPay handles mandate creation, execution, and management." },
  { q: "Is UPI payment gateway free for merchants?", a: "Yes, as per NPCI and government directives, there is zero MDR (Merchant Discount Rate) on UPI transactions for merchants. ZivonPay charges only a nominal platform fee for advanced features like instant settlement, smart routing, and analytics." },
  { q: "How fast is UPI settlement?", a: "Standard UPI settlement is T+1 (next business day). With ZivonPay's Instant Settlement feature, you can receive funds in your bank account within minutes of the transaction, 24/7 including holidays." },
  { q: "How do I integrate the UPI Payment Gateway?", a: "ZivonPay offers multiple integration options: RESTful APIs, SDKs for web and mobile (Android & iOS), pre-built plugins for Shopify, WooCommerce, and Magento, and no-code Payment Links and Payment Pages. Most integrations take less than 30 minutes with our documentation and sandbox environment." },
  { q: "Is UPI payment gateway secure?", a: "Absolutely. ZivonPay's UPI gateway is PCI DSS Level 1 certified with 256-bit SSL encryption. Every UPI transaction requires the customer's UPI PIN authorization. Additionally, our AI-powered fraud detection monitors all transactions in real-time." },
];

const UpiPaymentGatewayPage = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-28 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
              <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6 border border-primary/20">
                UPI Payment Gateway
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight mb-6">
                India's Fastest <br />
                <span className="text-primary">UPI Payment Gateway</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-8 max-w-xl leading-relaxed">
                Accept UPI payments with the highest success rates in the industry. Support for all UPI modes — Intent, Collect, QR, AutoPay & Payment Links. Works with Google Pay, PhonePe, Paytm, BHIM, and 50+ UPI apps.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" className="gap-2 font-semibold text-base px-8" asChild>
                  <Link to="/login">Start Accepting UPI <ArrowRight className="w-4 h-4" /></Link>
                </Button>
                <Button size="lg" variant="outline" className="gap-2 font-semibold text-base px-8 border-primary/30 text-primary hover:bg-primary/10" asChild>
                  <Link to="/developer-guide">View Documentation</Link>
                </Button>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
              <img src={heroImage} alt="UPI Payment Gateway" className="rounded-2xl shadow-2xl shadow-primary/10 w-full" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-8 border-y border-border/50 bg-card/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((s, i) => (
              <motion.div key={i} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center">
                <div className="text-3xl md:text-4xl font-extrabold text-primary">{s.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* UPI Modes */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
            <span className="text-primary font-semibold text-sm uppercase tracking-wider">Comprehensive UPI Suite</span>
            <h2 className="text-3xl md:text-4xl font-extrabold mt-3">Every UPI Payment Mode, One Gateway</h2>
            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">Accept UPI payments in every way your customers prefer — from one-tap mobile intent to automated recurring mandates.</p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upiModes.map((mode, i) => (
              <motion.div key={i} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
                className="bg-card border border-border/50 rounded-xl p-6 hover:border-primary/30 transition-all group">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <mode.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">{mode.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">{mode.description}</p>
                <div className="flex flex-wrap gap-2">
                  {mode.highlights.map((h, j) => (
                    <span key={j} className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium">{h}</span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How UPI Works */}
      <section className="py-20 bg-card/30">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
            <span className="text-primary font-semibold text-sm uppercase tracking-wider">How It Works</span>
            <h2 className="text-3xl md:text-4xl font-extrabold mt-3">UPI Payment in 4 Simple Steps</h2>
          </motion.div>
          <div className="grid md:grid-cols-4 gap-6">
            {howItWorks.map((step, i) => (
              <motion.div key={i} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
                className="relative text-center">
                <div className="w-14 h-14 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-extrabold text-primary">{step.step}</span>
                </div>
                <h3 className="font-bold text-lg mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
                {i < 3 && <div className="hidden md:block absolute top-7 left-[60%] w-[80%] h-px bg-gradient-to-r from-primary/30 to-transparent" />}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
            <span className="text-primary font-semibold text-sm uppercase tracking-wider">Platform Features</span>
            <h2 className="text-3xl md:text-4xl font-extrabold mt-3">Built for Scale & Reliability</h2>
            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">Enterprise-grade UPI infrastructure with intelligent routing, real-time analytics, and bank-grade security.</p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f, i) => (
              <motion.div key={i} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
                className="bg-card border border-border/50 rounded-xl p-5 hover:border-primary/30 transition-all">
                <f.icon className="w-8 h-8 text-primary mb-3" />
                <h3 className="font-bold mb-1.5">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Developer Section */}
      <section className="py-20 bg-card/30">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <span className="text-primary font-semibold text-sm uppercase tracking-wider">Developer First</span>
              <h2 className="text-3xl md:text-4xl font-extrabold mt-3 mb-6">Integrate UPI in Minutes</h2>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Simple RESTful APIs, comprehensive SDKs, and detailed documentation. Go live with UPI payments in under 30 minutes.
              </p>
              <div className="space-y-3">
                {["RESTful APIs with comprehensive documentation", "SDKs for Web, Android, iOS, React Native & Flutter", "Pre-built plugins for Shopify, WooCommerce & Magento", "Sandbox environment with test UPI IDs", "Webhooks with automatic retry and signature verification", "Postman collection for quick API testing"].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <span className="text-sm text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <div className="bg-[hsl(216,28%,5%)] rounded-xl border border-border/50 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50 bg-secondary/30">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-destructive/60" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                    <div className="w-3 h-3 rounded-full bg-green-500/60" />
                  </div>
                  <span className="text-xs text-muted-foreground ml-2 font-mono">create-upi-payment.js</span>
                </div>
                <pre className="p-5 text-sm font-mono leading-relaxed overflow-x-auto">
                  <code>
                    <span className="text-primary/60">// Create a UPI payment order</span>{"\n"}
                    <span className="text-purple-400">const</span> <span className="text-foreground">response</span> = <span className="text-purple-400">await</span> <span className="text-yellow-300">zivonpay</span>.<span className="text-green-400">orders</span>.<span className="text-green-400">create</span>({"{"}{"\n"}
                    {"  "}<span className="text-foreground">amount</span>: <span className="text-primary">50000</span>, <span className="text-primary/60">// ₹500 in paise</span>{"\n"}
                    {"  "}<span className="text-foreground">currency</span>: <span className="text-green-400">"INR"</span>,{"\n"}
                    {"  "}<span className="text-foreground">method</span>: <span className="text-green-400">"upi"</span>,{"\n"}
                    {"  "}<span className="text-foreground">upi</span>: {"{"}{"\n"}
                    {"    "}<span className="text-foreground">flow</span>: <span className="text-green-400">"intent"</span>, <span className="text-primary/60">// or "collect", "qr"</span>{"\n"}
                    {"    "}<span className="text-foreground">vpa</span>: <span className="text-green-400">"customer@upi"</span>,{"\n"}
                    {"  "}{"}"},{"\n"}
                    {"  "}<span className="text-foreground">callback_url</span>: <span className="text-green-400">"https://yoursite.com/callback"</span>,{"\n"}
                    {"}"});{"\n\n"}
                    <span className="text-primary/60">// Payment ID: pay_UPI_xxxxxx</span>{"\n"}
                    <span className="text-purple-400">console</span>.<span className="text-green-400">log</span>(response.<span className="text-foreground">id</span>);
                  </code>
                </pre>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Why ZivonPay UPI */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
            <span className="text-primary font-semibold text-sm uppercase tracking-wider">Why ZivonPay</span>
            <h2 className="text-3xl md:text-4xl font-extrabold mt-3">The ZivonPay UPI Advantage</h2>
          </motion.div>
          <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {advantages.map((adv, i) => (
              <motion.div key={i} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
                className="flex items-start gap-3 p-4 rounded-lg bg-card border border-border/50 hover:border-primary/20 transition-all">
                <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <span className="text-sm text-muted-foreground">{adv}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Industry Use Cases */}
      <section className="py-20 bg-card/30">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
            <span className="text-primary font-semibold text-sm uppercase tracking-wider">Industry Solutions</span>
            <h2 className="text-3xl md:text-4xl font-extrabold mt-3">UPI for Every Industry</h2>
            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">From startups to enterprises, ZivonPay's UPI gateway powers payments across all major industries in India.</p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {useCases.map((uc, i) => (
              <motion.div key={i} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
                className="bg-card border border-border/50 rounded-xl p-6 hover:border-primary/30 transition-all">
                <uc.icon className="w-8 h-8 text-primary mb-3" />
                <h3 className="font-bold text-lg mb-2">{uc.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{uc.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
            <span className="text-primary font-semibold text-sm uppercase tracking-wider">FAQs</span>
            <h2 className="text-3xl md:text-4xl font-extrabold mt-3">Frequently Asked Questions</h2>
          </motion.div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <motion.div key={i} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
                className="border border-border/50 rounded-xl overflow-hidden bg-card">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-secondary/30 transition-colors">
                  <span className="font-semibold pr-4">{faq.q}</span>
                  {openFaq === i ? <ChevronUp className="w-5 h-5 text-primary shrink-0" /> : <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />}
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed border-t border-border/30 pt-4">{faq.a}</div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-br from-primary/10 via-background to-background">
        <div className="container mx-auto px-4 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Start Accepting UPI Payments Today</h2>
            <p className="text-muted-foreground mb-8 max-w-xl mx-auto">Join thousands of businesses using ZivonPay's UPI gateway. Go live in under 30 minutes with zero setup cost.</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button size="lg" className="gap-2 font-semibold px-8" asChild>
                <Link to="/login">Get Started Free <ArrowRight className="w-4 h-4" /></Link>
              </Button>
              <Button size="lg" variant="outline" className="gap-2 font-semibold px-8 border-primary/30 text-primary hover:bg-primary/10" asChild>
                <Link to="/contact-sales">Talk to Sales</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default UpiPaymentGatewayPage;
