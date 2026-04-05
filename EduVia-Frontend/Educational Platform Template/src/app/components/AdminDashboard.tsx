import { useState } from 'react';
import { Button } from '@/app/components/ui/button';
import { Card } from '@/app/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { LogOut, Users, BarChart, Shield } from 'lucide-react';
import UserManagement from '@/app/components/admin/UserManagement';
import PlatformStatistics from '@/app/components/admin/PlatformStatistics';
import logo from 'figma:asset/105d773541d2379690851733893a5b3b8a0d0625.png';

interface AdminDashboardProps {
  onLogout: () => void;
}

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');

  // Mock admin data
  const adminData = {
    name: 'Administrateur Système',
    stats: {
      totalUsers: 487,
      students: 420,
      teachers: 65,
      admins: 2,
      activeToday: 234,
      avgEngagement: 78,
      avgSatisfaction: 4.3
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
              <h1 className="text-2xl">Eduvia - Panneau d'Administration</h1>
              <p className="text-sm text-gray-600">{adminData.name}</p>
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
          <TabsList className="grid grid-cols-3 w-full max-w-xl">
            <TabsTrigger value="overview">
              <BarChart className="size-4 mr-2" />
              Vue d'ensemble
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className="size-4 mr-2" />
              Utilisateurs
            </TabsTrigger>
            <TabsTrigger value="statistics">
              <Shield className="size-4 mr-2" />
              Statistiques
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card className="p-6 bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
              <h2 className="text-xl mb-4">Tableau de bord principal</h2>
              <p className="text-gray-700">
                Bienvenue dans le panneau d'administration. Gérez les utilisateurs, 
                consultez les statistiques globales et supervisez la plateforme.
              </p>
            </Card>

            <div className="grid md:grid-cols-4 gap-4">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <Users className="size-8 text-blue-600" />
                </div>
                <p className="text-3xl mb-1">{adminData.stats.totalUsers}</p>
                <p className="text-sm text-gray-600">Utilisateurs totaux</p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <Users className="size-8 text-green-600" />
                </div>
                <p className="text-3xl mb-1">{adminData.stats.students}</p>
                <p className="text-sm text-gray-600">Étudiants</p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <Users className="size-8 text-purple-600" />
                </div>
                <p className="text-3xl mb-1">{adminData.stats.teachers}</p>
                <p className="text-sm text-gray-600">Enseignants</p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <Shield className="size-8 text-orange-600" />
                </div>
                <p className="text-3xl mb-1">{adminData.stats.admins}</p>
                <p className="text-sm text-gray-600">Administrateurs</p>
              </Card>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-3xl">👥</span>
                </div>
                <p className="text-3xl mb-1">{adminData.stats.activeToday}</p>
                <p className="text-sm text-gray-600">Actifs aujourd'hui</p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-3xl">📊</span>
                </div>
                <p className="text-3xl mb-1">{adminData.stats.avgEngagement}%</p>
                <p className="text-sm text-gray-600">Taux d'engagement moyen</p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-3xl">⭐</span>
                </div>
                <p className="text-3xl mb-1">{adminData.stats.avgSatisfaction}/5</p>
                <p className="text-sm text-gray-600">Satisfaction moyenne</p>
              </Card>
            </div>

            <Card className="p-6">
              <h3 className="mb-4">Activité récente</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm">45 nouveaux étudiants inscrits</p>
                    <p className="text-xs text-gray-500">Il y a 2 heures</p>
                  </div>
                  <span className="text-green-600">+45</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm">3 nouveaux cours publiés</p>
                    <p className="text-xs text-gray-500">Il y a 5 heures</p>
                  </div>
                  <span className="text-blue-600">+3</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm">128 quiz complétés</p>
                    <p className="text-xs text-gray-500">Aujourd'hui</p>
                  </div>
                  <span className="text-purple-600">128</span>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* User Management Tab */}
          <TabsContent value="users">
            <UserManagement />
          </TabsContent>

          {/* Statistics Tab */}
          <TabsContent value="statistics">
            <PlatformStatistics />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}