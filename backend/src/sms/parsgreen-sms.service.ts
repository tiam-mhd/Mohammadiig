import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface ParsgreenSendOtpResponse {
  R_Success?: boolean;
  R_Code?: number;
  R_Error?: string | null;
  R_Message?: string | null;
}

@Injectable()
export class ParsgreenSmsService {
  private readonly logger = new Logger(ParsgreenSmsService.name);
  private readonly endpoint = 'https://sms.parsgreen.ir/Apiv2/Message/SendOtp';

  constructor(private readonly config: ConfigService) {}

  /**
   * Sends an OTP SMS via Parsgreen REST Apiv2.
   * Docs: https://documenter.getpostman.com/view/5536918/TzRSh7rr
   * Auth header: `basic apikey:{API_KEY}`
   */
  async sendOtp(mobile: string, code: string): Promise<void> {
    const apiKey = (this.config.get<string>('PARSGREEN_API_KEY') ?? '').trim();
    const addName = this.config.get<string>('PARSGREEN_ADD_NAME', 'true') !== 'false';
    const dryRun = this.config.get<string>('PARSGREEN_DRY_RUN', 'false') === 'true';
    const isDev = this.config.get<string>('NODE_ENV', 'development') !== 'production';

    if (!apiKey || dryRun) {
      this.logger.warn(
        `[Parsgreen] dry-run OTP → ${mobile} code=${code}${apiKey ? '' : ' (no PARSGREEN_API_KEY)'}`,
      );
      if (!apiKey && !isDev && !dryRun) {
        throw new ServiceUnavailableException('سرویس پیامک پیکربندی نشده است.');
      }
      return;
    }

    let response: Response;
    try {
      response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `basic apikey:${apiKey}`,
        },
        body: JSON.stringify({
          Mobile: mobile,
          SmsCode: code,
          AddName: addName,
        }),
      });
    } catch (error) {
      this.logger.error(`[Parsgreen] network error: ${error instanceof Error ? error.message : error}`);
      throw new ServiceUnavailableException('ارسال پیامک با خطا مواجه شد. دوباره تلاش کنید.');
    }

    const rawText = await response.text();
    let payload: ParsgreenSendOtpResponse = {};
    try {
      payload = JSON.parse(rawText) as ParsgreenSendOtpResponse;
    } catch {
      this.logger.error(`[Parsgreen] non-JSON response status=${response.status} body=${rawText.slice(0, 300)}`);
      throw new ServiceUnavailableException('پاسخ نامعتبر از سرویس پیامک دریافت شد.');
    }

    if (!response.ok || payload.R_Success !== true) {
      this.logger.error(
        `[Parsgreen] send failed status=${response.status} code=${payload.R_Code} error=${payload.R_Error ?? payload.R_Message}`,
      );
      throw new ServiceUnavailableException(
        payload.R_Message || payload.R_Error || 'ارسال کد تأیید انجام نشد.',
      );
    }

    this.logger.log(`[Parsgreen] OTP queued for ${mobile}`);
  }
}
