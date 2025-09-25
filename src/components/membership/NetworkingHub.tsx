import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Users, Calendar, MapPin, Clock, UserPlus, MessageSquare, CheckCircle, XCircle } from "lucide-react";

interface CommunityEvent {
  id: string;
  title: string;
  description?: string;
  event_type: string;
  event_date: string;
  duration_minutes: number;
  max_participants?: number;
  current_participants: number;
  is_premium_only: boolean;
  location?: string;
  is_active: boolean;
  created_at: string;
}

interface NetworkingConnection {
  id: string;
  connected_user_id: string;
  connection_type: string;
  status: string;
  message?: string;
  created_at: string;
  profiles?: {
    full_name: string;
    email: string;
    organization_name?: string;
  };
}

interface NetworkingHubProps {
  userId: string;
  userPlan: 'individual' | 'premium';
}

export const NetworkingHub = ({ userId, userPlan }: NetworkingHubProps) => {
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [connections, setConnections] = useState<NetworkingConnection[]>([]);
  const [pendingConnections, setPendingConnections] = useState<NetworkingConnection[]>([]);
  const [searchEmail, setSearchEmail] = useState('');
  const [connectionMessage, setConnectionMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isConnectDialogOpen, setIsConnectDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadEvents();
    loadConnections();
  }, [userId]);

  const loadEvents = async () => {
    const { data, error } = await supabase
      .from('community_events')
      .select('*')
      .eq('is_active', true)
      .gte('event_date', new Date().toISOString())
      .order('event_date');

    if (error) {
      toast({
        title: "Error",
        description: "Gagal memuat events",
        variant: "destructive",
      });
      return;
    }

    // Filter events based on user plan
    const filteredEvents = (data || []).filter(event => 
      !event.is_premium_only || userPlan === 'premium'
    );

    setEvents(filteredEvents);
    setLoading(false);
  };

  const loadConnections = async () => {
    // Load accepted connections
    const { data: acceptedData, error: acceptedError } = await supabase
      .from('networking_connections')
      .select(`
        *,
        profiles!networking_connections_connected_user_id_fkey (
          full_name, email, organization_name
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'accepted')
      .order('created_at', { ascending: false });

    if (acceptedError) {
      console.error('Error loading connections:', acceptedError);
    } else {
      setConnections(acceptedData || []);
    }

    // Load pending connections (requests to me)
    const { data: pendingData, error: pendingError } = await supabase
      .from('networking_connections')
      .select(`
        *,
        profiles!networking_connections_user_id_fkey (
          full_name, email, organization_name
        )
      `)
      .eq('connected_user_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (pendingError) {
      console.error('Error loading pending connections:', pendingError);
    } else {
      setPendingConnections(pendingData || []);
    }
  };

  const handleJoinEvent = async (eventId: string) => {
    const { error } = await supabase
      .from('event_participants')
      .insert({
        event_id: eventId,
        user_id: userId
      });

    if (error) {
      if (error.code === '23505') {
        toast({
          title: "Sudah Terdaftar",
          description: "Anda sudah terdaftar untuk event ini",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Gagal mendaftar event",
          variant: "destructive",
        });
      }
      return;
    }

    // Update participant count
    const event = events.find(e => e.id === eventId);
    if (event) {
      await supabase
        .from('community_events')
        .update({ current_participants: event.current_participants + 1 })
        .eq('id', eventId);
    }

    toast({
      title: "Berhasil!",
      description: "Berhasil mendaftar event",
    });

    loadEvents();
  };

  const handleSendConnectionRequest = async () => {
    if (!searchEmail.trim()) {
      toast({
        title: "Error",
        description: "Masukkan email yang valid",
        variant: "destructive",
      });
      return;
    }

    // Find user by email
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('user_id, full_name')
      .eq('email', searchEmail.trim())
      .single();

    if (userError || !userData) {
      toast({
        title: "User Tidak Ditemukan",
        description: "Email tidak terdaftar di Talentika",
        variant: "destructive",
      });
      return;
    }

    if (userData.user_id === userId) {
      toast({
        title: "Error",
        description: "Tidak dapat menghubungkan dengan diri sendiri",
        variant: "destructive",
      });
      return;
    }

    const { error } = await supabase
      .from('networking_connections')
      .insert({
        user_id: userId,
        connected_user_id: userData.user_id,
        connection_type: 'professional',
        status: 'pending',
        message: connectionMessage
      });

    if (error) {
      if (error.code === '23505') {
        toast({
          title: "Koneksi Sudah Ada",
          description: "Sudah ada koneksi atau permintaan dengan user ini",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Gagal mengirim permintaan koneksi",
          variant: "destructive",
        });
      }
      return;
    }

    toast({
      title: "Berhasil!",
      description: `Permintaan koneksi dikirim ke ${userData.full_name}`,
    });

    setSearchEmail('');
    setConnectionMessage('');
    setIsConnectDialogOpen(false);
  };

  const handleConnectionResponse = async (connectionId: string, action: 'accept' | 'reject') => {
    const { error } = await supabase
      .from('networking_connections')
      .update({ status: action === 'accept' ? 'accepted' : 'blocked' })
      .eq('id', connectionId);

    if (error) {
      toast({
        title: "Error",
        description: "Gagal memproses permintaan",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Berhasil!",
      description: `Permintaan koneksi ${action === 'accept' ? 'diterima' : 'ditolak'}`,
    });

    loadConnections();
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'webinar': return '🎓';
      case 'workshop': return '🛠️';
      case 'networking': return '🤝';
      case 'competition': return '🏆';
      default: return '📅';
    }
  };

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Networking Hub</h2>
          <p className="text-muted-foreground">
            Terhubung dengan profesional, ikuti event, dan perluas jaringan
          </p>
        </div>
        {userPlan === 'premium' && (
          <Dialog open={isConnectDialogOpen} onOpenChange={setIsConnectDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="w-4 h-4 mr-2" />
                Connect Baru
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Kirim Permintaan Koneksi</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Email Profesional</label>
                  <Input
                    type="email"
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                    placeholder="nama@perusahaan.com"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Pesan (Opsional)</label>
                  <Textarea
                    value={connectionMessage}
                    onChange={(e) => setConnectionMessage(e.target.value)}
                    placeholder="Halo, saya tertarik untuk terhubung dan belajar dari pengalaman Anda..."
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSendConnectionRequest} className="flex-1">
                    Kirim Permintaan
                  </Button>
                  <Button variant="outline" onClick={() => setIsConnectDialogOpen(false)}>
                    Batal
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Plan restriction notice for Individual users */}
      {userPlan === 'individual' && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-orange-700">
              <Users className="w-5 h-5" />
              <div>
                <p className="font-medium">Akses Terbatas</p>
                <p className="text-sm">Upgrade ke Premium untuk akses penuh networking dengan profesional & industri</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="events" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="connections">Koneksi ({connections.length})</TabsTrigger>
          <TabsTrigger value="requests">
            Permintaan ({pendingConnections.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="events">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <Card key={event.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{getEventTypeIcon(event.event_type)}</span>
                        <Badge variant="secondary" className="text-xs">
                          {event.event_type}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg">{event.title}</CardTitle>
                    </div>
                    {event.is_premium_only && (
                      <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                        Premium
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-4 line-clamp-2">
                    {event.description}
                  </CardDescription>
                  
                  <div className="space-y-2 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>{formatEventDate(event.event_date)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>{event.duration_minutes} menit</span>
                    </div>
                    {event.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{event.location}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>
                        {event.current_participants}
                        {event.max_participants && `/${event.max_participants}`} peserta
                      </span>
                    </div>
                  </div>

                  <Button 
                    className="w-full"
                    onClick={() => handleJoinEvent(event.id)}
                    disabled={
                      (event.max_participants && event.current_participants >= event.max_participants) ||
                      (event.is_premium_only && userPlan !== 'premium')
                    }
                  >
                    {event.is_premium_only && userPlan !== 'premium' 
                      ? 'Upgrade ke Premium'
                      : event.max_participants && event.current_participants >= event.max_participants
                      ? 'Event Penuh'
                      : 'Daftar Event'
                    }
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {events.length === 0 && (
            <Card className="p-12 text-center">
              <div className="text-4xl mb-4">📅</div>
              <h3 className="text-xl font-semibold mb-2">Belum Ada Event</h3>
              <p className="text-muted-foreground">
                Event networking akan segera hadir
              </p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="connections">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {connections.map((connection) => (
              <Card key={connection.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">{connection.profiles?.full_name}</h4>
                    <p className="text-sm text-muted-foreground">{connection.profiles?.email}</p>
                    {connection.profiles?.organization_name && (
                      <p className="text-sm text-muted-foreground">
                        {connection.profiles.organization_name}
                      </p>
                    )}
                    <Badge variant="secondary" className="mt-2 text-xs">
                      {connection.connection_type}
                    </Badge>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Chat
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {connections.length === 0 && (
            <Card className="p-12 text-center">
              <div className="text-4xl mb-4">🤝</div>
              <h3 className="text-xl font-semibold mb-2">Belum Ada Koneksi</h3>
              <p className="text-muted-foreground">
                {userPlan === 'premium' 
                  ? 'Mulai terhubung dengan profesional di industri'
                  : 'Upgrade ke Premium untuk fitur networking'
                }
              </p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="requests">
          <div className="space-y-4">
            {pendingConnections.map((request) => (
              <Card key={request.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{request.profiles?.full_name}</h4>
                      <p className="text-sm text-muted-foreground">{request.profiles?.email}</p>
                      {request.message && (
                        <p className="text-sm mt-1 p-2 bg-muted rounded text-muted-foreground">
                          "{request.message}"
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleConnectionResponse(request.id, 'accept')}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Terima
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleConnectionResponse(request.id, 'reject')}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Tolak
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {pendingConnections.length === 0 && (
            <Card className="p-12 text-center">
              <div className="text-4xl mb-4">📬</div>
              <h3 className="text-xl font-semibold mb-2">Tidak Ada Permintaan</h3>
              <p className="text-muted-foreground">
                Permintaan koneksi baru akan muncul di sini
              </p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};