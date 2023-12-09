type IAnimationPlaybackEvent = AnimationPlaybackEvent & { target: Animation };
export function waitAnimation(animation: Animation) {
  return new Promise<IAnimationPlaybackEvent>((resolve) =>
    animation.addEventListener('finish', (e) => resolve(e as IAnimationPlaybackEvent), { once: true }),
  );
}

export const sleep = (time: number) => new Promise((res) => setTimeout(res, time));
