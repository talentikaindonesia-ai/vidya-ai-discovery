import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Calendar, MapPin, Trophy, Users, ArrowRight } from "lucide-react";
import { useState } from "react";

const OpportunitiesPreview = () => {
  const [activeFilter, setActiveFilter] = useState("Semua");

  const filterTabs = [
    { label: "Semua", count: 12 },
    { label: "Beasiswa", count: 3 },
    { label: "Kompetisi", count: 5 },
    { label: "Magang", count: 4 }
  ];

  const opportunities = [
    {
      id: 1,
      title: "Beasiswa S1 Teknik Informatika",
      description: "Program beasiswa penuh untuk mahasiswa berprestasi di bidang teknologi",
      type: "Beasiswa",
      deadline: "2024-02-15",
      location: "Jakarta",
      organizer: "Tech Foundation",
      tags: ["Teknologi", "S1", "Full Scholarship"]
    },
    {
      id: 2,
      title: "Lomba Desain UI/UX Nasional",
      description: "Kompetisi desain antarmuka untuk mahasiswa dan profesional muda",
      type: "Kompetisi",
      deadline: "2024-02-20",
      location: "Online",
      organizer: "Design Community",
      tags: ["Design", "UI/UX", "Nasional"]
    },
    {
      id: 3,
      title: "Magang Digital Marketing",
      description: "Program magang 6 bulan di startup teknologi terkemuka",
      type: "Magang",
      deadline: "2024-02-10",
      location: "Bandung",
      organizer: "TechStart Inc",
      tags: ["Marketing", "Startup", "6 Bulan"]
    }
  ];

  const filteredOpportunities = activeFilter === "Semua" 
    ? opportunities 
    : opportunities.filter(opp => opp.type === activeFilter);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "Beasiswa": return <Trophy className="w-4 h-4" />;
      case "Kompetisi": return <Users className="w-4 h-4" />;
      case "Magang": return <Briefcase className="w-4 h-4" />;
      default: return <Briefcase className="w-4 h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "Beasiswa": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Kompetisi": return "bg-blue-100 text-blue-800 border-blue-200";
      case "Magang": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <section className="py-20 bg-muted/30">
      <div className="container px-4">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Briefcase className="w-8 h-8 text-primary" />
            <h2 className="text-3xl md:text-4xl font-bold">
              Opportunity for You
            </h2>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Temukan peluang beasiswa, kompetisi, dan magang yang sesuai dengan minatmu
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex justify-center mb-8">
          <div className="flex flex-wrap gap-2 p-1 bg-card rounded-lg border">
            {filterTabs.map((tab) => (
              <button
                key={tab.label}
                onClick={() => setActiveFilter(tab.label)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeFilter === tab.label
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                {tab.label}
                <span className="ml-2 text-xs opacity-70">{tab.count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Opportunities Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {filteredOpportunities.map((opportunity) => (
            <Card key={opportunity.id} className="group hover:shadow-card transition-all duration-300 hover:-translate-y-1 bg-card border-primary/10">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between mb-2">
                  <Badge variant="outline" className={`${getTypeColor(opportunity.type)} flex items-center gap-1`}>
                    {getTypeIcon(opportunity.type)}
                    {opportunity.type}
                  </Badge>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(opportunity.deadline).toLocaleDateString('id-ID')}
                  </div>
                </div>
                <CardTitle className="text-lg group-hover:text-primary transition-colors line-clamp-2">
                  {opportunity.title}
                </CardTitle>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {opportunity.description}
                </p>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>{opportunity.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span>{opportunity.organizer}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mb-4">
                  {opportunity.tags.slice(0, 2).map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {opportunity.tags.length > 2 && (
                    <Badge variant="secondary" className="text-xs">
                      +{opportunity.tags.length - 2}
                    </Badge>
                  )}
                </div>
                <Button variant="outline" size="sm" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  Lihat Detail
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Button 
            size="lg" 
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-lg hover:shadow-xl transition-all duration-300 group"
            onClick={() => window.location.href = '/opportunity-board'}
          >
            <Briefcase className="w-5 h-5 mr-2" />
            Explore Opportunity for You
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default OpportunitiesPreview;