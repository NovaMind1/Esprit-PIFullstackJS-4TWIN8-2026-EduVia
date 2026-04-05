import { BehaviorSubject } from 'rxjs';
import { Injectable } from '@angular/core';

export interface NotificationItem {
  id: number;
  title: string;
  message: string;
  type: 'warning' | 'info' | 'success';
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly storageKey = 'app_notifications';
  private nextId = 1;
  private notificationsSubject = new BehaviorSubject<NotificationItem[]>(this.readNotifications());
  notifications$ = this.notificationsSubject.asObservable();

  addNotification(notification: Omit<NotificationItem, 'id' | 'createdAt'>) {
    const existing = this.notificationsSubject.value.find(
      (item) => item.title === notification.title && item.message === notification.message
    );

    if (existing) {
      return;
    }

    const newNotification: NotificationItem = {
      id: this.nextId++,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      createdAt: new Date().toISOString(),
    };

    this.commitNotifications([newNotification, ...this.notificationsSubject.value]);
  }

  removeNotification(notificationId: number) {
    this.commitNotifications(
      this.notificationsSubject.value.filter((item) => item.id !== notificationId)
    );
  }

  clearNotifications() {
    this.commitNotifications([]);
  }

  private commitNotifications(notifications: NotificationItem[]) {
    this.notificationsSubject.next(notifications);
    localStorage.setItem(this.storageKey, JSON.stringify(notifications));
  }

  private readNotifications(): NotificationItem[] {
    try {
      const raw = localStorage.getItem(this.storageKey);
      const notifications = raw ? JSON.parse(raw) as NotificationItem[] : [];
      const maxId = notifications.reduce((currentMax, item) => Math.max(currentMax, item.id), 0);
      this.nextId = maxId + 1;
      return notifications;
    } catch {
      this.nextId = 1;
      return [];
    }
  }
}
