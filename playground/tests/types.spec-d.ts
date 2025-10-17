import type { paths } from '#open-fetch-schemas/api'
import type { OpenFetchOptions2 } from 'nuxt-open-fetch'
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

describe('type OpenFetchOptions', () => {
  type Body = FetchOptions['body']
  interface ExpectedDefault extends FetchOptions {
    path?: Record<string, string | number> | undefined
    accept?: MediaType | MediaType[] | undefined
    bodySerializer?: ((body: Body) => Body) | undefined
  }

  type PetO<T extends keyof paths> = OpenFetchOptions2<paths, T>

  function foo<T extends keyof paths>(path: T, options: OpenFetchOptions2<paths, T>) {}

  foo('/pet/{petId}/uploadImage', {
    query: { }
  })

  foo('/pet/{petId}', {
    path: { petId: 42 },
    method: '',
  })

  type T = PetO<'/pet'>

  const t: T = {
    method: '',
  }

  it('has defaults', () => {
    type DefaultFetchOptions = OpenFetchOptions2

    expectTypeOf<DefaultFetchOptions>().toEqualTypeOf<ExpectedDefault>()
  })

  it('accepts an object parameter', () => {
    expectTypeOf<OpenFetchOptions2<Record<any, never>>>().toEqualTypeOf<ExpectedDefault>()
  })

  it('has an object for each path', () => {
    interface Paths {
      '/foo': Record<any, never>
      '/bar': Record<any, never>
    }

    expectTypeOf<OpenFetchOptions2<Paths, '/foo'>>().toEqualTypeOf<ExpectedDefault>()
    expectTypeOf<OpenFetchOptions2<Paths, '/bar'>>().toEqualTypeOf<ExpectedDefault>()
  })

  it('is a union with the passed methods as descriminator', () => {
    interface Paths {
      '/foo': {
        get: Record<any, never>
      }
      '/bar': {
        get: Record<any, never>
        post: Record<any, never>
      }
      '/baz': {
        get: Record<any, never>
        post: never
      }
    }

    type TestFoo = OpenFetchOptions2<Paths, '/foo'>
    type ExpectedFoo = Merge<ExpectedDefault, { method?: 'get' | 'GET' }>
    expectTypeOf<TestFoo>().toEqualTypeOf<ExpectedFoo>()

    type TestBar = OpenFetchOptions2<Paths, '/bar'>
    type ExpectedBar = Merge<ExpectedDefault, { method?: 'get' | 'GET' } | { method: 'post' | 'POST' }>
    expectTypeOf<TestBar>().toEqualTypeOf<ExpectedBar>()

    type TestBaz = OpenFetchOptions2<Paths, '/baz'>
    type ExpectedBaz = Merge<ExpectedDefault, { method?: 'get' | 'GET' }>
    expectTypeOf<TestBaz>().toEqualTypeOf<ExpectedBaz>()
  })

  it('does not include the `parameters` key in the union', () => {
    interface Paths {
      '/foo': {
        parameters: Record<any, never>
        get: Record<any, never>
      }
    }

    expectTypeOf<OpenFetchOptions2<Paths, '/foo'>>()
      .toEqualTypeOf<Merge<ExpectedDefault, { method?: 'get' | 'GET' }>>()
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
      }
      '/bar': {
        post: {
          parameters: {
            query?: BarQuery
          }
        }
      }
    }

    type TestFoo = OpenFetchOptions2<Paths, '/foo'>
    type ExpectedFoo = Merge<ExpectedDefault, { method?: 'get' | 'GET', query: FooQuery }>
    expectTypeOf<TestFoo>().toEqualTypeOf<ExpectedFoo>()

    type TestBar = OpenFetchOptions2<Paths, '/bar'>
    type ExpectedBar = Merge<ExpectedDefault, { method: 'post' | 'POST', query?: BarQuery }>
    expectTypeOf<TestBar>().toEqualTypeOf<ExpectedBar>()
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

    type TestFoo = OpenFetchOptions2<Paths, '/foo'>
    type ExpectedFoo = Merge<ExpectedDefault, { method?: 'get' | 'GET', header: FooHeader }>
    expectTypeOf<TestFoo>().toEqualTypeOf<ExpectedFoo>()

    type TestBar = OpenFetchOptions2<Paths, '/bar'>
    type ExpectedBar = Merge<ExpectedDefault, { method: 'post' | 'POST', header?: BarHeader }>
    expectTypeOf<TestBar>().toEqualTypeOf<ExpectedBar>()
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

    type TestFoo = OpenFetchOptions2<Paths, '/foo/{foo}/{bar}'>
    type ExpectedFoo = Merge<ExpectedDefault, { method?: 'get' | 'GET', path: FooPath }>
    expectTypeOf<TestFoo>().toEqualTypeOf<ExpectedFoo>()

    type TestBar = OpenFetchOptions2<Paths, '/bar/{baz}'>
    type ExpectedBar = Merge<ExpectedDefault, { method: 'post' | 'POST', path?: BarPath }>
    expectTypeOf<TestBar>().toEqualTypeOf<ExpectedBar>()
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

    type TestFoo = OpenFetchOptions2<Paths, '/foo'>
    type ExpectedFoo = Merge<ExpectedDefault, { method?: 'get' | 'GET', cookie: FooCookie }>
    expectTypeOf<TestFoo>().toEqualTypeOf<ExpectedFoo>()

    type TestBar = OpenFetchOptions2<Paths, '/bar'>
    type ExpectedBar = Merge<ExpectedDefault, { method: 'post' | 'POST', cookie?: BarCookie }>
    expectTypeOf<TestBar>().toEqualTypeOf<ExpectedBar>()
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

    type Test = OpenFetchOptions2<paths, '/pet/{petId}/uploadImage'>

    useApi('/pet/{petId}/uploadImage', {
      method: 'post',
      path: { petId: 1 },
    })

    type TestFoo = OpenFetchOptions2<Paths, '/foo'>
    // const _t: TestFoo = {
    //   body: {
    //     foo: 'test'
    //   },
    // }
    type ExpectedFoo = Merge<
      ExpectedDefault,
      { method: 'post' | 'POST', body: FooBody, bodySerializer?: (body: FooBody) => any }
    >
    expectTypeOf<TestFoo>().toEqualTypeOf<ExpectedFoo>()

    type TestBar = OpenFetchOptions2<Paths, '/bar'>
    // const _t2: TestBar = {
    // }
    type ExpectedBar = Merge<
      ExpectedDefault,
      { method: 'put' | 'PUT', body?: BarBody | undefined, bodySerializer?: (body: BarBody) => any }
    >
    expectTypeOf<TestBar>().toEqualTypeOf<ExpectedBar>()
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

    type TestFoo = OpenFetchOptions2<Paths, '/foo'>
    type ExpectedFoo = Merge<
      ExpectedDefault,
      { method?: 'get' | 'GET', accept?: 'application/json' | 'application/vnd.foo.v1+json' | ('application/json' | 'application/vnd.foo.v1+json')[] | undefined }
    >
    expectTypeOf<TestFoo>().toEqualTypeOf<ExpectedFoo>()
  })

  it('removes keys that are explicitly set to never', () => {
    interface Paths {
      '/foo': {
        get: {
          parameters: {
            query?: never
            header?: never
            path?: never
            cookie?: never
          }
          requestBody?: never
        }
      }
    }

    type TestFoo = OpenFetchOptions2<Paths, '/foo'>
    type ExpectedFoo = Merge<
      Omit<ExpectedDefault, 'query' | 'header' | 'path' | 'cookie' | 'body' | 'bodySerializer'>,
      { method?: 'get' | 'GET' }
    >
    expectTypeOf<TestFoo>().toEqualTypeOf<ExpectedFoo>()
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
