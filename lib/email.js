import nodemailer from "nodemailer";
/** Sends transactional e-mails through the configured SMTP server. */
export async function sendEmail({ to, subject, text, html, attachments }) {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT);
    const user = process.env.SMTP_USER;
    const password = process.env.SMTP_PASSWORD;
    const from = process.env.MAIL_FROM;
    if (!host || !Number.isInteger(port) || port <= 0 || !user || !password || !from) {
        console.error("E-mail non envoyé : configuration SMTP incomplète.", { to });
        return false;
    }
    try {
        const transporter = nodemailer.createTransport({
            host,
            port,
            secure: process.env.SMTP_SECURE === "true",
            auth: { user, pass: password },
        });
        const result = await transporter.sendMail({ to, from, subject, text, html, attachments });
        console.info("Email SMTP envoyé :", { to, messageId: result.messageId });
        return true;
    }
    catch (error) {
        const smtpError = error;
        console.error("SMTP ERROR:", {
            message: smtpError.message ?? "Erreur SMTP inconnue.",
            code: smtpError.code,
            responseCode: smtpError.responseCode,
        });
        return false;
    }
}
export async function sendEmails(messages) {
    const results = await Promise.allSettled(messages.map(sendEmail));
    return results.map((result) => result.status === "fulfilled" && result.value === true);
}
