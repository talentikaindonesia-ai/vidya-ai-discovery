import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Eye, ArrowRight, BookOpen } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

const ArticlesPreview = () => {
  const navigate = useNavigate();
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('articles')
      .select('id, title, slug, excerpt, category, tags, featured_image_url, reading_time_minutes, view_count, published_at, created_at')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(3)
      .then(({ data }) => {
        setArticles(data || []);
        setLoading(false);
      });
  }, []);

  if (loading || articles.length === 0) return null;

  return (
    <section className="py-20 bg-background" aria-labelledby="articles-preview-heading">
      <div className="container px-4">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <BookOpen className="w-8 h-8 text-primary" />
            <h2 id="articles-preview-heading" className="text-3xl md:text-4xl font-bold">
              Artikel Terbaru
            </h2>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Tips, panduan, dan insight pengembangan karir dari para ahli untuk generasi muda Indonesia
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-10">
          {articles.map((article) => (
            <Card
              key={article.id}
              className="group hover:shadow-card transition-all duration-300 hover:-translate-y-1 bg-card border-primary/10 overflow-hidden"
            >
              <div className="relative overflow-hidden">
                {article.featured_image_url ? (
                  <img
                    src={article.featured_image_url}
                    alt={article.title}
                    className="w-full h-44 object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                    width="400"
                    height="176"
                  />
                ) : (
                  <div className="w-full h-44 bg-gradient-to-br from-primary/20 to-primary-glow/20 flex items-center justify-center">
                    <BookOpen className="w-12 h-12 text-primary/30" />
                  </div>
                )}
                <div className="absolute top-3 left-3">
                  <Badge className="bg-primary/90 text-white shadow-md text-xs">{article.category}</Badge>
                </div>
              </div>

              <CardHeader className="pb-2">
                <div className="flex flex-wrap gap-1 mb-2">
                  {(article.tags || []).slice(0, 2).map((tag: string) => (
                    <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                  ))}
                </div>
                <CardTitle className="text-base line-clamp-2 group-hover:text-primary transition-colors leading-snug">
                  <Link to={`/articles/${article.slug}`}>{article.title}</Link>
                </CardTitle>
              </CardHeader>

              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{article.excerpt}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />{article.reading_time_minutes} min
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />{article.view_count}
                    </span>
                  </div>
                  <span>{new Date(article.published_at || article.created_at).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button
            size="lg"
            variant="outline"
            className="group border-primary/30 hover:border-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300"
            onClick={() => navigate('/articles')}
          >
            <BookOpen className="w-5 h-5 mr-2" />
            Baca Semua Artikel
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ArticlesPreview;
