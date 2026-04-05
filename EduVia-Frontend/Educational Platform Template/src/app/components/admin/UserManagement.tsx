import { useState } from 'react';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Input } from '@/app/components/ui/input';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { 
  Users, 
  Search,
  Plus,
  Edit,
  Trash2,
  Shield,
  GraduationCap,
  UserCog
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'teacher' | 'student';
  status: 'active' | 'inactive';
  registrationDate: string;
  lastActivity: string;
}

export default function UserManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('all');
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [users, setUsers] = useState<User[]>([
    {
      id: 1,
      name: 'Prof. Jean Dupont',
      email: 'jean.dupont@university.fr',
      role: 'teacher',
      status: 'active',
      registrationDate: '15 Sep 2025',
      lastActivity: 'Il y a 2 heures'
    },
    {
      id: 2,
      name: 'Marie Dubois',
      email: 'marie.dubois@student.fr',
      role: 'student',
      status: 'active',
      registrationDate: '20 Sep 2025',
      lastActivity: 'Il y a 3 heures'
    },
    {
      id: 3,
      name: 'Thomas Martin',
      email: 'thomas.martin@student.fr',
      role: 'student',
      status: 'active',
      registrationDate: '22 Sep 2025',
      lastActivity: 'Il y a 5 jours'
    },
    {
      id: 4,
      name: 'Admin Système',
      email: 'admin@university.fr',
      role: 'admin',
      status: 'active',
      registrationDate: '01 Sep 2025',
      lastActivity: 'Il y a 10 min'
    },
    {
      id: 5,
      name: 'Prof. Sophie Leroux',
      email: 'sophie.leroux@university.fr',
      role: 'teacher',
      status: 'active',
      registrationDate: '18 Sep 2025',
      lastActivity: 'Il y a 1 heure'
    },
    {
      id: 6,
      name: 'Lucas Bernard',
      email: 'lucas.bernard@student.fr',
      role: 'student',
      status: 'inactive',
      registrationDate: '25 Sep 2025',
      lastActivity: 'Il y a 2 semaines'
    }
  ]);

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="size-4 text-purple-600" />;
      case 'teacher':
        return <UserCog className="size-4 text-green-600" />;
      case 'student':
        return <GraduationCap className="size-4 text-blue-600" />;
      default:
        return <Users className="size-4" />;
    }
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin: 'Administrateur',
      teacher: 'Enseignant',
      student: 'Étudiant'
    };
    return labels[role] || role;
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'teacher':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'student':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const handleDeleteUser = (id: number) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      setUsers(users.filter(u => u.id !== id));
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  const userCounts = {
    all: users.length,
    admin: users.filter(u => u.role === 'admin').length,
    teacher: users.filter(u => u.role === 'teacher').length,
    student: users.filter(u => u.role === 'student').length
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
        <div className="flex items-start gap-3">
          <Users className="size-6 text-blue-600 mt-1" />
          <div className="flex-1">
            <h2 className="text-xl mb-2">Gestion des Utilisateurs</h2>
            <p className="text-gray-700">
              Gérez les rôles des utilisateurs : Administrateurs, Enseignants et Étudiants. 
              Ajoutez, modifiez ou supprimez des comptes utilisateurs.
            </p>
          </div>
          <Button onClick={() => setShowAddUserDialog(true)}>
            <Plus className="size-4 mr-2" />
            Nouvel utilisateur
          </Button>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="size-5 text-gray-600" />
            <p className="text-sm text-gray-600">Total</p>
          </div>
          <p className="text-2xl">{userCounts.all}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="size-5 text-purple-600" />
            <p className="text-sm text-gray-600">Administrateurs</p>
          </div>
          <p className="text-2xl">{userCounts.admin}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <UserCog className="size-5 text-green-600" />
            <p className="text-sm text-gray-600">Enseignants</p>
          </div>
          <p className="text-2xl">{userCounts.teacher}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <GraduationCap className="size-5 text-blue-600" />
            <p className="text-sm text-gray-600">Étudiants</p>
          </div>
          <p className="text-2xl">{userCounts.student}</p>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-gray-400" />
            <Input
              placeholder="Rechercher par nom ou email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={selectedRole} onValueChange={setSelectedRole}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Tous les rôles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les rôles</SelectItem>
            <SelectItem value="admin">Administrateurs</SelectItem>
            <SelectItem value="teacher">Enseignants</SelectItem>
            <SelectItem value="student">Étudiants</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Users List */}
      <div className="space-y-3">
        {filteredUsers.map(user => (
          <Card key={user.id} className="p-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-1">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                  {getRoleIcon(user.role)}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h4>{user.name}</h4>
                    <Badge className={getRoleColor(user.role)}>
                      {getRoleLabel(user.role)}
                    </Badge>
                    {user.status === 'inactive' && (
                      <Badge variant="outline" className="bg-gray-100">
                        Inactif
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{user.email}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>Inscrit le {user.registrationDate}</span>
                    <span>•</span>
                    <span>Dernière activité : {user.lastActivity}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button size="sm" variant="outline">
                  <Edit className="size-4 mr-2" />
                  Modifier
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => handleDeleteUser(user.id)}
                >
                  <Trash2 className="size-4 mr-2" />
                  Supprimer
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-gray-500">Aucun utilisateur trouvé</p>
        </Card>
      )}

      {/* Add User Dialog */}
      <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Ajouter un nouvel utilisateur</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm mb-2">Nom complet</label>
              <Input placeholder="Ex: Jean Dupont" />
            </div>

            <div>
              <label className="block text-sm mb-2">Email</label>
              <Input type="email" placeholder="jean.dupont@university.fr" />
            </div>

            <div>
              <label className="block text-sm mb-2">Rôle</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un rôle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">
                    <span className="flex items-center gap-2">
                      <GraduationCap className="size-4" />
                      Étudiant
                    </span>
                  </SelectItem>
                  <SelectItem value="teacher">
                    <span className="flex items-center gap-2">
                      <UserCog className="size-4" />
                      Enseignant
                    </span>
                  </SelectItem>
                  <SelectItem value="admin">
                    <span className="flex items-center gap-2">
                      <Shield className="size-4" />
                      Administrateur
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm mb-2">Mot de passe temporaire</label>
              <Input type="password" placeholder="Minimum 8 caractères" />
              <p className="text-xs text-gray-500 mt-1">
                L'utilisateur devra changer ce mot de passe à sa première connexion
              </p>
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => setShowAddUserDialog(false)}
              >
                Annuler
              </Button>
              <Button onClick={() => {
                alert('Utilisateur créé avec succès !');
                setShowAddUserDialog(false);
              }}>
                Créer l'utilisateur
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
