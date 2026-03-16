export interface LinearRequest {
  equations: string[]
  method: string
}

export interface LinearResponse {
  equations: string[]
  matrix_A: number[][]
  vector_B: number[]
  solution: string
}

export type Equation = {
  eq:string
}