import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Calendar, MapPin } from "lucide-react";

interface ScrapedContent {
  id: string;
  title: string;
  description: string;
  url: string;
  source_website: string;
  category: string;
  tags: string[];
  content_type: string;
  location: string;
  deadline: string;
  created_at: string;
}

interface ScrapedContentProps {
  category?: string;
}

export const ScrapedContent = ({ category }: ScrapedContentProps) => {
  const [content, setContent] = useState<ScrapedContent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadScrapedContent();
  }, [category]);

  const loadScrapedContent = async () => {
    try {
      let query = supabase
        .from('scraped_content')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(10);

      if (category) {
        query = query.eq('category', category.toLowerCase());
      }

      const { data, error } = await query;

      if (error) throw error;

      setContent(data || []);
    } catch (error) {
      console.error('Error loading scraped content:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-muted rounded w-full"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (content.length === 0) {
    return (
      <Card className="text-center py-8">
        <CardContent>
          <p className="text-muted-foreground">Belum ada konten tersedia untuk kategori ini.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {content.map((item) => (
        <Card key={item.id} className="hover:shadow-card transition-all duration-300 bg-card border-primary/10">
          <CardHeader>
            <div className="flex items-start justify-between">
              <Badge variant="secondary" className="mb-2">
                {item.content_type}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {item.source_website}
              </Badge>
            </div>
            <CardTitle className="text-lg line-clamp-2 hover:text-primary transition-colors">
              {item.title}
            </CardTitle>
            <CardDescription className="line-clamp-2">
              {item.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {item.location && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  {item.location}
                </div>
              )}
              
              {item.deadline && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  Deadline: {new Date(item.deadline).toLocaleDateString('id-ID')}
                </div>
              )}

              {item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {item.tags.slice(0, 3).map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              <Button 
                variant="outline" 
                size="sm" 
                className="w-full group"
                onClick={() => window.open(item.url, '_blank')}
              >
                Lihat Detail
                <ExternalLink className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};