import type { Database } from '@/types/supabase';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Report = Database['public']['Tables']['reports']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];
type ReportImage = Database['public']['Tables']['report_images']['Row'];

export interface DemoUser {
  id: string;
  email: string;
}

export interface DemoReport extends Report {
  categories: Pick<Category, 'name' | 'color_hex'>;
  report_images: Array<Pick<ReportImage, 'url' | 'is_primary'>>;
}

interface StoredAccount {
  profile: Profile;
  passwordSalt?: string;
  passwordHash: string;
}

const accountsKey = 'lumterra.demo.accounts';
const sessionKey = 'lumterra.demo.session';
const reportsKey = 'lumterra.demo.reports';

export const demoCategories: Category[] = [
  { id: 'demo-roads', name: 'Routes endommagées', slug: 'routes', description: null, icon_name: 'Route', color_hex: '#6B7280', created_at: '2026-01-01T00:00:00.000Z' },
  { id: 'demo-waste', name: 'Déchets et dépôts sauvages', slug: 'dechets', description: null, icon_name: 'Trash2', color_hex: '#F59E0B', created_at: '2026-01-01T00:00:00.000Z' },
  { id: 'demo-lighting', name: 'Éclairage public', slug: 'eclairage', description: null, icon_name: 'Lightbulb', color_hex: '#FBBF24', created_at: '2026-01-01T00:00:00.000Z' },
  { id: 'demo-flooding', name: 'Inondations', slug: 'inondations', description: null, icon_name: 'Droplets', color_hex: '#3B82F6', created_at: '2026-01-01T00:00:00.000Z' },
  { id: 'demo-green', name: 'Espaces verts', slug: 'espaces-verts', description: null, icon_name: 'TreePine', color_hex: '#10B981', created_at: '2026-01-01T00:00:00.000Z' },
  { id: 'demo-other', name: 'Autres', slug: 'autres', description: null, icon_name: 'MoreHorizontal', color_hex: '#4B5563', created_at: '2026-01-01T00:00:00.000Z' },
];

function readStorage<T>(key: string, fallback: T): T {
  try {
    const stored = window.localStorage.getItem(key);
    return stored === null ? fallback : JSON.parse(stored) as T;
  } catch (error) {
    console.error(`Unable to read demo data (${key}):`, error);
    throw new Error('Les données locales de démonstration sont illisibles. Effacez le stockage local du site puis réessayez.');
  }
}

function writeStorage<T>(key: string, value: T): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Unable to save demo data (${key}):`, error);
    throw new Error('Impossible d’enregistrer les données de démonstration. Vérifiez l’espace disponible dans le stockage local du navigateur.');
  }
}

function hashPassword(password: string, salt: string): Promise<string> {
  if (!globalThis.crypto?.subtle) {
    throw new Error('Le mode démo nécessite un contexte sécurisé (localhost ou HTTPS) pour protéger les mots de passe.');
  }
  const saltBytes = Uint8Array.from(salt.match(/.{2}/g) ?? [], (byte) => Number.parseInt(byte, 16));
  return globalThis.crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  ).then((key) => globalThis.crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: saltBytes, iterations: 120_000 },
    key,
    256
  )).then((hash) => Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, '0')).join(''));
}

function createPasswordSalt(): string {
  return Array.from(globalThis.crypto.getRandomValues(new Uint8Array(16)), (byte) =>
    byte.toString(16).padStart(2, '0')
  ).join('');
}

async function hashLegacyPassword(password: string): Promise<string> {
  const hash = await globalThis.crypto.subtle.digest('SHA-256', new TextEncoder().encode(password));
  return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function accounts(): StoredAccount[] {
  return readStorage<StoredAccount[]>(accountsKey, []);
}

function reports(): DemoReport[] {
  const savedReports = readStorage<DemoReport[] | null>(reportsKey, null);
  if (savedReports) return savedReports;

  const now = Date.now();
  const examples: Array<Pick<Report, 'title' | 'description' | 'category_id' | 'latitude' | 'longitude' | 'status' | 'severity'>> = [
    { title: 'Nid-de-poule près du marché', description: 'Un trou important gêne la circulation.', category_id: 'demo-roads', latitude: -4.2634, longitude: 15.2429, status: 'PENDING', severity: 'HIGH' },
    { title: 'Dépôt sauvage à Poto-Poto', description: 'Des déchets encombrent le trottoir.', category_id: 'demo-waste', latitude: -4.2581, longitude: 15.2512, status: 'IN_PROGRESS', severity: 'MEDIUM' },
    { title: 'Lampadaire en panne', description: 'La rue est peu éclairée la nuit.', category_id: 'demo-lighting', latitude: -4.2714, longitude: 15.2368, status: 'RESOLVED', severity: 'LOW' },
  ];
  const seedReports: DemoReport[] = examples.map((example, index) => {
    const category = demoCategories.find((item) => item.id === example.category_id)!;
    const createdAt = new Date(now - (index + 1) * 86_400_000).toISOString();
    return {
      id: `demo-seed-${index + 1}`,
      user_id: 'demo-sample-user',
      zone_id: null,
      address: null,
      ai_analysis: {},
      updated_at: createdAt,
      created_at: createdAt,
      ...example,
      categories: { name: category.name, color_hex: category.color_hex },
      report_images: [],
    };
  });
  writeStorage(reportsKey, seedReports);
  return seedReports;
}

export function getDemoSession(): DemoUser | null {
  return readStorage<DemoUser | null>(sessionKey, null);
}

export function getDemoProfile(userId: string): Profile | null {
  return accounts().find((account) => account.profile.id === userId)?.profile ?? null;
}

export async function registerDemoAccount(email: string, password: string, fullName: string): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();
  if (password.length < 8) throw new Error('Le mot de passe doit contenir au moins 8 caractères.');
  if (!fullName.trim()) throw new Error('Le nom complet est requis.');
  const existingAccounts = accounts();
  if (existingAccounts.some((account) => account.profile.email.toLowerCase() === normalizedEmail)) {
    throw new Error('Un compte de démonstration existe déjà pour cette adresse e-mail.');
  }

  const now = new Date().toISOString();
  const passwordSalt = createPasswordSalt();
  const account: StoredAccount = {
    profile: {
      id: crypto.randomUUID(),
      email: normalizedEmail,
      full_name: fullName.trim(),
      phone: null,
      role: 'CITOYEN',
      avatar_url: null,
      created_at: now,
      updated_at: now,
    },
    passwordSalt,
    passwordHash: await hashPassword(password, passwordSalt),
  };
  writeStorage(accountsKey, [...existingAccounts, account]);
}

export async function signInDemo(email: string, password: string): Promise<DemoUser> {
  const normalizedEmail = email.trim().toLowerCase();
  const storedAccounts = accounts();
  const account = storedAccounts.find((candidate) => candidate.profile.email.toLowerCase() === normalizedEmail);
  if (!account) throw new Error('Adresse e-mail ou mot de passe incorrect.');

  const isValidPassword = account.passwordSalt
    ? account.passwordHash === await hashPassword(password, account.passwordSalt)
    : account.passwordHash === await hashLegacyPassword(password);
  if (!isValidPassword) {
    throw new Error('Adresse e-mail ou mot de passe incorrect.');
  }
  if (!account.passwordSalt) {
    account.passwordSalt = createPasswordSalt();
    account.passwordHash = await hashPassword(password, account.passwordSalt);
    writeStorage(accountsKey, storedAccounts);
  }
  const user = { id: account.profile.id, email: account.profile.email };
  writeStorage(sessionKey, user);
  return user;
}

export function signOutDemo(): void {
  window.localStorage.removeItem(sessionKey);
}

export function getDemoReports(userId?: string): DemoReport[] {
  return reports()
    .filter((report) => !userId || report.user_id === userId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function saveDemoReport(input: {
  userId: string;
  title: string;
  description: string;
  categoryId: string;
  latitude: number;
  longitude: number;
  photoUrl?: string;
}): DemoReport {
  const category = demoCategories.find((item) => item.id === input.categoryId);
  if (!category) throw new Error('Sélectionnez une catégorie valide.');

  const now = new Date().toISOString();
  const report: DemoReport = {
    id: crypto.randomUUID(),
    user_id: input.userId,
    category_id: input.categoryId,
    zone_id: null,
    title: input.title,
    description: input.description,
    latitude: input.latitude,
    longitude: input.longitude,
    address: null,
    status: 'PENDING',
    severity: 'LOW',
    ai_analysis: {},
    created_at: now,
    updated_at: now,
    categories: { name: category.name, color_hex: category.color_hex },
    report_images: input.photoUrl ? [{ url: input.photoUrl, is_primary: true }] : [],
  };
  writeStorage(reportsKey, [...reports(), report]);
  return report;
}

export function updateDemoReportStatus(reportId: string, status: Report['status']): DemoReport {
  const existingReports = reports();
  const report = existingReports.find((item) => item.id === reportId);
  if (!report) throw new Error('Ce signalement de démonstration est introuvable.');
  const updated = { ...report, status, updated_at: new Date().toISOString() };
  writeStorage(reportsKey, existingReports.map((item) => item.id === reportId ? updated : item));
  return updated;
}
