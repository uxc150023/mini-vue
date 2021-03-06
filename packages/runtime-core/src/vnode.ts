// type props children

import { isArray, isObject, isString, ShapeFlags } from "@vue/shared";
export const Text = Symbol("Text");
export const Fragment = Symbol("Fragment");
export function isVnode(value) {
  return !!(value && value.__v_isVnode);
}
export function isSameVnode(n1, n2) {
  return n1.type === n2.type && n1.key === n2.key;
}

/**
 * 创建虚拟dom
 * @param type
 * @param props
 * @param children
 * 组件、元素、文本
 */
export function createVnode(type, props, children = null) {
  // 组合方案 shapeFlag 想知道一个元素中包含的是多个儿子还是一个儿子
  let shapeFlag = isString(type)
    ? ShapeFlags.ELEMENT
    : isObject(type)
    ? ShapeFlags.STATEFUL_COMPONENT
    : 0;
  // 虚拟DOM就是一个对象，diff算法，真实DOM属性比较多
  const vnode = {
    type,
    props,
    children,
    el: null, // 虚拟节点上对应的真实节点，后续diff算法
    key: props?.["key"],
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
