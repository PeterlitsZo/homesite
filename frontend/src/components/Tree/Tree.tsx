import { For, JSX, children, createContext, useContext } from "solid-js";

import { Item, ItemId, ItemMaybenotData, ItemRenderProps, TreeItem, treeRoot } from "./TreeItem";
import { createStore } from "solid-js/store";

interface TreeProps<T> {
  data: Record<Exclude<ItemId, typeof treeRoot>, Item<T>>;
  rootList: Array<ItemId>;
  render: (item: Item<T>, props: ItemRenderProps) => JSX.Element;
  indentWidth: string;
}

type Tree<T> = {
  data: Map<ItemId, ItemMaybenotData<T>>;

  /** If parents[id] is undefined, it means that the item that id points has no
   *  parent.   */
  parents: Map<ItemId, ItemId>;

  currentDragging: ItemId | undefined;
}

type TreeContextSetter = {
  startDragging: (id: ItemId) => void;
  endDragging: () => void;

  /**
   * `moveTo` moves the current dragging item to another place. Using
   * `startDragging` firstly.
   * 
   * It will first insert it into the aim parent's children (pointed by
   * `aimParentId`), and then remove it from its original place.
   */
  moveTo: (aimParentId: ItemId, index: number) => void;
};

const TreeContext = createContext<[Tree<any>, TreeContextSetter]>();

export function useTree<T>() {
  return useContext(TreeContext) as [Tree<T>, TreeContextSetter];
}

export function Tree<T>(props: TreeProps<T>) {
  const tree = {
    id: treeRoot as typeof treeRoot,
    children: props.rootList,
  };
  const data = new Map() as Map<ItemId, ItemMaybenotData<T>>;
  for (const id in props.data) {
    data.set(id, props.data[id]);
  }
  data.set(treeRoot, tree);

  // Get the map from items' ID to thier parents.
  const parents = new Map() as Map<ItemId, ItemId>;
  for (let [id, item] of data) {
    const children = item.children;
    for (let child of children) {
      parents.set(child, id);
    }
  }

  // Create store.
  const [store, setStore] = createStore<Tree<T>>({
    data,
    parents,
    currentDragging: undefined,
  });

  // Create context.
  const context = [
    store,
    {
      startDragging(id: ItemId) {
        setStore('currentDragging', id);
      },
      endDragging() {
        setStore('currentDragging', undefined);
      },
      moveTo(aimParentId: ItemId, index: number) {
        if (store.currentDragging === undefined) {
          console.error('store.currentDragging is undefined')
          return;
        }

        const draggingItemId = store.currentDragging;
        const draggingItemParentId = store.parents.get(draggingItemId)!;

        if (draggingItemParentId === aimParentId) {
          // The dragging item is not move to another parent.

          // Get the original index.
          let originalIndex = 0;
          const children = [...store.data.get(aimParentId)!.children];
          children.forEach((child, idx) => {
            if (child === draggingItemId) {
              originalIndex = idx;
            }
          });

          // Remove the original element.
          children.splice(originalIndex, 1);

          // Insert into the new place.
          if (originalIndex < index) {
            index --;
          }
          children.splice(index, 0, draggingItemId);

          // Update store.
          const newData = new Map(data);
          newData.set(aimParentId, { ...newData.get(aimParentId)!, children });
          setStore('data', newData);
        } else {
          // Or they have different parents.

          // Get the original index.
          let originalIndex = 0;
          const originalChildren = [...store.data.get(draggingItemParentId)!.children];
          originalChildren.forEach((child, idx) => {
            if (child === draggingItemId) {
              originalIndex = idx;
            }
          });

          // Remove the original element.
          originalChildren.splice(originalIndex, 1);

          // Insert into the new place.
          const aimChildren = [...store.data.get(aimParentId)!.children];
          aimChildren.splice(index, 0, draggingItemId);

          // Update store.
          const newData = new Map(data);
          newData.set(draggingItemParentId, { ...newData.get(draggingItemParentId)!, children: originalChildren });
          newData.set(aimParentId, { ...newData.get(aimParentId)!, children: aimChildren });
          setStore('data', newData);
        }
      },
    }
  ] as [Tree<any>, TreeContextSetter];

  // Wrap the tree.
  return (
    <TreeContext.Provider value={context}>
      <div>
        <TreeInner
          indent={0}
          parentId={treeRoot}
          render={props.render}
          indentWidth={props.indentWidth}
        />
      </div>
    </TreeContext.Provider>
  )
}

interface TreeInnerProps<T> {
  indent: number;
  parentId: ItemId;
  indentWidth: string;

  render: (item: Item<T>, props: ItemRenderProps) => JSX.Element;
}

function TreeInner<T>(props: TreeInnerProps<T>) {
  const [tree] = useTree<T>()!;

  return (
    <For each={tree.data.get(props.parentId)!.children}>
      {(id, i) => (
        <>
          <TreeItem
            index={i()}
            data={tree.data.get(id)! as Item<T>}
            render={props.render}
            indent={props.indent}
            indentWidth={props.indentWidth}
          />
          <TreeInner
            {...props}
            indent={props.indent + 1}
            parentId={id}
          />
        </>
      )}
    </For>
  )
}

