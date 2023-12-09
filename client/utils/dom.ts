
type AttributeValueType = string | number | boolean | null | undefined;

/**
 * 为HTMLElement设置属性
 * 忽略值为`undefined`的属性
 * 删除值为`null`的属性
 * @param el element
 * @param attrs 属性对象
 */
export function setAttributes(el: Element, attrs: Record<string, AttributeValueType>) {
  const attrEntries = Object.entries(attrs);
  attrEntries.forEach(([name, value]) => {
    if (value === undefined) return;
    if (value === null) {
      el.removeAttribute(name);
      return;
    }
    if (['string', 'number', 'boolean'].includes(typeof value)) {
      el.setAttribute(name, `${value}`);
      return;
    }
    throw new Error('attribute必须是string | number | boolean | null | undefined类型');
  });
}

export interface IElementOptions<E extends Element = HTMLElement> {
  /** undefined则不添加attribute */
  [attr: string]: any;
  $ref?: (el: E) => void;
}

document.createElement('div');
/**
 * @todo P4 支持tsx
  ```
  h(
    'div',
    {
      class: 'foo bar', // class="foo bar"
      contenteditable: true, // contenteditable="true"

      $ref: (el) => {
        el.addEventListener('click', console.log);
        el.style.width = '123px';
      }
    },
    [
      'foo',
      h('b', null, ['bar']),
    ],
  )
  ```
*/
export function h<E extends keyof HTMLElementTagNameMap>(
  tagName: E,
  options?: IElementOptions<HTMLElementTagNameMap[E]> | null,
  children?: (string | Node | null | undefined | false)[],
): HTMLElementTagNameMap[E];
export function h<E extends HTMLElement>(
  tagName: string | E,
  options?: IElementOptions<E> | null,
  children?: (string | Node | null | undefined | false)[],
): E;
export function h<E extends HTMLElement>(
  tagName: E,
  options?: IElementOptions<E> | null,
  children?: (string | Node | null | undefined | false)[],
) {
  const el: E = tagName instanceof HTMLElement ? tagName : (document.createElement(tagName) as E);
  if (options) {
    const { $ref, ...attr } = options;
    setAttributes(el, attr);
    if (typeof $ref === 'function') {
      $ref(el);
    }
  }
  if (children) {
    el.append(...children.filter((it): it is string | Node => it !== null && it !== false && it !== undefined));
  }
  return el;
}

export function fragment(children: (string | Node)[]) {
  const el = document.createDocumentFragment();
  el.append(...children);
  return el;
}

export function toBooleanAttr(value: string | null): boolean | null {
  if (value === null) return null;
  return value === '' || value === 'true';
}

export function hsvg<E extends keyof SVGElementTagNameMap>(
  tagName: E,
  options?: IElementOptions<SVGElementTagNameMap[E]> | null,
  children?: (string | Node | null | undefined | false)[],
): SVGElementTagNameMap[E];
export function hsvg<E extends SVGElement>(
  tagName: E,
  options?: IElementOptions<E> | null,
  children?: (string | Node | null | undefined | false)[],
): E;
export function hsvg<E extends SVGElement>(
  tagName: E,
  options?: IElementOptions<E> | null,
  children?: (string | Node | null | undefined | false)[],
) {
  const el: E =
    tagName instanceof SVGElement ? tagName : (document.createElementNS('http://www.w3.org/2000/svg', tagName) as E);
  if (options) {
    const { $ref, ...attr } = options;
    setAttributes(el, attr);
    if (typeof $ref === 'function') {
      $ref(el);
    }
  }
  if (children) {
    el.append(...children.filter((it): it is string | Node => it !== null && it !== false && it !== undefined));
  }
  return el;
}
