import { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import { GraduationCap, Users, Shield } from 'lucide-react';
import StudentDashboard from '@/app/components/StudentDashboard';
import TeacherDashboard from '@/app/components/TeacherDashboard';
import AdminDashboard from '@/app/components/AdminDashboard';
import logo from 'figma:asset/105d773541d2379690851733893a5b3b8a0d0625.png';

type UserRole = 'student' | 'teacher' | 'admin' | null;

function App() {
  const [userRole, setUserRole] = useState<UserRole>(null);

  const handleRoleSelect = (role: UserRole) => {
    setUserRole(role);
  };

  const handleLogout = () => {
    setUserRole(null);
  };

  if (userRole === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
        <Card className="max-w-4xl w-full p-8">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <img src={logo} alt="Eduvia Logo" className="h-32" />
            </div>
            <h1 className="text-4xl mb-3">Eduvia</h1>
            <p className="text-gray-600">
              Sélectionnez votre profil pour accéder au système
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <Card 
              className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-red-500"
              onClick={() => handleRoleSelect('student')}
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <GraduationCap className="size-8 text-red-600" />
                </div>
                <h3 className="mb-2">Étudiant</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Évaluation IA, quiz adaptatifs, recommandations personnalisées, chatbot pédagogique
                </p>
                <Button className="w-full bg-red-600 hover:bg-red-700">Accéder</Button>
              </div>
            </Card>

            <Card 
              className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-green-500"
              onClick={() => handleRoleSelect('teacher')}
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <Users className="size-8 text-green-600" />
                </div>
                <h3 className="mb-2">Enseignant</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Suivi des étudiants, gestion des contenus, envoi de rappels personnalisés
                </p>
                <Button className="w-full">Accéder</Button>
              </div>
            </Card>

            <Card 
              className="p-6 hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-purple-500"
              onClick={() => handleRoleSelect('admin')}
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                  <Shield className="size-8 text-purple-600" />
                </div>
                <h3 className="mb-2">Administrateur</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Gestion des utilisateurs, supervision globale, statistiques de la plateforme
                </p>
                <Button className="w-full">Accéder</Button>
              </div>
            </Card>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {userRole === 'student' && <StudentDashboard onLogout={handleLogout} />}
      {userRole === 'teacher' && <TeacherDashboard onLogout={handleLogout} />}
      {userRole === 'admin' && <AdminDashboard onLogout={handleLogout} />}
    </div>
  );
}

export default App;