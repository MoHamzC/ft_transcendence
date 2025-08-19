// src/services/EmailService.js
import nodeMailer from 'nodemailer';
import { vaultService } from './VaultService.js';

export class EmailService {
    constructor() {
        this.transporter = null;
        this.isInitialized = false;
    }

    /**
     * Initialise le service email avec les secrets Vault
     */
    async initialize() {
        try {
            // Initialiser Vault si nécessaire
            if (!vaultService.isInitialized) {
                await vaultService.initialize();
            }

            // Récupérer la configuration email depuis Vault
            const emailConfig = await vaultService.getEmailConfig();
            
            this.transporter = nodeMailer.createTransporter({
                host: emailConfig.host,
                port: 587,
                secure: false,
                auth: {
                    user: emailConfig.user,
                    pass: emailConfig.password
                }
            });

            console.log('✅ Email service initialized with Vault secrets');
            this.isInitialized = true;
            
        } catch (error) {
            console.error('❌ Failed to initialize email service with Vault:', error.message);
            
            // Fallback sur les variables d'environnement
            this.initializeFallback();
        }
    }

    /**
     * Initialisation de fallback avec les variables d'environnement
     */
    initializeFallback() {
        console.log('⚠️ Using fallback email configuration from environment variables');
        
        this.transporter = nodeMailer.createTransporter({
            host: process.env.MAIL_HOST || 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: process.env.MAIL_USER,
                pass: process.env.MAIL_PASS
            }
        });
        
        this.isInitialized = true;
    }

    /**
     * Envoie un email de vérification OTP
     * @param {string} to - Destinataire
     * @param {string} otpCode - Code OTP
     */
    async sendOTPEmail(to, otpCode) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        const mailOptions = {
            from: process.env.MAIL_USER || 'noreply@transcendence.com',
            to: to,
            subject: 'Code de vérification - ft_transcendence',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Code de vérification</h2>
                    <p>Votre code de vérification pour ft_transcendence est :</p>
                    <div style="background: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
                        <span style="font-size: 32px; font-weight: bold; color: #2196F3;">${otpCode}</span>
                    </div>
                    <p style="color: #666;">Ce code expire dans 5 minutes.</p>
                    <hr>
                    <p style="font-size: 12px; color: #999;">
                        Cet email a été envoyé automatiquement. Ne pas répondre.
                    </p>
                </div>
            `
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            console.log('📧 OTP email sent successfully:', info.messageId);
            return { success: true, messageId: info.messageId };
            
        } catch (error) {
            console.error('❌ Failed to send OTP email:', error.message);
            throw error;
        }
    }

    /**
     * Test de la configuration email
     */
    async testConnection() {
        if (!this.isInitialized) {
            await this.initialize();
        }

        try {
            await this.transporter.verify();
            console.log('✅ Email service connection verified');
            return true;
        } catch (error) {
            console.error('❌ Email service connection failed:', error.message);
            return false;
        }
    }
}

// Instance singleton
export const emailService = new EmailService();
