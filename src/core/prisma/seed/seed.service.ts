import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserRole, Status } from '@prisma/client';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../prisma.service';

@Injectable()
export class SeedService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async run() {
    await this.seedSuperAdmin();
  }

  private async seedSuperAdmin() {
    const fullName = this.config
      .getOrThrow<string>('SEED_SUPERADMIN_FULL_NAME')
      .trim();

    const phone = this.normalizePhone(
      this.config.getOrThrow<string>('SEED_SUPERADMIN_PHONE'),
    );

    const email = this.normalizeEmail(
      this.config.getOrThrow<string>('SEED_SUPERADMIN_EMAIL'),
    );

    const password = this.config.getOrThrow<string>('SEED_SUPERADMIN_PASSWORD');

    const salt = Number(this.config.get<string>('BCRYPT_SALT') ?? 10);

    const passwordHash = await bcrypt.hash(password, salt);

    const user = await this.prisma.user.upsert({
      where: {
        phone,
      },
      update: {
        fullName,
        email,
        passwordHash,
        role: UserRole.SUPERADMIN,
        status: Status.ACTIVE,
        deletedAt: null,
      },
      create: {
        fullName,
        phone,
        email,
        passwordHash,
        role: UserRole.SUPERADMIN,
        status: Status.ACTIVE,
        profile: {
          create: {
            nickname: fullName,
            isCompleted: true,
          },
        },
      },
      select: {
        id: true,
        fullName: true,
        phone: true,
        email: true,
        role: true,
        status: true,
      },
    });

    await this.prisma.profile.upsert({
      where: {
        userId: user.id,
      },
      update: {
        nickname: user.fullName,
        isCompleted: true,
      },
      create: {
        userId: user.id,
        nickname: user.fullName,
        isCompleted: true,
      },
    });

    console.log(`Superadmin seeded: ${user.phone}`);
  }

  private normalizePhone(phone: string) {
    const digits = phone.replace(/\D/g, '');

    if (digits.startsWith('998')) {
      return `+${digits}`;
    }

    if (digits.length === 9) {
      return `+998${digits}`;
    }

    return `+${digits}`;
  }

  private normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }
}