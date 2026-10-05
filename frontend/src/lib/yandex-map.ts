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

/**
 * Запас от краёв карты при подгонке вида под метки — доля от разброса
 * координат. Сама метка шире и выше своей точки, поэтому без запаса крайние
 * заведения обрезаются границей контейнера.
 */
const DEFAULT_FIT_PADDING = 0.15;

/** URL загрузчика JS API 3.0 (формат из документации). */
function loaderUrl(apiKey: string): string {
  return `https://api-maps.yandex.ru/v3/?apikey=${encodeURIComponent(apiKey)}&lang=ru_RU`;
}

/** Читает глобальную переменную ymaps3 (появляется после загрузки скрипта). */
function getGlobalApi(): Ymaps3Api | undefined {
  return (window as unknown as { ymaps3?: Ymaps3Api }).ymaps3;
}

/**
 * Понятное сообщение об ошибке загрузки API.
 *
 * В проде самая частая причина — ключ отклонён Яндексом (HTTP 403 «Invalid api
 * key») из-за ограничения по HTTP Referer: загрузчик отдаёт JSON-ответ, который
 * браузер блокирует через ORB (net::ERR_BLOCKED_BY_ORB), и скрипт не исполняется.
 * Поэтому в текст добавляем текущий origin — именно его нужно внести в список
 * разрешённых адресов ключа, а сам ключ — задать на этапе сборки образа.
 */
function loadErrorMessage(reason: string): string {
  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "неизвестный origin";
  return (
    `${reason} (текущий origin: ${origin}). Проверьте ключ ` +
    "NEXT_PUBLIC_YANDEX_MAPS_API_KEY (вшивается на этапе сборки) и ограничение " +
    "по HTTP Referer в кабинете разработчика Яндекса — в нём должен быть указан " +
    "этот домен/IP."
  );
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
        reject(
          new Error(
            loadErrorMessage(
              "загрузчик вернулся без ymaps3 — вероятно, ключ отклонён API",
            ),
          ),
        );
        return;
      }
      // По документации: компоненты доступны только после ymaps3.ready
      api.ready.then(() => resolve(api)).catch(reject);
    };
    script.onerror = () => {
      loadPromise = null; // разрешаем повторную попытку
      reject(
        new Error(
          loadErrorMessage("не удалось загрузить загрузчик Yandex Maps JS API"),
        ),
      );
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
  /** Последний переданный набор точек — по нему считаются границы для показа. */
  private points: MapPoint[] = [];
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

    // Запоминаем точки: по ним fitToPoints() считает границы для показа.
    this.points = points;

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

  /**
   * Подгоняет вид карты под метки.
   *
   * Без этого карта открывается на жёстко заданных `center`/`zoom` — заведения
   * оказываются за краем экрана или слипаются в одну неразборчивую точку.
   * Метод вызывается **один раз**: после него пользователь свободно двигает и
   * масштабирует карту, а вид не перенастраивается сам, иначе метки «прыгали
   * бы» при каждом обновлении списка.
   *
   * @param duration Длительность анимации, мс (0 — без анимации).
   * @param padding Запас от краёв карты, доля от разброса координат.
   */
  fitToPoints(options: { duration?: number; padding?: number } = {}): void {
    const map = this.map;
    if (!map || this.points.length === 0) return;

    const duration = options.duration ?? 0;

    // Одна метка — границы вырождены, поэтому центрируем и приближаем сами.
    if (this.points.length === 1) {
      const [only] = this.points;
      map.setLocation({
        center: [only.longitude, only.latitude],
        zoom: 14,
        duration,
      });
      return;
    }

    const longitudes = this.points.map((p) => p.longitude);
    const latitudes = this.points.map((p) => p.latitude);

    const west = Math.min(...longitudes);
    const east = Math.max(...longitudes);
    const south = Math.min(...latitudes);
    const north = Math.max(...latitudes);

    const padding = options.padding ?? DEFAULT_FIT_PADDING;
    const lonPad = (east - west) * padding;
    const latPad = (north - south) * padding;

    // LngLatBounds = [юго-западный угол, северо-восточный угол].
    map.setLocation({
      bounds: [
        [west - lonPad, south - latPad],
        [east + lonPad, north + latPad],
      ],
      duration,
    });
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

  /**
   * HTML-содержимое метки: пин + подпись (кастомный DOM по документации
   * YMapMarker).
   *
   * Корневой элемент — `<button>`, и на него вешается нативный обработчик
   * клика. У метки с кастомным DOM событие `onClick` из props срабатывает
   * не всегда, из-за чего карточка заведения не открывалась; кроме того,
   * `<button>` делает метку доступной с клавиатуры и для скринридеров.
   * Обработчик идемпотентен, поэтому срабатывание обоих путей безвредно.
   */
  private buildMarkerElement(point: MapPoint): HTMLElement {
    const root = document.createElement("button");
    root.type = "button";
    // Центрирование метки над точкой — через класс, а не style: API забирает
    // элемент себе и стирает у него атрибут style. Поэтому же и hover-масштаб
    // живёт в CSS (см. .ymap-marker-anchor), иначе он перебьёт сдвиг к точке.
    root.className =
      "ymap-marker-anchor flex cursor-pointer flex-col items-center " +
      "border-0 bg-transparent p-0 transition";
    root.setAttribute("aria-label", `${point.name} — ${point.address}`);
    // Метка создаётся вне React, поэтому разметку для тестов задаём вручную.
    root.dataset.testid = "map-marker";
    // stopPropagation: клик по метке не должен восприниматься как перетаскивание.
    root.addEventListener("click", (event) => {
      event.stopPropagation();
      this.onClick(point);
    });

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

  /** Текущий объект карты (для тестов и отладки). */
  getMapForTests(): YMapInstance | null {
    return this.map;
  }

  /** Уничтожает карту и очищает ресурсы. */
  destroy(): void {
    for (const marker of this.markers.values()) {
      this.map?.removeChild(marker);
    }
    this.markers.clear();
    this.points = [];
    this.map?.destroy();
    this.map = null;
  }
}
