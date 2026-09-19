# Luke Hammond, swimming recruiting

A recruiting profile for one swimmer, and the board behind it.

The public page is what a college coach reads. The private back end is where
new times go in, and where every school on the board gets re-scored against
them.

Read CLAUDE.md before changing anything. Read docs/STATUS.md for what is done
and what is blocked.

    npm run check    lint, then 994 checks

## How the board works

Luke races metres. Every NCAA programme races short course yards. So his times
are converted, then compared against what swimmers at each programme are
actually swimming.

- **Priority** is relevance, not quality. P1 means his times overlap that
  programme right now, not that it is a better school than a P2.
- **Confidence** is about the evidence, not the odds. High means we have real
  times from real swimmers there.
- **Fit** is the gap, banded. Current fit, target, reach.
- **What-if** answers the only question a fifteen year old cares about, ie,
  what does four seconds off the 500 actually unlock.

Nothing is invented. A school with no times gathered reads "Not assessed".
