import { motion } from "framer-motion";
import {
  Code, Book, Zap, Shield, Globe2, Users, ArrowRight, Terminal, Copy, Check,
  ExternalLink, FileCode2, Webhook, TestTube2, Key, Braces, Lock, AlertTriangle,
  Clock, Server, ChevronRight, ToggleLeft, ChevronDown, Hash, ArrowUpRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useState, useRef, useEffect } from "react";

// ─── Environment Mode ───────────────────────────────────────────
type EnvMode = "sandbox" | "production";

const envConfig = {
  sandbox: {
    label: "Sandbox",
    baseUrl: "https://sandbox.api.zivonpay.com",
    keyPrefix: "zp_test_",
    sampleKey: "zp_test_aBcDeFgHiJkLmNoPqR",
    sampleSecret: "zp_secret_test_xxxxxxxxxxxxxxxx",
    webhookSecret: "whsec_test_xxxxxxxxxxxxxxx",
    checkoutUrl: "https://sandbox.checkout.zivonpay.com/v1/checkout.js",
    dashboardUrl: "https://sandbox.dashboard.zivonpay.com",
    color: "text-yellow-400",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/20",
    dot: "bg-yellow-400",
  },
  production: {
    label: "Production",
    baseUrl: "https://api.zivonpay.com",
    keyPrefix: "zp_live_",
    sampleKey: "zp_live_aBcDeFgHiJkLmNoPqR",
    sampleSecret: "zp_secret_live_xxxxxxxxxxxxxxxx",
    webhookSecret: "whsec_live_xxxxxxxxxxxxxxx",
    checkoutUrl: "https://checkout.zivonpay.com/v1/checkout.js",
    dashboardUrl: "https://dashboard.zivonpay.com",
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/20",
    dot: "bg-primary",
  },
};

// ─── Sidebar Nav Items ──────────────────────────────────────────
const navSections = [
  { id: "getting-started", label: "Getting Started", icon: Zap },
  { id: "authentication", label: "Authentication", icon: Lock },
  { id: "quick-start", label: "Quick Start", icon: Terminal },
  { id: "api-reference", label: "API Reference", icon: FileCode2 },
  { id: "webhooks", label: "Webhooks", icon: Webhook },
  { id: "sdks", label: "SDKs & Libraries", icon: Code },
  { id: "testing", label: "Testing & Sandbox", icon: TestTube2 },
  { id: "error-codes", label: "Error Codes", icon: AlertTriangle },
  { id: "rate-limits", label: "Rate Limits", icon: Clock },
  { id: "changelog", label: "Changelog", icon: Hash },
];

// ─── Code Data ──────────────────────────────────────────────────
const getInstallCodes = () => ({
  "Node.js": "npm install @zivonpay/node",
  Python: "pip install zivonpay",
  PHP: "composer require zivonpay/zivonpay-php",
  Java: `<dependency>
  <groupId>com.zivonpay</groupId>
  <artifactId>zivonpay-java</artifactId>
  <version>1.3.12</version>
</dependency>`,
  Go: "go get github.com/zivonpay/zivonpay-go",
  Ruby: "gem install zivonpay",
});

const getInitCode = (env: EnvMode) => `import ZivonPay from '@zivonpay/node';

const zivonpay = new ZivonPay({
  key_id: '${envConfig[env].sampleKey}',
  key_secret: '${envConfig[env].sampleSecret}',
});`;

const getCreateOrderCode = (env: EnvMode) => `// POST ${envConfig[env].baseUrl}/v1/orders
const order = await zivonpay.orders.create({
  amount: 50000,       // Amount in paise (₹500.00)
  currency: 'INR',
  receipt: 'order_rcpt_1',
  payment_capture: 1,  // Auto-capture
  notes: {
    customer_name: 'Rahul Sharma',
    customer_email: 'rahul@example.com',
    business_id: 'biz_123'
  }
});

// Response
{
  "id": "order_EKwxwAgItmmXdp",
  "entity": "order",
  "amount": 50000,
  "currency": "INR",
  "receipt": "order_rcpt_1",
  "status": "created",
  "created_at": 1709049451
}`;

const getCheckoutCode = (env: EnvMode) => `<script src="${envConfig[env].checkoutUrl}"></script>

<script>
const options = {
  key: '${envConfig[env].sampleKey}',
  amount: order.amount,
  currency: 'INR',
  name: 'Acme Corp',
  description: 'Premium Plan Subscription',
  image: 'https://your-logo.com/logo.png',
  order_id: order.id,
  handler: function (response) {
    // Send to your server for verification
    fetch('/api/verify-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_id: response.zivonpay_order_id,
        payment_id: response.zivonpay_payment_id,
        signature: response.zivonpay_signature
      })
    });
  },
  prefill: {
    name: 'Rahul Sharma',
    email: 'rahul@example.com',
    contact: '9876543210'
  },
  theme: { color: '#10B981' }
};

const checkout = new ZivonPay(options);
checkout.open();
</script>`;

const getVerifyCode = (env: EnvMode) => `const crypto = require('crypto');

function verifyPaymentSignature(orderId, paymentId, signature) {
  const body = orderId + '|' + paymentId;
  
  const expectedSignature = crypto
    .createHmac('sha256', '${envConfig[env].sampleSecret}')
    .update(body)
    .digest('hex');

  return expectedSignature === signature;
}

// Usage in your route handler
app.post('/api/verify-payment', (req, res) => {
  const { order_id, payment_id, signature } = req.body;
  
  const isValid = verifyPaymentSignature(
    order_id, payment_id, signature
  );

  if (isValid) {
    // Payment is verified — update your database
    res.json({ status: 'verified', payment_id });
  } else {
    res.status(400).json({ error: 'Invalid signature' });
  }
});`;

const getAuthCode = (env: EnvMode) => `// All API requests require HTTP Basic Auth
// Key ID as username, Key Secret as password

curl -u ${envConfig[env].sampleKey}:${envConfig[env].sampleSecret} \\
  ${envConfig[env].baseUrl}/v1/orders

// Or pass as Authorization header
const response = await fetch('${envConfig[env].baseUrl}/v1/orders', {
  headers: {
    'Authorization': 'Basic ' + btoa(
      '${envConfig[env].sampleKey}:${envConfig[env].sampleSecret}'
    ),
    'Content-Type': 'application/json'
  }
});`;

const getWebhookCode = (env: EnvMode) => `const crypto = require('crypto');

// Webhook endpoint
app.post('/webhooks/zivonpay', (req, res) => {
  const webhookSecret = '${envConfig[env].webhookSecret}';
  const signature = req.headers['x-zivonpay-signature'];
  const timestamp = req.headers['x-zivonpay-timestamp'];

  // 1. Verify timestamp (prevent replay attacks)
  const tolerance = 300; // 5 minutes
  const currentTime = Math.floor(Date.now() / 1000);
  if (Math.abs(currentTime - parseInt(timestamp)) > tolerance) {
    return res.status(400).json({ error: 'Timestamp expired' });
  }

  // 2. Verify signature
  const payload = timestamp + '.' + JSON.stringify(req.body);
  const expectedSig = crypto
    .createHmac('sha256', webhookSecret)
    .update(payload)
    .digest('hex');

  if (expectedSig !== signature) {
    return res.status(400).json({ error: 'Invalid signature' });
  }

  // 3. Process event
  const { event, payload: data } = req.body;

  switch (event) {
    case 'payment.authorized':
      // Payment authorized, capture if needed
      break;
    case 'payment.captured':
      // Payment successful — fulfill order
      await fulfillOrder(data.order_id);
      break;
    case 'payment.failed':
      // Payment failed — notify customer
      await notifyFailure(data.order_id, data.error_code);
      break;
    case 'refund.processed':
      // Refund completed
      await processRefund(data.refund_id);
      break;
    case 'subscription.charged':
      // Recurring payment collected
      break;
    case 'settlement.processed':
      // Funds settled to your bank
      break;
  }

  // Always return 200 to acknowledge receipt
  res.status(200).json({ received: true });
});`;

const getRefundCode = (env: EnvMode) => `// Full refund
const refund = await zivonpay.payments.refund(
  'pay_EKwxwAgItmmXdp',
  {
    amount: 50000,  // Full amount in paise
    speed: 'normal', // 'normal' or 'optimum'
    notes: {
      reason: 'Customer requested cancellation'
    }
  }
);

// Partial refund
const partialRefund = await zivonpay.payments.refund(
  'pay_EKwxwAgItmmXdp',
  {
    amount: 25000,  // ₹250 partial refund
    speed: 'optimum'
  }
);

// Response
{
  "id": "rfnd_FP8DDKxqJif6ca",
  "entity": "refund",
  "amount": 50000,
  "currency": "INR",
  "payment_id": "pay_EKwxwAgItmmXdp",
  "status": "processed",
  "speed_processed": "normal"
}`;

// ─── Data ───────────────────────────────────────────────────────
const sdks = [
  { name: "Node.js", pkg: "@zivonpay/node", version: "2.9.4", install: "npm install @zivonpay/node" },
  { name: "Python", pkg: "zivonpay", version: "1.4.2", install: "pip install zivonpay" },
  { name: "PHP", pkg: "zivonpay/zivonpay-php", version: "2.8.1", install: "composer require zivonpay/zivonpay-php" },
  { name: "Java", pkg: "com.zivonpay:zivonpay-java", version: "1.3.12", install: "Maven / Gradle" },
  { name: "Go", pkg: "zivonpay-go", version: "1.0.7", install: "go get github.com/zivonpay/zivonpay-go" },
  { name: "React Native", pkg: "@zivonpay/react-native", version: "2.5.0", install: "npm install @zivonpay/react-native" },
  { name: "Flutter", pkg: "zivonpay_flutter", version: "1.1.4", install: "flutter pub add zivonpay_flutter" },
  { name: "Ruby", pkg: "zivonpay", version: "3.0.3", install: "gem install zivonpay" },
];

const apiEndpoints = [
  { method: "POST", path: "/v1/orders", desc: "Create a payment order", auth: true },
  { method: "GET", path: "/v1/orders/:id", desc: "Fetch order by ID", auth: true },
  { method: "GET", path: "/v1/orders/:id/payments", desc: "Fetch payments for an order", auth: true },
  { method: "POST", path: "/v1/payments/:id/capture", desc: "Capture authorized payment", auth: true },
  { method: "GET", path: "/v1/payments/:id", desc: "Fetch payment details", auth: true },
  { method: "POST", path: "/v1/refunds", desc: "Create a refund", auth: true },
  { method: "GET", path: "/v1/refunds/:id", desc: "Fetch refund details", auth: true },
  { method: "POST", path: "/v1/subscriptions", desc: "Create subscription plan", auth: true },
  { method: "GET", path: "/v1/subscriptions/:id", desc: "Fetch subscription", auth: true },
  { method: "POST", path: "/v1/subscriptions/:id/cancel", desc: "Cancel subscription", auth: true },
  { method: "GET", path: "/v1/settlements", desc: "List settlements", auth: true },
  { method: "GET", path: "/v1/settlements/:id", desc: "Fetch settlement details", auth: true },
  { method: "POST", path: "/v1/payouts", desc: "Initiate a payout", auth: true },
  { method: "POST", path: "/v1/payment_links", desc: "Create payment link", auth: true },
  { method: "POST", path: "/v1/customers", desc: "Create customer", auth: true },
  { method: "POST", path: "/v1/virtual_accounts", desc: "Create virtual account", auth: true },
];

const errorCodes = [
  { code: "BAD_REQUEST_ERROR", status: 400, desc: "Request is malformed or missing required fields.", action: "Check request body and parameters." },
  { code: "UNAUTHORIZED", status: 401, desc: "Invalid API key or credentials.", action: "Verify your key_id and key_secret." },
  { code: "FORBIDDEN", status: 403, desc: "You don't have permission for this resource.", action: "Check your account permissions." },
  { code: "NOT_FOUND", status: 404, desc: "Requested resource does not exist.", action: "Verify the resource ID." },
  { code: "CONFLICT", status: 409, desc: "Duplicate request or conflicting state.", action: "Use idempotency keys." },
  { code: "RATE_LIMIT_EXCEEDED", status: 429, desc: "Too many requests in a given time window.", action: "Implement exponential backoff." },
  { code: "SERVER_ERROR", status: 500, desc: "Unexpected server error.", action: "Retry with backoff. Contact support if persistent." },
  { code: "GATEWAY_ERROR", status: 502, desc: "Bank or payment network error.", action: "Retry the transaction." },
  { code: "PAYMENT_FAILED", status: 400, desc: "Payment could not be processed.", action: "Check error_description for details." },
  { code: "CARD_DECLINED", status: 400, desc: "Card issuer declined the transaction.", action: "Ask customer to use another card." },
];

const rateLimits = [
  { endpoint: "POST /v1/orders", sandbox: "100/min", production: "1,000/min" },
  { endpoint: "GET /v1/orders/:id", sandbox: "200/min", production: "5,000/min" },
  { endpoint: "POST /v1/payments/:id/capture", sandbox: "100/min", production: "1,000/min" },
  { endpoint: "POST /v1/refunds", sandbox: "50/min", production: "500/min" },
  { endpoint: "POST /v1/subscriptions", sandbox: "50/min", production: "500/min" },
  { endpoint: "GET /v1/settlements", sandbox: "100/min", production: "2,000/min" },
  { endpoint: "POST /v1/payouts", sandbox: "50/min", production: "500/min" },
  { endpoint: "Webhooks (outgoing)", sandbox: "Unlimited", production: "Unlimited" },
];

const changelog = [
  { version: "v2.9.0", date: "Feb 2026", title: "UPI AutoPay 2.0", desc: "Enhanced UPI recurring with mandate modifications and notifications.", type: "feature" },
  { version: "v2.8.0", date: "Jan 2026", title: "Instant Refunds", desc: "Process refunds to customer accounts within seconds.", type: "feature" },
  { version: "v2.7.2", date: "Dec 2025", title: "Webhook Retry Logic", desc: "Automatic retries with exponential backoff for failed webhook deliveries.", type: "improvement" },
  { version: "v2.7.0", date: "Nov 2025", title: "Payment Links API", desc: "Create and manage payment links programmatically.", type: "feature" },
  { version: "v2.6.1", date: "Oct 2025", title: "3DS 2.0 Support", desc: "Full EMVCo 3DS 2.0 compliance for card payments.", type: "security" },
  { version: "v2.6.0", date: "Sep 2025", title: "Virtual Accounts", desc: "Create virtual bank accounts for automated reconciliation.", type: "feature" },
];

const webhookEvents = [
  { event: "payment.authorized", desc: "Payment authorized, awaiting capture" },
  { event: "payment.captured", desc: "Payment successfully captured" },
  { event: "payment.failed", desc: "Payment attempt failed" },
  { event: "order.paid", desc: "Order fully paid" },
  { event: "refund.created", desc: "Refund initiated" },
  { event: "refund.processed", desc: "Refund processed to customer" },
  { event: "refund.failed", desc: "Refund could not be processed" },
  { event: "subscription.authenticated", desc: "Subscription authentication complete" },
  { event: "subscription.charged", desc: "Recurring charge collected" },
  { event: "subscription.halted", desc: "Subscription paused due to failures" },
  { event: "settlement.processed", desc: "Settlement transferred to bank" },
  { event: "payout.processed", desc: "Payout completed" },
  { event: "payout.failed", desc: "Payout could not be processed" },
  { event: "virtual_account.credited", desc: "Virtual account received funds" },
];

// ─── CodeBlock Component ────────────────────────────────────────
const CodeBlock = ({ code, filename, className = "" }: { code: string; filename?: string; className?: string }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`overflow-hidden rounded-lg border border-border/50 bg-[hsl(216_28%_6%)] ${className}`}>
      <div className="flex items-center justify-between border-b border-border/30 px-4 py-2">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-destructive/50" />
            <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/50" />
            <div className="h-2.5 w-2.5 rounded-full bg-primary/50" />
          </div>
          {filename && <span className="ml-2 font-mono text-[11px] text-muted-foreground">{filename}</span>}
        </div>
        <button onClick={handleCopy} className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] text-muted-foreground transition-colors hover:bg-secondary/50 hover:text-foreground">
          {copied ? <Check size={12} className="text-primary" /> : <Copy size={12} />}
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-[12.5px] leading-[1.7]">
        <code className="text-muted-foreground">
          {code.split("\n").map((line, i) => (
            <div key={i} className="flex">
              <span className="mr-4 inline-block w-6 select-none text-right text-muted-foreground/25 text-[11px]">{i + 1}</span>
              <span className="flex-1">
                {line.includes("//") ? (
                  <span className="text-muted-foreground/60 italic">{line}</span>
                ) : line.match(/['"][^'"]*['"]/g) ? (
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
  );
};

const MethodBadge = ({ method }: { method: string }) => {
  const styles: Record<string, string> = {
    GET: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    POST: "bg-primary/15 text-primary border-primary/30",
    PUT: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    DELETE: "bg-destructive/15 text-destructive border-destructive/30",
    PATCH: "bg-purple-500/15 text-purple-400 border-purple-500/30",
  };
  return (
    <span className={`inline-block rounded border px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${styles[method] || ""}`}>
      {method}
    </span>
  );
};

const StatusBadge = ({ status }: { status: number }) => {
  const color = status < 300 ? "text-primary" : status < 500 ? "text-yellow-400" : "text-destructive";
  return <span className={`font-mono text-xs font-bold ${color}`}>{status}</span>;
};

// ─── Main Component ─────────────────────────────────────────────
const DeveloperGuidePage = () => {
  const [env, setEnv] = useState<EnvMode>("sandbox");
  const [activeSection, setActiveSection] = useState("getting-started");
  const [sdkTab, setSdkTab] = useState("Node.js");
  const [expandedSdk, setExpandedSdk] = useState<string | null>(null);
  const [copiedValue, setCopiedValue] = useState<string | null>(null);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [testResult, setTestResult] = useState<null | { status: string; data: object; time: number }>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [testEndpoint, setTestEndpoint] = useState("POST /v1/orders");
  const config = envConfig[env];

  const copyValue = (val: string) => {
    navigator.clipboard.writeText(val.replace(/\s/g, ""));
    setCopiedValue(val);
    setTimeout(() => setCopiedValue(null), 2000);
  };

  const toggleCheck = (item: string) => {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(item)) next.delete(item); else next.add(item);
      return next;
    });
  };

  const runTestCall = () => {
    setTestLoading(true);
    setTestResult(null);
    const start = Date.now();
    setTimeout(() => {
      const elapsed = Date.now() - start;
      const responses: Record<string, object> = {
        "POST /v1/orders": {
          id: "order_EKwxwAgItmmXdp",
          entity: "order",
          amount: 50000,
          currency: "INR",
          receipt: "order_rcpt_1",
          status: "created",
          created_at: Math.floor(Date.now() / 1000),
        },
        "GET /v1/orders/:id": {
          id: "order_EKwxwAgItmmXdp",
          entity: "order",
          amount: 50000,
          currency: "INR",
          status: "paid",
          attempts: 1,
        },
        "POST /v1/refunds": {
          id: "rfnd_FP8DDKxqJif6ca",
          entity: "refund",
          amount: 50000,
          payment_id: "pay_EKwxwAgItmmXdp",
          status: "processed",
          speed_processed: "normal",
        },
        "GET /v1/payments/:id": {
          id: "pay_EKwxwAgItmmXdp",
          entity: "payment",
          amount: 50000,
          currency: "INR",
          status: "captured",
          method: "upi",
          vpa: "success@upi",
        },
      };
      setTestResult({
        status: "200 OK",
        data: responses[testEndpoint] || responses["POST /v1/orders"],
        time: elapsed + Math.floor(Math.random() * 80) + 40,
      });
      setTestLoading(false);
    }, 600 + Math.random() * 400);
  };

  // Track active section on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { rootMargin: "-100px 0px -60% 0px" }
    );

    navSections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden pt-24" style={{ background: "var(--gradient-hero)" }}>
        <div className="absolute inset-0 bg-grid-pattern opacity-15" />
        <div className="relative mx-auto max-w-7xl px-6 py-16 lg:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.1fr]">
            <div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary">
                <Terminal size={14} /> Developer Documentation
              </motion.div>
              <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="text-4xl font-bold lg:text-5xl xl:text-6xl">
                ZivonPay <span className="text-gradient">API Docs</span>
              </motion.h1>
              <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="mt-5 max-w-lg text-muted-foreground">
                Everything you need to accept payments, manage subscriptions, process refunds, and scale your business. Production & sandbox ready.
              </motion.p>

              {/* Environment Toggle */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                className="mt-6 inline-flex items-center rounded-lg border border-border/50 bg-card p-1">
                <button
                  onClick={() => setEnv("sandbox")}
                  className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all ${env === "sandbox" ? "bg-yellow-500/10 text-yellow-400" : "text-muted-foreground hover:text-foreground"}`}>
                  <TestTube2 size={14} /> Sandbox
                </button>
                <button
                  onClick={() => setEnv("production")}
                  className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all ${env === "production" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                  <Server size={14} /> Production
                </button>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="mt-6 flex flex-wrap gap-3">
                <Button size="lg" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90" style={{ boxShadow: "var(--shadow-glow)" }}
                  onClick={() => scrollTo("quick-start")}>
                  Quick Start <ArrowRight size={16} />
                </Button>
                <Button size="lg" variant="outline" className="gap-2 border-border text-foreground hover:bg-secondary"
                  onClick={() => scrollTo("api-reference")}>
                  <FileCode2 size={16} /> API Reference
                </Button>
              </motion.div>
            </div>

            <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
              className="hidden lg:block">
              <div className="mb-2 flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${config.dot}`} />
                <span className={`text-xs font-medium ${config.color}`}>
                  {config.label} Environment
                </span>
                <span className="font-mono text-[11px] text-muted-foreground/50">{config.baseUrl}</span>
              </div>
              <CodeBlock code={getInitCode(env)} filename="server.js" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Main Content with Sidebar */}
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-12 lg:grid-cols-[220px_1fr] xl:grid-cols-[240px_1fr]">
          {/* Sticky Sidebar */}
          <aside className="hidden lg:block">
            <nav className="sticky top-24 space-y-0.5 py-12">
              <div className="mb-4 flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${config.dot} animate-pulse`} />
                <span className={`text-xs font-semibold uppercase tracking-wider ${config.color}`}>{config.label}</span>
              </div>
              {navSections.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => scrollTo(id)}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-all ${
                    activeSection === id
                      ? "bg-primary/10 font-medium text-primary"
                      : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                  }`}>
                  <Icon size={14} />
                  {label}
                </button>
              ))}
            </nav>
          </aside>

          {/* Content Area */}
          <main className="min-w-0 pb-20 pt-12">
            {/* ── Getting Started ── */}
            <section id="getting-started" className="scroll-mt-24">
              <h2 className="text-2xl font-bold lg:text-3xl">Getting Started</h2>
              <p className="mt-3 text-muted-foreground">
                ZivonPay provides a complete set of APIs and SDKs to accept and manage payments for your business. Follow this guide to go from zero to accepting payments.
              </p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {[
                  { step: "1", title: "Create Account", desc: `Sign up at ${config.dashboardUrl} and get your API keys.` },
                  { step: "2", title: "Install SDK", desc: "Choose your platform and install the official SDK." },
                  { step: "3", title: "Create Order", desc: "Create a payment order on your server using the API." },
                  { step: "4", title: "Collect Payment", desc: "Use checkout.js to collect payment from your customer." },
                ].map((s) => (
                  <div key={s.step} className="rounded-xl border border-border/50 bg-card p-5 transition-all hover:border-primary/20" style={{ boxShadow: "var(--shadow-card)" }}>
                    <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">{s.step}</div>
                    <h4 className="font-semibold text-foreground">{s.title}</h4>
                    <p className="mt-1 text-sm text-muted-foreground">{s.desc}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8 rounded-xl border border-primary/20 bg-primary/5 p-5">
                <div className="flex items-start gap-3">
                  <Zap size={18} className="mt-0.5 shrink-0 text-primary" />
                  <div>
                    <h4 className="font-semibold text-foreground">Tip: Start with Sandbox</h4>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Use sandbox mode to test your integration without processing real transactions. Switch to production mode when you're ready to go live. All code examples on this page update based on your selected environment.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <hr className="my-16 border-border/30" />

            {/* ── Authentication ── */}
            <section id="authentication" className="scroll-mt-24">
              <h2 className="text-2xl font-bold lg:text-3xl">Authentication</h2>
              <p className="mt-3 text-muted-foreground">
                All API requests are authenticated using HTTP Basic Auth with your <code className="rounded bg-secondary px-1.5 py-0.5 text-xs text-primary">key_id</code> and <code className="rounded bg-secondary px-1.5 py-0.5 text-xs text-primary">key_secret</code>.
              </p>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-border/50 bg-card p-5">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Key size={14} className="text-primary" /> API Key ID
                  </div>
                  <code className={`mt-2 block rounded bg-secondary/50 px-3 py-2 font-mono text-sm ${config.color}`}>{config.sampleKey}</code>
                  <p className="mt-2 text-xs text-muted-foreground">Used as the username in Basic Auth</p>
                </div>
                <div className="rounded-xl border border-border/50 bg-card p-5">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <Lock size={14} className="text-primary" /> API Secret
                  </div>
                  <code className="mt-2 block rounded bg-secondary/50 px-3 py-2 font-mono text-sm text-foreground">{config.sampleSecret}</code>
                  <p className="mt-2 text-xs text-muted-foreground">Used as the password — never expose client-side</p>
                </div>
              </div>

              <div className="mt-6">
                <CodeBlock code={getAuthCode(env)} filename="authentication.sh" />
              </div>

              <div className="mt-4 rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle size={16} className="mt-0.5 shrink-0 text-yellow-400" />
                  <p className="text-sm text-muted-foreground">
                    <span className="font-semibold text-yellow-400">Security:</span> Never expose your <code className="text-xs">key_secret</code> in client-side code, version control, or logs. Use environment variables on your server.
                  </p>
                </div>
              </div>
            </section>

            <hr className="my-16 border-border/30" />

            {/* ── Quick Start ── */}
            <section id="quick-start" className="scroll-mt-24">
              <h2 className="text-2xl font-bold lg:text-3xl">Quick Start</h2>
              <p className="mt-3 text-muted-foreground">
                Accept your first payment in under 5 minutes. Follow these steps to create an order, open checkout, and verify payment.
              </p>

              {/* SDK Install Tabs */}
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-foreground">Step 1 — Install SDK</h3>
                <div className="mt-4 flex flex-wrap gap-1 rounded-lg border border-border/50 bg-card p-1">
                  {Object.keys(getInstallCodes()).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setSdkTab(lang)}
                      className={`rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                        sdkTab === lang ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
                      }`}>{lang}</button>
                  ))}
                </div>
                <div className="mt-3">
                  <CodeBlock code={getInstallCodes()[sdkTab as keyof ReturnType<typeof getInstallCodes>]} filename="terminal" />
                </div>
              </div>

              <div className="mt-10">
                <h3 className="text-lg font-semibold text-foreground">Step 2 — Create Order (Server-side)</h3>
                <p className="mt-2 text-sm text-muted-foreground">Create a payment order on your server. This generates a unique order ID for checkout.</p>
                <div className="mt-4">
                  <CodeBlock code={getCreateOrderCode(env)} filename="create-order.js" />
                </div>
              </div>

              <div className="mt-10">
                <h3 className="text-lg font-semibold text-foreground">Step 3 — Open Checkout (Client-side)</h3>
                <p className="mt-2 text-sm text-muted-foreground">Load the checkout script and collect payment from the customer.</p>
                <div className="mt-4">
                  <CodeBlock code={getCheckoutCode(env)} filename="checkout.html" />
                </div>
              </div>

              <div className="mt-10">
                <h3 className="text-lg font-semibold text-foreground">Step 4 — Verify Payment (Server-side)</h3>
                <p className="mt-2 text-sm text-muted-foreground">Always verify the payment signature on your server to ensure the payment is authentic.</p>
                <div className="mt-4">
                  <CodeBlock code={getVerifyCode(env)} filename="verify-payment.js" />
                </div>
              </div>
            </section>

            <hr className="my-16 border-border/30" />

            {/* ── API Reference ── */}
            <section id="api-reference" className="scroll-mt-24">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold lg:text-3xl">API Reference</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Base URL: <code className={`rounded bg-secondary px-2 py-1 font-mono text-xs ${config.color}`}>{config.baseUrl}</code>
                  </p>
                </div>
              </div>

              <div className="mt-8 overflow-hidden rounded-xl border border-border/50" style={{ boxShadow: "var(--shadow-card)" }}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/50 bg-secondary/20">
                        <th className="px-4 py-3 text-left font-semibold text-foreground">Method</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground">Endpoint</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground">Description</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground">Auth</th>
                      </tr>
                    </thead>
                    <tbody>
                      {apiEndpoints.map((ep) => (
                        <tr key={`${ep.method}-${ep.path}`} className="border-b border-border/20 transition-colors hover:bg-secondary/10">
                          <td className="px-4 py-3"><MethodBadge method={ep.method} /></td>
                          <td className="px-4 py-3 font-mono text-xs text-foreground">{ep.path}</td>
                          <td className="px-4 py-3 text-muted-foreground">{ep.desc}</td>
                          <td className="px-4 py-3">{ep.auth && <Lock size={12} className="text-primary" />}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Refund Example */}
              <div className="mt-10">
                <h3 className="text-lg font-semibold text-foreground">Example: Refunds</h3>
                <p className="mt-2 text-sm text-muted-foreground">Process full or partial refunds programmatically.</p>
                <div className="mt-4">
                  <CodeBlock code={getRefundCode(env)} filename="refund.js" />
                </div>
              </div>
            </section>

            <hr className="my-16 border-border/30" />

            {/* ── Webhooks ── */}
            <section id="webhooks" className="scroll-mt-24">
              <h2 className="text-2xl font-bold lg:text-3xl">Webhooks</h2>
              <p className="mt-3 text-muted-foreground">
                Receive real-time notifications for payment events. Configure your webhook URL in the <a href="#" className="text-primary hover:underline">Dashboard → Settings → Webhooks</a>.
              </p>

              <div className="mt-6 grid gap-8 xl:grid-cols-[1fr_1.2fr]">
                <div>
                  <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Available Events</h4>
                  <div className="space-y-1.5">
                    {webhookEvents.map((w) => (
                      <div key={w.event} className="flex items-center justify-between rounded-lg border border-border/30 bg-card px-3 py-2 transition-colors hover:border-primary/20">
                        <div className="flex items-center gap-2.5">
                          <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                          <code className="font-mono text-xs text-foreground">{w.event}</code>
                        </div>
                        <span className="hidden text-[11px] text-muted-foreground sm:inline">{w.desc}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">Webhook Handler</h4>
                  <CodeBlock code={getWebhookCode(env)} filename="webhooks.js" />
                </div>
              </div>
            </section>

            <hr className="my-16 border-border/30" />

            {/* ── SDKs ── */}
            <section id="sdks" className="scroll-mt-24">
              <h2 className="text-2xl font-bold lg:text-3xl">SDKs & Libraries</h2>
              <p className="mt-3 text-muted-foreground">Official SDKs for every major platform. Click any SDK to view install commands, init code, and usage examples.</p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {sdks.map((sdk) => {
                  const isExpanded = expandedSdk === sdk.name;
                  return (
                    <div key={sdk.name}
                      onClick={() => setExpandedSdk(isExpanded ? null : sdk.name)}
                      className={`group cursor-pointer rounded-xl border bg-card p-4 transition-all duration-200 hover:-translate-y-0.5 ${isExpanded ? "border-primary/40 ring-1 ring-primary/20" : "border-border/50 hover:border-primary/30"}`}
                      style={{ boxShadow: "var(--shadow-card)" }}>
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-foreground">{sdk.name}</h4>
                        <ChevronDown size={14} className={`text-muted-foreground transition-transform duration-200 ${isExpanded ? "rotate-180 text-primary" : ""}`} />
                      </div>
                      <code className="mt-1.5 block text-[11px] text-primary">{sdk.pkg}</code>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="rounded bg-secondary px-2 py-0.5 font-mono text-[10px] text-muted-foreground">v{sdk.version}</span>
                        <span className="text-[10px] text-muted-foreground">{sdk.install.split(" ")[0]}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Expanded SDK Detail Panel */}
              {expandedSdk && (() => {
                const sdk = sdks.find((s) => s.name === expandedSdk)!;
                const sdkInitExamples: Record<string, string> = {
                  "Node.js": `const ZivonPay = require('@zivonpay/node');

const zp = new ZivonPay({
  key_id: '${config.sampleKey}',
  key_secret: '${config.sampleSecret}',
});

// Create an order
const order = await zp.orders.create({
  amount: 50000,
  currency: 'INR',
  receipt: 'order_1',
});`,
                  Python: `import zivonpay

client = zivonpay.Client(
    auth=("${config.sampleKey}", "${config.sampleSecret}")
)

# Create an order
order = client.order.create({
    "amount": 50000,
    "currency": "INR",
    "receipt": "order_1"
})`,
                  PHP: `<?php
require 'vendor/autoload.php';

use ZivonPay\\Api;

$api = new Api('${config.sampleKey}', '${config.sampleSecret}');

// Create an order
$order = $api->order->create([
    'amount' => 50000,
    'currency' => 'INR',
    'receipt' => 'order_1',
]);`,
                  Java: `import com.zivonpay.ZivonPayClient;
import com.zivonpay.Order;

ZivonPayClient client = new ZivonPayClient(
    "${config.sampleKey}",
    "${config.sampleSecret}"
);

// Create an order
JSONObject options = new JSONObject();
options.put("amount", 50000);
options.put("currency", "INR");
options.put("receipt", "order_1");

Order order = client.orders.create(options);`,
                  Go: `import "github.com/zivonpay/zivonpay-go"

client := zivonpay.NewClient(
    "${config.sampleKey}",
    "${config.sampleSecret}",
)

// Create an order
order, err := client.Order.Create(map[string]interface{}{
    "amount":   50000,
    "currency": "INR",
    "receipt":  "order_1",
})`,
                  "React Native": `import ZivonPay from '@zivonpay/react-native';

// Open checkout
ZivonPay.open({
  key: '${config.sampleKey}',
  amount: 50000,
  currency: 'INR',
  name: 'Acme Corp',
  order_id: order.id,
  theme: { color: '#10B981' },
}).then((data) => {
  console.log('Payment success:', data);
}).catch((error) => {
  console.log('Payment failed:', error);
});`,
                  Flutter: `import 'package:zivonpay_flutter/zivonpay_flutter.dart';

final _zivonpay = ZivonPay();

var options = {
  'key': '${config.sampleKey}',
  'amount': 50000,
  'currency': 'INR',
  'name': 'Acme Corp',
  'order_id': order['id'],
};

_zivonpay.open(options);

_zivonpay.on(ZivonPay.EVENT_PAYMENT_SUCCESS, (response) {
  print('Payment success: \${response.paymentId}');
});`,
                  Ruby: `require 'zivonpay'

ZivonPay.setup('${config.sampleKey}', '${config.sampleSecret}')

# Create an order
order = ZivonPay::Order.create(
  amount: 50000,
  currency: 'INR',
  receipt: 'order_1'
)`,
                };

                return (
                  <motion.div
                    key={expandedSdk}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-6 overflow-hidden rounded-xl border border-primary/20 bg-card" style={{ boxShadow: "var(--shadow-card)" }}>
                    <div className="border-b border-border/30 bg-secondary/20 px-6 py-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-lg font-semibold text-foreground">{sdk.name}</h4>
                          <code className="text-xs text-primary">{sdk.pkg} v{sdk.version}</code>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); setExpandedSdk(null); }}
                          className="rounded-md px-3 py-1 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground">✕ Close</button>
                      </div>
                    </div>
                    <div className="p-6 space-y-6">
                      <div>
                        <h5 className="mb-2 text-sm font-semibold text-foreground">Install</h5>
                        <CodeBlock code={sdk.install} filename="terminal" />
                      </div>
                      <div>
                        <h5 className="mb-2 text-sm font-semibold text-foreground">Initialize & Create Order</h5>
                        <CodeBlock code={sdkInitExamples[sdk.name] || sdkInitExamples["Node.js"]} filename={`example.${sdk.name === "Python" ? "py" : sdk.name === "PHP" ? "php" : sdk.name === "Java" ? "java" : sdk.name === "Go" ? "go" : sdk.name === "Ruby" ? "rb" : sdk.name === "Flutter" ? "dart" : "js"}`} />
                      </div>
                    </div>
                  </motion.div>
                );
              })()}
            </section>

            <hr className="my-16 border-border/30" />

            {/* ── Testing ── */}
            <section id="testing" className="scroll-mt-24">
              <h2 className="text-2xl font-bold lg:text-3xl">Testing & Sandbox</h2>
              <p className="mt-3 text-muted-foreground">
                Use sandbox mode to test your integration end-to-end without processing real transactions. Try the API console below, copy test credentials, and use the checklist to go live.
              </p>

              {/* API Test Console */}
              <div className="mt-8 rounded-xl border border-primary/20 bg-card overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
                <div className="border-b border-border/30 bg-secondary/20 px-6 py-4">
                  <div className="flex items-center gap-2">
                    <Terminal size={16} className="text-primary" />
                    <h4 className="font-semibold text-foreground">API Test Console</h4>
                    <div className="ml-auto rounded-full bg-yellow-500/10 px-3 py-0.5 text-[10px] font-semibold text-yellow-400">
                      <span className="mr-1 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-yellow-400" />
                      Sandbox
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="text-xs font-medium text-muted-foreground">Endpoint:</label>
                    <select
                      value={testEndpoint}
                      onChange={(e) => { setTestEndpoint(e.target.value); setTestResult(null); }}
                      className="rounded-lg border border-border/50 bg-secondary/30 px-3 py-2 font-mono text-xs text-foreground focus:border-primary/50 focus:outline-none"
                    >
                      <option value="POST /v1/orders">POST /v1/orders</option>
                      <option value="GET /v1/orders/:id">GET /v1/orders/:id</option>
                      <option value="GET /v1/payments/:id">GET /v1/payments/:id</option>
                      <option value="POST /v1/refunds">POST /v1/refunds</option>
                    </select>
                    <Button
                      onClick={runTestCall}
                      disabled={testLoading}
                      size="sm"
                      className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      {testLoading ? (
                        <>
                          <div className="h-3 w-3 animate-spin rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground" />
                          Calling...
                        </>
                      ) : (
                        <>
                          <Zap size={14} /> Send Request
                        </>
                      )}
                    </Button>
                  </div>

                  {testResult && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
                      <div className="mb-2 flex items-center gap-3">
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">{testResult.status}</span>
                        <span className="text-xs text-muted-foreground">{testResult.time}ms</span>
                      </div>
                      <CodeBlock code={JSON.stringify(testResult.data, null, 2)} filename="response.json" />
                    </motion.div>
                  )}
                </div>
              </div>

              <div className="mt-8 grid gap-6 lg:grid-cols-2">
                {/* Test Credentials with copy */}
                <div className="rounded-xl border border-border/50 bg-card p-6" style={{ boxShadow: "var(--shadow-card)" }}>
                  <div className="mb-4 flex items-center gap-2">
                    <div className="rounded-full bg-yellow-500/10 px-3 py-1 text-xs font-semibold text-yellow-400">
                      <span className="mr-1 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-yellow-400" />
                      Sandbox Credentials
                    </div>
                  </div>
                  <div className="space-y-3">
                    {[
                      { label: "API Key (Test)", value: envConfig.sandbox.sampleKey },
                      { label: "API Secret (Test)", value: envConfig.sandbox.sampleSecret },
                      { label: "Webhook Secret (Test)", value: envConfig.sandbox.webhookSecret },
                      { label: "Base URL (Test)", value: envConfig.sandbox.baseUrl },
                    ].map((cred) => (
                      <div key={cred.label} className="group flex items-center justify-between rounded-lg bg-secondary/30 px-4 py-3 transition-colors hover:bg-secondary/50 cursor-pointer"
                        onClick={() => copyValue(cred.value)}>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{cred.label}</p>
                          <code className="mt-1 block truncate font-mono text-sm text-foreground">{cred.value}</code>
                        </div>
                        <div className="ml-3 shrink-0">
                          {copiedValue === cred.value ? (
                            <Check size={14} className="text-primary" />
                          ) : (
                            <Copy size={14} className="text-muted-foreground/40 transition-colors group-hover:text-foreground" />
                          )}
                        </div>
                      </div>
                    ))}
                    <Button className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90" size="sm">
                      <Key size={14} /> Generate New Test Keys
                    </Button>
                  </div>
                </div>

                {/* Test Data with copy */}
                <div className="space-y-4">
                  <div className="rounded-xl border border-border/50 bg-card p-5" style={{ boxShadow: "var(--shadow-card)" }}>
                    <h4 className="mb-3 text-sm font-semibold text-foreground">Test Card Numbers</h4>
                    <div className="space-y-2">
                      {[
                        { card: "4111 1111 1111 1111", label: "Success", color: "bg-primary/10 text-primary" },
                        { card: "4000 0000 0000 0002", label: "Declined", color: "bg-destructive/10 text-destructive" },
                        { card: "4000 0000 0000 3220", label: "3DS Auth", color: "bg-yellow-500/10 text-yellow-400" },
                        { card: "5500 0000 0000 0004", label: "Mastercard", color: "bg-blue-500/10 text-blue-400" },
                      ].map((tc) => (
                        <div key={tc.card}
                          onClick={() => copyValue(tc.card)}
                          className="group flex cursor-pointer items-center justify-between rounded-lg bg-secondary/30 px-3 py-2 transition-colors hover:bg-secondary/50">
                          <code className="font-mono text-sm text-foreground">{tc.card}</code>
                          <div className="flex items-center gap-2">
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${tc.color}`}>{tc.label}</span>
                            {copiedValue === tc.card ? (
                              <Check size={12} className="text-primary" />
                            ) : (
                              <Copy size={12} className="text-muted-foreground/30 transition-colors group-hover:text-foreground" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl border border-border/50 bg-card p-5" style={{ boxShadow: "var(--shadow-card)" }}>
                    <h4 className="mb-3 text-sm font-semibold text-foreground">Test UPI & Net Banking</h4>
                    <div className="space-y-2">
                      {[
                        { id: "success@upi", label: "UPI Success", color: "bg-primary/10 text-primary" },
                        { id: "failure@upi", label: "UPI Failed", color: "bg-destructive/10 text-destructive" },
                        { id: "HDFC (Net Banking)", label: "Success", color: "bg-primary/10 text-primary" },
                      ].map((t) => (
                        <div key={t.id}
                          onClick={() => copyValue(t.id)}
                          className="group flex cursor-pointer items-center justify-between rounded-lg bg-secondary/30 px-3 py-2 transition-colors hover:bg-secondary/50">
                          <code className="font-mono text-sm text-foreground">{t.id}</code>
                          <div className="flex items-center gap-2">
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${t.color}`}>{t.label}</span>
                            {copiedValue === t.id ? (
                              <Check size={12} className="text-primary" />
                            ) : (
                              <Copy size={12} className="text-muted-foreground/30 transition-colors group-hover:text-foreground" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Interactive Going Live Checklist */}
              <div className="mt-8 rounded-xl border border-primary/20 bg-primary/5 p-6">
                <div className="flex items-center justify-between">
                  <h4 className="flex items-center gap-2 font-semibold text-foreground">
                    <ArrowUpRight size={16} className="text-primary" /> Going Live Checklist
                  </h4>
                  <span className="text-xs text-muted-foreground">
                    {checkedItems.size}/8 complete
                  </span>
                </div>
                {/* Progress bar */}
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                  <motion.div
                    className="h-full rounded-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${(checkedItems.size / 8) * 100}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <div className="mt-5 grid gap-2 sm:grid-cols-2">
                  {[
                    "Complete KYC verification",
                    "Replace test keys with live keys",
                    "Set up production webhook URL",
                    "Verify payment signature on server",
                    "Configure your settlement account",
                    "Test end-to-end in sandbox first",
                    "Set up error handling & logging",
                    "Enable PCI DSS compliance mode",
                  ].map((item) => (
                    <button
                      key={item}
                      onClick={() => toggleCheck(item)}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-all ${
                        checkedItems.has(item)
                          ? "bg-primary/10 text-primary line-through opacity-70"
                          : "text-muted-foreground hover:bg-secondary/30 hover:text-foreground"
                      }`}>
                      <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all ${
                        checkedItems.has(item)
                          ? "border-primary bg-primary"
                          : "border-muted-foreground/30"
                      }`}>
                        {checkedItems.has(item) && <Check size={10} className="text-primary-foreground" />}
                      </div>
                      {item}
                    </button>
                  ))}
                </div>
                {checkedItems.size === 8 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="mt-4 flex items-center gap-2 rounded-lg bg-primary/10 px-4 py-3 text-sm font-medium text-primary">
                    <Check size={16} /> You're ready to go live! Switch to production mode and deploy.
                  </motion.div>
                )}
              </div>
            </section>

            <hr className="my-16 border-border/30" />

            {/* ── Error Codes ── */}
            <section id="error-codes" className="scroll-mt-24">
              <h2 className="text-2xl font-bold lg:text-3xl">Error Codes</h2>
              <p className="mt-3 text-muted-foreground">
                All errors follow a consistent format with <code className="rounded bg-secondary px-1.5 py-0.5 text-xs text-primary">error.code</code>, <code className="rounded bg-secondary px-1.5 py-0.5 text-xs text-primary">error.description</code>, and <code className="rounded bg-secondary px-1.5 py-0.5 text-xs text-primary">error.source</code>.
              </p>

              <div className="mt-4">
                <CodeBlock code={`// Error Response Format
{
  "error": {
    "code": "BAD_REQUEST_ERROR",
    "description": "The amount must be at least INR 1.00",
    "source": "business",
    "step": "payment_initiation",
    "reason": "input_validation_failed",
    "metadata": {}
  }
}`} filename="error-response.json" />
              </div>

              <div className="mt-6 overflow-hidden rounded-xl border border-border/50" style={{ boxShadow: "var(--shadow-card)" }}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/50 bg-secondary/20">
                        <th className="px-4 py-3 text-left font-semibold text-foreground">HTTP</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground">Code</th>
                        <th className="px-4 py-3 text-left font-semibold text-foreground">Description</th>
                        <th className="hidden px-4 py-3 text-left font-semibold text-foreground sm:table-cell">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {errorCodes.map((err) => (
                        <tr key={err.code} className="border-b border-border/20 transition-colors hover:bg-secondary/10">
                          <td className="px-4 py-3"><StatusBadge status={err.status} /></td>
                          <td className="px-4 py-3 font-mono text-xs text-foreground">{err.code}</td>
                          <td className="px-4 py-3 text-muted-foreground">{err.desc}</td>
                          <td className="hidden px-4 py-3 text-xs text-muted-foreground sm:table-cell">{err.action}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            <hr className="my-16 border-border/30" />

            {/* ── Rate Limits ── */}
            <section id="rate-limits" className="scroll-mt-24">
              <h2 className="text-2xl font-bold lg:text-3xl">Rate Limits</h2>
              <p className="mt-3 text-muted-foreground">
                API rate limits vary by endpoint and environment. When you hit the limit, you'll receive a <code className="rounded bg-secondary px-1.5 py-0.5 text-xs text-destructive">429 RATE_LIMIT_EXCEEDED</code> response.
              </p>

              <div className="mt-6 overflow-hidden rounded-xl border border-border/50" style={{ boxShadow: "var(--shadow-card)" }}>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/50 bg-secondary/20">
                        <th className="px-4 py-3 text-left font-semibold text-foreground">Endpoint</th>
                        <th className="px-4 py-3 text-left font-semibold text-yellow-400">Sandbox</th>
                        <th className="px-4 py-3 text-left font-semibold text-primary">Production</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rateLimits.map((rl) => (
                        <tr key={rl.endpoint} className="border-b border-border/20 transition-colors hover:bg-secondary/10">
                          <td className="px-4 py-3 font-mono text-xs text-foreground">{rl.endpoint}</td>
                          <td className="px-4 py-3 text-yellow-400">{rl.sandbox}</td>
                          <td className="px-4 py-3 text-primary">{rl.production}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-6">
                <CodeBlock code={`// Rate limit headers in response
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 995
X-RateLimit-Reset: 1709049511

// Implement exponential backoff
async function apiCallWithRetry(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.statusCode === 429) {
        const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
        await new Promise(r => setTimeout(r, delay));
        continue;
      }
      throw error;
    }
  }
}`} filename="rate-limit-handling.js" />
              </div>
            </section>

            <hr className="my-16 border-border/30" />

            {/* ── Changelog ── */}
            <section id="changelog" className="scroll-mt-24">
              <h2 className="text-2xl font-bold lg:text-3xl">Changelog</h2>
              <p className="mt-3 text-muted-foreground">Latest updates to the ZivonPay API.</p>

              <div className="mt-8 space-y-0">
                {changelog.map((entry, i) => (
                  <div key={entry.version} className="group relative flex gap-6 pb-8">
                    {/* Timeline line */}
                    {i < changelog.length - 1 && (
                      <div className="absolute left-[15px] top-8 h-full w-px bg-border/50" />
                    )}
                    <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border/50 bg-card text-xs">
                      <div className={`h-2.5 w-2.5 rounded-full ${entry.type === "feature" ? "bg-primary" : entry.type === "security" ? "bg-yellow-400" : "bg-blue-400"}`} />
                    </div>
                    <div className="flex-1 rounded-xl border border-border/50 bg-card p-4 transition-colors hover:border-primary/20" style={{ boxShadow: "var(--shadow-card)" }}>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-bold text-primary">{entry.version}</span>
                        <span className="text-xs text-muted-foreground">{entry.date}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          entry.type === "feature" ? "bg-primary/10 text-primary" :
                          entry.type === "security" ? "bg-yellow-500/10 text-yellow-400" :
                          "bg-blue-500/10 text-blue-400"
                        }`}>{entry.type}</span>
                      </div>
                      <h4 className="mt-2 font-semibold text-foreground">{entry.title}</h4>
                      <p className="mt-1 text-sm text-muted-foreground">{entry.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* ── Resources CTA ── */}
            <div className="mt-20 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-8 text-center">
              <h3 className="text-xl font-bold text-foreground">Need help?</h3>
              <p className="mt-2 text-muted-foreground">Join our developer community or reach out to our integration support team.</p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                  <Users size={16} /> Join Discord
                </Button>
                <Button variant="outline" className="gap-2 border-border text-foreground hover:bg-secondary">
                  <Book size={16} /> Integration Guides
                </Button>
                <Button variant="outline" className="gap-2 border-border text-foreground hover:bg-secondary">
                  <Globe2 size={16} /> Postman Collection
                </Button>
              </div>
            </div>
          </main>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default DeveloperGuidePage;
