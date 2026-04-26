type CliPanelProps = {
  selectedCmd: string;
  input: string;
  lines: { type: string; text: string }[];
  commands: string[];
  onSelectCommand: (cmd: string) => void;
  onInput: (v: string) => void;
  onRun: () => void;
};

export function CliPanel({
  selectedCmd,
  input,
  lines,
  commands,
  onSelectCommand,
  onInput,
  onRun,
}: CliPanelProps) {
  return (
    <div className="sandbox-panel">
      <div className="cli-wrap">
        <div className="cli-sidebar">
          <div className="cli-sidebar-title">Command palette</div>
          {commands.map((cmd) => (
            <button
              className={`cli-cmd-btn ${selectedCmd === cmd ? "active" : ""}`}
              key={cmd}
              onClick={() => onSelectCommand(cmd)}
              type="button"
            >
              {cmd}
            </button>
          ))}
        </div>
        <div className="cli-terminal">
          <div className="cli-term-body">
            {lines.map((line, idx) => (
              <span className={`tl ${line.type ? `tl-${line.type}` : ""}`} key={`${line.text}-${idx}`}>
                {line.text || "\u00A0"}
              </span>
            ))}
          </div>
          <div className="cli-input-row">
            <span className="cli-prompt-sym">$</span>
            <input
              className="cli-input"
              onChange={(e) => onInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  onRun();
                }
              }}
              placeholder="Type a command..."
              value={input}
            />
            <button className="cli-run-btn" onClick={onRun} type="button">
              Run
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
