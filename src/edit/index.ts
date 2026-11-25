/*
  The interface pages and sections build against for editable content.

  Pages render every editable string, button and photo through these
  components, and read every list (executives, events, sponsors, stats)
  only through useSupabaseQuery, which is where edit mode overlays drafted
  rows. A page that reads a list another way would show published rows
  while the editor works on a draft.

  The files here are the view-mode versions and render what the site
  renders for a visitor. The edit engine replaces them with versions that
  keep the same props.
*/

export { useEditMode, type EditModeValue } from '@/edit/edit-mode';
export { default as EditableText, type EditableTextProps, type TextTag } from '@/edit/editable-text';
export { default as EditableLines, type EditableLinesProps } from '@/edit/editable-lines';
export { default as EditableButton, type EditableButtonProps } from '@/edit/editable-button';
export { default as EditableImage, type EditableImageProps } from '@/edit/editable-image';
