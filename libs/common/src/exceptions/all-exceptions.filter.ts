import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import { AppException } from './app.exception';

interface HttpRes {
  status(code: number): { json(body: unknown): void };
}
interface HttpReq {
  method?: string;
  url?: string;
}


@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const http = host.switchToHttp();
    const res = http.getResponse<HttpRes>();
    const req = http.getRequest<HttpReq>();

    let status = 500;
    let body: { code: string; message: unknown } = {
      code: 'INTERNAL_ERROR',
      message: 'Internal server error',
    };

    if (exception instanceof AppException) {
      status = exception.status;
      body = { code: exception.code, message: exception.message };
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const r = exception.getResponse();
      const message =
        typeof r === 'string' ? r : ((r as { message?: unknown }).message ?? exception.message);
      body = { code: `HTTP_${status}`, message };
    }

    const where = `${req.method ?? '?'} ${req.url ?? '?'} -> ${status}`;
    const reason = exception instanceof Error ? exception.message : String(exception);
    if (status >= 500) {
      this.logger.error(`${where}: ${reason}`, exception instanceof Error ? exception.stack : undefined);
    } else {
      this.logger.warn(`${where}: ${reason}`);
    }

    res.status(status).json(body);
  }
}