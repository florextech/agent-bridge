import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async count(): Promise<number> {
    return this.prisma.user.count();
  }

  async create(email: string, name: string, password: string, role: string) {
    const hashed = await bcrypt.hash(password, 10);
    const user = await this.prisma.user.create({ data: { email, name, password: hashed, role } });
    return this.sanitize(user);
  }

  async validate(email: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return null;
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return null;
    return this.sanitize(user);
  }

  async invite(email: string, role: string) {
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const invitation = await this.prisma.invitation.create({ data: { email, role, token, expiresAt } });

    const webUrl = process.env['WEB_URL'] ?? 'http://localhost:3000';
    const resendApiKey = process.env['RESEND_API_KEY'];
    const resendFrom = process.env['RESEND_FROM'] ?? 'Agent Bridge <noreply@resend.dev>';

    if (resendApiKey) {
      const acceptUrl = `${webUrl}/accept-invite?token=${token}`;
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${resendApiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: resendFrom,
          to: [email],
          subject: "You're invited to Agent Bridge",
          html: this.invitationHtml(acceptUrl),
        }),
      }).catch(() => { /* fire-and-forget: email delivery failure is non-critical */ });
    }

    return invitation;
  }

  async acceptInvite(token: string, name: string, password: string) {
    const inv = await this.prisma.invitation.findUnique({ where: { token } });
    if (!inv) throw new HttpException('Invalid token', HttpStatus.BAD_REQUEST);
    if (inv.expiresAt < new Date()) throw new HttpException('Token expired', HttpStatus.BAD_REQUEST);

    const existing = await this.prisma.user.findUnique({ where: { email: inv.email } });
    if (existing) throw new HttpException('User already exists', HttpStatus.CONFLICT);

    const user = await this.create(inv.email, name, password, inv.role);
    await this.prisma.invitation.delete({ where: { id: inv.id } });
    return user;
  }

  async findAll() {
    const users = await this.prisma.user.findMany({ orderBy: { createdAt: 'desc' } });
    return users.map((u) => this.sanitize(u));
  }

  async remove(id: string) {
    await this.prisma.user.delete({ where: { id } });
  }

  private sanitize(user: { id: string; email: string; name: string | null; role: string; createdAt: Date }) {
    return { id: user.id, email: user.email, name: user.name, role: user.role, createdAt: user.createdAt };
  }

  private invitationHtml(acceptUrl: string): string {
    return `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#111513;color:#eee;border-radius:12px">
      <h2 style="margin:0 0 8px;color:#fff">You're invited to Agent Bridge</h2>
      <p style="color:#b8c4ba;line-height:1.6">You've been invited to join Agent Bridge. Click the button below to create your account.</p>
      <a href="${acceptUrl}" style="display:inline-block;margin:24px 0;padding:12px 24px;background:#76b73d;color:#111513;font-weight:600;text-decoration:none;border-radius:8px">Accept Invitation</a>
      <hr style="border:none;border-top:1px solid #2a2f2c;margin:24px 0" />
      <p style="font-size:12px;color:#6b7c6e">This link expires in 7 days.</p>
    </div>`;
  }
}
