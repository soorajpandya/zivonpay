import { Link } from "react-router-dom";
import zivonpayLogo from "@/assets/zivonpay-logo.png";

const footerLinks = {
  Products: [
    { label: "Payment Gateway", href: "/payment-gateway" },
    { label: "UPI Payments", href: "/upi-payment-gateway" },
    { label: "Recurring Payments", href: "/recurring-payments-suite" },
    { label: "International Payments", href: "/international-payments" },
    { label: "Payment Links", href: "/web-payment-links" },
    { label: "Payouts", href: "/payouts" },
  ],
  Solutions: [
    { label: "EMI", href: "/emi" },
    { label: "Buy Now Pay Later", href: "/buy-now-pay-later" },
    { label: "QR Codes", href: "/qr-codes" },
    { label: "POS Device", href: "/pos-device" },
    { label: "Token Hub", href: "/token-hub" },
    { label: "Offer Engine", href: "/offer-engine" },
  ],
  Company: [
    { label: "About Us", href: "/about-us" },
    { label: "Blog", href: "/blog" },
    { label: "Pricing", href: "/pricing" },
    { label: "Developer Guide", href: "/developer-guide" },
    { label: "Cyber Security", href: "/cyber-security" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "/privacy-policy" },
    { label: "ZivonPay Policies", href: "/zivonpay-policies" },
    { label: "Terms & Conditions", href: "/online-pa-tncs" },
    { label: "Responsible Disclosure", href: "/responsible-disclosure-policy" },
  ],
};

const Footer = () => {
  return (
    <footer className="border-t border-border/50 bg-card/30">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-1">
            <div>
              <img src={zivonpayLogo} alt="ZivonPay" className="h-12 w-auto" />
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              India's most reliable payment gateway for businesses of all sizes.
            </p>
          </div>

          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-sm font-semibold text-foreground">{title}</h4>
              <ul className="mt-4 space-y-2.5">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link to={link.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border/50 pt-8 sm:flex-row">
          <p className="text-xs text-muted-foreground">© 2025 ZivonPay. All rights reserved.</p>
          <div className="flex gap-6">
            <Link to="/privacy-policy" className="text-xs text-muted-foreground hover:text-foreground">Privacy</Link>
            <Link to="/online-pa-tncs" className="text-xs text-muted-foreground hover:text-foreground">Terms</Link>
            <Link to="/cyber-security" className="text-xs text-muted-foreground hover:text-foreground">Security</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;