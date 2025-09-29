import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Clock, Search, Eye, Calendar, ArrowLeft, Share2 } from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featured_image_url?: string;
  category: string;
  tags: string[];
  view_count: number;
  reading_time_minutes: number;
  created_at: string;
  published_at: string;
  is_featured: boolean;
}

const Articles = () => {
  const { slug } = useParams();
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    fetchArticles();
  }, []);

  useEffect(() => {
    if (slug && articles.length > 0) {
      const article = articles.find(a => a.slug === slug);
      if (article) {
        setSelectedArticle(article);
        incrementViewCount(article.id);
      }
    }
  }, [slug, articles]);

  const fetchArticles = async () => {
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setArticles(data || []);
    } catch (error) {
      console.error('Error fetching articles:', error);
      toast.error('Gagal memuat artikel');
    } finally {
      setLoading(false);
    }
  };

  const incrementViewCount = async (articleId: string) => {
    try {
      const { error } = await supabase.rpc('increment_article_view_count', { article_id: articleId });
      if (error) throw error;
    } catch (error) {
      console.error('Error incrementing view count:', error);
    }
  };

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.excerpt?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredArticles = articles.filter(a => a.is_featured).slice(0, 3);
  const categories = Array.from(new Set(articles.map(a => a.category)));

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-20 flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
        <Footer />
      </div>
    );
  }

  // Article detail view
  if (selectedArticle) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20 pb-16">
          <div className="container mx-auto px-4 max-w-4xl">
            <Button 
              variant="ghost" 
              asChild 
              className="mb-6"
            >
              <Link to="/articles">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali ke Artikel
              </Link>
            </Button>

            <article className="prose prose-lg max-w-none">
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="secondary">{selectedArticle.category}</Badge>
                  {selectedArticle.tags.map((tag) => (
                    <Badge key={tag} variant="outline">{tag}</Badge>
                  ))}
                </div>
                
                <h1 className="text-4xl font-bold text-foreground mb-4">
                  {selectedArticle.title}
                </h1>
                
                <div className="flex items-center gap-6 text-muted-foreground mb-6">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(selectedArticle.published_at || selectedArticle.created_at).toLocaleDateString('id-ID')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{selectedArticle.reading_time_minutes} menit baca</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4" />
                    <span>{selectedArticle.view_count} views</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      navigator.share?.({
                        title: selectedArticle.title,
                        url: window.location.href
                      }) || navigator.clipboard.writeText(window.location.href);
                      toast.success('Link berhasil disalin!');
                    }}
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>

                {selectedArticle.featured_image_url && (
                  <img 
                    src={selectedArticle.featured_image_url} 
                    alt={selectedArticle.title}
                    className="w-full h-64 object-cover rounded-lg mb-8"
                  />
                )}
              </div>

              <div 
                className="article-content prose prose-lg max-w-none dark:prose-invert
                          prose-headings:text-foreground prose-p:text-foreground 
                          prose-strong:text-foreground prose-ul:text-foreground 
                          prose-ol:text-foreground prose-li:text-foreground
                          prose-headings:font-semibold prose-h1:text-3xl prose-h2:text-2xl 
                          prose-h3:text-xl prose-p:leading-relaxed prose-li:leading-relaxed"
                dangerouslySetInnerHTML={{ 
                  __html: selectedArticle.content
                    .replace(/\n/g, '<br>')
                    .replace(/# (.*)/g, '<h1>$1</h1>')
                    .replace(/## (.*)/g, '<h2>$1</h2>')
                    .replace(/### (.*)/g, '<h3>$1</h3>')
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/- (.*)/g, '<li>$1</li>')
                    .replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>')
                }}
              />
            </article>

            <Separator className="my-12" />

            <div>
              <h3 className="text-xl font-semibold mb-6">Artikel Terkait</h3>
              <div className="grid md:grid-cols-2 gap-6">
                {articles
                  .filter(a => a.id !== selectedArticle.id && a.category === selectedArticle.category)
                  .slice(0, 2)
                  .map((article) => (
                    <Card key={article.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary">{article.category}</Badge>
                        </div>
                        <CardTitle className="line-clamp-2">
                          <Link to={`/articles/${article.slug}`} className="hover:text-primary transition-colors">
                            {article.title}
                          </Link>
                        </CardTitle>
                        <CardDescription className="line-clamp-3">
                          {article.excerpt}
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  ))}
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Articles listing view
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Artikel Karir & Pengembangan Diri
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Temukan tips, strategi, dan insight terbaru untuk mengembangkan karir dan potensi diri Anda
            </p>
          </div>

          {/* Featured Articles */}
          {featuredArticles.length > 0 && (
            <section className="mb-12">
              <h2 className="text-2xl font-semibold mb-6">Artikel Unggulan</h2>
              <div className="grid md:grid-cols-3 gap-6">
                {featuredArticles.map((article) => (
                  <Card key={article.id} className="hover:shadow-xl transition-all duration-300 border-primary/20">
                    <CardHeader>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="default">{article.category}</Badge>
                        <Badge variant="outline">Featured</Badge>
                      </div>
                      <CardTitle className="line-clamp-2">
                        <Link to={`/articles/${article.slug}`} className="hover:text-primary transition-colors">
                          {article.title}
                        </Link>
                      </CardTitle>
                      <CardDescription className="line-clamp-3">
                        {article.excerpt}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>{article.reading_time_minutes} min</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Eye className="w-4 h-4" />
                          <span>{article.view_count}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari artikel..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={selectedCategory === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory("all")}
              >
                Semua
              </Button>
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className="capitalize"
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>

          {/* Articles Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredArticles.map((article) => (
              <Card key={article.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary">{article.category}</Badge>
                    {article.tags.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                  <CardTitle className="line-clamp-2">
                    <Link to={`/articles/${article.slug}`} className="hover:text-primary transition-colors">
                      {article.title}
                    </Link>
                  </CardTitle>
                  <CardDescription className="line-clamp-3">
                    {article.excerpt}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{article.reading_time_minutes} min</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        <span>{article.view_count}</span>
                      </div>
                    </div>
                    <span className="text-xs">
                      {new Date(article.created_at).toLocaleDateString('id-ID')}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredArticles.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">
                Tidak ada artikel yang ditemukan
              </p>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Articles;