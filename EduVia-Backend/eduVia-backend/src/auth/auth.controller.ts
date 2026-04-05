import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Patch,
  Post,
  Request,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

class LoginDto {
  @IsEmail({}, { message: 'Email invalide' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'Le mot de passe doit contenir au moins 6 caracteres' })
  password: string;
}

class ChangePasswordDto {
  @IsString()
  @MinLength(8, {
    message: 'Le nouveau mot de passe doit contenir au moins 8 caracteres',
  })
  newPassword: string;
}

class UpdateProfileDto {
  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsEmail()
  @IsOptional()
  email?: string;
}

@Controller('auth')
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }),
)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    try {
      const result = await this.authService.login(
        loginDto.email,
        loginDto.password,
      );

      return {
        success: true,
        data: result,
        message: 'Connexion reussie',
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        'Echec de la connexion',
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  @Post('logout')
  async logout(@Body() body: { refresh_token: string }) {
    try {
      await this.authService.logout(body.refresh_token);
      return {
        success: true,
        message: 'Deconnexion reussie',
      };
    } catch (_error) {
      throw new HttpException(
        'Echec de la deconnexion',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('refresh')
  async refresh(@Body() body: { refresh_token: string }) {
    try {
      const result = await this.authService.refreshToken(body.refresh_token);
      return {
        success: true,
        data: result,
        message: 'Token rafraichi avec succes',
      };
    } catch (_error) {
      throw new HttpException(
        'Echec du rafraichissement',
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('verify')
  async verifyToken(@Request() req) {
    return {
      success: true,
      data: req.user,
      message: 'Token valide',
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  async changePassword(@Request() req, @Body() dto: ChangePasswordDto) {
    const userId = req.user.userId;
    if (!userId) {
      throw new HttpException(
        'Utilisateur non authentifie',
        HttpStatus.UNAUTHORIZED,
      );
    }

    await this.authService.changePassword(userId, dto.newPassword);

    return {
      success: true,
      message: 'Mot de passe modifie avec succes',
    };
  }

  @Post('forgot-password')
  async forgotPassword(@Body() body: { email: string }) {
    await this.authService.forgotPassword(body.email);
    return {
      success: true,
      message: "Email de reinitialisation envoye (si l'email existe)",
    };
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  async updateProfile(@Request() req, @Body() dto: UpdateProfileDto) {
    const userId = req.user.userId;
    if (!userId) {
      throw new HttpException(
        'Utilisateur non authentifie',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const updated = await this.authService.updateProfile(userId, dto);
    return {
      success: true,
      data: updated,
      message: 'Profil mis a jour',
    };
  }
}
