import assert from "node:assert/strict";
import test from "node:test";

const developmentPreviewMeta =
  /<meta(?=[^>]*\bname=["']codex-preview["'])(?=[^>]*\bcontent=["']development["'])[^>]*>/i;

async function loadWorker() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker;
}

async function requestRoute(worker, route) {
  return worker.fetch(
    new Request(`http://localhost${route}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("renders development preview metadata", async () => {
  const worker = await loadWorker();
  const response = await requestRoute(worker, "/");

  assert.equal(response.status, 200);
  assert.match(
    response.headers.get("content-type") ?? "",
    /^text\/html\b/i,
  );
  assert.match(await response.text(), developmentPreviewMeta);
});

test("renders every public portal route", async () => {
  const worker = await loadWorker();
  const routes = [
    ["/", "Entre no Universo"],
    ["/entrar", "Minha Conta UPT"],
    ["/criar-conta", "Criar Conta UPT"],
    ["/conta", "Carregando painel"],
    ["/download", "Baixe, atualize e jogue"],
    ["/noticias", "Informação oficial"],
    ["/eventos", "Eventos ligados"],
    ["/rankings", "Rankings oficiais"],
    ["/clas", "Clãs conectados"],
    ["/shop", "Créditos e itens"],
    ["/suporte", "Suporte claro"],
    ["/status", "Transparência antes"],
    ["/seguranca", "O banco do jogo"],
  ];

  for (const [route, expectedText] of routes) {
    const response = await requestRoute(worker, route);
    assert.equal(response.status, 200, `${route} should return HTTP 200`);
    assert.match(
      response.headers.get("content-type") ?? "",
      /^text\/html\b/i,
      `${route} should return HTML`,
    );
    assert.match(await response.text(), new RegExp(expectedText, "i"));
  }
});

test("keeps player credentials disabled until the gateway is configured", async () => {
  const worker = await loadWorker();
  const response = await requestRoute(worker, "/entrar");
  const html = await response.text();

  assert.match(html, /<input(?=[^>]*name="account")[^>]*>/i);
  assert.match(html, /<input(?=[^>]*name="password")[^>]*>/i);
  assert.doesNotMatch(html, /Servidor online/i);
});
