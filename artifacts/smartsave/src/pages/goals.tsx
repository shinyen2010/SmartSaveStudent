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
import { PlusCircle, Target as TargetIcon, Award, ChevronRight, Trash2, PiggyBank } from "lucide-react";
import {
  useListGoals,
  useCreateGoal,
  useUpdateGoal,
  useDeleteGoal,
  useContributeToGoal,
  getListGoalsQueryKey,
  getGetDashboardSummaryQueryKey,
  getGetHealthScoreQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

const ICONS = ["target", "laptop", "plane", "shield", "home", "car", "book", "heart"];

const goalSchema = z.object({
  name: z.string().min(1, "Name required"),
  targetAmount: z.coerce.number().positive("Target must be positive"),
  deadline: z.string().optional(),
  icon: z.string().min(1, "Pick an icon"),
});
type GoalFormData = z.infer<typeof goalSchema>;

const contributeSchema = z.object({
  amount: z.coerce.number().positive("Amount must be positive"),
});
type ContributeFormData = z.infer<typeof contributeSchema>;

type Goal = {
  id: number;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string | null;
  icon: string;
  percentComplete?: number;
  isCompleted: boolean;
};

function invalidate(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: getListGoalsQueryKey() });
  qc.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
  qc.invalidateQueries({ queryKey: getGetHealthScoreQueryKey() });
}

export default function Goals() {
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: goals, isLoading } = useListGoals();
  const create = useCreateGoal();
  const remove = useDeleteGoal();
  const contribute = useContributeToGoal();

  const [goalOpen, setGoalOpen] = useState(false);
  const [contributeTarget, setContributeTarget] = useState<Goal | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Goal | null>(null);

  const goalForm = useForm<GoalFormData>({
    resolver: zodResolver(goalSchema),
    defaultValues: { name: "", targetAmount: 0, deadline: "", icon: "target" },
  });

  const contributeForm = useForm<ContributeFormData>({
    resolver: zodResolver(contributeSchema),
    defaultValues: { amount: 0 },
  });

  function openAdd() {
    goalForm.reset({ name: "", targetAmount: 0, deadline: "", icon: "target" });
    setGoalOpen(true);
  }

  function onGoalSubmit(data: GoalFormData) {
    create.mutate({ data: { name: data.name, targetAmount: data.targetAmount, deadline: data.deadline || undefined, icon: data.icon } }, {
      onSuccess: () => {
        invalidate(qc);
        setGoalOpen(false);
        toast({ title: "Goal created!" });
      },
      onError: () => toast({ title: "Failed to create goal", variant: "destructive" }),
    });
  }

  function onContribute(data: ContributeFormData) {
    if (!contributeTarget) return;
    contribute.mutate({ id: contributeTarget.id, data: { amount: data.amount } }, {
      onSuccess: () => {
        invalidate(qc);
        setContributeTarget(null);
        contributeForm.reset({ amount: 0 });
        toast({ title: `RM${data.amount.toFixed(2)} added to ${contributeTarget.name}!` });
      },
      onError: () => toast({ title: "Failed to contribute", variant: "destructive" }),
    });
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    remove.mutate({ id: deleteTarget.id }, {
      onSuccess: () => {
        invalidate(qc);
        setDeleteTarget(null);
        toast({ title: "Goal deleted" });
      },
      onError: () => toast({ title: "Failed to delete", variant: "destructive" }),
    });
  }

  const activeGoals = goals?.filter(g => !g.isCompleted) ?? [];
  const completedGoals = goals?.filter(g => g.isCompleted) ?? [];

  return (
    <AppLayout>
      <div className="space-y-8 pb-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight" data-testid="goals-title">Savings Goals</h1>
            <p className="text-muted-foreground mt-1">What are we saving for next?</p>
          </div>
          <Button size="lg" className="rounded-full shadow-lg" onClick={openAdd} data-testid="btn-add-goal">
            <PlusCircle className="mr-2 h-4 w-4" /> New Goal
          </Button>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <TargetIcon className="text-primary" /> Active Goals
          </h2>

          {isLoading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-52 w-full rounded-2xl" />)}
            </div>
          ) : activeGoals.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {activeGoals.map(goal => (
                <Card key={goal.id} className="overflow-hidden group transition-all border-none shadow-md" data-testid={`card-goal-${goal.id}`}>
                  <div className="h-2 w-full bg-muted">
                    <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${Math.min(goal.percentComplete ?? 0, 100)}%` }} />
                  </div>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div className="bg-primary/10 text-primary p-3 rounded-2xl">
                        <PiggyBank size={24} />
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-bold">{(goal.percentComplete ?? 0).toFixed(0)}%</Badge>
                        <Button size="icon" variant="ghost" className="h-7 w-7 rounded-lg text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setDeleteTarget(goal as Goal)} data-testid={`btn-delete-goal-${goal.id}`}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <CardTitle className="mt-4 text-xl">{goal.name}</CardTitle>
                    <CardDescription>
                      Target: RM{goal.targetAmount.toFixed(2)}
                      {goal.deadline && ` · Due ${new Date(goal.deadline + "T00:00:00").toLocaleDateString("en-MY", { month: "short", day: "numeric", year: "numeric" })}`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-end mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Saved so far</p>
                        <p className="text-2xl font-black">RM{goal.currentAmount.toFixed(2)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Remaining</p>
                        <p className="text-lg font-bold text-muted-foreground">RM{Math.max(0, goal.targetAmount - goal.currentAmount).toFixed(2)}</p>
                      </div>
                    </div>
                    <Button
                      className="w-full rounded-xl font-bold"
                      onClick={() => { contributeForm.reset({ amount: 0 }); setContributeTarget(goal as Goal); }}
                      data-testid={`btn-contribute-${goal.id}`}
                    >
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
              <p className="text-muted-foreground max-sm mb-6">Start saving for your next adventure, gadget, or emergency fund.</p>
              <Button onClick={openAdd}>Create your first goal</Button>
            </div>
          )}
        </div>

        {completedGoals.length > 0 && (
          <div className="space-y-6 mt-12 pt-8 border-t">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Award className="text-yellow-500" /> Completed Goals
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {completedGoals.map(goal => (
                <div key={goal.id} className="bg-card border rounded-2xl p-4 flex items-center gap-4 hover:shadow-md transition-all" data-testid={`card-completed-goal-${goal.id}`}>
                  <div className="h-12 w-12 rounded-full bg-yellow-500/10 text-yellow-500 flex items-center justify-center">
                    <Award size={24} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold">{goal.name}</h4>
                    <p className="text-sm text-muted-foreground">RM{goal.targetAmount.toFixed(2)} reached!</p>
                  </div>
                  <ChevronRight className="text-muted-foreground" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* New Goal Dialog */}
      <Dialog open={goalOpen} onOpenChange={setGoalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Goal</DialogTitle>
          </DialogHeader>
          <Form {...goalForm}>
            <form onSubmit={goalForm.handleSubmit(onGoalSubmit)} className="space-y-4">
              <FormField control={goalForm.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Goal Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. New Laptop" {...field} data-testid="input-goal-name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={goalForm.control} name="targetAmount" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target (RM)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" placeholder="0.00" {...field} data-testid="input-goal-target" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={goalForm.control} name="deadline" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deadline (optional)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} data-testid="input-goal-deadline" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={goalForm.control} name="icon" render={({ field }) => (
                <FormItem>
                  <FormLabel>Icon</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-goal-icon">
                        <SelectValue placeholder="Select icon" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ICONS.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setGoalOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={create.isPending} data-testid="btn-submit-goal">Create Goal</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Contribute Dialog */}
      <Dialog open={!!contributeTarget} onOpenChange={(o) => !o && setContributeTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Contribute to {contributeTarget?.name}</DialogTitle>
          </DialogHeader>
          <Form {...contributeForm}>
            <form onSubmit={contributeForm.handleSubmit(onContribute)} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Current: RM{contributeTarget?.currentAmount.toFixed(2)} / RM{contributeTarget?.targetAmount.toFixed(2)}
              </p>
              <FormField control={contributeForm.control} name="amount" render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount to add (RM)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" min="0.01" placeholder="0.00" {...field} data-testid="input-contribute-amount" autoFocus />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setContributeTarget(null)}>Cancel</Button>
                <Button type="submit" disabled={contribute.isPending} data-testid="btn-submit-contribute">Add Funds</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete goal?</AlertDialogTitle>
            <AlertDialogDescription>
              "{deleteTarget?.name}" and all its saved progress will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" data-testid="btn-confirm-delete-goal">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
}
