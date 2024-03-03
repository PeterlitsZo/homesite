export interface Todo {
  id: string;
  parent_id: string;
  status: 'DONE' | 'TODO';
  content: {
    type: 'text';
    text: string;
  }
  children: {
    list: Todo[],
    expended: boolean,
  };
}