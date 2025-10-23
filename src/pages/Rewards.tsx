import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Gift, Sparkles } from "lucide-react";

export default function Rewards() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [rewards, setRewards] = useState<any[]>([]);
  const [redeemedRewards, setRedeemedRewards] = useState<any[]>([]);

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
    loadData(user.id);
  };

  const loadData = async (userId: string) => {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    setProfile(profileData);

    const { data: rewardsData } = await supabase
      .from("rewards")
      .select("*")
      .order("points_cost", { ascending: true });
    setRewards(rewardsData || []);

    const { data: redeemedData } = await supabase
      .from("redeemed_rewards")
      .select("*, rewards(*)")
      .eq("user_id", userId)
      .order("redeemed_at", { ascending: false });
    setRedeemedRewards(redeemedData || []);
  };

  const handleRedeem = async (reward: any) => {
    if (!profile || profile.total_points < reward.points_cost) {
      toast.error("Not enough points!");
      return;
    }

    const { error: redeemError } = await supabase
      .from("redeemed_rewards")
      .insert({
        user_id: user.id,
        reward_id: reward.id,
      });

    if (redeemError) {
      toast.error("Error redeeming reward");
      return;
    }

    const newPoints = profile.total_points - reward.points_cost;
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ total_points: newPoints })
      .eq("id", user.id);

    if (!updateError) {
      toast.success(`${reward.name} redeemed! 🎉`);
      loadData(user.id);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-twilight">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <Gift className="w-10 h-10 text-accent" />
            Rewards Store
          </h1>
          <p className="text-muted-foreground text-lg">
            You have <span className="text-accent font-bold">{profile?.total_points || 0}</span> points
          </p>
        </div>

        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary" />
            Available Rewards
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rewards.map((reward) => (
              <Card key={reward.id} className="shadow-card hover:shadow-glow transition-all">
                <CardHeader>
                  <div className="text-4xl mb-2">{reward.icon}</div>
                  <CardTitle>{reward.name}</CardTitle>
                  <CardDescription>{reward.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-accent">
                      {reward.points_cost} pts
                    </span>
                    <Button
                      onClick={() => handleRedeem(reward)}
                      disabled={!profile || profile.total_points < reward.points_cost}
                      variant={profile?.total_points >= reward.points_cost ? "default" : "secondary"}
                    >
                      Redeem
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {redeemedRewards.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold mb-6">Your Redeemed Rewards</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {redeemedRewards.map((item) => (
                <Card key={item.id} className="shadow-card">
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="text-3xl">{item.rewards.icon}</div>
                      <div>
                        <h3 className="font-semibold">{item.rewards.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Redeemed on {new Date(item.redeemed_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
