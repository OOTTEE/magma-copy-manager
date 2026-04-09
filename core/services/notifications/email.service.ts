import nodemailer from 'nodemailer';
import { settingsService } from '../settings/settings.service';
import { logger } from '../../lib/logger';

/**
 * Email Service
 * 
 * Handles SMTP configuration and sending of system notifications.
 */
export class EmailService {
    /**
     * Creates a nodemailer transport based on current system settings.
     */
    private async getTransporter() {
        const host = await settingsService.getSetting('smtp_host');
        const port = parseInt(await settingsService.getSetting('smtp_port'), 10) || 587;
        const user = await settingsService.getSetting('smtp_user');
        const pass = await settingsService.getSecretSetting('smtp_password');
        const secure = (await settingsService.getSetting('smtp_secure')) === 'true';

        if (!host || !user || !pass) {
            throw new Error('SMTP configuration missing.');
        }

        return nodemailer.createTransport({
            host,
            port,
            secure,
            auth: {
                user,
                pass,
            },
        });
    }

    /**
     * Generic method to send an email notification.
     */
    async sendNotification(options: {
        subject: string;
        title: string;
        message: string;
        type: 'success' | 'error' | 'info' | 'warning';
        details?: string;
    }) {
        try {
            const enabled = (await settingsService.getSetting('email_notifications_enabled')) === 'true';
            const recipient = await settingsService.getSetting('email_recipient');

            if (!enabled || !recipient) {
                logger.info('EmailService: Notifications disabled or recipient missing.');
                return;
            }

            const transporter = await this.getTransporter();
            const color = options.type === 'success' ? '#10b981' : options.type === 'error' ? '#ef4444' : options.type === 'warning' ? '#f59e0b' : '#3b82f6';

            const html = `
            <!DOCTYPE html>
            <html>
                <body style="background-color: #030712; color: #f3f4f6; font-family: 'Outfit', sans-serif; padding: 20px; margin: 0;">
                    <div style="max-width: 600px; margin: 0 auto; background-color: #111827; border: 1px solid #1f2937; border-radius: 12px; overflow: hidden; border-top: 4px solid ${color};">
                        <div style="padding: 24px; border-bottom: 1px solid #1f2937; background-color: rgba(59, 130, 246, 0.05);">
                            <h1 style="margin: 0; font-size: 20px; color: ${color};">Magma Notification</h1>
                            <p style="margin: 4px 0 0; color: #9ca3af; font-size: 14px;">${new Date().toLocaleString()}</p>
                        </div>
                        <div style="padding: 24px;">
                            <h2 style="margin: 0 0 16px; font-size: 18px;">${options.title}</h2>
                            <p style="margin: 0 0 24px; line-height: 1.6; color: #d1d5db;">${options.message}</p>
                            
                            ${options.details ? `
                            <div style="background-color: #030712; border: 1px solid #1f2937; border-radius: 8px; padding: 16px; font-family: monospace; font-size: 12px; color: #96d8ff; overflow-x: auto;">
                                <pre style="margin: 0;">${options.details}</pre>
                            </div>
                            ` : ''}
                        </div>
                        <div style="padding: 24px; background-color: #030712; border-top: 1px solid #1f2937; text-align: center;">
                            <p style="margin: 0; font-size: 12px; color: #6b7280;">Este es un mensaje automático de tu instancia de Magma.</p>
                        </div>
                    </div>
                </body>
            </html>
            `;

            await transporter.sendMail({
                from: `"Magma Admin" <${await settingsService.getSetting('smtp_user')}>`,
                to: recipient,
                subject: `[Magma] ${options.subject}`,
                html,
            });

            logger.info({ recipient, subject: options.subject }, 'EmailService: Notification sent');
        } catch (err: any) {
            logger.error(err, 'EmailService: Failed to send email');
        }
    }

    /**
     * Test SMTP connection.
     */
    async testConnection() {
        const transporter = await this.getTransporter();
        await transporter.verify();
        
        const recipient = await settingsService.getSetting('email_recipient');
        if (recipient) {
            await this.sendNotification({
                subject: 'Prueba de Conexión',
                title: '✅ Conexión SMTP Exitosa',
                message: 'Si estás leyendo este correo, la configuración de notificaciones en Magma funciona correctamente.',
                type: 'success'
            });
        }
    }
}

export const emailService = new EmailService();
