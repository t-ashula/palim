if (testDocument.realmMarker !== "first") {
  throw new Error("platform object did not keep its associated realm wrapper");
}
testDocument.getElementById("target").id = "second";
