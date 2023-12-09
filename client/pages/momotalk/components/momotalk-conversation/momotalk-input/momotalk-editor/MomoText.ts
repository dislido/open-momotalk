import type { EditorSegmentElement } from './editor-segment';

/**
 * 占位文本,内容应永远为'\ufeff',光标不应出现在此节点首部
 * ### TextNode props
 * - `emptyNode?: true` 是否是占位空文本, 内容为空/首节点为editor-segment时出现在编辑器内容开头
 * - `bindSegment?: EditorSegmentElement` 跟随在editor-segment后,光标不应出现在它和editor-segment之间,总是与对应editor-segment一起出现/删除
 */
export class MomoText extends Text {
  emptyNode?: true;
  bindSegment?: EditorSegmentElement;

  constructor(
    data?: string,
    options?: {
      emptyNode?: true;
      bindSegment?: EditorSegmentElement;
    },
  ) {
    super(data);
    this.emptyNode = options?.emptyNode;
    this.bindSegment = options?.bindSegment;
  }
}
