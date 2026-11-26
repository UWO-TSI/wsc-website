'use client';

import Image from 'next/image';
import { useState } from 'react';

/*
  How to add the club's code to an authenticator app, shown beside the
  two-factor setup card (MfaGate, enroll mode). Card 19 in floor.html.

  Two forms, picked by the device, not the width:
    computer  the app picker, a phone illustration and three steps. Pressing
              a step changes the phone screen; the disc marks what to tap.
    phone     the app picker and three steps, without the illustration. The
              person is setting up on this phone, so the steps start from
              "Open in authenticator app" or the copied setup key instead
              of scanning the QR code.

  The icons are each app's App Store icon (public/logos/authenticators/),
  used only to name the app. The phone screens are drawn in the site's own
  neutrals, never copies of the apps' screens.
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

/** Marks what to tap: a disc of the accent over the target, as a touch shows. */
function Tap() {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute left-1/2 top-1/2 size-11 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/35"
    />
  );
}

/** A grey bar standing in for someone else's entry. */
function Bar({ w, h = 'h-2' }: { w: string; h?: string }) {
  return <span className={`block rounded-xs bg-sunken ${w} ${h}`} />;
}

function OtherEntries({ round }: { round?: boolean }) {
  return (
    <>
      {['w-28', 'w-24', 'w-32'].map((w) => (
        <div key={w} className="flex items-center gap-2.5 py-2.5">
          <span className={`size-8 shrink-0 bg-sunken ${round ? 'rounded-full' : 'rounded-sm'}`} />
          <span className="flex flex-col gap-1.5">
            <Bar w={w} />
            <Bar w="w-16" h="h-1.5" />
          </span>
        </div>
      ))}
    </>
  );
}

function ClubCode({ tap }: { tap?: boolean }) {
  return (
    <div className="relative flex flex-col gap-0.5 rounded-md bg-raised p-3">
      <span className="body-sm font-semibold !text-ink">Western Sales Club</span>
      <span className="meta">you@gmail.com</span>
      <span className="subtitle tabular-nums !text-accent-ink">482 913</span>
      {tap && <Tap />}
    </div>
  );
}

function Screen({ app, step }: { app: AppId; step: number }) {
  if (app === 'apple' && step === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-7 bg-inverse">
        <span className="meta flex size-36 items-center justify-center rounded-md bg-inverse-tile !text-on-inverse">
          QR code on screen
        </span>
        <span className="body-sm relative rounded-pill bg-page px-4 py-2.5 font-semibold !text-ink">
          Open in Passwords
          <Tap />
        </span>
      </div>
    );
  }
  if (app === 'apple' && step === 1) {
    return (
      <div className="flex h-full flex-col gap-3.5 bg-raised px-3.5 py-7">
        <span className="meta text-center">Choose a password to add this verification code</span>
        <div className="flex items-center justify-between">
          <span className="flex size-8 items-center justify-center rounded-full bg-page" aria-hidden="true">&times;</span>
          <span className="body-sm font-semibold !text-ink">Add Verification Code</span>
          <span className="relative flex size-8 items-center justify-center rounded-full bg-page">
            +
            <Tap />
          </span>
        </div>
        <div className="rounded-md bg-page px-3">
          <OtherEntries />
        </div>
      </div>
    );
  }
  if (app === 'apple') {
    return (
      <div className="flex h-full flex-col gap-3.5 bg-raised px-3.5 py-8">
        <span className="title-sm !normal-case">Codes</span>
        <ClubCode tap />
      </div>
    );
  }
  if (app === 'google' && step === 1) {
    return (
      <div className="relative h-full bg-inverse-veil">
        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1.5 rounded-t-xl bg-page px-4 pb-8 pt-6">
          <span className="body-sm relative rounded-md bg-raised px-3 py-3.5 font-semibold !text-ink">
            Scan a QR code
            <Tap />
          </span>
          <span className="body-sm px-3 py-3.5">Enter a setup key</span>
        </div>
      </div>
    );
  }
  if (app === 'google') {
    return (
      <div className="relative flex h-full flex-col gap-4 bg-page px-4 py-7">
        <span className="body-sm !text-ink">Google Authenticator</span>
        <span className="meta rounded-pill bg-raised px-3.5 py-2.5">Search</span>
        {step === 2 && <ClubCode tap />}
        <OtherEntries />
        {step === 0 && (
          <span className="title-sm absolute bottom-5 right-4 flex size-13 items-center justify-center rounded-lg bg-raised shadow-1">
            +
            <Tap />
          </span>
        )}
      </div>
    );
  }
  if (app === 'microsoft' && step === 1) {
    return (
      <div className="flex h-full flex-col gap-2.5 bg-page px-4 py-8">
        <span className="body-sm pb-2 font-semibold !text-ink">What kind of account are you adding?</span>
        <span className="body-sm rounded-md bg-raised px-3 py-3.5">Personal account</span>
        <span className="body-sm rounded-md bg-raised px-3 py-3.5">Work or school account</span>
        <span className="body-sm relative rounded-md bg-raised px-3 py-3.5 font-semibold !text-ink">
          Other account
          <Tap />
        </span>
      </div>
    );
  }
  return (
    <div className="flex h-full flex-col bg-page">
      <div className="flex h-18 items-end justify-between bg-inverse px-4 pb-3">
        <span className="body-sm font-semibold !text-on-inverse">Authenticator</span>
        {step === 0 && (
          <span className="relative flex size-8 items-center justify-center text-on-inverse">
            +
            <Tap />
          </span>
        )}
      </div>
      <div className="flex flex-col gap-2 px-4 py-3">
        {step === 2 && <ClubCode tap />}
        <OtherEntries round />
      </div>
    </div>
  );
}

function PhoneIllustration({ app, step }: { app: AppId; step: number }) {
  const label = AUTHENTICATOR_APPS.find((a) => a.id === app)!.label;
  return (
    <div
      role="img"
      aria-label={`${label}, step ${step + 1} of 3`}
      className="h-[572px] w-[280px] shrink-0 rounded-[44px] bg-inverse p-2.5 shadow-3"
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
