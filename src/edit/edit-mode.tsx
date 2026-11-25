'use client';

import { createContext, useContext } from 'react';

/*
  Whether the page is in edit mode.

  This is the view-mode version: nothing provides the context yet, so every
  caller reads `editing: false` and the site renders as it does for a
  visitor. The edit engine replaces this file and mounts the provider only
  after is_admin() passes, so the anonymous bundle never carries edit code.

  Every self-running motion reads this and stays at rest while editing:
  scroll reveals, Counter Roll, Marquee Drift, Row Expand, Magnetic Pull and
  the preloader.
*/

export interface EditModeValue {
  editing: boolean;
}

const EditModeContext = createContext<EditModeValue>({ editing: false });

export function useEditMode(): EditModeValue {
  return useContext(EditModeContext);
}
