import { useState } from 'react';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Textarea } from '@/app/components/ui/textarea';
import { Star, Sparkles, Video, BookOpen, FileQuestion, Puzzle } from 'lucide-react';

export default function RatingSystem() {
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [showRecommendations, setShowRecommendations] = useState(false);

  const courses = [
    { id: 1, name: 'Structures de données', currentlyStudying: true },
    { id: 2, name: 'Algorithmique avancée', currentlyStudying: false },
    { id: 3, name: 'Bases de données', currentlyStudying: true }
  ];

  const handleSubmitRating = () => {
    if (rating > 0 && rating <= 2) {
      setShowRecommendations(true);
    } else {
      // Reset for next course
      setSelectedCourse(null);
      setRating(0);
      setComment('');
    }
  };

  const aiRecommendations = [
    {
      type: 'course',
      icon: <BookOpen className="size-5 text-blue-600" />,
      title: 'Cours simplifié : Structures de données pour débutants',
      description: 'Une version plus accessible avec des explications pas à pas et des analogies du quotidien',
      badge: 'Cours alternatif'
    },
    {
      type: 'video',
      icon: <Video className="size-5 text-red-600" />,
      title: 'Vidéo explicative animée : Les structures de données',
      description: 'Animation visuelle de 20 minutes expliquant les concepts de manière ludique',
      badge: 'Vidéo'
    },
    {
      type: 'quiz',
      icon: <FileQuestion className="size-5 text-green-600" />,
      title: 'Quiz rapide : Vérifiez votre compréhension',
      description: 'Quiz interactif de 10 questions pour identifier précisément vos difficultés',
      badge: 'Quiz adaptatif'
    },
    {
      type: 'puzzle',
      icon: <Puzzle className="size-5 text-purple-600" />,
      title: 'Puzzle interactif : Construire une liste chaînée',
      description: 'Apprenez en pratiquant avec un exercice interactif de glisser-déposer',
      badge: 'Exercice pratique'
    }
  ];

  if (showRecommendations) {
    return (
      <Card className="p-8 max-w-3xl mx-auto">
        <div className="space-y-6">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <Sparkles className="size-8 text-blue-600" />
              </div>
            </div>
            <h2 className="text-2xl mb-2">Merci pour votre retour !</h2>
            <p className="text-gray-600">
              Nous comprenons que le cours est difficile. Voici des alternatives personnalisées pour vous aider :
            </p>
          </div>

          <Card className="p-4 bg-orange-50 border-orange-200">
            <div className="flex items-start gap-3">
              <Star className="size-5 text-orange-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm">
                  <span>Votre évaluation : </span>
                  <span className="text-orange-600">{rating}/5 étoiles</span>
                </p>
                {comment && (
                  <p className="text-sm mt-2 italic">"{comment}"</p>
                )}
              </div>
            </div>
          </Card>

          <div>
            <h3 className="mb-4 flex items-center gap-2">
              <Sparkles className="size-5 text-blue-600" />
              Recommandations de l'IA
            </h3>
            <div className="space-y-3">
              {aiRecommendations.map((rec, idx) => (
                <Card key={idx} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 mt-1">
                      {rec.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <h4 className="mb-1">{rec.title}</h4>
                          <p className="text-sm text-gray-600">{rec.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline">{rec.badge}</Badge>
                        <Button size="sm">Commencer</Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <div className="flex justify-center pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowRecommendations(false);
                setSelectedCourse(null);
                setRating(0);
                setComment('');
              }}
            >
              Retour aux cours
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  if (selectedCourse !== null) {
    const course = courses.find(c => c.id === selectedCourse);
    
    return (
      <Card className="p-8 max-w-2xl mx-auto">
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl mb-2">Évaluez votre expérience</h2>
            <p className="text-gray-600">
              Cours : {course?.name}
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block mb-3">
                Comment trouvez-vous ce cours ?
              </label>
              <div className="flex gap-2 justify-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`size-12 ${
                        star <= (hoveredRating || rating)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="text-center mt-2 text-sm text-gray-600">
                  {rating === 1 && "Très difficile"}
                  {rating === 2 && "Difficile à comprendre"}
                  {rating === 3 && "Correct"}
                  {rating === 4 && "Bien"}
                  {rating === 5 && "Excellent"}
                </p>
              )}
            </div>

            <div>
              <label className="block mb-2">
                Commentaire (optionnel)
              </label>
              <Textarea
                placeholder="Partagez votre expérience avec ce cours..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
              />
            </div>

            {rating > 0 && rating <= 2 && (
              <Card className="p-4 bg-blue-50 border-blue-200">
                <p className="text-sm text-blue-800">
                  💡 Nous détectons des difficultés. L'IA vous proposera des contenus alternatifs 
                  mieux adaptés à votre niveau après validation.
                </p>
              </Card>
            )}
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setSelectedCourse(null);
                setRating(0);
                setComment('');
              }}
            >
              Annuler
            </Button>
            <Button
              onClick={handleSubmitRating}
              disabled={rating === 0}
            >
              Valider mon évaluation
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-start gap-3">
          <Star className="size-6 text-yellow-500 mt-1" />
          <div>
            <h2 className="text-xl mb-2">Système de Notation et Satisfaction</h2>
            <p className="text-gray-600">
              Pendant l'étude d'un cours, donnez une note de satisfaction. 
              Si le cours est trop difficile, l'IA vous proposera automatiquement 
              des alternatives adaptées à votre niveau.
            </p>
          </div>
        </div>
      </Card>

      <div>
        <h3 className="mb-4">Cours en cours d'étude</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {courses
            .filter(c => c.currentlyStudying)
            .map(course => (
              <Card key={course.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="space-y-4">
                  <div>
                    <h4 className="mb-2">{course.name}</h4>
                    <Badge variant="outline">En cours</Badge>
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => setSelectedCourse(course.id)}
                  >
                    <Star className="size-4 mr-2" />
                    Évaluer ce cours
                  </Button>
                </div>
              </Card>
            ))}
        </div>
      </div>

      <Card className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <Sparkles className="size-6 text-green-600" />
          </div>
          <div>
            <h4 className="mb-1">Votre avis compte !</h4>
            <p className="text-sm text-gray-700">
              Grâce à vos évaluations, l'IA améliore continuellement les recommandations 
              et vous propose les meilleurs contenus adaptés à votre profil.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
