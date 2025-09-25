import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Trophy, Edit, Trash2, Plus, Calendar, Target, Users } from "lucide-react";

interface Challenge {
  id: string;
  title: string;
  description: string;
  challenge_type: string;
  difficulty: string;
  start_date: string;
  end_date: string;
  max_participants: number;
  xp_reward: number;
  is_active: boolean;
  created_at: string;
}

export const ChallengesManager = () => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    challenge_type: "learning",
    difficulty: "medium",
    start_date: "",
    end_date: "",
    max_participants: null as number | null,
    xp_reward: 200,
    is_active: true
  });

  const challengeTypes = [
    { value: "learning", label: "Pembelajaran" },
    { value: "quiz", label: "Kuis" },
    { value: "project", label: "Proyek" },
    { value: "community", label: "Komunitas" },
    { value: "skill", label: "Keahlian" },
    { value: "competition", label: "Kompetisi" },
    { value: "daily", label: "Harian" },
    { value: "weekly", label: "Mingguan" },
    { value: "monthly", label: "Bulanan" }
  ];

  const difficulties = [
    { value: "easy", label: "Mudah", color: "bg-green-500" },
    { value: "medium", label: "Sedang", color: "bg-yellow-500" },
    { value: "hard", label: "Sulit", color: "bg-red-500" }
  ];

  useEffect(() => {
    loadChallenges();
  }, []);

  const loadChallenges = async () => {
    try {
      const { data, error } = await supabase
        .from('community_challenges')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setChallenges(data || []);
    } catch (error: any) {
      toast.error("Gagal memuat tantangan: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingChallenge) {
        const { error } = await supabase
          .from('community_challenges')
          .update(formData)
          .eq('id', editingChallenge.id);

        if (error) throw error;
        toast.success("Tantangan berhasil diperbarui!");
      } else {
        const { error } = await supabase
          .from('community_challenges')
          .insert([formData]);

        if (error) throw error;
        toast.success("Tantangan berhasil ditambahkan!");
      }

      resetForm();
      loadChallenges();
    } catch (error: any) {
      toast.error("Gagal menyimpan tantangan: " + error.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Yakin ingin menghapus tantangan ini?")) return;
    
    try {
      const { error } = await supabase
        .from('community_challenges')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success("Tantangan berhasil dihapus!");
      loadChallenges();
    } catch (error: any) {
      toast.error("Gagal menghapus tantangan: " + error.message);
    }
  };

  const handleEdit = (challenge: Challenge) => {
    setEditingChallenge(challenge);
    setFormData({
      title: challenge.title,
      description: challenge.description || "",
      challenge_type: challenge.challenge_type,
      difficulty: challenge.difficulty,
      start_date: challenge.start_date ? new Date(challenge.start_date).toISOString().slice(0, 16) : "",
      end_date: challenge.end_date ? new Date(challenge.end_date).toISOString().slice(0, 16) : "",
      max_participants: challenge.max_participants,
      xp_reward: challenge.xp_reward,
      is_active: challenge.is_active
    });
    setShowAddForm(true);
  };

  const resetForm = () => {
    setEditingChallenge(null);
    setFormData({
      title: "",
      description: "",
      challenge_type: "learning",
      difficulty: "medium",
      start_date: "",
      end_date: "",
      max_participants: null,
      xp_reward: 200,
      is_active: true
    });
    setShowAddForm(false);
  };

  const getChallengeTypeLabel = (type: string) => {
    const challengeType = challengeTypes.find(ct => ct.value === type);
    return challengeType ? challengeType.label : type;
  };

  const getDifficultyInfo = (difficulty: string) => {
    return difficulties.find(d => d.value === difficulty) || difficulties[1];
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isChallengeActive = (startDate: string, endDate: string) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    return now >= start && now <= end;
  };

  const getChallengeStatus = (challenge: Challenge) => {
    const now = new Date();
    const start = new Date(challenge.start_date);
    const end = new Date(challenge.end_date);
    
    if (!challenge.is_active) return { status: 'inactive', label: 'Nonaktif', color: 'secondary' };
    if (now < start) return { status: 'upcoming', label: 'Akan Datang', color: 'outline' };
    if (now > end) return { status: 'ended', label: 'Berakhir', color: 'destructive' };
    return { status: 'active', label: 'Berlangsung', color: 'default' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Kelola Tantangan</h2>
          <p className="text-muted-foreground">Tambah, edit, dan kelola semua tantangan komunitas</p>
        </div>
        <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
          <DialogTrigger asChild>
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Tambah Tantangan
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingChallenge ? 'Edit Tantangan' : 'Tambah Tantangan Baru'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Judul Tantangan</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="Masukkan judul tantangan"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Jenis Tantangan</label>
                  <Select value={formData.challenge_type} onValueChange={(value) => setFormData({...formData, challenge_type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {challengeTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">Deskripsi</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Deskripsi tantangan"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Tingkat Kesulitan</label>
                  <Select value={formData.difficulty} onValueChange={(value) => setFormData({...formData, difficulty: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {difficulties.map((diff) => (
                        <SelectItem key={diff.value} value={diff.value}>
                          {diff.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Reward XP</label>
                  <Input
                    type="number"
                    value={formData.xp_reward}
                    onChange={(e) => setFormData({...formData, xp_reward: parseInt(e.target.value) || 200})}
                    min="50"
                    step="50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Tanggal Mulai</label>
                  <Input
                    type="datetime-local"
                    value={formData.start_date}
                    onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Tanggal Berakhir</label>
                  <Input
                    type="datetime-local"
                    value={formData.end_date}
                    onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Maksimal Peserta (kosongkan jika tidak terbatas)</label>
                <Input
                  type="number"
                  value={formData.max_participants || ""}
                  onChange={(e) => setFormData({...formData, max_participants: e.target.value ? parseInt(e.target.value) : null})}
                  min="1"
                  placeholder="Tidak terbatas"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                  className="rounded"
                />
                <label htmlFor="is_active" className="text-sm">Tantangan Aktif</label>
              </div>

              <div className="flex gap-4">
                <Button type="submit">
                  {editingChallenge ? 'Perbarui Tantangan' : 'Simpan Tantangan'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Batal
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Challenges Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {challenges.map((challenge) => {
          const difficultyInfo = getDifficultyInfo(challenge.difficulty);
          const statusInfo = getChallengeStatus(challenge);
          
          return (
            <Card key={challenge.id} className="hover:shadow-lg transition-smooth group">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-6 h-6 text-primary" />
                    <Badge variant="outline">
                      {getChallengeTypeLabel(challenge.challenge_type)}
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    <Badge 
                      className="text-white text-xs"
                      style={{ backgroundColor: difficultyInfo.color }}
                    >
                      {difficultyInfo.label}
                    </Badge>
                    <Badge variant={statusInfo.color as any} className="text-xs">
                      {statusInfo.label}
                    </Badge>
                  </div>
                </div>
                <CardTitle className="text-lg line-clamp-2">{challenge.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground line-clamp-2">{challenge.description}</p>
                  
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDateTime(challenge.start_date)} - {formatDateTime(challenge.end_date)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Target className="w-4 h-4" />
                      <span>{challenge.xp_reward} XP</span>
                    </div>
                    {challenge.max_participants && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Users className="w-4 h-4" />
                        <span>Max {challenge.max_participants}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => handleEdit(challenge)}
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive" 
                      onClick={() => handleDelete(challenge.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {challenges.length === 0 && (
        <div className="text-center py-8">
          <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Belum ada tantangan</h3>
          <p className="text-muted-foreground">Mulai dengan menambahkan tantangan pertama Anda</p>
        </div>
      )}
    </div>
  );
};