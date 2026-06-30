import { inputClass, labelClass } from "./authStyles";

interface AuthTextInputProps {
  id: string;
  label: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  value: string;
  onChange: (value: string) => void;
}

export function AuthTextInput({
  id,
  label,
  type = "text",
  placeholder,
  autoComplete,
  value,
  onChange,
}: AuthTextInputProps) {
  return (
    <div className="flex flex-col gap-[6px]">
      <label className={labelClass} htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
      />
    </div>
  );
}
