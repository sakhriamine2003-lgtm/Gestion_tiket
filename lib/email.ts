import nodemailer from "nodemailer";

type EmailMessage = {
  to: string | string[];
  subject: string;
  text: string;
};

/** Sends transactional e-mails through the configured SMTP server. */
export async function sendEmail({ to, subject, text }: EmailMessage) {
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

    const result = await transporter.sendMail({ to, from, subject, text });
    console.info("Email SMTP envoyé :", { to, messageId: result.messageId });
    return true;
  } catch (error) {
    const smtpError = error as { message?: string; code?: string; responseCode?: number };
    console.error("SMTP ERROR:", {
      message: smtpError.message ?? "Erreur SMTP inconnue.",
      code: smtpError.code,
      responseCode: smtpError.responseCode,
    });
    return false;
  }
}

export async function sendEmails(messages: EmailMessage[]) {
  await Promise.allSettled(messages.map(sendEmail));
}
