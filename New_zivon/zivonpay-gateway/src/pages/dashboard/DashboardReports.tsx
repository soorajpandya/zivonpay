import { useState, useEffect } from "react";
import { FileText, Download, ChevronLeft, ChevronRight, Loader2, IndianRupee, ArrowUpRight, ArrowDownRight, Landmark, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Tab = "payin" | "payout" | "transactions" | "settlements";

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

const PAGE_SIZE = 10;

interface PaymentRow {
  id: string;
  order_id: string | null;
  amount: number;
  currency: string;
  status: string;
  method: string | null;
  bank: string | null;
  notes: Record<string, any> | null;
  created_at: string;
}

interface PayoutRow {
  id: string;
  amount: number;
  status: string;
  bank_account: string | null;
  fund_account_id: string | null;
  mode: string | null;
  notes: Record<string, any> | null;
  created_at: string;
}

const DashboardReports = () => {
  const [activeTab, setActiveTab] = useState<Tab>("payin");
  const [dateRange, setDateRange] = useState("last_30_days");
  const [loading, setLoading] = useState(false);

  // Pay-in state
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [payinPage, setPayinPage] = useState(1);

  // Payout state
  const [payouts, setPayouts] = useState<PayoutRow[]>([]);
  const [payoutPage, setPayoutPage] = useState(1);
  const [payoutBankFilter, setPayoutBankFilter] = useState("all");

  // Transaction state (combined)
  const [txnPage, setTxnPage] = useState(1);

  // Settlement state
  const [settlementPage, setSettlementPage] = useState(1);

  const getDateRange = () => {
    const now = new Date();
    const start = new Date();
    switch (dateRange) {
      case "today": start.setHours(0, 0, 0, 0); break;
      case "yesterday": start.setDate(now.getDate() - 1); start.setHours(0, 0, 0, 0); break;
      case "last_7_days": start.setDate(now.getDate() - 7); break;
      case "last_30_days": start.setDate(now.getDate() - 30); break;
      case "last_90_days": start.setDate(now.getDate() - 90); break;
    }
    return start.toISOString();
  };

  useEffect(() => {
    fetchData();
  }, [dateRange, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    const since = getDateRange();

    if (activeTab === "payin" || activeTab === "transactions" || activeTab === "settlements") {
      const { data } = await supabase
        .from("payments")
        .select("id, order_id, amount, currency, status, method, bank, notes, created_at")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(500);
      if (data) setPayments(data as PaymentRow[]);
    }

    if (activeTab === "payout" || activeTab === "transactions") {
      const { data } = await supabase
        .from("payouts")
        .select("id, amount, status, bank_account, fund_account_id, mode, notes, created_at")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(500);
      if (data) setPayouts(data as PayoutRow[]);
    }

    setLoading(false);
  };

  // Pay-in stats
  const payinCaptured = payments.filter(p => p.status?.toLowerCase() === "captured");
  const payinTotal = payinCaptured.reduce((s, p) => s + (p.amount || 0), 0) / 100;
  const payinByBank: Record<string, { count: number; amount: number }> = {};
  payinCaptured.forEach(p => {
    const key = p.bank || "Unknown";
    if (!payinByBank[key]) payinByBank[key] = { count: 0, amount: 0 };
    payinByBank[key].count++;
    payinByBank[key].amount += (p.amount || 0) / 100;
  });

  // Payout stats
  const payoutProcessed = payouts.filter(p => ["processed", "completed"].includes(p.status?.toLowerCase()));
  const payoutTotal = payoutProcessed.reduce((s, p) => s + (p.amount || 0), 0) / 100;
  const payoutByBank: Record<string, { count: number; amount: number }> = {};
  payouts.forEach(p => {
    const bankKey = p.notes?.bank || p.bank_account || "Unknown";
    const info = getBankInfo(bankKey);
    const label = info?.name || bankKey;
    if (!payoutByBank[label]) payoutByBank[label] = { count: 0, amount: 0 };
    payoutByBank[label].count++;
    payoutByBank[label].amount += (p.amount || 0) / 100;
  });

  const filteredPayouts = payoutBankFilter === "all"
    ? payouts
    : payouts.filter(p => {
        const bankKey = p.notes?.bank || p.bank_account || "";
        const info = getBankInfo(bankKey);
        return info?.name === payoutBankFilter || bankKey === payoutBankFilter;
      });

  // Settlement computation (captured payments grouped by date)
  const FEE_PERCENT = 1.70;
  const settlementsByDate: Record<string, { date: string; payinCount: number; payinAmount: number; payoutCount: number; payoutAmount: number; fee: number; netAmount: number }> = {};
  payinCaptured.forEach(p => {
    const d = new Date(p.created_at).toLocaleDateString("en-IN");
    if (!settlementsByDate[d]) settlementsByDate[d] = { date: d, payinCount: 0, payinAmount: 0, payoutCount: 0, payoutAmount: 0, fee: 0, netAmount: 0 };
    settlementsByDate[d].payinCount++;
    settlementsByDate[d].payinAmount += (p.amount || 0) / 100;
  });
  payoutProcessed.forEach(p => {
    const d = new Date(p.created_at).toLocaleDateString("en-IN");
    if (!settlementsByDate[d]) settlementsByDate[d] = { date: d, payinCount: 0, payinAmount: 0, payoutCount: 0, payoutAmount: 0, fee: 0, netAmount: 0 };
    settlementsByDate[d].payoutCount++;
    settlementsByDate[d].payoutAmount += (p.amount || 0) / 100;
  });
  const settlements = Object.values(settlementsByDate)
    .map(s => {
      const fee = s.payinAmount * (FEE_PERCENT / 100);
      return { ...s, fee, netAmount: s.payinAmount - fee };
    })
    .sort((a, b) => {
      const [ad, am, ay] = a.date.split("/").map(Number);
      const [bd, bm, by] = b.date.split("/").map(Number);
      return new Date(by, bm - 1, bd).getTime() - new Date(ay, am - 1, ad).getTime();
    });

  // Transaction combined list
  const allTransactions = [
    ...payments.map(p => ({ id: p.id, type: "Pay In" as const, amount: (p.amount || 0) / 100, status: p.status, bank: p.bank, method: p.method, date: p.created_at })),
    ...payouts.map(p => ({ id: p.id, type: "Pay Out" as const, amount: (p.amount || 0) / 100, status: p.status, bank: p.notes?.bank || p.bank_account || null, method: p.mode, date: p.created_at })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const paginate = <T,>(data: T[], page: number) => ({
    items: data.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    total: data.length,
    totalPages: Math.max(1, Math.ceil(data.length / PAGE_SIZE)),
  });

  const payinPaged = paginate(payments, payinPage);
  const payoutPaged = paginate(filteredPayouts, payoutPage);
  const txnPaged = paginate(allTransactions, txnPage);
  const settlePaged = paginate(settlements, settlementPage);

  const downloadCSV = (filename: string, headers: string[], rows: string[][]) => {
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExport = () => {
    if (activeTab === "payin") {
      downloadCSV("payin-report.csv",
        ["Payment ID", "Bank", "Method", "Amount", "Status", "Date"],
        payments.map(p => [p.id, p.bank || "", p.method || "", String((p.amount || 0) / 100), p.status, new Date(p.created_at).toLocaleDateString()])
      );
    } else if (activeTab === "payout") {
      downloadCSV("payout-report.csv",
        ["Payout ID", "Bank", "Mode", "Amount", "Status", "Date"],
        filteredPayouts.map(p => [p.id, p.notes?.bank || p.bank_account || "", p.mode || "", String((p.amount || 0) / 100), p.status, new Date(p.created_at).toLocaleDateString()])
      );
    } else if (activeTab === "transactions") {
      downloadCSV("transaction-report.csv",
        ["ID", "Type", "Bank", "Method", "Amount", "Status", "Date"],
        allTransactions.map(t => [t.id, t.type, t.bank || "", t.method || "", String(t.amount), t.status, new Date(t.date).toLocaleDateString()])
      );
    } else {
      downloadCSV("settlement-report.csv",
        ["Date", "Pay-In Count", "Pay-In Amount", "Pay-Out Count", "Pay-Out Amount", "Fee (1.70%)", "Net Settlement"],
        settlements.map(s => [s.date, String(s.payinCount), String(s.payinAmount.toFixed(2)), String(s.payoutCount), String(s.payoutAmount.toFixed(2)), String(s.fee.toFixed(2)), String(s.netAmount.toFixed(2))])
      );
    }
  };

  const BankCell = ({ bank }: { bank: string | null }) => {
    const info = getBankInfo(bank);
    if (!info) return <span className="text-muted-foreground">—</span>;
    return (
      <div className="flex items-center gap-2">
        <img src={info.logo} alt={info.name} className="h-5 w-5 rounded-full object-cover" />
        <span className="text-xs">{info.name}</span>
      </div>
    );
  };

  const Pagination = ({ page, totalPages, total, setPage }: { page: number; totalPages: number; total: number; setPage: (p: number) => void }) => (
    <div className="flex items-center justify-between px-4 py-3 border-t border-border">
      <p className="text-xs text-muted-foreground">
        Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total}
      </p>
      <div className="flex items-center gap-2">
        <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="p-1.5 rounded-md border border-border text-muted-foreground hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-xs text-muted-foreground">Page {page} of {totalPages}</span>
        <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="p-1.5 rounded-md border border-border text-muted-foreground hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed">
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  const StatusBadge = ({ status }: { status: string }) => {
    const s = status?.toLowerCase();
    const cls = s === "captured" || s === "processed" || s === "completed" ? "bg-emerald-500/20 text-emerald-400"
      : s === "failed" || s === "reversed" ? "bg-destructive/20 text-destructive"
      : s === "refunded" ? "bg-primary/20 text-primary"
      : "bg-muted text-muted-foreground";
    return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{status}</span>;
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "payin", label: "Pay-In Report", icon: <ArrowDownRight className="h-4 w-4" /> },
    { id: "payout", label: "Pay-Out Report", icon: <ArrowUpRight className="h-4 w-4" /> },
    { id: "transactions", label: "Transaction Report", icon: <RefreshCw className="h-4 w-4" /> },
    { id: "settlements", label: "Settlement Report", icon: <Landmark className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Reports</h1>
          <p className="text-sm text-muted-foreground">Detailed financial reports and analytics</p>
        </div>
        <FileText className="h-8 w-8 text-primary" />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <ArrowDownRight className="h-4 w-4 text-emerald-400" />
            <p className="text-xs text-muted-foreground">Total Pay-In</p>
          </div>
          <p className="text-2xl font-semibold text-foreground">{fmt(payinTotal)}</p>
          <p className="text-xs text-muted-foreground mt-1">{payinCaptured.length} captured payments</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <ArrowUpRight className="h-4 w-4 text-orange-400" />
            <p className="text-xs text-muted-foreground">Total Pay-Out</p>
          </div>
          <p className="text-2xl font-semibold text-foreground">{fmt(payoutTotal)}</p>
          <p className="text-xs text-muted-foreground mt-1">{payoutProcessed.length} processed payouts</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <IndianRupee className="h-4 w-4 text-primary" />
            <p className="text-xs text-muted-foreground">Net Settlement</p>
          </div>
          <p className="text-2xl font-semibold text-foreground">{fmt(payinTotal - payinTotal * (FEE_PERCENT / 100))}</p>
          <p className="text-xs text-muted-foreground mt-1">1.70% fee deducted</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Landmark className="h-4 w-4 text-violet-400" />
            <p className="text-xs text-muted-foreground">Banks Active</p>
          </div>
          <p className="text-2xl font-semibold text-foreground">{Object.keys(payinByBank).length}</p>
          <p className="text-xs text-muted-foreground mt-1">receiving pay-ins</p>
        </div>
      </div>

      {/* Tabs + Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 border-b border-border">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => { setActiveTab(t.id); setPayinPage(1); setPayoutPage(1); setTxnPage(1); setSettlementPage(1); }}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === t.id ? "text-primary border-primary" : "text-muted-foreground border-transparent hover:text-foreground"
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="text-sm rounded-md border border-border bg-secondary px-3 py-1.5 text-foreground"
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="last_7_days">Last 7 days</option>
            <option value="last_30_days">Last 30 days</option>
            <option value="last_90_days">Last 90 days</option>
          </select>
          <button onClick={handleExport} className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-md border border-border bg-secondary text-foreground hover:bg-accent">
            <Download className="h-3.5 w-3.5" /> Export CSV
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="rounded-lg border border-border bg-card">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* ─── PAY-IN REPORT ─── */}
            {activeTab === "payin" && (
              <>
                {/* Bank-wise summary */}
                {Object.keys(payinByBank).length > 0 && (
                  <div className="p-4 border-b border-border">
                    <p className="text-xs font-medium text-muted-foreground mb-3">Bank-wise Pay-In Summary</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {Object.entries(payinByBank).map(([bank, data]) => {
                        const info = getBankInfo(bank);
                        return (
                          <div key={bank} className="flex items-center gap-3 rounded-md border border-border p-3">
                            {info ? <img src={info.logo} alt={info.name} className="h-8 w-8 rounded-full object-cover" /> : <Landmark className="h-8 w-8 text-muted-foreground" />}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{info?.name || bank}</p>
                              <p className="text-xs text-muted-foreground">{data.count} payments</p>
                            </div>
                            <p className="text-sm font-semibold text-emerald-400">{fmt(data.amount)}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-muted-foreground border-b border-border">
                        <th className="px-4 py-3">Payment ID</th>
                        <th className="px-4 py-3">Bank</th>
                        <th className="px-4 py-3">Method</th>
                        <th className="px-4 py-3">Amount</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payinPaged.items.length === 0 ? (
                        <tr><td colSpan={6} className="py-12 text-center text-muted-foreground">No pay-in records found</td></tr>
                      ) : payinPaged.items.map(p => (
                        <tr key={p.id} className="border-b border-border hover:bg-accent/50">
                          <td className="px-4 py-3 font-mono text-xs text-primary">{p.id}</td>
                          <td className="px-4 py-3"><BankCell bank={p.bank} /></td>
                          <td className="px-4 py-3">{p.method || "—"}</td>
                          <td className="px-4 py-3 font-semibold">{fmt((p.amount || 0) / 100)}</td>
                          <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                          <td className="px-4 py-3 text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {payinPaged.total > 0 && <Pagination page={payinPage} totalPages={payinPaged.totalPages} total={payinPaged.total} setPage={setPayinPage} />}
              </>
            )}

            {/* ─── PAY-OUT REPORT ─── */}
            {activeTab === "payout" && (
              <>
                {/* Bank filter + summary */}
                <div className="p-4 border-b border-border">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                    <p className="text-xs font-medium text-muted-foreground">Bank-wise Pay-Out Summary</p>
                    <select
                      value={payoutBankFilter}
                      onChange={(e) => { setPayoutBankFilter(e.target.value); setPayoutPage(1); }}
                      className="text-sm rounded-md border border-border bg-secondary px-3 py-1.5 text-foreground"
                    >
                      <option value="all">All Banks</option>
                      {Object.keys(payoutByBank).map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                  {Object.keys(payoutByBank).length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {Object.entries(payoutByBank).map(([bank, data]) => {
                        const info = getBankInfo(bank);
                        return (
                          <div key={bank} className="flex items-center gap-3 rounded-md border border-border p-3">
                            {info ? <img src={info.logo} alt={info.name} className="h-8 w-8 rounded-full object-cover" /> : <Landmark className="h-8 w-8 text-muted-foreground" />}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{info?.name || bank}</p>
                              <p className="text-xs text-muted-foreground">{data.count} payouts</p>
                            </div>
                            <p className="text-sm font-semibold text-orange-400">{fmt(data.amount)}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-muted-foreground border-b border-border">
                        <th className="px-4 py-3">Payout ID</th>
                        <th className="px-4 py-3">Bank</th>
                        <th className="px-4 py-3">Mode</th>
                        <th className="px-4 py-3">Amount</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payoutPaged.items.length === 0 ? (
                        <tr><td colSpan={6} className="py-12 text-center text-muted-foreground">No payout records found</td></tr>
                      ) : payoutPaged.items.map(p => (
                        <tr key={p.id} className="border-b border-border hover:bg-accent/50">
                          <td className="px-4 py-3 font-mono text-xs text-primary">{p.id}</td>
                          <td className="px-4 py-3"><BankCell bank={p.notes?.bank || p.bank_account} /></td>
                          <td className="px-4 py-3">{p.mode || "—"}</td>
                          <td className="px-4 py-3 font-semibold">{fmt((p.amount || 0) / 100)}</td>
                          <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                          <td className="px-4 py-3 text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {payoutPaged.total > 0 && <Pagination page={payoutPage} totalPages={payoutPaged.totalPages} total={payoutPaged.total} setPage={setPayoutPage} />}
              </>
            )}

            {/* ─── TRANSACTION REPORT ─── */}
            {activeTab === "transactions" && (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-muted-foreground border-b border-border">
                        <th className="px-4 py-3">ID</th>
                        <th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3">Bank</th>
                        <th className="px-4 py-3">Method</th>
                        <th className="px-4 py-3">Amount</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {txnPaged.items.length === 0 ? (
                        <tr><td colSpan={7} className="py-12 text-center text-muted-foreground">No transactions found</td></tr>
                      ) : txnPaged.items.map(t => (
                        <tr key={t.id} className="border-b border-border hover:bg-accent/50">
                          <td className="px-4 py-3 font-mono text-xs text-primary">{t.id}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                              t.type === "Pay In" ? "bg-emerald-500/20 text-emerald-400" : "bg-orange-500/20 text-orange-400"
                            }`}>
                              {t.type === "Pay In" ? <ArrowDownRight className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
                              {t.type}
                            </span>
                          </td>
                          <td className="px-4 py-3"><BankCell bank={t.bank} /></td>
                          <td className="px-4 py-3">{t.method || "—"}</td>
                          <td className="px-4 py-3 font-semibold">{fmt(t.amount)}</td>
                          <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                          <td className="px-4 py-3 text-muted-foreground">{new Date(t.date).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {txnPaged.total > 0 && <Pagination page={txnPage} totalPages={txnPaged.totalPages} total={txnPaged.total} setPage={setTxnPage} />}
              </>
            )}

            {/* ─── SETTLEMENT REPORT ─── */}
            {activeTab === "settlements" && (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-muted-foreground border-b border-border">
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Pay-In Count</th>
                        <th className="px-4 py-3">Pay-In Amount</th>
                        <th className="px-4 py-3">Pay-Out Count</th>
                        <th className="px-4 py-3">Pay-Out Amount</th>
                        <th className="px-4 py-3">Fee (1.70%)</th>
                        <th className="px-4 py-3">Net Settlement</th>
                      </tr>
                    </thead>
                    <tbody>
                      {settlePaged.items.length === 0 ? (
                        <tr><td colSpan={7} className="py-12 text-center text-muted-foreground">No settlement data found</td></tr>
                      ) : settlePaged.items.map(s => (
                        <tr key={s.date} className="border-b border-border hover:bg-accent/50">
                          <td className="px-4 py-3 font-medium">{s.date}</td>
                          <td className="px-4 py-3">{s.payinCount}</td>
                          <td className="px-4 py-3 text-emerald-400 font-semibold">{fmt(s.payinAmount)}</td>
                          <td className="px-4 py-3">{s.payoutCount}</td>
                          <td className="px-4 py-3 text-orange-400 font-semibold">{fmt(s.payoutAmount)}</td>
                          <td className="px-4 py-3 text-red-400">{fmt(s.fee)}</td>
                          <td className="px-4 py-3 font-bold">
                            <span className={s.netAmount >= 0 ? "text-emerald-400" : "text-destructive"}>{fmt(s.netAmount)}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {settlePaged.total > 0 && <Pagination page={settlementPage} totalPages={settlePaged.totalPages} total={settlePaged.total} setPage={setSettlementPage} />}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DashboardReports;
