'use client';

import Image from 'next/image';
import { useState } from 'react';

/*
  How to add the club's code to an authenticator app, shown beside the
  two-factor setup card (MfaGate, enroll mode). Card 19 in floor.html.

  Two forms, picked by the device, not the width:
    computer  the app picker, a phone illustration and three steps. Pressing
              a step changes the phone screen; a green ring marks what to press.
    phone     the app picker and three steps, without the illustration. The
              person is setting up on this phone, so the steps start from
              "Open in authenticator app" or the copied setup key instead
              of scanning the QR code.

  The icons are each app's App Store icon (public/logos/authenticators/),
  used only to name the app. The phone screens are simplified drawings in
  each app's own colours (APP_COLORS), with a green ring around what to press.
*/

export type AppId = 'apple' | 'google' | 'microsoft';

interface Step {
  title: string;
  body: string;
}

interface App {
  id: AppId;
  label: string;
  icon: string;
  computer: [Step, Step, Step];
  phone: [Step, Step, Step];
}

const BACK_HERE = 'Return here and paste it in the code box.';

export const AUTHENTICATOR_APPS: App[] = [
  {
    id: 'apple',
    label: 'Apple Passwords',
    icon: '/logos/authenticators/apple-passwords.jpg',
    computer: [
      { title: 'Point the Camera at the code', body: 'Open the Camera app and aim it at the QR code on this page. Tap Open in Passwords when it appears.' },
      { title: 'Save it as a new entry', body: 'Passwords asks where to keep the code. Tap + at the top to save it on its own as Western Sales Club.' },
      { title: 'Enter the code here', body: 'Open Passwords, then Codes. Type the 6 digits shown under Western Sales Club into the code box.' },
    ],
    phone: [
      { title: 'Tap Open in authenticator app', body: 'Passwords opens and asks where to keep the code.' },
      { title: 'Tap + to save it', body: 'Save it on its own. It is listed as Western Sales Club.' },
      { title: 'Copy the code and come back', body: `In Passwords, open Codes and tap the code under Western Sales Club to copy it. ${BACK_HERE}` },
    ],
  },
  {
    id: 'google',
    label: 'Google Authenticator',
    icon: '/logos/authenticators/google-authenticator.jpg',
    computer: [
      { title: 'Tap +', body: 'Open Google Authenticator and tap + at the bottom right.' },
      { title: 'Scan the QR code', body: 'Tap Scan a QR code and aim the camera at the code on this page.' },
      { title: 'Enter the code here', body: 'Type the 6 digits shown under Western Sales Club into the code box.' },
    ],
    phone: [
      { title: 'Tap Copy next to the setup key', body: 'The key is copied to your clipboard.' },
      { title: 'Add it in Google Authenticator', body: 'Tap +, then Enter a setup key. Name it Western Sales Club, paste the key, and tap Add.' },
      { title: 'Copy the code and come back', body: `Tap the code under Western Sales Club to copy it. ${BACK_HERE}` },
    ],
  },
  {
    id: 'microsoft',
    label: 'Microsoft Authenticator',
    icon: '/logos/authenticators/microsoft-authenticator.jpg',
    computer: [
      { title: 'Tap +', body: 'Open Microsoft Authenticator and tap + at the top right.' },
      { title: 'Choose Other account', body: 'Tap Other account, then aim the camera at the QR code on this page.' },
      { title: 'Enter the code here', body: 'Tap Western Sales Club and type the 6 digits it shows into the code box.' },
    ],
    phone: [
      { title: 'Tap Copy next to the setup key', body: 'The key is copied to your clipboard.' },
      { title: 'Add it in Microsoft Authenticator', body: 'Tap +, then Other account, then Or enter code manually. Name it Western Sales Club and paste the key.' },
      { title: 'Copy the code and come back', body: `Tap Western Sales Club and copy the code. ${BACK_HERE}` },
    ],
  },
];

/** The app picker. Pressed state is a raised fill and the heavier weight. */
function AppPicker({
  app,
  onPick,
  tiles,
}: {
  app: AppId;
  onPick: (id: AppId) => void;
  /** Phone form: three equal tiles, icon over name. Computer form: pills. */
  tiles: boolean;
}) {
  return (
    <div
      role="group"
      aria-label="Authenticator app"
      className={tiles ? 'grid grid-cols-3 gap-2' : 'flex flex-wrap gap-2'}
    >
      {AUTHENTICATOR_APPS.map((a) => {
        const on = a.id === app;
        return (
          <button
            key={a.id}
            type="button"
            aria-pressed={on}
            onClick={() => onPick(a.id)}
            className={`flex items-center text-ink transition-colors duration-[var(--d-hover)] ease-enter ${
              on ? 'bg-page font-semibold shadow-1' : 'bg-transparent font-medium hover:bg-page'
            } ${
              tiles
                ? 'min-h-24 flex-col justify-center gap-2 rounded-lg px-1.5 py-3 text-center'
                : 'min-h-11 gap-2.5 rounded-pill py-1.5 pl-1.5 pr-4'
            }`}
          >
            <Image
              src={a.icon}
              alt=""
              width={tiles ? 40 : 28}
              height={tiles ? 40 : 28}
              className={tiles ? 'rounded-md' : 'rounded-sm'}
            />
            <span className={tiles ? 'meta !text-ink' : 'body-sm !text-ink'}>{a.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/** A numbered step. On a computer it is a button that changes the phone screen. */
function StepItem({
  n,
  step,
  current,
  onPick,
}: {
  n: number;
  step: Step;
  current?: boolean;
  onPick?: () => void;
}) {
  const inner = (
    <>
      <span
        aria-hidden="true"
        className={`label flex size-7 shrink-0 items-center justify-center rounded-full ${
          current === false ? 'bg-sunken !text-ink-muted' : 'bg-accent !text-on-accent'
        }`}
      >
        {n}
      </span>
      <span className="flex flex-col gap-1 text-left">
        <span className="body-sm font-semibold !text-ink">{step.title}</span>
        <span className="body-sm text-ink-muted">{step.body}</span>
      </span>
    </>
  );

  if (!onPick) {
    return <li className="flex items-start gap-3 rounded-lg bg-page p-4">{inner}</li>;
  }
  return (
    <li>
      <button
        type="button"
        onClick={onPick}
        aria-current={current ? 'step' : undefined}
        className={`flex w-full items-start gap-3 rounded-lg p-4 transition-colors duration-[var(--d-hover)] ease-enter ${
          current ? 'bg-page shadow-1' : 'bg-transparent hover:bg-page'
        }`}
      >
        {inner}
      </button>
    </li>
  );
}

/* ── The phone illustration ── */

/*
  Each app's own colours, so the drawing reads as that app. These are the
  apps' colours, not the site's: they are used only inside the phone
  drawings below, the way a sponsor's logo keeps its own colours. The
  annotation on top (the green Tap ring) is the same for every app.
*/
const TAP_GREEN = '#34c759';
const APP_COLORS = {
  apple: { ground: '#f2f2f7', fill: '#e5e5ea', muted: '#6c6c70', ink: '#000000' },
  google: { blue: '#1a73e8', surface: '#e9eef6', red: '#ea4335', yellow: '#fbbc04', green: '#34a853', ink: '#1f1f1f', muted: '#444746' },
  microsoft: { blue: '#0078d4', surface: '#ebebeb', ink: '#1b1b1b', muted: '#616161' },
} as const;

/**
  Marks what to press: a green ring just outside the target, following its
  shape (a circle around a round button). It never covers the label.
*/
function Tap() {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute -inset-1.5 rounded-[inherit]"
      style={{ boxShadow: `0 0 0 3px ${TAP_GREEN}` }}
    />
  );
}

/** A grey bar standing in for someone else's entry. */
function Bar({ w, h = 'h-2', color }: { w: string; h?: string; color: string }) {
  return <span className={`block rounded-xs ${w} ${h}`} style={{ background: color }} />;
}

function OtherEntries({ round, color }: { round?: boolean; color: string }) {
  return (
    <>
      {['w-28', 'w-24', 'w-32'].map((w) => (
        <div key={w} className="flex items-center gap-2.5 py-2.5">
          <span className={`size-8 shrink-0 ${round ? 'rounded-full' : 'rounded-sm'}`} style={{ background: color }} />
          <span className="flex flex-col gap-1.5">
            <Bar w={w} color={color} />
            <Bar w="w-16" h="h-1.5" color={color} />
          </span>
        </div>
      ))}
    </>
  );
}

/** The club's entry, as each app lists it. */
function ClubCode({ app }: { app: AppId }) {
  const c = APP_COLORS;
  const codeColor = app === 'google' ? c.google.blue : app === 'microsoft' ? c.microsoft.blue : c.apple.ink;
  const ink = app === 'apple' ? c.apple.ink : app === 'google' ? c.google.ink : c.microsoft.ink;
  const muted = app === 'apple' ? c.apple.muted : app === 'google' ? c.google.muted : c.microsoft.muted;
  return (
    <div
      className="flex flex-col gap-0.5 rounded-md p-3"
      style={{ background: app === 'apple' ? '#ffffff' : 'transparent' }}
    >
      <span className="body-sm font-semibold" style={{ color: ink }}>
        {app === 'google' ? 'Western Sales Club: you@gmail.com' : 'Western Sales Club'}
      </span>
      {app !== 'google' && (
        <span className="meta" style={{ color: muted }}>
          you@gmail.com
        </span>
      )}
      <span className="subtitle tabular-nums" style={{ color: codeColor }}>
        482 913
      </span>
    </div>
  );
}

/** Google's plus: four arms in Google's four colours. */
function GooglePlus() {
  const g = APP_COLORS.google;
  return (
    <span aria-hidden="true" className="relative block size-6">
      <span className="absolute left-[10px] top-0 h-[12px] w-[4px] rounded-xs" style={{ background: g.red }} />
      <span className="absolute left-[12px] top-[10px] h-[4px] w-[12px] rounded-xs" style={{ background: g.blue }} />
      <span className="absolute left-[10px] top-[12px] h-[12px] w-[4px] rounded-xs" style={{ background: g.green }} />
      <span className="absolute left-0 top-[10px] h-[4px] w-[12px] rounded-xs" style={{ background: g.yellow }} />
    </span>
  );
}

function AppleScreen({ step }: { step: number }) {
  const a = APP_COLORS.apple;
  if (step === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-7" style={{ background: a.fill }}>
        <span
          className="meta flex size-36 items-center justify-center rounded-md"
          style={{ background: '#ffffff', color: a.muted }}
        >
          QR code on screen
        </span>
        <span className="body-sm relative rounded-pill px-4 py-2.5 font-semibold" style={{ background: '#ffffff', color: a.ink }}>
          Open in Passwords
          <Tap />
        </span>
        <span className="meta" style={{ color: a.muted }}>Camera</span>
      </div>
    );
  }
  if (step === 1) {
    return (
      <div className="flex h-full flex-col gap-3.5 px-3.5 py-7" style={{ background: a.ground }}>
        <span className="meta text-center" style={{ color: a.muted }}>
          Choose a password to add this verification code
        </span>
        <div className="flex items-center justify-between" style={{ color: a.ink }}>
          <span className="flex size-8 items-center justify-center rounded-full" style={{ background: '#ffffff' }} aria-hidden="true">
            &times;
          </span>
          <span className="body-sm font-semibold" style={{ color: a.ink }}>Add Verification Code</span>
          <span className="relative flex size-8 items-center justify-center rounded-full" style={{ background: '#ffffff' }}>
            +
            <Tap />
          </span>
        </div>
        <div className="rounded-md px-3" style={{ background: '#ffffff' }}>
          <OtherEntries color={a.fill} />
        </div>
      </div>
    );
  }
  return (
    <div className="flex h-full flex-col gap-3.5 px-3.5 py-8" style={{ background: a.ground }}>
      <span className="title-sm !normal-case" style={{ color: a.ink }}>Codes</span>
      <ClubCode app="apple" />
      <div className="rounded-md px-3" style={{ background: '#ffffff' }}>
        <OtherEntries color={a.fill} />
      </div>
    </div>
  );
}

function GoogleScreen({ step }: { step: number }) {
  const g = APP_COLORS.google;
  const list = (
    <div className="flex h-full flex-col gap-4 px-4 py-7" style={{ background: '#ffffff' }}>
      <span className="body-sm" style={{ color: g.muted }}>Google Authenticator</span>
      <span className="meta rounded-pill px-3.5 py-2.5" style={{ background: g.surface, color: g.muted }}>
        Search...
      </span>
      {step === 2 && <ClubCode app="google" />}
      {[110, 140, 90].map((w) => (
        <div key={w} className="flex flex-col gap-1.5 pb-2">
          <span className="block h-2 rounded-xs" style={{ width: w, background: g.surface }} />
          <span className="block h-5 w-32 rounded-xs" style={{ background: g.surface }} />
        </div>
      ))}
    </div>
  );
  if (step === 1) {
    return (
      <div className="relative h-full">
        {list}
        <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.32)' }} />
        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1.5 rounded-t-xl px-4 pb-8 pt-6" style={{ background: '#ffffff' }}>
          <span className="body-sm relative rounded-md px-3 py-3.5 font-semibold" style={{ background: g.surface, color: g.ink }}>
            Scan a QR code
            <Tap />
          </span>
          <span className="body-sm px-3 py-3.5" style={{ color: g.ink }}>Enter a setup key</span>
        </div>
      </div>
    );
  }
  return (
    <div className="relative h-full">
      {list}
      {step === 0 && (
        <span
          className="absolute bottom-5 right-4 flex size-14 items-center justify-center rounded-lg shadow-1"
          style={{ background: g.surface }}
        >
          <GooglePlus />
          <Tap />
        </span>
      )}
    </div>
  );
}

function MicrosoftScreen({ step }: { step: number }) {
  const m = APP_COLORS.microsoft;
  if (step === 1) {
    return (
      <div className="flex h-full flex-col gap-2.5 px-4 py-8" style={{ background: '#ffffff' }}>
        <span className="body-sm pb-2 font-semibold" style={{ color: m.ink }}>What kind of account are you adding?</span>
        <span className="body-sm rounded-md px-3 py-3.5" style={{ background: m.surface, color: m.ink }}>Personal account</span>
        <span className="body-sm rounded-md px-3 py-3.5" style={{ background: m.surface, color: m.ink }}>Work or school account</span>
        <span className="body-sm relative rounded-md px-3 py-3.5 font-semibold" style={{ background: m.surface, color: m.ink }}>
          Other account
          <Tap />
        </span>
      </div>
    );
  }
  return (
    <div className="flex h-full flex-col" style={{ background: '#ffffff' }}>
      <div className="flex h-18 items-end justify-between px-4 pb-3" style={{ background: m.blue }}>
        <span className="body-sm font-semibold" style={{ color: '#ffffff' }}>Authenticator</span>
        {step === 0 && (
          <span className="relative flex size-8 items-center justify-center rounded-full text-[22px] leading-none" style={{ color: '#ffffff' }}>
            +
            <Tap />
          </span>
        )}
      </div>
      <div className="flex flex-col gap-2 px-4 py-3">
        {step === 2 && <ClubCode app="microsoft" />}
        <OtherEntries round color={m.surface} />
      </div>
    </div>
  );
}

function Screen({ app, step }: { app: AppId; step: number }) {
  if (app === 'apple') return <AppleScreen step={step} />;
  if (app === 'google') return <GoogleScreen step={step} />;
  return <MicrosoftScreen step={step} />;
}

function PhoneIllustration({ app, step }: { app: AppId; step: number }) {
  const label = AUTHENTICATOR_APPS.find((a) => a.id === app)!.label;
  return (
    <div
      role="img"
      aria-label={`${label}, step ${step + 1} of 3`}
      className="h-[572px] w-[280px] shrink-0 rounded-[44px] bg-ink p-2.5 shadow-3"
    >
      <div className="h-full w-full overflow-hidden rounded-[34px] bg-page">
        <Screen app={app} step={step} />
      </div>
    </div>
  );
}

/* ── The guide ── */

export default function AuthenticatorGuide({ onPhone }: { onPhone: boolean }) {
  const [app, setApp] = useState<AppId>('apple');
  const [step, setStep] = useState(0);
  const current = AUTHENTICATOR_APPS.find((a) => a.id === app)!;

  const pick = (id: AppId) => {
    setApp(id);
    setStep(0);
  };

  if (onPhone) {
    return (
      <div className="flex flex-col gap-5">
        <h2 className="title-sm text-ink">Which app do you use?</h2>
        <AppPicker app={app} onPick={pick} tiles />
        <ol className="m-0 flex list-none flex-col gap-2 p-0">
          {current.phone.map((s, i) => (
            <StepItem key={s.title} n={i + 1} step={s} />
          ))}
        </ol>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-7">
      <h2 className="title-sm text-ink">Add the code to your app</h2>
      <AppPicker app={app} onPick={pick} tiles={false} />
      <div className="flex flex-wrap items-start gap-8">
        <PhoneIllustration app={app} step={step} />
        <ol className="m-0 flex min-w-0 flex-[1_1_240px] list-none flex-col gap-2.5 p-0">
          {current.computer.map((s, i) => (
            <StepItem key={s.title} n={i + 1} step={s} current={i === step} onPick={() => setStep(i)} />
          ))}
          <li className="meta px-1 pt-1.5">Codes change every 30 seconds. Enter the one showing now.</li>
        </ol>
      </div>
    </div>
  );
}
