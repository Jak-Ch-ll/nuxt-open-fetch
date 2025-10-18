import type { FetchOptions } from 'ofetch'
import type { HttpMethod, MediaType, OkStatus, OperationRequestBodyContent } from 'openapi-typescript-helpers'
import type { Merge, RemoveNeverValues, ToUnion } from './utils'

type Body = FetchOptions['body']

export interface DefaultFetchOptions extends FetchOptions {
  path?: Record<string, string | number> | undefined
  accept?: MediaType | MediaType[] | undefined
  bodySerializer?: ((body: Body) => Body) | undefined
}

export type OpenFetchOptionsPaths<
  TPaths,
> = {
  [TPath in keyof TPaths]: Merge<DefaultFetchOptions, OpenApiPathToOptionsUnion<RemoveNeverValues<TPaths[TPath]>>>
}

/**
 * Transforms an openapi-typescript path item into a nuxt-open-fetch options union
 *
 * @example
 * ```ts
 * // Input:
 * type PathItem = {
 *  get: { query: {...} },
 *  post: { body: {...} },
 * }
 *
 * // Output:
 * type Options =
 *  | { method?: 'get' | 'GET', query: {...} }
 *  | { method: 'post' | 'POST', body: {...} }
 * ```
 */
type OpenApiPathToOptionsUnion<TPath> = ToUnion<{
  [KMethod in keyof TPath]: TPath[KMethod] extends never | undefined
    ? never
    : KMethod extends HttpMethod
      ? TransformOperation<KMethod, TPath[KMethod]>
      : never
}>

/**
 * Transforms an openapi-typescript operation into a nuxt-open-fetch options type
 */
type TransformOperation<TMethod extends HttpMethod, TOperation> = AddMethod<TMethod>
  & ExtractParameters<TOperation>
  & ExtractRequestBody<TOperation>
  & ExtractMediaType2<TOperation>

type AddMethod<TMethod extends HttpMethod> = TMethod extends 'get'
  ? { method?: TMethod | Uppercase<TMethod> }
  : { method: TMethod | Uppercase<TMethod> }

type ExtractParameters<TOperation> = TOperation extends { parameters: unknown }
  ? TOperation['parameters']
  : unknown

type ExtractRequestBody<T> = T extends { requestBody: { content: { [key: string]: unknown } } }
  ? {
      body: OperationRequestBodyContent<T>
      bodySerializer?: (body: OperationRequestBodyContent<T>) => any
    }
  : 'requestBody' extends keyof T
    ? {
        body?: OperationRequestBodyContent<T>
        bodySerializer?: (body: NonNullable<OperationRequestBodyContent<T>>) => any
      }
    : unknown

type ExtractMediaType2<T> = T extends {
  responses: {
    [key in OkStatus]?: { content: { [key in infer Media]: unknown } }
  }
} ? { accept?: Media | Media[] } : unknown
