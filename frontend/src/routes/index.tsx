import { Title } from "@solidjs/meta";
import TodoList from "~/components/TodoList";

export default function Home() {
  return (
    <main>
      <Title>index.html</Title>
      <TodoList />
    </main>
  );
}
