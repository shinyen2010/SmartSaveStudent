import React from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  useGetDashboardSummary, 
  useGetHealthScore, 
  useGetAlerts, 
  useGetSpendingForecast 
} from "@workspace/api-client-react";
import { AlertCircle, ArrowUpRight, CheckCircle2, TrendingDown, Info, Zap } from "lucide-react";
import { format } from "date-fns";

export default function Dashboard() {
  const { data: summary, isLoading: isLoadingSummary } = useGetDashboardSummary();
  const { data: healthScore, isLoading: isLoadingHealth } = useGetHealthScore();
  const { data: alerts, isLoading: isLoadingAlerts } = useGetAlerts();
  const { data: forecast, isLoading: isLoadingForecast } = useGetSpendingForecast();

  return (
    <AppLayout>
      <div className="space-y-8 pb-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight" data-testid="dashboard-title">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Welcome back! You're level {summary?.level || 1}.</p>
          </div>
          <Button size="lg" className="rounded-full shadow-lg hover-elevate">
            <Zap className="mr-2 h-4 w-4" /> Quick Add Expense
          </Button>
        </div>

        {/* Alerts */}
        {alerts && alerts.length > 0 && (
          <div className="space-y-3" data-testid="dashboard-alerts">
            {alerts.map(alert => (
              <Alert 
                key={alert.id} 
                variant={alert.severity === 'danger' ? 'destructive' : alert.severity === 'warning' ? 'default' : 'default'}
                className={alert.severity === 'warning' ? 'border-orange-500 bg-orange-500/10 text-orange-700 dark:text-orange-400' : ''}
              >
                {alert.severity === 'danger' ? <AlertCircle className="h-4 w-4" /> : alert.severity === 'warning' ? <AlertCircle className="h-4 w-4" /> : <Info className="h-4 w-4" />}
                <AlertTitle>{alert.type}</AlertTitle>
                <AlertDescription>{alert.message}</AlertDescription>
              </Alert>
            ))}
          </div>
        )}
        
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
              {isLoadingSummary ? (
                <Skeleton className="h-10 w-24" />
              ) : (
                <>
                  <div className="text-3xl font-bold" data-testid="text-spent-month">${summary?.totalSpentThisMonth.toFixed(2)}</div>
                  <p className="text-muted-foreground text-sm mt-2 flex items-center gap-1">
                    <TrendingDown className="h-4 w-4 text-secondary" /> 
                    <span>Looking good!</span>
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
              {isLoadingSummary ? (
                <Skeleton className="h-10 w-24" />
              ) : (
                <>
                  <div className="text-3xl font-bold text-secondary" data-testid="text-budget-remaining">${summary?.budgetRemaining.toFixed(2)}</div>
                  <p className="text-muted-foreground text-sm mt-2">
                    of ${summary?.totalBudget.toFixed(2)} total limit
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card data-testid="card-total-saved">
            <CardHeader className="pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium uppercase tracking-wider">Total Saved</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingSummary ? (
                <Skeleton className="h-10 w-24" />
              ) : (
                <>
                  <div className="text-3xl font-bold text-accent" data-testid="text-total-saved">${summary?.totalSaved.toFixed(2)}</div>
                  <p className="text-muted-foreground text-sm mt-2 flex items-center gap-1">
                    <ArrowUpRight className="h-4 w-4 text-accent" />
                    <span>Keep it up!</span>
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="lg:col-span-2" data-testid="card-recent-expenses">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Expenses</CardTitle>
                <CardDescription>Your latest transactions</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <a href="/expenses">View All</a>
              </Button>
            </CardHeader>
            <CardContent>
              {isLoadingSummary ? (
                <div className="space-y-4">
                  {[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
                </div>
              ) : summary?.recentExpenses?.length ? (
                <div className="space-y-3">
                  {summary.recentExpenses.map(expense => (
                    <div key={expense.id} className="flex items-center justify-between p-3 sm:p-4 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold">
                          {expense.category.substring(0, 1)}
                        </div>
                        <div>
                          <p className="font-semibold">{expense.description}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                            <Badge variant="outline" className="text-[10px] py-0">{expense.category}</Badge>
                            <span>{format(new Date(expense.date), 'MMM d')}</span>
                          </div>
                        </div>
                      </div>
                      <div className="font-bold text-lg">
                        ${expense.amount.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 bg-muted/20 rounded-xl border border-dashed">
                  <p className="text-muted-foreground">No recent expenses.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-card" data-testid="card-forecast">
            <CardHeader>
              <CardTitle>Forecast</CardTitle>
              <CardDescription>Predicted spending</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingForecast ? (
                <Skeleton className="h-40 w-full" />
              ) : forecast ? (
                <div className="space-y-6">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Projected end of month</p>
                    <div className="text-4xl font-black">${forecast.predictedMonthlySpend.toFixed(0)}</div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Daily average</span>
                      <span className="font-medium">${forecast.dailyAverage.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Days left</span>
                      <span className="font-medium">{forecast.daysLeft}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Risk level</span>
                      <Badge variant={forecast.overspendingRisk === 'High' ? 'destructive' : forecast.overspendingRisk === 'Medium' ? 'default' : 'secondary'}>
                        {forecast.overspendingRisk || 'Low'}
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
    </AppLayout>
  );
}
