export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  salt: string;
  balance: number;
  role: 'user' | 'admin';
  isBanned: boolean;
  totalSpent: number;
  profileAvatar?: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  validityDays: number;
  description: string;
  fileDownloadUrl: string;
  secretPassword?: string;
  stock: number; // -1 for unlimited
  imageUrl: string;
  isFeatured?: boolean;
  createdAt: string;
}

export interface Purchase {
  id: string;
  userId: string;
  username: string;
  productId: string;
  productName: string;
  category: string;
  price: number;
  fileDownloadUrl: string;
  secretPassword?: string;
  purchasedAt: string;
  expiresAt: string;
  status: 'active' | 'expired';
}

export interface Deposit {
  id: string;
  userId: string;
  username: string;
  method: 'bkash' | 'nagad' | 'rocket';
  accountNumber: string; // The gateway number sent to
  senderNumber: string; // The user's sending phone number
  trxId: string;
  amount: number;
  screenshotUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  adminNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentGateway {
  id: string;
  method: 'bkash' | 'nagad' | 'rocket';
  number: string;
  type: 'Personal' | 'Merchant' | 'Agent';
  instructions: string;
  minDeposit: number;
  maxDeposit: number;
  isActive: boolean;
}

export interface PromoCode {
  id: string;
  code: string;
  rewardType: 'balance_credit' | 'percentage_discount';
  value: number; // e.g. 50 Taka or 10%
  minDepositRequired?: number;
  maxUses: number;
  usedCount: number;
  usedByUsers: string[];
  expiresAt: string;
  isActive: boolean;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  type: 'info' | 'warning' | 'announcement';
  isActive: boolean;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  username: string;
  subject: string;
  message: string;
  reply?: string;
  status: 'open' | 'answered' | 'closed';
  createdAt: string;
  updatedAt: string;
}

export interface AdminLog {
  id: string;
  action: string;
  details: string;
  ip?: string;
  timestamp: string;
}

export interface TelegramBot {
  id: string;
  name: string;
  botToken: string;
  chatId: string;
  botUsername?: string;
  isActive: boolean;
  webhookEnabled: boolean;
  createdAt: string;
  lastAlertSent?: string;
  lastTestStatus?: string;
}

export interface SiteSettings {
  siteName: string;
  siteLogo: string;
  currencySymbol: string;
  contactEmail: string;
  telegramChannel: string;
  telegramBotUser: string;
  noticeMarquee: string;
  minDeposit: number;
  maxDeposit: number;
  defaultAdminPasswordChanged: boolean;
}

export interface DatabaseSchema {
  users: User[];
  products: Product[];
  purchases: Purchase[];
  deposits: Deposit[];
  paymentGateways: PaymentGateway[];
  promoCodes: PromoCode[];
  notices: Notice[];
  supportTickets: SupportTicket[];
  adminLogs: AdminLog[];
  telegramBots: TelegramBot[];
  siteSettings: SiteSettings;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: Omit<User, 'passwordHash' | 'salt'>;
  message?: string;
}
