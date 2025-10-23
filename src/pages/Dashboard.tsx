import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Moon, Star, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [sleepTime, setSleepTime] = useState("");
  const [wakeTime, setWakeTime] = useState("");
  const [todaysLog, setTodaysLog] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/");
      return;
    }
    setUser(user);
    loadProfile(user.id);
    loadTodaysLog(user.id);
  };

  const loadProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    setProfile(data);
  };

  const loadTodaysLog = async (userId: string) => {
    const today = new Date().toISOString().split("T")[0];
    const { data } = await supabase
      .from("sleep_logs")
      .select("*")
      .eq("user_id", userId)
      .gte("created_at", `${today}T00:00:00`)
      .lte("created_at", `${today}T23:59:59`)
      .single();
    setTodaysLog(data);
  };

  const calculateDuration = (sleep: string, wake: string) => {
    const sleepDate = new Date(sleep);
    const wakeDate = new Date(wake);
    const diff = wakeDate.getTime() - sleepDate.getTime();
    return Math.abs(diff / (1000 * 60 * 60));
  };

  const calculatePoints = (hours: number) => {
    if (hours >= 7 && hours <= 9) return 20;
    if (hours >= 6 && hours < 7) return 10;
    if (hours > 9 && hours <= 10) return 10;
    return 5;
  };

  const handleLogSleep = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sleepTime || !wakeTime) {
      toast.error("Please enter both sleep and wake times");
      return;
    }

    setLoading(true);
    const duration = calculateDuration(sleepTime, wakeTime);
    const points = calculatePoints(duration);

    const { error } = await supabase.from("sleep_logs").insert({
      user_id: user.id,
      sleep_time: sleepTime,
      wake_time: wakeTime,
      duration_hours: duration,
      points_earned: points,
    });

    if (error) {
      toast.error("Error logging sleep");
    } else {
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ total_points: (profile?.total_points || 0) + points })
        .eq("id", user.id);

      if (!updateError) {
        toast.success(`Sleep logged! You earned ${points} points 🌟`);
        setSleepTime("");
        setWakeTime("");
        loadProfile(user.id);
        loadTodaysLog(user.id);
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-twilight">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <Moon className="w-10 h-10 text-primary" />
            Good {new Date().getHours() < 12 ? "Morning" : new Date().getHours() < 18 ? "Afternoon" : "Evening"}!
          </h1>
          <p className="text-muted-foreground text-lg">Track your sleep and earn rewards</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card className="shadow-card hover:shadow-glow transition-all">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-accent" />
                Your Points
              </CardTitle>
              <CardDescription>Total points earned</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-5xl font-bold bg-gradient-accent bg-clip-text text-transparent">
                {profile?.total_points || 0}
              </div>
              <p className="text-sm text-muted-foreground mt-2">Keep logging to earn more!</p>
            </CardContent>
          </Card>

          <Card className="shadow-card hover:shadow-glow transition-all">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5 text-primary" />
                Today's Status
              </CardTitle>
              <CardDescription>Your sleep log for today</CardDescription>
            </CardHeader>
            <CardContent>
              {todaysLog ? (
                <div>
                  <div className="text-3xl font-bold text-primary mb-2">
                    {todaysLog.duration_hours.toFixed(1)} hrs
                  </div>
                  <p className="text-sm text-muted-foreground">
                    +{todaysLog.points_earned} points earned
                  </p>
                </div>
              ) : (
                <div className="text-muted-foreground">No sleep logged today</div>
              )}
            </CardContent>
          </Card>
        </div>

        {!todaysLog && (
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Log Your Sleep</CardTitle>
              <CardDescription>Enter when you went to sleep and woke up</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogSleep} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="sleepTime">Sleep Time</Label>
                    <Input
                      id="sleepTime"
                      type="datetime-local"
                      value={sleepTime}
                      onChange={(e) => setSleepTime(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="wakeTime">Wake Time</Label>
                    <Input
                      id="wakeTime"
                      type="datetime-local"
                      value={wakeTime}
                      onChange={(e) => setWakeTime(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "Logging..." : "Log Sleep"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
