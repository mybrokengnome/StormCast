import Imap from "imap";
// @ts-ignore
import { simpleParser } from "mailparser";
import fs from "fs-extra";
import path from "path";

export class EmailService {
  private imap: Imap;
  private isConnected: boolean = false;
  private checkInterval: number;
  private intervalId?: NodeJS.Timeout;
  private imageDirectory: string;
  private allowedEmails: string[];
  private requiredSubject: string;

  constructor() {
    this.checkInterval = parseInt(process.env.EMAIL_CHECK_INTERVAL!) || 30000;
    this.imageDirectory = process.env.IMAGE_DIRECTORY || "./uploads/images";

    // Parse allowed emails from environment
    const allowedEmailsEnv =
      process.env.ALLOWED_EMAILS ||
      "mybrokengnome@gmail.com,arotholz93@gmail.com";
    this.allowedEmails = allowedEmailsEnv
      .split(",")
      .map((email) => email.trim().toLowerCase());

    this.requiredSubject = (
      process.env.REQUIRED_SUBJECT || "slideshow"
    ).toLowerCase();

    this.imap = new Imap({
      user: process.env.EMAIL_USER!,
      password: process.env.EMAIL_PASSWORD!,
      host: process.env.EMAIL_HOST!,
      port: parseInt(process.env.EMAIL_PORT!) || 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false },
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.imap.once("ready", () => {
      console.log("📧 Email service connected");
      this.isConnected = true;
      this.openInbox();
    });

    this.imap.once("error", (err: Error) => {
      console.error("Email connection error:", err);
      this.isConnected = false;
    });

    this.imap.once("end", () => {
      console.log("📧 Email connection ended");
      this.isConnected = false;
    });
  }

  start(): void {
    console.log("📧 Starting email service...");
    this.connect();

    this.intervalId = setInterval(() => {
      if (!this.isConnected) {
        this.connect();
      } else {
        this.checkForNewEmails();
      }
    }, this.checkInterval);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    if (this.isConnected) {
      this.imap.end();
    }
  }

  private connect(): void {
    try {
      this.imap.connect();
    } catch (error) {
      console.error("Failed to connect to email:", error);
    }
  }

  private openInbox(): void {
    this.imap.openBox("INBOX", false, (err, box) => {
      if (err) {
        console.error("Failed to open inbox:", err);
        return;
      }
      this.checkForNewEmails();
    });
  }

  private checkForNewEmails(): void {
    if (!this.isConnected) return;

    // Search for unseen emails
    this.imap.search(["UNSEEN"], (err, results) => {
      if (err) {
        console.error("Email search error:", err);
        return;
      }

      if (results.length === 0) return;

      console.log(`Found ${results.length} new emails`);
      this.processEmails(results);
    });
  }

  private processEmails(emailIds: number[]): void {
    const fetch = this.imap.fetch(emailIds, { bodies: "" });

    fetch.on("message", (msg, seqno) => {
      msg.on("body", (stream) => {
        simpleParser(stream, (err: any, parsed: any) => {
          if (err) {
            console.error("Email parsing error:", err);
            return;
          }

          // Check if email is from allowed sender and has correct subject
          if (this.isValidSlideshowEmail(parsed)) {
            this.processAttachments(parsed);
          } else {
            console.log(
              `📧 Ignoring email from ${parsed.from?.text} with subject: ${parsed.subject}`
            );
          }
        });
      });

      msg.once("attributes", (attrs) => {
        // Mark as read
        this.imap.addFlags(attrs.uid, ["\\Seen"], (err) => {
          if (err) console.error("Failed to mark email as read:", err);
        });
      });
    });

    fetch.once("error", (err) => {
      console.error("Email fetch error:", err);
    });
  }

  private isValidSlideshowEmail(email: any): boolean {
    // Check sender email
    const fromEmail = email.from?.value?.[0]?.address?.toLowerCase();
    if (!fromEmail || !this.allowedEmails.includes(fromEmail)) {
      console.log(`📧 Email from unauthorized sender: ${fromEmail}`);
      return false;
    }

    // Check subject line
    const subject = email.subject?.toLowerCase() || "";
    if (!subject.includes(this.requiredSubject)) {
      console.log(
        `📧 Email missing required subject '${this.requiredSubject}': ${subject}`
      );
      return false;
    }

    console.log(
      `📧 Valid slideshow email from ${fromEmail} with subject: ${email.subject}`
    );
    return true;
  }

  private async processAttachments(email: any): Promise<void> {
    if (!email.attachments || email.attachments.length === 0) return;

    for (const attachment of email.attachments) {
      if (this.isImageFile(attachment.filename)) {
        await this.saveImage(attachment);
      }
    }
  }

  private isImageFile(filename: string): boolean {
    if (!filename) return false;
    const ext = path.extname(filename).toLowerCase();
    return [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"].includes(ext);
  }

  private async saveImage(attachment: any): Promise<void> {
    try {
      const timestamp = Date.now();
      const ext = path.extname(attachment.filename);
      const filename = `image_${timestamp}${ext}`;
      const filepath = path.join(this.imageDirectory, filename);

      await fs.ensureDir(this.imageDirectory);
      await fs.writeFile(filepath, attachment.content);

      console.log(`💾 Saved image: ${filename}`);
    } catch (error) {
      console.error("Failed to save image:", error);
    }
  }

  getStatus(): { connected: boolean } {
    return { connected: this.isConnected };
  }
}
