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
