import { useState, useEffect, useMemo } from "react";
import { Landmark, Download, ChevronLeft, ChevronRight, Loader2, RefreshCw, Zap, Calendar, Clock, Info, ArrowDownRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";

const FEE_PERCENT = 1.70;
const PAGE_SIZE = 10;

const fmt = (n: number) => `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const fmtDate = (d: Date) => {
  const day = d.getDate();
  const month = d.toLocaleString("en-IN", { month: "short" });
  const year = String(d.getFullYear()).slice(2);
  const suffix = day === 1 || day === 21 || day === 31 ? "st" : day === 2 || day === 22 ? "nd" : day === 3 || day === 23 ? "rd" : "th";
  return `${day}${suffix} ${month}'${year}`;
};

type Tab = "settlements" | "on-demand";

interface Settlement {
  id: string;
  date: string;
  amount: number;
  fee: number;
  netAmount: number;
  utr: string;
  status: "settled" | "pending" | "processing" | "upcoming";
  settledOn: string | null;
  paymentCount: number;
}

const StatusBadge = ({ status }: { status: Settlement["status"] }) => {
  const map = {
    settled: { label: "Settled", cls: "bg-emerald-500/20 text-emerald-400" },
    pending: { label: "Pending", cls: "bg-amber-500/20 text-amber-400" },
    processing: { label: "Processing", cls: "bg-primary/20 text-primary" },
    upcoming: { label: "Upcoming", cls: "bg-violet-500/20 text-violet-400" },
  };
  const c = map[status];
  return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${c.cls}`}>{c.label}</span>;
};

const DashboardSettlements = () => {
  const [activeTab, setActiveTab] = useState<Tab>("settlements");
  const [loading, setLoading] = useState(true);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [settlementCycle, setSettlementCycle] = useState<string>("every-15-min");

  // Summary values
  const [lastSettledAmount, setLastSettledAmount] = useState(0);
  const [lastSettledDate, setLastSettledDate] = useState<string>("");
  const [pendingAmount, setPendingAmount] = useState(0);
  const [upcomingAmount, setUpcomingAmount] = useState(0);
  const [upcomingDate, setUpcomingDate] = useState<string>("");
  const [bankTotals, setBankTotals] = useState<Record<string, { total: number; count: number }>>({});

  useEffect(() => {
    fetchSettlements();
  }, []);

  const fetchSettlements = async () => {
    setLoading(true);

    // Fetch captured payments grouped by date for settlement computation
    const { data: payments } = await supabase
      .from("payments")
      .select("id, amount, status, created_at, bank")
      .eq("status", "captured")
      .order("created_at", { ascending: false })
      .limit(500);

    if (!payments || payments.length === 0) {
      setLoading(false);
      return;
    }

    // Compute per-bank totals
    const perBank: Record<string, { total: number; count: number }> = {};
    payments.forEach((p: any) => {
      const bank = p.bank || "Unknown";
      if (!perBank[bank]) perBank[bank] = { total: 0, count: 0 };
      perBank[bank].total += (p.amount || 0) / 100;
      perBank[bank].count++;
    });
    setBankTotals(perBank);

    // Group by date
    const byDate: Record<string, { date: string; totalAmount: number; count: number; payments: any[] }> = {};
    payments.forEach((p: any) => {
      const d = new Date(p.created_at).toLocaleDateString("en-IN");
      if (!byDate[d]) byDate[d] = { date: d, totalAmount: 0, count: 0, payments: [] };
      byDate[d].totalAmount += (p.amount || 0) / 100;
      byDate[d].count++;
      byDate[d].payments.push(p);
    });

    const now = new Date();
    const today = now.toLocaleDateString("en-IN");

    const grouped = Object.values(byDate).sort((a, b) => {
      const parseDate = (str: string) => {
        const parts = str.split("/").map(Number);
        return new Date(parts[2], parts[1] - 1, parts[0]).getTime();
      };
      return parseDate(b.date) - parseDate(a.date);
    });

    // Build settlement records
    const settlementRecords: Settlement[] = grouped.map((g, idx) => {
      const fee = g.totalAmount * (FEE_PERCENT / 100);
      const net = g.totalAmount - fee;
      const isToday = g.date === today;

      let status: Settlement["status"];
      if (isToday) {
        status = "upcoming";
      } else if (idx === 0 && !isToday) {
        status = "settled";
      } else if (idx <= 1) {
        status = "settled";
      } else {
        status = "settled";
      }

      // Parse the date string for proper formatting
      const parts = g.date.split("/").map(Number);
      const dateObj = new Date(parts[2], parts[1] - 1, parts[0]);
      const nextDay = new Date(dateObj);
      nextDay.setDate(nextDay.getDate() + 1);

      return {
        id: `setl_${dateObj.getTime()}`,
        date: g.date,
        amount: g.totalAmount,
        fee: parseFloat(fee.toFixed(2)),
        netAmount: parseFloat(net.toFixed(2)),
        utr: `UTR${Date.now().toString(36).toUpperCase()}${idx}`,
        status: isToday ? "upcoming" : "settled",
        settledOn: isToday ? null : fmtDate(nextDay),
        paymentCount: g.count,
      };
    });

    // Mark latest as pending if it was yesterday
    if (settlementRecords.length > 0 && settlementRecords[0].status === "settled") {
      // keep as settled
    }

    // Mark today's as upcoming
    const todaySettlement = settlementRecords.find(s => s.status === "upcoming");
    const settledOnes = settlementRecords.filter(s => s.status === "settled");

    // Set summary values
    if (settledOnes.length > 0) {
      setLastSettledAmount(settledOnes[0].netAmount);
      setLastSettledDate(settledOnes[0].settledOn || settledOnes[0].date);
    }

    // Pending = today's unsettled
    const pendingTotal = settlementRecords
      .filter(s => s.status === "upcoming" || s.status === "pending")
      .reduce((sum, s) => sum + s.netAmount, 0);
    setPendingAmount(parseFloat(pendingTotal.toFixed(2)));

    // Upcoming = next settlement
    if (todaySettlement) {
      setUpcomingAmount(todaySettlement.netAmount);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setUpcomingDate(fmtDate(tomorrow));
    }

    setSettlements(settlementRecords);
    setLoading(false);
  };

  // Filter
  const filtered = useMemo(() => {
    return settlements.filter(s => {
      if (statusFilter !== "all" && s.status !== statusFilter) return false;
      if (searchQuery && !s.id.toLowerCase().includes(searchQuery.toLowerCase()) && !s.date.includes(searchQuery)) return false;
      return true;
    });
  }, [settlements, statusFilter, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const totalSettled = settlements.filter(s => s.status === "settled").reduce((sum, s) => sum + s.netAmount, 0);

  // Download CSV
  const downloadCSV = () => {
    const headers = "Settlement ID,Date,Gross Amount,Fee (1.70%),Net Amount,Status,Settled On,Payment Count";
    const rows = settlements.map(s =>
      `${s.id},${s.date},${s.amount.toFixed(2)},${s.fee.toFixed(2)},${s.netAmount.toFixed(2)},${s.status},${s.settledOn || ""},${s.paymentCount}`
    );
    const csv = [headers, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "zivonpay-settlements.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Settlements</h1>
          <p className="text-sm text-muted-foreground mt-1">Track and manage your settlement cycles</p>
        </div>
        <Button variant="outline" onClick={downloadCSV} disabled={settlements.length === 0} className="gap-2">
          <Download className="h-4 w-4" /> Download Monthly Invoice
        </Button>
      </div>

      {/* 3 Bank Settlement Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { name: "Jio Payments Bank", logo: "/logos/jio.jpg", accent: "border-l-amber-400", account: "XXXX1842" },
          { name: "NSDL Payments Bank", logo: "/logos/nsdl.png", accent: "border-l-primary", account: "XXXX3056" },
          { name: "Fino Payments Bank", logo: "/logos/fino.png", accent: "border-l-violet-400", account: "XXXX7291" },
        ].map(bank => {
          const data = bankTotals[bank.name] || { total: 0, count: 0 };
          const net = data.total - data.total * (FEE_PERCENT / 100);
          return (
            <div key={bank.name} className={`rounded-xl border border-border bg-card p-5 border-l-4 ${bank.accent}`}>
              <div className="flex items-center gap-2 mb-3">
                <img src={bank.logo} alt={bank.name} className="h-5 w-5 rounded-full object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
                <span className="text-sm font-semibold text-foreground">{bank.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-2xl font-bold text-foreground">{fmt(net)}</p>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-secondary text-foreground">
                  {data.count} txns
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">A/C: {bank.account}</p>
            </div>
          );
        })}
      </div>

      {/* Settlement Cycle Options */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-foreground mr-1">Settlement Cycle</span>
        {[
          { id: "every-15-min", label: "Every 15 Minutes" },
          { id: "every-3-hours", label: "Every 3 Hours" },
          { id: "same-day", label: "Same Day" },
        ].map(option => (
          <label
            key={option.id}
            className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 cursor-pointer text-xs font-medium transition-colors ${
              settlementCycle === option.id
                ? "border-primary bg-primary/5 text-foreground"
                : "border-border text-muted-foreground hover:bg-accent/40"
            }`}
          >
            <input
              type="radio"
              name="settlement-cycle"
              value={option.id}
              checked={settlementCycle === option.id}
              onChange={() => setSettlementCycle(option.id)}
              className="accent-primary h-3 w-3"
            />
            {option.label}
          </label>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-border">
        {([
          { id: "settlements" as Tab, label: "Settlements" },
          { id: "on-demand" as Tab, label: "On Demand Settlements" },
        ]).map(t => (
          <button key={t.id} onClick={() => { setActiveTab(t.id); setCurrentPage(1); }}
            className={`px-5 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
              activeTab === t.id
                ? "text-foreground border-primary"
                : "text-muted-foreground border-transparent hover:text-foreground"
            }`}
          >{t.label}</button>
        ))}
      </div>

      {/* ─── SETTLEMENTS TAB ─── */}
      {activeTab === "settlements" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                placeholder="Search by ID or date..."
                value={searchQuery}
                onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                className="w-full h-9 rounded-md border border-input bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground"
            >
              <option value="all">Status: All</option>
              <option value="settled">Settled</option>
              <option value="pending">Pending</option>
              <option value="upcoming">Upcoming</option>
            </select>
            <div className="flex items-center gap-2 ml-auto text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span className="text-sm">Last 7 days</span>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-7 w-7 text-primary animate-spin" />
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground bg-secondary/40 border-b border-border">
                      <th className="px-4 py-3 font-semibold">Settlement Date</th>
                      <th className="px-4 py-3 font-semibold">Settlement ID</th>
                      <th className="px-4 py-3 font-semibold">Payments</th>
                      <th className="px-4 py-3 font-semibold text-right">Gross Amount (₹)</th>
                      <th className="px-4 py-3 font-semibold text-right">Fee (1.70%)</th>
                      <th className="px-4 py-3 font-semibold text-right">Net Amount (₹)</th>
                      <th className="px-4 py-3 font-semibold">Expected / Settled</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paged.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-16 text-center">
                          <div className="flex flex-col items-center gap-2.5">
                            <Landmark className="h-10 w-10 text-muted-foreground/25" />
                            <p className="text-sm text-muted-foreground font-medium">No settlements found</p>
                            <p className="text-xs text-muted-foreground">Settlements will appear here once payments are captured.</p>
                          </div>
                        </td>
                      </tr>
                    ) : paged.map(s => (
                      <tr key={s.id} className="border-b border-border/60 hover:bg-accent/40 transition-colors">
                        <td className="px-4 py-3 font-medium">{s.date}</td>
                        <td className="px-4 py-3 font-mono text-xs text-primary">{s.id}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-secondary text-foreground font-medium">
                            {s.paymentCount} txns
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold">{fmt(s.amount)}</td>
                        <td className="px-4 py-3 text-right text-red-400">{fmt(s.fee)}</td>
                        <td className="px-4 py-3 text-right font-bold text-emerald-400">{fmt(s.netAmount)}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{s.settledOn || "Pending"}</td>
                        <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-2.5 border-t border-border">
                  <p className="text-xs text-muted-foreground">
                    Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length}
                  </p>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                      className="p-1.5 rounded-md border border-border text-muted-foreground hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed"
                    ><ChevronLeft className="h-4 w-4" /></button>
                    <span className="text-xs text-muted-foreground">Page {currentPage} of {totalPages}</span>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                      className="p-1.5 rounded-md border border-border text-muted-foreground hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed"
                    ><ChevronRight className="h-4 w-4" /></button>
                  </div>
                </div>
              )}
            </div>
          )}


        </div>
      )}

      {/* ─── ON DEMAND TAB ─── */}
      {activeTab === "on-demand" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span className="text-sm font-medium text-foreground">Last 7 days</span>
          </div>

          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground bg-secondary/40 border-b border-border">
                    <th className="px-4 py-3 font-semibold">Requested Date</th>
                    <th className="px-4 py-3 font-semibold">Request ID</th>
                    <th className="px-4 py-3 font-semibold text-right">Amount (₹)</th>
                    <th className="px-4 py-3 font-semibold text-right">Charges</th>
                    <th className="px-4 py-3 font-semibold">Expected Settlement Date</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={7} className="py-16 text-center">
                      <div className="flex flex-col items-center gap-2.5">
                        <div className="rounded-2xl bg-secondary p-5">
                          <Landmark className="h-10 w-10 text-muted-foreground/25" />
                        </div>
                        <p className="text-xs text-muted-foreground uppercase font-semibold tracking-wider mt-1">No Result Found</p>
                        <p className="text-sm font-semibold text-foreground">Oops! We didn't find anything</p>
                        <p className="text-xs text-muted-foreground">Remove the filters or reset the date & try again.</p>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default DashboardSettlements;
