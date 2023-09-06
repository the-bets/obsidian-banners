/* eslint-disable import/no-duplicates */
import type { EventDispatcher } from 'svelte';
import type { Action } from 'svelte/action';

type MTEvent = MouseEvent | TouchEvent;
type DragBannerActionParams = {
  x: number | undefined;
  y: number | undefined;
  dispatch: EventDispatcher<{'drag-banner': Partial<BannerMetadata>}>;
}

// Clamp a value if needed, otherwise round it to 3 decimals
const clampAndRound = (min: number, value: number, max: number) => {
  if (value > max) return max;
  if (value < min) return min;
  return Math.round(value * 1000) / 1000;
};

const getMousePos = (e: MTEvent): [number, number] => {
  const { clientX, clientY } = (e instanceof MouseEvent) ? e : e.targetTouches[0];
  return [clientX, clientY];
};

// TODO: Reimplement touch dragging
export const dragBanner: Action<HTMLImageElement, DragBannerActionParams> = (
  img,
  { x = 0.5, y = 0.5, dispatch }
) => {
  let dragging = false;
  let isVerticalDrag = false;
  let imageSize = { width: 0, height: 0 };
  let prev = { x: 0, y: 0 };
  let objectPos = { x, y };

  const setObjectPos = () => {
    img.setCssStyles({ objectPosition: `${objectPos.x * 100}% ${objectPos.y * 100}%` });
  };

  const dragStart = (e: MTEvent) => {
    const [x, y] = getMousePos(e);
    const {
      clientHeight,
      clientWidth,
      naturalHeight,
      naturalWidth
    } = img;
    const clientRatio = clientWidth / clientHeight;
    const naturalRatio = naturalWidth / naturalHeight;
    dragging = true;
    isVerticalDrag = naturalRatio <= clientRatio;
    prev = { x, y };
    // Get "drag area" dimensions (image size with "covered" area, then subtract image dimensions)
    imageSize = isVerticalDrag
      ? { width: 0, height: clientWidth / naturalRatio - clientHeight }
      : { width: clientHeight * naturalRatio - clientWidth, height: 0 };
    img.addClass('dragging');
  };

  const dragMove = (e: MTEvent) => {
    if (!dragging) return;

    const [x, y] = getMousePos(e);
    const delta = { x: prev.x - x, y: prev.y - y };
    prev = { x, y };

    const drag = {
      x: isVerticalDrag ? 0 : delta.x / imageSize.width,
      y: isVerticalDrag ? delta.y / imageSize.height : 0
    };
    objectPos = {
      x: clampAndRound(0, (objectPos.x) + drag.x, 1),
      y: clampAndRound(0, (objectPos.y) + drag.y, 1)
    };
    setObjectPos();
  };

  const dragEnd = () => {
    if (!dragging) return;
    dragging = false;
    setObjectPos();
    dispatch('drag-banner', isVerticalDrag ? { y: objectPos.y } : { x: objectPos.x });
    img.removeClass('dragging');
  };

  img.addEventListener('mousedown', dragStart);
  img.addEventListener('mousemove', dragMove);
  img.addEventListener('mouseup', dragEnd);
  document.addEventListener('mouseup', dragEnd);
  setObjectPos();

  return {
    update({ x = 0.5, y = 0.5 }) {
      objectPos = { x, y };
      setObjectPos();
    },
    destroy() {
      img.removeEventListener('mousedown', dragStart);
      img.removeEventListener('mousemove', dragMove);
      img.removeEventListener('mouseup', dragEnd);
      document.removeEventListener('mouseup', dragEnd);
    }
  };
};