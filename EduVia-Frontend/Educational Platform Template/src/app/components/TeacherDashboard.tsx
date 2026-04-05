import { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { LogOut, Users, BookOpen, Bell, BarChart } from 'lucide-react';
import StudentTracking from '@/app/components/teacher/StudentTracking';
import ContentManagement from '@/app/components/teacher/ContentManagement';
import ExamReminders from '@/app/components/teacher/ExamReminders';
import logo from 'figma:asset/105d773541d2379690851733893a5b3b8a0d0625.png';

interface TeacherDashboardProps {
  onLogout: () => void;
}

export default function TeacherDashboard({ onLogout }: TeacherDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');

  // Mock teacher data
  const teacherData = {
    name: 'Prof. Jean Dupont',
    courses: [
      { id: 1, name: 'Structures de données', students: 45 },
      { id: 2, name: 'Algorithmique avancée', students: 38 },
      { id: 3, name: 'Bases de données', students: 52 }
    ],
    stats: {
      totalStudents: 135,
      atRiskStudents: 12,
      averageProgress: 73,
      satisfactionRate: 4.2
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Eduvia" className="h-12" />
            <div>
              <h1 className="text-2xl">Eduvia - Espace Enseignant</h1>
              <p className="text-sm text-gray-600">{teacherData.name}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onLogout}>
            <LogOut className="size-4 mr-2" />
            Déconnexion
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full max-w-2xl">
            <TabsTrigger value="overview">
              <BarChart className="size-4 mr-2" />
              Vue d'ensemble
            </TabsTrigger>
            <TabsTrigger value="tracking">
              <Users className="size-4 mr-2" />
              Suivi Étudiants
            </TabsTrigger>
            <TabsTrigger value="content">
              <BookOpen className="size-4 mr-2" />
              Contenus
            </TabsTrigger>
            <TabsTrigger value="reminders">
              <Bell className="size-4 mr-2" />
              Rappels
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-4 gap-4">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <Users className="size-8 text-blue-600" />
                </div>
                <p className="text-3xl mb-1">{teacherData.stats.totalStudents}</p>
                <p className="text-sm text-gray-600">Étudiants au total</p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <Users className="size-8 text-orange-600" />
                </div>
                <p className="text-3xl mb-1">{teacherData.stats.atRiskStudents}</p>
                <p className="text-sm text-gray-600">Étudiants à risque</p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <BarChart className="size-8 text-green-600" />
                </div>
                <p className="text-3xl mb-1">{teacherData.stats.averageProgress}%</p>
                <p className="text-sm text-gray-600">Progression moyenne</p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-3xl">⭐</span>
                </div>
                <p className="text-3xl mb-1">{teacherData.stats.satisfactionRate}/5</p>
                <p className="text-sm text-gray-600">Satisfaction moyenne</p>
              </Card>
            </div>

            <Card className="p-6">
              <h3 className="mb-4">Mes Cours</h3>
              <div className="space-y-3">
                {teacherData.courses.map(course => (
                  <Card key={course.id} className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4>{course.name}</h4>
                        <p className="text-sm text-gray-600">{course.students} étudiants inscrits</p>
                      </div>
                      <Button size="sm" variant="outline">Voir détails</Button>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          </TabsContent>

          {/* Student Tracking Tab */}
          <TabsContent value="tracking">
            <StudentTracking />
          </TabsContent>

          {/* Content Management Tab */}
          <TabsContent value="content">
            <ContentManagement />
          </TabsContent>

          {/* Exam Reminders Tab */}
          <TabsContent value="reminders">
            <ExamReminders />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}