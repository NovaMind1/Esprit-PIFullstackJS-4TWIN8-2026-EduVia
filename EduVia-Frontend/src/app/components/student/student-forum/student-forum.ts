import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

type HelpRequest = {
  id: number;
  author: string;
  level: string;
  title: string;
  message: string;
  time: string;
  replies: number;
  status: 'En attente' | 'En discussion' | 'Resolue';
};

type ChatMessage = {
  sender: 'student' | 'system';
  text: string;
  meta: string;
};

@Component({
  selector: 'app-student-forum',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './student-forum.html',
  styleUrl: './student-forum.css',
})
export class StudentForum {
  searchTerm = '';
  showHelpModal = false;
  openedChatRequest: HelpRequest | null = null;
  chatDraft = '';
  helpSubject = '';
  helpMessage = '';

  requests: HelpRequest[] = [
    {
      id: 1,
      author: 'Thomas Martin',
      level: 'L1 Informatique',
      title: 'Aide sur les boucles en Java',
      message:
        "J'ai du mal a comprendre la difference entre while et do-while. Quelqu'un peut m'expliquer avec un exemple ?",
      time: 'Il y a 10 min',
      replies: 0,
      status: 'En attente',
    },
    {
      id: 2,
      author: 'Sophie Leroux',
      level: 'L2 Informatique',
      title: 'Exercice sur les arbres binaires',
      message:
        "Je bloque sur l'exercice 3 du TD sur les arbres. Comment on fait le parcours en profondeur ?",
      time: 'Il y a 22 min',
      replies: 2,
      status: 'En discussion',
    },
    {
      id: 3,
      author: 'Yassine Ben Salem',
      level: 'L1 Informatique',
      title: 'Question sur les jointures SQL',
      message:
        'Je ne comprends pas bien la difference entre INNER JOIN et LEFT JOIN. Vous avez une explication simple ?',
      time: 'Il y a 35 min',
      replies: 3,
      status: 'Resolue',
    },
  ];

  chatMessages: Record<number, ChatMessage[]> = {
    1: [
      {
        sender: 'student',
        text: "J'ai du mal a comprendre la difference entre while et do-while. Quelqu'un peut m'expliquer avec un exemple ?",
        meta: 'Thomas Martin · Il y a 10 min',
      },
      {
        sender: 'system',
        text: 'Chat prive ouvert avec Thomas Martin. Vous pouvez maintenant discuter directement.',
        meta: 'Systeme · Maintenant',
      },
    ],
    2: [
      {
        sender: 'student',
        text: "Je bloque sur l'exercice 3 du TD sur les arbres. Comment on fait le parcours en profondeur ?",
        meta: 'Sophie Leroux · Il y a 22 min',
      },
      {
        sender: 'system',
        text: 'Chat prive deja actif. Vous pouvez poursuivre la discussion.',
        meta: 'Systeme · Maintenant',
      },
    ],
    3: [
      {
        sender: 'student',
        text: 'Je ne comprends pas bien la difference entre INNER JOIN et LEFT JOIN.',
        meta: 'Yassine Ben Salem · Il y a 35 min',
      },
      {
        sender: 'system',
        text: 'Cette demande a deja recu plusieurs reponses utiles.',
        meta: 'Systeme · Maintenant',
      },
    ],
  };

  get filteredRequests() {
    const term = this.searchTerm.trim().toLowerCase();
    if (!term) {
      return this.requests;
    }

    return this.requests.filter(
      request =>
        request.author.toLowerCase().includes(term) ||
        request.title.toLowerCase().includes(term) ||
        request.message.toLowerCase().includes(term) ||
        request.level.toLowerCase().includes(term),
    );
  }

  get openQuestionsCount() {
    return this.requests.filter(request => request.status !== 'Resolue').length;
  }

  get repliesTodayCount() {
    return this.requests.reduce((total, request) => total + request.replies, 0) * 12;
  }

  get resolutionRate() {
    if (this.requests.length === 0) {
      return 0;
    }

    return Math.round(
      (this.requests.filter(request => request.status === 'Resolue').length / this.requests.length) * 100,
    );
  }

  openHelpModal() {
    this.showHelpModal = true;
  }

  closeHelpModal() {
    this.showHelpModal = false;
    this.helpSubject = '';
    this.helpMessage = '';
  }

  submitHelpRequest() {
    const subject = this.helpSubject.trim();
    const message = this.helpMessage.trim();
    if (!subject || !message) {
      return;
    }

    this.requests = [
      {
        id: Date.now(),
        author: 'Vous',
        level: 'L2 Informatique',
        title: subject,
        message,
        time: 'A l’instant',
        replies: 0,
        status: 'En attente',
      },
      ...this.requests,
    ];

    this.closeHelpModal();
  }

  openChat(request: HelpRequest) {
    this.openedChatRequest = request;
    if (!this.chatMessages[request.id]) {
      this.chatMessages[request.id] = [
        {
          sender: 'student',
          text: request.message,
          meta: `${request.author} · ${request.time}`,
        },
        {
          sender: 'system',
          text: `Chat prive ouvert avec ${request.author}. Vous pouvez maintenant discuter directement.`,
          meta: 'Systeme · Maintenant',
        },
      ];
    }
  }

  closeChat() {
    this.openedChatRequest = null;
    this.chatDraft = '';
  }

  sendChatMessage() {
    const text = this.chatDraft.trim();
    if (!text || !this.openedChatRequest) {
      return;
    }

    this.chatMessages[this.openedChatRequest.id].push({
      sender: 'system',
      text,
      meta: 'Vous · Maintenant',
    });

    this.chatDraft = '';
  }
}
