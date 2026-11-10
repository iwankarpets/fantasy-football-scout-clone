import { Body, Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { InternalApiKeyGuard } from '../../guards/internal-key.guard';
import { parseWith } from '../common/zod.util';
import { startUserSchema, UsersService } from './users.service';

@ApiTags('users')
@ApiSecurity('internal-key')
@Controller('internal/users')
@UseGuards(InternalApiKeyGuard)
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @Post('start')
  @ApiOperation({ summary: 'Find or create a user by telegram_id (the bot /start)' })
  start(@Body() body: unknown) {
    return this.service.start(parseWith(startUserSchema, body));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user by id' })
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.getById(id);
  }
}
