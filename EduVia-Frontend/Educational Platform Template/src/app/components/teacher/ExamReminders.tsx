import { useState } from 'react';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Label } from '@/app/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';
import { 
  Bell, 
  Send, 
  Calendar,
  Users,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';

interface Exam {
  id: number;
  course: string;
  date: string;
  time: string;
  location: string;
  chapters: string[];
  studentsCount: number;
  remindersSent: number;
}

interface Student {
  id: number;
  name: string;
  progress: number;
  missingChapters: string[];
}

export default function ExamReminders() {
  const [showReminderDialog, setShowReminderDialog] = useState(false);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [reminderMessage, setReminderMessage] = useState('');

  const upcomingExams: Exam[] = [
    {
      id: 1,
      course: 'Structures de données',
      date: '10 Février 2026',
      time: '14h00 - 16h00',
      location: 'Amphithéâtre A',
      chapters: ['Chapitre 1', 'Chapitre 2', 'Chapitre 3', 'Chapitre 4'],
      studentsCount: 45,
      remindersSent: 0
    },
    {
      id: 2,
      course: 'Algorithmique avancée',
      date: '15 Février 2026',
      time: '10h00 - 12h00',
      location: 'Salle B203',
      chapters: ['Chapitre 1', 'Chapitre 2', 'Chapitre 3', 'Chapitre 4', 'Chapitre 5'],
      studentsCount: 38,
      remindersSent: 1
    },
    {
      id: 3,
      course: 'Bases de données',
      date: '20 Février 2026',
      time: '14h00 - 16h30',
      location: 'Amphithéâtre B',
      chapters: ['Chapitre 1', 'Chapitre 2', 'Chapitre 3'],
      studentsCount: 52,
      remindersSent: 0
    }
  ];

  const studentsAtRisk: Student[] = [
    {
      id: 1,
      name: 'Thomas Martin',
      progress: 45,
      missingChapters: ['Chapitre 3', 'Chapitre 4']
    },
    {
      id: 2,
      name: 'Lucas Bernard',
      progress: 28,
      missingChapters: ['Chapitre 2', 'Chapitre 3', 'Chapitre 4']
    },
    {
      id: 4,
      name: 'Julie Petit',
      progress: 55,
      missingChapters: ['Chapitre 4']
    },
    {
      id: 5,
      name: 'Marc Rousseau',
      progress: 40,
      missingChapters: ['Chapitre 3', 'Chapitre 4']
    }
  ];

  const handleSendReminder = (exam: Exam) => {
    setSelectedExam(exam);
    // Pre-fill message
    setReminderMessage(
      `Rappel : Examen de ${exam.course} le ${exam.date}\n\n` +
      `L'examen portera sur les chapitres suivants :\n${exam.chapters.join(', ')}\n\n` +
      `Certains d'entre vous n'ont pas encore complété tous les chapitres. ` +
      `Merci de les terminer pour améliorer vos chances de réussite.\n\n` +
      `Bon courage dans vos révisions !`
    );
    setShowReminderDialog(true);
  };

  const handleStudentToggle = (studentId: number) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSelectAll = () => {
    if (selectedStudents.length === studentsAtRisk.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(studentsAtRisk.map(s => s.id));
    }
  };

  const handleSendReminderConfirm = () => {
    alert(`Rappel envoyé à ${selectedStudents.length} étudiant(s) !`);
    setShowReminderDialog(false);
    setSelectedStudents([]);
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200">
        <div className="flex items-start gap-3">
          <Bell className="size-6 text-orange-600 mt-1" />
          <div>
            <h2 className="text-xl mb-2">Envoi de Rappels avant les Examens</h2>
            <p className="text-gray-700">
              Envoyez des rappels ciblés aux étudiants avant les examens. 
              Le système identifie automatiquement les étudiants n'ayant pas complété certains chapitres.
            </p>
          </div>
        </div>
      </Card>

      {/* Upcoming Exams */}
      <div>
        <h3 className="mb-4">Examens à venir</h3>
        <div className="space-y-3">
          {upcomingExams.map(exam => (
            <Card key={exam.id} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <Calendar className="size-5 text-blue-600" />
                    <div>
                      <h4>{exam.course}</h4>
                      <p className="text-sm text-gray-600">{exam.date} • {exam.time}</p>
                    </div>
                    {exam.remindersSent > 0 && (
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        <CheckCircle className="size-3 mr-1" />
                        {exam.remindersSent} rappel(s) envoyé(s)
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <span>📍 Lieu :</span>
                      <span>{exam.location}</span>
                    </div>
                    <div className="flex items-start gap-2 text-gray-600">
                      <span>📚 Chapitres :</span>
                      <div className="flex flex-wrap gap-1">
                        {exam.chapters.map((chapter, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {chapter}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Users className="size-4" />
                      <span>{exam.studentsCount} étudiants inscrits</span>
                    </div>
                  </div>

                  {/* Students at risk for this exam */}
                  {exam.id === 1 && studentsAtRisk.length > 0 && (
                    <Card className="p-3 bg-orange-50 border-orange-200 mt-3">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="size-4 text-orange-600" />
                        <p className="text-sm text-orange-800">
                          {studentsAtRisk.length} étudiant(s) n'ont pas terminé tous les chapitres
                        </p>
                      </div>
                    </Card>
                  )}
                </div>

                <Button onClick={() => handleSendReminder(exam)}>
                  <Send className="size-4 mr-2" />
                  Envoyer un rappel
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Reminder History */}
      <Card className="p-6">
        <h3 className="mb-4">Historique des rappels</h3>
        <div className="space-y-3">
          <Card className="p-4 bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm mb-1">Rappel envoyé - Algorithmique avancée</p>
                <p className="text-xs text-gray-600">28 Janvier 2026 • 38 étudiants</p>
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700">
                <CheckCircle className="size-3 mr-1" />
                Envoyé
              </Badge>
            </div>
          </Card>
          <Card className="p-4 bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm mb-1">Rappel envoyé - Structures de données</p>
                <p className="text-xs text-gray-600">15 Janvier 2026 • 12 étudiants à risque</p>
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700">
                <CheckCircle className="size-3 mr-1" />
                Envoyé
              </Badge>
            </div>
          </Card>
        </div>
      </Card>

      {/* Send Reminder Dialog */}
      <Dialog open={showReminderDialog} onOpenChange={setShowReminderDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Envoyer un rappel d'examen</DialogTitle>
          </DialogHeader>
          {selectedExam && (
            <div className="space-y-6">
              <Card className="p-4 bg-blue-50 border-blue-200">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="size-4 text-blue-600" />
                    <span><strong>{selectedExam.course}</strong> - {selectedExam.date}</span>
                  </div>
                  <p className="text-gray-700">
                    {selectedExam.studentsCount} étudiants inscrits
                  </p>
                </div>
              </Card>

              {/* Students at risk */}
              {studentsAtRisk.length > 0 && selectedExam.id === 1 && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="flex items-center gap-2">
                      <AlertTriangle className="size-5 text-orange-600" />
                      Étudiants n'ayant pas complété tous les chapitres
                    </h4>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleSelectAll}
                    >
                      {selectedStudents.length === studentsAtRisk.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                    </Button>
                  </div>
                  <Card className="p-4">
                    <div className="space-y-3">
                      {studentsAtRisk.map(student => (
                        <div key={student.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50">
                          <Checkbox
                            id={`student-${student.id}`}
                            checked={selectedStudents.includes(student.id)}
                            onCheckedChange={() => handleStudentToggle(student.id)}
                          />
                          <Label 
                            htmlFor={`student-${student.id}`}
                            className="flex-1 cursor-pointer"
                          >
                            <div>
                              <p className="text-sm mb-1">{student.name}</p>
                              <div className="flex items-center gap-2 text-xs text-gray-600">
                                <span>Progression : {student.progress}%</span>
                                <span>•</span>
                                <span>Manquants : {student.missingChapters.join(', ')}</span>
                              </div>
                            </div>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </Card>
                  <p className="text-sm text-gray-600 mt-2">
                    {selectedStudents.length} étudiant(s) sélectionné(s)
                  </p>
                </div>
              )}

              {/* Send to all option */}
              <div className="flex items-center gap-2">
                <Checkbox
                  id="send-all"
                  checked={selectedStudents.length === 0}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedStudents([]);
                    }
                  }}
                />
                <Label htmlFor="send-all" className="cursor-pointer">
                  Envoyer à tous les étudiants ({selectedExam.studentsCount})
                </Label>
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm mb-2">Message du rappel</label>
                <Textarea
                  value={reminderMessage}
                  onChange={(e) => setReminderMessage(e.target.value)}
                  rows={10}
                  placeholder="Écrivez votre message..."
                />
                <p className="text-xs text-gray-500 mt-2">
                  💡 Vous pouvez personnaliser ce message selon vos besoins
                </p>
              </div>

              {/* Preview */}
              <Card className="p-4 bg-gray-50">
                <p className="text-sm text-gray-600 mb-2">Aperçu du message :</p>
                <div className="whitespace-pre-wrap text-sm">{reminderMessage}</div>
              </Card>

              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowReminderDialog(false);
                    setSelectedStudents([]);
                  }}
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleSendReminderConfirm}
                  disabled={!reminderMessage.trim()}
                >
                  <Send className="size-4 mr-2" />
                  Envoyer le rappel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
