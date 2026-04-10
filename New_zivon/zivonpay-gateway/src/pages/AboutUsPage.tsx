import { motion } from "framer-motion";
import {
  Users, Globe2, Shield, Zap, Target, Heart, TrendingUp,
  Building2, CheckCircle2, ArrowRight, Rocket,
  Eye, Lightbulb, HandshakeIcon, Sparkles, BarChart3, Clock
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import aboutHero from "@/assets/about-hero.jpg";
import aboutStory from "@/assets/about-story.jpg";
import aboutEcosystem from "@/assets/about-ecosystem.jpg";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } }),
};

const stats = [
  { icon: Building2, value: "2020", label: "Founded" },
  { icon: Users, value: "5,00,000+", label: "Businesses Trust Us" },
  { icon: BarChart3, value: "₹2L Cr+", label: "Annual TPV" },
  { icon: Zap, value: "99.99%", label: "Uptime" },
  { icon: Globe2, value: "100+", label: "Payment Modes" },
  { icon: Clock, value: "24/7", label: "Support" },
];

const values = [
  { icon: Heart, title: "Customer Obsession", desc: "Every product decision begins with the merchant. We obsess over simplifying payments so businesses can focus on what they do best.", gradient: "from-pink-500/20 to-rose-500/10" },
  { icon: Shield, title: "Trust & Transparency", desc: "No hidden fees, no surprise charges. We believe in clear pricing, bank-grade security, and earning trust through consistent reliability.", gradient: "from-emerald-500/20 to-teal-500/10" },
  { icon: Lightbulb, title: "Relentless Innovation", desc: "From AI-powered fraud detection to instant settlements, we constantly push the boundaries of what a payment gateway can do.", gradient: "from-amber-500/20 to-yellow-500/10" },
  { icon: HandshakeIcon, title: "Partnership Mindset", desc: "We don't just process payments — we grow with our merchants. Your success is our success, and we invest deeply in every relationship.", gradient: "from-blue-500/20 to-cyan-500/10" },
  { icon: Globe2, title: "Financial Inclusion", desc: "We're democratizing digital payments for businesses of every size — from the corner kirana store to India's largest enterprises.", gradient: "from-violet-500/20 to-purple-500/10" },
  { icon: Rocket, title: "Speed & Agility", desc: "In fintech, speed matters. We ship fast, iterate faster, and ensure our merchants always have access to the latest payment technology.", gradient: "from-orange-500/20 to-red-500/10" },
];

const milestones = [
  { year: "2020", title: "ZivonPay Founded", desc: "Started with a vision to simplify digital payments for Indian businesses. Launched our first payment gateway with UPI and card support.", icon: Sparkles },
  { year: "2021", title: "10,000 Merchants", desc: "Crossed 10,000 active merchants. Launched recurring payments, EMI options, and instant refunds. Achieved PCI DSS Level 1 certification.", icon: Users },
  { year: "2022", title: "₹10,000 Cr TPV", desc: "Processed over ₹10,000 crore in transactions. Expanded to 50+ payment modes including BNPL, wallets, and international cards.", icon: TrendingUp },
  { year: "2023", title: "AI & Automation", desc: "Launched AI-powered fraud detection, smart routing engine, and accounting automation. Reached 2,00,000+ merchants across India.", icon: Zap },
  { year: "2024", title: "International Expansion", desc: "Enabled cross-border payments in 20+ currencies. Launched ZivonPay Connect for marketplace payouts and split settlements.", icon: Globe2 },
  { year: "2025", title: "5,00,000+ Merchants", desc: "Crossed half a million merchants. Launched instant settlements, priority support tiers, and the ZivonPay developer platform.", icon: Rocket },
];

const whyZivonPay = [
  { icon: Zap, title: "Instant Settlements", desc: "Get your money within minutes, not days. Our instant settlement engine processes payouts 24/7, including weekends and holidays." },
  { icon: TrendingUp, title: "Industry-Best Success Rates", desc: "Our intelligent routing and smart retry engine delivers 99.9%+ payment success rates — the highest in the Indian payment ecosystem." },
  { icon: Shield, title: "Bank-Grade Security", desc: "PCI DSS Level 1 certified with 256-bit SSL encryption, tokenization, and AI-powered real-time fraud detection." },
  { icon: Building2, title: "Built for Scale", desc: "From processing 10 transactions a day to 10 million — our infrastructure scales seamlessly with your business growth." },
  { icon: Users, title: "Dedicated Support", desc: "Every merchant gets a dedicated account manager. Our 24/7 support team resolves issues within minutes, not hours." },
  { icon: Globe2, title: "100+ Payment Modes", desc: "UPI, cards, net banking, wallets, EMI, BNPL, QR codes, international payments — accept every way your customers want to pay." },
];

const AboutUsPage = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      {/* Hero — Full width with overlay */}
      <section className="relative pt-24 pb-0 overflow-hidden">
        <div className="absolute inset-0" style={{ background: "var(--gradient-hero)" }} />
        <div className="absolute inset-0 bg-grid-pattern opacity-20" />
        {/* Glow orbs */}
        <div className="absolute left-1/4 top-1/3 h-[400px] w-[400px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="absolute right-1/4 bottom-0 h-[300px] w-[300px] rounded-full bg-primary/8 blur-[100px]" />

        <div className="container mx-auto px-4 relative z-10 py-20 lg:py-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }}>
              <motion.span
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6 border border-primary/20"
              >
                <Sparkles className="w-4 h-4" /> About ZivonPay
              </motion.span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight mb-6">
                Powering India's <br />
                <span className="text-gradient">Digital Payments</span>
                <br />Revolution
              </h1>
              <p className="text-lg text-muted-foreground mb-8 max-w-xl leading-relaxed">
                ZivonPay is India's fastest-growing payment gateway, trusted by over 5,00,000 businesses. We're on a mission to make digital payments accessible, reliable, and effortless for every business in India — from solo entrepreneurs to the largest enterprises.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button size="lg" className="gap-2 font-semibold px-8 shadow-lg" style={{ boxShadow: "var(--shadow-glow)" }} asChild>
                  <Link to="/contact-sales">Talk to Sales <ArrowRight className="w-4 h-4" /></Link>
                </Button>
                <Button size="lg" variant="outline" className="font-semibold px-8 border-border hover:bg-secondary" asChild>
                  <Link to="/pricing">View Pricing</Link>
                </Button>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="relative"
            >
              <div className="absolute -inset-4 bg-gradient-to-br from-primary/20 via-transparent to-primary/10 rounded-3xl blur-2xl" />
              <img src={aboutHero} alt="ZivonPay Digital Payments" className="rounded-2xl shadow-2xl w-full relative z-10 border border-border/30" style={{ boxShadow: "var(--shadow-glow)" }} />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats — Glassmorphism cards */}
      <section className="py-12 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-card/80 to-background" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {stats.map((s, i) => (
              <motion.div key={i} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
                className="text-center bg-card/60 backdrop-blur-sm border border-border/30 rounded-xl p-5 hover:border-primary/30 transition-all">
                <s.icon className="w-5 h-5 text-primary mx-auto mb-2" />
                <div className="text-2xl md:text-3xl font-bold text-primary">{s.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Story — Side by side with image */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="absolute -inset-3 bg-gradient-to-tr from-primary/15 via-transparent to-primary/5 rounded-3xl blur-xl" />
              <img src={aboutStory} alt="ZivonPay Growth Story" className="rounded-2xl border border-border/30 w-full relative z-10" style={{ boxShadow: "var(--shadow-card)" }} />
              {/* Floating stat badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="absolute -bottom-6 -right-4 md:right-6 z-20 bg-card border border-primary/30 rounded-xl px-5 py-3 shadow-lg"
                style={{ boxShadow: "var(--shadow-glow)" }}
              >
                <div className="text-2xl font-bold text-primary">₹2L Cr+</div>
                <div className="text-xs text-muted-foreground">Annual Transaction Volume</div>
              </motion.div>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <span className="text-primary font-semibold text-sm uppercase tracking-wider">Our Story</span>
              <h2 className="text-3xl md:text-4xl font-bold mt-3 mb-6">From a Simple Idea to India's Most Trusted Payment Gateway</h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  ZivonPay was born out of frustration. Our founders, while building their own e-commerce businesses, struggled with payment gateways that were slow, unreliable, and had poor developer documentation. They knew there had to be a better way.
                </p>
                <p>
                  In 2020, with a small team of engineers and fintech enthusiasts, ZivonPay was launched with a single goal: <span className="text-foreground font-medium">build the payment gateway we wished existed.</span> One that's fast, transparent, developer-friendly, and works for businesses of every size.
                </p>
                <p>
                  What started as a lean startup has grown into a platform trusted by over <span className="text-primary font-semibold">5 lakh businesses</span> — from D2C brands and SaaS companies to healthcare providers, educational institutions, and government agencies.
                </p>
                <p>
                  But we're just getting started. Our vision is to become the default payment infrastructure for every business in India, and eventually, the world.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Mission & Vision — Large dramatic cards */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-card/30" />
        <div className="absolute left-0 top-1/2 h-[500px] w-[500px] -translate-y-1/2 rounded-full bg-primary/3 blur-[150px]" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              className="relative bg-card border border-border/50 rounded-2xl p-8 md:p-10 overflow-hidden group hover:border-primary/30 transition-all">
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full" />
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                  <Target className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Our Mission</h3>
                <p className="text-muted-foreground leading-relaxed">
                  To empower every business in India with simple, secure, and intelligent payment infrastructure. We believe that seamless payments should never be a barrier to growth — whether you're a solo entrepreneur accepting your first online payment or an enterprise processing millions daily.
                </p>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
              className="relative bg-card border border-border/50 rounded-2xl p-8 md:p-10 overflow-hidden group hover:border-primary/30 transition-all">
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-primary/10 to-transparent rounded-bl-full" />
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
                  <Eye className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Our Vision</h3>
                <p className="text-muted-foreground leading-relaxed">
                  To become India's most trusted and innovative payment platform — the invisible infrastructure that powers commerce across the nation. We envision a future where every transaction is instant, every settlement is same-day, and every business has access to enterprise-grade payment technology.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Why ZivonPay — Enhanced cards with hover glow */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
            <span className="text-primary font-semibold text-sm uppercase tracking-wider">Why Businesses Choose Us</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-3">The ZivonPay Advantage</h2>
            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">Here's why over 5 lakh businesses trust ZivonPay to power their payments.</p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {whyZivonPay.map((item, i) => (
              <motion.div key={i} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
                className="relative bg-card border border-border/50 rounded-xl p-6 hover:border-primary/30 transition-all group overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 group-hover:scale-110 transition-all">
                    <item.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Values — Gradient accent cards */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-card/30 via-background to-card/30" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
            <span className="text-primary font-semibold text-sm uppercase tracking-wider">What Drives Us</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-3">Our Core Values</h2>
            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">These aren't just words on a wall — they're the principles that guide every decision we make.</p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {values.map((v, i) => (
              <motion.div key={i} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
                className="relative bg-card border border-border/50 rounded-xl p-6 hover:border-primary/30 transition-all group overflow-hidden">
                <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${v.gradient}`} />
                <div className="relative z-10">
                  <v.icon className="w-8 h-8 text-primary mb-4 group-hover:scale-110 transition-transform" />
                  <h3 className="font-bold text-lg mb-2">{v.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Journey Timeline — Visual timeline with icons */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
            <span className="text-primary font-semibold text-sm uppercase tracking-wider">Our Journey</span>
            <h2 className="text-3xl md:text-4xl font-bold mt-3">Key Milestones</h2>
            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">From day one to today — the milestones that shaped ZivonPay into what it is.</p>
          </motion.div>
          <div className="max-w-3xl mx-auto">
            {milestones.map((m, i) => (
              <motion.div key={i} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
                className="flex gap-6 mb-0 group">
                <div className="flex flex-col items-center">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 border-2 border-primary/30 flex items-center justify-center shrink-0 group-hover:bg-primary/20 group-hover:border-primary/50 transition-all">
                    <m.icon className="w-6 h-6 text-primary" />
                  </div>
                  {i < milestones.length - 1 && (
                    <div className="w-px flex-1 bg-gradient-to-b from-primary/30 to-border/30 mt-2" />
                  )}
                </div>
                <div className="pb-10">
                  <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">{m.year}</span>
                  <h3 className="font-bold text-lg mt-2 mb-1">{m.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{m.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Ecosystem — Image + checklist */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-card/50 via-background to-primary/5" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
              <span className="text-primary font-semibold text-sm uppercase tracking-wider">Our Ecosystem</span>
              <h2 className="text-3xl md:text-4xl font-bold mt-3 mb-6">More Than Just a Payment Gateway</h2>
              <p className="text-muted-foreground leading-relaxed mb-8">
                ZivonPay is a complete payment ecosystem. Beyond accepting payments, we help businesses with payouts, settlements, reconciliation, analytics, fraud prevention, and compliance — all from a single dashboard.
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  "Payment Gateway with 100+ modes",
                  "Instant settlements & payouts",
                  "Subscription & recurring billing",
                  "AI-powered fraud detection",
                  "Developer-friendly APIs & SDKs",
                  "Real-time analytics dashboard",
                  "Marketplace split settlements",
                  "PCI DSS Level 1 certified",
                ].map((item, i) => (
                  <motion.div key={i} custom={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
                    className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-1 shrink-0" />
                    <span className="text-sm text-muted-foreground">{item}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="absolute -inset-4 bg-gradient-to-br from-primary/15 via-transparent to-primary/10 rounded-3xl blur-2xl" />
              <img src={aboutEcosystem} alt="ZivonPay Ecosystem" className="rounded-2xl border border-border/30 w-full relative z-10" style={{ boxShadow: "var(--shadow-glow)" }} />
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background" />
        <div className="absolute right-0 top-0 h-[400px] w-[400px] rounded-full bg-primary/5 blur-[120px]" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <Sparkles className="w-8 h-8 text-primary mx-auto mb-6" />
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-muted-foreground mb-10 max-w-xl mx-auto text-lg">Join 5,00,000+ businesses that trust ZivonPay to power their payments. Start accepting payments in under 30 minutes.</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button size="lg" className="gap-2 font-semibold px-10 text-base shadow-lg" style={{ boxShadow: "var(--shadow-glow)" }} asChild>
                <Link to="/login">Get Started Free <ArrowRight className="w-4 h-4" /></Link>
              </Button>
              <Button size="lg" variant="outline" className="font-semibold px-10 text-base border-primary/30 text-primary hover:bg-primary/10" asChild>
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

export default AboutUsPage;
