import React, { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, PlusCircle, Filter } from "lucide-react";
import { useListExpenses } from "@workspace/api-client-react";
import { format } from "date-fns";

export default function Expenses() {
  const [search, setSearch] = useState("");
  const { data: expenses, isLoading } = useListExpenses({ search: search || undefined });

  return (
    <AppLayout>
      <div className="space-y-8 pb-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight" data-testid="expenses-title">Expense Tracker</h1>
            <p className="text-muted-foreground mt-1">Every dollar has a story.</p>
          </div>
          <Button size="lg" className="rounded-full shadow-lg hover-elevate" data-testid="btn-add-expense">
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
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="rounded-xl">
                <Filter className="mr-2 h-4 w-4" /> Filter
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
              </div>
            ) : expenses && expenses.length > 0 ? (
              <div className="space-y-3">
                {expenses.map(expense => (
                  <div key={expense.id} className="flex items-center justify-between p-4 bg-muted/20 rounded-xl hover:bg-muted/40 transition-colors border border-transparent hover:border-border">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center font-bold text-lg">
                        {expense.category.substring(0, 1)}
                      </div>
                      <div>
                        <p className="font-bold">{expense.description}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <Badge variant="secondary" className="text-[10px] py-0">{expense.category}</Badge>
                          <span>{format(new Date(expense.date), 'MMM d, yyyy')}</span>
                          {expense.mood && <span className="text-primary font-medium">{expense.mood}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-lg">
                        ${expense.amount.toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-muted/10 rounded-2xl border border-dashed">
                <p className="text-muted-foreground mb-4">No expenses found.</p>
                <Button variant="secondary">Clear Search</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
