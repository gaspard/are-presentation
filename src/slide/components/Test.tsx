export function Test(props: any) {
  return (
    <pre className="whitespace-pre-line">{JSON.stringify(props, null, 2)}</pre>
  );
}
