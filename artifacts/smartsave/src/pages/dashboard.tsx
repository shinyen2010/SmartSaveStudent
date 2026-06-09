import { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  useGetDashboardSummary,
  useGetHealthScore,
  useGetAlerts,
  useGetSpendingForecast,
  useCreateExpense,
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
import { AlertCircle, ArrowUpRight, TrendingDown, Info, Zap, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

const CATEGORIES = [
  "Food & Drinks", "Transportation", "Education",
  "Entertainment", "Shopping", "Bills", "Health", "Miscellaneous",
];
const MOODS = ["Happy", "Stressed", "Bored", "Excited", "Sad"];

const expenseSchema = z.object({
  amount: z.coerce.number().positive("Amount must be positive"),
  category: z.string().min(1, "Pick a category"),
  description: z.string().min(1, "Description required"),
  date: z.string().min(1, "Date required"),
  mood: z.string().optional(),
});
type ExpenseFormData = z.infer<typeof expenseSchema>;

function invalidateDashboard(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: getListExpensesQueryKey() });
  qc.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
  qc.invalidateQueries({ queryKey: getGetHealthScoreQueryKey() });
  qc.invalidateQueries({ queryKey: getGetAlertsQueryKey() });
  qc.invalidateQueries({ queryKey: getGetSpendingByCategoryQueryKey() });
  qc.invalidateQueries({ queryKey: getGetMonthlyTrendQueryKey() });
}

export default function Dashboard() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [addOpen, setAddOpen] = useState(false);

  const { data: summary, isLoading: isLoadingSummary } = useGetDashboardSummary();
  const { data: healthScore, isLoading: isLoadingHealth } = useGetHealthScore();
  const { data: alerts, isLoading: isLoadingAlerts } = useGetAlerts();
  const { data: forecast, isLoading: isLoadingForecast } = useGetSpendingForecast();
  const create = useCreateExpense();

  const form = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: { amount: 0, category: "", description: "", date: new Date().toISOString().slice(0, 10), mood: "" },
  });

  function onQuickAdd(data: ExpenseFormData) {
    create.mutate({ data: { amount: data.amount, category: data.category, description: data.description, date: data.date, mood: data.mood || undefined } }, {
      onSuccess: () => {
        invalidateDashboard(qc);
        setAddOpen(false);
        form.reset({ amount: 0, category: "", description: "", date: new Date().toISOString().slice(0, 10), mood: "" });
        toast({ title: "Expense added!" });
      },
      onError: () => toast({ title: "Failed to add expense", variant: "destructive" }),
    });
  }

  return (
    <AppLayout>
      <div className="space-y-8 pb-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight" data-testid="dashboard-title">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Welcome back! You're level {summary?.level ?? 1}.</p>
          </div>
          <Button size="lg" className="rounded-full shadow-lg" onClick={() => setAddOpen(true)} data-testid="btn-quick-add-expense">
            <Zap className="mr-2 h-4 w-4" /> Quick Add Expense
          </Button>
        </div>

        {/* Alerts */}
        {!isLoadingAlerts && alerts && alerts.length > 0 && (
          <div className="space-y-3" data-testid="dashboard-alerts">
            {alerts.map(alert => (
              <Alert
                key={alert.id}
                variant={alert.severity === "danger" ? "destructive" : "default"}
                className={alert.severity === "warning" ? "border-orange-500 bg-orange-500/10 text-orange-700 dark:text-orange-400" : ""}
              >
                {alert.severity === "danger" ? <AlertCircle className="h-4 w-4" /> : <Info className="h-4 w-4" />}
                <AlertTitle className="capitalize">{alert.type.replace(/_/g, " ")}</AlertTitle>
                <AlertDescription>{alert.message}</AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {/* Stats row */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-primary text-primary-foreground border-none overflow-hidden relative" data-testid="card-health-score">
            <div className="absolute -right-6 -top-6 opacity-10">
              <CheckCircle2 size={120} />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-primary-foreground/80 text-sm font-medium uppercase tracking-wider">Health Score</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingHealth ? (
                <Skeleton className="h-10 w-24 bg-primary-foreground/20" />
              ) : (
                <>
                  <div className="text-5xl font-black tracking-tighter" data-testid="text-health-score">{healthScore?.score}</div>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="bg-primary-foreground text-primary hover:bg-primary-foreground/90">
                      Grade: {healthScore?.grade}
                    </Badge>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-spent-month">
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium uppercase tracking-wider">Spent This Month</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingSummary ? <Skeleton className="h-10 w-24" /> : (
                <>
                  <div className="text-3xl font-bold" data-testid="text-spent-month">RM{summary?.totalSpentThisMonth.toFixed(2)}</div>
                  <p className="text-muted-foreground text-sm mt-2 flex items-center gap-1">
                    <TrendingDown className="h-4 w-4 text-green-500" />
                    <span>{summary?.expenseCount ?? 0} transactions</span>
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-budget-remaining">
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium uppercase tracking-wider">Budget Remaining</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingSummary ? <Skeleton className="h-10 w-24" /> : (
                <>
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400" data-testid="text-budget-remaining">RM{summary?.budgetRemaining.toFixed(2)}</div>
                  <p className="text-muted-foreground text-sm mt-2">of RM{summary?.totalBudget.toFixed(2)} total limit</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-total-saved">
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium uppercase tracking-wider">Total Saved</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingSummary ? <Skeleton className="h-10 w-24" /> : (
                <>
                  <div className="text-3xl font-bold text-purple-600 dark:text-purple-400" data-testid="text-total-saved">RM{summary?.totalSaved.toFixed(2)}</div>
                  <p className="text-muted-foreground text-sm mt-2 flex items-center gap-1">
                    <ArrowUpRight className="h-4 w-4 text-purple-500" />
                    <span>across all goals</span>
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Recent expenses */}
          <Card className="lg:col-span-2" data-testid="card-recent-expenses">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Expenses</CardTitle>
                <CardDescription>Your latest transactions</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/expenses">View All</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {isLoadingSummary ? (
                <div className="space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}</div>
              ) : summary?.recentExpenses?.length ? (
                <div className="space-y-3">
                  {summary.recentExpenses.map(expense => (
                    <div key={expense.id} className="flex items-center justify-between p-3 sm:p-4 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors" data-testid={`row-recent-expense-${expense.id}`}>
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold">
                          {expense.category.substring(0, 1)}
                        </div>
                        <div>
                          <p className="font-semibold">{expense.description}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <Badge variant="outline" className="text-[10px] py-0">{expense.category}</Badge>
                            <span>{format(new Date(expense.date + "T00:00:00"), "MMM d")}</span>
                            {expense.mood && <span className="text-primary font-medium">{expense.mood}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="font-bold text-lg">RM{expense.amount.toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 bg-muted/20 rounded-xl border border-dashed">
                  <p className="text-muted-foreground mb-3">No expenses yet this month.</p>
                  <Button size="sm" onClick={() => setAddOpen(true)}>Add your first expense</Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Forecast */}
          <Card data-testid="card-forecast">
            <CardHeader>
              <CardTitle>Forecast</CardTitle>
              <CardDescription>End-of-month prediction</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingForecast ? (
                <Skeleton className="h-40 w-full" />
              ) : forecast ? (
                <div className="space-y-5">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Projected spend</p>
                    <div className="text-4xl font-black" data-testid="text-forecast-spend">RM{forecast.predictedMonthlySpend.toFixed(0)}</div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Daily average</span>
                      <span className="font-medium">RM{forecast.dailyAverage.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Days left</span>
                      <span className="font-medium">{forecast.daysLeft}</span>
                    </div>
                    <div className="flex justify-between text-sm items-center">
                      <span className="text-muted-foreground">Risk level</span>
                      <Badge variant={forecast.overspendingRisk === "high" ? "destructive" : forecast.overspendingRisk === "medium" ? "default" : "secondary"}>
                        {forecast.overspendingRisk}
                      </Badge>
                    </div>
                  </div>
                  {forecast.recommendation && (
                    <div className="bg-primary/10 p-4 rounded-xl text-sm text-primary">
                      <p className="font-medium mb-1">Tip:</p>
                      <p className="opacity-90">{forecast.recommendation}</p>
                    </div>
                  )}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Add Expense Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Quick Add Expense</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onQuickAdd)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="amount" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount (RM)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" placeholder="0.00" {...field} data-testid="input-quick-amount" autoFocus />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="date" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} data-testid="input-quick-date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Lunch at café" {...field} data-testid="input-quick-description" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="category" render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-quick-category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
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
                      <SelectTrigger data-testid="select-quick-mood">
                        <SelectValue placeholder="How are you feeling?" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="none">No mood</SelectItem>
                      {MOODS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={create.isPending} data-testid="btn-submit-quick-expense">Add Expense</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
