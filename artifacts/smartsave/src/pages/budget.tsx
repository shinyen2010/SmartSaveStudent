import React from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useListBudgets } from "@workspace/api-client-react";
import { Progress } from "@/components/ui/progress";
import { PlusCircle, AlertCircle } from "lucide-react";

export default function Budget() {
  const { data: budgets, isLoading } = useListBudgets();

  return (
    <AppLayout>
      <div className="space-y-8 pb-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight" data-testid="budget-title">Budget Planner</h1>
            <p className="text-muted-foreground mt-1">Keep your spending in check.</p>
          </div>
          <Button size="lg" className="rounded-full shadow-lg hover-elevate" data-testid="btn-add-budget">
            <PlusCircle className="mr-2 h-4 w-4" /> Set Limit
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            <>
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}
            </>
          ) : budgets && budgets.length > 0 ? (
            budgets.map(budget => (
              <Card 
                key={budget.id} 
                className={`overflow-hidden hover-elevate transition-all ${budget.isOverBudget ? 'border-destructive shadow-[0_0_0_1px_hsl(var(--destructive))]' : 'border-none shadow-md'}`}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl">{budget.category}</CardTitle>
                    {budget.isOverBudget && (
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <AlertCircle size={12} /> Over Limit
                      </Badge>
                    )}
                  </div>
                  <CardDescription>Monthly Limit: ${budget.monthlyLimit.toFixed(2)}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm font-medium">
                      <span className={budget.isOverBudget ? 'text-destructive font-bold' : ''}>
                        ${budget.currentSpend.toFixed(2)} spent
                      </span>
                      <span className="text-muted-foreground">
                        ${Math.max(0, budget.monthlyLimit - budget.currentSpend).toFixed(2)} left
                      </span>
                    </div>
                    <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${budget.isOverBudget ? 'bg-destructive' : 'bg-primary'}`}
                        style={{ width: `${Math.min(budget.percentUsed || 0, 100)}%` }}
                      />
                    </div>
                    <p className="text-right text-xs text-muted-foreground mt-1">{budget.percentUsed?.toFixed(0)}% used</p>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-16 bg-muted/20 rounded-3xl border-2 border-dashed">
              <h3 className="text-lg font-bold mb-2">No budgets set</h3>
              <p className="text-muted-foreground mb-6">Set spending limits for categories to stay on track.</p>
              <Button variant="outline">Create a Budget</Button>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
