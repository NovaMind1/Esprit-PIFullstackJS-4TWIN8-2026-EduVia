import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { catchError, of, timeout } from 'rxjs';

type ChatMessage = {
  sender: 'assistant' | 'student';
  text: string;
  time: string;
};

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './chatbot.html',
  styleUrl: './chatbot.css',
})
export class Chatbot {
  draftMessage = '';
  sending = false;
  messages: ChatMessage[] = [
    {
      sender: 'assistant',
      text: "Bonjour! Je suis votre assistant d'apprentissage IA. Comment puis-je vous aider aujourd'hui?",
      time: '12:38',
    },
  ];

  quickReplies = [
    "Explique-moi ce chapitre",
    'Donne-moi un resume',
    'Propose un exercice',
  ];

  constructor(private http: HttpClient) {}

  sendMessage() {
    const text = this.draftMessage.trim();
    if (!text || this.sending) {
      return;
    }

    this.messages.push({
      sender: 'student',
      text,
      time: this.currentTime(),
    });

    this.draftMessage = '';
    this.sending = true;

    this.http
      .post<{ answer: string }>('/api/student/assistant/ask', {
        question: text,
        level: 'debutant',
      })
      .pipe(
        timeout(12000),
        catchError(error => {
          const message =
            error?.error?.message ||
            error?.message ||
            this.buildLocalFallback(text);

          return of({
            answer:
              typeof message === 'string' && message.trim()
                ? message
                : this.buildLocalFallback(text),
          });
        }),
      )
      .subscribe({
        next: response => {
          this.messages.push({
            sender: 'assistant',
            text: response.answer || this.buildLocalFallback(text),
            time: this.currentTime(),
          });
          this.sending = false;
        },
      });
  }

  useQuickReply(message: string) {
    this.draftMessage = message;
    this.sendMessage();
  }

  private currentTime() {
    return new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private buildLocalFallback(question: string) {
    const normalized = question
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    if (
      normalized.includes('bonjour') ||
      normalized.includes('salut') ||
      normalized.includes("besoin d'aide") ||
      normalized.includes('aide')
    ) {
      return "Bonjour. Je suis la pour vous aider. Dites-moi la notion qui vous bloque, par exemple une jointure SQL, un algorithme, une structure if/else, ou un exercice.";
    }

    if (normalized.includes('machine learning')) {
      return "Le machine learning est une branche de l'intelligence artificielle qui permet a un systeme d'apprendre a partir des donnees afin de faire des predictions ou des classifications.";
    }

    if (normalized.includes('jointure') || normalized.includes('join')) {
      return "Une jointure en SQL sert a relier plusieurs tables selon une condition. Par exemple, INNER JOIN garde les lignes correspondantes dans les deux tables, alors que LEFT JOIN garde toutes les lignes de la table de gauche.";
    }

    if (normalized.includes('if') || normalized.includes('else')) {
      return "La structure if ... else permet de choisir entre deux traitements selon qu'une condition est vraie ou fausse.";
    }

    return "Je n'ai pas pu contacter le service IA a temps, mais je peux deja vous aider si vous reformulez votre question de facon plus precise, par exemple sur SQL, algorithmique, machine learning ou un exercice.";
  }
}
