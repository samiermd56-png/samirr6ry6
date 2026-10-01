import { Product, Purchase, Deposit, PaymentGateway, PromoCode, Notice, SupportTicket, TelegramBot, SiteSettings, User } from '../types/index.ts';

const USER_TOKEN_KEY = 'digivault_user_token';
const ADMIN_TOKEN_KEY = 'digivault_admin_token';

export function getUserToken(): string | null {
  return localStorage.getItem(USER_TOKEN_KEY);
}

export function setUserToken(token: string): void {
  localStorage.setItem(USER_TOKEN_KEY, token);
}

export function removeUserToken(): void {
  localStorage.removeItem(USER_TOKEN_KEY);
}

export function getAdminToken(): string | null {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function setAdminToken(token: string): void {
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
}

export function removeAdminToken(): void {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');

  const userToken = getUserToken();
  if (userToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${userToken}`);
  }

  const adminToken = getAdminToken();
  if (adminToken && !headers.has('x-admin-token')) {
    headers.set('x-admin-token', adminToken);
  }

  const res = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Request failed');
  }
  return data as T;
}

export const api = {
  // Public & User APIs
  getSiteSettings: () => request<{ success: boolean; settings: SiteSettings & { activeGatewaysCount: number; productsCount: number } }>('/api/site-settings'),
  getProducts: () => request<{ success: boolean; products: Product[] }>('/api/products'),
  getGateways: () => request<{ success: boolean; gateways: PaymentGateway[] }>('/api/payment-gateways'),
  getNotices: () => request<{ success: boolean; notices: Notice[] }>('/api/notices'),

  // Auth APIs
  register: (body: { username: string; email: string; password: string }) =>
    request<{ success: boolean; token: string; user: User; message: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  login: (body: { usernameOrEmail: string; password: string }) =>
    request<{ success: boolean; token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  getMe: () => request<{ success: boolean; user: User }>('/api/auth/me'),

  updateProfile: (body: { email?: string; profileAvatar?: string; newPassword?: string }) =>
    request<{ success: boolean; user: User; message: string }>('/api/user/profile', {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  buyProduct: (productId: string) =>
    request<{ success: boolean; message: string; purchase: Purchase; newBalance: number }>(`/api/products/${productId}/buy`, {
      method: 'POST',
    }),

  getPurchases: () => request<{ success: boolean; purchases: Purchase[] }>('/api/user/purchases'),
  getLedger: () => request<{ success: boolean; deposits: Deposit[]; purchases: Purchase[] }>('/api/user/ledger'),

  submitDeposit: (body: { method: string; accountNumber: string; senderNumber: string; trxId: string; amount: number }) =>
    request<{ success: boolean; message: string; deposit: Deposit }>('/api/deposits', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  redeemPromo: (code: string) =>
    request<{ success: boolean; message: string; newBalance: number }>('/api/promo/redeem', {
      method: 'POST',
      body: JSON.stringify({ code }),
    }),

  getTickets: () => request<{ success: boolean; tickets: SupportTicket[] }>('/api/tickets'),
  createTicket: (subject: string, message: string) =>
    request<{ success: boolean; message: string; ticket: SupportTicket }>('/api/tickets', {
      method: 'POST',
      body: JSON.stringify({ subject, message }),
    }),

  // Admin APIs
  adminLogin: (password: string) =>
    request<{ success: boolean; token: string; message: string }>('/api/admin/login', {
      method: 'POST',
      body: JSON.stringify({ password }),
    }),

  getAdminOverview: () => request<{
    success: boolean;
    analytics: {
      totalUsers: number;
      totalProducts: number;
      totalSalesCount: number;
      totalRevenue: number;
      totalDepositsApproved: number;
      pendingDepositsCount: number;
      totalUserBalanceLiability: number;
      estimatedProfit: number;
      activeBotsCount: number;
      maxBotsLimit: number;
      openTicketsCount: number;
      dailyReports: { date: string; sales: number; deposits: number }[];
    };
  }>('/api/admin/overview'),

  getAdminUsers: () => request<{ success: boolean; users: User[] }>('/api/admin/users'),

  updateUserBalance: (userId: string, amount: number, action: 'add' | 'deduct', reason?: string) =>
    request<{ success: boolean; message: string; newBalance: number }>(`/api/admin/users/${userId}/balance`, {
      method: 'PUT',
      body: JSON.stringify({ amount, action, reason }),
    }),

  toggleUserBan: (userId: string) =>
    request<{ success: boolean; isBanned: boolean; message: string }>(`/api/admin/users/${userId}/ban`, {
      method: 'PUT',
    }),

  resetUserPassword: (userId: string, newPassword: string) =>
    request<{ success: boolean; message: string }>(`/api/admin/users/${userId}/reset-password`, {
      method: 'PUT',
      body: JSON.stringify({ newPassword }),
    }),

  getAdminDeposits: () => request<{ success: boolean; deposits: Deposit[] }>('/api/admin/deposits'),

  updateDepositStatus: (depositId: string, status: 'approved' | 'rejected', adminNote?: string) =>
    request<{ success: boolean; message: string }>(`/api/admin/deposits/${depositId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, adminNote }),
    }),

  getAdminGateways: () => request<{ success: boolean; gateways: PaymentGateway[] }>('/api/admin/payment-gateways'),

  createGateway: (data: Partial<PaymentGateway>) =>
    request<{ success: boolean; gateway: PaymentGateway; message: string }>('/api/admin/payment-gateways', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateGateway: (id: string, data: Partial<PaymentGateway>) =>
    request<{ success: boolean; gateway: PaymentGateway; message: string }>(`/api/admin/payment-gateways/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteGateway: (id: string) =>
    request<{ success: boolean; message: string }>(`/api/admin/payment-gateways/${id}`, {
      method: 'DELETE',
    }),

  createProduct: (data: Partial<Product>) =>
    request<{ success: boolean; product: Product; message: string }>('/api/admin/products', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateProduct: (id: string, data: Partial<Product>) =>
    request<{ success: boolean; product: Product; message: string }>(`/api/admin/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteProduct: (id: string) =>
    request<{ success: boolean; message: string }>(`/api/admin/products/${id}`, {
      method: 'DELETE',
    }),

  getTelegramBots: () =>
    request<{ success: boolean; bots: TelegramBot[]; currentCount: number; maxLimit: number }>('/api/admin/telegram-bots'),

  createTelegramBot: (name: string, botToken: string, chatId: string) =>
    request<{ success: boolean; bot: TelegramBot; message: string }>('/api/admin/telegram-bots', {
      method: 'POST',
      body: JSON.stringify({ name, botToken, chatId }),
    }),

  testTelegramBot: (botId: string) =>
    request<{ success: boolean; message: string }>(`/api/admin/telegram-bots/${botId}/test`, {
      method: 'POST',
    }),

  deleteTelegramBot: (botId: string) =>
    request<{ success: boolean; message: string }>(`/api/admin/telegram-bots/${botId}`, {
      method: 'DELETE',
    }),

  getAdminPromoCodes: () => request<{ success: boolean; promoCodes: PromoCode[] }>('/api/admin/promo-codes'),
  createPromoCode: (data: Partial<PromoCode>) =>
    request<{ success: boolean; promoCode: PromoCode; message: string }>('/api/admin/promo-codes', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  deletePromoCode: (id: string) =>
    request<{ success: boolean; message: string }>(`/api/admin/promo-codes/${id}`, {
      method: 'DELETE',
    }),

  getAdminNotices: () => request<{ success: boolean; notices: Notice[] }>('/api/admin/notices'),
  createNotice: (title: string, content: string, type: 'info' | 'warning' | 'announcement') =>
    request<{ success: boolean; notice: Notice; message: string }>('/api/admin/notices', {
      method: 'POST',
      body: JSON.stringify({ title, content, type }),
    }),
  deleteNotice: (id: string) =>
    request<{ success: boolean; message: string }>(`/api/admin/notices/${id}`, {
      method: 'DELETE',
    }),

  getAdminTickets: () => request<{ success: boolean; tickets: SupportTicket[] }>('/api/admin/tickets'),
  replyTicket: (id: string, reply: string, status: 'answered' | 'closed') =>
    request<{ success: boolean; ticket: SupportTicket; message: string }>(`/api/admin/tickets/${id}/reply`, {
      method: 'PUT',
      body: JSON.stringify({ reply, status }),
    }),

  updateSiteSettings: (data: any) =>
    request<{ success: boolean; settings: SiteSettings; message: string }>('/api/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  getAdminLogs: () => request<{ success: boolean; logs: any[] }>('/api/admin/logs'),
};
