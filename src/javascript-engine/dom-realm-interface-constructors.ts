import {
  AbortController,
  Comment,
  CustomEvent,
  Document,
  DocumentFragment,
  Event,
  EventTarget,
  Node,
  NodeFilter,
  Text,
} from "../dom.js";
import { DOMParser } from "../dom-parser.js";
import { createStaticRange } from "../dom/range-implementation.js";
import { normal } from "./adapter.js";
import type { DOMRealmBindingContext } from "./dom-realm-binding-context.js";

const DOM_EXCEPTION_CODES: Readonly<Record<string, number>> = {
  INDEX_SIZE_ERR: 1,
  DOMSTRING_SIZE_ERR: 2,
  HIERARCHY_REQUEST_ERR: 3,
  WRONG_DOCUMENT_ERR: 4,
  INVALID_CHARACTER_ERR: 5,
  NO_DATA_ALLOWED_ERR: 6,
  NO_MODIFICATION_ALLOWED_ERR: 7,
  NOT_FOUND_ERR: 8,
  NOT_SUPPORTED_ERR: 9,
  INUSE_ATTRIBUTE_ERR: 10,
  INVALID_STATE_ERR: 11,
  SYNTAX_ERR: 12,
  INVALID_MODIFICATION_ERR: 13,
  NAMESPACE_ERR: 14,
  INVALID_ACCESS_ERR: 15,
  VALIDATION_ERR: 16,
  TYPE_MISMATCH_ERR: 17,
  SECURITY_ERR: 18,
  NETWORK_ERR: 19,
  ABORT_ERR: 20,
  URL_MISMATCH_ERR: 21,
  QUOTA_EXCEEDED_ERR: 22,
  TIMEOUT_ERR: 23,
  INVALID_NODE_TYPE_ERR: 24,
  DATA_CLONE_ERR: 25,
};

export function installInterfaces(binding: DOMRealmBindingContext): void {
  binding.installInterface("EventTarget", binding.eventTargetPrototype, 0, () =>
    normal(binding.wrap(new EventTarget())),
  );
  binding.installInterface("AbortSignal", binding.abortSignalPrototype);
  binding.installInterface(
    "AbortController",
    binding.abortControllerPrototype,
    0,
    () => normal(binding.wrap(new AbortController())),
  );
  const nodeConstructor = binding.installInterface(
    "Node",
    binding.nodePrototype,
  );
  for (const name of [
    "ELEMENT_NODE",
    "ATTRIBUTE_NODE",
    "TEXT_NODE",
    "CDATA_SECTION_NODE",
    "ENTITY_REFERENCE_NODE",
    "ENTITY_NODE",
    "PROCESSING_INSTRUCTION_NODE",
    "COMMENT_NODE",
    "DOCUMENT_NODE",
    "DOCUMENT_TYPE_NODE",
    "DOCUMENT_FRAGMENT_NODE",
    "NOTATION_NODE",
    "DOCUMENT_POSITION_DISCONNECTED",
    "DOCUMENT_POSITION_PRECEDING",
    "DOCUMENT_POSITION_FOLLOWING",
    "DOCUMENT_POSITION_CONTAINS",
    "DOCUMENT_POSITION_CONTAINED_BY",
    "DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC",
  ] as const) {
    for (const target of [nodeConstructor, binding.nodePrototype]) {
      binding.engine.defineDataProperty(
        target,
        name,
        binding.engine.fromPrimitive(Node[name]),
        { configurable: false, enumerable: true, writable: false },
      );
    }
  }
  binding.installInterface("CharacterData", binding.characterDataPrototype);
  binding.installInterface(
    "Text",
    binding.textPrototype,
    0,
    (_thisValue, argumentsList) => {
      const data = binding.optionalStringArgument(argumentsList[0], "");
      if (data.type === "throw") {
        return data;
      }
      const text =
        binding.associatedDocument?.createTextNode(data.value) ??
        new Text(data.value);
      return normal(binding.wrap(text));
    },
  );
  binding.installInterface(
    "Comment",
    binding.commentPrototype,
    0,
    (_thisValue, argumentsList) => {
      const data = binding.optionalStringArgument(argumentsList[0], "");
      if (data.type === "throw") {
        return data;
      }
      const comment =
        binding.associatedDocument?.createComment(data.value) ??
        new Comment(data.value);
      return normal(binding.wrap(comment));
    },
  );
  binding.installInterface(
    "ProcessingInstruction",
    binding.processingInstructionPrototype,
  );
  binding.installInterface("Attr", binding.attrPrototype);
  binding.installInterface("Element", binding.elementPrototype);
  binding.installInterface("HTMLElement", binding.htmlElementPrototype);
  binding.installInterface(
    "HTMLAnchorElement",
    binding.htmlAnchorElementPrototype,
  );
  binding.installInterface("HTMLAreaElement", binding.htmlAreaElementPrototype);
  binding.installInterface(
    "HTMLIFrameElement",
    binding.htmlIFrameElementPrototype,
  );
  binding.installInterface("HTMLLinkElement", binding.htmlLinkElementPrototype);
  binding.installInterface(
    "HTMLOutputElement",
    binding.htmlOutputElementPrototype,
  );
  binding.installInterface(
    "HTMLTemplateElement",
    binding.htmlTemplateElementPrototype,
  );
  binding.installInterface("Document", binding.documentPrototype, 0, () =>
    normal(binding.wrap(new Document())),
  );
  binding.installInterface(
    "DocumentFragment",
    binding.documentFragmentPrototype,
    0,
    () => normal(binding.wrap(new DocumentFragment())),
  );
  binding.installInterface("DocumentType", binding.documentTypePrototype);
  binding.installInterface(
    "DOMImplementation",
    binding.domImplementationPrototype,
  );
  binding.installInterface("DOMParser", binding.domParserPrototype, 0, () => {
    const object = binding.engine.createObject(
      binding.realm,
      binding.domParserPrototype,
    );
    binding.domParsers.set(object, new DOMParser());
    return normal(object);
  });
  binding.installInterface(
    "XMLSerializer",
    binding.xmlSerializerPrototype,
    0,
    () => {
      const object = binding.engine.createObject(
        binding.realm,
        binding.xmlSerializerPrototype,
      );
      binding.xmlSerializers.add(object);
      return normal(object);
    },
  );
  binding.installInterface("XMLDocument", binding.xmlDocumentPrototype);
  binding.installInterface("HTMLCollection", binding.htmlCollectionPrototype);
  binding.installInterface("NamedNodeMap", binding.namedNodeMapPrototype);
  binding.installInterface("NodeList", binding.nodeListPrototype);
  binding.installInterface("DOMTokenList", binding.domTokenListPrototype);
  binding.installInterface("AbstractRange", binding.abstractRangePrototype);
  const rangeConstructor = binding.installInterface(
    "Range",
    binding.rangePrototype,
    0,
    () =>
      normal(
        binding.wrap(
          (binding.associatedDocument ?? new Document()).createRange(),
        ),
      ),
  );
  for (const [name, value] of [
    ["START_TO_START", 0],
    ["START_TO_END", 1],
    ["END_TO_END", 2],
    ["END_TO_START", 3],
  ] as const) {
    for (const target of [rangeConstructor, binding.rangePrototype]) {
      binding.engine.defineDataProperty(
        target,
        name,
        binding.engine.fromPrimitive(value),
        { configurable: false, enumerable: true, writable: false },
      );
    }
  }
  binding.installInterface(
    "StaticRange",
    binding.staticRangePrototype,
    1,
    (_thisValue, argumentsList) => {
      const initValue = argumentsList[0];
      if (
        initValue === undefined ||
        binding.engine.isUndefined(initValue) ||
        binding.engine.isNull(initValue)
      ) {
        return binding.typeError("StaticRange requires an init dictionary");
      }
      const init = binding.engine.asObject(initValue);
      if (init === null) {
        return binding.typeError("StaticRange init is not an object");
      }
      const values = [];
      for (const name of [
        "startContainer",
        "startOffset",
        "endContainer",
        "endOffset",
      ] as const) {
        const property = binding.engine.get(binding.realm, init, name);
        if (property.type === "throw") {
          return property;
        }
        if (binding.engine.isUndefined(property.value)) {
          return binding.typeError(`StaticRange init.${name} is required`);
        }
        values.push(property.value);
      }
      const [
        startContainerValue,
        startOffsetValue,
        endContainerValue,
        endOffsetValue,
      ] = values;
      if (
        startContainerValue === undefined ||
        startOffsetValue === undefined ||
        endContainerValue === undefined ||
        endOffsetValue === undefined
      ) {
        return binding.typeError("StaticRange init is incomplete");
      }
      const startContainer = binding.node(startContainerValue);
      const endContainer = binding.node(endContainerValue);
      if (startContainer === null || endContainer === null) {
        return binding.typeError("StaticRange containers must be Nodes");
      }
      const startOffset = binding.unsignedLongArgument(
        [startOffsetValue],
        0,
        "StaticRange",
      );
      if (startOffset.type === "throw") {
        return startOffset;
      }
      const endOffset = binding.unsignedLongArgument(
        [endOffsetValue],
        0,
        "StaticRange",
      );
      return endOffset.type === "throw"
        ? endOffset
        : binding.domOperationResult(() =>
            normal(
              binding.wrap(
                createStaticRange({
                  startContainer,
                  startOffset: startOffset.value,
                  endContainer,
                  endOffset: endOffset.value,
                }),
              ),
            ),
          );
    },
  );
  const domExceptionConstructor = binding.installInterface(
    "DOMException",
    binding.domExceptionPrototype,
    0,
    (_thisValue, argumentsList) => {
      const message = binding.optionalStringArgument(argumentsList[0], "");
      if (message.type === "throw") {
        return message;
      }
      const name = binding.optionalStringArgument(argumentsList[1], "Error");
      return name.type === "throw"
        ? name
        : normal(binding.createDOMException(message.value, name.value));
    },
  );
  for (const [name, value] of Object.entries(DOM_EXCEPTION_CODES)) {
    for (const target of [
      domExceptionConstructor,
      binding.domExceptionPrototype,
    ]) {
      binding.engine.defineDataProperty(
        target,
        name,
        binding.engine.fromPrimitive(value),
        { configurable: false, enumerable: true, writable: false },
      );
    }
  }
  binding.interfaceTag(binding.domExceptionPrototype, "DOMException");
  binding.installInterface("NodeIterator", binding.nodeIteratorPrototype);
  binding.installInterface("TreeWalker", binding.treeWalkerPrototype);
  binding.installInterface("DOMStringMap", binding.domStringMapPrototype);
  binding.installInterface(
    "CSSStyleDeclaration",
    binding.cssStyleDeclarationPrototype,
  );
  binding.installInterface(
    "CSSStyleProperties",
    binding.cssStylePropertiesPrototype,
  );
  installNodeFilter(binding);
  const eventConstructor = binding.installInterface(
    "Event",
    binding.eventPrototype,
    1,
    (_thisValue, argumentsList) => {
      const type = binding.stringArgument(argumentsList, 0, "Event");
      if (type.type === "throw") {
        return type;
      }
      const eventInit = binding.eventInit(argumentsList[1]);
      return eventInit.type === "throw"
        ? eventInit
        : normal(binding.wrap(new Event(type.value, eventInit.value)));
    },
  );
  for (const [name, value] of [
    ["NONE", Event.NONE],
    ["CAPTURING_PHASE", Event.CAPTURING_PHASE],
    ["AT_TARGET", Event.AT_TARGET],
    ["BUBBLING_PHASE", Event.BUBBLING_PHASE],
  ] as const) {
    for (const target of [eventConstructor, binding.eventPrototype]) {
      binding.engine.defineDataProperty(
        target,
        name,
        binding.engine.fromPrimitive(value),
        {
          configurable: false,
          enumerable: true,
          writable: false,
        },
      );
    }
  }
  binding.installInterface(
    "CustomEvent",
    binding.customEventPrototype,
    1,
    (_thisValue, argumentsList) => {
      const type = binding.stringArgument(argumentsList, 0, "CustomEvent");
      if (type.type === "throw") {
        return type;
      }
      const eventInit = binding.customEventInit(argumentsList[1]);
      if (eventInit.type === "throw") {
        return eventInit;
      }
      const event = new CustomEvent(type.value, eventInit.value);
      binding.customEventDetails.set(event, eventInit.value.detail);
      return normal(binding.wrap(event));
    },
  );
}

export function installNodeFilter(binding: DOMRealmBindingContext): void {
  const nodeFilter = binding.engine.createObject(
    binding.realm,
    binding.engine.objectPrototype(binding.realm),
  );
  for (const [name, value] of Object.entries(NodeFilter)) {
    binding.engine.defineDataProperty(
      nodeFilter,
      name,
      binding.engine.fromPrimitive(value),
      { configurable: false, enumerable: true, writable: false },
    );
  }
  binding.context.interfaceProperty("NodeFilter", nodeFilter);
}
