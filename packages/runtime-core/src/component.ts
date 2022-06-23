import { reactive } from "@vue/reactivity";
import { hasOwn, isFunction } from "@vue/shared";
import { initProps } from "./componentProps";

export function createCommentInstance(vnode) {
  const instance = {
    data: null,
    vnode,
    subTree: null,
    isMounted: false,
    update: null,
    propsOptions: vnode.type.props,
    props: {},
    attrs: {},
    proxy: null,
    renderer: null,
  };
  return instance;
}

// 公共的属性映射表
const publicePropertyMap = {
  $attrs: (i) => i.attrs,
};

const publicInstanceProxy = {
  get(target, key, receiver) {
    const { data, props } = target;
    if (data && hasOwn(data, key)) {
      return data[key];
    } else if (props && hasOwn(props, key)) {
      return props[key];
    }
    // this.$attrs
    let getter = publicePropertyMap[key];

    if (getter) {
      console.log("--->", getter(target));
      return getter(target);
    }
  },
  set(target, key, value, receiver) {
    const { data, props } = target;
    if (data && hasOwn(data, key)) {
      data[key] = value;
      return true;
    } else if (props && hasOwn(props, key)) {
      console.log("--->", "禁止修改属性" + (key as string));
      return false;
    }
    return true;
  },
};
export function setupComponent(instance) {
  let { props, type } = instance.vnode;
  initProps(instance, props);
  instance.proxy = new Proxy(instance, publicInstanceProxy);
  let data = type.data;
  if (data) {
    if (!isFunction(data)) {
      return console.log("--->", "data option must be a function");
    }
    instance.data = reactive(data.call(instance.proxy));
  }
  instance.render = type.render;
}
