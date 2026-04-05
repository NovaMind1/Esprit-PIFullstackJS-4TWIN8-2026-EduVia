import {
  Body,
  Controller,
  Delete,
  Post,
  Get,
  Patch,
  Param,
  Query,
  Request,
  Res,
  UseGuards,
  UsePipes,
  ValidationPipe,
  HttpException,
  HttpStatus,
} from '@nestjs/common';

import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';

import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsIn,
  Matches,
} from 'class-validator';

// ───────────────── DTOs ─────────────────

class LoginDto {
  @IsEmail({}, { message: 'Email invalide' })
  email: string;

  @IsString()
  @MinLength(6)
  password: string;
}

class ChangePasswordDto {
  @IsString()
  currentPassword: string;

  @IsString()
  confirmPassword: string;

  @IsString()
  @MinLength(8)
  newPassword: string;
}

class ValidateCurrentPasswordDto {
  @IsString()
  currentPassword: string;
}

class ForgotPasswordDto {
  @IsEmail({}, { message: 'Email invalide' })
  email: string;

  @IsOptional()
  @IsIn(['teacher', 'student'])
  role?: 'teacher' | 'student';
}

class ResetPasswordDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(8)
  newPassword: string;
}

class UpdateProfileDto {
  @IsString()
  @MinLength(2)
  fullName: string;

  @IsEmail({}, { message: 'Email invalide' })
  email: string;

  @Matches(/^\+216\d{8}$/, {
    message: 'Telephone invalide (format attendu: +216XXXXXXXX)',
  })
  phone: string;

  @IsString()
  birthdate: string;

  @IsString()
  @MinLength(2)
  specialization: string;

  @IsString()
  @MinLength(2)
  address: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  avatarDataUrl?: string;
}

class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  username: string;

  @IsOptional()
  firstName?: string;

  @IsOptional()
  lastName?: string;

  @IsString()
  role: 'teacher' | 'student';
}

class UpdateUserDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  firstName?: string;

  @IsOptional()
  lastName?: string;

  @IsString()
  role: 'teacher' | 'student';
}

// ───────────────── CONTROLLER ─────────────────

@Controller('auth')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  // ───────────────── LOGIN ─────────────────
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    try {
      const result = await this.authService.login(
        loginDto.email,
        loginDto.password,
      );

      const role = result?.user?.roles?.[0] || null;

      return {
        success: true,
        data: { ...result, role },
      };
    } catch (error: any) {
      throw new HttpException(
        error?.response || error?.message || 'Echec de la connexion',
        error?.status || HttpStatus.UNAUTHORIZED,
      );
    }
  }

  // ───────────────── LOGOUT ─────────────────
  @Post('logout')
  async logout(@Body() body: { refresh_token: string }) {
    await this.authService.logout(body.refresh_token);
    return { success: true };
  }

  // ───────────────── VERIFY ─────────────────
  @UseGuards(JwtAuthGuard)
  @Get('verify')
  verify(@Request() req) {
    return { success: true, user: req.user };
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req) {
    const data = await this.usersService.getProfileByKeycloakId(
      req.user.userId,
      req.user?.email,
      req.user?.username,
    );
    return { success: true, data };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  async updateProfile(@Request() req, @Body() dto: UpdateProfileDto) {
    const data = await this.usersService.updateProfileByKeycloakId(
      req.user.userId,
      dto,
    );
    return { success: true, data };
  }

  @Get('verify-email')
  async verifyEmail(
    @Query('token') token: string,
    @Res() res: any,
  ) {
    const redirectUrl = await this.authService.verifyEmailAndBuildRedirect(token);
    return res.redirect(redirectUrl);
  }

  // ───────────────── PASSWORD STATUS ─────────────────
  @UseGuards(JwtAuthGuard)
  @Get('password-status')
  async passwordStatus(@Request() req) {
    const roles = req.user?.roles || [];

    // ADMIN → jamais de changement de mot de passe
    if (roles.includes('admin')) {
      return {
        needsPasswordChange: false,
        blocked: false,
      };
    }

    const requiresPasswordChange = roles.some((role) =>
      ['teacher', 'student'].includes(role)
    );

    if (!requiresPasswordChange) {
      return {
        needsPasswordChange: false,
        blocked: false,
      };
    }

    const passwordChanged = await this.usersService.isPasswordChanged(req.user.userId);

    return {
      needsPasswordChange: !passwordChanged,
      blocked: false,
    };
  }

  // ───────────────── CHANGE PASSWORD ─────────────────
  @UseGuards(JwtAuthGuard)
  @Post('validate-current-password')
  async validateCurrentPassword(@Request() req, @Body() dto: ValidateCurrentPasswordDto) {
    const result = await this.authService.validateCurrentPasswordForSecurity(
      req.user.userId,
      dto.currentPassword,
    );

    return { success: true, data: result };
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  async changePassword(@Request() req, @Body() dto: ChangePasswordDto) {
    if (dto.confirmPassword !== dto.newPassword) {
      throw new HttpException(
        'La confirmation du mot de passe ne correspond pas',
        HttpStatus.BAD_REQUEST,
      );
    }

    await this.authService.validateCurrentPasswordForSecurity(
      req.user.userId,
      dto.currentPassword,
    );

    await this.authService.changePassword(req.user.userId, dto.newPassword);

    await this.usersService.markPasswordChanged(req.user.userId);

    return { success: true };
  }

  // ───────────────── LIST USERS (ADMIN) ─────────────────
  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    const result = await this.authService.requestPasswordReset(dto.email, dto.role);
    return {
      success: true,
      data: result,
    };
  }

  @Get('reset-password/validate')
  async validateResetPasswordToken(@Query('token') token: string) {
    const result = await this.authService.validateResetPasswordToken(token);
    return {
      success: true,
      data: result,
    };
  }

  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    const result = await this.authService.resetPasswordWithToken(
      dto.token,
      dto.newPassword,
    );

    return {
      success: true,
      data: result,
    };
  }
  @Get('users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async getUsers() {
    const users = await this.usersService.getAllUsers();
    return { success: true, data: users };
  }

  // ───────────────── CREATE USER (ADMIN) ─────────────────
  @Post('admin/create-user')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async createUser(@Body() dto: CreateUserDto) {
    return this.authService.createAndSendCredentials(
      dto.email,
      dto.username,
      dto.role,
      dto.firstName,
      dto.lastName,
    );
  }

  // ───────────────── CREATE USER V1 (compatibilité) ─────────────────
  @Post('users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async createUserV1(@Body() dto: CreateUserDto) {
    return this.createUser(dto);
  }

  @Patch('users/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.authService.updateManagedUser(id, {
      email: dto.email,
      username: dto.username || dto.email,
      role: dto.role,
      firstName: dto.firstName,
      lastName: dto.lastName,
    });
  }

  @Delete('users/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  async deleteUser(@Param('id') id: string) {
    return this.authService.deleteManagedUser(id);
  }
}

