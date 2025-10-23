import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { TrendingUp, Award, Calendar } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function WeeklySummary() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<any[]>([]);
  const [stats, setStats] = useState({
    avgDuration: 0,
    bestDay: "",
    bestDuration: 0,
    totalPoints: 0,
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/");
      return;
    }
    loadWeeklyData(user.id);
  };

  const loadWeeklyData = async (userId: string) => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data } = await supabase
      .from("sleep_logs")
      .select("*")
      .eq("user_id", userId)
      .gte("created_at", sevenDaysAgo.toISOString())
      .order("created_at", { ascending: true });

    if (data && data.length > 0) {
      setLogs(data);
      calculateStats(data);
    }
  };

  const calculateStats = (data: any[]) => {
    const avgDuration = data.reduce((sum, log) => sum + parseFloat(log.duration_hours), 0) / data.length;
    const totalPoints = data.reduce((sum, log) => sum + log.points_earned, 0);
    
    let bestDay = "";
    let bestDuration = 0;
    data.forEach((log) => {
      if (parseFloat(log.duration_hours) > bestDuration) {
        bestDuration = parseFloat(log.duration_hours);
        bestDay = new Date(log.created_at).toLocaleDateString('en-US', { weekday: 'long' });
      }
    });

    setStats({ avgDuration, bestDay, bestDuration, totalPoints });
  };

  const chartData = logs.map((log) => ({
    date: new Date(log.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    hours: parseFloat(log.duration_hours),
  }));

  return (
    <div className="min-h-screen bg-gradient-twilight">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <TrendingUp className="w-10 h-10 text-primary" />
            Weekly Summary
          </h1>
          <p className="text-muted-foreground text-lg">Your sleep insights for the past 7 days</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="w-5 h-5 text-primary" />
                Average Sleep
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-primary">
                {stats.avgDuration.toFixed(1)} hrs
              </div>
              <p className="text-sm text-muted-foreground mt-2">Per night</p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Award className="w-5 h-5 text-accent" />
                Best Night
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground mb-1">
                {stats.bestDay || "N/A"}
              </div>
              <p className="text-sm text-muted-foreground">
                {stats.bestDuration.toFixed(1)} hours
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                Points Earned
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold bg-gradient-accent bg-clip-text text-transparent">
                {stats.totalPoints}
              </div>
              <p className="text-sm text-muted-foreground mt-2">This week</p>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Sleep Duration Chart</CardTitle>
            <CardDescription>Your daily sleep hours for the past week</CardDescription>
          </CardHeader>
          <CardContent>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="hours" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-muted-foreground py-12">
                No sleep data available for the past week
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
