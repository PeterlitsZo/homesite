import { JSX, createSignal } from "solid-js";

import styles from './TreeItem.module.scss';
import { useTree } from "./Tree";

export const treeRoot = Symbol('TreeRoot');

export type ItemId = string | typeof treeRoot;

export interface Item<T> {
  id: ItemId;
  data: T;
  children: Array<ItemId>;
  status: ItemState;
}

export type ItemData<T> =
  | { type: 'normal' } & Item<T>
  | { type: 'fake-root' } & Pick<Item<T>, 'id' | 'children'>;

export type ItemState =
  | 'STATIC'
  | 'SNAPSHOT'
  | 'SYNCED'
  | 'SYNCING'
  ;

export interface ItemRenderProps {
  hover: boolean;
  state: ItemState;
  hit: string; // TODO: Remove this.
}

interface TreeItemProps<T> {
  id: ItemId;
  indent: number;
  index: number;
  indentWidth: string;

  render: (data: Item<T>, props: ItemRenderProps) => JSX.Element;
}

export function TreeItem<T>(props: TreeItemProps<T>) {
  const [tree, setTree] = useTree<T>()!;

  const data = () => {
    const data = tree.data.get(props.id)!;
    if (data.type === 'normal') {
      return data;
    }
    throw new Error('the TreeItem should be a normal node rather than fake-root');
  }

  const [isHover, setHover] = createSignal(false);
  const [hit, setHit_TODO_TO_REMOVE] = createSignal('');

  const state = (): ItemState => {
    return data().status;
  };

  const dragOverHandler = (event: DragEvent) => {
    event.preventDefault();

    const target = (event.currentTarget! as HTMLDivElement);
    const targetRect = target.getBoundingClientRect();

    function ofTop(height: number) {
      return event.clientY < targetRect.top + height;
    }
    function ofBottom(height: number) {
      return event.clientY > targetRect.bottom - height;
    }

    if (ofTop(8)) {
      setHit_TODO_TO_REMOVE('of top');
      setTree.moveTo(tree.parents.get(props.id)!, props.index);
    } else if (ofBottom(8)) {
      setHit_TODO_TO_REMOVE('of bottom');
      setTree.moveTo(tree.parents.get(props.id)!, props.index + 1);
    } else {
      setHit_TODO_TO_REMOVE("");
    }
  }

  const dragLeaveHandler = (event: DragEvent) => {
    setHit_TODO_TO_REMOVE('');
  };

  const dragStartHandler = (event: DragEvent) => {
    setTree.startDragging(props.id);
  };

  const dragEndHandler = (event: DragEvent) => {
    setTree.endDragging();
  }

  return (
    <div
      class={styles.TreeItem}
      style={{ 'padding-left': `calc(0.25rem + ${props.indent} * ${props.indentWidth})` }}
      draggable="true"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onDragStart={dragStartHandler}
      onDragEnd={dragEndHandler}
      onDragOver={dragOverHandler}
      onDragLeave={dragLeaveHandler}
    >
      {
        props.render(data(), {
          hover: isHover(),
          state: state(),
          hit: hit(),
        })
      }
    </div>
  )
}