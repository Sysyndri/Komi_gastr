/**
 * Seed базы данных платформы «Гастрономия Коми».
 * Идемпотентный: повторный запуск обновляет существующие записи, а не дублирует.
 * Создаёт: администратора, 5 блюд, 3 заведения, 2 мастер-класса, 1 мероприятие.
 */
import { PrismaClient, Role, Difficulty, Status } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // --- Администратор и демо-пользователь ---
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@gastronomiakomi.ru';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'Admin123!';
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash: await bcrypt.hash(adminPassword, 10),
      name: 'Главный администратор',
      role: Role.ADMIN,
    },
  });
  console.log(`  ✓ Admin: ${admin.email}`);

  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@gastronomiakomi.ru' },
    update: {},
    create: {
      email: 'demo@gastronomiakomi.ru',
      passwordHash: await bcrypt.hash('User12345', 10),
      name: 'Демо пользователь',
      role: Role.USER,
    },
  });
  console.log(`  ✓ Demo user: ${demoUser.email}`);

  // --- 5 национальных блюд коми ---
  const dishSpecs = [
    {
      name: 'Шаньга',
      nameKomi: 'Шаньга',
      description:
        'Открытый круглый пирожок из пресного или дрожжевого теста с начинкой из картофеля, каши или творога.',
      history: 'Одно из самых древних блюд коми — выпекалось в русской печи и подавалось к чаю.',
      category: 'Выпечка',
      difficulty: Difficulty.EASY,
      cookingTimeMin: 60,
      recipe: '1. Замесить тесто. 2. Раскатать круги. 3. Положить начинку. 4. Запечь 25 минут.',
      tags: ['выпечка', 'традиционное', 'вегетарианское'],
      isPinned: true,
    },
    {
      name: 'Черинянь',
      nameKomi: 'Черинянь',
      description: 'Рыбный пирог из ржаного теста с начинкой из сига, щуки или налима.',
      history: 'Ритуальное блюдо северных коми, символизирующее уважение к реке и рыбе.',
      category: 'Выпечка',
      difficulty: Difficulty.MEDIUM,
      cookingTimeMin: 120,
      recipe: '1. Приготовить ржаное тесто. 2. Уложить слоями рыбу. 3. Запекать 50 минут.',
      tags: ['выпечка', 'рыбное', 'праздничное'],
    },
    {
      name: 'Кызьяур',
      nameKomi: 'Кызьяур',
      description: 'Мясное блюдо из дичи с дикоросами и кореньями.',
      history: 'Охотничье блюдо, готовившееся в котелке на костре в тайге.',
      category: 'Вторые блюда',
      difficulty: Difficulty.HARD,
      cookingTimeMin: 180,
      recipe: '1. Обжарить мясо. 2. Добавить коренья и ягоды. 3. Тушить 2 часа.',
      tags: ['мясное', 'дичь', 'сезонное'],
    },
    {
      name: 'Пельмени по-коми',
      nameKomi: 'Пельнянь',
      description: 'Пельмени с мясной начинкой, отличающиеся формой «ушка» и подачей со сметаной.',
      history: 'Слово «пельмень» происходит от коми «пельнянь» — хлебное ухо.',
      category: 'Вторые блюда',
      difficulty: Difficulty.MEDIUM,
      cookingTimeMin: 90,
      recipe: '1. Замесить тесто. 2. Приготовить фарш. 3. Лепить ушки. 4. Варить 5 минут.',
      tags: ['мясное', 'традиционное'],
    },
    {
      name: 'Суп с папоротником',
      nameKomi: 'Косаки шыд',
      description: 'Лёгкий суп с молодыми побегами папоротника-орляка и лесными травами.',
      history: 'Весеннее блюдо, собираемое в период роста побегов папоротника.',
      category: 'Супы',
      difficulty: Difficulty.EASY,
      cookingTimeMin: 45,
      recipe: '1. Сварить бульон. 2. Добавить побеги папоротника. 3. Варить 20 минут.',
      tags: ['вегетарианское', 'сезонное', 'летнее'],
    },
  ];

  const dishes: Record<string, { id: string }> = {};
  for (const spec of dishSpecs) {
    const existing = await prisma.dish.findFirst({ where: { name: spec.name } });
    const dish = existing
      ? await prisma.dish.update({ where: { id: existing.id }, data: spec })
      : await prisma.dish.create({ data: spec });
    dishes[spec.name] = dish;
  }
  console.log(`  ✓ ${Object.keys(dishes).length} dishes`);

  // --- 3 заведения ---
  const placeSpecs = [
    {
      name: 'Ресторан «Парма»',
      address: 'г. Сыктывкар, ул. Бабушкина, 30',
      latitude: 61.7849,
      longitude: 50.7892,
      phone: '+7 (8212) 30-00-00',
      website: 'https://example.ru/parma',
      workHours: 'Пн–Вс: 10:00–23:00',
      description: 'Аутентичная кухня коми в центре Сыктывкара.',
    },
    {
      name: 'Кафе «Тундра»',
      address: 'г. Ухта, пр. Ленина, 45',
      latitude: 63.5669,
      longitude: 53.6858,
      phone: '+7 (82147) 5-00-00',
      website: 'https://example.ru/tundra',
      workHours: 'Пн–Вс: 09:00–22:00',
      description: 'Уютное кафе с блюдами северной кухни.',
    },
    {
      name: 'Трактир «Северный»',
      address: 'г. Воркута, ул. Ленина, 12',
      latitude: 67.4988,
      longitude: 64.0844,
      phone: '+7 (82151) 4-00-00',
      workHours: 'Вт–Вс: 12:00–23:00',
      description: 'Традиционные блюда заполярья и коми.',
    },
  ];

  const places: Record<string, { id: string }> = {};
  for (const spec of placeSpecs) {
    const existing = await prisma.place.findFirst({ where: { name: spec.name } });
    const place = existing
      ? await prisma.place.update({ where: { id: existing.id }, data: spec })
      : await prisma.place.create({ data: spec });
    places[spec.name] = place;
  }
  console.log(`  ✓ ${Object.keys(places).length} places`);

  // --- Связи блюд с заведениями ---
  const dishPlaces: [string, string[]][] = [
    ['Ресторан «Парма»', ['Шаньга', 'Черинянь', 'Пельмени по-коми']],
    ['Кафе «Тундра»', ['Кызьяур', 'Суп с папоротником']],
    ['Трактир «Северный»', ['Шаньга', 'Пельмени по-коми']],
  ];
  for (const [placeName, dishNames] of dishPlaces) {
    await prisma.place.update({
      where: { id: places[placeName].id },
      data: { dishes: { connect: dishNames.map((n) => ({ id: dishes[n].id })) } },
    });
  }
  console.log('  ✓ dish-place relations');

  // --- 2 мастер-класса ---
  const mcDate = (offsetDays: number, hour: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    d.setHours(hour, 0, 0, 0);
    return d;
  };

  const mcSpecs = [
    {
      title: 'Приготовление шаньги',
      shortDescription: 'Учимся печь настоящие коми шаньги с картофельной начинкой.',
      description:
        'На мастер-классе вы узнаете историю шаньги, замесите тесто, подготовите начинку и испечёте классические шаньги в духовке. Все ингредиенты и инвентарь предоставляются.',
      date: mcDate(7, 12),
      durationMin: 120,
      price: 1500,
      maxParticipants: 12,
      status: Status.ACTIVE,
    },
    {
      title: 'Рыбный пирог черинянь',
      shortDescription: 'Осваиваем ритуальный рыбный пирог коми из ржаного теста.',
      description:
        'Глубокое погружение в традицию черинянь: работа с ржаным тестом, разделка сига, сборка пирога и выпечка. Подходит для среднего уровня.',
      date: mcDate(14, 15),
      durationMin: 180,
      price: 2500,
      maxParticipants: 8,
      status: Status.ACTIVE,
    },
  ];

  const masterClasses: { id: string }[] = [];
  for (const spec of mcSpecs) {
    const existing = await prisma.masterClass.findFirst({ where: { title: spec.title } });
    const mc = existing
      ? await prisma.masterClass.update({
          where: { id: existing.id },
          data: {
            ...spec,
            dish: {
              connect: {
                id: (spec.title.includes('Шаньга') ? dishes['Шаньга'] : dishes['Черинянь']).id,
              },
            },
            place: {
              connect: {
                id: (spec.title.includes('Шаньга')
                  ? places['Ресторан «Парма»']
                  : places['Кафе «Тундра»']
                ).id,
              },
            },
          },
        })
      : await prisma.masterClass.create({
          data: {
            ...spec,
            dish: {
              connect: {
                id: (spec.title.includes('Шаньга') ? dishes['Шаньга'] : dishes['Черинянь']).id,
              },
            },
            place: {
              connect: {
                id: (spec.title.includes('Шаньга')
                  ? places['Ресторан «Парма»']
                  : places['Кафе «Тундра»']
                ).id,
              },
            },
          },
        });
    masterClasses.push(mc);
  }
  console.log(`  ✓ ${masterClasses.length} master classes`);

  // --- 1 мероприятие ---
  const eventData = {
    title: 'Фестиваль шаньги 2026',
    description:
      'Городской фестиваль, посвящённый главному символу коми кухни. Дегустации, мастер-классы, ярмарка и концерт.',
    startDate: mcDate(30, 10),
    endDate: mcDate(30, 20),
    location: 'г. Сыктывкар, Стефановская площадь',
    price: 0,
    maxVisitors: 5000,
    status: Status.ACTIVE,
  };
  const existingEvent = await prisma.event.findFirst({ where: { title: eventData.title } });
  const event = existingEvent
    ? await prisma.event.update({
        where: { id: existingEvent.id },
        data: { ...eventData, place: { connect: { id: places['Ресторан «Парма»'].id } } },
      })
    : await prisma.event.create({
        data: { ...eventData, place: { connect: { id: places['Ресторан «Парма»'].id } } },
      });
  console.log(`  ✓ 1 event: ${event.title}`);

  console.log('🌱 Seeding complete.');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
