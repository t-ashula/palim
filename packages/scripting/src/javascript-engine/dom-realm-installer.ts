import type { DOMRealmBindingContext } from "./dom-realm-binding-context.js";
import { installCSSOMMembers } from "./dom-realm-cssom-interfaces.js";
import { installGeometryInterfaces } from "./dom-realm-geometry-interfaces.js";
import { installHTMLStreamingInterfaces } from "./dom-realm-html-streaming-interface.js";
import {
  installAbortMembers,
  installAttrMembers,
  installCharacterDataMembers,
  installCSSStyleDeclarationMembers,
  installCSSStylePropertiesMembers,
  installCustomElementRegistryMembers,
  installDocumentFragmentMembers,
  installDocumentMembers,
  installDocumentNamedElementMembers,
  installDocumentTypeMembers,
  installDOMImplementationMembers,
  installDOMParserMembers,
  installDOMTokenListMembers,
  installElementInternalsMembers,
  installElementMembers,
  installEventMembers,
  installEventTargetMembers,
  installForeignAnchorMembers,
  installFormElementMembers,
  installHTMLAnchorElementMembers,
  installHTMLAreaElementMembers,
  installHTMLBaseElementMembers,
  installHTMLButtonElementMembers,
  installHTMLCollectionMembers,
  installHTMLElementMembers,
  installHTMLIFrameElementMembers,
  installHTMLLinkElementMembers,
  installHTMLOutputElementMembers,
  installHTMLReflectedIDLAttributeMembers,
  installHTMLScriptElementMembers,
  installHTMLSlotElementMembers,
  installHTMLStyleElementMembers,
  installHTMLTableElementMembers,
  installHTMLTableRowElementMembers,
  installHTMLTableSectionElementMembers,
  installHTMLTemplateElementMembers,
  installInterfaces,
  installMutationObserverMembers,
  installNamedNodeMapMembers,
  installNodeIteratorMembers,
  installNodeListMembers,
  installNodeMembers,
  installRangeMembers,
  installSanitizerMembers,
  installTreeWalkerMembers,
  installXMLSerializerMembers,
} from "./dom-realm-interface-installers.js";
import { installWritableStreamRealm } from "./writable-stream-realm.js";

export function installDOMRealmInterfaces(
  binding: DOMRealmBindingContext,
): void {
  installInterfaces(binding);
  installCSSOMMembers(binding);
  installGeometryInterfaces(binding);
  installEventTargetMembers(binding);
  installAbortMembers(binding);
  installNodeMembers(binding);
  installCharacterDataMembers(binding);
  installAttrMembers(binding);
  installElementMembers(binding);
  installForeignAnchorMembers(binding);
  installHTMLElementMembers(binding);
  installHTMLStyleElementMembers(binding);
  installElementInternalsMembers(binding);
  installDocumentNamedElementMembers(binding);
  installFormElementMembers(binding);
  installHTMLAnchorElementMembers(binding);
  installHTMLAreaElementMembers(binding);
  installHTMLBaseElementMembers(binding);
  installHTMLButtonElementMembers(binding);
  installHTMLReflectedIDLAttributeMembers(binding);
  installHTMLIFrameElementMembers(binding);
  installHTMLLinkElementMembers(binding);
  installHTMLOutputElementMembers(binding);
  installHTMLTableElementMembers(binding);
  installHTMLTableRowElementMembers(binding);
  installHTMLTableSectionElementMembers(binding);
  installHTMLTemplateElementMembers(binding);
  installHTMLScriptElementMembers(binding);
  installHTMLSlotElementMembers(binding);
  installDocumentMembers(binding);
  installDocumentFragmentMembers(binding);
  installDocumentTypeMembers(binding);
  installDOMImplementationMembers(binding);
  installDOMParserMembers(binding);
  installXMLSerializerMembers(binding);
  installSanitizerMembers(binding);
  const streams = installWritableStreamRealm(binding.context);
  const streamPrototype = binding.engine.setPrototypeOf(
    binding.realm,
    binding.writableStreamPrototype,
    streams.prototype,
  );
  if (streamPrototype.type === "throw") {
    throw new TypeError("Could not extend the WritableStream prototype");
  }
  const writerPrototype = binding.engine.setPrototypeOf(
    binding.realm,
    binding.writableStreamDefaultWriterPrototype,
    streams.writerPrototype,
  );
  if (writerPrototype.type === "throw") {
    throw new TypeError(
      "Could not extend the WritableStreamDefaultWriter prototype",
    );
  }
  installHTMLStreamingInterfaces(binding, false);
  installEventMembers(binding);
  installHTMLCollectionMembers(binding);
  installNamedNodeMapMembers(binding);
  installNodeListMembers(binding);
  installDOMTokenListMembers(binding);
  installCSSStyleDeclarationMembers(binding);
  installCSSStylePropertiesMembers(binding);
  installNodeIteratorMembers(binding);
  installTreeWalkerMembers(binding);
  installRangeMembers(binding);
  installMutationObserverMembers(binding);
  installCustomElementRegistryMembers(binding);
}
