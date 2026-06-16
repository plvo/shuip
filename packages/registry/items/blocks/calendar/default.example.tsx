'use client';

import * as React from 'react';
import { Calendar, type CalendarEventColor, type CalendarSlot } from '@/components/block/shuip/calendar';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type CalEvent = { id: string; title: string; start: Date; end: Date; color?: CalendarEventColor; allDay?: boolean };

const now = new Date();
const at = (dayOffset: number, h: number, m = 0) =>
  new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayOffset, h, m);

const seed: CalEvent[] = [
  { id: '1', title: 'Standup', start: at(0, 9), end: at(0, 9, 30), color: 'secondary' },
  { id: '2', title: 'Design review', start: at(0, 11), end: at(0, 12), color: 'accent' },
  { id: '3', title: 'Lunch', start: at(1, 12), end: at(1, 13) },
  { id: '4', title: 'Offsite', start: at(2, 0), end: at(3, 0), color: 'muted' },
];

const colors: CalendarEventColor[] = ['primary', 'secondary', 'accent', 'destructive', 'muted'];

export default function Example() {
  const [events, setEvents] = React.useState<CalEvent[]>(seed);
  const [draft, setDraft] = React.useState<CalEvent | null>(null);
  const [open, setOpen] = React.useState(false);
  const isExisting = draft ? events.some((e) => e.id === draft.id) : false;

  const handleSlotSelect = React.useCallback(({ start, end, allDay }: CalendarSlot) => {
    setDraft({ id: crypto.randomUUID(), title: '', start, end, allDay });
    setOpen(true);
  }, []);

  return (
    <>
      <Calendar.Root<CalEvent>
        events={events}
        onEventsChange={setEvents}
        titleField='title'
        startField='start'
        endField='end'
        allDayField='allDay'
        color={(e) => e.color}
        defaultView='week'
        editable
        onEventClick={(e) => {
          setDraft(e);
          setOpen(true);
        }}
        onSlotSelect={handleSlotSelect}
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
            <div className='flex flex-col gap-4'>
              <div className='flex flex-col gap-2'>
                <Label htmlFor='cal-title'>Title</Label>
                <Input
                  id='cal-title'
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                />
              </div>
              <div className='flex flex-col gap-2'>
                <Label htmlFor='cal-color'>Color</Label>
                <Select
                  value={draft.color ?? 'primary'}
                  onValueChange={(v) => setDraft({ ...draft, color: v as CalendarEventColor })}
                >
                  <SelectTrigger id='cal-color'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {colors.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className='flex items-center gap-2'>
                <Checkbox
                  id='cal-allday'
                  checked={draft.allDay ?? false}
                  onCheckedChange={(v) => setDraft({ ...draft, allDay: v === true })}
                />
                <Label htmlFor='cal-allday'>All day</Label>
              </div>
            </div>
          ) : null}
          <DialogFooter>
            {isExisting ? (
              <Button
                variant='outline'
                onClick={() => {
                  if (draft) setEvents((prev) => prev.filter((e) => e.id !== draft.id));
                  setOpen(false);
                }}
              >
                Delete
              </Button>
            ) : null}
            <Button
              onClick={() => {
                if (!draft) return;
                setEvents((prev) =>
                  prev.some((e) => e.id === draft.id)
                    ? prev.map((e) => (e.id === draft.id ? draft : e))
                    : [...prev, draft],
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
