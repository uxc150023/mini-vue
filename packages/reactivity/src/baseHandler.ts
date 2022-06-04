import { isObject } from "@vue/shared";
import { activeEffect, track, trigger } from "./effect";
import { reactive } from "./reactive";

export const enum ReactiveFlags {
  IS_REACTIVE = "__v_isReactive", // 被代理的标记
}
export const mutableHandlers = {
  get(target, key, receiver) {
    // 是否被代理过
    if (key === ReactiveFlags.IS_REACTIVE) {
      return true;
    }
    track(target, "get", key);
    // receiver 会将this指向到代理对象，继续触发get
    // 如果用return target[key], 会终止触发get
    let res = Reflect.get(target, key, receiver);
    if (isObject(res)) {
      return reactive(res);
    }
    return res;
  },
  set(target, key, value, receiver) {
    // 去代理对象proxy上设置值
    let oldValue = target[key];
    let result = Reflect.set(target, key, value, receiver);
    if (oldValue !== value) {
      // 值变化了 执行更新
      trigger(target, "set", key, value, oldValue);
    }

    return result;
  },
};
