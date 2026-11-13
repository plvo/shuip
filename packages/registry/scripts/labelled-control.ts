/**
 * The control that the visible `<label>` reading `text` names, found the way assistive technology finds it: the
 * label's own control (its `for` target), or else the element whose `aria-labelledby` points to the label. An
 * `aria-label` on the control does not count, since it names the control without tying the visible label to it.
 */
export function labelledControl(container: ParentNode, text: string): Element {
  const label = [...container.querySelectorAll('label')].find((element) => element.textContent === text);
  if (!label) throw new Error(`No label reads "${text}"`);
  const control =
    label.control ??
    [...container.querySelectorAll('[aria-labelledby]')].find((element) =>
      element.getAttribute('aria-labelledby')?.split(/\s+/).includes(label.id),
    );
  if (!control) throw new Error(`The label "${text}" names no control`);
  return control;
}
