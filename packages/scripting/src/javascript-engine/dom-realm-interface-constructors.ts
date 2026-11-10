import {
  AbortController,
  Comment,
  CustomEvent,
  Document,
  DocumentFragment,
  ErrorEvent,
  Event,
  EventTarget,
  MutationObserver,
  Node,
  NodeFilter,
  Sanitizer,
  Text,
} from "@palim/core/internal/dom.js";
import {
  associateDOMParser,
  DOMParser,
} from "@palim/core/internal/dom-parser.js";
import { DOM_EXCEPTION_CONSTANTS } from "@palim/core/internal/dom-exception.js";
import { createStaticRange } from "@palim/core/internal/dom/range-implementation.js";
import { parseHTMLDocument } from "@palim/core/internal/dom/nodes.js";
import { normal } from "./adapter.js";
import type { DOMRealmBindingContext } from "./dom-realm-binding-context.js";
import { htmlElementInterfaceConstructors } from "./html-element-interface-constructors.js";

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
      binding.engine.initializeDataProperty(
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
  binding.installInterface("HTMLElement", binding.htmlElementPrototype, 0, () =>
    binding.constructHTMLElement(),
  );
  for (const interfaceConstructor of htmlElementInterfaceConstructors) {
    binding.installInterface(
      interfaceConstructor.name,
      binding.htmlElementInterfacePrototype(interfaceConstructor),
    );
  }
  const documentConstructor = binding.installInterface(
    "Document",
    binding.documentPrototype,
    0,
    () => normal(binding.wrap(new Document())),
  );
  binding.context.interfaceProperty("HTMLDocument", documentConstructor);
  for (const [name, unsafe] of [
    ["parseHTML", false],
    ["parseHTMLUnsafe", true],
  ] as const) {
    binding.method(
      documentConstructor,
      name,
      1,
      (_thisValue, argumentsList) => {
        const html = binding.stringArgument(argumentsList, 0, name);
        if (html.type === "throw") {
          return html;
        }
        const options = binding.htmlParsingOptions(
          argumentsList[1],
          false,
          name,
        );
        if (options.type === "throw") {
          return options;
        }
        return binding.domOperationResult(() =>
          normal(
            binding.wrap(
              parseHTMLDocument(
                html.value,
                options.value,
                unsafe,
                binding.associatedDocument,
              ),
            ),
          ),
        );
      },
    );
  }
  binding.installInterface(
    "DocumentFragment",
    binding.documentFragmentPrototype,
    0,
    () => normal(binding.wrap(new DocumentFragment())),
  );
  binding.installInterface("ShadowRoot", binding.shadowRootPrototype);
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
    const parser = new DOMParser();
    if (binding.associatedDocument !== null) {
      associateDOMParser(parser, binding.associatedDocument);
    }
    binding.domParsers.set(object, parser);
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
  binding.installInterface(
    "Sanitizer",
    binding.sanitizerPrototype,
    0,
    (_thisValue, argumentsList) => {
      const configuration = binding.sanitizerConfiguration(
        argumentsList[0],
        true,
        "Sanitizer",
      );
      if (configuration.type === "throw") {
        return configuration;
      }
      try {
        const object = binding.engine.createObject(
          binding.realm,
          binding.sanitizerPrototype,
        );
        binding.sanitizers.set(object, new Sanitizer(configuration.value));
        return normal(object);
      } catch (error: unknown) {
        return error instanceof TypeError
          ? binding.typeError(error.message)
          : (() => {
              throw error;
            })();
      }
    },
  );
  binding.installInterface("XMLDocument", binding.xmlDocumentPrototype);
  binding.installInterface("HTMLCollection", binding.htmlCollectionPrototype);
  binding.installInterface("NamedNodeMap", binding.namedNodeMapPrototype);
  binding.installInterface("NodeList", binding.nodeListPrototype);
  binding.installInterface("DOMTokenList", binding.domTokenListPrototype);
  binding.installInterface(
    "MutationObserver",
    binding.mutationObserverPrototype,
    1,
    (_thisValue, argumentsList) => {
      const callback = binding.engine.asCallable(
        argumentsList[0] ?? binding.engine.fromPrimitive(undefined),
      );
      if (callback === null) {
        return binding.typeError("MutationObserver callback must be callable");
      }
      const callbackRecord = binding.reportingCallback(callback);
      if (callbackRecord.type === "throw") {
        return callbackRecord;
      }
      const observer = new MutationObserver((records, currentObserver) => {
        const platformObserver = binding.wrap(currentObserver);
        binding.context.invokeCallback(callbackRecord.value, platformObserver, [
          binding.engine.createArray(
            binding.realm,
            records.map((record) => binding.wrap(record)),
          ),
          platformObserver,
        ]);
        binding.engine.performPromiseCheckpoint();
      });
      return normal(binding.wrap(observer));
    },
  );
  binding.installInterface("MutationRecord", binding.mutationRecordPrototype);
  binding.installInterface(
    "CustomElementRegistry",
    binding.customElementRegistryPrototype,
  );
  binding.engine.initializeDataProperty(
    binding.engine.globalObject(binding.realm),
    "customElements",
    binding.customElementRegistryObject,
    { configurable: true, enumerable: true, writable: true },
  );
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
      binding.engine.initializeDataProperty(
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
  for (const name of ["name", "message", "code"] as const) {
    binding.attribute(binding.domExceptionPrototype, name, (thisValue) => {
      const exception = binding.domExceptionState(thisValue);
      return exception === null
        ? binding.typeError(`Invalid DOMException receiver for ${name}`)
        : binding.primitive(exception[name]);
    });
  }
  for (const [name, value] of Object.entries(DOM_EXCEPTION_CONSTANTS)) {
    for (const target of [
      domExceptionConstructor,
      binding.domExceptionPrototype,
    ]) {
      binding.engine.initializeDataProperty(
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
      binding.engine.initializeDataProperty(
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
    "ErrorEvent",
    binding.errorEventPrototype,
    1,
    (_thisValue, argumentsList) => {
      const type = binding.stringArgument(argumentsList, 0, "ErrorEvent");
      if (type.type === "throw") {
        return type;
      }
      const eventInit = binding.errorEventInit(argumentsList[1]);
      if (eventInit.type === "throw") {
        return eventInit;
      }
      const { error, ...hostInit } = eventInit.value;
      const event = new ErrorEvent(type.value, hostInit);
      binding.errorEventErrors.set(event, error);
      return normal(binding.wrap(event));
    },
  );
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
    binding.engine.initializeDataProperty(
      nodeFilter,
      name,
      binding.engine.fromPrimitive(value),
      { configurable: false, enumerable: true, writable: false },
    );
  }
  binding.context.interfaceProperty("NodeFilter", nodeFilter);
}
