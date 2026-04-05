import { useState } from 'react';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { 
  BookOpen, 
  Video, 
  FileQuestion, 
  Plus,
  Edit,
  Trash2,
  Upload
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';

interface Content {
  id: number;
  type: 'course' | 'video' | 'quiz' | 'exercise';
  title: string;
  description: string;
  course: string;
  chapter: string;
  status: 'published' | 'draft';
  views: number;
  satisfaction: number;
  lastUpdated: string;
}

export default function ContentManagement() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('course');
  const [contents, setContents] = useState<Content[]>([
    {
      id: 1,
      type: 'course',
      title: 'Introduction aux listes chaînées',
      description: 'Cours complet sur les listes chaînées avec exemples',
      course: 'Structures de données',
      chapter: 'Chapitre 3',
      status: 'published',
      views: 145,
      satisfaction: 4.2,
      lastUpdated: '20 Jan 2026'
    },
    {
      id: 2,
      type: 'video',
      title: 'Visualisation des algorithmes de tri',
      description: 'Vidéo animée montrant bubble sort, quick sort, merge sort',
      course: 'Algorithmique avancée',
      chapter: 'Chapitre 5',
      status: 'published',
      views: 230,
      satisfaction: 4.7,
      lastUpdated: '18 Jan 2026'
    },
    {
      id: 3,
      type: 'quiz',
      title: 'Quiz : Arbres binaires de recherche',
      description: 'Quiz de 10 questions sur les ABR',
      course: 'Structures de données',
      chapter: 'Chapitre 6',
      status: 'published',
      views: 98,
      satisfaction: 4.0,
      lastUpdated: '15 Jan 2026'
    },
    {
      id: 4,
      type: 'course',
      title: 'Complexité algorithmique avancée',
      description: 'Analyse amortie et complexité dans le pire cas',
      course: 'Algorithmique avancée',
      chapter: 'Chapitre 2',
      status: 'draft',
      views: 0,
      satisfaction: 0,
      lastUpdated: '01 Fev 2026'
    },
    {
      id: 5,
      type: 'exercise',
      title: 'Exercices pratiques : Piles et Files',
      description: 'Serie d\'exercices avec correction automatique',
      course: 'Structures de données',
      chapter: 'Chapitre 4',
      status: 'published',
      views: 176,
      satisfaction: 4.5,
      lastUpdated: '25 Jan 2026'
    }
  ]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'course':
        return <BookOpen className="size-5 text-blue-600" />;
      case 'video':
        return <Video className="size-5 text-red-600" />;
      case 'quiz':
        return <FileQuestion className="size-5 text-green-600" />;
      case 'exercise':
        return <FileQuestion className="size-5 text-purple-600" />;
      default:
        return <BookOpen className="size-5" />;
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      course: 'Cours',
      video: 'Vidéo',
      quiz: 'Quiz',
      exercise: 'Exercice'
    };
    return labels[type] || type;
  };

  const handleDeleteContent = (id: number) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce contenu ?')) {
      setContents(contents.filter(c => c.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <div className="flex items-start gap-3">
          <BookOpen className="size-6 text-green-600 mt-1" />
          <div className="flex-1">
            <h2 className="text-xl mb-2">Gestion des Contenus Pédagogiques</h2>
            <p className="text-gray-700">
              Ajoutez, modifiez ou supprimez des cours, vidéos, quiz et exercices. 
              Consultez les statistiques de consultation et de satisfaction.
            </p>
          </div>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="size-4 mr-2" />
            Nouveau contenu
          </Button>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="size-5 text-blue-600" />
            <p className="text-sm text-gray-600">Cours</p>
          </div>
          <p className="text-2xl">{contents.filter(c => c.type === 'course').length}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Video className="size-5 text-red-600" />
            <p className="text-sm text-gray-600">Vidéos</p>
          </div>
          <p className="text-2xl">{contents.filter(c => c.type === 'video').length}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileQuestion className="size-5 text-green-600" />
            <p className="text-sm text-gray-600">Quiz</p>
          </div>
          <p className="text-2xl">{contents.filter(c => c.type === 'quiz').length}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <FileQuestion className="size-5 text-purple-600" />
            <p className="text-sm text-gray-600">Exercices</p>
          </div>
          <p className="text-2xl">{contents.filter(c => c.type === 'exercise').length}</p>
        </Card>
      </div>

      {/* Contents List */}
      <div>
        <h3 className="mb-4">Tous les contenus</h3>
        <div className="space-y-3">
          {contents.map(content => (
            <Card key={content.id} className="p-5">
              <div className="flex gap-4">
                <div className="flex-shrink-0 mt-1">
                  {getTypeIcon(content.type)}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4>{content.title}</h4>
                        {content.status === 'draft' && (
                          <Badge variant="outline" className="bg-gray-100">
                            Brouillon
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{content.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                    <Badge variant="outline">{getTypeLabel(content.type)}</Badge>
                    <span>{content.course}</span>
                    <span>•</span>
                    <span>{content.chapter}</span>
                    <span>•</span>
                    <span>Mis à jour le {content.lastUpdated}</span>
                  </div>

                  {content.status === 'published' && (
                    <div className="flex items-center gap-6 text-sm">
                      <div>
                        <span className="text-gray-600">Vues : </span>
                        <span>{content.views}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Satisfaction : </span>
                        <span className="text-yellow-600">⭐ {content.satisfaction}/5</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <Button size="sm" variant="outline">
                    <Edit className="size-4 mr-2" />
                    Modifier
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleDeleteContent(content.id)}
                  >
                    <Trash2 className="size-4 mr-2" />
                    Supprimer
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Add Content Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ajouter un nouveau contenu</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm mb-2">Type de contenu</label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="course">
                    <span className="flex items-center gap-2">
                      <BookOpen className="size-4" />
                      Cours
                    </span>
                  </SelectItem>
                  <SelectItem value="video">
                    <span className="flex items-center gap-2">
                      <Video className="size-4" />
                      Vidéo
                    </span>
                  </SelectItem>
                  <SelectItem value="quiz">
                    <span className="flex items-center gap-2">
                      <FileQuestion className="size-4" />
                      Quiz
                    </span>
                  </SelectItem>
                  <SelectItem value="exercise">
                    <span className="flex items-center gap-2">
                      <FileQuestion className="size-4" />
                      Exercice
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-2">Cours</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un cours" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="structures">Structures de données</SelectItem>
                    <SelectItem value="algo">Algorithmique avancée</SelectItem>
                    <SelectItem value="bd">Bases de données</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm mb-2">Chapitre</label>
                <Input placeholder="Ex: Chapitre 3" />
              </div>
            </div>

            <div>
              <label className="block text-sm mb-2">Titre</label>
              <Input placeholder="Titre du contenu" />
            </div>

            <div>
              <label className="block text-sm mb-2">Description</label>
              <Textarea placeholder="Description détaillée du contenu" rows={4} />
            </div>

            {(selectedType === 'video' || selectedType === 'course') && (
              <Card className="p-4 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm mb-1">Fichier</p>
                    <p className="text-xs text-gray-600">
                      {selectedType === 'video' ? 'Format : MP4, MOV (max 500MB)' : 'Format : PDF, DOCX (max 50MB)'}
                    </p>
                  </div>
                  <Button size="sm" variant="outline">
                    <Upload className="size-4 mr-2" />
                    Télécharger
                  </Button>
                </div>
              </Card>
            )}

            <div className="flex gap-3 justify-end pt-4">
              <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                Annuler
              </Button>
              <Button onClick={() => {
                alert('Contenu ajouté avec succès !');
                setShowAddDialog(false);
              }}>
                Enregistrer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
