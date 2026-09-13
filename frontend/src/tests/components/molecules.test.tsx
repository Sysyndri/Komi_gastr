/**
 * Тесты молекул: SearchBar, FilterBar, BookingForm, карточек.
 */
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchBar } from '@/components/molecules/SearchBar';
import { FilterBar } from '@/components/molecules/FilterBar';
import { BookingForm } from '@/components/molecules/BookingForm';
import { MasterClassCard } from '@/components/molecules/MasterClassCard';
import { EventCard } from '@/components/molecules/EventCard';
import { MasterClass, Event } from '@/types';

describe('SearchBar', () => {
  it('вызывает onSearch при отправке формы', async () => {
    const onSearch = jest.fn();
    render(<SearchBar placeholder="Поиск..." onSearch={onSearch} />);

    await userEvent.type(screen.getByLabelText('Поиск'), 'шаньга');
    fireEvent.submit(screen.getByTestId('search-bar'));

    expect(onSearch).toHaveBeenCalledWith('шаньга');
  });
});

describe('FilterBar', () => {
  it('рендерит фильтры и вызывает onChange', async () => {
    const onChange = jest.fn();
    render(
      <FilterBar
        filters={[
          {
            key: 'difficulty',
            label: 'Сложность',
            options: [
              { value: 'EASY', label: 'Легко' },
              { value: 'HARD', label: 'Сложно' },
            ],
          },
        ]}
        values={{}}
        onChange={onChange}
      />,
    );

    const select = screen.getByLabelText('Сложность');
    await userEvent.selectOptions(select, 'HARD');
    expect(onChange).toHaveBeenCalledWith('difficulty', 'HARD');
  });
});

const sampleMasterClass: MasterClass = {
  id: 'mc-1',
  title: 'Приготовление шаньги',
  shortDescription: 'Учимся печь настоящие шаньги',
  description: 'Полное описание',
  date: new Date(Date.now() + 7 * 86_400_000).toISOString(),
  durationMin: 120,
  price: 1500,
  maxParticipants: 12,
  status: 'ACTIVE',
  availableSeats: 10,
  place: { id: 'p1', name: 'Парма', address: 'ул. Бабушкина' },
  dish: { id: 'd1', name: 'Шаньга' },
};

describe('MasterClassCard', () => {
  it('отображает название, цену и свободные места', () => {
    render(<MasterClassCard masterClass={sampleMasterClass} />);
    expect(screen.getByText('Приготовление шаньги')).toBeInTheDocument();
    expect(screen.getByText('1500 ₽')).toBeInTheDocument();
    expect(screen.getByText(/Свободно 10 мест/)).toBeInTheDocument();
    expect(screen.getByText('Подробнее')).toBeInTheDocument();
  });

  it('отображает «Бесплатно» для нулевой цены', () => {
    render(<MasterClassCard masterClass={{ ...sampleMasterClass, price: 0 }} />);
    expect(screen.getByText('Бесплатно')).toBeInTheDocument();
  });
});

const sampleEvent: Event = {
  id: 'ev-1',
  title: 'Фестиваль шаньги',
  description: 'Городской фестиваль',
  startDate: new Date(Date.now() + 30 * 86_400_000).toISOString(),
  location: 'г. Сыктывкар',
  price: 0,
  status: 'ACTIVE',
};

describe('EventCard', () => {
  it('отображает название и бейдж «Бесплатно»', () => {
    render(<EventCard event={sampleEvent} />);
    expect(screen.getByText('Фестиваль шаньги')).toBeInTheDocument();
    expect(screen.getAllByText('Бесплатно').length).toBeGreaterThan(0);
  });
});

describe('BookingForm', () => {
  it('при незаполненных местах показывает уведомление', () => {
    render(
      <BookingForm
        masterClass={{ ...sampleMasterClass, availableSeats: 0 }}
        isAuthenticated
        onSubmit={jest.fn()}
      />,
    );
    expect(screen.getByTestId('booking-full')).toBeInTheDocument();
  });

  it('при уже записанном пользователе показывает статус', () => {
    render(
      <BookingForm
        masterClass={sampleMasterClass}
        isAlreadyBooked
        isAuthenticated
        onSubmit={jest.fn()}
      />,
    );
    expect(screen.getByTestId('booking-done')).toBeInTheDocument();
  });

  it('при неавторизованном пользователе предлагает войти', () => {
    render(
      <BookingForm masterClass={sampleMasterClass} isAuthenticated={false} onSubmit={jest.fn()} />,
    );
    expect(screen.getByTestId('booking-auth-required')).toBeInTheDocument();
  });

  it('показывает форму и отправляет её', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    render(<BookingForm masterClass={sampleMasterClass} isAuthenticated onSubmit={onSubmit} />);

    expect(screen.getByTestId('booking-form')).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Ваше имя'), 'Иван');
    fireEvent.submit(screen.getByTestId('booking-form'));
    expect(onSubmit).toHaveBeenCalled();
  });
});