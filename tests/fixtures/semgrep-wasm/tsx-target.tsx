export function Preview(props: { source: string }) {
  eval(props.source);
  return <pre>{props.source}</pre>;
}
