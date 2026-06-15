'use client';

import * as React from 'react';
import { Calendar, type CalendarEventColor } from '@/components/block/shuip/calendar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type CalEvent = { id: string; title: string; start: Date; end: Date; color?: CalendarEventColor };
type StoredEvent = { id: string; title: string; start: string; end: string; color?: CalendarEventColor };

const STORAGE_KEY = 'shuip:calendar-events';

const now = new Date();
const at = (dayOffset: number, h: number, m = 0) =>
  new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayOffset, h, m);

const seed: CalEvent[] = [
  { id: '1', title: 'Standup', start: at(0, 9), end: at(0, 9, 30), color: 'blue' },
  { id: '2', title: 'Ship release', start: at(1, 15), end: at(1, 16), color: 'red' },
];

// Dates do not survive JSON, so we serialize to ISO strings and revive on read.
// The artificial delay stands in for a real async source (an API, IndexedDB, …).
async function loadEvents(): Promise<CalEvent[]> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return seed;
  const stored = JSON.parse(raw) as StoredEvent[];
  return stored.map((e) => ({ ...e, start: new Date(e.start), end: new Date(e.end) }));
}

async function saveEvents(events: CalEvent[]): Promise<void> {
  const stored: StoredEvent[] = events.map((e) => ({ ...e, start: e.start.toISOString(), end: e.end.toISOString() }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
}

export default function Example() {
  const [events, setEvents] = React.useState<CalEvent[] | null>(null);
  const [draft, setDraft] = React.useState<CalEvent | null>(null);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    loadEvents().then((loaded) => {
      if (active) setEvents(loaded);
    });
    return () => {
      active = false;
    };
  }, []);

  const persist = React.useCallback((next: CalEvent[]) => {
    setEvents(next);
    void saveEvents(next);
  }, []);

  if (!events) {
    return (
      <div className='flex h-72 w-full items-center justify-center text-sm text-muted-foreground'>
        Loading calendar…
      </div>
    );
  }

  const isExisting = draft ? events.some((e) => e.id === draft.id) : false;

  return (
    <>
      <Calendar.Root<CalEvent>
        events={events}
        onEventsChange={persist}
        titleField='title'
        startField='start'
        endField='end'
        color={(e) => e.color}
        defaultView='week'
        editable
        onEventClick={(e) => {
          setDraft(e);
          setOpen(true);
        }}
        onSlotSelect={({ start, end }) => {
          setDraft({ id: crypto.randomUUID(), title: '', start, end });
          setOpen(true);
        }}
      >
        <div className='flex w-full flex-col gap-4'>
          <Calendar.Nav />
          <Calendar.View />
        </div>
      </Calendar.Root>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isExisting ? 'Edit event' : 'New event'}</DialogTitle>
          </DialogHeader>
          {draft ? (
            <div className='flex flex-col gap-2'>
              <Label htmlFor='ls-title'>Title</Label>
              <Input
                id='ls-title'
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              />
            </div>
          ) : null}
          <DialogFooter>
            {isExisting ? (
              <Button
                variant='outline'
                onClick={() => {
                  if (draft) persist(events.filter((e) => e.id !== draft.id));
                  setOpen(false);
                }}
              >
                Delete
              </Button>
            ) : null}
            <Button
              onClick={() => {
                if (!draft) return;
                persist(
                  events.some((e) => e.id === draft.id)
                    ? events.map((e) => (e.id === draft.id ? draft : e))
                    : [...events, draft],
                );
                setOpen(false);
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
