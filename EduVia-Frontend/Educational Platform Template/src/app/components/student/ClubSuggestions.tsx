import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Users, Calendar, MapPin, Sparkles, TrendingUp } from 'lucide-react';

export default function ClubSuggestions() {
  // Mock suggestions basées sur le profil de l'étudiant
  const clubSuggestions = [
    {
      id: 1,
      name: "Club Data Science & IA",
      category: "Informatique",
      members: 45,
      matchScore: 95,
      description: "Explorez le machine learning, le deep learning et l'analyse de données avec des projets pratiques.",
      nextMeeting: "05 Février 2026, 14h00",
      location: "Salle B203",
      tags: ["IA", "Python", "Machine Learning"],
      reason: "Recommandé car vous étudiez l'algorithmique et montrez un intérêt pour l'IA"
    },
    {
      id: 2,
      name: "Club Algorithmique Compétitive",
      category: "Programmation",
      members: 32,
      matchScore: 88,
      description: "Participez à des compétitions de programmation (CodeForces, LeetCode) et améliorez vos compétences algorithmiques.",
      nextMeeting: "03 Février 2026, 16h30",
      location: "Lab Informatique",
      tags: ["Algorithmes", "Compétition", "C++"],
      reason: "Parfait pour améliorer vos compétences en structures de données"
    },
    {
      id: 3,
      name: "Hackathon Club",
      category: "Projets",
      members: 67,
      matchScore: 82,
      description: "Créez des projets innovants en 48h, participez à des hackathons nationaux et internationaux.",
      nextMeeting: "07 Février 2026, 18h00",
      location: "Amphithéâtre A",
      tags: ["Innovation", "Équipe", "Projets"],
      reason: "Votre style d'apprentissage pratique correspond à cette approche"
    }
  ];

  const upcomingEvents = [
    {
      id: 1,
      title: "AI Week 2026 - Hackathon",
      date: "15-17 Février 2026",
      type: "Hackathon",
      participants: 120,
      description: "48h pour créer une application utilisant l'IA générative",
      tags: ["IA", "Hackathon", "Prix"]
    },
    {
      id: 2,
      title: "Conférence : L'avenir de la Blockchain",
      date: "20 Février 2026, 10h00",
      type: "Conférence",
      participants: 200,
      description: "Intervenants de l'industrie et démonstrations live",
      tags: ["Blockchain", "Web3", "Innovation"]
    },
    {
      id: 3,
      title: "Workshop : Introduction au Cloud Computing",
      date: "25 Février 2026, 14h00",
      type: "Workshop",
      participants: 50,
      description: "Atelier pratique sur AWS et Azure",
      tags: ["Cloud", "AWS", "DevOps"]
    }
  ];

  const getMatchColor = (score: number) => {
    if (score >= 90) return "text-green-600 bg-green-50";
    if (score >= 80) return "text-blue-600 bg-blue-50";
    return "text-gray-600 bg-gray-50";
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <div className="flex items-start gap-3">
          <Sparkles className="size-6 text-purple-600 mt-1" />
          <div>
            <h2 className="text-xl mb-2">Suggestions de Clubs et Événements</h2>
            <p className="text-gray-700">
              L'IA analyse vos intérêts, votre domaine d'étude et votre niveau pour vous 
              recommander les clubs et événements les plus pertinents.
            </p>
          </div>
        </div>
      </Card>

      {/* Club Suggestions */}
      <div>
        <h3 className="mb-4">Clubs Recommandés pour Vous</h3>
        <div className="space-y-4">
          {clubSuggestions.map(club => (
            <Card key={club.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h4>{club.name}</h4>
                      <Badge variant="outline" className={getMatchColor(club.matchScore)}>
                        <TrendingUp className="size-3 mr-1" />
                        {club.matchScore}% Match
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{club.description}</p>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                      <span className="flex items-center gap-1">
                        <Users className="size-4" />
                        {club.members} membres
                      </span>
                      <Badge variant="outline">{club.category}</Badge>
                    </div>

                    <Card className="p-3 bg-blue-50 border-blue-200 mb-3">
                      <p className="text-sm text-blue-800">
                        💡 {club.reason}
                      </p>
                    </Card>

                    <div className="flex items-start gap-2 text-sm mb-3">
                      <Calendar className="size-4 text-gray-500 mt-0.5" />
                      <div>
                        <p>Prochaine réunion : {club.nextMeeting}</p>
                        <p className="text-gray-500 flex items-center gap-1">
                          <MapPin className="size-3" />
                          {club.location}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {club.tags.map((tag, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button className="flex-1">Rejoindre le club</Button>
                  <Button variant="outline">En savoir plus</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Upcoming Events */}
      <div>
        <h3 className="mb-4">Événements à venir</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {upcomingEvents.map(event => (
            <Card key={event.id} className="p-5 hover:shadow-md transition-shadow">
              <div className="space-y-3">
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="text-base">{event.title}</h4>
                    <Badge variant="outline">{event.type}</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{event.description}</p>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="size-4" />
                    {event.date}
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Users className="size-4" />
                    {event.participants} participants inscrits
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {event.tags.map((tag, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>

                <Button className="w-full" size="sm">
                  S'inscrire
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <Card className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="mb-1">Restez actif et connecté ! 🎯</h4>
            <p className="text-sm text-gray-700">
              Rejoindre des clubs et participer à des événements enrichit votre 
              expérience universitaire et votre réseau professionnel.
            </p>
          </div>
          <Button variant="outline">Voir tous les clubs</Button>
        </div>
      </Card>
    </div>
  );
}
