/**
 * Unit-тесты для DishService.
 */
import { DishService } from '../../services/DishService';
import { cleanDatabase, createDish, createPlace } from '../helpers';
import { Difficulty } from '@prisma/client';
describe('DishService', () => {
  afterEach(async () => {
    await cleanDatabase();
  });

  describe('list', () => {
    it('возвращает блюда с пагинацией', async () => {
      for (let i = 0; i < 5; i++) {
        await createDish({ name: `Блюдо ${i}` });
      }
      const result = await DishService.list({ page: 1, limit: 2 });
      expect(result.items).toHaveLength(2);
      expect(result.total).toBe(5);
      expect(result.pages).toBe(3);
    });

    it('фильтрует по сложности', async () => {
      await createDish({ name: 'Лёгкое', difficulty: Difficulty.EASY });
      await createDish({ name: 'Сложное', difficulty: Difficulty.HARD });

      const result = await DishService.list({ difficulty: Difficulty.HARD, page: 1, limit: 10 });
      expect(result.items).toHaveLength(1);
      expect(result.items[0].name).toBe('Сложное');
    });

    it('ищет по названию (без учёта регистра)', async () => {
      await createDish({ name: 'Шаньга коми' });
      await createDish({ name: 'Черинянь' });

      const result = await DishService.list({ search: 'шаньга', page: 1, limit: 10 });
      expect(result.items).toHaveLength(1);
    });
  });

  describe('getById', () => {
    it('возвращает блюдо по id', async () => {
      const dish = await createDish({ name: 'Пельмени' });
      const found = await DishService.getById(dish.id);
      expect(found.name).toBe('Пельмени');
    });

    it('бросает 404 при отсутствии', async () => {
      await expect(DishService.getById('clqnonexistent000000000000001')).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  describe('create + update + remove', () => {
    it('создаёт блюдо с заведениями', async () => {
      const place = await createPlace({ name: 'Кафе' });
      const dish = await DishService.create({
        name: 'Новое блюдо',
        description: 'Описание нового блюда достаточной длины',
        difficulty: Difficulty.MEDIUM,
        cookingTimeMin: 45,
        placeIds: [place.id],
      } as never);
      expect(dish.id).toBeDefined();
      expect(dish.places).toHaveLength(1);
    });

    it('обновляет блюдо', async () => {
      const dish = await createDish({ name: 'Старое название' });
      const updated = await DishService.update(dish.id, { name: 'Новое название' });
      expect(updated.name).toBe('Новое название');
    });

    it('удаляет блюдо', async () => {
      const dish = await createDish();
      await DishService.remove(dish.id);
      await expect(DishService.getById(dish.id)).rejects.toMatchObject({ statusCode: 404 });
    });
  });
});
