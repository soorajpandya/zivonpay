import { motion } from "framer-motion";
import {
  ArrowRight, Repeat, CreditCard, Shield, Bell, BarChart3, Clock,
  Smartphone, CheckCircle2, ChevronRight, Globe2, Zap, Users,
  CalendarDays, RefreshCw, FileText, Settings, TrendingUp,
  Pause, DollarSign, Layers, Award, Lock, Mail
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import heroImage from "@/assets/hero-recurring.jpg";
import sectionSecurity from "@/assets/hero-security.jpg";
import sectionAnalytics from "@/assets/hero-analytics.jpg";

const recurringMethods = [
  { icon: Smartphone, name: "UPI AutoPay", desc: "Recurring mandates via Google Pay, PhonePe, Paytm, BHIM & all major UPI apps. Supports daily, weekly, monthly & yearly cycles." },
  { icon: CreditCard, name: "Card Standing Instructions", desc: "RBI-compliant card-on-file tokenization for Visa, Mastercard, RuPay & Amex. Seamless recurring charges with saved card tokens." },
  { icon: Lock, name: "eNACH / eMandate", desc: "Digital mandate registration for direct bank-to-bank recurring debits. Supports savings, current & overdraft accounts across 100+ banks." },
  { icon: Globe2, name: "International Cards", desc: "Accept recurring payments from international Visa & Mastercard subscribers in 20+ currencies." },
];

const billingModels = [
  {
    icon: CalendarDays,
    title: "Fixed Payment Schedule",
    description: "Automate fixed-price recurring charges on a set schedule — daily, weekly, monthly, quarterly, or annually. Perfect for memberships, subscriptions, and retainers."
  },
  {
    icon: Users,
    title: "Quantity / Per-Seat Pricing",
    description: "Charge customers based on the number of users, seats, or licenses per billing cycle. Automatically adjust invoices as team sizes change."
  },
  {
    icon: TrendingUp,
    title: "Usage-Based / Metered Billing",
    description: "Charge customers for exactly what they consume over a billing cycle. Ideal for API calls, storage, bandwidth, and cloud services."
  },
  {
    icon: Layers,
    title: "Tiered & Hybrid Pricing",
    description: "Combine fixed base fees with usage-based overages or volume tiers. Create sophisticated pricing that scales with your customers."
  },
];

const coreFeatures = [
  {
    icon: RefreshCw,
    title: "Smart Dunning & Auto-Retry",
    description: "Automatically retry failed payments with intelligent scheduling. Customize retry intervals, send payment failure notifications, and recover up to 25% of failed recurring charges."
  },
  {
    icon: Pause,
    title: "Pause, Resume & Cancel",
    description: "Give subscribers full control to pause, resume, or cancel subscriptions anytime. Reduce churn with flexible subscription management instead of outright cancellations."
  },
  {
    icon: DollarSign,
    title: "Trial Periods & Upfront Charges",
    description: "Offer free or paid trial periods that automatically convert to paid subscriptions. Collect setup fees or one-time charges at subscription creation."
  },
  {
    icon: Settings,
    title: "Plan Upgrades & Downgrades",
    description: "Seamless mid-cycle plan changes with automatic proration. Customers can upgrade, downgrade, or switch plans without disruption."
  },
  {
    icon: FileText,
    title: "Automated Invoicing",
    description: "Auto-generate GST-compliant invoices for every billing cycle. Customizable invoice templates with your branding, sent automatically to subscribers."
  },
  {
    icon: Mail,
    title: "Payment Notifications & Alerts",
    description: "Automated email & SMS notifications for upcoming charges, successful payments, failed attempts, subscription renewals, and expiring cards."
  },
];

const advancedCapabilities = [
  {
    icon: BarChart3,
    title: "Subscription Analytics",
    description: "Track MRR, ARR, churn rate, LTV, ARPU, and subscriber growth with real-time dashboards. Identify trends and make data-driven decisions to grow your subscription business."
  },
  {
    icon: Globe2,
    title: "Multi-Currency Subscriptions",
    description: "Onboard subscribers from around the world. Support for 20+ currencies with automatic conversion, enabling you to grow across geographies without worry."
  },
  {
    icon: Award,
    title: "Discounts & Coupons",
    description: "Create percentage or flat-amount discount coupons for subscription plans. Set validity periods, usage limits, and apply them at checkout to drive conversions."
  },
  {
    icon: Zap,
    title: "Subscription Links",
    description: "Create unique subscription links from the dashboard and share via SMS, email, WhatsApp, or social media. Convert customers to subscribers without any coding."
  },
  {
    icon: Repeat,
    title: "Add-ons & One-Time Charges",
    description: "Add supplementary charges or one-time fees to existing subscriptions. Charge for premium features, overages, or additional services on the next billing cycle."
  },
  {
    icon: Shield,
    title: "RBI Compliant Mandates",
    description: "Fully compliant with RBI's e-mandate framework and recurring payment guidelines. Pre-debit notifications, mandate management, and seamless customer authorization."
  },
];

const howItWorks = [
  { step: "01", title: "Create a Plan", desc: "Define your subscription plan with pricing, billing cycle, trial period, and add-ons via dashboard or API." },
  { step: "02", title: "Share with Customers", desc: "Share subscription links via email, SMS, WhatsApp or embed the checkout in your website/app." },
  { step: "03", title: "Customer Authorizes", desc: "Customer selects a payment method (UPI, card, eNACH) and authorizes the recurring mandate." },
  { step: "04", title: "Automatic Billing", desc: "ZivonPay automatically charges the customer on each billing cycle. Handle retries, notifications & invoicing." },
];

const useCases = [
  { title: "OTT & Media Streaming", desc: "Monthly/annual subscriptions for video, music, and content streaming services with multi-device support." },
  { title: "SaaS & Cloud Services", desc: "Per-seat licensing, usage-based billing, and tiered pricing for software and cloud platforms." },
  { title: "EdTech & E-Learning", desc: "Course subscriptions, semester fees, EMI-based fee collection, and institutional billing." },
  { title: "Insurance & Financial Services", desc: "Premium collection, SIP mandates, loan EMI auto-debit, and recurring investment charges." },
  { title: "Health & Fitness", desc: "Gym memberships, wellness app subscriptions, telemedicine plans, and health monitoring services." },
  { title: "Utilities & Telecom", desc: "Monthly bill payments, postpaid plans, broadband subscriptions, and recurring utility charges." },
];

const faqs = [
  {
    q: "What is recurring payment and how does it work?",
    a: "Recurring payment is an automated billing method where a customer authorizes a merchant to charge their payment instrument (card, bank account, or UPI) at regular intervals. Once the customer sets up a mandate, ZivonPay automatically processes the charge on each billing cycle without requiring manual intervention."
  },
  {
    q: "What payment methods are supported for recurring payments?",
    a: "ZivonPay supports UPI AutoPay (Google Pay, PhonePe, Paytm, BHIM & more), Card Standing Instructions (Visa, Mastercard, RuPay, Amex), eNACH/eMandate for direct bank debits, and international cards. Each method supports different billing frequencies and amount limits as per RBI guidelines."
  },
  {
    q: "Is UPI AutoPay compliant with RBI guidelines?",
    a: "Yes, ZivonPay's UPI AutoPay is fully compliant with RBI's e-mandate framework. Customers receive pre-debit notifications before each charge, have full visibility into upcoming debits, and can pause or revoke mandates at any time through their UPI app."
  },
  {
    q: "What happens when a recurring payment fails?",
    a: "ZivonPay's smart dunning system automatically retries failed payments based on configurable retry schedules. Customers are notified via email/SMS about the failure with options to update their payment method. You can customize retry intervals, maximum attempts, and fallback actions."
  },
  {
    q: "Can customers pause or cancel their subscriptions?",
    a: "Yes, customers can pause, resume, or cancel subscriptions at any time. You can configure whether paused subscriptions extend the billing cycle or retain the original schedule. Cancellations can be immediate or at the end of the current billing period."
  },
  {
    q: "What are the charges for recurring payments?",
    a: "Pricing varies by payment method. UPI AutoPay and eNACH mandates have competitive rates, while card standing instructions follow standard card processing rates. Visit our Pricing page or contact sales for detailed pricing based on your volume and business requirements."
  },
];

const stats = [
  { value: "25%", label: "Failed Payment Recovery" },
  { value: "4+", label: "Recurring Payment Methods" },
  { value: "99.99%", label: "Billing Uptime" },
  { value: "100+", label: "Banks Supported" },
  { value: "20+", label: "Currencies" },
  { value: "T+1", label: "Settlement Cycle" },
];

const RecurringPaymentsPage = () => (
  <div className="min-h-screen bg-background">
    <Navbar />

    {/* Hero */}
    <section className="relative overflow-x-hidden pt-24" style={{ background: "var(--gradient-hero)" }}>
      <div className="absolute inset-0 bg-grid-pattern opacity-20" />
      <div className="absolute left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-[120px]" />
      <div className="relative mx-auto max-w-7xl px-6 py-24 lg:py-32">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="text-center lg:text-left">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-glow" />
              Recurring Payments Suite
            </motion.div>
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Automate Your{" "}
              <span className="text-gradient">Subscription Billing</span>
            </motion.h1>
            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="mt-6 text-lg text-muted-foreground">
              Grow your brand, improve revenue, and retain customers with automated recurring payments via UPI AutoPay, Cards, eNACH, and international cards. Set up plans, control billing cycles, and get instant alerts — let ZivonPay handle the rest.
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center lg:justify-start">
              <Button size="lg" className="gap-2 bg-primary px-8 text-primary-foreground hover:bg-primary/90" style={{ boxShadow: "var(--shadow-glow)" }}>
                Start Collecting Subscriptions <ArrowRight size={18} />
              </Button>
              <Button size="lg" variant="outline" className="border-border px-8 text-foreground hover:bg-secondary" asChild>
                <Link to="/developer-guide">View Documentation</Link>
              </Button>
            </motion.div>
          </div>
          <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3, duration: 0.6 }} className="hidden lg:block">
            <div className="overflow-hidden rounded-xl border border-border/30 shadow-2xl" style={{ boxShadow: "var(--shadow-card)" }}>
              <img src={heroImage} alt="ZivonPay Recurring Payments" className="h-auto w-full object-cover" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>

    {/* Stats */}
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

    {/* Recurring Payment Methods */}
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center">
          <h2 className="text-3xl font-bold sm:text-4xl" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Multiple Ways to Collect <span className="text-gradient">Recurring Payments</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Support every customer preference with multiple recurring payment methods. From UPI AutoPay for mobile-first India to eNACH for traditional bank debits.
          </p>
        </motion.div>
        <div className="mt-16 grid gap-6 sm:grid-cols-2">
          {recurringMethods.map((method, i) => (
            <motion.div key={method.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
              className="group flex gap-5 rounded-xl border border-border/50 bg-card p-6 transition-all hover:border-primary/30" style={{ boxShadow: "var(--shadow-card)" }}>
              <div className="shrink-0 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                <method.icon size={28} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{method.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{method.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    {/* How It Works */}
    <section className="border-t border-border/50 py-24" style={{ background: "var(--gradient-hero)" }}>
      <div className="mx-auto max-w-7xl px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center">
          <h2 className="text-3xl font-bold sm:text-4xl" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            How It <span className="text-gradient">Works</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Get started with recurring payments in four simple steps. Create a plan, share with customers, and let ZivonPay handle the rest.
          </p>
        </motion.div>
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {howItWorks.map((step, i) => (
            <motion.div key={step.step} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="relative rounded-xl border border-border/50 bg-card p-6" style={{ boxShadow: "var(--shadow-card)" }}>
              <span className="text-gradient text-4xl font-bold opacity-30" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{step.step}</span>
              <h3 className="mt-3 text-lg font-semibold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
              {i < howItWorks.length - 1 && (
                <div className="absolute -right-3 top-1/2 hidden -translate-y-1/2 lg:block">
                  <ChevronRight size={20} className="text-primary/40" />
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    {/* Billing Models */}
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center">
          <h2 className="text-3xl font-bold sm:text-4xl" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Multiple <span className="text-gradient">Billing Models</span>, One Solution
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Whether you charge a fixed price, per-seat, per-usage, or a combination — ZivonPay Subscriptions adapts to your business model.
          </p>
        </motion.div>
        <div className="mt-16 grid gap-6 sm:grid-cols-2">
          {billingModels.map((model, i) => (
            <motion.div key={model.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
              className="rounded-xl border border-border/50 bg-card p-6 transition-all hover:border-primary/30" style={{ boxShadow: "var(--shadow-card)" }}>
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <model.icon size={24} />
              </div>
              <h3 className="text-lg font-semibold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{model.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{model.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>

    {/* Core Features */}
    <section className="border-t border-border/50 py-24" style={{ background: "var(--gradient-hero)" }}>
      <div className="mx-auto max-w-7xl px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center">
          <h2 className="text-3xl font-bold sm:text-4xl" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Make Subscription Payments <span className="text-gradient">Frictionless</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Craft subscription plans tailored to your business with support for trials, upfront charges, add-ons, discounts, and intelligent dunning management.
          </p>
        </motion.div>
        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {coreFeatures.map((feature, i) => (
            <motion.div key={feature.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
              className="rounded-xl border border-border/50 bg-card p-6 transition-all hover:border-primary/30" style={{ boxShadow: "var(--shadow-card)" }}>
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

    {/* UPI AutoPay Deep Dive — Image + Content */}
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
            <div className="overflow-hidden rounded-xl border border-border/30" style={{ boxShadow: "var(--shadow-card)" }}>
              <img src={sectionSecurity} alt="UPI AutoPay" className="h-auto w-full object-cover" />
            </div>
          </motion.div>
          <div>
            <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="text-3xl font-bold sm:text-4xl" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Unlock Growth with <span className="text-gradient">UPI AutoPay</span>
            </motion.h2>
            <motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
              className="mt-4 text-muted-foreground leading-relaxed">
              Reach India's massive UPI user base with frictionless recurring mandates. Target customers who don't own cards and expand your subscriber base significantly.
            </motion.p>
            <div className="mt-8 space-y-4">
              {[
                "Expand consumer base — target customers without credit/debit cards",
                "Support daily, weekly, monthly, quarterly & yearly billing cycles",
                "Compatible with all major UPI apps — Google Pay, PhonePe, Paytm, BHIM & more",
                "Customers get full visibility into plans and upcoming debits",
                "Subscribers can pause or revoke mandates anytime from their UPI app",
                "Pre-debit notifications sent automatically before every charge",
                "Mandate amounts up to ₹1,00,000 per transaction (as per NPCI limits)",
                "Real-time mandate status tracking via dashboard & webhooks",
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

    {/* Advanced Capabilities */}
    <section className="border-t border-border/50 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center">
          <h2 className="text-3xl font-bold sm:text-4xl" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Advanced <span className="text-gradient">Capabilities</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Beyond basic billing — analytics, multi-currency support, discounts, subscription links, and full RBI compliance built in.
          </p>
        </motion.div>
        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {advancedCapabilities.map((feature, i) => (
            <motion.div key={feature.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
              className="flex gap-4 rounded-xl border border-border/50 bg-card p-5 transition-all hover:border-primary/30" style={{ boxShadow: "var(--shadow-card)" }}>
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

    {/* Subscription Analytics — Content + Image */}
    <section className="border-t border-border/50 py-24" style={{ background: "var(--gradient-hero)" }}>
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="order-2 lg:order-1">
            <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="text-3xl font-bold sm:text-4xl" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Subscription <span className="text-gradient">Analytics &amp; Insights</span>
            </motion.h2>
            <motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
              className="mt-4 text-muted-foreground leading-relaxed">
              Understand your subscription business inside out. Track every metric that matters and make data-driven decisions to reduce churn and grow revenue.
            </motion.p>
            <div className="mt-8 space-y-4">
              {[
                "MRR & ARR tracking with growth trends",
                "Churn rate analysis with cohort breakdowns",
                "Customer Lifetime Value (LTV) calculations",
                "Average Revenue Per User (ARPU) metrics",
                "Payment method performance comparison",
                "Dunning & recovery success analytics",
                "Plan-wise subscriber distribution reports",
                "Custom report builder with export options",
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
              <img src={sectionAnalytics} alt="Subscription Analytics" className="h-auto w-full object-cover" />
            </div>
          </motion.div>
        </div>
      </div>
    </section>

    {/* Use Cases */}
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center">
          <h2 className="text-3xl font-bold sm:text-4xl" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Built for <span className="text-gradient">Every Industry</span>
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            From streaming platforms to insurance companies, ZivonPay powers recurring payments for businesses across sectors.
          </p>
        </motion.div>
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {useCases.map((uc, i) => (
            <motion.div key={uc.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
              className="rounded-xl border border-border/50 bg-card p-6 transition-all hover:border-primary/30" style={{ boxShadow: "var(--shadow-card)" }}>
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

    {/* FAQs */}
    <section className="border-t border-border/50 py-24" style={{ background: "var(--gradient-hero)" }}>
      <div className="mx-auto max-w-4xl px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center">
          <h2 className="text-3xl font-bold sm:text-4xl" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Frequently Asked <span className="text-gradient">Questions</span>
          </h2>
        </motion.div>
        <div className="mt-12 space-y-4">
          {faqs.map((faq, i) => (
            <motion.details key={i} initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
              className="group rounded-xl border border-border/50 bg-card transition-all hover:border-primary/30 [&[open]]:border-primary/30" style={{ boxShadow: "var(--shadow-card)" }}>
              <summary className="cursor-pointer px-6 py-5 text-foreground font-medium list-none flex items-center justify-between" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {faq.q}
                <ChevronRight size={18} className="shrink-0 text-muted-foreground transition-transform group-open:rotate-90" />
              </summary>
              <div className="px-6 pb-5 text-sm leading-relaxed text-muted-foreground">{faq.a}</div>
            </motion.details>
          ))}
        </div>
      </div>
    </section>

    {/* CTA */}
    <section className="border-t border-border/50 py-24">
      <div className="mx-auto max-w-3xl px-6 text-center">
        <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          className="text-3xl font-bold sm:text-4xl" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
          Ready to automate your <span className="text-gradient">recurring revenue</span>?
        </motion.h2>
        <motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
          className="mt-4 text-muted-foreground">
          Join thousands of businesses using ZivonPay Subscriptions to collect recurring payments, reduce churn, and grow their subscriber base.
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
          className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Button size="lg" className="gap-2 bg-primary px-8 text-primary-foreground hover:bg-primary/90" style={{ boxShadow: "var(--shadow-glow)" }} asChild>
            <Link to="/login">Get Started <ArrowRight size={18} /></Link>
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

export default RecurringPaymentsPage;
