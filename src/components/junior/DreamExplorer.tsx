import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const DreamExplorer = () => {
  const [selectedCareer, setSelectedCareer] = useState<any>(null);

  const careers = [
    {
      id: 1,
      title: "Dokter Hewan 👩‍⚕️",
      description: "Merawat hewan-hewan kesayangan",
      category: "Kesehatan",
      skills: ["Biologi", "Empati", "Kesabaran"],
      learningPath: ["Biologi Dasar", "Anatomi Hewan", "Perawatan Hewan"],
      dailyLife: "Memeriksa kesehatan hewan, memberikan obat, dan operasi kecil",
      emoji: "🐕",
      color: "from-green-400 to-teal-400"
    },
    {
      id: 2,
      title: "Insinyur Robot 🤖",
      description: "Membuat robot canggih untuk membantu manusia",
      category: "Teknologi",
      skills: ["Matematika", "Fisika", "Kreativitas"],
      learningPath: ["Matematika Dasar", "Coding untuk Anak", "Robotika"],
      dailyLife: "Mendesain robot, menulis program, dan menguji coba robot baru",
      emoji: "🤖",
      color: "from-blue-400 to-purple-400"
    },
    {
      id: 3,
      title: "Chef Koki 👨‍🍳",
      description: "Membuat masakan lezat untuk orang banyak",
      category: "Kuliner",
      skills: ["Kreativitas", "Kesabaran", "Rasa"],
      learningPath: ["Masak Sederhana", "Nutrisi Makanan", "Manajemen Dapur"],
      dailyLife: "Menciptakan resep baru, memasak, dan menata makanan cantik",
      emoji: "🍳",
      color: "from-orange-400 to-red-400"
    },
    {
      id: 4,
      title: "Seniman Digital 🎨",
      description: "Membuat gambar dan animasi di komputer",
      category: "Seni",
      skills: ["Kreativitas", "Teknologi", "Estetika"],
      learningPath: ["Menggambar Dasar", "Software Design", "Animasi Digital"],
      dailyLife: "Menggambar di tablet, membuat animasi, dan desain grafis",
      emoji: "🎨",
      color: "from-pink-400 to-purple-400"
    },
    {
      id: 5,
      title: "Pilot Pesawat ✈️",
      description: "Menerbangkan pesawat ke seluruh dunia",
      category: "Transportasi",
      skills: ["Fokus", "Navigasi", "Ketenangan"],
      learningPath: ["Geografi", "Fisika Terbang", "Navigasi Udara"],
      dailyLife: "Mengecek pesawat, merencanakan rute, dan terbang ke berbagai negara",
      emoji: "✈️",
      color: "from-cyan-400 to-blue-400"
    },
    {
      id: 6,
      title: "Guru Sekolah 👩‍🏫",
      description: "Mengajar anak-anak dan membantu mereka belajar",
      category: "Pendidikan",
      skills: ["Komunikasi", "Kesabaran", "Empati"],
      learningPath: ["Teknik Mengajar", "Psikologi Anak", "Manajemen Kelas"],
      dailyLife: "Menyiapkan pelajaran, mengajar di kelas, dan membantu murid",
      emoji: "📚",
      color: "from-emerald-400 to-green-400"
    }
  ];

  const handleCareerSelect = (career: any) => {
    setSelectedCareer(career);
  };

  if (selectedCareer) {
    return (
      <div className="max-w-4xl mx-auto">
        <Button 
          variant="ghost" 
          onClick={() => setSelectedCareer(null)}
          className="mb-6"
        >
          ← Kembali ke Daftar Profesi
        </Button>

        <Card className={`p-8 shadow-xl border-0 bg-gradient-to-br ${selectedCareer.color}/10`}>
          <div className="text-center mb-8">
            <div className="text-8xl mb-4">{selectedCareer.emoji}</div>
            <h2 className="text-3xl font-bold mb-2">{selectedCareer.title}</h2>
            <p className="text-lg text-muted-foreground">{selectedCareer.description}</p>
            <Badge className="mt-2">{selectedCareer.category}</Badge>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                💪 Kemampuan yang Dibutuhkan
              </h3>
              <div className="space-y-2">
                {selectedCareer.skills.map((skill: string, index: number) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-primary rounded-full"></span>
                    <span>{skill}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                📚 Jalur Belajar
              </h3>
              <div className="space-y-3">
                {selectedCareer.learningPath.map((step: string, index: number) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              🌅 Hari-hari Sebagai {selectedCareer.title.split(' ')[0]}
            </h3>
            <Card className="p-4 bg-background/50">
              <p className="text-muted-foreground">{selectedCareer.dailyLife}</p>
            </Card>
          </div>

          <div className="mt-8 text-center">
            <Button 
              size="lg" 
              className={`bg-gradient-to-r ${selectedCareer.color} text-white hover:scale-105 transition-transform`}
            >
              Mulai Jalur Belajar Ini! 🚀
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4">Jelajahi Profesi Impianmu! 🌟</h2>
        <p className="text-lg text-muted-foreground">
          Pilih profesi yang menarik bagimu dan temukan jalur belajar yang tepat
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {careers.map((career) => (
          <Card 
            key={career.id}
            className="p-6 cursor-pointer hover:scale-105 transition-all duration-300 shadow-lg border-0 group"
            onClick={() => handleCareerSelect(career)}
          >
            <div className={`h-32 bg-gradient-to-br ${career.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
              <span className="text-6xl">{career.emoji}</span>
            </div>

            <div className="text-center">
              <h3 className="font-bold text-lg mb-2">{career.title}</h3>
              <p className="text-sm text-muted-foreground mb-4">{career.description}</p>
              <Badge variant="secondary">{career.category}</Badge>
            </div>
          </Card>
        ))}
      </div>

      <Card className="mt-8 p-6 bg-gradient-to-r from-yellow-100 to-orange-100 shadow-lg border-0">
        <div className="text-center">
          <h3 className="text-xl font-bold mb-2">Tidak Yakin dengan Pilihanmu?</h3>
          <p className="text-muted-foreground mb-4">
            Coba dulu Talent Quiz untuk mengetahui minat dan bakatmu!
          </p>
          <Button variant="outline">
            Ikuti Talent Quiz 🎯
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default DreamExplorer;