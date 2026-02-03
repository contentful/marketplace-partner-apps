export type EntitreeFlexTreeNode = {
  id: string
  name: string
  type?: 'input' | 'default'
  children?: string[]
  parents?: string[]
  siblings?: string[]
  spouses?: string[]
  isSpouse?: boolean
  isSibling?: boolean
}

export type EntitreeFlexTreeData = {
  [key: string]: EntitreeFlexTreeNode
}