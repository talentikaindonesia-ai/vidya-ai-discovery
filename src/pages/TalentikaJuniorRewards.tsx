import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Trophy, Star, ShoppingCart, Gift, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { TalentikaJuniorBottomNav } from "@/components/dashboard/TalentikaJuniorBottomNav";

const TalentikaJuniorRewards = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [activeSection, setActiveSection] = useState("badges");
  const [userCoins, setUserCoins] = useState(250);
  const [userBadges, setUserBadges] = useState([
    { id: 1, name: "Eco Hero", icon: "🌱", earned: true },
    { id: 2, name: "Math Wizard", icon: "🔢", earned: true },
    { id: 3, name: "Creative Artist", icon: "🎨", earned: false },
  ]);

  const badges = [
    {
      id: 1,
      name: "Eco Hero Badge",
      icon: "🌱",
      description: "Complete 5 environmental activities",
      requirement: "Complete eco-friendly challenges",
      earned: true,
      progress: 100
    },
    {
      id: 2,
      name: "Coding Star",
      icon: "💻",
      description: "Master coding fundamentals",
      requirement: "Complete 3 coding modules",
      earned: false,
      progress: 66
    },
    {
      id: 3,
      name: "Creative Artist",
      icon: "🎨",
      description: "Upload 5 creative artworks",
      requirement: "Share your creative projects",
      earned: false,
      progress: 40
    },
    {
      id: 4,
      name: "Math Wizard",
      icon: "🔢",
      description: "Solve 50 math problems",
      requirement: "Master mathematical concepts",
      earned: true,
      progress: 100
    },
    {
      id: 5,
      name: "Reading Champion",
      icon: "📚",
      description: "Read 10 story books",
      requirement: "Complete reading challenges",
      earned: false,
      progress: 30
    },
    {
      id: 6,
      name: "Science Explorer",
      icon: "🔬",
      description: "Complete 8 science experiments",
      requirement: "Discover the world of science",
      earned: false,
      progress: 25
    }
  ];

  const storeItems = [
    {
      id: 1,
      name: "Robotics Learning Kit",
      description: "Build your own robot with this fun kit!",
      price: 500,
      image: "🤖",
      category: "Educational Kits"
    },
    {
      id: 2,
      name: "Art Supplies Bundle",
      description: "Complete set of drawing and painting supplies",
      price: 300,
      image: "🎨",
      category: "Creative Tools"
    },
    {
      id: 3,
      name: "Talentika T-Shirt",
      description: "Show off your learning journey!",
      price: 150,
      image: "👕",
      category: "Merchandise"
    },
    {
      id: 4,
      name: "Science Experiment Kit",
      description: "Safe and fun experiments for home",
      price: 400,
      image: "⚗️",
      category: "Educational Kits"
    },
    {
      id: 5,
      name: "Digital Drawing Tablet",
      description: "Create digital art like a pro!",
      price: 800,
      image: "📱",
      category: "Digital Tools"
    },
    {
      id: 6,
      name: "Learning Headphones",
      description: "Premium headphones for online learning",
      price: 200,
      image: "🎧",
      category: "Study Tools"
    }
  ];

  const sponsoredRewards = [
    {
      id: 1,
      name: "Free Coding Class",
      description: "1-month free access to partner coding bootcamp",
      icon: "💻",
      sponsor: "CodeKids Academy",
      requirement: "Complete Digital Innovation module",
      available: true
    },
    {
      id: 2,
      name: "WWF Green Champion Badge",
      description: "Official recognition from WWF Indonesia",
      icon: "🌍",
      sponsor: "WWF Indonesia",
      requirement: "Complete all Eco Hero challenges",
      available: false
    },
    {
      id: 3,
      name: "Art Contest Entry",
      description: "Free entry to national junior art competition",
      icon: "🏆",
      sponsor: "Young Artists Foundation",
      requirement: "Upload 3 creative artworks",
      available: true
    }
  ];

  const purchaseItem = (item: any) => {
    if (userCoins >= item.price) {
      setUserCoins(userCoins - item.price);
      toast.success(`🎉 You got ${item.name}! It will be delivered soon.`);
    } else {
      toast.error(`You need ${item.price - userCoins} more coins to buy this item.`);
    }
  };

  const claimSponsoredReward = (reward: any) => {
    if (reward.available) {
      toast.success(`🎉 ${reward.name} claimed! Check your email for details.`);
    } else {
      toast.error(`Complete the requirement: ${reward.requirement}`);
    }
  };

  return (
    <div className={cn("min-h-screen bg-gradient-to-br from-yellow-100 via-orange-100 to-red-100 p-4", isMobile && "pb-20")}>
      <div className="max-w-6xl mx-auto">
        {!isMobile && (
          <Button 
            variant="ghost" 
            onClick={() => navigate('/talentika-junior')}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        )}

        {/* Header with Coin Balance */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center justify-center gap-2">
            <Trophy className="w-8 h-8 text-yellow-500" />
            Rewards Store 🏪
          </h1>
          <p className="text-lg text-muted-foreground mb-4">
            Collect badges and spend your coins on amazing rewards!
          </p>
          <Card className="inline-block p-4 bg-gradient-to-r from-yellow-400 to-orange-400 text-white">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🪙</span>
              <div>
                <div className="text-2xl font-bold">{userCoins} Coins</div>
                <div className="text-sm opacity-90">Your Balance</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Mobile-friendly Navigation */}
        {isMobile ? (
          <div className="space-y-6">
            {/* Back button for mobile when in specific section */}
            {activeSection !== "overview" && (
              <Button 
                variant="ghost" 
                onClick={() => setActiveSection("overview")}
                className="mb-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Menu
              </Button>
            )}

            {activeSection === "overview" ? (
              <div className="grid gap-4">
                <Card 
                  className="p-4 cursor-pointer hover:scale-105 transition-all duration-300 shadow-lg border-0"
                  onClick={() => setActiveSection("badges")}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-lg flex items-center justify-center">
                      <Trophy className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">My Badges</h3>
                      <p className="text-muted-foreground text-sm">View your earned achievements</p>
                      <div className="text-xs text-primary mt-1">
                        {badges.filter(b => b.earned).length} badges earned
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </Card>

                <Card 
                  className="p-4 cursor-pointer hover:scale-105 transition-all duration-300 shadow-lg border-0"
                  onClick={() => setActiveSection("store")}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-emerald-400 rounded-lg flex items-center justify-center">
                      <ShoppingCart className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">Coin Store</h3>
                      <p className="text-muted-foreground text-sm">Spend coins on rewards</p>
                      <div className="text-xs text-primary mt-1">
                        {userCoins} coins available
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </Card>

                <Card 
                  className="p-4 cursor-pointer hover:scale-105 transition-all duration-300 shadow-lg border-0"
                  onClick={() => setActiveSection("sponsored")}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg flex items-center justify-center">
                      <Gift className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">Sponsored Rewards</h3>
                      <p className="text-muted-foreground text-sm">Special offers from partners</p>
                      <div className="text-xs text-primary mt-1">
                        3 rewards available
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </Card>

                <Card 
                  className="p-4 cursor-pointer hover:scale-105 transition-all duration-300 shadow-lg border-0"
                  onClick={() => setActiveSection("history")}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-lg flex items-center justify-center">
                      <Star className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg">Purchase History</h3>
                      <p className="text-muted-foreground text-sm">View your past rewards</p>
                      <div className="text-xs text-primary mt-1">
                        5 items purchased
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </Card>
              </div>
            ) : (
              /* Section Content */
              <>
                {activeSection === "badges" && (
                  <div className="space-y-4">
                    <h2 className="text-2xl font-bold text-center mb-6">My Badges 🏆</h2>
                    {badges.map((badge) => (
                      <Card key={badge.id} className="p-4 shadow-lg border-0">
                        <div className="flex items-center gap-4">
                          <div className={`text-4xl ${badge.earned ? 'grayscale-0' : 'grayscale opacity-50'}`}>
                            {badge.icon}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-bold text-lg">{badge.name}</h3>
                            <p className="text-sm text-muted-foreground mb-2">{badge.description}</p>
                            
                            {badge.earned ? (
                              <Badge className="bg-green-100 text-green-700">
                                ✓ Earned!
                              </Badge>
                            ) : (
                              <div className="space-y-1">
                                <div className="flex justify-between text-xs">
                                  <span>Progress</span>
                                  <span>{badge.progress}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-primary h-2 rounded-full transition-all"
                                    style={{ width: `${badge.progress}%` }}
                                  ></div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}

                {activeSection === "store" && (
                  <div className="space-y-4">
                    <h2 className="text-2xl font-bold text-center mb-6">Coin Store 🛒</h2>
                    {storeItems.map((item) => (
                      <Card key={item.id} className="overflow-hidden shadow-lg border-0">
                        <div className="flex">
                          <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                            <span className="text-3xl">{item.image}</span>
                          </div>
                          <div className="flex-1 p-4">
                            <h3 className="font-bold text-lg mb-1">{item.name}</h3>
                            <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1 text-orange-600 font-bold">
                                <span>🪙</span>
                                <span>{item.price}</span>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => purchaseItem(item)}
                                className={userCoins >= item.price ? "" : "opacity-50"}
                              >
                                {userCoins >= item.price ? "Buy Now" : "Need more coins"}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}

                {activeSection === "sponsored" && (
                  <div className="space-y-4">
                    <h2 className="text-2xl font-bold text-center mb-6">Sponsored Rewards 🎁</h2>
                    {sponsoredRewards.map((reward) => (
                      <Card key={reward.id} className="overflow-hidden shadow-lg border-0">
                        <div className="flex">
                          <div className="w-20 h-20 bg-gradient-to-br from-purple-400/20 to-pink-400/20 flex items-center justify-center">
                            <span className="text-3xl">{reward.icon}</span>
                          </div>
                          <div className="flex-1 p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-bold text-lg">{reward.name}</h3>
                              <Badge variant="outline" className="text-xs">
                                {reward.sponsor}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">{reward.description}</p>
                            <div className="flex items-center justify-between">
                              <p className="text-xs text-muted-foreground">{reward.requirement}</p>
                              <Button
                                size="sm"
                                onClick={() => claimSponsoredReward(reward)}
                                className={reward.available ? "" : "opacity-50"}
                              >
                                {reward.available ? "Claim Now" : "Complete Task"}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}

                {activeSection === "history" && (
                  <div className="space-y-4">
                    <h2 className="text-2xl font-bold text-center mb-6">Purchase History 📋</h2>
                    <Card className="p-6 text-center">
                      <div className="text-6xl mb-4">🛍️</div>
                      <h3 className="text-xl font-bold mb-2">No purchases yet!</h3>
                      <p className="text-muted-foreground">
                        Your reward purchases will appear here.
                      </p>
                    </Card>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          /* Desktop view - Keep original tabs */
          <Tabs defaultValue="badges" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="badges">My Badges</TabsTrigger>
              <TabsTrigger value="store">Coin Store</TabsTrigger>
              <TabsTrigger value="sponsored">Sponsored Rewards</TabsTrigger>
              <TabsTrigger value="history">Purchase History</TabsTrigger>
            </TabsList>

            {/* Badges Tab */}
            <TabsContent value="badges">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {badges.map((badge) => (
                  <Card key={badge.id} className="p-6 text-center shadow-lg border-0">
                    <div className={`text-6xl mb-4 ${badge.earned ? 'grayscale-0' : 'grayscale opacity-50'}`}>
                      {badge.icon}
                    </div>
                    <h3 className="font-bold text-lg mb-2">{badge.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{badge.description}</p>
                    
                    {badge.earned ? (
                      <Badge className="bg-green-100 text-green-700 mb-3">
                        ✓ Earned!
                      </Badge>
                    ) : (
                      <div className="mb-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Progress</span>
                          <span>{badge.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${badge.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                    
                    <p className="text-xs text-muted-foreground">{badge.requirement}</p>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Store Tab */}
            <TabsContent value="store">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {storeItems.map((item) => (
                  <Card key={item.id} className="overflow-hidden shadow-lg border-0">
                    <div className="h-32 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                      <span className="text-6xl">{item.image}</span>
                    </div>
                    <div className="p-4">
                      <Badge variant="outline" className="mb-2 text-xs">
                        {item.category}
                      </Badge>
                      <h3 className="font-bold text-lg mb-2">{item.name}</h3>
                      <p className="text-sm text-muted-foreground mb-4">{item.description}</p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-orange-600 font-bold text-lg">
                          <span>🪙</span>
                          <span>{item.price}</span>
                        </div>
                        <Button
                          onClick={() => purchaseItem(item)}
                          className={userCoins >= item.price ? "" : "opacity-50"}
                        >
                          {userCoins >= item.price ? "Buy Now" : "Not enough coins"}
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Sponsored Rewards Tab */}
            <TabsContent value="sponsored">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sponsoredRewards.map((reward) => (
                  <Card key={reward.id} className="overflow-hidden shadow-lg border-0">
                    <div className="h-32 bg-gradient-to-br from-purple-400/20 to-pink-400/20 flex items-center justify-center">
                      <span className="text-6xl">{reward.icon}</span>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold text-lg">{reward.name}</h3>
                        <Badge variant="outline" className="text-xs">
                          {reward.sponsor}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">{reward.description}</p>
                      <p className="text-xs text-muted-foreground mb-4">{reward.requirement}</p>
                      
                      <Button
                        onClick={() => claimSponsoredReward(reward)}
                        className={`w-full ${reward.available ? "" : "opacity-50"}`}
                      >
                        {reward.available ? "Claim Now" : "Complete Task First"}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Purchase History Tab */}
            <TabsContent value="history">
              <Card className="p-8 text-center">
                <div className="text-8xl mb-4">🛍️</div>
                <h2 className="text-3xl font-bold mb-4">No purchases yet!</h2>
                <p className="text-lg text-muted-foreground mb-6">
                  Your reward purchases will appear here once you start shopping.
                </p>
                <Button onClick={() => setActiveSection("store")}>
                  Visit Coin Store
                </Button>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {/* Earn More Coins Section - Only show on desktop or when in overview */}
        {(!isMobile || activeSection === "overview") && (
          <Card className="mt-8 p-6 shadow-lg border-0 bg-gradient-to-r from-green-100 to-blue-100">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Star className="w-6 h-6 text-yellow-500" />
              Earn More Coins!
            </h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-white rounded-lg">
                <div className="text-3xl mb-2">🎮</div>
                <h4 className="font-medium mb-1">Play Games</h4>
                <p className="text-sm text-muted-foreground">50+ coins per game</p>
              </div>
              <div className="text-center p-4 bg-white rounded-lg">
                <div className="text-3xl mb-2">📚</div>
                <h4 className="font-medium mb-1">Complete Lessons</h4>
                <p className="text-sm text-muted-foreground">30+ coins per lesson</p>
              </div>
              <div className="text-center p-4 bg-white rounded-lg">
                <div className="text-3xl mb-2">🏆</div>
                <h4 className="font-medium mb-1">Earn Badges</h4>
                <p className="text-sm text-muted-foreground">100+ coins per badge</p>
              </div>
            </div>
          </Card>
        )}
      </div>
      
      <TalentikaJuniorBottomNav />
    </div>
  );
};

export default TalentikaJuniorRewards;