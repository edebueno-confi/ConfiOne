import mascotUrl from '../../../assets/brand/genius-mascot.svg';
import { cx } from '../../components/ui';

type QuoteFooterVariant = 'standard' | 'architecture' | 'ai' | 'documents';

const variantClassNames: Record<QuoteFooterVariant, { quote: string; author: string; mark: string }> = {
  standard: {
    quote: 'text-lg leading-8',
    author: 'text-base leading-7',
    mark: 'text-6xl',
  },
  architecture: {
    quote: 'text-xl leading-8',
    author: 'text-base leading-7',
    mark: 'text-6xl',
  },
  ai: {
    quote: 'text-2xl leading-9',
    author: 'text-base leading-7',
    mark: 'text-7xl',
  },
  documents: {
    quote: 'text-xl leading-8',
    author: 'text-base leading-7',
    mark: 'text-6xl',
  },
};

export function BuildJournalQuoteFooter({
  author,
  quote,
  variant = 'standard',
}: {
  author?: string;
  quote: string;
  variant?: QuoteFooterVariant;
}) {
  const classes = variantClassNames[variant];

  return (
    <footer className="relative min-h-[156px] overflow-visible rounded-[18px] border border-[#D9E6F7] bg-[linear-gradient(135deg,#F5F8FF,#FFFFFF)] px-8 py-8 shadow-[0_14px_36px_rgba(31,67,125,0.06)]">
      <div className="relative z-10 max-w-[980px] pl-12 pr-0 lg:pr-44">
        <span
          aria-hidden="true"
          className={cx(
            'absolute -left-1 top-0 font-black leading-none text-[#647CFF]/70',
            classes.mark,
          )}
        >
          “
        </span>
        <p className={cx('font-black text-[#071641]', classes.quote)}>{quote}</p>
        {author ? (
          <p className={cx('mt-2 font-semibold text-[#31476C]', classes.author)}>{author}</p>
        ) : null}
      </div>

      <img
        alt=""
        aria-hidden="true"
        className="absolute bottom-4 right-10 z-0 hidden h-24 w-24 object-contain opacity-95 drop-shadow-[0_16px_26px_rgba(20,88,232,0.16)] [transform:scaleX(-1)] lg:block xl:h-28 xl:w-28"
        src={mascotUrl}
      />
    </footer>
  );
}
