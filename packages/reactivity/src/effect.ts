export let activeEffect = undefined;

function cleanupEffect(effect) {
  const { deps } = effect;
  for (let i = 0; i < deps.length; i++) {
    deps[i].delete(effect); // 解除effect，重新依赖收集
  }
  effect.deps.length = 0;
}
export class ReactiveEffect {
  // 这里表示在实例上新增active属性
  public parent = null; // 通过打标记的方式确认属性与effect的关联关系
  public deps = []; // 与当前effect有关的所有属性集合
  public active: boolean = true; // effect默认激活状态
  constructor(public fn, public scheduler?) {}
  // 执行effect
  run() {
    // 非激活状态，只需要执行函数，不需要进行依赖收集
    if (!this.active) {
      return this.fn(); //
    }
    // 依赖收集，核心就是将当前的effect和稍后渲染的属性关联在一起
    try {
      this.parent = activeEffect;
      activeEffect = this;

      // 这里需要在执行用户函数之前将之前收集的内容清空
      cleanupEffect(this);

      return this.fn(); // 当稍后调用取值操作的时候，就可以获取到这个全局的activeEffect
    } finally {
      activeEffect = this.parent;
      this.parent = null;
    }
  }
  stop() {
    if (this.active) {
      this.active = false;
      cleanupEffect(this);
    }
  }
}

export function effect(fn: Function, options: any = {}) {
  // 这里fn可以根据状态变化 重新执行，effect可以嵌套
  const _effect = new ReactiveEffect(fn, options.scheduler); // 创建响应式effect
  _effect.run(); // 默认先执行一次

  const runner = _effect.run.bind(_effect); // 绑定this执行
  runner.effect = _effect; // 将effect挂载到runner函数上 使用runner.effect() 执行
  return runner;
}

const targetMap = new WeakMap();
/**
 * 依赖收集
 * 一个effect对应多个属性，一个属性对应多个effect（多对多）
 * @param target 目标
 * @param type 类型
 * @param key 属性
 */
export function track(target, type, key) {
  if (!activeEffect) return;
  let depsMap = targetMap.get(target); // 第一次没有
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()));
  }
  let dep = depsMap.get(key); // 第一次也没有
  if (!dep) {
    depsMap.set(key, (dep = new Set()));
  }
  trackEffects(dep);
  // let shouldTrack = !dep.has(activeEffect); // 判断是否需要收集
  // if (shouldTrack) {
  //   dep.add(activeEffect);
  //   activeEffect.deps.push(dep); // 让effect记录对应的dep，稍后清理的时候会用到
  // }

  // 对象的某个属性 -> 多个effect
  // weakMap = {对象: Map{name：Set}}
}

export function trackEffects(dep) {
  if (activeEffect) {
    let shouldTrack = !dep.has(activeEffect); // 判断是否需要收集
    if (shouldTrack) {
      dep.add(activeEffect);
      activeEffect.deps.push(dep); // 让effect记录对应的dep，稍后清理的时候会用到
    }
  }
}

/**
 * 触发更新
 * @param target
 * @param type
 * @param key
 * @param value
 * @param oldValue
 */
export function trigger(target, type, key, value, oldValue) {
  const depsMap = targetMap.get(target);
  if (!depsMap) return; // 触发的值不在模板中使用

  let effects = depsMap.get(key); // 找到属性对应的effect
  if (effects) {
    triggerEffects(effects);
  }
}

export function triggerEffects(effects) {
  effects = new Set(effects);
  effects.forEach((effect) => {
    // 在执行effect的时候，避免执行当前正在执行的effect，不要无限调用，防止爆栈
    if (effect !== activeEffect) {
      if (effect.scheduler) {
        effect.scheduler();
      } else {
        effect.run();
      }
    }
  });
}
