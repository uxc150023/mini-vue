import { isObject } from "@vue/shared";
import { mutableHandlers, ReactiveFlags } from "./baseHandler";

const reactiveMap = new WeakMap();

/**
 * 判断数据是否为响应式
 * @param value
 * @returns
 */
export function isReactive(value) {
  return !!(value && value[ReactiveFlags.IS_REACTIVE]);
}

/**
 * 将对象转成响应式数据，只能代理对象
 * 1. 同一个对象代理多次，返回同一个代理
 * 2. 代理对象被再次代理，直接返回代理对象
 * @param target
 * @returns
 */
export function reactive(target: any) {
  if (!isObject(target)) {
    return;
  }

  // 判断是不是给代理对象添加响应式。是的话就直接返回代理对象
  // 如果目标是代理对象，那么一定被代理过，就会走get
  if (target[ReactiveFlags.IS_REACTIVE]) {
    return target;
  }

  let existingProxy = reactiveMap.get(target);
  if (existingProxy) {
    return existingProxy;
  }

  const proxy = new Proxy(target, mutableHandlers);
  reactiveMap.set(target, proxy);
  return proxy;
}
