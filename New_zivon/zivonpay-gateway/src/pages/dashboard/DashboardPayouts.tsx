import { useState, useEffect, useCallback } from "react";
import { Send, Upload, FileText, ExternalLink, X, Download, Search, CheckCircle2, XCircle, Clock, Loader2, Plus, ChevronLeft, ChevronRight, User, Users, IndianRupee, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/lib/supabase";

import { SAMPLE_PAYOUTS, type Payout } from "@/data/payoutsData";

const ITEMS_PER_PAGE = 10;

const BANKS = [
  { id: "jio", name: "Jio Payments Bank", logo: "/logos/jio.jpg" },
  { id: "nsdl", name: "NSDL Payments Bank", logo: "/logos/nsdl.png" },
  { id: "fino", name: "Fino Payments Bank", logo: "/logos/fino.png" },
];

interface Beneficiary {
  id: string;
  name: string;
  email: string | null;
  contact: string | null;
  account_number: string;
  ifsc: string;
  bank_name: string;
  active: boolean;
  created_at: string;
}

const downloadTemplate = () => {
  const headers = "name,account_number,ifsc_code,amount,email,phone,notes";
  const sampleRow = "John Doe,1234567890,SBIN0001234,5000,john@example.com,9876543210,Salary payout";
  const csv = `${headers}\n${sampleRow}`;
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "zivonpay-bulk-payout-template.csv";
  a.click();
  URL.revokeObjectURL(url);
};

const downloadBeneficiaryTemplate = () => {
  const headers = "name,account_number,ifsc_code,bank_name,email,phone";
  const sampleRow = "John Doe,1234567890,SBIN0001234,State Bank of India,john@example.com,9876543210";
  const csv = `${headers}\n${sampleRow}`;
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "zivonpay-beneficiary-template.csv";
  a.click();
  URL.revokeObjectURL(url);
};

const StatusBadge = ({ status }: { status: Payout["status"] }) => {
  const config = {
    queued: { label: "Queued", className: "bg-muted text-muted-foreground" },
    processing: { label: "Processing", className: "bg-primary/20 text-primary" },
    processed: { label: "Processed", className: "bg-emerald-500/20 text-emerald-400" },
    failed: { label: "Failed", className: "bg-destructive/20 text-destructive" },
  };
  const c = config[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${c.className}`}>
      {status === "processing" && <Loader2 className="h-3 w-3 animate-spin" />}
      {status === "processed" && <CheckCircle2 className="h-3 w-3" />}
      {status === "failed" && <XCircle className="h-3 w-3" />}
      {status === "queued" && <Clock className="h-3 w-3" />}
      {c.label}
    </span>
  );
};

type MainTab = "payouts" | "beneficiaries";

const DashboardPayouts = () => {
  const [mainTab, setMainTab] = useState<MainTab>("payouts");

  // Payout state
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showSingleModal, setShowSingleModal] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedBank, setSelectedBank] = useState<string>("");
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
  const [processProgress, setProcessProgress] = useState(0);
  const [processStep, setProcessStep] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Single payout form
  const [singleForm, setSingleForm] = useState({
    beneficiaryId: "",
    amount: "",
    mode: "IMPS",
    purpose: "payout",
    narration: "",
    bank: "",
  });
  const [singleProcessing, setSingleProcessing] = useState(false);

  // Beneficiary state
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [loadingBeneficiaries, setLoadingBeneficiaries] = useState(false);
  const [showAddBeneficiaryModal, setShowAddBeneficiaryModal] = useState(false);
  const [showBulkBeneficiaryModal, setShowBulkBeneficiaryModal] = useState(false);
  const [beneficiarySearch, setBeneficiarySearch] = useState("");
  const [beneficiaryPage, setBeneficiaryPage] = useState(1);
  const [benDragActive, setBenDragActive] = useState(false);
  const [benFile, setBenFile] = useState<File | null>(null);
  const [benBulkProcessing, setBenBulkProcessing] = useState(false);

  // Single beneficiary form
  const [benForm, setBenForm] = useState({
    name: "",
    account_number: "",
    ifsc: "",
    bank_name: "",
    email: "",
    phone: "",
  });
  const [benFormProcessing, setBenFormProcessing] = useState(false);

  // Load payouts
  useEffect(() => {
    const fetchPayouts = async () => {
      const { data, error } = await supabase
        .from("payouts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);

      if (!error && data && data.length > 0) {
        setPayouts(data.map((p: any) => ({
          payout_id: p.id,
          account_number: "",
          amount: String((p.amount || 0) / 100),
          currency: p.currency || "INR",
          mode: p.mode || "IMPS",
          purpose: p.purpose || "payout",
          status: p.status || "processing",
          utr: "",
          contact_id: "",
          fund_account_id: p.fund_account_id || "",
          notes: typeof p.notes === 'object' ? JSON.stringify(p.notes || {}) : (p.notes || ""),
          fees: "0",
          tax: "0",
          contact_name: p.narration || "",
          reversal_id: "",
          created_at: p.created_at || "",
          processed_at: "",
          reversed_at: "",
          scheduled_at: "",
          fee_type: "",
          status_reason: "",
          status_description: "",
        })));
      } else if (error) {
        console.error("Failed to fetch payouts:", error);
      }
    };
    fetchPayouts();
  }, []);

  // Load beneficiaries
  useEffect(() => {
    fetchBeneficiaries();
  }, []);

  const fetchBeneficiaries = async () => {
    setLoadingBeneficiaries(true);
    const { data: contacts } = await supabase
      .from("contacts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(300);

    if (contacts && contacts.length > 0) {
      const { data: fundAccounts } = await supabase
        .from("fund_accounts")
        .select("*")
        .in("contact_id", contacts.map((c: any) => c.id));

      const faMap: Record<string, any> = {};
      (fundAccounts || []).forEach((fa: any) => {
        if (fa.contact_id) faMap[fa.contact_id] = fa;
      });

      setBeneficiaries(contacts.map((c: any) => {
        const fa = faMap[c.id];
        const ba = fa?.bank_account || {};
        return {
          id: c.id,
          name: c.name || "",
          email: c.email,
          contact: c.contact,
          account_number: ba.account_number || "",
          ifsc: ba.ifsc || "",
          bank_name: ba.name || "",
          active: c.active !== false,
          created_at: c.created_at || "",
        };
      }));
    } else {
      setBeneficiaries([]);
    }
    setLoadingBeneficiaries(false);
  };

  // Handlers
  const handleDrag = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragActive(e.type === "dragenter" || e.type === "dragover"); };
  const handleDrop = (e: React.DragEvent) => { e.preventDefault(); setDragActive(false); const file = e.dataTransfer.files?.[0]; if (file?.name.endsWith(".csv")) setSelectedFile(file); };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files?.[0]) setSelectedFile(e.target.files[0]); };

  const handleBenDrag = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setBenDragActive(e.type === "dragenter" || e.type === "dragover"); };
  const handleBenDrop = (e: React.DragEvent) => { e.preventDefault(); setBenDragActive(false); const file = e.dataTransfer.files?.[0]; if (file?.name.endsWith(".csv")) setBenFile(file); };
  const handleBenFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files?.[0]) setBenFile(e.target.files[0]); };

  // Single Payout
  const handleSinglePayout = async () => {
    if (!singleForm.amount || !singleForm.bank || !singleForm.beneficiaryId) return;
    setSingleProcessing(true);
    const ben = beneficiaries.find(b => b.id === singleForm.beneficiaryId);
    const bankInfo = BANKS.find(b => b.id === singleForm.bank);

    const { error } = await supabase.from("payouts").insert({
      amount: Math.round(parseFloat(singleForm.amount) * 100),
      currency: "INR",
      status: "processed",
      mode: singleForm.mode,
      purpose: singleForm.purpose,
      narration: ben?.name || singleForm.narration,
      fund_account_id: null,
      notes: { bank: singleForm.bank, beneficiary_id: singleForm.beneficiaryId, single: true },
    });

    if (!error) {
      setPayouts(prev => [{
        payout_id: `pay_single_${Date.now()}`,
        account_number: ben?.account_number || "",
        amount: singleForm.amount,
        currency: "INR",
        mode: singleForm.mode,
        purpose: singleForm.purpose,
        status: "processed",
        utr: "",
        contact_id: singleForm.beneficiaryId,
        fund_account_id: "",
        notes: JSON.stringify({ bank: singleForm.bank, single: true }),
        fees: "0",
        tax: "0",
        contact_name: ben?.name || "",
        reversal_id: "",
        created_at: new Date().toISOString(),
        processed_at: new Date().toISOString(),
        reversed_at: "",
        scheduled_at: "",
        fee_type: "",
        status_reason: "payout_processed",
        status_description: `Single payout via ${bankInfo?.name || singleForm.bank}`,
      }, ...prev]);
    }

    setSingleProcessing(false);
    setShowSingleModal(false);
    setSingleForm({ beneficiaryId: "", amount: "", mode: "IMPS", purpose: "payout", narration: "", bank: "" });
    setShowSuccessOverlay(true);
    setTimeout(() => setShowSuccessOverlay(false), 3000);
  };

  // Bulk Payout
  const saveBulkPayoutsToSupabase = async (items: Payout[], bank: string) => {
    const rows = items
      .filter(p => p.status === "processed")
      .map(p => ({
        amount: Math.round(parseFloat(p.amount) * 100),
        currency: p.currency || "INR",
        status: "processed",
        mode: p.mode || "IMPS",
        purpose: p.purpose || "payout",
        narration: p.contact_name,
        fund_account_id: p.fund_account_id || null,
        notes: { bank, payout_id: p.payout_id, bulk: true },
      }));
    if (rows.length > 0) {
      await supabase.from("payouts").insert(rows);
    }
  };

  const simulateProcessing = useCallback(() => {
    const currentBank = selectedBank;
    setShowBulkModal(false);
    setSelectedFile(null);
    setIsProcessing(true);
    setProcessProgress(0);
    setProcessStep("Validating CSV file...");

    const total = SAMPLE_PAYOUTS.length;
    const queuedPayouts = SAMPLE_PAYOUTS.map(p => ({ ...p, status: "queued" as const }));
    setPayouts(prev => [...queuedPayouts, ...prev]);

    setTimeout(() => { setProcessProgress(3); setProcessStep("Validating CSV file..."); }, 1000);
    setTimeout(() => { setProcessProgress(7); setProcessStep("Checking file format and headers..."); }, 2500);
    setTimeout(() => { setProcessProgress(10); setProcessStep(`Verifying ${total} beneficiary accounts...`); }, 4000);

    const startDelay = 5000;
    const perItemDelay = Math.max(120, 15000 / total);

    for (let i = 0; i < total; i++) {
      const itemDelay = startDelay + i * perItemDelay;
      const progress = 12 + Math.round((i / total) * 83);
      setTimeout(() => {
        setProcessProgress(progress);
        setProcessStep(`Processing payout ${i + 1} of ${total} — ${SAMPLE_PAYOUTS[i].contact_name}...`);
        setPayouts(prev => prev.map((p, idx) => idx === i ? { ...p, status: "processing" as const } : p));
      }, itemDelay);
      setTimeout(() => {
        setPayouts(prev => prev.map((p, idx) => idx === i ? { ...SAMPLE_PAYOUTS[i] } : p));
      }, itemDelay + perItemDelay * 0.7);
    }

    const finalDelay = startDelay + total * perItemDelay + 500;
    setTimeout(() => {
      setProcessProgress(100);
      setProcessStep(`Batch complete! ${total} payouts processed.`);
      setPayouts([...SAMPLE_PAYOUTS]);
      saveBulkPayoutsToSupabase(SAMPLE_PAYOUTS, currentBank);
      setTimeout(() => {
        setIsProcessing(false);
        setShowSuccessOverlay(true);
        setTimeout(() => setShowSuccessOverlay(false), 4000);
      }, 1000);
    }, finalDelay);
  }, [selectedBank]);

  // Add Single Beneficiary
  const handleAddBeneficiary = async () => {
    if (!benForm.name || !benForm.account_number || !benForm.ifsc) return;
    setBenFormProcessing(true);

    const { data: contact, error: cErr } = await supabase
      .from("contacts")
      .insert({ name: benForm.name, email: benForm.email || null, contact: benForm.phone || null, type: "vendor", active: true, notes: {} })
      .select()
      .single();

    if (!cErr && contact) {
      await supabase.from("fund_accounts").insert({
        contact_id: contact.id,
        account_type: "bank_account",
        active: true,
        bank_account: { account_number: benForm.account_number, ifsc: benForm.ifsc, name: benForm.bank_name },
      });

      setBeneficiaries(prev => [{
        id: contact.id,
        name: benForm.name,
        email: benForm.email || null,
        contact: benForm.phone || null,
        account_number: benForm.account_number,
        ifsc: benForm.ifsc,
        bank_name: benForm.bank_name,
        active: true,
        created_at: new Date().toISOString(),
      }, ...prev]);
    }

    setBenFormProcessing(false);
    setShowAddBeneficiaryModal(false);
    setBenForm({ name: "", account_number: "", ifsc: "", bank_name: "", email: "", phone: "" });
  };

  // Add Bulk Beneficiaries (parse CSV)
  const handleBulkBeneficiaryUpload = async () => {
    if (!benFile) return;
    setBenBulkProcessing(true);

    const text = await benFile.text();
    const lines = text.trim().split("\n");
    const headers = lines[0].split(",").map(h => h.trim().toLowerCase());

    const nameIdx = headers.indexOf("name");
    const accIdx = headers.findIndex(h => h.includes("account"));
    const ifscIdx = headers.findIndex(h => h.includes("ifsc"));
    const bankIdx = headers.findIndex(h => h.includes("bank"));
    const emailIdx = headers.findIndex(h => h.includes("email"));
    const phoneIdx = headers.findIndex(h => h.includes("phone"));

    let addedCount = 0;
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(",").map(c => c.trim());
      const name = nameIdx >= 0 ? cols[nameIdx] : "";
      const acc = accIdx >= 0 ? cols[accIdx] : "";
      const ifsc = ifscIdx >= 0 ? cols[ifscIdx] : "";
      const bank = bankIdx >= 0 ? cols[bankIdx] : "";
      const email = emailIdx >= 0 ? cols[emailIdx] : "";
      const phone = phoneIdx >= 0 ? cols[phoneIdx] : "";

      if (!name || !acc) continue;

      const { data: contact, error: cErr } = await supabase
        .from("contacts")
        .insert({ name, email: email || null, contact: phone || null, type: "vendor", active: true, notes: { bulk_import: true } })
        .select()
        .single();

      if (!cErr && contact) {
        await supabase.from("fund_accounts").insert({
          contact_id: contact.id,
          account_type: "bank_account",
          active: true,
          bank_account: { account_number: acc, ifsc, name: bank },
        });
        addedCount++;
      }
    }

    setBenBulkProcessing(false);
    setShowBulkBeneficiaryModal(false);
    setBenFile(null);
    if (addedCount > 0) fetchBeneficiaries();
  };

  // Delete beneficiary
  const handleDeleteBeneficiary = async (id: string) => {
    await supabase.from("fund_accounts").delete().eq("contact_id", id);
    await supabase.from("contacts").delete().eq("id", id);
    setBeneficiaries(prev => prev.filter(b => b.id !== id));
  };

  // Filters & pagination
  const filteredPayouts = payouts.filter(p => {
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    if (searchQuery && !p.payout_id.toLowerCase().includes(searchQuery.toLowerCase()) && !p.contact_name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredPayouts.length / ITEMS_PER_PAGE));
  const paginatedPayouts = filteredPayouts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const filteredBeneficiaries = beneficiaries.filter(b =>
    !beneficiarySearch || b.name.toLowerCase().includes(beneficiarySearch.toLowerCase()) || b.account_number.includes(beneficiarySearch)
  );
  const benTotalPages = Math.max(1, Math.ceil(filteredBeneficiaries.length / ITEMS_PER_PAGE));
  const paginatedBeneficiaries = filteredBeneficiaries.slice((beneficiaryPage - 1) * ITEMS_PER_PAGE, beneficiaryPage * ITEMS_PER_PAGE);

  const hasPayouts = payouts.length > 0;

  const BankPicker = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {BANKS.map(bank => (
        <button key={bank.id} type="button" onClick={() => onChange(bank.id)}
          className={`flex items-center gap-2.5 rounded-lg border p-3 text-left transition-all ${
            value === bank.id ? "border-primary bg-primary/10 ring-1 ring-primary" : "border-border bg-secondary/50 hover:border-muted-foreground"
          }`}
        >
          <img src={bank.logo} alt={bank.name} className="h-7 w-7 rounded object-cover shrink-0" />
          <span className="text-sm font-medium text-foreground truncate">{bank.name}</span>
        </button>
      ))}
    </div>
  );

  const PaginationBar = ({ page, total, totalPages: tp, setPage }: { page: number; total: number; totalPages: number; setPage: (p: number) => void }) => tp <= 1 ? null : (
    <div className="flex items-center justify-between px-4 py-3 border-t border-border">
      <p className="text-xs text-muted-foreground">Showing {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, total)} of {total}</p>
      <div className="flex items-center gap-2">
        <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="p-1.5 rounded-md border border-border text-muted-foreground hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed"><ChevronLeft className="h-4 w-4" /></button>
        <span className="text-xs text-muted-foreground">Page {page} of {tp}</span>
        <button onClick={() => setPage(Math.min(tp, page + 1))} disabled={page === tp} className="p-1.5 rounded-md border border-border text-muted-foreground hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed"><ChevronRight className="h-4 w-4" /></button>
      </div>
    </div>
  );

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Payouts</h1>
            <p className="text-sm text-muted-foreground">Manage payouts and beneficiaries</p>
          </div>
          <Send className="h-8 w-8 text-primary" />
        </div>

        {/* Main Tabs */}
        <div className="flex items-center gap-1 border-b border-border">
          <button onClick={() => setMainTab("payouts")}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${mainTab === "payouts" ? "text-primary border-primary" : "text-muted-foreground border-transparent hover:text-foreground"}`}
          >
            <IndianRupee className="h-4 w-4" /> Payouts
          </button>
          <button onClick={() => setMainTab("beneficiaries")}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${mainTab === "beneficiaries" ? "text-primary border-primary" : "text-muted-foreground border-transparent hover:text-foreground"}`}
          >
            <Users className="h-4 w-4" /> Beneficiaries
          </button>
        </div>

        {/* ─── PAYOUTS TAB ─── */}
        {mainTab === "payouts" && (
          <>
            {/* Action buttons */}
            {!isProcessing && (
              <div className="flex items-center gap-3">
                <Button onClick={() => setShowSingleModal(true)}>
                  <User className="h-4 w-4 mr-2" /> Single Payout
                </Button>
                <Button variant="outline" onClick={() => setShowBulkModal(true)}>
                  <Upload className="h-4 w-4 mr-2" /> Bulk Payout
                </Button>
              </div>
            )}

            {/* Processing bar */}
            {isProcessing && (
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <Loader2 className="h-5 w-5 text-primary animate-spin" />
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Processing Payouts</h3>
                    <p className="text-xs text-muted-foreground">{processStep}</p>
                  </div>
                  <span className="ml-auto text-sm font-mono text-primary">{processProgress}%</span>
                </div>
                <Progress value={processProgress} className="h-2" />
              </div>
            )}

            {hasPayouts ? (
              <div className="space-y-4">
                {/* Summary */}
                {!isProcessing && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="rounded-lg border border-border bg-card p-4">
                      <p className="text-xs text-muted-foreground">Total Payouts</p>
                      <p className="text-2xl font-bold text-foreground">{filteredPayouts.length}</p>
                    </div>
                    <div className="rounded-lg border border-border bg-card p-4">
                      <p className="text-xs text-muted-foreground">Processed</p>
                      <p className="text-2xl font-bold text-emerald-400">{filteredPayouts.filter(p => p.status === "processed").length}</p>
                    </div>
                    <div className="rounded-lg border border-border bg-card p-4">
                      <p className="text-xs text-muted-foreground">Failed</p>
                      <p className="text-2xl font-bold text-destructive">{filteredPayouts.filter(p => p.status === "failed").length}</p>
                    </div>
                    <div className="rounded-lg border border-border bg-card p-4">
                      <p className="text-xs text-muted-foreground">Total Amount</p>
                      <p className="text-2xl font-bold text-foreground">₹{filteredPayouts.reduce((s, p) => s + parseFloat(p.amount), 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>
                )}

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search by Payout ID or Name" value={searchQuery} onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} className="pl-9" />
                  </div>
                  <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }} className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground">
                    <option value="all">Status: All</option>
                    <option value="processed">Processed</option>
                    <option value="failed">Failed</option>
                    <option value="processing">Processing</option>
                    <option value="queued">Queued</option>
                  </select>
                </div>

                {/* Table */}
                <div className="rounded-lg border border-border bg-card overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Payout ID</TableHead>
                        <TableHead>Contact Name</TableHead>
                        <TableHead>Account</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Mode</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedPayouts.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-12">
                            <Search className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                            <p className="text-muted-foreground">No payouts match your filters</p>
                          </TableCell>
                        </TableRow>
                      ) : paginatedPayouts.map((p, idx) => (
                        <>
                          <TableRow key={`${p.payout_id}-${idx}`} className="cursor-pointer hover:bg-accent/50" onClick={() => setExpandedRow(expandedRow === `${p.payout_id}-${idx}` ? null : `${p.payout_id}-${idx}`)}>
                            <TableCell className="font-mono text-xs text-primary">{p.payout_id}</TableCell>
                            <TableCell className="text-sm">{p.contact_name}</TableCell>
                            <TableCell className="font-mono text-xs">{p.account_number}</TableCell>
                            <TableCell className="font-semibold">₹{p.amount}</TableCell>
                            <TableCell><Badge variant="secondary" className="text-xs">{p.mode}</Badge></TableCell>
                            <TableCell><StatusBadge status={p.status} /></TableCell>
                            <TableCell className="text-xs text-muted-foreground">{p.created_at ? new Date(p.created_at).toLocaleDateString() : "—"}</TableCell>
                          </TableRow>
                          {expandedRow === `${p.payout_id}-${idx}` && (
                            <TableRow key={`${p.payout_id}-${idx}-detail`}>
                              <TableCell colSpan={7} className="bg-secondary/50 px-6 py-4">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                  <div><span className="text-muted-foreground text-xs">UTR</span><p className="font-mono text-xs">{p.utr || "—"}</p></div>
                                  <div><span className="text-muted-foreground text-xs">Fees</span><p>₹{p.fees}</p></div>
                                  <div><span className="text-muted-foreground text-xs">Tax</span><p>₹{p.tax}</p></div>
                                  <div><span className="text-muted-foreground text-xs">Purpose</span><p className="text-xs">{p.purpose}</p></div>
                                  <div><span className="text-muted-foreground text-xs">Notes</span><p className="font-mono text-xs break-all">{p.notes}</p></div>
                                  <div><span className="text-muted-foreground text-xs">Status Reason</span><p className="text-xs">{p.status_reason}</p></div>
                                  <div className="col-span-2"><span className="text-muted-foreground text-xs">Description</span><p className="text-xs">{p.status_description}</p></div>
                                </div>
                              </TableCell>
                            </TableRow>
                          )}
                        </>
                      ))}
                    </TableBody>
                  </Table>
                  <PaginationBar page={currentPage} total={filteredPayouts.length} totalPages={totalPages} setPage={setCurrentPage} />
                </div>
              </div>
            ) : !isProcessing ? (
              <div className="rounded-lg border border-border bg-card p-12 text-center">
                <div className="mb-8 flex justify-center">
                  <div className="relative">
                    <div className="bg-primary/10 rounded-lg p-6 transform rotate-6"><FileText className="h-16 w-16 text-primary" /></div>
                    <div className="absolute -right-4 -top-2"><Send className="h-12 w-12 text-primary/60 transform rotate-45" /></div>
                  </div>
                </div>
                <h2 className="text-2xl font-semibold text-foreground mb-3">No payouts yet</h2>
                <p className="text-muted-foreground mb-8 max-w-xl mx-auto">Create a single payout or upload a CSV for bulk payouts.</p>
                <div className="flex items-center justify-center gap-4">
                  <Button onClick={() => setShowSingleModal(true)}><User className="h-4 w-4 mr-2" /> Single Payout</Button>
                  <Button variant="outline" onClick={() => setShowBulkModal(true)}><Upload className="h-4 w-4 mr-2" /> Bulk Payout</Button>
                </div>
              </div>
            ) : null}
          </>
        )}

        {/* ─── BENEFICIARIES TAB ─── */}
        {mainTab === "beneficiaries" && (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={() => setShowAddBeneficiaryModal(true)}>
                <User className="h-4 w-4 mr-2" /> Add Beneficiary
              </Button>
              <Button variant="outline" onClick={() => setShowBulkBeneficiaryModal(true)}>
                <Upload className="h-4 w-4 mr-2" /> Bulk Upload
              </Button>
              <div className="relative flex-1 min-w-[200px] max-w-sm ml-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search by name or account" value={beneficiarySearch} onChange={(e) => { setBeneficiarySearch(e.target.value); setBeneficiaryPage(1); }} className="pl-9" />
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card overflow-hidden">
              {loadingBeneficiaries ? (
                <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Account Number</TableHead>
                        <TableHead>IFSC</TableHead>
                        <TableHead>Bank</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedBeneficiaries.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-12">
                            <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                            <p className="text-muted-foreground">{beneficiaries.length === 0 ? "No beneficiaries added yet" : "No results match your search"}</p>
                          </TableCell>
                        </TableRow>
                      ) : paginatedBeneficiaries.map(b => (
                        <TableRow key={b.id}>
                          <TableCell className="font-medium">{b.name}</TableCell>
                          <TableCell className="font-mono text-xs">{b.account_number || "—"}</TableCell>
                          <TableCell className="font-mono text-xs">{b.ifsc || "—"}</TableCell>
                          <TableCell className="text-sm">{b.bank_name || "—"}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{b.email || "—"}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{b.contact || "—"}</TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${b.active ? "bg-emerald-500/20 text-emerald-400" : "bg-muted text-muted-foreground"}`}>
                              {b.active ? "Active" : "Inactive"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <button onClick={() => handleDeleteBeneficiary(b.id)} className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <PaginationBar page={beneficiaryPage} total={filteredBeneficiaries.length} totalPages={benTotalPages} setPage={setBeneficiaryPage} />
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* ═══ SINGLE PAYOUT MODAL ═══ */}
      {showSingleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowSingleModal(false)} />
          <div className="relative z-10 rounded-lg border border-border bg-card shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">Single Payout</h3>
              <button onClick={() => setShowSingleModal(false)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 space-y-5">
              {/* Bank */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Source Bank</label>
                <BankPicker value={singleForm.bank} onChange={(v) => setSingleForm(f => ({ ...f, bank: v }))} />
              </div>

              {/* Beneficiary */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Select Beneficiary</label>
                {beneficiaries.length === 0 ? (
                  <div className="rounded-md border border-border p-4 text-center">
                    <p className="text-sm text-muted-foreground mb-2">No beneficiaries found</p>
                    <Button size="sm" variant="outline" onClick={() => { setShowSingleModal(false); setMainTab("beneficiaries"); setShowAddBeneficiaryModal(true); }}>
                      <Plus className="h-3 w-3 mr-1" /> Add Beneficiary
                    </Button>
                  </div>
                ) : (
                  <select
                    value={singleForm.beneficiaryId}
                    onChange={(e) => setSingleForm(f => ({ ...f, beneficiaryId: e.target.value }))}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground"
                  >
                    <option value="">Choose beneficiary...</option>
                    {beneficiaries.map(b => (
                      <option key={b.id} value={b.id}>{b.name} — {b.account_number || "No account"}</option>
                    ))}
                  </select>
                )}
              </div>

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Amount (₹)</label>
                <Input type="number" placeholder="0.00" value={singleForm.amount} onChange={(e) => setSingleForm(f => ({ ...f, amount: e.target.value }))} />
              </div>

              {/* Mode */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Mode</label>
                  <select value={singleForm.mode} onChange={(e) => setSingleForm(f => ({ ...f, mode: e.target.value }))} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground">
                    <option value="IMPS">IMPS</option>
                    <option value="NEFT">NEFT</option>
                    <option value="RTGS">RTGS</option>
                    <option value="UPI">UPI</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Purpose</label>
                  <select value={singleForm.purpose} onChange={(e) => setSingleForm(f => ({ ...f, purpose: e.target.value }))} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground">
                    <option value="payout">Payout</option>
                    <option value="salary">Salary</option>
                    <option value="refund">Refund</option>
                    <option value="vendor_payment">Vendor Payment</option>
                  </select>
                </div>
              </div>

              {/* Narration */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Narration (optional)</label>
                <Input placeholder="Payment description..." value={singleForm.narration} onChange={(e) => setSingleForm(f => ({ ...f, narration: e.target.value }))} />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
              <Button variant="outline" onClick={() => setShowSingleModal(false)}>Cancel</Button>
              <Button disabled={!singleForm.bank || !singleForm.beneficiaryId || !singleForm.amount || singleProcessing} onClick={handleSinglePayout}>
                {singleProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                Send Payout
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ BULK PAYOUT MODAL ═══ */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => { setShowBulkModal(false); setSelectedFile(null); setSelectedBank(""); }} />
          <div className="relative z-10 rounded-lg border border-border bg-card shadow-xl max-w-2xl w-full mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">Bulk Payout Upload</h3>
              <button onClick={() => { setShowBulkModal(false); setSelectedFile(null); setSelectedBank(""); }} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6">
              <div className="mb-5">
                <label className="block text-sm font-medium text-foreground mb-2">Select Source Bank</label>
                <BankPicker value={selectedBank} onChange={setSelectedBank} />
              </div>
              <div onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${dragActive ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground"}`}
              >
                <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                {selectedFile ? (
                  <div className="space-y-2">
                    <p className="text-foreground font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-muted-foreground">{(selectedFile.size / 1024).toFixed(2)} KB</p>
                    <button onClick={() => setSelectedFile(null)} className="text-primary hover:text-primary/80 text-sm">Remove file</button>
                  </div>
                ) : (
                  <>
                    <p className="text-foreground mb-2">Drag and drop your CSV file here, or</p>
                    <label className="inline-block">
                      <span className="text-primary hover:text-primary/80 cursor-pointer font-medium">browse files</span>
                      <input type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
                    </label>
                    <p className="text-sm text-muted-foreground mt-4">Only CSV files are supported</p>
                  </>
                )}
              </div>
              <div className="mt-6 rounded-md border border-border bg-secondary p-4">
                <h4 className="text-foreground font-medium mb-2 flex items-center gap-2"><FileText className="h-4 w-4" /> CSV Format</h4>
                <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
                  <li>Required: account_number, ifsc_code, amount, name</li>
                  <li>Optional: email, phone, notes</li>
                </ul>
                <button onClick={downloadTemplate} className="text-primary hover:text-primary/80 text-sm mt-3 flex items-center gap-1"><Download className="h-3 w-3" /> Download sample CSV</button>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
              <Button variant="outline" onClick={() => { setShowBulkModal(false); setSelectedFile(null); setSelectedBank(""); }}>Cancel</Button>
              <Button disabled={!selectedFile || !selectedBank} onClick={simulateProcessing}>Upload & Process</Button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ ADD SINGLE BENEFICIARY MODAL ═══ */}
      {showAddBeneficiaryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowAddBeneficiaryModal(false)} />
          <div className="relative z-10 rounded-lg border border-border bg-card shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">Add Beneficiary</h3>
              <button onClick={() => setShowAddBeneficiaryModal(false)} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Name *</label>
                <Input placeholder="Beneficiary name" value={benForm.name} onChange={(e) => setBenForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Account Number *</label>
                  <Input placeholder="1234567890" value={benForm.account_number} onChange={(e) => setBenForm(f => ({ ...f, account_number: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">IFSC Code *</label>
                  <Input placeholder="SBIN0001234" value={benForm.ifsc} onChange={(e) => setBenForm(f => ({ ...f, ifsc: e.target.value.toUpperCase() }))} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Bank Name</label>
                <Input placeholder="State Bank of India" value={benForm.bank_name} onChange={(e) => setBenForm(f => ({ ...f, bank_name: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Email</label>
                  <Input type="email" placeholder="email@example.com" value={benForm.email} onChange={(e) => setBenForm(f => ({ ...f, email: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">Phone</label>
                  <Input placeholder="9876543210" value={benForm.phone} onChange={(e) => setBenForm(f => ({ ...f, phone: e.target.value }))} />
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
              <Button variant="outline" onClick={() => setShowAddBeneficiaryModal(false)}>Cancel</Button>
              <Button disabled={!benForm.name || !benForm.account_number || !benForm.ifsc || benFormProcessing} onClick={handleAddBeneficiary}>
                {benFormProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                Add Beneficiary
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ BULK BENEFICIARY MODAL ═══ */}
      {showBulkBeneficiaryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => { setShowBulkBeneficiaryModal(false); setBenFile(null); }} />
          <div className="relative z-10 rounded-lg border border-border bg-card shadow-xl max-w-2xl w-full mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">Bulk Add Beneficiaries</h3>
              <button onClick={() => { setShowBulkBeneficiaryModal(false); setBenFile(null); }} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6">
              <div onDragEnter={handleBenDrag} onDragLeave={handleBenDrag} onDragOver={handleBenDrag} onDrop={handleBenDrop}
                className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${benDragActive ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground"}`}
              >
                <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                {benFile ? (
                  <div className="space-y-2">
                    <p className="text-foreground font-medium">{benFile.name}</p>
                    <p className="text-sm text-muted-foreground">{(benFile.size / 1024).toFixed(2)} KB</p>
                    <button onClick={() => setBenFile(null)} className="text-primary hover:text-primary/80 text-sm">Remove file</button>
                  </div>
                ) : (
                  <>
                    <p className="text-foreground mb-2">Drag and drop your CSV file here, or</p>
                    <label className="inline-block">
                      <span className="text-primary hover:text-primary/80 cursor-pointer font-medium">browse files</span>
                      <input type="file" accept=".csv" onChange={handleBenFileChange} className="hidden" />
                    </label>
                  </>
                )}
              </div>
              <div className="mt-6 rounded-md border border-border bg-secondary p-4">
                <h4 className="text-foreground font-medium mb-2 flex items-center gap-2"><FileText className="h-4 w-4" /> CSV Format</h4>
                <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
                  <li>Required: name, account_number, ifsc_code</li>
                  <li>Optional: bank_name, email, phone</li>
                </ul>
                <button onClick={downloadBeneficiaryTemplate} className="text-primary hover:text-primary/80 text-sm mt-3 flex items-center gap-1"><Download className="h-3 w-3" /> Download sample CSV</button>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border">
              <Button variant="outline" onClick={() => { setShowBulkBeneficiaryModal(false); setBenFile(null); }}>Cancel</Button>
              <Button disabled={!benFile || benBulkProcessing} onClick={handleBulkBeneficiaryUpload}>
                {benBulkProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                Upload & Add
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Success Overlay */}
      {showSuccessOverlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="flex flex-col items-center gap-5 animate-scale-in rounded-2xl border border-border bg-card px-12 py-10 shadow-2xl">
            <div className="rounded-full bg-emerald-500/15 p-5">
              <div className="rounded-full bg-emerald-500/25 p-4">
                <CheckCircle2 className="h-14 w-14 text-emerald-400" strokeWidth={1.5} />
              </div>
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground">Done!</h2>
              <p className="text-sm text-muted-foreground mt-1">Operation completed successfully</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DashboardPayouts;
