/**
 * Тесты организмов: MasterClassList.
 */
import { render, screen, fireEvent } from '@testing-library/react';
import { MasterClassList } from '@/components/organisms/MasterClassList';
import { MasterClass } from '@/types';

const mc: MasterClass = {
  id: 'mc-1',
  title: 'Приготовление шаньги',
  shortDescription: 'Кратко',
  description: 'Описание',
  date: new Date(Date.now() + 7 * 86_400_000).toISOString(),
  durationMin: 120,
  price: 1500,
  maxParticipants: 12,
  status: 'ACTIVE',
  availableSeats: 10,
};

describe('MasterClassList', () => {
  it('показывает спиннер при загрузке', () => {
    render(<MasterClassList masterClasses={undefined} isLoading isError={false} />);
    expect(screen.getByTestId('spinner')).toBeInTheDocument();
  });

  it('показывает сообщение об ошибке', () => {
    render(<MasterClassList masterClasses={undefined} isLoading={false} isError />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('показывает пустое состояние', () => {
    render(
      <MasterClassList masterClasses={[]} isLoading={false} isError={false} emptyMessage="Ничего нет" />,
    );
    expect(screen.getByText('Ничего нет')).toBeInTheDocument();
  });

  it('рендерит карточки мастер-классов', () => {
    render(
      <MasterClassList
        masterClasses={[mc, { ...mc, id: 'mc-2', title: 'Черинянь' }]}
        isLoading={false}
        isError={false}
      />,
    );
    expect(screen.getAllByTestId('masterclass-card')).toHaveLength(2);
  });

  it('отображает пагинацию и обрабатывает переходы', () => {
    const onPageChange = jest.fn();
    render(
      <MasterClassList
        masterClasses={[mc]}
        isLoading={false}
        isError={false}
        page={1}
        pages={3}
        onPageChange={onPageChange}
      />,
    );

    expect(screen.getByText('1 / 3')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Вперёд →'));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });
});