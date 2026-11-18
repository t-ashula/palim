const input =
  '<!doctype html public "identifier" "system"><!--note-->' +
  "<main>A&amp;B</main><svg><![CDATA[C]]></svg>";

testDocument.open();
for (const character of input) {
  testDocument.write(character);
}
testDocument.close();
