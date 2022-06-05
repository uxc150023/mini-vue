import { isFunction } from "@vue/shared";
import { ReactiveEffect, track, trackEffects, triggerEffects } from "./effect";

class ComputedRefImpl {
  public effect;
  public _dirty = true;
  public __v_isReadonly = true;
  public __v_isRef = true;
  public _value;
  public dep;
  constructor(public getter, public setter) {
    // 将用户的getter 放到effect中
    this.effect = new ReactiveEffect(getter, () => {
      // 依赖的属性的变化会执行这个调度函数
      if (!this._dirty) {
        this._dirty = true;

        // 实现触发更新
        triggerEffects(this.dep);
      }
    });
  }
  // 类中的属性访问器，底层就是Object.definProperty
  get value() {
    // 依赖收集
    trackEffects(this.dep || (this.dep = new Set()));
    // 说明值是脏值
    if (this._dirty) {
      this._dirty = false; // 第一次取值执行依赖，之后设置false
      this._value = this.effect.run();
    }
    return this._value;
  }

  set value(newValue: any) {
    this.setter(newValue);
  }
}

/**
 * 计算属性
 * @param getterOrOptions 对象或函数
 */
export const computed = (getterOrOptions) => {
  let onlyGetter = isFunction(getterOrOptions);
  let getter;
  let setter;
  if (onlyGetter) {
    getter = getterOrOptions;
    setter = () => {
      console.log("--->", "no set");
    };
  } else {
    getter = getterOrOptions.get;
    setter = getterOrOptions.set;
  }

  return new ComputedRefImpl(getter, setter);
};
