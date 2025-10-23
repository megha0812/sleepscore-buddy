import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { User, Calendar, Moon, TrendingUp } from "lucide-react";

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [totalHours, setTotalHours] = useState(0);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/");
      return;
    }
    loadProfileData(user.id);
  };

  const loadProfileData = async (userId: string) => {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    setProfile(profileData);

    const { data: logsData, count } = await supabase
      .from("sleep_logs")
      .select("*", { count: 'exact' })
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10);

    if (logsData) {
      setLogs(logsData);
      
      // Get all logs to calculate totals
      const { data: allLogs } = await supabase
        .from("sleep_logs")
        .select("duration_hours")
        .eq("user_id", userId);
      
      if (allLogs) {
        setTotalLogs(allLogs.length);
        const hours = allLogs.reduce((sum, log) => sum + parseFloat(log.duration_hours.toString()), 0);
        setTotalHours(hours);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-twilight">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <User className="w-10 h-10 text-primary" />
            Your Profile
          </h1>
          <p className="text-muted-foreground text-lg">{profile?.email}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calendar className="w-5 h-5 text-primary" />
                Total Logs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-primary">{totalLogs}</div>
              <p className="text-sm text-muted-foreground mt-2">Sleep sessions</p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Moon className="w-5 h-5 text-primary" />
                Total Hours
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-primary">{totalHours.toFixed(1)}</div>
              <p className="text-sm text-muted-foreground mt-2">Hours tracked</p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="w-5 h-5 text-accent" />
                Total Points
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold bg-gradient-accent bg-clip-text text-transparent">
                {profile?.total_points || 0}
              </div>
              <p className="text-sm text-muted-foreground mt-2">Points earned</p>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Recent Sleep History</CardTitle>
            <CardDescription>Your last 10 sleep logs</CardDescription>
          </CardHeader>
          <CardContent>
            {logs.length > 0 ? (
              <div className="space-y-4">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-4 bg-secondary rounded-lg"
                  >
                    <div>
                      <div className="font-semibold">
                        {new Date(log.created_at).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(log.sleep_time).toLocaleTimeString('en-US', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })} → {new Date(log.wake_time).toLocaleTimeString('en-US', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">
                        {parseFloat(log.duration_hours).toFixed(1)} hrs
                      </div>
                      <div className="text-sm text-accent">+{log.points_earned} pts</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                No sleep logs yet. Start tracking your sleep!
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
