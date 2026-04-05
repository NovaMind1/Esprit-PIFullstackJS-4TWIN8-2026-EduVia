import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Sparkles, Video, BookOpen, FileQuestion, Puzzle } from 'lucide-react';

export default function RecommendationSystem() {
  // Mock data basée sur les résultats des quiz
  const recommendations = [
    {
      id: 1,
      topic: "Complexité algorithmique",
      reason: "Détecté comme non maîtrisé dans le quiz",
      items: [
        {
          type: "course",
          title: "Introduction à la complexité algorithmique",
          description: "Cours simplifié expliquant O(n), O(log n) avec des exemples concrets",
          duration: "45 min",
          level: "Débutant"
        },
        {
          type: "video",
          title: "Visualiser la complexité - Animation interactive",
          description: "Vidéo animée montrant comment différents algorithmes se comportent",
          duration: "15 min",
          level: "Intermédiaire"
        },
        {
          type: "quiz",
          title: "Quiz ciblé : Big O Notation",
          description: "Exercices progressifs pour maîtriser la notation Big O",
          duration: "20 min",
          level: "Débutant"
        }
      ]
    },
    {
      id: 2,
      topic: "Arbres binaires de recherche",
      reason: "Question incorrecte sur la structure d'arbre",
      items: [
        {
          type: "course",
          title: "Arbres binaires expliqués simplement",
          description: "Comprendre les arbres binaires avec des schémas visuels",
          duration: "30 min",
          level: "Intermédiaire"
        },
        {
          type: "puzzle",
          title: "Construis ton arbre binaire",
          description: "Exercice interactif : construire un arbre en glissant-déposant",
          duration: "25 min",
          level: "Débutant"
        },
        {
          type: "video",
          title: "Parcours d'arbres en action",
          description: "Visualisation des parcours préfixe, infixe et postfixe",
          duration: "12 min",
          level: "Intermédiaire"
        }
      ]
    },
    {
      id: 3,
      topic: "Gestion de la mémoire et pointeurs",
      reason: "Réponse imprécise lors de l'évaluation initiale",
      items: [
        {
          type: "course",
          title: "Les pointeurs en C - Guide pratique",
          description: "Comprendre les pointeurs avec des exemples simples",
          duration: "50 min",
          level: "Intermédiaire"
        },
        {
          type: "puzzle",
          title: "Jeu des pointeurs",
          description: "Mini-jeu interactif pour comprendre l'adressage mémoire",
          duration: "30 min",
          level: "Débutant"
        }
      ]
    }
  ];

  const getIcon = (type: string) => {
    switch (type) {
      case 'course':
        return <BookOpen className="size-5 text-blue-600" />;
      case 'video':
        return <Video className="size-5 text-red-600" />;
      case 'quiz':
        return <FileQuestion className="size-5 text-green-600" />;
      case 'puzzle':
        return <Puzzle className="size-5 text-purple-600" />;
      default:
        return <BookOpen className="size-5" />;
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      course: 'Cours',
      video: 'Vidéo',
      quiz: 'Quiz',
      puzzle: 'Exercice interactif'
    };
    return labels[type] || type;
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Débutant':
        return 'bg-green-50 text-green-700';
      case 'Intermédiaire':
        return 'bg-blue-50 text-blue-700';
      case 'Avancé':
        return 'bg-purple-50 text-purple-700';
      default:
        return 'bg-gray-50 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-r from-red-50 to-orange-50 border-red-200">
        <div className="flex items-start gap-3">
          <Sparkles className="size-6 text-red-600 mt-1" />
          <div>
            <h2 className="text-xl mb-2">Recommandations Intelligentes</h2>
            <p className="text-gray-700">
              L'IA Eduvia a analysé vos résultats et vous propose des contenus personnalisés 
              ciblés sur vos axes d'amélioration. Ces recommandations sont adaptées à votre 
              niveau et à votre style d'apprentissage.
            </p>
          </div>
        </div>
      </Card>

      {recommendations.map(recommendation => (
        <Card key={recommendation.id} className="p-6">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl">{recommendation.topic}</h3>
              <Badge variant="outline" className="bg-orange-50 text-orange-700">
                À améliorer
              </Badge>
            </div>
            <p className="text-sm text-gray-600">
              📊 {recommendation.reason}
            </p>
          </div>

          <div className="space-y-3">
            {recommendation.items.map((item, idx) => (
              <Card key={idx} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 mt-1">
                    {getIcon(item.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <h4 className="mb-1">{item.title}</h4>
                        <p className="text-sm text-gray-600">{item.description}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline">{getTypeLabel(item.type)}</Badge>
                      <Badge variant="outline" className={getLevelColor(item.level)}>
                        {item.level}
                      </Badge>
                      <span className="text-xs text-gray-500">⏱️ {item.duration}</span>
                    </div>
                  </div>

                  <Button size="sm" className="flex-shrink-0">
                    Commencer
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </Card>
      ))}

      <Card className="p-6 bg-green-50 border-green-200">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="mb-1">Vous progressez bien ! 🎉</h4>
            <p className="text-sm text-gray-700">
              En complétant ces recommandations, vous comblerez 85% de vos lacunes actuelles
            </p>
          </div>
          <Button variant="outline">Voir mon parcours</Button>
        </div>
      </Card>
    </div>
  );
}