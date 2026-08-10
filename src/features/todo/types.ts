/**
 * Todo feature payload types for the Pharmacy Portal host.
 * Kept local so the host does not depend on the remote package.
 * Align with MED0003 packages/components/todo/src/contract.ts.
 */
export type TodoItem = {
  id: string;
  title: string;
  completed: boolean;
};

export type TodoFilter = 'all' | 'active' | 'completed';

export type TodoFeatureData = {
  title?: string;
  initialItems?: readonly TodoItem[];
  initialFilter?: TodoFilter;
  onChange?: (items: readonly TodoItem[]) => void;
};
