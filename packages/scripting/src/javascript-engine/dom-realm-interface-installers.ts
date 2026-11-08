export {
  installInterfaces,
  installNodeFilter,
} from "./dom-realm-interface-constructors.js";

export {
  installEventTargetMembers,
  installAbortMembers,
  installEventMembers,
} from "./dom-realm-event-interfaces.js";

export {
  installNodeMembers,
  installCharacterDataMembers,
  installAttrMembers,
  installElementMembers,
  installDocumentMembers,
  installDocumentFragmentMembers,
  installDocumentTypeMembers,
  installDOMImplementationMembers,
} from "./dom-realm-node-interfaces.js";

export {
  installForeignAnchorMembers,
  installDocumentNamedElementMembers,
  installHTMLElementMembers,
  installHTMLAnchorElementMembers,
  installHTMLAreaElementMembers,
  installHTMLButtonElementMembers,
  installHTMLIFrameElementMembers,
  installHTMLLinkElementMembers,
  installHTMLOutputElementMembers,
  installHTMLTableElementMembers,
  installHTMLTableRowElementMembers,
  installHTMLTableSectionElementMembers,
  installHTMLTemplateElementMembers,
  installHTMLScriptElementMembers,
  installHTMLSlotElementMembers,
} from "./dom-realm-html-interfaces.js";

export {
  installDOMParserMembers,
  installXMLSerializerMembers,
} from "./dom-realm-parsing-interfaces.js";

export { installSanitizerMembers } from "./dom-realm-sanitizer-interface.js";

export {
  installHTMLCollectionMembers,
  installNamedNodeMapMembers,
  installNodeListMembers,
  installDOMTokenListMembers,
  installCSSStyleDeclarationMembers,
  installCSSStylePropertiesMembers,
} from "./dom-realm-collection-interfaces.js";

export {
  installNodeIteratorMembers,
  installTreeWalkerMembers,
} from "./dom-realm-traversal-interfaces.js";

export { installRangeMembers } from "./dom-realm-range-interfaces.js";
export { installMutationObserverMembers } from "./dom-realm-mutation-observer-interface.js";
export { installCustomElementRegistryMembers } from "./dom-realm-custom-element-interface.js";
