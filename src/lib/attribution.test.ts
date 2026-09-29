import { describe, expect, it } from "vitest";
import { captureAttribution, readOrderAttribution, type AttributionEnv } from "@/lib/attribution";

const KEY = "nocte_attribution_v1";
const DAY = 24 * 60 * 60 * 1000;
const T0 = Date.parse("2026-09-28T20:15:00.000Z");

const memoryStorage = (initial?: string) => {
  const data = new Map<string, string>();
  if (initial !== undefined) data.set(KEY, initial);
  return {
    data,
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    removeItem: (key: string) => void data.delete(key),
  };
};

type Storage = ReturnType<typeof memoryStorage>;

const visit = (storage: Storage, href: string, opts: { referrer?: string; now?: number } = {}): AttributionEnv => {
  const env = { href, referrer: opts.referrer ?? "", storage, now: opts.now ?? T0 };
  captureAttribution(env);
  return env;
};

const stored = (storage: Storage) => JSON.parse(storage.data.get(KEY) ?? "null");
const read = (storage: Storage, now = T0) => readOrderAttribution({ href: "https://www.nocte.studio/", referrer: "", storage, now });

const META_AD =
  "https://www.nocte.studio/?utm_source=meta&utm_medium=paid_social&utm_campaign=120111&utm_term=120222&utm_content=120333&fbclid=IwAR_test";

describe("captura de la visita", () => {
  it("lee cada UTM y cada click id, y arma el bloque del contrato", () => {
    const storage = memoryStorage();
    visit(storage, META_AD, { referrer: "https://l.instagram.com/?u=https%3A%2F%2Fnocte.studio" });

    expect(read(storage)).toEqual({
      source: "meta",
      utm_source: "meta",
      utm_medium: "paid_social",
      utm_campaign: "120111",
      utm_term: "120222",
      utm_content: "120333",
      click_ids: { fbclid: "IwAR_test" },
      landing_page: "https://www.nocte.studio/",
      referrer: "https://l.instagram.com/",
      captured_at: "2026-09-28T20:15:00.000Z",
      touch: "last",
    });
  });

  it("utm_id y los click ids de Google y TikTok", () => {
    const storage = memoryStorage();
    visit(storage, "https://www.nocte.studio/sleep-mask?utm_id=987&gclid=Cj0_a&wbraid=wb1&gbraid=gb1&ttclid=tt1");
    const result = read(storage);
    expect(result?.utm_id).toBe("987");
    expect(result?.click_ids).toEqual({ gclid: "Cj0_a", wbraid: "wb1", gbraid: "gb1", ttclid: "tt1" });
    expect(result?.landing_page).toBe("https://www.nocte.studio/sleep-mask");
  });

  it("los IDs de 18 digitos quedan como string exacto", () => {
    const storage = memoryStorage();
    visit(storage, "https://www.nocte.studio/?utm_source=meta&utm_campaign=120111222333444555");
    const result = read(storage);
    expect(result?.utm_campaign).toBe("120111222333444555");
    expect(typeof result?.utm_campaign).toBe("string");
  });

  it("landing_page y referrer pierden query, hash y credenciales", () => {
    const storage = memoryStorage();
    visit(storage, "https://www.nocte.studio/sleep-mask?utm_source=meta&phone=0981#checkout", {
      referrer: "https://user:pass@example.com/path/to?email=a@b.com#x",
    });
    const result = read(storage);
    expect(result?.landing_page).toBe("https://www.nocte.studio/sleep-mask");
    expect(result?.referrer).toBe("https://example.com/path/to");
  });

  it("acepta el referrer android-app de Instagram", () => {
    const storage = memoryStorage();
    visit(storage, "https://www.nocte.studio/?utm_source=ig", { referrer: "android-app://com.instagram.android/" });
    expect(read(storage)?.referrer).toBe("android-app://com.instagram.android/");
  });

  it("ignora referrers del mismo sitio, con o sin www, y esquemas raros", () => {
    const storage = memoryStorage();
    visit(storage, "https://www.nocte.studio/?utm_source=meta", { referrer: "https://nocte.studio/sleep-mask" });
    expect(read(storage)?.referrer).toBeUndefined();

    const other = memoryStorage();
    visit(other, "https://www.nocte.studio/?utm_source=meta", { referrer: "javascript:alert(1)" });
    expect(read(other)?.referrer).toBeUndefined();
  });
});

describe("source", () => {
  const sourceFor = (query: string) => {
    const storage = memoryStorage();
    visit(storage, `https://www.nocte.studio/?${query}`);
    return read(storage)?.source;
  };

  it("sale de utm_source en minusculas", () => {
    expect(sourceFor("utm_source=Facebook")).toBe("facebook");
  });

  it("sin utm_source sale del click id", () => {
    expect(sourceFor("fbclid=abc")).toBe("meta");
    expect(sourceFor("gclid=abc")).toBe("google");
    expect(sourceFor("wbraid=abc")).toBe("google");
    expect(sourceFor("gbraid=abc")).toBe("google");
    expect(sourceFor("ttclid=abc")).toBe("tiktok");
  });

  it("un utm_source que no es slug no se usa como source, pero se manda igual", () => {
    const storage = memoryStorage();
    visit(storage, "https://www.nocte.studio/?utm_source=Meta%20Ads&fbclid=abc");
    expect(read(storage)?.source).toBe("meta");
    expect(read(storage)?.utm_source).toBe("Meta Ads");
    expect(sourceFor("utm_source=Meta%20Ads")).toBeUndefined();
  });
});

describe("primer y ultimo toque", () => {
  it("el primero nunca se pisa, el ultimo si con cada toque nuevo", () => {
    const storage = memoryStorage();
    visit(storage, "https://www.nocte.studio/?utm_source=meta&utm_campaign=A");
    visit(storage, "https://www.nocte.studio/?utm_source=google&gclid=g1", { now: T0 + DAY });

    const { first, last } = stored(storage);
    expect(first.utm_campaign).toBe("A");
    expect(last.source).toBe("google");
    expect(read(storage, T0 + DAY)?.source).toBe("google");
  });

  it("una visita sin UTM ni click id deja los dos intactos", () => {
    const storage = memoryStorage();
    visit(storage, META_AD);
    const before = storage.data.get(KEY);

    visit(storage, "https://www.nocte.studio/", { now: T0 + DAY });
    visit(storage, "https://www.nocte.studio/sleep-mask?ref=menu", { now: T0 + DAY, referrer: "https://www.nocte.studio/" });
    visit(storage, "https://www.nocte.studio/", { now: T0 + DAY, referrer: "https://www.google.com/" });

    expect(storage.data.get(KEY)).toBe(before);
  });

  it("un referrer externo solo cuenta si no hay ningun toque vivo", () => {
    const storage = memoryStorage();
    visit(storage, "https://www.nocte.studio/", { referrer: "https://www.google.com/search?q=lentes" });
    expect(read(storage)).toEqual({
      landing_page: "https://www.nocte.studio/",
      referrer: "https://www.google.com/search",
      captured_at: "2026-09-28T20:15:00.000Z",
      touch: "last",
    });

    visit(storage, META_AD, { now: T0 + DAY });
    expect(read(storage, T0 + DAY)?.source).toBe("meta");
    expect(stored(storage).first.referrer).toBe("https://www.google.com/search");
  });

  it("sin toque vivo el pedido no lleva attribution", () => {
    const storage = memoryStorage();
    visit(storage, "https://www.nocte.studio/");
    expect(read(storage)).toBeUndefined();
    expect(storage.data.has(KEY)).toBe(false);
  });
});

describe("vencimiento a 30 dias", () => {
  it("un toque vencido se ignora y se poda", () => {
    const storage = memoryStorage();
    visit(storage, META_AD);
    expect(read(storage, T0 + 30 * DAY - 1)?.source).toBe("meta");
    expect(read(storage, T0 + 30 * DAY)).toBeUndefined();

    visit(storage, "https://www.nocte.studio/", { now: T0 + 31 * DAY });
    expect(storage.data.has(KEY)).toBe(false);
  });

  it("cada toque vence por su lado: el first viejo cae y el last sigue", () => {
    const storage = memoryStorage();
    visit(storage, "https://www.nocte.studio/?utm_campaign=A");
    visit(storage, "https://www.nocte.studio/?utm_campaign=B", { now: T0 + 20 * DAY });
    visit(storage, "https://www.nocte.studio/", { now: T0 + 35 * DAY });

    const { first, last } = stored(storage);
    expect(first).toBeUndefined();
    expect(last.utm_campaign).toBe("B");

    visit(storage, "https://www.nocte.studio/?utm_campaign=C", { now: T0 + 36 * DAY });
    expect(stored(storage).first.utm_campaign).toBe("B");
    expect(stored(storage).last.utm_campaign).toBe("C");
  });

  it("un captured_at en el futuro se descarta", () => {
    const storage = memoryStorage(
      JSON.stringify({ last: { utm_source: "meta", captured_at: "2099-01-01T00:00:00Z" } }),
    );
    expect(read(storage)).toBeUndefined();
  });
});

describe("storage roto o manipulado", () => {
  it("JSON invalido se descarta sin romper, y la visita nueva se guarda", () => {
    for (const garbage of ["{not json", "null", "42", "[]", '"x"', '{"last":"x","first":[1]}']) {
      const storage = memoryStorage(garbage);
      expect(read(storage)).toBeUndefined();
      visit(storage, META_AD);
      expect(read(storage)?.source).toBe("meta");
    }
  });

  it("localStorage que tira en cada llamada no rompe la captura ni el pedido", () => {
    const boom = () => {
      throw new DOMException("denied", "SecurityError");
    };
    const storage = { getItem: boom, setItem: boom, removeItem: boom };
    const env = { href: META_AD, referrer: "", storage, now: T0 };
    expect(() => captureAttribution(env)).not.toThrow();
    expect(readOrderAttribution(env)).toBeUndefined();
  });

  it("storage lleno: la captura falla en silencio", () => {
    const storage = memoryStorage();
    storage.setItem = () => {
      throw new DOMException("full", "QuotaExceededError");
    };
    expect(() => visit(storage, META_AD)).not.toThrow();
  });

  it("una URL invalida no rompe", () => {
    const storage = memoryStorage();
    expect(() => visit(storage, "not a url")).not.toThrow();
    expect(read(storage)).toBeUndefined();
  });

  it("lo guardado se re-valida: keys ajenas, click ids prohibidos y numeros no pasan", () => {
    const storage = memoryStorage(
      JSON.stringify({
        last: {
          source: "evil source",
          utm_source: "meta",
          utm_campaign: 120111,
          click_ids: { fbclid: "ok", fbp: "fb.1.1.1", session_token: "x", gclid: "has space" },
          email: "a@b.com",
          ip: "1.2.3.4",
          landing_page: "https://www.nocte.studio/?phone=0981",
          captured_at: "2026-09-28T20:00:00Z",
        },
      }),
    );
    expect(read(storage)).toEqual({
      source: "meta",
      utm_source: "meta",
      click_ids: { fbclid: "ok" },
      landing_page: "https://www.nocte.studio/",
      captured_at: "2026-09-28T20:00:00.000Z",
      touch: "last",
    });
  });
});

describe("valores maliciosos en la URL", () => {
  it("saca caracteres de control e invisibles y recorta espacios", () => {
    const storage = memoryStorage();
    visit(storage, "https://www.nocte.studio/?utm_source=%20me%E2%80%8Bta%00%0A&utm_campaign=a%C2%ADb%EF%BB%BF");
    const result = read(storage);
    expect(result?.utm_source).toBe("meta");
    expect(result?.source).toBe("meta");
    expect(result?.utm_campaign).toBe("ab");
  });

  it("un UTM de mas de 255 caracteres se descarta entero, no se corta", () => {
    const storage = memoryStorage();
    visit(storage, `https://www.nocte.studio/?utm_source=meta&utm_campaign=${"a".repeat(256)}`);
    expect(read(storage)?.utm_campaign).toBeUndefined();

    visit(storage, `https://www.nocte.studio/?utm_source=meta&utm_campaign=${"a".repeat(255)}`);
    expect(read(storage)?.utm_campaign).toHaveLength(255);
  });

  it("click ids: solo ASCII imprimible sin espacios y hasta 500", () => {
    const storage = memoryStorage();
    visit(storage, `https://www.nocte.studio/?fbclid=${"x".repeat(501)}&gclid=a%20b&ttclid=%C3%B1`);
    expect(read(storage)).toBeUndefined();

    visit(storage, `https://www.nocte.studio/?fbclid=${"x".repeat(500)}`);
    expect(read(storage)?.click_ids?.fbclid).toHaveLength(500);
  });

  it("texto con pinta de script queda como texto plano, nunca como source", () => {
    const storage = memoryStorage();
    visit(storage, "https://www.nocte.studio/?utm_source=%3Cscript%3Ealert(1)%3C%2Fscript%3E&utm_medium=%22%3E%3Cimg%3E");
    const result = read(storage);
    expect(result?.utm_source).toBe("<script>alert(1)</script>");
    expect(result?.utm_medium).toBe('"><img>');
    expect(result?.source).toBeUndefined();
  });

  it("solo toma los parametros del contrato: fbp, fbc, tokens y ajenos no se leen", () => {
    const storage = memoryStorage();
    visit(storage, "https://www.nocte.studio/?fbp=fb.1.1.1&fbc=fb.1.1.x&access_token=secret&msclkid=m1&email=a%40b.com");
    expect(read(storage)).toBeUndefined();
    expect(storage.data.has(KEY)).toBe(false);
  });

  it("un toque desmedido no se guarda, y no desplaza al que ya estaba", () => {
    const storage = memoryStorage();
    visit(storage, META_AD);
    const before = storage.data.get(KEY);

    const utms = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "utm_id"]
      .map((k) => `${k}=${"a".repeat(255)}`)
      .join("&");
    const clicks = ["fbclid", "gclid", "wbraid", "gbraid", "ttclid"].map((k) => `${k}=${"x".repeat(500)}`).join("&");
    visit(storage, `https://www.nocte.studio/${"p".repeat(900)}?${utms}&${clicks}`, { now: T0 + DAY });

    expect(storage.data.get(KEY)).toBe(before);
    expect(before!.length).toBeLessThan(1024);
  });

  it("un landing_page de mas de 1024 caracteres se omite y el toque sigue", () => {
    const storage = memoryStorage();
    visit(storage, `https://www.nocte.studio/${"p".repeat(1100)}?utm_source=meta`);
    const result = read(storage);
    expect(result?.source).toBe("meta");
    expect(result?.landing_page).toBeUndefined();
  });
});
