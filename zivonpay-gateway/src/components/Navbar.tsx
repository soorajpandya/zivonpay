import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import zivonpayLogo from "@/assets/zivonpay-logo.png";

const productLinks = [
  { label: "Payment Gateway", href: "/payment-gateway" },
  { label: "Recurring Payments", href: "/recurring-payments-suite" },
  { label: "International Payments", href: "/international-payments" },
  { label: "UPI Payments", href: "/upi-payment-gateway" },
  { label: "Payouts", href: "/payouts" },
  { label: "Native OTP", href: "/native-otp" },
  { label: "EMI", href: "/emi" },
  { label: "Buy Now Pay Later", href: "/buy-now-pay-later" },
  { label: "QR Codes", href: "/qr-codes" },
  { label: "Payment Links", href: "/web-payment-links" },
];

const navLinks = [
  { label: "Pricing", href: "/pricing" },
  { label: "Developers", href: "/developer-guide" },
  { label: "Blog", href: "/blog" },
  { label: "About Us", href: "/about-us" },
];

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link to="/">
          <img src={zivonpayLogo} alt="ZivonPay" className="h-14 w-auto" />
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {/* Products dropdown */}
          <div
            className="relative"
            onMouseEnter={() => setProductsOpen(true)}
            onMouseLeave={() => setProductsOpen(false)}
          >
            <button className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground">
              Products <ChevronDown size={14} />
            </button>
            <AnimatePresence>
              {productsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="absolute left-0 top-full mt-2 w-56 rounded-lg border border-border bg-card p-2 shadow-xl"
                >
                  {productLinks.map((link) => (
                    <Link
                      key={link.href}
                      to={link.href}
                      className="block rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.href}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" asChild>
            <Link to="/login">Log In</Link>
          </Button>
        </div>

        <button onClick={() => setMobileOpen(!mobileOpen)} className="text-foreground md:hidden">
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-border/50 bg-background md:hidden"
          >
            <div className="flex flex-col gap-3 px-6 py-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Products</p>
              {productLinks.slice(0, 5).map((link) => (
                <Link key={link.href} to={link.href} className="text-sm text-muted-foreground" onClick={() => setMobileOpen(false)}>
                  {link.label}
                </Link>
              ))}
              <div className="my-2 border-t border-border/50" />
              {navLinks.map((link) => (
                <Link key={link.label} to={link.href} className="text-sm text-muted-foreground" onClick={() => setMobileOpen(false)}>
                  {link.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
