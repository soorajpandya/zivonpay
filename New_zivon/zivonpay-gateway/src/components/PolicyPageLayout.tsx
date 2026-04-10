import { motion } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface PolicyPageLayoutProps {
  title: string;
  lastUpdated?: string;
  children: React.ReactNode;
}

const PolicyPageLayout = ({ title, lastUpdated, children }: PolicyPageLayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <section className="pt-24">
        <div className="border-b border-border/50 py-16" style={{ background: "var(--gradient-hero)" }}>
          <div className="mx-auto max-w-4xl px-6">
            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-bold lg:text-5xl" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              {title}
            </motion.h1>
            {lastUpdated && (
              <p className="mt-4 text-sm text-muted-foreground">Last updated: {lastUpdated}</p>
            )}
          </div>
        </div>
        <div className="mx-auto max-w-4xl px-6 py-16">
          <div className="prose prose-invert max-w-none text-muted-foreground [&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-foreground [&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-lg [&_h3]:font-medium [&_h3]:text-foreground [&_p]:mb-4 [&_p]:leading-relaxed [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:space-y-2 [&_li]:text-muted-foreground">
            {children}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default PolicyPageLayout;
