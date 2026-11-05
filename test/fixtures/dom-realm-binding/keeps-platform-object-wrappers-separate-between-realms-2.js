if (testDocument.realmMarker !== undefined) {
  throw new Error("platform object leaked between realms");
}
testDocument.getElementById("target").id = "second";
