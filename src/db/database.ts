import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { DatabaseSchema, User, Product, PaymentGateway, PromoCode, Notice, SiteSettings } from '../types/index.ts';

const DB_DIR = path.resolve(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'database.json');
const TEMP_PATH = path.join(DB_DIR, 'database.json.tmp');

export function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

export function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

export function verifyPassword(password: string, salt: string, expectedHash: string): boolean {
  const hash = hashPassword(password, salt);
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(expectedHash, 'hex'));
}

const defaultAdminSalt = generateSalt();
const defaultAdminHash = hashPassword('1234', defaultAdminSalt);

const defaultUserSalt = generateSalt();
const defaultUserHash = hashPassword('password123', defaultUserSalt);

const initialSeedData: DatabaseSchema = {
  users: [
    {
      id: 'usr_admin',
      username: 'admin',
      email: 'admin@digivault.io',
      passwordHash: defaultAdminHash,
      salt: defaultAdminSalt,
      balance: 100000,
      role: 'admin',
      isBanned: false,
      totalSpent: 0,
      profileAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'usr_demo',
      username: 'demo_user',
      email: 'samiermd56@gmail.com',
      passwordHash: defaultUserHash,
      salt: defaultUserSalt,
      balance: 3500,
      role: 'user',
      isBanned: false,
      totalSpent: 1250,
      profileAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      createdAt: new Date().toISOString(),
    },
  ],
  products: [
    {
      id: 'prod_1',
      name: 'CyberGuard VPN & Cloud Proxy Suite',
      category: 'Security',
      price: 650,
      validityDays: 365,
      description: 'Ultra-fast dedicated server VPN with military-grade 256-bit AES encryption, WireGuard protocol, unlimited bandwidth, and 60+ worldwide server locations. Instant activation credentials.',
      fileDownloadUrl: 'https://download.digivault.io/packages/cyberguard-vpn-v4.2.zip',
      secretPassword: 'CG-SECURE-KEY-88921-VIP',
      stock: 45,
      imageUrl: '/src/assets/images/product_vpn_suite_1790839132343.jpg',
      isFeatured: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'prod_2',
      name: 'DevFlow Pro UI Component Library & SaaS Boilerplate',
      category: 'Developer Tools',
      price: 1200,
      validityDays: 999,
      description: 'Production-ready Next.js & React full-stack boilerplate with clean Tailwind CSS components, Stripe/LemonSqueezy billing, authentication, and database schemas. Commercial license included.',
      fileDownloadUrl: 'https://github.com/digivault-repos/devflow-pro-master-release.zip',
      secretPassword: 'DEVFLOW-LICENSE-TOKEN-2026-XQ',
      stock: 100,
      imageUrl: '/src/assets/images/product_saas_code_1790839144163.jpg',
      isFeatured: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'prod_3',
      name: 'PrimeStream 4K Ultra Premium 1-Year Pass',
      category: 'Entertainment',
      price: 450,
      validityDays: 365,
      description: 'Private 4K HDR Ultra Streaming account with 4-device simultaneous access, Dolby Atmos audio, and offline download support. Guaranteed full 1-year replacement warranty.',
      fileDownloadUrl: 'https://credentials.digivault.io/vault/primestream-credentials-guide.pdf',
      secretPassword: 'PRIME-4K-USER:pass4k99120',
      stock: 18,
      imageUrl: '/src/assets/images/product_stream_pass_1790839154979.jpg',
      isFeatured: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'prod_4',
      name: 'Master AI Engineering & Neural Networks Bootcamp',
      category: 'Education',
      price: 850,
      validityDays: 180,
      description: 'Complete hands-on curriculum: Transformers, LLM fine-tuning, RAG architectures, and agentic workflows. Includes 45 hours of video tutorials, Jupyter notebooks, and certificate.',
      fileDownloadUrl: 'https://vault.digivault.io/courses/ai-engineering-complete-archive.tar.gz',
      secretPassword: 'AI-ACADEMY-PASS-2026-NEURAL',
      stock: 50,
      imageUrl: '/src/assets/images/product_ai_course_1790839165323.jpg',
      isFeatured: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'prod_5',
      name: 'Canva Pro Education Lifetime Team Seat',
      category: 'Design & Graphics',
      price: 320,
      validityDays: 730,
      description: 'Personal team invite to Canva Pro with unlimited brand kits, premium stock templates, background remover, magic studio AI tools, and 1TB cloud storage.',
      fileDownloadUrl: 'https://invite.digivault.io/canva/join-team-auto-link.txt',
      secretPassword: 'CANVA-TEAM-KEY-9934',
      stock: 35,
      imageUrl: '/src/assets/images/product_vpn_suite_1790839132343.jpg',
      isFeatured: false,
      createdAt: new Date().toISOString(),
    }
  ],
  purchases: [
    {
      id: 'pur_101',
      userId: 'usr_demo',
      username: 'demo_user',
      productId: 'prod_1',
      productName: 'CyberGuard VPN & Cloud Proxy Suite',
      category: 'Security',
      price: 650,
      fileDownloadUrl: 'https://download.digivault.io/packages/cyberguard-vpn-v4.2.zip',
      secretPassword: 'CG-SECURE-KEY-88921-VIP',
      purchasedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      expiresAt: new Date(Date.now() + 86400000 * 362).toISOString(),
      status: 'active',
    }
  ],
  deposits: [
    {
      id: 'dep_1',
      userId: 'usr_demo',
      username: 'demo_user',
      method: 'bkash',
      accountNumber: '01712-345678',
      senderNumber: '01700-112233',
      trxId: 'BK9A8B7C6D',
      amount: 1000,
      status: 'approved',
      adminNote: 'Verified & Credited',
      createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
      updatedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    }
  ],
  paymentGateways: [
    {
      id: 'gw_1',
      method: 'bkash',
      number: '01712-345678',
      type: 'Personal',
      instructions: 'Go to your bKash App or dial *247# -> Select "Send Money" -> Enter the bKash Personal Number below -> Enter Amount -> After successful payment, copy the Transaction ID (TrxID) and submit it below.',
      minDeposit: 100,
      maxDeposit: 25000,
      isActive: true,
    },
    {
      id: 'gw_2',
      method: 'nagad',
      number: '01898-765432',
      type: 'Personal',
      instructions: 'Open Nagad App or dial *167# -> Select "Send Money" -> Enter the Nagad Personal Number below -> Enter Amount -> Copy the 8-character TrxID and submit with your sending number.',
      minDeposit: 100,
      maxDeposit: 25000,
      isActive: true,
    },
    {
      id: 'gw_3',
      method: 'rocket',
      number: '01911-223344-5',
      type: 'Personal',
      instructions: 'Open Rocket App or dial *322# -> Select "Send Money" -> Enter Rocket Account Number -> Submit Transaction ID.',
      minDeposit: 100,
      maxDeposit: 25000,
      isActive: true,
    }
  ],
  promoCodes: [
    {
      id: 'promo_1',
      code: 'WELCOME100',
      rewardType: 'balance_credit',
      value: 100,
      maxUses: 500,
      usedCount: 14,
      usedByUsers: [],
      expiresAt: new Date(Date.now() + 86400000 * 90).toISOString(),
      isActive: true,
    },
    {
      id: 'promo_2',
      code: 'BONUS50',
      rewardType: 'balance_credit',
      value: 50,
      maxUses: 1000,
      usedCount: 28,
      usedByUsers: [],
      expiresAt: new Date(Date.now() + 86400000 * 60).toISOString(),
      isActive: true,
    }
  ],
  notices: [
    {
      id: 'not_1',
      title: 'Welcome to DigiVault Store & Telegram WebApp',
      content: 'Purchase digital products with instant delivery. Your download links and license keys unlock immediately in My Purchases upon payment. For Telegram users, tap Open Web Store anytime!',
      type: 'announcement',
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'not_2',
      title: 'Manual Deposit Verification Times',
      content: 'All bKash, Nagad, and Rocket deposits are processed quickly. Make sure to input the exact TrxID and sender mobile number.',
      type: 'info',
      isActive: true,
      createdAt: new Date().toISOString(),
    }
  ],
  supportTickets: [
    {
      id: 'tkt_1',
      userId: 'usr_demo',
      username: 'demo_user',
      subject: 'Inquiry regarding WireGuard config download',
      message: 'Hi, where do I download the WireGuard configuration file after purchase?',
      reply: 'Hello! You can click "My Purchases" tab at the top or inside the dashboard. Click "Download File" to get your archive instantly.',
      status: 'answered',
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      updatedAt: new Date(Date.now() - 86400000).toISOString(),
    }
  ],
  adminLogs: [
    {
      id: 'log_1',
      action: 'SYSTEM_BOOT',
      details: 'DigiVault production database initialized with permanent file persistence.',
      timestamp: new Date().toISOString(),
    }
  ],
  telegramBots: [],
  siteSettings: {
    siteName: 'DigiVault',
    siteLogo: '🛡️',
    currencySymbol: '৳',
    contactEmail: 'support@digivault.io',
    telegramChannel: 'https://t.me/DigiVaultStore',
    telegramBotUser: '@DigiVaultShopBot',
    noticeMarquee: '⚡ Instant Digital Delivery 24/7 · 100% Guaranteed Replacements · bKash / Nagad / Rocket Accepted',
    minDeposit: 100,
    maxDeposit: 25000,
    defaultAdminPasswordChanged: false,
  }
};

class DatabaseManager {
  private db: DatabaseSchema;

  constructor() {
    this.db = this.loadDatabase();
  }

  private loadDatabase(): DatabaseSchema {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_PATH)) {
      try {
        const raw = fs.readFileSync(DB_PATH, 'utf-8');
        const parsed = JSON.parse(raw);
        // Ensure all required collections exist
        return {
          users: parsed.users || initialSeedData.users,
          products: parsed.products || initialSeedData.products,
          purchases: parsed.purchases || initialSeedData.purchases,
          deposits: parsed.deposits || initialSeedData.deposits,
          paymentGateways: parsed.paymentGateways || initialSeedData.paymentGateways,
          promoCodes: parsed.promoCodes || initialSeedData.promoCodes,
          notices: parsed.notices || initialSeedData.notices,
          supportTickets: parsed.supportTickets || initialSeedData.supportTickets,
          adminLogs: parsed.adminLogs || initialSeedData.adminLogs,
          telegramBots: parsed.telegramBots || initialSeedData.telegramBots,
          siteSettings: { ...initialSeedData.siteSettings, ...(parsed.siteSettings || {}) }
        };
      } catch (err) {
        console.error('Error reading database file, using initial seed:', err);
      }
    }

    this.saveDatabaseSync(initialSeedData);
    return initialSeedData;
  }

  private saveDatabaseSync(data: DatabaseSchema): void {
    try {
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      const serialized = JSON.stringify(data, null, 2);
      // Atomic write: write to temp file then rename
      fs.writeFileSync(TEMP_PATH, serialized, 'utf-8');
      fs.renameSync(TEMP_PATH, DB_PATH);
    } catch (err) {
      console.error('Failed to write database file:', err);
    }
  }

  public getData(): DatabaseSchema {
    return this.db;
  }

  public persist(): void {
    this.saveDatabaseSync(this.db);
  }

  public logAdmin(action: string, details: string, ip?: string): void {
    this.db.adminLogs.unshift({
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      action,
      details,
      ip,
      timestamp: new Date().toISOString()
    });
    // Keep max 500 logs
    if (this.db.adminLogs.length > 500) {
      this.db.adminLogs = this.db.adminLogs.slice(0, 500);
    }
    this.persist();
  }
}

export const dbManager = new DatabaseManager();
export const db = dbManager.getData();
