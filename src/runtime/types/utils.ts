export type Prettify<T> = {
  [K in keyof T]: T[K]
} & {}

export type ToUnion<T extends Record<any, any>> = T[keyof T]

export type Merge<T, U> = Prettify<Omit<T, keyof U> & U>

export type RemoveNeverValues<T> = {
  [Key in keyof T as T[Key] extends never ? never : Key]: T[Key]
}
