export default function Logo({ tamanho = 30 }) {
  return (
    <svg width={tamanho} height={tamanho} viewBox="0 0 32 32" aria-hidden="true" focusable="false">
      <path
        d="M16 1.5c-6.4 0-11.5 5-11.5 11.3C4.5 21.4 16 30.5 16 30.5s11.5-9.1 11.5-17.7C27.5 6.5 22.4 1.5 16 1.5z"
        fill="#F4C430"
        stroke="#142A1E"
        strokeWidth="1.5"
      />
      <path d="M10.5 18.5c0-6 4-9 10.5-9 0 6-3.5 9.5-8.5 9.5-.7 0-1.4-.2-2-.5z" fill="#1F5C3B" />
      <path d="M11.2 18.2 17 12.6" stroke="#F4C430" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
