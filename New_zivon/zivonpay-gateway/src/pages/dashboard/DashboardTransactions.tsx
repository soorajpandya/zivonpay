import { useState, useEffect } from "react";
import { CreditCard, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
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

const DashboardTransactions = () => {
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState("last_7_days");
  const [statusFilter, setStatusFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [stats, setStats] = useState({ collected: 0, collectedCount: 0, refunds: 0, refundCount: 0, disputeCount: 0, failedCount: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 10;

  useEffect(() => { fetchPayments(); }, [dateFilter]);

  const getDateRange = () => {
    const now = new Date();
    const start = new Date();
    switch (dateFilter) {
      case "today": start.setHours(0, 0, 0, 0); break;
      case "yesterday": start.setDate(now.getDate() - 1); start.setHours(0, 0, 0, 0); break;
      case "last_7_days": start.setDate(now.getDate() - 7); break;
      case "last_30_days": start.setDate(now.getDate() - 30); break;
    }
    return start.toISOString();
  };

  const fetchPayments = async () => {
    setLoading(true);
    const since = getDateRange();
    const { data, error } = await supabase
      .from("payments")
      .select("id, order_id, amount, currency, status, method, bank, gateway_ref, notes, metadata, created_at")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(200);

    if (!error && data) {
      setPayments(data as PaymentRow[]);
      const captured = data.filter((p: any) => p.status?.toLowerCase() === "captured");
      const refunded = data.filter((p: any) => p.status?.toLowerCase() === "refunded");
      const failed = data.filter((p: any) => p.status?.toLowerCase() === "failed");
      setStats({
        collected: captured.reduce((s: number, p: any) => s + (p.amount || 0), 0) / 100,
        collectedCount: captured.length,
        refunds: refunded.reduce((s: number, p: any) => s + (p.amount || 0), 0) / 100,
        refundCount: refunded.length,
        disputeCount: 0,
        failedCount: failed.length,
      });
    } else {
      setPayments([]);
      setStats({ collected: 0, collectedCount: 0, refunds: 0, refundCount: 0, disputeCount: 0, failedCount: 0 });
    }
    setLoading(false);
  };

  const filtered = payments.filter((p) => {
    if (statusFilter !== "all" && p.status?.toLowerCase() !== statusFilter) return false;
    if (methodFilter !== "all" && p.method?.toLowerCase() !== methodFilter) return false;
    if (searchQuery && !p.id.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Reset to page 1 when filters change
  useEffect(() => { setCurrentPage(1); }, [statusFilter, methodFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginatedData = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const BANK_LOGOS: Record<string, { name: string; logo: string }> = {
    jio: { name: "Jio Payments Bank", logo: "/logos/jio.jpg" },
    nsdl: { name: "NSDL Payments Bank", logo: "/logos/nsdl.png" },
    fino: { name: "Fino Payments Bank", logo: "/logos/fino.png" },
  };

  const getBankInfo = (bankStr: string | null) => {
    if (!bankStr) return null;
    const lower = bankStr.toLowerCase();
    for (const [key, val] of Object.entries(BANK_LOGOS)) {
      if (lower.includes(key)) return val;
    }
    return null;
  };

  const fmt = (n: number) => `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Transactions</h1>
            <p className="text-sm text-muted-foreground">View all payment transactions</p>
          </div>
          <CreditCard className="h-8 w-8 text-primary" />
        </div>

        {/* Overview */}
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-medium text-foreground">Overview</p>
            <div className="flex items-center gap-4">
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="text-sm rounded-md border border-border bg-secondary px-3 py-1.5 text-foreground"
              >
                <option value="today">Today</option><option value="yesterday">Yesterday</option><option value="last_7_days">Last 7 days</option><option value="last_30_days">Last 30 days</option>
              </select>
              <a href="/developer-guide" className="text-sm text-primary hover:text-primary/80 inline-flex items-center">
                Documentation <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { label: "Collected Amount", value: fmt(stats.collected), sub: `from ${stats.collectedCount} captured payments` },
              { label: "Refunds", value: fmt(stats.refunds), sub: `${stats.refundCount} processed` },
              { label: "Disputes", value: "₹0.00", sub: `${stats.disputeCount} open` },
              { label: "Failed", value: String(stats.failedCount), sub: "payments" },
            ].map((m) => (
              <div key={m.label} className="rounded-lg border border-border p-4">
                <p className="text-xs text-muted-foreground">{m.label}</p>
                <div className="mt-2 text-2xl font-semibold text-foreground">{m.value}</div>
                <p className="text-sm text-muted-foreground">{m.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-4 border-b border-border pb-2">
          <button className="text-sm font-medium text-primary border-b-2 border-primary pb-2">Payments</button>
          <button className="text-sm text-muted-foreground pb-2">Orders</button>
        </div>

        {/* Table */}
        <div className="rounded-lg border border-border bg-card">
          <div className="flex flex-wrap gap-2 p-3 border-b border-border">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-sm rounded-md border border-border bg-secondary px-3 py-1.5 text-foreground"
            >
              <option value="all">Status: All</option>
              <option value="captured">Captured</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="text-sm rounded-md border border-border bg-secondary px-3 py-1.5 text-foreground"
            >
              <option value="all">Payment method: All</option>
              <option value="card">Card</option>
              <option value="upi">UPI</option>
              <option value="netbanking">Netbanking</option>
            </select>
            <div className="flex-1 min-w-[200px] flex gap-2">
              <select className="text-sm rounded-md border border-border bg-secondary px-3 py-1.5 text-foreground">
                <option>Payment ID</option><option>Order ID</option>
              </select>
              <input
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 text-sm rounded-md border border-border bg-secondary px-3 py-1.5 text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b border-border">
                  <th className="px-4 py-3">Payment ID</th>
                  <th className="px-4 py-3">Bank</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Created on</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <div className="h-8 w-8 mx-auto mb-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      <p className="text-sm text-muted-foreground">Loading transactions...</p>
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <CreditCard className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
                      <p className="text-lg font-medium text-foreground">No payment in selected duration</p>
                      <p className="text-sm text-muted-foreground">Search using different keywords or time duration</p>
                    </td>
                  </tr>
                ) : paginatedData.map((p) => (
                  <tr key={p.id} className="border-b border-border hover:bg-accent/50">
                    <td className="px-4 py-3 font-mono text-xs text-primary">{p.id}</td>
                    <td className="px-4 py-3">
                      {(() => {
                        const info = getBankInfo(p.bank);
                        return info ? (
                          <div className="flex items-center gap-2">
                            <img src={info.logo} alt={info.name} className="h-5 w-5 rounded-full object-cover" />
                            <span className="text-xs">{info.name}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3">{p.method || "—"}</td>
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

          {/* Pagination */}
          {filtered.length > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-md border border-border text-muted-foreground hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-xs text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-md border border-border text-muted-foreground hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardTransactions;
