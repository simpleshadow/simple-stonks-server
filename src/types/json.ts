export type JSONValue = string | number | boolean | null | JSONValue[] | { [key: string]: JSONValue }

export type JSONObject = { [key: string]: JSONValue }

export type JSONLink = {
  self: string
  related?: string
}

export type JSONRelationshipDataObject<T extends JSONObject> = {
  id: JSONDataObject<T>['id']
  type: JSONDataObject<T>['type']
}

export type JSONRelationship<T extends JSONObject> = {
  links: JSONLink
  data: JSONRelationshipDataObject<T> | JSONRelationshipDataObject<T>[]
}

export type JSONDataObject<T extends JSONObject> = {
  id: string | number
  type: string
  attributes: T
  // links: JSONLink
  // relationships?: {
  //   [key: string]: JSONRelationship<unknown extends JSONObject ? JSONObject : never>
  // }
}

export type JSONData<T extends JSONObject> = JSONDataObject<T> | JSONDataObject<T>[]
