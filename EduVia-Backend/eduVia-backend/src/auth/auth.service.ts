import {
  Injectable,
  UnauthorizedException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import axios from 'axios';
import KcAdminClient from '@keycloak/keycloak-admin-client';
import { EmailService } from 'src/email/email.service'; // Import du service email
@Injectable()
export class AuthService {
  private readonly keycloakUrl: string;
  private readonly realm: string;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly adminUsername: string;
  private readonly adminPassword: string;

  private kcAdmin: KcAdminClient;

  constructor(
    private configService: ConfigService,
    private jwtService: JwtService,
    private emailService: EmailService, // Injection corrigée et activée
  ) {
    this.keycloakUrl = this.configService.getOrThrow<string>('KEYCLOAK_URL');
    this.realm = this.configService.getOrThrow<string>('KEYCLOAK_REALM');
    this.clientId = this.configService.getOrThrow<string>('KEYCLOAK_CLIENT_ID');
    this.clientSecret = this.configService.getOrThrow<string>('KEYCLOAK_CLIENT_SECRET');
    this.adminUsername = this.configService.getOrThrow<string>('KEYCLOAK_ADMIN_USERNAME');
    this.adminPassword = this.configService.getOrThrow<string>('KEYCLOAK_ADMIN_PASSWORD');

    this.kcAdmin = new KcAdminClient({
      baseUrl: this.keycloakUrl,
      realmName: this.realm,
    });
  }

  // ────────────────────────────────────────────────
  // Méthode privée : authentification admin
  // ────────────────────────────────────────────────
  private async authenticateAdmin(): Promise<void> {
    try {
      // Sauvegarde le realm actuel
      const currentRealm = this.kcAdmin.realmName;

      // Passe temporairement en realm master (où admin-cli existe)
      this.kcAdmin.setConfig({ realmName: 'master' });

      await this.kcAdmin.auth({
        username: this.adminUsername,
        password: this.adminPassword,
        grantType: 'password',
        clientId: 'admin-cli', // admin-cli est dans master
      });

      console.log('[ADMIN AUTH] Authentification réussie dans realm master');

      // Remets le realm EduVia pour les opérations suivantes
      this.kcAdmin.setConfig({ realmName: currentRealm });
    } catch (error: any) {
      console.error('Échec authentification admin Keycloak:', error.message);
      throw new HttpException(
        'Erreur d\'authentification admin Keycloak',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // ────────────────────────────────────────────────
  // Méthode privée : normalise UUID au format standard
  // ────────────────────────────────────────────────
  private normalizeUserId(userId: string): string {
    let normalized = userId.trim();
    
    // Vérifie si c'est déjà un UUID avec tirets
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(normalized)) {
      return normalized.toLowerCase();
    }
    
    // Si c'est un UUID sans tirets (32 caractères hex)
    const cleanId = normalized.replace(/-/g, '').toLowerCase();
    if (cleanId.length === 32 && /^[0-9a-f]{32}$/.test(cleanId)) {
      return `${cleanId.substring(0, 8)}-${cleanId.substring(8, 12)}-${cleanId.substring(12, 16)}-${cleanId.substring(16, 20)}-${cleanId.substring(20)}`;
    }
    
    // Retourne tel quel si pas un format UUID reconnu
    return normalized;
  }

  // ────────────────────────────────────────────────
  // LOGIN – User Story 1.2
  // ────────────────────────────────────────────────
async login(email: string, password: string): Promise<any> {
  try {
    console.log('[LOGIN] Tentative avec :', { email, clientId: this.clientId });

    const response = await axios.post(
      `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/token`,
      new URLSearchParams({
        grant_type: 'password',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        username: email,
        password,
        scope: 'openid profile email',
      }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    );

    console.log('[LOGIN] Réponse Keycloak :', response.data);

    const { access_token, refresh_token, expires_in } = response.data;
    const decoded = this.jwtService.decode(access_token) as any;

    return {
      access_token,
      refresh_token,
      expires_in,
      user: {
        id: decoded.sub,
        email: decoded.email,
        name: decoded.name || `${decoded.given_name || ''} ${decoded.family_name || ''}`.trim(),
        preferred_username: decoded.preferred_username,
      },
    };
  } catch (error: any) {
    console.error('[LOGIN ERROR] Détails Keycloak :', error.response?.data || error.message);
    if (error.response?.status === 401 || error.response?.data?.error === 'invalid_grant') {
      throw new UnauthorizedException('Identifiants invalides');
    }
    throw new HttpException('Échec connexion', HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

  // ────────────────────────────────────────────────
  // REFRESH TOKEN
  // ────────────────────────────────────────────────
  async refreshToken(refreshToken: string): Promise<any> {
    try {
      const response = await axios.post(
        `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/token`,
        new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: this.clientId,
          client_secret: this.clientSecret,
          refresh_token: refreshToken,
        }).toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
      );

      return {
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token || refreshToken,
        expires_in: response.data.expires_in,
      };
    } catch (error: any) {
      console.error('Erreur refresh:', error.response?.data || error.message);
      throw new UnauthorizedException('Token de rafraîchissement invalide');
    }
  }

  // ────────────────────────────────────────────────
  // LOGOUT – User Story 1.6
  // ────────────────────────────────────────────────
  async logout(refreshToken: string): Promise<boolean> {
    try {
      await axios.post(
        `${this.keycloakUrl}/realms/${this.realm}/protocol/openid-connect/logout`,
        new URLSearchParams({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          refresh_token: refreshToken,
        }).toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
      );
      return true;
    } catch (error: any) {
      console.warn('Logout échoué (peut-être déjà invalide):', error.message);
      return false;
    }
  }

  // ────────────────────────────────────────────────
  // CHANGE PASSWORD – User Story 1.3
  // ────────────────────────────────────────────────
async changePassword(userId: string, newPassword: string): Promise<void> {
  try {
    // Validation de userId
    if (!userId || typeof userId !== 'string') {
      throw new HttpException('ID utilisateur invalide', HttpStatus.BAD_REQUEST);
    }

    await this.authenticateAdmin();

    const normalizedUserId = this.normalizeUserId(userId);
    console.log('[CHANGE PASSWORD] User ID normalisé :', normalizedUserId);

    await this.kcAdmin.users.resetPassword({
      id: normalizedUserId,
      credential: {
        type: 'password',
        value: newPassword,
        temporary: false,
      },
    });
  } catch (error: any) {
    console.error('Erreur changement mot de passe:', error.message);
    if (error instanceof HttpException) throw error;
    throw new HttpException('Échec changement mot de passe', HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

  // ────────────────────────────────────────────────
  // FORGOT PASSWORD – User Story 1.4
  // ────────────────────────────────────────────────
  // FORGOT PASSWORD – User Story 1.4
  // ────────────────────────────────────────────────
  async forgotPassword(email: string): Promise<void> {
    try {
      await this.authenticateAdmin();

      const users = await this.kcAdmin.users.find({ email, exact: true });
      if (users.length === 0) {
        console.log(`[FORGOT PASSWORD] Utilisateur ${email} non trouvé (silencieux pour sécurité)`);
        return;
      }

      const userId = users[0].id!;
      const frontendResetUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:4200';

      try {
        // Essaye d'utiliser l'email action de Keycloak
        await this.kcAdmin.users.executeActionsEmail({
          id: userId,
          lifespan: 3600,
          clientId: this.clientId, // Client pour lequel générer le lien
          actions: ['UPDATE_PASSWORD'],
          // Note: redirectUri est optionnel et doit correspondre aux URIs configurées dans le client
        });
        console.log(`[FORGOT PASSWORD] Email de réinitialisation envoyé par Keycloak à ${email}`);
      } catch (keycloakError: any) {
        // Si erreur Keycloak email (realm non configuré, redirect uri, etc.), essaye notre service email
        const errorMsg = keycloakError.message?.toLowerCase() || '';
        if (errorMsg.includes('sender address') || errorMsg.includes('invalid sender') || 
            errorMsg.includes('client id') || errorMsg.includes('redirect')) {
          console.warn('[FORGOT PASSWORD] Configuration Keycloak incomplète, tentative via EmailService...');
          
          // Génère un lien de réinitialisation accessible sans nécessiter Keycloak
          const resetLink = `${frontendResetUrl}/reset-password?email=${encodeURIComponent(email)}&userId=${userId}`;
          
          try {
            await this.emailService.sendPasswordResetEmail({
              to: email,
              resetLink,
              appName: 'EduVia',
              expirationMinutes: 60,
            });
            console.log(`[FORGOT PASSWORD] ✅ Email de réinitialisation envoyé via EmailService à ${email}`);
          } catch (emailError: any) {
            console.error(`[FORGOT PASSWORD] ❌ Échec EmailService:`, emailError.message);
            console.error('[FORGOT PASSWORD] Stack:', emailError.stack);
            if (emailError.code) console.error('[FORGOT PASSWORD] Code erreur:', emailError.code);
            console.error('[FORGOT PASSWORD] ⚠️  Vérifiez:');
            console.error('  1. SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD');
            console.error('  2. SMTP_FROM_EMAIL est configuré');
            console.error('  3. Le serveur SMTP accepte les connexions');
            console.error('  4. Les identifiants SMTP sont corrects');
            // Ne pas lever l'erreur pour des raisons de sécurité (pas de leak d'info utilisateur)
          }
        } else {
          console.error('[FORGOT PASSWORD] Erreur Keycloak:', keycloakError.message);
          // Ne pas lever l'erreur pour des raisons de sécurité
        }
      }
    } catch (error: any) {
      console.error('[FORGOT PASSWORD] Erreur générale:', error.message);
      // Silencieux pour éviter les fuites d'informations
    }
  }

  // ────────────────────────────────────────────────
  // UPDATE PROFILE – User Story 1.5
  // ────────────────────────────────────────────────
  async updateProfile(
    userId: string,
    updates: { firstName?: string; lastName?: string; email?: string },
  ): Promise<void> {
    try {
      await this.authenticateAdmin();

      const normalizedUserId = this.normalizeUserId(userId);
      await this.kcAdmin.users.update(
        { id: normalizedUserId },
        {
          firstName: updates.firstName,
          lastName: updates.lastName,
          email: updates.email,
          emailVerified: updates.email ? true : undefined,
        },
      );
    } catch (error: any) {
      console.error('Erreur mise à jour profil:', error.message);
      throw new HttpException('Échec mise à jour profil', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // ────────────────────────────────────────────────
  // GET PROFILE
  // ────────────────────────────────────────────────
  async getProfile(userId: string): Promise<any> {
    try {
      await this.authenticateAdmin();
      const normalizedUserId = this.normalizeUserId(userId);
      const user = await this.kcAdmin.users.findOne({ id: normalizedUserId });

      if (!user) {
        throw new HttpException('Utilisateur introuvable', HttpStatus.NOT_FOUND);
      }

      return {
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        enabled: user.enabled,
      };
    } catch (error: any) {
      console.error('Erreur récupération profil:', error.message);
      throw new HttpException('Échec récupération profil', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // ────────────────────────────────────────────────
  // CRÉATION UTILISATEUR + ENVOI IDENTIFIANTS – User Story 1.1
  // ────────────────────────────────────────────────
  async createAndSendCredentials(
    email: string,
    username: string,
    firstName?: string,
    lastName?: string,
  ): Promise<{ keycloakId: string; message: string }> {
    try {
      await this.authenticateAdmin();

      // Vérification existence
      const existing = await this.kcAdmin.users.find({ username, email, exact: true });
      if (existing.length > 0) {
        throw new HttpException('Utilisateur existe déjà', HttpStatus.CONFLICT);
      }

      const tempPassword = this.generateTempPassword();

      const created = await this.kcAdmin.users.create({
        username,
        email,
        enabled: true,
        emailVerified: false,
        firstName: firstName || '',
        lastName: lastName || '',
        credentials: [{
          type: 'password',
          value: tempPassword,
          temporary: true,
        }],
      });

      const keycloakId = created.id!;

      // Envoi email – maintenant actif
      try {
        await this.emailService.sendCredentialsEmail({
          to: email,
          username,
          tempPassword,
          appName: 'EduVia',
          loginUrl: this.configService.get('FRONTEND_URL') + '/login' || 'http://localhost:4200/login',
        });
        console.log(`[EMAIL SUCCESS] Identifiants envoyés à ${email}`);
      } catch (emailError: any) {
        console.error('[EMAIL ERROR] Échec envoi identifiants:', emailError.message);
        // Ne pas bloquer la réponse si email échoue
      }

      return {
        keycloakId,
        message: `Compte créé. Identifiants envoyés à ${email}`,
      };
    } catch (error: any) {
      console.error('Erreur création + credentials:', error.message);
      if (error instanceof HttpException) throw error;
      throw new HttpException('Échec création compte', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private generateTempPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let pw = '';
    for (let i = 0; i < 12; i++) {
      pw += chars[Math.floor(Math.random() * chars.length)];
    }
    return pw;
  }
}