import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'node:path';
import crypto from 'node:crypto';
import dotenv from 'dotenv';
import { db, dbManager, hashPassword, generateSalt, verifyPassword } from './src/db/database.ts';
import {
  sendTelegramMessage,
  configureTelegramMenuButton,
  setTelegramWebhook,
  deleteTelegramWebhook,
  getBotProfile,
  broadcastAlertToAllBots
} from './src/server/telegram.ts';
import { User, Product, Deposit, PaymentGateway, PromoCode, Notice, TelegramBot } from './src/types/index.ts';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const APP_URL = (process.env.APP_URL || `http://localhost:${PORT}`).replace(/\/$/, '');

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static serving for product images (ensures images load seamlessly inside Telegram Bot and WebApp)
app.use('/images', express.static(path.resolve(process.cwd(), 'public/images')));
app.use('/public', express.static(path.resolve(process.cwd(), 'public')));
app.use('/src/assets/images', express.static(path.resolve(process.cwd(), 'src/assets/images')));

// Simple in-memory session tokens store
const userSessions = new Map<string, string>(); // token -> userId
const adminSessions = new Set<string>(); // admin tokens

function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Auth Middlewares
function authenticateUser(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({ success: false, message: 'Authentication required' });
    return;
  }
  const token = authHeader.replace(/^Bearer\s+/i, '');
  const userId = userSessions.get(token);
  if (!userId) {
    res.status(401).json({ success: false, message: 'Invalid or expired session' });
    return;
  }
  const user = db.users.find(u => u.id === userId);
  if (!user) {
    res.status(401).json({ success: false, message: 'User not found' });
    return;
  }
  if (user.isBanned) {
    res.status(403).json({ success: false, message: 'Account is banned by administration' });
    return;
  }
  (req as any).user = user;
  next();
}

function authenticateAdmin(req: Request, res: Response, next: NextFunction): void {
  const adminToken = req.headers['x-admin-token'] as string || (req.headers.authorization ? req.headers.authorization.replace(/^Bearer\s+/i, '') : '');
  if (!adminToken || !adminSessions.has(adminToken)) {
    res.status(403).json({ success: false, message: 'Unauthorized. Admin access required.' });
    return;
  }
  next();
}

// -------------------------------------------------------------
// PUBLIC & USER ROUTES
// -------------------------------------------------------------

// System / Site Settings
app.get('/api/site-settings', (req: Request, res: Response) => {
  res.json({
    success: true,
    settings: {
      ...db.siteSettings,
      activeGatewaysCount: db.paymentGateways.filter(g => g.isActive).length,
      productsCount: db.products.length,
    }
  });
});

// Register
app.post('/api/auth/register', async (req: Request, res: Response) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    res.status(400).json({ success: false, message: 'Username, email and password are required' });
    return;
  }

  const cleanUser = username.trim().toLowerCase();
  const cleanEmail = email.trim().toLowerCase();

  if (db.users.some(u => u.username.toLowerCase() === cleanUser)) {
    res.status(400).json({ success: false, message: 'Username is already taken' });
    return;
  }
  if (db.users.some(u => u.email.toLowerCase() === cleanEmail)) {
    res.status(400).json({ success: false, message: 'Email is already registered' });
    return;
  }

  const salt = generateSalt();
  const passwordHash = hashPassword(password, salt);

  const newUser: User = {
    id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    username: username.trim(),
    email: cleanEmail,
    passwordHash,
    salt,
    balance: 50, // Welcome gift of 50 balance!
    role: 'user',
    isBanned: false,
    totalSpent: 0,
    createdAt: new Date().toISOString(),
  };

  db.users.push(newUser);
  dbManager.persist();

  const token = generateToken();
  userSessions.set(token, newUser.id);

  // Broadcast Telegram notification to all active bots
  broadcastAlertToAllBots(
    `<b>✨ New User Registration!</b>\n\n` +
    `👤 <b>Username:</b> ${newUser.username}\n` +
    `📧 <b>Email:</b> ${newUser.email}\n` +
    `🎁 <b>Welcome Balance:</b> ${db.siteSettings.currencySymbol}50\n` +
    `🕒 <i>${new Date().toLocaleTimeString()}</i>`,
    APP_URL
  );

  const { passwordHash: _, salt: __, ...userPublic } = newUser;
  res.json({ success: true, token, user: userPublic, message: 'Account created successfully! Enjoy your ৳50 welcome bonus.' });
});

// Login
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { usernameOrEmail, password } = req.body;
  if (!usernameOrEmail || !password) {
    res.status(400).json({ success: false, message: 'Username/Email and password are required' });
    return;
  }

  const query = usernameOrEmail.trim().toLowerCase();
  const user = db.users.find(u => u.username.toLowerCase() === query || u.email.toLowerCase() === query);

  if (!user) {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
    return;
  }

  if (user.isBanned) {
    res.status(403).json({ success: false, message: 'Your account has been suspended. Please contact support.' });
    return;
  }

  const isValid = verifyPassword(password, user.salt, user.passwordHash);
  if (!isValid) {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
    return;
  }

  const token = generateToken();
  userSessions.set(token, user.id);

  const { passwordHash: _, salt: __, ...userPublic } = user;
  res.json({ success: true, token, user: userPublic });
});

// Current User Details
app.get('/api/auth/me', authenticateUser, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const { passwordHash: _, salt: __, ...userPublic } = user;
  res.json({ success: true, user: userPublic });
});

// Update Profile
app.put('/api/user/profile', authenticateUser, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const { email, profileAvatar, newPassword } = req.body;

  if (email && email.trim()) {
    const cleanEmail = email.trim().toLowerCase();
    if (cleanEmail !== user.email && db.users.some(u => u.id !== user.id && u.email.toLowerCase() === cleanEmail)) {
      res.status(400).json({ success: false, message: 'Email already used by another account' });
      return;
    }
    user.email = cleanEmail;
  }

  if (profileAvatar !== undefined) {
    user.profileAvatar = profileAvatar;
  }

  if (newPassword && newPassword.length >= 4) {
    user.salt = generateSalt();
    user.passwordHash = hashPassword(newPassword, user.salt);
  }

  dbManager.persist();
  const { passwordHash: _, salt: __, ...userPublic } = user;
  res.json({ success: true, user: userPublic, message: 'Profile updated successfully' });
});

// Products List
app.get('/api/products', (req: Request, res: Response) => {
  // Return public product catalog (without raw secret download URLs or passwords)
  const publicProducts = db.products.map(p => ({
    id: p.id,
    name: p.name,
    category: p.category,
    price: p.price,
    validityDays: p.validityDays,
    description: p.description,
    stock: p.stock,
    imageUrl: p.imageUrl,
    isFeatured: p.isFeatured,
  }));
  res.json({ success: true, products: publicProducts });
});

// Buy Product using Wallet
app.post('/api/products/:id/buy', authenticateUser, async (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const productId = req.params.id;

  const product = db.products.find(p => p.id === productId);
  if (!product) {
    res.status(404).json({ success: false, message: 'Product not found' });
    return;
  }

  if (product.stock === 0) {
    res.status(400).json({ success: false, message: 'Sorry, this product is currently out of stock.' });
    return;
  }

  const finalPrice = product.price;

  // Check wallet balance
  if (user.balance < finalPrice) {
    res.status(400).json({
      success: false,
      message: `Insufficient wallet balance. You need ${db.siteSettings.currencySymbol}${finalPrice}, but your current balance is ${db.siteSettings.currencySymbol}${user.balance}. Please deposit funds.`
    });
    return;
  }
  user.balance -= finalPrice;
  user.totalSpent = (user.totalSpent || 0) + finalPrice;

  // Decrement stock if finite
  if (product.stock > 0) {
    product.stock -= 1;
  }

  // Create unlocked purchase record
  const purchaseId = 'pur_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
  const purchase = {
    id: purchaseId,
    userId: user.id,
    username: user.username,
    productId: product.id,
    productName: product.name,
    category: product.category,
    price: finalPrice,
    fileDownloadUrl: product.fileDownloadUrl,
    secretPassword: product.secretPassword || 'N/A',
    purchasedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + (product.validityDays || 30) * 86400000).toISOString(),
    status: 'active' as const,
  };

  db.purchases.unshift(purchase);
  dbManager.persist();

  // Telegram alert to admin
  broadcastAlertToAllBots(
    `<b>🛍️ New Product Purchase!</b>\n\n` +
    `👤 <b>Customer:</b> ${user.username}\n` +
    `📦 <b>Product:</b> ${product.name}\n` +
    `💰 <b>Amount Paid:</b> ${db.siteSettings.currencySymbol}${finalPrice}\n` +
    `💳 <b>New User Balance:</b> ${db.siteSettings.currencySymbol}${user.balance}\n` +
    `🕒 <i>${new Date().toLocaleTimeString()}</i>`,
    APP_URL
  );

  res.json({
    success: true,
    message: 'Purchase successful! Secret credentials and download links are now unlocked.',
    purchase,
    newBalance: user.balance,
  });
});

// User's Purchases / Vault
app.get('/api/user/purchases', authenticateUser, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const purchases = db.purchases.filter(p => p.userId === user.id);
  res.json({ success: true, purchases });
});

// User's Ledger (Purchases + Deposits)
app.get('/api/user/ledger', authenticateUser, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const userDeposits = db.deposits.filter(d => d.userId === user.id);
  const userPurchases = db.purchases.filter(p => p.userId === user.id);
  res.json({
    success: true,
    deposits: userDeposits,
    purchases: userPurchases,
  });
});

// Payment Gateways (bKash, Nagad, Rocket)
app.get('/api/payment-gateways', (req: Request, res: Response) => {
  const gateways = db.paymentGateways.filter(g => g.isActive);
  res.json({ success: true, gateways });
});

// Submit Manual Deposit
app.post('/api/deposits', authenticateUser, async (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const { method, accountNumber, senderNumber, trxId, amount, screenshotUrl } = req.body;

  if (!method || !senderNumber || !trxId || !amount) {
    res.status(400).json({ success: false, message: 'Method, sender phone number, TrxID, and amount are required.' });
    return;
  }

  const depositAmount = parseFloat(amount);
  if (isNaN(depositAmount) || depositAmount <= 0) {
    res.status(400).json({ success: false, message: 'Please enter a valid deposit amount.' });
    return;
  }

  const cleanTrxId = trxId.trim().toUpperCase();
  // Check if TrxID already exists
  if (db.deposits.some(d => d.trxId.toUpperCase() === cleanTrxId)) {
    res.status(400).json({ success: false, message: 'This Transaction ID has already been submitted.' });
    return;
  }

  const newDeposit: Deposit = {
    id: 'dep_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    userId: user.id,
    username: user.username,
    method,
    accountNumber: accountNumber || 'Admin Number',
    senderNumber: senderNumber.trim(),
    trxId: cleanTrxId,
    amount: depositAmount,
    screenshotUrl,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.deposits.unshift(newDeposit);
  dbManager.persist();

  // Telegram alert to admin
  broadcastAlertToAllBots(
    `<b>💵 New Deposit Request Submitted!</b>\n\n` +
    `👤 <b>User:</b> ${user.username} (${user.email})\n` +
    `💳 <b>Method:</b> ${method.toUpperCase()}\n` +
    `📱 <b>Sender Number:</b> <code>${senderNumber}</code>\n` +
    `🔢 <b>TrxID:</b> <code>${cleanTrxId}</code>\n` +
    `💰 <b>Amount:</b> ${db.siteSettings.currencySymbol}${depositAmount}\n` +
    `🕒 <i>${new Date().toLocaleTimeString()}</i>`,
    APP_URL
  );

  res.json({
    success: true,
    message: 'Deposit request submitted successfully! Funds will be added to your wallet once verified.',
    deposit: newDeposit
  });
});

// Redeem Promo Code
app.post('/api/promo/redeem', authenticateUser, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const { code } = req.body;

  if (!code || !code.trim()) {
    res.status(400).json({ success: false, message: 'Promo code is required' });
    return;
  }

  const promo = db.promoCodes.find(p => p.code.toUpperCase() === code.trim().toUpperCase() && p.isActive);
  if (!promo) {
    res.status(400).json({ success: false, message: 'Invalid or inactive promo code.' });
    return;
  }

  if (new Date(promo.expiresAt).getTime() < Date.now()) {
    res.status(400).json({ success: false, message: 'This promo code has expired.' });
    return;
  }

  if (promo.usedCount >= promo.maxUses) {
    res.status(400).json({ success: false, message: 'This promo code has reached its maximum usage limit.' });
    return;
  }

  if (promo.usedByUsers && promo.usedByUsers.includes(user.id)) {
    res.status(400).json({ success: false, message: 'You have already redeemed this promo code once.' });
    return;
  }

  // Credit balance
  user.balance += promo.value;
  promo.usedCount += 1;
  promo.usedByUsers.push(user.id);

  dbManager.persist();

  res.json({
    success: true,
    message: `Promo code successfully applied! ${db.siteSettings.currencySymbol}${promo.value} has been credited to your wallet balance.`,
    newBalance: user.balance,
  });
});

// Notices
app.get('/api/notices', (req: Request, res: Response) => {
  res.json({ success: true, notices: db.notices.filter(n => n.isActive) });
});

// Support Tickets
app.get('/api/tickets', authenticateUser, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const tickets = db.supportTickets.filter(t => t.userId === user.id);
  res.json({ success: true, tickets });
});

app.post('/api/tickets', authenticateUser, (req: Request, res: Response) => {
  const user = (req as any).user as User;
  const { subject, message } = req.body;
  if (!subject || !message) {
    res.status(400).json({ success: false, message: 'Subject and message are required' });
    return;
  }

  const newTicket = {
    id: 'tkt_' + Date.now(),
    userId: user.id,
    username: user.username,
    subject: subject.trim(),
    message: message.trim(),
    status: 'open' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  db.supportTickets.unshift(newTicket);
  dbManager.persist();

  res.json({ success: true, message: 'Support ticket submitted. Our team will review and respond shortly.', ticket: newTicket });
});

// -------------------------------------------------------------
// ADMIN SECURE ROUTES (Accessible ONLY with Admin Token)
// -------------------------------------------------------------

// Admin Login
app.post('/api/admin/login', (req: Request, res: Response) => {
  const { password } = req.body;
  if (!password) {
    res.status(400).json({ success: false, message: 'Admin password is required' });
    return;
  }

  const adminUser = db.users.find(u => u.role === 'admin');
  if (!adminUser) {
    res.status(500).json({ success: false, message: 'Admin account not configured' });
    return;
  }

  const isValid = verifyPassword(password, adminUser.salt, adminUser.passwordHash);
  if (!isValid) {
    res.status(401).json({ success: false, message: 'Incorrect admin password.' });
    return;
  }

  const adminToken = 'adm_' + generateToken();
  adminSessions.add(adminToken);
  dbManager.logAdmin('ADMIN_LOGIN', 'Admin authenticated successfully', req.ip);

  res.json({
    success: true,
    token: adminToken,
    message: 'Welcome to DigiVault Administrator Command Center'
  });
});

// Admin Analytics Overview & Live Profit Calculator
app.get('/api/admin/overview', authenticateAdmin, (req: Request, res: Response) => {
  const totalUsers = db.users.length;
  const totalProducts = db.products.length;
  const totalSalesCount = db.purchases.length;
  const totalRevenue = db.purchases.reduce((acc, p) => acc + (p.price || 0), 0);
  const totalDepositsApproved = db.deposits
    .filter(d => d.status === 'approved')
    .reduce((acc, d) => acc + (d.amount || 0), 0);
  const pendingDepositsCount = db.deposits.filter(d => d.status === 'pending').length;
  const totalUserBalanceLiability = db.users.reduce((acc, u) => acc + (u.balance || 0), 0);

  // Live profit calculation: total revenue from completed product orders
  const estimatedProfit = totalRevenue;

  // Daily stats for last 7 days
  const now = Date.now();
  const dailyReports: { date: string; sales: number; deposits: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const dayStart = new Date(now - i * 86400000);
    const dayStr = dayStart.toISOString().split('T')[0];
    const daySales = db.purchases
      .filter(p => p.purchasedAt.startsWith(dayStr))
      .reduce((acc, p) => acc + p.price, 0);
    const dayDeposits = db.deposits
      .filter(d => d.status === 'approved' && d.createdAt.startsWith(dayStr))
      .reduce((acc, d) => acc + d.amount, 0);
    dailyReports.push({ date: dayStr, sales: daySales, deposits: dayDeposits });
  }

  res.json({
    success: true,
    analytics: {
      totalUsers,
      totalProducts,
      totalSalesCount,
      totalRevenue,
      totalDepositsApproved,
      pendingDepositsCount,
      totalUserBalanceLiability,
      estimatedProfit,
      activeBotsCount: db.telegramBots.filter(b => b.isActive).length,
      maxBotsLimit: 5,
      openTicketsCount: db.supportTickets.filter(t => t.status === 'open').length,
      dailyReports,
    }
  });
});

// Users Management
app.get('/api/admin/users', authenticateAdmin, (req: Request, res: Response) => {
  const usersPublic = db.users.map(u => ({
    id: u.id,
    username: u.username,
    email: u.email,
    balance: u.balance,
    role: u.role,
    isBanned: u.isBanned,
    totalSpent: u.totalSpent,
    createdAt: u.createdAt,
  }));
  res.json({ success: true, users: usersPublic });
});

// Balance Add/Deduct
app.put('/api/admin/users/:id/balance', authenticateAdmin, (req: Request, res: Response) => {
  const userId = req.params.id;
  const { amount, action, reason } = req.body; // action: 'add' | 'deduct'
  const user = db.users.find(u => u.id === userId);
  if (!user) {
    res.status(404).json({ success: false, message: 'User not found' });
    return;
  }

  const delta = Math.abs(parseFloat(amount));
  if (isNaN(delta) || delta <= 0) {
    res.status(400).json({ success: false, message: 'Invalid balance amount' });
    return;
  }

  if (action === 'deduct') {
    user.balance = Math.max(0, user.balance - delta);
    dbManager.logAdmin('BALANCE_DEDUCT', `Deducted ৳${delta} from ${user.username}. Reason: ${reason || 'Admin adjustment'}`);
  } else {
    user.balance += delta;
    dbManager.logAdmin('BALANCE_ADD', `Added ৳${delta} to ${user.username}. Reason: ${reason || 'Admin adjustment'}`);
  }

  dbManager.persist();
  res.json({ success: true, message: `Balance updated for ${user.username}`, newBalance: user.balance });
});

// Ban / Unban User
app.put('/api/admin/users/:id/ban', authenticateAdmin, (req: Request, res: Response) => {
  const user = db.users.find(u => u.id === req.params.id);
  if (!user) {
    res.status(404).json({ success: false, message: 'User not found' });
    return;
  }
  if (user.role === 'admin') {
    res.status(400).json({ success: false, message: 'Cannot ban an admin account' });
    return;
  }

  user.isBanned = !user.isBanned;
  dbManager.logAdmin(user.isBanned ? 'USER_BAN' : 'USER_UNBAN', `User ${user.username} was ${user.isBanned ? 'banned' : 'unbanned'}`);
  dbManager.persist();
  res.json({ success: true, isBanned: user.isBanned, message: `User ${user.isBanned ? 'banned' : 'unbanned'}` });
});

// Reset User Password
app.put('/api/admin/users/:id/reset-password', authenticateAdmin, (req: Request, res: Response) => {
  const user = db.users.find(u => u.id === req.params.id);
  const { newPassword } = req.body;
  if (!user) {
    res.status(404).json({ success: false, message: 'User not found' });
    return;
  }
  if (!newPassword || newPassword.length < 4) {
    res.status(400).json({ success: false, message: 'Password must be at least 4 characters long' });
    return;
  }

  user.salt = generateSalt();
  user.passwordHash = hashPassword(newPassword, user.salt);
  dbManager.logAdmin('PASSWORD_RESET', `Password reset for user ${user.username}`);
  dbManager.persist();
  res.json({ success: true, message: `Password reset successfully for ${user.username}` });
});

// Deposit Approval & Rejection
app.get('/api/admin/deposits', authenticateAdmin, (req: Request, res: Response) => {
  res.json({ success: true, deposits: db.deposits });
});

app.put('/api/admin/deposits/:id/status', authenticateAdmin, (req: Request, res: Response) => {
  const deposit = db.deposits.find(d => d.id === req.params.id);
  const { status, adminNote } = req.body; // 'approved' | 'rejected'

  if (!deposit) {
    res.status(404).json({ success: false, message: 'Deposit record not found' });
    return;
  }
  if (deposit.status !== 'pending') {
    res.status(400).json({ success: false, message: `Deposit already ${deposit.status}` });
    return;
  }

  deposit.status = status;
  deposit.adminNote = adminNote || (status === 'approved' ? 'Verified & Approved' : 'Rejected');
  deposit.updatedAt = new Date().toISOString();

  if (status === 'approved') {
    const user = db.users.find(u => u.id === deposit.userId);
    if (user) {
      user.balance += deposit.amount;
      dbManager.logAdmin('DEPOSIT_APPROVE', `Approved deposit of ৳${deposit.amount} for ${user.username} (TrxID: ${deposit.trxId})`);
    }
  } else {
    dbManager.logAdmin('DEPOSIT_REJECT', `Rejected deposit of ৳${deposit.amount} for ${deposit.username} (TrxID: ${deposit.trxId})`);
  }

  dbManager.persist();
  res.json({ success: true, message: `Deposit marked as ${status}` });
});

// Payment Gateways Management
app.get('/api/admin/payment-gateways', authenticateAdmin, (req: Request, res: Response) => {
  res.json({ success: true, gateways: db.paymentGateways });
});

app.post('/api/admin/payment-gateways', authenticateAdmin, (req: Request, res: Response) => {
  const { method, number, type, instructions, minDeposit, maxDeposit } = req.body;
  if (!method || !number) {
    res.status(400).json({ success: false, message: 'Method and phone number are required' });
    return;
  }

  const newGateway: PaymentGateway = {
    id: 'gw_' + Date.now(),
    method,
    number: number.trim(),
    type: type || 'Personal',
    instructions: instructions || 'Send money to this number and submit your TrxID.',
    minDeposit: parseFloat(minDeposit) || 100,
    maxDeposit: parseFloat(maxDeposit) || 25000,
    isActive: true,
  };

  db.paymentGateways.push(newGateway);
  dbManager.logAdmin('GATEWAY_ADD', `Added payment gateway ${method} (${number})`);
  dbManager.persist();
  res.json({ success: true, gateway: newGateway, message: 'Payment gateway added successfully' });
});

app.put('/api/admin/payment-gateways/:id', authenticateAdmin, (req: Request, res: Response) => {
  const gw = db.paymentGateways.find(g => g.id === req.params.id);
  if (!gw) {
    res.status(404).json({ success: false, message: 'Gateway not found' });
    return;
  }

  const { number, type, instructions, minDeposit, maxDeposit, isActive } = req.body;
  if (number) gw.number = number.trim();
  if (type) gw.type = type;
  if (instructions !== undefined) gw.instructions = instructions;
  if (minDeposit !== undefined) gw.minDeposit = parseFloat(minDeposit);
  if (maxDeposit !== undefined) gw.maxDeposit = parseFloat(maxDeposit);
  if (isActive !== undefined) gw.isActive = !!isActive;

  dbManager.logAdmin('GATEWAY_UPDATE', `Updated payment gateway ${gw.method} (${gw.number})`);
  dbManager.persist();
  res.json({ success: true, gateway: gw, message: 'Payment gateway updated' });
});

app.delete('/api/admin/payment-gateways/:id', authenticateAdmin, (req: Request, res: Response) => {
  const idx = db.paymentGateways.findIndex(g => g.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ success: false, message: 'Gateway not found' });
    return;
  }
  const deleted = db.paymentGateways.splice(idx, 1)[0];
  dbManager.logAdmin('GATEWAY_DELETE', `Deleted payment gateway ${deleted.method}`);
  dbManager.persist();
  res.json({ success: true, message: 'Gateway deleted' });
});

// Products CRUD
app.post('/api/admin/products', authenticateAdmin, (req: Request, res: Response) => {
  const { name, category, price, validityDays, description, fileDownloadUrl, secretPassword, stock, imageUrl, isFeatured } = req.body;
  if (!name || !price) {
    res.status(400).json({ success: false, message: 'Product name and price are required' });
    return;
  }

  const newProduct: Product = {
    id: 'prod_' + Date.now(),
    name: name.trim(),
    category: category || 'Digital Goods',
    price: parseFloat(price),
    validityDays: parseInt(validityDays, 10) || 365,
    description: description || '',
    fileDownloadUrl: fileDownloadUrl || '',
    secretPassword: secretPassword || '',
    stock: stock !== undefined ? parseInt(stock, 10) : 50,
    imageUrl: imageUrl || '/src/assets/images/product_vpn_suite_1790839132343.jpg',
    isFeatured: !!isFeatured,
    createdAt: new Date().toISOString(),
  };

  db.products.unshift(newProduct);
  dbManager.logAdmin('PRODUCT_CREATE', `Created product: ${newProduct.name}`);
  dbManager.persist();
  res.json({ success: true, product: newProduct, message: 'Product created successfully' });
});

app.put('/api/admin/products/:id', authenticateAdmin, (req: Request, res: Response) => {
  const product = db.products.find(p => p.id === req.params.id);
  if (!product) {
    res.status(404).json({ success: false, message: 'Product not found' });
    return;
  }

  const fields = ['name', 'category', 'price', 'validityDays', 'description', 'fileDownloadUrl', 'secretPassword', 'stock', 'imageUrl', 'isFeatured'];
  for (const field of fields) {
    if (req.body[field] !== undefined) {
      if (['price', 'validityDays', 'stock'].includes(field)) {
        (product as any)[field] = parseFloat(req.body[field]);
      } else {
        (product as any)[field] = req.body[field];
      }
    }
  }

  dbManager.logAdmin('PRODUCT_UPDATE', `Updated product: ${product.name}`);
  dbManager.persist();
  res.json({ success: true, product, message: 'Product updated successfully' });
});

app.delete('/api/admin/products/:id', authenticateAdmin, (req: Request, res: Response) => {
  const idx = db.products.findIndex(p => p.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ success: false, message: 'Product not found' });
    return;
  }
  const deleted = db.products.splice(idx, 1)[0];
  dbManager.logAdmin('PRODUCT_DELETE', `Deleted product: ${deleted.name}`);
  dbManager.persist();
  res.json({ success: true, message: 'Product deleted' });
});

// TELEGRAM BOT AUTOMATION (Enforces maximum limit of 5 active bots & complete deletion feature)
app.get('/api/admin/telegram-bots', authenticateAdmin, (req: Request, res: Response) => {
  res.json({
    success: true,
    bots: db.telegramBots,
    currentCount: db.telegramBots.length,
    maxLimit: 5,
  });
});

app.post('/api/admin/telegram-bots', authenticateAdmin, async (req: Request, res: Response) => {
  // STRICT RULE: Max 5 bots limit
  if (db.telegramBots.length >= 5) {
    res.status(400).json({
      success: false,
      message: 'Maximum limit of 5 active bots reached! You cannot create more than 5 bots. Please delete an existing bot to add another.'
    });
    return;
  }

  const { name, botToken, chatId } = req.body;
  if (!botToken || !chatId) {
    res.status(400).json({ success: false, message: 'Bot Token and Chat ID are required' });
    return;
  }

  const cleanToken = botToken.trim();
  const cleanChatId = chatId.trim();

  // Validate token via Telegram getMe
  const botProfile = await getBotProfile(cleanToken);
  if (!botProfile.success) {
    res.status(400).json({
      success: false,
      message: `Invalid Bot Token! Telegram responded: ${botProfile.error || 'Token verification failed'}`
    });
    return;
  }

  const newBot: TelegramBot = {
    id: 'bot_' + Date.now(),
    name: name ? name.trim() : (botProfile.name || 'DigiVault Bot'),
    botToken: cleanToken,
    chatId: cleanChatId,
    botUsername: botProfile.username,
    isActive: true,
    webhookEnabled: true,
    createdAt: new Date().toISOString(),
    lastTestStatus: 'Configured',
  };

  db.telegramBots.push(newBot);

  // Set up Telegram WebApp Menu Button automatically!
  // When users open the bot, they have a permanent "Open Web Store" button opening APP_URL
  await configureTelegramMenuButton(cleanToken, APP_URL);

  // Configure webhook so bot responds to /start and launches WebApp
  const webhookUrl = `${APP_URL}/api/telegram/webhook/${newBot.id}`;
  await setTelegramWebhook(cleanToken, webhookUrl);

  // Send an instant confirmation message to the chat ID
  await sendTelegramMessage(
    cleanToken,
    cleanChatId,
    `<b>🚀 DigiVault Telegram WebApp Connected!</b>\n\n` +
    `Your store is now fully integrated with Telegram.\n` +
    `• <b>Bot:</b> @${botProfile.username || 'Bot'}\n` +
    `• <b>WebApp URL:</b> <code>${APP_URL}</code>\n\n` +
    `Users can now view your website seamlessly inside Telegram!`,
    {
      inline_keyboard: [
        [
          { text: '🛍️ Open Web Store', web_app: { url: APP_URL } }
        ]
      ]
    }
  );

  dbManager.logAdmin('TELEGRAM_BOT_ADD', `Connected bot @${botProfile.username} (Chat ID: ${cleanChatId})`);
  dbManager.persist();

  res.json({
    success: true,
    bot: newBot,
    message: `Telegram Bot @${botProfile.username} successfully configured and WebApp menu button activated!`
  });
});

// Test Bot
app.post('/api/admin/telegram-bots/:id/test', authenticateAdmin, async (req: Request, res: Response) => {
  const bot = db.telegramBots.find(b => b.id === req.params.id);
  if (!bot) {
    res.status(404).json({ success: false, message: 'Bot not found' });
    return;
  }

  const testMessage =
    `<b>🧪 DigiVault Telegram Bot Test Alert!</b>\n\n` +
    `✅ Bot connection verified.\n` +
    `🕒 Time: ${new Date().toLocaleString()}\n` +
    `🔔 Real-time alerts for User Registrations, Deposits, and Purchases are active!`;

  const replyMarkup = {
    inline_keyboard: [
      [
        { text: '🛍️ Launch Store Inside Telegram', web_app: { url: APP_URL } }
      ]
    ]
  };

  const result = await sendTelegramMessage(bot.botToken, bot.chatId, testMessage, replyMarkup);
  if (result.success) {
    bot.lastTestStatus = 'Success (' + new Date().toLocaleTimeString() + ')';
    dbManager.persist();
    res.json({ success: true, message: `Test alert sent successfully to Chat ID ${bot.chatId}!` });
  } else {
    bot.lastTestStatus = 'Failed: ' + result.error;
    dbManager.persist();
    res.status(400).json({ success: false, message: `Telegram error: ${result.error}` });
  }
});

// Completely delete bot and its webhook/records
app.delete('/api/admin/telegram-bots/:id', authenticateAdmin, async (req: Request, res: Response) => {
  const idx = db.telegramBots.findIndex(b => b.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ success: false, message: 'Bot not found' });
    return;
  }

  const bot = db.telegramBots[idx];
  // Remove webhook from Telegram servers
  await deleteTelegramWebhook(bot.botToken);

  // Completely purge from database
  db.telegramBots.splice(idx, 1);
  dbManager.logAdmin('TELEGRAM_BOT_DELETE', `Deleted Telegram bot ${bot.name} (@${bot.botUsername || 'unknown'})`);
  dbManager.persist();

  res.json({
    success: true,
    message: `Telegram bot "${bot.name}" was completely deleted from database and webhook cleared.`
  });
});

// Promo Codes Admin
app.get('/api/admin/promo-codes', authenticateAdmin, (req: Request, res: Response) => {
  res.json({ success: true, promoCodes: db.promoCodes });
});

app.post('/api/admin/promo-codes', authenticateAdmin, (req: Request, res: Response) => {
  const { code, value, maxUses, expiresAt } = req.body;
  if (!code || !value) {
    res.status(400).json({ success: false, message: 'Code and reward value are required' });
    return;
  }

  const cleanCode = code.trim().toUpperCase();
  if (db.promoCodes.some(p => p.code === cleanCode)) {
    res.status(400).json({ success: false, message: 'Promo code already exists' });
    return;
  }

  const newPromo: PromoCode = {
    id: 'promo_' + Date.now(),
    code: cleanCode,
    rewardType: 'balance_credit',
    value: parseFloat(value),
    maxUses: parseInt(maxUses, 10) || 100,
    usedCount: 0,
    usedByUsers: [],
    expiresAt: expiresAt || new Date(Date.now() + 86400000 * 30).toISOString(),
    isActive: true,
  };

  db.promoCodes.unshift(newPromo);
  dbManager.logAdmin('PROMO_CREATE', `Created promo code: ${cleanCode} (৳${value})`);
  dbManager.persist();
  res.json({ success: true, promoCode: newPromo, message: 'Promo code created' });
});

app.delete('/api/admin/promo-codes/:id', authenticateAdmin, (req: Request, res: Response) => {
  const idx = db.promoCodes.findIndex(p => p.id === req.params.id);
  if (idx !== -1) {
    const deleted = db.promoCodes.splice(idx, 1)[0];
    dbManager.logAdmin('PROMO_DELETE', `Deleted promo code ${deleted.code}`);
    dbManager.persist();
  }
  res.json({ success: true, message: 'Promo code removed' });
});

// Notices Admin
app.get('/api/admin/notices', authenticateAdmin, (req: Request, res: Response) => {
  res.json({ success: true, notices: db.notices });
});

app.post('/api/admin/notices', authenticateAdmin, (req: Request, res: Response) => {
  const { title, content, type } = req.body;
  if (!title || !content) {
    res.status(400).json({ success: false, message: 'Title and content are required' });
    return;
  }

  const newNotice: Notice = {
    id: 'not_' + Date.now(),
    title: title.trim(),
    content: content.trim(),
    type: type || 'info',
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  db.notices.unshift(newNotice);
  dbManager.logAdmin('NOTICE_CREATE', `Created notice: ${newNotice.title}`);
  dbManager.persist();
  res.json({ success: true, notice: newNotice, message: 'Notice posted' });
});

app.delete('/api/admin/notices/:id', authenticateAdmin, (req: Request, res: Response) => {
  const idx = db.notices.findIndex(n => n.id === req.params.id);
  if (idx !== -1) {
    const deleted = db.notices.splice(idx, 1)[0];
    dbManager.logAdmin('NOTICE_DELETE', `Deleted notice: ${deleted.title}`);
    dbManager.persist();
  }
  res.json({ success: true, message: 'Notice removed' });
});

// Support Tickets Admin
app.get('/api/admin/tickets', authenticateAdmin, (req: Request, res: Response) => {
  res.json({ success: true, tickets: db.supportTickets });
});

app.put('/api/admin/tickets/:id/reply', authenticateAdmin, (req: Request, res: Response) => {
  const ticket = db.supportTickets.find(t => t.id === req.params.id);
  const { reply, status } = req.body;

  if (!ticket) {
    res.status(404).json({ success: false, message: 'Ticket not found' });
    return;
  }

  ticket.reply = reply;
  ticket.status = status || 'answered';
  ticket.updatedAt = new Date().toISOString();

  dbManager.logAdmin('TICKET_REPLY', `Replied to ticket #${ticket.id} (${ticket.username})`);
  dbManager.persist();
  res.json({ success: true, ticket, message: 'Reply sent' });
});

// Site Settings & Change Admin Password
app.put('/api/admin/settings', authenticateAdmin, (req: Request, res: Response) => {
  const { siteName, siteLogo, currencySymbol, contactEmail, telegramChannel, noticeMarquee, newAdminPassword } = req.body;

  if (siteName) db.siteSettings.siteName = siteName.trim();
  if (siteLogo) db.siteSettings.siteLogo = siteLogo.trim();
  if (currencySymbol) db.siteSettings.currencySymbol = currencySymbol.trim();
  if (contactEmail) db.siteSettings.contactEmail = contactEmail.trim();
  if (telegramChannel) db.siteSettings.telegramChannel = telegramChannel.trim();
  if (noticeMarquee !== undefined) db.siteSettings.noticeMarquee = noticeMarquee.trim();

  if (newAdminPassword && newAdminPassword.length >= 4) {
    const adminUser = db.users.find(u => u.role === 'admin');
    if (adminUser) {
      adminUser.salt = generateSalt();
      adminUser.passwordHash = hashPassword(newAdminPassword, adminUser.salt);
      db.siteSettings.defaultAdminPasswordChanged = true;
      dbManager.logAdmin('ADMIN_PASS_CHANGE', 'Admin password was updated');
    }
  }

  dbManager.persist();
  res.json({ success: true, settings: db.siteSettings, message: 'Site settings and credentials saved' });
});

// Activity Logs
app.get('/api/admin/logs', authenticateAdmin, (req: Request, res: Response) => {
  res.json({ success: true, logs: db.adminLogs });
});

// Database Backup / Export
app.get('/api/admin/backup', authenticateAdmin, (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename=digivault-backup-${Date.now()}.json`);
  res.send(JSON.stringify(db, null, 2));
});

// -------------------------------------------------------------
// TELEGRAM INCOMING WEBHOOK HANDLER
// -------------------------------------------------------------
app.post('/api/telegram/webhook/:botId', async (req: Request, res: Response) => {
  res.sendStatus(200); // Always respond 200 immediately to Telegram

  try {
    const bot = db.telegramBots.find(b => b.id === req.params.botId);
    if (!bot || !bot.isActive) return;

    const body = req.body;
    if (body.message && body.message.text) {
      const text = body.message.text.trim();
      const chatId = body.message.chat.id;
      const firstName = body.message.from?.first_name || 'Friend';

      if (text.startsWith('/start') || text === '/shop' || text === '/store') {
        const welcomeText =
          `👋 <b>Hello, ${firstName}!</b>\n\n` +
          `Welcome to <b>${db.siteSettings.siteName}</b>.\n` +
          `Browse and purchase premium digital products, secure VPN keys, courses, and accounts with instant delivery right inside Telegram!\n\n` +
          `Tap below to launch the store:`;

        const replyMarkup = {
          inline_keyboard: [
            [
              { text: '🛍️ Open Web Store', web_app: { url: APP_URL } }
            ],
            [
              { text: '💳 Instant Deposit', web_app: { url: `${APP_URL}#deposit` } },
              { text: '🎧 Customer Support', web_app: { url: `${APP_URL}#support` } }
            ]
          ]
        };

        await sendTelegramMessage(bot.botToken, chatId.toString(), welcomeText, replyMarkup);
      }
    }
  } catch (err) {
    console.error('Telegram webhook error:', err);
  }
});

// -------------------------------------------------------------
// VITE DEV MIDDLEWARE / STATIC FILES
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 DigiVault full-stack server running at http://0.0.0.0:${PORT}`);
    console.log(`📡 Public APP_URL: ${APP_URL}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
