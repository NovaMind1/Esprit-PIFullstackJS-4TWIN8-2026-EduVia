import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.getOrThrow('SMTP_HOST'),
      port: this.configService.getOrThrow('SMTP_PORT'),
      secure: false, // true pour 465, false pour 587 avec STARTTLS
      auth: {
        user: this.configService.getOrThrow('SMTP_USER'),
        pass: this.configService.getOrThrow('SMTP_PASSWORD'),
      },
      tls: {
        rejectUnauthorized: false, // Pour tests locaux si certificat auto-signé
      },
    });

    // Vérifie la connexion au démarrage (utile pour debug)
    this.transporter.verify((error, success) => {
      if (error) {
        console.error('[EMAIL SERVICE] ❌ Erreur connexion SMTP:', error);
      } else {
        console.log('[EMAIL SERVICE] ✅ SMTP connecté et prêt');
      }
    });

    console.log('[EMAIL SERVICE] Configuré avec:');
    console.log(`  - Host: ${this.configService.getOrThrow('SMTP_HOST')}`);
    console.log(`  - Port: ${this.configService.getOrThrow('SMTP_PORT')}`);
    console.log(`  - User: ${this.configService.getOrThrow('SMTP_USER')}`);
    console.log(`  - From: ${this.configService.getOrThrow('SMTP_FROM_EMAIL')}`);
  }

  /**
   * Envoie un lien de réinitialisation de mot de passe
   */
  async sendPasswordResetEmail(params: {
    to: string;
    resetLink: string;
    appName: string;
    expirationMinutes?: number;
  }): Promise<void> {
    const { to, resetLink, appName, expirationMinutes = 60 } = params;

    console.log(`[EMAIL] Préparation email de réinitialisation pour: ${to}`);
    console.log(`[EMAIL] Vérification du champ TO: ${to}`);

    // Vérifie que 'to' n'est pas undefined ou null
    if (!to || typeof to !== 'string') {
      console.error(`[EMAIL ERROR] Le champ 'to' est invalide: ${to}`);
      throw new Error(`Destinataire invalide: ${to}`);
    }

    const fromEmail = this.configService.getOrThrow('SMTP_FROM_EMAIL');
    const fromName = this.configService.get('SMTP_FROM_NAME') || appName;

    // Pour Gmail: utilise le format simple string au lieu d'un objet
    const mailOptions = {
      from: `${fromName} <${fromEmail}>`,
      to: to.toLowerCase().trim(),
      subject: `Réinitialisation de mot de passe - ${appName}`,
      text: `
Bonjour,

Vous avez demandé une réinitialisation de mot de passe pour votre compte ${appName}.

Cliquez sur le lien ci-dessous pour réinitialiser votre mot de passe :
${resetLink}

Ce lien expire dans ${expirationMinutes} minutes.

Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.

Cordialement,
L'équipe ${appName}
      `.trim(),
      html: `
        <h2>Réinitialisation de mot de passe</h2>
        <p>Vous avez demandé une réinitialisation de mot de passe pour votre compte ${appName}.</p>
        <p><a href="${resetLink}" style="background:#4CAF50;color:white;padding:12px 24px;text-decoration:none;border-radius:5px;display:inline-block;font-weight:bold;">Réinitialiser mon mot de passe</a></p>
        <p style="color:#999;font-size:12px;">Ce lien expire dans ${expirationMinutes} minutes.</p>
        <p>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
        <p>Cordialement,<br>L'équipe ${appName}</p>
      `,
    };

    try {
      console.log(`[EMAIL] Envoi via SMTP (${this.configService.getOrThrow('SMTP_HOST')}:${this.configService.getOrThrow('SMTP_PORT')})...`);
      console.log(`[EMAIL] From: ${mailOptions.from}`);
      console.log(`[EMAIL] To: ${mailOptions.to}`);
      console.log(`[EMAIL] Subject: ${mailOptions.subject}`);
      const info = await this.transporter.sendMail(mailOptions);
      console.log(`[EMAIL] ✅ Réinitialisation envoyée AVEC SUCCÈS`);
      console.log(`[EMAIL] Destinataire confirmé: ${to}`);
      console.log(`[EMAIL] MessageID: ${info.messageId}`);
      console.log(`[EMAIL] Response: ${info.response}`);
    } catch (error: any) {
      console.error(`[EMAIL ERROR] ❌ Erreur lors de l'envoi à ${to}:`);
      console.error(`[EMAIL ERROR] Message: ${error.message}`);
      console.error(`[EMAIL ERROR] Code: ${error.code}`);
      console.error(`[EMAIL ERROR] Détails complets:`, error);
      throw error;
    }
  }

  /**
   * Envoie les identifiants à un nouvel utilisateur
   */
  async sendIdentificationEmail(email: string, userId: string, temporaryPassword: string): Promise<void> {
    const appName = 'EduVia';
    const loginUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:4200';

    console.log(`[EMAIL] Préparation email d'identification pour: ${email}`);
    console.log(`[EMAIL] Vérification du champ TO: ${email}`);

    // Vérifie que 'email' n'est pas undefined ou null
    if (!email || typeof email !== 'string') {
      console.error(`[EMAIL ERROR] Le champ 'email' est invalide: ${email}`);
      throw new Error(`Email destinataire invalide: ${email}`);
    }

    const fromEmail = this.configService.getOrThrow('SMTP_FROM_EMAIL');
    const fromName = this.configService.get('SMTP_FROM_NAME') || appName;

    // Pour Gmail: utilise le format simple string au lieu d'un objet
    const mailOptions = {
      from: `${fromName} <${fromEmail}>`,
      to: email.toLowerCase().trim(),
      subject: `Bienvenue sur ${appName} - Vos identifiants`,
      text: `
Bonjour,

Votre compte a été créé sur ${appName}.

Email : ${email}
Mot de passe temporaire : ${temporaryPassword}

Connectez-vous avec ces identifiants et changez votre mot de passe immédiatement.

Lien de connexion : ${loginUrl}/login

Cordialement,
L'équipe ${appName}
      `.trim(),
      html: `
        <h2>Bienvenue sur ${appName} !</h2>
        <p>Votre compte a été créé avec succès.</p>
        <p><strong>Email :</strong> ${email}</p>
        <p><strong>Mot de passe temporaire :</strong> <code>${temporaryPassword}</code></p>
        <p>Veuillez vous connecter et changer votre mot de passe dès votre première visite.</p>
        <p><a href="${loginUrl}/login" style="background:#4CAF50;color:white;padding:12px 24px;text-decoration:none;border-radius:5px;display:inline-block;font-weight:bold;">Se connecter</a></p>
        <p>Cordialement,<br>L'équipe ${appName}</p>
      `,
    };

    try {
      console.log(`[EMAIL] Envoi via SMTP (${this.configService.getOrThrow('SMTP_HOST')}:${this.configService.getOrThrow('SMTP_PORT')})...`);
      console.log(`[EMAIL] From: ${mailOptions.from}`);
      console.log(`[EMAIL] To: ${mailOptions.to}`);
      console.log(`[EMAIL] Subject: ${mailOptions.subject}`);
      const info = await this.transporter.sendMail(mailOptions);
      console.log(`[EMAIL] ✅ Identifiants envoyés AVEC SUCCÈS`);
      console.log(`[EMAIL] Destinataire confirmé: ${email}`);
      console.log(`[EMAIL] MessageID: ${info.messageId}`);
      console.log(`[EMAIL] Response: ${info.response}`);
    } catch (error: any) {
      console.error(`[EMAIL ERROR] ❌ Erreur lors de l'envoi à ${email}:`);
      console.error(`[EMAIL ERROR] Message: ${error.message}`);
      console.error(`[EMAIL ERROR] Code: ${error.code}`);
      console.error(`[EMAIL ERROR] Détails complets:`, error);
      throw error;
    }
  }

  /**
   * Envoie les identifiants à un nouvel utilisateur
   */
  async sendCredentialsEmail(params: {
    to: string;
    username: string;
    tempPassword: string;
    appName: string;
    loginUrl: string;
  }): Promise<void> {
    const { to, username, tempPassword, appName, loginUrl } = params;

    console.log(`[EMAIL] Préparation email de credentials pour: ${to}`);
    console.log(`[EMAIL] Vérification du champ TO: ${to}`);

    // Vérifie que 'to' n'est pas undefined ou null
    if (!to || typeof to !== 'string') {
      console.error(`[EMAIL ERROR] Le champ 'to' est invalide: ${to}`);
      throw new Error(`Destinataire invalide: ${to}`);
    }

    const fromEmail = this.configService.getOrThrow('SMTP_FROM_EMAIL');
    const fromName = this.configService.get('SMTP_FROM_NAME') || appName;

    // Pour Gmail: utilise le format simple string au lieu d'un objet
    const mailOptions = {
      from: `${fromName} <${fromEmail}>`,
      to: to.toLowerCase().trim(),
      subject: `Bienvenue sur ${appName} - Vos identifiants`,
      text: `
Bonjour,

Votre compte a été créé sur ${appName}.

Identifiant : ${username}
Mot de passe temporaire : ${tempPassword}

Changez-le dès votre première connexion.

Lien : ${loginUrl}

Cordialement,
L'équipe ${appName}
      `.trim(),
      html: `
        <h2>Bienvenue sur ${appName} !</h2>
        <p>Votre compte a été créé.</p>
        <p><strong>Identifiant :</strong> ${username}</p>
        <p><strong>Mot de passe temporaire :</strong> ${tempPassword}</p>
        <p>Changez-le lors de votre première connexion.</p>
        <p><a href="${loginUrl}" style="background:#4CAF50;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;">Se connecter</a></p>
        <p>Cordialement,<br>L'équipe ${appName}</p>
      `,
    };

    try {
      console.log(`[EMAIL] Envoi via SMTP (${this.configService.getOrThrow('SMTP_HOST')}:${this.configService.getOrThrow('SMTP_PORT')})...`);
      console.log(`[EMAIL] From: ${mailOptions.from}`);
      console.log(`[EMAIL] To: ${mailOptions.to}`);
      console.log(`[EMAIL] Subject: ${mailOptions.subject}`);
      const info = await this.transporter.sendMail(mailOptions);
      console.log(`[EMAIL] ✅ Credentials envoyés AVEC SUCCÈS`);
      console.log(`[EMAIL] Destinataire confirmé: ${to}`);
      console.log(`[EMAIL] MessageID: ${info.messageId}`);
      console.log(`[EMAIL] Response: ${info.response}`);
    } catch (error: any) {
      console.error(`[EMAIL ERROR] ❌ Erreur lors de l'envoi à ${to}:`);
      console.error(`[EMAIL ERROR] Message: ${error.message}`);
      console.error(`[EMAIL ERROR] Code: ${error.code}`);
      console.error(`[EMAIL ERROR] Détails complets:`, error);
      throw error;
    }
  }
}