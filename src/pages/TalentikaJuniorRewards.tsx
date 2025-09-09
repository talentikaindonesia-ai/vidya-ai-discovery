import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Trophy, Star, ShoppingCart, Gift } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const TalentikaJuniorRewards = () => {
  const navigate = useNavigate();
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
      description: "Complete 5 environmental activities",
      icon: "🌱",
      requirement: "5/5 Eco Activities",
      earned: true,
      progress: 100,
    },
    {
      id: 2,
      name: "Coding Star",
      description: "Finish coding fundamentals course",
      icon: "💻",
      requirement: "Complete Coding Course",
      earned: false,
      progress: 60,
    },
    {
      id: 3,
      name: "Creative Artist",
      description: "Upload 3 original artworks",
      icon: "🎨",
      requirement: "3/3 Artworks",
      earned: false,
      progress: 33,
    },
    {
      id: 4,
      name: "Science Explorer",
      description: "Complete 10 science experiments",
      icon: "🔬",
      requirement: "7/10 Experiments",
      earned: false,
      progress: 70,
    },
    {
      id: 5,
      name: "Reading Champion",
      description: "Read 20 stories",
      icon: "📚",
      requirement: "12/20 Stories",
      earned: false,
      progress: 60,
    },
    {
      id: 6,
      name: "Music Maestro",
      description: "Create 5 musical compositions",
      icon: "🎵",
      requirement: "2/5 Compositions",
      earned: false,
      progress: 40,
    },
  ];

  const storeItems = [
    {
      id: 1,
      name: "Robotics Learning Kit",
      description: "Build your own robots with this starter kit!",
      type: "physical",
      price: 150,
      originalPrice: 200,
      image: "🤖",
      category: "Learning Kit",
      inStock: true,
    },
    {
      id: 2,
      name: "Art Supplies Bundle",
      description: "Complete set of colored pencils, markers, and paper",
      type: "physical",
      price: 75,
      originalPrice: 100,
      image: "🎨",
      category: "Creative Kit",
      inStock: true,
    },
    {
      id: 3,
      name: "Talentika T-Shirt",
      description: "Cool Talentika Junior branded t-shirt",
      type: "merchandise",
      price: 50,
      originalPrice: 75,
      image: "👕",
      category: "Merchandise",
      inStock: true,
    },
    {
      id: 4,
      name: "Science Experiment Kit",
      description: "Safe experiments to do at home",
      type: "physical",
      price: 120,
      originalPrice: 150,
      image: "⚗️",
      category: "Learning Kit",
      inStock: false,
    },
    {
      id: 5,
      name: "Premium Course Access",
      description: "Unlock premium learning content for 1 month",
      type: "digital",
      price: 100,
      originalPrice: 150,
      image: "🔓",
      category: "Digital",
      inStock: true,
    },
    {
      id: 6,
      name: "Eco Hero Tumbler",
      description: "Reusable water bottle with cool eco design",
      type: "merchandise",
      price: 40,
      originalPrice: 60,
      image: "🥤",
      category: "Merchandise",
      inStock: true,
    },
  ];

  const sponsoredRewards = [
    {
      id: 1,
      name: "Green Champion Badge by WWF",
      description: "Special environmental awareness badge",
      sponsor: "WWF",
      icon: "🌍",
      requirement: "Complete Eco Challenge",
      available: true,
    },
    {
      id: 2,
      name: "Coding Bootcamp Voucher",
      description: "Free 1-day coding workshop by TechAcademy",
      sponsor: "TechAcademy",
      icon: "💻",
      requirement: "Complete 5 Coding Games",
      available: false,
    },
    {
      id: 3,
      name: "Art Workshop with Danone",
      description: "Creative recycling workshop",
      sponsor: "Danone",
      icon: "♻️",
      requirement: "Eco Hero Badge + 3 Art Activities",
      available: true,
    },
  ];

  const handlePurchase = (item: any) => {
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
    <div className="min-h-screen bg-gradient-to-br from-yellow-100 via-orange-100 to-red-100 p-4">
      <div className="max-w-6xl mx-auto">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/talentika-junior')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

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
                    <Badge variant="secondary" className="mb-2">{item.category}</Badge>
                    <h3 className="font-bold text-lg mb-2">{item.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{item.description}</p>
                    
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-primary">{item.price} 🪙</span>
                        {item.originalPrice > item.price && (
                          <span className="text-sm text-muted-foreground line-through">
                            {item.originalPrice} 🪙
                          </span>
                        )}
                      </div>
                      {!item.inStock && (
                        <Badge variant="destructive">Out of Stock</Badge>
                      )}
                    </div>

                    <Button 
                      className="w-full"
                      onClick={() => handlePurchase(item)}
                      disabled={!item.inStock || userCoins < item.price}
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      {userCoins >= item.price ? 'Buy Now' : 'Not Enough Coins'}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Sponsored Rewards Tab */}
          <TabsContent value="sponsored">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sponsoredRewards.map((reward) => (
                <Card key={reward.id} className="p-6 text-center shadow-lg border-0 bg-gradient-to-br from-blue-50 to-purple-50">
                  <div className="text-6xl mb-4">{reward.icon}</div>
                  <h3 className="font-bold text-lg mb-2">{reward.name}</h3>
                  <Badge variant="outline" className="mb-3">By {reward.sponsor}</Badge>
                  <p className="text-sm text-muted-foreground mb-4">{reward.description}</p>
                  <p className="text-xs text-muted-foreground mb-4">Requirement: {reward.requirement}</p>
                  
                  <Button 
                    className="w-full"
                    onClick={() => claimSponsoredReward(reward)}
                    disabled={!reward.available}
                    variant={reward.available ? "default" : "secondary"}
                  >
                    <Gift className="w-4 h-4 mr-2" />
                    {reward.available ? 'Claim Now' : 'Not Available'}
                  </Button>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Purchase History Tab */}
          <TabsContent value="history">
            <Card className="p-6 shadow-lg border-0">
              <h3 className="text-xl font-bold mb-4">Recent Purchases</h3>
              <div className="space-y-4">
                {[
                  { item: "Art Supplies Bundle", date: "2024-01-15", coins: 75, status: "Delivered" },
                  { item: "Premium Course Access", date: "2024-01-10", coins: 100, status: "Active" },
                  { item: "Eco Hero Tumbler", date: "2024-01-05", coins: 40, status: "Shipped" },
                ].map((purchase, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div>
                      <h4 className="font-medium">{purchase.item}</h4>
                      <p className="text-sm text-muted-foreground">{purchase.date}</p>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{purchase.coins} 🪙</div>
                      <Badge variant="outline">{purchase.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Earn More Coins Section */}
        <Card className="mt-8 p-6 shadow-lg border-0 bg-gradient-to-r from-green-100 to-blue-100">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Star className="w-6 h-6 text-yellow-500" />
            Earn More Coins!
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-white rounded-lg">
              <div className="text-3xl mb-2">🎮</div>
              <h4 className="font-medium mb-1">Play Games</h4>
              <p className="text-sm text-muted-foreground">25-50 coins per game</p>
            </div>
            <div className="text-center p-4 bg-white rounded-lg">
              <div className="text-3xl mb-2">📚</div>
              <h4 className="font-medium mb-1">Complete Lessons</h4>
              <p className="text-sm text-muted-foreground">20-40 coins per lesson</p>
            </div>
            <div className="text-center p-4 bg-white rounded-lg">
              <div className="text-3xl mb-2">🏆</div>
              <h4 className="font-medium mb-1">Earn Badges</h4>
              <p className="text-sm text-muted-foreground">100+ coins per badge</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default TalentikaJuniorRewards;