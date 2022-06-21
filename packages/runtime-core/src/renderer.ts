import { reactive } from "@vue/reactivity";
import { isString, ShapeFlags } from "@vue/shared";
import { ReactiveEffect } from "packages/reactivity/src/effect";
import { queueJob } from "./scheduler";
import { getSequence } from "./sequence";
import { createVnode, Fragment, isSameVnode, Text } from "./vnode";

export function createRenderer(renderOptions) {
  let {
    insert: hostInsert,
    remove: hostRemove,
    patchProp: hostPatchProp,
    createElement: hostCreateElement,
    createText: hostCreateText,
    createComment: hostCreateComment,
    setText: hostSetText,
    setElementText: hostSetElementText,
    parentNode: hostParentNode,
    nextSibling: hostNextSibling,
    // setScopeId: hostSetScopeId = NOOP,
    cloneNode: hostCloneNode,
    insertStaticContent: hostInsertStaticContent,
  } = renderOptions;

  const normalize = (children, i) => {
    if (isString(children[i])) {
      let vnode = createVnode(Text, null, children[i]);
      children[i] = vnode;
    }
    return children[i];
  };

  const mountChildren = (children, container) => {
    for (let i = 0; i < children.length; i++) {
      let child = normalize(children, i); // 处理后需要进行替换
      patch(null, child, container);
    }
  };

  function mountElement(vnode, container, anchor) {
    let { type, props, children, shapeFlag } = vnode;
    let el = (vnode.el = hostCreateElement(type)); // 将真实元素挂载到这个虚拟节点上，后续用于复用节点和更新
    if (props) {
      for (const key in props) {
        hostPatchProp(el, key, null, props[key]);
      }
    }
    // 文本
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      hostSetElementText(el, children);
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
      mountChildren(children, el);
    }
    hostInsert(el, container, anchor);
  }

  const processText = (n1, n2, container) => {
    if (n1 === null) {
      hostInsert((n2.el = hostCreateText(n2.children)), container);
    } else {
      // 文本的内容变化，可以复用老的节点
      const el = (n2.el = n1.el);
      if (n1.children !== n2.children) {
        hostSetText(el, n2.children);
      }
    }
  };

  const unmount = (vnode) => {
    hostRemove(vnode.el);
  };

  const patchProps = (oldProps, newProps, el) => {
    // 新的里面有， 直接用新的覆盖旧的
    for (const key in newProps) {
      hostPatchProp(el, key, oldProps[key], newProps[key]);
    }
    // 老的有新的没有，直接删除
    for (const key in oldProps) {
      if (newProps[key] === null) {
        hostPatchProp(el, key, oldProps[key], undefined);
      }
    }
  };

  /**
   * 删除子节点
   * @param children
   */
  const unmountChildren = (children) => {
    for (let i = 0; i < children.length; i++) {
      unmount(children[i]);
    }
  };

  /**
   * 子节点全量比较
   * @param c1
   * @param c2
   * @param el
   */
  const patchKeyedChildren = (c1, c2, el) => {
    let i = 0;
    let e1 = c1.length - 1;
    let e2 = c2.length - 1;
    // 从头开始比
    while (i <= e1 && i <= e2) {
      const n1 = c1[i];
      const n2 = c2[i];
      if (isSameVnode(n1, n2)) {
        patch(n1, n2, el);
      } else {
        break;
      }
      i++;
    }
    // 从尾开始比
    while (i <= e1 && i <= e2) {
      const n1 = c1[e1];
      const n2 = c2[e2];
      if (isSameVnode(n1, n2)) {
        patch(n1, n2, el);
      } else {
        break;
      }
      e1--;
      e2--;
    }
    // i比e1大说明是新增
    // i和e2之间的就是新增的部分
    // 有方比较完毕，要么就删除，要么就添加
    if (i > e1) {
      if (i <= e2) {
        while (i <= e2) {
          const nextPos = e2 + 1;
          // 根据下一个元素的索引来看参照物
          const anchor = nextPos < c2.length ? c2[nextPos].el : null;
          patch(null, c2[i], el, anchor);
          i++;
        }
      }
    } else if (i > e2) {
      if (i <= e1) {
        while (i <= e1) {
          unmount(c1[i]);
          i++;
        }
      }
    }
    // console.log("--->", i, e1, e2);
    //乱序对比
    // old: a b c d e   f g
    // new: a b e c d h f g
    let s1 = i;
    let s2 = i;
    const keyToNewIndexMap = new Map(); //new子节点value->key的映射表 {'e' => 2, 'c' => 3, 'd' => 4, 'h' => 5}
    console.log("--->", e2, s2);
    const toBePatched = e2 - s2 + 1; // new
    const newIndexToOldIndexMap = new Array(toBePatched).fill(0); // 记录是否比对过的映射表key: new的下标 value: 在old的中的下标+1 value为0表示old中没有

    for (let i = s2; i <= e2; i++) {
      keyToNewIndexMap.set(c2[i].key, i);
    }
    // 循环old子节点，通过keyToNewIndexMap查找进行删除/添加
    for (let i = s1; i <= e1; i++) {
      const oldChild = c1[i];
      let newIndex = keyToNewIndexMap.get(oldChild.key); // 无则需要删除， 有则返回老孩子在新节点列表中的位置，接着比较2个节点的差异
      if (!!!newIndex) {
        unmount(oldChild);
      } else {
        newIndexToOldIndexMap[newIndex - s2] = i + 1;
        patch(oldChild, c2[newIndex], el);
      }
    }
    // 获取最长递增子序列
    let increment = getSequence(newIndexToOldIndexMap);
    let j = increment.length - 1;
    // 需要移动位置
    for (let i = toBePatched - 1; i >= 0; i--) {
      let index = i + s2;
      let current = c2[index];
      let anchor = index + 1 < c2.length ? c2[index + 1].el : null;

      if (newIndexToOldIndexMap[i] === 0) {
        // 需创建
        patch(null, current, el, anchor);
      } else {
        if (i !== increment[j]) {
          // 可复用节点插入
          hostInsert(current.el, el, anchor);
        } else {
          j--;
        }
      }
    }
  };

  /**
   * 比较2个VDOM儿子的差异
   * @param n1
   * @param n2
   * @param el 当前父节点
   */
  const patchChildren = (n1, n2, el) => {
    const c1 = n1.children;
    const c2 = n2.children;
    const prevShapeFlag = n1.shapeFlag;
    const shapeFlag = n2.shapeFlag;
    // new old
    // 文本 数组
    // 文本 文本
    // 数组 数组
    // 数组 文本
    // 空  数组
    // 空  文本
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        unmountChildren(c1); // 文本 数组
      }
      if (c1 !== c2) {
        hostSetElementText(el, c2);
      }
    } else {
      if (prevShapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          // diff算法
          patchKeyedChildren(c1, c2, el);
        } else {
          unmountChildren(c1); // 空 数组
        }
      } else {
        if (prevShapeFlag & ShapeFlags.TEXT_CHILDREN) {
          hostSetElementText(el, ""); // 数组 文本
        }
        if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
          mountChildren(c2, el); // 文本 数组
        }
      }
    }
  };

  const patchElement = (n1, n2) => {
    let el = (n2.el = n1.el);
    let oldProps = n1.props || {};
    let newProps = n2.props || {};
    patchProps(oldProps, newProps, el);
    patchChildren(n1, n2, el);
  };

  const processElement = (n1, n2, container, anchor = null) => {
    if (n1 === null) {
      mountElement(n2, container, anchor);
    } else {
      patchElement(n1, n2);
    }
  };

  const processFragment = (n1, n2, container, anchor = null) => {
    if (n1 == null) {
      mountChildren(n2.children, container);
    } else {
      patchChildren(n1, n2, container);
    }
  };
  const mountComponent = (vnode, container, anchor) => {
    let { data = () => {}, render } = vnode.type;
    const state = reactive(data());
    // 组件实例
    const instance = {
      state,
      vnode,
      subTree: null,
      isMounted: false,
      update: null,
    };
    // 区分是初始化 还是要更新
    const componentUpdateFn = () => {
      if (!instance.isMounted) {
        const subTree = render.call(state); // 作为this，后续this会改
        patch(null, subTree, container, anchor); // 创建了subTree的真实节点并且插入
        instance.subTree = subTree;
        instance.isMounted = true;
      } else {
        // 组件内部更新
        const subTree = render.call(state);
        patch(instance.subTree, subTree, container, anchor);
        instance.subTree = subTree;
      }
    };
    // 组件异步更新
    const effect = new ReactiveEffect(componentUpdateFn, () =>
      queueJob(instance.update),
    );
    // 让组件强制更新的逻辑保存到组件的实例上，后续使用
    let update = (instance.update = effect.run.bind(effect));
    update();
  };

  /**
   * 统一处理组件，里面区分普通组件 还是 函数式组件
   * @param n1
   * @param n2
   * @param container
   * @param anchor
   */
  const processComponent = (n1, n2, container, anchor) => {
    if (n1 == null) {
      mountComponent(n2, container, anchor);
    } else {
      // 组件更新靠props
    }
  };

  /**
   * 核心patch方法
   * @param n1
   * @param n2
   * @param container
   */
  const patch = (n1, n2, container, anchor = null) => {
    if (n1 === n2) return;
    if (n1 && !isSameVnode(n1, n2)) {
      unmount(n1);
      n1 = null;
    }
    const { type, shapeFlag } = n2;
    switch (type) {
      case Text:
        processText(n1, n2, container);
        break;
      case Fragment:
        processFragment(n1, n2, container, anchor);
        break;
      default:
        if (shapeFlag & ShapeFlags.ELEMENT) {
          processElement(n1, n2, container, anchor);
        } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
          processComponent(n1, n2, container, anchor);
        }
        break;
    }
  };

  // 虚拟DOM
  const render = (vnode, container) => {
    if (vnode === null) {
      // 卸载
      if (container._vnode) {
        // 之前渲染过，就卸载掉
        unmount(container._vnode);
      }
    } else {
      // 初始化 或 更新
      patch(container._vnode || null, vnode, container);
    }
    container._vnode = vnode;
  };

  return {
    render,
  };
}
