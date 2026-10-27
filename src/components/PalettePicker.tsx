import type { CSSProperties, Dispatch } from "react";
import { Check } from "lucide-react";
import { palettes, type PaletteId } from "../data/palettes";

type Props = {
  palette: PaletteId;
  onChange: Dispatch<PaletteId>;
};

export function PalettePicker({ palette, onChange }: Props) {
  const selected = palettes.find((option) => option.id === palette)!;

  return (
    <div className="palette-picker">
      <div className="palette-caption">
        <span id="palette-label">Color palette</span>
        <span lang="zh-CN" aria-live="polite">
          {selected.name}
        </span>
      </div>
      <div
        className="palette-options"
        role="group"
        aria-labelledby="palette-label"
      >
        {palettes.map((option) => (
          <button
            key={option.id}
            type="button"
            className="palette-option"
            aria-label={`${option.name} / ${option.englishName}`}
            aria-pressed={palette === option.id}
            title={`${option.name} / ${option.englishName}`}
            onClick={() => onChange(option.id)}
            style={
              {
                "--swatch": option.color,
                "--swatch-dark": option.darkColor,
              } as CSSProperties
            }
          >
            <span className="palette-swatch" aria-hidden="true">
              {palette === option.id && <Check size={12} strokeWidth={2.5} />}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
