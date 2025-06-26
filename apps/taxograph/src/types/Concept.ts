export type Concept = {
  label: string
  id: string
  parents: string[]
  children: Concept[]
}