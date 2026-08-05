import { useEffect, useState, type KeyboardEvent, type PointerEvent } from 'react';

export type GeniusPose = 'welcome' | 'present' | 'think' | 'celebrate' | 'magic' | 'shrug';
export type GeniusExpression = 'happy' | 'wink' | 'wow';
export type GeniusMascotExpression = GeniusExpression;
export type GeniusAvatarVariant = 'default' | 'attention' | 'success';
export type GeniusMascotPose = GeniusPose;
export type GeniusMascotSurface = 'default' | 'loading' | 'empty' | 'success' | 'avatar';

// A geometria das poses segue o SVG atualizado de avatar/GeniusGenie.dc.html.
// O SVG permanece inline para preservar os estados dinâmicos de pose e expressão.

type GeniusMascotProps = {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  alt?: string;
  animated?: boolean;
  expression?: GeniusExpression;
  avatarVariant?: GeniusAvatarVariant;
  interactive?: boolean;
  pose?: GeniusPose;
  surface?: GeniusMascotSurface;
};

const expressionOrder: GeniusMascotExpression[] = ['happy', 'wink', 'wow'];
const defaultExpressionBySurface: Record<GeniusMascotSurface, GeniusMascotExpression> = {
  default: 'happy',
  loading: 'happy',
  empty: 'wow',
  success: 'wink',
  avatar: 'happy',
};
const defaultPoseBySurface: Record<GeniusMascotSurface, GeniusPose> = {
  default: 'welcome',
  loading: 'magic',
  empty: 'shrug',
  success: 'celebrate',
  avatar: 'welcome',
};

const avatarVariantMap: Record<GeniusAvatarVariant, { pose: GeniusPose; expression: GeniusExpression }> = {
  default: { pose: 'welcome', expression: 'happy' },
  attention: { pose: 'magic', expression: 'wink' },
  success: { pose: 'celebrate', expression: 'wow' },
};

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export function GeniusMascot({
  size = 'md',
  alt = '',
  animated = true,
  expression,
  avatarVariant,
  interactive = false,
  pose,
  surface = 'default',
}: GeniusMascotProps) {
  const avatarPreset = avatarVariant ? avatarVariantMap[avatarVariant] : undefined;
  const resolvedExpression = expression ?? avatarPreset?.expression ?? defaultExpressionBySurface[surface];
  const resolvedPose = pose ?? avatarPreset?.pose ?? defaultPoseBySurface[surface];
  const [activeExpression, setActiveExpression] = useState<GeniusMascotExpression>(resolvedExpression);
  const [pupilOffset, setPupilOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setActiveExpression(resolvedExpression);
  }, [resolvedExpression]);

  function handlePointerMove(event: PointerEvent<HTMLSpanElement>) {
    if (!interactive) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - (rect.left + rect.width / 2)) / (rect.width / 2)) * 5.5;
    const y = ((event.clientY - (rect.top + rect.height * 0.35)) / (rect.height * 0.35)) * 6.5;
    setPupilOffset({ x: clamp(x, -5.5, 5.5), y: clamp(y, -6.5, 6.5) });
  }

  function cycleExpression() {
    if (!interactive) return;
    const index = expressionOrder.indexOf(activeExpression);
    setActiveExpression(expressionOrder[(index + 1) % expressionOrder.length]);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLSpanElement>) {
    if (!interactive || (event.key !== 'Enter' && event.key !== ' ')) return;
    event.preventDefault();
    cycleExpression();
  }

  const isWink = activeExpression === 'wink';
  const isWow = activeExpression === 'wow';
  const isLoading = surface === 'loading';
  const posePresent = resolvedPose === 'present';
  const poseThink = resolvedPose === 'think';
  const showBaseArm = !['celebrate', 'shrug'].includes(resolvedPose);
  const showMagicEffect = resolvedPose === 'magic';
  const renderedPupilOffset = isLoading ? { x: 0, y: 5.5 } : pupilOffset;

  return (
    <span
      aria-hidden={alt ? undefined : true}
      aria-label={alt || undefined}
      className={`genius-mascot genius-mascot--${size}${animated ? ' genius-mascot--animated' : ''}`}
      data-avatar-variant={avatarVariant}
      data-expression={activeExpression}
      data-pose={resolvedPose}
      data-surface={surface}
      onClick={cycleExpression}
      onKeyDown={handleKeyDown}
      onPointerLeave={() => setPupilOffset({ x: 0, y: 0 })}
      onPointerMove={handlePointerMove}
      role={interactive ? 'button' : 'img'}
      tabIndex={interactive ? 0 : undefined}
    >
      <span aria-hidden="true" className="genius-mascot__aura" />
      <svg aria-hidden="true" className="genius-mascot__svg" viewBox="0 0 360 470" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="176" cy="452" rx="72" ry="9" fill="#c9cfdb" opacity="0.55" />
        <g className="genius-mascot__sparkles" fill="none">
          <path d="M74 141v18m-9-9h18" stroke="#22326e" strokeWidth="4" strokeLinecap="round" />
          <path d="M300 107v22m-11-11h22" stroke="#e10098" strokeWidth="4" strokeLinecap="round" />
          <path d="M58 299v14m-7-7h14" stroke="#e10098" strokeWidth="3" strokeLinecap="round" />
          <circle cx="312" cy="300" r="7" stroke="#22326e" strokeWidth="3" />
          <circle cx="94" cy="80" r="6" stroke="#e10098" strokeWidth="3" />
          <path d="M292 229v14m-7-7h14" stroke="#22326e" strokeWidth="3" strokeLinecap="round" />
        </g>
        <g className="genius-mascot__lamp">
          <path d="M214 420c30-4 30 30 2 28 10-6 10-22-2-20Z" fill="#e10098" />
          <ellipse cx="176" cy="432" rx="50" ry="20" fill="#e10098" />
          <path d="M132 424c-26 0-42-6-56-15 1 8 8 17 25 22 15 4 27 3 37 0Z" fill="#e10098" />
          <ellipse cx="176" cy="446" rx="33" ry="7" fill="#b8007c" />
          <path d="M156 416c2-11 38-11 40 0Z" fill="#c00087" />
          <ellipse cx="163" cy="428" rx="14" ry="4" fill="#ff5cc4" opacity="0.5" />
        </g>
        {isLoading && resolvedPose === 'magic' ? (
          <g aria-hidden="true" className="genius-mascot__magic" fill="none">
            <path d="M137 362c18-12 40-12 58 0" stroke="#ff69cf" strokeWidth="3" strokeLinecap="round" />
            <path d="M146 379c13-8 29-8 42 0" stroke="#bff0f7" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="132" cy="371" r="3" fill="#ff69cf" />
            <circle cx="203" cy="366" r="3.5" fill="#bff0f7" />
            <path d="M218 350v14m-7-7h14" stroke="#ff69cf" strokeWidth="2.5" strokeLinecap="round" />
          </g>
        ) : null}
        <g className="genius-mascot__genie">
          <ellipse cx="177" cy="360" rx="52" ry="66" fill="#8fdcea" opacity="0.4" />
          <path d="M146 312c-14 28 6 44 14 62 5 12-6 28 8 38h16c14-10 5-26 10-38 8-18 28-34 14-62-20 17-44 17-62 0Z" fill="#74d1e0" />
          <path d="M164 324c-14 26-4 60 12 84m20-80c10 24 2 58-12 80" stroke="#8fdcea" strokeWidth="3.5" fill="none" strokeLinecap="round" opacity="0.75" />
          <path d="M150 302c-30-4-34-52-20-88 8-7 20-13 50-13s42 6 50 13c14 36 10 84-20 88Z" fill="#307fe2" />
          <path d="m180 206-15 86h30Z" fill="#2a6fd0" />
          <path d="M180 210v80" stroke="#1f5fc0" strokeWidth="2" opacity="0.7" />
          {showBaseArm ? (
            <g className="genius-mascot__base-arm">
              <path d="M138 212c-30 4-46 40-38 76l20 0c-4-30 6-56 30-68Z" fill="#307fe2" />
              <path d="m96 284 26 4-2 12-22-2Z" fill="#e10098" />
              <path d="M96 298c-10 2-14 16-6 28-4 6 2 12 8 8 2 6 10 6 12 0 6 4 12-2 10-8 6-4 6-14 0-20-4-6-14-10-24-8Z" fill="#307fe2" />
            </g>
          ) : null}
          {resolvedPose === 'magic' ? (
            <g className="genius-mascot__pose-arm genius-mascot__pose-arm--magic">
              <path d="M224 214c28-12 48-38 40-66-4-16-8-26-10-36h-18c2 12 6 22 8 38 4 22-12 44-32 54Z" fill="#307fe2" />
              <path d="M234 112 256 112 256 98 234 98Z" fill="#e10098" />
              <path d="M236 98C232 90 234 80 244 80L248 80V56C248 49 259 49 259 56V82C264 84 266 90 264 98Z" fill="#307fe2" />
              <path d="M248 60 248 86" stroke="#1f5fc0" strokeWidth="2" opacity="0.6" />
              <path className="genius-mascot__pose-spark" d="M254 32c1.6 8 4 10.4 12 12-8 1.6-10.4 4-12 12-1.6-8-4-10.4-12-12 8-1.6 10.4-4 12-12Z" fill="#e10098" />
            </g>
          ) : null}
          {resolvedPose === 'welcome' ? (
            <g className="genius-mascot__pose-arm genius-mascot__pose-arm--wave">
              <path d="M224 214c26-8 44-28 46-54 1-14-2-24-4-32h-18c2 10 4 20 2 34-2 20-14 34-36 42Z" fill="#307fe2" />
              <path d="M248 128h22l2-16h-22Z" fill="#e10098" />
              <ellipse cx="264" cy="104" rx="13" ry="12" fill="#307fe2" />
              <path d="m254 102-6-9m11 5-2-11m8 10 1-12m5 14 5-9" stroke="#307fe2" strokeWidth="6.5" strokeLinecap="round" />
            </g>
          ) : null}
          {posePresent ? (
            <>
              <g className="genius-mascot__pose-arm genius-mascot__pose-arm--present">
                <path d="M222 222c30-6 62-6 84 0-22 10-54 12-84 18Z" fill="#307fe2" />
                <path d="m298 216 18 2v16l-18 2Z" fill="#e10098" />
                <path d="M312 216c16-3 28 3 28 11s-10 13-24 11l-4-2Z" fill="#307fe2" />
                <path d="M320 220 332 219m-12 8 16 0m-16 7 12 1" stroke="#1f5fc0" strokeWidth="1.6" opacity="0.45" />
              </g>
              <g className="genius-mascot__present-card">
                <rect x="286" y="150" width="62" height="46" rx="7" fill="#fff" stroke="#d5e6fd" strokeWidth="2" />
                <rect x="294" y="176" width="8" height="12" rx="2" fill="#307fe2" />
                <rect x="306" y="170" width="8" height="18" rx="2" fill="#e10098" />
                <rect x="318" y="164" width="8" height="24" rx="2" fill="#307fe2" />
                <rect x="330" y="158" width="8" height="30" rx="2" fill="#74d1e0" />
              </g>
            </>
          ) : null}
          {poseThink ? (
            <>
              <g className="genius-mascot__pose-arm genius-mascot__pose-arm--think">
                <path d="M226 220c14 0 10-20-2-30-8-7-18-6-24 0l6 12c8-2 14 6 14 14Z" fill="#307fe2" />
                <path d="m198 188 16-6-6-14-16 6Z" fill="#e10098" />
                <ellipse cx="196" cy="178" rx="13" ry="11" fill="#307fe2" />
                <path d="M186 176c2-4 16-5 20-2" stroke="#1f5fc0" strokeWidth="1.8" fill="none" opacity="0.5" />
              </g>
              <g className="genius-mascot__think-dots" fill="#bcd4f7">
                <circle cx="250" cy="120" r="4" />
                <circle cx="264" cy="104" r="6" />
                <circle cx="282" cy="84" r="9" />
              </g>
            </>
          ) : null}
          {resolvedPose === 'celebrate' ? (
            <g className="genius-mascot__pose-celebrate">
              <path d="M136 214c-26-10-46-36-40-64 3-14 6-24 8-32h18c-2 10-4 20-6 34-2 22 10 44 32 52Z" fill="#307fe2" />
              <path d="M104 118h18v-16h-20Z" fill="#e10098" />
              <ellipse cx="98" cy="94" rx="13" ry="12" fill="#307fe2" />
              <path d="m90 84-4-10m10 8V71m6 12 3-11m3 15 6-9" stroke="#307fe2" strokeWidth="6.5" strokeLinecap="round" />
              <g className="genius-mascot__pose-arm genius-mascot__pose-arm--wave">
                <path d="M224 214c26-10 46-36 40-64-3-14-6-24-8-32h-18c2 10 4 20 6 34 2 22-10 44-32 52Z" fill="#307fe2" />
                <path d="M238 118h18l2-16h-20Z" fill="#e10098" />
                <ellipse cx="262" cy="94" rx="13" ry="12" fill="#307fe2" />
                <path d="m252 84-4-10m10 8V71m6 12 3-11m3 15 6-9" stroke="#307fe2" strokeWidth="6.5" strokeLinecap="round" />
              </g>
              <g className="genius-mascot__pose-confetti" fill="#e10098">
                <rect x="150" y="70" width="7" height="7" rx="2" />
                <rect x="205" y="64" width="7" height="7" rx="2" fill="#74d1e0" />
                <circle cx="128" cy="72" r="3.5" fill="#74d1e0" />
                <circle cx="232" cy="76" r="3.5" />
              </g>
            </g>
          ) : null}
          {resolvedPose === 'shrug' ? (
            <g className="genius-mascot__pose-shrug">
              <path d="M140 214c-28 6-46 30-48 58l18 2c2-22 14-40 40-50Z" fill="#307fe2" />
              <path d="M92 268l18 2-2 16-18-2Z" fill="#e10098" />
              <path d="M92 282c-14 0-24 6-24 14s12 12 26 10l4-22Z" fill="#307fe2" />
              <path d="M220 214c28 6 46 30 48 58l-18 2c-2-22-14-40-40-50Z" fill="#307fe2" />
              <path d="M268 268l-18 2 2 16 18-2Z" fill="#e10098" />
              <path d="M268 282c14 0 24 6 24 14s-12 12-26 10l-4-22Z" fill="#307fe2" />
            </g>
          ) : null}
          <path d="m167 188 26 0-2 20h-22Z" fill="#2a6fd0" />
          <path d="M124 291c26 23 86 23 112 0 5 14 5 23 0 31-26 20-86 20-112 0-5-8-5-17 0-31Z" fill="#e10098" />
          <path d="M156 208c12 13 36 13 48 0" stroke="#e10098" strokeWidth="5" fill="none" strokeLinecap="round" />
          <circle cx="169" cy="216" r="4.5" fill="#e10098" />
          <circle cx="180" cy="219" r="4.5" fill="#e10098" />
          <circle cx="191" cy="216" r="4.5" fill="#e10098" />
          <g className="genius-mascot__head">
            <circle cx="120" cy="143" r="10" fill="#2a6fd0" />
            <circle cx="240" cy="143" r="10" fill="#2a6fd0" />
            <path d="M180 79c-33 0-57 22-57 59 0 38 24 60 57 60s57-22 57-60c0-37-24-59-57-59Z" fill="#307fe2" />
            <path d="M126 121c-6-29 20-52 54-52s60 23 54 52c-11-16-29-24-54-24s-43 8-54 24Z" fill="#1b2a63" />
            <ellipse cx="180" cy="58" rx="16" ry="14" fill="#1b2a63" />
            <ellipse cx="180" cy="70" rx="15" ry="5" fill="#e10098" />
            <path d="M148 122c8-6 18-6 25-1m14 1c7-6 17-6 25 1" stroke="#1b2a63" strokeWidth="5" fill="none" strokeLinecap="round" />
            {isWink ? (
              <>
                <ellipse cx="158" cy="139" rx="13" ry="15" fill="#fff" />
                <path d="M147 140c7 8 17 8 23 0" stroke="#22326e" strokeWidth="4" fill="none" strokeLinecap="round" />
                <ellipse cx="204" cy="139" rx="13" ry="15" fill="#fff" />
                <circle cx="204" cy="141" r="6" fill="#22326e" transform={`translate(${renderedPupilOffset.x} ${renderedPupilOffset.y})`} />
              </>
            ) : (
              <>
                <ellipse cx="158" cy="139" rx="13" ry="15" fill="#fff" />
                <circle cx="158" cy="141" r="6" fill="#22326e" transform={`translate(${renderedPupilOffset.x} ${renderedPupilOffset.y})`} />
                <ellipse cx="204" cy="139" rx={isWow ? 15 : 13} ry={isWow ? 18 : 15} fill="#fff" />
                <circle cx="204" cy="141" r="6" fill="#22326e" transform={`translate(${renderedPupilOffset.x} ${renderedPupilOffset.y})`} />
              </>
            )}
            <path d="M176 150c-4 10-4 17 4 18 8-1 8-8 4-17Z" fill="#2a6fd0" />
            <path d="M180 170c-9 7-21 9-32 4 9 11 26 11 32 2 6 9 23 9 32-2-11 5-23 3-32-4Z" fill="#1b2a63" />
            {isWow ? <ellipse cx="181" cy="187" rx="8" ry="10" fill="#1b2a63" /> : isWink ? <path d="M164 181c12 15 24 15 34 0-10 6-24 6-34 0Z" fill="#1b2a63" /> : <path d="M168 182c8 8 16 8 24 0" stroke="#1b2a63" strokeWidth="3.5" fill="none" strokeLinecap="round" />}
          </g>
        </g>
        {showMagicEffect ? (
          <g aria-hidden="true" className="genius-mascot__lamp-smoke" fill="none" strokeLinecap="round">
            <path d="M154 402c-10-10-6-19 4-27 9-8 8-17 1-25" stroke="#bff0f7" strokeWidth="3.5" />
            <path d="M178 398c8-9 8-18 1-25-7-8-6-17 3-25" stroke="#ff69cf" strokeWidth="3" />
            <path d="M200 405c8-8 5-17-2-23-7-6-7-14-1-21" stroke="#bff0f7" strokeWidth="2.5" />
            <circle cx="151" cy="345" r="3" fill="#ff69cf" stroke="none" />
            <circle cx="184" cy="342" r="2.5" fill="#bff0f7" stroke="none" />
            <circle cx="203" cy="359" r="2" fill="#ff69cf" stroke="none" />
          </g>
        ) : null}
      </svg>
      {animated ? <><span aria-hidden="true" className="genius-mascot__spark genius-mascot__spark--one">✦</span><span aria-hidden="true" className="genius-mascot__spark genius-mascot__spark--two">✦</span></> : null}
    </span>
  );
}
