// type props children

import { isArray, isString, ShapeFlags } from "@vue/shared";

export function isVnode(value) {
  return !!(value && value.__v_isVnode);
}

/**
 * 穿件虚拟dom
 * @param type
 * @param props
 * @param children
 * 组件、元素、文本
 */
export function createVnode(type, props, children = null) {
  // 组合方案 shapeFlag 想知道一个元素中包含的是多个儿子还是一个儿子
  let shapeFlag = isString(type) ? ShapeFlags.ELEMENT : 0;
  // 虚拟DOM就是一个对象，diff算法，真实DOM属性比较多
  const vnode = {
    type,
    props,
    children,
    key: props?.["key"],
    el: null, // 虚拟节点上对应的真实节点，后续diff算法
    __v_isVnode: true,
    shapeFlag,
  };
  if (children) {
    let type = 0;
    if (isArray(children)) {
      type = ShapeFlags.ARRAY_CHILDREN;
    } else {
      children = String(children);
      type = ShapeFlags.TEXT_CHILDREN;
    }
    vnode.shapeFlag |= type;
  }
  return vnode;
}
