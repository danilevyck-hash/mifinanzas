import { Resend } from "resend";

let resend: Resend | null = null;

function getResend() {
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY || "");
  }
  return resend;
}

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  if (!process.env.RESEND_API_KEY) return false;
  try {
    await getResend().emails.send({
      from: "MiFinanzas <onboarding@resend.dev>",
      to,
      subject,
      html,
    });
    return true;
  } catch {
    return false;
  }
}
