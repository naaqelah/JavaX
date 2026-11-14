import { useEffect, useState } from "react";
import { X, Save } from "lucide-react";

export default function EditFiguresModal({ isOpen, onClose, metric, onSave }) {
  const [actual, setActual] = useState("");
  const [target, setTarget] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && metric) {
      setActual(String(metric.actual ?? ""));
      setTarget(String(metric.target ?? ""));
      setError("");
    }
  }, [isOpen, metric]);

  if (!isOpen || !metric) return null;

  const handleSubmit = (event) => {
    event.preventDefault();
    const actualValue = Number(actual);
    const targetValue = Number(target);

    if (
      actual.trim() === "" ||
      target.trim() === "" ||
      !Number.isFinite(actualValue) ||
      !Number.isFinite(targetValue) ||
      actualValue < 0 ||
      targetValue < 0
    ) {
      setError("Enter a valid number that is not negative.");
      return;
    }

    onSave({ ...metric, actual: actualValue, target: targetValue });
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-2xl border border-neutral-700 bg-[#1c1c1f] p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Edit Figures</h2>
            <p className="mt-1 text-sm text-neutral-400">
              Update {metric.label} performance
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-lg p-2 text-neutral-400 transition hover:bg-white/10 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-300">Actual</label>
            <input
              type="number" min="0" step="any" required value={actual}
              onChange={(event) => setActual(event.target.value)}
              className="w-full rounded-lg border border-neutral-700 bg-[#252529] px-4 py-3 text-white outline-none focus:border-red-700"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-300">Target</label>
            <input
              type="number" min="0" step="any" required value={target}
              onChange={(event) => setTarget(event.target.value)}
              className="w-full rounded-lg border border-neutral-700 bg-[#252529] px-4 py-3 text-white outline-none focus:border-red-700"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button" onClick={onClose}
              className="rounded-lg border border-neutral-700 px-4 py-2.5 text-sm text-neutral-300 transition hover:bg-white/5"
            >Cancel</button>
            <button
              type="submit"
              className="flex items-center gap-2 rounded-lg bg-[#a51f23] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#8f1c20]"
            >
              <Save size={16} /> Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
