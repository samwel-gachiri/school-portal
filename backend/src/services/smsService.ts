import axios from 'axios';
import { config } from '../config/env';
import logger from '../utils/logger';

export interface PaymentModifiedSmsData {
  paymentId: number;
  adm: number;
  studentName: string;
  username: string;
  reason?: string;
  oldAmount: number;
  newAmount: number;
  bank: string;
  ref?: string;
  date: string;
  newBalance: number;
}

export interface PaymentDeletedSmsData {
  paymentId: number;
  adm: number;
  studentName: string;
  username: string;
  reason?: string;
  amount: number;
  bank: string;
  ref?: string;
  date: string;
  newBalance: number;
}

export const smsService = {
  /**
   * Normalizes Kenyan phone numbers to international standard without '+' (e.g. 2547XXXXXXXX)
   */
  normalizeMobileNumber(mobile: string): string {
    let cleaned = mobile.replace(/[^0-9]/g, '');
    if (cleaned.startsWith('0')) {
      cleaned = '254' + cleaned.substring(1);
    } else if (cleaned.startsWith('7') || cleaned.startsWith('1')) {
      cleaned = '254' + cleaned;
    }
    return cleaned;
  },

  /**
   * Dispatches SMS message via TextSMS Kenya API with multiple fallback methods (POST JSON, GET, POST form-urlencoded)
   */
  async sendSms(mobile: string, message: string): Promise<any> {
    const smsConfig = config.sms;
    if (!smsConfig.enabled) {
      logger.info('SMS alerts disabled via SMS_ALERTS_ENABLED=false');
      return null;
    }

    const apiKey = (process.env.SMS_API_KEY || smsConfig.apiKey || '').trim();
    const partnerId = (process.env.SMS_PARTNER_ID || smsConfig.partnerId || '').trim();
    const shortcode = (process.env.SMS_SHORTCODE || smsConfig.shortcode || '').trim();
    const endpoint = (process.env.SMS_API_ENDPOINT || smsConfig.endpoint || 'https://sms.textsms.co.ke/api/services/sendsms/').trim();

    if (!apiKey || !partnerId || !shortcode) {
      logger.warn('SMS credentials not fully configured in environment (SMS_API_KEY, SMS_PARTNER_ID, SMS_SHORTCODE)');
      return null;
    }

    const normalizedMobile = this.normalizeMobileNumber(mobile);
    if (!normalizedMobile) {
      logger.warn(`Invalid recipient phone number: ${mobile}`);
      return null;
    }

    const payload = {
      apikey: apiKey,
      partnerID: partnerId,
      message,
      shortcode,
      mobile: normalizedMobile,
    };

    logger.info(`Sending SMS alert via TextSMS to ${normalizedMobile}: "${message}"`);

    // 1. Try POST with application/json
    try {
      const response = await axios.post(endpoint, payload, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000,
        validateStatus: () => true, // Don't throw immediately so we can inspect response-code
      });

      const data = response.data;
      const respCode = data?.responses?.[0]?.['response-code'];

      if (response.status === 200 && respCode === 200) {
        logger.info(`TextSMS API POST JSON Success: ${JSON.stringify(data)}`);
        return data;
      }

      logger.warn(`TextSMS POST JSON returned status ${response.status} (code: ${respCode}). Attempting GET fallback...`);
    } catch (err: any) {
      logger.warn(`TextSMS POST JSON error: ${err.message}. Trying GET fallback...`);
    }

    // 2. Try GET with query parameters
    try {
      const getResponse = await axios.get(endpoint, {
        params: payload,
        timeout: 10000,
        validateStatus: () => true,
      });

      const getData = getResponse.data;
      const getRespCode = getData?.responses?.[0]?.['response-code'];

      if (getResponse.status === 200 && getRespCode === 200) {
        logger.info(`TextSMS API GET Success: ${JSON.stringify(getData)}`);
        return getData;
      }

      logger.warn(`TextSMS GET returned status ${getResponse.status} (code: ${getRespCode}). Attempting form-urlencoded fallback...`);
    } catch (err: any) {
      logger.warn(`TextSMS GET error: ${err.message}. Trying form-urlencoded fallback...`);
    }

    // 3. Try POST with application/x-www-form-urlencoded
    try {
      const formParams = new URLSearchParams();
      formParams.append('apikey', apiKey);
      formParams.append('partnerID', partnerId);
      formParams.append('message', message);
      formParams.append('shortcode', shortcode);
      formParams.append('mobile', normalizedMobile);

      const formResponse = await axios.post(endpoint, formParams.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 10000,
        validateStatus: () => true,
      });

      const formData = formResponse.data;
      const formRespCode = formData?.responses?.[0]?.['response-code'];

      if (formResponse.status === 200 && formRespCode === 200) {
        logger.info(`TextSMS API Form-Urlencoded Success: ${JSON.stringify(formData)}`);
        return formData;
      }

      // If still invalid credentials, log detailed guidance
      if (formRespCode === 1006 || formResponse.status === 401) {
        logger.error(
          `TextSMS Error 1006 (Invalid credentials) for partnerID='${partnerId}', shortcode='${shortcode}'. Please verify in your textsms.co.ke dashboard that: 1) The API Key and Partner ID are active under 'GET API KEY & PARTNER ID'. 2) The Shortcode '${shortcode}' is registered/assigned to this Partner ID (or whether Sender ID 'TextSMS' should be used).`
        );
      } else {
        logger.error(`TextSMS error response: ${JSON.stringify(formData)}`);
      }

      return formData;
    } catch (err: any) {
      logger.error(`TextSMS all dispatch methods failed: ${err.message || err}`);
      throw err;
    }
  },

  /**
   * Sends an alert message to all recipient numbers specified in SMS_ALERT_RECIPIENT_MOBILE
   */
  async sendAlertToRecipients(message: string): Promise<void> {
    const rawRecipients = config.sms.recipientMobile || process.env.SMS_ALERT_RECIPIENT_MOBILE || '';
    if (!rawRecipients) {
      logger.warn('No SMS_ALERT_RECIPIENT_MOBILE configured');
      return;
    }

    const recipients = rawRecipients.split(',').map((r) => r.trim()).filter(Boolean);

    for (const recipient of recipients) {
      try {
        await this.sendSms(recipient, message);
      } catch (err: any) {
        logger.error(`Error sending SMS alert to ${recipient}: ${err.message || err}`);
      }
    }
  },

  /**
   * Sends an SMS alert when a payment is modified, including user reason
   */
  async notifyPaymentModified(data: PaymentModifiedSmsData): Promise<void> {
    try {
      const formattedOldAmount = Number(data.oldAmount).toLocaleString('en-KE');
      const formattedNewAmount = Number(data.newAmount).toLocaleString('en-KE');
      const formattedNewBalance = Number(data.newBalance).toLocaleString('en-KE');
      const refText = data.ref ? ` Ref: ${data.ref}` : '';
      const reasonText = data.reason ? ` Reason: "${data.reason}".` : '';

      const message = `ALERT: Payment #${data.paymentId} for Adm ${data.adm} (${data.studentName}) was MODIFIED by user '${data.username}'.${reasonText} Amount: KES ${formattedOldAmount} -> KES ${formattedNewAmount}.${refText} Bank: ${data.bank}. New Bal: KES ${formattedNewBalance}.`;

      await this.sendAlertToRecipients(message);
    } catch (error: any) {
      logger.error(`Error in notifyPaymentModified SMS: ${error.message || error}`);
    }
  },

  /**
   * Sends an SMS alert when a payment is deleted, including user reason
   */
  async notifyPaymentDeleted(data: PaymentDeletedSmsData): Promise<void> {
    try {
      const formattedAmount = Number(data.amount).toLocaleString('en-KE');
      const formattedNewBalance = Number(data.newBalance).toLocaleString('en-KE');
      const refText = data.ref ? ` (Ref: ${data.ref})` : '';
      const reasonText = data.reason ? ` Reason: "${data.reason}".` : '';

      const message = `ALERT: Payment #${data.paymentId} of KES ${formattedAmount}${refText} Bank: ${data.bank} for Adm ${data.adm} (${data.studentName}) was DELETED by user '${data.username}'.${reasonText} Restored Bal: KES ${formattedNewBalance}.`;

      await this.sendAlertToRecipients(message);
    } catch (error: any) {
      logger.error(`Error in notifyPaymentDeleted SMS: ${error.message || error}`);
    }
  },
};
