import { useState } from 'react';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/app/components/ui/radio-group';
import { Label } from '@/app/components/ui/label';
import { Progress } from '@/app/components/ui/progress';
import { Badge } from '@/app/components/ui/badge';
import { Brain, CheckCircle, AlertCircle } from 'lucide-react';

export default function AIAssessment() {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isCompleted, setIsCompleted] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState('');

  const questions = [
    {
      id: 0,
      question: "Quel est votre niveau en programmation ?",
      type: "multiple",
      options: [
        "Débutant - Je commence tout juste",
        "Intermédiaire - Je connais les bases",
        "Avancé - Je maîtrise plusieurs langages"
      ]
    },
    {
      id: 1,
      question: "Quelle est la complexité temporelle d'une recherche binaire ?",
      type: "multiple",
      options: [
        "O(n)",
        "O(log n)",
        "O(n²)",
        "O(1)"
      ]
    },
    {
      id: 2,
      question: "Comment préférez-vous apprendre ?",
      type: "multiple",
      options: [
        "Par la pratique avec des exercices",
        "En regardant des vidéos",
        "En lisant des cours théoriques",
        "En travaillant sur des projets réels"
      ]
    },
    {
      id: 3,
      question: "Expliquez brièvement ce qu'est un pointeur en C",
      type: "open",
      placeholder: "Votre réponse..."
    }
  ];

  const handleNext = () => {
    if (selectedAnswer) {
      setAnswers({ ...answers, [currentQuestion]: selectedAnswer });
      setSelectedAnswer('');
      
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
      } else {
        setIsCompleted(true);
      }
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setSelectedAnswer(answers[currentQuestion - 1] || '');
    }
  };

  const progress = ((currentQuestion + 1) / questions.length) * 100;

  if (isCompleted) {
    return (
      <Card className="p-8">
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="size-10 text-green-600" />
            </div>
          </div>
          
          <div>
            <h2 className="text-2xl mb-2">Évaluation Terminée !</h2>
            <p className="text-gray-600">
              L'IA Eduvia a analysé vos réponses et évalué votre profil
            </p>
          </div>

          <Card className="p-6 bg-red-50 border-red-200 text-left">
            <h3 className="mb-4 flex items-center gap-2">
              <Brain className="size-5 text-red-600" />
              Résultats de l'Évaluation
            </h3>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span>Niveau Global</span>
                  <Badge>Intermédiaire</Badge>
                </div>
                <p className="text-sm text-gray-700">
                  Vous avez une bonne compréhension des concepts de base en informatique.
                </p>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm mb-3 flex items-center gap-2">
                  <AlertCircle className="size-4 text-orange-500" />
                  Axes d'amélioration détectés
                </h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500">•</span>
                    <span>Complexité algorithmique - Notion à approfondir</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-orange-500">•</span>
                    <span>Gestion de la mémoire et pointeurs</span>
                  </li>
                </ul>
              </div>

              <div className="border-t pt-4">
                <h4 className="text-sm mb-2">Style d'apprentissage préféré</h4>
                <Badge variant="outline">Apprentissage pratique</Badge>
              </div>
            </div>
          </Card>

          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg">
            <p className="text-sm">
              💡 Le système adaptera automatiquement les contenus proposés selon votre profil
            </p>
          </div>

          <Button onClick={() => {
            setCurrentQuestion(0);
            setAnswers({});
            setIsCompleted(false);
          }}>
            Refaire l'évaluation
          </Button>
        </div>
      </Card>
    );
  }

  const currentQ = questions[currentQuestion];

  return (
    <Card className="p-8 max-w-3xl mx-auto">
      <div className="space-y-6">
        <div>
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-2xl flex items-center gap-2">
              <Brain className="size-6 text-red-600" />
              Évaluation Intelligente du Niveau
            </h2>
            <Badge variant="outline">
              Question {currentQuestion + 1}/{questions.length}
            </Badge>
          </div>
          <p className="text-gray-600">
            L'IA Eduvia analyse vos réponses pour personnaliser votre parcours d'apprentissage
          </p>
        </div>

        <div className="space-y-2">
          <Progress value={progress} />
          <p className="text-xs text-gray-500 text-right">{Math.round(progress)}% complété</p>
        </div>

        <Card className="p-6 bg-gray-50">
          <h3 className="mb-4">{currentQ.question}</h3>
          
          {currentQ.type === 'multiple' && (
            <RadioGroup value={selectedAnswer} onValueChange={setSelectedAnswer}>
              <div className="space-y-3">
                {currentQ.options?.map((option, idx) => (
                  <div key={idx} className="flex items-center space-x-2">
                    <RadioGroupItem value={option} id={`option-${idx}`} />
                    <Label htmlFor={`option-${idx}`} className="flex-1 cursor-pointer">
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          )}

          {currentQ.type === 'open' && (
            <textarea
              className="w-full min-h-32 p-3 border rounded-md"
              placeholder={currentQ.placeholder}
              value={selectedAnswer}
              onChange={(e) => setSelectedAnswer(e.target.value)}
            />
          )}
        </Card>

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
          >
            Précédent
          </Button>
          <Button
            onClick={handleNext}
            disabled={!selectedAnswer}
          >
            {currentQuestion === questions.length - 1 ? 'Terminer' : 'Suivant'}
          </Button>
        </div>
      </div>
    </Card>
  );
}