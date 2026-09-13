/**
 * Unit-С‚РµСЃС‚С‹ РѕР±С‘СЂС‚РєРё Yandex Maps JS API 3.0 (src/lib/yandex-map.ts).
 * Р“Р»РѕР±Р°Р»СЊРЅС‹Р№ `ymaps3` РјРѕРєР°РµС‚СЃСЏ: РїСЂРѕРІРµСЂСЏРµРј diff-Р»РѕРіРёРєСѓ РґРѕР±Р°РІР»РµРЅРёСЏ/СѓРґР°Р»РµРЅРёСЏ РјРµС‚РѕРє.
 */
import { PlacesMap, MapPoint } from "@/lib/yandex-map";

/** Р¤РµР№РєРѕРІР°СЏ РєР°СЂС‚Р°, С„РёРєСЃРёСЂСѓСЋС‰Р°СЏ add/remove РґРµС‚РµР№. */
class FakeYMap {
  children: unknown[] = [];
  location = { center: [54, 61] as [number, number], zoom: 5 };

  addChild(child: unknown): this {
    this.children.push(child);
    return this;
  }

  removeChild(child: unknown): this {
    this.children = this.children.filter((c) => c !== child);
    return this;
  }

  update(): void {
    /* no-op */
  }

  destroy(): void {
    /* no-op */
  }
}

/** Р¤РµР№РєРѕРІР°СЏ РјРµС‚РєР°. */
class FakeYMapMarker {
  coordinates: [number, number];
  id?: string;

  constructor(props: { coordinates: [number, number]; id?: string }) {
    this.coordinates = props.coordinates;
    this.id = props.id;
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
});
