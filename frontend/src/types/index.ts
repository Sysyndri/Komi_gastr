/**
 * Типы данных платформы «Гастрономия Коми» — зеркало Prisma-схемы backend.
 */

export type Role = 'USER' | 'MODERATOR' | 'ADMIN';
export type Status = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type BookingStatus = 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';

// ---- Модели данных ----
export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  phone?: string | null;
  isBlocked: boolean;
  avatarUrl?: string | null;
  createdAt: string;
}

export interface Dish {
  id: string;
  name: string;
  nameKomi?: string | null;
  description: string;
  history?: string | null;
  category?: string | null;
  difficulty: Difficulty;
  cookingTimeMin: number;
  recipe?: string | null;
  tags: string[];
  imageUrl?: string | null;
  isPinned: boolean;
  createdAt: string;
  places?: PlaceSummary[];
}

export interface Place {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  phone?: string | null;
  website?: string | null;
  workHours?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  dishes?: Dish[];
  masterClasses?: MasterClass[];
}

export interface PlaceSummary {
  id: string;
  name: string;
  address: string;
}

export interface MasterClass {
  id: string;
  title: string;
  shortDescription?: string | null;
  description: string;
  date: string;
  durationMin: number;
  price: number;
  maxParticipants: number;
  status: Status;
  imageUrl?: string | null;
  dishId?: string | null;
  placeId?: string | null;
  dish?: { id: string; name: string; imageUrl?: string | null } | null;
  place?: PlaceSummary | null;
  bookingsCount?: number;
  availableSeats?: number;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate?: string | null;
  location: string;
  price: number;
  maxVisitors?: number | null;
  status: Status;
  imageUrl?: string | null;
  place?: PlaceSummary | null;
  bookingsCount?: number;
  availableSeats?: number | null;
}

export interface Booking {
  id: string;
  userId: string;
  masterClassId: string;
  status: BookingStatus;
  createdAt: string;
  masterClass?: MasterClass;
}

export interface EventBooking {
  id: string;
  userId: string;
  eventId: string;
  status: BookingStatus;
  createdAt: string;
  event?: Event;
}

// ---- API-ответы ----
export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export interface Pagination<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    sub: string;
    email: string;
    role: Role;
    name: string;
  };
}

export interface MyBookingsResponse {
  masterClasses: Booking[];
  events: EventBooking[];
}

export interface StatsResponse {
  users: number;
  activeUsers: number;
  usersLastMonth: number;
  userGrowth: number;
  dishes: number;
  places: number;
  masterClasses: number;
  events: number;
  bookings: number;
  eventBookings: number;
  totalBookings: number;
  revenue: number;
  avgPrice: number;
  topMasterClasses: Array<{
    id: string;
    title: string;
    date: string;
    price: number;
    _count: { bookings: number };
  }>;
}

export interface SearchResults {
  dishes: Dish[];
  masterClasses: MasterClass[];
  events: Event[];
}

// ---- Запросы ----
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

export interface MasterClassFormValues {
  title: string;
  shortDescription?: string;
  description: string;
  date: string;
  durationMin: number;
  price: number;
  maxParticipants: number;
  status: Status;
  imageUrl?: string;
  dishId?: string;
  placeId?: string;
}

export interface EventFormValues {
  title: string;
  description: string;
  startDate: string;
  endDate?: string;
  location: string;
  price: number;
  maxVisitors?: number;
  status: Status;
  imageUrl?: string;
  placeId?: string;
}

export interface DishFormValues {
  name: string;
  nameKomi?: string;
  description: string;
  history?: string;
  category?: string;
  difficulty: Difficulty;
  cookingTimeMin: number;
  recipe?: string;
  tags: string[];
  imageUrl?: string;
  isPinned: boolean;
}