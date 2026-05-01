import { Body, Controller, Delete, Get, Param, Post, HttpCode, HttpException, HttpStatus } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get('count')
  async getCount() {
    return { count: await this.users.count() };
  }

  @Post('setup')
  async setup(@Body() body: { email: string; name: string; password: string }) {
    const count = await this.users.count();
    if (count > 0) throw new HttpException('Setup already completed', HttpStatus.CONFLICT);
    return this.users.create(body.email, body.name, body.password, 'admin');
  }

  @Post('login')
  @HttpCode(200)
  async login(@Body() body: { email: string; password: string }) {
    const user = await this.users.validate(body.email, body.password);
    if (!user) throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    return user;
  }

  @Post('invite')
  async invite(@Body() body: { email: string; role?: string }) {
    return this.users.invite(body.email, body.role || 'member');
  }

  @Post('accept-invite')
  async acceptInvite(@Body() body: { token: string; name: string; password: string }) {
    return this.users.acceptInvite(body.token, body.name, body.password);
  }

  @Get()
  async list() {
    return this.users.findAll();
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.users.remove(id);
    return { ok: true };
  }
}
