import { Card } from '@/app/components/ui/card';
import { Badge } from '@/app/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { BarChart, TrendingUp, Users, BookOpen, Star, Activity } from 'lucide-react';
import { LineChart, Line, BarChart as RechartsBarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function PlatformStatistics() {
  // Mock data for charts
  const engagementData = [
    { name: 'Lun', etudiants: 340, enseignants: 45 },
    { name: 'Mar', etudiants: 385, enseignants: 52 },
    { name: 'Mer', etudiants: 410, enseignants: 48 },
    { name: 'Jeu', etudiants: 395, enseignants: 50 },
    { name: 'Ven', etudiants: 420, enseignants: 55 },
    { name: 'Sam', etudiants: 180, enseignants: 12 },
    { name: 'Dim', etudiants: 120, enseignants: 8 }
  ];

  const progressData = [
    { level: '0-25%', count: 45 },
    { level: '25-50%', count: 78 },
    { level: '50-75%', count: 156 },
    { level: '75-100%', count: 141 }
  ];

  const coursePopularity = [
    { name: 'Structures de données', students: 145, satisfaction: 4.2 },
    { name: 'Algorithmique', students: 132, satisfaction: 4.5 },
    { name: 'Bases de données', students: 168, satisfaction: 4.1 },
    { name: 'Programmation C', students: 198, satisfaction: 4.3 },
    { name: 'Réseaux', students: 87, satisfaction: 4.0 }
  ];

  const satisfactionDistribution = [
    { name: '5 étoiles', value: 245, color: '#22c55e' },
    { name: '4 étoiles', value: 156, color: '#84cc16' },
    { name: '3 étoiles', value: 67, color: '#eab308' },
    { name: '2 étoiles', value: 23, color: '#f97316' },
    { name: '1 étoile', value: 9, color: '#ef4444' }
  ];

  const monthlyGrowth = [
    { month: 'Sep', users: 320 },
    { month: 'Oct', users: 385 },
    { month: 'Nov', users: 412 },
    { month: 'Dec', users: 445 },
    { month: 'Jan', users: 487 }
  ];

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <BarChart className="size-6 text-indigo-600 mt-1" />
            <div>
              <h2 className="text-xl mb-2">Supervision Globale de la Plateforme</h2>
              <p className="text-gray-700">
                Consultez les statistiques générales : taux d'engagement, progression moyenne 
                et satisfaction des étudiants.
              </p>
            </div>
          </div>
          <Select defaultValue="week">
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Cette semaine</SelectItem>
              <SelectItem value="month">Ce mois</SelectItem>
              <SelectItem value="year">Cette année</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Key Metrics */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-3">
            <Activity className="size-8 text-blue-600" />
            <Badge variant="outline" className="bg-green-50 text-green-700">
              +12%
            </Badge>
          </div>
          <p className="text-3xl mb-1">78%</p>
          <p className="text-sm text-gray-600">Taux d'engagement</p>
          <p className="text-xs text-gray-500 mt-2">Moyenne de la semaine</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-3">
            <TrendingUp className="size-8 text-green-600" />
            <Badge variant="outline" className="bg-green-50 text-green-700">
              +8%
            </Badge>
          </div>
          <p className="text-3xl mb-1">73%</p>
          <p className="text-sm text-gray-600">Progression moyenne</p>
          <p className="text-xs text-gray-500 mt-2">Tous les étudiants</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-3">
            <Star className="size-8 text-yellow-500" />
            <Badge variant="outline" className="bg-green-50 text-green-700">
              +0.2
            </Badge>
          </div>
          <p className="text-3xl mb-1">4.3/5</p>
          <p className="text-sm text-gray-600">Satisfaction moyenne</p>
          <p className="text-xs text-gray-500 mt-2">500 évaluations</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-3">
            <Users className="size-8 text-purple-600" />
            <Badge variant="outline" className="bg-green-50 text-green-700">
              +45
            </Badge>
          </div>
          <p className="text-3xl mb-1">487</p>
          <p className="text-sm text-gray-600">Utilisateurs actifs</p>
          <p className="text-xs text-gray-500 mt-2">Ce mois</p>
        </Card>
      </div>

      {/* Engagement Chart */}
      <Card className="p-6">
        <h3 className="mb-4">Engagement Quotidien</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={engagementData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="etudiants" stroke="#3b82f6" strokeWidth={2} name="Étudiants" />
            <Line type="monotone" dataKey="enseignants" stroke="#10b981" strokeWidth={2} name="Enseignants" />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Progress Distribution */}
        <Card className="p-6">
          <h3 className="mb-4">Distribution de la Progression</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsBarChart data={progressData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="level" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" name="Étudiants" />
            </RechartsBarChart>
          </ResponsiveContainer>
        </Card>

        {/* Satisfaction Distribution */}
        <Card className="p-6">
          <h3 className="mb-4">Distribution de la Satisfaction</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={satisfactionDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${entry.value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {satisfactionDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Course Popularity */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3>Popularité des Cours</h3>
          <Badge variant="outline">
            <BookOpen className="size-3 mr-1" />
            Top 5
          </Badge>
        </div>
        <div className="space-y-4">
          {coursePopularity.map((course, idx) => (
            <div key={idx} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm">{course.name}</span>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-gray-600">{course.students} étudiants</span>
                      <span className="text-yellow-600">⭐ {course.satisfaction}</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${(course.students / 200) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Monthly Growth */}
      <Card className="p-6">
        <h3 className="mb-4">Croissance Mensuelle des Utilisateurs</h3>
        <ResponsiveContainer width="100%" height={300}>
          <RechartsBarChart data={monthlyGrowth}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="users" fill="#8b5cf6" name="Utilisateurs totaux" />
          </RechartsBarChart>
        </ResponsiveContainer>
      </Card>

      {/* System Health */}
      <Card className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="mb-2 flex items-center gap-2">
              <Activity className="size-5 text-green-600" />
              État du Système
            </h3>
            <p className="text-sm text-gray-700 mb-4">
              Tous les services fonctionnent normalement
            </p>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-gray-600">Serveurs</p>
                <Badge variant="outline" className="bg-green-100 text-green-700">
                  Opérationnel
                </Badge>
              </div>
              <div>
                <p className="text-xs text-gray-600">Base de données</p>
                <Badge variant="outline" className="bg-green-100 text-green-700">
                  Opérationnel
                </Badge>
              </div>
              <div>
                <p className="text-xs text-gray-600">IA Assistant</p>
                <Badge variant="outline" className="bg-green-100 text-green-700">
                  Opérationnel
                </Badge>
              </div>
              <div>
                <p className="text-xs text-gray-600">Stockage</p>
                <Badge variant="outline" className="bg-green-100 text-green-700">
                  Opérationnel
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
