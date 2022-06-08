import { isFunction, isObject } from "@vue/shared";
import { ReactiveEffect } from "./effect";
import { isReactive } from "./reactive";

/**
 * 递归遍历
 * @param value
 * @param set 解决循环引用的问题
 */
function traversal(value, set = new Set()) {
  // 递归终结条件，不是对象就不在递归
  if (!isObject(value)) return value;
  if (set.has(value)) return value;
  set.add(value);
  for (const key in value) {
    traversal(value[key], set);
  }
  return value;
}

/**
 * 监听器
 * @param source 用户传入的对象
 * @param cb 对应的回调
 * 1. 传入一个响应式对象，就像此对象包装成一个函数传入到effect中
 * 2. 调用effect.run()，就会执行上面的包装函数，返回oldValue
 * 3. 数据变化的时候，会自动触发effect执行回调，再调用一此effect.run()，返回newValue
 */
export function watch(source, cb) {
  let getter;
  if (isReactive(source)) {
    // 对我们用户传入的数据 进行递归循环，访问对象上的每一个属性，就会收集依赖effect
    getter = () => traversal(source);
  } else if (isFunction(source)) {
    getter = source;
  } else {
    return;
  }
  let cleanup;
  const onCleanup = (fn) => {
    cleanup = fn;
  };
  let oldValue;

  const job = () => {
    if (cleanup) cleanup();
    const newValue = effect.run();
    cb(newValue, oldValue, onCleanup);
    oldValue = newValue;
  };
  // 监控自己构造的函数，变化后重新执行job
  const effect = new ReactiveEffect(getter, job);

  oldValue = effect.run();
}
