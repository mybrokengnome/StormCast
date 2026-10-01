import { ImapFlow } from "imapflow";
import { simpleParser, type ParsedMail } from "mailparser";
import { config } from "../config";
import { ImageService, isImageFile } from "./ImageService";

/**
 * Polls an IMAP inbox for unread mail from allowed senders whose subject contains
 * the required keyword, and saves any image attachments to the slideshow folder.
 *
 * Every unread message that is fetched is marked as read, whether or not it was
 * accepted, so a dedicated mailbox is recommended.
 */
export class EmailService {
  private client?: ImapFlow;
  private timer?: NodeJS.Timeout;
  private checking = false;
  private connected = false;
  private lastCheck?: Date;
  private lastError?: string;
  private imagesReceived = 0;

  constructor(private readonly images: ImageService) {}

  start(): void {
    if (!config.email.configured) {
      console.warn("📧 EMAIL_USER / EMAIL_PASSWORD not set; email intake is disabled");
      this.lastError = "Email credentials are not configured";
      return;
    }
    if (config.email.allowedSenders.length === 0) {
      console.warn("📧 ALLOWED_EMAILS is empty; every sender will be rejected");
    }
    console.log(`📧 Starting email service (${config.email.user})...`);
    void this.check();
    this.timer = setInterval(() => void this.check(), config.email.checkIntervalMs);
  }

  async stop(): Promise<void> {
    if (this.timer) clearInterval(this.timer);
    await this.disconnect();
  }

  private async connect(): Promise<ImapFlow> {
    if (this.client?.usable) return this.client;
    await this.disconnect();

    const client = new ImapFlow({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.port === 993,
      auth: { user: config.email.user, pass: config.email.password },
      logger: false,
      connectionTimeout: 20_000,
      greetingTimeout: 20_000,
      socketTimeout: 120_000,
    });

    client.on("error", (error: Error) => {
      this.lastError = error.message;
      this.connected = false;
      console.error("📧 IMAP error:", error.message);
    });
    client.on("close", () => {
      this.connected = false;
    });

    await client.connect();
    this.client = client;
    this.connected = true;
    this.lastError = undefined;
    console.log("📧 Email service connected");
    return client;
  }

  private async disconnect(): Promise<void> {
    const client = this.client;
    this.client = undefined;
    this.connected = false;
    if (!client) return;
    try {
      if (client.usable) await client.logout();
      else client.close();
    } catch {
      /* ignore */
    }
  }

  private async check(): Promise<void> {
    if (this.checking) return;
    this.checking = true;
    try {
      const client = await this.connect();
      const lock = await client.getMailboxLock("INBOX");
      try {
        const uids = await client.search({ seen: false }, { uid: true });
        if (uids && uids.length > 0) {
          console.log(`📧 Found ${uids.length} unread email(s)`);
          const messages = await client.fetchAll(uids, { uid: true, source: true }, { uid: true });
          for (const message of messages) {
            if (message.source) await this.handleMessage(message.source);
          }
          await client.messageFlagsAdd(uids, ["\\Seen"], { uid: true });
        }
      } finally {
        lock.release();
      }
      this.lastCheck = new Date();
      this.lastError = undefined;
    } catch (error) {
      this.lastError = error instanceof Error ? error.message : String(error);
      this.connected = false;
      console.error("📧 Email check failed:", this.lastError);
      await this.disconnect();
    } finally {
      this.checking = false;
    }
  }

  private async handleMessage(source: Buffer): Promise<void> {
    let mail: ParsedMail;
    try {
      mail = await simpleParser(source);
    } catch (error) {
      console.error("📧 Could not parse email:", error);
      return;
    }

    const from = mail.from?.value?.[0]?.address?.toLowerCase() ?? "";
    const subject = mail.subject ?? "";

    if (!config.email.allowedSenders.includes(from)) {
      console.log(`📧 Ignoring email from unauthorized sender: ${from || "unknown"}`);
      return;
    }
    if (!subject.toLowerCase().includes(config.email.requiredSubject)) {
      console.log(`📧 Ignoring email without "${config.email.requiredSubject}" in subject: ${subject}`);
      return;
    }

    const images = mail.attachments.filter((a) => isImageFile(a.filename) || a.contentType.startsWith("image/"));
    if (images.length === 0) {
      console.log(`📧 Email from ${from} had no image attachments`);
      return;
    }

    for (const attachment of images) {
      const name = attachment.filename || `photo.${attachment.contentType.split("/")[1] || "jpg"}`;
      try {
        await this.images.save(name, attachment.content);
        this.imagesReceived += 1;
      } catch (error) {
        console.error("📧 Failed to save attachment:", error);
      }
    }
    console.log(`📧 Saved ${images.length} photo(s) from ${from}`);
  }

  getStatus() {
    return {
      configured: config.email.configured,
      connected: this.connected,
      lastCheck: this.lastCheck?.toISOString() ?? null,
      imagesReceived: this.imagesReceived,
      error: this.lastError ?? null,
    };
  }
}
