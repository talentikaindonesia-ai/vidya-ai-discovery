import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Plus, 
  Trash2, 
  Edit,
  Move,
  BookOpen,
  Users,
  Clock,
  Target,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import { toast } from "sonner";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

interface LearningPath {
  id: string;
  name: string;
  description: string;
  difficulty_level: string;
  target_persona: string;
  estimated_duration_hours: number;
  is_active: boolean;
}

interface PathContent {
  id: string;
  path_id: string;
  content_id: string;
  order_index: number;
  is_required: boolean;
  learning_content: {
    title: string;
    content_type: string;
    duration_minutes: number;
    difficulty_level: string;
  };
}

export const LearningPathBuilder = () => {
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [selectedPath, setSelectedPath] = useState<LearningPath | null>(null);
  const [pathContents, setPathContents] = useState<PathContent[]>([]);
  const [availableContent, setAvailableContent] = useState<any[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const [pathForm, setPathForm] = useState({
    name: "",
    description: "",
    difficulty_level: "beginner",
    target_persona: "",
    estimated_duration_hours: 0
  });

  const personas = [
    "SMP - STEM Explorer",
    "SMP - Creative Arts",
    "SMP - Social Sciences", 
    "SMA - Technology & Engineering",
    "SMA - Arts & Design",
    "SMA - Business & Economics",
    "SMA - Science & Research",
    "SMA - Humanities",
    "Umum - Career Starter"
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [pathsRes, contentRes] = await Promise.all([
        supabase.from('learning_paths').select('*').order('created_at', { ascending: false }),
        supabase.from('learning_content').select(`
          id, title, content_type, duration_minutes, difficulty_level, is_active
        `).eq('is_active', true).order('title')
      ]);

      if (pathsRes.error) throw pathsRes.error;
      if (contentRes.error) throw contentRes.error;

      setPaths(pathsRes.data || []);
      setAvailableContent(contentRes.data || []);
    } catch (error: any) {
      toast.error("Gagal memuat data: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadPathContents = async (pathId: string) => {
    try {
      const { data, error } = await supabase
        .from('learning_path_contents')
        .select(`
          *,
          learning_content (
            title,
            content_type,
            duration_minutes,
            difficulty_level
          )
        `)
        .eq('path_id', pathId)
        .order('order_index');

      if (error) throw error;
      setPathContents(data || []);
    } catch (error: any) {
      toast.error("Gagal memuat konten path: " + error.message);
    }
  };

  const handleCreatePath = async () => {
    try {
      const { data, error } = await supabase
        .from('learning_paths')
        .insert([pathForm])
        .select()
        .single();

      if (error) throw error;

      toast.success("Learning path berhasil dibuat!");
      setShowAddForm(false);
      setPathForm({
        name: "",
        description: "",
        difficulty_level: "beginner", 
        target_persona: "",
        estimated_duration_hours: 0
      });
      loadData();
    } catch (error: any) {
      toast.error("Gagal membuat path: " + error.message);
    }
  };

  const handleSelectPath = (path: LearningPath) => {
    setSelectedPath(path);
    loadPathContents(path.id);
  };

  const handleAddContentToPath = async (contentId: string) => {
    if (!selectedPath) return;

    try {
      const nextOrder = pathContents.length;
      
      const { error } = await supabase
        .from('learning_path_contents')
        .insert([{
          path_id: selectedPath.id,
          content_id: contentId,
          order_index: nextOrder,
          is_required: true
        }]);

      if (error) throw error;

      toast.success("Konten berhasil ditambahkan ke path!");
      loadPathContents(selectedPath.id);
    } catch (error: any) {
      toast.error("Gagal menambah konten: " + error.message);
    }
  };

  const handleRemoveContentFromPath = async (id: string) => {
    try {
      const { error } = await supabase
        .from('learning_path_contents')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success("Konten berhasil dihapus dari path!");
      if (selectedPath) loadPathContents(selectedPath.id);
    } catch (error: any) {
      toast.error("Gagal menghapus konten: " + error.message);
    }
  };

  const handleReorderContent = async (result: any) => {
    if (!result.destination || !selectedPath) return;

    const items = Array.from(pathContents);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update order_index for all items
    const updates = items.map((item, index) => ({
      id: item.id,
      order_index: index
    }));

    try {
      for (const update of updates) {
        await supabase
          .from('learning_path_contents')
          .update({ order_index: update.order_index })
          .eq('id', update.id);
      }

      setPathContents(items);
      toast.success("Urutan konten berhasil diubah!");
    } catch (error: any) {
      toast.error("Gagal mengubah urutan: " + error.message);
    }
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-secondary text-secondary-foreground';
      case 'intermediate': return 'bg-accent text-accent-foreground'; 
      case 'advanced': return 'bg-primary text-primary-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
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
        <h2 className="text-2xl font-bold">Learning Path Builder</h2>
        <Button onClick={() => setShowAddForm(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Buat Learning Path
        </Button>
      </div>

      {/* Add Path Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Buat Learning Path Baru</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Nama Path</label>
                <Input
                  value={pathForm.name}
                  onChange={(e) => setPathForm({...pathForm, name: e.target.value})}
                  placeholder="Contoh: STEM untuk SMP"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Target Persona</label>
                <Select value={pathForm.target_persona} onValueChange={(value) => setPathForm({...pathForm, target_persona: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih target persona" />
                  </SelectTrigger>
                  <SelectContent>
                    {personas.map((persona) => (
                      <SelectItem key={persona} value={persona}>
                        {persona}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium">Deskripsi</label>
              <Textarea
                value={pathForm.description}
                onChange={(e) => setPathForm({...pathForm, description: e.target.value})}
                placeholder="Jelaskan tujuan dan manfaat learning path ini"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Level Kesulitan</label>
                <Select value={pathForm.difficulty_level} onValueChange={(value) => setPathForm({...pathForm, difficulty_level: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Pemula</SelectItem>
                    <SelectItem value="intermediate">Menengah</SelectItem>
                    <SelectItem value="advanced">Lanjutan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Estimasi Durasi (jam)</label>
                <Input
                  type="number"
                  value={pathForm.estimated_duration_hours}
                  onChange={(e) => setPathForm({...pathForm, estimated_duration_hours: parseInt(e.target.value) || 0})}
                />
              </div>
            </div>

            <div className="flex gap-4">
              <Button onClick={handleCreatePath}>Buat Path</Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>Batal</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Learning Paths List */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5" />
                Learning Paths
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {paths.map((path) => (
                  <div
                    key={path.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedPath?.id === path.id ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'
                    }`}
                    onClick={() => handleSelectPath(path)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium line-clamp-1">{path.name}</h4>
                      <Badge className={getDifficultyColor(path.difficulty_level)} variant="secondary">
                        {path.difficulty_level}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                      {path.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {path.target_persona}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {path.estimated_duration_hours}h
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Path Contents */}
        <div className="lg:col-span-2">
          {selectedPath ? (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    {selectedPath.name}
                  </CardTitle>
                  <CardDescription>{selectedPath.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm">
                    <Badge className={getDifficultyColor(selectedPath.difficulty_level)}>
                      {selectedPath.difficulty_level}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {selectedPath.target_persona}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {selectedPath.estimated_duration_hours} jam
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Available Content to Add */}
              <Card>
                <CardHeader>
                  <CardTitle>Tambah Konten ke Path</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-2 max-h-40 overflow-y-auto">
                    {availableContent.filter(content => 
                      !pathContents.some(pc => pc.content_id === content.id)
                    ).map((content) => (
                      <div key={content.id} className="flex items-center justify-between p-2 border rounded">
                        <div className="flex-1">
                          <h4 className="text-sm font-medium">{content.title}</h4>
                          <p className="text-xs text-muted-foreground">
                            {content.content_type} • {content.duration_minutes}m • {content.difficulty_level}
                          </p>
                        </div>
                        <Button size="sm" onClick={() => handleAddContentToPath(content.id)}>
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Path Contents */}
              <Card>
                <CardHeader>
                  <CardTitle>Konten dalam Path ({pathContents.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <DragDropContext onDragEnd={handleReorderContent}>
                    <Droppable droppableId="path-contents">
                      {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                          {pathContents.map((content, index) => (
                            <Draggable key={content.id} draggableId={content.id} index={index}>
                              {(provided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className="flex items-center gap-3 p-3 border rounded-lg bg-background hover:bg-muted/50 transition-colors"
                                >
                                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                                    {index + 1}
                                  </div>
                                  <Move className="w-4 h-4 text-muted-foreground cursor-grab" />
                                  <div className="flex-1">
                                    <h4 className="font-medium">{content.learning_content.title}</h4>
                                    <p className="text-sm text-muted-foreground">
                                      {content.learning_content.content_type} • 
                                      {content.learning_content.duration_minutes}m • 
                                      {content.learning_content.difficulty_level}
                                    </p>
                                  </div>
                                  <Switch
                                    checked={content.is_required}
                                    onCheckedChange={(checked) => {
                                      // Update required status
                                    }}
                                  />
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleRemoveContentFromPath(content.id)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Target className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Pilih learning path untuk mengelola konten</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};