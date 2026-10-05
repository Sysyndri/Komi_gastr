"use client";

/**
 * MapComponent — интерактивная Яндекс.Карта (JS API 3.0) с метками заведений.
 *
 * Логика работы с API вынесена в `src/lib/yandex-map.ts`.
 * Добавление/удаление точек сводится к передаче нового массива `places` —
 * класс PlacesMap сам синхронизирует метки (diff add/remove).
 *
 * Требует NEXT_PUBLIC_YANDEX_MAPS_API_KEY. Без ключа показывает
 * список заведений (graceful degradation).
 */
import { useEffect, useRef, useState } from "react";
import { Place } from "@/types";
import { isMapAvailable, PlacesMap, MapPoint } from "@/lib/yandex-map";

export interface MapComponentProps {
  places: Place[];
  height?: number;
}

/** Выбранная точка (для карточки-подсказки). */
interface SelectedPoint {
  name: string;
  address: string;
  description?: string | null;
  phone?: string | null;
  workHours?: string | null;
}

/** Преобразование Place → MapPoint. */
function toMapPoint(place: Place): MapPoint {
  return {
    id: place.id,
    name: place.name,
    address: place.address,
    longitude: place.longitude,
    latitude: place.latitude,
  };
}

/**
 * Организм: карта заведений с метками.
 */
export function MapComponent({ places, height = 400 }: MapComponentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<PlacesMap | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<SelectedPoint | null>(null);

  // Актуальный список заведений для обработчика клика. Эффект карты создаётся
  // один раз (зависимость — только isMapAvailable), поэтому прямой захват
  // `places` давал бы пустой массив из первого рендера: данные приходят позже,
  // клик по метке ничего не находил — карточка не открывалась, а карта не
  // центрировалась. Ref всегда содержит свежие данные.
  const placesRef = useRef(places);
  placesRef.current = places;

  useEffect(() => {
    if (!isMapAvailable || !containerRef.current) return;

    const placesMap = new PlacesMap(containerRef.current, {
      onClick: (point) => {
        // Плавно центрируем карту по выбранной точке. Координаты есть в самой
        // метке, поэтому центрирование работает независимо от данных заведения.
        mapRef.current?.panTo(point.longitude, point.latitude);

        const place = placesRef.current.find((p) => p.id === point.id);
        setSelected(
          place
            ? {
                name: place.name,
                address: place.address,
                description: place.description,
                phone: place.phone,
                workHours: place.workHours,
              }
            : { name: point.name, address: point.address },
        );
      },
    });

    mapRef.current = placesMap;

    placesMap
      .init()
      .then(() => setReady(true))
      .catch((err: Error) => setError(err.message));

    return () => {
      placesMap.destroy();
      mapRef.current = null;
      fittedRef.current = false;
      setReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMapAvailable]);

  // Подгонка вида карты под метки выполняется ровно один раз за жизнь карты:
  // повторные вызовы перенастраивали бы вид поверх действий пользователя, и
  // метки «прыгали» бы при каждом обновлении списка заведений.
  const fittedRef = useRef(false);

  // Синхронизация меток при изменении списка заведений
  useEffect(() => {
    if (!ready || !mapRef.current) return;

    const points = places.map(toMapPoint);
    mapRef.current.setPoints(points);

    // Подгоняем вид один раз — когда метки появились (данные приходят асинхронно,
    // поэтому на первом рендере их ещё нет).
    if (!fittedRef.current && points.length > 0) {
      fittedRef.current = true;
      mapRef.current.fitToPoints();
    }
  }, [places, ready]);

  // Режим без ключа API или после ошибки загрузки: кликабельный список заведений
  // (graceful degradation — секция остаётся полезной, даже если карта не поднялась,
  // например на сервере, где ключ Яндекса отклонён по HTTP Referer).
  if (!isMapAvailable || error) {
    return (
      <div
        className="rounded-xl border border-gray-200 bg-gray-50 p-4"
        data-testid="map-fallback"
        style={{ minHeight: height }}
      >
        {error ? (
          <p
            className="mb-3 rounded-lg bg-red-50 p-2 text-sm text-red-700"
            role="alert"
          >
            ⚠️ Карта недоступна: {error} Показан список заведений — нажмите на
            заведение, чтобы увидеть описание:
          </p>
        ) : (
          <p className="mb-3 text-sm font-medium text-gray-600">
            🏠 Заведения (без карты — добавьте ключ
            NEXT_PUBLIC_YANDEX_MAPS_API_KEY). Нажмите на заведение, чтобы
            увидеть описание:
          </p>
        )}
        <ul className="space-y-2">
          {places.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                className="w-full cursor-pointer rounded-lg bg-white px-3 py-2 text-left text-sm text-gray-700 shadow-sm transition hover:bg-primary-50"
                onClick={() =>
                  setSelected((prev) =>
                    prev?.name === p.name
                      ? null
                      : {
                          name: p.name,
                          address: p.address,
                          description: p.description,
                          phone: p.phone,
                          workHours: p.workHours,
                        },
                  )
                }
                aria-expanded={selected?.name === p.name}
              >
                <span className="font-medium">{p.name}</span> — {p.address}
                {selected?.name === p.name && (
                  <span
                    className="mt-2 block text-gray-600"
                    data-testid="map-fallback-description"
                  >
                    {p.description ?? "Описание отсутствует."}
                    {p.workHours && (
                      <span className="mt-1 block">🕒 {p.workHours}</span>
                    )}
                    {p.phone && <span className="block">📞 {p.phone}</span>}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="relative" style={{ height }} data-testid="map">
      {/* Контейнер карты (заполняется JS API) */}
      <div
        ref={containerRef}
        className="h-full w-full rounded-xl border border-gray-200"
      />

      {/* Загрузка */}
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-gray-50">
          <span
            className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600"
            data-testid="map-spinner"
          />
          <span className="ml-2 text-sm text-gray-500">Загружаем карту...</span>
        </div>
      )}

      {/* Карточка выбранного заведения */}
      {selected && (
        <div
          className="absolute bottom-3 left-3 z-10 max-w-[calc(100%-1.5rem)] rounded-xl bg-white/95 p-4 shadow-lg backdrop-blur sm:bottom-4 sm:left-4 sm:max-w-xs"
          data-testid="map-popup"
        >
          <button
            type="button"
            className="absolute right-2 top-2 cursor-pointer text-gray-400 hover:text-gray-600"
            onClick={() => setSelected(null)}
            aria-label="Закрыть"
          >
            ✕
          </button>
          <h3 className="pr-4 font-semibold text-gray-900">{selected.name}</h3>
          {selected.description && (
            <p
              className="mt-1 text-sm text-gray-600"
              data-testid="map-popup-description"
            >
              {selected.description}
            </p>
          )}
          <p className="mt-2 text-sm text-gray-600">📍 {selected.address}</p>
          {selected.workHours && (
            <p className="text-sm text-gray-600">🕒 {selected.workHours}</p>
          )}
          {selected.phone && (
            <p className="text-sm text-gray-600">📞 {selected.phone}</p>
          )}
        </div>
      )}
    </div>
  );
}
