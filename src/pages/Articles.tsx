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
    const processContentWithMedia = (content: string) => {
      return content
        // Convert newlines to breaks
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>')
        
        // Handle headings with better styling
        .replace(/# (.*)/g, '<h1 class="text-4xl font-bold text-foreground mb-6 mt-12 first:mt-0 bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">$1</h1>')
        .replace(/## (.*)/g, '<h2 class="text-3xl font-semibold text-foreground mb-4 mt-10 pb-2 border-b border-primary/20">$1</h2>')
        .replace(/### (.*)/g, '<h3 class="text-2xl font-semibold text-foreground mb-3 mt-8">$1</h3>')
        
        // Enhanced text formatting
        .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-foreground bg-primary/10 px-1 rounded">$1</strong>')
        .replace(/\*(.*?)\*/g, '<em class="italic text-primary">$1</em>')
        
        // Handle images with better styling
        .replace(/!\[(.*?)\]\((.*?)\)/g, '<div class="my-8"><img src="$2" alt="$1" class="w-full rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-border/50" loading="lazy" /></div>')
        
        // Handle YouTube videos
        .replace(/\[video:(https:\/\/(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]+))\]/g, 
          '<div class="my-8 relative"><div class="aspect-video rounded-xl overflow-hidden shadow-lg border border-border/50"><iframe src="https://www.youtube.com/embed/$2" class="w-full h-full" frameborder="0" allowfullscreen></iframe></div></div>')
        
        // Handle lists with better styling
        .replace(/- (.*)/g, '<li class="flex items-start gap-3 mb-2"><span class="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></span><span>$1</span></li>')
        .replace(/(\<li.*<\/li>)/s, '<ul class="space-y-2 my-6">$1</ul>')
        
        // Handle quotes
        .replace(/> (.*)/g, '<blockquote class="border-l-4 border-primary bg-primary/5 pl-6 py-4 my-6 italic text-muted-foreground rounded-r-lg"><p class="text-lg">$1</p></blockquote>')
        
        // Handle code blocks
        .replace(/```([\s\S]*?)```/g, '<pre class="bg-muted p-4 rounded-lg my-6 overflow-x-auto border border-border/50"><code class="text-sm">$1</code></pre>')
        .replace(/`(.*?)`/g, '<code class="bg-muted px-2 py-1 rounded text-sm font-mono">$1</code>')
        
        // Wrap in paragraphs
        .replace(/^(.+)$/gm, '<p class="text-lg leading-relaxed text-foreground mb-4">$1</p>')
        
        // Clean up multiple paragraph tags
        .replace(/<\/p><p>/g, '</p>\n<p>')
        .replace(/<p><h([1-6])/g, '<h$1')
        .replace(/<\/h([1-6])><\/p>/g, '</h$1>')
        .replace(/<p><ul/g, '<ul')
        .replace(/<\/ul><\/p>/g, '</ul>')
        .replace(/<p><blockquote/g, '<blockquote')
        .replace(/<\/blockquote><\/p>/g, '</blockquote>')
        .replace(/<p><pre/g, '<pre')
        .replace(/<\/pre><\/p>/g, '</pre>')
        .replace(/<p><div/g, '<div')
        .replace(/<\/div><\/p>/g, '</div>');
    };

    return (
      <div className="min-h-screen bg-background">
        <Header />
        
        {/* Hero Section */}
        <div className="relative pt-20 pb-8 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary-glow/5"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary)/0.1),transparent_50%)]"></div>
          
          <div className="container mx-auto px-4 max-w-4xl relative z-10">
            <Button 
              variant="ghost" 
              asChild 
              className="mb-8 hover:bg-primary/10 transition-colors group"
            >
              <Link to="/articles">
                <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
                Kembali ke Artikel
              </Link>
            </Button>

            {/* Article Header */}
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-2 mb-6 flex-wrap">
                <Badge className="bg-gradient-to-r from-primary to-primary-glow text-white border-0 shadow-lg">
                  {selectedArticle.category}
                </Badge>
                {selectedArticle.tags.slice(0, 4).map((tag) => (
                  <Badge key={tag} variant="outline" className="bg-background/80 hover:bg-primary/10 transition-colors">
                    {tag}
                  </Badge>
                ))}
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-primary via-primary-glow to-primary bg-clip-text text-transparent mb-6 leading-tight">
                {selectedArticle.title}
              </h1>
              
              <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
                {selectedArticle.excerpt}
              </p>
              
              <div className="flex items-center justify-center gap-8 text-muted-foreground mb-8 flex-wrap">
                <div className="flex items-center gap-2 bg-background/50 px-4 py-2 rounded-full border border-border/50">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span className="font-medium">{new Date(selectedArticle.published_at || selectedArticle.created_at).toLocaleDateString('id-ID')}</span>
                </div>
                <div className="flex items-center gap-2 bg-background/50 px-4 py-2 rounded-full border border-border/50">
                  <Clock className="w-4 h-4 text-primary" />
                  <span className="font-medium">{selectedArticle.reading_time_minutes} menit baca</span>
                </div>
                <div className="flex items-center gap-2 bg-background/50 px-4 py-2 rounded-full border border-border/50">
                  <Eye className="w-4 h-4 text-primary" />
                  <span className="font-medium">{selectedArticle.view_count} views</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="bg-background/50 border border-border/50 hover:bg-primary/10 rounded-full px-4 py-2"
                  onClick={() => {
                    navigator.share?.({
                      title: selectedArticle.title,
                      url: window.location.href
                    }) || navigator.clipboard.writeText(window.location.href);
                    toast.success('Link berhasil disalin!');
                  }}
                >
                  <Share2 className="w-4 h-4 text-primary" />
                  <span className="ml-2 font-medium">Bagikan</span>
                </Button>
              </div>

              {selectedArticle.featured_image_url && (
                <div className="relative mb-12 group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-primary to-primary-glow rounded-2xl blur-sm opacity-30 group-hover:opacity-50 transition-opacity"></div>
                  <img 
                    src={selectedArticle.featured_image_url} 
                    alt={selectedArticle.title}
                    className="relative w-full h-64 md:h-80 lg:h-96 object-cover rounded-xl shadow-2xl border border-border/50"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <main className="pb-16">
          <div className="container mx-auto px-4 max-w-4xl">
            {/* Article Content */}
            <article className="mb-16">
              <div className="bg-background/80 backdrop-blur-sm border border-border/50 rounded-2xl p-8 md:p-12 shadow-lg">
                <div 
                  className="article-content max-w-none 
                            [&>p]:text-lg [&>p]:leading-relaxed [&>p]:text-foreground [&>p]:mb-6
                            [&>h1]:scroll-mt-20 [&>h2]:scroll-mt-20 [&>h3]:scroll-mt-20
                            [&>ul]:pl-0 [&>ul]:list-none
                            [&>blockquote]:text-lg [&>blockquote]:leading-relaxed
                            [&>pre]:text-sm [&>pre]:leading-relaxed
                            [&_img]:transition-all [&_img]:duration-300 [&_img]:hover:scale-[1.02]
                            [&_code]:text-primary [&_code]:font-medium"
                  dangerouslySetInnerHTML={{ 
                    __html: processContentWithMedia(selectedArticle.content)
                  }}
                />
              </div>
            </article>

            {/* Author & Share Section */}
            <div className="bg-gradient-to-r from-primary/5 to-primary-glow/5 rounded-2xl p-8 mb-16 border border-border/20">
              <div className="flex items-center justify-between flex-wrap gap-6">
                <div className="flex items-center gap-4">
                  <Avatar className="w-12 h-12 border-2 border-primary/20">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      T
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-foreground">Tim Talentika</p>
                    <p className="text-sm text-muted-foreground">Career Development Expert</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      navigator.share?.({
                        title: selectedArticle.title,
                        url: window.location.href
                      }) || navigator.clipboard.writeText(window.location.href);
                      toast.success('Link berhasil disalin!');
                    }}
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Bagikan Artikel
                  </Button>
                </div>
              </div>
            </div>

            <Separator className="my-16" />

            {/* Related Articles */}
            <div>
              <div className="text-center mb-12">
                <h3 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent mb-4">
                  Artikel Terkait
                </h3>
                <p className="text-muted-foreground text-lg">
                  Jelajahi artikel lainnya yang mungkin menarik untuk Anda
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-8">
                {articles
                  .filter(a => a.id !== selectedArticle.id && a.category === selectedArticle.category)
                  .slice(0, 4)
                  .map((article) => (
                    <Card key={article.id} className="group hover:shadow-xl transition-all duration-500 border-0 bg-gradient-to-br from-card to-card/80 hover:-translate-y-2 overflow-hidden">
                      <div className="relative overflow-hidden">
                        {article.featured_image_url ? (
                          <img 
                            src={article.featured_image_url} 
                            alt={article.title}
                            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-48 bg-gradient-to-br from-primary/20 to-primary-glow/20 flex items-center justify-center">
                            <div className="text-6xl text-primary/30">📄</div>
                          </div>
                        )}
                        <div className="absolute top-4 left-4">
                          <Badge className="bg-primary/90 text-white shadow-lg">{article.category}</Badge>
                        </div>
                      </div>
                      <CardHeader className="pb-2">
                        <CardTitle className="line-clamp-2 text-lg group-hover:text-primary transition-colors">
                          <Link to={`/articles/${article.slug}`}>
                            {article.title}
                          </Link>
                        </CardTitle>
                        <CardDescription className="line-clamp-3 text-muted-foreground">
                          {article.excerpt}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4 text-primary" />
                              <span>{article.reading_time_minutes} min</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Eye className="w-4 h-4 text-primary" />
                              <span>{article.view_count}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
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
          <div className="text-center mb-16 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary-glow/5 rounded-3xl -z-10"></div>
            <div className="py-16 px-8">
              <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent mb-6">
                Artikel Karir & Pengembangan Diri
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Temukan tips, strategi, dan insight terbaru untuk mengembangkan karir dan potensi diri Anda dengan panduan dari para ahli
              </p>
              <div className="mt-8 flex items-center justify-center gap-4">
                <div className="flex items-center gap-2 text-primary font-medium">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span>Artikel Berkualitas</span>
                </div>
                <div className="flex items-center gap-2 text-primary font-medium">
                  <div className="w-2 h-2 bg-primary-glow rounded-full"></div>
                  <span>Tips Praktis</span>
                </div>
                <div className="flex items-center gap-2 text-primary font-medium">
                  <div className="w-2 h-2 bg-primary rounded-full"></div>
                  <span>Insight Mendalam</span>
                </div>
              </div>
            </div>
          </div>

          {/* Featured Articles */}
          {featuredArticles.length > 0 && (
            <section className="mb-16">
              <h2 className="text-3xl font-bold text-center mb-12 bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                Artikel Unggulan
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {featuredArticles.map((article) => (
                  <Card key={article.id} className="group hover:shadow-2xl transition-all duration-500 border-0 bg-gradient-to-br from-card to-card/80 hover:-translate-y-2 overflow-hidden">
                    <div className="relative overflow-hidden">
                      {article.featured_image_url ? (
                        <img 
                          src={article.featured_image_url} 
                          alt={article.title}
                          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-48 bg-gradient-to-br from-primary/20 to-primary-glow/20 flex items-center justify-center">
                          <div className="text-6xl text-primary/30">📄</div>
                        </div>
                      )}
                      <div className="absolute top-4 left-4 flex items-center gap-2">
                        <Badge className="bg-primary/90 text-white shadow-lg">{article.category}</Badge>
                        <Badge className="bg-gradient-to-r from-amber-400 to-orange-400 text-white shadow-lg border-0">
                          ⭐ Featured
                        </Badge>
                      </div>
                    </div>
                    <CardHeader className="pb-2">
                      <CardTitle className="line-clamp-2 text-lg group-hover:text-primary transition-colors">
                        <Link to={`/articles/${article.slug}`}>
                          {article.title}
                        </Link>
                      </CardTitle>
                      <CardDescription className="line-clamp-3 text-muted-foreground">
                        {article.excerpt}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4 text-primary" />
                            <span>{article.reading_time_minutes} min</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Eye className="w-4 h-4 text-primary" />
                            <span>{article.view_count}</span>
                          </div>
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
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredArticles.map((article) => (
              <Card key={article.id} className="group hover:shadow-xl transition-all duration-300 border-0 bg-card/80 backdrop-blur-sm hover:-translate-y-1 overflow-hidden">
                <div className="relative overflow-hidden">
                  {article.featured_image_url ? (
                    <img 
                      src={article.featured_image_url} 
                      alt={article.title}
                      className="w-full h-40 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-40 bg-gradient-to-br from-muted to-muted/60 flex items-center justify-center">
                      <div className="text-4xl text-muted-foreground/50">📝</div>
                    </div>
                  )}
                  <div className="absolute top-3 left-3">
                    <Badge className="bg-primary/90 text-white shadow-md">{article.category}</Badge>
                  </div>
                </div>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    {article.tags.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs bg-background/50 hover:bg-primary/10">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <CardTitle className="line-clamp-2 text-lg group-hover:text-primary transition-colors leading-snug">
                    <Link to={`/articles/${article.slug}`}>
                      {article.title}
                    </Link>
                  </CardTitle>
                  <CardDescription className="line-clamp-3 text-muted-foreground leading-relaxed">
                    {article.excerpt}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-primary" />
                        <span>{article.reading_time_minutes} min</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4 text-primary" />
                        <span>{article.view_count}</span>
                      </div>
                    </div>
                    <span className="text-xs font-medium">
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