import { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Search, PlusCircle, Pencil, Trash2 } from "lucide-react";
import {
  useListExpenses,
  useCreateExpense,
  useUpdateExpense,
  useDeleteExpense,
  getListExpensesQueryKey,
  getGetDashboardSummaryQueryKey,
  getGetHealthScoreQueryKey,
  getGetAlertsQueryKey,
  getGetSpendingByCategoryQueryKey,
  getGetMonthlyTrendQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const CATEGORIES = [
  "Food & Drinks", "Transportation", "Education",
  "Entertainment", "Shopping", "Bills", "Health", "Miscellaneous",
];
const MOODS = ["Happy", "Stressed", "Bored", "Excited", "Sad"];

const schema = z.object({
  amount: z.coerce.number().positive("Amount must be positive"),
  category: z.string().min(1, "Pick a category"),
  description: z.string().min(1, "Description required"),
  date: z.string().min(1, "Date required"),
  mood: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

type Expense = {
  id: number;
  amount: number;
  category: string;
  description: string;
  date: string;
  mood?: string | null;
  createdAt: string;
};

function invalidateDashboard(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: getListExpensesQueryKey() });
  qc.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
  qc.invalidateQueries({ queryKey: getGetHealthScoreQueryKey() });
  qc.invalidateQueries({ queryKey: getGetAlertsQueryKey() });
  qc.invalidateQueries({ queryKey: getGetSpendingByCategoryQueryKey() });
  qc.invalidateQueries({ queryKey: getGetMonthlyTrendQueryKey() });
}

export default function Expenses() {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Expense | null>(null);

  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: expenses, isLoading } = useListExpenses({
    search: search || undefined,
    category: categoryFilter || undefined,
  });

  const create = useCreateExpense();
  const update = useUpdateExpense();
  const remove = useDeleteExpense();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { amount: 0, category: "", description: "", date: new Date().toISOString().slice(0, 10), mood: "" },
  });

  function openAdd() {
    setEditing(null);
    form.reset({ amount: 0, category: "", description: "", date: new Date().toISOString().slice(0, 10), mood: "" });
    setOpen(true);
  }

  function openEdit(e: Expense) {
    setEditing(e);
    form.reset({ amount: e.amount, category: e.category, description: e.description, date: e.date, mood: e.mood ?? "" });
    setOpen(true);
  }

  function onSubmit(data: FormData) {
    const payload = {
      amount: data.amount,
      category: data.category,
      description: data.description,
      date: data.date,
      mood: data.mood || undefined,
    };
    if (editing) {
      update.mutate({ id: editing.id, data: payload }, {
        onSuccess: () => {
          invalidateDashboard(qc);
          setOpen(false);
          toast({ title: "Expense updated" });
        },
        onError: () => toast({ title: "Failed to update", variant: "destructive" }),
      });
    } else {
      create.mutate({ data: payload }, {
        onSuccess: () => {
          invalidateDashboard(qc);
          setOpen(false);
          toast({ title: "Expense added" });
        },
        onError: () => toast({ title: "Failed to add", variant: "destructive" }),
      });
    }
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    remove.mutate({ id: deleteTarget.id }, {
      onSuccess: () => {
        invalidateDashboard(qc);
        setDeleteTarget(null);
        toast({ title: "Expense deleted" });
      },
      onError: () => toast({ title: "Failed to delete", variant: "destructive" }),
    });
  }

  return (
    <AppLayout>
      <div className="space-y-8 pb-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight" data-testid="expenses-title">Expense Tracker</h1>
            <p className="text-muted-foreground mt-1">Every dollar has a story.</p>
          </div>
          <Button size="lg" className="rounded-full shadow-lg" onClick={openAdd} data-testid="btn-add-expense">
            <PlusCircle className="mr-2 h-4 w-4" /> Add Expense
          </Button>
        </div>

        <Card className="border-none shadow-sm">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4">
            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search expenses..."
                className="pl-9 bg-muted/50 border-none rounded-xl"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                data-testid="input-search-expenses"
              />
            </div>
            <Select value={categoryFilter ?? "all"} onValueChange={(v) => setCategoryFilter(v === "all" ? undefined : v)}>
              <SelectTrigger className="w-full sm:w-44 rounded-xl bg-muted/50 border-none" data-testid="select-category-filter">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
              </div>
            ) : expenses && expenses.length > 0 ? (
              <div className="space-y-3">
                {expenses.map(expense => (
                  <div
                    key={expense.id}
                    className="flex items-center justify-between p-4 bg-muted/20 rounded-xl hover:bg-muted/40 transition-colors border border-transparent hover:border-border group"
                    data-testid={`row-expense-${expense.id}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center font-bold text-lg">
                        {expense.category.substring(0, 1)}
                      </div>
                      <div>
                        <p className="font-bold">{expense.description}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <Badge variant="secondary" className="text-[10px] py-0">{expense.category}</Badge>
                          <span>{format(new Date(expense.date + "T00:00:00"), "MMM d, yyyy")}</span>
                          {expense.mood && <span className="text-primary font-medium">{expense.mood}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="font-black text-lg">${expense.amount.toFixed(2)}</div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg" onClick={() => openEdit(expense as Expense)} data-testid={`btn-edit-expense-${expense.id}`}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg text-destructive hover:text-destructive" onClick={() => setDeleteTarget(expense as Expense)} data-testid={`btn-delete-expense-${expense.id}`}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-muted/10 rounded-2xl border border-dashed">
                <p className="text-muted-foreground mb-4">No expenses found.</p>
                <Button variant="secondary" onClick={openAdd}>Add your first expense</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add / Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Expense" : "Add Expense"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="amount" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (RM)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" placeholder="0.00" {...field} data-testid="input-expense-amount" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="date" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} data-testid="input-expense-date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Lunch at café" {...field} data-testid="input-expense-description" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="category" render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-expense-category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="mood" render={({ field }) => (
                <FormItem>
                  <FormLabel>Mood (optional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value ?? ""}>
                    <FormControl>
                      <SelectTrigger data-testid="select-expense-mood">
                        <SelectValue placeholder="How were you feeling?" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">No mood</SelectItem>
                      {MOODS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={create.isPending || update.isPending} data-testid="btn-submit-expense">
                  {editing ? "Save Changes" : "Add Expense"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete expense?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteTarget?.description}" for RM{deleteTarget?.amount.toFixed(2)} will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" data-testid="btn-confirm-delete-expense">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
