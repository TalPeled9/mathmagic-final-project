import * as React from 'react';
import { Row, Column } from '@react-email/components';
import { COLORS } from '../theme';

interface Props {
  percent: number;
}

/** Table-based progress bar (width-% column trick) — avoids flex/grid for Outlook safety. */
export function ProgressBar({ percent }: Props) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <Row style={{ backgroundColor: COLORS.gray100, borderRadius: '999px', height: '10px' }}>
      <Column
        style={{
          width: `${clamped}%`,
          backgroundColor: COLORS.purple,
          borderRadius: '999px',
          height: '10px',
          fontSize: '10px',
          lineHeight: '10px',
        }}
      >
        &nbsp;
      </Column>
      {clamped < 100 && <Column />}
    </Row>
  );
}
