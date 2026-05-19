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
  ['Anna', 'anna.demo@fixclub.test'],
  ['Maria', 'maria.demo@fixclub.test'],
  ['Olga', 'olga.demo@fixclub.test'],
  ['Kate', 'katya.demo@fixclub.test'],
  ['Irina', 'irina.demo@fixclub.test']
];

async function ensureUser(name, email) {
  const existing = await sql`
    SELECT id FROM users WHERE LOWER(email) = LOWER(${email}) LIMIT 1
  `;
  if (existing.length) {
    await sql`
      UPDATE users SET name = ${name}
      WHERE LOWER(email) = LOWER(${email})
    `;
    return existing[0].id;
  }

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
    description: 'Careful plumber for leaks, faucets, drains, and small repairs. Responds quickly and brings his own tools.',
    rating: [5, 5, 4]
  },
  {
    name: 'Rashid AC Service',
    specialty: 'ac',
    emirate: 'dubai',
    area: 'JLT',
    phone: '+971 55 901 6682',
    description: 'AC cleaning and repair. Good for urgent calls before summer and gives the price upfront.',
    rating: [5, 4, 5, 5]
  },
  {
    name: 'Mohan Electric Works',
    specialty: 'electrician',
    emirate: 'dubai',
    area: 'Downtown',
    phone: '+971 52 774 1903',
    description: 'Sockets, breakers, lighting, and diagnostics. Explains clearly what went wrong.',
    rating: [5, 5]
  },
  {
    name: 'SwiftFix Handyman',
    specialty: 'handyman',
    emirate: 'dubai',
    area: 'Business Bay',
    phone: '+971 58 441 2280',
    description: 'Shelves, curtain rods, and small post-move tasks. Good for a two-hour list of fixes.',
    rating: [4, 5, 4]
  },
  {
    name: 'Clean Nest Team',
    specialty: 'cleaner',
    emirate: 'dubai',
    area: 'Palm Jumeirah',
    phone: '+971 56 700 3921',
    description: 'Deep cleaning, windows, and post-renovation cleaning. Best booked a few days ahead.',
    rating: [5, 5, 5]
  },
  {
    name: 'Ali Doors & Locks',
    specialty: 'locksmith',
    emirate: 'dubai',
    area: 'Jumeirah',
    phone: '+971 50 662 8814',
    description: 'Locks, handles, door closers, and door adjustments. Fast response for urgent calls.',
    rating: [5, 4]
  },
  {
    name: 'Blue Tile Crew',
    specialty: 'tiler',
    emirate: 'dubai',
    area: 'Al Barsha',
    phone: '+971 54 188 7720',
    description: 'Bathroom and balcony tiles, clean grout work, and small repairs without redoing the whole area.',
    rating: [4, 4, 5]
  },
  {
    name: 'Green Balcony Plants',
    specialty: 'gardener',
    emirate: 'dubai',
    area: 'Arabian Ranches',
    phone: '+971 52 340 0199',
    description: 'Balcony and villa plants, irrigation, and regular care. Knows what survives UAE sun.',
    rating: [5, 5]
  },
  {
    name: 'Sharjah Movers Pro',
    specialty: 'mover',
    emirate: 'sharjah',
    area: 'Al Majaz',
    phone: '+971 55 448 9230',
    description: 'Moves between emirates, packing, and furniture disassembly. Careful with boxes and glass.',
    rating: [5, 4, 4]
  },
  {
    name: 'Capital Appliance Repair',
    specialty: 'appliance',
    emirate: 'abu_dhabi',
    area: 'Al Reem Island',
    phone: '+971 50 918 3306',
    description: 'Washing machines, dryers, and dishwashers. Diagnoses first, then explains repair options.',
    rating: [4, 5]
  },
  {
    name: 'Ajman Furniture Doctor',
    specialty: 'furniture_repair',
    emirate: 'ajman',
    area: 'Al Nuaimiya',
    phone: '+971 58 230 4100',
    description: 'Sofa, chair leg, hardware, and cabinet repairs. Can take parts back to the workshop.',
    rating: [5, 4]
  },
  {
    name: 'RAK Pest Control',
    specialty: 'pest',
    emirate: 'rak',
    area: 'Mina Al Arab',
    phone: '+971 56 114 7810',
    description: 'Pest control for apartments and villas, especially ants and cockroaches. Sends prep instructions before the visit.',
    rating: [4, 5, 5]
  }
];

const reviewTexts = [
  'Arrived on time, worked neatly, and cleaned up afterward.',
  'The price matched what was agreed in advance. Easy to recommend.',
  'Replied quickly on WhatsApp and came the same day.',
  'Good work, but it is worth confirming all materials upfront.',
  'Calm and professional, no unnecessary upselling.'
];

const legacyReviewMap = [
  [
    '\u041f\u0440\u0438\u0448\u0451\u043b \u0432\u043e\u0432\u0440\u0435\u043c\u044f, \u0441\u0434\u0435\u043b\u0430\u043b \u0430\u043a\u043a\u0443\u0440\u0430\u0442\u043d\u043e, \u043f\u043e\u0441\u043b\u0435 \u0441\u0435\u0431\u044f \u0432\u0441\u0451 \u0443\u0431\u0440\u0430\u043b.',
    reviewTexts[0]
  ],
  [
    '\u0426\u0435\u043d\u0430 \u0441\u043e\u0432\u043f\u0430\u043b\u0430 \u0441 \u0442\u0435\u043c, \u0447\u0442\u043e \u0441\u043a\u0430\u0437\u0430\u043b \u0437\u0430\u0440\u0430\u043d\u0435\u0435. \u041c\u043e\u0436\u043d\u043e \u0440\u0435\u043a\u043e\u043c\u0435\u043d\u0434\u043e\u0432\u0430\u0442\u044c.',
    reviewTexts[1]
  ],
  [
    '\u0411\u044b\u0441\u0442\u0440\u043e \u043e\u0442\u0432\u0435\u0442\u0438\u043b \u0432 WhatsApp \u0438 \u043f\u0440\u0438\u0435\u0445\u0430\u043b \u0432 \u0442\u043e\u0442 \u0436\u0435 \u0434\u0435\u043d\u044c.',
    reviewTexts[2]
  ],
  [
    '\u0420\u0430\u0431\u043e\u0442\u0430 \u043d\u043e\u0440\u043c\u0430\u043b\u044c\u043d\u0430\u044f, \u043d\u043e \u043b\u0443\u0447\u0448\u0435 \u0437\u0430\u0440\u0430\u043d\u0435\u0435 \u043f\u0440\u043e\u0433\u043e\u0432\u043e\u0440\u0438\u0442\u044c \u0432\u0441\u0435 \u043c\u0430\u0442\u0435\u0440\u0438\u0430\u043b\u044b.',
    reviewTexts[3]
  ],
  [
    '\u041e\u0447\u0435\u043d\u044c \u0441\u043f\u043e\u043a\u043e\u0439\u043d\u043e \u0438 \u043f\u0440\u043e\u0444\u0435\u0441\u0441\u0438\u043e\u043d\u0430\u043b\u044c\u043d\u043e, \u0431\u0435\u0437 \u043b\u0438\u0448\u043d\u0438\u0445 \u0440\u0430\u0437\u0433\u043e\u0432\u043e\u0440\u043e\u0432.',
    reviewTexts[4]
  ]
];

for (const [oldComment, newComment] of legacyReviewMap) {
  await sql`UPDATE reviews SET comment = ${newComment} WHERE comment = ${oldComment}`;
  await sql`UPDATE shop_reviews SET comment = ${newComment} WHERE comment = ${oldComment}`;
}

async function ensureMaster(master, index) {
  const existing = await sql`
    SELECT id FROM masters WHERE name = ${master.name} LIMIT 1
  `;
  if (existing.length) {
    await sql`
      UPDATE masters
      SET phone = ${master.phone},
          specialty = ${master.specialty},
          emirate = ${master.emirate},
          area = ${master.area},
          description = ${master.description}
      WHERE id = ${existing[0].id}
    `;
    return existing[0].id;
  }

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
    description: 'Tools, consumables, fasteners, and small parts. Convenient when you need everything in one place.',
    rating: [5, 4, 5]
  },
  {
    name: 'Marina Plumbing Parts',
    category: 'plumbing_parts',
    emirate: 'dubai',
    area: 'Al Quoz',
    address: 'Al Quoz industrial area',
    phone: '+971 4 555 0124',
    description: 'Traps, mixers, fittings, and hoses. Often has unusual sizes in stock.',
    rating: [4, 5]
  },
  {
    name: 'Bright Electrical Supply',
    category: 'electrical_parts',
    emirate: 'sharjah',
    area: 'Industrial Area',
    address: 'Sharjah Industrial Area',
    phone: '+971 6 555 0188',
    description: 'Electrical parts, breakers, lamps, cable, and supplies for technicians.',
    rating: [5, 4]
  },
  {
    name: 'Tile Studio UAE',
    category: 'tiles',
    emirate: 'dubai',
    area: 'Al Barsha',
    address: 'Near Umm Suqeim Street',
    phone: '+971 4 555 0136',
    description: 'Tiles, grout, samples, and help finding a close match for small repairs.',
    rating: [4, 4, 5]
  },
  {
    name: 'Garden Corner',
    category: 'garden',
    emirate: 'abu_dhabi',
    area: 'Khalifa City',
    address: 'Khalifa City',
    phone: '+971 2 555 0144',
    description: 'Plants, soil, pots, drip irrigation, and balcony supplies.',
    rating: [5, 5]
  }
];

async function ensureShop(shop, index) {
  const existing = await sql`
    SELECT id FROM shops WHERE name = ${shop.name} LIMIT 1
  `;
  if (existing.length) {
    await sql`
      UPDATE shops
      SET category = ${shop.category},
          emirate = ${shop.emirate},
          area = ${shop.area},
          address = ${shop.address},
          phone = ${shop.phone},
          description = ${shop.description}
      WHERE id = ${existing[0].id}
    `;
    return existing[0].id;
  }

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
