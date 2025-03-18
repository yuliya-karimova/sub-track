// App.test.jsx
import React from 'react';
import { describe, it, vi, beforeEach, expect } from 'vitest'; // Добавляем expect
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../src/App';
import { getAllSubscriptions, createSubscription, updateSubscription, deleteSubscription } from '../src/services/subscriptionService';

// Мокаем функции из subscriptionService
vi.mock('../src/services/subscriptionService', () => {
  return {
    getAllSubscriptions: vi.fn(),
    createSubscription: vi.fn(),
    updateSubscription: vi.fn(),
    deleteSubscription: vi.fn(),
  };
});

describe('App component', () => {
  beforeEach(() => {
    // Сбрасываем все mock вызовы перед каждым тестом
    vi.resetAllMocks();
  });

  it('должен отрендерить список подписок, полученный с бэкенда', async () => {
    // Мокаем возвращаемые данные
    getAllSubscriptions.mockResolvedValueOnce([
      { _id: '1', name: 'Netflix', cost: 10, startDate: '2023-01-01T00:00:00Z' },
      { _id: '2', name: 'Spotify', cost: 5, startDate: '2023-02-01T00:00:00Z' },
    ]);

    render(<App />);

    // Проверяем, что заголовок показан
    expect(screen.getByText('Subscriptions')).toBeInTheDocument();

    // Ждём, пока компонент загрузит данные и отрендерит
    await waitFor(() => {
      expect(screen.getByText(/Netflix/i)).toBeInTheDocument();
      expect(screen.getByText(/Spotify/i)).toBeInTheDocument();
    });
  });

  it('должен вызывать createSubscription при сабмите формы, когда не в режиме Edit', async () => {
    getAllSubscriptions.mockResolvedValueOnce([]); // изначально пусто
    createSubscription.mockResolvedValueOnce({
      _id: '123',
      name: 'New service',
      cost: '15',
      startDate: '2023-03-01T00:00:00Z',
      endDate: '',
    });

    render(<App />);

    // Заполняем поля формы
    fireEvent.change(screen.getByPlaceholderText('Netflix'), { target: { value: 'New service' } });
    fireEvent.change(screen.getByPlaceholderText('10'), { target: { value: '15' } });
    fireEvent.change(screen.getByLabelText(/Start Date/i), { target: { value: '2023-03-01' } });
    // endDate - опционально

    // Сабмитим
    fireEvent.click(screen.getByRole('button', { name: /Add Subscription/i }));

    // Проверяем вызов createSubscription
    await waitFor(() => {
      expect(createSubscription).toHaveBeenCalledWith({
        name: 'New service',
        cost: '15',
        startDate: '2023-03-01',
        endDate: '',
      });
    });

    // Проверяем, что на экране появилось новое название (список обновился)
    await waitFor(() => {
      expect(screen.getByText('New service')).toBeInTheDocument();
    });
  });

  it('должен переходить в режим Edit и вызывать updateSubscription при сабмите', async () => {
    // Исходный список с одной подпиской
    getAllSubscriptions.mockResolvedValueOnce([
      { _id: '1', name: 'Netflix', cost: 10, startDate: '2023-01-01T00:00:00Z' },
    ]);

    // При update вернём обновлённую подписку
    updateSubscription.mockResolvedValueOnce({
      _id: '1',
      name: 'Netflix Updated',
      cost: 20,
      startDate: '2023-01-01T00:00:00Z',
      endDate: '2023-12-31T00:00:00Z',
    });

    render(<App />);

    // Ждём рендера исходных данных
    await waitFor(() => {
      expect(screen.getByText(/Netflix/i)).toBeInTheDocument();
    });

    // Нажимаем "Edit" на карточке
    fireEvent.click(screen.getByText('Edit'));

    // Поля формы должны заполниться текущими значениями
    const nameInput = screen.getByPlaceholderText('Netflix');
    const costInput = screen.getByPlaceholderText('10');
    expect(nameInput).toHaveValue('Netflix');
    expect(costInput).toHaveValue(10);

    // Меняем поля
    fireEvent.change(nameInput, { target: { value: 'Netflix Updated' } });
    fireEvent.change(costInput, { target: { value: '20' } });
    fireEvent.change(screen.getByLabelText(/End Date \(optional\)/i), { target: { value: '2023-12-31' } });

    // Сабмитим
    fireEvent.click(screen.getByText(/Update Subscription/i));

    // Проверяем вызов updateSubscription
    await waitFor(() => {
      expect(updateSubscription).toHaveBeenCalledWith('1', {
        name: 'Netflix Updated',
        cost: '20',
        startDate: '2023-01-01', // updateSubscription всегда получает YYYY-MM-DD (отрезаем время)
        endDate: '2023-12-31',
      });
    });

    // Теперь на экране должно быть новое название/цена
    await waitFor(() => {
      expect(screen.getByText(/Netflix Updated/i)).toBeInTheDocument();
    });
  });

  it('должен вызывать deleteSubscription при клике на Delete и убирать подписку из списка', async () => {
    // Список из двух подписок
    getAllSubscriptions.mockResolvedValueOnce([
      { _id: '1', name: 'Netflix', cost: 10, startDate: '2023-01-01T00:00:00Z' },
      { _id: '2', name: 'Spotify', cost: 5, startDate: '2023-02-01T00:00:00Z' },
    ]);

    deleteSubscription.mockResolvedValueOnce({ success: true });

    render(<App />);

    await waitFor(() => {
      expect(screen.getByText(/Netflix/i)).toBeInTheDocument();
      expect(screen.getByText(/Spotify/i)).toBeInTheDocument();
    });

    // Удаляем Netflix
    const deleteButtons = screen.getAllByText(/Delete/i);
    fireEvent.click(deleteButtons[0]); // предполагается, что первая кнопка Delete относится к Netflix

    await waitFor(() => {
      expect(deleteSubscription).toHaveBeenCalledWith('1');
    });

    // Netflix должен исчезнуть со страницы
    expect(screen.queryByText(/Netflix/i)).not.toBeInTheDocument();
    // Spotify остаётся
    expect(screen.getByText(/Spotify/i)).toBeInTheDocument();
  });
});
