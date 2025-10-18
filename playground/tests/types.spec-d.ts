import type { paths } from '#open-fetch-schemas/api'
import type { OpenFetchOptionsPaths } from 'nuxt-open-fetch'
import type { FetchOptions } from 'ofetch'
import type { MediaType } from 'openapi-typescript-helpers'
import type { Ref } from 'vue'
import { describe, expectTypeOf, it } from 'vitest'
import { createOpenFetch } from '../../src/runtime/fetch'
import { createUseOpenFetch } from '../../src/runtime/useFetch'

interface ReturnData {
  id?: number
  name: string
  category?: {
    id?: number
    name?: string
  } | undefined
  photoUrls: string[]
  tags?: {
    id?: number
    name?: string
  }[]
  status?: 'available' | 'pending' | 'sold'
}

interface ReturnDataV2 {
  id?: number
  name: string
  breed?: string
  age?: number
  category?: {
    id?: number
    name?: string
  } | undefined
  photoUrls: string[]
  tags?: {
    id?: number
    name?: string
  }[]
  status?: 'available' | 'pending' | 'sold'
  owner?: {
    name?: string
    email?: string
  }
}

type Prettify<T> = {
  [K in keyof T]: T[K]
} & {}

type Merge<T, U> = Prettify<Omit<T, keyof U> & U>

describe('type OpenFetchOptionsPaths', () => {
  type Body = FetchOptions['body']
  interface ExpectedDefault extends FetchOptions {
    path?: Record<string, string | number> | undefined
    accept?: MediaType | MediaType[] | undefined
    bodySerializer?: ((body: Body) => Body) | undefined
  }

  it('accepts the generated `paths` type', () => {
    type _ = OpenFetchOptionsPaths<paths>
  })

  it('Outputs in `never` with wrong argument', () => {
    type Output = OpenFetchOptionsPaths<any>
    expectTypeOf<Output[string]>().toBeNever()
  })

  it('Outputs in `never` for malformed paths', () => {
    interface Paths {
      '/foo': any
      '/bar': any
    }
    type Output = OpenFetchOptionsPaths<Paths>

    expectTypeOf<Output>().toHaveProperty('/foo').toBeNever()
    expectTypeOf<Output>().toHaveProperty('/bar').toBeNever()
  })

  it('fails on non-existing paths', () => {
    interface Paths {
      '/foo': Record<string, never>
    }
    type Output = OpenFetchOptionsPaths<Paths>

    expectTypeOf<Output>().not.toHaveProperty('/non-existing')
  })

  it('creates unions with the passed methods as descriminators', () => {
    interface Paths {
      '/foo': {
        get: unknown
      }
      '/bar': {
        get: unknown
        post: unknown
      }
    }

    type Output = OpenFetchOptionsPaths<Paths>

    type OutputFoo = Output['/foo']
    type ExpectedFoo = Merge<ExpectedDefault, { method?: 'get' | 'GET' }>
    expectTypeOf<OutputFoo>().toEqualTypeOf<ExpectedFoo>()
    expectTypeOf<OutputFoo>().toHaveProperty('method').toEqualTypeOf<ExpectedFoo['method']>()

    type OutputBar = Output['/bar']
    type ExpectedBar = Merge<ExpectedDefault, { method?: 'get' | 'GET' } | { method: 'post' | 'POST' }>
    expectTypeOf<OutputBar>().toEqualTypeOf<ExpectedBar>()
    expectTypeOf<OutputBar>().toHaveProperty('method').toEqualTypeOf<ExpectedBar['method']>()
  })

  it('filters out methods with type `never`', () => {
    interface Paths {
      '/foo': {
        get: unknown
        post: never
      }
    }

    type Output = OpenFetchOptionsPaths<Paths>

    type OutputFoo = Output['/foo']
    type ExpectedFoo = Merge<ExpectedDefault, { method?: 'get' | 'GET' }>
    expectTypeOf<OutputFoo>().toEqualTypeOf<ExpectedFoo>()
    expectTypeOf<OutputFoo>().toHaveProperty('method').toEqualTypeOf<ExpectedFoo['method']>()
  })

  it('works with a generic type', () => {
    interface Paths {
      '/foo': {
        get: unknown
      }
      '/bar': {
        get: unknown
        post: unknown
      }
    }

    type ApiOptions<TPath extends keyof Paths> = OpenFetchOptionsPaths<Paths>[TPath]

    type OutputFoo = ApiOptions<'/foo'>
    type ExpectedFoo = Merge<ExpectedDefault, { method?: 'get' | 'GET' }>
    expectTypeOf<OutputFoo>().toEqualTypeOf<ExpectedFoo>()
    expectTypeOf<OutputFoo['method']>().toEqualTypeOf<ExpectedFoo['method']>()

    type OutputBar = ApiOptions<'/bar'>
    type ExpectedBar = Merge<ExpectedDefault, { method?: 'get' | 'GET' } | { method: 'post' | 'POST' }>
    expectTypeOf<OutputBar>().toEqualTypeOf<ExpectedBar>()
    expectTypeOf<OutputBar['method']>().toEqualTypeOf<ExpectedBar['method']>()

    // @ts-expect-error
    type _ = ApiOptions<'/non-existing'>
  })

  it('does not include non-method keys in the union', () => {
    interface Paths {
      '/foo': {
        parameters: unknown
        get: unknown
        unknownKey: unknown
      }
    }

    type Output = OpenFetchOptionsPaths<Paths>
    type Expected = Merge<ExpectedDefault, { method?: 'get' | 'GET' }>
    expectTypeOf<Output['/foo']>().toEqualTypeOf<Expected>()
    expectTypeOf<Output['/foo']['method']>().toEqualTypeOf<Expected['method']>()
  })

  it('has the right query type', () => {
    interface FooQuery {
      foo?: string
      bar: number
    }

    interface BarQuery {
      baz?: boolean
    }

    interface Paths {
      '/foo': {
        get: {
          parameters: {
            query: FooQuery
          }
        }
        post: {
          parameters: {
            query?: BarQuery
          }
        }
      }
      '/bar': {
        post: {
          parameters: {
            query?: BarQuery
          }
        }
      }
    }

    type Output = OpenFetchOptionsPaths<Paths>

    type OutputFoo = Output['/foo']
    type ExpectedFoo = Merge<
      ExpectedDefault,
      { method?: 'get' | 'GET', query: FooQuery } | { method: 'post' | 'POST', query?: BarQuery }
    >
    expectTypeOf<OutputFoo>().toEqualTypeOf<ExpectedFoo>()
    expectTypeOf<OutputFoo>()
      .extract<{ method?: 'get' | 'GET' }>()
      .toHaveProperty('query')
      .toEqualTypeOf<FooQuery>()
    expectTypeOf<OutputFoo>()
      .extract<{ method: 'post' | 'POST' }>()
      .toHaveProperty('query')
      .toEqualTypeOf<BarQuery | undefined>()

    type OutputBar = Output['/bar']
    type ExpectedBar = Merge<ExpectedDefault, { method: 'post' | 'POST', query?: BarQuery }>
    expectTypeOf<OutputBar>().toEqualTypeOf<ExpectedBar>()
    expectTypeOf<OutputBar>().toHaveProperty('query').toEqualTypeOf<BarQuery | undefined>()
  })

  it('has the right header type', () => {
    interface FooHeader {
      'X-Foo'?: string
      'X-Bar': number
    }

    interface BarHeader {
      'X-Baz'?: boolean
    }

    interface Paths {
      '/foo': {
        get: {
          parameters: {
            header: FooHeader
          }
        }
      }
      '/bar': {
        post: {
          parameters: {
            header?: BarHeader
          }
        }
      }
    }

    type Output = OpenFetchOptionsPaths<Paths>

    type OutputFoo = Output['/foo']
    type ExpectedFoo = Merge<ExpectedDefault, { method?: 'get' | 'GET', header: FooHeader }>
    expectTypeOf<OutputFoo>().toEqualTypeOf<ExpectedFoo>()
    expectTypeOf<OutputFoo>().toHaveProperty('header').toEqualTypeOf<FooHeader>()

    type OutputBar = Output['/bar']
    type ExpectedBar = Merge<ExpectedDefault, { method: 'post' | 'POST', header?: BarHeader }>
    expectTypeOf<OutputBar>().toEqualTypeOf<ExpectedBar>()
    expectTypeOf<OutputBar>().toHaveProperty('header').toEqualTypeOf<BarHeader | undefined>()
  })

  it('has the right path type', () => {
    interface FooPath {
      foo: string
      bar: number
    }

    interface BarPath {
      baz: boolean
    }

    interface Paths {
      '/foo/{foo}/{bar}': {
        get: {
          parameters: {
            path: FooPath
          }
        }
      }
      '/bar/{baz}': {
        post: {
          parameters: {
            path?: BarPath
          }
        }
      }
    }

    type Output = OpenFetchOptionsPaths<Paths>

    type OutputFoo = Output['/foo/{foo}/{bar}']
    type ExpectedFoo = Merge<ExpectedDefault, { method?: 'get' | 'GET', path: FooPath }>
    expectTypeOf<OutputFoo>().toEqualTypeOf<ExpectedFoo>()
    expectTypeOf<OutputFoo>().toHaveProperty('path').toEqualTypeOf<FooPath>()

    type OutputBar = Output['/bar/{baz}']
    type ExpectedBar = Merge<ExpectedDefault, { method: 'post' | 'POST', path?: BarPath }>
    expectTypeOf<OutputBar>().toEqualTypeOf<ExpectedBar>()
    expectTypeOf<OutputBar>().toHaveProperty('path').toEqualTypeOf<BarPath | undefined>()
  })

  it('has the right cookie type', () => {
    interface FooCookie {
      foo?: string
      bar: number
    }

    interface BarCookie {
      baz?: boolean
    }

    interface Paths {
      '/foo': {
        get: {
          parameters: {
            cookie: FooCookie
          }
        }
      }
      '/bar': {
        post: {
          parameters: {
            cookie?: BarCookie
          }
        }
      }
    }

    type Output = OpenFetchOptionsPaths<Paths>

    type OutputFoo = Output['/foo']
    type ExpectedFoo = Merge<ExpectedDefault, { method?: 'get' | 'GET', cookie: FooCookie }>
    expectTypeOf<OutputFoo>().toEqualTypeOf<ExpectedFoo>()
    expectTypeOf<OutputFoo>().toHaveProperty('cookie').toEqualTypeOf<FooCookie>()

    type OutputBar = Output['/bar']
    type ExpectedBar = Merge<ExpectedDefault, { method: 'post' | 'POST', cookie?: BarCookie }>
    expectTypeOf<OutputBar>().toEqualTypeOf<ExpectedBar>()
    expectTypeOf<OutputBar>().toHaveProperty('cookie').toEqualTypeOf<BarCookie | undefined>()
  })

  it('has the right body type', () => {
    interface FooBody {
      foo: string
      bar?: number
    }

    interface BarBody {
      baz: boolean
    }

    interface Paths {
      '/foo': {
        post: {
          requestBody: {
            content: {
              'application/json': FooBody
            }
          }
        }
      }
      '/bar': {
        put: {
          // @todo handle optional requestBody
          requestBody?: {
            content: {
              'application/json': BarBody
            }
          }
        }
      }
    }

    type Output = OpenFetchOptionsPaths<Paths>

    type OutputFoo = Output['/foo']
    type ExpectedFoo = Merge<
      ExpectedDefault,
      { method: 'post' | 'POST', body: FooBody, bodySerializer?: (body: FooBody) => any }
    >
    expectTypeOf<OutputFoo>().toEqualTypeOf<ExpectedFoo>()
    expectTypeOf<OutputFoo>().toHaveProperty('body').toEqualTypeOf<FooBody>()

    type OutputBar = Output['/bar']
    type ExpectedBar = Merge<
      ExpectedDefault,
      { method: 'put' | 'PUT', body?: BarBody | undefined, bodySerializer?: (body: BarBody) => any }
    >
    expectTypeOf<OutputBar>().toEqualTypeOf<ExpectedBar>()
    expectTypeOf<OutputBar>()
      .toHaveProperty('body')
      .toEqualTypeOf<BarBody | undefined>()
    expectTypeOf<OutputBar>()
      .toHaveProperty('bodySerializer')
      .toEqualTypeOf<((body: BarBody) => any) | undefined>()
  })

  it('has the right accept options', () => {
    interface Paths {
      '/foo': {
        get: {
          responses: {
            200: {
              content: {
                'application/json': Record<any, never>
                'application/vnd.foo.v1+json': Record<any, never>
              }
            }
          }
        }
      }
    }

    type Output = OpenFetchOptionsPaths<Paths>

    type ExpectedAcceptOptions
      = | 'application/json'
        | 'application/vnd.foo.v1+json'
        | ('application/json' | 'application/vnd.foo.v1+json')[]
        | undefined
    type ExpectedFoo = Merge<
      ExpectedDefault,
      { method?: 'get' | 'GET', accept?: ExpectedAcceptOptions }
    >
    expectTypeOf<Output['/foo']>().toEqualTypeOf<ExpectedFoo>()
    expectTypeOf<Output['/foo']>().toHaveProperty('accept').toEqualTypeOf<ExpectedAcceptOptions>()
  })
})

describe('$[client]', async () => {
  const $pets = createOpenFetch<paths>({})

  it('is function', () => {
    expectTypeOf($pets).toBeFunction()
  })

  it('supports "method" in lowercase and uppercase', () => () => {
    $pets('/pet/{petId}', {
      path: { petId: 1 },
      method: 'get',
    })

    $pets('/pet/{petId}', {
      path: { petId: 1 },
      method: 'GET',
    })
  })

  it('has correct body type', () => () => {
    // @todo this test passes if the lib sets the body to `any`
    $pets('/pet', {
      method: 'post',
      body: {
        name: 'doggie',
        photoUrls: [],
      },
    })
  })

  it('has correct return type', () => async () => {
    const data = await $pets('/pet/{petId}')
    expectTypeOf(data).toExtend<ReturnData>()
  })

  it('returns correct type based on accept header', () => async () => {
    const jsonData = await $pets('/pet/{petId}', {
      path: { petId: 1 },
      accept: 'application/json',
    })
    expectTypeOf(jsonData).toEqualTypeOf<ReturnData>()

    const v1Data = await $pets('/pet/{petId}', {
      path: { petId: 1 },
      accept: 'application/vnd.petstore.v1+json',
    })
    expectTypeOf(v1Data).toEqualTypeOf<ReturnData>()
    expectTypeOf(v1Data).not.toEqualTypeOf<ReturnDataV2>()

    const v2Data = await $pets('/pet/{petId}', {
      path: { petId: 1 },
      accept: 'application/vnd.petstore.v2+json',
    })
    expectTypeOf(v2Data).toEqualTypeOf<ReturnDataV2>()
  })

  it('supports mixed media type arrays with correct return type', () => async () => {
    const data = await $pets('/pet/{petId}', {
      path: { petId: 1 },
      accept: ['application/json', 'application/vnd.petstore.v2+json'],
    })
    expectTypeOf(data).toEqualTypeOf<ReturnData | ReturnDataV2>()
  })
})

describe('use[Client]', async () => {
  const usePets = createUseOpenFetch<paths>('api')

  it('is function', () => {
    expectTypeOf(usePets).toBeFunction()
  })

  it('supports "method" in lowercase and uppercase', () => () => {
    usePets('/pet/{petId}', {
      path: { petId: 1 },
      method: 'get',
    })
    usePets('/pet/{petId}', {
      path: { petId: 1 },
      method: 'GET',
    })
  })

  it('has correct "body" type', () => () => {
    usePets('/pet', {
      method: 'post',
      body: {
        name: 'doggie',
        photoUrls: [],
      },
      immediate: true,
    })
  })

  it('has correct return type', () => () => {
    const { data } = usePets('/pet/{petId}', {
      path: { petId: 1 },
      immediate: false,
    })

    expectTypeOf(data).toExtend<Ref<ReturnData | undefined>>()
  })

  it('has correct "transform" input parameter type', () => () => {
    usePets('/pet/{petId}', {
      path: { petId: 1 },
      transform: input => ({
        foo: input.name,
      }),
      immediate: false,
    })
  })

  it('has correct response type using "transform"', () => () => {
    const { data } = usePets('/pet/{petId}', {
      method: 'get',
      path: { petId: 1 },
      transform: input => ({
        foo: input.name,
      }),
      immediate: false,
    })

    expectTypeOf(data).toExtend<Ref<{ foo: string } | undefined>>()
  })

  it('has correct reponse type using "default"', () => () => {
    const { data } = usePets('/pet/{petId}', {
      path: { petId: 1 },
      default: () => ({
        bar: 12,
      }),
      immediate: false,
    })

    expectTypeOf(data).toExtend<Ref<ReturnData | { bar: number }>>()
  })

  it('has correct response type using "default" and "transform"', () => () => {
    const { data } = usePets('/pet/{petId}', {
      path: { petId: 1 },
      transform: input => ({
        foo: input.name,
      }),
      default: () => ({
        bar: 12,
      }),
      immediate: false,
    })

    expectTypeOf(data).toExtend<Ref<{ foo: string } | { bar: number }>>()
  })

  it('has correct response type using "pick"', () => () => {
    const { data } = usePets('/pet/{petId}', {
      path: { petId: 1 },
      pick: ['name'],
      immediate: false,
    })

    expectTypeOf(data).toExtend<Ref<{ name: string } | undefined>>()
  })

  it('returns correct type based on accept header', () => () => {
    const { data: jsonData } = usePets('/pet/{petId}', {
      path: { petId: 1 },
      accept: 'application/json',
      immediate: false,
    })
    expectTypeOf(jsonData).toEqualTypeOf<Ref<ReturnData | undefined>>()

    const { data: v1Data } = usePets('/pet/{petId}', {
      path: { petId: 1 },
      accept: 'application/vnd.petstore.v1+json',
      immediate: false,
    })
    expectTypeOf(v1Data).toEqualTypeOf<Ref<ReturnData | undefined>>()
    expectTypeOf(v1Data).not.toEqualTypeOf<Ref<ReturnDataV2 | undefined>>()

    const { data: v2Data } = usePets('/pet/{petId}', {
      path: { petId: 1 },
      accept: 'application/vnd.petstore.v2+json',
      immediate: false,
    })
    expectTypeOf(v2Data).toEqualTypeOf<Ref<ReturnDataV2 | undefined>>()
  })

  it('supports mixed media type arrays with correct return type', () => () => {
    const { data } = usePets('/pet/{petId}', {
      path: { petId: 1 },
      accept: ['application/json', 'application/vnd.petstore.v2+json'],
      immediate: false,
    })

    expectTypeOf(data).toEqualTypeOf<Ref<ReturnData | ReturnDataV2 | undefined>>()
  })
})
