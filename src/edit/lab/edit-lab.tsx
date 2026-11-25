'use client';

import { useState } from 'react';
import Slab from '@/components/ui/slab';
import { EditableButton, EditableImage, EditableLines, EditableText } from '@/edit';
import { useSiteContent } from '@/providers/site-content-provider';
import type { SiteContentKey } from '@/lib/site-content-defaults';
import { SITE_CONTENT } from '@/lib/site-content-defaults';
import type { ImageSlotKey } from '@/lib/image-slots';
import EditEngine from '@/edit/engine/edit-engine';
import { choosePhoto } from '@/edit/engine/fields';
import { sample } from '@/edit/engine/measure';
import { setDraftText } from '@/edit/engine/draft-store';
import { openDraftDb } from '@/edit/engine/idb';
import { setUi } from '@/edit/engine/ui-store';
import type { Publisher } from '@/edit/engine/publish';

/*
  The edit lab: every edit-mode component on one page, in edit mode,
  without signing in. Development builds only. The route returns notFound()
  in production, and this file is reachable from nowhere else.

  Publish goes to a stand-in that writes nothing, with a choice of outcome,
  so the published, partly failed and sign-in expired states can be seen
  without a database. Drafts are real, in this browser's IndexedDB, under
  a lab-only user id.

  Deleted with the admin dashboard in phase 3.
*/

const LAB_USER = 'edit-lab';
const DAY = 86_400_000;

type Outcome = 'ok' | 'partial' | 'expired';

/** Read by the stand-in publisher when Publish runs. */
let labOutcome: Outcome = 'ok';

const TEXT_KEYS: SiteContentKey[] = [
  'home.about.eyebrow',
  'home.about.title_line1',
  'home.about.title_line2',
  'home.about.body',
  'home.hero.title_line2',
  'home.hero.title_line3',
  'home.hero.title_line4',
  'home.hero.button_label',
  'home.cta.button_label',
  'about.story.fact1_title',
  'about.story.fact1_body1',
  'about.story.fact1_body2',
  'home.cta.eyebrow',
  'home.cta.title_line1',
  'home.cta.subtitle',
];

function labPublisher(outcome: () => Outcome): Publisher {
  const urls = new Map<string, string>();
  const wait = () => new Promise((r) => setTimeout(r, 600));
  let failures = 0;
  return {
    session: async () => {
      failures = 0;
      await wait();
      return outcome() === 'expired' ? 'expired' : 'ok';
    },
    updateText: async (key, value) => {
      if (outcome() === 'partial' && failures < 2) {
        failures++;
        throw new Error(`Lab: ${key} was not updated`);
      }
      return value.replace(/\s+/g, ' ').trim();
    },
    currentImage: async () => null,
    upload: async (file) => {
      const name = `lab-${crypto.randomUUID()}.${file.type.split('/')[1]}`;
      urls.set(name, URL.createObjectURL(file));
      return name;
    },
    pointImage: async () => {},
    removeObject: async () => {},
    publicUrl: (name) => urls.get(name) ?? null,
  };
}

/** A plain generated photo of the given width, for the resolution checks. */
function makePhoto(width: number): Promise<File> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = Math.round((width * 3) / 4);
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--sunken') || 'gray';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  return new Promise((resolve) =>
    canvas.toBlob((blob) => resolve(new File([blob!], `lab-${width}.png`, { type: 'image/png' })), 'image/png')
  );
}

export default function EditLab() {
  const { published } = useSiteContent();
  const [outcome, setOutcome] = useState<Outcome>('ok');
  const [run, setRun] = useState(0);
  const [publisher] = useState(() => labPublisher(() => labOutcome));
  const pickOutcome = (o: Outcome) => {
    labOutcome = o;
    setOutcome(o);
  };

  const fillAll = (to: 'limit' | 'empty') =>
    TEXT_KEYS.forEach((k) => {
      const pub = published.text(k);
      setDraftText(k, to === 'empty' ? '' : sample(pub, SITE_CONTENT[k].max), pub);
    });

  const seedEarlier = async () => {
    const db = await openDraftDb(`wsc-edit-${LAB_USER}`);
    const at = Date.now() - 3 * DAY;
    await db.put('text:home.about.eyebrow', { value: 'Draft eyebrow', at });
    await db.put('text:home.about.body', { value: 'A paragraph drafted three days ago.', at });
    await db.put('text:home.cta.subtitle', { value: 'A subtitle drafted three days ago.', at });
    setRun((n) => n + 1);
  };

  const tryPhoto = async (slot: ImageSlotKey, width: number) => choosePhoto(slot, await makePhoto(width));

  return (
    <main className="stack" style={{ paddingInline: 'var(--gut)', paddingBlock: '7rem 3rem' }}>
      <EditEngine key={run} userId={LAB_USER} publisher={publisher} />

      <Slab tone="sunken" as="div" className="flex flex-wrap items-center gap-3">
        <span className="label">Edit lab, development only</span>
        <label className="meta flex items-center gap-2">
          Publish result
          <select value={outcome} onChange={(e) => pickOutcome(e.target.value as Outcome)}>
            <option value="ok">Succeeds</option>
            <option value="partial">Two changes fail</option>
            <option value="expired">Sign-in expired</option>
          </select>
        </label>
        <button type="button" className="meta" onClick={() => fillAll('limit')}>
          Fill every field to its limit
        </button>
        <button type="button" className="meta" onClick={() => fillAll('empty')}>
          Empty every field
        </button>
        <button type="button" className="meta" onClick={seedEarlier}>
          Add a draft from three days ago
        </button>
        <button type="button" className="meta" onClick={() => setUi({ online: false })}>
          Go offline
        </button>
        <button type="button" className="meta" onClick={() => setUi({ online: true })}>
          Go online
        </button>
        <button type="button" className="meta" onClick={() => tryPhoto('home.about.image1', 260)}>
          260px photo, refused
        </button>
        <button type="button" className="meta" onClick={() => tryPhoto('home.events.image1', 420)}>
          420px photo, warned
        </button>
      </Slab>

      <section className="flex flex-col gap-6">
        <EditableText k="home.about.eyebrow" as="div" className="label" />
        <EditableLines keys={['home.about.title_line1', 'home.about.title_line2']} className="title" />
        <EditableText k="home.about.body" as="p" className="body measure" />
        <div className="flex flex-wrap items-center gap-4">
          <EditableButton labelKey="home.hero.button_label" hrefKey="home.hero.button_href" arrow />
          <EditableButton labelKey="home.cta.button_label" hrefKey="home.cta.button_href" variant="secondary" />
        </div>
      </section>

      <section>
        <EditableLines
          keys={['home.hero.title_line2', 'home.hero.title_line3', 'home.hero.title_line4']}
          as="h1"
          className="title-hero"
        />
      </section>

      <Slab tone="raised" className="flex flex-col gap-4">
        <EditableText k="about.story.fact1_title" as="h3" className="title-sm" />
        <EditableText k="about.story.fact1_body1" as="p" className="body" />
        <EditableText k="about.story.fact1_body2" as="p" className="body" />
      </Slab>

      <Slab tone="inverse" className="flex flex-col items-center gap-4 text-center">
        <EditableText k="home.cta.eyebrow" as="div" className="label" />
        <EditableLines keys={['home.cta.title_line1']} className="title" />
        <EditableText k="home.cta.subtitle" as="p" className="subtitle" />
        <EditableButton labelKey="home.cta.button_label" hrefKey="home.cta.button_href" variant="secondary" arrow />
      </Slab>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <EditableImage slot="home.about.image1" sizes="33vw" className="aspect-[4/3] rounded-md" />
        <EditableImage slot="home.about.image2" sizes="33vw" className="aspect-[4/3] rounded-md" />
        <EditableImage slot="home.about.image3" sizes="33vw" className="aspect-[4/3] rounded-md" />
      </section>
      <section className="max-w-sm">
        <EditableImage slot="home.events.image1" sizes="384px" className="aspect-[3/4] rounded-md" />
      </section>
    </main>
  );
}
