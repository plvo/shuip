export default function Template({ children }: { children: React.ReactNode }) {
  return <section className='xl:grid xl:grid-cols-[1fr_350px]'>{children}</section>;
}
