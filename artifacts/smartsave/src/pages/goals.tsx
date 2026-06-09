import React from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PlusCircle, Target as TargetIcon, Award, ChevronRight } from "lucide-react";
import { useListGoals } from "@workspace/api-client-react";

export default function Goals() {
  const { data: goals, isLoading } = useListGoals();

  const activeGoals = goals?.filter(g => !g.isCompleted) || [];
  const completedGoals = goals?.filter(g => g.isCompleted) || [];

  return (
    <AppLayout>
      <div className="space-y-8 pb-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight" data-testid="goals-title">Savings Goals</h1>
            <p className="text-muted-foreground mt-1">What are we saving for next?</p>
          </div>
          <Button size="lg" className="rounded-full shadow-lg hover-elevate bg-accent text-accent-foreground hover:bg-accent/90" data-testid="btn-add-goal">
            <PlusCircle className="mr-2 h-4 w-4" /> New Goal
          </Button>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <TargetIcon className="text-primary" /> Active Goals
          </h2>
          
          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full rounded-xl" />)}
            </div>
          ) : activeGoals.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {activeGoals.map(goal => (
                <Card key={goal.id} className="overflow-hidden hover-elevate transition-all border-none shadow-md" data-testid={`card-goal-${goal.id}`}>
                  <div className="h-2 w-full bg-muted">
                    <div 
                      className="h-full bg-primary transition-all duration-1000" 
                      style={{ width: `${Math.min(goal.percentComplete || 0, 100)}%` }} 
                    />
                  </div>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="bg-primary/10 text-primary p-3 rounded-2xl">
                        {/* Placeholder for icon */}
                        <TargetIcon size={24} />
                      </div>
                      <Badge variant="outline" className="font-bold">
                        {goal.percentComplete?.toFixed(0)}%
                      </Badge>
                    </div>
                    <CardTitle className="mt-4 text-xl">{goal.name}</CardTitle>
                    <CardDescription>Target: ${goal.targetAmount.toFixed(2)}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-end mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Saved so far</p>
                        <p className="text-2xl font-black">${goal.currentAmount.toFixed(2)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Remaining</p>
                        <p className="text-lg font-bold text-muted-foreground">
                          ${(goal.targetAmount - goal.currentAmount).toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <Button className="w-full rounded-xl font-bold" variant="secondary" data-testid={`btn-contribute-${goal.id}`}>
                      Contribute
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
             <div className="text-center py-16 bg-muted/20 rounded-3xl border-2 border-dashed">
                <div className="mx-auto w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
                  <TargetIcon size={32} />
                </div>
                <h3 className="text-lg font-bold mb-2">No active goals</h3>
                <p className="text-muted-foreground max-w-sm mx-auto mb-6">Start saving for your next adventure, gadget, or emergency fund.</p>
                <Button>Create your first goal</Button>
             </div>
          )}
        </div>

        {completedGoals.length > 0 && (
          <div className="space-y-6 mt-12 pt-8 border-t">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Award className="text-accent" /> Completed Achievements
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {completedGoals.map(goal => (
                <div key={goal.id} className="bg-card border rounded-2xl p-4 flex items-center gap-4 hover-elevate transition-all">
                  <div className="h-12 w-12 rounded-full bg-accent/10 text-accent flex items-center justify-center">
                    <Award size={24} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold">{goal.name}</h4>
                    <p className="text-sm text-muted-foreground">${goal.targetAmount.toFixed(2)} reached!</p>
                  </div>
                  <ChevronRight className="text-muted-foreground" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
