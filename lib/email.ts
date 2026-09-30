type EmailMessage = {
  to: string | string[];
  subject: string;
  text: string;
};

/** Sends transactional e-mails through Resend when it is configured. */
export async function sendEmail({ to, subject, text }: EmailMessage) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    console.info("E-mail non envoyé : RESEND_API_KEY ou EMAIL_FROM est absent.");
    return false;
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, subject, text }),
    });

    if (!response.ok) {
      console.error("Échec d’envoi de l’e-mail :", await response.text());
      return false;
    }
    return true;
  } catch (error) {
    console.error("Erreur lors de l’envoi de l’e-mail :", error);
    return false;
  }
}

export async function sendEmails(messages: EmailMessage[]) {
  await Promise.allSettled(messages.map(sendEmail));
}
