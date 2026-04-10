import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import developerImg from "@/assets/hero-developer.jpg";


const codeSnippet = `// Initialize ZivonPay
const zivonpay = new ZivonPay({
  key: "zp_live_xxxxxxxxxxxxx",
  environment: "production"
});

// Create a payment order
const order = await zivonpay.orders.create({
  amount: 50000, // ₹500.00
  currency: "INR",
  receipt: "order_rcpt_1",
  notes: {
    customer: "Rahul Sharma"
  }
});

// Open checkout
zivonpay.checkout.open({
  orderId: order.id,
  onSuccess: (response) => {
    console.log("Payment successful!", response);
  }
});`;

const DeveloperSection = () => {
  return (
    <section id="developers" className="relative py-24">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-sm font-medium uppercase tracking-wider text-primary">For Developers</p>
            <h2 className="mt-3 text-3xl font-bold lg:text-5xl" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              Integrate in{" "}
              <span className="text-gradient">minutes</span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              Clean, well-documented APIs with SDKs for every major platform. Go live with just a few lines of code.
            </p>
            
            <div className="mt-6 overflow-hidden rounded-xl border border-border/50">
              <img 
                src={developerImg} 
                alt="Developer Integration" 
                className="h-48 w-full object-cover transition-transform duration-500 hover:scale-105"
              />
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              {["Node.js", "Python", "PHP", "Java", "React", "Flutter"].map((tech) => (
                <span key={tech} className="rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                  {tech}
                </span>
              ))}
            </div>
            <Button className="mt-8 gap-2 bg-primary text-primary-foreground hover:bg-primary/90" size="lg" asChild>
              <Link to="/developer-guide">Read API Docs <ArrowRight size={18} /></Link>
            </Button>
          </motion.div>


          <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <div className="overflow-hidden rounded-xl border border-border/50" style={{ boxShadow: "var(--shadow-card)" }}>
              <div className="flex items-center gap-2 border-b border-border/50 bg-card px-4 py-3">
                <div className="h-3 w-3 rounded-full bg-destructive/60" />
                <div className="h-3 w-3 rounded-full bg-primary/40" />
                <div className="h-3 w-3 rounded-full bg-primary/60" />
                <span className="ml-2 text-xs text-muted-foreground">checkout.js</span>
              </div>
              <pre className="overflow-x-auto bg-card/80 p-6 text-sm leading-relaxed">
                <code className="text-muted-foreground">
                  {codeSnippet.split("\n").map((line, i) => (
                    <div key={i}>
                      <span className="mr-4 inline-block w-5 text-right text-muted-foreground/40 select-none">{i + 1}</span>
                      <span>
                        {line.includes("//") ? (
                          <span className="text-primary/60">{line}</span>
                        ) : line.includes('"') ? (
                          <span>
                            {line.split(/(["'][^"']*["'])/g).map((part, j) =>
                              part.startsWith('"') || part.startsWith("'") ? (
                                <span key={j} className="text-primary">{part}</span>
                              ) : (
                                <span key={j}>{part}</span>
                              )
                            )}
                          </span>
                        ) : (
                          line
                        )}
                      </span>
                    </div>
                  ))}
                </code>
              </pre>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default DeveloperSection;