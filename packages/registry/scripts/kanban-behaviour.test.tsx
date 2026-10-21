import { defineBoardDragSuite } from './board-drag-suite';

defineBoardDragSuite({
  name: 'kanban',
  canonicalSource: /kanban\/component\.radix\.tsx$/,
  columnSlot: '[data-slot="kanban-column-body"]',
  dropSlot: '[data-slot="kanban-drop-slot"]',
  load: async () => {
    const radix = await import('../items/blocks/kanban/component.radix');
    const base = await import('../generated/base/items/blocks/kanban/component.base');
    return { Radix: radix.Kanban, 'Base UI': base.Kanban };
  },
});
