/**
 * Unit-тесты для SearchService.
 */
import { SearchService } from '../../services/SearchService';
import { cleanDatabase, createDish, createMasterClass, createEvent } from '../helpers';

describe('SearchService', () => {
  afterEach(async () => {
    await cleanDatabase();
  });

  it('находит блюда по названию', async () => {
    await createDish({ name: 'Шаньга традиционная' });
    await createDish({ name: 'Черинянь' });

    const result = await SearchService.search('шаньга');
    expect(result.dishes).toHaveLength(1);
    expect(result.dishes[0].name).toContain('Шаньга');
  });

  it('находит мастер-классы по описанию', async () => {
    await createMasterClass({ title: 'МК по выпечке', description: 'Готовим черинянь вместе' });

    const result = await SearchService.search('черинянь');
    expect(result.masterClasses).toHaveLength(1);
  });

  it('находит мероприятия по локации', async () => {
    await createEvent({ title: 'Фестиваль', location: 'г. Сыктывкар, площадь' });

    const result = await SearchService.search('сыктывкар');
    expect(result.events).toHaveLength(1);
  });

  it('возвращает пустые массивы при пустом запросе', async () => {
    const result = await SearchService.search('');
    expect(result.dishes).toHaveLength(0);
    expect(result.masterClasses).toHaveLength(0);
    expect(result.events).toHaveLength(0);
  });
});
