let threw = false;
try {
  new HTMLButtonElement();
} catch (error) {
  threw = error instanceof TypeError;
}

if (!threw) {
  throw new Error("HTMLButtonElement was directly constructible");
}
