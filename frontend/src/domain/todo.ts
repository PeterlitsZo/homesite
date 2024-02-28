export interface Todo {
  id: string;
  status: 'DONE' | 'TODO';
  content: {
    type: 'text';
    text: string;
  }
  todos: Todo[];
}