import { useState } from 'react';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Progress } from '@/app/components/ui/progress';
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
  TrendingDown, 
  TrendingUp, 
  AlertTriangle,
  Search,
  Eye,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';

interface Student {
  id: number;
  name: string;
  level: string;
  overallProgress: number;
  status: 'excellent' | 'good' | 'at-risk' | 'critical';
  courses: {
    name: string;
    progress: number;
    lastQuizScore: number;
    weakTopics: string[];
  }[];
  learningStyle: string;
  lastActivity: string;
}

export default function StudentTracking() {
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);

  const students: Student[] = [
    {
      id: 1,
      name: "Marie Dubois",
      level: "L2 Informatique",
      overallProgress: 75,
      status: 'good',
      courses: [
        {
          name: "Structures de données",
          progress: 60,
          lastQuizScore: 60,
          weakTopics: ["Complexité algorithmique", "Arbres binaires"]
        },
        {
          name: "Algorithmique avancée",
          progress: 85,
          lastQuizScore: 90,
          weakTopics: []
        }
      ],
      learningStyle: "Apprentissage pratique",
      lastActivity: "Il y a 2 heures"
    },
    {
      id: 2,
      name: "Thomas Martin",
      level: "L1 Informatique",
      overallProgress: 45,
      status: 'at-risk',
      courses: [
        {
          name: "Structures de données",
          progress: 35,
          lastQuizScore: 45,
          weakTopics: ["Listes chaînées", "Piles et files", "Complexité"]
        }
      ],
      learningStyle: "Apprentissage visuel",
      lastActivity: "Il y a 5 jours"
    },
    {
      id: 3,
      name: "Sophie Leroux",
      level: "L2 Informatique",
      overallProgress: 92,
      status: 'excellent',
      courses: [
        {
          name: "Structures de données",
          progress: 95,
          lastQuizScore: 95,
          weakTopics: []
        },
        {
          name: "Algorithmique avancée",
          progress: 90,
          lastQuizScore: 92,
          weakTopics: []
        }
      ],
      learningStyle: "Apprentissage théorique",
      lastActivity: "Il y a 30 min"
    },
    {
      id: 4,
      name: "Lucas Bernard",
      level: "L1 Informatique",
      overallProgress: 28,
      status: 'critical',
      courses: [
        {
          name: "Structures de données",
          progress: 25,
          lastQuizScore: 30,
          weakTopics: ["Tous les concepts de base"]
        }
      ],
      learningStyle: "Apprentissage pratique",
      lastActivity: "Il y a 1 semaine"
    },
    {
      id: 5,
      name: "Emma Dubois",
      level: "L2 Informatique",
      overallProgress: 82,
      status: 'good',
      courses: [
        {
          name: "Bases de données",
          progress: 80,
          lastQuizScore: 85,
          weakTopics: ["Normalisation"]
        }
      ],
      learningStyle: "Apprentissage par projets",
      lastActivity: "Il y a 1 heure"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'good':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'at-risk':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'critical':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent':
        return <TrendingUp className="size-4 text-green-600" />;
      case 'good':
        return <CheckCircle className="size-4 text-blue-600" />;
      case 'at-risk':
        return <AlertTriangle className="size-4 text-orange-600" />;
      case 'critical':
        return <XCircle className="size-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'Excellent';
      case 'good':
        return 'Bon niveau';
      case 'at-risk':
        return 'À surveiller';
      case 'critical':
        return 'Critique';
      default:
        return status;
    }
  };

  const handleViewDetails = (student: Student) => {
    setSelectedStudent(student);
    setShowDetailDialog(true);
  };

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.level.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const atRiskStudents = students.filter(s => s.status === 'at-risk' || s.status === 'critical');

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <div className="flex items-start gap-3">
          <Users className="size-6 text-blue-600 mt-1" />
          <div>
            <h2 className="text-xl mb-2">Suivi des Étudiants</h2>
            <p className="text-gray-700">
              Consultez le niveau, les progrès et les difficultés de vos étudiants. 
              Identifiez rapidement les étudiants à risque nécessitant un accompagnement supplémentaire.
            </p>
          </div>
        </div>
      </Card>

      {/* Alert for at-risk students */}
      {atRiskStudents.length > 0 && (
        <Card className="p-4 bg-orange-50 border-orange-200">
          <div className="flex items-center gap-3">
            <AlertTriangle className="size-5 text-orange-600" />
            <div>
              <p className="text-sm">
                <span className="text-orange-900">{atRiskStudents.length} étudiant(s)</span> nécessitent 
                votre attention immédiate.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-gray-400" />
            <Input
              placeholder="Rechercher un étudiant..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={selectedCourse} onValueChange={setSelectedCourse}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Tous les cours" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les cours</SelectItem>
            <SelectItem value="structures">Structures de données</SelectItem>
            <SelectItem value="algo">Algorithmique avancée</SelectItem>
            <SelectItem value="bd">Bases de données</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Students List */}
      <div className="space-y-3">
        {filteredStudents.map(student => (
          <Card key={student.id} className="p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="size-6 text-blue-600" />
                  </div>
                  <div>
                    <h4>{student.name}</h4>
                    <p className="text-sm text-gray-600">{student.level}</p>
                  </div>
                  <Badge className={getStatusColor(student.status)}>
                    <span className="flex items-center gap-1">
                      {getStatusIcon(student.status)}
                      {getStatusLabel(student.status)}
                    </span>
                  </Badge>
                </div>

                <div className="grid md:grid-cols-3 gap-4 mb-3">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Progression globale</p>
                    <Progress value={student.overallProgress} />
                    <p className="text-xs text-gray-500 mt-1">{student.overallProgress}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Style d'apprentissage</p>
                    <Badge variant="outline">{student.learningStyle}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Dernière activité</p>
                    <p className="text-sm">{student.lastActivity}</p>
                  </div>
                </div>

                {student.courses.some(c => c.weakTopics.length > 0) && (
                  <Card className="p-3 bg-orange-50 border-orange-200">
                    <p className="text-sm text-orange-800 mb-2">
                      <AlertTriangle className="size-4 inline mr-1" />
                      Difficultés détectées
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {student.courses.flatMap(c => c.weakTopics).slice(0, 3).map((topic, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  </Card>
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleViewDetails(student)}
              >
                <Eye className="size-4 mr-2" />
                Détails
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Student Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Détails de l'étudiant</DialogTitle>
          </DialogHeader>
          {selectedStudent && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="size-8 text-blue-600" />
                </div>
                <div>
                  <h3>{selectedStudent.name}</h3>
                  <p className="text-gray-600">{selectedStudent.level}</p>
                  <Badge className={getStatusColor(selectedStudent.status)}>
                    {getStatusLabel(selectedStudent.status)}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Card className="p-4">
                  <p className="text-sm text-gray-600 mb-1">Progression globale</p>
                  <p className="text-2xl">{selectedStudent.overallProgress}%</p>
                </Card>
                <Card className="p-4">
                  <p className="text-sm text-gray-600 mb-1">Style d'apprentissage</p>
                  <p className="text-lg">{selectedStudent.learningStyle}</p>
                </Card>
              </div>

              <div>
                <h4 className="mb-3">Cours et Performances</h4>
                <div className="space-y-3">
                  {selectedStudent.courses.map((course, idx) => (
                    <Card key={idx} className="p-4">
                      <h5 className="mb-3">{course.name}</h5>
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Progression</p>
                          <Progress value={course.progress} />
                          <p className="text-xs text-gray-500 mt-1">{course.progress}%</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">Dernier quiz</p>
                          <p className="text-2xl">{course.lastQuizScore}%</p>
                        </div>
                      </div>
                      {course.weakTopics.length > 0 && (
                        <div>
                          <p className="text-sm text-gray-600 mb-2">Notions non maîtrisées :</p>
                          <div className="flex flex-wrap gap-2">
                            {course.weakTopics.map((topic, topicIdx) => (
                              <Badge key={topicIdx} variant="outline" className="bg-orange-50 text-orange-700">
                                {topic}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <Button className="flex-1">Envoyer un message</Button>
                <Button variant="outline" className="flex-1">Envoyer un rappel</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
