import { EditorSegmentElement } from './editor-segment';
import { MomoText } from './MomoText';

export function insertToSelection(selection: Selection, nodes: (EditorSegmentElement | Text)[], setRange?: Range) {
  const range = setRange ?? selection.getRangeAt(0);
  if (!range.collapsed) {
    range.deleteContents();
  }
  const frag = new DocumentFragment();
  nodes.forEach((it, index) => {
    if (it instanceof EditorSegmentElement) {
      const momoText = new MomoText('\ufeff', { bindSegment: it });
      it.bindMomoText = momoText;
      frag.append(it, momoText);
      if (index === nodes.length - 1) {
        selection.collapse(momoText, 1);
      }
    } else {
      frag.append(it);

      if (index === nodes.length - 1) {
        selection.collapse(it, it.length);
      }
    }
  });
  const last = frag.childNodes.item(frag.childNodes.length - 1) as Text;
  range.insertNode(frag);
  selection.collapse(last, last.length);
}
