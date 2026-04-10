import { useState, useEffect } from "react";
import { CreditCard, RotateCcw, AlertCircle, XCircle, ChevronRight, Info, ExternalLink, RefreshCw, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface PaymentRow {
  id: string;
  order_id: string | null;
  amount: number;
  currency: string;
  status: string;
  method: string | null;
  bank: string | null;
  gateway_ref: string | null;
  notes: Record<string, any> | null;
  metadata: Record<string, any> | null;
  created_at: string;
}

const DashboardHome = () => {
  const [activeTab, setActiveTab] = useState("payments");
  const [dateFilter, setDateFilter] = useState("last_7_days");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ collected: 0, collectedCount: 0, refunds: 0, refundCount: 0, failedCount: 0 });
  const [showBalance, setShowBalance] = useState(false);

  useEffect(() => {
    fetchData();
  }, [dateFilter]);

  const getDateRange = () => {
    const now = new Date();
    const start = new Date();
    switch (dateFilter) {
      case "today": start.setHours(0, 0, 0, 0); break;
      case "yesterday": start.setDate(now.getDate() - 1); start.setHours(0, 0, 0, 0); break;
      case "last_7_days": start.setDate(now.getDate() - 7); break;
      case "last_30_days": start.setDate(now.getDate() - 30); break;
      case "this_month": start.setDate(1); start.setHours(0, 0, 0, 0); break;
    }
    return start.toISOString();
  };

  const fetchData = async () => {
    setLoading(true);
    const since = getDateRange();

    const { data, error } = await supabase
      .from("payments")
      .select("id, order_id, amount, currency, status, method, bank, gateway_ref, notes, metadata, created_at")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(100);

    if (!error && data) {
      setPayments(data as PaymentRow[]);
      const captured = data.filter((p: any) => p.status?.toLowerCase() === "captured");
      const refunded = data.filter((p: any) => p.status?.toLowerCase() === "refunded");
      const failed = data.filter((p: any) => p.status?.toLowerCase() === "failed");
      setStats({
        collected: captured.reduce((s: number, p: any) => s + (p.amount || 0), 0),
        collectedCount: captured.length,
        refunds: refunded.reduce((s: number, p: any) => s + (p.amount || 0), 0),
        refundCount: refunded.length,
        failedCount: failed.length,
      });
    } else {
      setPayments([]);
      setStats({ collected: 0, collectedCount: 0, refunds: 0, refundCount: 0, failedCount: 0 });
    }
    setLoading(false);
  };

  const filteredPayments = payments.filter((p) => {
    if (statusFilter !== "all" && p.status?.toLowerCase() !== statusFilter) return false;
    if (searchQuery && !p.id.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const fmt = (n: number) => `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

  return (
    <>
      {/* Connected Banks */}
      <div className="rounded-lg border border-border bg-card mb-4">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Connected Banks</h2>
            <button
              onClick={() => setShowBalance(!showBalance)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {showBalance ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>
        <div className="p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Jio Payments Bank */}
          <div className="rounded-lg border border-border bg-[#0f1729] p-3.5">
            <div className="flex items-center gap-2 mb-2.5">
              <img src="/logos/jio.jpg" alt="Jio Payments Bank" className="h-7 w-7 rounded object-cover" />
              <div className="min-w-0">
                <p className="font-semibold text-white text-xs leading-tight truncate">Jio Payments Bank</p>
                <span className="flex items-center gap-1 text-[10px] text-emerald-400 leading-tight">
                  <RefreshCw className="h-2.5 w-2.5 shrink-0" />
                  a few seconds ago
                </span>
              </div>
            </div>
            <div className="text-xl font-bold text-white tracking-tight mb-3">
              {showBalance ? '₹ 3,91,234.76' : '₹ ******.**'}
            </div>
            <div className="grid grid-cols-3 gap-2 border-t border-slate-700/50 pt-2.5">
              <div className="min-w-0">
                <p className="text-slate-500 text-[10px] leading-tight mb-0.5">A/C Holder</p>
                <p className="text-white text-[11px] font-medium truncate">**** ****</p>
              </div>
              <div className="min-w-0">
                <p className="text-slate-500 text-[10px] leading-tight mb-0.5">A/C Number</p>
                <p className="text-white text-[11px] font-medium font-mono truncate">*********</p>
              </div>
              <div className="min-w-0">
                <p className="text-slate-500 text-[10px] leading-tight mb-0.5">IFSC</p>
                <p className="text-white text-[11px] font-medium font-mono truncate">*********</p>
              </div>
            </div>
          </div>

          {/* NSDL Payments Bank */}
          <div className="rounded-lg border border-border bg-[#0f1729] p-3.5">
            <div className="flex items-center gap-2 mb-2.5">
              <img src="/logos/nsdl.png" alt="NSDL Payments Bank" className="h-7 w-7 rounded object-cover" />
              <div className="min-w-0">
                <p className="font-semibold text-white text-xs leading-tight truncate">NSDL Payments Bank</p>
                <span className="flex items-center gap-1 text-[10px] text-emerald-400 leading-tight">
                  <RefreshCw className="h-2.5 w-2.5 shrink-0" />
                  a few seconds ago
                </span>
              </div>
            </div>
            <div className="text-xl font-bold text-white tracking-tight mb-3">
              {showBalance ? '₹ 1,24,580.50' : '₹ ******.**'}
            </div>
            <div className="grid grid-cols-3 gap-2 border-t border-slate-700/50 pt-2.5">
              <div className="min-w-0">
                <p className="text-slate-500 text-[10px] leading-tight mb-0.5">A/C Holder</p>
                <p className="text-white text-[11px] font-medium truncate">**** ****</p>
              </div>
              <div className="min-w-0">
                <p className="text-slate-500 text-[10px] leading-tight mb-0.5">A/C Number</p>
                <p className="text-white text-[11px] font-medium font-mono truncate">*********</p>
              </div>
              <div className="min-w-0">
                <p className="text-slate-500 text-[10px] leading-tight mb-0.5">IFSC</p>
                <p className="text-white text-[11px] font-medium font-mono truncate">*********</p>
              </div>
            </div>
          </div>

          {/* Fino Payments Bank */}
          <div className="rounded-lg border border-border bg-[#0f1729] p-3.5">
            <div className="flex items-center gap-2 mb-2.5">
              <img src="/logos/fino.png" alt="Fino Payments Bank" className="h-7 w-7 rounded object-cover" />
              <div className="min-w-0">
                <p className="font-semibold text-white text-xs leading-tight truncate">Fino Payments Bank</p>
                <span className="flex items-center gap-1 text-[10px] text-emerald-400 leading-tight">
                  <RefreshCw className="h-2.5 w-2.5 shrink-0" />
                  a few seconds ago
                </span>
              </div>
            </div>
            <div className="text-xl font-bold text-white tracking-tight mb-3">
              {showBalance ? '₹ 58,912.30' : '₹ ******.**'}
            </div>
            <div className="grid grid-cols-3 gap-2 border-t border-slate-700/50 pt-2.5">
              <div className="min-w-0">
                <p className="text-slate-500 text-[10px] leading-tight mb-0.5">A/C Holder</p>
                <p className="text-white text-[11px] font-medium truncate">**** ****</p>
              </div>
              <div className="min-w-0">
                <p className="text-slate-500 text-[10px] leading-tight mb-0.5">A/C Number</p>
                <p className="text-white text-[11px] font-medium font-mono truncate">*********</p>
              </div>
              <div className="min-w-0">
                <p className="text-slate-500 text-[10px] leading-tight mb-0.5">IFSC</p>
                <p className="text-white text-[11px] font-medium font-mono truncate">*********</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Overview card */}
      <div className="rounded-lg border border-border bg-card mb-4">
        <div className="p-4 border-b border-border">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-foreground">Overview</h2>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="text-sm rounded-md border border-border bg-secondary px-3 py-1.5 text-foreground"
              >
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="last_7_days">Last 7 days</option>
                <option value="last_30_days">Last 30 days</option>
                <option value="this_month">This month</option>
              </select>
            </div>
            <a href="/developer-guide" className="inline-flex items-center text-sm text-primary hover:text-primary/80 font-medium">
              Documentation <ExternalLink className="h-4 w-4 ml-1" />
            </a>
          </div>

          <div className="space-y-3">
            {/* Collected amount */}
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-sm font-medium text-primary">Collected Amount</h3>
                <Info className="h-4 w-4 text-primary/50" />
              </div>
              <div className="text-3xl md:text-4xl font-bold text-foreground">{fmt(stats.collected)}</div>
              <p className="text-sm text-primary/70 mt-1">from {stats.collectedCount} captured payments</p>
            </div>

            {/* Metric cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { icon: RotateCcw, label: "Refunds", amount: fmt(stats.refunds), sub: `${stats.refundCount} processed`, color: "text-primary" },
                { icon: AlertCircle, label: "Disputes", amount: "₹0.00", sub: "0 open • 0 under-review", color: "text-destructive" },
                { icon: XCircle, label: "Failed", amount: String(stats.failedCount), sub: "payments", color: "text-muted-foreground" },
              ].map((m) => (
                <div key={m.label} className="rounded-lg border border-border bg-card p-3 hover:border-primary/30 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <m.icon className={`h-4 w-4 ${m.color}`} />
                      <h4 className="text-sm font-medium text-foreground">{m.label}</h4>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="text-2xl font-bold text-foreground">{m.amount}</div>
                  <p className="text-xs text-muted-foreground mt-1">{m.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Payments / Orders table */}
      <div className="rounded-lg border border-border bg-card">
        <div className="border-b border-border">
          <div className="flex items-center px-4">
            {["payments", "orders"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-3 text-sm font-medium border-b-2 capitalize transition-colors ${
                  activeTab === tab
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 p-3 border-b border-border">
          <select className="text-sm rounded-md border border-border bg-secondary px-3 py-1.5 text-foreground">
            <option>Last 7 days</option><option>Today</option><option>Last 30 days</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm rounded-md border border-border bg-secondary px-3 py-1.5 text-foreground"
          >
            <option value="all">Status: All</option>
            <option value="captured">Captured</option>
            <option value="failed">Failed</option>
          </select>
          <select className="text-sm rounded-md border border-border bg-secondary px-3 py-1.5 text-foreground">
            <option>Payment method: All</option><option>Card</option><option>UPI</option>
          </select>
          <div className="flex-1 min-w-[200px]">
            <input
              placeholder="Search by Payment ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-sm rounded-md border border-border bg-secondary px-3 py-1.5 text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* Empty state or data */}
        {loading ? (
          <div className="py-16 text-center">
            <div className="h-8 w-8 mx-auto mb-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">Loading payments...</p>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="py-16 text-center">
            <CreditCard className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-lg font-medium text-foreground">No payment in selected duration</p>
            <p className="text-sm text-muted-foreground mt-1">Search using different keywords or time duration</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b border-border">
                  <th className="px-4 py-3">Payment ID</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Bank</th>
                  <th className="px-4 py-3">Created on</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((p) => (
                  <tr key={p.id} className="border-b border-border hover:bg-accent/50">
                    <td className="px-4 py-3 font-mono text-xs text-primary">{p.id}</td>
                    <td className="px-4 py-3">{p.method || "—"}</td>
                    <td className="px-4 py-3">{p.bank || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 font-semibold">{fmt(p.amount / 100)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        p.status?.toLowerCase() === "captured" ? "bg-emerald-500/20 text-emerald-400" :
                        p.status?.toLowerCase() === "failed" ? "bg-destructive/20 text-destructive" :
                        p.status?.toLowerCase() === "refunded" ? "bg-primary/20 text-primary" :
                        "bg-muted text-muted-foreground"
                      }`}>{p.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
};

export default DashboardHome;
