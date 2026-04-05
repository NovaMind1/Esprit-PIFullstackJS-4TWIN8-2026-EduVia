import { useState } from 'react';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Textarea } from '@/app/components/ui/textarea';
import { Badge } from '@/app/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { 
  MessageCircle, 
  Users, 
  Send, 
  Search,
  Clock,
  CheckCircle,
  User
} from 'lucide-react';

interface HelpRequest {
  id: number;
  author: string;
  year: string;
  subject: string;
  message: string;
  timestamp: string;
  responses: number;
  status: 'open' | 'answered';
}

interface ChatMessage {
  id: number;
  sender: string;
  message: string;
  timestamp: string;
  isCurrentUser: boolean;
}

export default function StudentForum() {
  const [showNewRequestDialog, setShowNewRequestDialog] = useState(false);
  const [showChatDialog, setShowChatDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<HelpRequest | null>(null);
  const [newRequestSubject, setNewRequestSubject] = useState('');
  const [newRequestMessage, setNewRequestMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');

  const helpRequests: HelpRequest[] = [
    {
      id: 1,
      author: "Thomas Martin",
      year: "L1 Informatique",
      subject: "Aide sur les boucles en Java",
      message: "J'ai du mal à comprendre la différence entre while et do-while. Quelqu'un peut m'expliquer avec un exemple ?",
      timestamp: "Il y a 10 min",
      responses: 0,
      status: 'open'
    },
    {
      id: 2,
      author: "Sophie Leroux",
      year: "L2 Informatique",
      subject: "Exercice sur les arbres binaires",
      message: "Je bloque sur l'exercice 3 du TD sur les arbres. Comment on fait le parcours en profondeur ?",
      timestamp: "Il y a 25 min",
      responses: 2,
      status: 'answered'
    },
    {
      id: 3,
      author: "Lucas Bernard",
      year: "L1 Informatique",
      subject: "Installation de Python",
      message: "J'ai un problème avec l'installation de Python sur Windows. Quelqu'un peut m'aider ?",
      timestamp: "Il y a 1h",
      responses: 5,
      status: 'answered'
    },
    {
      id: 4,
      author: "Emma Dubois",
      year: "L2 Informatique",
      subject: "Révision pour l'examen de BD",
      message: "Quelqu'un veut réviser ensemble pour l'examen de bases de données de la semaine prochaine ?",
      timestamp: "Il y a 2h",
      responses: 3,
      status: 'open'
    }
  ];

  const handleSubmitRequest = () => {
    if (newRequestSubject.trim() && newRequestMessage.trim()) {
      // Simulate sending notification to students
      alert("Votre demande d'aide a été envoyée à tous les étudiants de L2 Informatique !");
      setShowNewRequestDialog(false);
      setNewRequestSubject('');
      setNewRequestMessage('');
    }
  };

  const handleRespondToRequest = (request: HelpRequest) => {
    setSelectedRequest(request);
    // Initialize chat with a welcome message
    setChatMessages([
      {
        id: 1,
        sender: request.author,
        message: request.message,
        timestamp: request.timestamp,
        isCurrentUser: false
      },
      {
        id: 2,
        sender: "Système",
        message: `Chat privé ouvert avec ${request.author}. Vous pouvez maintenant discuter directement.`,
        timestamp: "Maintenant",
        isCurrentUser: false
      }
    ]);
    setShowChatDialog(true);
  };

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const message: ChatMessage = {
        id: chatMessages.length + 1,
        sender: "Vous",
        message: newMessage,
        timestamp: "Maintenant",
        isCurrentUser: true
      };
      setChatMessages([...chatMessages, message]);
      setNewMessage('');

      // Simulate response after 2 seconds
      setTimeout(() => {
        const response: ChatMessage = {
          id: chatMessages.length + 2,
          sender: selectedRequest?.author || "Étudiant",
          message: "Merci beaucoup pour ton aide ! C'est beaucoup plus clair maintenant.",
          timestamp: "Maintenant",
          isCurrentUser: false
        };
        setChatMessages(prev => [...prev, response]);
      }, 2000);
    }
  };

  const filteredRequests = helpRequests.filter(request => 
    request.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    request.message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-200">
        <div className="flex items-start gap-3">
          <Users className="size-6 text-indigo-600 mt-1" />
          <div>
            <h2 className="text-xl mb-2">Entraide Étudiante - Forum & Chat</h2>
            <p className="text-gray-700">
              Posez vos questions et recevez de l'aide de vos camarades. 
              Lorsqu'un étudiant répond, un chat privé s'ouvre automatiquement pour faciliter l'échange.
            </p>
          </div>
        </div>
      </Card>

      {/* Actions Bar */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-gray-400" />
            <Input
              placeholder="Rechercher une question..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Button onClick={() => setShowNewRequestDialog(true)}>
          <MessageCircle className="size-4 mr-2" />
          Demander de l'aide
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 text-center">
          <p className="text-2xl mb-1">24</p>
          <p className="text-sm text-gray-600">Questions ouvertes</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl mb-1">156</p>
          <p className="text-sm text-gray-600">Réponses aujourd'hui</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl mb-1">89%</p>
          <p className="text-sm text-gray-600">Taux de résolution</p>
        </Card>
      </div>

      {/* Help Requests */}
      <div>
        <h3 className="mb-4">Demandes d'aide récentes</h3>
        <div className="space-y-3">
          {filteredRequests.map(request => (
            <Card key={request.id} className="p-5 hover:shadow-md transition-shadow">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="size-4 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="text-sm">{request.author}</h4>
                        <p className="text-xs text-gray-500">{request.year}</p>
                      </div>
                    </div>
                    
                    <h4 className="mb-2">{request.subject}</h4>
                    <p className="text-sm text-gray-600 mb-3">{request.message}</p>
                    
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="size-4" />
                        {request.timestamp}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="size-4" />
                        {request.responses} réponse{request.responses !== 1 ? 's' : ''}
                      </span>
                      {request.status === 'answered' ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          <CheckCircle className="size-3 mr-1" />
                          Résolu
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-orange-50 text-orange-700">
                          En attente
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <Button 
                  className="w-full"
                  onClick={() => handleRespondToRequest(request)}
                >
                  <Send className="size-4 mr-2" />
                  Répondre et ouvrir le chat
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* New Request Dialog */}
      <Dialog open={showNewRequestDialog} onOpenChange={setShowNewRequestDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Demander de l'aide</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Card className="p-4 bg-blue-50 border-blue-200">
              <p className="text-sm text-blue-800">
                📢 Votre demande sera envoyée à tous les étudiants de votre année (L2 Informatique). 
                Ceux qui souhaitent vous aider pourront ouvrir un chat privé avec vous.
              </p>
            </Card>

            <div>
              <label className="block text-sm mb-2">Sujet</label>
              <Input
                placeholder="Ex: Aide sur les boucles en Java"
                value={newRequestSubject}
                onChange={(e) => setNewRequestSubject(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm mb-2">Message</label>
              <Textarea
                placeholder="Décrivez votre problème en détail..."
                value={newRequestMessage}
                onChange={(e) => setNewRequestMessage(e.target.value)}
                rows={5}
              />
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowNewRequestDialog(false)}
              >
                Annuler
              </Button>
              <Button
                onClick={handleSubmitRequest}
                disabled={!newRequestSubject.trim() || !newRequestMessage.trim()}
              >
                Envoyer la demande
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Chat Dialog */}
      <Dialog open={showChatDialog} onOpenChange={setShowChatDialog}>
        <DialogContent className="max-w-2xl h-[600px] flex flex-col p-0">
          <DialogHeader className="p-6 pb-4 border-b">
            <DialogTitle>
              Chat avec {selectedRequest?.author}
            </DialogTitle>
            <p className="text-sm text-gray-600">{selectedRequest?.year}</p>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
            {chatMessages.map(message => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.isCurrentUser ? 'flex-row-reverse' : 'flex-row'
                }`}
              >
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    message.isCurrentUser
                      ? 'bg-blue-600 text-white'
                      : message.sender === "Système"
                      ? 'bg-gray-400 text-white'
                      : 'bg-gray-200'
                  }`}
                >
                  <User className="size-4" />
                </div>
                <div
                  className={`flex-1 max-w-[70%] p-3 rounded-lg ${
                    message.isCurrentUser
                      ? 'bg-blue-600 text-white'
                      : message.sender === "Système"
                      ? 'bg-gray-300'
                      : 'bg-white border border-gray-200'
                  }`}
                >
                  <p className="text-sm mb-1">{message.message}</p>
                  <p
                    className={`text-xs ${
                      message.isCurrentUser ? 'text-blue-200' : 'text-gray-500'
                    }`}
                  >
                    {message.sender} • {message.timestamp}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 border-t bg-white">
            <div className="flex gap-2">
              <Input
                placeholder="Écrivez votre message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSendMessage();
                  }
                }}
              />
              <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                <Send className="size-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
