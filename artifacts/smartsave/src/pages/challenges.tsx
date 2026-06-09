import { useState } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { CheckCircle2, Trophy, Lock, PlusCircle, TrendingUp } from "lucide-react";
import {
  useListChallenges,
  useListAchievements,
  useCreateChallenge,
  useUpdateChallenge,
  getListChallengesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const challengeSchema = z.object({
  name: z.string().min(1, "Name required"),
  description: z.string().min(1, "Description required"),
  targetAmount: z.coerce.number().min(0, "Amount must be 0 or more"),
  endDate: z.string().optional(),
  xpReward: z.coerce.number().int().positive("XP must be positive"),
});
type ChallengeFormData = z.infer<typeof challengeSchema>;

const progressSchema = z.object({
  currentAmount: z.coerce.number().min(0, "Must be 0 or more"),
});
type ProgressFormData = z.infer<typeof progressSchema>;

type Challenge = {
  id: number;
  name: string;
  description: string;
  targetAmount: number;
  currentAmount: number;
  endDate?: string | null;
  status: string;
  xpReward: number;
  percentComplete?: number;
};

export default function Challenges() {
  const qc = useQueryClient();
  const { toast } = useToast();

  const { data: challenges, isLoading: isLoadingChallenges } = useListChallenges();
  const { data: achievements, isLoading: isLoadingAchievements } = useListAchievements();
  const create = useCreateChallenge();
  const update = useUpdateChallenge();

  const [newOpen, setNewOpen] = useState(false);
  const [progressTarget, setProgressTarget] = useState<Challenge | null>(null);

  const form = useForm<ChallengeFormData>({
    resolver: zodResolver(challengeSchema),
    defaultValues: { name: "", description: "", targetAmount: 0, endDate: "", xpReward: 100 },
  });

  const progressForm = useForm<ProgressFormData>({
    resolver: zodResolver(progressSchema),
    defaultValues: { currentAmount: 0 },
  });

  function onCreateSubmit(data: ChallengeFormData) {
    create.mutate({
      data: {
        name: data.name,
        description: data.description,
        targetAmount: data.targetAmount,
        endDate: data.endDate || undefined,
        xpReward: data.xpReward,
      }
    }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListChallengesQueryKey() });
        setNewOpen(false);
        toast({ title: "Challenge created! Good luck!" });
      },
      onError: () => toast({ title: "Failed to create", variant: "destructive" }),
    });
  }

  function openProgress(c: Challenge) {
    progressForm.reset({ currentAmount: c.currentAmount });
    setProgressTarget(c);
  }

  function onProgressSubmit(data: ProgressFormData) {
    if (!progressTarget) return;
    const newStatus = progressTarget.targetAmount > 0 && data.currentAmount >= progressTarget.targetAmount ? "completed" : "active";
    update.mutate({ id: progressTarget.id, data: { currentAmount: data.currentAmount, status: newStatus } }, {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getListChallengesQueryKey() });
        setProgressTarget(null);
        toast({ title: newStatus === "completed" ? `Challenge complete! +${progressTarget.xpReward} XP earned!` : "Progress updated!" });
      },
      onError: () => toast({ title: "Failed to update", variant: "destructive" }),
    });
  }

  const activeChallenges = challenges?.filter(c => c.status === "active") ?? [];
  const completedChallenges = challenges?.filter(c => c.status === "completed") ?? [];
  const unlockedAchievements = achievements?.filter(a => a.isUnlocked) ?? [];
  const totalXP = unlockedAchievements.reduce((sum, a) => sum + (a.xpValue ?? 0), 0);

  return (
    <AppLayout>
      <div className="space-y-8 pb-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight" data-testid="challenges-title">Challenges & XP</h1>
            <p className="text-muted-foreground mt-1">Level up your financial habits.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 text-primary px-4 py-2 rounded-full font-bold text-sm" data-testid="text-total-xp">
              {totalXP} XP total
            </div>
            <Button size="lg" className="rounded-full shadow-lg" onClick={() => { form.reset({ name: "", description: "", targetAmount: 0, endDate: "", xpReward: 100 }); setNewOpen(true); }} data-testid="btn-add-challenge">
              <PlusCircle className="mr-2 h-4 w-4" /> New Challenge
            </Button>
          </div>
        </div>

        {/* Active Challenges */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Trophy className="text-primary" /> Active Challenges
          </h2>

          {isLoadingChallenges ? (
            <div className="grid gap-6 md:grid-cols-2">
              {[1, 2].map(i => <Skeleton key={i} className="h-44 w-full rounded-2xl" />)}
            </div>
          ) : activeChallenges.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2">
              {activeChallenges.map(challenge => (
                <Card key={challenge.id} className="overflow-hidden border-none shadow-md" data-testid={`card-challenge-${challenge.id}`}>
                  <div className="h-2 w-full bg-muted">
                    <div
                      className="h-full bg-secondary transition-all duration-1000"
                      style={{ width: `${challenge.targetAmount > 0 ? Math.min(challenge.percentComplete ?? 0, 100) : 0}%` }}
                    />
                  </div>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl">{challenge.name}</CardTitle>
                        <CardDescription className="mt-1">{challenge.description}</CardDescription>
                      </div>
                      <Badge variant="outline" className="font-bold bg-primary/10 text-primary border-primary/20 whitespace-nowrap">
                        +{challenge.xpReward} XP
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {challenge.targetAmount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">RM{challenge.currentAmount.toFixed(2)} / RM{challenge.targetAmount.toFixed(2)}</span>
                        <span className="text-muted-foreground">{(challenge.percentComplete ?? 0).toFixed(0)}%</span>
                      </div>
                    )}
                    {challenge.endDate && (
                      <p className="text-xs text-muted-foreground">Ends {format(new Date(challenge.endDate + "T00:00:00"), "MMM d, yyyy")}</p>
                    )}
                    <Button size="sm" variant="outline" className="w-full rounded-xl" onClick={() => openProgress(challenge as Challenge)} data-testid={`btn-update-progress-${challenge.id}`}>
                      <TrendingUp className="mr-2 h-3.5 w-3.5" /> Update Progress
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Trophy size={48} className="text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-lg font-bold mb-2">No active challenges</h3>
                <p className="text-muted-foreground text-center max-w-sm mb-6">Start a savings challenge to earn XP and level up faster.</p>
                <Button variant="outline" onClick={() => setNewOpen(true)}>Create a Challenge</Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Completed Challenges */}
        {completedChallenges.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <CheckCircle2 className="text-green-500" /> Completed Challenges
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {completedChallenges.map(c => (
                <div key={c.id} className="flex items-center gap-4 p-4 bg-green-500/5 border border-green-500/20 rounded-2xl" data-testid={`card-completed-challenge-${c.id}`}>
                  <CheckCircle2 className="text-green-500 shrink-0" />
                  <div className="flex-1">
                    <p className="font-bold">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.description}</p>
                  </div>
                  <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">+{c.xpReward} XP</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Achievements */}
        <div className="space-y-6 pt-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <CheckCircle2 className="text-yellow-500" /> Achievement Badges
          </h2>

          {isLoadingAchievements ? (
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
              {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
            </div>
          ) : achievements && achievements.length > 0 ? (
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
              {achievements.map(badge => (
                <div
                  key={badge.id}
                  className={`bg-card border rounded-2xl p-4 flex flex-col items-center text-center transition-all ${badge.isUnlocked ? "hover:shadow-md hover:border-primary/50" : "opacity-50 grayscale"}`}
                  data-testid={`badge-achievement-${badge.id}`}
                >
                  <div className={`h-16 w-16 rounded-full flex items-center justify-center mb-3 ${badge.isUnlocked ? "bg-yellow-500/20 text-yellow-500" : "bg-muted text-muted-foreground"}`}>
                    {badge.isUnlocked ? <Trophy size={28} /> : <Lock size={28} />}
                  </div>
                  <h4 className="font-bold text-sm leading-tight mb-1">{badge.name}</h4>
                  <p className="text-[10px] text-muted-foreground mb-2 leading-tight">{badge.description}</p>
                  {badge.isUnlocked ? (
                    <Badge variant="secondary" className="text-[10px] bg-yellow-500/10 text-yellow-700 dark:text-yellow-400">
                      +{badge.xpValue} XP
                    </Badge>
                  ) : (
                    <span className="text-[10px] text-muted-foreground font-medium">Locked · {badge.xpValue} XP</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No achievements found.</p>
          )}
        </div>
      </div>

      {/* New Challenge Dialog */}
      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Challenge</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onCreateSubmit)} className="space-y-4">
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Challenge Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. No-Spend Weekend" {...field} data-testid="input-challenge-name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="What's the challenge about?" rows={2} {...field} data-testid="input-challenge-description" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="targetAmount" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target (RM, 0 = no limit)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" min="0" placeholder="0.00" {...field} data-testid="input-challenge-target" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="xpReward" render={({ field }) => (
                  <FormItem>
                    <FormLabel>XP Reward</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" placeholder="100" {...field} data-testid="input-challenge-xp" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>
              <FormField control={form.control} name="endDate" render={({ field }) => (
                <FormItem>
                  <FormLabel>End Date (optional)</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} data-testid="input-challenge-end-date" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setNewOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={create.isPending} data-testid="btn-submit-challenge">Start Challenge</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Update Progress Dialog */}
      <Dialog open={!!progressTarget} onOpenChange={(o) => !o && setProgressTarget(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Update Progress</DialogTitle>
          </DialogHeader>
          <Form {...progressForm}>
            <form onSubmit={progressForm.handleSubmit(onProgressSubmit)} className="space-y-4">
              <p className="text-sm text-muted-foreground font-medium">{progressTarget?.name}</p>
              {progressTarget && progressTarget.targetAmount > 0 && (
                <p className="text-xs text-muted-foreground">Target: RM{progressTarget.targetAmount.toFixed(2)}</p>
              )}
              <FormField control={progressForm.control} name="currentAmount" render={({ field }) => (
                <FormItem>
                  <FormLabel>{progressTarget?.targetAmount === 0 ? "Days completed" : "Amount saved (RM)"}</FormLabel>
                  <FormControl>
                    <Input type="number" step={progressTarget?.targetAmount === 0 ? "1" : "0.01"} min="0" {...field} data-testid="input-progress-amount" autoFocus />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setProgressTarget(null)}>Cancel</Button>
                <Button type="submit" disabled={update.isPending} data-testid="btn-submit-progress">Save Progress</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
