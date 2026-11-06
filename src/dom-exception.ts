export interface DOMExceptionConstants {
  readonly INDEX_SIZE_ERR: 1;
  readonly DOMSTRING_SIZE_ERR: 2;
  readonly HIERARCHY_REQUEST_ERR: 3;
  readonly WRONG_DOCUMENT_ERR: 4;
  readonly INVALID_CHARACTER_ERR: 5;
  readonly NO_DATA_ALLOWED_ERR: 6;
  readonly NO_MODIFICATION_ALLOWED_ERR: 7;
  readonly NOT_FOUND_ERR: 8;
  readonly NOT_SUPPORTED_ERR: 9;
  readonly INUSE_ATTRIBUTE_ERR: 10;
  readonly INVALID_STATE_ERR: 11;
  readonly SYNTAX_ERR: 12;
  readonly INVALID_MODIFICATION_ERR: 13;
  readonly NAMESPACE_ERR: 14;
  readonly INVALID_ACCESS_ERR: 15;
  readonly VALIDATION_ERR: 16;
  readonly TYPE_MISMATCH_ERR: 17;
  readonly SECURITY_ERR: 18;
  readonly NETWORK_ERR: 19;
  readonly ABORT_ERR: 20;
  readonly URL_MISMATCH_ERR: 21;
  readonly QUOTA_EXCEEDED_ERR: 22;
  readonly TIMEOUT_ERR: 23;
  readonly INVALID_NODE_TYPE_ERR: 24;
  readonly DATA_CLONE_ERR: 25;
}

export interface DOMException extends Error, DOMExceptionConstants {
  readonly code: number;
  readonly message: string;
  readonly name: string;
}

export interface DOMExceptionConstructor extends DOMExceptionConstants {
  new (message?: string, name?: string): DOMException;
  readonly prototype: DOMException;
}

export const DOM_EXCEPTION_CONSTANTS: DOMExceptionConstants &
  Readonly<Record<string, number>> = Object.freeze({
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
});

const DOM_EXCEPTION_NAME_CODES: Readonly<Record<string, number>> = {
  IndexSizeError: DOM_EXCEPTION_CONSTANTS.INDEX_SIZE_ERR,
  DOMStringSizeError: DOM_EXCEPTION_CONSTANTS.DOMSTRING_SIZE_ERR,
  HierarchyRequestError: DOM_EXCEPTION_CONSTANTS.HIERARCHY_REQUEST_ERR,
  WrongDocumentError: DOM_EXCEPTION_CONSTANTS.WRONG_DOCUMENT_ERR,
  InvalidCharacterError: DOM_EXCEPTION_CONSTANTS.INVALID_CHARACTER_ERR,
  NoDataAllowedError: DOM_EXCEPTION_CONSTANTS.NO_DATA_ALLOWED_ERR,
  NoModificationAllowedError:
    DOM_EXCEPTION_CONSTANTS.NO_MODIFICATION_ALLOWED_ERR,
  NotFoundError: DOM_EXCEPTION_CONSTANTS.NOT_FOUND_ERR,
  NotSupportedError: DOM_EXCEPTION_CONSTANTS.NOT_SUPPORTED_ERR,
  InUseAttributeError: DOM_EXCEPTION_CONSTANTS.INUSE_ATTRIBUTE_ERR,
  InvalidStateError: DOM_EXCEPTION_CONSTANTS.INVALID_STATE_ERR,
  SyntaxError: DOM_EXCEPTION_CONSTANTS.SYNTAX_ERR,
  InvalidModificationError: DOM_EXCEPTION_CONSTANTS.INVALID_MODIFICATION_ERR,
  NamespaceError: DOM_EXCEPTION_CONSTANTS.NAMESPACE_ERR,
  InvalidAccessError: DOM_EXCEPTION_CONSTANTS.INVALID_ACCESS_ERR,
  ValidationError: DOM_EXCEPTION_CONSTANTS.VALIDATION_ERR,
  TypeMismatchError: DOM_EXCEPTION_CONSTANTS.TYPE_MISMATCH_ERR,
  SecurityError: DOM_EXCEPTION_CONSTANTS.SECURITY_ERR,
  NetworkError: DOM_EXCEPTION_CONSTANTS.NETWORK_ERR,
  AbortError: DOM_EXCEPTION_CONSTANTS.ABORT_ERR,
  URLMismatchError: DOM_EXCEPTION_CONSTANTS.URL_MISMATCH_ERR,
  QuotaExceededError: DOM_EXCEPTION_CONSTANTS.QUOTA_EXCEEDED_ERR,
  TimeoutError: DOM_EXCEPTION_CONSTANTS.TIMEOUT_ERR,
  InvalidNodeTypeError: DOM_EXCEPTION_CONSTANTS.INVALID_NODE_TYPE_ERR,
  DataCloneError: DOM_EXCEPTION_CONSTANTS.DATA_CLONE_ERR,
};

export function domExceptionCode(name: string): number {
  return DOM_EXCEPTION_NAME_CODES[name] ?? 0;
}

const platform = globalThis as typeof globalThis & {
  readonly DOMException: DOMExceptionConstructor;
};

export const DOMException = platform.DOMException;
