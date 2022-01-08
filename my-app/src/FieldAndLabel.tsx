interface IFieldAndLabelProps {
  label: string;
  field: string;
}

export default function FieldAndLabel({ label, field }: IFieldAndLabelProps) {
  return (
    <div className="_fieldAndLabel">
      <div className="_label">{label}</div>
      <div className="_field">{field}</div>
    </div>
  );
}
