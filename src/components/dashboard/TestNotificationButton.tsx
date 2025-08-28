import { Button } from "@/components/ui/button";
import { createNotification } from "@/lib/notifications";
import { useToast } from "@/hooks/use-toast";
import { User } from "@supabase/supabase-js";

interface TestNotificationButtonProps {
  user: User | null;
}

export const TestNotificationButton = ({ user }: TestNotificationButtonProps) => {
  const { toast } = useToast();

  const handleCreateTestNotification = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "Anda harus login untuk membuat notifikasi test.",
        variant: "destructive",
      });
      return;
    }

    const testNotifications = [
      {
        userId: user.id,
        title: "Kursus Baru: React Advanced",
        message: "Kursus React Advanced telah tersedia! Pelajari hooks, context, dan pattern advanced lainnya.",
        type: "learning",
        priority: "normal" as const,
        actionUrl: "/learning",
        metadata: { content_id: "react-advanced" }
      },
      {
        userId: user.id,
        title: "Beasiswa LPDP 2024",
        message: "Pendaftaran beasiswa LPDP untuk S2/S3 telah dibuka. Deadline: 30 Maret 2024.",
        type: "opportunity",
        priority: "high" as const,
        actionUrl: "/opportunities",
        metadata: { opportunity_id: "lpdp-2024", category: "SCHOLARSHIP" }
      },
      {
        userId: user.id,
        title: "Tantangan Coding Week!",
        message: "Ikuti tantangan coding mingguan dan dapatkan 500 XP!",
        type: "challenge",
        priority: "normal" as const,
        actionUrl: "/dashboard?section=quests",
        metadata: { challenge_id: "coding-week", xp_reward: 500 }
      }
    ];

    // Create one random notification
    const randomNotification = testNotifications[Math.floor(Math.random() * testNotifications.length)];
    
    const { data, error } = await createNotification(randomNotification);

    if (error) {
      toast({
        title: "Error",
        description: "Gagal membuat notifikasi test.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Berhasil!",
        description: "Notifikasi test telah dibuat.",
      });
    }
  };

  return (
    <Button 
      onClick={handleCreateTestNotification}
      variant="outline"
      size="sm"
    >
      Test Notifikasi
    </Button>
  );
};