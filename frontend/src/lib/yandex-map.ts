/**
 * Интеграция с Yandex Maps JS API 3.0.
 * Ключевые положения документации, использованные здесь:
 *  1. API подключается скриптом `https://api-maps.yandex.ru/v3/?apikey=KEY&lang=ru_RU`.
 *  2. Компоненты доступны только в глобальной переменной `ymaps3`.
 *  3. Работать с API можно только после резолва промиса `ymaps3.ready`.
 *  4. Карта — `new YMap(container, { location: { center, zoom } })`,
 *     к ней добавляются слои `YMapDefaultSchemeLayer` и `YMapDefaultFeaturesLayer`.
 *  5. Метка — `new YMapMarker({ coordinates }, htmlElement)`, удаляется через `map.removeChild(marker)`.
 */

/** Типы JS API (официальный пакет @yandex/ymaps3-types). */
type Ymaps3Api = typeof import("@yandex/ymaps3-types");
type YMapInstance = import("@yandex/ymaps3-types").YMap;
type YMapMarkerInstance = import("@yandex/ymaps3-types").YMapMarker;

/** Точка для отображения на карте. */
export interface MapPoint {
  id: string;
  name: string;
  address: string;
  /** Долгота (первая координата в LngLat). */
  longitude: number;
  /** Широта (вторая координата в LngLat). */
  latitude: number;
}

/** Колбэк при клике на метку. */
export type PointClickHandler = (point: MapPoint) => void;

/** Ключ API из переменных окружения Next.js. */
export const YANDEX_MAPS_KEY =
  process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY ?? "";

/** Признак: карта доступна (задан ключ API). */
export const isMapAvailable = YANDEX_MAPS_KEY.length > 0;

/** URL загрузчика JS API 3.0 (формат из документации). */
function loaderUrl(apiKey: string): string {
  return `https://api-maps.yandex.ru/v3/?apikey=${encodeURIComponent(apiKey)}&lang=ru_RU`;
}

/** Читает глобальную переменную ymaps3 (появляется после загрузки скрипта). */
function getGlobalApi(): Ymaps3Api | undefined {
  return (window as unknown as { ymaps3?: Ymaps3Api }).ymaps3;
}

/** Промис загрузки API — чтобы скрипт подключался ровно один раз. */
let loadPromise: Promise<typeof ymaps3> | null = null;

/**
 * Загружает JS API 3.0 и ждёт резолва `ymaps3.ready`.
 * Повторные вызовы возвращают тот же промис (скрипт не дублируется).
 */
export function loadYmaps3(
  apiKey: string = YANDEX_MAPS_KEY,
): Promise<typeof ymaps3> {
  if (!apiKey) {
    return Promise.reject(
      new Error("Не задан NEXT_PUBLIC_YANDEX_MAPS_API_KEY"),
    );
  }
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Карта доступна только в браузере"));
      return;
    }

    // API уже подключён (например, другим компонентом)
    const existing = getGlobalApi();
    if (existing) {
      existing.ready.then(() => resolve(existing)).catch(reject);
      return;
    }

    const script = document.createElement("script");
    script.src = loaderUrl(apiKey);
    script.async = true;
    script.onload = () => {
      const api = getGlobalApi();
      if (!api) {
        loadPromise = null;
        reject(new Error("Yandex Maps JS API загрузился, но ymaps3 не найден"));
        return;
      }
      // По документации: компоненты доступны только после ymaps3.ready
      api.ready.then(() => resolve(api)).catch(reject);
    };
    script.onerror = () => {
      loadPromise = null; // разрешаем повторную попытку
      reject(new Error("Не удалось загрузить Yandex Maps JS API"));
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}

/** Пакет элементов управления (версия из документации). */
const CONTROLS_PACKAGE = "@yandex/ymaps3-controls@0.0.1";

/**
 * Обёртка над YMap для отображения точек (заведений).
 *
 * Добавление и удаление меток — через единый метод `setPoints(points)`:
 * класс сам сравнивает текущие метки с новыми и добавляет/убирает только разницу.
 */
export class PlacesMap {
  private api: Ymaps3Api | null = null;
  private map: YMapInstance | null = null;
  private markers = new Map<string, YMapMarkerInstance>();
  private container: HTMLElement;
  private onClick: PointClickHandler;
  private center: [number, number];
  private zoom: number;

  constructor(
    container: HTMLElement,
    options: {
      center?: [number, number];
      zoom?: number;
      onClick?: PointClickHandler;
    } = {},
  ) {
    this.container = container;
    this.onClick = options.onClick ?? (() => undefined);
    this.center = options.center ?? [54.0, 61.0]; // центр Республики Коми по умолчанию
    this.zoom = options.zoom ?? 5;
  }

  /**
   * Инициализация карты: загрузка API (если ещё не загружен) и создание YMap.
   * @param apiKey ключ JS API (по умолчанию — из NEXT_PUBLIC_YANDEX_MAPS_API_KEY)
   */
  async init(apiKey: string = YANDEX_MAPS_KEY): Promise<void> {
    const api = await loadYmaps3(apiKey);
    if (this.map) return; // уже инициализирована

    const {
      YMap,
      YMapDefaultSchemeLayer,
      YMapDefaultFeaturesLayer,
      YMapControls,
    } = api;
    const { YMapZoomControl } = await api.import(CONTROLS_PACKAGE);

    this.api = api;

    // Карта: контейнер, центр и зум (по документации)
    this.map = new YMap(this.container, {
      location: { center: this.center, zoom: this.zoom },
    });

    // Слои: базовая схема + слой маркеров (YMapDefaultFeaturesLayer)
    this.map.addChild(new YMapDefaultSchemeLayer({}));
    this.map.addChild(new YMapDefaultFeaturesLayer({}));

    // Элемент управления зумом (справа)
    this.map.addChild(
      new YMapControls({ position: "right" }).addChild(new YMapZoomControl({})),
    );
  }

  /**
   * Синхронизирует метки на карте с переданным списком точек:
   *   - новые точки  → добавляются;
   *   - исчезнувшие  → удаляются;
   *   - оставшиеся   → не трогаются.
   * Вызывайте при любом изменении списка — добавление/удаление точек
   * сводится к простому вызову этого метода.
   */
  setPoints(points: MapPoint[]): void {
    if (!this.map || !this.api) return;

    const nextIds = new Set(points.map((p) => p.id));

    // 1. Удаляем метки, которых больше нет в списке
    for (const [id, marker] of this.markers) {
      if (!nextIds.has(id)) {
        this.map.removeChild(marker);
        this.markers.delete(id);
      }
    }

    // 2. Добавляем новые метки
    for (const point of points) {
      if (this.markers.has(point.id)) continue;

      const marker = new this.api.YMapMarker(
        {
          coordinates: [point.longitude, point.latitude],
          id: point.id,
          onClick: () => this.onClick(point),
        },
        this.buildMarkerElement(point),
      );
      this.map.addChild(marker);
      this.markers.set(point.id, marker);
    }
  }

  /** Плавно центрирует карту по точке. */
  panTo(longitude: number, latitude: number, zoom?: number): void {
    this.map?.update({
      location: {
        center: [longitude, latitude],
        zoom: zoom ?? 14,
        duration: 400,
      },
    });
  }

  /** HTML-содержимое метки: пин + подпись (кастомный DOM по документации YMapMarker). */
  private buildMarkerElement(point: MapPoint): HTMLElement {
    const root = document.createElement("div");
    root.className =
      "flex cursor-pointer flex-col items-center transition-transform hover:scale-110";

    const pin = document.createElement("div");
    pin.className =
      "flex h-9 w-9 items-center justify-center rounded-full border-2 border-white " +
      "bg-primary-600 text-lg text-white shadow-lg";
    pin.textContent = "🏠";
    pin.title = `${point.name} — ${point.address}`;

    const label = document.createElement("div");
    label.className =
      "mt-1 max-w-[160px] truncate rounded-md bg-white/95 px-2 py-0.5 " +
      "text-[11px] font-medium text-gray-800 shadow";
    label.textContent = point.name;

    root.appendChild(pin);
    root.appendChild(label);
    return root;
  }

  /** Текущие метки (для тестов и отладки). */
  getMarkersForTests(): YMapMarkerInstance[] {
    return [...this.markers.values()];
  }

  /** Уничтожает карту и очищает ресурсы. */
  destroy(): void {
    for (const marker of this.markers.values()) {
      this.map?.removeChild(marker);
    }
    this.markers.clear();
    this.map?.destroy();
    this.map = null;
  }
}
