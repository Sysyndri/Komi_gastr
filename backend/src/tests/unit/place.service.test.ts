/**
 * Unit-тесты для PlaceService.
 */
import { PlaceService } from '../../services/PlaceService';
import { cleanDatabase, createDish, createPlace } from '../helpers';

describe('PlaceService', () => {
  afterEach(async () => {
    await cleanDatabase();
  });

  describe('list', () => {
    it('возвращает заведения', async () => {
      await createPlace({ name: 'Кафе А' });
      await createPlace({ name: 'Ресторан Б' });

      const result = await PlaceService.list();
      expect(result).toHaveLength(2);
    });

    it('фильтрует по поиску', async () => {
      await createPlace({ name: 'Парма' });
      await createPlace({ name: 'Тундра' });

      const result = await PlaceService.list('Парма');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Парма');
    });
  });

  describe('getById', () => {
    it('возвращает заведение с блюдами', async () => {
      const dish = await createDish({ name: 'Шаньга' });
      const place = await createPlace({ name: 'Кафе с блюдом' });
      await PlaceService.update(place.id, { dishIds: [dish.id] });

      const found = await PlaceService.getById(place.id);
      expect(found.name).toBe('Кафе с блюдом');
      expect(found.dishes).toHaveLength(1);
    });

    it('бросает 404 при отсутствии', async () => {
      await expect(PlaceService.getById('clqnonexistent000000000000001')).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  describe('CRUD', () => {
    it('создаёт, обновляет и удаляет заведение', async () => {
      const place = await PlaceService.create({
        name: 'Новое заведение',
        address: 'г. Новый, ул. Новая, 1',
        latitude: 60.0,
        longitude: 50.0,
      } as never);
      expect(place.id).toBeDefined();

      const updated = await PlaceService.update(place.id, { name: 'Обновлённое' });
      expect(updated.name).toBe('Обновлённое');

      await PlaceService.remove(place.id);
      await expect(PlaceService.getById(place.id)).rejects.toMatchObject({ statusCode: 404 });
    });
  });
});
