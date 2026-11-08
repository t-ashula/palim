import { Node } from "./dom/nodes.js";
import { requireArguments } from "./web-idl.js";
import { serializeXML } from "./xml/serializer.js";

export class XMLSerializer {
  serializeToString(root: Node): string {
    requireArguments(arguments.length, 1);
    if (!(root instanceof Node)) {
      throw new TypeError("The argument is not a Node");
    }
    return serializeXML(root);
  }
}
