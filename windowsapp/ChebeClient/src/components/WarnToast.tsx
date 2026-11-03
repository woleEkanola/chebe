/** PRD 4.2 — gentle pre-lock toast. */
export default function WarnToast({ message }: { message: string }) {
  return <div className="toast-warn">{message}</div>;
}
