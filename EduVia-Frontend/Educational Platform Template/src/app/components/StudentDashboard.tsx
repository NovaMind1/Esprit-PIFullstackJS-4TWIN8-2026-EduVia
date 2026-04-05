import { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Badge } from '@/app/components/ui/badge';
import { Progress } from '@/app/components/ui/progress';
import { 
  LogOut, 
  Brain, 
  BookOpen, 
  Star, 
  MessageCircle, 
  Users, 
  Calendar,
  TrendingUp,
  Bell
} from 'lucide-react';
import AIAssessment from '@/app/components/student/AIAssessment';
import CourseQuiz from '@/app/components/student/CourseQuiz';
import RecommendationSystem from '@/app/components/student/RecommendationSystem';
import RatingSystem from '@/app/components/student/RatingSystem';
import Chatbot from '@/app/components/student/Chatbot';
import ClubSuggestions from '@/app/components/student/ClubSuggestions';
import StudentForum from '@/app/components/student/StudentForum';
import logo from 'figma:asset/105d773541d2379690851733893a5b3b8a0d0625.png';

interface StudentDashboardProps {
  onLogout: () => void;
}

export default function StudentDashboard({ onLogout }: StudentDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [showChatbot, setShowChatbot] = useState(false);

  // Mock student data
  const studentData = {
    name: 'Marie Dubois',
    level: 'Licence 2 Informatique',
    overallProgress: 75,
    currentCourses: [
      { id: 1, name: 'Structures de données', progress: 60, status: 'en cours' },
      { id: 2, name: 'Algorithmique avancée', progress: 85, status: 'en cours' },
      { id: 3, name: 'Bases de données', progress: 45, status: 'à risque' }
    ],
    notifications: [
      { id: 1, text: 'Courage ! Tu as bien progressé en algorithmique.', type: 'motivation' },
      { id: 2, text: 'Examen de BD dans 5 jours - Révise les chapitres 3 et 4', type: 'exam' }
    ]
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Eduvia" className="h-12" />
            <div>
              <h1 className="text-2xl">Eduvia - Espace Étudiant</h1>
              <p className="text-sm text-gray-600">{studentData.name} - {studentData.level}</p>
            </div>
          </div>
          <div className="flex gap-3 items-center">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowChatbot(!showChatbot)}
              className="border-red-500 text-red-600 hover:bg-red-50"
            >
              <MessageCircle className="size-4 mr-2" />
              Assistant IA
            </Button>
            <Button variant="ghost" size="sm" onClick={onLogout}>
              <LogOut className="size-4 mr-2" />
              Déconnexion
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        {/* Notifications */}
        {studentData.notifications.length > 0 && (
          <div className="mb-6 space-y-2">
            {studentData.notifications.map(notif => (
              <Card key={notif.id} className="p-4 bg-red-50 border-red-200">
                <div className="flex items-start gap-3">
                  <Bell className="size-5 text-blue-600 mt-0.5" />
                  <p className="flex-1 text-sm">{notif.text}</p>
                  {notif.type === 'motivation' && (
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      Encouragement
                    </Badge>
                  )}
                  {notif.type === 'exam' && (
                    <Badge variant="outline" className="bg-orange-50 text-orange-700">
                      Examen
                    </Badge>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-7 w-full">
            <TabsTrigger value="overview">
              <TrendingUp className="size-4 mr-2" />
              Vue d'ensemble
            </TabsTrigger>
            <TabsTrigger value="assessment">
              <Brain className="size-4 mr-2" />
              Évaluation IA
            </TabsTrigger>
            <TabsTrigger value="courses">
              <BookOpen className="size-4 mr-2" />
              Mes Cours
            </TabsTrigger>
            <TabsTrigger value="recommendations">
              <Star className="size-4 mr-2" />
              Recommandations
            </TabsTrigger>
            <TabsTrigger value="rating">
              <Star className="size-4 mr-2" />
              Notation
            </TabsTrigger>
            <TabsTrigger value="clubs">
              <Calendar className="size-4 mr-2" />
              Clubs
            </TabsTrigger>
            <TabsTrigger value="forum">
              <Users className="size-4 mr-2" />
              Entraide
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card className="p-6">
              <h3 className="mb-4">Progression Globale</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progression totale</span>
                  <span>{studentData.overallProgress}%</span>
                </div>
                <Progress value={studentData.overallProgress} />
              </div>
            </Card>

            <div>
              <h3 className="mb-4">Mes Cours en Cours</h3>
              <div className="grid md:grid-cols-3 gap-4">
                {studentData.currentCourses.map(course => (
                  <Card key={course.id} className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="text-sm">{course.name}</h4>
                      {course.status === 'à risque' ? (
                        <Badge variant="destructive">À risque</Badge>
                      ) : (
                        <Badge variant="outline">En cours</Badge>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Progress value={course.progress} />
                      <p className="text-xs text-gray-600">{course.progress}% complété</p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* AI Assessment Tab */}
          <TabsContent value="assessment">
            <AIAssessment />
          </TabsContent>

          {/* Courses Tab with Quiz */}
          <TabsContent value="courses">
            <CourseQuiz />
          </TabsContent>

          {/* Recommendations Tab */}
          <TabsContent value="recommendations">
            <RecommendationSystem />
          </TabsContent>

          {/* Rating Tab */}
          <TabsContent value="rating">
            <RatingSystem />
          </TabsContent>

          {/* Clubs Tab */}
          <TabsContent value="clubs">
            <ClubSuggestions />
          </TabsContent>

          {/* Forum Tab */}
          <TabsContent value="forum">
            <StudentForum />
          </TabsContent>
        </Tabs>
      </div>

      {/* Chatbot Overlay */}
      {showChatbot && (
        <div className="fixed bottom-4 right-4 w-96 z-50">
          <Chatbot onClose={() => setShowChatbot(false)} />
        </div>
      )}
    </div>
  );
}