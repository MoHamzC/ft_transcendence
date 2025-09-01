// src/utils/email.js
// Service email centralisé
import nodeMailer from 'nodemailer'

/**
 * Configuration du transporteur email
 */
export const createEmailTransporter = () => {
    return nodeMailer.createTransporter({
        host: process.env.MAIL_HOST,
        port: process.env.MAIL_PORT || 587,
        secure: false,
        auth: {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS
        }
    })
}

/**
 * Envoyer un email OTP
 * @param {string} email - Email destinataire
 * @param {string} otp - Code OTP
 */
export const sendOtpEmail = async (email, otp) => {
    const transporter = createEmailTransporter()

    const mailOptions = {
        from: process.env.MAIL_FROM || process.env.MAIL_USER,
        to: email,
        subject: 'Code de vérification ft_transcendence',
        html: `
            <h2>Code de vérification</h2>
            <p>Votre code de vérification est : <strong>${otp}</strong></p>
            <p>Ce code expire dans 10 minutes.</p>
        `
    }

    return transporter.sendMail(mailOptions)
}
