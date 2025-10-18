import type { RuntimeNuxtHooks } from '#app'
import type { OpenFetchClientName } from '#build/open-fetch'
import type { ClientFetchHooks, GlobalFetchHooks } from '#build/types/open-fetch-hooks'
import type { Hookable } from 'hookable'
import type { FetchContext, FetchError, FetchHooks, FetchOptions } from 'ofetch'
import type {
  ErrorResponse,
  HttpMethod,
  MediaType,
  OkStatus,
  OperationRequestBodyContent,
  ResponseContent,
  ResponseObjectMap,
  SuccessResponse,
} from 'openapi-typescript-helpers'

type Hooks = Hookable<GlobalFetchHooks & ClientFetchHooks> | null

export type FetchResponseData<T extends Record<string | number, any>, Media extends MediaType = MediaType> = SuccessResponse<ResponseObjectMap<T>, Media>
export type FetchResponseError<T extends Record<string | number, any>> = FetchError<ErrorResponse<ResponseObjectMap<T>, MediaType>>

export type MethodOption<M, P> = 'get' extends keyof P ? { method?: M } : { method: M }

export type ParamsOption<T> = T extends { parameters?: any, query?: any } ? T['parameters'] : Record<string, never>

export type RequestBodyOption<T> = OperationRequestBodyContent<T> extends never
  ? { body?: never }
  : undefined extends OperationRequestBodyContent<T>
    ? { body?: OperationRequestBodyContent<T> }
    : { body: OperationRequestBodyContent<T> }

export interface AcceptMediaTypeOption<M> {
  accept?: M | M[]
}

export interface BodySerializerOption<TBody> {
  bodySerializer?: (body: TBody) => any
}

export type FilterMethods<T> = { [K in keyof Omit<T, 'parameters'> as T[K] extends never | undefined ? never : K]: T[K] }

export type ExtractMediaType<T> = ResponseObjectMap<T> extends Record<string | number, any>
  ? { [S in OkStatus]: Extract<keyof ResponseContent<ResponseObjectMap<T>[S]>, MediaType> }[OkStatus]
  : never

type Body = FetchOptions['body']

export interface DefaultFetchOptions extends FetchOptions {
  path?: Record<string, string | number> | undefined
  accept?: MediaType | MediaType[] | undefined
  bodySerializer?: ((body: Body) => Body) | undefined
}

/**
 * From:
 * ```ts
 * type Path = {
 *    get: { foo: string },
 *    post: { bar: string }
 * }
 * ```
 *
 * To:
 * ```ts
 * type Union = { method: 'get', foo: string } | { method: 'post', bar: string }
 * ```
 */
type PathToUnion<TPath extends Record<string, any>> = ToUnion<InlineMethod<TPath>>

/**
 * From:
 * ```ts
 * type Path = {
 *    get: { foo: string },
 *    post: { bar: string },
 * }
 * ```
 *
 * To:
 * ```ts
 * type Inlined = {
 *  get: { method: 'get', foo: string },
 *  post: { method: 'post', bar: string },
 * }
 * ```
 */
type InlineMethod<TPath extends { [method in HttpMethod]?: unknown }> = {
  [KMethod in keyof TPath]: KMethod extends HttpMethod
    ? TransformOperation<KMethod, TPath[KMethod]>
    : never
}

type TransformOperation<TMethod extends HttpMethod, TOperation> = AddMethod<TMethod>
  & ExtractParameters<TOperation>
  & ExtractRequestBody<TOperation>
  & ExtractMediaType2<TOperation>

type AddMethod<TMethod extends HttpMethod> = TMethod extends 'get' ? { method?: TMethod | Uppercase<TMethod> } : { method: TMethod | Uppercase<TMethod> }

type ToUnion<T extends Record<any, any>> = T[keyof T]

/**
 * From:
 * ```ts
 * type Operation = {
 *    parameters: {
 *      query?: {};
 *      header?: {};
 *      path?: {};
 *      cookie?: {};
 *    };
 *    requestBody: {
 *      content: {
 *        "application/json": {};
 *      };
 *    };
 * }
 * ```
 *
 * To:
 * ```ts
 * type Transformed = {
 *   query?: {};
 *   header?: {};
 *   path?: {};
 *   cookie?: {};
 *   body: {};
 * }
 * ```
 *
 */
type ExtractParameters<TOperation> = TOperation extends { parameters: unknown }
  ? TOperation['parameters']
  : unknown

type F<T> = [T] extends [{ foo?: string }] ? 'foo' : 'bar'

type T = F<{}>

type KeysTest = keyof {
  foo?: string
  // bar: number
}

type KeyTest = ['foo'] extends [KeysTest] ? true : false
type GenericKeyTest<T> = 'foo' extends T ? true : false
type GenTest = GenericKeyTest<KeyTest>

type ExtractRequestBody<T> = T extends { requestBody: { content: { [key: string]: any } } } ? {
  body: OperationRequestBodyContent<T>
  bodySerializer?: (body: OperationRequestBodyContent<T>) => any
}
  : 'requestBody' extends keyof T ? {
    body?: OperationRequestBodyContent<T>
    bodySerializer?: (body: NonNullable<OperationRequestBodyContent<T>>) => any
  } : unknown
// { body?: never, bodySerializer?: never }

// use this for bodySerializer stuff:
type HasOnlyOneKey<T, K extends keyof T>
  = keyof T extends [K] ? true : false

export type ExtractMediaType2<T> = T extends {
  responses: {
    [key in OkStatus]?: { content: { [key in infer Media]: any } }
  }
} ? { accept?: Media | Media[] } : unknown
// : { accept?: never }

// export type ExtractMediaType2<TMedia> = TMedia extends string ? { accept?: TMedia | TMedia[] } : {}

type Merge<T, U> = Prettify<Omit<T, keyof U> & U>

type Prettify<T> = {
  [K in keyof T]: T[K]
} & {}

export type OpenFetchOptions2<
  TPaths extends Record<any, any>,
  TPath extends keyof TPaths,
> = keyof TPaths extends never ? DefaultFetchOptions
  : keyof TPaths[TPath] extends never ? DefaultFetchOptions
    : Merge<DefaultFetchOptions, PathToUnion<TPaths[TPath]>>

type RemoveNeverValues<T> = {
  [Key in keyof T as T[Key] extends never ? never : Key]: T[Key]
}

type TransformPathOptions<TPath> = any

interface GenericPathsObject {
  [path: string]: {
    [method in HttpMethod]?: unknown
  }
}

export type OpenFetchOptionsPaths<
  TPaths,
> = {
  [TPath in keyof TPaths]: Merge<DefaultFetchOptions, PathToUnion<RemoveNeverValues<TPaths[TPath]>>>
  // [TPath in keyof TPaths]: TPaths[TPath] extends { [method in HttpMethod]?: unknown }
  //   ? Merge<DefaultFetchOptions, PathToUnion<RemoveNeverValues<TPaths[TPath]>>>
  //   : never

  // ? AddMethod<
  //   ? 'get' extends Method
  //     ? { method?: Method }
  //     : { method: Method }
  // // ? Merge<DefaultFetchOptions, { method?: Method }>
  // // : Merge<DefaultFetchOptions, { method: Method }>
  //   : DefaultFetchOptions
  // : DefaultFetchOptions
  // // ? { metho: Method }
  // // ? Merge<DefaultFetchOptions, { method: Method }>
  // // : DefaultFetchOptions
}

// ######

type OpenFetchOptions<
  Method,
  LowercasedMethod,
  Params,
  Media,
  Operation = 'get' extends LowercasedMethod
    ? ('get' extends keyof Params ? Params['get'] : never)
    : (LowercasedMethod extends keyof Params ? Params[LowercasedMethod] : never),
>
= MethodOption<Method, Params>
  & ParamsOption<Operation>
  & RequestBodyOption<Operation>
  // & { body?: any }
  & AcceptMediaTypeOption<Media>
  // & { accept?: any }
  & Omit<FetchOptions, 'query' | 'body' | 'method'>
  & BodySerializerOption<RequestBodyOption<Operation>['body']>

interface InternalOptions<TPaths, TPath extends keyof TPaths> { }

const paths = {

}

// type TargetOptions = {
//   method:
// }
//
type ExportedOptions<TPath extends keyof typeof paths> = InternalOptions<typeof paths, TPath>

export type OpenFetchClient<Paths> = <
  ReqT extends Extract<keyof Paths, string>,
  Methods extends FilterMethods<Paths[ReqT]>,
  Method extends Extract<keyof Methods, string> | Uppercase<Extract<keyof Methods, string>>,
  LowercasedMethod extends (Lowercase<Method> extends keyof Methods ? Lowercase<Method> : never),
  DefaultMethod extends ('get' extends LowercasedMethod ? 'get' : LowercasedMethod),
  Media extends ExtractMediaType<Methods[DefaultMethod]>,
  ResT = Methods[DefaultMethod] extends Record<string | number, any> ? FetchResponseData<Methods[DefaultMethod], Media> : never,
>(
  url: ReqT,
  options?: OpenFetchOptions<Method, LowercasedMethod, Methods, Media>
) => Promise<ResT>

// More flexible way to rewrite the request path,
// but has problems - https://github.com/unjs/ofetch/issues/319
export function openFetchRequestInterceptor(ctx: FetchContext) {
  // @ts-expect-error - `path` is not in FetchOptions
  ctx.request = fillPath(ctx.request as string, (ctx.options).path)
}

function createHook<T extends keyof FetchHooks>(hooks: NonNullable<Hooks>, baseOpts: FetchOptions, hook: T, hookIdentifier?: OpenFetchClientName) {
  // @ts-ignore
  return async (...args: Parameters<RuntimeNuxtHooks[`openFetch:${T}`]>) => {
    await hooks.callHook(`openFetch:${hook}`, ...args)

    if (hookIdentifier) {
      await hooks.callHook(`openFetch:${hook}:${hookIdentifier}`, ...args as any)
    }

    const ctx = args[0]
    const baseHook = baseOpts[hook]

    if (baseHook) {
      await (Array.isArray(baseHook)
        ? Promise.all(baseHook.map(h => h(ctx as any)))
        : baseHook(ctx as any))
    }
  }
}

function getOpenFetchHooks(hooks: Hooks, baseOpts: FetchOptions, hookIdentifier?: OpenFetchClientName) {
  const openFetchHooks: Array<keyof FetchHooks> = [
    'onRequest',
    'onRequestError',
    'onResponse',
    'onResponseError',
  ]

  if (!hooks)
    return {} as FetchHooks

  return openFetchHooks.reduce<FetchHooks>((acc, hook) => {
    // @ts-ignore
    acc[hook as keyof FetchHooks] = createHook(hooks, baseOpts, hook as keyof FetchHooks, hookIdentifier)
    return acc
  }, {} as FetchHooks)
}

export function createOpenFetch<Paths>(
  options: FetchOptions | ((options: FetchOptions) => FetchOptions),
  localFetch?: typeof globalThis.$fetch,
  hookIdentifier?: string,
  hooks: Hookable<any> | null = null,
): OpenFetchClient<Paths> {
  return (url: string, baseOpts: any) => {
    baseOpts = typeof options === 'function'
      ? options(baseOpts)
      : {
          ...options,
          ...baseOpts,
        }

    const opts: FetchOptions & {
      path?: Record<string, string>
      accept?: MediaType | MediaType[]
      header: HeadersInit | undefined
      bodySerializer?: (body: any) => any
    } = {
      ...baseOpts,
      ...getOpenFetchHooks(hooks, baseOpts, hookIdentifier as OpenFetchClientName),
    }

    if (opts.body && opts.bodySerializer) {
      opts.body = opts.bodySerializer(opts.body)
    }

    if (opts.header) {
      opts.headers = opts.header
      delete opts.header
    }

    opts.headers = new Headers(opts.headers)
    if (opts.accept) {
      opts.headers.set(
        'Accept',
        Array.isArray(opts.accept)
          ? opts.accept.join(', ')
          : opts.accept,
      )
      delete opts.accept
    }

    const $fetch = getFetch(url, opts, localFetch)

    return $fetch(fillPath(url, opts?.path), opts as any)
  }
}

function getFetch(url: string, opts: FetchOptions, localFetch?: typeof globalThis.$fetch) {
  if (import.meta.server && localFetch) {
    const isLocalFetch = url[0] === '/' && (!opts.baseURL || opts.baseURL![0] === '/')
    if (isLocalFetch)
      return localFetch
  }

  return globalThis.$fetch
}

export function fillPath(path: string, params: Record<string, string> = {}) {
  for (const [k, v] of Object.entries(params)) path = path.replace(`{${k}}`, encodeURIComponent(String(v)))
  return path
}
