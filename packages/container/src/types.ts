import type {
  ComponentChildMetadata,
  ComponentTrust,
  Props,
  SerializedArgs,
  SerializedNode,
} from '@bos-web-engine/common';
import { FunctionComponent, VNode } from 'preact';

export type BuildRequestCallback = () => CallbackRequest;

export interface CallbackRequest {
  promise: Promise<any>;
  rejecter?: (reason: any) => void;
  resolver?: (value: any) => void;
}

export type RequestMap = { [key: string]: CallbackRequest };
export type CallbackMap = { [key: string]: Function };

export type DeserializeArgsCallback = (params: DeserializeArgsParams) => any;
export interface DeserializeArgsParams {
  args: any;
  containerId: string;
}

export type DeserializePropsCallback = (params: DeserializePropsParams) => any;
export interface DeserializePropsParams {
  containerId: string;
  props: Props;
}

export type EventArgs = { event: any };

export interface InvokeApplicationCallbackParams {
  args: SerializedArgs;
  method: string;
}

export interface InvokeInternalCallbackParams {
  args: SerializedArgs | EventArgs;
  callback: Function;
}

export interface ExternalCallbackInvocation {
  invocationId: string;
  invocation: Promise<any>;
}

export interface InvokeExternalCallbackParams {
  args: SerializedArgs;
  callbacks: CallbackMap;
  containerId: string;
  initExternalCallbackInvocation: () => ExternalCallbackInvocation;
  invokeInternalCallback: (args: InvokeInternalCallbackParams) => any;
  method: string;
  postCallbackInvocationMessage: PostMessageComponentInvocationCallback;
  serializeArgs: SerializeArgsCallback;
}

export type PostMessageComponentInvocationCallback = (
  message: PostMessageComponentCallbackInvocationParams
) => void;

export interface PostMessageComponentCallbackInvocationParams {
  args: any[];
  callbacks: CallbackMap;
  containerId: string;
  method: string;
  requestId: string;
  serializeArgs: SerializeArgsCallback;
  targetId: string | null;
}

export type PostMessageComponentResponseCallback = (
  message: PostMessageComponentCallbackResponseParams
) => void;
export interface PostMessageComponentCallbackResponseParams {
  containerId: string;
  error: Error | null;
  requestId: string;
  result: any;
  targetId: string;
}

export type PostMessageComponentRenderCallback = (
  message: PostMessageComponentRenderParams
) => void;
export interface PostMessageComponentRenderParams {
  childComponents: ComponentChildMetadata[];
  componentId: string;
  node: SerializedNode;
  trust: ComponentTrust;
}

interface ComposeRenderMethodsParams {
  componentId: string;
  isComponent: (component: Function) => boolean;
  isFragment: (component: Function) => boolean;
  isRootComponent: (component: Function) => boolean;
  postComponentRenderMessage: PostMessageComponentRenderCallback;
  serializeNode: SerializeNodeCallback;
  trust: ComponentTrust;
}

export type ComposeRenderMethodsCallback = (
  params: ComposeRenderMethodsParams
) => {
  commit: (vnode: VNode) => void;
};

export interface ComposeSerializationMethodsParams {
  callbacks: CallbackMap;
  initExternalCallbackInvocation: () => ExternalCallbackInvocation;
  isComponent: (component: Function) => boolean;
  parentContainerId: string | null;
  postCallbackInvocationMessage: PostMessageComponentInvocationCallback;
}

export type ComposeSerializationMethodsCallback = (
  params: ComposeSerializationMethodsParams
) => {
  deserializeArgs: DeserializeArgsCallback;
  deserializeProps: DeserializePropsCallback;
  serializeArgs: SerializeArgsCallback;
  serializeNode: SerializeNodeCallback;
};

export type ComposeMessagingMethodsCallback = () => {
  postCallbackInvocationMessage: PostMessageComponentInvocationCallback;
  postCallbackResponseMessage: PostMessageComponentResponseCallback;
  postComponentRenderMessage: PostMessageComponentRenderCallback;
};

export type UpdateContainerPropsCallback = (props: Props) => void;

export interface ProcessEventParams {
  callbacks: CallbackMap;
  containerId: string;
  deserializeArgs: DeserializeArgsCallback;
  deserializeProps: DeserializePropsCallback;
  initExternalCallbackInvocation: () => ExternalCallbackInvocation;
  invokeInternalCallback: (args: InvokeInternalCallbackParams) => any;
  invokeExternalContainerCallback: (args: InvokeExternalCallbackParams) => any;
  postCallbackInvocationMessage: PostMessageComponentInvocationCallback;
  postCallbackResponseMessage: PostMessageComponentResponseCallback;
  requests: RequestMap;
  serializeArgs: SerializeArgsCallback;
  serializeNode: SerializeNodeCallback;
  updateProps: (props: Props) => void;
}

export interface InitContainerParams {
  containerMethods: {
    buildEventHandler: (params: ProcessEventParams) => Function;
    buildRequest: BuildRequestCallback;
    buildSafeProxy: BuildSafeProxyCallback;
    composeMessagingMethods: ComposeMessagingMethodsCallback;
    composeRenderMethods: ComposeRenderMethodsCallback;
    composeSerializationMethods: ComposeSerializationMethodsCallback;
    dispatchRenderEvent: DispatchRenderEventCallback;
    invokeApplicationCallback: (args: InvokeExternalCallbackParams) => any;
    invokeInternalCallback: (args: InvokeInternalCallbackParams) => any;
    invokeExternalContainerCallback: (
      args: InvokeExternalCallbackParams
    ) => any;
    postCallbackInvocationMessage: PostMessageComponentInvocationCallback;
    postCallbackResponseMessage: PostMessageComponentResponseCallback;
    postComponentRenderMessage: (p: any) => void;
  };
  context: {
    BWEComponent: FunctionComponent;
    Component: Function;
    componentId: string;
    componentPropsJson: object;
    createElement: PreactCreateElement;
    Fragment: FunctionComponent;
    parentContainerId: string | null;
    props: any;
    trust: ComponentTrust;
    updateContainerProps: UpdateContainerPropsCallback;
  };
}

export type SerializeArgsCallback = (
  args: SerializeArgsParams
) => SerializedArgs;
export interface SerializeArgsParams {
  args: any[];
  callbacks: CallbackMap;
  containerId: string;
}

export interface PreactElement {
  type: string;
  props: any;
}

export type PreactCreateElement = (
  type: string | Function,
  props: any,
  children: any
) => PreactElement;

export interface Node {
  type: string | Function;
  props?: Props;
  key?: string;
}

export interface SerializeNodeParams {
  node: Node;
  childComponents: ComponentChildMetadata[];
  parentId: string;
}
export type SerializeNodeCallback = (
  args: SerializeNodeParams
) => SerializedNode;

export interface SerializePropsParams {
  componentId?: string;
  containerId: string;
  props: any;
}

export type SerializePropsCallback = (params: SerializePropsParams) => Props;

export interface DispatchRenderEventParams {
  callbacks: CallbackMap;
  componentId: string;
  node: Node;
  postComponentRenderMessage: PostMessageComponentRenderCallback;
  serializeNode: (p: SerializeNodeParams) => SerializedNode;
  serializeProps: SerializePropsCallback;
  trust: ComponentTrust;
}
export type DispatchRenderEventCallback = (
  params: DispatchRenderEventParams
) => void;

interface BuildSafeProxyParams {
  props: Props;
  componentId: string;
}

export type BuildSafeProxyCallback = (params: BuildSafeProxyParams) => object;
