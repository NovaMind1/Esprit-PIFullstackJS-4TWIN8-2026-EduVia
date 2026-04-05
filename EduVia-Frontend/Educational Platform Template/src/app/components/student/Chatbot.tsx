import { useState, useRef, useEffect } from 'react';
import { Card } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { X, Send, Bot, User } from 'lucide-react';

interface ChatbotProps {
  onClose: () => void;
}

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export default function Chatbot({ onClose }: ChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "Bonjour ! Je suis votre assistant pédagogique Eduvia IA. Je suis disponible 24/7 pour répondre à vos questions de cours, expliquer des notions ou vous guider dans la plateforme. Comment puis-je vous aider ?",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const getBotResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('pointeur') || lowerMessage.includes('pointer')) {
      return "Les pointeurs en C sont des variables qui stockent l'adresse mémoire d'une autre variable.\n\nExemple simple :\n```c\nint x = 10;        // Variable normale\nint *ptr = &x;     // ptr stocke l'adresse de x\nprintf(\"%d\", *ptr); // Affiche 10\n```\n\nLe symbole '&' donne l'adresse, et '*' permet d'accéder à la valeur.\n\n💡 Je vous recommande l'exercice interactif 'Jeu des pointeurs' dans vos recommandations !";
    }
    
    if (lowerMessage.includes('complexité') || lowerMessage.includes('big o')) {
      return "La complexité algorithmique mesure l'efficacité d'un algorithme.\n\nPrincipales complexités :\n• O(1) - Constant : accès direct (ex: tableau[i])\n• O(log n) - Logarithmique : recherche binaire\n• O(n) - Linéaire : parcourir un tableau\n• O(n²) - Quadratique : boucles imbriquées\n\n📚 Consultez le cours 'Introduction à la complexité' dans vos recommandations pour plus de détails !";
    }
    
    if (lowerMessage.includes('liste chaînée') || lowerMessage.includes('linked list')) {
      return "Une liste chaînée est une structure de données où chaque élément (nœud) contient :\n1. Une donnée\n2. Un pointeur vers l'élément suivant\n\nAvantages :\n✓ Taille dynamique\n✓ Insertion/suppression efficace\n\nInconvénients :\n✗ Pas d'accès direct par index\n✗ Plus de mémoire (pointeurs)\n\nVoulez-vous un exemple de code ?";
    }
    
    if (lowerMessage.includes('arbre') || lowerMessage.includes('tree')) {
      return "Un arbre binaire est une structure hiérarchique où chaque nœud a maximum 2 enfants (gauche et droite).\n\nArbre Binaire de Recherche (ABR) :\n• Enfant gauche < Parent\n• Enfant droit > Parent\n\nComplexité recherche : O(log n) en moyenne\n\n🎮 Essayez le puzzle 'Construis ton arbre binaire' pour pratiquer !";
    }
    
    if (lowerMessage.includes('aide') || lowerMessage.includes('comment')) {
      return "Je peux vous aider de plusieurs façons :\n\n1. 📚 Expliquer des concepts de cours\n2. 💻 Fournir des exemples de code\n3. 🧭 Vous guider dans la plateforme\n4. 📊 Clarifier des notions complexes\n\nPosez-moi simplement votre question !";
    }
    
    if (lowerMessage.includes('merci')) {
      return "Avec plaisir ! N'hésitez pas si vous avez d'autres questions. Je suis là pour vous aider 24/7. Bon courage dans votre apprentissage ! 🚀";
    }
    
    return "C'est une excellente question ! Je peux vous aider avec :\n\n• Les structures de données (listes, arbres, piles, files)\n• Les algorithmes (tri, recherche, complexité)\n• La programmation en C (pointeurs, mémoire)\n• L'utilisation de la plateforme\n\nPouvez-vous préciser votre question ?";
  };

  const handleSendMessage = () => {
    if (inputValue.trim() === '') return;

    const userMessage: Message = {
      id: messages.length + 1,
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages([...messages, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate bot thinking time
    setTimeout(() => {
      const botMessage: Message = {
        id: messages.length + 2,
        text: getBotResponse(inputValue),
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickQuestions = [
    "Explique-moi les pointeurs en C",
    "C'est quoi la complexité O(log n) ?",
    "Différence liste chaînée et tableau ?",
    "Comment fonctionne un arbre binaire ?"
  ];

  return (
    <Card className="flex flex-col h-[600px] shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-red-600 text-white rounded-t-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
            <Bot className="size-6 text-red-600" />
          </div>
          <div>
            <h3 className="font-semibold">Assistant Eduvia IA</h3>
            <p className="text-xs opacity-90">Disponible 24/7</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="text-white hover:bg-red-700"
        >
          <X className="size-5" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${
              message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            <div
              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                message.sender === 'user'
                  ? 'bg-red-600'
                  : 'bg-white border-2 border-red-200'
              }`}
            >
              {message.sender === 'user' ? (
                <User className="size-5 text-white" />
              ) : (
                <Bot className="size-5 text-red-600" />
              )}
            </div>
            <div
              className={`flex-1 max-w-[80%] p-3 rounded-lg whitespace-pre-line ${
                message.sender === 'user'
                  ? 'bg-red-600 text-white'
                  : 'bg-white border border-gray-200'
              }`}
            >
              <p className="text-sm">{message.text}</p>
              <p
                className={`text-xs mt-1 ${
                  message.sender === 'user' ? 'text-red-200' : 'text-gray-500'
                }`}
              >
                {message.timestamp.toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-3">
            <div className="w-8 h-8 bg-white border-2 border-red-200 rounded-full flex items-center justify-center">
              <Bot className="size-5 text-red-600" />
            </div>
            <div className="bg-white border border-gray-200 p-3 rounded-lg">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Questions */}
      {messages.length === 1 && (
        <div className="p-3 border-t bg-white">
          <p className="text-xs text-gray-600 mb-2">Questions rapides :</p>
          <div className="flex flex-wrap gap-2">
            {quickQuestions.map((question, idx) => (
              <Button
                key={idx}
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => {
                  setInputValue(question);
                }}
              >
                {question}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t bg-white rounded-b-lg">
        <div className="flex gap-2">
          <Input
            placeholder="Posez votre question..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={inputValue.trim() === '' || isTyping}
          >
            <Send className="size-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}