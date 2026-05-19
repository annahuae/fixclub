import fs from 'node:fs';
import path from 'node:path';
import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)=(.*)\s*$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key]) continue;
    process.env[key] = rawValue.replace(/^['"]|['"]$/g, '');
  }
}

const url =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL;

if (!url) {
  throw new Error('DATABASE_URL is not set. Add it to .env.local first.');
}

const sql = neon(url);
const passwordHash = await bcrypt.hash('demo12345', 10);

const users = [
  ['Анна', 'anna.demo@fixclub.test'],
  ['Мария', 'maria.demo@fixclub.test'],
  ['Ольга', 'olga.demo@fixclub.test'],
  ['Катя', 'katya.demo@fixclub.test'],
  ['Ирина', 'irina.demo@fixclub.test']
];

async function ensureUser(name, email) {
  const existing = await sql`
    SELECT id FROM users WHERE LOWER(email) = LOWER(${email}) LIMIT 1
  `;
  if (existing.length) return existing[0].id;

  const rows = await sql`
    INSERT INTO users (name, email, password_hash)
    VALUES (${name}, ${email}, ${passwordHash})
    RETURNING id
  `;
  return rows[0].id;
}

const userIds = [];
for (const [name, email] of users) {
  userIds.push(await ensureUser(name, email));
}

const pickUser = (i) => userIds[i % userIds.length];

const masters = [
  {
    name: 'Ahmed Al Noor Plumbing',
    specialty: 'plumber',
    emirate: 'dubai',
    area: 'Dubai Marina',
    phone: '+971 50 318 2044',
    description: 'Аккуратный сантехник для протечек, смесителей, сифонов и мелкого ремонта. Отвечает быстро, приезжает со своими инструментами.',
    rating: [5, 5, 4]
  },
  {
    name: 'Rashid AC Service',
    specialty: 'ac',
    emirate: 'dubai',
    area: 'JLT',
    phone: '+971 55 901 6682',
    description: 'Чистка и ремонт кондиционеров. Хорош для срочных вызовов перед летом, заранее говорит цену.',
    rating: [5, 4, 5, 5]
  },
  {
    name: 'Mohan Electric Works',
    specialty: 'electrician',
    emirate: 'dubai',
    area: 'Downtown',
    phone: '+971 52 774 1903',
    description: 'Розетки, автоматы, свет, диагностика. Спокойно объясняет, что именно сломалось.',
    rating: [5, 5]
  },
  {
    name: 'SwiftFix Handyman',
    specialty: 'handyman',
    emirate: 'dubai',
    area: 'Business Bay',
    phone: '+971 58 441 2280',
    description: 'Полки, карнизы, мелкие задачи после переезда. Удобно звать на список работ на пару часов.',
    rating: [4, 5, 4]
  },
  {
    name: 'Clean Nest Team',
    specialty: 'cleaner',
    emirate: 'dubai',
    area: 'Palm Jumeirah',
    phone: '+971 56 700 3921',
    description: 'Генеральная уборка, окна, уборка после ремонта. Лучше бронировать за несколько дней.',
    rating: [5, 5, 5]
  },
  {
    name: 'Ali Doors & Locks',
    specialty: 'locksmith',
    emirate: 'dubai',
    area: 'Jumeirah',
    phone: '+971 50 662 8814',
    description: 'Замки, ручки, доводчики, регулировка дверей. Приезжает быстро, если срочно.',
    rating: [5, 4]
  },
  {
    name: 'Blue Tile Crew',
    specialty: 'tiler',
    emirate: 'dubai',
    area: 'Al Barsha',
    phone: '+971 54 188 7720',
    description: 'Плитка в ванной и на балконе, аккуратная затирка, умеют чинить небольшие участки без полного ремонта.',
    rating: [4, 4, 5]
  },
  {
    name: 'Green Balcony Plants',
    specialty: 'gardener',
    emirate: 'dubai',
    area: 'Arabian Ranches',
    phone: '+971 52 340 0199',
    description: 'Растения для балконов и вилл, автополив, регулярный уход. Хорошо знает, что выживает на солнце.',
    rating: [5, 5]
  },
  {
    name: 'Sharjah Movers Pro',
    specialty: 'mover',
    emirate: 'sharjah',
    area: 'Al Majaz',
    phone: '+971 55 448 9230',
    description: 'Переезды между эмиратами, упаковка, разбор мебели. Аккуратные с коробками и стеклом.',
    rating: [5, 4, 4]
  },
  {
    name: 'Capital Appliance Repair',
    specialty: 'appliance',
    emirate: 'abu_dhabi',
    area: 'Al Reem Island',
    phone: '+971 50 918 3306',
    description: 'Стиралки, сушилки, посудомойки. Сначала диагностирует, потом предлагает варианты ремонта.',
    rating: [4, 5]
  },
  {
    name: 'Ajman Furniture Doctor',
    specialty: 'furniture_repair',
    emirate: 'ajman',
    area: 'Al Nuaimiya',
    phone: '+971 58 230 4100',
    description: 'Ремонт диванов, ножек, фурнитуры и шкафов. Может забрать деталь в мастерскую.',
    rating: [5, 4]
  },
  {
    name: 'RAK Pest Control',
    specialty: 'pest',
    emirate: 'rak',
    area: 'Mina Al Arab',
    phone: '+971 56 114 7810',
    description: 'Дезинсекция квартир и вилл, особенно муравьи и тараканы. Присылают инструкцию до визита.',
    rating: [4, 5, 5]
  }
];

const reviewTexts = [
  'Пришёл вовремя, сделал аккуратно, после себя всё убрал.',
  'Цена совпала с тем, что сказал заранее. Можно рекомендовать.',
  'Быстро ответил в WhatsApp и приехал в тот же день.',
  'Работа нормальная, но лучше заранее проговорить все материалы.',
  'Очень спокойно и профессионально, без лишних разговоров.'
];

async function ensureMaster(master, index) {
  const existing = await sql`
    SELECT id FROM masters WHERE name = ${master.name} LIMIT 1
  `;
  if (existing.length) return existing[0].id;

  const rows = await sql`
    INSERT INTO masters
      (name, phone, specialty, emirate, area, description, added_by)
    VALUES
      (${master.name}, ${master.phone}, ${master.specialty}, ${master.emirate},
       ${master.area}, ${master.description}, ${pickUser(index)})
    RETURNING id
  `;
  return rows[0].id;
}

for (let i = 0; i < masters.length; i++) {
  const master = masters[i];
  const masterId = await ensureMaster(master, i);
  for (let j = 0; j < master.rating.length; j++) {
    const userId = pickUser(i + j + 1);
    const comment = reviewTexts[(i + j) % reviewTexts.length];
    const exists = await sql`
      SELECT id FROM reviews
      WHERE master_id = ${masterId} AND user_id = ${userId} AND comment = ${comment}
      LIMIT 1
    `;
    if (!exists.length) {
      await sql`
        INSERT INTO reviews (master_id, user_id, rating, comment)
        VALUES (${masterId}, ${userId}, ${master.rating[j]}, ${comment})
      `;
    }
  }
}

const shops = [
  {
    name: 'Dragon Tools & Hardware',
    category: 'hardware',
    emirate: 'dubai',
    area: 'International City',
    address: 'Dragon Mart area',
    phone: '+971 4 555 0190',
    description: 'Инструменты, расходники, крепеж и мелкие запчасти. Удобно, когда нужно всё в одном месте.',
    rating: [5, 4, 5]
  },
  {
    name: 'Marina Plumbing Parts',
    category: 'plumbing_parts',
    emirate: 'dubai',
    area: 'Al Quoz',
    address: 'Al Quoz industrial area',
    phone: '+971 4 555 0124',
    description: 'Сифоны, смесители, фитинги, шланги. Часто есть редкие размеры.',
    rating: [4, 5]
  },
  {
    name: 'Bright Electrical Supply',
    category: 'electrical_parts',
    emirate: 'sharjah',
    area: 'Industrial Area',
    address: 'Sharjah Industrial Area',
    phone: '+971 6 555 0188',
    description: 'Электрика, автоматы, лампы, кабель и расходники для мастеров.',
    rating: [5, 4]
  },
  {
    name: 'Tile Studio UAE',
    category: 'tiles',
    emirate: 'dubai',
    area: 'Al Barsha',
    address: 'Near Umm Suqeim Street',
    phone: '+971 4 555 0136',
    description: 'Плитка, затирка, образцы, можно подобрать похожую плитку для ремонта участка.',
    rating: [4, 4, 5]
  },
  {
    name: 'Garden Corner',
    category: 'garden',
    emirate: 'abu_dhabi',
    area: 'Khalifa City',
    address: 'Khalifa City',
    phone: '+971 2 555 0144',
    description: 'Растения, грунт, горшки, капельный полив и всё для балкона.',
    rating: [5, 5]
  }
];

async function ensureShop(shop, index) {
  const existing = await sql`
    SELECT id FROM shops WHERE name = ${shop.name} LIMIT 1
  `;
  if (existing.length) return existing[0].id;

  const rows = await sql`
    INSERT INTO shops
      (name, category, emirate, area, address, phone, description, added_by)
    VALUES
      (${shop.name}, ${shop.category}, ${shop.emirate}, ${shop.area},
       ${shop.address}, ${shop.phone}, ${shop.description}, ${pickUser(index)})
    RETURNING id
  `;
  return rows[0].id;
}

for (let i = 0; i < shops.length; i++) {
  const shop = shops[i];
  const shopId = await ensureShop(shop, i);
  for (let j = 0; j < shop.rating.length; j++) {
    const userId = pickUser(i + j + 2);
    const comment = reviewTexts[(i + j + 2) % reviewTexts.length];
    const exists = await sql`
      SELECT id FROM shop_reviews
      WHERE shop_id = ${shopId} AND user_id = ${userId} AND comment = ${comment}
      LIMIT 1
    `;
    if (!exists.length) {
      await sql`
        INSERT INTO shop_reviews (shop_id, user_id, rating, comment)
        VALUES (${shopId}, ${userId}, ${shop.rating[j]}, ${comment})
      `;
    }
  }
}

const counts = await sql`
  SELECT
    (SELECT COUNT(*) FROM users WHERE email LIKE '%@fixclub.test') AS demo_users,
    (SELECT COUNT(*) FROM masters) AS masters,
    (SELECT COUNT(*) FROM reviews) AS reviews,
    (SELECT COUNT(*) FROM shops) AS shops,
    (SELECT COUNT(*) FROM shop_reviews) AS shop_reviews
`;

console.log('Demo data ready:');
console.table(counts);
console.log('Demo login emails end with @fixclub.test, password: demo12345');
