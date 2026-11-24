// apps/server/src/mail.ts — one way to send a mail; where it goes depends on the environment
import nodemailer from "nodemailer";

export interface Mail {
  subject: string;
  text: string;
  to: string;
}

const FROM = "The office <office@example.com>";

// SMTP_URL in .env: smtp://localhost:1025 is Mailpit (development); production would
// put a real provider here (Resend). Empty, as .env.test has it: printed, not sent
const smtp = Bun.env.SMTP_URL
  ? nodemailer.createTransport(Bun.env.SMTP_URL)
  : undefined;

// the console transport keeps every mail here too, so a test can read the link in it
export const sent: Mail[] = [];

export async function sendMail(mail: Mail) {
  if (!smtp) {
    sent.push(mail);
    console.log(`mail to ${mail.to}: ${mail.subject}`);
    return;
  }
  try {
    await smtp.sendMail({ from: FROM, ...mail });
  } catch (error) {
    // nobody waits for a mail: log it, never fail the request that sent it
    console.error(`mail to ${mail.to} failed:`, error);
  }
}
