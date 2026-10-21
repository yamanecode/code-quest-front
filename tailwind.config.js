// Tailwind reads the design tokens from app/assets/main.css.
export default {
  content: ['./app/**/*.{vue,ts}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--cq-bg)',
        panel: 'var(--cq-panel)',
        raised: 'var(--cq-raised)',
        line: 'var(--cq-line)',
        'line-strong': 'var(--cq-line-strong)',
        control: 'var(--cq-control)',
        ink: 'var(--cq-ink)',
        muted: 'var(--cq-muted)',
        'on-color': 'var(--cq-on-color)',
        go: 'var(--cq-go)',
        'go-hover': 'var(--cq-go-hover)',
        ordering: 'var(--cq-ordering)',
        grouping: 'var(--cq-grouping)',
        filtering: 'var(--cq-filtering)',
        pattern: 'var(--cq-pattern)',
        'error-bg': 'var(--cq-error-bg)',
        'error-line': 'var(--cq-error-line)',
        'error-ink': 'var(--cq-error-ink)',
      },
      fontFamily: {
        sans: ['Saira', 'system-ui', 'sans-serif'],
        display: ['"Saira Condensed"', 'Saira', 'system-ui', 'sans-serif'],
      },
    },
  },
}
