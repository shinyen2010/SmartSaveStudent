import { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { PlusCircle, AlertCircle, Pencil, Trash2 } from "lucide-react";
import {
  useListBudgets,
  useCreateBudget,
  useUpdateBudget,
  useDeleteBudget,
  getListBudgetsQueryKey,
  getGetDashboardSummaryQueryKey,
  getGetHealthScoreQueryKey,
  getGetAlertsQueryKey,
  getGetSpendingByCategoryQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

const CATEGORIES = [
  "Food & Drinks", "Transportation", "Education",
  "Entertainment", "Shopping", "Bills", "Health", "Miscellaneous",
];

const schema = z.object({
  category: z.string().min(1, "Pick a category"),
  monthlyLimit: z.coerce.number().positive("Limit must be positive"),
  month: z.string().min(1, "Month required"),
});
type FormData = z.infer<typeof schema>;

type Budget = {
  id: number;
  category: string;
  monthlyLimit: number;
  currentSpend: number;
  month: string;
  percentUsed?: number;
  isOverBudget?: boolean;
};

export default function Budget() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const currentMonth = new Date().toISOString().slice(0, 7);

  const { data: budgets, isLoading } = useListBudgets({ month: currentMonth });
  const create = useCreateBudget();
  const update = useUpdateBudget();
  const remove = useDeleteBudget();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Budget | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Budget | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { category: "", monthlyLimit: 0, month: currentMonth },
  });

  const existingCategories = new Set(budgets?.map((b) => b.category) ?? []);

  function openAdd() {
    setEditing(null);
    form.reset({ category: "", monthlyLimit: 0, month: currentMonth });
    setOpen(true);
  }

  function openEdit(b: Budget) {
    setEditing(b);
    form.reset({ category: b.category, monthlyLimit: b.monthlyLimit, month: b.month });
    setOpen(true);
  }

  function onSubmit(data: FormData) {
    if (editing) {
      update.mutate({ id: editing.id, data: { monthlyLimit: data.monthlyLimit } }, {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getListBudgetsQueryKey() });
          qc.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
          qc.invalidateQueries({ queryKey: getGetHealthScoreQueryKey() });
          qc.invalidateQueries({ queryKey: getGetAlertsQueryKey() });
          qc.invalidateQueries({ queryKey: getGetSpendingByCategoryQueryKey() });
          setOpen(false);
          toast({ title: "Budget updated" });
        },
        onError: () => toast({ title: "Failed to update", variant: "destructive" }),
      });
    } else {
      create.mutate({ data: { category: data.category, monthlyLimit: data.monthlyLimit, month: data.month } }, {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getListBudgetsQueryKey() });
          qc.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
          qc.invalidateQueries({ queryKey: getGetHealthScoreQueryKey() });
          qc.invalidateQueries({ queryKey: getGetAlertsQueryKey() });
          qc.invalidateQueries({ queryKey: getGetSpendingByCategoryQueryKey() });
          setOpen(false);
          toast({ title: "Budget created" });
        },
        onError: () => toast({ title: "Failed to create", variant: "destructive" }),
      });
    }
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    remove.mutate({ id: deleteTarget.id }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListBudgetsQueryKey() });
        qc.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
        setDeleteTarget(null);
        toast({ title: "Budget deleted" });
      },
      onError: () => toast({ title: "Failed to delete", variant: "destructive" }),
    });
  }

  const availableCategories = editing
    ? CATEGORIES
    : CATEGORIES.filter((c) => !existingCategories.has(c));

  return (
    <AppLayout>
      <div className="space-y-8 pb-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight" data-testid="budget-title">Budget Planner</h1>
            <p className="text-muted-foreground mt-1">Keep your spending in check.</p>
          </div>
          <Button size="lg" className="rounded-full shadow-lg" onClick={openAdd} data-testid="btn-add-budget">
            <PlusCircle className="mr-2 h-4 w-4" /> Set Limit
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            [1, 2, 3].map(i => <Skeleton key={i} className="h-44 w-full rounded-2xl" />)
          ) : budgets && budgets.length > 0 ? (
            budgets.map(budget => (
              <Card
                key={budget.id}
                className={`overflow-hidden group transition-all ${budget.isOverBudget ? "border-destructive shadow-[0_0_0_1px_hsl(var(--destructive))]" : "border-none shadow-md"}`}
                data-testid={`card-budget-${budget.id}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl">{budget.category}</CardTitle>
                    <div className="flex items-center gap-2">
                      {budget.isOverBudget && (
                        <Badge variant="destructive" className="flex items-center gap-1">
                          <AlertCircle size={12} /> Over Limit
                        </Badge>
                      )}
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg" onClick={() => openEdit(budget as Budget)} data-testid={`btn-edit-budget-${budget.id}`}>
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-destructive hover:text-destructive" onClick={() => setDeleteTarget(budget as Budget)} data-testid={`btn-delete-budget-${budget.id}`}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <CardDescription>Monthly Limit: RM{budget.monthlyLimit.toFixed(2)}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm font-medium">
                      <span className={budget.isOverBudget ? "text-destructive font-bold" : ""}>
                        RM{budget.currentSpend.toFixed(2)} spent
                      </span>
                      <span className="text-muted-foreground">
                        RM{Math.max(0, budget.monthlyLimit - budget.currentSpend).toFixed(2)} left
                      </span>
                    </div>
                    <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${budget.isOverBudget ? "bg-destructive" : "bg-primary"}`}
                        style={{ width: `${Math.min(budget.percentUsed ?? 0, 100)}%` }}
                      />
                    </div>
                    <p className="text-right text-xs text-muted-foreground">{(budget.percentUsed ?? 0).toFixed(0)}% used</p>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-16 bg-muted/20 rounded-3xl border-2 border-dashed">
              <h3 className="text-lg font-bold mb-2">No budgets set</h3>
              <p className="text-muted-foreground mb-6">Set spending limits for each category to stay on track.</p>
              <Button onClick={openAdd} data-testid="btn-create-first-budget">Create a Budget</Button>
            </div>
          )}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? `Edit ${editing.category} Budget` : "Set Budget Limit"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {!editing && (
                <FormField control={form.control} name="category" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-budget-category">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableCategories.length > 0
                          ? availableCategories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)
                          : <SelectItem value="_none" disabled>All categories have budgets</SelectItem>}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              )}
              <FormField control={form.control} name="monthlyLimit" render={({ field }) => (
                <FormItem>
                  <FormLabel>Monthly Limit (RM)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" min="0" placeholder="0.00" {...field} data-testid="input-budget-limit" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={create.isPending || update.isPending} data-testid="btn-submit-budget">
                  {editing ? "Save Changes" : "Create Budget"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete budget?</AlertDialogTitle>
            <AlertDialogDescription>
              The {deleteTarget?.category} budget will be removed. Your expense history is kept.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" data-testid="btn-confirm-delete-budget">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
