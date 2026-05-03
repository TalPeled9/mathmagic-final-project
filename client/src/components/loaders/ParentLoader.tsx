import { GradientRing } from './GradientRing';

interface ParentLoaderProps {
  message?: string;
}

export function ParentLoader({ message = 'Loading dashboard…' }: ParentLoaderProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 14,
        padding: 32,
      }}
    >
      <GradientRing size={52} thickness={4.5} label={message} />
      <span style={{ color: '#9CA3AF', fontSize: 14, fontWeight: 500 }}>{message}</span>
    </div>
  );
}
