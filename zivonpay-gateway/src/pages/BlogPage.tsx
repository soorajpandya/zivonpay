import { motion } from "framer-motion";
import { ArrowRight, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import heroImage from "@/assets/hero-analytics.jpg";

const posts = [
  { title: "Understanding UPI 2.0 and Its Impact on Indian Payments", category: "Industry", date: "Feb 15, 2025", excerpt: "A deep dive into the latest UPI features and how they're transforming digital payments in India." },
  { title: "How to Reduce Payment Failures by 40%", category: "Engineering", date: "Feb 10, 2025", excerpt: "Practical strategies to improve your payment success rates using intelligent routing and retry logic." },
  { title: "The Rise of Buy Now Pay Later in India", category: "Trends", date: "Feb 5, 2025", excerpt: "BNPL adoption is growing rapidly. Here's what merchants need to know about offering BNPL options." },
  { title: "PCI DSS 4.0: What Changes for Merchants", category: "Security", date: "Jan 28, 2025", excerpt: "Key changes in PCI DSS 4.0 and how ZivonPay helps you stay compliant automatically." },
  { title: "Building a Subscription Business with ZivonPay", category: "Guide", date: "Jan 20, 2025", excerpt: "Step-by-step guide to setting up recurring payments, dunning management, and subscription analytics." },
  { title: "International Payments: Expanding Beyond Borders", category: "Growth", date: "Jan 15, 2025", excerpt: "How to accept international payments and navigate cross-border payment regulations." },
];

const BlogPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="pt-24" style={{ background: "var(--gradient-hero)" }}>
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="text-4xl font-bold lg:text-6xl" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                ZivonPay <span className="text-gradient">Blog</span>
              </motion.h1>
              <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="mt-4 max-w-xl text-muted-foreground">
                Insights, guides, and news from the world of digital payments.
              </motion.p>
            </div>
            <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
              className="hidden lg:block">
              <div className="overflow-hidden rounded-xl border border-border/30 shadow-2xl" style={{ boxShadow: "var(--shadow-card)" }}>
                <img src={heroImage} alt="Blog" className="h-auto w-full object-cover" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post, i) => (
              <motion.article key={post.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                className="group cursor-pointer rounded-xl border border-border/50 bg-card p-6 transition-all hover:border-primary/30"
                style={{ boxShadow: "var(--shadow-card)" }}>
                <div className="mb-4 inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  {post.category}
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground transition-colors group-hover:text-primary"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  {post.title}
                </h3>
                <p className="mb-4 text-sm leading-relaxed text-muted-foreground">{post.excerpt}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar size={12} /> {post.date}
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default BlogPage;