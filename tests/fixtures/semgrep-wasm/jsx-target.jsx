export function Preview(props) {
  eval(props.source);
  return <pre>{props.source}</pre>;
}
