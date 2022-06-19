export function getSequence(arr) {
  const len = arr.length;
  const result = [0]; // 以默认第0个为基准
  const p = new Array(len).fill(0); // 最后要标记索引
  let resultLastIndex;
  let start;
  let end;
  let middle;
  for (let i = 0; i < len; i++) {
    let arrI = arr[i];
    if (arrI !== 0) {
      // 应为vue中序列中0 意味着没有意义 需要创建
      resultLastIndex = result[result.length - 1];
      if (arr[resultLastIndex] < arrI) {
        // 比较最后一项和当前项的值，如果比最后一项大，则将当前索引放到结果集中
        result.push(i);
        p[i] = resultLastIndex; // 当前放到末尾的要记住他前面的那个人是谁
        continue;
      }

      // 通过二分查找，在结果集中找到比当前值大的，用当前值的索引将其替换掉
      start = 0;
      end = result.length - 1;
      while (start < end) {
        ((start + end) / 2) | 0;
        if (arr[result[middle]] < arrI) {
          start = middle + 1;
        } else {
          end = middle;
        }
      }
      if (arr[result[end]] > arr) {
        result[end] = i;
        p[i] = result[end - 1]; // 记住他的前一个人是谁
      }
    }
  }
  let i = result.length;
  let last = result[i - 1];
  while (i-- > 0) {
    result[i] = last;
    last = p[last];
  }

  return result;
}
