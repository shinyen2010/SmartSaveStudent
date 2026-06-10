import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  useGetWalletBalance,
  useListWalletTransactions,
  useWalletTopUp,
  useWalletPay,
  useWalletTransfer,
} from "@workspace/api-client-react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Plus,
  Smartphone,
  CreditCard,
  Building2,
  X,
  CheckCircle2,
  History,
  RefreshCw,
  Send,
  ShoppingBag,
  Utensils,
  Bus,
  Wifi,
  Zap,
} from "lucide-react";

const CATEGORIES = ["Food", "Transport", "Shopping", "Bills", "Entertainment", "Others"];

const CATEGORY_ICONS: Record<string, typeof Utensils> = {
  Food: Utensils,
  Transport: Bus,
  Shopping: ShoppingBag,
  Bills: Zap,
  Entertainment: Wifi,
  Others: ShoppingBag,
};

function txTypeLabel(type: string) {
  switch (type) {
    case "topup": return "Top Up";
    case "payment": return "Payment";
    case "transfer_out": return "Transfer Out";
    case "transfer_in": return "Transfer In";
    case "cashback": return "Cashback";
    default: return type;
  }
}

function txSign(type: string) {
  return ["topup", "transfer_in", "cashback"].includes(type) ? "+" : "-";
}

function txColor(type: string) {
  return ["topup", "transfer_in", "cashback"].includes(type)
    ? "text-emerald-600"
    : "text-red-500";
}

function txIcon(type: string) {
  switch (type) {
    case "topup": return ArrowDownLeft;
    case "payment": return ShoppingBag;
    case "transfer_out": return ArrowUpRight;
    case "transfer_in": return ArrowDownLeft;
    case "cashback": return CheckCircle2;
    default: return ArrowLeftRight;
  }
}

function txBg(type: string) {
  switch (type) {
    case "topup": return "bg-emerald-100 text-emerald-600";
    case "payment": return "bg-blue-100 text-blue-600";
    case "transfer_out": return "bg-orange-100 text-orange-600";
    case "transfer_in": return "bg-emerald-100 text-emerald-600";
    case "cashback": return "bg-purple-100 text-purple-600";
    default: return "bg-gray-100 text-gray-600";
  }
}

type Modal = "topup" | "pay" | "transfer" | null;

export default function WalletPage() {
  const { toast } = useToast();
  const [modal, setModal] = useState<Modal>(null);

  const { data: balance, refetch: refetchBalance } = useGetWalletBalance();
  const { data: transactions, refetch: refetchTx } = useListWalletTransactions({ limit: 30 });

  const refetchAll = () => { refetchBalance(); refetchTx(); };

  return (
    <AppLayout>
      <div className="space-y-6 pb-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">My Wallet</h1>
          <Button variant="ghost" size="sm" onClick={refetchAll} className="gap-2 text-muted-foreground">
            <RefreshCw size={14} /> Refresh
          </Button>
        </div>

        {/* Wallet Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-3xl overflow-hidden"
          style={{ background: "linear-gradient(135deg, #0f4c81 0%, #1a73e8 50%, #00b4d8 100%)" }}
        >
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute -top-8 -right-8 w-48 h-48 rounded-full bg-white" />
            <div className="absolute -bottom-12 -left-12 w-64 h-64 rounded-full bg-white" />
          </div>

          <div className="relative p-7 text-white">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="bg-white/20 rounded-xl p-2">
                  <Smartphone size={20} />
                </div>
                <span className="font-bold text-lg tracking-wide">SmartSave Pay</span>
              </div>
              <Badge className="bg-white/20 hover:bg-white/20 text-white border-0 text-xs">Active</Badge>
            </div>

            <div className="mb-6">
              <p className="text-white/70 text-sm mb-1">Available Balance</p>
              <p className="text-4xl font-black tracking-tight">
                RM {(balance?.balance ?? 0).toFixed(2)}
              </p>
            </div>

            <div className="flex gap-4 text-sm">
              <div>
                <p className="text-white/60 text-xs">Total Top Ups</p>
                <p className="font-semibold">RM {(balance?.totalTopUps ?? 0).toFixed(2)}</p>
              </div>
              <div className="w-px bg-white/20" />
              <div>
                <p className="text-white/60 text-xs">Total Spent</p>
                <p className="font-semibold">RM {(balance?.totalSpent ?? 0).toFixed(2)}</p>
              </div>
              <div className="w-px bg-white/20" />
              <div>
                <p className="text-white/60 text-xs">Transferred</p>
                <p className="font-semibold">RM {(balance?.totalTransferred ?? 0).toFixed(2)}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Top Up", icon: Plus, color: "bg-emerald-50 text-emerald-700 border-emerald-200", action: "topup" as Modal },
            { label: "Pay", icon: Send, color: "bg-blue-50 text-blue-700 border-blue-200", action: "pay" as Modal },
            { label: "Transfer", icon: ArrowLeftRight, color: "bg-orange-50 text-orange-700 border-orange-200", action: "transfer" as Modal },
          ].map(({ label, icon: Icon, color, action }) => (
            <motion.button
              key={label}
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => setModal(action)}
              className={`flex flex-col items-center gap-2 rounded-2xl border p-4 font-semibold text-sm transition-all ${color}`}
            >
              <div className="p-2.5 rounded-xl bg-white/60">
                <Icon size={20} />
              </div>
              {label}
            </motion.button>
          ))}
        </div>

        {/* Transaction History */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <History size={16} className="text-muted-foreground" />
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Recent Transactions</h2>
          </div>

          {!transactions || transactions.length === 0 ? (
            <div className="rounded-2xl border bg-muted/30 py-12 text-center text-muted-foreground">
              <Smartphone size={32} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">No transactions yet</p>
              <p className="text-sm mt-1">Top up your wallet to get started</p>
            </div>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx, i) => {
                const Icon = txIcon(tx.type);
                return (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center gap-4 rounded-2xl border bg-card p-4"
                  >
                    <div className={`p-2.5 rounded-xl ${txBg(tx.type)}`}>
                      <Icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{tx.description}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">{txTypeLabel(tx.type)}</span>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs text-muted-foreground font-mono">{tx.referenceNo}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold text-sm ${txColor(tx.type)}`}>
                        {txSign(tx.type)}RM {tx.amount.toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(tx.createdAt).toLocaleDateString("en-MY", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {modal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={(e) => e.target === e.currentTarget && setModal(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              className="w-full max-w-md bg-card rounded-3xl p-6 shadow-2xl"
            >
              {modal === "topup" && (
                <TopUpForm
                  onClose={() => setModal(null)}
                  onSuccess={refetchAll}
                  toast={toast}
                />
              )}
              {modal === "pay" && (
                <PayForm
                  balance={balance?.balance ?? 0}
                  onClose={() => setModal(null)}
                  onSuccess={refetchAll}
                  toast={toast}
                />
              )}
              {modal === "transfer" && (
                <TransferForm
                  balance={balance?.balance ?? 0}
                  onClose={() => setModal(null)}
                  onSuccess={refetchAll}
                  toast={toast}
                />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppLayout>
  );
}

function TopUpForm({ onClose, onSuccess, toast }: { onClose: () => void; onSuccess: () => void; toast: ReturnType<typeof useToast>["toast"] }) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("Bank Transfer");
  const { mutateAsync, isPending } = useWalletTopUp();

  const PRESETS = [10, 20, 50, 100, 200, 500];
  const METHODS = [
    { label: "Bank Transfer", icon: Building2 },
    { label: "Credit/Debit Card", icon: CreditCard },
  ];

  async function handleSubmit() {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { toast({ title: "Enter a valid amount", variant: "destructive" }); return; }
    try {
      await mutateAsync({ data: { amount: amt, method } });
      toast({ title: `RM${amt.toFixed(2)} topped up!`, description: `Via ${method}` });
      onSuccess();
      onClose();
    } catch {
      toast({ title: "Top up failed", variant: "destructive" });
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Top Up</h2>
          <p className="text-sm text-muted-foreground">Add money to your wallet</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}><X size={18} /></Button>
      </div>

      <div>
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Amount (RM)</Label>
        <Input
          type="number"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="text-2xl font-bold h-14 text-center"
        />
        <div className="grid grid-cols-3 gap-2 mt-2">
          {PRESETS.map((p) => (
            <Button key={p} variant="outline" size="sm" className="rounded-xl" onClick={() => setAmount(String(p))}>
              RM {p}
            </Button>
          ))}
        </div>
      </div>

      <div>
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Payment Method</Label>
        <div className="space-y-2">
          {METHODS.map(({ label, icon: Icon }) => (
            <button
              key={label}
              onClick={() => setMethod(label)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${method === label ? "border-primary bg-primary/5" : "border-muted"}`}
            >
              <Icon size={18} className={method === label ? "text-primary" : "text-muted-foreground"} />
              <span className={`font-medium text-sm ${method === label ? "text-primary" : ""}`}>{label}</span>
              {method === label && <CheckCircle2 size={16} className="ml-auto text-primary" />}
            </button>
          ))}
        </div>
      </div>

      <Button className="w-full h-12 rounded-2xl text-base font-semibold" onClick={handleSubmit} disabled={isPending}>
        {isPending ? "Processing…" : `Top Up RM ${parseFloat(amount || "0").toFixed(2)}`}
      </Button>
    </div>
  );
}

function PayForm({ balance, onClose, onSuccess, toast }: { balance: number; onClose: () => void; onSuccess: () => void; toast: ReturnType<typeof useToast>["toast"] }) {
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Food");
  const [createExpense, setCreateExpense] = useState(true);
  const { mutateAsync, isPending } = useWalletPay();

  async function handleSubmit() {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { toast({ title: "Enter a valid amount", variant: "destructive" }); return; }
    if (!description.trim()) { toast({ title: "Enter a description", variant: "destructive" }); return; }
    if (amt > balance) { toast({ title: "Insufficient balance", description: `Your balance is RM${balance.toFixed(2)}`, variant: "destructive" }); return; }
    try {
      await mutateAsync({ data: { amount: amt, description: description.trim(), category, createExpense } });
      toast({ title: "Payment successful!", description: `RM${amt.toFixed(2)} paid` });
      onSuccess();
      onClose();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast({ title: msg ?? "Payment failed", variant: "destructive" });
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Pay</h2>
          <p className="text-sm text-muted-foreground">Balance: RM {balance.toFixed(2)}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}><X size={18} /></Button>
      </div>

      <div>
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Amount (RM)</Label>
        <Input type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className="text-2xl font-bold h-14 text-center" />
      </div>

      <div>
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Description</Label>
        <Input placeholder="What are you paying for?" value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>

      <div>
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Category</Label>
        <div className="grid grid-cols-3 gap-2">
          {CATEGORIES.map((cat) => {
            const Icon = CATEGORY_ICONS[cat] ?? ShoppingBag;
            return (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`flex items-center gap-1.5 p-2 rounded-xl border-2 text-sm font-medium transition-all ${category === cat ? "border-primary bg-primary/5 text-primary" : "border-muted text-muted-foreground"}`}
              >
                <Icon size={14} />{cat}
              </button>
            );
          })}
        </div>
      </div>

      <label className="flex items-center gap-3 cursor-pointer">
        <input type="checkbox" checked={createExpense} onChange={(e) => setCreateExpense(e.target.checked)} className="rounded" />
        <span className="text-sm font-medium">Also add to expense tracker</span>
      </label>

      <Button className="w-full h-12 rounded-2xl text-base font-semibold" onClick={handleSubmit} disabled={isPending}>
        {isPending ? "Processing…" : `Pay RM ${parseFloat(amount || "0").toFixed(2)}`}
      </Button>
    </div>
  );
}

function TransferForm({ balance, onClose, onSuccess, toast }: { balance: number; onClose: () => void; onSuccess: () => void; toast: ReturnType<typeof useToast>["toast"] }) {
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [note, setNote] = useState("");
  const { mutateAsync, isPending } = useWalletTransfer();

  async function handleSubmit() {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { toast({ title: "Enter a valid amount", variant: "destructive" }); return; }
    if (!recipient.trim()) { toast({ title: "Enter a recipient", variant: "destructive" }); return; }
    if (amt > balance) { toast({ title: "Insufficient balance", description: `Your balance is RM${balance.toFixed(2)}`, variant: "destructive" }); return; }
    try {
      await mutateAsync({ data: { amount: amt, recipient: recipient.trim(), note: note.trim() || undefined } });
      toast({ title: "Transfer successful!", description: `RM${amt.toFixed(2)} sent to ${recipient}` });
      onSuccess();
      onClose();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast({ title: msg ?? "Transfer failed", variant: "destructive" });
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Transfer</h2>
          <p className="text-sm text-muted-foreground">Balance: RM {balance.toFixed(2)}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}><X size={18} /></Button>
      </div>

      <div>
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Recipient (phone / name)</Label>
        <Input placeholder="e.g. 0123456789 or Ali" value={recipient} onChange={(e) => setRecipient(e.target.value)} />
      </div>

      <div>
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Amount (RM)</Label>
        <Input type="number" placeholder="0.00" value={amount} onChange={(e) => setAmount(e.target.value)} className="text-2xl font-bold h-14 text-center" />
      </div>

      <div>
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 block">Note (optional)</Label>
        <Input placeholder="e.g. Dinner split" value={note} onChange={(e) => setNote(e.target.value)} />
      </div>

      <Button className="w-full h-12 rounded-2xl text-base font-semibold" onClick={handleSubmit} disabled={isPending}>
        {isPending ? "Processing…" : `Send RM ${parseFloat(amount || "0").toFixed(2)}`}
      </Button>
    </div>
  );
}
