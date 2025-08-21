import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { 
  MessageSquare, 
  Users, 
  Calendar, 
  Search,
  Plus,
  Heart,
  MessageCircle,
  BookOpen,
  Lightbulb,
  Code,
  Palette,
  FlaskConical,
  Briefcase,
  Leaf,
  TrendingUp,
  Star
} from "lucide-react";

interface ForumPost {
  id: string;
  title: string;
  content: string;
  author: string;
  avatar: string;
  category: string;
  replies: number;
  likes: number;
  timestamp: string;
  isHot?: boolean;
}

interface StudyGroup {
  id: string;
  name: string;
  description: string;
  members: number;
  category: string;
  nextMeeting: string;
  isActive: boolean;
}

interface Event {
  id: string;
  title: string;
  type: 'workshop' | 'webinar' | 'meetup' | 'bootcamp';
  date: string;
  time: string;
  participants: number;
  isOnline: boolean;
}

const CommunityForum = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Mock data - replace with real API calls
  const forumPosts: ForumPost[] = [
    {
      id: "1",
      title: "Tips Belajar Machine Learning untuk Pemula",
      content: "Halo teman-teman! Mau sharing tips belajar ML yang efektif...",
      author: "Sarah Coding",
      avatar: "",
      category: "tech",
      replies: 24,
      likes: 45,
      timestamp: "2 jam lalu",
      isHot: true
    },
    {
      id: "2",
      title: "Berbagi Pengalaman Ikut Kompetisi UI/UX",
      content: "Kemarin baru selesai ikut kompetisi design thinking...",
      author: "Alex Design",
      avatar: "",
      category: "art",
      replies: 12,
      likes: 28,
      timestamp: "5 jam lalu"
    },
    {
      id: "3",
      title: "Scholarship Opportunities 2024",
      content: "List beasiswa yang masih buka pendaftaran tahun ini...",
      author: "Dina Scholar",
      avatar: "",
      category: "science",
      replies: 67,
      likes: 123,
      timestamp: "1 hari lalu",
      isHot: true
    }
  ];

  const studyGroups: StudyGroup[] = [
    {
      id: "1",
      name: "Python Study Circle",
      description: "Belajar Python bareng dari basic sampai advanced",
      members: 45,
      category: "tech",
      nextMeeting: "Senin, 20 Jan 2024",
      isActive: true
    },
    {
      id: "2",
      name: "Design Thinking Workshop",
      description: "Praktik design thinking untuk solve real problems",
      members: 28,
      category: "art",
      nextMeeting: "Rabu, 22 Jan 2024",
      isActive: true
    },
    {
      id: "3",
      name: "Business Plan Competition Prep",
      description: "Persiapan lomba business plan bareng mentor",
      members: 15,
      category: "business",
      nextMeeting: "Jumat, 24 Jan 2024",
      isActive: true
    }
  ];

  const upcomingEvents: Event[] = [
    {
      id: "1",
      title: "AI & Future of Work",
      type: "webinar",
      date: "25 Jan 2024",
      time: "19:00 WIB",
      participants: 234,
      isOnline: true
    },
    {
      id: "2",
      title: "Coding Bootcamp: React Fundamentals",
      type: "bootcamp",
      date: "27 Jan 2024",
      time: "09:00 WIB",
      participants: 45,
      isOnline: false
    },
    {
      id: "3",
      title: "Startup Meetup Jakarta",
      type: "meetup",
      date: "30 Jan 2024",
      time: "18:00 WIB",
      participants: 89,
      isOnline: false
    }
  ];

  const categories = [
    { id: "all", name: "Semua", icon: MessageSquare, color: "text-foreground" },
    { id: "tech", name: "Teknologi", icon: Code, color: "text-primary" },
    { id: "art", name: "Seni & Kreativitas", icon: Palette, color: "text-accent" },
    { id: "science", name: "Sains", icon: FlaskConical, color: "text-secondary" },
    { id: "business", name: "Bisnis", icon: Briefcase, color: "text-primary" },
    { id: "sustainability", name: "Sustainability", icon: Leaf, color: "text-accent" }
  ];

  const getCategoryIcon = (category: string) => {
    const cat = categories.find(c => c.id === category);
    if (!cat) return MessageSquare;
    return cat.icon;
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'workshop': return 'bg-primary/10 text-primary border-primary';
      case 'webinar': return 'bg-secondary/10 text-secondary-foreground border-secondary';
      case 'meetup': return 'bg-accent/10 text-accent-foreground border-accent';
      case 'bootcamp': return 'bg-primary/10 text-primary border-primary';
      default: return 'bg-muted/10 text-muted-foreground border-muted';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative bg-gradient-secondary overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="container mx-auto px-4 py-24 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-white">
              <h1 className="text-5xl font-bold mb-6 leading-tight">
                Community Forum
              </h1>
              <p className="text-xl text-white/90 mb-8 leading-relaxed">
                Tempat berkumpul, belajar, dan berkolaborasi dengan sesama learners. 
                Bangun network, share knowledge, dan tumbuh bersama komunitas.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="bg-white text-secondary hover:bg-white/90 shadow-floating">
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Mulai Diskusi
                </Button>
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  <Users className="w-5 h-5 mr-2" />
                  Gabung Group
                </Button>
              </div>
              <div className="flex items-center gap-8 mt-8 text-white/80">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">15k+</div>
                  <div className="text-sm">Members</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">1k+</div>
                  <div className="text-sm">Diskusi</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">24/7</div>
                  <div className="text-sm">Aktif</div>
                </div>
              </div>
            </div>
            <div className="hidden lg:block">
              <img 
                src="/src/assets/community-hero.jpg" 
                alt="Community Forum" 
                className="rounded-2xl shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">

        {/* Search and Filter */}
        <Card className="shadow-card mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Cari diskusi, topik, atau pengguna..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {categories.map((category) => {
                  const Icon = category.icon;
                  return (
                    <Button
                      key={category.id}
                      variant={selectedCategory === category.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedCategory(category.id)}
                      className="whitespace-nowrap"
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {category.name}
                    </Button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="discussions" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="discussions">
              <MessageSquare className="w-4 h-4 mr-2" />
              Diskusi
            </TabsTrigger>
            <TabsTrigger value="study-groups">
              <BookOpen className="w-4 h-4 mr-2" />
              Study Groups
            </TabsTrigger>
            <TabsTrigger value="mentorship">
              <Users className="w-4 h-4 mr-2" />
              Mentorship
            </TabsTrigger>
            <TabsTrigger value="events">
              <Calendar className="w-4 h-4 mr-2" />
              Events
            </TabsTrigger>
          </TabsList>

          <TabsContent value="discussions" className="mt-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">Diskusi Terbaru</h2>
              <Button className="bg-primary text-primary-foreground">
                <Plus className="w-4 h-4 mr-2" />
                Buat Diskusi
              </Button>
            </div>

            <div className="space-y-4">
              {forumPosts.map((post) => {
                const CategoryIcon = getCategoryIcon(post.category);
                return (
                  <Card key={post.id} className="shadow-card hover:shadow-floating transition-shadow cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={post.avatar} />
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {post.author.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-foreground hover:text-primary transition-colors">
                              {post.title}
                            </h3>
                            {post.isHot && (
                              <Badge className="bg-accent/10 text-accent-foreground border-accent">
                                <TrendingUp className="w-3 h-3 mr-1" />
                                Hot
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-muted-foreground mb-3 line-clamp-2">
                            {post.content}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <CategoryIcon className="w-4 h-4" />
                                <span>{post.author}</span>
                              </div>
                              <span>{post.timestamp}</span>
                            </div>
                            
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Heart className="w-4 h-4" />
                                <span>{post.likes}</span>
                              </div>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <MessageCircle className="w-4 h-4" />
                                <span>{post.replies}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="study-groups" className="mt-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">Study Groups Aktif</h2>
              <Button className="bg-primary text-primary-foreground">
                <Plus className="w-4 h-4 mr-2" />
                Buat Study Group
              </Button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {studyGroups.map((group) => {
                const CategoryIcon = getCategoryIcon(group.category);
                return (
                  <Card key={group.id} className="shadow-card hover:shadow-floating transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between mb-2">
                        <CategoryIcon className="w-6 h-6 text-primary" />
                        <Badge variant="outline" className="bg-secondary/10 text-secondary-foreground border-secondary">
                          {group.isActive ? 'Aktif' : 'Tidak Aktif'}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg">{group.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-4 line-clamp-2">
                        {group.description}
                      </p>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Members</span>
                          <span className="font-semibold">{group.members}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Next Meeting</span>
                          <span className="font-semibold">{group.nextMeeting}</span>
                        </div>
                      </div>
                      
                      <Button className="w-full bg-primary text-primary-foreground">
                        Gabung Group
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="mentorship" className="mt-6">
            <Card className="text-center py-12">
              <CardContent>
                <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Mentorship Corner</h3>
                <p className="text-muted-foreground mb-4">
                  Connect dengan mentor berpengalaman dan alumni sukses
                </p>
                <div className="flex justify-center gap-4">
                  <Button className="bg-primary text-primary-foreground">
                    Cari Mentor
                  </Button>
                  <Button variant="outline">
                    Jadi Mentor
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="events" className="mt-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">Upcoming Events</h2>
              <Button className="bg-primary text-primary-foreground">
                <Plus className="w-4 h-4 mr-2" />
                Buat Event
              </Button>
            </div>

            <div className="space-y-4">
              {upcomingEvents.map((event) => (
                <Card key={event.id} className="shadow-card hover:shadow-floating transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-foreground">{event.title}</h3>
                          <Badge className={getEventTypeColor(event.type)}>
                            {event.type}
                          </Badge>
                          {event.isOnline && (
                            <Badge variant="outline" className="bg-muted/10">Online</Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-6 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{event.date} • {event.time}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            <span>{event.participants} peserta</span>
                          </div>
                        </div>
                      </div>
                      
                      <Button className="bg-primary text-primary-foreground">
                        Daftar Sekarang
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CommunityForum;