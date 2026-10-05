/**
 * Unit-С‚РµСЃС‚С‹ РѕР±С‘СЂС‚РєРё Yandex Maps JS API 3.0 (src/lib/yandex-map.ts).
 * Р“Р»РѕР±Р°Р»СЊРЅС‹Р№ `ymaps3` РјРѕРєР°РµС‚СЃСЏ: РїСЂРѕРІРµСЂСЏРµРј diff-Р»РѕРіРёРєСѓ РґРѕР±Р°РІР»РµРЅРёСЏ/СѓРґР°Р»РµРЅРёСЏ РјРµС‚РѕРє.
 */
import { PlacesMap, MapPoint } from "@/lib/yandex-map";

/** Р¤РµР№РєРѕРІР°СЏ РєР°СЂС‚Р°, С„РёРєСЃРёСЂСѓСЋС‰Р°СЏ add/remove РґРµС‚РµР№. */
class FakeYMap {
  children: unknown[] = [];
  location: { center: [number, number]; zoom: number; duration?: number } = {
    center: [54, 61],
    zoom: 5,
  };
  /** Последний вызов setLocation — его проверяет тест подгонки вида. */
  lastLocation?: {
    bounds?: [[number, number], [number, number]];
    center?: [number, number];
    zoom?: number;
  };

  addChild(child: unknown): this {
    this.children.push(child);
    return this;
  }

  removeChild(child: unknown): this {
    this.children = this.children.filter((c) => c !== child);
    return this;
  }

  update(props: {
    location?: { center?: [number, number]; zoom?: number; duration?: number };
  }): void {
    this.location = { ...this.location, ...props.location };
  }

  setLocation(loc: {
    bounds?: [[number, number], [number, number]];
    center?: [number, number];
    zoom?: number;
  }): void {
    this.lastLocation = loc;
    if (loc.center && loc.zoom !== undefined) {
      this.location = { ...this.location, center: loc.center, zoom: loc.zoom };
    }
  }

  destroy(): void {
    /* no-op */
  }
}

/** Р¤РµР№РєРѕРІР°СЏ РјРµС‚РєР°. */
class FakeYMapMarker {
  coordinates: [number, number];
  id?: string;
  element?: HTMLElement;

  constructor(
    props: { coordinates: [number, number]; id?: string },
    element?: HTMLElement,
  ) {
    this.coordinates = props.coordinates;
    this.id = props.id;
    this.element = element;
  }
}

// РњРѕРє РіР»РѕР±Р°Р»СЊРЅРѕРіРѕ ymaps3 РґРѕ РёРјРїРѕСЂС‚Р° РјРѕРґСѓР»СЏ
(globalThis as Record<string, unknown>).ymaps3 = {
  ready: Promise.resolve(),
  import: async () => ({ YMapZoomControl: class {} }),
  YMap: FakeYMap,
  YMapDefaultSchemeLayer: class {},
  YMapDefaultFeaturesLayer: class {},
  YMapControls: class {
    constructor(public _position: string) {}
    addChild() {
      return this;
    }
  },
  YMapMarker: FakeYMapMarker,
};

const point = (id: string): MapPoint => ({
  id,
  name: `Р—Р°РІРµРґРµРЅРёРµ ${id}`,
  address: "Рі. РЎС‹РєС‚С‹РІРєР°СЂ",
  longitude: 50.8 + Number(id),
  latitude: 61.6,
});

describe("PlacesMap (diff РјРµС‚РѕРє)", () => {
  it("setPoints РґРѕР±Р°РІР»СЏРµС‚ РјРµС‚РєРё РґР»СЏ РЅРѕРІС‹С… С‚РѕС‡РµРє", async () => {
    const container = document.createElement("div");
    const placesMap = new PlacesMap(container);
    await placesMap.init("test-key");

    placesMap.setPoints([point("1"), point("2")]);

    const markers = placesMap
      .getMarkersForTests()
      .filter((m) => m instanceof FakeYMapMarker);
    expect(markers).toHaveLength(2);
  });

  it("РїРѕРІС‚РѕСЂРЅС‹Р№ РІС‹Р·РѕРІ setPoints РЅРµ РґСѓР±Р»РёСЂСѓРµС‚ СЃСѓС‰РµСЃС‚РІСѓСЋС‰РёРµ РјРµС‚РєРё", async () => {
    const placesMap = new PlacesMap(document.createElement("div"));
    await placesMap.init("test-key");

    placesMap.setPoints([point("1")]);
    placesMap.setPoints([point("1")]);

    expect(placesMap.getMarkersForTests()).toHaveLength(1);
  });

  it("setPoints СѓРґР°Р»СЏРµС‚ РјРµС‚РєРё РёСЃС‡РµР·РЅСѓРІС€РёС… С‚РѕС‡РµРє", async () => {
    const placesMap = new PlacesMap(document.createElement("div"));
    await placesMap.init("test-key");

    placesMap.setPoints([point("1"), point("2"), point("3")]);
    placesMap.setPoints([point("2")]); // РѕСЃС‚Р°Р»РёСЃСЊ С‚РѕР»СЊРєРѕ В«2В»

    const remaining = placesMap.getMarkersForTests();
    expect(remaining).toHaveLength(1);
  });

  it("РјРµС‚РєР° СЃРѕР·РґР°С‘С‚СЃСЏ СЃ РєРѕРѕСЂРґРёРЅР°С‚Р°РјРё [longitude, latitude] (С„РѕСЂРјР°С‚ LngLat)", async () => {
    const placesMap = new PlacesMap(document.createElement("div"));
    await placesMap.init("test-key");

    const p = point("7");
    placesMap.setPoints([p]);

    const marker =
      placesMap.getMarkersForTests()[0] as unknown as FakeYMapMarker;
    expect(marker.coordinates).toEqual([p.longitude, p.latitude]);
    expect(marker.id).toBe("7");
  });

  it("клик по элементу метки вызывает обработчик с точкой", async () => {
    const onClick = jest.fn();
    const placesMap = new PlacesMap(document.createElement("div"), { onClick });
    await placesMap.init("test-key");

    const p = point("9");
    placesMap.setPoints([p]);

    const marker = placesMap.getMarkersForTests()[0] as unknown as FakeYMapMarker;
    marker.element?.dispatchEvent(new MouseEvent("click", { bubbles: true }));

    expect(onClick).toHaveBeenCalledWith(p);
  });

  it("элемент метки — кнопка с подписью для скринридера", async () => {
    const placesMap = new PlacesMap(document.createElement("div"));
    await placesMap.init("test-key");

    const p = point("3");
    placesMap.setPoints([p]);

    const marker = placesMap.getMarkersForTests()[0] as unknown as FakeYMapMarker;
    expect(marker.element?.tagName).toBe("BUTTON");
    expect(marker.element?.getAttribute("aria-label")).toBe(
      `${p.name} — ${p.address}`,
    );
  });

  it("panTo центрирует карту по переданным координатам", async () => {
    const placesMap = new PlacesMap(document.createElement("div"));
    await placesMap.init("test-key");

    placesMap.panTo(50.9, 61.7);

    const map = placesMap.getMapForTests() as unknown as FakeYMap;
    expect(map.location.center).toEqual([50.9, 61.7]);
    expect(map.location.zoom).toBe(14);
  });

  it("fitToPoints подгоняет вид карты под границы всех меток", async () => {
    const placesMap = new PlacesMap(document.createElement("div"));
    await placesMap.init("test-key");
    const a = point("1");
    const b = point("5");
    placesMap.setPoints([a, b]);

    // padding: 0 — проверяем сами границы, без запаса от краёв.
    placesMap.fitToPoints({ padding: 0 });

    const map = placesMap.getMapForTests() as unknown as FakeYMap;
    expect(map.lastLocation?.bounds).toEqual([
      [a.longitude, a.latitude],
      [b.longitude, b.latitude],
    ]);
  });

  it("fitToPoints по умолчанию расширяет границы, чтобы метки не обрезались краем", async () => {
    const placesMap = new PlacesMap(document.createElement("div"));
    await placesMap.init("test-key");
    const a = point("1");
    const b = point("5");
    placesMap.setPoints([a, b]);

    placesMap.fitToPoints();

    const map = placesMap.getMapForTests() as unknown as FakeYMap;
    const bounds = map.lastLocation?.bounds as [[number, number], [number, number]];
    // Запас добавляется по обе стороны от крайних точек.
    expect(bounds[0][0]).toBeLessThan(a.longitude);
    expect(bounds[1][0]).toBeGreaterThan(b.longitude);
    // Широты у точек одинаковые — разброс по широте нулевой, значит и запаса нет.
    expect(bounds[0][1]).toBe(a.latitude);
    expect(bounds[1][1]).toBe(b.latitude);
  });

  it("fitToPoints с единственной меткой центрирует и приближает карту", async () => {
    const placesMap = new PlacesMap(document.createElement("div"));
    await placesMap.init("test-key");
    const only = point("4");
    placesMap.setPoints([only]);

    placesMap.fitToPoints();

    const map = placesMap.getMapForTests() as unknown as FakeYMap;
    expect(map.lastLocation?.center).toEqual([only.longitude, only.latitude]);
    expect(map.lastLocation?.zoom).toBe(14);
  });

});
