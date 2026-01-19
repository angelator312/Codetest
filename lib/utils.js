export function formatNanoseconds(nanos) {
  if (typeof nanos !== 'bigint') {
    throw new TypeError('Input must be a BigInt');
  }

  if (nanos === 0n) return '0 ns';

  const sign = nanos < 0n ? '-' : '';
  nanos = nanos < 0n ? -nanos : nanos;

  const scales = [
    { threshold: 86400000000000n, unit: 'd',  divisor: 86400000000000n },
    { threshold: 3600000000000n,  unit: 'h',  divisor: 3600000000000n  },
    { threshold: 60000000000n,    unit: 'm',  divisor: 60000000000n    },
    { threshold: 1000000000n,     unit: 's',  divisor: 1000000000n     },
    { threshold: 1000000n,        unit: 'ms', divisor: 1000000n        },
    { threshold: 1000n,           unit: 'µs', divisor: 1000n           },
    { threshold: 0n,              unit: 'ns', divisor: 1n              }
  ];

  for (const { threshold, unit, divisor } of scales) {
    if (nanos >= threshold) {
      const value = Number(nanos) / Number(divisor);
      // Format to max 3 decimal places, remove trailing zeros
      const formatted = value.toLocaleString('en', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 3
      });
      return `${sign}${formatted} ${unit}`;
    }
  }

  return `${sign}${nanos} ns`; // fallback
}
