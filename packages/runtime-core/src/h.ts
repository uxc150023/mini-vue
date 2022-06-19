// h('div')
// h('div', {style: {'color': 'red'}})
// h('div', {style: {'color': 'red'}}, 'hello')
// h('div', 'hello')
// h('div',null, 'hello', ;'world')
// h('div',null, h('span'))

import { isArray, isObject } from "@vue/shared";
import { createVnode, isVnode } from "./vnode";

// h('div',null, [h('span')])
export function h(type, propsChildren, children) {
  const l = arguments.length;

  if (l === 2) {
    if (isObject(propsChildren) && !isArray(propsChildren)) {
      if (isVnode(propsChildren)) {
        // 虚拟节点包装成数组
        return createVnode(type, null, [propsChildren]);
      }
      return createVnode(type, propsChildren); // 属性
    } else {
      return createVnode(type, null, propsChildren); // 是数组
    }
  } else {
    if (l > 3) {
      children = Array.from(arguments).slice(2);
    } else if (l === 3 && isVnode(children)) {
      children = [children];
    }
    // 其他
    return createVnode(type, propsChildren, children);
  }
}
