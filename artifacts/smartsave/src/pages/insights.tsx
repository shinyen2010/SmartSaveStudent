import React from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useGetMonthlyTrend, useGetSpendingByCategory, useGetSpendingForecast } from "@workspace/api-client-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react";

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export default function Insights() {
  const { data: monthlyTrend, isLoading: isLoadingTrend } = useGetMonthlyTrend();
  const { data: categorySpending, isLoading: isLoadingCategory } = useGetSpendingByCategory();
  const { data: forecast, isLoading: isLoadingForecast } = useGetSpendingForecast();

  // Mock data if API is empty
  const trendData = monthlyTrend || [
    { month: 'Jan', totalSpent: 400, totalBudget: 800, totalSaved: 200 },
    { month: 'Feb', totalSpent: 300, totalBudget: 800, totalSaved: 300 },
    { month: 'Mar', totalSpent: 550, totalBudget: 800, totalSaved: 100 },
    { month: 'Apr', totalSpent: 450, totalBudget: 800, totalSaved: 250 },
    { month: 'May', totalSpent: 380, totalBudget: 800, totalSaved: 420 },
    { month: 'Jun', totalSpent: 600, totalBudget: 800, totalSaved: 0 },
  ];

  const catData = categorySpending?.length ? categorySpending : [
    { category: 'Food', amount: 200, percentage: 40 },
    { category: 'Transport', amount: 100, percentage: 20 },
    { category: 'Entertainment', amount: 150, percentage: 30 },
    { category: 'Bills', amount: 50, percentage: 10 },
  ];

  return (
    <AppLayout>
      <div className="space-y-8 pb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight" data-testid="insights-title">Spending Insights</h1>
          <p className="text-muted-foreground mt-1">Visualize your money moves.</p>
        </div>

        {forecast && (
          <Card className="bg-primary text-primary-foreground border-none">
            <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="bg-primary-foreground/20 p-4 rounded-full">
                  {forecast.overspendingRisk === 'High' ? <AlertTriangle size={32} /> : <CheckCircle2 size={32} />}
                </div>
                <div>
                  <h3 className="text-xl font-bold">Month Projection</h3>
                  <p className="text-primary-foreground/80">You're on track to spend ${forecast.predictedMonthlySpend.toFixed(0)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium opacity-80 uppercase tracking-wider">Risk Level</p>
                <p className="text-2xl font-black">{forecast.overspendingRisk || 'Low'}</p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Trend</CardTitle>
              <CardDescription>Your spending vs budget over 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingTrend ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trendData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" tickLine={false} axisLine={false} />
                      <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                      <Tooltip 
                        cursor={{fill: 'hsl(var(--muted))'}}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-md)' }} 
                      />
                      <Legend />
                      <Bar dataKey="totalSpent" name="Spent" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="totalSaved" name="Saved" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Category Breakdown</CardTitle>
              <CardDescription>Where your money went this month</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingCategory ? (
                <Skeleton className="h-[300px] w-full" />
              ) : (
                <div className="h-[300px] w-full flex items-center justify-center relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={catData}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={110}
                        paddingAngle={5}
                        dataKey="amount"
                        stroke="none"
                      >
                        {catData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-md)' }} 
                        formatter={(value: number) => `$${value}`}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-3xl font-black">${catData.reduce((a, b) => a + b.amount, 0).toFixed(0)}</span>
                    <span className="text-sm text-muted-foreground">Total</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
