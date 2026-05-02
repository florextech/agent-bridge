import { Controller, Get } from '@nestjs/common';

@Controller('terminal')
export class TerminalController {
  @Get('status')
  getStatus(): { enabled: boolean } {
    return { enabled: process.env['TERMINAL_ENABLED'] === 'true' };
  }
}
