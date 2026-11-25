import { notFound } from 'next/navigation';
import Slab, { type SlabTexture } from '@/components/ui/slab';
import Button from '@/components/ui/button';
import Eyebrow from '@/components/ui/eyebrow';
import StatFigure from '@/components/ui/stat-figure';

/*
  Texture lab: a development-only route for signing off the Lit velvet
  texture. Every shape on both grounds, drawn through the real Slab and
  Texture at the band size it is meant for. Returns 404 in production.
*/

export const metadata = { title: 'Texture lab', robots: { index: false } };

type Ground = 'accent' | 'inverse';

const GROUND_LABEL: Record<Ground, string> = {
  accent: 'Lit velvet',
  inverse: 'Lit velvet black',
};

function Tag({ shape, ground, use }: { shape: SlabTexture; ground: Ground; use: string }) {
  return (
    <span className="label">
      {shape} &middot; {GROUND_LABEL[ground]} &middot; {use}
    </span>
  );
}

/* Closing band: centred eyebrow, title, one line of copy, the button. */
function ClosingBand({ ground }: { ground: Ground }) {
  return (
    <Slab tone={ground} texture="sweep">
      <div className="mx-auto flex max-w-[62ch] flex-col items-center gap-4 py-10 text-center">
        <Tag shape="sweep" ground={ground} use="closing band" />
        <h2 className="title">
          <span className="ln">Learn to sell</span>
          <span className="ln">before you graduate</span>
        </h2>
        <p className="body">Membership is sold through the Western USC store.</p>
        <Button href="#" arrow>
          Apply to join
        </Button>
      </div>
    </Slab>
  );
}

/* Statement slab: a large claim and a reading paragraph, left-aligned. */
function StatementSlab({ ground }: { ground: Ground }) {
  return (
    <Slab tone={ground} texture="rise">
      <div className="flex max-w-[62ch] flex-col gap-5 py-8">
        <Tag shape="rise" ground={ground} use="statement slab" />
        <p className="title">Members practise on real calls, with real feedback, every week.</p>
        <p className="body">
          Each session pairs a member with an executive who has run the same call. The member
          makes the call, the executive scores it, and the next session starts from that score.
        </p>
      </div>
    </Slab>
  );
}

/* Stats band: three figures in a row. */
function StatsBand({ ground }: { ground: Ground }) {
  return (
    <Slab tone={ground} texture="arc">
      <div className="flex flex-col items-center gap-8 py-6 text-center">
        <Tag shape="arc" ground={ground} use="stats band" />
        <div className="grid w-full max-w-[640px] grid-cols-3 gap-4">
          <StatFigure value={150} suffix="+" label="Members" />
          <StatFigure value={10} suffix="+" label="Annual events" />
          <StatFigure value={5} suffix="+" label="Industry partners" />
        </div>
      </div>
    </Slab>
  );
}

/* Page head: the page title at hero size, centred, with one line of copy. */
function PageHead({ ground }: { ground: Ground }) {
  return (
    <Slab tone={ground} texture="waist">
      <div className="flex flex-col items-center gap-6 py-16 text-center">
        <Tag shape="waist" ground={ground} use="page head" />
        <h1 className="title-hero">
          <span className="ln">Events</span>
        </h1>
        <p className="subtitle max-w-[34rem]">Workshops, competitions and recruiter panels, all year.</p>
      </div>
    </Slab>
  );
}

/* Wide short band: one line and a button. */
function WideShortBand({ ground }: { ground: Ground }) {
  return (
    <Slab tone={ground} texture="pair">
      <div className="flex flex-col items-center gap-4 py-4 text-center">
        <Tag shape="pair" ground={ground} use="wide short band" />
        <p className="title-sm">Hire from the floor</p>
        <Button href="#">Become a partner</Button>
      </div>
    </Slab>
  );
}

const BANDS = [
  { name: 'Sweep', note: 'Bottom edge to right edge.', Band: ClosingBand },
  { name: 'Rise', note: 'Left edge to top edge.', Band: StatementSlab },
  { name: 'Arc', note: 'One crest that swells in the middle.', Band: StatsBand },
  { name: 'Waist', note: 'Wide, narrow, wide.', Band: PageHead },
  { name: 'Pair', note: 'Two ribbons, one following the other.', Band: WideShortBand },
];

export default function TextureLabPage() {
  if (process.env.NODE_ENV === 'production') notFound();

  return (
    <div className="pt-28 pb-16">
      <div className="mb-8 flex flex-col gap-3 px-[var(--gut)]">
        <Eyebrow>Development only</Eyebrow>
        <h1 className="title">Texture lab</h1>
        <p className="body-sm measure">
          The five ribbon shapes on both lit grounds, through the real Slab and Texture. Resize the
          window to check that each ribbon redraws to its new size and stays the same at a given size.
        </p>
      </div>
      {BANDS.map(({ name, note, Band }) => (
        <section key={name} className="mb-10" aria-label={name}>
          <div className="mb-3 flex items-baseline gap-3 px-[var(--gut)]">
            <h2 className="title-sm">{name}</h2>
            <span className="meta">{note}</span>
          </div>
          <div className="stack">
            <Band ground="accent" />
            <Band ground="inverse" />
          </div>
        </section>
      ))}
    </div>
  );
}
