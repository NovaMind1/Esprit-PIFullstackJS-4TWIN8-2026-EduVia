import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './user.schema';
import { KeycloakService } from '../auth/keycloak.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private keycloakService: KeycloakService,
    private emailService: EmailService,
  ) {}

  async getUserByKeycloakId(keycloakId: string): Promise<User> {
    const user = await this.userModel.findOne({ keycloakId });
    if (!user) throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return this.userModel.find();
  }

  async getProfileByKeycloakId(
    keycloakId: string,
    fallbackEmail?: string,
    fallbackUsername?: string,
  ) {
    const user = await this.userModel.findOne({ keycloakId });
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    const profileData = user.profileData || {};

    const resolvedEmail = user.email || fallbackEmail || '';
    const resolvedFullName =
      profileData.fullName ||
      `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
      fallbackUsername ||
      resolvedEmail;

    return {
      fullName: resolvedFullName,
      email: resolvedEmail,
      phone: profileData.phone || '',
      birthdate: profileData.birthdate || '',
      specialization: profileData.specialization || '',
      address: profileData.address || '',
      bio: profileData.bio || '',
      avatarDataUrl: profileData.avatarDataUrl || '',
    };
  }

  async updateProfileByKeycloakId(
    keycloakId: string,
    payload: {
      fullName: string;
      email: string;
      phone: string;
      birthdate: string;
      specialization: string;
      address: string;
      bio?: string;
      avatarDataUrl?: string;
    },
  ) {
    const user = await this.userModel.findOne({ keycloakId });
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    const fullName = payload.fullName.trim();
    const [firstName, ...lastNameParts] = fullName.split(/\s+/);
    const lastName = lastNameParts.join(' ').trim() || user.lastName;

    user.firstName = firstName || user.firstName;
    user.lastName = lastName;
    user.profileData = {
      ...(user.profileData || {}),
      fullName,
      phone: payload.phone,
      birthdate: payload.birthdate,
      specialization: payload.specialization,
      address: payload.address,
      bio: payload.bio || '',
      avatarDataUrl: payload.avatarDataUrl || '',
    };

    await user.save();

    return this.getProfileByKeycloakId(keycloakId);
  }

  async isPasswordChanged(keycloakId: string): Promise<boolean> {
    const user = await this.userModel.findOne({ keycloakId });
    return user ? user.passwordChanged : false;
  }

  async markPasswordChanged(keycloakId: string): Promise<void> {
    await this.userModel.updateOne(
      { keycloakId },
      {
        passwordChanged: true,
        lastPasswordChange: new Date(),
        isBlocked: false,
      },
    );
  }

  async handleFirstLogin(keycloakId: string): Promise<void> {
    const user = await this.userModel.findOne({ keycloakId });

    if (!user) return;

    if (!user.firstLoginAt) {
      user.firstLoginAt = new Date();
      user.isBlocked = false;
      await user.save();
    }
  }

  async checkAndBlockIfNeeded(
    keycloakId: string,
    roles: string[] = [],
  ): Promise<boolean> {
    const user = await this.userModel.findOne({ keycloakId });

    if (!user) return false;
    if (user.isBlocked) return true;

    // Only teacher and student roles are subject to forced password change/blocking.
    if (!roles.some((role) => ['teacher', 'student'].includes(role))) return false;

    if (user.firstLoginAt && !user.passwordChanged) {
      const hours =
        (Date.now() - user.firstLoginAt.getTime()) / (1000 * 60 * 60);

      if (hours > 24) {
        user.isBlocked = true;
        await user.save();

        await this.keycloakService.updateUserEnabled(keycloakId, false);

        return true;
      }
    }

    return false;
  }
}
