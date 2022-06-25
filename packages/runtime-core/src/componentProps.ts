import { reactive } from "@vue/reactivity";
import { hasOwn } from "@vue/shared";

/**
 *  初始化组件属性props + attrs
 * @param instance
 * @param props
 */
export const initProps = (instance, rawProps) => {
  const props = {};
  const attrs = {};
  const options = instance.propsOptions || {};
  if (rawProps) {
    for (const key in rawProps) {
      const value = rawProps[key];
      if (hasOwn(options, key)) {
        props[key] = value;
      } else {
        attrs[key] = value;
      }
    }
  }
  // props是响应式的，但是不能在子组件中被修改，源码中使用的是shallowReactive
  instance.props = reactive(props);
  instance.attrs = attrs;
};

export const hasPropsChanged = (prevProps = {}, nextProps = {}) => {
  //
  const nextKeys = Object.keys(nextProps);
  // 比对属性个数
  if (nextKeys.length !== Object.keys(prevProps).length) {
    return true;
  }
  // 比对属性值
  for (let i = 0; i < nextKeys.length; i++) {
    const key = nextKeys[i];
    if (nextProps[key] !== prevProps[key]) {
      return true;
    }
  }
  return false;
};

/**
 * 更新组件属性（替换、删除）
 * @param instance
 * @param prevProps
 * @param nextProps
 */
export function updateProps(prevProps, nextProps) {
  // 判断属性有没有变化(值、个数)
  if (hasPropsChanged(prevProps, nextProps)) {
    // 替换
    for (const key in nextProps) {
      prevProps[key] = nextProps[key];
    }
    // 删除
    for (const key in prevProps) {
      if (!hasOwn(nextProps, key)) {
        delete prevProps[key];
      }
    }
  }
}
