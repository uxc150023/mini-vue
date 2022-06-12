import { patchAttr } from "./modules/attr";
import { patchClass } from "./modules/class";
import { patchEvent } from "./modules/event";
import { patchStyle } from "./modules/style";

/**
 * dom属性的操作api
 * @param el
 * @param key
 * @param prevValue
 * @param nextValue
 */
export function patchProp(el, key, prevValue, nextValue) {
  // 类名 el.className
  // 样式 el.style
  // 事件 events
  // 普通属性
  if (key === "class") {
    patchClass(el, nextValue);
  } else if (key === "style") {
    patchStyle(el, prevValue, nextValue);
  } else if (/^on[^a-z]/.test(key)) {
    patchEvent(el, key, nextValue);
  } else {
    patchAttr(el, key, nextValue);
  }
}
