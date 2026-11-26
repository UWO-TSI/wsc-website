/*
  The interface pages and sections build against for editable content.

  Pages render every editable string, button and photo through these
  components, and read every list (executives, events, sponsors, stats)
  only through useSupabaseQuery, which is where edit mode overlays drafted
  rows. A page that reads a list another way would show published rows
  while the editor works on a draft.

  Each component renders the visitor version until the edit engine is
  loaded, then its edit branch with the same props. The engine
  (src/edit/engine/) loads only for an admin at aal2, through EditGate in
  the site content provider, so a visitor downloads none of it.

  Edit mode is entered with enterEditMode() (after sign-in) and left with
  leaveEditMode(); setEditPreview() switches Preview. List editors reach
  the list draft through useEditSnapshot().engine?.list(table), and visitor
  components read a drafted row file through useDraftFile(table).
*/

export {
  useEditMode,
  useEditSnapshot,
  enterEditMode,
  leaveEditMode,
  setEditPreview,
  type EditModeValue,
  type EditStatus,
  type EditEngineApi,
} from '@/edit/edit-mode';
export { useDraftFile, type ListTable, type ListDraftApi, type ListRowState } from '@/edit/list-draft';
export { default as EditableText, type EditableTextProps, type TextTag } from '@/edit/editable-text';
export { default as EditableLines, type EditableLinesProps } from '@/edit/editable-lines';
export { default as EditableButton, type EditableButtonProps } from '@/edit/editable-button';
export { default as EditableImage, type EditableImageProps } from '@/edit/editable-image';
