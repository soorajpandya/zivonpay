import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Globe2, CreditCard, Shield, ArrowRight, Zap,
  DollarSign, TrendingUp, Clock, CheckCircle2, Building2, ShoppingCart,
  Plane, GraduationCap, Banknote, ChevronDown, Landmark,
  Languages, MapPin, Wallet, RefreshCcw, Lock, LineChart,
  ArrowUpRight, Sparkles, BadgeCheck, CircleDollarSign
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import heroImg from "@/assets/hero-international.jpg";
import securityImg from "@/assets/hero-security.jpg";

const currencies = [
  { code: "USD", symbol: "$", name: "US Dollar", rate: "83.12" },
  { code: "EUR", symbol: "€", name: "Euro", rate: "90.45" },
  { code: "GBP", symbol: "£", name: "British Pound", rate: "105.32" },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham", rate: "22.63" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar", rate: "61.89" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen", rate: "0.55" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar", rate: "54.21" },
  { code: "CAD", symbol: "C$", name: "Canadian Dollar", rate: "61.44" },
];

const faqs = [
  { q: "Which currencies does ZivonPay support?", a: "ZivonPay supports 100+ currencies including USD, EUR, GBP, AED, SGD, AUD, CAD, JPY, and more. We continuously add new currencies based on market demand." },
  { q: "What are the FX rates and conversion fees?", a: "We offer highly competitive FX rates sourced from top-tier liquidity providers. A transparent markup is applied with no hidden fees. Enterprise customers can negotiate custom rates." },
  { q: "How does RBI/FEMA compliance work?", a: "ZivonPay automates purpose code mapping, generates FIRCs (Foreign Inward Remittance Certificates), and ensures all cross-border transactions comply with RBI and FEMA guidelines." },
  { q: "What is the settlement timeline?", a: "Standard settlements happen in T+2 business days. Priority settlement in T+1 is available for eligible merchants at a nominal fee." },
  { q: "Can I accept payments without a foreign bank account?", a: "Yes. ZivonPay handles all FX conversion and settles directly to your Indian bank account in INR. No foreign bank account needed." },
  { q: "How is international fraud prevented?", a: "We use AI/ML-based fraud screening, velocity checks, device fingerprinting, 3DS 2.0 authentication, and real-time risk scoring to minimize fraud while maximizing conversions." },
];

const InternationalPaymentsPage = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* ── Hero: Full-width immersive ── */}
      <section className="relative overflow-hidden pt-24" style={{ background: "var(--gradient-hero)" }}>
        <div className="absolute inset-0 bg-grid-pattern opacity-10" />
        {/* Animated orbs */}
        <div className="absolute -left-32 top-1/4 h-[600px] w-[600px] animate-pulse rounded-full bg-primary/4 blur-[150px]" />
        <div className="absolute -right-20 bottom-0 h-[400px] w-[400px] rounded-full bg-primary/6 blur-[120px]" />
        
        <div className="relative mx-auto max-w-7xl px-6 py-28 lg:py-36">
          <div className="grid items-center gap-16 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-5 py-2 text-sm text-primary">
                <Globe2 size={14} />
                Cross-Border Payments Infrastructure
              </motion.div>
              <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-[3.5rem]">
                One integration.{" "}
                <span className="text-gradient">Every currency.</span>{" "}
                Every country.
              </motion.h1>
              <motion.p initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
                ZivonPay connects your business to 100+ currencies and 40+ countries through a single API — with built-in compliance, fraud protection, and competitive FX rates.
              </motion.p>
              <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="mt-10 flex flex-wrap gap-4">
                <Button size="lg" className="gap-2 px-8" style={{ boxShadow: "var(--shadow-glow)" }} asChild>
                  <Link to="/login">Go Global Now <ArrowRight size={18} /></Link>
                </Button>
                <Button size="lg" variant="outline" className="gap-2 border-border px-8 text-foreground hover:bg-secondary" asChild>
                  <Link to="/developer-guide">API Reference</Link>
                </Button>
              </motion.div>
              {/* Inline trust signals */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                className="mt-10 flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><Shield size={14} className="text-primary" /> PCI DSS L1</span>
                <span className="flex items-center gap-1.5"><Lock size={14} className="text-primary" /> 3DS 2.0</span>
                <span className="flex items-center gap-1.5"><BadgeCheck size={14} className="text-primary" /> RBI Compliant</span>
                <span className="flex items-center gap-1.5"><Zap size={14} className="text-primary" /> T+1 Settlement</span>
              </motion.div>
            </div>

            {/* Hero right: Currency exchange card */}
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.7 }}
              className="hidden lg:block">
              <div className="rounded-2xl border border-border/40 bg-card/80 p-6 backdrop-blur-sm" style={{ boxShadow: "var(--shadow-card)" }}>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-medium text-muted-foreground">Live FX Rates · INR</h3>
                  <span className="flex items-center gap-1 rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-medium text-green-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" /> Live
                  </span>
                </div>
                <div className="space-y-2">
                  {currencies.map((c, i) => (
                    <motion.div key={c.code} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.06 }}
                      className="flex items-center justify-between rounded-lg border border-border/30 bg-secondary/30 px-4 py-3 transition-colors hover:bg-secondary/60">
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{c.symbol}</span>
                        <div>
                          <span className="text-sm font-medium text-foreground">{c.code}</span>
                          <span className="ml-2 text-xs text-muted-foreground">{c.name}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">₹{c.rate}</span>
                        <ArrowUpRight size={12} className="text-green-400" />
                      </div>
                    </motion.div>
                  ))}
                </div>
                <p className="mt-3 text-center text-[11px] text-muted-foreground/60">Indicative rates · Updated every 30s</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Bento stats strip ── */}
      <section className="border-y border-border/50">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-border/50 md:grid-cols-4">
          {[
            { val: "100+", label: "Currencies", icon: CircleDollarSign },
            { val: "40+", label: "Countries", icon: MapPin },
            { val: "99.97%", label: "Uptime", icon: TrendingUp },
            { val: "<2s", label: "Processing", icon: Clock },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ delay: i * 0.08 }} className="flex items-center gap-4 px-6 py-8">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <s.icon size={20} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{s.val}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Bento Grid: Payment Methods ── */}
      <section className="py-28">
        <div className="mx-auto max-w-7xl px-6">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="mb-16 max-w-2xl">
            <p className="text-sm font-medium uppercase tracking-wider text-primary">Accept everything</p>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
              Payment methods your customers <span className="text-gradient">already use</span>
            </h2>
          </motion.div>

          {/* Asymmetric bento layout */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Large featured card */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card p-8 lg:row-span-2"
              style={{ boxShadow: "var(--shadow-card)" }}>
              <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/5 blur-[60px] transition-all group-hover:bg-primary/10" />
              <div className="relative">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <CreditCard size={28} />
                </div>
                <h3 className="text-xl font-bold text-foreground">International Cards</h3>
                <p className="mt-3 leading-relaxed text-muted-foreground">
                  Accept Visa, Mastercard, American Express, Diners Club, JCB, UnionPay & Discover from 200+ countries with intelligent routing for maximum approval rates.
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {["Visa", "Mastercard", "Amex", "JCB", "UnionPay"].map(b => (
                    <span key={b} className="rounded-full border border-border/50 bg-secondary/50 px-3 py-1 text-xs font-medium text-muted-foreground">{b}</span>
                  ))}
                </div>
                <div className="mt-8 overflow-hidden rounded-xl border border-border/30">
                  <img src={heroImg} alt="Global cards" className="h-40 w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                </div>
              </div>
            </motion.div>

            {/* Smaller cards */}
            {[
              { icon: Wallet, title: "Digital Wallets", desc: "PayPal, Apple Pay, Google Pay, Alipay, WeChat Pay — let customers pay the way they prefer.", color: "from-blue-500/10 to-cyan-500/10" },
              { icon: Landmark, title: "Bank Transfers", desc: "SWIFT, SEPA, ACH and 30+ local bank transfer methods across major markets.", color: "from-violet-500/10 to-purple-500/10" },
              { icon: Banknote, title: "Multi-Currency Pricing", desc: "Show prices in customer's local currency. We handle real-time FX conversion behind the scenes.", color: "from-amber-500/10 to-orange-500/10" },
              { icon: Globe2, title: "50+ Local Methods", desc: "iDEAL, Sofort, Giropay, Boleto, OXXO, GrabPay, DANA, and every regional method that matters.", color: "from-emerald-500/10 to-green-500/10" },
              { icon: Languages, title: "Localized Checkout", desc: "Auto-detect location. Serve checkout in the right language, currency, and payment methods instantly.", color: "from-pink-500/10 to-rose-500/10" },
            ].map((m, i) => (
              <motion.div key={m.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className={`group rounded-2xl border border-border/50 bg-gradient-to-br ${m.color} p-6 transition-all duration-300 hover:border-primary/30`}
                style={{ boxShadow: "var(--shadow-card)" }}>
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-card/80 text-primary ring-1 ring-border/50">
                  <m.icon size={20} />
                </div>
                <h3 className="font-semibold text-foreground">{m.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{m.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works: Horizontal timeline ── */}
      <section className="overflow-hidden border-t border-border/50 py-28" style={{ background: "var(--gradient-hero)" }}>
        <div className="mx-auto max-w-7xl px-6">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center">
            <p className="text-sm font-medium uppercase tracking-wider text-primary">4-step process</p>
            <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
              From checkout to <span className="text-gradient">settlement</span>
            </h2>
          </motion.div>

          <div className="relative mt-20">
            {/* Connector line */}
            <div className="absolute left-0 right-0 top-8 hidden h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent lg:block" />
            
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { num: "01", title: "Customer pays", desc: "Customer picks their currency and preferred payment method on your branded checkout.", icon: ShoppingCart },
                { num: "02", title: "Smart FX applied", desc: "Real-time forex rates from tier-1 liquidity providers. Transparent markups, no hidden fees.", icon: RefreshCcw },
                { num: "03", title: "Secure routing", desc: "AI routes through the optimal acquiring bank. 3DS 2.0 auth minimizes fraud, maximizes approvals.", icon: Shield },
                { num: "04", title: "You get paid", desc: "Funds settled in INR, USD, EUR, or GBP. Full reconciliation reports auto-generated.", icon: DollarSign },
              ].map((s, i) => (
                <motion.div key={s.num} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                  transition={{ delay: i * 0.12 }} className="relative text-center lg:text-left">
                  {/* Step dot */}
                  <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/20 bg-card text-primary lg:mx-0"
                    style={{ boxShadow: "var(--shadow-glow)" }}>
                    <s.icon size={24} />
                  </div>
                  <span className="mb-2 block text-xs font-bold uppercase tracking-widest text-primary/50">Step {s.num}</span>
                  <h3 className="text-lg font-bold text-foreground">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Split feature: Security & Compliance ── */}
      <section className="py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid items-center gap-16 lg:grid-cols-[0.9fr_1.1fr]">
            <motion.div initial={{ opacity: 0, scale: 0.96 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
              transition={{ duration: 0.6 }} className="relative">
              <div className="overflow-hidden rounded-2xl border border-border/30" style={{ boxShadow: "var(--shadow-card)" }}>
                <img src={securityImg} alt="Enterprise security" className="h-auto w-full object-cover" />
              </div>
              {/* Floating badge */}
              <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="absolute -bottom-4 -right-4 rounded-xl border border-border/50 bg-card px-5 py-3 md:-bottom-6 md:-right-6"
                style={{ boxShadow: "var(--shadow-card)" }}>
                <p className="text-2xl font-bold text-foreground">99.97%</p>
                <p className="text-xs text-muted-foreground">Uptime SLA</p>
              </motion.div>
            </motion.div>

            <div>
              <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <p className="text-sm font-medium uppercase tracking-wider text-primary">Enterprise-grade</p>
                <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
                  Security & compliance <span className="text-gradient">built in</span>
                </h2>
                <p className="mt-4 text-muted-foreground">
                  Every transaction is protected by bank-grade infrastructure. Compliance is automated so you can focus on growing, not paperwork.
                </p>
              </motion.div>

              <div className="mt-10 space-y-4">
                {[
                  { icon: Shield, title: "PCI DSS Level 1", desc: "Highest level of payment security certification. All card data encrypted end-to-end." },
                  { icon: Lock, title: "3DS 2.0 + Fraud AI", desc: "Dynamic authentication with ML-based risk scoring. <0.1% false positive rate." },
                  { icon: BadgeCheck, title: "Auto RBI/FEMA Compliance", desc: "Purpose code mapping, FIRC generation, and regulatory reporting — fully automated." },
                  { icon: LineChart, title: "Smart Routing Engine", desc: "AI picks the optimal acquiring bank per transaction to maximize approval rates and cut costs." },
                  { icon: Zap, title: "T+1 Settlements", desc: "Priority settlement for international payments. Standard T+2 also available." },
                  { icon: RefreshCcw, title: "Native Currency Refunds", desc: "Refund customers in their original currency. Automatic FX reversal handled for you." },
                ].map((f, i) => (
                  <motion.div key={f.title} initial={{ opacity: 0, x: 16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                    transition={{ delay: i * 0.06 }}
                    className="flex gap-4 rounded-xl border border-border/30 bg-card/50 p-4 transition-all hover:border-primary/20 hover:bg-card">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <f.icon size={18} />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-foreground">{f.title}</h4>
                      <p className="mt-0.5 text-sm text-muted-foreground">{f.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Use cases: Horizontal scroll-like cards ── */}
      <section className="border-t border-border/50 py-28" style={{ background: "var(--gradient-hero)" }}>
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid items-end gap-8 lg:grid-cols-[1fr_auto]">
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
              <p className="text-sm font-medium uppercase tracking-wider text-primary">Built for your industry</p>
              <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
                Cross-border payments, <span className="text-gradient">tailored</span>
              </h2>
            </motion.div>
            <Button variant="outline" className="hidden gap-2 border-border text-foreground hover:bg-secondary lg:inline-flex" asChild>
              <Link to="/contact-sales">Discuss your use case <ArrowUpRight size={14} /></Link>
            </Button>
          </div>

          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: ShoppingCart, title: "E-Commerce", desc: "Localized checkout flows with DCC, multi-currency cart, and one-click international payments.", tag: "Most Popular" },
              { icon: Building2, title: "SaaS & Subscriptions", desc: "Recurring international billing with auto FX conversion, dunning, and multi-currency invoices." },
              { icon: Plane, title: "Travel & Hospitality", desc: "100+ currency bookings with instant confirmation, split payments, and hassle-free refunds." },
              { icon: GraduationCap, title: "EdTech", desc: "Accept tuition from international students. Compliance-ready with purpose code auto-tagging." },
              { icon: Globe2, title: "Freelancers & Agencies", desc: "Get paid by global clients with competitive FX. Fast payouts to your Indian bank account." },
              { icon: Sparkles, title: "Marketplaces", desc: "Split cross-border payments across sellers. Automatic currency conversion and vendor settlements." },
            ].map((uc, i) => (
              <motion.div key={uc.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="group relative rounded-2xl border border-border/50 bg-card p-6 transition-all duration-300 hover:border-primary/20"
                style={{ boxShadow: "var(--shadow-card)" }}>
                {uc.tag && (
                  <span className="absolute right-4 top-4 rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary">
                    {uc.tag}
                  </span>
                )}
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-border/50 bg-secondary/50 text-primary transition-colors group-hover:bg-primary/10">
                  <uc.icon size={22} />
                </div>
                <h3 className="font-bold text-foreground">{uc.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{uc.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why ZivonPay: Stacked two-col ── */}
      <section className="py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-16 lg:grid-cols-2">
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="lg:sticky lg:top-32 lg:self-start">
              <p className="text-sm font-medium uppercase tracking-wider text-primary">The ZivonPay difference</p>
              <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
                Not just another <span className="text-gradient">payment gateway</span>
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                We built ZivonPay specifically for businesses that think beyond borders. Here's what makes us different.
              </p>
              <Button className="mt-8 gap-2" size="lg" style={{ boxShadow: "var(--shadow-glow)" }} asChild>
                <Link to="/login">Start Free <ArrowRight size={18} /></Link>
              </Button>
            </motion.div>

            <div className="space-y-4">
              {[
                { title: "Zero hidden fees", desc: "Transparent pricing with competitive FX markups. What you see is what you pay." },
                { title: "100+ currencies, one API", desc: "A single integration handles every currency. No per-country setup or separate SDKs." },
                { title: "Automated regulatory compliance", desc: "RBI/FEMA purpose codes, FIRC generation, and export documentation — handled automatically." },
                { title: "AI-powered fraud prevention", desc: "Machine learning models trained on millions of transactions. <0.1% false positive rate." },
                { title: "15+ language checkout", desc: "Customers see checkout in their own language. Conversion rates increase by up to 30%." },
                { title: "Enterprise support included", desc: "Dedicated relationship manager, 24/7 priority support, and custom SLAs for all plans." },
                { title: "Real-time FX rate locking", desc: "Lock exchange rates at order creation for predictable revenue, regardless of market volatility." },
                { title: "Native currency refunds", desc: "Refund in the original payment currency. Automatic FX reversal with no manual work." },
              ].map((a, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: 16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-start gap-4 rounded-xl border border-border/40 bg-card/50 p-5 transition-all hover:border-primary/20 hover:bg-card">
                  <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-primary" />
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">{a.title}</h4>
                    <p className="mt-1 text-sm text-muted-foreground">{a.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Developer snippet ── */}
      <section className="border-t border-border/50 py-28" style={{ background: "var(--gradient-hero)" }}>
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
              <p className="text-sm font-medium uppercase tracking-wider text-primary">Developer friendly</p>
              <h2 className="mt-3 text-3xl font-bold sm:text-4xl">
                Go live in <span className="text-gradient">under 30 minutes</span>
              </h2>
              <p className="mt-4 text-muted-foreground">
                Clean RESTful APIs, comprehensive SDKs, and sandbox environment. Accept your first international payment today.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {["Node.js", "Python", "PHP", "Java", "React", "Flutter", "Go", ".NET"].map(t => (
                  <span key={t} className="rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">{t}</span>
                ))}
              </div>
              <Button className="mt-8 gap-2" variant="outline" asChild>
                <Link to="/developer-guide">Read API Docs <ArrowRight size={16} /></Link>
              </Button>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <div className="overflow-hidden rounded-2xl border border-border/40" style={{ boxShadow: "var(--shadow-card)" }}>
                <div className="flex items-center gap-2 border-b border-border/40 bg-card px-4 py-3">
                  <div className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
                  <div className="h-2.5 w-2.5 rounded-full bg-primary/40" />
                  <div className="h-2.5 w-2.5 rounded-full bg-primary/60" />
                  <span className="ml-2 text-xs text-muted-foreground">international-checkout.js</span>
                </div>
                <pre className="overflow-x-auto bg-card/60 p-5 text-[13px] leading-relaxed">
                  <code className="text-muted-foreground">{`const payment = await zivonpay.orders.create({
  amount: 4999,           // in smallest unit
  currency: "USD",        // customer's currency
  settle_currency: "INR", // you receive INR
  receipt: "intl_order_42",
  customer: {
    email: "alex@example.com",
    country: "US"
  }
});

// Auto-selects best payment methods
// for customer's country
zivonpay.checkout.open({
  orderId: payment.id,
  locale: "auto",  // auto-detect language
  onSuccess: (res) => {
    console.log("Paid!", res.fx_rate);
  }
});`}</code>
                </pre>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── FAQs ── */}
      <section className="py-28">
        <div className="mx-auto max-w-3xl px-6">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center">
            <h2 className="text-3xl font-bold sm:text-4xl">
              Common <span className="text-gradient">questions</span>
            </h2>
          </motion.div>
          <div className="mt-12 space-y-2">
            {faqs.map((faq, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
                className="overflow-hidden rounded-xl border border-border/40 bg-card/50 transition-colors hover:bg-card">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between px-6 py-5 text-left text-foreground">
                  <span className="pr-4 font-medium">{faq.q}</span>
                  <ChevronDown size={16} className={`shrink-0 text-muted-foreground transition-transform duration-200 ${openFaq === i ? "rotate-180" : ""}`} />
                </button>
                <motion.div
                  initial={false}
                  animate={{ height: openFaq === i ? "auto" : 0, opacity: openFaq === i ? 1 : 0 }}
                  className="overflow-hidden">
                  <div className="border-t border-border/30 px-6 pb-5 pt-4">
                    <p className="text-sm leading-relaxed text-muted-foreground">{faq.a}</p>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="border-t border-border/50 py-28" style={{ background: "var(--gradient-hero)" }}>
        <div className="mx-auto max-w-3xl px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary" style={{ boxShadow: "var(--shadow-glow)" }}>
              <Globe2 size={28} />
            </div>
            <h2 className="text-3xl font-bold sm:text-4xl lg:text-5xl">
              Your next customer could be <span className="text-gradient">anywhere</span>
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Start accepting international payments in minutes. No foreign bank account required.
            </p>
            <div className="mt-10 flex flex-col justify-center gap-4 sm:flex-row">
              <Button size="lg" className="gap-2 px-8" style={{ boxShadow: "var(--shadow-glow)" }} asChild>
                <Link to="/login">Get Started Free <ArrowRight size={18} /></Link>
              </Button>
              <Button size="lg" variant="outline" className="gap-2 border-border px-8 text-foreground hover:bg-secondary" asChild>
                <Link to="/contact-sales">Talk to Sales <ArrowUpRight size={14} /></Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default InternationalPaymentsPage;
