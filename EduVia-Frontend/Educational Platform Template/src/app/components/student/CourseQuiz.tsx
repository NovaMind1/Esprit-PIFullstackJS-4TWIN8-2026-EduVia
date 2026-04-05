import { useState } from 'react';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Progress } from '@/app/components/ui/progress';
import { CheckCircle, XCircle, BookOpen, AlertTriangle } from 'lucide-react';

export default function CourseQuiz() {
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);

  const courses = [
    {
      id: 1,
      name: 'Structures de données',
      completed: true,
      progress: 100
    },
    {
      id: 2,
      name: 'Algorithmique avancée',
      completed: true,
      progress: 100
    },
    {
      id: 3,
      name: 'Bases de données',
      completed: false,
      progress: 65
    }
  ];

  const quizQuestions = [
    {
      question: "Quelle structure de données utilise le principe LIFO (Last In, First Out) ?",
      options: ["File (Queue)", "Pile (Stack)", "Liste chaînée", "Arbre binaire"],
      correctAnswer: 1
    },
    {
      question: "Quelle est la complexité d'insertion dans une table de hachage en moyenne ?",
      options: ["O(n)", "O(1)", "O(log n)", "O(n²)"],
      correctAnswer: 1
    },
    {
      question: "Quel algorithme de tri a une complexité temporelle de O(n log n) dans le meilleur cas ?",
      options: ["Tri à bulles", "Tri par insertion", "Tri fusion (Merge Sort)", "Tri par sélection"],
      correctAnswer: 2
    },
    {
      question: "Dans un arbre binaire de recherche, où se trouve la valeur minimale ?",
      options: ["À la racine", "Au nœud le plus à droite", "Au nœud le plus à gauche", "Au milieu"],
      correctAnswer: 2
    },
    {
      question: "Quelle est la différence principale entre une liste chaînée et un tableau ?",
      options: [
        "Les listes chaînées sont plus rapides",
        "Les tableaux ont une taille fixe, les listes chaînées sont dynamiques",
        "Les tableaux ne peuvent contenir que des nombres",
        "Il n'y a pas de différence"
      ],
      correctAnswer: 1
    }
  ];

  const handleStartQuiz = (courseId: number) => {
    setSelectedCourse(courseId);
    setQuizStarted(true);
    setCurrentQuestion(0);
    setUserAnswers([]);
    setShowResults(false);
  };

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
  };

  const handleNextQuestion = () => {
    if (selectedAnswer !== null) {
      setUserAnswers([...userAnswers, selectedAnswer]);
      setSelectedAnswer(null);
      
      if (currentQuestion < quizQuestions.length - 1) {
        setCurrentQuestion(currentQuestion + 1);
      } else {
        setShowResults(true);
      }
    }
  };

  const calculateScore = () => {
    let correct = 0;
    userAnswers.forEach((answer, index) => {
      if (answer === quizQuestions[index].correctAnswer) {
        correct++;
      }
    });
    return (correct / quizQuestions.length) * 100;
  };

  const getWeakTopics = () => {
    const weak = [];
    userAnswers.forEach((answer, index) => {
      if (answer !== quizQuestions[index].correctAnswer) {
        weak.push(quizQuestions[index].question);
      }
    });
    return weak;
  };

  if (showResults) {
    const score = calculateScore();
    const weakTopics = getWeakTopics();
    
    return (
      <Card className="p-8 max-w-3xl mx-auto">
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center ${
              score >= 70 ? 'bg-green-100' : 'bg-orange-100'
            }`}>
              {score >= 70 ? (
                <CheckCircle className="size-10 text-green-600" />
              ) : (
                <AlertTriangle className="size-10 text-orange-600" />
              )}
            </div>
          </div>

          <div>
            <h2 className="text-2xl mb-2">Quiz Terminé !</h2>
            <p className="text-gray-600">Voici vos résultats</p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 text-center">
            <Card className="p-4">
              <p className="text-sm text-gray-600 mb-1">Score</p>
              <p className="text-3xl">{Math.round(score)}%</p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-gray-600 mb-1">Bonnes réponses</p>
              <p className="text-3xl text-green-600">
                {userAnswers.filter((a, i) => a === quizQuestions[i].correctAnswer).length}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-gray-600 mb-1">Mauvaises réponses</p>
              <p className="text-3xl text-red-600">{weakTopics.length}</p>
            </Card>
          </div>

          {weakTopics.length > 0 && (
            <Card className="p-6 bg-orange-50 border-orange-200 text-left">
              <h3 className="mb-3 flex items-center gap-2">
                <AlertTriangle className="size-5 text-orange-600" />
                Notions à revoir
              </h3>
              <p className="text-sm text-gray-700 mb-3">
                L'IA a détecté des lacunes sur les points suivants :
              </p>
              <ul className="space-y-2">
                {weakTopics.slice(0, 3).map((topic, idx) => (
                  <li key={idx} className="text-sm flex items-start gap-2">
                    <span className="text-orange-500">•</span>
                    <span className="flex-1">{topic}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg">
            <p className="text-sm">
              💡 Des recommandations personnalisées vous seront proposées dans l'onglet "Recommandations"
            </p>
          </div>

          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => {
              setQuizStarted(false);
              setShowResults(false);
              setSelectedCourse(null);
            }}>
              Retour aux cours
            </Button>
            <Button onClick={() => {
              setShowResults(false);
              setCurrentQuestion(0);
              setUserAnswers([]);
              setSelectedAnswer(null);
            }}>
              Refaire le quiz
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  if (quizStarted) {
    const question = quizQuestions[currentQuestion];
    const progress = ((currentQuestion + 1) / quizQuestions.length) * 100;

    return (
      <Card className="p-8 max-w-3xl mx-auto">
        <div className="space-y-6">
          <div>
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-2xl">Test des Acquis</h2>
              <Badge variant="outline">
                Question {currentQuestion + 1}/{quizQuestions.length}
              </Badge>
            </div>
            <p className="text-gray-600">
              Cours : {courses.find(c => c.id === selectedCourse)?.name}
            </p>
          </div>

          <div className="space-y-2">
            <Progress value={progress} />
            <p className="text-xs text-gray-500 text-right">{Math.round(progress)}% complété</p>
          </div>

          <Card className="p-6 bg-gray-50">
            <h3 className="mb-4">{question.question}</h3>
            <div className="space-y-3">
              {question.options.map((option, idx) => (
                <div
                  key={idx}
                  onClick={() => handleAnswerSelect(idx)}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedAnswer === idx
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedAnswer === idx ? 'border-blue-500' : 'border-gray-300'
                    }`}>
                      {selectedAnswer === idx && (
                        <div className="w-3 h-3 rounded-full bg-blue-500" />
                      )}
                    </div>
                    <span>{option}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
              disabled={currentQuestion === 0}
            >
              Précédent
            </Button>
            <Button
              onClick={handleNextQuestion}
              disabled={selectedAnswer === null}
            >
              {currentQuestion === quizQuestions.length - 1 ? 'Terminer' : 'Suivant'}
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
          <BookOpen className="size-6 text-blue-600 mt-1" />
          <div>
            <h2 className="text-xl mb-2">Tests des Acquis</h2>
            <p className="text-gray-600">
              Après avoir suivi un cours, validez vos acquis avec un quiz intelligent généré automatiquement.
              L'IA analysera vos réponses pour détecter les notions non maîtrisées.
            </p>
          </div>
        </div>
      </Card>

      <div>
        <h3 className="mb-4">Sélectionnez un cours terminé</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {courses.map(course => (
            <Card 
              key={course.id} 
              className={`p-6 ${!course.completed ? 'opacity-60' : 'cursor-pointer hover:shadow-lg transition-shadow'}`}
            >
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="mb-1">{course.name}</h4>
                    <div className="flex items-center gap-2">
                      {course.completed ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          <CheckCircle className="size-3 mr-1" />
                          Complété
                        </Badge>
                      ) : (
                        <Badge variant="outline">En cours</Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Progress value={course.progress} />
                  <p className="text-xs text-gray-600">{course.progress}% du cours suivi</p>
                </div>

                <Button
                  className="w-full"
                  disabled={!course.completed}
                  onClick={() => handleStartQuiz(course.id)}
                >
                  {course.completed ? 'Passer le test' : 'Terminez le cours d\'abord'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
