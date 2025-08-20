import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy, Users, Calendar, Gift, Search, Filter, Clock } from "lucide-react";
import { toast } from "sonner";

interface Challenge {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  deadline: string;
  participants: number;
  prize: string;
  status: 'upcoming' | 'active' | 'ended';
  requirements: string[];
}

export const ChallengesSection = () => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  useEffect(() => {
    loadChallenges();
  }, []);

  const loadChallenges = () => {
    // Mock data - in real app, fetch from Supabase
    const mockChallenges: Challenge[] = [
      {
        id: '1',
        title: 'Data Science Hackathon 2024',
        description: 'Analisis dataset e-commerce untuk prediksi penjualan menggunakan machine learning',
        category: 'Data Science',
        difficulty: 'intermediate',
        deadline: '2024-12-31T23:59:59',
        participants: 156,
        prize: 'Rp 10,000,000',
        status: 'active',
        requirements: ['Python', 'Pandas', 'Scikit-learn', 'Portfolio data science']
      },
      {
        id: '2',
        title: 'UI/UX Design Contest',
        description: 'Redesign aplikasi mobile untuk meningkatkan user experience',
        category: 'Design',
        difficulty: 'beginner',
        deadline: '2024-12-25T23:59:59',
        participants: 89,
        prize: 'Rp 5,000,000',
        status: 'active',
        requirements: ['Figma', 'Adobe XD', 'Portfolio design']
      },
      {
        id: '3',
        title: 'Web Development Challenge',
        description: 'Buat aplikasi web full-stack dengan React dan Node.js',
        category: 'Programming',
        difficulty: 'advanced',
        deadline: '2024-12-20T23:59:59',
        participants: 67,
        prize: 'Rp 7,500,000',
        status: 'upcoming',
        requirements: ['React', 'Node.js', 'Database', 'GitHub']
      },
      {
        id: '4',
        title: 'Business Case Competition',
        description: 'Solusi bisnis untuk sustainability dalam industri fashion',
        category: 'Business',
        difficulty: 'intermediate',
        deadline: '2024-12-15T23:59:59',
        participants: 45,
        prize: 'Rp 3,000,000',
        status: 'ended',
        requirements: ['Business plan', 'Presentation', 'Market research']
      }
    ];
    setChallenges(mockChallenges);
  };

  const filteredChallenges = challenges.filter(challenge => {
    const matchesSearch = challenge.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         challenge.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || challenge.category === selectedCategory;
    const matchesStatus = selectedStatus === "all" || challenge.status === selectedStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-orange-100 text-orange-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      case 'ended': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDaysRemaining = (deadline: string) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleJoinChallenge = (challengeId: string) => {
    toast.success("Berhasil mendaftar challenge!");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Tantangan & Kompetisi</h1>
        <p className="text-muted-foreground mt-2">
          Adu skill dengan peserta lain dan menangkan hadiah menarik
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Cari tantangan..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                <SelectItem value="Data Science">Data Science</SelectItem>
                <SelectItem value="Design">Design</SelectItem>
                <SelectItem value="Programming">Programming</SelectItem>
                <SelectItem value="Business">Business</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="active">Aktif</SelectItem>
                <SelectItem value="upcoming">Akan Datang</SelectItem>
                <SelectItem value="ended">Selesai</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Challenges Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {filteredChallenges.map((challenge) => (
          <Card key={challenge.id} className="hover:shadow-lg transition-all">
            <CardHeader>
              <div className="flex items-start justify-between">
                <Trophy className="w-8 h-8 text-primary" />
                <div className="flex gap-2">
                  <Badge className={getStatusColor(challenge.status)}>
                    {challenge.status === 'active' ? 'Aktif' : 
                     challenge.status === 'upcoming' ? 'Akan Datang' : 'Selesai'}
                  </Badge>
                  <Badge className={getDifficultyColor(challenge.difficulty)}>
                    {challenge.difficulty === 'beginner' ? 'Pemula' :
                     challenge.difficulty === 'intermediate' ? 'Menengah' : 'Lanjutan'}
                  </Badge>
                </div>
              </div>
              <CardTitle className="text-xl">{challenge.title}</CardTitle>
              <CardDescription className="text-sm">
                {challenge.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span>{challenge.participants} peserta</span>
                </div>
                <div className="flex items-center gap-2">
                  <Gift className="w-4 h-4 text-muted-foreground" />
                  <span className="font-semibold text-primary">{challenge.prize}</span>
                </div>
              </div>

              {challenge.status !== 'ended' && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span>
                    {getDaysRemaining(challenge.deadline) > 0 
                      ? `${getDaysRemaining(challenge.deadline)} hari lagi`
                      : 'Deadline terlewat'}
                  </span>
                </div>
              )}

              <div>
                <p className="text-sm font-medium mb-2">Persyaratan:</p>
                <div className="flex flex-wrap gap-1">
                  {challenge.requirements.map((req, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {req}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                {challenge.status === 'active' && (
                  <Button 
                    onClick={() => handleJoinChallenge(challenge.id)}
                    className="flex-1"
                  >
                    Ikut Tantangan
                  </Button>
                )}
                {challenge.status === 'upcoming' && (
                  <Button variant="outline" className="flex-1">
                    Ingatkan Saya
                  </Button>
                )}
                {challenge.status === 'ended' && (
                  <Button variant="outline" className="flex-1">
                    Lihat Hasil
                  </Button>
                )}
                <Button variant="outline" size="sm">
                  Detail
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredChallenges.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Tidak ada tantangan ditemukan</h3>
            <p className="text-muted-foreground">
              Coba ubah filter pencarian atau tunggu tantangan baru
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};