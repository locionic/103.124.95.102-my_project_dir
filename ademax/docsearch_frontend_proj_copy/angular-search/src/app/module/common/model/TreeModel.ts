export interface TreeNode {
  id?: string;
  name: string;
  children?: TreeNode[]
  count?: number;
  active?: boolean;
  inSearchMode?: boolean;
  searchTerm?: string;
}
