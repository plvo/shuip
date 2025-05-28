export default function Template({ children }: { children: React.ReactNode }) {
  return <section className='xl:grid xl:grid-cols-[1fr_300px]'>{children}</section>;
}
